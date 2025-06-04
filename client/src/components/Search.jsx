import React,{useState,useEffect} from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
function Search({searchRef, closeSearch}) {
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();
const location = useLocation();
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

    useEffect(() => {
    closeSearch();
    setSearchText(""); 
  }, [location.pathname]); 

const handleSearch = (e) => {
  if (e.key === "Enter" && searchText.trim()) {
    const trimmedText = searchText.trim().toLowerCase();

    // Check for specific categories
    if (["men", "women", "accessories"].includes(trimmedText)) {
      navigate(`/${trimmedText}`);
    } else {
      navigate(`/search?query=${encodeURIComponent(trimmedText)}`);
    }

    setSearchText("");
    closeSearch();
  }
};

 

  const closeSearchBox = () => {
    setSearchText("");
    closeSearch();

  };
  return (
    <div ref={searchRef} className="header-search">
    <div className="header-search-form-control">
      <img src="/Images/icons/search.svg" alt="" />
      {/* <input type="search" placeholder="SEARCH FOR..." /> */}
      <input
        type="search"
        placeholder="SEARCH FOR..."
        value={searchText}
        onChange={handleSearchChange}
        onKeyPress={handleSearch} // Trigger search on Enter key
      />
      <img
        src="/Images/icons/cross.png"
        alt=""
        onClick={closeSearchBox}
      />
    </div>
  </div>
  )
}

export default Search
