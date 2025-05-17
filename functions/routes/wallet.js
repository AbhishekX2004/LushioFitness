/* eslint-disable require-jsdoc */
/* eslint-disable new-cap */
/* eslint-disable max-len */
const express = require("express");
const {getFirestore} = require("firebase-admin/firestore");
const db = getFirestore();
const multer = require("multer");
const csv = require("csv-parse");
const router = express.Router();
const logger = require("firebase-functions/logger");

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 5, // Limit file size to 5MB
  },
});

// Route to get the total coins and cash for a user
router.get("/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    // Fetch the user's main document
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({error: "User not found"});
    }

    const userData = userDoc.data();
    const lushioCash = Number(userData.lushioCash) || 0; // Default to 0 if cash doesn't exist

    // Fetch the user's coins subcollection
    const coinsSnapshot = await db.collection("users").doc(userId).collection("coins").get();
    let lushioCoins = 0;

    coinsSnapshot.forEach((doc) => {
      const coinData = doc.data();
      if (!coinData.lushioCash && coinData.isExpired && coinData.amountLeft <= 0) {
        return; // Skip expired coins
      }
      lushioCoins += Number(coinData.amountLeft) || 0; // Add the amount from each document
    });

    const totalCredits = lushioCoins + lushioCash; // Sum of coins and cash

    // Return the totals in the response
    res.status(200).json({
      lushioCoins,
      lushioCash,
      totalCredits,
    });
  } catch (error) {
    logger.error("Error fetching user credits: ", error);
    res.status(500).json({error: "Internal server error"});
  }
});

// Route to send coins to all users
router.post("/send", async (req, res) => {
  const {amount, days, message} = req.body;

  if (!amount || !days || !message) {
    return res.status(400).json({
      error: "Missing required parameters",
      received: {amount, days, message},
    });
  }

  // Validate input types
  const numericAmount = Number(amount);
  const numericDays = Number(days);

  if (isNaN(numericAmount) || isNaN(numericDays)) {
    return res.status(400).json({
      error: "Invalid parameters",
      details: "Amount and days must be valid numbers",
    });
  }


  try {
    // Get all users
    logger.log("Fetching users from database...");
    const usersSnapshot = await db.collection("users").get();

    if (usersSnapshot.empty) {
      logger.log("No users found in database");
      return res.status(404).json({error: "No users found in database"});
    }

    logger.log(`Found ${usersSnapshot.size} users`);

    const batch = db.batch();
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + numericDays);

    usersSnapshot.forEach((userDoc) => {
      const userId = userDoc.id;
      const newCoinRef = db.collection("users").doc(userId).collection("coins").doc();

      batch.set(newCoinRef, {
        amount: numericAmount,
        amountLeft: numericAmount,
        message: message,
        expiresOn: expirationDate,
        createdAt: new Date(),
        isExpired: false,
      });
    });

    logger.log("Committing batch write...");
    await batch.commit();
    logger.log("Batch write successful");

    res.status(200).json({
      message: `Successfully sent ${numericAmount} coins to ${usersSnapshot.size} users`,
      usersAffected: usersSnapshot.size,
    });
  } catch (error) {
    logger.error("Detailed error in /send route:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
      code: error.code,
    });
  }
});

// Route to consume coins and cash
router.post("/consume", async (req, res) => {
  try {
    const {uid, coinsToConsume, oid, orderAmount} = req.body;

    // Input validation
    if (!uid || !coinsToConsume || !oid || !orderAmount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Start a transaction to ensure data consistency
    const result = await db.runTransaction(async (transaction) => {
      let remainingCoinsToConsume = coinsToConsume;
      const consumptionDetails = [];

      // Get user document reference
      const userRef = db.collection("users").doc(uid);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      // Get coins subcollection
      const coinsQuery = await userRef
          .collection("coins")
          .orderBy("expiresOn", "asc")
          .get();

      // Process each coin document
      for (const coinDoc of coinsQuery.docs) {
        const coinData = coinDoc.data();

        // Skip if coin is expired or has no amount left
        if (coinData.isExpired || coinData.amountLeft <= 0) {
          continue;
        }

        const coinRef = userRef.collection("coins").doc(coinDoc.id);

        if (remainingCoinsToConsume > 0) {
          const consumableAmount = Math.min(coinData.amountLeft, remainingCoinsToConsume);

          // Update coin document
          transaction.update(coinRef, {
            amountLeft: coinData.amountLeft - consumableAmount,
            orders: [...(coinData.orders || []), {
              oid,
              consumedAmount: consumableAmount,
              orderAmount,
              consumedAt: new Date(),
            }],
          });

          remainingCoinsToConsume -= consumableAmount;
          consumptionDetails.push({
            coinId: coinDoc.id,
            consumedAmount: consumableAmount,
          });
        }
      }

      // If there are still coins to consume, use lushioCash
      if (remainingCoinsToConsume > 0) {
        const userData = userDoc.data();
        const availableCash = userData.lushioCash || 0;

        if (availableCash < remainingCoinsToConsume) {
          throw new Error("Insufficient funds");
        }

        // Update user's lushioCash
        transaction.update(userRef, {
          lushioCash: availableCash - remainingCoinsToConsume,
        });

        // Create a new document in coins subcollection for lushioCash transaction
        const lushioCashTransactionRef = userRef.collection("coins").doc();
        transaction.create(lushioCashTransactionRef, {
          lushioCash: true,
          cashUsed: remainingCoinsToConsume,
          oid,
          orderAmount,
          createdAt: new Date(),
        });

        consumptionDetails.push({
          type: "lushioCash",
          consumedAmount: remainingCoinsToConsume,
        });
      }

      return {
        success: true,
        consumptionDetails,
        totalConsumed: coinsToConsume,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error consuming coins:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error processing coin consumption",
    });
  }
});

// Process CSV or direct input into arrays of emails and phones
async function extractContactInfo(recipients, fileBuffer) {
  const contacts = [];

  if (fileBuffer) {
    return new Promise((resolve, reject) => {
      csv.parse(fileBuffer.toString(), {
        columns: true,
        skip_empty_lines: true,
      })
          .on("data", (data) => {
          // Each email/phone is a separate potential user
            if (data.email) contacts.push(data.email.toLowerCase().trim());
            if (data.phone) contacts.push(data.phone.trim());
          })
          .on("end", () => resolve(contacts))
          .on("error", reject);
    });
  }

  // if (Array.isArray(recipients)) {
  //   recipients.forEach((recipient) => {
  //     if (recipient.email) contacts.push(recipient.email.toLowerCase().trim());
  //     if (recipient.phone) contacts.push(recipient.phone.trim());
  //   });
  // }
  if (Array.isArray(recipients)) {
    recipients.forEach((recipient) => {
      if (typeof recipient === "string") {
        // Handle string recipient
        if (recipient.includes("@")) {
          contacts.push(recipient.toLowerCase().trim());
        } else {
          contacts.push(recipient.trim());
        }
      } else if (recipient && typeof recipient === "object") {
        // Handle object recipient
        if (recipient.email) contacts.push(recipient.email.toLowerCase().trim());
        if (recipient.phone) contacts.push(recipient.phone.trim());
      }
    });
  }

  return contacts;
}

// Route to send coins to specific users
router.post("/send-specific", async (req, res) => {
  try {
    const {recipients, amount, days, message} = req.body;

    if (!recipients || !amount || !days || !message) {
      return res.status(400).json({error: "Missing required parameters"});
    }

    // Ensure recipients is an array
    let recipientsArray = [];
    if (Array.isArray(recipients)) {
      recipientsArray = recipients;
    } else if (typeof recipients === "string") {
      // Handle comma-separated string
      recipientsArray = recipients.split(",").map((item) => item.trim()).filter((item) => item);
    }

    if (recipientsArray.length === 0) {
      return res.status(400).json({error: "No valid contacts provided"});
    }

    // Find users matching any of the contacts
    const uniqueUsers = new Map();
    const batchSize = 10; // Firestore "in" query limitation

    // Process recipients in batches to avoid "in" query limitations
    for (let i = 0; i < recipientsArray.length; i += batchSize) {
      const batch = recipientsArray.slice(i, i + batchSize);

      // Search for each contact as either email or phone
      const [emailUsers, phoneUsers] = await Promise.all([
        db.collection("users").where("email", "in", batch).get(),
        db.collection("users").where("phoneNumber", "in", batch).get(),
      ]);

      // Combine results, preventing duplicates
      [...emailUsers.docs, ...phoneUsers.docs].forEach((doc) => {
        if (!uniqueUsers.has(doc.id)) {
          uniqueUsers.set(doc.id, doc);
        }
      });
    }

    // Prepare batch write
    const batch = db.batch();
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + Number(days));

    // Add coins to each unique user
    uniqueUsers.forEach((userDoc) => {
      const newCoinRef = db.collection("users")
          .doc(userDoc.id)
          .collection("coins")
          .doc();

      batch.set(newCoinRef, {
        amount: Number(amount),
        amountLeft: Number(amount),
        message,
        expiresOn: expirationDate,
        createdAt: new Date(),
        isExpired: false,
      });
    });

    await batch.commit();

    res.status(200).json({
      success: true,
      totalContactsProvided: recipientsArray.length,
      uniqueUsersFound: uniqueUsers.size,
    });
  } catch (error) {
    logger.error("Error in /send-specific route:", error);
    res.status(500).json({error: "Internal server error"});
  }
});

// Route to send coins to active users within a date range
router.post("/send-to-active", async (req, res) => {
  const {startDate, lastDate, amount, days, message} = req.body;

  if (!startDate || !lastDate || !amount || !days || !message) {
    return res.status(400).json({
      error: "Missing required parameters",
      received: {startDate, lastDate, amount, days, message},
    });
  }

  // Convert and validate dates
  const start = new Date(startDate);
  const end = new Date(lastDate);
  const numericAmount = Number(amount);
  const numericDays = Number(days);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(numericAmount) || isNaN(numericDays)) {
    return res.status(400).json({
      error: "Invalid parameters",
      details: "Dates must be valid, and amount/days must be numbers",
    });
  }

  try {
    // Fetch users with updatedAt within the given range
    logger.log("Fetching active users...");
    const usersSnapshot = await db.collection("users")
        .where("updatedAt", ">=", start)
        .where("updatedAt", "<=", end)
        .get();

    if (usersSnapshot.empty) {
      logger.log("No active users found in the given period");
      return res.status(404).json({error: "No active users found in the given period"});
    }

    logger.log(`Found ${usersSnapshot.size} active users`);

    const batch = db.batch();
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + numericDays);

    usersSnapshot.forEach((userDoc) => {
      const userId = userDoc.id;
      const newCoinRef = db.collection("users").doc(userId).collection("coins").doc();

      batch.set(newCoinRef, {
        amount: numericAmount,
        amountLeft: numericAmount,
        message: message,
        expiresOn: expirationDate,
        createdAt: new Date(),
        isExpired: false,
      });
    });

    logger.log("Committing batch write...");
    await batch.commit();
    logger.log("Batch write successful");

    res.status(200).json({
      message: `Successfully sent ${numericAmount} coins to ${usersSnapshot.size} active users`,
      usersAffected: usersSnapshot.size,
    });
  } catch (error) {
    logger.error("Error in /send-to-active route:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
      code: error.code,
    });
  }
});

// Route to send coins to users who ordered between a specific date range
router.post("/send-to-orders", async (req, res) => {
  const {startDate, lastDate, amount, days, message} = req.body;

  if (!startDate || !lastDate || !amount || !days || !message) {
    return res.status(400).json({
      error: "Missing required parameters",
      received: {startDate, lastDate, amount, days, message},
    });
  }

  // Convert and validate dates
  const start = new Date(startDate);
  const end = new Date(lastDate);
  const numericAmount = Number(amount);
  const numericDays = Number(days);
  const now = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(numericAmount) || isNaN(numericDays)) {
    return res.status(400).json({
      error: "Invalid parameters",
      details: "Dates must be valid, and amount/days must be numbers",
    });
  }

  try {
    // Fetch orders within the date range that are not cancelled and have passed return period
    logger.log("Fetching eligible orders...");
    const ordersSnapshot = await db.collection("orders")
        .where("dateOfOrder", ">=", start)
        .where("dateOfOrder", "<=", end)
        .get();

    if (ordersSnapshot.empty) {
      logger.log("No orders found in the given period");
      return res.status(404).json({error: "No orders found in the given period"});
    }

    logger.log(`Found ${ordersSnapshot.size} orders in the date range`);

    // Filter orders to get only eligible ones and extract unique user IDs
    const uniqueUserIds = new Set();

    ordersSnapshot.forEach((orderDoc) => {
      const order = orderDoc.data();
      const notCancelled = !order.cancelledOn;
      const hasReturnDate = !!order.returnExchangeExpiresOn;
      const returnExpired = hasReturnDate && order.returnExchangeExpiresOn.toDate() < now;
      const hasUid = !!order.uid;

      // Log the conditions for debugging
      // console.log("Processing order:", orderDoc.id);
      // console.log({
      //   orderId: orderDoc.id,
      //   uid: order.uid,
      //   notCancelled,
      //   hasReturnDate,
      //   returnExpired,
      //   hasUid,
      //   returnExpiresOn: order.returnExchangeExpiresOn,
      //   currentDate: now.toISOString(),
      // });

      // Check if order is not cancelled and return period has expired
      if (notCancelled && hasReturnDate && returnExpired && hasUid) {
        console.log(`Adding user ${order.uid} to set`);
        uniqueUserIds.add(order.uid);
      }
    });

    console.log(uniqueUserIds);

    if (uniqueUserIds.size === 0) {
      logger.log("No eligible users found after filtering");
      return res.status(404).json({
        error: "No eligible users found with completed orders past return period",
      });
    }

    logger.log(`Found ${uniqueUserIds.size} unique eligible users`);

    // Prepare batch write
    const batch = db.batch();
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + numericDays);

    // Add coins to each eligible user
    for (const userId of uniqueUserIds) {
      // Verify the user exists
      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        logger.log(`User ${userId} not found, skipping`);
        continue;
      }

      const newCoinRef = db.collection("users").doc(userId).collection("coins").doc();

      batch.set(newCoinRef, {
        amount: numericAmount,
        amountLeft: numericAmount,
        message: message,
        expiresOn: expirationDate,
        createdAt: new Date(),
        isExpired: false,
      });
    }

    logger.log("Committing batch write...");
    await batch.commit();
    logger.log("Batch write successful");

    res.status(200).json({
      message: `Successfully sent ${numericAmount} coins to ${uniqueUserIds.size} users with eligible orders`,
      usersAffected: uniqueUserIds.size,
    });
  } catch (error) {
    logger.error("Error in /send-to-orders route:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
      code: error.code,
    });
  }
});

module.exports = router;
