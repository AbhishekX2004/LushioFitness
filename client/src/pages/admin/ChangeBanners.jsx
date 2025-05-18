import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebaseConfig';
import URLMedia from '../../components/URLMediaRenderer';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import './ChangeBanners.css';

// API
const API = process.env.REACT_APP_API_URL;

const ChangeBanners = () => {
  // State variables
  const [carouselBanners, setCarouselBanners] = useState([]);
  const [navbarPosters, setNavbarPosters] = useState({
    men: '',
    women: '',
    accessories: ''
  });
  const [highlightPosters, setHighlightPosters] = useState({
    card1: { image: '', heading: '', category: ['', ''] },
    card2: { image: '' },
    card3: { image: '' }
  });
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState({ men: [], women: [], accessories: [] });
  const [selectedMainCategory, setSelectedMainCategory] = useState('men');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [heading, setHeading] = useState('');

  // Fetch data from Firestore and API on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch admin document from Firestore
        const adminDocRef = doc(db, 'controls', 'admin');
        const adminDocSnap = await getDoc(adminDocRef);
        
        if (adminDocSnap.exists()) {
          const data = adminDocSnap.data();
          if (data.carouselBanners) setCarouselBanners(data.carouselBanners);
          if (data.navbarPosters) setNavbarPosters(data.navbarPosters);
          if (data.highlightPosters) {
            setHighlightPosters(data.highlightPosters);
            // Initialize category state if it exists
            if (data.highlightPosters.card1 && 
                data.highlightPosters.card1.category && 
                Array.isArray(data.highlightPosters.card1.category) && 
                data.highlightPosters.card1.category.length === 2) {
              setSelectedMainCategory(data.highlightPosters.card1.category[0]);
              setSelectedSubCategory(data.highlightPosters.card1.category[1]);
            }
            // Initialize heading if it exists
            if (data.highlightPosters.card1 && data.highlightPosters.card1.heading) {
              setHeading(data.highlightPosters.card1.heading);
            }
          }
        }

        // Fetch categories from API
        const response = await fetch(`${API}/subCategories`);
        const categoriesData = await response.json();
        setCategories(categoriesData);
        
        // Initialize the first subcategory if available
        if (categoriesData.men && categoriesData.men.length > 0) {
          setSelectedSubCategory(categoriesData.men[0]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Upload image to Firebase Storage
  const uploadImage = async (file, path) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // Delete image from Firebase Storage
  const deleteImage = async (url) => {
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  // Extract storage path from download URL
  const getStoragePathFromUrl = (url) => {
    // Firebase Storage URLs typically have a structure like:
    // https://firebasestorage.googleapis.com/v0/b/PROJECT_ID.appspot.com/o/PATH?alt=media&token=TOKEN
    const urlObj = new URL(url);
    let path = urlObj.pathname.split('/o/')[1];
    if (path) {
      path = decodeURIComponent(path);
      return path;
    }
    return null;
  };

  // Update Firestore with new data
  const updateFirestore = async (data) => {
    try {
      const adminDocRef = doc(db, 'controls', 'admin');
      await updateDoc(adminDocRef, data);
      return true;
    } catch (error) {
      console.error("Error updating document:", error);
      return false;
    }
  };

  // Handle carousel banner upload
  const handleCarouselImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const newBanners = [...carouselBanners];

      for (const file of files) {
        const uniqueId = uuidv4();
        const path = `banners/carousel/${uniqueId}-${file.name}`;
        const downloadURL = await uploadImage(file, path);
        
        newBanners.push({
          id: uniqueId,
          url: downloadURL,
          path: path
        });
      }

      setCarouselBanners(newBanners);
      await updateFirestore({ carouselBanners: newBanners });
      setUploading(false);
    } catch (error) {
      console.error("Error uploading images:", error);
      setUploading(false);
    }
  };

  // Handle removing carousel banner
  const handleRemoveCarouselImage = async (index) => {
    try {
      const imageToRemove = carouselBanners[index];
      // Delete from storage
      if (imageToRemove.path) {
        await deleteImage(imageToRemove.path);
      } else if (imageToRemove.url) {
        const path = getStoragePathFromUrl(imageToRemove.url);
        if (path) await deleteImage(path);
      }

      // Update state and Firestore
      const updatedBanners = carouselBanners.filter((_, i) => i !== index);
      setCarouselBanners(updatedBanners);
      await updateFirestore({ carouselBanners: updatedBanners });
    } catch (error) {
      console.error("Error removing image:", error);
    }
  };

  // Handle navbar poster upload
  const handleNavbarPosterUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // If there's an existing image, delete it first
      if (navbarPosters[type]) {
        const path = getStoragePathFromUrl(navbarPosters[type]);
        if (path) await deleteImage(path);
      }

      const path = `banners/navbar/${type}-${uuidv4()}-${file.name}`;
      const downloadURL = await uploadImage(file, path);
      
      const updatedPosters = { ...navbarPosters, [type]: downloadURL };
      setNavbarPosters(updatedPosters);
      await updateFirestore({ navbarPosters: updatedPosters });
      setUploading(false);
    } catch (error) {
      console.error("Error uploading navbar poster:", error);
      setUploading(false);
    }
  };

  // Handle highlight poster upload
  const handleHighlightPosterUpload = async (e, cardNum) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // If there's an existing image, delete it first
      const currentCard = highlightPosters[`card${cardNum}`];
      if (currentCard.image) {
        const path = getStoragePathFromUrl(currentCard.image);
        if (path) await deleteImage(path);
      }

      const path = `banners/highlights/card${cardNum}-${uuidv4()}-${file.name}`;
      const downloadURL = await uploadImage(file, path);
      
      let updatedPosters;
      if (cardNum === 1) {
        updatedPosters = {
          ...highlightPosters,
          card1: {
            ...highlightPosters.card1,
            image: downloadURL
          }
        };
      } else {
        updatedPosters = {
          ...highlightPosters,
          [`card${cardNum}`]: { image: downloadURL }
        };
      }
      
      setHighlightPosters(updatedPosters);
      await updateFirestore({ highlightPosters: updatedPosters });
      setUploading(false);
    } catch (error) {
      console.error("Error uploading highlight poster:", error);
      setUploading(false);
    }
  };

  // Handle highlight card 1 details update
  const handleHighlightCard1Update = async () => {
    if (!heading || !selectedMainCategory || !selectedSubCategory) return;

    try {
      const updatedPosters = {
        ...highlightPosters,
        card1: {
          ...highlightPosters.card1,
          heading: heading,
          category: [selectedMainCategory, selectedSubCategory]
        }
      };
      
      setHighlightPosters(updatedPosters);
      await updateFirestore({ highlightPosters: updatedPosters });
    } catch (error) {
      console.error("Error updating highlight card details:", error);
    }
  };

  // Handle main category change
  const handleMainCategoryChange = (e) => {
    const mainCategory = e.target.value;
    setSelectedMainCategory(mainCategory);
    
    // Reset subcategory to first one in the new main category
    if (categories[mainCategory] && categories[mainCategory].length > 0) {
      setSelectedSubCategory(categories[mainCategory][0]);
    } else {
      setSelectedSubCategory('');
    }
  };

  if (loading) {
    return <div className="ChangeBanners-loading">Loading...</div>;
  }

  return (
    <div className="ChangeBanners-container">
      <h1 className="ChangeBanners-title">Update Banners & Posters</h1>
      
      {/* Carousel Banners Section */}
      <section className="ChangeBanners-section">
        <h2 className="ChangeBanners-section-title">Carousel Banners</h2>
        <div className="ChangeBanners-carousel-preview">
          {carouselBanners.map((banner, index) => (
            <div key={banner.id || index} className="ChangeBanners-image-container">
               <URLMedia src={banner.url} className="media-preview" />
              <button 
                className="ChangeBanners-remove-btn" 
                onClick={() => handleRemoveCarouselImage(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="ChangeBanners-upload">
          <label className="ChangeBanners-upload-label">
            Add New Banner
            <input
              type="file"
               accept="image/*,video/*"
              multiple
              onChange={handleCarouselImageUpload}
              disabled={uploading}
              className="ChangeBanners-upload-input"
            />
          </label>
        </div>
      </section>
      
      {/* Navbar Posters Section */}
      <section className="ChangeBanners-section">
        <h2 className="ChangeBanners-section-title">Navbar Posters</h2>
        
        <div className="ChangeBanners-navbar-grid">
          {/* Men Poster */}
          <div className="ChangeBanners-navbar-item">
            <h3 className="ChangeBanners-subsection-title">Men</h3>
            {navbarPosters.men ? (
              <div className="ChangeBanners-image-container">
                <img src={navbarPosters.men} alt="Men navbar poster" />
                <button 
                  className="ChangeBanners-remove-btn" 
                  onClick={async () => {
                    if (navbarPosters.men) {
                      const path = getStoragePathFromUrl(navbarPosters.men);
                      if (path) await deleteImage(path);
                      const updatedPosters = { ...navbarPosters, men: '' };
                      setNavbarPosters(updatedPosters);
                      await updateFirestore({ navbarPosters: updatedPosters });
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="ChangeBanners-empty-preview">No poster selected</div>
            )}
            <div className="ChangeBanners-upload">
              <label className="ChangeBanners-upload-label">
                Update Men Poster
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleNavbarPosterUpload(e, 'men')}
                  disabled={uploading}
                  className="ChangeBanners-upload-input"
                />
              </label>
            </div>
          </div>
          
          {/* Women Poster */}
          <div className="ChangeBanners-navbar-item">
            <h3 className="ChangeBanners-subsection-title">Women</h3>
            {navbarPosters.women ? (
              <div className="ChangeBanners-image-container">
                <img src={navbarPosters.women} alt="Women navbar poster" />
                <button 
                  className="ChangeBanners-remove-btn" 
                  onClick={async () => {
                    if (navbarPosters.women) {
                      const path = getStoragePathFromUrl(navbarPosters.women);
                      if (path) await deleteImage(path);
                      const updatedPosters = { ...navbarPosters, women: '' };
                      setNavbarPosters(updatedPosters);
                      await updateFirestore({ navbarPosters: updatedPosters });
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="ChangeBanners-empty-preview">No poster selected</div>
            )}
            <div className="ChangeBanners-upload">
              <label className="ChangeBanners-upload-label">
                Update Women Poster
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleNavbarPosterUpload(e, 'women')}
                  disabled={uploading}
                  className="ChangeBanners-upload-input"
                />
              </label>
            </div>
          </div>
          
          {/* Accessories Poster */}
          <div className="ChangeBanners-navbar-item">
            <h3 className="ChangeBanners-subsection-title">Accessories</h3>
            {navbarPosters.accessories ? (
              <div className="ChangeBanners-image-container">
                <img src={navbarPosters.accessories} alt="Accessories navbar poster" />
                <button 
                  className="ChangeBanners-remove-btn" 
                  onClick={async () => {
                    if (navbarPosters.accessories) {
                      const path = getStoragePathFromUrl(navbarPosters.accessories);
                      if (path) await deleteImage(path);
                      const updatedPosters = { ...navbarPosters, accessories: '' };
                      setNavbarPosters(updatedPosters);
                      await updateFirestore({ navbarPosters: updatedPosters });
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="ChangeBanners-empty-preview">No poster selected</div>
            )}
            <div className="ChangeBanners-upload">
              <label className="ChangeBanners-upload-label">
                Update Accessories Poster
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleNavbarPosterUpload(e, 'accessories')}
                  disabled={uploading}
                  className="ChangeBanners-upload-input"
                />
              </label>
            </div>
          </div>
        </div>
      </section>
      
      {/* Highlight Posters Section */}
      <section className="ChangeBanners-section">
        <h2 className="ChangeBanners-section-title">Highlight Posters</h2>
        
        <div className="ChangeBanners-highlights-grid">
          {/* Card 1 */}
          <div className="ChangeBanners-highlight-item">
            <h3 className="ChangeBanners-subsection-title">Highlight</h3>
            <div className="ChangeBanners-highlight-card-details">
              <input
                type="text"
                placeholder="Enter heading"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                className="ChangeBanners-input"
              />
              
              {/* Main Category Dropdown */}
              <select
                value={selectedMainCategory}
                onChange={handleMainCategoryChange}
                className="ChangeBanners-select"
              >
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="accessories">Accessories</option>
              </select>
              
              {/* Sub-Category Dropdown */}
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                className="ChangeBanners-select"
              >
                {categories[selectedMainCategory]?.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              
              <button 
                className="ChangeBanners-update-btn"
                onClick={handleHighlightCard1Update}
              >
                Update Details
              </button>
            </div>
            
            {/* Current Category Display */}
            {highlightPosters.card1.category && 
              Array.isArray(highlightPosters.card1.category) && 
              highlightPosters.card1.category.length === 2 && (
              <div className="ChangeBanners-current-category">
                Current Category: 
                <span className="ChangeBanners-category-value">
                  {highlightPosters.card1.category[0]} / {highlightPosters.card1.category[1]}
                </span>
              </div>
            )}
            
            {highlightPosters.card1.image ? (
              <div className="ChangeBanners-image-container">
                <img src={highlightPosters.card1.image} alt="Highlight card 1" />
                <button 
                  className="ChangeBanners-remove-btn" 
                  onClick={async () => {
                    if (highlightPosters.card1.image) {
                      const path = getStoragePathFromUrl(highlightPosters.card1.image);
                      if (path) await deleteImage(path);
                      const updatedPosters = {
                        ...highlightPosters,
                        card1: {
                          ...highlightPosters.card1,
                          image: ''
                        }
                      };
                      setHighlightPosters(updatedPosters);
                      await updateFirestore({ highlightPosters: updatedPosters });
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="ChangeBanners-empty-preview">No image selected</div>
            )}
            <div className="ChangeBanners-upload">
              <label className="ChangeBanners-upload-label">
                Update Card 1 Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleHighlightPosterUpload(e, 1)}
                  disabled={uploading}
                  className="ChangeBanners-upload-input"
                />
              </label>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="ChangeBanners-highlight-item">
            <h3 className="ChangeBanners-subsection-title">Best Sellers</h3>
            {highlightPosters.card2.image ? (
              <div className="ChangeBanners-image-container">
                <img src={highlightPosters.card2.image} alt="Highlight card 2" />
                <button 
                  className="ChangeBanners-remove-btn" 
                  onClick={async () => {
                    if (highlightPosters.card2.image) {
                      const path = getStoragePathFromUrl(highlightPosters.card2.image);
                      if (path) await deleteImage(path);
                      const updatedPosters = {
                        ...highlightPosters,
                        card2: { image: '' }
                      };
                      setHighlightPosters(updatedPosters);
                      await updateFirestore({ highlightPosters: updatedPosters });
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="ChangeBanners-empty-preview">No image selected</div>
            )}
            <div className="ChangeBanners-upload">
              <label className="ChangeBanners-upload-label">
                Update Card 2 Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleHighlightPosterUpload(e, 2)}
                  disabled={uploading}
                  className="ChangeBanners-upload-input"
                />
              </label>
            </div>
          </div>
          
          {/* Card 3 */}
          <div className="ChangeBanners-highlight-item">
            <h3 className="ChangeBanners-subsection-title">Sale</h3>
            {highlightPosters.card3.image ? (
              <div className="ChangeBanners-image-container">
                <img src={highlightPosters.card3.image} alt="Highlight card 3" />
                <button 
                  className="ChangeBanners-remove-btn" 
                  onClick={async () => {
                    if (highlightPosters.card3.image) {
                      const path = getStoragePathFromUrl(highlightPosters.card3.image);
                      if (path) await deleteImage(path);
                      const updatedPosters = {
                        ...highlightPosters,
                        card3: { image: '' }
                      };
                      setHighlightPosters(updatedPosters);
                      await updateFirestore({ highlightPosters: updatedPosters });
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="ChangeBanners-empty-preview">No image selected</div>
            )}
            <div className="ChangeBanners-upload">
              <label className="ChangeBanners-upload-label">
                Update Card 3 Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleHighlightPosterUpload(e, 3)}
                  disabled={uploading}
                  className="ChangeBanners-upload-input"
                />
              </label>
            </div>
          </div>
        </div>
      </section>
      
      {uploading && <div className="ChangeBanners-uploading">Uploading, please wait...</div>}
    </div>
  );
};

export default ChangeBanners;