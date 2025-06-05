import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from 'react-toastify'; 
import { useParams } from "react-router-dom";
import { UserContext } from "../../components/context/UserContext";
import AddressModal from "./AddressModal";
import "./orderinfo.css";
import DeliveryTrackingUI from "./Tracking/DeliveryTrackingUi";
import OrderTracking from "./OrderTracking";
//import { FaCopy, FaCheck } from "react-icons/fa";
import { FiCopy } from "react-icons/fi";
//import { AiOutlineCheckCircle } from "react-icons/ai";
import { AiOutlineCheck } from "react-icons/ai";
import { FaChevronRight } from "react-icons/fa";
import OrderedProducts from "./OrderedProducts";
//import ReturnExchange from "./ReturnExchange";
import ReturnExchangeNotice from "./ReturnExchangeNotice";
//import Accordion from "./Accordian";
import { db } from '../../firebaseConfig'; 
import { doc, getDoc } from 'firebase/firestore';
function OrderInfo() {
  const [copied, setCopied] = useState(false);
  const { orderId } = useParams();
  const { user } = useContext(UserContext);
  const [orderDetails, setOrderDetails] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [canReturn,setCanReturn] = useState(true);
  const steps = ["Order Placed", "Shipped", "Out for Delivery", "Delivered"];
  const currentStep = 3; // Hardcoded current step (1-based index)
  const handleCopy = () => {
    navigator.clipboard.writeText(orderId).then(() => {
      setCopied(true);
      // setTimeout(() => setCopied(false), 2000);
    });
  };
 
  useEffect(() => {
    const fetchData = async () => {
      if (!orderId) return;
  
      setLoading(true);
  
      try {
        const uid = user.uid;
  
        // Fetch both order details and admin controls simultaneously
        const [orderResponse, adminDocSnap] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/orders/${orderId}?uid=${uid}`),
          getDoc(doc(db, "controls", "admin"))
        ]);
  
        // Handle order details
        setOrderDetails(orderResponse.data);
  
        // Handle admin controls
        if (adminDocSnap.exists()) {
          const adminData = adminDocSnap.data();
          setCanReturn(adminData.returnEnabled);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }; 
  
    fetchData();
  }, [orderId]);
  function getTotalPayableAmount(orderedProducts) {
    console.log(orderedProducts);
     if (!Array.isArray(orderedProducts)) return 0;
  return orderedProducts.reduce((total, product) => {
    const quantity = product.quantity || 0;
    const discountedPrice = product.productDetails?.discountedPrice || 0;
    return total + (quantity * discountedPrice);
  }, 0);
}

 
  const generateInvoice = async (orderId) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/orderAdmin/invoice`, { oid: orderId });
    
     window.location.href = response.data?.invoice_url;;
      
    } catch (err) {
      console.log(err.message)
    }
  };
  const handledownloadInvoice = async (orderDetails) => {
 // console.log(orderDetails?.shiprocket?.invoice?.invoice_url);
    if(orderDetails?.shiprocket?.invoice?.invoice_url){
      window.location.href = orderDetails?.shiprocket?.invoice?.invoice_url;
    }
    else{
      await generateInvoice(orderId);
    }
     }
  if (loading)
    return (
      <div className="loader-container">
        {" "}
        <span className="loader"></span>
      </div>
    );
  return (
    <div className="order-info-wrapper">
      <div className="orderId-container">
        <div className="orderId-left">
          <h4 className="orderId-heading">ORDER ID</h4>
          <p className="orderId">{orderId}</p>
          <p>
            Payment Mode <strong>{orderDetails?.modeOfPayment==="cashOnDelivery"?"Cash On Delivery":"Online Payment"}</strong>
          </p>
        </div>
      
        <div className="orderId-right" onClick={handleCopy}>
          {copied ? (
            <div className="orderId-copiedContainer">
              <AiOutlineCheck className="orderId-checkIcon" />
              <p className="orderId-text">Copied</p>
            </div>
          ) : (
            <div className="orderId-copyContainer">
              <FiCopy className="orderId-copyIcon" />
              <p className="orderId-text">Copy</p>
            </div>
          )}
        </div>
      </div>

      <ReturnExchangeNotice/>
      <OrderedProducts orderedProducts={orderDetails?.orderedProducts || []} canReturn={canReturn} orderId={orderId}/>
     
      <div className="orderId-container downloadInvoicePdf" onClick={()=>handledownloadInvoice(orderDetails)}>
        <div className="orderId-left" >
          <h4 className="orderId-heading">DOWNLOAD INVOICE</h4>
        </div>
        <div className="orderId-right">
          <FaChevronRight />
        </div>
      </div>
      <DeliveryTrackingUI/>
      <div className="order-price-details-container">
        {/* <h2 className="order-price-details-heading">Order Details</h2> */}
        <h4 className="order-price-details-heading">Price Details ({orderDetails?.orderedProducts.length || 0} Items)</h4>
        <div className="order-price-row">
          <span className="order-price-label">Total MRP</span>
          <span className="order-price-value">₹{orderDetails?.totalAmount}</span>
        </div>
        <div className="order-price-row">
          <span className="order-price-label">Payable Amount</span>
          <span className="order-price-value">₹{getTotalPayableAmount(orderDetails?.orderedProducts)}</span>
        </div>
       
        {orderDetails?.lushioCurrencyUsed > 0 && (
  <div className="order-price-row">
    <span className="order-price-label">Wallet Discount</span>
    <span className="order-price-value">-₹{orderDetails.lushioCurrencyUsed}</span>
  </div>
  
)}
  {orderDetails?.couponDiscount > 0 && (
  <div className="order-price-row">
    <span className="order-price-label">Coupon Discount</span>
    <span className="order-price-value">-₹{orderDetails.couponDiscount}</span>
  </div>
  
)}
  {orderDetails?.onlinePaymentDiscount > 0 && (
  <div className="order-price-row">
    <span className="order-price-label">Online Payment Discount</span>
    <span className="order-price-value">-₹{orderDetails.onlinePaymentDiscount}</span>
  </div>
  
)}

     
        <div className="order-price-row order-total">
          <span className="order-price-label">Grand Total</span>
          <span className="order-price-value">₹{orderDetails?.payableAmount}</span>
        </div>
      </div>
      <div className="order-delivery-container">
        <div className="order-delivery-heading">
          <img className="location-icon" src="/Images/location.png" alt="location-icon"/>
   <h2 >Delivery Address</h2>
        </div>
     
        <div className="order-delivery-details">
          <p className="order-delivery-name">{orderDetails?.address.name}</p>
          <p className="order-delivery-address">
          {orderDetails?.address.flatDetails}{", "}{orderDetails?.address.areaDetails}{", "}{orderDetails?.address.townCity}{", "}{orderDetails?.address.state}
            <br />
           {orderDetails?.address.pinCode}
          </p>
        {orderDetails?.address.landmark &&  <p><strong>Landmamrk: </strong>{orderDetails?.address.landmark}</p>} 
          <p className="order-delivery-contact">+{orderDetails?.address.contactNo}</p>
        </div>
      
        <AddressModal orderId={orderId}/>
      </div>
    </div>
  );
}

export default OrderInfo;
