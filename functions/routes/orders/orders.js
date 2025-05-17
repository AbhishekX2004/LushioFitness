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
const {generateToken, destroyToken} = require("./shiprocketAuth");
const logger = require("firebase-functions/logger");
const getStatusDescription = require("./statusDescription");

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

// URLs
const SHIPROCKET_API_URL = process.env.SHIPROCKET_API_URL;
const API_URL = process.env.REACT_APP_API_URL;

// Create a order
router.post("/createOrder", validateOrderRequest, async (req, res) => {
  const {
    uid, modeOfPayment, orderedProducts, address,
    totalAmount, payableAmount, discount, lushioCurrencyUsed, couponCode,
    paymentData, isExchange, exchangeOrderId,
  } = req.body;

  // Start a Firestore batch
  const batch = db.batch();
  const orderRef = db.collection("orders").doc();
  const userOrderRef = db.collection("users").doc(uid).collection("orders").doc(orderRef.id);
  const userRef = db.collection("users").doc(uid);

  try {
    // Validate and sanitize the contact number
    const sanitizedContactNo = address.contactNo.replace(/\D/g, "").slice(-10); // Get the last 10 digits
    if (sanitizedContactNo.length !== 10) {
      throw new Error("Invalid contact number");
    }

    // Fetch and validate products with inventory reduction
    const productPromises = orderedProducts.map(async (product) => {
      // Directly return the transaction result
      return await db.runTransaction(async (transaction) => {
        // Fetch product document
        const productRef = db.collection("products").doc(product.productId);
        const productDoc = await transaction.get(productRef);

        // Validate product exists
        if (!productDoc.exists) {
          throw new Error(`Product ${product.productId} not found`);
        }

        const productData = productDoc.data();

        // Determine inventory path
        let inventoryMap;
        if (product.heightType === "normal") {
          inventoryMap = {...productData.quantities}; // Directly access quantities
        } else {
          const heightKey = product.heightType === "above" ? "aboveHeight" : "belowHeight";

          if (!productData[heightKey] || !productData[heightKey].quantities) {
            throw new Error(`Invalid height-based inventory for product ${product.productId}`);
          }

          inventoryMap = {...productData[heightKey].quantities}; // Access nested quantities
        }

        // Validate color exists
        if (!inventoryMap[product.color]) {
          throw new Error(`Color ${product.color} not found for product ${product.productId}`);
        }

        // Validate size exists and has sufficient quantity
        const currentQuantity = inventoryMap[product.color][product.size] || 0;
        if (currentQuantity < product.quantity) {
          throw new Error(`Insufficient inventory for product ${product.productId}, color ${product.color}, size ${product.size}. Available: ${currentQuantity}, Requested: ${product.quantity}`);
        }

        // Reduce inventory
        inventoryMap[product.color][product.size] -= product.quantity;

        // Prepare update data
        let updateData;
        if (product.heightType === "normal") {
          updateData = {quantities: inventoryMap};
        } else {
          const heightKey = product.heightType === "above" ? "aboveHeight" : "belowHeight";
          updateData = {[`${heightKey}.quantities`]: inventoryMap};
        }

        // Update product document within transaction
        transaction.update(productRef, updateData);

        // Return enriched product data for further processing
        return {
          ...product,
          productDetails: productData,
        };
      });
    });

    const validatedProducts = await Promise.all(productPromises);

    // console.log(validatedProducts);

    // Calculate the total amount and verify
    const calculatedTotal = validatedProducts.reduce((sum, product) => sum + product.productDetails.price * product.quantity, 0);
    // console.log(calculatedTotal);
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      throw new Error(`Total amount mismatch ${calculatedTotal - totalAmount}`);
    }

    // Calculate and distribute discount proportionally
    const distributedProducts = validatedProducts.map((product) => {
      const productTotalPrice = product.productDetails.price * product.quantity;
      const productDiscountPercentage = productTotalPrice / calculatedTotal;
      let productDiscount = (discount || 0) * productDiscountPercentage;
      const perUnitDiscount = (productDiscount / product.quantity) + (product.productDetails.price - product.productDetails.discountedPrice);
      productDiscount = perUnitDiscount * product.quantity;
      // console.log("perUnitDiscount: ", perUnitDiscount);
      return {
        ...product,
        productDiscount,
        perUnitDiscount,
      };
    });

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
      status: "Pending",
      paymentData: paymentData?.data || null,
    };

    // Fetch dimensions from the admin document
    const adminDoc = await db.collection("controls").doc("admin").get();
    if (!adminDoc.exists) {
      throw new Error("Admin document not found");
    }

    const {length, breadth, height, weight, companyName, resellerName, pickupLocation} = adminDoc.data();
    if (!length || !breadth || !height || !weight) {
      throw new Error("Incomplete dimension or weight data in admin document.");
    }
    if (!companyName || ! resellerName || !pickupLocation) {
      throw new Error("Missing company or pickup information.");
    }

    // Prepare Shiprocket order data
    const shiprocketOrderData = {
      order_id: orderRef.id,
      order_date: dateOfOrder.toISOString().split("T")[0], // Format: YYYY-MM-DD
      pickup_location: pickupLocation,
      shipping_is_billing: true,
      company_name: companyName,
      reseller_name: resellerName,
      billing_customer_name: address.name?.split(" ")[0],
      billing_last_name: address.name?.split(" ").pop() || "",
      billing_address: `${address.flatDetails}, ${address.areaDetails}`, // Concatenated flatDetails and areaDetails
      billing_address_2: address.landmark || "",
      billing_city: address.townCity,
      billing_pincode: address.pinCode,
      billing_state: address.state,
      billing_country: address.country,
      billing_phone: sanitizedContactNo,
      billing_email: email,
      order_items: distributedProducts.map((product) => ({
        name: product.productDetails.displayName,
        sku: `${product.productId}-${product.color}-${product.heightType}-${product.size}`,
        units: product.quantity,
        selling_price: product.productDetails.price,
        tax: product.productDetails.gst || 5,
        hsn: product.productDetails.hsn || "",
        discount: product.perUnitDiscount,
      })),
      payment_method: modeOfPayment === "cashOnDelivery" ? "COD" : "Prepaid",
      sub_total: payableAmount,
      shipping_charges: 0,
      length,
      breadth,
      height,
      weight,
      discount,
    };

    // console.log(shiprocketOrderData);

    // Create order on Shiprocket
    let token;
    try {
      token = await generateToken();
      const shiprocketResponse = await axios.post(
          `${SHIPROCKET_API_URL}/orders/create/adhoc`,
          shiprocketOrderData,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
      );
      // logger.log(shiprocketResponse.data);
      if (!shiprocketResponse.data.shipment_id || !shiprocketResponse.data.order_id) {
        throw new Error("Invalid response from Shiprocket API");
      }

      // const awbResponse = await axios.post(
      //     `${SHIPROCKET_API_URL}/courier/assign/awb`,
      //     {
      //       shipment_id: shiprocketResponse.data.shipment_id,
      //     },
      //     {
      //       headers: {
      //         "Authorization": `Bearer ${token}`,
      //         "Content-Type": "application/json",
      //       },
      //     },
      // );

      // Add Shiprocket details to the order
      orderData.shiprocket = {
        ...shiprocketResponse.data,
        // awb_code: awbResponse.data.awb_code,
        // awb_details: awbResponse.data,
      };
      orderData.status = "created";
      if (isExchange) {
        orderData.isExchange = isExchange;
        orderData.exchangeOrderId = exchangeOrderId;
      }

      // Add order data to batch
      batch.set(orderRef, orderData);
      batch.set(userOrderRef, {orderId: orderRef.id, dateOfOrder});
      batch.update(userRef, {
        updatedAt: dateOfOrder,
      });

      // Add ordered products as subcollection
      distributedProducts.forEach((product) => {
        const productRef = orderRef.collection("orderedProducts").doc();
        batch.set(productRef, product);
      });

      // update user timestamp
      batch.update(userRef, {
        updatedAt: new Date(),
      });

      // Commit batch
      await batch.commit();
      if (couponCode) {
        try {
          await axios.post(`${API_URL}/coupon/markUsed`, {
            uid,
            code: couponCode,
          });
        } catch (couponError) {
          console.error("Error marking coupon as used: ", couponError);
        }
      }
      if (lushioCurrencyUsed) {
        try {
          await axios.post(`${API_URL}/wallet/consume`, {
            uid,
            coinsToConsume: lushioCurrencyUsed,
            oid: orderRef.id,
            orderAmount: payableAmount,
          });
        } catch (currencyError) {
          console.error("Error Updating Lushio Currencies: ", currencyError);
        }
      }
    } catch (shiprocketError) {
      console.error("Shiprocket API Error:", shiprocketError.response?.data || shiprocketError);

      // Log detailed error information
      if (shiprocketError.response?.data?.errors) {
        console.error("Validation errors:", JSON.stringify(shiprocketError.response.data.errors, null, 2));
      }

      throw new Error(`Shiprocket API Error: ${shiprocketError.response?.data?.message || shiprocketError.message}`);
    } finally {
      if (token) {
        await destroyToken(token);
      }
    }

    res.status(200).json({
      message: "Order created successfully",
      orderId: orderRef.id,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    if (error.response?.data) {
      console.error("API Error Details:", {
        status: error.response.status,
        data: error.response.data,
        endpoint: error.config?.url,
      });
    }
    res.status(500).json({
      message: "Failed to create order",
      error: error.message,
      details: error.response?.data?.errors || null,
    });
  }
});

// Get order details by orderId
router.get("/:orderId", async (req, res) => {
  try {
    const {orderId} = req.params;
    const {uid} = req.query; // For validation that this user owns the order

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
    const orderedProducts = productsSnapshot.docs.map((doc) => ({
      opid: doc.id,
      ...doc.data(),
    }));

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
    const {uid, limit = 5, lastOrderId} = req.query;

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

    // Process orders and fetch their orderedProducts
    const orders = await Promise.all(
        ordersSnapshot.docs.map(async (doc) => {
        // Get the orderedProducts subcollection for this order
          const orderedProductsSnapshot = await doc.ref.collection("orderedProducts").get();

          const orderedProducts = orderedProductsSnapshot.docs.map((productDoc) => ({
            opid: productDoc.id,
            ...productDoc.data(),
          }));

          return {
            orderId: doc.id,
            ...doc.data(),
            orderedProducts,
          };
        }),
    );

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

// Cancel an order
router.post("/cancel", async (req, res) => {
  const {oid, uid} = req.body;

  if (!oid || !uid) {
    return res.status(400).json({message: "Order ID and User ID are required"});
  }

  try {
    // Get the order document
    const orderDoc = await db.collection("orders").doc(oid).get();
    const userRef = db.collection("users").doc(uid);

    if (!orderDoc.exists) {
      return res.status(404).json({message: "Order not found"});
    }

    const orderData = orderDoc.data();

    // Validate user owns this order
    if (orderData.uid !== uid) {
      return res.status(403).json({message: "Unauthorized access to order"});
    }

    // Check if order is already cancelled
    if (orderData.status === "cancelled") {
      return res.status(400).json({message: "Order is already cancelled"});
    }

    // Get Shiprocket order details
    const shiprocketOrderId = orderData.shiprocket?.order_id;
    if (!shiprocketOrderId) {
      return res.status(400).json({message: "Shiprocket order ID not found"});
    }

    // Fetch real-time status from Shiprocket Tracking API
    let token;
    try {
      token = await generateToken();
      const trackingResponse = await axios.get(
          `${SHIPROCKET_API_URL}/shipments/${orderData.shiprocket.shipment_id}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
      );

      // const trackingDataKey = Object.keys(trackingResponse.data[0])[0]; // Get the dynamic key
      // const realTimeStatus = trackingResponse.data[0][trackingDataKey]?.tracking_data?.shipment_status;
      const realTimeStatus = trackingResponse.data?.data?.status;
      console.log("Real-time Status:", realTimeStatus);

      // Define cancelable statuses
      const cancelableStatuses = [
        0, // New
        1, // AWB Assigned
        2, // Label Generated
        3, // Pickup Scheduled/Generated
        4, // Pickup Queued
        5, // Manifest Generated
        11, // Pending
      ];

      // Check if the real-time status allows cancellation
      if (!cancelableStatuses.includes(realTimeStatus)) {
        const statusDescription = getStatusDescription(realTimeStatus);
        return res.status(400).json({
          message: `Order cannot be canceled. Current status: ${statusDescription}`,
        });
      }

      // Cancel order on Shiprocket
      await axios.post(
          `${SHIPROCKET_API_URL}/orders/cancel`,
          {ids: [shiprocketOrderId]},
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
      );

      // Update order status in Firestore
      await db.collection("orders").doc(oid).update({
        status: "cancelled",
        cancellationDate: new Date(),
      });

      // update user timestamp
      await userRef.update({
        updatedAt: new Date(),
      });

      res.status(200).json({
        message: "Order cancelled successfully",
      });
    } catch (shiprocketError) {
      console.error("Shiprocket API Error:", shiprocketError.response?.data || shiprocketError);
      throw new Error(`Shiprocket API Error: ${shiprocketError.response?.data?.message || shiprocketError.message}`);
    } finally {
      if (token) {
        await destroyToken(token);
      }
    }
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      message: "Failed to cancel order",
      error: error.message,
    });
  }
});

// Update delivery address
router.put("/address/update", async (req, res) => {
  const {oid, address, uid} = req.body;

  if (!oid || !address || !uid) {
    return res.status(400).json({message: "Order ID, address details, and user ID are required"});
  }

  try {
    const orderDoc = await db.collection("orders").doc(oid).get();
    if (!orderDoc.exists) {
      return res.status(404).json({message: "Order not found"});
    }

    const orderData = orderDoc.data();
    if (orderData.uid !== uid) {
      return res.status(403).json({message: "Unauthorized access to order"});
    }

    const shiprocketOrderId = orderData.shiprocket?.order_id;
    if (!shiprocketOrderId) {
      return res.status(400).json({message: "Shiprocket order ID not found"});
    }

    // Validate and sanitize contact number
    const sanitizedContactNo = address.contactNo.replace(/\D/g, "").slice(-10);
    if (sanitizedContactNo.length !== 10) {
      return res.status(400).json({message: "Invalid contact number"});
    }

    // Get user details
    const userDoc = await db.collection("users").doc(uid).get();
    const email = userDoc.exists ? userDoc.data().email : null;

    let token;
    try {
      token = await generateToken();
      const trackingResponse = await axios.get(
          `${SHIPROCKET_API_URL}/shipments/${orderData.shiprocket.shipment_id}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
      );

      // const trackingDataKey = Object.keys(trackingResponse.data[0])[0]; // Get the dynamic key
      // const realTimeStatus = trackingResponse.data[0][trackingDataKey]?.tracking_data?.shipment_status;
      const realTimeStatus = trackingResponse.data?.data?.status;
      console.log("Real-time Status:", realTimeStatus);

      // Define cancelable statuses
      const updateableStatuses = [
        0, // New
        1, // AWB Assigned
        2, // Label Generated
        3, // Pickup Scheduled/Generated
        4, // Pickup Queued
        5, // Manifest Generated
        11, // Pending
      ];

      // Check if the real-time status allows cancellation
      if (!updateableStatuses.includes(realTimeStatus)) {
        const statusDescription = getStatusDescription(realTimeStatus);
        return res.status(400).json({
          message: `Address cant be changed. Current status: ${statusDescription}`,
        });
      }

      const shiprocketAddressData = {
        order_id: shiprocketOrderId,
        shipping_customer_name: address.name,
        shipping_phone: sanitizedContactNo,
        shipping_address: `${address.flatDetails}, ${address.areaDetails}`,
        shipping_address_2: address.landmark || "",
        shipping_city: address.townCity,
        shipping_state: address.state,
        shipping_country: address.country,
        shipping_pincode: address.pinCode,
        shipping_email: email,
      };

      await axios.post(
          `${SHIPROCKET_API_URL}/orders/address/update`,
          shiprocketAddressData,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
      );

      // Update address in Firestore
      await orderDoc.ref.update({
        address: {
          ...address,
          contactNo: address.contactNo,
        },
        updatedAt: new Date(),
      });

      res.status(200).json({
        message: "Address updated successfully",
      });
    } catch (shiprocketError) {
      console.error("Shiprocket API Error:", shiprocketError.response?.data || shiprocketError);
      throw new Error(`Shiprocket API Error: ${shiprocketError.response?.data?.message || shiprocketError.message}`);
    } finally {
      if (token) {
        await destroyToken(token);
      }
    }
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({
      message: "Failed to update address",
      error: error.message,
    });
  }
});

// update order
router.post("/updateOrder", async (req, res) => {
  const {oid, uid, removedProducts} = req.body;

  if (!oid || !uid) {
    return res.status(400).json({message: "Order ID and User ID are required"});
  }

  const batch = db.batch();

  try {
    // Validate user's access to order
    const orderRef = db.collection("orders").doc(oid);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      throw new Error("Order not found");
    }

    if (orderDoc.data().uid !== uid) {
      throw new Error("Unauthorized access to order");
    }

    // Get current order data
    const orderData = orderDoc.data();

    // Get Shiprocket order details
    const shipment_id = orderData.shiprocket?.shipment_id;
    // console.log("Shiprocket shipment ID:", shipment_id);
    if (!shipment_id) {
      throw new Error("Shiprocket Shipment ID not found");
    }

    if (orderData.shiprocket?.invoice?.invoice_url) {
      throw new Error("Invoice already generated for this order. Please contact support for any changes.");
    }

    // Check real-time status from Shiprocket
    let token;
    try {
      token = await generateToken();
      const trackingResponse = await axios.get(
          `${SHIPROCKET_API_URL}/shipments/${shipment_id}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
      );
      // console.log(trackingResponse.data);
      // const trackingDataKey = Object.keys(trackingResponse.data[0])[0];
      // const realTimeStatus = trackingResponse.data[0][trackingDataKey]?.tracking_data?.shipment_status;
      const realTimeStatus = trackingResponse.data?.data?.status;
      // console.log("Real-time Status:", realTimeStatus);
      // Define updatable statuses (before pickup scheduling)
      const updatableStatuses = [
        0, // New
        1, // AWB Assigned
        2, // Label Generated
        11, // Pending
      ];

      if (!updatableStatuses.includes(realTimeStatus)) {
        const statusDescription = getStatusDescription(realTimeStatus);
        throw new Error(`Order cannot be updated. Current status: ${statusDescription}`);
      }

      // Get all current ordered products
      const currentProductsSnapshot = await orderRef.collection("orderedProducts").get();

      // Create a map of document IDs to products
      const currentProducts = {};
      currentProductsSnapshot.forEach((doc) => {
        currentProducts[doc.id] = {...doc.data(), docId: doc.id};
      });

      // Validate removed products exist in order using document IDs
      for (const removedDocId of removedProducts) {
        if (!currentProducts[removedDocId]) {
          throw new Error(`Product with document ID ${removedDocId} not found in order`);
        }
      }

      // Process inventory returns and calculate new total
      let newTotalAmount = orderData.totalAmount;
      let newPayableAmount = orderData.payableAmount;
      const inventoryUpdates = [];
      const remainingProducts = [];

      for (const [docId, product] of Object.entries(currentProducts)) {
        if (removedProducts.includes(docId)) {
          // Return inventory for removed product
          const productDoc = await db.collection("products").doc(product.productId).get();
          const productData = productDoc.data();
          const quantitiesMap = product.heightType === "normal" ?
            productData.quantities :
            productData[product.heightType === "above" ? "aboveHeight" : "belowHeight"];

          const currentQuantity = quantitiesMap?.[product.color]?.[product.size] || 0;

          const updatedQuantities = {
            ...quantitiesMap,
            [product.color]: {
              ...quantitiesMap[product.color],
              [product.size]: currentQuantity + product.quantity,
            },
          };

          inventoryUpdates.push({
            ref: productDoc.ref,
            data: product.heightType === "normal" ?
              {quantities: updatedQuantities} :
              {[product.heightType === "above" ? "aboveHeight" : "belowHeight"]: updatedQuantities},
          });

          // Subtract removed product's amount from total
          newTotalAmount -= product.productDetails.price * product.quantity;
          newPayableAmount = newPayableAmount - (product.productDetails.discountedPrice * product.quantity) + product.productDiscount - ((product.productDetails.price-product.productDetails.discountedPrice)*product.quantity);

          // update the product with cancelledOn timestamp
          batch.update(orderRef.collection("orderedProducts").doc(docId), {
            cancelledOn: new Date(),
            status: "cancelled",
          });
        } else {
          // Keep track of remaining products for Shiprocket update
          remainingProducts.push({
            name: product.productDetails.displayName,
            sku: `${product.productId}-${product.color}-${product.heightType}-${product.size}`,
            units: product.quantity,
            selling_price: product.productDetails.price,
            tax: product.productDetails.gst || 5,
            hsn: product.productDetails.hsn || "",
            discount: product.perUnitDiscount,
          });
        }
      }

      // Check if all products are being removed
      if (remainingProducts.length === 0) {
        throw new Error("Cannot remove all products from order. Use cancel order instead.");
      }
      const adminDoc = await db.collection("controls").doc("admin").get();
      if (!adminDoc.exists) {
        throw new Error("Admin document not found");
      }
      const adminData = adminDoc.data();

      // Calculate new payable amount
      // const newPayableAmount = calculatePayableAmount(
      //     newTotalAmount,
      //     orderData.discount,
      //     orderData.lushioCurrencyUsed,
      // );

      // Update Shiprocket order
      const shiprocketOrderData = {
        order_id: oid,
        order_date: new Date().toISOString().split("T")[0], // Format: YYYY-MM-DD
        payment_method: orderData.modeOfPayment === "cashOnDelivery" ? "COD" : "Prepaid",
        sub_total: newPayableAmount,
        shipping_is_billing: true,
        billing_customer_name: orderData.address.name?.split(" ")[0] || "",
        billing_last_name: orderData.address.name?.split(" ").pop() || "",
        billing_address: `${orderData.address.flatDetails}, ${orderData.address.areaDetails}`,
        billing_address_2: orderData.address.landmark || "",
        billing_city: orderData.address.townCity,
        billing_pincode: orderData.address.pinCode,
        billing_state: orderData.address.state,
        billing_country: orderData.address.country,
        billing_phone: orderData.address.contactNo.replace(/\D/g, "").slice(-10),
        billing_email: orderData.email,
        order_items: remainingProducts,
        // shipping_charges: 0,
        // Get these values from admin document like in create order
        length: adminData.length,
        breadth: adminData.breadth,
        height: adminData.height,
        weight: adminData.weight,
        pickup_location: adminData.pickupLocation,
        company_name: adminData.companyName,
        reseller_name: adminData.resellerName,
      };

      // console.log("Shiprocket Order Data:", shiprocketOrderData);

      const shiprocketResponse = await axios.post(
          `${SHIPROCKET_API_URL}/orders/update/adhoc`,
          shiprocketOrderData,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
      );

      if (!shiprocketResponse.data.order_id) {
        throw new Error("Invalid response from Shiprocket API");
      }

      // Update order document
      batch.update(orderRef, {
        "updatedAt": new Date(),
        "status": "order_updated",
        "totalAmount": newTotalAmount,
        "payableAmount": newPayableAmount,
        "shiprocket.order_items": remainingProducts,
      });

      // Apply inventory updates
      for (const update of inventoryUpdates) {
        batch.update(update.ref, update.data);
      }

      // Commit all changes
      await batch.commit();

      res.status(200).json({
        message: "Order updated successfully",
        orderId: oid,
        removedProducts: removedProducts,
      });
    } catch (shiprocketError) {
      console.error("Shiprocket API Error:", shiprocketError.response?.data || shiprocketError);
      throw new Error(`Shiprocket API Error: ${shiprocketError.response?.data?.message || shiprocketError.message}`);
    } finally {
      if (token) {
        await destroyToken(token);
      }
    }
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      message: "Failed to update order",
      error: error.message,
      details: error.response?.data?.errors || null,
    });
  }
});

module.exports = router;
