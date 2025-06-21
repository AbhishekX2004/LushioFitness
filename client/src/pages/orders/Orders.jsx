import React, { useState, useEffect,useContext } from 'react';
import { Calendar, Package, Clock, Filter, ChevronDown, Loader2, AlertCircle,MapPin } from 'lucide-react';
import { Link,useNavigate } from "react-router-dom";
import axios from 'axios';
import { UserContext } from "../../components/context/UserContext";
import { toast } from 'react-toastify';
import RatingModal from '../productDisplay/RatingModal';
import "./order.css"
import "./sortedOrders.css"
// Separate CSS styles


const OrdersDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('');
  const [limit, setLimit] = useState(5);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(null);
const {user} = useContext(UserContext);
  const navigate = useNavigate();
  const [isCancelling, setIsCancelling] = useState(false);
  const getTimeRangeOptions = () => {
  const options = [
    { value: '', label: 'All Time' },
    { value: '1W', label: 'Last Week' },
    { value: '2W', label: 'Last 2 Weeks' },
    { value: '1M', label: 'Last Month' },
    { value: '3M', label: 'Last 3 Months' },
    { value: '6M', label: 'Last 6 Months' },
    { value: '1Y', label: 'Last Year' },
  ];

  const startYear = 2025; //  Replace this with database start year
  const currentYear = new Date().getFullYear();

  for (let year = currentYear; year >= startYear; year--) {
    options.push({
      value: `Year${year}`,
      label: `Year ${year}`,
    });
  }

  return options;
};

// usage
const timeRangeOptions = getTimeRangeOptions();


  const fetchOrders = async (isLoadMore = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        uid: user?.uid,
        limit: limit.toString(),
      });

      if (timeRange) params.append('timeRange', timeRange);
      if (isLoadMore && lastOrderId) params.append('lastOrderId', lastOrderId);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/orders?${params}`);
      const data = await response.json();

    //   if (!response.ok) {
    //     throw new Error(data.message || 'Failed to fetch orders');
    //   }

      if (isLoadMore) {
        setOrders(prev => [...prev, ...data.orders]);
      } else {
        setOrders(data.orders);
      }

      setHasMore(data.pagination.hasMore);
      setLastOrderId(data.pagination.lastOrderId);
      setAppliedFilters(data.appliedFilters);
    } catch (err) {
      setError(err.message);
      if (!isLoadMore) {
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    setLastOrderId(null);
    fetchOrders(false);
  };

  const handleLoadMore = () => {
    fetchOrders(true);
  };

const formatDate = (timestamp) =>{
  const milliseconds = timestamp._seconds * 1000 + Math.floor(timestamp._nanoseconds / 1_000_000);
  const date = new Date(milliseconds);

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'status-badge status-completed';
      case 'cancelled': return 'status-badge status-cancelled';
      default: return 'status-badge status-pending';
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);
 const sendEmail = async (orderId, orderedProducts) => {
    try {
      const payload = {
        email: user.email,
        name: user.displayName || "User",
        type: "cancel",
        orderId: orderId,
        //  address: orderDetails.email,
        items: orderedProducts,
        // item: items[0]?.name || '', // fallback for 'cancel' single item
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/sendEmail`, payload);
    } catch (err) {
      console.error("Error:", err);
    }
  };
   const handleCancelOrder = async (orderId, orderedProducts) => {
    // Show a confirmation dialog
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this order?"
    );
    if (!confirmCancel) return; // Exit if the user clicks "Cancel"

    setIsCancelling(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/orders/cancel`,
        {
          oid: orderId,
          uid: user.uid,
        }
      );
      if (response.status === 200) {
        await sendEmail(orderId, orderedProducts);
      }

      toast.success("Order cancelled successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to cancel the order. Please try again.", {
        className: "custom-toast-error",
      });
    } finally {
      setIsCancelling(false);
    }
  };
  return (
    <>
     {isCancelling && (
        <div className="spinner-overlay">
          <div></div>
        </div>
      )}
      <div className="orders-dashboard">
        {/* <div className="dashboard-header">
          <h1 className="dashboard-title">Orders Dashboard</h1>
          <p className="dashboard-subtitle">Manage and track your order history</p>
        </div> */}

        <div className="controls-section">
          <div className="controls-grid">
            <div className="form-group">
              <label className="order-label">
                <Filter size={12} style={{ display: 'inline', marginRight: '6px' }} />
                Time Range Filter
              </label>
              <div className="select-wrapper">
                <select
                  className="select"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  {timeRangeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-icon" size={20} />
              </div>
            </div>

            <div className="form-group">
              <label className="order-label">Orders to display</label>
              <div className="select-wrapper">
                <select
                  className="select"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  // style={{ minWidth: '120px' }}
                >
                  <option value={5}>5 orders</option>
                  <option value={10}>10 orders</option>
                  <option value={20}>20 orders</option>
                  <option value={50}>50 orders</option>
                </select>
                <ChevronDown className="select-icon" size={20} />
              </div>
            </div>

            <button
              className="order-filter-button"
              onClick={handleFilterChange}
              disabled={loading}
            >
              {loading ? <Loader2 className="loading-spinner" size={16} /> : <Filter size={16} />}
              {/* <Filter size={16} /> */}
              Apply Filters
            </button>
          </div>
        </div>

        {appliedFilters && appliedFilters.timeRange !== 'all' && (
          <div className="filters-info">
            <Calendar className="filters-info-icon" size={20} />
            <span className="filters-info-text">
  Showing orders from {appliedFilters.startDate 
    ? new Date(appliedFilters.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : 'start'} 
  {' '}to {appliedFilters.endDate 
    ? new Date(appliedFilters.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : 'now'}
</span>

          </div>
        )}

        {error && (
          <div className="error-container">
            <AlertCircle className="error-icon" size={24} />
            <div>Error: {error}</div>
          </div>
        )}

        <div className="orders-container">
          <div className="orders-header">
            <Package size={24} />
            <h2>Your Orders</h2>
            {orders.length > 0 && (
              <span className="orders-count">{orders.length} orders</span>
            )}
          </div>

          {loading && orders.length === 0 ? (
            <div className="loading-container">
              <Loader2 className="loading-spinner" size={32} />
              <p>Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <Package className="empty-state-icon" size={48} />
              <h3>No orders found</h3>
              <p>Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <div className="orders-container">
              {orders.map((order) => (
                <div key={order.orderId} className="order">
                  <div className="order-header">
                    <span className="order-id">Order ID: {order.orderId}</span>
                    <div className="order-date">
                      <Clock size={14} />
                      {formatDate(order.dateOfOrder)}
                    </div>
                  </div>

                  <div className="order-details">
                    <div className="order-detail-item">
                      <span className="detail-label">Total Amount</span>
                      <span className="detail-value">₹{order.payableAmount
 || 'N/A'}</span>
                    </div>
                    {/* <div className="detail-item">
                      <span className="detail-label">Status</span>
                      <span className={getStatusBadgeClass(order.status)}>
                        {order.status || 'Pending'}
                      </span>
                    </div> */}
                    <div className="order-detail-item">
                      <span className="detail-label">Items</span>
                      <span className="detail-value">{order.orderedProducts?.length || 0} items</span>
                    </div>
                  </div>

                  {order.orderedProducts && order.orderedProducts.length > 0 && (
                    <div className="products-section">
                      <div className="products-header">
                        <Package size={16} />
                        Ordered Products
                      </div>
                      <div className="ordered-products-list">
                        {order.orderedProducts.map((product,index) => (

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
                                              <strong>Price:</strong> ₹
                                              {product.productDetails.discountedPrice} x{" "}
                                              {product.quantity} = ₹
                                              {product.productDetails.discountedPrice *
                                                product.quantity}
                                            </p>
                                            <p>
                                              <strong>Quantity:</strong> {product.quantity}
                                            </p>
                                            <p>
                                              <strong>Height:</strong> {product.heightType}
                                            </p>
                                            <p>
                                              <strong>Size:</strong> {product.size}
                                            </p>
                        
                                            <p className="product-color">
                                              <strong>Color:</strong> {product.color}
                                              <span
                                                className="color-box"
                                                style={{
                                                  backgroundColor:
                                                    product.productDetails.colorOptions.find(
                                                      (color) => color.name === product.color
                                                    )?.code,
                                                }}
                                              ></span>
                                            </p>
                                            {/* Individual Cancel and Rate Us Buttons */}
                                            <div className="item-button-container">
                                              {/* {order?.orderedProducts?.length > 1 && (
                                                <button
                                                  className="open-rating-button"
                                                //   onClick={() =>
                                                //     handleCancelItem(
                                                //       order.orderId,
                                                //       product?.productDetails?.id
                                                //     )
                                                //   }
                                                >
                                                  Cancel
                                                </button>
                                              )} */}
                        
                                              <RatingModal productId={product.productDetails.id} />
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                        
                      </div>
                    </div>
                  )}
  
             {/* <span className={getStatusBadgeClass(order.status)}>
                        {order.status || 'Pending'}
                      </span> */}
                    <div className="order-delivery-address">
                        <MapPin size={14} />
              <strong> Shipping Address:</strong>{" "}
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

            <span className={`order-status ${order.status.toLowerCase()}`}>
              {order.status.toUpperCase()}
            </span>
                       <div className="order-button-container">
              {/* Cancel Order Button */}
              <button
                className="open-rating-button"
                onClick={() =>
                  handleCancelOrder(order.orderId, order.orderedProducts)
                }
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
          )}

          {hasMore && (
            <div className="pagination">
              <button
               // className="btn btn-secondary"
                className="order-load-more-button"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {/* {!loading ? <Loader2 className="loading-spinner" size={16} /> : null} */}
                         {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrdersDashboard;