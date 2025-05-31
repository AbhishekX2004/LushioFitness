import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ReviewReviews.css"; // Importing CSS for styling
import URLMediaRenderer from "../../../components/URLMediaRenderer";

const ReviewReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDocId, setLastDocId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [limit, setLimit] = useState(10);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

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

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`admin-review-star ${i < rating ? 'admin-review-star-filled' : 'admin-review-star-empty'}`}>
        ★
      </span>
    ));
  };

  const openFullscreenMedia = (mediaArray, index) => {
    setFullscreenMedia(mediaArray);
    setCurrentMediaIndex(index);
  };

  const closeFullscreenMedia = () => {
    setFullscreenMedia(null);
    setCurrentMediaIndex(0);
  };

  const nextMedia = () => {
    if (fullscreenMedia && currentMediaIndex < fullscreenMedia.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  const prevMedia = () => {
    if (fullscreenMedia && currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  const handleKeyDown = (e) => {
    if (!fullscreenMedia) return;
    
    if (e.key === 'Escape') {
      closeFullscreenMedia();
    } else if (e.key === 'ArrowRight') {
      nextMedia();
    } else if (e.key === 'ArrowLeft') {
      prevMedia();
    }
  };

  useEffect(() => {
    if (fullscreenMedia) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [fullscreenMedia, currentMediaIndex]);

  return (
    <div className="admin-review-container">
      <div className="admin-review-main">
        <div className="admin-review-header">
          <h2 className="admin-review-title">Review Management</h2>
          <div className="admin-review-controls">
            <label className="admin-review-limit-label">
              Reviews per page:
              <select 
                value={limit} 
                onChange={(e) => setLimit(Number(e.target.value))}
                className="admin-review-limit-select"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>
        </div>

        <div className="admin-review-list">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`admin-review-card ${review.approved ? "admin-review-approved" : ""} ${selectedReview?.id === review.id ? "admin-review-selected" : ""}`}
            >
              <div className="admin-review-card-header">
                <span className="admin-review-id">#{review.id.slice(-6)}</span>
                <div className="admin-review-status">
                  {review.approved ? (
                    <span className="admin-review-status-badge admin-review-status-approved">Approved</span>
                  ) : (
                    <span className="admin-review-status-badge admin-review-status-pending">Pending</span>
                  )}
                </div>
              </div>
              
              <div className="admin-review-rating">
                {renderStars(review.rating)}
                <span className="admin-review-rating-text">({review.rating}/5)</span>
              </div>
              
              <div className="admin-review-preview">
                {review.review && (
                  <p className="admin-review-text-preview">
                    {review.review.length > 60 ? `${review.review.substring(0, 60)}...` : review.review}
                  </p>
                )}
              </div>
              
              <button 
                className="admin-review-select-btn"
                onClick={() => handleReview(review)}
              >
                View Details
              </button>
            </div>
          ))}

          {reviews.length === 0 && !isLoading && (
            <div className="admin-review-no-reviews">
              <div className="admin-review-no-reviews-icon">📝</div>
              <p className="admin-review-no-reviews-text">No reviews found</p>
            </div>
          )}
        </div>

        {hasMore && (
          <div className="admin-review-load-more-container">
            <button 
              onClick={handleLoadMore} 
              disabled={isLoading}
              className="admin-review-load-more-button"
            >
              {isLoading ? (
                <>
                  <span className="admin-review-loading-spinner"></span>
                  Loading...
                </>
              ) : (
                "Load More Reviews"
              )}
            </button>
          </div>
        )}
      </div>

      <div className="admin-review-details">
        {selectedReview ? (
          <div className="admin-review-details-content">
            <div className="admin-review-details-header">
              <h3 className="admin-review-details-title">Review Details</h3>
              <button 
                className="admin-review-close-details-btn"
                onClick={() => setSelectedReview(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="admin-review-details-section">
              <div className="admin-review-detail-item">
                <span className="admin-review-detail-label">Rating:</span>
                <div className="admin-review-detail-rating">
                  {renderStars(selectedReview.rating)}
                  <span className="admin-review-rating-number">({selectedReview.rating}/5)</span>
                </div>
              </div>
              
              {selectedReview.quality && (
                <div className="admin-review-detail-item">
                  <span className="admin-review-detail-label">Quality:</span>
                  <span className="admin-review-detail-value">{selectedReview.quality}</span>
                </div>
              )}
              
              {selectedReview.fit && (
                <div className="admin-review-detail-item">
                  <span className="admin-review-detail-label">Fit:</span>
                  <span className="admin-review-detail-value">{selectedReview.fit}</span>
                </div>
              )}
              
              {selectedReview.review && (
                <div className="admin-review-detail-item admin-review-detail-review">
                  <span className="admin-review-detail-label">Review:</span>
                  <p className="admin-review-detail-review-text">{selectedReview.review}</p>
                </div>
              )}
            </div>

            {selectedReview.media && selectedReview.media.length > 0 && (
              <div className="admin-review-details-section">
                <span className="admin-review-detail-label">Media:</span>
                <div className="admin-review-media">
                  {selectedReview.media.map((url, index) => (
                    <div 
                      key={index} 
                      className="admin-review-media-item"
                      onClick={() => openFullscreenMedia(selectedReview.media, index)}
                    >
                      <URLMediaRenderer src={url} alt={`media-${index}`} />
                      <div className="admin-review-media-overlay">
                        <span className="admin-review-media-overlay-icon">🔍</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="admin-review-details-actions">
              {!selectedReview.approved && (
                <button className="admin-review-approve-btn" onClick={handleApprove}>
                  <span className="admin-review-btn-icon">✓</span>
                  Approve Review
                </button>
              )}
              <button 
                className="admin-review-delete-btn" 
                onClick={() => handleDelete(selectedReview.id)}
              >
                <span className="admin-review-btn-icon">🗑</span>
                Delete Review
              </button>
            </div>
          </div>
        ) : (
          <div className="admin-review-no-selection">
            <div className="admin-review-no-selection-icon">👈</div>
            <h3 className="admin-review-no-selection-title">Select a Review</h3>
            <p className="admin-review-no-selection-text">Choose a review from the list to view its details and take actions.</p>
          </div>
        )}
      </div>

      {/* Fullscreen Media Modal */}
      {fullscreenMedia && (
        <div className="admin-review-fullscreen-modal" onClick={closeFullscreenMedia}>
          <div className="admin-review-fullscreen-content" onClick={(e) => e.stopPropagation()}>
            <button className="admin-review-fullscreen-close" onClick={closeFullscreenMedia}>
              ✕
            </button>
            
            {fullscreenMedia.length > 1 && (
              <>
                <button 
                  className="admin-review-fullscreen-nav admin-review-fullscreen-prev" 
                  onClick={prevMedia}
                  disabled={currentMediaIndex === 0}
                >
                  ←
                </button>
                <button 
                  className="admin-review-fullscreen-nav admin-review-fullscreen-next" 
                  onClick={nextMedia}
                  disabled={currentMediaIndex === fullscreenMedia.length - 1}
                >
                  →
                </button>
              </>
            )}
            
            <div className="admin-review-fullscreen-media">
              <URLMediaRenderer 
                src={fullscreenMedia[currentMediaIndex]} 
                alt={`fullscreen-media-${currentMediaIndex}`} 
              />
            </div>
            
            {fullscreenMedia.length > 1 && (
              <div className="admin-review-fullscreen-counter">
                {currentMediaIndex + 1} / {fullscreenMedia.length}
              </div>
            )}
            
            <div className="admin-review-fullscreen-thumbnails">
              {fullscreenMedia.map((url, index) => (
                <div 
                  key={index} 
                  className={`admin-review-fullscreen-thumbnail ${index === currentMediaIndex ? 'admin-review-thumbnail-active' : ''}`}
                  onClick={() => setCurrentMediaIndex(index)}
                >
                  <URLMediaRenderer src={url} alt={`thumbnail-${index}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewReviews;