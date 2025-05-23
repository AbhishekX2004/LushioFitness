import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
const CartRow = ({
  item,
  selectedHeight,
  selectedColor,
  selectedSize,
  quantity,
  setQuantity
}) => {

  // State Variables
  const [totalQuantity, setTotalQuantity] = useState(0);
  const colorHex = item?.colorOptions?.find(
    (color) => color.name === selectedColor
  )?.code;

  const [isEditing, setIsEditing] = useState(false);
  const selectRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsEditing(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePopUpOneOpen = async (e) => {
  
    setTotalQuantity(0);
    const data = {
      pid: e.id,
      heightType: selectedHeight || "normal",
      color: selectedColor,
      size: selectedSize,
    };

    try {
    //  setIsLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/getQty`,
        data
      );
      setTotalQuantity(response.data.quantity);
     // setCartQuantity(e.quantity);
     setIsEditing(true);
    } catch (err) {
      console.log(err);
    } finally {
      //setIsLoading(false);
    }
  };
  

   const handleSelectChange = (e) => {
    const newQty = Number(e.target.value);
    setQuantity(newQty);
    setIsEditing(false); // close dropdown
  };

  
  return (
    <>
      <div className={`itemContainer-base-item`}>
      
        <div className={`cartitems-format `}>
          <div className="itemContainer-base-itemLeft">
           
            <img
              style={{
                background: "rgb(244, 255, 249)",
                height: "155px",
                width: "111px",
              }}
              src={item.cardImages[0]}
              alt=""
              className="image-base-imgResponsive"
            />
          </div>
          <div className="itemContainer-base-itemRight">
            <div className="itemContainer-base-details">
              <div className="itemContainer-base-brand">LUSHIO</div>
              <div className="itemContainer-base-description">
                {item.displayName}
              </div>
              <p className="product-color">
                {item.height && (
                  <p>
                    {" "}
                    <strong>Height:</strong> {selectedHeight}
                  </p>
                )}
              </p>
              <p className="product-color">
                <strong>Color:</strong> {selectedColor}
                <span
                  className="cart-color-box"
                  style={{ backgroundColor: colorHex }}
                ></span>
              </p>
              <div className="itemContainer-base-sizeAndQtyContainer">
                <div className="itemContainer-base-sizeAndQty">
                  <div className="itemComponents-base-size">
                    <span className="">Size: {selectedSize}</span>
                    {/* <img src="/Images/icons/quantityDropdown.svg" alt=""/> */}
                  </div>

                  {/* <div
                    className="itemComponents-base-quantity"
                    onClick={() => handlePopUpOneOpen(item)}
                  >
                    <span className="">Qty: {quantity}</span>
                    <img src="/Images/icons/quantityDropdown.svg" alt="" />
                  </div> */}
                  <div className="itemComponents-base-quantity" ref={selectRef}>
      {isEditing ? (
        <select
          autoFocus
          value={quantity}
          onChange={handleSelectChange}
          className="cart-quantity-select"
        >
          {Array.from({ length: Math.min(totalQuantity, 10) }, (_, i) => {
            const qty = i + 1;
            return (
              <option key={qty} value={qty}>
                {qty}
              </option>
            );
          })}
        </select>
      ) : (
        <div 
       // onClick={() => setIsEditing(true)}
        className="itemComponents-base-quantity"
        onClick={() => handlePopUpOneOpen(item)}
        >
          <span>Qty: {quantity}</span>
          <img src="/Images/icons/quantityDropdown.svg" alt="dropdown" />
        </div>
      )}
    </div>
                </div>
              </div>
              <div className="itemContainer-base-description">
               
                ₹{item?.discountedPrice * quantity}
              </div>
            </div>

            <div className="returnPeriod-base-returnItem">
              <img
                src="/Images/icons/return.svg"
                alt=""
                className="returnPeriod-base-returnIcon"
              />

              <div className="returnPeriod-base-returnText">
                <span className="returnPeriod-base-returnDays">7 days</span>{" "}
                return available
              </div>
            </div>
          </div>
        </div>
      </div>
    
    </>
  );
};

export default CartRow;
