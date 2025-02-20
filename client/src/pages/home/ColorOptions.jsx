import React, { useState, useEffect } from "react";

const ColorOptions = ({ data, selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize, }) => {
  const {
    colorOptions = [],
    quantities = {},
  
    price,
    discount,
    gst,
   
  } = data;

  
   const [availableSizes, setAvailableSizes] = useState([]);

  
  useEffect(() => {
    if (colorOptions.length > 0) {
      setSelectedColor(colorOptions[0].name);
    }
  }, [colorOptions]);

  // Update available sizes when the selected color changes
  useEffect(() => {
    if (selectedColor && quantities[selectedColor]) {
      setAvailableSizes(Object.keys(quantities[selectedColor]));
      setSelectedSize(null); // Reset size selection when color changes
    } else {
      setAvailableSizes([]);
    }
  }, [selectedColor, quantities]);

  // Function to handle color selection
  const handleColorChange = (color) => {
    setSelectedColor(color);
    setSelectedSize(null);
  };

  // Function to handle size selection
  const handleSizeChange = (size) => {
    setSelectedSize(size);
  };

  const discountedPrice = price - (price * discount) / 100;
  const finalPrice = discountedPrice + (discountedPrice * gst) / 100;

  return (
    <>
      <p>Select Color:</p>
     
      {colorOptions.length > 0 ? (
        <div className="color-selector">
          {colorOptions.map((color) => (
            <button
              key={color.name}
              onClick={() => handleColorChange(color.name)}
              style={{
                backgroundColor: color.code,
                aspectRatio: 1 / 1,
              }}
              className={color.name === selectedColor ? "selected" : ""}
            />
          ))}
        </div>
      ) : (
        <p>No colors available</p>
      )}
      {selectedColor && (
        <>
        
          {/* <p>Select Size for: {selectedColor}</p>
          {availableSizes.length > 0 ? (
            <div className="size-selector">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  //style={{ aspectRatio: "29 / 15" }}
                  style={{
                    aspectRatio: size === "SizeFree" ? 29/12 : 29 / 17,
                    width: size === "SizeFree" ? "140%" : "auto",       
                  }}
                  onClick={() => handleSizeChange(size)}
                 // className={size === selectedSize ? "selected" : ""}
                 disabled= {data.quantities[selectedColor]?.[size]=== 0}
                 className={`${size === selectedSize ? "selected" : ""} ${
                  data.quantities[selectedColor]?.[size]=== 0
                    ? "sold-out"
                    : ""
                }`}
                >
                  {size}
                </button>
              ))}
            </div>
          ) : (
            <p>No sizes available for the selected color</p>
          )} */}
          <p>Select Size for: {selectedColor}</p>
{availableSizes.filter(size => data.quantities[selectedColor]?.[size] !== null).length > 0 ? (
  <div className="size-selector">
    {availableSizes
      .filter(size => data.quantities[selectedColor]?.[size] !== null)
      .map((size) => (
        <button
          key={size}
          style={{
            aspectRatio: size === "SizeFree" ? 29 / 12 : 29 / 17,
            width: size === "SizeFree" ? "140%" : "auto",
          }}
          onClick={() => handleSizeChange(size)}
          disabled={data.quantities[selectedColor]?.[size] === 0}
          className={`${size === selectedSize ? "selected" : ""} ${
            data.quantities[selectedColor]?.[size] === 0 ? "sold-out" : ""
          }`}
        >
          {size}
        </button>
      ))}
  </div>
) : (
  <p>No sizes available for the selected color</p>
)}

        </>
      )}
    </>
  );
};

// Example usage
export default ColorOptions;
