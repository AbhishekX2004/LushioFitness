import React from 'react';
import './SpecialCreditsCard.css';
import { useNavigate } from "react-router-dom";
const SpecialCreditsCard = ({ transaction }) => {
  // Determine which icon to show
 const navigate = useNavigate();
  function formatDate(isoString) {
  const date = new Date(isoString);
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options);
}
function formatDateWithTime(isoString) {
  const date = new Date(isoString);

  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('en-GB', { month: 'short' }); // e.g., "May"
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12 || 12; // Convert 0 to 12
  hours = hours.toString().padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}
  const renderIcon = () => {
    // For cash deductions
    if (transaction.type === 'cash_usage') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="23" height="19" viewBox="0 0 23 19" className="credit-icon">
          <path fill="#ff4444" d="M20 14h3v2h-3v3h-2v-3h-3v-2h3v-3h2v3ZM18 4V2H2v2h16Zm0 4H2v6h11v2H2a2 2 0 0 1-2-2V2C0 .89.89 0 2 0h16a2 2 0 0 1 2 2v7h-2V8Z" />
        </svg>
      );
    }
    // For expired coins
    else if (transaction.type === 'coin' && transaction.isExpired) {
      return (
      <svg xmlns="http://www.w3.org/2000/svg" width="23" height="19" fill="none" viewBox="0 0 22 21" class=" " stroke="none"><path fill="#EA2123" d="M0 2.235 1.28.965l17.79 17.79-1.27 1.28-2-2H3.07a2 2 0 0 1-2-2v-12c0-.22.04-.43.11-.62L0 2.235Zm19.07 3.8v-2H6.89l-2-2h14.18a2 2 0 0 1 2 2v12c0 .6-.26 1.13-.68 1.5l-1.5-1.5h.18v-6h-6.18l-4-4h10.18Zm-16 0h.73l-.73-.73v.73Zm0 4v6H13.8l-6-6H3.07Z"></path></svg>
      );
    }
    // Default icon for credits and active coins
    else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="23" height="19" viewBox="0 0 23 19" className="credit-icon">
          <path fill="#008C2D" d="M20 14h3v2h-3v3h-2v-3h-3v-2h3v-3h2v3ZM18 4V2H2v2h16Zm0 4H2v6h11v2H2a2 2 0 0 1-2-2V2C0 .89.89 0 2 0h16a2 2 0 0 1 2 2v7h-2V8Z" />
        </svg>
      );
    }
  };

  // Determine amount display
  const renderAmount = () => {
  const isCashUsage = transaction.type === 'cash_usage';
  const isExpiredCoin = transaction.type === 'coin' && transaction.isExpired;
  const isPartiallyUsedCoin = transaction.type === 'coin' && transaction.amountLeft < transaction.amount;

  // Determine prefix - negative for cash usage OR expired coins
  const prefix = (isCashUsage || isExpiredCoin) ? '-' : '+';
  const amount = transaction.amount;

  let className = 'summary-card-amount';
  if (isCashUsage || isExpiredCoin) className += ' negative';
  if (isPartiallyUsedCoin) className += ' used';

  return (
    <span className={className}>
      {prefix}₹{amount}
      {/* {isExpiredCoin && <span className="amount-state"> (Expired)</span>} */}
      {isPartiallyUsedCoin && <span className="amount-left"> ({transaction.amountLeft} left)</span>}
    </span>
  );
};
 const handleOrderClick = (orderId) => {
    
  navigate(`/orderInfo/${orderId}`);
  };

  return (
    <div className='summary-card-wrapper'>
    <div className={`summary-card ${transaction.isExpired ? 'expired-card' : ''}`}>
      {renderIcon()}
      <div className="summary-card-details">
        <span className="summary-card-date">{formatDate(transaction.createdAt)}</span>
        <span className="summary-card-title">{transaction.message || 'No message'}</span>
        {transaction.expiresOn && (
          <span className={`summary-card-validity ${transaction.isExpired ? 'expired' : ''}`}>
            {transaction.isExpired ? 'Expired on ' : 'Valid till '}
            {formatDateWithTime(transaction.expiresOn)}
          </span>
        )}
        {transaction.type === 'cash_usage' && (
          <span className="summary-card-validity">
            Used for order: {transaction.orderId}
          </span>
        )}
      </div>
      
      {renderAmount()}
      
    </div>
    {transaction.orders && transaction.orders.length > 0 && (
              <div className="transaction-order-info">
                <span className="transaction-order-label">Used in orders:</span>
                {transaction.orders.map((order, index) => (
                  <span key={order.oid} className="order-links">
                    <button 
                      className="order-id-link"
                      onClick={() => handleOrderClick(order.oid)}
                      title={`Order Amount: ₹${order.orderAmount}, Used: ₹${order.consumedAmount}`}
                    >
                      {order.oid}
                    </button>
                    {index < transaction.orders.length - 1 && ', '}
                  </span>
                ))}
              </div>
            )}
    </div>
  );
};

export default SpecialCreditsCard;