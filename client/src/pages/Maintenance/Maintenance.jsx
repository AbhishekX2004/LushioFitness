import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './Maintenance.css';

const Maintenance = () => {
  const [remainingMinutes, setRemainingMinutes] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const adminDocRef = doc(db, "controls", "admin");
    
    const unsubscribe = onSnapshot(adminDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Get maintenance time and update timestamp
        const maintenanceTime = data.maintenanceTime !== undefined ? data.maintenanceTime : 30;
        const maintenanceUpdate = data.maintenanceUpdate ? data.maintenanceUpdate.toDate() : new Date();
        
        // Calculate remaining time based on when maintenance started
        const elapsedMinutes = Math.floor((new Date() - maintenanceUpdate) / (1000 * 60));
        const calculatedRemaining = Math.max(0, maintenanceTime - elapsedMinutes);
        
        setRemainingMinutes(calculatedRemaining);
        setLoading(false);
      } else {
        setRemainingMinutes(30);
        setLoading(false);
        console.log("No admin document found in controls collection");
      }
    }, (error) => {
      console.error("Error getting admin document:", error);
      setRemainingMinutes(30);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Update the countdown timer every minute
  useEffect(() => {
    if (remainingMinutes !== null && remainingMinutes > 0) {
      const timer = setInterval(() => {
        setRemainingMinutes(prev => Math.max(0, prev - 1));
      }, 60000); // Update every minute
      
      return () => clearInterval(timer);
    }
  }, [remainingMinutes]);
  
  if (loading) {
    return (
      <div className="maintenance-container">
        <div className="maintenance-loading">
          <div className="loading-spinner"></div>
          <p>Loading maintenance information...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="maintenance-container">
      <div className="maintenance-card">
        <div className="maintenance-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        <h1>Site Under Maintenance</h1>
        <p>We're currently updating our website to bring you a better experience.</p>
        <p className="estimate">
          {remainingMinutes > 0 
            ? <>We'll be back in approximately <span>{remainingMinutes}</span> minute{remainingMinutes !== 1 ? 's' : ''}.</>
            : 'Maintenance should be completed soon. Please try refreshing the page.'}
        </p>
        <div className="maintenance-details">
          <div className="detail-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Scheduled Maintenance</span>
          </div>
          <div className="detail-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>We apologize for any inconvenience</span>
          </div>
        </div>
        <div className="social-links">
          <a href="#" className="social-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
          </a>
          <a href="#" className="social-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <a href="#" className="social-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
            </svg>
          </a>
        </div>
        <div className="retry-button">
          <button onClick={() => window.location.reload()}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Check Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;