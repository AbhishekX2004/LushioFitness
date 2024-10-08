import React, { useState, useRef, useEffect } from "react";
import "./Navbar.css";
import { Link } from "react-router-dom";
import Dropdown from "./Dropdown";
import Submenu from "./Submenu";
import { getUser } from "../firebaseUtils";

function Navbar() {
 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const handleMouseEnter = (dropdownName) => {
    setActiveDropdown(dropdownName);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };
  const menuRef = useRef();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUser(); // Fetch user data
        if (userData) {
        
          setIsLoggedIn(true); // User is logged in
          setUser(userData);
         
        } else {
          setIsLoggedIn(false); // User is not logged in
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setIsLoggedIn(false); 
      }
    };
    
    fetchUser();
  }, []);
  const openMenu = () => {
    menuRef.current.style.left = "0";
    console.log(user);
  };
  const closeMenu = () => {
    menuRef.current.style.left = "-550px";
  };

  const searchRef = useRef();

  const openSearch = () => {
    searchRef.current.style.top = "60px";
  };
  const closeSearch = () => {
    searchRef.current.style.top = "-155px";
  };

  return (
    <nav id="navbar">
      <div className="navbar">
        <div className="logo">
          <Link to="/LushioFitness">
            <img src="./LushioFitness/Images/logo.png" alt="" />
          </Link>
        </div>
        <div className="left-icons">
          <img
            className="menu-open"
            src="./LushioFitness/Images/icons/menu_open_2.png"
            alt=""
            onClick={openMenu}
          />
          <Link to={isLoggedIn ? "/wallet" : "/login"}>
            <img src="./LushioFitness/Images/icons/wallet.png" alt="" />
          </Link>
          <img
            className="search-icon"
            src="./LushioFitness/Images/icons/search-icon-2.png"
            alt=""
            onClick={openSearch}
          />
        </div>

        <div className="list">
      <ul>
        <li
          onMouseEnter={() => handleMouseEnter("men")}
          onMouseLeave={handleMouseLeave}
        >
          <Link to="/men">Men</Link>{" "}
          <img src="./LushioFitness/Images/icons/dropdown2.png" alt="" />
          {activeDropdown === "men" && (
            <Dropdown
              category="men"
              topProducts={["Shirts", "Joggers", "Outerwear", "Pants", "Hats/Caps"]}
              featured={["New Drop", "Coming Soon", "Restock", "Best Seller", "Sale"]}
              imageSrc="./LushioFitness/Images/card-image-6.webp"
              launchTitle="NEW LAUNCH FOR MEN"
            />
          )}
        </li>
        <li
          onMouseEnter={() => handleMouseEnter("women")}
          onMouseLeave={handleMouseLeave}
        >
          <Link to="/women">Women</Link>{" "}
          <img src="./LushioFitness/Images/icons/dropdown2.png" alt="" />
          {activeDropdown === "women" && (
            <Dropdown
              category="women"
              topProducts={["Panty", "Tops", "Leggings", "Outerwear", "Matching Sets"]}
              featured={["New Drop", "Coming Soon", "Restock", "Best Seller", "Sale"]}
              imageSrc="./LushioFitness/Images/card-image-2.webp"
              launchTitle="NEW LAUNCH FOR WOMEN"
            />
          )}
        </li>
        <li
          onMouseEnter={() => handleMouseEnter("accessories")}
          onMouseLeave={handleMouseLeave}
        >
          <Link to="/accessories">Accessories</Link>{" "}
          <img src="./LushioFitness/Images/icons/dropdown2.png" alt="" />
          {activeDropdown === "accessories" && (
            <Dropdown
              category="accessories"
              topProducts={["Gloves", "Shakers", "Wrist Band", "Deadlift Band"]}
              featured={["New Drop", "Coming Soon", "Restock", "Best Seller", "Sale"]}
              imageSrc="./LushioFitness/Images/shopping.webp"
              launchTitle="NEW LAUNCH"
            />
          )}
        </li>
      </ul>
    </div>
        <div className="new-search">
<input  type="text"
    name="productName"
    placeholder="search by product category or collection" />
      <img src="./LushioFitness/Images/icons/search-icon.png" alt="" />
    </div>
        <Link to="/LushioFitness" className="lushio-text">
          <img src="./LushioFitness/Images/lushio-text-3.png" alt="" />
        </Link>
        <div className="icons">
          
          <Link  to={isLoggedIn ? "/wishlist" : "/login"}>
            <img src="./LushioFitness/Images/icons/wishlist.png" alt="" />
          </Link>
          <Link  to={isLoggedIn ? "/cart" : "/login"}>
            <img src="./LushioFitness/Images/icons/cart.png" alt="" />
            {/* <span>{getTotalCartItems()}</span> */}
          </Link>
          <Link className="wallet-icon" to={isLoggedIn ? "/wallet" : "/login"}>
            <img src="./LushioFitness/Images/icons/wallet.png" alt="" />
          </Link>

          <Link to={isLoggedIn ? "/user" : "/login"}>
  <img src="./LushioFitness/Images/icons/profile.png" alt="Profile" />
</Link>
        </div>
        <div ref={menuRef} className="submenu">
          <div className="responsive-navbar">
            <img
              className="cross-icon"
              src="./LushioFitness/Images/icons/cross_icon.svg"
              alt=""
              onClick={closeMenu}
            />
            <Submenu />
          </div>
        </div>
        <div ref={searchRef} className="header-search">
          <div className="header-search-form-control">
            <img src="./LushioFitness/Images/icons/search.svg" alt="" />
            <input type="search" placeholder="SEARCH FOR..." />
            <img
              src="./LushioFitness/Images/icons/cross.png"
              alt=""
              onClick={closeSearch}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
