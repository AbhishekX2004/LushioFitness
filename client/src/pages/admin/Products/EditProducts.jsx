import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import Editor from './Editor';
import { IoArrowBack } from 'react-icons/io5';
import './EditProduct.css';

const EditProduct = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastProductId, setLastProductId] = useState(null);
  const [limit, setLimit] = useState(10);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchTerm.trim()) {
      // Reset pagination when search term changes
      setProducts([]);
      setLastProductId(null);
      setHasMore(true);
      
      const timer = setTimeout(() => {
        fetchSearchResults();
      }, 500); // Debounce time of 500ms

      return () => clearTimeout(timer);
    } else {
      // If search is cleared, fetch normal products
      setProducts([]);
      setLastProductId(null);
      setHasMore(true);
      setIsSearching(false);
      fetchProducts();
    }
  }, [searchTerm, limit]);

  const fetchSearchResults = async (loadMore = false) => {
    if (loading) return;

    try {
      setLoading(true);
      setIsSearching(true);

      const response = await axios.post('http://127.0.0.1:5001/lushio-fitness/us-central1/api/search/', {
        searchText: searchTerm,
        limit,
        ...(loadMore && lastProductId ? { lastProductId } : {})
      });

      setProducts(prev => loadMore ? [...prev, ...response.data.products] : response.data.products);
      setHasMore(response.data.hasMore);
      setLastProductId(response.data.lastProductId);
      setError(null);
    } catch (error) {
      console.error('Error searching products:', error);
      setError('Failed to search products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (loadMore = false) => {
    if (loading) return;

    try {
      setLoading(true);
      const url = `${process.env.REACT_APP_API_URL}/products/allProducts?limit=${limit}${lastProductId && loadMore ? `&lastDocId=${lastProductId}` : ''}`;
      
      const response = await axios.get(url);
      
      setProducts(prev => loadMore ? [...prev, ...response.data.products] : response.data.products);
      setHasMore(response.data.hasMore);
      setLastProductId(response.data.lastDocId);
      setError(null);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to fetch products. Please try again or add products first.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (isSearching) {
      fetchSearchResults(true);
    } else {
      fetchProducts(true);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/products/delete/${id}`);
        if (isSearching) {
          fetchSearchResults();
        } else {
          fetchProducts();
        }
        setError(null);
        setSelectedProduct(null);
      } catch (error) {
        console.error('Error deleting product:', error);
        setError('Failed to delete product. Please try again.');
      }
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/products/${id}`);
      setSelectedProduct(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching product details:', error);
      setError('Failed to fetch product details. Please try again.');
    }
  };

  const handleEditorClose = () => {
    setSelectedProduct(null);
  };

  const handleProductUpdate = (updatedProduct) => {
    setSelectedProduct(updatedProduct);
    if (isSearching) {
      fetchSearchResults();
    } else {
      fetchProducts();
    }
  };

  return (
    <div className="EditProduct-container">
      <h1 className="EditProduct-title">Edit Product</h1>
      
      <SwitchTransition>
        <CSSTransition
          key={selectedProduct ? 'editor' : 'list'}
          timeout={300}
          classNames="fade"
          unmountOnExit
        >
          {selectedProduct ? (
            <div className="EditProduct-editor">
              <button onClick={handleEditorClose} className="editor-close-btn">
                <IoArrowBack className="editor-close-icon" /> Go Back
              </button>
              <Editor
                product={selectedProduct}
                onClose={handleEditorClose}
                onUpdate={handleProductUpdate}
              />
            </div>
          ) : (
            <div className="EditProduct-content">
              <div className="EditProduct-controls">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="EditProduct-searchBar"
                />
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="EditProduct-limitSelect"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>

              {error && <div className="EditProduct-error">{error}</div>}
              
              <div className="EditProduct-productsList">
                {products.map(product => (
                  <div key={product.id} className="EditProduct-productCard">
                    <div className="EditProduct-productInfo">
                      <img src={product.cardImages[0]} alt={product.name} className="EditProduct-productImage" />
                      <span>{product.name}</span>
                    </div>
                    <div className="EditProduct-buttonsContainer">
                      <button
                        onClick={() => handleEdit(product.id)}
                        className="EditProduct-editButton"
                      >
                        Edit
                      </button>
                      {!product.categories.includes("my") &&
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(product.id);
                          }}
                          className="EditProduct-deleteButton"
                        >
                          Delete
                        </button>
                      }
                    </div>
                  </div>
                ))}
              </div>

              {loading && <div className="EditProduct-loading">Loading...</div>}
              
              {hasMore && !loading && (
                <button 
                  onClick={handleLoadMore}
                  className="EditProduct-loadMore"
                >
                  Load More
                </button>
              )}
            </div>
          )}
        </CSSTransition>
      </SwitchTransition>
    </div>
  );
};

export default EditProduct;