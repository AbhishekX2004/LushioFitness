import { useEffect, useState, useRef, useCallback } from "react";
import { useSwipeable } from "react-swipeable";
import MediaRenderer from "../../components/MediaRenderer";
import URLMediaRenderer from "../../components/URLMediaRenderer";
import "./Home.css";

function Carousel({ images }) {
  const [current, setCurrent] = useState(0);
  const timeOutRef = useRef(null);
//console.log(images);
  // Slide right logic
  const slideRight = useCallback(() => {
    setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Clear the timeout and start a new one whenever current changes
  const resetTimeout = () => {
    if (timeOutRef.current) {
      clearTimeout(timeOutRef.current);
    }
  };

  useEffect(() => {
    // Clear any existing timeout before setting a new one
    resetTimeout();

    // Set the timeout for the next slide
    timeOutRef.current = setTimeout(slideRight, 5000); // Autoplay every 3 seconds

    // Cleanup function to clear the timeout
    return () => resetTimeout();
  }, [slideRight, current]); // Add current as a dependency to re-trigger the timeout on slide change

  // Slide left logic
  const slideLeft = () => {
    setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handlers = useSwipeable({
    onSwipedLeft: slideRight,
    onSwipedRight: slideLeft,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  // Handle case where images array is empty
  if (images.length === 0) {
    return null; // Or display a fallback
  }

  return (
    <div className="carousel" {...handlers}>
      <div className="carousel_wrapper">
        {images.map((image, index) => (
          <div
            key={index}
            className={
              index === current
                ? "carousel_card carousel_card-active"
                : "carousel_card"
            }
          >
            <URLMediaRenderer src={image}  className="media-preview" />
              {/* <MediaRenderer src={image.image}/> */}
          </div>
        ))}
        {images.length > 1 && (
          <>
           
            <div className="carousel_arrow carousel_arrow_left" onClick={slideLeft}></div>
            <div className="carousel_arrow carousel_arrow_right" onClick={slideRight}></div>
            <div className="carousel_pagination">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={
                    index === current
                      ? "pagination_dot pagination_dot-active"
                      : "pagination_dot"
                  }
                  onClick={() => setCurrent(index)}
                ></div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Carousel;
