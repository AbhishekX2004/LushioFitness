import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { UserContext } from "../../components/context/UserContext";
import EmptyWishList from "./EmptyWishList";
import ProductCard from "../home/ProductCard";
import { Pagination } from "@mui/material";
import Breadcrumb from "../../components/BreadCrumb";

function WishList() {
  const { user } = useContext(UserContext);
  const [page, setPage] = useState(1); // For keeping track of the current page
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
const [wishlistLength, setWishlistLength] = useState(0);
  const itemsPerPage = 10; 

  const handleChange = (event, value) => {
    setPage(value);
  };

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/wishlist/${user.uid}?page=${page}&limit=${itemsPerPage}`
        );
        setWishlistLength(response.data.pagination.totalItems);
        if (Array.isArray(response.data.wishlistItems)) {
          setWishlist(response.data.wishlistItems);
        }
      } catch (error) {
        console.error("Error fetching wishlist items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user, page]); // Re-fetch when user or page changes

  const wishlistHasItems = wishlistLength > 0;
  if (loading) return <div className="loader-container"> <span className="loader"></span></div>;

  if (!wishlistHasItems) {
    return <EmptyWishList />;
  }

  const breadcrumbItems = [
    { label: 'Home', link: '/' },
    { label: 'Wishlist', link: '/wishlist' },
  ];

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />
      <div className="wishlist-container">
        {wishlist.map((item) => (
          item.product ? (
            <ProductCard
              key={item.id}
              id={item.productId}
              displayName={item.product.displayName}
              image1={item.product.cardImages?.[0] || ""}
              image2={item.product.cardImages?.[1] || ""}
              rating={item.product.rating || 0}
              price={item.product.price || 0}
              discountedPrice={item.product.discountedPrice || 0}
              description={item.product.description}
              discount={item.product.discount || 0}
              aboveHeight={item.product.aboveHeight || {}}
              belowHeight={item.product.belowHeight || {}}
              colorOptions={item.product.colorOptions || []}
              quantities={item.product.quantities || {}}
              height={item.product.height || ""}
              wishlistPage={wishlist || []}
              setWishlistPage={setWishlist}
            />
          ) : null
        ))}
      </div>

      {/* Pagination Component */}
      <Pagination
        count={Math.ceil(wishlistLength / itemsPerPage)} // Total pages
        page={page}
        onChange={handleChange}
        style={{ marginBlock: '20px', display: 'flex', justifyContent: 'center' }}
        siblingCount={1} // How many pagination buttons to show around the current one
        variant="outlined"
        shape="rounded"
        className="wishlist-pagination"
        sx={{
          "& .Mui-selected": {
            backgroundColor: "#000000 !important", // Pure black background
            color: "#ffffff !important", // White text
            "&:hover": {
              backgroundColor: "#000000", // Make sure hover doesn't change the color
            },
          },
          "& .MuiPaginationItem-root": {
            backgroundColor: "#e7e7e7",
            color: "#6e6e6e", // Default button color
            "&:hover": {
              backgroundColor: "#e6e6e6", // Optional: Light grey hover for unselected buttons
            },
          },
        }}
      />
    </>
  );
}

export default WishList;
