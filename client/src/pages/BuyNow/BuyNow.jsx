import React, { useState, useContext, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAddress } from "../../components/context/AddressContext";
import PriceDetails from "../cartItems/PriceDetails";
import CartRow from "./CartRow";
import { UserContext } from "../../components/context/UserContext";
import { renderCartMessages } from "../cartItems/cartUtils";
import Success from "../cartItems/Success";
import AddressModal from "../cartItems/AddressModal";
import axios from "axios";
const BuyNow = ({ product, selectedHeight, selectedColor, selectedSize }) => {
  //  const navigate = useNavigate();
  const { selectedAddress } = useAddress();
  const [formData, setFormData] = useState({
    name: selectedAddress && selectedAddress.name,
    mobile: selectedAddress && selectedAddress.contactNo,
  });
  const navigate = useNavigate();
  console.log(selectedHeight);
  // User and Context Data
  const { user } = useContext(UserContext);

  // Payment and Discount States
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("phonepe");
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [couponApplied, setCouponApplied] = useState("");
  const [useWalletPoints, setUseWalletPoints] = useState(true);
  const [walletPoints, setWalletPoints] = useState(null);
  const additionalDiscountRef = useRef(0); // Additional discounts reference
  const [quantity, setQuantity] = useState(1);

  const [selectedProduct, setSelectedProduct] = useState(null);

  // Address and Checkout States
  const [cartAddress, setCartAddress] = useState(null);

  // UI and Interaction States
  const [open, setOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showNotification1, setShowNotification1] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCartAddress = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/cart/${user.uid}`
      );

      setCartAddress(response.data.cart.cartAddress);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCartAddress();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/wallet/${user.uid}`
          );
          const data = response.data;
          setWalletPoints(data.totalCredits);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };
      fetchUserData();
    }
  }, [user]);

  const handleOpen = (e) => {
    setSelectedProduct(e);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const getTotalWithWalletAndDiscount = () => {
    let total = getSelectedTotalAmount();
    let walletAppliedAmount = 0;
    let couponDiscountAmount = 0;
    let additionalDiscount = 0;

    // Apply wallet points if applicable
    if (useWalletPoints && walletPoints > 0) {
      walletAppliedAmount = Math.min(walletPoints, total); // Wallet points applied
      total = Math.max(0, total - walletPoints); // Ensure total doesn't go below zero
    }

    // Calculate coupon discount
    couponDiscountAmount = Math.ceil(discountPercentage); // Calculate coupon discount
    total = Math.max(0, total - couponDiscountAmount); // Apply coupon discount and ensure total doesn't go below zero

    // Apply additional discount for payment method
    if (selectedPaymentMethod !== "cashOnDelivery") {
      additionalDiscount = Math.ceil(total * 0.05); // 5% additional discount for online payment
      additionalDiscountRef.current = additionalDiscount;
      total = Math.max(0, total - additionalDiscount); // Apply additional discount and ensure total doesn't go below zero
    }

    return {
      total: Math.ceil(total),
      walletAppliedAmount,
      couponDiscountAmount,
      additionalDiscount,
    };
  };

  const getTotalForCOD = () => {
    let total = getSelectedTotalAmount();
    let walletAppliedAmount = 0;
    let couponDiscountAmount = 0;
    let additionalDiscount = 0;

    // Apply wallet points if applicable
    if (useWalletPoints && walletPoints > 0) {
      walletAppliedAmount = Math.min(walletPoints, total); // Wallet points applied
      total = Math.max(0, total - walletPoints); // Ensure total doesn't go below zero
    }

    // Calculate coupon discount
    couponDiscountAmount = Math.ceil(discountPercentage); // Calculate coupon discount
    total = Math.max(0, total - couponDiscountAmount); // Apply coupon discount and ensure total doesn't go below zero
    return Math.ceil(total);
  };
  const handleWalletCheckboxChange = () => {
    setUseWalletPoints(!useWalletPoints);
  };
 // const [selectedProductDetails, setSelectedProductDetails] = useState([]);
  //const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Call this function whenever the selected items or cart products change

  const getSelectedTotalAmount = () => {
    return product.discountedPrice * quantity;
  };
  const getSelectedTotalMRP = () => {
    return product.price * quantity;
  };
  const getSelectedAmount = () => {
    return product.price * quantity;
  };
const normalizedHeight = {
  aboveHeight: "above",
  belowHeight: "below",
}[selectedHeight] || selectedHeight || "normal";

  const orderDetails = {
    uid: user.uid,
    modeOfPayment: selectedPaymentMethod,
    totalAmount: getSelectedTotalMRP(),
    payableAmount: getTotalWithWalletAndDiscount().total,
    discount: getSelectedTotalAmount() - getTotalWithWalletAndDiscount().total,
    lushioCurrencyUsed: useWalletPoints && walletPoints,
    couponCode: couponApplied,
    couponDiscount: getTotalWithWalletAndDiscount().couponDiscountAmount || 0,
    onlinePaymentDiscount:
      getTotalWithWalletAndDiscount().additionalDiscount || 0,
    address: selectedAddress,
    //  orderedProducts: selectedProductDetails,
    orderedProducts: [
      {
        productId: product.id,
        color: selectedColor,
        heightType: normalizedHeight,
        quantity: quantity,
        size: selectedSize,
        productName: product.displayName,
      },
    ],
    lushioCashBack: 0,
    //   paymentData: paymentData,
  };

  const handlePayment = async () => {
    const { name, mobile } = formData;
    setIsActive(true);
    const data = {
      name,
      mobile,
      amount: getTotalWithWalletAndDiscount().total,
      MUID: "MUIDW" + Date.now(),
      transactionId: "T" + Date.now(),
    };
    // Combine orderDetails with paymentData
    const combinedData = {
      ...orderDetails, // Include all the properties of orderDetails
      ...data, // Override or add properties from paymentData
    };

    await axios
      .post(`${process.env.REACT_APP_API_URL}/payment/`, combinedData)
      .then((response) => {
        // setPaymentData(response.data);
        if (
          response.data &&
          response.data.data.instrumentResponse.redirectInfo.url
        ) {
          window.location.href =
            response.data.data.instrumentResponse.redirectInfo.url;
        } else {
          console.error("Redirect URL not found in response:", response.data);
        }
      })
      .catch((error) => {
        console.log("Error:", error);
      });
    setIsActive(false);
  };
  const sendEmail = async (oid) => {
    try {
      const payload = {
        email: user.email,
        name: orderDetails.address.name || "User",
        type: "order",
        orderId: oid,
        //  address: orderDetails.email,
        items: orderDetails.orderedProducts,
        // item: items[0]?.name || '', // fallback for 'cancel' single item
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/sendEmail`, payload);
    } catch (err) {
      console.error("Error:", err);
    }
  };
  const createOrder = async () => {
    try {
      console.log(orderDetails.orderedProducts);

      setIsActive(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/orders/createOrder`,
        orderDetails
      );

      setIsActive(false);
      setSuccessOpen(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (response.status === 200 && user.email) {
        await sendEmail(response.data.orderId);
      }
      setSuccessOpen(false);
      navigate("/user/orders");
    } catch (error) {
      console.log(error);
    } finally {
      setIsActive(false);
    }
  };
  const handleCreateOrder = async () => {
    if (!selectedAddress) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }
    if (getTotalWithWalletAndDiscount().total <= 0) {
      setShowNotification1(true);
      setTimeout(() => setShowNotification1(false), 3000);
      return;
    }
     if(1){
      console.log(orderDetails);
      return;
    }
    if (selectedPaymentMethod === "phonepe") {
      await handlePayment();
      // await createOrder();
    } else {
      await createOrder();
    }
  };

  if (loading)
    return (
      <div className="loader-container">
        {" "}
        <span className="loader"></span>
      </div>
    );

  const shippingFee = "FREE";

  return (
    <>
      {showNotification && (
        <div className="notification-container">
          <div className="cart-notification" style={{ aspectRatio: 180 / 25 }}>
            Select Address to Proceed
          </div>
        </div>
      )}
      {showNotification1 && (
        <div className="notification-container">
          <div
            className="cart-notification amount-notification"
            style={{ aspectRatio: 180 / 25 }}
          >
            Amount Must be greater than zero
          </div>
        </div>
      )}
      {isActive && (
        <div className="spinner-overlay">
          <div></div>
        </div>
      )}
      <div className="selected-address-container">
        {cartAddress || selectedAddress ? (
          <div className="selected-address">
            <h4>Delivery Address:</h4>
            <div style={{ display: "flex" }}>
              <strong>
                {(cartAddress?.name || selectedAddress?.name) ?? ""},
              </strong>{" "}
              <strong>
                {(cartAddress?.pinCode || selectedAddress?.pinCode) ?? ""}{" "}
              </strong>
            </div>

            <span>
              {(cartAddress?.flatDetails || selectedAddress?.flatDetails) ?? ""}
              ,
            </span>
            <span>
              {(cartAddress?.areaDetails || selectedAddress?.areaDetails) ?? ""}
              ,
            </span>
            {(cartAddress?.landmark || selectedAddress?.landmark) && (
              <span>
                {(cartAddress?.landmark || selectedAddress?.landmark) ?? ""},
              </span>
            )}
            <span>
              {(cartAddress?.townCity || selectedAddress?.townCity) ?? ""},{" "}
              {(cartAddress?.state || selectedAddress?.state) ?? ""},
            </span>
          </div>
        ) : (
          <p>No addresses found. Please add a new address.</p>
        )}
        <AddressModal setCartAddress={setCartAddress} />
      </div>

      <Success successOpen={successOpen} setSuccessOpen={setSuccessOpen} />
      <div className="cartitems">
        <div className="select-all-buttons">
          <div className="cart-items">
            <CartRow
              // key={i}
              item={product}
              quantity={quantity}
              setQuantity={setQuantity}
              handleOpen={handleOpen}
              handleClose={handleClose}
              open={open}
              selectedHeight={selectedHeight}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
            />
          </div>
        </div>
        <PriceDetails
          couponApplied={couponApplied}
          setCouponApplied={setCouponApplied}
          discountPercentage={discountPercentage}
          setDiscountPercentage={setDiscountPercentage}
          walletPoints={walletPoints}
          useWalletPoints={useWalletPoints}
          handleWalletCheckboxChange={handleWalletCheckboxChange}
          getSelectedTotalAmount={getSelectedTotalAmount}
          getSelectedAmount={getSelectedAmount}
          additionalDiscountRef={additionalDiscountRef}
          getTotalForCOD={getTotalForCOD}
          getTotalWithWalletAndDiscount={getTotalWithWalletAndDiscount}
          renderCartMessages={renderCartMessages}
          shippingFee={shippingFee}
          selectedPaymentMethod={selectedPaymentMethod}
          setSelectedPaymentMethod={setSelectedPaymentMethod}
          handleCreateOrder={handleCreateOrder}
        />
      </div>

      <div className="priceBlock-button-mobile">
        {selectedPaymentMethod === "cashOnDelivery" && (
          <p className="discount-message">
            💰 Upgrade to online payment and save ₹
            {additionalDiscountRef.current} instantly!
          </p>
        )}
        {selectedPaymentMethod === "phonepe" && (
          <p className="discount-message">
            🎉 Great choice! Enjoy ₹{additionalDiscountRef.current} off by
            paying with PhonePe.
          </p>
        )}
        <button onClick={handleCreateOrder} className="proceed-to-pay-button">
          🛒 Place Order – ₹{getTotalWithWalletAndDiscount().total || 0}
        </button>
      </div>
    </>
  );
};

export default BuyNow;
