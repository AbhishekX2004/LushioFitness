import React, { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import "./AdminComponent.css";
import AddProducts from "./Products/AddProducts";
import EditProducts from "./Products/EditProducts.jsx";
import ChangeBanners from "./Banners/ChangeBanners";
import SendTokens from "./Wallet/SendTokens";
import ViewComplaints from "./Complaints/ViewComplaints";
import AdminControls from "./AdminControls/AdminControls";
import ReviewReviews from "./Reviews/ReviewReviews";
import Coupons from "./Coupons/Coupons";
import OrderLogistics from "./Orders/Logistics/OrderLogistics.jsx"
import OrderManagement from "./Orders/Management/OrderManagement";
import MaintenanceManager from "./Maintenance/MaintenanceManager";

const AdminComponent = () => {
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const adminMenuItems = [
    { key: "AddProducts", label: "Add Products", icon: "+" },
    { key: "EditProducts", label: "Edit Products", icon: "✎" },
    { key: "ReviewReviews", label: "Review Reviews", icon: "★" },
    { key: "Coupons", label: "Coupons", icon: "%" },
    { key: "ChangeBanners", label: "Change Banners", icon: "⬛" },
    { key: "SendTokens", label: "Send Tokens", icon: "◆" },
    { key: "ViewComplaints", label: "View Complaints", icon: "!" },
    { key: "MaintenanceManager", label: "Maintenance", icon: "⚙" },
    { key: "AdminControls", label: "Admin Controls", icon: "⚡" },
    { key: "OrderLogistics", label: "Order Logistics", icon: "📦" },
    { key: "OrderManagement", label: "Order Management", icon: "📋" }
  ];

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    
    if (confirmLogout) {
      setIsLoggingOut(true);
      try {
        await signOut(auth);
        window.location.href = "/";
      } catch (error) {
        console.error("Error signing out:", error);
        alert("Couldn't log out, please try again.");
        setIsLoggingOut(false);
      }
    }
  };

  const handleMenuClick = (componentKey) => {
    setSelectedComponent(componentKey);
  };

  const renderComponent = () => {
    switch (selectedComponent) {
      case "AddProducts":
        return <AddProducts />;
      case "EditProducts":
        return <EditProducts />;
      case "ChangeBanners":
        return <ChangeBanners />;
      case "SendTokens":
        return <SendTokens />;
      case "ViewComplaints":
        return <ViewComplaints />;
      case "AdminControls":
        return <AdminControls />;
      case "ReviewReviews":
        return <ReviewReviews />;
      case "Coupons":
        return <Coupons />;
      case "OrderLogistics":
        return <OrderLogistics />;
      case "OrderManagement":
        return <OrderManagement />;
      case "MaintenanceManager":
        return <MaintenanceManager />;
      default:
        return (
          <div className="admin-welcome">
            <h1 className="admin-welcome-title">Welcome Admin</h1>
            <p className="admin-welcome-subtitle">Select an option from the sidebar to get started</p>
          </div>
        );
    }
  };

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2 className="admin-sidebar-title">Admin Panel</h2>
        </div>
        
        <nav className="admin-sidebar-nav">
          {adminMenuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleMenuClick(item.key)}
              className={`admin-button ${selectedComponent === item.key ? 'admin-button-active' : ''}`}
              aria-label={item.label}
            >
              <span className="admin-button-icon">{item.icon}</span>
              <span className="admin-button-text">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="admin-sidebar-footer">
          <button 
            onClick={handleLogout} 
            className="admin-logout-button"
            disabled={isLoggingOut}
            aria-label="Logout"
          >
            <span className="admin-button-icon">⏻</span>
            <span className="admin-button-text">
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </span>
          </button>
        </div>
      </aside>
      
      <main className="admin-main-content">
        <div className="admin-content-wrapper">
          {renderComponent()}
        </div>
      </main>
    </div>
  );
};

export default AdminComponent;