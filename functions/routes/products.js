/* eslint-disable new-cap */
/* eslint-disable max-len */
const express = require("express");
const admin = require("firebase-admin");
const db = admin.firestore();
const storage = admin.storage();
const router = express.Router();

// Add a new product
router.post("/addProduct", async (req, res) => {
  try {
    console.log("Received product data:", req.body);

    const {
      name,
      displayName,
      description,
      price,
      gst,
      discount,
      categories,
      height,
      aboveHeight,
      belowHeight,
      colorOptions,
      quantities,
      cardImages,
    } = req.body;

    // Validation checks
    if (!name || !displayName || !description || !price || !gst || !discount || !categories || !cardImages || cardImages.length !== 2) {
      return res.status(400).json({error: "All required fields must be filled, including only two card images"});
    }

    // Prepare the new product data
    const productData = {
      createdAt: new Date(),
      name: name.trim(),
      displayName: displayName.trim(),
      description: description.trim(),
      price: parseFloat(price),
      gst: parseFloat(gst),
      discount: parseFloat(discount),
      categories: typeof categories === "string" ? categories.split(",").map((cat) => cat.trim()) : categories,
      cardImages: cardImages, // Array of two card image URLs
      rating: 0, // Default rating
      allImages: [...cardImages],
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

      // Append images from non-height-based colorOptions to allImages
      colorOptions.forEach((option) => {
        if (option.images && Array.isArray(option.images)) {
          productData.allImages = productData.allImages.concat(option.images);
        }
      });
    }

    // Add the product to the "products" collection in Firestore
    const productRef = await db.collection("products").add(productData);

    // Create a subcollection for reviews
    await productRef.collection("reviews").add({
      // add an initial review here if needed, or leave it empty
    });

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

// Get all products
router.get("/allProducts", async (req, res) => {
  try {
    const productsRef = db.collection("products");
    const snapshot = await productsRef.get();

    if (snapshot.empty) {
      return res.status(404).json({message: "No products found"});
    }

    const products = [];
    snapshot.forEach((doc) => {
      products.push({id: doc.id, ...doc.data()});
    });

    // Return the list of products
    return res.status(200).json({products});
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

    // Fetch review references
    const reviewRefsSnapshot = await productRef.collection("reviews").get();
    const reviewIds = reviewRefsSnapshot.docs.map((doc) => doc.id);

    // Fetch actual reviews from the reviews collection
    const reviewsPromises = reviewIds.map((id) =>
      db.collection("reviews").doc(id).get(),
    );
    const reviewDocs = await Promise.all(reviewsPromises);
    const reviews = reviewDocs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Return the product data along with its reviews
    return res.status(200).json({
      id: doc.id,
      ...productData,
      reviews: reviews,
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

    // Validate required fields
    const requiredFields = ["name", "displayName", "description", "price", "gst", "discount", "categories", "cardImages"];
    for (const field of requiredFields) {
      if (updatedProductData[field] === undefined) {
        updatedProductData[field] = currentProductData[field];
      }
    }

    if (!updatedProductData.cardImages || updatedProductData.cardImages.length !== 2) {
      return res.status(400).json({error: "Two card images are required"});
    }

    // Process color options and images
    if (updatedProductData.height !== undefined) {
      // Height-based classification
      if (!updatedProductData.aboveHeight || !updatedProductData.belowHeight) {
        return res.status(400).json({error: "Both aboveHeight and belowHeight data are required for height-based products"});
      }

      // Create unified colorOptions array
      const allColors = new Set([
        ...updatedProductData.aboveHeight.colorOptions.map((c) => JSON.stringify(c)),
        ...updatedProductData.belowHeight.colorOptions.map((c) => JSON.stringify(c)),
      ]);
      updatedProductData.colorOptions = Array.from(allColors).map((c) => JSON.parse(c));

      // Process images for each color
      updatedProductData.colorImages = {};
      for (const color of updatedProductData.colorOptions) {
        const colorName = color.name;
        updatedProductData.colorImages[colorName] = {
          aboveImages: updatedProductData.aboveHeight.colorImages?.[colorName] || [],
          belowImages: updatedProductData.belowHeight.colorImages?.[colorName] || [],
        };
      }
    } else {
      // Non-height-based classification
      if (!updatedProductData.colorOptions || !updatedProductData.sizeOptions || !updatedProductData.quantities) {
        return res.status(400).json({error: "colorOptions, sizeOptions, and quantities are required for non-height-based products"});
      }

      // Process images for each color
      updatedProductData.colorImages = {};
      for (const color of updatedProductData.colorOptions) {
        const colorName = color.name;
        updatedProductData.colorImages[colorName] = color.images || [];
      }
    }

    // Update the product
    await productRef.update(updatedProductData);

    return res.status(200).json({message: "Product updated successfully", updatedProductData});
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({error: "Failed to update product"});
  }
});

module.exports = router;
