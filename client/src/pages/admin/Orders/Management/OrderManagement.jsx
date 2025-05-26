import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./OrderManagement.css";
import OrderDetailsModal from '../OrderDetails/OrderDetailsModal';

const API = process.env.REACT_APP_API_URL;

const OrderManagement = () => {
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [limit, setLimit] = useState(10);
  const [lastDoc, setLastDoc] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "pickup_scheduled", label: "Pickup Scheduled" },
    { value: "manifest_generated", label: "Manifest Generated" },
    { value: "label_generated", label: "Label Generated" },
    { value: "invoice_generated", label: "Invoice Generated" }
  ];

  const fetchOrders = async (isLoadMore = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      if (isLoadMore && lastDoc) params.append('lastDoc', lastDoc);
      params.append('limit', limit);

      const response = await axios.get(`${API}/orderAdmin/fetch?${params.toString()}`);
      const newOrders = response.data.orders;

      if (isLoadMore) {
        setOrders(prev => [...prev, ...newOrders]);
      } else {
        setOrders(newOrders);
      }

      setHasMore(response.data.hasMore);
      setLastDoc(response.data.lastDoc);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setLastDoc(null);
    fetchOrders();
  }, [status, fromDate, toDate, limit]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchOrders(true);
    }
  };

  const generateLabel = async (orderId) => {
    try {
      const response = await axios.post(`${API}/orderAdmin/label`, { oid: orderId });
      const updatedOrders = orders.map(order =>
        order.oid === orderId ? { ...order, label: true, label_url: response.data.label_url } : order
      );
      setOrders(updatedOrders);
    } catch (err) {
      setError(err.message);
    }
  };

  const generateManifest = async (orderId) => {
    try {
      const response = await axios.post(`${API}/orderAdmin/manifest`, { oid: orderId });
      const updatedOrders = orders.map(order =>
        order.oid === orderId ? { ...order, manifest: true, manifest_url: response.data.manifest_url } : order
      );
      setOrders(updatedOrders);
    } catch (err) {
      setError(err.message);
    }
  };

  const generateInvoice = async (orderId) => {
    try {
      const response = await axios.post(`${API}/orderAdmin/invoice`, { oid: orderId });
      const updatedOrders = orders.map(order =>
        order.oid === orderId ? { ...order, invoice: true, invoice_url: response.data.invoice_url } : order
      );
      setOrders(updatedOrders);
    } catch (err) {
      setError(err.message);
    }
  };

  const requestPickup = async (orderId) => {
    try {
      await axios.post(`${API}/orderAdmin/pickup`, { oid: orderId });
      const updatedOrders = orders.map(order =>
        order.oid === orderId ? { ...order, pickup: true } : order
      );
      setOrders(updatedOrders);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="om-container">
      <h1 className="om-title">Order Management</h1>

      <div className="om-filters">
        <div className="om-filter-item">
          <label htmlFor="status" className="om-filter-label">
            Status
          </label>
          <select
            id="status"
            className="om-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="om-filter-item">
          <label htmlFor="fromDate" className="om-filter-label">
            From Date
          </label>
          <input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="om-input"
          />
        </div>

        <div className="om-filter-item">
          <label htmlFor="toDate" className="om-filter-label">
            To Date
          </label>
          <input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="om-input"
          />
        </div>

        <div className="om-filter-item">
          <label htmlFor="limit" className="om-filter-label">
            Results Limit
          </label>
          <input
            id="limit"
            type="number"
            min="1"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            placeholder="Limit"
            className="om-input"
          />
        </div>
      </div>

      <div className="om-orders-container">
        {isLoading && orders.length === 0 ? (
          <p className="om-message">Loading orders...</p>
        ) : error ? (
          <p className="om-message om-error">{error}</p>
        ) : orders.length === 0 ? (
          <p className="om-message">No orders found</p>
        ) : (
          <>
            {orders.map((order) => (
              <div key={order.oid} className="om-order-card">
                <div className="om-order-header">
                  <div className="om-order-id">
                    <strong>Order ID</strong>: {order.oid}<br/>
                    <strong>Status</strong>: {order.status}
                    {order.isExchange && (
                      <span className="om-exchange-badge">Exchange</span>
                    )}
                  </div>
                  <div className="om-order-actions">
                    {/* <button
                      onClick={() => requestPickup(order.oid)}
                      disabled={order.pickup}
                      className="om-action om-pickup"
                    >
                      Request Pickup
                    </button> */}

                    {/* {order.manifest ? ( */}
                    {order.manifest && (
                      <a
                        href={order.manifest_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="om-action om-manifest"
                      >
                        Print Manifest
                      </a>
                    )}
                    {/* ) : (
                      <button
                        onClick={() => generateManifest(order.oid)}
                        disabled={!order.pickup}
                        className="om-action om-manifest"
                      >
                        Generate Manifest
                      </button>
                    )} */}

                    {/* {order.label ? ( */}
                    {order.label && (
                      <a
                        href={order.label_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="om-action om-label"
                      >
                        Print Label
                      </a>
                    )}
                    {/* ) : (
                      <button
                        onClick={() => generateLabel(order.oid)}
                        className="om-action om-label"
                      >
                        Generate Label
                      </button>
                    )} */}

                    {/* {order.invoice ? ( */}
                    {order.invoice && (
                      <a
                        href={order.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="om-action om-invoice"
                      >
                        Print Invoice
                      </a>
                    )}
                    {/* ) : (
                      <button
                        onClick={() => generateInvoice(order.oid)}
                        className="om-action om-invoice"
                      >
                        Generate Invoice
                      </button>
                    )} */}

                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="om-action om-view"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <button
                onClick={handleLoadMore}
                className="om-button"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            )}
          </>
        )}
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onGenerateLabel={generateLabel}
            onGenerateManifest={generateManifest}
            onGenerateInvoice={generateInvoice}
            onRequestPickup={requestPickup}
          />
        )}
      </div>
    </div>
  );
};

export default OrderManagement;