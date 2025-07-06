// 1. Built-in/Standard Library Imports
import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

// 2. Third-Party Library Imports
import axios from "axios";
import Rating from "@mui/material/Rating";
import {
  FaHeart,
  FaShoppingCart,
  FaSpinner,
  FaHeartBroken,
} from "react-icons/fa";
//import { FaShippingFast } from "react-icons/fa";
// 3. Absolute Imports/Global Components
import { UserContext } from "../../components/context/UserContext";
import { useWishlist } from "../../components/context/WishlistContext";
import { useAddress } from "../../components/context/AddressContext";
import { useCart } from "../../components/context/CartContext";
import URLMediaRenderer from "../../components/URLMediaRenderer";

// 4. Relative Imports
import "./product.css";
import RatingModal from "./RatingModal";
import "./ReviewCard.css";
import ImagePopUp from "./ImagePopUp";
import ColorOptions from "./ColorOptions";
import HeightBasedSelection from "./HeightBasedSelection";
import SizeChart from "./SizeChart";
import BuyNowModal from "../BuyNow/BuyNowModal";
import Reviews from "./Reviews"
import { toast } from "react-toastify";
//import SingleStar from "./SingleStar";
const formatDateTime = (timestamp) => {
  if (!timestamp || !timestamp._seconds || !timestamp._nanoseconds) {
    return "Invalid date"; // Return a fallback string if the timestamp is not valid
  }

  // Convert Firebase timestamp to a JavaScript Date object
  const date = new Date(
    timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000
  );

  // Format the date using options
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    // hour: "2-digit",
    // minute: "2-digit",
    // second: "2-digit",
  };

  return date.toLocaleString("en-US", options); // Format the date
};

const ReviewCard = ({
  displayName,
  rating,
  review,
  timestamp,
  quality,
  fit,
  media,
}) => {
  const formattedDate = formatDateTime(timestamp);
  const [isOpen, setIsOpen] = useState(false);
  const openGallery = () => {
    setIsOpen(true); // Set isOpen to true to open the gallery
    document.body.classList.add("no-scroll");
  };

  const closeGallery = () => {
    setIsOpen(false); // Set isOpen to false to close the gallery
  };
  return (
    <div className="review-card">
      <div className="review-media-gallery">
        {media?.length > 0 && (
          <URLMediaRenderer
            src={media[0]}
            alt="Review Media"
            onClick={openGallery}
          />
        )}
      </div>

      <div className="review-header">
        <h3>{displayName || "Anonymous"}</h3>
        <div className="review-footer">
          <span className="review-date">{formattedDate}</span>
        </div>
        <Rating value={rating} precision={0.1} readOnly />
      </div>

      <div className="review-details">
        <p>
          <strong>Quality:</strong> {quality}
        </p>
        <p>
          <strong>Fit:</strong> {fit}
        </p>
        <p>
          <strong>Review:</strong> {review}
        </p>
      </div>
      <ImagePopUp
        images={media} // Pass the images array as prop
        isOpen={isOpen} // Pass the open/close state as prop
        closeGallery={closeGallery} // Pass the close function as prop
        openGallery={openGallery} // Pass the open function as prop
      />
    </div>
  );
};

function ProductDisplay() {
  const { productID } = useParams(); // Assumes `id` comes from the route param
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heightCategory, setHeightCategory] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(null);
  //  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const navigate = useNavigate();
  const [showError, setShowError] = useState(false);
  const { user } = useContext(UserContext);
  const { fetchCartCount } = useCart();
  const { wishlist, wishlistIds, toggleWishlist } = useWishlist();
  const { selectedAddress } = useAddress();
  const isHeightBased = product?.height;
  const [image, setImage] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const id = productID;
  const wishlistItem = wishlist.find((item) => item.productId === id);
  const [liked, setLiked] = useState(wishlistIds.has(id));

  const [buyNowOpen, setBuyNowOpen] = useState(false);

  const handleBuyNowOpen = () => setBuyNowOpen(true);
  useEffect(() => {
    const fetchExpectedDeliveryDate = async () => {
      console.log(selectedAddress);
      try {
        const payload = {
          pickup_postcode: 452001,
          delivery_postcode: selectedAddress.pinCode,
        };
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/couriers/serviceability`,
          payload
        );

        setEstimatedDeliveryDate(response.data.data.min_etd);
      } catch (err) {
        console.log(error);
      }
    };
    if (selectedAddress) {
      fetchExpectedDeliveryDate();
    }
  }, [product, selectedAddress]);
  useEffect(() => {
    // Fetch product when `id` changes
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/products/${id}`
        );

        const data = await response.json();
        setProduct(data);
        console.log(data);

        setImage(data.allImages[0]);
      } catch (err) {
        setError(err.message);
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const targetRef = useRef(null); // Create a reference for the target component
  //  const discount =  Math.ceil(((props.price - props.discountedPrice) / props.price) * 100);
  const handleScroll = () => {
    // Scroll to the referenced component
    targetRef.current.scrollIntoView({ behavior: "smooth" });
  };
  const handleToggleWishlist = async (id, productId) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (liked) {
      setIsRemoving(true);
      // Try to remove from wishlist
      const isRemoved = await toggleWishlist(id, productId); // Await toggleWishlist
      if (isRemoved) setLiked(false); // Update state based on actual result
    } else {
      // Try to add to wishlist
      setLiked(true); // Optimistically update state
      await new Promise((resolve) => setTimeout(resolve, 1800));
      const isAdded = await toggleWishlist(id, productId);
      if (!isAdded) setLiked(false); // Revert state if addition failed
    }

    setIsRemoving(false);
  };
  const handleAddToCart = (id) => {
    handleScroll();
    addToCart(id);
  };
  useEffect(() => {
    if (product) {
      setHeightCategory(product.height ? "aboveHeight" : null);

      setSelectedSize(null);
    }
  }, [product]);

  const addToCart = async (id) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (selectedSize == null) {
      setShowError(true); // Show error if size is not selected
      return;
    }

    const cartItem = {
      uid: user.uid,
      productId: id,
      quantity: 1,
      color: selectedColor,
      size: selectedSize,
      height: heightCategory,
    };
    try {
      // Start both the API call and a 2-second timer
      setIsLoadingCart(true);
      await axios.post(`${process.env.REACT_APP_API_URL}/cart/add`, cartItem);

      fetchCartCount();
toast.success("Product added to cart");
      setSelectedSize(null);
    } catch (error) {
      console.error("Error adding item to cart:", error);
    } finally {
      setIsLoadingCart(false);
    }
  };

  const [isOpen, setIsOpen] = useState(false); // Control the open/close state

  const openGallery = () => {
    setIsOpen(true); // Set isOpen to true to open the gallery
    document.body.classList.add("no-scroll");
  };

  const closeGallery = () => {
    setIsOpen(false); // Set isOpen to false to close the gallery
  };

  // const images = product?.allImages;
  // const [image, setImage] = useState(images[0]);
  const handleBuyNow = () => {
    // Build the query parameters
    if (!user) {
      navigate("/login");
      return;
    }
    if (selectedSize == null) {
      handleScroll();
      setShowError(true); // Show error if size is not selected
      return;
    }
   
    handleBuyNowOpen();
  };
  if (loading)
    return (
      <div className="loader-container">
        {" "}
        <span className="loader"></span>
      </div>
    );
  if (error) return <div>Error: {error}</div>;
  if (!product) return <div>No product found</div>;
  return (
    <>
      <div className="productDisplay">
        <div className="productDisplay-left">
          <div className="productDisplay-img-list">
            {product.allImages.map((img) => (
              <URLMediaRenderer
                onClick={() => setImage(img)}
                className={
                  img === image ? "image-selected" : "image-not-selected"
                }
                src={img}
              />
            ))}
          </div>
          <div className="productDisplay-img">
            <URLMediaRenderer
              key={image}
              src={image}
              className="productDisplay-main-img"
              onClick={openGallery}
            />
            <div className="productDisplay-left-rating">
              <span>
                {/* {product.rating > 0 ? <p>{product.rating}</p> : <p>4.5</p>} */}
                <strong>
                  {product.rating > 0 ? product.rating.toFixed(1) : "4.5"}
                </strong>
                {/* <SingleStar review="3.7" /> */}
                <img src="/Images/icons/star.png" alt="icon" />
               <p>
  {product?.reviewCount > 0 ? `(${product.reviewCount})` : null}
</p>

              </span>
            </div>
          </div>
        </div>
        <ImagePopUp
          images={product.allImages} // Pass the images array as prop
          isOpen={isOpen} // Pass the open/close state as prop
          closeGallery={closeGallery} // Pass the close function as prop
          openGallery={openGallery} // Pass the open function as prop
        />
        <div className="productDisplay-right">
          <div ref={targetRef}></div>
          <h1>{product.displayName}</h1>

          <div className="productDisplay-right-prices">
            <div className="productDisplay-right-price-new">
              ₹{product.discountedPrice}{" "}
            </div>
            <div className="productDisplay-right-price-old">
              ₹{product.price}{" "}
            </div>
            <div className="productDisplay-right-price-discount">
              {Math.ceil(
                ((product.price - product.discountedPrice) / product.price) *
                  100
              )}
              % OFF
            </div>
          </div>
          <p className="productDisplay-tax-statement">Inclusive of all taxes</p>

          {estimatedDeliveryDate && (
            <div className="delivery-container">
              <p>
                <strong>Expected Delivery: </strong>{" "}
                <span>{estimatedDeliveryDate}</span>
              </p>
            </div>
          )}
          <div className="productDisplay-color-size-selector">
            {isHeightBased ? (
              <HeightBasedSelection
                data={product}
                selectedHeight={heightCategory}
                setSelectedHeight={setHeightCategory}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                selectedSize={selectedSize}
                setSelectedSize={setSelectedSize}
              />
            ) : (
              <ColorOptions
                data={product}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                selectedSize={selectedSize}
                setSelectedSize={setSelectedSize}
              />
            )}
          </div>

          {showError && !selectedSize && (
            <p className="product-display-error-message">
              Please select a size to proceed!
            </p>
          )}
          <div className="productDisplay-button-container">
            <button onClick={() => toggleWishlist(wishlistItem?.id, id)}>
              WISHLIST
            </button>
            <button onClick={() => addToCart(product.id)}>ADD TO CART</button>
          </div>

          {/* <button className="productDisplay-buy-button" onClick={handleBuyNow}>
          BUY NOW
        </button>
        */}
          <BuyNowModal
            className="productDisplay-buy-button"
            open={buyNowOpen}
            handleOpen={handleBuyNow}
            setOpen={setBuyNowOpen}
            product={product}
            selectedHeight={heightCategory}
            setSelectedHeight={setHeightCategory}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
          />
          <div className="productDisplay-right-discription">
            <strong>Description: </strong> {product.description.productDetails}
          </div>
          <div className="productDisplay-right-discription">
            <strong>Size & Fit: </strong> {product.description.sizeFit}
          </div>
          <div className="productDisplay-right-discription">
            <strong>MaterialCare: </strong> {product.description.MaterialCare}
          </div>
          <p className="productDisplay-right-category">
            <span>
              <strong>Category:</strong>{" "}
            </span>
            <>
              {product.categories?.map((category, index) => (
                <span key={index}>
                  {category}
                  {", "}
                </span>
              ))}
            </>
          </p>

          <SizeChart />
          <div className="productDisplay-desktop">
            <img
              className="productDisplay-trust-image"
              src="/Images/trust.png"
              alt=""
            />
          </div>
          {/* <button className="productDisplay-buy-button-mobile" onClick={handleBuyNow}>
          BUY NOW
        </button> */}
          <BuyNowModal
            className="productDisplay-buy-button-mobile"
            open={buyNowOpen}
            handleOpen={handleBuyNow}
            setOpen={setBuyNowOpen}
            product={product}
            selectedHeight={heightCategory}
            setSelectedHeight={setHeightCategory}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
          />
        </div>
        <div className="mobile-button-container">
          <button
            className="wishlist-button"
            onClick={() => handleToggleWishlist(wishlistItem?.id, id)}
          >
            {isRemoving ? (
              <>
                {" "}
                <FaHeartBroken color="red" className="wishlist-icon" />
                REMOVING
              </>
            ) : (
              <>
                {" "}
                <FaHeart className={`wishlist-icon ${liked ? "liked" : ""}`} />
                {liked ? <>WISHLISTED</> : <>WISHLIST</>}
              </>
            )}
          </button>

          <button
            className="cart-button"
            onClick={() => handleAddToCart(product.id)}
            disabled={isLoadingCart}
          >
            {isLoadingCart ? (
              <FaSpinner className="spinner-icon" />
            ) : (
              <FaShoppingCart />
            )}{" "}
            {user ? <>ADD TO CART</> : <>PLEASE LOGIN</>}
          </button>
        </div>
      </div>
      <div className="review-container">
        <div className="review-headings">
          <h5>Product Review</h5>
          <RatingModal productId={product.id} />
        </div>
        <div className="review-container">
          {/* {reviews.length > 0 ? (
            <div className="reviews-list">
              {reviews.map((review, index) => (
                <ReviewCard key={index} {...review} />
              ))}
            </div>
          ) : (
            <p className="no-reviews-message">No reviews available.</p>
          )} */}
          <Reviews productId={productID}/>
        </div>
      </div>
    </>
  );
}

export default ProductDisplay;
