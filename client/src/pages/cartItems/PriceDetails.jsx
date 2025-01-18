import React,{useEffect,useState} from "react";
import Coupon from "./Coupon";
import PaymentMethod from "./PaymentMethod";
import { db } from '../../firebaseConfig'; // Adjust the import path to your Firebase config
import { doc, getDoc } from 'firebase/firestore';
const PriceDetails = ({
  couponApplied,
  setCouponApplied,
  discountPercentage,
  setDiscountPercentage,
  walletPoints,
  useWalletPoints,
  handleWalletCheckboxChange,
  getSelectedTotalAmount,
  getSelectedAmount,
  getTotalWithWalletAndDiscount,
  additionalDiscountRef,
  getTotalForCOD,
  renderCartMessages,
  shippingFee,
  selectedPaymentMethod, 
  setSelectedPaymentMethod,
  handleCreateOrder,
}) => {
  const totalAmount = getTotalWithWalletAndDiscount().total;
  const [discountedTiers, setDiscountTiers]= useState(null);
   // Fetch initial data from Firestore
   useEffect(() => {
    const fetchAdminControls = async () => {
      try {
        const adminDocRef = doc(db, 'controls', 'admin');
        const docSnap = await getDoc(adminDocRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
        
         setDiscountTiers(data.orderDiscounts);
        }
      } catch (error) {
        console.error("Error fetching admin controls:", error);
       
      }
    };

    fetchAdminControls();
  }, []);
  return (
    <div className="priceBlock-base-wrapper">
      <div className="priceBlock-base-container">
        <div className="coupons-base-content">
          <div className="coupon-image">
            <img src="/Images/icons/coupon.svg" alt="" />
            <div className="coupons-base-label">Apply Coupons</div>
          </div>
          <Coupon
            couponApplied={couponApplied}
            setCouponApplied={setCouponApplied}
            discount={discountPercentage}
            setDiscount={setDiscountPercentage}
            cartAmount={getSelectedTotalAmount()}
          />
        </div>
      </div>

      <div className="priceBlock-base-priceHeader">PRICE DETAILS (1 Item)</div>
      <div className="priceBreakUp-base-orderSummary" id="priceBlock">
      <div className="priceDetail-base-row priceDetail-totalMRP">
          <span>Total MRP</span>
          <span className="priceDetail-base-value">
            ₹{getSelectedAmount()}
          </span>
        </div>
        <div className="priceDetail-base-row">
          <span>Payable Amount</span>
          <span className="priceDetail-base-value">
            ₹{getSelectedTotalAmount()}
          </span>
        </div>
      
      {
        discountPercentage>0 && 
        <>
       
        <div className="priceDetail-base-row">
        <span>Coupon Discount</span>
        <span className="priceDetail-base-value priceDetail-base-action">
          -₹ {discountPercentage}
        </span>
      </div>
      {/* <div className="coupons-base-discountMessage"><span>You saved additional </span> <span>{discountPercentage}</span>
      </div> */}
      </>
      }
       {
        walletPoints>0 ? <>
           <div className="priceDetail-base-row">
          <span>Use Wallet Points ({walletPoints} points)</span>
          <span className="priceDetail-base-value priceDetail-base-discount">
            <input
              type="checkbox"
              className={`checkbox ${useWalletPoints ? "checked" : ""}`}
              checked={useWalletPoints}
              onChange={handleWalletCheckboxChange}
            />
          </span>
        </div>
        {
  useWalletPoints && (
    <div className="priceDetail-base-row">
      <span>Wallet Discount</span>
      <span className="priceDetail-base-value priceDetail-base-action">
        -₹ {walletPoints >= getSelectedTotalAmount() ? getSelectedTotalAmount() : walletPoints}
      </span>
    </div>
  )
}

        </>:<p className="coupons-base-discountMessage">No Wallet Points to use</p>
       }
     
      <div className="priceDetail-base-row">
          <span>Additional 5% OFF (if pay Online)</span>
          <span className="priceDetail-base-value priceDetail-base-action">
           5%
          </span>
        </div>
        <div className="priceDetail-base-row">
          <span className="priceDetail-base-value">
            {/* <span className="priceDetail-base-striked priceDetail-base-spaceRight">
              ₹79
            </span> */}
            <span className="priceDetail-base-discount">{shippingFee}</span>
          </span>
          <div className="priceDetail-base-convenienceCalloutText">
            Free shipping for you
          </div>
        </div>
        <div className="priceDetail-base-total">
          <span>Total Amount</span>
          <span className="priceDetail-base-value">
            ₹ {getTotalWithWalletAndDiscount().total}
          </span>
        </div>
      </div>
      {renderCartMessages(totalAmount,discountedTiers)}
      <PaymentMethod
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedPaymentMethod={setSelectedPaymentMethod}
        getTotalWithWalletAndDiscount={getTotalWithWalletAndDiscount}
        additionalDiscountRef={additionalDiscountRef}
        getTotalForCOD={getTotalForCOD}
      />
      <div className="priceBlock-button-desktop">
        <button onClick={handleCreateOrder}>PLACE ORDER ₹{getTotalWithWalletAndDiscount().total}</button>
      </div>
    
    </div>
  );
};

export default PriceDetails;
