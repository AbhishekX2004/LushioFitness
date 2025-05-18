/* eslint-disable new-cap */
/* eslint-disable max-len */
const express = require("express");
const router = express.Router();
const {getFirestore} = require("firebase-admin/firestore");
const db = getFirestore();

// Get transactions for a user
router.post("/", async (req, res) => {
  try {
    const {uid, lastDocId, limit = 10} = req.body;

    // Input validation
    if (!uid) {
      return res.status(400).json({success: false, message: "User ID is required"});
    }

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({success: false, message: "User not found"});
    }

    let query = userRef.collection("coins").orderBy("createdAt", "desc").limit(limit);

    // Apply pagination if lastDocId is provided
    if (lastDocId) {
      const lastDocRef = await userRef.collection("coins").doc(lastDocId).get();
      if (lastDocRef.exists) {
        query = query.startAfter(lastDocRef);
      }
    }

    const coinsSnapshot = await query.get();

    if (coinsSnapshot.empty) {
      return res.status(200).json({success: true, transactions: [], hasMore: false});
    }

    const transactions = coinsSnapshot.docs.map((doc) => {
      const data = doc.data();

      // Handle three types of transactions:
      // 1. Cash credit (lushioCash: true and cashCredited exists)
      // 2. Cash usage (lushioCash: true and cashUsed exists)
      // 3. Regular coin transactions (lushioCash is false or undefined)

      if (data.lushioCash) {
        if (data.cashCredited) {
          // Cash credit transaction
          return {
            id: doc.id,
            type: "cash_credit",
            amount: data.cashCredited,
            message: data.message || "Cash credited to your account",
            transactionDate: data.createdAt.toDate(),
            createdAt: data.createdAt.toDate(),
          };
        } else {
          // Cash usage transaction
          return {
            id: doc.id,
            type: "cash_usage",
            amount: data.cashUsed,
            orderId: data.oid,
            orderAmount: data.orderAmount,
            transactionDate: data.createdAt.toDate(),
            createdAt: data.createdAt.toDate(),
          };
        }
      } else {
        // Regular coin transaction
        return {
          id: doc.id,
          type: "coin",
          amount: data.amount,
          amountLeft: data.amountLeft,
          message: data.message,
          expiresOn: data.expiresOn ? data.expiresOn.toDate() : null,
          isExpired: data.isExpired,
          orders: (data.orders || []).map((order) => ({
            oid: order.oid,
            orderAmount: order.orderAmount,
            consumedAmount: order.consumedAmount,
            consumedAt: order.consumedAt ? order.consumedAt.toDate() : null,
          })),
          createdAt: data.createdAt.toDate(),
        };
      }
    });

    return res.status(200).json({
      success: true,
      transactions,
      hasMore: coinsSnapshot.docs.length === limit,
      lastDocId: coinsSnapshot.docs.length ? coinsSnapshot.docs[coinsSnapshot.docs.length - 1].id : null,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({success: false, message: error.message || "Error fetching transactions"});
  }
});

module.exports = router;
