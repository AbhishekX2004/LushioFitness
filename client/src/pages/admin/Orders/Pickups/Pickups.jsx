import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import axios from 'axios';
import './Pickups.css';

const API = process.env.REACT_APP_API_URL;

const CustomAlert = ({ message, type, onClose }) => (
  <div className={`custom-alert ${type}`}>
    <span>{message}</span>
    <button onClick={onClose} className="alert-close-button">&times;</button>
  </div>
);

const StatusBadge = ({ status }) => {
  let statusText = "Unknown";
  let statusClass = "status-unknown";

  switch (status) {
    case 1:
      statusText = "Active";
      statusClass = "status-active";
      break;
    case 2:
      statusText = "Primary";
      statusClass = "status-primary";
      break;
    default:
      break;
  }

  return <span className={`status-badge ${statusClass}`}>{statusText}</span>;
};

const Loader = () => (
  <div className="pickup-loader">
    <div className="pickup-spinner"></div>
  </div>
);

const Pickups = ({ onClose }) => {
  const [pickupLocations, setPickupLocations] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    pickup_location: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    address_2: '',
    city: '',
    state: '',
    country: '',
    pin_code: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    fetchPickupLocations();
    fetchSelectedLocation();
  }, []);

  const fetchSelectedLocation = async () => {
    try {
      const adminDocRef = doc(db, 'controls', 'admin');
      const adminDoc = await getDoc(adminDocRef);
      
      if (adminDoc.exists()) {
        const data = adminDoc.data();
        if (data.pickupLocation) {
          setSelectedLocation(data.pickupLocation);
        }
      }
    } catch (error) {
      console.error('Error fetching selected location:', error);
      setError('Failed to fetch selected pickup location');
    }
  };

  const fetchPickupLocations = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/pickup/pickup-locations`);
      const responseData = response.data;

      if (responseData.data) {
        setPickupLocations(responseData.data.shipping_address);
        setCompanyName(responseData.data.company_name);
      }
    } catch (error) {
      setError('Failed to fetch pickup locations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = async (location) => {
    try {
      const adminDocRef = doc(db, 'controls', 'admin');
      await updateDoc(adminDocRef, {
        pickupLocation: location.pickup_location
      });
      
      setSelectedLocation(location.pickup_location);
      setSuccess('Pickup location updated successfully!');
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error updating pickup location:', error);
      setError('Failed to update pickup location');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API}/pickup/add`, formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200 || response.status === 201) {
        setSuccess('Pickup location added successfully!');
        setFormData({
          pickup_location: '',
          name: '',
          email: '',
          phone: '',
          address: '',
          address_2: '',
          city: '',
          state: '',
          country: '',
          pin_code: ''
        });
        fetchPickupLocations();
        setShowAddForm(false);

        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError('Failed to add pickup location');
      }
    } catch (error) {
      setError('Failed to add pickup location');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pickup-modal-overlay" onClick={handleOverlayClick}>
      <div className="pickup-modal">
        <div className="pickup-modal-header">
          <div>
            <h2>Pickup Locations</h2>
            {companyName && <p className="company-name">{companyName}</p>}
          </div>
          <button onClick={onClose} className="pickup-close-button">&times;</button>
        </div>

        {error && (
          <CustomAlert 
            message={error} 
            type="error" 
            onClose={() => setError('')}
          />
        )}

        {success && (
          <CustomAlert 
            message={success} 
            type="success" 
            onClose={() => setSuccess('')}
          />
        )}

        <div className="pickup-content">
          {!showAddForm ? (
            <>
              <button 
                className="add-pickup-button" 
                onClick={() => setShowAddForm(true)}
                disabled={isLoading}
              >
                Add New Pickup Location
              </button>

              {isLoading ? (
                <Loader />
              ) : (
                <div className="pickup-locations-list">
                  {pickupLocations.map((location) => (
                    <div key={location.id} className="pickup-location-card">
                      <div className="pickup-header">
                        <div className="pickup-header-left">
                          <input
                            type="radio"
                            name="pickupLocation"
                            checked={selectedLocation === location.pickup_location}
                            onChange={() => handleLocationSelect(location)}
                            className="pickup-radio"
                          />
                          <h3>{location.pickup_location} (ID : {location.id})</h3>
                        </div>
                        <StatusBadge status={location.status} />
                      </div>
                      {location.is_primary_location === 1 && (
                        <div className="primary-badge">Primary Location</div>
                      )}
                      <p><strong>Name:</strong> {location.name}</p>
                      <p><strong>Email:</strong> {location.email}</p>
                      <p><strong>Phone:</strong> {location.phone}</p>
                      <div className="address-section">
                        <p><strong>Address:</strong> {location.address}</p>
                        {location.address_2 && <p className="address-2">{location.address_2}</p>}
                        <p>{location.city}, {location.state}, {location.country} - {location.pin_code}</p>
                      </div>
                      {location.instruction && (
                        <p className="instruction"><strong>Instructions:</strong> {location.instruction}</p>
                      )}
                      {location.phone_verified === 1 && (
                        <div className="verified-badge">Phone Verified</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="pickup-form">
              <div className="form-grid">
                {Object.keys(formData).map((field) => (
                  <div key={field} className="form-group">
                    <label>{field.replace('_', ' ').toUpperCase()}</label>
                    <input
                      type="text"
                      name={field}
                      value={formData[field]}
                      onChange={handleInputChange}
                      required={['pickup_location', 'name', 'email', 'phone', 'address', 'city', 'state', 'country', 'pin_code'].includes(field)}
                      disabled={isSubmitting}
                    />
                  </div>
                ))}
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={isSubmitting ? 'submitting' : ''}
                >
                  {isSubmitting ? (
                    <>
                      <span className="button-spinner"></span>
                      Adding...
                    </>
                  ) : (
                    'Add Pickup Location'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pickups;