import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Adjust the path as needed
import './MaintenanceManager.css';

/**
 * Admin component for setting and managing maintenance mode and times
 */
const MaintenanceManager = () => {
  const [maintenanceTime, setMaintenanceTime] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [engineState, setEngineState] = useState(false);

  useEffect(() => {
    // Reference to the admin document in the controls collection
    const adminDocRef = doc(db, "controls", "admin");
    
    // Set up a real-time listener to the document
    const unsubscribe = onSnapshot(adminDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Check if maintenanceTime exists in the document
        if (data.maintenanceTime !== undefined) {
          setMaintenanceTime(data.maintenanceTime);
        }
        
        // Get the engine state
        if (data.engine !== undefined) {
          setEngineState(data.engine);
        }
        
        setIsLoading(false);
      } else {
        setIsLoading(false);
        console.log("No admin document found in controls collection");
      }
    }, (error) => {
      console.error("Error getting admin document:", error);
      setIsLoading(false);
    });
    
    // Clean up the listener when component unmounts
    return () => unsubscribe();
  }, []);

  const handleMaintenanceTimeChange = (e) => {
    setMaintenanceTime(parseInt(e.target.value) || 0);
  };

  const handleEngineStateChange = (e) => {
    setEngineState(e.target.checked);
  };

  const saveChanges = async () => {
    setIsSaving(true);
    setMessage('');
    
    try {
      const adminDocRef = doc(db, "controls", "admin");
      
      await updateDoc(adminDocRef, {
        maintenanceTime: maintenanceTime,
        engine: engineState,
        maintenanceUpdate: serverTimestamp()
      });
      
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Error updating maintenance settings:", error);
      setMessage('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="maintenance-manager">
        <div className="loading-spinner"></div>
        <p>Loading maintenance settings...</p>
      </div>
    );
  }

  return (
    <div className="maintenance-manager">
      <h2>Maintenance Mode Settings</h2>
      
      <div className="setting-group">
        <label htmlFor="engineSwitch">Site Status:</label>
        <div className="toggle-switch">
          <input 
            type="checkbox" 
            id="engineSwitch" 
            checked={engineState} 
            onChange={handleEngineStateChange}
          />
          <label htmlFor="engineSwitch"></label>
          <span className="toggle-label">{engineState ? 'Online' : 'Maintenance Mode'}</span>
        </div>
      </div>
      
      <div className="setting-group">
        <label htmlFor="maintenanceTime">Estimated Maintenance Time (minutes):</label>
        <input 
          type="number" 
          id="maintenanceTime"
          min="1"
          max="1440"
          value={maintenanceTime}
          onChange={handleMaintenanceTimeChange}
        />
      </div>
      
      <button 
        className="save-button" 
        onClick={saveChanges}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
      
      {message && <div className="message">{message}</div>}
      
      <div className="info-box">
        <h3>About Maintenance Mode</h3>
        <p>When the site is set to Maintenance Mode (toggle OFF), visitors will see a maintenance page with the countdown timer shown above.</p>
        <p>When set to Online (toggle ON), the site will function normally for all users.</p>
      </div>
    </div>
  );
};

export default MaintenanceManager;