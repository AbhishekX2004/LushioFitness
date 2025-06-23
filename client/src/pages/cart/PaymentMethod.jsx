import React from "react";
import "./PaymentMethod.css"; // Import your CSS file


const PaymentMethod = ({
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  getTotalWithWalletAndDiscount,
  additionalDiscountRef,
  getTotalForCOD,
}) => {
  // const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
const onlineAmount = getTotalForCOD() - additionalDiscountRef.current;
  const handlePaymentMethodChange = (e) => {
    setSelectedPaymentMethod(e.target.value);
  };

  return (
    <div className="payment-method-container">
      <div className="pulse-message skeleton">Get 5% OFF if Pay online</div>

      <h2>Select a Payment Method</h2>
      <div className="payment-method-options">
        <label
          className={`payment-option ${
            selectedPaymentMethod === "phonepe" ? "selected" : ""
          }`}
        >
          <div className="payment-method-statement">
            <div className="pay-online-amount">
              {/* Original Price (cutout) */}
              <div className="payment-method-cutout-price">
                ₹{getTotalForCOD()}
              </div>

              {/* Discounted Price */}
              <div className="payment-method-discounted-price">
                ₹{onlineAmount}
              </div>

              {/* Discount Percentage */}
              <div className="payment-method-discount-percentage">Save ₹{additionalDiscountRef.current}</div>
            </div>

            <span className="payment-method-text">Pay Online</span>
          </div>
          <div className="payment-method-icon">
            {" "}
            <img src="/Images/money.gif" alt="payment_icon" />
            <input
              type="radio"
              name="payment-method"
              value="phonepe"
              checked={selectedPaymentMethod === "phonepe"}
              onChange={handlePaymentMethodChange}
            />
          </div>
        </label>

        <label
          className={`payment-option ${
            selectedPaymentMethod === "cashOnDelivery" ? "selected" : ""
          }`}
        >
          <div className="payment-method-statement">
            <span className="cod-amount"> ₹{getTotalForCOD()}</span>
            <span className="payment-method-text">(COD)</span>
          </div>
          <div className="payment-method-icon">
            <img src="/Images/cod.png" alt="cod_icon" />
            <input
              type="radio"
              name="payment-method"
              value="cashOnDelivery"
              checked={selectedPaymentMethod === "cashOnDelivery"}
              onChange={handlePaymentMethodChange}
            />
          </div>
        </label>
      </div>
     
    </div>
  );
};

export default PaymentMethod;
