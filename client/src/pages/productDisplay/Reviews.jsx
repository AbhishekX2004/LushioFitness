import React, { useState, useEffect } from 'react';
import { Star, User, ImageIcon, Calendar, ChevronDown, Loader2 } from 'lucide-react';
import ImagePopUp from './ImagePopUp';
import URLMediaRenderer from "../../components/URLMediaRenderer";
import Rating from "@mui/material/Rating";
import axios from 'axios';
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
 
const datePart = timestamp.split(" at ")[0];


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
        <h3>{displayName==="User not found" ? "Anonymous": displayName}</h3>
        <div className="review-footer">
          <span className="review-date">{datePart}</span>
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

const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [error, setError] = useState(null);


  const limit = 12;

  const fetchReviews = async (resetData = false) => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const currentSkip = resetData ? 0 : skip;
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/reviews/${productId}?limit=${limit}&skip=${currentSkip}`
      );
      
   console.log(response.data);
    //   const data = await response.json();
      const data = response.data;
      if (resetData) {
        setReviews(data.reviews);
        setSkip(limit);
      } else {
        setReviews(prev => [...prev, ...data.reviews]);
        setSkip(prev => prev + limit);
      }
      
      setHasMore(data.hasMore);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews(true);
    }
  }, [productId]);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Reviews</h2>
        {total > 0 && (
          <p className="text-gray-600">
            Showing {reviews.length} of {total} review{total > 1 ? 's' : ''}
          </p>
        )}
      </div>
 <div className="reviews-list">
    {/* {reviews?.map(renderReview)} */}
    {reviews?.map((review, index) => (
                <ReviewCard key={index} {...review} />
              ))}
    </div>
     
     
        
          
          {hasMore && (
             <div className="pagination">
              <button
               // className="btn btn-secondary"
                className="order-load-more-button"
               onClick={() => fetchReviews(false)}
                disabled={loading}
              >
                {/* {!loading ? <Loader2 className="loading-spinner" size={16} /> : null} */}
                         {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
       </>
  );
};

export default ProductReviews;