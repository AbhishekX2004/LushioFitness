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
            <div className="admin-orderDetails-modal-overlay">
                <div className="admin-orderDetails-modal-content admin-orderDetails-modal-loading">
                    <div className="admin-orderDetails-modal-spinner"></div>
                    <p>Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-orderDetails-modal-overlay" onClick={onClose}>
                <div className="admin-orderDetails-modal-content admin-orderDetails-modal-error" onClick={(e) => e.stopPropagation()}>
                    <div className="admin-orderDetails-modal-error-icon">⚠️</div>
                    <p>Error loading order details</p>
                    <span className="admin-orderDetails-modal-error-message">{error}</span>
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
        return <span className={`admin-orderDetails-modal-status-badge admin-orderDetails-modal-${statusClass}`}>{status}</span>;
    };

    return (
        <div className="admin-orderDetails-modal-overlay" onClick={onClose}>
            <div className="admin-orderDetails-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="admin-orderDetails-modal-header">
                    <div>
                        <h2>Order Details</h2>
                        <span className="admin-orderDetails-modal-order-id">#{details.oid}</span>
                    </div>
                    <button className="admin-orderDetails-modal-close-button" onClick={onClose}>×</button>
                </div>

                <div className="admin-orderDetails-modal-body">
                    <div className="admin-orderDetails-modal-order-summary">
                        <div className="admin-orderDetails-modal-summary-item">
                            <span className="admin-orderDetails-modal-label">Status</span>
                            {getStatusBadge(details.status)}
                        </div>
                        <div className="admin-orderDetails-modal-summary-item">
                            <span className="admin-orderDetails-modal-label">Total Amount</span>
                            <span className="admin-orderDetails-modal-amount">₹{details.payableAmount}</span>
                        </div>
                        <div className="admin-orderDetails-modal-summary-item">
                            <span className="admin-orderDetails-modal-label">Order Date</span>
                            <span>{new Date(details.dateOfOrder._seconds * 1000).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                            })}</span>
                        </div>
                        <div className="admin-orderDetails-modal-summary-item">
                            <span className="admin-orderDetails-modal-label">Payment</span>
                            <span>{details.modeOfPayment}</span>
                        </div>
                    </div>

                    <div className="admin-orderDetails-modal-content-grid">
                        <div className="admin-orderDetails-modal-shipping-section">
                            <h3>Shipping Address</h3>
                            <div className="admin-orderDetails-modal-address-card">
                                <div className="admin-orderDetails-modal-address-name">{details.address.name}</div>
                                <div className="admin-orderDetails-modal-address-details">
                                    {details.address.flatDetails}<br />
                                    {details.address.areaDetails}<br />
                                    {details.address.townCity}, {details.address.state}<br />
                                    <strong>{details.address.pinCode}</strong>
                                </div>
                                <div className="admin-orderDetails-modal-contact-info">
                                    📞 +{details.address.contactNo}
                                </div>
                            </div>
                        </div>

                        <div className="admin-orderDetails-modal-products-section">
                            <h3>Products ({orderedProducts.length})</h3>
                            <div className="admin-orderDetails-modal-products-list">
                                {orderedProducts.map((product, index) => (
                                    <div key={index} className="admin-orderDetails-modal-product-card">
                                        <img
                                            src={product.productDetails.cardImages[0]}
                                            alt={product.productName}
                                            className="admin-orderDetails-modal-product-image"
                                        />
                                        <div className="admin-orderDetails-modal-product-info">
                                            <div className="admin-orderDetails-modal-product-name">{product.productName}</div>
                                            <div className="admin-orderDetails-modal-product-variants">
                                                <span className="admin-orderDetails-modal-variant">Size: {product.size}</span>
                                                <span className="admin-orderDetails-modal-variant">Color: {product.color}</span>
                                            </div>
                                            <div className="admin-orderDetails-modal-product-quantity">Qty: {product.quantity}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="admin-orderDetails-modal-action-section">
                        <h3>Actions</h3>
                        <div className="admin-orderDetails-modal-action-buttons">
                            {order.invoice ? (
                                <a
                                    href={order.invoice_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="admin-orderDetails-modal-action-button admin-orderDetails-modal-invoice admin-orderDetails-modal-completed"
                                >
                                    📄 View Invoice
                                </a>
                            ) : (
                                <button
                                    onClick={() => generateInvoice(order.oid)}
                                    className="admin-orderDetails-modal-action-button admin-orderDetails-modal-invoice"
                                >
                                    📄 Generate Invoice
                                </button>
                            )}

                            {order.label ? (
                                <a
                                    href={order.label_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="admin-orderDetails-modal-action-button admin-orderDetails-modal-label admin-orderDetails-modal-completed"
                                >
                                    🏷️ View Label
                                </a>
                            ) : (
                                <button
                                    onClick={() => generateLabel(order.oid)}
                                    className="admin-orderDetails-modal-action-button admin-orderDetails-modal-label"
                                >
                                    🏷️ Generate Label
                                </button>
                            )}

                            <button
                                onClick={() => requestPickup(order.oid)}
                                disabled={order.pickup}
                                className={`admin-orderDetails-modal-action-button admin-orderDetails-modal-pickup ${order.pickup ? 'admin-orderDetails-modal-completed' : ''}`}
                            >
                                🚚 {order.pickup ? 'Pickup Requested' : 'Request Pickup'}
                            </button>

                            {order.manifest ? (
                                <a
                                    href={order.manifest_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="admin-orderDetails-modal-action-button admin-orderDetails-modal-manifest admin-orderDetails-modal-completed"
                                >
                                    📋 View Manifest
                                </a>
                            ) : (
                                <button
                                    onClick={() => generateManifest(order.oid)}
                                    disabled={!order.pickup}
                                    className="admin-orderDetails-modal-action-button admin-orderDetails-modal-manifest"
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