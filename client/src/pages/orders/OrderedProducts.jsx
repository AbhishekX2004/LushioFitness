import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import ReturnExchange from "./ReturnExchange";
import axios from "axios";
import { UserContext } from "../../components/context/UserContext";
import { toast } from "react-toastify";
import BankDetailsPopup from './BankDetailsPopUp'; 
const OrderedProducts = ({ orderedProducts, canReturn, orderId, modeOfPayment }) => {
  const [items, setItems] = useState({});
  const [showBankDetailsPopup, setShowBankDetailsPopup] = useState(false);
const [bankDetails, setBankDetails] = useState(null);

  const [payloadForMail, setPayloadForMail] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(UserContext);
  const updateItems = (newItem) => {
    setItems((prevItems) => ({
      ...prevItems,
      ...newItem,
    }));
  };

  const sendEmail = async () => {
    try {
      const payload = {
        email: user.email,
        name: user.displayName || "User",
        type: "return-request",
        orderId: orderId,
        //  address: orderDetails.email,
        items: payloadForMail,
        // item: items[0]?.name || '', // fallback for 'cancel' single item
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/sendEmail`, payload);
      setPayloadForMail([]);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const processReturnRequest = async () => {
  setLoading(true);

  const requestBody = {
    uid: user?.uid,
    oid: orderId,
    items,
    }
  

  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/returnExchange/process-return-exchange`,
      requestBody
    );

     console.log("Response:", response.data);
      if (response.status === 200 && user.email) {
        await sendEmail();
      }
      toast.success("Return/Exchange request submitted successfully!");
      setItems({});
      setBankDetails(null);
  } catch (error) {
    if (error.response?.status === 403) {
      toast.error("Return already initiated", {
        className: "custom-toast-error",
      });
    } else {
      toast.error("Failed to submit request. Try again.", {
        className: "custom-toast-error",
      });
    }
  } finally {
    setLoading(false);
  }
};

 const handleSubmit = async () => {
  if (Object.keys(items).length === 0) {
    toast.error("No items selected for Return/Exchange.", {
      className: "custom-toast-error",
    });
    return;
  }

  if (modeOfPayment === "cashOnDelivery") {
    // COD: show bank popup if no details submitted yet
    if (!bankDetails) {
      setShowBankDetailsPopup(true);
      return;
    }

    // If bank details already set → it means popup was submitted
    await processReturnRequest();
  } else {
    // For prepaid etc., no need for bank info
    await processReturnRequest();
  }
};

const handleBankDetailsSubmit = async (details) => {
  try {
    setLoading(true);
    setShowBankDetailsPopup(false);

    const res = await axios.post(`${process.env.REACT_APP_API_URL}/returns/payDetails`, {
      uid: user?.uid,
      oid: orderId,
      details,
    });

    if (res.data.success) {
      setBankDetails(details);
      await processReturnRequest(); // continue with return
    } else {
      toast.error("Failed to save refund details. Try again.");
    }
  } catch (err) {
    console.error("Error submitting bank details:", err);
    toast.error("Could not submit bank details.");
  } finally {
    setLoading(false);
  }
};


const handleBankDetailsClose = () => {
  setShowBankDetailsPopup(false);
  setBankDetails(null);
};
  return (
    <div className="ordered-products-container">
       {loading && (
        <div className="spinner-overlay">
          <div></div>
        </div>
      )}
      <h2 className="ordered-products-heading">Ordered Products</h2>
      <div className="ordered-products-list">
        {orderedProducts.map((product, index) => (
          <div className="ordered-product-wrapper" key={product?.id || index}>
            <div className="ordered-product">
              <Link to={`/product/${product?.productDetails?.id}`}>
                <img
                  src={product?.productDetails?.cardImages?.[0]}
                  alt={product?.name || "Product"}
                  className="ordered-product-image"
                />
              </Link>

              <div className="ordered-product-details">
                <p className="ordered-product-name">
                  {product?.productName || product?.name}
                </p>
                <p>
                  <strong>Price:</strong> ₹
                  {product.productDetails.discountedPrice} x {product.quantity}{" "}
                  = ₹{product.productDetails.discountedPrice * product.quantity}
                </p>
                <p className="ordered-product-info">
                  Quantity: {product?.quantity}
                </p>

                <p className="ordered-product-info">
                  Height: {product?.heightType || "Normal"}
                </p>

                <p className="ordered-product-info">
                  Color: {product?.color}
                  <span
                    className="color-box"
                    style={{
                      display: "inline-block",
                      marginLeft: "5px",
                      width: "10px",
                      height: "10px",
                      backgroundColor:
                        product?.productDetails?.colorOptions?.find(
                          (color) => color.name === product?.color
                        )?.code,
                    }}
                  ></span>
                </p>
                <p className="ordered-product-info">Size: {product?.size}</p>
              </div>
            </div>

           
            <ReturnExchange
              key={product.id}
              title="RETURN/EXCHANGE PRODUCT"
              canReturn={canReturn}
              identifier={product.opid}
              orderId={orderId}
              product={product}
              payloadForMail={payloadForMail}
              setPayloadForMail={setPayloadForMail}
              updateItems={updateItems}
            />
          </div>
        ))}
         <BankDetailsPopup
      isOpen={showBankDetailsPopup}
      onClose={handleBankDetailsClose}
      onSubmit={handleBankDetailsSubmit}
    />
        <button className="final-submit-button" onClick={handleSubmit}>
          Submit Return/Exchange Request
        </button>
      </div>
    </div>
  );
};

export default OrderedProducts;
