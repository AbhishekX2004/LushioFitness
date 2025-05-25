import React, { useState } from 'react';
import {  
  MapPin, 
 
} from 'lucide-react';
import { sampleTrackingData } from './sampleData';
import { getStatusDescription, getOrderStatus } from './statusUtils';
import { getStatusIcon, getStatusColorClass, formatDate} from './trackingHelpers';
import './DeliveryTracking.css';

// Status mapping functions


const DeliveryTrackingUI = () => {
  const [trackingNumber, setTrackingNumber] = useState('TRK001234567890');
  const [selectedOrder, setSelectedOrder] = useState(0);
  
  // Enhanced sample tracking data using your status codes
 
  const currentTrackingData = sampleTrackingData[selectedOrder];

  
  const getCurrentStatus = () => {
    if (currentTrackingData.shipment_track_activities.length > 0) {
      const latestActivity = currentTrackingData.shipment_track_activities[0];
      return getStatusDescription(Number(latestActivity['sr-status']));
    }
    return 'Unknown';
  };

  const getProgressPercentage = () => {
    if (currentTrackingData.shipment_track_activities.length > 0) {
      const latestStatus = currentTrackingData.shipment_track_activities[0]['sr-status'];
      const appStatus = getOrderStatus(Number(latestStatus));
      
      switch (appStatus) {
        case 'delivered': return 100;
        case 'OutForDelivery': return 90;
        case 'shipped': return 70;
        case 'processing': return 40;
          case 'pending': return 10;
        case 'cancelled': return 0;
        case 'ReturnOrExchanged': return 25;
        case 'IssueOccured': return 60;
        case 'delayed': return 75;
        case 'partially_delivered': return 85;
        default: return 20;
      }
    }
    return 0;
  };



  return (
    <div className="tracking-container">
      {/* Header */}
      <div className="tracking-header-card">
        <h1 className="tracking-main-title">Track Your Shipment</h1>
        
        {/* Search Section */}
        {/* <div className="tracking-search-section">
          <div className="tracking-search-input-wrapper">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              className="tracking-search-input"
            />
          </div>
          <button onClick={handleTrack} className="tracking-search-button">
            <Search className="tracking-search-icon" />
            Track
          </button>
        </div> */}

        {/* Sample Tracking IDs */}
        <div className="tracking-sample-ids">
          <p className="tracking-sample-text">Try these sample tracking IDs:</p>
          <div className="tracking-sample-buttons">
            {sampleTrackingData.map((data, index) => (
              <button
                key={index}
                onClick={() => {
                  setTrackingNumber(data.trackingId);
                  setSelectedOrder(index);
                }}
                className={`tracking-sample-button ${selectedOrder === index ? 'tracking-sample-button-active' : ''}`}
              >
                {data.trackingId}
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="tracking-order-summary">
          <div className="tracking-order-info">
            <h3 className="tracking-order-title">Order #{currentTrackingData.orderNumber}</h3>
            <p className="tracking-customer-name">Customer: {currentTrackingData.customerName}</p>
            <p className="tracking-delivery-address">Delivery to: {currentTrackingData.deliveryAddress}</p>
          </div>
          <div className="tracking-estimated-delivery">
            <span className="tracking-estimated-label">Est. Delivery:</span>
            <span className="tracking-estimated-date">{currentTrackingData.estimatedDelivery}</span>
          </div>
        </div>

        {/* Current Status */}
        <div className="tracking-status-card">
          <div className="tracking-status-header">
            <h2 className="tracking-status-title">Current Status</h2>
            <span className={`tracking-status-badge ${getStatusColorClass(currentTrackingData.shipment_track_activities[0]?.['sr-status'])}`}>
              {getCurrentStatus()}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="tracking-progress-container">
            <div 
              className="tracking-progress-bar"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          
          <p className="tracking-id-display">
            Tracking ID: <span className="tracking-id-code">{currentTrackingData.trackingId}</span>
          </p>
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="tracking-timeline-card">
        <h3 className="tracking-timeline-title">Tracking Timeline</h3>
        
        <div className="tracking-timeline-container">
          {/* Timeline Line */}
          <div className="tracking-timeline-line"></div>
          
          {currentTrackingData.shipment_track_activities.map((activity, index) => {
            const { date, time } = formatDate(activity.date);
            const isFirst = index === 0;
            const statusDescription = getStatusDescription(Number(activity['sr-status']));
            
            return (
              <div key={index} className={`tracking-timeline-item ${isFirst ? 'tracking-timeline-item-current' : ''}`}>
                {/* Timeline Icon */}
                <div className={`tracking-timeline-icon-container ${isFirst ? 'tracking-timeline-icon-current' : 'tracking-timeline-icon-default'}`}>
                  {getStatusIcon(activity['sr-status'])}
                </div>
                
                {/* Content */}
                <div className="tracking-timeline-content">
                  <div className={`tracking-timeline-content-card ${isFirst ? 'tracking-timeline-content-current' : 'tracking-timeline-content-default'}`}>
                    <div className="tracking-timeline-content-header">
                      <div className="tracking-timeline-content-main">
                        <h4 className="tracking-timeline-status-title">
                          {statusDescription}
                        </h4>
                        <p className="tracking-timeline-activity">
                          {activity.activity}
                        </p>
                        <div className="tracking-timeline-status-details">
                          {/* <span className="tracking-timeline-status-code">Status Code: {activity['sr-status']}</span> */}
                          <span className={`tracking-timeline-app-status ${getStatusColorClass(activity['sr-status'])}`}>
                            {getOrderStatus(Number(activity['sr-status'])).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="tracking-timeline-datetime">
                        <div className="tracking-timeline-date">{date}</div>
                        <div className="tracking-timeline-time">{time}</div>
                      </div>
                    </div>
                    
                    {/* Location */}
                    <div className="tracking-timeline-location">
                      <MapPin className="tracking-timeline-location-icon" />
                      <span className="tracking-timeline-location-text">{activity.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Legend */}
      {/* <div className="tracking-legend-card">
        <h3 className="tracking-legend-title">Status Legend</h3>
        <div className="tracking-legend-grid">
          <div className="tracking-legend-item">
            <CheckCircle className="tracking-legend-icon tracking-icon-delivered" />
            <span>Delivered</span>
          </div>
          <div className="tracking-legend-item">
            <Truck className="tracking-legend-icon tracking-icon-out-for-delivery" />
            <span>Out for Delivery</span>
          </div>
          <div className="tracking-legend-item">
            <MapPin className="tracking-legend-icon tracking-icon-shipped" />
            <span>Shipped</span>
          </div>
          <div className="tracking-legend-item">
            <Package className="tracking-legend-icon tracking-icon-processing" />
            <span>Processing</span>
          </div>
          <div className="tracking-legend-item">
            <RotateCcw className="tracking-legend-icon tracking-icon-return" />
            <span>Return/Exchange</span>
          </div>
          <div className="tracking-legend-item">
            <AlertCircle className="tracking-legend-icon tracking-icon-issue" />
            <span>Issue Occurred</span>
          </div>
        </div>
      </div> */}

      {/* Additional Info */}
      {/* <div className="tracking-help-card">
        <h3 className="tracking-help-title">Need Help?</h3>
        <div className="tracking-help-grid">
          <div className="tracking-help-item">
            <h4 className="tracking-help-item-title">Customer Support</h4>
            <p className="tracking-help-item-text">Call us at 1-800-SUPPORT for any queries about your shipment</p>
          </div>
          <div className="tracking-help-item">
            <h4 className="tracking-help-item-title">Delivery Issues</h4>
            <p className="tracking-help-item-text">Report delivery problems or reschedule delivery appointments</p>
          </div>
          <div className="tracking-help-item">
            <h4 className="tracking-help-item-title">Returns & Exchanges</h4>
            <p className="tracking-help-item-text">Initiate returns or exchanges for your orders</p>
          </div>
          <div className="tracking-help-item">
            <h4 className="tracking-help-item-title">Track Multiple Orders</h4>
            <p className="tracking-help-item-text">Use our bulk tracking feature to track multiple shipments</p>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default DeliveryTrackingUI;