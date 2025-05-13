/* eslint-disable max-len */
const {getFirestore} = require("firebase-admin/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

// Initialize Firestore
const db = getFirestore();

// Maximum number of orders to process in a single batch
const BATCH_SIZE = 500;
// Maximum number of batches to process in a single function execution
// Adjust based on your function timeout settings and expected volume
const MAX_BATCHES = 10;

// Cloud function that runs on a schedule (e.g., every hour)
const autoCompleteOrders = onSchedule("every 1 hours", async (event) => {
  const now = new Date();
  let lastDocumentSnapshot = null;
  let batchCount = 0;
  let totalUpdated = 0;

  try {
    // Fetch the orderDiscounts map from admin controls
    const controlsDoc = await db.collection("controls").doc("admin").get();
    const orderDiscounts = controlsDoc.exists ? controlsDoc.data().orderDiscounts || {} : {};
    const orderDiscountCoinsDays = controlsDoc.exists ? controlsDoc.data().orderDiscountCoinsDays || 30 : 30;
    if (Object.keys(orderDiscounts).length === 0) {
      logger.warn("No orderDiscounts configuration found in controls/admin document");
    }

    // Process batches until we either:
    // 1. Run out of orders to process
    // 2. Reach MAX_BATCHES limit to avoid timeout
    while (batchCount < MAX_BATCHES) {
      // Create the initial query
      let query = db.collection("orders")
          .where("status", "!=", "completed")
          .where("returnExchangeExpiresOn", "<", now)
          .limit(BATCH_SIZE);

      // If we have a last document from previous batch, start after it
      if (lastDocumentSnapshot) {
        query = query.startAfter(lastDocumentSnapshot);
      }

      // Execute the query
      const ordersToComplete = await query.get();

      // If no more orders to process, break the loop
      if (ordersToComplete.empty) {
        logger.log(`Completed processing all eligible orders. Total updated: ${totalUpdated}`);
        break;
      }

      // Save the last document for the next iteration
      lastDocumentSnapshot = ordersToComplete.docs[ordersToComplete.docs.length - 1];

      // Create a batch to update multiple orders efficiently
      const batch = db.batch();
      let batchUpdateCount = 0;

      // Track user coin updates to batch them efficiently
      const userCoinUpdates = new Map();

      // Process each order
      for (const doc of ordersToComplete.docs) {
        const orderData = doc.data();

        // Update order status
        batch.update(doc.ref, {
          status: "completed",
          autoCompletedAt: new Date(),
          autoCompleted: true,
        });

        // Check if order has a uid and payableAmount for coin calculation
        if (orderData.uid && orderData.payableAmount) {
          // Determine how many coins to award based on the order amount
          const orderAmount = orderData.payableAmount;
          let coinPercentage = 0;

          // Find the applicable discount tier
          // Sort discount tiers in descending order to find the highest applicable tier
          const orderThresholds = Object.keys(orderDiscounts)
              .map(Number)
              .sort((a, b) => b - a);

          for (const threshold of orderThresholds) {
            if (orderAmount >= threshold) {
              coinPercentage = orderDiscounts[threshold];
              break;
            }
          }

          if (coinPercentage > 0) {
            // Calculate coins as percentage of payable amount and floor the value
            const coinsToAward = Math.floor((orderAmount * coinPercentage) / 100);

            if (coinsToAward > 0) {
              // Store the coin update details for this user
              if (!userCoinUpdates.has(orderData.uid)) {
                userCoinUpdates.set(orderData.uid, []);
              }

              userCoinUpdates.get(orderData.uid).push({
                amount: coinsToAward,
                orderNumber: doc.id,
                orderAmount: orderAmount,
              });
            }
          }
        }

        batchUpdateCount++;
      }

      // Add coin documents for each user
      for (const [userId, coinUpdates] of userCoinUpdates.entries()) {
        for (const update of coinUpdates) {
          // Set expiration date (e.g., 60 days from now)
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + orderDiscountCoinsDays);

          // Create a new coin document in the user's coins subcollection
          const coinRef = db.collection("users").doc(userId).collection("coins").doc();

          batch.set(coinRef, {
            amount: update.amount,
            amountLeft: update.amount,
            message: `Award for successful completion of order #${update.orderNumber}`,
            expiresOn: expirationDate,
            createdAt: new Date(),
            isExpired: false,
            orderReference: update.orderNumber,
            orderAmount: update.orderAmount,
          });

          logger.log(`Adding ${update.amount} coins to user ${userId} for order ${update.orderNumber}`);
        }
      }

      // Commit the batch
      await batch.commit();

      // Update counters
      totalUpdated += batchUpdateCount;
      batchCount++;

      logger.log(`Processed batch ${batchCount}: Updated ${batchUpdateCount} orders and awarded coins to ${userCoinUpdates.size} users`);

      // If the batch wasn't full, we've processed all orders
      if (ordersToComplete.size < BATCH_SIZE) {
        logger.log(`Completed processing all eligible orders. Total updated: ${totalUpdated}`);
        break;
      }
    }

    // If we've hit the MAX_BATCHES limit but there might be more to process
    if (batchCount >= MAX_BATCHES) {
      logger.log(`Reached maximum batch limit (${MAX_BATCHES}). Processed ${totalUpdated} orders. Remaining orders will be processed in the next execution.`);
    }
  } catch (error) {
    logger.error(`Error auto-completing orders after processing ${totalUpdated} orders:`, error);
  }
});

module.exports = autoCompleteOrders;
