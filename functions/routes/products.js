/* eslint-disable new-cap */
/* eslint-disable max-len */
const express = require("express");
const {getFirestore} = require("firebase-admin/firestore");
const {getStorage} = require("firebase-admin/storage");
const storage = getStorage();
const db = getFirestore();
const router = express.Router();
const logger = require("firebase-functions/logger");

// Add a new product
router.post("/addProduct", async (req, res) => {
  try {
    logger.log("Received product data:", req.body);

    const {
      name,
      displayName,
      description,
      price,
      gst,
      discountedPrice,
      categories,
      height,
      aboveHeight,
      belowHeight,
      colorOptions,
      quantities,
      cardImages,
      soldOut,
      toDisplay,
    } = req.body;

    // Validation checks
    if (!name || !displayName ||
        !description ||
        !description.productDetails ||
        !description.sizeFit ||!description.MaterialCare ||
        !price || !gst || !discountedPrice ||
        !categories || !cardImages || cardImages.length !== 2 ) {
      return res.status(400).json({error: "All required fields must be filled, including only two card images"});
    }

    // Prepare the new product data
    const productData = {
      createdAt: new Date(),
      name: name.trim(),
      displayName: displayName.trim(),
      description: {
        productDetails: description.productDetails.trim(),
        sizeFit: description.sizeFit.trim(),
        MaterialCare: description.MaterialCare.trim(),
      },
      price: parseFloat(price),
      gst: parseFloat(gst),
      soldOut,
      toDisplay,
      discountedPrice: parseFloat(discountedPrice),
      categories: typeof categories === "string" ? categories.split(",").map((cat) => cat.trim().toLowerCase()) : categories.map((cat) => cat.toLowerCase()), // Convert to lowercase
      cardImages: cardImages, // Array of two card image URLs
      rating: 0, // Default rating
      allImages: [...cardImages],
    };

    // Function to extract unique sizes from quantities
    const extractUniqueSizes = (quantitiesMap) => {
      if (!quantitiesMap) return [];

      // For height-based products, the quantities map is nested by color
      const allSizes = Object.values(quantitiesMap).flatMap((colorQuantities) =>
        typeof colorQuantities === "object" ? Object.keys(colorQuantities) : [],
      );

      return [...new Set(allSizes)].sort();
    };

    // Process color options and images
    if (height) {
      // Height-based classification
      productData.height = height;
      productData.aboveHeight = {
        ...aboveHeight,
        quantities: aboveHeight.quantities,
      };
      productData.belowHeight = {
        ...belowHeight,
        quantities: belowHeight.quantities,
      };

      // Create unified colorOptions array
      productData.colorOptions = Array.from(
          new Set([
            ...aboveHeight.colorOptions.map((c) => JSON.stringify({name: c.name, code: c.code})),
            ...belowHeight.colorOptions.map((c) => JSON.stringify({name: c.name, code: c.code})),
          ]),
      ).map((str) => JSON.parse(str));

      // Create sizeOptions array with unique sizes from both height ranges
      productData.sizeOptions = Array.from(
          new Set([
            ...extractUniqueSizes(aboveHeight.quantities),
            ...extractUniqueSizes(belowHeight.quantities),
          ]),
      );

      // Append images from aboveHeight and belowHeight colorOptions to allImages
      aboveHeight.colorOptions.forEach((option) => {
        if (option.images && Array.isArray(option.images)) {
          productData.allImages = productData.allImages.concat(option.images);
        }
      });
      belowHeight.colorOptions.forEach((option) => {
        if (option.images && Array.isArray(option.images)) {
          productData.allImages = productData.allImages.concat(option.images);
        }
      });
    } else {
      // Non-height-based classification
      productData.colorOptions = colorOptions;
      productData.quantities = quantities;

      // Create sizeOptions array from quantities
      productData.sizeOptions = extractUniqueSizes(quantities);

      // Append images from non-height-based colorOptions to allImages
      colorOptions.forEach((option) => {
        if (option.images && Array.isArray(option.images)) {
          productData.allImages = productData.allImages.concat(option.images);
        }
      });
    }

    // Add the product to the "products" collection in Firestore
    const productRef = await db.collection("products").add(productData);

    // Return a success response with the product ID
    return res.status(201).json({
      message: "Product added successfully!",
      productId: productRef.id,
      productData,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    return res.status(500).json({error: "Failed to add product"});
  }
});

// Get all products with pagination, sorting, and flags
router.get("/allProducts", async (req, res) => {
  try {
    const {lastDocId, limit = 10} = req.query; // Get lastDocId and limit from query parameters
    const productsRef = db.collection("products").orderBy("createdAt", "desc"); // Order by createdAt (descending)
    let query = productsRef.limit(parseInt(limit, 10)); // Limit the number of results

    if (lastDocId) {
      const lastDoc = await db.collection("products").doc(lastDocId).get(); // Fetch the last document using the ID
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc); // Start the query after the last document
      } else {
        return res.status(400).json({error: "Invalid lastDocId"});
      }
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.status(200).json({
        products: [],
        hasMore: false,
        lastDocId: null,
      });
    }

    const products = [];
    let lastVisibleDoc = null;

    snapshot.forEach((doc) => {
      products.push({id: doc.id, ...doc.data()});
      lastVisibleDoc = doc; // Keep track of the last document in the current batch
    });

    // Check if there are more products
    const nextQuery = productsRef.startAfter(lastVisibleDoc).limit(1); // Query for the next document
    const nextSnapshot = await nextQuery.get();
    const hasMore = !nextSnapshot.empty;

    return res.status(200).json({
      products,
      hasMore,
      lastDocId: lastVisibleDoc.id,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({error: "Failed to fetch products"});
  }
});

// Get a specific product by ID
router.get("/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const productRef = db.collection("products").doc(productId);
    const doc = await productRef.get();

    if (!doc.exists) {
      return res.status(404).json({error: "Product not found"});
    }

    const productData = doc.data();

    // Return the product data
    return res.status(200).json({
      id: doc.id,
      ...productData,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({error: "Failed to fetch product"});
  }
});

// Delete a product by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const productRef = db.collection("products").doc(productId);

    // Check if the product exists
    const doc = await productRef.get();
    if (!doc.exists) {
      return res.status(404).json({error: "Product not found"});
    }

    const productData = doc.data();

    // Get review references
    const reviewRefsSnapshot = await productRef.collection("reviews").get();
    const reviewIds = reviewRefsSnapshot.docs.map((doc) => doc.id);

    // Delete the reviews from the reviews collection
    const batch = db.batch();
    reviewIds.forEach((reviewId) => {
      const reviewRef = db.collection("reviews").doc(reviewId);
      batch.delete(reviewRef);
    });

    // Delete the review references subcollection
    reviewRefsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Helper function to delete an image from Firebase Storage
    const deleteImage = async (imageUrl) => {
      if (imageUrl) {
        try {
          const path = imageUrl.split("/o/")[1].split("?")[0];
          const decodedPath = decodeURIComponent(path);
          const fileRef = storage.bucket().file(decodedPath);
          await fileRef.delete();
        } catch (error) {
          console.error(`Failed to delete image: ${imageUrl}`, error);
        }
      }
    };

    // Delete all images listed in the allImages array
    if (productData.allImages && Array.isArray(productData.allImages)) {
      await Promise.all(productData.allImages.map(deleteImage));
    }

    // Delete the product document
    batch.delete(productRef);

    // Commit the batch
    await batch.commit();

    return res.status(200).json({message: "Product, associated reviews, and all images successfully deleted"});
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({error: "Failed to delete product"});
  }
});

// Update a product by ID
router.put("/update/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const updatedData = req.body;
    const productRef = db.collection("products").doc(productId);

    // Check if the product exists
    const doc = await productRef.get();
    if (!doc.exists) {
      return res.status(404).json({error: "Product not found"});
    }

    const currentProductData = doc.data();

    // Prepare the updated product data
    const updatedProductData = {
      ...updatedData,
      updatedAt: new Date(),
    };

    // Validate description object
    if (updatedProductData.description) {
      // Ensure description has all required fields
      if (!updatedProductData.description.productDetails ||
          !updatedProductData.description.sizeFit ||
          !updatedProductData.description.MaterialCare) {
        return res.status(400).json({
          error: "Description must include productDetails, sizeFit, and MaterialCare",
        });
      }

      // Trim description fields
      updatedProductData.description = {
        productDetails: updatedProductData.description.productDetails.trim(),
        sizeFit: updatedProductData.description.sizeFit.trim(),
        MaterialCare: updatedProductData.description.MaterialCare.trim(),
      };
    }

    // Function to extract unique sizes from quantities map
    const extractUniqueSizes = (quantitiesMap) => {
      if (!quantitiesMap) return [];

      // For height-based products, the quantities map is nested by color
      const allSizes = Object.values(quantitiesMap).flatMap((colorQuantities) =>
        typeof colorQuantities === "object" ? Object.keys(colorQuantities) : [],
      );

      return [...new Set(allSizes)].sort();
    };

    // Validate required fields
    const requiredFields = [
      "name",
      "displayName",
      "description",
      "price",
      "gst",
      "discountedPrice",
      "categories",
      "cardImages",
      "soldOut",
      "toDisplay",
    ];

    for (const field of requiredFields) {
      if (updatedProductData[field] === undefined) {
        updatedProductData[field] = currentProductData[field];
      }
    }

    // Convert categories to lowercase
    if (updatedProductData.categories) {
      updatedProductData.categories = Array.isArray(updatedProductData.categories) ? updatedProductData.categories.map((cat) => cat.toLowerCase()) : updatedProductData.categories.split(",").map((cat) => cat.trim().toLowerCase());
    }

    // Ensure cardImages are present and valid
    if (!updatedProductData.cardImages || updatedProductData.cardImages.length !== 2) {
      return res.status(400).json({error: "Two card images are required"});
    }

    let newAllImages = [];

    // Process color options and images
    if (updatedProductData.height !== undefined) {
      // Height-based classification
      if (!updatedProductData.aboveHeight || !updatedProductData.belowHeight) {
        return res.status(400).json({
          error: "Both aboveHeight and belowHeight data are required for height-based products",
        });
      }

      // Create unified colorOptions array
      updatedProductData.colorOptions = Array.from(
          new Set([
            ...updatedProductData.aboveHeight.colorOptions.map((c) =>
              JSON.stringify({name: c.name, code: c.code}),
            ),
            ...updatedProductData.belowHeight.colorOptions.map((c) =>
              JSON.stringify({name: c.name, code: c.code}),
            ),
          ]),
      ).map((str) => JSON.parse(str));

      // Generate sizeOptions from quantities
      updatedProductData.sizeOptions = extractUniqueSizes({
        ...updatedProductData.aboveHeight.quantities,
        ...updatedProductData.belowHeight.quantities,
      });

      // Rebuild allImages from aboveHeight and belowHeight colorOptions
      updatedProductData.aboveHeight.colorOptions.forEach((option) => {
        if (option.images && Array.isArray(option.images)) {
          newAllImages = newAllImages.concat(option.images);
        }
      });
      updatedProductData.belowHeight.colorOptions.forEach((option) => {
        if (option.images && Array.isArray(option.images)) {
          newAllImages = newAllImages.concat(option.images);
        }
      });
    } else {
      // Non-height-based classification
      if (!updatedProductData.colorOptions || !updatedProductData.quantities) {
        return res.status(400).json({
          error: "colorOptions, sizeOptions, and quantities are required for non-height-based products",
        });
      }

      // Generate sizeOptions from quantities
      updatedProductData.sizeOptions = extractUniqueSizes(updatedProductData.quantities);

      updatedProductData.colorOptions.forEach((option) => {
        if (option.images && Array.isArray(option.images)) {
          newAllImages = newAllImages.concat(option.images);
        }
      });
    }

    // Deduplicate allImages
    updatedProductData.allImages = [...new Set(newAllImages)];

    // Update the product
    await productRef.update(updatedProductData);

    return res.status(200).json({
      message: "Product updated successfully",
      updatedProductData,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({error: "Failed to update product"});
  }
});

module.exports = router;
