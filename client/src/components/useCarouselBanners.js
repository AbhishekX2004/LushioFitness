import axios from "axios";
import { useEffect, useState } from "react";

const CACHE_KEY = "carouselBanners";
const CACHE_EXPIRY_KEY = "carouselBannersExpiry";
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

const useCarouselBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const cachedBanners = localStorage.getItem(CACHE_KEY);
        const expiryTime = localStorage.getItem(CACHE_EXPIRY_KEY);
        const now = Date.now();

        // Validate cached banners and expiry
        if (cachedBanners && expiryTime && now < parseInt(expiryTime, 10)) {
          try {
            const parsedBanners = JSON.parse(cachedBanners);
            if (Array.isArray(parsedBanners)) {
              setBanners(parsedBanners);
              setLoading(false);
              return;
            }
          } catch (parseError) {
            console.warn("Invalid cached banners, clearing local storage...");
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_EXPIRY_KEY);
          }
        }

        // Fetch fresh banners if cache is missing or expired
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/banners/carouselBanners`);
        const fetchedBanners = response.data;

        // Validate fetched data
        if (Array.isArray(fetchedBanners)) {
          localStorage.setItem(CACHE_KEY, JSON.stringify(fetchedBanners));
          localStorage.setItem(CACHE_EXPIRY_KEY, (now + CACHE_DURATION).toString());
          setBanners(fetchedBanners);
        } else {
          console.warn("Unexpected response format:", fetchedBanners);
          setError("Invalid banner data");
        }
      } catch (err) {
        console.error("Error fetching carousel banners:", err);
        setError("Failed to load banners");
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  return { banners, loading, error };
};

export default useCarouselBanners;
