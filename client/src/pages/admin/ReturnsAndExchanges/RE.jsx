import React, { useState, useEffect } from 'react';
import "./RE.css";
import axios from "axios";
import REModal from "./REModal"

const API = process.env.REACT_APP_API_URL;

const ReturnRequests = () => {
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openOID, setOpenOID] = useState("");

  const handleModalClose = () => {
    setOpenModal(false);
  };
  
  // Filter states
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    limit: 10
  });
  
  // Pagination states
  const [pagination, setPagination] = useState({
    lastDocumentId: null,
    hasMore: false,
    currentPageSize: 0
  });

  useEffect(() => {
    fetchReturnRequests(true);
  }, []);

  const fetchReturnRequests = async (isNewSearch = false) => {
    try {
      if (isNewSearch) {
        setLoading(true);
        setReturnRequests([]);
        setPagination({ lastDocumentId: null, hasMore: false, currentPageSize: 0 });
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      
      // Add filters to params
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      params.append('limit', filters.limit.toString());
      
      // Add pagination
      if (!isNewSearch && pagination.lastDocumentId) {
        params.append('lastDocumentId', pagination.lastDocumentId);
      }

      const response = await axios.get(`${API}/returns/fetch?${params.toString()}`);
      
      if (!response) {
        throw new Error('Failed to fetch return requests');
      }
      
      const data = response.data.data;
      
      if (isNewSearch) {
        setReturnRequests(data.orders);
      } else {
        setReturnRequests(prev => [...prev, ...data.orders]);
      }
      
      setPagination({
        lastDocumentId: data.pagination.lastDocumentId,
        hasMore: data.pagination.hasMore,
        currentPageSize: data.pagination.currentPageSize
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = () => {
    fetchReturnRequests(true);
  };

  const handleClearFilters = () => {
    setFilters({
      fromDate: '',
      toDate: '',
      limit: 10
    });
    setTimeout(() => {
      fetchReturnRequests(true);
    }, 0);
  };

  const handleLoadMore = () => {
    if (pagination.hasMore && !loadingMore) {
      fetchReturnRequests(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="admin-re-container">
        <div className="admin-re-loading">
          <div className="admin-re-spinner"></div>
          <p>Loading return requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-re-container">
        <div className="admin-re-error">
          <p>Error: {error}</p>
          <button onClick={() => fetchReturnRequests(true)} className="admin-re-retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-re-container">
      <div className="admin-re-header">
        <h1 className="admin-re-title">Return/Exchange Requests</h1>
      </div>

      {/* Filter Bar */}
      <div className="admin-re-filter-bar">
        <div className="admin-re-filter-row">
          <div className="admin-re-filter-group">
            <label className="admin-re-filter-label">From Date:</label>
            <input
              type="date"
              name="fromDate"
              value={filters.fromDate}
              onChange={handleFilterChange}
              className="admin-re-filter-input admin-re-date-input"
            />
          </div>
          
          <div className="admin-re-filter-group">
            <label className="admin-re-filter-label">To Date:</label>
            <input
              type="date"
              name="toDate"
              value={filters.toDate}
              onChange={handleFilterChange}
              className="admin-re-filter-input admin-re-date-input"
            />
          </div>
          
          <div className="admin-re-filter-group">
            <label className="admin-re-filter-label">Limit:</label>
            <select
              name="limit"
              value={filters.limit}
              onChange={handleFilterChange}
              className="admin-re-filter-input admin-re-select-input"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        
        <div className="admin-re-filter-actions">
          <button 
            onClick={handleApplyFilters} 
            className="admin-re-filter-btn admin-re-apply-btn"
            disabled={loading}
          >
            Apply Filters
          </button>
          <button 
            onClick={handleClearFilters} 
            className="admin-re-filter-btn admin-re-clear-btn"
            disabled={loading}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {returnRequests.length === 0 ? (
        <div className="admin-re-empty">
          <p>No Return/Exchange requests found</p>
        </div>
      ) : (
        <>
          <div className="admin-re-results-info">
            <p className="admin-re-results-count">
              Showing {returnRequests.length} requests
              {pagination.hasMore && " (more available)"}
            </p>
          </div>
          
          <div className="admin-re-grid">
            {returnRequests.map((request) => (
              <div key={request.orderId} className="admin-re-card" onClick={() => {
                setOpenModal(true);
                setOpenOID(request.orderId);
              }}>
                <div className="admin-re-card-header">
                  <div className="admin-re-request-id">
                    <span className="admin-re-label">Return Order ID: {request.shiprocketIds.returnOrderId}</span>
                    <span className="admin-re-label">Return Shipment ID: {request.shiprocketIds.returnShipmentId}</span>
                    <span className="admin-re-label">Shiprocket Order ID: {request.shiprocketIds.shiprocket_orderId}</span>
                  </div>
                  <div className="admin-re-customer-info">
                    <h3 className="admin-re-customer-name">
                      {request.customerDetails?.customerName || 'N/A'}
                    </h3>
                    <p className="admin-re-customer-email">
                      {request.customerDetails?.email || 'N/A'}
                    </p>
                    <p className="admin-re-customer-email">
                      +{request.customerDetails?.phone || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="admin-re-card-content">
                  <div className="admin-re-order-info">
                    <div className="admin-re-info-row">
                      <span className="admin-re-label">Order ID:</span>
                      <span className="admin-re-value">{request.orderId}</span>
                    </div>
                    <div className="admin-re-info-row">
                      <span className="admin-re-label">Return/Exchange Products:</span>
                      <span className="admin-re-value">
                        {request.returnExchangedProducts || 'N/A'}
                      </span>
                    </div>
                    <div className="admin-re-info-row">
                      <span className="admin-re-label">Net Quantity:</span>
                      <span className="admin-re-value">{request.returnExchangedTotalUnits || 0}</span>
                    </div>
                    <div className="admin-re-info-row">
                      <span className="admin-re-label">Amount:</span>
                      <span className="admin-re-value admin-re-amount">
                        {formatCurrency(request.financialDetails.returnAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="admin-re-dates">
                    <div className="admin-re-info-row">
                      <span className="admin-re-label">Return requested on:</span>
                      <span className="admin-re-value">
                        {formatDate(request.returnDate)}
                      </span>
                    </div>
                    {request.createdAt && (
                      <div className="admin-re-info-row">
                        <span className="admin-re-label">Order Date:</span>
                        <span className="admin-re-value">
                          {formatDate(request.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {pagination.hasMore && (
            <div className="admin-re-load-more-container">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="admin-re-load-more-btn"
              >
                {loadingMore ? (
                  <>
                    <div className="admin-re-spinner admin-re-spinner-small"></div>
                    Loading More...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Show Modal */}
      {openModal && <REModal isOpen={true} oid={openOID} onClose={handleModalClose} />}

    </div>
  );
};

export default ReturnRequests;