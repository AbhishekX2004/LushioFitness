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

    // Validate return/exchange period
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

    const order_items = productDocs.map((doc) => {
      const productData = doc.data();
      const itemData = items[doc.id];

      returnItems[doc.id] = {
        units: itemData.units,
        return_reason: itemData.reason,
      };
      if (itemData.exchange) {
        sub_total += (Number(productData.productDetails.price)) * itemData.units;
        sub_discount += Number((productData.perUnitDiscount) - (productData.productDetails.price-productData.productDetails.discountedPrice)) * itemData.units;
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
    // console.log({uid, oid, returnItems});

    // console.log(sub_total);
    if (Object.keys(returnItems).length > 0) {
      await axios.post(`${API_URL}/returns/create`, {uid, oid, returnItems});
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
      };
      // console.log( "CREATE ORDER INPUT - ", newOrderBody);

      // console.log("\n\n");
      await axios.post(`${API_URL}/orders/createOrder`, newOrderBody);
    }

    const updatePromises = productDocs.map((doc) => {
      const itemData = items[doc.id];
      return orderedProductsRef.doc(doc.id).update({
        status: itemData.exchange ? "exchanged" : "returned",
        updatedAt: new Date(),
        [itemData.exchange ? "exchange_reason" : "return_reason"]: itemData.reason,
        [itemData.exchange ? "exchangedOn" : "returnedOn"]: new Date(),
      });
    });

    // update user timestamp
    await userRef.update({
      updatedAt: new Date(),
    });

    await Promise.all(updatePromises);
    await orderRef.update({status: "return_exchange_initiated", updatedAt: new Date()});

    return res.status(200).json({success: true, message: "Return/Exchange processed successfully."});
  } catch (error) {
    console.error("Error processing return/exchange:", error.data);
    return res.status(500).json({success: false, message: "Internal server error."});
  }
});

module.exports = router;
