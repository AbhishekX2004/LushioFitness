/* eslint-disable max-len */
/* eslint-disable new-cap */
const express = require("express");
const admin = require("firebase-admin");
const db = admin.firestore();

const router = express.Router();

// Add a review
router.post("/:productId", async (req, res) => {
  try {
    const {productId} = req.params;
    const {userId, rating, text} = req.body;

    // Validate input
    if (!userId || !rating || rating > 5 || rating < 0 || !text) {
      return res.status(400).json({error: "Missing required fields"});
    }

    // Create the review document
    const reviewData = {
      userId,
      productId,
      rating: Number(rating),
      text,
      timestamp: new Date(),
    };

    // Add the review to the reviews collection
    const reviewRef = await db.collection("reviews").add(reviewData);

    // Add a reference to the review in the product's reviews subcollection
    const productRef = db.collection("products").doc(productId);
    await productRef.collection("reviews").doc(reviewRef.id).set({});

    // Update the product's rating
    const productDoc = await productRef.get();
    const productData = productDoc.data();
    const oldRating = productData.rating || 0;
    const oldReviewCount = productData.reviewCount || 0;
    const newReviewCount = oldReviewCount + 1;
    const newRating = ((oldRating * oldReviewCount) + rating) / newReviewCount;

    await productRef.update({
      rating: newRating,
      reviewCount: newReviewCount,
    });

    return res.status(201).json({
      message: "Review added successfully",
      reviewId: reviewRef.id,
    });
  } catch (error) {
    console.error("Error adding review:", error);
    return res.status(500).json({error: "Failed to add review"});
  }
});

// Get reviews for a product
router.get("/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const productRef = db.collection("products").doc(id);
    const reviewsRef = productRef.collection("reviews");

    const reviewsSnapshot = await reviewsRef.get();

    if (reviewsSnapshot.empty) {
      return res.status(404).json({message: "No reviews found for this product"});
    }

    const reviewIds = reviewsSnapshot.docs.map((doc) => doc.id);

    const reviewsData = await Promise.all(
        reviewIds.map(async (reviewId) => {
          const reviewDoc = await db.collection("reviews").doc(reviewId).get();
          const reviewData = reviewDoc.data();

          let formattedTimestamp = "Timestamp not available";

          // Check if timestamp exists and is valid before formatting
          if (reviewData && reviewData.timestamp && reviewData.timestamp.toDate) {
            const timestamp = reviewData.timestamp.toDate();
            formattedTimestamp = timestamp.toLocaleString("en-US", {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
              hour12: true,
              timeZoneName: "short",
            });
          }

          return {
            id: reviewId,
            ...reviewData,
            timestamp: formattedTimestamp,
          };
        }),
    );

    return res.status(200).json(reviewsData);
  } catch (error) {
    console.error("Error getting reviews:", error);
    return res.status(500).json({error: "Failed to get reviews"});
  }
});

// Delete a review
router.delete("/delete/:reviewId", async (req, res) => {
  try {
    const {reviewId} = req.params;
    const reviewRef = db.collection("reviews").doc(reviewId);

    // Check if the review exists
    const reviewDoc = await reviewRef.get();
    if (!reviewDoc.exists) {
      return res.status(404).json({error: "Review not found"});
    }

    const reviewData = reviewDoc.data();
    const {productId, rating} = reviewData;

    // Delete the review
    await reviewRef.delete();

    // Remove the reference from the product's reviews subcollection
    const productRef = db.collection("products").doc(productId);
    await productRef.collection("reviews").doc(reviewId).delete();

    // Update the product's rating
    const productDoc = await productRef.get();
    const productData = productDoc.data();
    const oldRating = productData.rating || 0;
    const oldReviewCount = productData.reviewCount || 0;
    const newReviewCount = oldReviewCount - 1;
    const newRating = newReviewCount > 0 ?
      ((oldRating * oldReviewCount) - rating) / newReviewCount :
      0;

    await productRef.update({
      rating: newRating,
      reviewCount: newReviewCount,
    });

    return res.status(200).json({message: "Review successfully deleted"});
  } catch (error) {
    console.error("Error deleting review:", error);
    return res.status(500).json({error: "Failed to delete review"});
  }
});

module.exports = router;
