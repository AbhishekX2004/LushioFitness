import { useState } from "react";
import "./ReturnExchangeNotice.css";

const ReturnExchangeNotice = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="notice-card">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="alert-icon"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 19a2 2 0 0 0 1.71 3h17a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div className="notice-content">
        <p className="notice-text">
          Return/Exchange request can only be placed <b>one time</b>. Please ensure your request is correct before proceeding. To make request select from each item whether you want to return or exchange it , do not select any option for not doing anything
        </p>
      </div>
    
    </div>
  );
};

export default ReturnExchangeNotice;
