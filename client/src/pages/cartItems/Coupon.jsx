import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Modal, Backdrop, Fade, Box, Typography } from "@mui/material";
import { AiOutlineLoading } from "react-icons/ai";
import "./Coupon.css";
import { UserContext } from "../../components/context/UserContext";

function Coupon({ setDiscount, cartAmount, setCouponApplied }) {
  const [open, setOpen] = useState(false);
  const { user } = useContext(UserContext);
  const [coupons, setCoupons] = useState([]);
  const [lastDocId, setLastDocId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null); // Store the entire coupon object
  const [inputCoupon, setInputCoupon] = useState(""); // For manually entered coupon
  const [successMessage, setSuccessMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  const fetchCoupons = async () => {
    if (loading || !hasMore) return;
  
    setLoading(true);
  
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/coupon/usableCoupons/${user.uid}`, {
        params: {
          lastDocId,
          limit: 10, // Fetch 10 coupons per page
        },
      });
  
      setCoupons((prev) => {
        const newCoupons = Object.values(data.coupons);
        const uniqueCoupons = [
          ...prev,
          ...newCoupons.filter(
            (coupon) => !prev.some((existingCoupon) => existingCoupon.id === coupon.id)
          ),
        ];
        return uniqueCoupons;
      });
  
      setLastDocId(data.lastDocId);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user && coupons.length === 0) {
      fetchCoupons(); // Initial load
    }
  }, [user]);  
  const handleClose = () => {
    setOpen(false);
    setSuccessMessage("");
    setErrorMessage("");
    setValidationMessage("");
    setInputCoupon(""); // Reset input coupon on close
  };

  // Generic function to handle coupon application
  const applyCoupon = async (couponCode) => {
    if (!couponCode) {
      setValidationMessage("Please provide a valid coupon.");
      return;
    }
    try {
      setIsApplying(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/coupon/use`,
        {
          uid: user.uid,
          code: couponCode,
          purchaseOf: parseFloat(cartAmount),
        }
      );
      const discountValue = response.data.discount;
      setDiscount(discountValue); // Update discount in parent component
      setCouponApplied(couponCode); // Set applied coupon code
      setSuccessMessage(
        `Coupon applied successfully! Discount: ₹${discountValue}`
      );
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        handleClose();
      }, 2000);
    } catch (error) {
      setErrorMessage(error.response?.data?.error || "Error applying coupon");
    } finally {
      setIsApplying(false);
    }
  };

  // Handle manual input coupon
  const handleInputCoupon = () => {
    applyCoupon(inputCoupon);
    setInputCoupon(""); // Clear input after applying
  };

  // Handle selected coupon
  const handleSelectedCoupon = () => {
    applyCoupon(selectedCoupon?.id);
  };

 
    return (
      <div>
        <button onClick={() => setOpen(true)}>Apply</button>
        <Modal
          open={open}
          onClose={handleClose}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{ timeout: 500 }}
        >
          <Fade in={open}>
            <Box
              className="modal-box modal-box-coupon"
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "76%",
                maxWidth: "400px",
                bgcolor: "background.paper",
                borderRadius: "9px",
                boxShadow: 10,
                p: 4,
              }}
            >
              <div className="coupon-container-mobile">
                <img
                  src="/Images/icons/cross.png"
                  alt="Close"
                  className="coupon-close"
                  onClick={handleClose}
                />
                {!success ? (
                  <>
                    <div className="coupon-input-container">
                      <input
                        type="text"
                        placeholder="Enter Coupon Code"
                        onChange={(e) => setInputCoupon(e.target.value)}
                        value={inputCoupon}
                        className="coupon-input"
                      />
                      <button
                        onClick={handleInputCoupon}
                        className="apply-button"
                      >
                        Check
                      </button>
                    </div>
                    <div className="coupon-options">
                      {coupons?.length > 0 ? (
                        <>
                          <h2 className="coupon-select-heading">Select a Coupon</h2>
                          {coupons.map((coupon) => (
                            <label
                              key={coupon?.id}
                              className={`option ${
                                selectedCoupon?.id === coupon?.id ? "selected" : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name="coupon"
                                value={coupon?.id}
                                checked={selectedCoupon?.id === coupon?.id}
                                onChange={() => setSelectedCoupon(coupon)}
                              />
                              <div className="coupon-details">
                                <p className="coupon-info">
                                  <strong>Code:</strong> {coupon?.id} |
                                  <strong>Valid Until:</strong>{" "}
                                  {coupon?.validity
                                    ? (() => {
                                        let validityDate;
    
                                        // Handle different formats
                                        if (typeof coupon?.validity === "string") {
                                          validityDate = new Date(coupon?.validity); // ISO string
                                        } else if (typeof coupon?.validity === "number") {
                                          validityDate = new Date(coupon?.validity * 1000); // Unix timestamp
                                        } else if (coupon?.validity instanceof Date) {
                                          validityDate = coupon?.validity; // Already a Date object
                                        } else {
                                          return "Invalid Date";
                                        }
    
                                        // Format the date as DD-MM-YY
                                        const [year, month, day] = validityDate
                                          .toISOString()
                                          .split("T")[0]
                                          .split("-");
                                        return `${day}-${month}-${year}`;
                                      })()
                                    : "N/A"}
                                </p>
                                <p className="coupon-info">
                                  <strong>Min Purchase:</strong> ₹
                                  {coupon?.onPurchaseOf || "N/A"} |
                                  <strong>Discount:</strong>{" "}
                                  {coupon?.discountType === "percentage"
                                    ? `${coupon?.discount || "N/A"}%`
                                    : `₹${coupon?.discount || "N/A"}`}
                                </p>
                              </div>
                            </label>
                          ))}
                          {!loading && hasMore && (
                            <button className="load-more" onClick={fetchCoupons}>
                              Load More
                            </button>
                          )}
                        
                        </>
                      ) : (
                        <p className="no-coupons-message">No coupons available</p>
                      )}
                    </div>
                    <div className="coupon-button-container">
                            <button onClick={handleClose} className="cancel-button">
                              Cancel
                            </button>
                            <button
                              onClick={handleSelectedCoupon}
                              className="apply-button"
                            >
                              {isApplying ? (
                                <>
                                  <AiOutlineLoading className="spinner-icon" />
                                  Applying...
                                </>
                              ) : (
                                "Apply Coupon"
                              )}
                            </button>
                          </div>
                  </>
                ) : (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    src="/Images/success.mp4"
                    className="success-message"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
                {validationMessage && (
                  <Typography color="warning">{validationMessage}</Typography>
                )}
                {successMessage && (
                  <Typography color="success">{successMessage}</Typography>
                )}
                {errorMessage && (
                  <Typography color="error">{errorMessage}</Typography>
                )}
              </div>
            </Box>
          </Fade>
        </Modal>
      </div>
    );
    
}

export default Coupon;
