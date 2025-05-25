import React from 'react';
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle,
  RotateCcw,
  AlertTriangle,
  Hourglass,
  Boxes
} from 'lucide-react';
import { getOrderStatus } from './statusUtils';

// Get appropriate icon based on status
export const getStatusIcon = (srStatus) => {
  const statusId = Number(srStatus);
  const appStatus = getOrderStatus(statusId);
  
  switch (appStatus) {
    case 'delivered':
      return <CheckCircle className="tracking-icon tracking-icon-delivered" />;
    case 'OutForDelivery':
      return <Truck className="tracking-icon tracking-icon-out-for-delivery" />;
    case 'shipped':
      return <MapPin className="tracking-icon tracking-icon-shipped" />;
    case 'processing':
      return <Package className="tracking-icon tracking-icon-processing" />;
    case 'cancelled':
      return <XCircle className="tracking-icon tracking-icon-cancelled" />;
    case 'ReturnOrExchanged':
      return <RotateCcw className="tracking-icon tracking-icon-return" />;
    case 'IssueOccured':
      return <AlertCircle className="tracking-icon tracking-icon-issue" />;
    case 'delayed':
      return <AlertTriangle className="tracking-icon tracking-icon-delayed" />;
    case 'partially_delivered':
      return <Boxes className="tracking-icon tracking-icon-partial" />;
    case 'pending':
      return <Hourglass className="tracking-icon tracking-icon-pending" />;
    default:
      return <Clock className="tracking-icon tracking-icon-default" />;
  }
};

// Get CSS class for status styling
export const getStatusColorClass = (srStatus) => {
  const statusId = Number(srStatus);
  const appStatus = getOrderStatus(statusId);
  
  switch (appStatus) {
    case 'delivered':
      return 'tracking-status-delivered';
    case 'OutForDelivery':
      return 'tracking-status-out-for-delivery';
    case 'shipped':
      return 'tracking-status-shipped';
    case 'processing':
      return 'tracking-status-processing';
    case 'cancelled':
      return 'tracking-status-cancelled';
    case 'ReturnOrExchanged':
      return 'tracking-status-return';
    case 'IssueOccured':
      return 'tracking-status-issue';
    case 'delayed':
      return 'tracking-status-delayed';
    case 'partially_delivered':
      return 'tracking-status-partial';
    case 'pending':
      return 'tracking-status-pending';
    default:
      return 'tracking-status-default';
  }
};

// Format date string into readable format
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }),
    time: date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  };
};

// Calculate progress percentage based on status
export const getProgressPercentage = (srStatus) => {
  if (!srStatus) return 0;
  
  const appStatus = getOrderStatus(Number(srStatus));
  
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
};