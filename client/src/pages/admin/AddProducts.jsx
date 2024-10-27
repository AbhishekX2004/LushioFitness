import React, { useState } from 'react';
import axios from 'axios';
import { storage } from "../../firebaseConfig"; // Import storage from Firebase config
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import "./AddProducts.css";
import MediaRenderer from '../../components/MediaRenderer';
import URLMedia from '../../components/URLMediaRenderer';

const AddProducts = () => {
  const [product, setProduct] = useState({
    name: '',
    displayName: '',
    description: '',
    price: '',
    gst: '',
    discount: '',
    categories: '',
    height: '',
    aboveHeight: { colorOptions: [], quantities: {} },
    belowHeight: { colorOptions: [], quantities: {} },
    colorOptions: [],
    quantities: {},
    cardImages: [],
  });

  const [isHeightBased, setIsHeightBased] = useState(false);
  const [newColor, setNewColor] = useState({ name: '', code: '#43da86' });

  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleCategoryChange = (e) => {
    setProduct({ ...product, categories: e.target.value.split(',').map(cat => cat.trim()) });
  };

  const handleColorAdd = (type = 'normal') => {
    if (newColor.name && newColor.code) {
      const newColorWithImages = { ...newColor, images: [] };
      if (type === 'above') {
        setProduct({
          ...product,
          aboveHeight: {
            ...product.aboveHeight,
            colorOptions: [...product.aboveHeight.colorOptions, newColorWithImages]
          }
        });
      } else if (type === 'below') {
        setProduct({
          ...product,
          belowHeight: {
            ...product.belowHeight,
            colorOptions: [...product.belowHeight.colorOptions, newColorWithImages]
          }
        });
      } else {
        setProduct({
          ...product,
          colorOptions: [...product.colorOptions, newColorWithImages]
        });
      }
      setNewColor({ name: '', code: '#43da86', images: [] });
    }
  };

  const handleQuantityChange = (color, size, value, type = 'normal') => {
    if (type === 'above') {
      setProduct({
        ...product,
        aboveHeight: {
          ...product.aboveHeight,
          quantities: {
            ...product.aboveHeight.quantities,
            [color]: { ...product.aboveHeight.quantities[color], [size]: parseInt(value) }
          }
        }
      });
    } else if (type === 'below') {
      setProduct({
        ...product,
        belowHeight: {
          ...product.belowHeight,
          quantities: {
            ...product.belowHeight.quantities,
            [color]: { ...product.belowHeight.quantities[color], [size]: parseInt(value) }
          }
        }
      });
    } else {
      setProduct(prevProduct => ({
        ...prevProduct,
        quantities: {
          ...prevProduct.quantities,
          [color]: {
            ...prevProduct.quantities[color],
            [size]: parseInt(value)
          }
        }
      }));
    }
  };

  const handleImageUpload = async (e, colorName = null, heightType = null) => {
    const files = Array.from(e.target.files);
    console.log(`Starting upload for ${heightType || 'regular'} height, color: ${colorName || 'none'}`);
    
    const uploadPromises = files.map(async (file) => {
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
  
      try {
        const snapshot = await uploadBytesResumable(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
      } catch (error) {
        console.error('Error uploading image:', error);
        return null;
      }
    });
  
    try {
      const imageUrls = await Promise.all(uploadPromises);
      const validUrls = imageUrls.filter(url => url !== null);
      console.log('New valid URLs:', validUrls);
  
      setProduct(prevProduct => {
        let updatedProduct = { ...prevProduct };
  
        if (colorName && heightType) {
          // Handle height-specific color images
          const heightSection = `${heightType}Height`;
          console.log(`Updating ${heightSection} section`);
          
          // Initialize colorOptions if it doesn't exist
          if (!updatedProduct[heightSection]) {
            updatedProduct[heightSection] = { colorOptions: [] };
          }
          if (!updatedProduct[heightSection].colorOptions) {
            updatedProduct[heightSection].colorOptions = [];
          }
  
          const colorIndex = updatedProduct[heightSection].colorOptions.findIndex(
            color => color.name === colorName
          );
  
          if (colorIndex === -1) {
            // If color doesn't exist, add it
            console.log(`Adding new color ${colorName} to ${heightSection}`);
            updatedProduct[heightSection].colorOptions.push({
              name: colorName,
              images: [...validUrls] // Create new array
            });
          } else {
            // Update existing color images
            console.log(`Updating existing color ${colorName} in ${heightSection}`);
            console.log('Existing images:', updatedProduct[heightSection].colorOptions[colorIndex].images);
            
            const existingImages = updatedProduct[heightSection].colorOptions[colorIndex].images || [];
            // Use Set to ensure uniqueness
            const uniqueImages = Array.from(new Set([...existingImages, ...validUrls]));
            
            updatedProduct[heightSection].colorOptions[colorIndex] = {
              ...updatedProduct[heightSection].colorOptions[colorIndex],
              images: uniqueImages
            };
            
            console.log('Updated images:', uniqueImages);
          }
        } else if (colorName) {
          // Handle regular color images
          if (!updatedProduct.colorOptions) {
            updatedProduct.colorOptions = [];
          }
  
          const colorIndex = updatedProduct.colorOptions.findIndex(
            color => color.name === colorName
          );
  
          if (colorIndex !== -1) {
            const existingImages = updatedProduct.colorOptions[colorIndex].images || [];
            const uniqueImages = Array.from(new Set([...existingImages, ...validUrls]));
            
            updatedProduct.colorOptions[colorIndex] = {
              ...updatedProduct.colorOptions[colorIndex],
              images: uniqueImages
            };
          }
        } else {
          // Handle card images
          const existingCardImages = updatedProduct.cardImages || [];
          const uniqueCardImages = Array.from(new Set([...existingCardImages, ...validUrls]));
          updatedProduct.cardImages = uniqueCardImages;
        }
  
        console.log('Updated product state:', updatedProduct);
        return updatedProduct;
      });
  
    } catch (error) {
      console.error('Error handling image uploads:', error);
    }
  };
  const handleRemoveImage = (imageUrl, colorName = null, heightType = null) => {
    setProduct(prev => {
      if (colorName && heightType) {
        const heightSection = `${heightType}Height`;
        const colorIndex = prev[heightSection].colorOptions.findIndex(
          color => color.name === colorName
        );

        if (colorIndex !== -1) {
          const updatedColorOptions = [...prev[heightSection].colorOptions];
          updatedColorOptions[colorIndex] = {
            ...updatedColorOptions[colorIndex],
            images: updatedColorOptions[colorIndex].images.filter(url => url !== imageUrl)
          };

          return {
            ...prev,
            [heightSection]: {
              ...prev[heightSection],
              colorOptions: updatedColorOptions
            }
          };
        }
      } else if (colorName) {
        const colorIndex = prev.colorOptions.findIndex(
          color => color.name === colorName
        );

        if (colorIndex !== -1) {
          const updatedColorOptions = [...prev.colorOptions];
          updatedColorOptions[colorIndex] = {
            ...updatedColorOptions[colorIndex],
            images: updatedColorOptions[colorIndex].images.filter(url => url !== imageUrl)
          };

          return {
            ...prev,
            colorOptions: updatedColorOptions
          };
        }
      } else {
        return {
          ...prev,
          cardImages: prev.cardImages.filter(url => url !== imageUrl)
        };
      }
      return prev;
    });
  };
  // Helper function to ensure proper initialization of product structure
  const initializeProduct = (product) => {
    return {
      ...product,
      cardImages: product.cardImages || [],
      colorOptions: product.colorOptions || [],
      aboveHeight: {
        ...product.aboveHeight,
        colorOptions: product?.aboveHeight?.colorOptions || []
      },
      belowHeight: {
        ...product.belowHeight,
        colorOptions: product?.belowHeight?.colorOptions || []
      }
    };
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure proper structure before submitting
      let productData = initializeProduct(product);
      
      console.log('Submitting product data:', productData);
  
      const response = await axios.post(
        'http://127.0.0.1:5001/lushio-fitness/us-central1/api/products/addProduct',
        productData
      );
      
      console.log('Product added:', response.data);
      alert("Added");
      window.location.reload();
    } catch (error) {
      console.error('Error adding product:', error);
      alert("Failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
      <form onSubmit={handleSubmit} className="add-product-form" >
        <div className="name-inputs">
          <div>
            <label htmlFor="name" className="block mb-1">Name</label>
            <input
              id="name"
              name="name"
              value={product.name}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="displayName" className="block mb-1">Display Name</label>
            <input
              id="displayName"
              name="displayName"
              value={product.displayName}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="description-container">
          <label htmlFor="description" className="block mb-1">Description</label>
          <textarea
            id="description"
            name="description"
            value={product.description}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="price-inputs">
          <div>
            <label htmlFor="price" className="block mb-1">Price</label>
            <input
              id="price"
              name="price"
              type="number"
              value={product.price}
              onChange={handleInputChange}
              min="0"
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="gst" className="block mb-1">GST (%)</label>
            <input
              id="gst"
              name="gst"
              type="number"
              value={product.gst}
              onChange={handleInputChange}
                 min="0"
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="discount" className="block mb-1">Discount (%)</label>
            <input
              id="discount"
              name="discount"
              type="number"
                 min="0"
              value={product.discount}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="category-inputs">
          <label htmlFor="categories" className="block mb-1">Categories (comma-separated)</label>
          <input
            id="categories"
            name="categories"
            value={product.categories}
            onChange={handleCategoryChange}
            required
           
          />
        </div>

        <div className="file-upload-container">
          <label htmlFor="cardImages" className="block mb-1">Card Images (2 required)</label>
          <input
            id="cardImages"
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleImageUpload(e)}
            required
            className="w-full p-2 border rounded"
          />
               <div className="product-upload-image-preview">
        {product.cardImages?.map((url, index) => (
          <div key={index} className="product-upload-image-item">
          <URLMedia src={url} />
            <button className="image-remove-button" onClick={() => handleRemoveImage(url)}>
              Remove
            </button>
          </div>
        ))}
      </div> 
        </div>
    
        <div className="height-checkmark-container">
          <input
            id="isHeightBased"
            type="checkbox"
            checked={isHeightBased}
            onChange={(e) => setIsHeightBased(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="isHeightBased">Height-based classification</label>
        </div>

        {isHeightBased ? (
          <div className="space-y-4">
            <div className="height-input">
              <label htmlFor="height" className="block mb-1">Height (cm)</label>
              <input
                id="height"
                name="height"
                type="number"
                value={product.height}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
           

            {['above', 'below'].map((heightType) => (
              <div key={heightType}>
                <h3 className="font-semibold">{heightType === 'above' ? 'Above' : 'Below'} Height</h3>
                <div className="height-based-color-input">
                  <input
                    type="text"
                    placeholder="Color name"
                    value={newColor.name}
                    onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                    className="p-2 border rounded"
                  />
                  <input
                    type="color"
                    value={newColor.code}
                    onChange={(e) => setNewColor({ ...newColor, code: e.target.value })}
                    className="color-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleColorAdd(heightType)}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                  >
                    Add Color
                  </button>
                </div>
                {product[`${heightType}Height`].colorOptions.map((color) => (
                  <div key={color.name} className="mt-2">
                    <div className="flex items-center space-x-2 ">
                      <span style={{ color: color.code }} className="w-6 h-6 rounded-full">{color.name}</span>
                    </div>
                    <div className="file-upload-container">
                      <label htmlFor='height-above'>Choose images for color</label>
                    <input
                      type="file"
                      multiple
                      id='height-above'
                      accept="image/*,video/*"
                      onChange={(e) => handleImageUpload(e, color.name, heightType)}
                      className="mt-1 w-full p-2 border rounded"
                    />
     <div className="product-upload-image-preview">
        {color.images?.map((url, index) => (
          <div key={index} className="product-upload-image-item">
          <URLMedia src={url} />
            <button className="image-remove-button" onClick={() => handleRemoveImage(url, color.name, heightType)}>
              Remove
            </button>
          </div>
        ))}
      </div>
                    </div>
                    
                  
                    <div className="size-quantity">
                    {sizeOptions.map((size) => (
                      <div key={size}>
                        <label className="w-10">{size}</label>
                        <input
                          type="number"
                          value={product[`${heightType}Height`].quantities[color.name]?.[size] || ''}
                          onChange={(e) => handleQuantityChange(color.name, size, e.target.value, heightType)}
                          className="w-20 p-1 border rounded"
                        />
                      </div>
                    ))}
                    </div>
                  
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="">
              <h3 className="font-semibold">Colors</h3>
              <div className="normal-color-input">
                <input
                  type="text"
                  placeholder="Color name"
                  value={newColor.name}
                  onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                  className="p-2 border rounded"
                />
                <input
                  type="color"
                  value={newColor.code}
                  onChange={(e) => setNewColor({ ...newColor, code: e.target.value })}
                  className="color-input"
                />
                <button
                  type="button"
                  onClick={() => handleColorAdd()}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Add Color
                </button>
              </div>
              {product.colorOptions.map(color => (
                <div key={color.name}>
                  <h4 className="flex items-center space-x-2"><span style={{ color: color.code }} className="w-6 h-6 rounded-full">{color.name}</span></h4>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => handleImageUpload(e, color.name)}
                    className="mt-1 w-full p-2 border rounded"
                  />
                       <div className="product-upload-image-preview">
        {color.images?.map((url, index) => (
          <div key={index} className="product-upload-image-item">
          <URLMedia src={url} />
            <button className="image-remove-button" onClick={() => handleRemoveImage(url, color.name)}>
              Remove
            </button>
          </div>
        ))}
      </div>
                  <div className="size-quantity">
                  {sizeOptions.map(size => (
                    
                    <div key={size}> 
                      <label>{size}</label>
                      <input
                        type="number"
                        value={product.quantities[color.name]?.[size] || ''}
                        onChange={(e) => handleQuantityChange(color.name, size, e.target.value)}
                      />
                    </div>
                  ))}
                  </div>
                
                </div>
              ))}
            </div>
          </div>
        )}
        <button type="submit" className="product-submit-button">Add Product</button>
      </form>
    </div>
  );
};

export default AddProducts;
