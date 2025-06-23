import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./PaymentSuccess.css";

const PaymentStatus = () => {
  const navigate = useNavigate();

  return (
    <div className="payment-status-container">
      <div className="order-success">
        <FaCheckCircle className="success-icon" />
        <h1 className="order-success-text">Order Placed Successfully!</h1>
      </div>
        <p >
              You'll receive a confirmation email shortly
            </p>
      <div className="button-group">
      
        <button className="view-order-button" onClick={() => navigate("/user/orders")}>
          View Order
        </button>
        <button className="continue-shopping-button" onClick={() => navigate("/")}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default PaymentStatus;
