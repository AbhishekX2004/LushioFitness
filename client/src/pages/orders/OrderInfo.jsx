import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from 'react-toastify'; 
import { useParams } from "react-router-dom";
import { UserContext } from "../../components/context/UserContext";
import "./orderinfo.css";
import TrackingDetails from "./Tracking/TrackingDetails";
import InvoicePreview from "./InvoicePreview";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import OrderTracking from "./OrderTracking";
//import { FaCopy, FaCheck } from "react-icons/fa";
import { FiCopy } from "react-icons/fi";
//import { AiOutlineCheckCircle } from "react-icons/ai";
import { AiOutlineCheck } from "react-icons/ai";
import { FaChevronRight } from "react-icons/fa";
import OrderedProducts from "./OrderedProducts";
import ReturnExchange from "./ReturnExchange";
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
  
  const [invoiceData, setInvoiceData] = useState({
    clientName: "Manoj",
    invoiceNumber: "123456779669",
    date: "23/12/24",
    items:  [
      { description: "hi there", quantity: 1, price: 1200 },
      { description: "item two", quantity: 2, price: 800 },
      { description: "item three", quantity: 3, price: 1500 },
      { description: "item four", quantity: 1, price: 500 },
      { description: "item five", quantity: 4, price: 2000 },
    ],
    totalAmount: 1200,
  });
  const generateInvoice = async (orderId) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/orderAdmin/invoice`, { oid: orderId });
    
     window.location.href = response.data?.invoice_url;;
      
    } catch (err) {
      console.log(err.message)
    }
  };
  const handledownloadInvoice = async (orderDetails) => {
  console.log(orderDetails?.shiprocket?.invoice?.invoice_url);
    if(orderDetails?.shiprocket?.invoice?.invoice_url){
      window.location.href = orderDetails?.shiprocket?.invoice?.invoice_url;
    }
    else{
      await generateInvoice(orderId);
    }
     }
  const downloadPDF = async () => {
    const invoiceElement = document.getElementById("invoice-preview");
  
    // Generate canvas
    const canvas = await html2canvas(invoiceElement, { scale: 2 });
  
    // Convert canvas to image data with reduced quality
    const imgData = canvas.toDataURL("image/jpeg", 1.5); // Use JPEG with a quality setting (0.85 = 85% quality)
  
    // Initialize jsPDF
    const pdf = new jsPDF("p", "mm", "a4");
  
    // Calculate the dimensions of the A4 page
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
  
    // Scale the image proportionally to fit A4 dimensions
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2; // Center the image horizontally
    const imgY = 0; // Start at the top of the page
  
    // Add the image to the PDF
    pdf.addImage(imgData, "JPEG", imgX, imgY, imgWidth * ratio, imgHeight * ratio, undefined, "FAST");
  
    // Save the PDF with compression
    pdf.save(`invoice-${invoiceData.invoiceNumber || "preview"}.pdf`);
  };

  if (loading)
    return (
      <div className="loader-container">
        {" "}
        <span className="loader"></span>
      </div>
    );
  return (
    <>
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
      {/* <h1>Download Invoice</h1> */}
      {/* <InvoiceForm invoiceData={invoiceData} setInvoiceData={setInvoiceData} /> */}
      <InvoicePreview data={invoiceData} />
      {/* <TrackingDetails oid="mUmJTgrZ1nu2lCvH5GAw" uid="WUMRFsuouMTVX802XL80kDSDMiP2" /> */}

      <ReturnExchangeNotice/>
      <OrderedProducts orderedProducts={orderDetails?.orderedProducts || []} canReturn={canReturn} orderId={orderId}/>

      <div className="order-tracking-vertical-container">
        <h2 className="order-tracking-vertical-heading">Delivery Status</h2>
        <div className="order-tracking-progress-bar">
          <div
            className="order-tracking-progress"
            style={{ height: `${(currentStep / steps.length) * 100}%` }}
          ></div>
        </div>
        <div className="order-tracking-vertical-steps">
          {steps.map((step, index) => (
            <div
              className={`order-tracking-vertical-step ${
                index + 1 <= currentStep ? "active" : ""
              }`}
              key={index}
            >
              <div className="order-tracking-vertical-icon">
                {index < currentStep && (
                  <AiOutlineCheck className="order-tracking-check-icon" />
                )}
              </div>
              <p className="order-tracking-vertical-label">{step}</p>
            </div>
          ))}
        </div>
      </div>
     
      <div className="orderId-container downloadInvoicePdf" onClick={()=>handledownloadInvoice(orderDetails)}>
        <div className="orderId-left" >
          <h4 className="orderId-heading">DOWNLOAD INVOICE</h4>
        </div>
        <div className="orderId-right">
          <FaChevronRight />
        </div>
      </div>
      {/* <OrderTrackingTimeline trackingData={trackingData} /> */}
  
        {/*  <ReturnExchange/> */}
      <div className="order-price-details-container">
        <h2 className="order-price-details-heading">Order Details</h2>
        <h4 className="order-price-details-heading">Price Details ({orderDetails?.orderedProducts.length || 0} Items)</h4>
        <div className="order-price-row">
          <span className="order-price-label">Total MRP</span>
          <span className="order-price-value">₹{orderDetails?.totalAmount}</span>
        </div>
        <div className="order-price-row">
          <span className="order-price-label">Payable Amount</span>
          <span className="order-price-value">₹{orderDetails?.totalAmount}</span>
        </div>
       
        {orderDetails?.lushioCurrencyUsed > 0 && (
  <div className="order-price-row">
    <span className="order-price-label">Wallet Discount</span>
    <span className="order-price-value">-₹{orderDetails.lushioCurrencyUsed}</span>
  </div>
  
)}
 <div className="order-price-row">
          <span className="order-price-label">Coupon Discount</span>
          <span className="order-price-value">-₹{orderDetails?.totalAmount - orderDetails?.payableAmount - orderDetails?.discount}</span>
        </div>

     
        <div className="order-price-row order-total">
          <span className="order-price-label">Grand Total</span>
          <span className="order-price-value">₹{orderDetails?.payableAmount}</span>
        </div>
      </div>
      <div className="order-delivery-container">
        <h2 className="order-delivery-heading">Delivery Address</h2>
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
      </div>
    </>
  );
}

export default OrderInfo;
