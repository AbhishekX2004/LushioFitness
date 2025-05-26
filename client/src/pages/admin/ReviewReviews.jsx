import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ReviewReviews.css"; // Importing CSS for styling
import URLMediaRenderer from "../../components/URLMediaRenderer";

const ReviewReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDocId, setLastDocId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [limit, setLimit] = useState(10);

  // Fetch all reviews on component mount
  const fetchReviews = async (loadMore = false) => {
    try {
      setIsLoading(true);
      let url = `${process.env.REACT_APP_API_URL}/reviews?limit=${limit}`;
      if (loadMore && lastDocId) {
        url += `&lastDocId=${lastDocId}`;
      }

      const response = await axios.get(url);
      
      if (response.data.message === "No reviews found") {
        setReviews(loadMore ? reviews : []);
        setHasMore(false);
        return;
      }

      setReviews(prev => loadMore ? [...prev, ...response.data.reviews] : response.data.reviews);
      setHasMore(response.data.hasMore);
      setLastDocId(response.data.lastDocId);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [limit]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchReviews(true);
    }
  };

  // Handle delete review
  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this review?");
    if (confirmed) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/reviews/delete/${id}`);
        setReviews((prev) => prev.filter((review) => review.id !== id));
        setSelectedReview(null); 
      } catch (error) {
        console.error("Error deleting review:", error);
      }
    }
  };

  // Handle review selection
  const handleReview = (review) => {
    setSelectedReview(review);
  };

  // Handle approval of review
  const handleApprove = async () => {
    if (selectedReview) {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/reviews/approve/${selectedReview.id}`, {
          approved: true,
        });
        setReviews((prev) =>
          prev.map((review) =>
            review.id === selectedReview.id ? { ...review, approved: true } : review
          )
        );
        setSelectedReview(null);
      } catch (error) {
        console.error("Error approving review:", error);
      }
    }
  };

  return (
    <div className="admin-review-container">
      <div className="admin-review-controls">
        <select 
          value={limit} 
          onChange={(e) => setLimit(Number(e.target.value))}
          className="limit-select"
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      <div className="admin-review-list">
        {reviews.map((review) => (
          <div
            key={review.id}
            className={`admin-review-card ${review.approved ? "review-approved" : ""}`}
          >
            <p>Review ID: {review.id}</p>
            <p>Rating: {review.rating}</p>
            <button onClick={() => handleReview(review)}>Review</button>
          </div>
        ))}

        {hasMore && (
          <div className="load-more-container">
            <button 
              onClick={handleLoadMore} 
              disabled={isLoading}
              className="load-more-button"
            >
              {isLoading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}

        {reviews.length === 0 && !isLoading && (
          <div className="no-reviews">No reviews found</div>
        )}
      </div>

      <div className="admin-review-details">
        {selectedReview && (
          <div>
            <h3>Review Details</h3>
            <p><strong>Quality:</strong> {selectedReview.quality}</p>
            <p><strong>Fit:</strong> {selectedReview.fit}</p>
            <p><strong>Review:</strong> {selectedReview.review}</p>
            <p><strong>Rating:</strong> {selectedReview.rating}</p>
            <p><strong>Media:</strong></p>
            <div className="admin-review-media">
              {selectedReview.media.map((url, index) => (
                <div key={index}>
                  <URLMediaRenderer src={url} alt={`media-${index}`} />
                </div>
              ))}
            </div>
            <button onClick={handleApprove}>Approve</button>
            <button onClick={() => handleDelete(selectedReview.id)}>Delete</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewReviews;
