/* eslint-disable no-unused-vars */
/* eslint-disable new-cap */
/* eslint-disable camelcase */
/* eslint-disable max-len */
const express = require("express");
const admin = require("firebase-admin");
const axios = require("axios");
const router = express.Router();
const db = admin.firestore();

// Validation middleware
const validateOrderRequest = (req, res, next) => {
  const required = ["uid", "modeOfPayment", "orderedProducts", "address", "totalAmount", "payableAmount"];
  const missing = required.filter((field) => !req.body[field]);

  if (missing.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missing.join(", ")}`,
    });
  }

  if (!req.body.orderedProducts?.length) {
    return res.status(400).json({
      message: "Order must contain at least one product",
    });
  }

  next();
};

// Shiprocket creds
const SHIPROCKET_API_URL = process.env.SHIPROCKET_API_URL;
const SHIPROCKET_API_TOKEN = process.env.SHIPROCKET_API_TOKEN;

// Create a order
router.post("/createOrder", validateOrderRequest, async (req, res) => {
  const {
    uid, modeOfPayment, orderedProducts, address,
    totalAmount, payableAmount, discount, lushioCurrencyUsed, couponCode,
    ...paymentDetails
  } = req.body;

  // Start a Firestore batch
  const batch = db.batch();
  const orderRef = db.collection("orders").doc();
  const userOrderRef = db.collection("users").doc(uid).collection("orders").doc(orderRef.id);

  try {
    // Validate and sanitize the contact number
    const sanitizedContactNo = address.contactNo.replace(/\D/g, "").slice(-10); // Get the last 10 digits
    if (sanitizedContactNo.length !== 10) {
      throw new Error("Invalid contact number");
    }

    // Fetch and validate products
    const productPromises = orderedProducts.map(async (product) => {
      const productDoc = await db.collection("products").doc(product.productId).get();
      if (!productDoc.exists) {
        throw new Error(`Product ${product.productId} not found`);
      }
      return {
        ...product,
        productDetails: productDoc.data(),
      };
    });

    const validatedProducts = await Promise.all(productPromises);

    // Calculate the total amount and verify
    const calculatedTotal = validatedProducts.reduce((sum, product) =>
      sum + product.productDetails.price * product.quantity, 0);

    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      throw new Error("Total amount mismatch");
    }

    // Get user details
    const userDoc = await db.collection("users").doc(uid).get();
    const email = userDoc.exists ? userDoc.data().email : null;

    const dateOfOrder = new Date();

    // Prepare order data
    const orderData = {
      uid,
      dateOfOrder,
      email,
      couponCode,
      address,
      totalAmount,
      payableAmount,
      discount,
      lushioCurrencyUsed,
      modeOfPayment,
      status: "pending",
      ...(paymentDetails && {
        [`${modeOfPayment}_details`]: paymentDetails,
      }),
    };

    // Prepare Shiprocket order data
    const shiprocketOrderData = {
      order_id: orderRef.id,
      order_date: dateOfOrder.toISOString(),
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION,

      shipping_is_billing: true,
      company_name: process.env.COMPANY_NAME,
      reseller_name: process.env.RESELLER_NAME,

      billing_customer_name: address.name,
      billing_address: `${address.flatDetails}, ${address.areaDetails}`, // Concatenated flatDetails and areaDetails
      billing_address_2: address.landmark || "",
      billing_city: address.townCity,
      billing_pincode: address.pinCode,
      billing_state: address.state,
      billing_country: address.country,
      billing_phone: sanitizedContactNo,
      billing_email: email,
      order_items: validatedProducts.map((product) => ({
        name: product.productDetails.displayName,
        sku: product.productId,
        units: product.quantity,
        selling_price: product.productDetails.price,

        // DOUBTFUL FIELDS
        // weight: product.productDetails.weight || 0.5, // Default weight if not specified
        // dimensions: product.productDetails.dimensions || {length: 10, width: 10, height: 10},

      })),
      payment_method: modeOfPayment === "cashOnDelivery" ? "COD" : "Prepaid",
      sub_total: payableAmount,

      // DOUBTFUL FIELDS
      // length: 10, // Default package dimensions
      // breadth: 10,
      // height: 10,
      // weight: 0.5,
    };

    // Create Shiprocket order
    // const shiprocketResponse = await axios.post(
    //     SHIPROCKET_API_URL,
    //     shiprocketOrderData,
    //     {
    //       headers: {
    //         "Authorization": `Bearer ${SHIPROCKET_API_TOKEN}`,
    //         "Content-Type": "application/json",
    //       },
    //     },
    // );

    // const {shipment_id, tracking_id} = shiprocketResponse.data;

    // Add Shiprocket details to the order
    orderData.shiprocket = {
      // shipment_id,
      // tracking_id,
    };
    orderData.status = "created";

    // Add order data to batch
    batch.set(orderRef, orderData);
    batch.set(userOrderRef, {orderId: orderRef.id, dateOfOrder});

    // Add ordered products as subcollection
    validatedProducts.forEach((product) => {
      const productRef = orderRef.collection("orderedProducts").doc();
      batch.set(productRef, product);
    });

    // Commit batch
    await batch.commit();

    res.status(200).json({
      message: "Order created successfully",
      orderId: orderRef.id,
      // shiprocket: {shipment_id, tracking_id},
    });
  } catch (error) {
    console.error("Error creating order:", error);

    res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
});

// Get order details by orderId
router.get("/:orderId", async (req, res) => {
  try {
    const {orderId} = req.params;
    const {uid} = req.body; // For validation that this user owns the order

    // Check required fields
    if (!uid || !orderId) {
      return res.status(400).json({message: "Required fields missing."});
    }

    // Check if the `uid` exists in the `users` collection
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({message: "Invalid User ID"});
    }

    // Get the order document
    const orderDoc = await db.collection("orders").doc(orderId).get();

    if (!orderDoc.exists) {
      return res.status(404).json({message: "Order not found"});
    }

    const orderData = orderDoc.data();

    // Validate user owns this order
    if (orderData.uid !== uid) {
      return res.status(403).json({message: "Unauthorized access to order"});
    }

    // Get ordered products subcollection
    const productsSnapshot = await orderDoc.ref.collection("orderedProducts").get();
    const orderedProducts = productsSnapshot.docs.map((doc) => doc.data());

    res.status(200).json({
      ...orderData,
      orderedProducts,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      message: "Failed to fetch order details",
      error: error.message,
    });
  }
});

// Get all orders for a user
router.get("/", async (req, res) => {
  try {
    const {uid, limit = 5, lastOrderId} = req.body;

    // Validate if `uid` is provided
    if (!uid) {
      return res.status(400).json({message: "User ID is required"});
    }

    // Check if the `uid` exists in the `users` collection
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({message: "Invalid User ID"});
    }

    // Build the base query for fetching orders
    let query = db.collection("orders").where("uid", "==", uid).orderBy("dateOfOrder", "desc").limit(parseInt(limit));

    // Add pagination if `lastOrderId` is provided
    if (lastOrderId) {
      const lastOrderDoc = await db.collection("orders").doc(lastOrderId).get();
      if (lastOrderDoc.exists) {
        query = query.startAfter(lastOrderDoc);
      }
    }

    // Execute the query to get orders
    const ordersSnapshot = await query.get();

    // Process orders
    const orders = ordersSnapshot.docs.map((doc) => ({
      orderId: doc.id,
      ...doc.data(),
    }));

    // Pagination metadata
    const lastVisible = ordersSnapshot.docs[ordersSnapshot.docs.length - 1];

    res.status(200).json({
      orders,
      pagination: {
        hasMore: orders.length === parseInt(limit),
        lastOrderId: lastVisible?.id,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});

module.exports = router;
