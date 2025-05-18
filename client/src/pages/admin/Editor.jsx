import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { storage } from "../../firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import URLMedia from "../../components/URLMediaRenderer";
const Editor = ({ product: initialProduct,onClose}) => {
  const [product, setProduct] = useState(null);
  const [newColor, setNewColor] = useState({ name: '', code: '#43da86' });
  const [hasHeight, setHasHeight] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const sizeOptions = ['XXXS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'SizeFree'];
  
  useEffect(() => {
    if (initialProduct) {
      // Initialize the product state with the provided data
      const formattedProduct = {
        ...initialProduct,
        description: initialProduct.description
          ? (typeof initialProduct.description === 'string'
            ? {
              productDetails: initialProduct.description,
              sizeFit: '',
              MaterialCare: ''
            }
            : initialProduct.description)
          : { productDetails: '', sizeFit: '', MaterialCare: '' },
        ...(initialProduct.height ? {
          aboveHeight: initialProduct.aboveHeight || { colorOptions: [], quantities: {} },
          belowHeight: initialProduct.belowHeight || { colorOptions: [], quantities: {} }
        } : {}),
        colorOptions: initialProduct.colorOptions || [],
        quantities: initialProduct.quantities || {},
        cardImages: initialProduct.cardImages || [],
        soldOut: initialProduct.soldOut || false,
        toDisplay: initialProduct.toDisplay || false,
      };
      setProduct(formattedProduct);
      setHasHeight(!!initialProduct.height);
    }
  }, [initialProduct]);
  
  if (!product) {
    return <div className="text-center p-4">Loading...</div>;
  }
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (['productDetails', 'sizeFit', 'MaterialCare'].includes(name)) {
      setProduct(prev => ({
        ...prev,
        description: {
          ...prev.description,
          [name]: value
        }
      }));
    } else {
      // Handle other inputs as before
      setProduct(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleBooleanChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value === 'true' }));
  };

  const handleCategoryChange = (e) => {
    const categoriesArray = e.target.value.split(',').map(cat => cat.trim());
    setProduct(prev => ({ ...prev, categories: categoriesArray }));
  };

  const handleColorAdd = (type = 'normal') => {
    if (newColor.name && newColor.code) {
      const newColorWithImages = { ...newColor, images: [] };

      setProduct(prev => {
        if (type === 'above') {
          return {
            ...prev,
            aboveHeight: {
              ...prev.aboveHeight,
              colorOptions: [...prev.aboveHeight.colorOptions, newColorWithImages]
            }
          };
        } else if (type === 'below') {
          return {
            ...prev,
            belowHeight: {
              ...prev.belowHeight,
              colorOptions: [...prev.belowHeight.colorOptions, newColorWithImages]
            }
          };
        } else {
          return {
            ...prev,
            colorOptions: [...prev.colorOptions, newColorWithImages]
          };
        }
      });
      setNewColor({ name: '', code: '#43da86' });
    }
  };

  const handleQuantityChange = (color, size, value, type = 'normal') => {
    const parsedValue = value === '' ? '' : parseInt(value);

    setProduct(prev => {
      if (type === 'above' || type === 'below') {
        const heightSection = `${type}Height`;
        return {
          ...prev,
          [heightSection]: {
            ...prev[heightSection],
            quantities: {
              ...prev[heightSection].quantities,
              [color]: {
                ...prev[heightSection].quantities[color],
                [size]: parsedValue
              }
            }
          }
        };
      } else {
        return {
          ...prev,
          quantities: {
            ...prev.quantities,
            [color]: {
              ...prev.quantities[color],
              [size]: parsedValue
            }
          }
        };
      }
    });
  };

  const handleImageUpload = async (e, colorName = null, heightType = null) => {
    setIsUploading(true);
    const files = Array.from(e.target.files);

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
              images: [...(updatedColorOptions[colorIndex].images || []), ...validUrls]
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
              images: [...(updatedColorOptions[colorIndex].images || []), ...validUrls]
            };

            return {
              ...prev,
              colorOptions: updatedColorOptions
            };
          }
        } else {
          return {
            ...prev,
            cardImages: [...(prev.cardImages || []), ...validUrls]
          };
        }
        return prev;
      });
    } catch (error) {
      console.error('Error handling image uploads:', error);
    }
    finally{
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (imageUrl, colorName = null, heightType = null) => {
    setIsUploading(true);
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
    setIsUploading(false);
  };
  
  const handleColorRemove = (colorName, type = 'normal') => {
    setProduct(prev => {
      if (type === 'above' || type === 'below') {
        const heightSection = `${type}Height`;
        return {
          ...prev,
          [heightSection]: {
            ...prev[heightSection],
            colorOptions: prev[heightSection].colorOptions.filter(color => color.name !== colorName),
            quantities: Object.fromEntries(
              Object.entries(prev[heightSection].quantities || {}).filter(([key]) => key !== colorName)
            )
          }
        };
      } else {
        return {
          ...prev,
          colorOptions: prev.colorOptions.filter(color => color.name !== colorName),
          quantities: Object.fromEntries(
            Object.entries(prev.quantities || {}).filter(([key]) => key !== colorName)
          )
        };
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      // Ensure required fields are set for non-height-based products
      const updatedProduct = { ...product };
  
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/products/update/${product.id}`,
        updatedProduct
      );
      
      console.log('Product updated:', response.data);
      alert("Updated successfully");
      window.location.reload();
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      alert("Update failed");
    }
    finally{
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <button className="save-update-change" //    type="submit"
          onClick={()=>handleSubmit()}
            disabled={isUploading}>Save changes</button>
      <div  className="add-product-form">
        <div className='boolean-fields'>

        <div className="radio-group">
          <label className="block mb-1">Sold Out</label>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="soldOut"
                value="true"
                checked={product.soldOut === true}
                onChange={handleBooleanChange}
                className="form-radio"
              />
              <span className="ml-2">Yes</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="soldOut"
                value="false"
                checked={product.soldOut === false}
                onChange={handleBooleanChange}
                className="form-radio"
              />
              <span className="ml-2">No</span>
            </label>
          </div>
        </div>
          {/* To Display Radio Buttons */}
          <div className="radio-group">
          <label className="block mb-1">Display Product</label>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="toDisplay"
                value="true"
                checked={product.toDisplay === true}
                onChange={handleBooleanChange}
                className="form-radio"
              />
              <span className="ml-2">Yes</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="toDisplay"
                value="false"
                checked={product.toDisplay === false}
                onChange={handleBooleanChange}
                className="form-radio"
              />
              <span className="ml-2">No</span>
            </label>
          </div>
        </div>
        </div>
    
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
          <label htmlFor="description" >Description</label>
          <div className='description-values'>
            <div className='description-value'>
            <label className="block mb-2 font-medium">Product Details</label>
          <textarea
            name="productDetails"
            value={product.description.productDetails}
            onChange={handleInputChange}
            className="w-full p-2 border rounded mb-4"
            placeholder="Enter product details"
            rows="4"
          />
            </div>
            <div className='description-value'>
            <label className="block mb-2 font-medium">Size & Fit</label>
          <textarea
            name="sizeFit"
            value={product.description.sizeFit}
            onChange={handleInputChange}
            className="w-full p-2 border rounded mb-4"
            placeholder="Enter size and fit information"
            rows="4"
          />

              </div>
              <div className='description-value'>
              <label className="block mb-2 font-medium">Material & Care</label>
          <textarea
            name="MaterialCare"
            value={product.description.MaterialCare}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            placeholder="Enter material and care instructions"
            rows="4"
          />
              </div>
       

         

          </div>
        
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
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="discountedPrice" className="block mb-1">Discounted Price</label>
            <input
              id="discountedPrice"
              name="discountedPrice"
              type="number"
              value={product.discountedPrice}
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
            value={Array.isArray(product.categories) ? product.categories.join(', ') : product.categories}
            onChange={handleCategoryChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

      

      

        <div className="file-upload-container">
          <label htmlFor="cardImages" className="block mb-1">Card Images</label>
          <input
            id="cardImages"
            type="file"
            multiple
            accept="image/*, video/*"
            onChange={(e) => handleImageUpload(e)}
            className="w-full p-2 border rounded"
          />
          <div className="product-upload-image-preview">
            {product.cardImages?.map((url, index) => (
              <div key={index} className="product-upload-image-item">
                <URLMedia src={url} className="media-preview" />
                <button className="image-remove-button" onClick={() => handleRemoveImage(url)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {hasHeight ? (
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
              <div key={heightType} className="border p-4 rounded">
                <h3 className="font-semibold mb-2">{heightType === 'above' ? 'Above' : 'Below'} Height</h3>
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
                  <div key={color.name} className='color-based-media-size'>
                    <div  className='color-delete-button'>
                      <span className="font-medium" style={{ color: color.code }}>{color.name}{", "}{color.code}</span>
                      <button 
                        onClick={() => handleColorRemove(color.name, heightType)}
                        className="text-red-500 hover:text-red-700"
                        title="Remove Color"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="file-upload-container">
                    <label  htmlFor={`height-${heightType}-${color.name}`}>Choose images for color</label>
                    <input
                      type="file"
                      id={`height-${heightType}-${color.name}`}
                      multiple
                      accept="image/*,video/*"
                      onChange={(e) => handleImageUpload(e, color.name, heightType)}
                      className="mt-2 w-full p-2 border rounded"
                    />

                    <div className="product-upload-image-preview">
                      {color.images?.map((url, index) => (
                        <div key={index} className="product-upload-image-item">
                        <URLMedia src={url} className="media-preview" />
                          <button className="image-remove-button" onClick={() => handleRemoveImage(url, color.name, heightType)}>
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                    <div className="size-quantity">
                      {sizeOptions.map((size) => (
                        <div key={size} className="space-y-1">
                          <label className="text-sm font-medium">{size}</label>
                          <input
                            type="number"
                            min="0"
                            value={product[`${heightType}Height`].quantities[color.name]?.[size] === undefined ? '' : product[`${heightType}Height`].quantities[color.name]?.[size]}
                            onChange={(e) => handleQuantityChange(color.name, size, e.target.value, heightType)}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )).reverse()}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
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
            {product.colorOptions.map((color) => (
              <div key={color.name} className='color-based-media-size'>
                <div  className='color-delete-button'>
                  <span className="font-medium" style={{ color: color.code }}>{color.name}{", "}{color.code}</span>
                  <button 
                    onClick={() => handleColorRemove(color.name)}
                    className="text-red-500 hover:text-red-700"
                    title="Remove Color"
                  >
                    ✕
                  </button>
                </div>
                <div className="file-upload-container">
                <label  htmlFor={`file-upload-${color.name}`}>Choose Media</label>
                <input
                  type="file"
                  id={`file-upload-${color.name}`}
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => handleImageUpload(e, color.name)}
                  className="mt-2 w-full p-2 border rounded"
                />
             
                <div className="product-upload-image-preview">
        {color.images?.map((url, index) => (
          <div key={index} className="product-upload-image-item">
          <URLMedia src={url} className="media-preview" />
            <button className="image-remove-button" onClick={() => handleRemoveImage(url, color.name)}>
              Remove
            </button>
          </div>
        ))}
      </div>
      </div>
                <div className="size-quantity">
                  {sizeOptions.map((size) => (
                    <div key={size} className="space-y-1">
                      <label className="text-sm font-medium">{size}</label>
                      <input
                        type="number"
                        min="0"
                        value={product.quantities[color.name]?.[size] === undefined ? '' : product.quantities[color.name]?.[size]}
                        onChange={(e) => handleQuantityChange(color.name, size, e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )).reverse()}
          </div>
        )}

        <div className="editor-btn-container">
          <button
            type="button"
            onClick={()=>onClose()}
          
          >
            Cancel
          </button>
          <button
        //    type="submit"
          onClick={()=>handleSubmit()}
            disabled={isUploading}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Editor;
