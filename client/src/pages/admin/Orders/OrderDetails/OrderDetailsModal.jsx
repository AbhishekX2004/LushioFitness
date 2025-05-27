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
                <div className="modal-content loading">
                    <div className="spinner"></div>
                    <p>Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content error" onClick={(e) => e.stopPropagation()}>
                    <div className="error-icon">⚠️</div>
                    <p>Error loading order details</p>
                    <span className="error-message">{error}</span>
                </div>
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

    const getStatusBadge = (status) => {
        const statusClass = status?.toLowerCase().replace(/\s+/g, '-') || 'pending';
        return <span className={`status-badge ${statusClass}`}>{status}</span>;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>Order Details</h2>
                        <span className="order-id">#{details.oid}</span>
                    </div>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="order-summary">
                        <div className="summary-item">
                            <span className="label">Status</span>
                            {getStatusBadge(details.status)}
                        </div>
                        <div className="summary-item">
                            <span className="label">Total Amount</span>
                            <span className="amount">₹{details.payableAmount}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Order Date</span>
                            <span>{new Date(details.dateOfOrder._seconds * 1000).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                            })}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Payment</span>
                            <span>{details.modeOfPayment}</span>
                        </div>
                    </div>

                    <div className="content-grid">
                        <div className="shipping-section">
                            <h3>Shipping Address</h3>
                            <div className="address-card">
                                <div className="address-name">{details.address.name}</div>
                                <div className="address-details">
                                    {details.address.flatDetails}<br />
                                    {details.address.areaDetails}<br />
                                    {details.address.townCity}, {details.address.state}<br />
                                    <strong>{details.address.pinCode}</strong>
                                </div>
                                <div className="contact-info">
                                    📞 +{details.address.contactNo}
                                </div>
                            </div>
                        </div>

                        <div className="products-section">
                            <h3>Products ({orderedProducts.length})</h3>
                            <div className="products-list">
                                {orderedProducts.map((product, index) => (
                                    <div key={index} className="product-card">
                                        <img
                                            src={product.productDetails.cardImages[0]}
                                            alt={product.productName}
                                            className="product-image"
                                        />
                                        <div className="product-info">
                                            <div className="product-name">{product.productName}</div>
                                            <div className="product-variants">
                                                <span className="variant">Size: {product.size}</span>
                                                <span className="variant">Color: {product.color}</span>
                                            </div>
                                            <div className="product-quantity">Qty: {product.quantity}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="action-section">
                        <h3>Actions</h3>
                        <div className="action-buttons">
                            {order.invoice ? (
                                <a
                                    href={order.invoice_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="action-button invoice completed"
                                >
                                    📄 View Invoice
                                </a>
                            ) : (
                                <button
                                    onClick={() => generateInvoice(order.oid)}
                                    className="action-button invoice"
                                >
                                    📄 Generate Invoice
                                </button>
                            )}

                            {order.label ? (
                                <a
                                    href={order.label_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="action-button label completed"
                                >
                                    🏷️ View Label
                                </a>
                            ) : (
                                <button
                                    onClick={() => generateLabel(order.oid)}
                                    className="action-button label"
                                >
                                    🏷️ Generate Label
                                </button>
                            )}

                            <button
                                onClick={() => requestPickup(order.oid)}
                                disabled={order.pickup}
                                className={`action-button pickup ${order.pickup ? 'completed' : ''}`}
                            >
                                🚚 {order.pickup ? 'Pickup Requested' : 'Request Pickup'}
                            </button>

                            {order.manifest ? (
                                <a
                                    href={order.manifest_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="action-button manifest completed"
                                >
                                    📋 View Manifest
                                </a>
                            ) : (
                                <button
                                    onClick={() => generateManifest(order.oid)}
                                    disabled={!order.pickup}
                                    className="action-button manifest"
                                >
                                    📋 Generate Manifest
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;