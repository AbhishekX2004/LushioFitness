import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import ReturnExchange from "./ReturnExchange";
import axios from "axios";
import { UserContext } from "../../components/context/UserContext";
import { toast } from "react-toastify";
const OrderedProducts = ({ orderedProducts, canReturn, orderId }) => {
  const [items, setItems] = useState({});
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
    } catch (err) {
      console.error("Error:", err);
    }
  };
  const handleSubmit = async () => {
    if (Object.keys(items).length === 0) {
             toast.error("No items selected for Return/Exchange.",{className:"custom-toast-error"})

      return;
    }
    setLoading(true);
    const requestBody = {
      uid: user?.uid,
      oid: orderId,
      items,
    };

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
    } catch (error) {
      if (error.response && error.response.status === 403) {
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
  if (loading)
    return (
      <div className="loader-container">
        {" "}
        <span className="loader"></span>
      </div>
    );
  return (
    <div className="ordered-products-container">
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
        <button className="final-submit-button" onClick={handleSubmit}>
          Submit Return/Exchange Request
        </button>
      </div>
    </div>
  );
};

export default OrderedProducts;
