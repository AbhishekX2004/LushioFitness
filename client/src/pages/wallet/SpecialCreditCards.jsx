import React from 'react';
import './SpecialCreditsCard.css';

const SpecialCreditsCard = () => {
  return (
    <div className="summary-card">
      <svg xmlns="http://www.w3.org/2000/svg" width="23" height="19" viewBox="0 0 23 19" className="credit-icon">
        <path fill="#008C2D" d="M20 14h3v2h-3v3h-2v-3h-3v-2h3v-3h2v3ZM18 4V2H2v2h16Zm0 4H2v6h11v2H2a2 2 0 0 1-2-2V2C0 .89.89 0 2 0h16a2 2 0 0 1 2 2v7h-2V8Z" />
      </svg>
      <div className="card-details">
        <span className="date">19 May 2025</span>
        <span className="title">Special Credits</span>
        <span className="validity">Valid till 25 May 2025</span>
      </div>
      <span className="amount">+₹101.0</span>
    </div>
  );
};

export default SpecialCreditsCard;
