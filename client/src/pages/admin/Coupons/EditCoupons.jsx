import React, { useState, useEffect } from "react";
import axios from "axios";
const moment = require("moment");

function EditCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDocId, setLastDocId] = useState(null);
  const [limit, setLimit] = useState(20);

  const fetchCoupons = async (currentLastDocId = null) => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/coupon/`, {
        params: {
          lastDocId: currentLastDocId,
          limit
        }
      });
      
      if (currentLastDocId) {
        setCoupons(prev => [...prev, ...response.data.coupons]);
      } else {
        setCoupons(response.data.coupons);
      }
      
      setHasMore(response.data.hasMore);
      setLastDocId(response.data.lastDocId);
    } catch (error) {
      setError("Error fetching coupons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [limit]);

  const handleLoadMore = () => {
    if (!loading && hasMore && lastDocId) {
      fetchCoupons(lastDocId);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/coupon/delete/${id}`);
        setCoupons((prevCoupons) => prevCoupons.filter((coupon) => coupon.id !== id));
        setSuccess("Coupon deleted successfully.");
      } catch (error) {
        setError("Error deleting coupon.");
      }
    }
  };

  const handleEditClick = (coupon) => {
    setEditMode(true);
    setCurrentCoupon({ ...coupon });
    setError("");
    setSuccess("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentCoupon((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { id, validity, discountType, discount, onPurchaseOf, forUsers } = currentCoupon;

    // Validation
    if (!validity || !discount || !onPurchaseOf || !forUsers) {
      setError("All fields are mandatory.");
      return;
    }

    const validityDate = moment(validity, "YYYY-MM-DD");
    if (!validityDate.isValid() || validityDate.isSameOrBefore(moment())) {
      setError("Validity date must be a future date.");
      return;
    }

    if (parseFloat(discount) <= 0 || parseFloat(onPurchaseOf) <= 0) {
      setError("Discount and Minimum Purchase must be positive values.");
      return;
    }

    if (discountType === "percentage" && parseFloat(discount) > 100) {
      setError("Percentage discount cannot exceed 100%.");
      return;
    }

    if (
      (discountType === "fixed" && parseFloat(discount) >= parseFloat(onPurchaseOf)) ||
      (discountType === "percentage" &&
        (parseFloat(discount) / 100) * parseFloat(onPurchaseOf) >= parseFloat(onPurchaseOf))
    ) {
      setError("Discount cannot be greater than or equal to the minimum purchase amount.");
      return;
    }

    // API call to update coupon
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/coupon/update/${id}`, currentCoupon);
      setCoupons((prevCoupons) =>
        prevCoupons.map((coupon) => (coupon.id === id ? currentCoupon : coupon))
      );
      setEditMode(false);
      setSuccess("Coupon updated successfully.");
    } catch (error) {
      setError("Error updating coupon.");
    }
  };

  return (
    <div className="edit-coupon-container">
      <div className="header-row">
        <h2>Edit Coupons</h2>
        <div className="limit-selector">
          <select 
            value={limit} 
            onChange={(e) => setLimit(parseInt(e.target.value))}
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
      <div className="edit-coupon-wrapper">
        <div className="admin-coupon-cards">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="admin-coupon-card">
              <p>ID: {coupon.id}</p>
              <p>
                Validity:{" "}
                {moment(coupon.validity, "YYYY-MM-DD").format("DD-MM-YYYY")}
              </p>
              <p>Discount Type: {coupon.discountType}</p>
              <p>Discount: {coupon.discount}</p>
              <button onClick={() => handleEditClick(coupon)}>Edit</button>
              <button onClick={() => handleDelete(coupon.id)}>Delete</button>
            </div>
          ))}
        </div>
        
        {hasMore && (
          <div className="load-more">
            <button 
              onClick={handleLoadMore} 
              disabled={loading}
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}

        {editMode && currentCoupon && (
          <div className="edit-coupon-form">
            <h3>Edit Coupon</h3>
            <form onSubmit={handleUpdate}>
              <label>
                Validity:
                <input
                  type="date"
                  name="validity"
                  value={currentCoupon.validity}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Discount Type:
                <select
                  name="discountType"
                  value={currentCoupon.discountType}
                  onChange={handleChange}
                  required
                >
                  <option value="fixed">Fixed</option>
                  <option value="percentage">Percentage</option>
                </select>
              </label>
              <label>
                Discount ({currentCoupon.discountType === "percentage" ? "%" : "Amount"}):
                <input
                  type="number"
                  name="discount"
                  value={currentCoupon.discount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
              </label>
              <label>
                Minimum Purchase:
                <input
                  type="number"
                  name="onPurchaseOf"
                  value={currentCoupon.onPurchaseOf}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
              </label>
              <label>
                For Users:
                <select
                  name="forUsers"
                  value={currentCoupon.forUsers}
                  onChange={handleChange}
                  required
                >
                  <option value="all">All</option>
                  <option value="firstPurchase">First Purchase</option>
                  <option value="hidden">Hidden</option>
                  <option value="">Not Applicable</option>
                </select>
              </label>
              <button type="submit">Update Coupon</button>
              <button type="button" onClick={() => setEditMode(false)}>
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
  
}

export default EditCoupons;
