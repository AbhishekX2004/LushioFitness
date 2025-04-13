import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import EmptyOrder from "./EmptyOrder";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../components/context/UserContext";
import "./order.css";
import OrderDetailsModal from "../admin/OrderDetailsModal";
import RatingModal from "../productDisplay/RatingModal"

function formatDate(seconds) {
  const date = new Date(seconds * 1000);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
export default function Orders() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [pagination, setPagination] = useState({
    hasMore: true,
    lastOrderId: null,
  });
 

  const fetchOrders = async (isInitialLoad = false) => {
    if (loading) return; // Prevent duplicate calls
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/orders`, {
        params: {
          uid: user.uid,
          limit: 5,
          lastOrderId: isInitialLoad ? null : pagination.lastOrderId,
        },
      });

      const { orders: newOrders, pagination: newPagination } = response.data;
  
      setOrders((prevOrders) =>
        isInitialLoad ? newOrders : [...prevOrders, ...newOrders]
      );
      setPagination(newPagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    if (user && orders.length === 0) {
      fetchOrders(true);
    }
  }, [user]); // Only runs when 'user' changes and orders are empty
  
 
 
  const handleCancelOrder = async (orderId) => {
    // Show a confirmation dialog
    const confirmCancel = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmCancel) return; // Exit if the user clicks "Cancel"
  
    setIsCancelling(true);
  
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/orders/cancel`, {
        oid: orderId,
        uid: user.uid,
      });
  
      // Show a success alert after the cancellation
      alert("Order cancelled successfully!");
    } catch (error) {
      console.error(error);
  
      // Show an error alert if the cancellation fails
      alert("Failed to cancel the order. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };
  const handleCancelItem = async (oid,itemId) => {
    const apiUrl = `${process.env.REACT_APP_API_URL}/orders/updateOrder`; // Replace with your API endpoint

    const requestBody = {
      oid: oid,
      uid: user?.uid,
      removedProducts: [itemId],
    };

    try {
      const response = await axios.post(apiUrl, requestBody);
      console.log("Response:", response.data);
      alert("API call successful!");
    } catch (error) {
      console.error("Error making API call:", error);
      alert("API call failed. Check console for details.");
    }
  };

  const handleLoadMore = () => {
    if (pagination.hasMore) {
      fetchOrders();
    }
  };
  if(loading && orders.length===0){
    return (
      <div className="loader-container">
        {" "}
        <span className="loader"></span>
      </div>
    );
  }
  if (orders.length === 0) {
    return <EmptyOrder />;
  }
  return (
    <div className="order-wrapper">
        {isCancelling && (
        <div className="spinner-overlay">
          <div></div>
        </div>
      )}
      <div className="order-title">
        <h2>My Orders</h2>
        <hr />
        {/* <DeliveryStatus/> */}
      </div>

      <div className="orders-container">
        {orders.map((order, index) => (
          <div className="order" key={index}>
            <div className="orderID">
              <strong>Order ID:</strong> {order.orderId}
            </div>

            <div className="order-products">
              {order.orderedProducts.map((product, index) => (
                <div className="product-details" key={index}>
                    <Link to={`/product/${product?.productId}`}>
                    <img
                    src={product.productDetails.cardImages[0]}
                    alt={product.productName}
                    className="product-image"
                  />
                    </Link>
               
                  <div className="product-info">
                    <h3>{product?.productName || product?.name}</h3>
                    <p>
                      <strong>Quantity:</strong> {product.quantity}
                    </p>
                    <p>
                      <strong>Price:</strong> Rs. {product.price}
                    </p>
                    <p>
                      <strong>Size:</strong> {product.size}
                    </p>
                    <p className="product-color">
                      <strong>Color:</strong> {product.color}
                      <span
                      className="color-box"
                      style={{
                      backgroundColor: product.productDetails.colorOptions.find(
                        (color) => color.name === product.color
                        )?.code,
                        }}
                         ></span>

                    </p>
                    {/* Individual Cancel and Rate Us Buttons */}
                    <div className="item-button-container">
                      {
                         order?.orderedProducts?.length>1 &&       <button
                        className="open-rating-button"
                        onClick={() => handleCancelItem(order.orderId,product?.productDetails?.id)}
                      >
                        Cancel
                      </button>
                      }
                
                    
                      <RatingModal productId={product.productDetails.id}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-delivery-address">
              <strong>Shipping Address:</strong>{" "}
              <strong>{order.address.pinCode}</strong>
              {", "}
              {order.address.flatDetails}
              {", "}
              {order.address.areaDetails}
              {", "}
              {order.address.townCity}
              {", "}
              {order.address.state}
              {", "}
              {order.address.country}
            </div>

            <div className="order-delivery">
              <img
                src="/Images/delivery.png"
                alt="Delivery icon"
                className="delivery-icon"
              />
              <span>
                <strong>Order Date: </strong> {formatDate(order.dateOfOrder._seconds)}
              </span>
            </div>
        
            <span className={`order-status ${order.status.toLowerCase()}`}>
              {order.status.toUpperCase()}
            </span>

            <div className="order-button-container">
              {/* Cancel Order Button */}
              <button
                className="open-rating-button"
                onClick={() => handleCancelOrder(order.orderId)}
              >
                Cancel Order
              </button>
              <button
                className="open-rating-button"
                onClick={() => navigate(`/orderInfo/${order.orderId}`)}
              >
                Order Info
              </button>
            </div>
          </div>
        ))}
      </div>
      {pagination.hasMore && (
        <button
          onClick={() => fetchOrders(false)}
          disabled={loading}
          className="order-load-more-button"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
