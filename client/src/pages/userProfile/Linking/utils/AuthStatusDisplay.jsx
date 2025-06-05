import React from 'react';

const AuthStatusDisplay = ({ 
  isLinked, 
  providerName, 
  warningMessage, 
  successMessage,
  showWarning = false 
}) => {
  return (
    <div className="auth-status">
      <span className={`status ${isLinked ? 'linked' : 'not-linked'}`}>
        {isLinked 
          ? `✓ ${providerName} linked` 
          : `✗ ${providerName} not linked`
        }
      </span>
      
      {showWarning && warningMessage && (
        <div className="auth-warning">
          <small style={{ 
            color: '#ff9800', 
            fontSize: '12px', 
            display: 'block', 
            marginTop: '4px' 
          }}>
            {warningMessage}
          </small>
        </div>
      )}
      
      {!isLinked && successMessage && (
        <small style={{ 
          color: '#28a745', 
          fontSize: '12px', 
          display: 'block', 
          marginTop: '4px' 
        }}>
          {successMessage}
        </small>
      )}
    </div>
  );
};

export default AuthStatusDisplay;