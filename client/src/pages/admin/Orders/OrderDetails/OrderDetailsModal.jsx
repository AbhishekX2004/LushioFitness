import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OrderDetailsModal.css';

const API = process.env.REACT_APP_API_URL;

const OrderDetailsModal = ({ order: initialOrder, onClose, ...props }) => {
    const [order, setOrder] = useState(initialOrder);
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await axios.get(`${API}/orderAdmin/fetch/${order.oid}`);
                setOrderDetails(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchOrderDetails();
    }, [order.oid]);

    if (loading) {
        return (
            <div className="modal-overlay">
                <div className="modal-content loading">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="modal-overlay">
                <div className="modal-content error">Error: {error}</div>
            </div>
        );
    }

    if (!orderDetails) return null;

    const { order: details, orderedProducts } = orderDetails;

    const generateInvoice = async (orderId) => {
        try {
            const response = await axios.post(`${API}/orderAdmin/invoice`, { oid: orderId });
            setOrder(prev => ({ ...prev, invoice: true, invoice_url: response.data.invoice_url }));
            window.open(response.data.invoice_url, '_blank');
        } catch (err) {
            setError(err.message);
        }
    };

    const generateManifest = async (orderId) => {
        try {
            const response = await axios.post(`${API}/orderAdmin/manifest`, { oid: orderId });
            setOrder(prev => ({ ...prev, manifest: true, manifest_url: response.data.manifest_url }));
            window.open(response.data.manifest_url, '_blank');
        } catch (err) {
            setError(err.message);
        }
    };

    const generateLabel = async (orderId) => {
        try {
            const response = await axios.post(`${API}/orderAdmin/label`, { oid: orderId });
            setOrder(prev => ({ ...prev, label: true, label_url: response.data.label_url }));
            window.open(response.data.label_url, '_blank');
        } catch (err) {
            setError(err.message);
        }
    };

    const requestPickup = async (orderId) => {
        try {
            await axios.post(`${API}/orderAdmin/pickup`, { oid: orderId });
            setOrder(prev => ({ ...prev, pickup: true }));
        } catch (err) {
            setError(err.message);
        }
    };

    const actionButtons = (
        <div className="admin-action-buttons">
          {order.invoice ? (
            <a
              href={order.invoice_url}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-action-button invoice"
            >
              Print Invoice
            </a>
          ) : (
            <button
              onClick={() => generateInvoice(order.oid)}
              className="admin-action-button invoice"
            >
              Generate Invoice
            </button>
          )}
    
          {order.label ? (
            <a
              href={order.label_url}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-action-button label"
            >
              Print Label
            </a>
          ) : (
            <button
              onClick={() => generateLabel(order.oid)}
              className="admin-action-button label"
            >
              Generate Label
            </button>
          )}
    
          <button
            onClick={() => requestPickup(order.oid)}
            disabled={order.pickup}
            className="admin-action-button pickup"
          >
            Request Pickup
          </button>
    
          {order.manifest ? (
            <a
              href={order.manifest_url}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-action-button manifest"
            >
              Print Manifest
            </a>
          ) : (
            <button
              onClick={() => generateManifest(order.oid)}
              disabled={!order.pickup}
              className="admin-action-button manifest"
            >
              Generate Manifest
            </button>
          )}
        </div>
      );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content"  onClick={(e) => e.stopPropagation()} >
                <div className="modal-header">
                    <h2>Order Details</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="order-info-grid">
                        <div className="info-section">
                            <h3>Order Information</h3>
                            <p>Order ID: {details.oid}</p>
                            <p>Order Date: {new Date(details.dateOfOrder._seconds * 1000).toLocaleDateString()}</p>
                            <p>Status: {details.status}</p>
                            <p>Total Amount: ₹{details.totalAmount}</p>
                            <p>Payment Mode: {details.modeOfPayment}</p>
                        </div>

                        <div className="info-section">
                            <h3>Shipping Address</h3>
                            <p>{details.address.name}</p>
                            <p>{details.address.flatDetails}</p>
                            <p>{details.address.areaDetails}</p>
                            <p>{details.address.townCity}, {details.address.state}</p>
                            <p>{details.address.pinCode}</p>
                            <p>Phone: {details.address.contactNo}</p>
                        </div>
                    </div>

                    <div className="admin-products-section">
                        <h3>Products</h3>
                        {orderedProducts.map((product, index) => (
                            <div key={index} className="admin-product-card">
                                <div className="admin-product-info">
                                    <img
                                        src={product.productDetails.cardImages[0]}
                                        alt={product.productName}
                                        className="admin-product-image"
                                    />
                                    <div className="admin-product-details">
                                        <p className="admin-product-name">{product.productName}</p>
                                        <p>Size: {product.size}</p>
                                        <p>Color: {product.color}</p>
                                        <p>Quantity: {product.quantity}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {actionButtons}                                                                               
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;