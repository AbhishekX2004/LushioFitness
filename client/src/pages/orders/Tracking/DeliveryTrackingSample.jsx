import React, { useState,useRef,useEffect } from 'react';
import {  
  MapPin, 
 
} from 'lucide-react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
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
  
const [expanded, setExpanded] = useState(false);
  const [maxHeight, setMaxHeight] = useState('300px'); // default collapsed height
  const containerRef = useRef(null);

  const toggleExpanded = () => {
    setExpanded((prev) => !prev);
  };

  useEffect(() => {
    if (expanded && containerRef.current) {
      setMaxHeight(`${containerRef.current.scrollHeight}px`);
    } else {
      setMaxHeight('300px'); // or any height for collapsed state
    }
  }, [expanded, currentTrackingData]);
  
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
        
        <div 
        className="tracking-timeline-container"
        ref={containerRef}
  style={{
    maxHeight,
    overflow: 'hidden',
    transition: 'max-height 0.4s ease-in-out',
    position: 'relative',
  }}
        >
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
          {!expanded && (
  <div
    className="timeline-fade"
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '60px',
      background: 'linear-gradient(to top, #fff, rgba(255, 255, 255, 0))',
      pointerEvents: 'none',
    }}
  />
)}

        </div>
        {currentTrackingData.shipment_track_activities.length > 3 && (
  <div style={{ textAlign: 'center', 
      display: "flex",
        justifyContent: "center",
  marginTop: '10px' }}>
    <button
      onClick={toggleExpanded}
      className="see-more-button"
      style={{
         background: 'white',
         width: "110px",
        textUnderlineOffset: "#000",
        display: "flex",
        justifyContent: "space-between",
        alignItems:"center",
        color: '#000',
        padding: '8px 16px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '15px',
      }}
    >
     {expanded ? 'See Less ' : 'See More '}
      {expanded ? <FaChevronUp /> : <FaChevronDown />}
    </button>
  </div>
)}

      </div>
    </div>
  );
};

export default DeliveryTrackingUI;