import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig'; // Adjust the import path to your Firebase config
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './OrderLogistics.css';

const OrderLogistics = () => {
  const [formData, setFormData] = useState({
    length: '',
    breadth: '',
    height: '',
    weight: '',
    companyName: '',
    resellerName: '',
    deliveryCharges: '',
    orderDiscounts: {
      500: '',
      1000: '',
      1500: '',
      2000: '',
      3000: '',
      5000: ''
    }
  });

  // Fetch initial data from Firestore
  useEffect(() => {
    const fetchAdminControls = async () => {
      try {
        const adminDocRef = doc(db, 'controls', 'admin');
        const docSnap = await getDoc(adminDocRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData(prevData => {
            // Convert numeric fields to strings with two decimal places
            const convertedData = {};
            for (const [key, value] of Object.entries(data)) {
              if (typeof value === 'number') {
                // For numeric fields, convert to string with two decimal places
                convertedData[key] = value.toFixed(2);
              } else {
                convertedData[key] = value;
              }
            }
            return {
              ...prevData,
              ...convertedData
            };
          });
        }
      } catch (error) {
        console.error("Error fetching admin controls:", error);
        alert('Failed to fetch initial data');
      }
    };

    fetchAdminControls();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for discounts
    if (name.startsWith('discount_')) {
      const discountKey = name.replace('discount_', '');
      
      setFormData(prev => ({
        ...prev,
        orderDiscounts: {
          ...prev.orderDiscounts,
          [discountKey]: value
        }
      }));
    } else {
      // Handle other fields
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Save data to Firestore
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const adminDocRef = doc(db, 'controls', 'admin');
      
      const sanitizedData = {
        length: formData.length ? parseFloat(parseFloat(formData.length).toFixed(2)) : 0,
        breadth: formData.breadth ? parseFloat(parseFloat(formData.breadth).toFixed(2)) : 0,
        height: formData.height ? parseFloat(parseFloat(formData.height).toFixed(2)) : 0,
        weight: formData.weight ? parseFloat(parseFloat(formData.weight).toFixed(2)) : 0,
        companyName: formData.companyName || '',
        resellerName: formData.resellerName || '',
        deliveryCharges: formData.deliveryCharges ? parseFloat(parseFloat(formData.deliveryCharges).toFixed(2)) : 0,
        orderDiscounts: Object.fromEntries(
          Object.entries(formData.orderDiscounts).map(([key, value]) => [
            key, 
            value ? Math.max(0, Math.min(100, parseFloat(parseFloat(value).toFixed(2)))) : 0
          ])
        )
      };

      await updateDoc(adminDocRef, sanitizedData);

      alert('Data saved successfully!');
    } catch (error) {
      console.error("Error saving admin controls:", error);
      alert('Failed to save data');
    }
  };

  return (
    <div className="order-logistics-container">
      <form onSubmit={handleSave} className="order-logistics-form">
        <h2>Order Logistics Controls</h2>
        
        {/* Dimension Fields */}
        <div className="form-section">
          <h3>Package Dimensions</h3>
          <div className="form-row">
            <label>
              Length (cm):
              <input
                type="text"
                name="length"
                value={formData.length}
                onChange={handleChange}
                placeholder="Enter length (2 decimal places)"
              />
            </label>
            <label>
              Breadth (cm):
              <input
                type="text"
                name="breadth"
                value={formData.breadth}
                onChange={handleChange}
                placeholder="Enter breadth (2 decimal places)"
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Height (cm):
              <input
                type="text"
                name="height"
                value={formData.height}
                onChange={handleChange}
                placeholder="Enter height (2 decimal places)"
              />
            </label>
            <label>
              Weight (kg):
              <input
                type="text"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="Enter weight (2 decimal places)"
              />
            </label>
          </div>
        </div>

        {/* Company and Reseller Details */}
        <div className="form-section">
          <h3>Company Details</h3>
          <div className="form-row">
            <label>
              Company Name:
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Enter company name"
              />
            </label>
            <label>
              Reseller Name:
              <input
                type="text"
                name="resellerName"
                value={formData.resellerName}
                onChange={handleChange}
                placeholder="Enter reseller name"
              />
            </label>
          </div>
        </div>

        {/* Delivery Charges */}
        <div className="form-section">
          <h3>Delivery Charges</h3>
          <label>
            Delivery Charges:
            <input
              type="text"
              name="deliveryCharges"
              value={formData.deliveryCharges}
              onChange={handleChange}
              placeholder="Enter delivery charges (2 decimal places)"
            />
          </label>
        </div>

        {/* Discount Tiers */}
        <div className="form-section">
          <h3>Discount Tiers</h3>
          <div className="discount-grid">
            {Object.entries(formData.orderDiscounts).map(([tier, value]) => (
              <label key={tier}>
                {tier}+ Discount (%):
                <input
                  type="text"
                  name={`discount_${tier}`}
                  value={value}
                  onChange={handleChange}
                  placeholder={`Enter ${tier} discount`}
                />
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="save-button">
          Save Controls
        </button>
      </form>
    </div>
  );
};

export default OrderLogistics;


// import React,{useState} from 'react'
// import "./OrderLogistics.css"

// const OrderLogistics = () => {
//     const [dimensions, setDimensions] = useState({
//         length: '',
//         breadth: '',
//         height: '',
//         weight: '',
//       });
    
//       const handleChange = (e) => {
//         const { name, value } = e.target;
//         setDimensions((prev) => ({
//           ...prev,
//           [name]: value,
//         }));
//       };
    
//       const handleSubmit = (e) => {
//         e.preventDefault();
//         const { length, breadth, height, weight } = dimensions;
    
//         if (length && breadth && height && weight) {
//           alert(`Order Dimensions:\nLength: ${length} cm\nbreadth: ${breadth} cm\nHeight: ${height} cm\nWeight: ${weight} cm`);
//         } else {
//           alert('Please fill in all fields.');
//         }
//       };
    
//       return (
//         <>
//           <div className='order-dimensions-form-wrapper'>
//           <form className="order-dimensions-form" onSubmit={handleSubmit}>
//           <h3>Order Dimensions</h3>
//           <div className='form-fields'>
//           <div className="form-group">
//             <label>
//               Length (cm):
//               <input
//                 type="number"
//                 name="length"
//                 value={dimensions.length}
//                 onChange={handleChange}
//                 placeholder="Enter length"
//                 required
//               />
//             </label>
//           </div>
//           <div className="form-group">
//             <label>
//               breadth (cm):
//               <input
//                 type="number"
//                 name="breadth"
//                 value={dimensions.breadth}
//                 onChange={handleChange}
//                 placeholder="Enter breadth"
//                 required
//               />
//             </label>
//           </div>
//           <div className="form-group">
//             <label>
//               Height (cm):
//               <input
//                 type="number"
//                 name="height"
//                 value={dimensions.height}
//                 onChange={handleChange}
//                 placeholder="Enter height"
//                 required
//               />
//             </label>
//           </div>
//           <div className="form-group">
//             <label>
//               Weight (Kg):
//               <input
//                 type="number"
//                 name="weight"
//                 value={dimensions.weight}
//                 onChange={handleChange}
//                 placeholder="Enter weight(in KG)"
//                 required
//               />
//             </label>
//           </div>
//           </div>
         
//           <button type="submit" className="submit-button">
//             Submit
//           </button>
//         </form>
//         <button className="submit-button">
//           Orders
//           </button>
//         </div>
        
     
    

//         </>
       
       
//       );
// }

// export default OrderLogistics