import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebaseConfig";

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

  useEffect(() => {
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
  }, []);

  if (backend === null || admin === null) {
    return <div className="loader-container"> <span className="loader"></span></div>;
  }

  if (admin) {
    if (!backend) {
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
          <Routes>
            {/* Home and Categories */}
            <Route path="/" element={<Home />} />
            <Route path="/:category/:subCategory" element={<CategoryPage />} />
            <Route path="/men" element={<ShopCategory banner={men_banner} category="men" />} />
            <Route path="/women" element={<ShopCategory banner={women_banner} category="women" />} />
            <Route path="/accessories" element={<ShopCategory banner={accessories_banner} category="accessories" />} />
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
            <Route path="/wallet/transactions/:type" element={<Transaction />} />
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
        <Route path="*" element={<Maintenance/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
