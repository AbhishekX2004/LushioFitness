import React, { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import "./AdminComponent.css";
import AddProducts from "./AddProducts";
import EditProducts from "./EditProducts.jsx";
import ChangeBanners from "./ChangeBanners";
import SendTokens from "./SendTokens";
import ViewComplaints from "./ViewComplaints";
import AdminControls from "./AdminControls";
import ReviewReviews from "./ReviewReviews";
import Coupons from "./Coupons";
import OrderLogistics from "./OrderLogistics"
import OrderManagement from "./OrderManagement.jsx";
import MaintenanceManager from "./MaintenanceManager.jsx";

const AdminComponent = () => {
  const [selectedComponent, setSelectedComponent] = useState(null);

  const handleLogout = () => {
    // Add confirmation dialog
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    
    if (confirmLogout) {
      signOut(auth)
        .then(() => {
          window.location.href = "/";
        })
        .catch((error) => {
          console.error("Error signing out:", error);
          alert("Couldn't Log out, please try again.");
        });
    }
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
        return <h1>Welcome Admin</h1>;
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <button onClick={() => setSelectedComponent("AddProducts")} className="admin-button">
          Add Products
        </button>
        <button onClick={() => setSelectedComponent("EditProducts")} className="admin-button">
          Edit Products
        </button>
        <button onClick={() => setSelectedComponent("ReviewReviews")} className="admin-button">
          Review Reviews
        </button>
        <button onClick={() => setSelectedComponent("Coupons")} className="admin-button">
          Coupons
        </button>
        <button onClick={() => setSelectedComponent("ChangeBanners")} className="admin-button">
          Change Banners
        </button>
        <button onClick={() => setSelectedComponent("SendTokens")} className="admin-button">
          Send Tokens
        </button>
        <button onClick={() => setSelectedComponent("ViewComplaints")} className="admin-button">
          View Complaints
        </button>
        <button onClick={() => setSelectedComponent("MaintenanceManager")} className="admin-button">
          Maintenance
        </button>
        <button onClick={() => setSelectedComponent("AdminControls")} className="admin-button">
          Admin Controls
        </button>
        <button onClick={() => setSelectedComponent("OrderLogistics")} className="admin-button">
          Order Logistics
        </button>
        <button onClick={() => setSelectedComponent("OrderManagement")} className="admin-button">
          Order Management
        </button>
        <button onClick={handleLogout} className="admin-logout-button">
          Logout
        </button>
      </div>
      <div className="admin-main-content">
        {renderComponent()}
      </div>
    </div>
  );
};

export default AdminComponent;
