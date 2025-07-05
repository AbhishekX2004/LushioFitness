/* eslint-disable require-jsdoc */
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


router.post("/process-return-exchange", async (req, res) => {
  try {
    const {uid, oid, items} = req.body;

    if (!uid || !oid || !items || typeof items !== "object") {
      return res.status(400).json({success: false, message: "Invalid request payload."});
    }

    const orderRef = db.collection("orders").doc(oid);
    const orderDoc = await orderRef.get();
    const userRef = db.collection("users").doc(uid);

    if (!orderDoc.exists) {
      return res.status(404).json({success: false, message: "Order not found."});
    }

    const orderData = orderDoc.data();
    if (orderData.uid !== uid) {
      return res.status(403).json({success: false, message: "Unauthorized access."});
    }

    if (orderData.returnDate) {
      return res.status(403).json({success: false, message: "Return already initiated."});
    }

    // Validate return/exchange period    ENABLE BEFORE DEPLOY
    // const normalizeToDate = (date) => {
    //   const normalized = new Date(date);
    //   normalized.setHours(0, 0, 0, 0);
    //   return normalized.getTime();
    // };

    // const currentDate = normalizeToDate(new Date());
    // const returnExchangeExpiresOn = orderData.returnExchangeExpiresOn?.toDate();

    // if (!returnExchangeExpiresOn || currentDate > normalizeToDate(returnExchangeExpiresOn)) {
    //   return res.status(400).json({success: false, message: "Exchange/return period has expired."});
    // }

    const orderedProductsRef = orderRef.collection("orderedProducts");
    const itemIds = Object.keys(items);
    const productDocs = await Promise.all(itemIds.map((id) => orderedProductsRef.doc(id).get()));

    const missingProducts = productDocs.filter((doc) => !doc.exists);
    if (missingProducts.length > 0) {
      return res.status(400).json({success: false, message: "Some products not found in the order."});
    }

    let sub_total = 0;
    let sub_discount = 0;
    const returnItems = {};
    const exchangeItems = [];
    const returnExchangedItems = items;

    let returnAmount = 0;

    const order_items = productDocs.map((doc) => {
      const productData = doc.data();
      const itemData = items[doc.id];

      returnItems[doc.id] = {
        units: itemData.units,
        return_reason: itemData.reason,
      };

      const price = Number(productData.productDetails.price);
      const perUnitDiscount = Number(productData.perUnitDiscount || 0);
      const units = itemData.units;

      if (itemData.exchange) {
        sub_total += price * units;
        sub_discount += (perUnitDiscount - (price - productData.productDetails.discountedPrice)) * units;
        exchangeItems.push({
          productId: productData.productId,
          productName: productData.productName,
          quantity: itemData.units,
          // return_reason: itemData.reason,
          // price: productData.productDetails.price,
          size: productData.size,
          color: productData.color,
          colorCode: productData.colorCode,
          heightType: productData.heightType,
        });
      } else {
        returnAmount += (price - perUnitDiscount) * units;
      }

      return {
        name: productData.productName,
        sku: `${productData.productId}-${productData.color}-${productData.heightType}-${productData.size}`,
        units: itemData.units,
        selling_price: Number(productData.productDetails.price),
        return_reason: itemData.reason,
        discount: productData.perUnitDiscount,
      };
    });
 

    // console.log(sub_total);
    if (Object.keys(returnItems).length > 0) {
      await axios.post(`${API_URL}/returns/create`, {uid, oid, returnItems, returnAmount});
    }
    // console.log("RETURN INITIATED SUCCESS \n\n");
    if (exchangeItems.length > 0) {
      const newOrderBody = {
        uid,
        modeOfPayment: "cashOnDelivery",
        totalAmount: sub_total, // orderData.totalAmount,
        payableAmount: 0.001,
        discount: sub_discount, // orderData.totalAmount - sub_total,
        lushioCurrencyUsed: 0,
        couponCode: "",
        address: orderData.address,
        orderedProducts: exchangeItems,
        isExchange: true,
        exchangeOrderId: oid,
        onlinePaymentDiscount: 0,
        couponDiscount: 0,
        lushioCashBack: 0,
      };
      // console.log( "CREATE ORDER INPUT - ", newOrderBody);

      // console.log("\n\n");
      await axios.post(`${API_URL}/orders/createOrder`, newOrderBody);
    }

    const updatePromises = productDocs.map((doc) => {
      const itemData = items[doc.id];
      const productData = doc.data();
      const originalQuantity = productData.quantity;
      const processedQuantity = itemData.units;

      // Determine the appropriate status based on quantity comparison
      let newStatus;
      if (processedQuantity >= originalQuantity) {
      // Full return/exchange
        newStatus = itemData.exchange ? "exchanged" : "returned";
      } else {
      // Partial return/exchange
        newStatus = itemData.exchange ? "partially_exchanged" : "partially_returned";
      }

      // Prepare update object
      const updateData = {
        status: newStatus,
        updatedAt: new Date(),
        [itemData.exchange ? "exchange_reason" : "return_reason"]: itemData.reason,
        [itemData.exchange ? "exchangedOn" : "returnedOn"]: new Date(),
        [itemData.exchange ? "exchanged_qty" : "returned_qty"]: processedQuantity,
      };

      return orderedProductsRef.doc(doc.id).update(updateData);
    });

    // update user timestamp
    await userRef.update({
      updatedAt: new Date(),
    });

    await Promise.all(updatePromises);
    await orderRef.update({
      status: "return_exchange_initiated",
      updatedAt: new Date(),
      returnExchangedItems: returnExchangedItems,
    });


    return res.status(200).json({success: true, message: "Return/Exchange processed successfully."});
  } catch (error) {
    console.error("Error processing return/exchange:", error.data);
    return res.status(500).json({success: false, message: "Internal server error.", error: error.message});
  }
});

module.exports = router;
