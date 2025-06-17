import React, { useState, useRef, useEffect, useContext } from "react";
import "./Navbar.css";
import Dropdown from "./Dropdown";
import axios from "axios";
import Submenu from "./Submenu";
import { useWishlist } from "./context/WishlistContext";
import Search from "./Search";
import { UserContext } from "./context/UserContext";
import { useCart } from "./context/CartContext";
import { useNavigate } from "react-router-dom";
function Navbar() {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { wishlist } = useWishlist();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { cartCount } = useCart();

  const handleMouseEnter = (dropdownName) => {
    setActiveDropdown(dropdownName);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };
  const menuRef = useRef();

  const openMenu = () => {
    if (menuRef.current) {
      menuRef.current.style.left = "0";
      document.body.classList.add("no-scroll");
     
    }
  };

  const closeMenu = () => {
    if (menuRef.current) {
      menuRef.current.style.left = "-1148px";
      document.body.classList.remove("no-scroll");
    }
  };

  useEffect(() => {
    const fetchWishlistCount = async () => {
      // Ensure the user is defined before proceeding
      if (!user?.uid) return;

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/wishlist/count/${user.uid}`
        );
      
        // Validate response format
        setWishlistCount(response.data.count);
      } catch (error) {
        console.error("Error fetching wishlist Count", error);
        // setError("Failed to load wishlist items."); // Uncomment if you want to handle errors in state
      }
    };

    fetchWishlistCount();
  }, [user, wishlist]);

  const [subcategories, setSubcategories] = useState({
    men: [],
    women: [],
    accessories: [],
  });

  useEffect(() => {
  const fetchSubcategories = async () => {
    try {
      const cachedData = localStorage.getItem("subcategories");

      if (cachedData) {
        // Use cached data if available
        setSubcategories(JSON.parse(cachedData));
      } else {
        // If not cached, fetch from API
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/subcategories`
        );

        setSubcategories(response.data);
        localStorage.setItem("subcategories", JSON.stringify(response.data));
      }
    } catch (err) {
      console.error("Error fetching subcategories:", err);
    }
  };

  fetchSubcategories();
}, []);
;
  useEffect(() => {
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, []);
  const searchRef = useRef();

  const openSearch = () => {
    searchRef.current.style.top = "60px";
  };
  const closeSearch = () => {
    searchRef.current.style.top = "-155px";
  };

  return (
    <nav id="navbar">
      <div className="left-icons">
        <img
          className="menu-open"
          src="/Images/icons/menu_open.png"
          alt=""
          onClick={openMenu}
        />
{
  user ?  <img
  src="/Images/icons/wallet.png"
  alt=""
  className="wallet-icon"
  onClick={() => navigate("/wallet")}
/>: <img
          src="/Images/icons/wallet.png"
          alt=""
          className="wallet-icon"
          onClick={() => navigate("/login")}
        />
}
       

        <img
          className="search-icon"
          src="/Images/icons/search-icon.png"
          alt=""
          onClick={openSearch}
        />
        <div className="list">
          <ul>
            <li
              onMouseEnter={() => handleMouseEnter("men")}
              onMouseLeave={handleMouseLeave}
             
            >
              <span
    onClick={() => {
      navigate("/men");
      setActiveDropdown(null);
    }}
  >
    MEN
  </span>

              <img src="/Images/icons/dropdown.png" alt="" />
              
              {activeDropdown === "men" && (
                <Dropdown
                  setActiveDropdown={setActiveDropdown}
                  category="men"
topProducts={subcategories.men}

                  imageSrc="/Images/card-image-6.webp"
                  launchTitle="NEW LAUNCH FOR MEN"
                />
              )}
            </li>
            <li
              onMouseEnter={() => handleMouseEnter("women")}
              onMouseLeave={handleMouseLeave}
              
            >
           <span
    onClick={() => {
      navigate("/women");
      setActiveDropdown(null);
    }}
  >
    WOMEN
  </span>
 <img src="/Images/icons/dropdown.png" alt="" />
              {activeDropdown === "women" && (
                <Dropdown
                  setActiveDropdown={setActiveDropdown}
                  category="women"
                
                  topProducts={subcategories.women}
                
                  imageSrc="/Images/card-image-2.webp"
                  launchTitle="NEW LAUNCH FOR WOMEN"
                />
              )}
            </li>
            <li
              onMouseEnter={() => handleMouseEnter("accessories")}
              onMouseLeave={handleMouseLeave}
            
            >
 <span
    onClick={() => {
      navigate("/accessories");
      setActiveDropdown(null);
    }}
  >
    ACCESSORIES
  </span>
  <img src="/Images/icons/dropdown.png" alt="" />
              {activeDropdown === "accessories" && (
                <Dropdown
                  setActiveDropdown={setActiveDropdown}
                  category="accessories"
                 
                  topProducts={subcategories.accessories}
                  featured={[
                    "New Drop",
                    "Coming Soon",
                    "Restock",
                    "Best Seller",
                    "Sale",
                  ]}
                  imageSrc="/Images/card-image-4.webp"
                  launchTitle="NEW LAUNCH"
                />
              )}
            </li>
          </ul>
        </div>
      </div>

      <div className="lushio-text">
        <img
          src="/Images/icons/lushio-text.png"
          alt=""
          onClick={() => navigate("/")}
        />
      </div>
      {user ? (
        <div className="right-icons">
  <div className="right-icon-wrapper">
    <img
      src="/Images/icons/wishlist.png"
      alt=""
      onClick={() => navigate("/wishlist")}
    />
  { user && wishlistCount > 0 &&  <span className="icon-badge">{wishlistCount}</span>}
  </div>
  <div className="right-icon-wrapper">
    <img
      src="/Images/icons/cart.png"
      alt=""
      onClick={() => navigate("/cart")}
    />
    {user && cartCount > 0 && <span className="icon-badge">{cartCount}</span>}
 
  </div>
  <div className="right-icon-wrapper">
    <img
      src="/Images/icons/profile.png"
      alt="Profile"
      onClick={() => navigate("/user")}
    />
  </div>
</div>

      ) : (
        <div className="right-icons">
        <div className="right-icon-wrapper">
          <img
            src="/Images/icons/wishlist.png"
            alt=""
            onClick={() => navigate("/login")}
          />
   
        </div>
        <div className="right-icon-wrapper">
          <img
            src="/Images/icons/cart.png"
            alt=""
            onClick={() => navigate("/login")}
          />
        
        </div>
        <div className="right-icon-wrapper">
          <img
            src="/Images/icons/profile.png"
            alt="Profile"
            onClick={() => navigate("/login")}
          />
        </div>
      </div>
      )}

      <Submenu menuRef={menuRef} closeMenu={closeMenu} defaultMenu="men" />

      <Search searchRef={searchRef} closeSearch={closeSearch} />
    </nav>
  );
}

export default Navbar;
