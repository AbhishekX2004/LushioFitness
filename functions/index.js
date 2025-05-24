/* eslint-disable max-len */
const {initializeApp} = require("firebase-admin/app");
const {onRequest} = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
// const logger = require("firebase-functions/logger");

// Initialize Firebase Admin
// initializeApp({
//   storageBucket: "lushio-fitness.appspot.com",
// });
initializeApp();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({origin: true}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// ENV setup
const envPath = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
require("dotenv-safe").config({
  path: envPath,
  allowEmptyValues: true,
  example: ".env",
});

// Mini Debugging
// logger.log("Loaded NODE_ENV:", process.env.NODE_ENV);
// logger.log("Using env file:", path);
// logger.log("Loaded API URL:", process.env.REACT_APP_API_URL);
// logger.log("Loaded Frontend URL:", process.env.REACT_APP_FRONTEND_URL);

// Extreme Debugging
// logger.log("Loaded environment variables:", process.env);

// Import routes
const helloWorldRoute = require("./routes/helloWorld.js");
const userRoutes = require("./routes/users.js");
const productsRoute = require("./routes/products.js");
const reviewRoute = require("./routes/reviews.js");
const walletRoute = require("./routes/wallet.js");
const cartRoute = require("./routes/cart.js");
const wishlistRoute = require("./routes/wishlist.js");
const productFilterRoute = require("./routes/productFilters.js");
const getQtyRoute = require("./routes/getQty.js");
const couponRoute = require("./routes/coupons.js");
const subscribeRoute = require("./routes/subscribe.js");
const getCategoriesRoute = require("./routes/categories.js");
const ordersRoute = require("./routes/orders/orders.js");
const pickupRoute = require("./routes/orders/pickups.js");
const paymentRoute = require("./routes/payment.js");
const adminOrderRoute = require("./routes/orders/admin.js");
const courierServicabilityRoute = require("./routes/orders/courierServicability.js");
const returnsRoute = require("./routes/orders/returns.js");
const trackRoute = require("./routes/orders/tracking.js");
const searchRoute = require("./routes/search.js");
const emailRoute = require("./routes/emailRoutes");
const exchangeRoute = require("./routes/orders/exchange.js");
const transactionsRoute = require("./routes/transactions.js");
const returnExchangeRoute = require("./routes/orders/returnExchange.js");
const bannerRoute = require("./routes/banners.js");

// Use routes
app.use("/helloWorld", helloWorldRoute);
app.use("/user", userRoutes);
app.use("/products", productsRoute);
app.use("/filters", productFilterRoute);
app.use("/getQty", getQtyRoute);
app.use("/reviews", reviewRoute);
app.use("/wallet", walletRoute);
app.use("/cart", cartRoute);
app.use("/wishlist", wishlistRoute);
app.use("/coupon", couponRoute);
app.use("/subscribe", subscribeRoute);
app.use("/subCategories", getCategoriesRoute);
app.use("/orders", ordersRoute);
app.use("/pickup", pickupRoute);
app.use("/payment", paymentRoute);
app.use("/orderAdmin", adminOrderRoute);
app.use("/couriers", courierServicabilityRoute);
app.use("/returns", returnsRoute);
app.use("/track", trackRoute);
app.use("/search", searchRoute);
app.use("/sendEmail", emailRoute);
app.use("/exchange", exchangeRoute);
app.use("/transactions", transactionsRoute);
app.use("/returnExchange", returnExchangeRoute);
app.use("/banners", bannerRoute);

// Import and use webhooks
const webhook = require("./webhooks/shiprocket.js");
app.use("/webhook", webhook);

// Export API
exports.api = onRequest(app);

// Import and export cloud functions
exports.generateReferralCode = require("./cloudFunctions/generateReferralCode.js");
exports.coinsToReferred = require("./cloudFunctions/coinsToReferred.js");

// Import and export cron jobs
exports.assignBirthdayCoins = require("./cronjobs/birthdayAnniversaryCoins.js").assignBirthdayCoins;
exports.assignAnniversaryCoins = require("./cronjobs/birthdayAnniversaryCoins.js").assignAnniversaryCoins;
exports.assignAccountAgeCoins = require("./cronjobs/accountAgeCoins.js");
exports.removeExpiredCoins = require("./cronjobs/expireCoins.js");
