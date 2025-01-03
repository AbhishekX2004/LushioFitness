import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProductCard from "../pages/home/ProductCard"; // Assuming you have a ProductCard component
import "./categoryPage.css";
import axios from "axios"; // Import axios for making API requests
import Breadcrumb from "./BreadCrumb";
function CategoryPage() {
  const { category, subCategory } = useParams(); // Get category and subCategory from URL params
  const [products, setProducts] = useState([]); // State to store fetched products
  const [loading, setLoading] = useState(true); // State to handle loading indicator
  const [error, setError] = useState(null); // State to handle errors

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true); // Start loading
       setProducts([]);

        // Make a POST request to fetch products by category
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/filters/getByCategory`, {
          categories: [category, subCategory], // Send categories array based on params
        });

        setProducts(response.data); // Update products state with the response data
      } catch (err) {
       console.log(error);
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchProducts(); // Call the function to fetch products when component mounts or params change
  }, [category, subCategory]); // Dependency array to re-run when params change
  if (loading) return <div className="loader-container"> <span className="loader"></span></div>;

  const breadcrumbItems = [
    { label: 'Home', link: '/' },
    { label: category, link: `/${category}` },
    { label: subCategory, link: `/${category}` },
   
  ];
  return (
    <div className="category-page">
    
      <Breadcrumb items={breadcrumbItems} />
      {loading ? (
       <div className="loader-container"> <span className="loader"></span></div>
      )  : products.length > 0 ? (
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
    </div>
  );
}

export default CategoryPage;
