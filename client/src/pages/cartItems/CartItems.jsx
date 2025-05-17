import React, { useState, useEffect, useContext,useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./cartitems.css";
import CartRow from "./CartRow";
import EmptyCart from "./EmptyCart";
//import PaymentMethod from "./PaymentMethod";
import axios from "axios";
import { UserContext } from "../../components/context/UserContext";
import { useWishlist } from "../../components/context/WishlistContext";
import { useCart } from "../../components/context/CartContext";
import { renderCartMessages } from "./cartUtils";
import PriceDetails from "./PriceDetails";
import PlaceOrder from "./PlaceOrder";
import Success from "./Success";
import { useAddress } from "../../components/context/AddressContext";
const CartItems = () => {
//  const navigate = useNavigate();
  const {selectedAddress} = useAddress();
  const [formData, setFormData] = useState({
    name: selectedAddress && selectedAddress.name,
    mobile: selectedAddress && selectedAddress.contactNo,
  });
const navigate = useNavigate();
  
 // User and Context Data
const { user } = useContext(UserContext);
const { fetchCartCount } = useCart();
const { toggleWishlist } = useWishlist();

// Payment and Discount States
const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("phonepe");
const [discountPercentage, setDiscountPercentage] = useState(0);
const [couponApplied, setCouponApplied] = useState("");
const [useWalletPoints, setUseWalletPoints] = useState(true);
const [walletPoints, setWalletPoints] = useState(null);
const additionalDiscountRef = useRef(0); // Additional discounts reference

// Cart and Product States
const [cartProducts, setCartProducts] = useState([]);
const [selectedItems, setSelectedItems] = useState({});
const [selectedProductIds, setSelectedProductIds] = useState([]);
const [selectedProduct, setSelectedProduct] = useState(null);
const [isAllSelected, setIsAllSelected] = useState(true); // Default: all selected

// Address and Checkout States
const [cartAddress, setCartAddress] = useState(null);

// UI and Interaction States
const [open, setOpen] = useState(false);
const [successOpen, setSuccessOpen] = useState(false);
const [showNotification, setShowNotification] = useState(false);
const [isActive, setIsActive] = useState(false);
const [loading, setLoading] = useState(false);

  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/cart/${user.uid}`
      );
      setCartProducts(response.data.cartItems);
    setCartAddress(response.data.cartAddress);
   // console.log(response.data.cart.cartAddress);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCartItems();
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

  useEffect(() => {
    const initialSelectedItems = {};
    cartProducts.forEach((item) => {
      initialSelectedItems[item.id] = true; // assuming every item is selected by default
    });
    setSelectedItems(initialSelectedItems);
  }, [cartProducts]);

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
      additionalDiscountRef.current = additionalDiscount; // Store it in useRef without causing re-renders
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
  
}
  const handleWalletCheckboxChange = () => {
    setUseWalletPoints(!useWalletPoints);
  };
  const [selectedProductDetails, setSelectedProductDetails] = useState([]);
  //const [selectedProductIds, setSelectedProductIds] = useState([]);

  const getSelectedProductDetails = () => {
    const details = [];
    const ids = [];

    Object.keys(selectedItems)
      .filter((id) => selectedItems[id]) // Include only selected items
      .forEach((id) => {
        const cartProduct = cartProducts.find((product) => product.id === id);
        if (cartProduct) {
          const { id, productId, color, height, quantity, size, product } = cartProduct;
          const { displayName } = product; // Extract `name`
        
          // Ensure `height` has a default value of "normal" if it's null
          let normalizedHeight = height || "normal";
         
         if (normalizedHeight === "aboveHeight") {
          normalizedHeight = "above";
        }
        if (normalizedHeight === "belowHeight") {
          normalizedHeight = "below";
        }
          // Add details and IDs separately
          details.push({ productId, color, heightType: normalizedHeight, quantity, size, productName: displayName });
          ids.push(id);
        }
        
      });

    setSelectedProductDetails(details);
    setSelectedProductIds(ids);

    return details;
  };

  // Call this function whenever the selected items or cart products change
  useEffect(() => {
    if (cartProducts.length) {
      getSelectedProductDetails();
    }
  }, [selectedItems, cartProducts]);

  const handleCheckboxChange = (id) => {
    const updatedSelected = { ...selectedItems, [id]: !selectedItems[id] };
    setSelectedItems(updatedSelected);
    setIsAllSelected(Object.values(updatedSelected).every(Boolean)); // check if all are selected
  };

  const handleSelectAll = () => {
    const updatedSelections = {};
  
    cartProducts.forEach((item) => {
      const isHeightBased = item.height;
      const inStock = isHeightBased
        ? item.product[item.height]?.quantities?.[item.color]?.[item.size] > 0
        : item.product.quantities[item.color]?.[item.size] > 0;
  
      // Add to selections only if the item is in stock
      if (inStock) {
        updatedSelections[item.id] = true;
      }
    });
  
    setIsAllSelected(true);
  
  };

  const handleDeselectAll = () => {
    const updatedSelections = {};
    cartProducts.forEach((item) => {
      updatedSelections[item.id] = false;
    });
    setSelectedItems(updatedSelections);
    setIsAllSelected(false);
  };

  const getSelectedTotalAmount = () => {
    let total = 0;
    cartProducts.forEach((item) => {
      const isHeightBased = item.height;
      const inStock = isHeightBased
        ? item.product[item.height]?.quantities?.[item.color]?.[item.size] > 0
        : item.product.quantities[item.color]?.[item.size] > 0;

      if (selectedItems[item.id] && inStock) {
        total += item.product.discountedPrice * item.quantity; // Only add price for items in stock and selected
      }
    });
    return total;
  };
  const getSelectedTotalMRP = () => {
    let total = 0;
    cartProducts.forEach((item) => {
      const isHeightBased = item.height;
      const inStock = isHeightBased
        ? item.product[item.height]?.quantities?.[item.color]?.[item.size] > 0
        : item.product.quantities[item.color]?.[item.size] > 0;

      if (selectedItems[item.id] && inStock) {
        total += item.product.price * item.quantity; // Only add price for items in stock and selected
      }
    });
    return total;
  };
  const getSelectedAmount = () => {
    let total = 0;
    cartProducts.forEach((item) => {
      const isHeightBased = item.height;
      const inStock = isHeightBased
        ? item.product[item.height]?.quantities?.[item.color]?.[item.size] > 0
        : item.product.quantities[item.color]?.[item.size] > 0;

      if (selectedItems[item.id] && inStock) {
        total += item.product.price * item.quantity; // Only add price for items in stock and selected
      }
    });
    return total;
  };
  const handleMoveToWishlist = async (
    wishlistItemID,
    productID,
    cartItemId
  ) => {
   
    try {
      setIsActive(true);
      await toggleWishlist(wishlistItemID, productID);
    } catch (error) {
      console.error("Error adding item to wishlist:", error);
    }

    try {
      await handleRemoveFromCart(user.uid, cartItemId);
    } catch (error) {
      console.error("Error removing item from cart:", error);
    }
    setIsActive(false);
  };

  const handleRemoveFromCart = async (uid, cartItemId) => {
   
    setIsActive(true);
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/cart/delete/${cartItemId}`,
        {
          data: { uid: uid },
        }
      );
    
      fetchCartCount();

      // Update the cartProducts state to remove the deleted item
      setCartProducts((prevCartProducts) =>
        prevCartProducts.filter((item) => item.id !== cartItemId)
      );

      handleClose();
    } catch (error) {
      console.error(
        "Error removing item from cart:",
        error.response || error.message
      );
    }
    setIsActive(false);
  };
  const orderDetails = {
    uid: user.uid,
    modeOfPayment: selectedPaymentMethod,
    totalAmount: getSelectedTotalMRP(),
    payableAmount: getTotalWithWalletAndDiscount().total,
    discount: getSelectedTotalAmount() - getTotalWithWalletAndDiscount().total,
    lushioCurrencyUsed: useWalletPoints && walletPoints,
    couponCode: couponApplied,
    couponDiscount: getTotalWithWalletAndDiscount().couponDiscountAmount || 0,
    onlinePaymentDiscount: getTotalWithWalletAndDiscount().additionalDiscount || 0,
    address: selectedAddress,
    orderedProducts: selectedProductDetails,
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
    ...data,  // Override or add properties from paymentData
  };

  

    await axios
      .post(
        `${process.env.REACT_APP_API_URL}/payment/`,
        combinedData
      )
      .then((response) => {
   
        // setPaymentData(response.data);
        if (
          response.data
          && response.data.data.instrumentResponse.redirectInfo.url
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
 const sendEmail = async(oid) => {
  try {
    const payload = {
      email: user.email,
      name : orderDetails.address.name || "User",
      type: "order",
      orderId: oid,
    //  address: orderDetails.email,
      items: orderDetails.orderedProducts,
     // item: items[0]?.name || '', // fallback for 'cancel' single item
    };

    await axios.post(`${process.env.REACT_APP_API_URL}/sendEmail`, payload);
   
  } catch (err) {
    console.error('Error:', err);
   
  }
 }
  const createOrder = async () => {
    try {
      console.log(orderDetails.orderedProducts);
      // if(1){
      //   console.log(orderDetails.address.name);
      //   return;
      // }
      setIsActive(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/orders/createOrder`,
        orderDetails
      );
     
   //   await deleteCartItems(selectedProductIds);
      setIsActive(false);
      setSuccessOpen(true);
     // setTimeout(() => setSuccessOpen(false), 4000);
      // Wait for 4 seconds before closing the success state
      await deleteCartItems();
  await new Promise((resolve) => setTimeout(resolve, 2000));
  if(response.status===200 && user.email){
await sendEmail(response.data.orderId);
  }
  setSuccessOpen(false);
     
    } catch (error) {
      console.log(error);
    }
    finally{
      setIsActive(false);
    }
  };
  const handleCreateOrder = async () => {
    if (!selectedAddress) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }
    if (selectedPaymentMethod === "phonepe") {
      await handlePayment();
     // await createOrder();
    } else {
      await createOrder();
   
    }
  };
  const deleteCartItems = async (arrayData) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/cart/batch-delete`,
        {
          uid: user.uid,
          itemIds: selectedProductIds,
        }
      );

      // Handle the response
    
navigate("/user/orders");
fetchCartCount();
      // Return the response if needed
      return response.data;
    } catch (error) {
      console.error("Error while sending data to the backend:", error);
    }
  };
  if (loading)
    return (
      <div className="loader-container">
        {" "}
        <span className="loader"></span>
      </div>
    );
  if (cartProducts.length === 0) {
    return <EmptyCart />; // Render empty cart message
  }

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
        <strong>{(cartAddress?.name || selectedAddress?.name) ?? ""},</strong>{" "}
        <strong>{(cartAddress?.pinCode || selectedAddress?.pinCode) ?? ""} </strong>
      </div>

      <span>{(cartAddress?.flatDetails || selectedAddress?.flatDetails) ?? ""},</span>
      <span>{(cartAddress?.areaDetails || selectedAddress?.areaDetails) ?? ""},</span>
      {(cartAddress?.landmark || selectedAddress?.landmark) && (
        <span>{(cartAddress?.landmark || selectedAddress?.landmark) ?? ""},</span>
      )}
      <span>
        {(cartAddress?.townCity || selectedAddress?.townCity) ?? ""},{" "}
        {(cartAddress?.state || selectedAddress?.state) ?? ""},
      </span>
    </div>
  ) : (
    <p>No addresses found. Please add a new address.</p>
  )}
  <PlaceOrder />
</div>
{/* <button onClick={()=>sendEmail("123456")}> Click Me</button> */}
      {/* <button onClick={()=>handleSubmit()}>submit </button> */}
      <Success successOpen={successOpen} setSuccessOpen={setSuccessOpen} />
      <div className="cartitems">
        <div className="select-all-buttons">
          {isAllSelected ? (
            <button className="select-button" onClick={handleDeselectAll}>
              Deselect All
            </button>
          ) : (
            <button className="select-button" onClick={handleSelectAll}>
              Select All
            </button>
          )}
          <div className="cart-items">
            {cartProducts.map((item, i) => (
              <CartRow
                key={i}
                item={item}
                selectedItems={selectedItems}
                handleCheckboxChange={handleCheckboxChange}
                handleOpen={handleOpen}
                handleClose={handleClose}
                open={open}
                selectedProduct={selectedProduct}
                handleMoveToWishlist={handleMoveToWishlist}
                handleRemoveFromCart={handleRemoveFromCart}
                setCartProducts={setCartProducts}
              />
            ))}
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
      💰 Upgrade to online payment and save ₹{additionalDiscountRef.current} instantly!
    </p>
  )}
  {selectedPaymentMethod === "phonepe" && (
    <p className="discount-message">
      🎉 Great choice! Enjoy ₹{additionalDiscountRef.current} off by paying with PhonePe.
    </p>
  )}
  <button onClick={handleCreateOrder} className="proceed-to-pay-button">
    🛒 Place Order – ₹{getTotalWithWalletAndDiscount().total || 0}
  </button>
</div>
{/* <PaymentSelectionWithAnimation/> */}
    </>
  );
};

export default CartItems;
