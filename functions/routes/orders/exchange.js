/* eslint-disable no-unused-vars */
/* eslint-disable new-cap */
/* eslint-disable camelcase */
/* eslint-disable max-len */
const express = require("express");
const axios = require("axios");
const router = express.Router();
const {getFirestore} = require("firebase-admin/firestore");
const db = getFirestore();

// URLs
const API_URL = process.env.REACT_APP_API_URL;

// Exchange Products
router.post("/", async (req, res) => {
  const {oid, uid, exchangeItems} = req.body;

  // Validate input
  if (!oid || !uid || !exchangeItems) {
    return res.status(400).json({error: "Invalid request"});
  }

  try {
    // 1. Verify order exists and user is authorized
    const orderRef = db.collection("orders").doc(oid);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({error: "Order not found"});
    }

    const order = orderDoc.data();

    // Check user authorization
    if (order.uid !== uid) {
      return res.status(403).json({error: "Unauthorized access"});
    }

    // 2. Check exchange/return period    ENABLE BEFORE DEPLOY
    // const currentTime = new Date().getTime();
    // const deliveredOn = order.deliveredOn?.toDate()?.getTime();
    // const returnExchangeExpiresOn = order.returnExchangeExpiresOn?.toDate()?.getTime();

    // if (!deliveredOn || !returnExchangeExpiresOn) {
    //   return res.status(400).json({error: "Invalid order delivery timestamps"});
    // }

    // if (currentTime > returnExchangeExpiresOn) {
    //   return res.status(400).json({
    //     error: "Exchange/return period has expired",
    //     deliveredOn: new Date(deliveredOn).toISOString(),
    //     returnExchangeExpiresOn: new Date(returnExchangeExpiresOn).toISOString(),
    //   });
    // }

    // 3. Prepare return request
    const returnRequestBody = {
      uid,
      oid,
      returnItems: exchangeItems,
    };

    // 4. Hit return API
    const returnResponse = await axios.post(`${API_URL}/returns/create`, returnRequestBody);

    if (returnResponse.status !== 200) {
      return res.status(500).json({error: "Return API failed"});
    }

    // 5. Fetch original order products for creating new order
    const orderProductsRef = orderRef.collection("orderedProducts");
    const orderProductsSnapshot = await orderProductsRef.get();
    let priceDiscount = 0;

    const orderedProducts = orderProductsSnapshot.docs.map((doc) => {
      const productData = doc.data();
      priceDiscount += ((productData.productDetails.price - productData.productDetails.discountedPrice) * productData.quantity);
      return {
        productId: productData.productId,
        productName: productData.productName,
        color: productData.color,
        colorCode: productData.colorCode,
        heightType: productData.heightType,
        size: productData.size,
        quantity: productData.quantity,
      };
    });

    // 6. Prepare create order request
    const createOrderBody = {
      uid,
      modeOfPayment: "cashOnDelievery",
      totalAmount: order.totalAmount,
      payableAmount: 0.001,
      discount: (order.totalAmount - priceDiscount),
      lushioCurrencyUsed: 0,
      couponCode: "",
      address: order.address,
      orderedProducts,
      isExchange: true,
      exchangeOrderId: oid,
    };

    // 7. Hit create order API
    const createOrderResponse = await axios.post(`${API_URL}/orders/createOrder`, createOrderBody);

    if (createOrderResponse.status !== 200) {
      return res.status(500).json({error: "Create Order API failed"});
    }

    // 8. Return success response
    return res.status(200).json({
      message: "Exchange processed successfully",
      returnResponse: returnResponse.data,
      newOrderResponse: createOrderResponse.data,
    });
  } catch (error) {
    console.error("Exchange API Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

module.exports = router;
