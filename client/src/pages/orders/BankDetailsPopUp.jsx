// BankDetailsPopup.js
import React, { useState } from 'react';
import './BankDetailsPopUp.css'; // You'll need to create this CSS file

const BankDetailsPopup = ({ isOpen, onClose, onSubmit }) => {
  const [refundMethod, setRefundMethod] = useState('upi');
  const [bankDetails, setBankDetails] = useState({
    upiId: '',
    bankName: '',
    ifscCode: '',
    accountNumber: '',
    confirmAccountNumber: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (refundMethod === 'upi') {
     if (!bankDetails.upiId.trim()) {
  newErrors.upiId = 'UPI ID is required';
} else if (!bankDetails.upiId.includes('@')) {
  newErrors.upiId = 'UPI ID must contain "@" (e.g., name@phonepe)';
}

    } else {
      if (!bankDetails.bankName.trim()) {
        newErrors.bankName = 'Bank name is required';
      } else if (bankDetails.bankName.trim().length < 2) {
        newErrors.bankName = 'Bank name should be at least 2 characters';
      }
      
      if (!bankDetails.ifscCode.trim()) {
        newErrors.ifscCode = 'IFSC code is required';
      } else if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(bankDetails.ifscCode.replace(/\s/g, ''))) {
        newErrors.ifscCode = 'IFSC code should be 11 characters (e.g., SBIN0001234)';
      }
      
      if (!bankDetails.accountNumber.trim()) {
        newErrors.accountNumber = 'Account number is required';
      } else if (!/^\d{9,18}$/.test(bankDetails.accountNumber.replace(/\s/g, ''))) {
        newErrors.accountNumber = 'Account number should be between 9-18 digits';
      }
      
      if (!bankDetails.confirmAccountNumber.trim()) {
        newErrors.confirmAccountNumber = 'Please confirm account number';
      } else if (bankDetails.accountNumber.replace(/\s/g, '') !== bankDetails.confirmAccountNumber.replace(/\s/g, '')) {
        newErrors.confirmAccountNumber = 'Account numbers do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setBankDetails(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const refundDetails = {
        method: refundMethod,
        ...(refundMethod === 'upi' 
          ? { upiId: bankDetails.upiId }
          : {
              bankName: bankDetails.bankName,
              ifscCode: bankDetails.ifscCode.toUpperCase(),
              accountNumber: bankDetails.accountNumber
            }
        )
      };
      onSubmit(refundDetails);
    }
  };

  const handleClose = () => {
    setBankDetails({
      upiId: '',
      bankName: '',
      ifscCode: '',
      accountNumber: '',
      confirmAccountNumber: ''
    });
    setErrors({});
    setRefundMethod('upi');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="bank-details-popup-overlay"  onClick={handleClose} >
      <div className="bank-details-popup-container" onClick={(e) => e.stopPropagation()} >
        <div className="bank-details-popup-header">
          <h3>Refund Details</h3>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>
        
        <div className="bank-details-popup-content">
          <p className="popup-description">
           Your order was Cash On Delivery so to receive refund Please provide your bank details for the return/exchange amount.
          </p>
          
          <div className="refund-method-section">
            <h4>Select Refund Method:</h4>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="refundMethod"
                  value="upi"
                  checked={refundMethod === 'upi'}
                  onChange={(e) => setRefundMethod(e.target.value)}
                />
                <span>UPI ID</span>
              </label>
              
              <label className="radio-option">
                <input
                  type="radio"
                  name="refundMethod"
                  value="bank"
                  checked={refundMethod === 'bank'}
                  onChange={(e) => setRefundMethod(e.target.value)}
                />
                <span>Bank Account</span>
              </label>
            </div>
          </div>

          {refundMethod === 'upi' ? (
            <div className="form-group">
              <label htmlFor="upiId">UPI ID *</label>
              <input
                type="text"
                id="upiId"
                placeholder="Enter your UPI ID (e.g., yourname@paytm)"
                value={bankDetails.upiId}
                onChange={(e) => handleInputChange('upiId', e.target.value)}
                className={errors.upiId ? 'error' : ''}
              />
              {errors.upiId && <span className="error-message">{errors.upiId}</span>}
            </div>
          ) : (
            <div className="bank-details-section">
              <div className="form-group">
                <label htmlFor="bankName">Bank Name *</label>
                <input
                  type="text"
                  id="bankName"
                  placeholder="Enter bank name"
                  value={bankDetails.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  className={errors.bankName ? 'error' : ''}
                />
                {errors.bankName && <span className="error-message">{errors.bankName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="ifscCode">IFSC Code *</label>
                <input
                  type="text"
                  id="ifscCode"
                  placeholder="Enter IFSC code (e.g., SBIN0001234)"
                  value={bankDetails.ifscCode}
                  onChange={(e) => handleInputChange('ifscCode', e.target.value.replace(/\s/g, '').toUpperCase())}
                  className={errors.ifscCode ? 'error' : ''}
                  maxLength={11}
                />
                {errors.ifscCode && <span className="error-message">{errors.ifscCode}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="accountNumber">Account Number *</label>
                <input
                  type="text"
                  id="accountNumber"
                  placeholder="Enter account number"
                  value={bankDetails.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value.replace(/[^0-9]/g, ''))}
                  className={errors.accountNumber ? 'error' : ''}
                  maxLength={18}
                />
                {errors.accountNumber && <span className="error-message">{errors.accountNumber}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmAccountNumber">Confirm Account Number *</label>
                <input
                  type="text"
                  id="confirmAccountNumber"
                  placeholder="Re-enter account number"
                  value={bankDetails.confirmAccountNumber}
                  onChange={(e) => handleInputChange('confirmAccountNumber', e.target.value.replace(/[^0-9]/g, ''))}
                  className={errors.confirmAccountNumber ? 'error' : ''}
                  maxLength={18}
                />
                {errors.confirmAccountNumber && <span className="error-message">{errors.confirmAccountNumber}</span>}
              </div>
            </div>
          )}
        </div>

        <div className="popup-actions">
          <button className="btn-cancel" onClick={handleClose}>
            Cancel
          </button>
          <button className="btn-submit" onClick={handleSubmit}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default BankDetailsPopup;