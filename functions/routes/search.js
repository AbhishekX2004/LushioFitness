/* eslint-disable require-jsdoc */
/* eslint-disable new-cap */
/* eslint-disable max-len */
const express = require("express");
const router = express.Router();
const {getFirestore} = require("firebase-admin/firestore");
const db = getFirestore();

// search products
router.post("/", async (req, res) => {
  try {
    const {
      searchText,
      limit = 10,
      lastProductId = null, // for pagination
    } = req.body;

    if (!searchText) {
      return res.status(400).json({
        error: "Search text is required",
      });
    }

    // Normalize search text to lowercase
    const normalizedSearchText = searchText.toLowerCase().trim();

    // Base query
    let query = db.collection("products");

    // Apply pagination if lastProductId exists
    if (lastProductId) {
      const lastDoc = await db.collection("products").doc(lastProductId).get();
      if (!lastDoc.exists) {
        return res.status(400).json({
          error: "Invalid lastProductId",
        });
      }
      query = query.startAfter(lastDoc);
    }

    // Get documents with pagination
    const snapshot = await query.limit(limit + 1).get(); // Get one extra to check if there are more results

    const products = [];
    let hasMore = false;

    // Process each document
    snapshot.forEach((doc) => {
      // If we've reached our limit, just set hasMore flag
      if (products.length >= limit) {
        hasMore = true;
        return;
      }

      const product = doc.data();
      const matches = checkProductMatch(product, normalizedSearchText);

      if (matches.isMatch) {
        products.push({
          id: doc.id,
          ...product,
          matchType: matches.matchType, // Include match type for sorting/reference
        });
      }
    });

    // Sort products based on match type hierarchy
    const sortedProducts = sortProductsByMatchPriority(products);

    return res.status(200).json({
      products: sortedProducts,
      hasMore,
      lastProductId: sortedProducts.length > 0 ? sortedProducts[sortedProducts.length - 1].id : null,
    });
  } catch (error) {
    console.error("Search API Error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Helper function to check if a product matches search criteria
function checkProductMatch(product, searchText) {
  // Normalize all relevant fields
  const displayName = (product.displayName || "").toLowerCase();
  const productDetails = (product.description?.productDetails || "").toLowerCase();
  const categories = (product.categories || []).map((cat) => cat.toLowerCase());
  const sizeFit = (product.description?.sizeFit || "").toLowerCase();
  const colorOptions = (product.colorOptions || []).map((opt) => (opt.name || "").toLowerCase());

  // Check matches in order of priority
  if (displayName.includes(searchText)) {
    return {isMatch: true, matchType: "displayName"};
  }

  if (productDetails.includes(searchText)) {
    return {isMatch: true, matchType: "productDetails"};
  }

  if (categories.some((category) => category.includes(searchText))) {
    return {isMatch: true, matchType: "categories"};
  }

  if (sizeFit.includes(searchText)) {
    return {isMatch: true, matchType: "sizeFit"};
  }

  if (colorOptions.some((color) => color.includes(searchText))) {
    return {isMatch: true, matchType: "colorOptions"};
  }

  return {isMatch: false, matchType: null};
}

// Helper function to sort products based on match type priority
function sortProductsByMatchPriority(products) {
  const priorityOrder = {
    displayName: 1,
    categories: 2,
    productDetails: 3,
    sizeFit: 4,
    colorOptions: 5,
  };

  return products.sort((a, b) => {
    return priorityOrder[a.matchType] - priorityOrder[b.matchType];
  });
}

// search referral codes
router.post("/refCode", async (req, res) => {
  const {referralCode} = req.body;

  if (!referralCode) {
    return res.status(400).json({error: "Referral code is required"});
  }

  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("referralCode", "==", referralCode).get();

    if (snapshot.empty) {
      return res.status(404).json({error: "Referral code not found"});
    }

    return res.status(200).json({message: "Referral code exists"});
  } catch (error) {
    console.error("Error checking referral code:", error);
    return res.status(500).json({error: "Internal server error"});
  }
});


module.exports = router;
