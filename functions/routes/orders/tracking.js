/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable new-cap */
const express = require("express");
const axios = require("axios");
const router = express.Router();
const {getFirestore} = require("firebase-admin/firestore");
const db = getFirestore();
const {generateToken, destroyToken} = require("./shiprocketAuth");
const {getStatusDescription} = require("./statusDescription");
// const logger = require("firebase-functions/logger");

// URLs
const SHIPROCKET_API_URL = process.env.SHIPROCKET_API_URL;

// track order (awb + shipment)
router.get("/:oid", async (req, res) => {
  const {oid} = req.params;
  const {uid} = req.query;

  if (!oid || !uid) {
    return res.status(400).json({message: "Order ID and User ID are required"});
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

    const {awb_code, shipment_id} = orderData.shiprocket || {};
    if (!awb_code && !shipment_id) {
      return res.status(400).json({message: "Tracking information not available"});
    }

    let token;
    try {
      token = await generateToken();
      let trackingResponse;

      // Try AWB tracking first, fall back to shipment ID
      if (awb_code) {
        try {
          trackingResponse = await axios.get(
              `${SHIPROCKET_API_URL}/courier/track/awb/${awb_code}`,
              {
                headers: {"Authorization": `Bearer ${token}`},
              },
          );
        } catch (awbError) {
          console.log("AWB tracking failed, trying shipment ID");
          if (!shipment_id) throw awbError;

          trackingResponse = await axios.get(
              `${SHIPROCKET_API_URL}/courier/track/shipment/${shipment_id}`,
              {
                headers: {"Authorization": `Bearer ${token}`},
              },
          );
        }
      } else {
        trackingResponse = await axios.get(
            `${SHIPROCKET_API_URL}/courier/track/shipment/${shipment_id}`,
            {
              headers: {"Authorization": `Bearer ${token}`},
            },
        );
      }

      const responseData = trackingResponse.data;
      const trackingId = Object.keys(responseData)[0];
      const shipmentStatus = responseData[trackingId]?.tracking_data?.shipment_status;
      const statusDesc = getStatusDescription(shipmentStatus);

      // Update the database with the status description
      await db.collection("orders").doc(oid).update({
        "shiprocket.status_description": statusDesc,
        "shiprocket.status_code": shipmentStatus,
      });

      res.status(200).json({
        tracking_data: trackingResponse.data,
        awb_code,
        shipment_id,
        status_description: statusDesc,
      });
    } catch (shiprocketError) {
      console.error("Shiprocket API Error:", shiprocketError.response?.data || shiprocketError);
      throw new Error(`Tracking failed: ${shiprocketError.response?.data?.message || shiprocketError.message}`);
    } finally {
      if (token) {
        await destroyToken(token);
      }
    }
  } catch (error) {
    console.error("Error tracking order:", error);
    res.status(500).json({
      message: "Failed to track order",
      error: error.message,
    });
  }
});

// Get shipment details for an order
router.get("/shipment/:oid", async (req, res) => {
  const {oid} = req.params;

  if (!oid) {
    return res.status(400).json({message: "Order ID is required"});
  }

  try {
    // Fetch order document
    const orderDoc = await db.collection("orders").doc(oid).get();
    if (!orderDoc.exists) {
      return res.status(404).json({message: "Order not found"});
    }
    const orderData = orderDoc.data();

    // Check if shipment ID exists
    const {shipment_id} = orderData.shiprocket || {};
    if (!shipment_id) {
      return res.status(400).json({message: "Shipment information not available"});
    }

    let token;
    try {
      // Generate Shiprocket API token
      token = await generateToken();

      // Fetch shipment details from Shiprocket
      const shipmentResponse = await axios.get(
          `${SHIPROCKET_API_URL}/shipments/${shipment_id}`,
          {
            headers: {"Authorization": `Bearer ${token}`},
          },
      );

      const statusDesc = getStatusDescription(shipmentResponse.data.data.status);

      // Update the database with the status description
      await db.collection("orders").doc(oid).update({
        "shiprocket.status_description": statusDesc,
        "shiprocket.status_code": shipmentResponse.data.data.status,
      });

      res.status(200).json({
        shipment_data: shipmentResponse.data,
        shipment_id,
        shipment_status: statusDesc,
      });
    } catch (shiprocketError) {
      console.error("Shiprocket API Error:", shiprocketError.response?.data || shiprocketError);
      throw new Error(`Fetching shipment details failed: ${shiprocketError.response?.data?.message || shiprocketError.message}`);
    } finally {
      // Clean up token
      if (token) {
        await destroyToken(token);
      }
    }
  } catch (error) {
    console.error("Error fetching shipment details:", error);
    res.status(500).json({
      message: "Failed to fetch shipment details",
      error: error.message,
    });
  }
});

// Cancel shipment for an order
router.post("/shipment/cancel/:oid", async (req, res) => {
  const {oid} = req.params;

  if (!oid) {
    return res.status(400).json({message: "Order ID is required"});
  }

  try {
    // Fetch order document
    const orderDoc = await db.collection("orders").doc(oid).get();
    if (!orderDoc.exists) {
      return res.status(404).json({message: "Order not found"});
    }
    const orderData = orderDoc.data();

    // Check if AWB code exists
    const {awb_code, shipment_id} = orderData.shiprocket || {};
    if (!awb_code) {
      return res.status(400).json({message: "AWB code not available for cancellation"});
    }

    let token;
    try {
      // Generate Shiprocket API token
      token = await generateToken();

      // First, check shipment status
      const shipmentResponse = await axios.get(
          `${SHIPROCKET_API_URL}/shipments/${shipment_id}`,
          {
            headers: {"Authorization": `Bearer ${token}`},
          },
      );

      const shipmentStatus = shipmentResponse.data?.data?.status;

      // Ensure shipment status is less than or equal to 5
      if (shipmentStatus > 5) {
        return res.status(400).json({
          message: `Shipment cannot be cancelled. Current status (${shipmentStatus}: ${getStatusDescription(shipmentStatus)}) is beyond the allowed limit.`,
        });
      }

      // Proceed with cancellation
      const cancelResponse = await axios.post(
          `${SHIPROCKET_API_URL}/orders/cancel/shipment/awbs`,
          {
            awbs: [awb_code],
          },
          {
            headers: {"Authorization": `Bearer ${token}`},
          },
      );

      // Update order document to reflect cancellation
      await db.collection("orders").doc(oid).update({
        "shiprocket.shipmentCancellationDate": new Date().toISOString(),
        "shiprocket.status": "shipment_cancelled",
      });

      res.status(200).json({
        message: "Shipment cancelled successfully",
        cancellation_data: cancelResponse.data,
      });
    } catch (shiprocketError) {
      console.error("Shiprocket API Error:", shiprocketError.response?.data || shiprocketError);
      throw new Error(`Cancellation failed: ${shiprocketError.response?.data?.message || shiprocketError.message}`);
    } finally {
      // Clean up token
      if (token) {
        await destroyToken(token);
      }
    }
  } catch (error) {
    console.error("Error cancelling shipment:", error);
    res.status(500).json({
      message: "Failed to cancel shipment",
      error: error.message,
    });
  }
});


module.exports = router;
