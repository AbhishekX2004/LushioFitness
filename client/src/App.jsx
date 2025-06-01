import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import axios from "axios";
import { db } from "./firebaseConfig";
import { ToastContainer, Zoom,Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

// Pages
import Home from "./pages/home/Home";
import ProductDisplay from "./pages/productDisplay/ProductDisplay";
import Cart from "./pages/cartItems/CartItems";
import WishList from "./pages/wishlist/WishList";
import User from "./pages/userProfile/User";
import EditProfile from "./pages/userProfile/EditProfile";
import Orders from "./pages/orders/Orders";
import OrderInfo from "./pages/orders/OrderInfo";
import PaymentSuccess from "./pages/orders/PaymentSuccess";
import PaymentFailed from "./pages/orders/PaymentFailure";
import Address from "./pages/userProfile/Address";
import Wallet from "./pages/wallet/Wallet";
import Transaction from "./pages/wallet/Transaction";
import ShopCategory from "./pages/shopCategory/ShopCategory";
import ReferAndEarn from "./pages/ReferAndEarn/ReferAndEarn";
import BuyNow from "./pages/BuyNow/BuyNow";
import Search from "./pages/search/Search";
import About from "./pages/about/About";
import Contact from "./pages/contact/Contact";

// Admin Panel
import AdminPanel from "./pages/admin/AdminPanel";
import BackendAnalytics from "./pages/bakendAnalytics/BackendAnalytics";

// Authentication
import Register from "./pages/login/Register";
import Login from "./pages/login/Login";
import FinishEmailSignUp from "./auth/FinishEmailSignUp";

// Policies
import PrivacyPolicy from "./pages/Policy/PrivacyPolicy";
import TermsAndConditions from "./pages/Policy/TermsAndConditions";
import RefundPolicy from "./pages/Policy/RefundPolicy";
import ShippingPolicy from "./pages/Policy/ShippingPolicy";

// Miscellaneous
import Maintenance from "./pages/Maintenance/Maintenance";
import ServerError from "./pages/Maintenance/ServerError";

// Category Components
import CategoryPage from "./components/CategoryPage";

// Assets
import men_banner from "./components/context/assets/banner_mens.png";
import women_banner from "./components/context/assets/banner_women.png";
import accessories_banner from "./components/context/assets/banner_accessories.jpg";

// CSS
import "./App.css";

function App() {
  const [backend, setBackend] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [backendHealthCheck, setBackendHealthCheck] = useState(null); // null = checking, true = healthy, false = unhealthy
  const [healthCheckAttempts, setHealthCheckAttempts] = useState(0);
  const API = process.env.REACT_APP_API_URL;

  // Configuration for health check retry logic
  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAYS = [2000, 5000, 10000]; // 2s, 5s, 10s
  const REQUEST_TIMEOUT = 10000; // 10 seconds per request

  useEffect(() => {
    // Enhanced backend health check with retry logic
    const checkBackendHealth = async (attemptNumber = 0) => {
      try {
        console.log(`Backend health check attempt ${attemptNumber + 1}/${MAX_RETRY_ATTEMPTS}`);
        
        const response = await axios.get(`${API}/helloWorld`, { 
          timeout: REQUEST_TIMEOUT 
        });
        
        if (response.status === 200) {
          console.log("Backend health check successful");
          setBackendHealthCheck(true);
          setHealthCheckAttempts(attemptNumber + 1);
          return;
        }
      } catch (error) {
        console.error(`Backend health check attempt ${attemptNumber + 1} failed:`, error.message);
        
        // If we haven't exhausted all attempts, retry after delay
        if (attemptNumber < MAX_RETRY_ATTEMPTS - 1) {
          const delay = RETRY_DELAYS[attemptNumber];
          console.log(`Retrying in ${delay / 1000} seconds...`);
          
          setTimeout(() => {
            checkBackendHealth(attemptNumber + 1);
          }, delay);
        } else {
          // All attempts failed
          console.error("All backend health check attempts failed");
          setBackendHealthCheck(false);
          setHealthCheckAttempts(attemptNumber + 1);
        }
      }
    };

    // Start the health check process
    checkBackendHealth();

    // Setup realtime listener for admin engine control using Firestore
    const adminDocRef = doc(db, "controls", "admin");
    const unsubscribeAdmin = onSnapshot(adminDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setAdmin(docSnap.data().engine);
      }
    });

    // Setup realtime listener for backend engine control
    const backendDocRef = doc(db, "controls", "backend");
    const unsubscribeBackend = onSnapshot(backendDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setBackend(docSnap.data().engine);
      }
    });

    // Clean up listeners when component unmounts
    return () => {
      unsubscribeAdmin();
      unsubscribeBackend();
    };
  }, [API]);

  // Show loading state while initial checks are in progress
  if (backend === null || admin === null || backendHealthCheck === null) {
    return (
      <div className="loader-container">
        <span className="loader"></span>
        {backendHealthCheck === null && healthCheckAttempts > 0 && (
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Connecting to server... (Attempt {healthCheckAttempts}/{MAX_RETRY_ATTEMPTS})
          </p>
        )}
      </div>
    );
  }

  // Determine if backend is truly available based on both Firestore flag and API health check
  const isBackendAvailable = backend && backendHealthCheck;

  if (admin) {
    if (!isBackendAvailable) {
      return (
        <BrowserRouter>
          <Routes>
            <Route path="/backendAnalytics" element={<BackendAnalytics />} />
            <Route path="*" element={<ServerError />} />
          </Routes>
        </BrowserRouter>
      );
    }

    return (
      <>
        <BrowserRouter>
          <Navbar />
          <ScrollToTop />
          <ToastContainer
            position="top-center"
            autoClose={3000}
            hideProgressBar
           // closeOnClick={false}
           // pauseOnHover
            draggable
            theme="light"
            transition={Flip}
            toastClassName="custom-toast-success"
            bodyClassName="custom-toast-body"
            closeButton={false}
          />

          <Routes>
            {/* Home and Categories */}
            <Route path="/" element={<Home />} />
            <Route path="/:category/:subCategory" element={<CategoryPage />} />
            <Route
              path="/men"
              element={<ShopCategory banner={men_banner} category="men" />}
            />
            <Route
              path="/women"
              element={<ShopCategory banner={women_banner} category="women" />}
            />
            <Route
              path="/accessories"
              element={
                <ShopCategory
                  banner={accessories_banner}
                  category="accessories"
                />
              }
            />
            <Route path="/search" element={<Search />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/* Authentication */}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/finishSignIn" element={<FinishEmailSignUp />} />

            {/* Product Details */}
            <Route path="/product/:productID" element={<ProductDisplay />} />

            {/* Cart and Wishlist */}
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<WishList />} />

            {/* User Section */}
            <Route path="/user" element={<User />} />
            <Route path="/user-editProfile" element={<EditProfile />} />
            <Route path="/user/orders" element={<Orders />} />
            <Route path="/user-address" element={<Address />} />
            <Route path="/user-referAndEarn" element={<ReferAndEarn />} />

            {/* Wallet and Orders */}
            <Route path="/wallet" element={<Wallet />} />
            <Route
              path="/wallet/transactions/:type"
              element={<Transaction />}
            />
            <Route path="/orderInfo/:orderId" element={<OrderInfo />} />
            <Route path="/buyNow" element={<BuyNow />} />

            {/* Policies */}
            <Route path="/privacyPolicy" element={<PrivacyPolicy />} />
            <Route path="/termAndConditions" element={<TermsAndConditions />} />
            <Route path="/refundPolicy" element={<RefundPolicy />} />
            <Route path="/shippingPolicy" element={<ShippingPolicy />} />

            {/* Payment Status */}
            <Route path="/paymentStatus" element={<PaymentSuccess />} />
            <Route path="/paymentFailed" element={<PaymentFailed />} />

            {/* Admin Panel */}
            <Route path="/lushioGods" element={<AdminPanel />} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/lushioGods" element={<AdminPanel />} />
        <Route path="*" element={<Maintenance />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;