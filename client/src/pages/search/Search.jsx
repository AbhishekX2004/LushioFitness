import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import ProductCard from "../home/ProductCard";
import "./Search.css";
const SearchResults = () => {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
 // const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [lastProductId, setLastProductId] = useState(null);

  const query = new URLSearchParams(location.search).get("query");

  const fetchProducts = async (reset = false) => {
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/search`, {
        searchText: query,
        limit: 10,
        lastProductId: reset ? null : lastProductId,
      });

      const { products: newProducts, hasMore: moreResults, lastProductId: lastId } = response.data;
      setProducts(reset ? newProducts : [...products, ...newProducts]);
      setHasMore(moreResults);
      setLastProductId(lastId);
    } catch (err) {
     // setError("Error fetching results. Please try again.");
      console.error("Search Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      fetchProducts(true);
    }
  }, [query]);

  return (
    <div className="search-results-container">
      <h2>Search Results for "{query}"</h2>
      {  products.length > 0 ? (
        <div className="products-grid">
          {products.map((item) => (
            <ProductCard
            key={item.id}
            id={item.id}
            displayName={item.displayName}
            image1={item.cardImages?.[0] || ""}
            image2={item.cardImages?.[1] || ""}
            rating={item.rating || 0}
            price={item.price || 0}
            discountedPrice={item.discountedPrice || 0}
            description={item.description}
            discount={item.discount || 0}
            aboveHeight={item.aboveHeight || {}}
            belowHeight={item.belowHeight || {}}
            colorOptions={item.colorOptions || []}
            quantities={item.quantities || {}}
            height={item.height || ""}
            />
          ))}
        </div>
      ) : (
        <div className="no-products-container">
        <p className="no-products-message">No products found in this category.</p>
        <img
          src="/Images/notFound2.png"
          alt="No items found"
          className="no-products-image"
        />
      </div>
      
      )}
      {hasMore && (
        <button onClick={() => fetchProducts()} 
        disabled={loading}
        className="order-load-more-button">
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
};

export default SearchResults;
