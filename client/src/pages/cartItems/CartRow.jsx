import React, { useState, useContext } from "react";
import { UserContext } from "../../components/context/UserContext";
import { useWishlist } from "../../components/context/WishlistContext";
import ResponsivePopup from "./ResponsivePopUp";
import axios from "axios";
import "./Cart.css";
const CartRow = ({
  item,
  selectedItems,
  handleCheckboxChange,
  handleOpen,
  handleClose,
  open,
  setCartProducts,
  selectedProduct,
  handleMoveToWishlist,
  handleRemoveFromCart,
}) => {
  // Contexts
  const { user } = useContext(UserContext);
  const { wishlist } = useWishlist();

  // State Variables
  const [isPopupOneOpen, setPopupOneOpen] = useState(false);
  const [isPopupTwoOpen, setPopupTwoOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [cartQuantity, setCartQuantity] = useState(0);

  // Derived Variables
  const isHeightBased = item.height;
  const quantityAvailable = isHeightBased
    ? item.product[item.height]?.quantities?.[item.color]?.[item.size]
    : item.product.quantities[item.color]?.[item.size];
  const inStock = quantityAvailable > 0;
  const canPurchase = quantityAvailable >= item?.quantity;
const displayQuantity = item.quantity > quantityAvailable ? quantityAvailable : item.quantity;

  // Wishlist Item and Color Hex
  const wishlistItem = wishlist.find((e) => e.productId === item.product.id);
  const colorHex = item.product.colorOptions.find(
    (color) => color.name === item.color
  )?.code;

 

  const handlePopUpOneOpen = async (e) => {
    setSelectedItem(e);

    setPopupOneOpen(true);
    setTotalQuantity(0);
    const data = {
      pid: e.productId,
      heightType: e.height ? e.height : "normal",
      color: e.color,
      size: e.size,
    };

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/getQty`,
        data
      );
      setTotalQuantity(response.data.quantity);
      setCartQuantity(e.quantity);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };
  const handlePopUpTwoOpen = (e) => {
    setPopupTwoOpen(true);
    console.log(e);
    handleOpen(e);
  };
  const handleQuantityUpdate = async (cartItemId) => {
    const data = {
      uid: user.uid,
      quantity: cartQuantity,
    };
    try {
      setIsUpdating(true);
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/cart/update/${cartItemId}`,

        data
      );
      setPopupOneOpen(false);
      setCartProducts((prevItems) =>
        prevItems.map((item) =>
          item.id === cartItemId ? { ...item, quantity: cartQuantity } : item
        )
      );
    } catch (err) {
      console.log(err);
    } finally {
      setIsUpdating(false);
    }
  };
  const handleQuantityChange = (quantity) => {
    setCartQuantity(quantity); // Update cart quantity when a button is clicked
  };

  return (
    <>
      <div className={`itemContainer-base-item ${!inStock ? "sold-out" : ""}`}>
        {!canPurchase && (
          <p className="cart-quantity-error">
            You selected {item.quantity}, but only {quantityAvailable} left in
            stock.
          </p>
        )}
        <div className={`cartitems-format ${!inStock ? "sold-out" : ""}`}>
          <div className="itemContainer-base-itemLeft">
            {!inStock ? (
              <button
                className="cart-add-to-wishlist"
                onClick={() =>
                  handleMoveToWishlist(
                    wishlistItem?.id,
                    item.product.id,
                    item.id
                  )
                }
              >
                Move to wishlist
              </button>
            ) : (
              <input
                type="checkbox"
                className={`checkbox ${
                  selectedItems[item.id] ? "checked" : ""
                }`}
                checked={selectedItems[item.id] || false}
                onChange={() => handleCheckboxChange(item.id)}
              />
            )}
            <img
              style={{
                background: "rgb(244, 255, 249)",
                height: "155px",
                width: "111px",
              }}
              src={item.product.cardImages[0]}
              alt=""
              className="image-base-imgResponsive"
            />
          </div>
          <div className="itemContainer-base-itemRight">
            <img
              src="/Images/icons/delete.png"
              onClick={() => handlePopUpTwoOpen(item)}
              className="remove-cart-delete"
              alt="Remove"
            />
            <div className="itemContainer-base-details">
              <div className="itemContainer-base-brand">LUSHIO</div>
              <div className="itemContainer-base-description">
                {item.product.displayName}
              </div>
              <p className="product-color">
                {item.height && (
                  <p>
                    {" "}
                    <strong>Height:</strong> {item.height}
                  </p>
                )}
              </p>
              <p className="product-color">
                <strong>Color:</strong> {item.color}
                <span
                  className="cart-color-box"
                  style={{ backgroundColor: colorHex }}
                ></span>
              </p>
              <div className="itemContainer-base-sizeAndQtyContainer">
                <div className="itemContainer-base-sizeAndQty">
                  <div className="itemComponents-base-size">
                    <span className="">Size: {item.size}</span>
                    {/* <img src="/Images/icons/quantityDropdown.svg" alt=""/> */}
                  </div>

                  <div
                    className="itemComponents-base-quantity"
                    onClick={() => handlePopUpOneOpen(item)}
                  >
                    <span className="">Qty: {displayQuantity}</span>
                    <img src="/Images/icons/quantityDropdown.svg" alt="" />
                  </div>
                </div>
              </div>
              <div className="itemContainer-base-description">
                <span className="itemContainer-base-cutprice">
                  {" "}
                  ₹{item.product.price * item.quantity}{" "}
                </span>{" "}
                ₹{item.product.discountedPrice * item.quantity}
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

      <ResponsivePopup
        isOpen={isPopupOneOpen}
        onClose={() => setPopupOneOpen(false)}
      >
        {isLoading ? (
          <div className="cart-loader-container">
            {" "}
            <span className="loader"></span>
          </div>
        ) : (
          <div className="quantity-change-container">
            <h2>
              Select Quantity
              {totalQuantity < 10 && (
                <span className="error-message">
                  {" "}
                  (Only {totalQuantity} Left)
                </span>
              )}
            </h2>

            <div className="quantity-buttons">
              {Array.from(
                { length: Math.min(totalQuantity, 10) },
                (_, index) => {
                  const quantity = index + 1;
                  return (
                    <button
                      key={quantity}
                      className={`quantity-button ${
                        quantity === cartQuantity ? "selected" : ""
                      }`}
                      style={{ aspectRatio: 1 }}
                      onClick={() => handleQuantityChange(quantity)}
                    >
                      {quantity}
                    </button>
                  );
                }
              )}
            </div>
            <button
              className="submit-button"
              disabled={isUpdating}
              onClick={() => handleQuantityUpdate(item.id)}
            >
              {" "}
              {isUpdating ? <div className="quantity-loader"></div> : "Submit"}
            </button>
          </div>
        )}
      </ResponsivePopup>

      <ResponsivePopup
        isOpen={isPopupTwoOpen}
        onClose={() => setPopupTwoOpen(false)}
      >
        <div className="remove-cart-buttons">
          <div className="remove-product-details">
            <img
              src={selectedProduct?.product?.cardImages[0]}
              alt=""
              className="remove-product-image"
            />
            <div className="remove-product-info">
              <h3>{selectedProduct?.product?.displayName}</h3>
              <p>
                <strong>Quantity:</strong> {selectedProduct?.quantity || "1"}
              </p>
              <p>
                <strong>Price:</strong> ₹
                {selectedProduct?.product?.discountedPrice}
              </p>
              <p>
                <strong>Size:</strong> {selectedProduct?.size}
              </p>
            </div>
          </div>
          <div className="remove-cart-popup-buttons">
            <button
              onClick={() =>
                handleMoveToWishlist(wishlistItem?.id, item.product.id, item.id)
              }
            >
              Move to Wishlist
            </button>
            <button onClick={() => handleRemoveFromCart(user.uid, item.id)}>
              Remove from cart
            </button>
          </div>
        </div>
      </ResponsivePopup>
    </>
  );
};

export default CartRow;
