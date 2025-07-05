import React, { useState, useEffect } from 'react';
import './REModal.css';

const REModal = ({ isOpen, onClose, oid }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [cashMessage, setCashMessage] = useState('');
  const [sendingCash, setSendingCash] = useState(false);
  const [initiatingRefund, setInitiatingRefund] = useState(false);

  const API = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (isOpen && oid) {
      fetchReturnDetails();
    }
  }, [isOpen, oid]);

  const fetchReturnDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/returns/details/${oid}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching return details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCash = async () => {
    if (!cashAmount || !cashMessage) {
      alert('Please fill in both amount and message');
      return;
    }

    setSendingCash(true);
    try {
      const response = await fetch(`${API}/wallet/addCash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: data.customerDetails.uid,
          amount: parseFloat(cashAmount),
          message: cashMessage,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Lushio Cash sent successfully!');
        setShowCashModal(false);
        setCashAmount('');
        setCashMessage('');
      } else {
        alert('Failed to send Lushio Cash');
      }
    } catch (error) {
      console.error('Error sending cash:', error);
      alert('Error sending Lushio Cash');
    } finally {
      setSendingCash(false);
    }
  };

  const handleInitiateRefund = async () => {
    setInitiatingRefund(true);
    try {
      // Add your refund API call here
      alert('Refund initiated successfully!');
    } catch (error) {
      console.error('Error initiating refund:', error);
      alert('Error initiating refund');
    } finally {
      setInitiatingRefund(false);
    }
  };

  const getAllProcessedProducts = () => {
    if (!data || !data.processedProducts) return [];
    
    return [
      ...data.processedProducts.returned || [],
      ...data.processedProducts.exchanged || [],
      ...data.processedProducts.partially_returned || [],
      ...data.processedProducts.partially_exchanged || [],
    ];
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'returned':
        return 'admin-reModal-status-returned';
      case 'exchanged':
        return 'admin-reModal-status-exchanged';
      case 'partially_returned':
        return 'admin-reModal-status-partial-return';
      case 'partially_exchanged':
        return 'admin-reModal-status-partial-exchange';
      default:
        return 'admin-reModal-status-default';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="admin-reModal-overlay">
      <div className="admin-reModal-container">
        <div className="admin-reModal-header">
          <h2 className="admin-reModal-title">Return/Exchange Details</h2>
          <button className="admin-reModal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="admin-reModal-content">
          {loading ? (
            <div className="admin-reModal-loading">Loading...</div>
          ) : data ? (
            <>
              {/* Order Info */}
              <div className="admin-reModal-section">
                <h3 className="admin-reModal-section-title">Order Information</h3>
                <div className="admin-reModal-info-grid">
                  <div className="admin-reModal-info-item">
                    <span className="admin-reModal-label">Order ID:</span>
                    <span className="admin-reModal-value">{data.oid}</span>
                  </div>
                  <div className="admin-reModal-info-item">
                    <span className="admin-reModal-label">Status:</span>
                    <span className="admin-reModal-value">{data.orderDetails.status}</span>
                  </div>
                  <div className="admin-reModal-info-item">
                    <span className="admin-reModal-label">Return Amount:</span>
                    <span className="admin-reModal-value">₹{data.returnAmount.toFixed(2)}</span>
                  </div>
                  <div className="admin-reModal-info-item">
                    <span className="admin-reModal-label">Return Date:</span>
                    <span className="admin-reModal-value">
                      {new Date(data.orderDetails.returnDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="admin-reModal-section">
                <h3 className="admin-reModal-section-title">Customer Information</h3>
                <div className="admin-reModal-info-grid">
                  <div className="admin-reModal-info-item">
                    <span className="admin-reModal-label">Name:</span>
                    <span className="admin-reModal-value">{data.customerDetails.address.name}</span>
                  </div>
                  <div className="admin-reModal-info-item">
                    <span className="admin-reModal-label">Email:</span>
                    <span className="admin-reModal-value">{data.customerDetails.email}</span>
                  </div>
                  <div className="admin-reModal-info-item">
                    <span className="admin-reModal-label">Contact:</span>
                    <span className="admin-reModal-value">+{data.customerDetails.address.contactNo}</span>
                  </div>
                  <div className="admin-reModal-info-item">
                    <span className="admin-reModal-label">Address:</span>
                    <span className="admin-reModal-value">
                      {data.customerDetails.address.flatDetails}, {data.customerDetails.address.areaDetails}, {data.customerDetails.address.townCity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="admin-reModal-section">
                <h3 className="admin-reModal-section-title">Processed Products</h3>
                <div className="admin-reModal-products-list">
                  {getAllProcessedProducts().map((product, index) => (
                    <div key={index} className="admin-reModal-product-card">
                      <div className="admin-reModal-product-image">
                        <img
                          src={product.productDetails.cardImages?.[0] || '/placeholder-image.png'}
                          alt={product.productName}
                          className="admin-reModal-product-img"
                        />
                      </div>
                      <div className="admin-reModal-product-details">
                        <div className="admin-reModal-product-header">
                          <h4 className="admin-reModal-product-name">{product.productName}</h4>
                          <span className={`admin-reModal-status-badge ${getStatusBadgeClass(product.status)}`}>
                            {product.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="admin-reModal-product-info">
                          <div className="admin-reModal-product-spec">
                            <span className="admin-reModal-spec-label">Product ID:</span>
                            <span className="admin-reModal-spec-value">{product.productId}</span>
                          </div>
                          <div className="admin-reModal-product-spec">
                            <span className="admin-reModal-spec-label">Size:</span>
                            <span className="admin-reModal-spec-value">{product.size}</span>
                          </div>
                          <div className="admin-reModal-product-spec">
                            <span className="admin-reModal-spec-label">Color:</span>
                            <span className="admin-reModal-spec-value">{product.color}</span>
                          </div>
                          <div className="admin-reModal-product-spec">
                            <span className="admin-reModal-spec-label">Quantity:</span>
                            <span className="admin-reModal-spec-value">
                              {product.processedQuantity} / {product.originalQuantity}
                            </span>
                          </div>
                          <div className="admin-reModal-product-spec">
                            <span className="admin-reModal-spec-label">Unit Price:</span>
                            <span className="admin-reModal-spec-value">₹{product.unitPrice}</span>
                          </div>
                          <div className="admin-reModal-product-spec">
                            <span className="admin-reModal-spec-label">Reason:</span>
                            <span className="admin-reModal-spec-value admin-reModal-reason">{product.reason}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="admin-reModal-error">Failed to load return details</div>
          )}
        </div>

        <div className="admin-reModal-footer">
          <button
            className="admin-reModal-btn admin-reModal-btn-secondary"
            onClick={() => setShowCashModal(true)}
            disabled={!data}
          >
            Send Lushio Cash
          </button>
          <button
            className="admin-reModal-btn admin-reModal-btn-primary"
            onClick={handleInitiateRefund}
            disabled={!data || initiatingRefund}
          >
            {initiatingRefund ? 'Processing...' : 'Initiate Refund'}
          </button>
        </div>
      </div>

      {/* Cash Modal */}
      {showCashModal && (
        <div className="admin-reModal-cash-overlay">
          <div className="admin-reModal-cash-modal">
            <div className="admin-reModal-cash-header">
              <h3 className="admin-reModal-cash-title">Send Lushio Cash</h3>
              <button
                className="admin-reModal-close-btn"
                onClick={() => setShowCashModal(false)}
              >
                ×
              </button>
            </div>
            <div className="admin-reModal-cash-content">
              <div className="admin-reModal-input-group">
                <label className="admin-reModal-input-label">Amount (₹)</label>
                <input
                  type="number"
                  className="admin-reModal-input"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div className="admin-reModal-input-group">
                <label className="admin-reModal-input-label">Message</label>
                <textarea
                  className="admin-reModal-textarea"
                  value={cashMessage}
                  onChange={(e) => setCashMessage(e.target.value)}
                  placeholder="Enter message"
                  rows="3"
                />
              </div>
            </div>
            <div className="admin-reModal-cash-footer">
              <button
                className="admin-reModal-btn admin-reModal-btn-outline"
                onClick={() => setShowCashModal(false)}
              >
                Cancel
              </button>
              <button
                className="admin-reModal-btn admin-reModal-btn-primary"
                onClick={handleSendCash}
                disabled={sendingCash}
              >
                {sendingCash ? 'Sending...' : 'Send Cash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default REModal;