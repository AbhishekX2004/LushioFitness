/* eslint-disable require-jsdoc */
/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
/* eslint-disable new-cap */
/* eslint-disable max-len */
const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");
const logger = require("firebase-functions/logger");
const {getFirestore} = require("firebase-admin/firestore");
const db = getFirestore();

// ENVs
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY;
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const PHONEPE_URL = process.env.PHONEPE_API_URL;
const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL;
const API_URL = process.env.REACT_APP_API_URL;

// Global variable to store order details
let globalOrderDetails = null;

function generateXVerifyHeader(payload, endpoint) {
  const string = payload + endpoint + PHONEPE_SALT_KEY;
  const sha256 = crypto.createHash("sha256").update(string).digest("hex");
  return sha256 + "###" + 1;
}

router.post("/", async (req, res) => {
  try {
    const {
      name,
      transactionId,
      MUID,
      uid,
      modeOfPayment,
      totalAmount,
      payableAmount,
      discount,
      lushioCurrencyUsed,
      couponCode,
      address,
      orderedProducts,
      onlinePaymentDiscount,
      couponDiscount,
      lushioCashBack,
    } = req.body;

    // Separate global order details
    globalOrderDetails = {
      uid,
      modeOfPayment,
      totalAmount,
      payableAmount,
      discount,
      lushioCurrencyUsed,
      couponCode,
      address,
      orderedProducts,
      onlinePaymentDiscount,
      couponDiscount,
      lushioCashBack,
    };
    const data = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: uid,
      name: name,
      amount: payableAmount * 100,
      redirectUrl: `${API_URL}/payment/status?id=${transactionId}`,
      redirectMode: "POST",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };
    logger.log("backend order", globalOrderDetails);
    logger.log("data", data);
    const KeyIndex = 1;

    // Base64 encode the payload
    const payload = JSON.stringify(data);
    const payloadMain = Buffer.from(payload).toString("base64");

    // Generate X-VERIFY checksum
    // const string = payloadMain + "/pg/v1/pay" + PHONEPE_SALT_KEY;
    // const sha256 = crypto.createHash("sha256").update(string).digest("hex");

    // const checksum = sha256 + "###" + KeyIndex;
    const checksum = generateXVerifyHeader(payloadMain, "/pg/v1/pay");
    const prod_URL = `${PHONEPE_URL}/pay`;

    const option = {
      method: "POST",
      url: prod_URL,
      headers: {
        "accept": "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      data: {
        request: payloadMain,
      },
    };

    axios
        .request(option)
        .then((response) => {
          res.json(response.data);
        })
        .catch((error) => {
          logger.log("Error in / route inner catch", error);
          res.status(500).json({error: error.message});
        });
  } catch (error) {
    logger.log("Error in / route outer catch", error);
  }
});

router.post("/status", async (req, res) => {
  try {
    const merchantTransactionId = req.query.id;
    const merchantId = PHONEPE_MERCHANT_ID;

    const keyIndex = 1;

    const string =
      `/pg/v1/status/${merchantId}/${merchantTransactionId}` + PHONEPE_SALT_KEY;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + keyIndex;

    const options = {
      method: "get",
      url: `${PHONEPE_URL}/status/${merchantId}/${merchantTransactionId}`,
      headers: {
        "accept": "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": merchantId,
      },
    };

    // Await the API response
    const response = await axios(options);

    if (response.data.success === true) {
      // const paymentDetails = {
      //   message: "Payment successful!",
      //   data: response.data,
      // };
      const paymentDetails = response.data;

      logger.log("Payment Details:", paymentDetails);

      try {
        // Combine orderDetails with paymentDetails under the key 'paymentData'
        const combinedDetails = {
          ...globalOrderDetails,
          paymentData: paymentDetails, // Nest paymentDetails under the key 'paymentData'
        };

        logger.log(
            "Combined Order and Payment Details:",
            JSON.stringify(combinedDetails, null, 2),
        );
        // Await order creation API call
        const orderResponse = await axios.post(
            `${API_URL}/orders/createOrder`,
            combinedDetails,
        );
        logger.log("Order Creation Response:", orderResponse.data);
        // Extracting productIds
        const selectedProductIds = globalOrderDetails.orderedProducts.map(
            (product) => product.productId,
        );
        console.log(selectedProductIds);
        try {
          const response = await axios.post(`${API_URL}/cart/batch-delete`, {
            uid: globalOrderDetails.uid,
            itemIds: selectedProductIds,
          });
        } catch (error) {
          logger.log(error);
        }
        const url = `${FRONTEND_URL}/paymentStatus`;
        return res.redirect(url);
      } catch (error) {
        logger.error("Error while creating order:", error);
        const url = `${FRONTEND_URL}/cart`;
        return res.redirect(url);
      }
    } else {
      const url = `${FRONTEND_URL}/cart`;
      return res.redirect(url);
    }
  } catch (error) {
    logger.error("Error in /status route:", error);
    res.status(500).json({error: "Internal Server Error"});
  }
});

// Route: Refund Transaction
router.post("/refund", async (req, res) => {
  try {
    const {
      uid,
      oid,
      merchantTransactionId,
      amount,
    } = req.body;
    // merchantTransactionId is R+Date.now()
    // Validate required fields
    if (!oid || !uid || !merchantTransactionId || !amount) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: uid, oid, merchantTransactionId, amount",
      });
    }
    const orderRef = db.collection("orders").doc(oid);
    const orderDoc = await orderRef.get();
    // const userRef = db.collection("users").doc(uid);

    if (!orderDoc.exists) {
      return res
          .status(404)
          .json({success: false, message: "Order not found."});
    }

    const orderData = orderDoc.data();
    if (orderData.uid !== uid) {
      return res
          .status(403)
          .json({success: false, message: "Unauthorized access."});
    }
    // Prepare payload
    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantUserId: uid,
      originalTransactionId: "T7850590068188104",
      merchantTransactionId,
      amount: parseInt(amount),
      callbackUrl: `${FRONTEND_URL}/cart`,
    };

    console.log("Refund Payload:", payload);

    // Encode payload
    const encode = Buffer.from(JSON.stringify(payload)).toString("base64");

    // Generate X-VERIFY header
    const xVerifyHeader = generateXVerifyHeader(encode, "/pg/v1/refund");

    // Make refund API call
    const refundResponse = await axios.post(
        `${PHONEPE_URL}/refund`,
        {
          request: encode,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "accept": "application/json",
            "X-VERIFY": xVerifyHeader,
          },
        },
    );

    console.log("Refund API Response:", refundResponse.data);

    res.json({
      //  success: true,
      // message: 'Refund request processed',
      data: refundResponse.data,
      // status: refundResponse.status,
      // headers: refundResponse.headers,
      payload: payload,
    });
  } catch (error) {
    console.error("Refund Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Refund request failed",
      error: error.response?.data || error.message,
    });
  }
});
module.exports = router;
