import React,{useEffect} from "react";
import "./ResponsivePopUp.css";

const ResponsivePopup = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }

    return () => {
      document.body.classList.remove("no-scroll"); // Cleanup on unmount
    };
  }, [isOpen]);

  if (!isOpen) return null; // Do not render anything if not open

  return (
    <div className="responsive-popup-overlay" onClick={onClose}>
      <div
        className="responsive-popup-content"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <button className="responsive-close-popup-button" onClick={onClose}>
          ✖
        </button>
        {children}
      </div>
    </div>
  );
};

export default ResponsivePopup;

