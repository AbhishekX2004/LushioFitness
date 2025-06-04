import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProductCard from "../pages/home/ProductCard";
import axios from "axios";
import Breadcrumb from "./BreadCrumb";
import "./categoryPage.css";

function CategoryPage() {
  const { category, subCategory } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastDocId, setLastDocId] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Fetch products when the component mounts or the category changes
  useEffect(() => {
    fetchProducts(true);
  }, [category, subCategory]);

  const fetchProducts = async (reset = false) => {
    try {
      if (reset) {
        setProducts([]);
        setLastDocId(null);
        setHasMore(true);
      }
      
      setLoading(true);
      setError("");

      // Prepare categories for the API
      const categoriesArray = [category];
      if (subCategory) categoriesArray.push(subCategory);

      // API call
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/filters/getByCategory`,
        {
          categories: categoriesArray,
          lastDocId: reset ? null : lastDocId,
          limit: 25,
        }
      );

      const { products: fetchedProducts, hasMore, lastDocId: newLastDocId } = response.data;

      if (fetchedProducts.length === 0 && reset) {
        setError("No products found in this category.");
      }

      // Append new products if not resetting
      setProducts((prevProducts) => (reset ? fetchedProducts : [...prevProducts, ...fetchedProducts]));
      setHasMore(hasMore);
      setLastDocId(newLastDocId || null);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Error fetching products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore) fetchProducts();
  };

  const breadcrumbItems = [
    { label: "Home", link: "/" },
    { label: category, link: `/${category}` },
    ...(subCategory ? [{ label: subCategory, link: `/${category}/${subCategory}` }] : []),
  ];
if(loading){
   return(
 <div className="loader-container">
          <span className="loader"></span>
        </div>
   )
       
      
}
  return (
    <div className="category-page">
      <Breadcrumb items={breadcrumbItems} />

      {loading && products.length === 0 ? (
        <div className="loader-container">
          <span className="loader"></span>
        </div>
      ) : error ? (
        <div className="no-products-container">
          <p className="no-products-message">{error}</p>
          <img src="/Images/notFound2.png" alt="No items found" className="no-products-image" />
        </div>
      ) : (
        <div className="products-grid">
          {products.map((item) => (
            <ProductCard
              key={item.id}
              id={item.id}
              displayName={item.displayName || "No Name"}
              image1={item.cardImages?.[0] || "/Images/placeholder.png"}
              image2={item.cardImages?.[1] || "/Images/placeholder.png"}
              rating={item.rating || 0}
              price={item.price || 0}
              discountedPrice={item.discountedPrice || 0}
              description={item.description || "No description available."}
              discount={item.discount || 0}
              aboveHeight={item.aboveHeight || {}}
              belowHeight={item.belowHeight || {}}
              colorOptions={item.colorOptions || []}
              quantities={item.quantities || {}}
              height={item.height || ""}
            />
          ))}
        </div>
      )}

      { !loading && hasMore &&(
        <button onClick={handleLoadMore} className="order-load-more-button">
          Load More
        </button>
      )}
    </div>
  );
}

export default CategoryPage;