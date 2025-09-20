import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Ingredients({ cartItems = [], onUpdateCart }) {
  const [products, setProducts] = useState([]); // <-- Add this
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showModal, setShowModal] = useState(false);

useEffect(() => {
  axios.get('http://localhost:5000/ingredients')
    .then(res => {
      if (Array.isArray(res.data)) {
        // Normalize backend fields to frontend fields
        const normalized = res.data.map(product => ({
          id: product.product_id,
          name: product.product_name,
          price: product.product_price ?? 0,
          count: product.product_totalstock ?? 0,
          sold: product.product_totalsold ?? 0,
          image: product.image ?? "https://via.placeholder.com/150",
          description: product.product_description ?? "",
          variants: [
            {
              id: product.product_id,
              size: product.product_variant ?? "Default",
              price: product.product_price ?? 0,
              count: product.product_totalstock ?? 0,
            }
          ]
        }));
        setProducts(normalized);
        setDisplayedProducts(normalized.slice(0, 6));
      }
    })
    .catch(err => {
      console.error('Failed to load ingredients:', err);
    });
}, []);

  const loadMoreProducts = () => {
    const currentCount = displayedProducts.length;
    const nextProducts = products.slice(currentCount, currentCount + 3);
    setDisplayedProducts([...displayedProducts, ...nextProducts]);
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setSelectedVariant(product.variants[0]); // Set default variant
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setSelectedVariant(null);
  };

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
  };

  const addToCart = (product, variant = null) => {
    const productToAdd = variant ? 
      { ...product, selectedVariant: variant, price: variant.price, count: variant.count, displayName: `${product.name} (${variant.size})` } :
      product;
    
    const existingItem = cartItems.find(item => 
      item.id === product.id && 
      (variant ? item.selectedVariant?.id === variant.id : !item.selectedVariant)
    );
    
    // Check stock availability
    const availableStock = variant ? variant.count : product.count;
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    
    if (currentCartQuantity >= availableStock) {
      alert('Insufficient stock available');
      return;
    }
    
    let updatedCart;
    if (existingItem) {
      updatedCart = cartItems.map(item => 
        (item.id === product.id && 
         (variant ? item.selectedVariant?.id === variant.id : !item.selectedVariant))
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [...cartItems, { ...productToAdd, quantity: 1 }];
    }
    
    // Use the parent's update function
    if (onUpdateCart) {
      onUpdateCart(updatedCart);
    }
    
    const itemName = variant ? `${product.name} (${variant.size})` : product.name;
    alert(`${itemName} added to cart!`);
  };

  const hasMoreProducts = displayedProducts.length < products.length;

  // Show message if no products available
  if (products.length === 0) {
    return (
      <div className="container-fluid py-4 px-4" style={{backgroundColor: '#f8f9fa'}}>
        <div className="row">
          <div className="col-12 text-center py-5">
            <div className="card border-0 shadow-sm">
              <div className="card-body py-5">
                <i className="fas fa-box-open display-1 text-muted mb-4"></i>
                <h2>No Ingredients Available</h2>
                <p className="text-muted">Check back later for new products.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-4" style={{backgroundColor: '#f8f9fa'}}>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="mb-3">
            Ingredients 
            {cartItems.length > 0 && (
              <span className="badge bg-primary ms-2">{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
            )}
          </h2>
          <div className="d-flex justify-content-between align-items-center">
            <p className="text-muted mb-0">{displayedProducts.length} of {products.length} products shown</p>
            <div className="d-flex gap-2">
              <select className="form-select form-select-sm" style={{width: 'auto'}}>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="row g-4">
        {displayedProducts.map((product) => (
          <div key={product.id} className="col-6 col-sm-4 col-md-3 col-lg-2">
            <div className="card h-100 shadow-sm product-card" style={{cursor: 'pointer', transition: 'transform 0.2s'}}
                 onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                 onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                 onClick={() => openProductModal(product)}>
              
              {/* Product Image */}
              <div className="position-relative">
                <img 
                  src={product.image} 
                  className="card-img-top" 
                  alt={product.name}
                  style={{height: '180px', objectFit: 'cover'}}
                />
                {product.count <= 10 && (
                  <span className="position-absolute top-0 end-0 badge bg-warning">
                    Low Stock
                  </span>
                )}
              </div>

              <div className="card-body p-2">
                {/* Product Name */}
                <h6 className="card-title text-truncate mb-2" style={{fontSize: '0.85rem'}}>
                  {product.name}
                </h6>

                {/* Price */}
                <div className="mb-2">
                  <span className="text-primary fw-bold">₱{product.price.toLocaleString()}</span>
                </div>

                {/* Sold Count */}
                <small className="text-muted d-block mb-2">{product.sold} sold</small>

                {/* Available Count */}
                <small className="text-muted d-block mb-2">{product.count} available</small>

                {/* Action Buttons */}
                <div className="d-grid gap-1">
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    disabled={product.count === 0}
                  >
                    <i className="fas fa-shopping-cart me-1"></i>
                    {product.count === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMoreProducts && (
        <div className="row mt-4">
          <div className="col-12 text-center">
            <button 
              className="btn btn-outline-secondary btn-lg px-5"
              onClick={loadMoreProducts}
            >
              <i className="fas fa-plus-circle me-2"></i>Load More Products ({products.length - displayedProducts.length} remaining)
            </button>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showModal && selectedProduct && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedProduct.name}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <img 
                      src={selectedProduct.image} 
                      className="img-fluid rounded mb-3" 
                      alt={selectedProduct.name}
                    />
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <h4 className="text-primary">₱{selectedVariant.price.toLocaleString()}</h4>
                    </div>

                    {/* Variant Selection */}
                    <div className="mb-3">
                      <h6>Size Options</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {selectedProduct.variants.map((variant) => (
                          <button
                            key={variant.id}
                            className={`btn btn-sm ${selectedVariant.id === variant.id ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => handleVariantChange(variant)}
                            disabled={variant.count === 0}
                          >
                            <div className="text-center">
                              <div className="fw-bold">{variant.size}</div>
                              <small>₱{variant.price.toLocaleString()}</small>
                              {variant.count === 0 && <small className="text-danger d-block">Out of Stock</small>}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-muted mb-2">
                        <i className="fas fa-check-circle text-success me-2"></i>{selectedProduct.sold} sold
                      </p>
                      <p className="text-muted">
                        <i className="fas fa-box text-primary me-2"></i>{selectedVariant.count} available
                      </p>
                    </div>

                    <div className="mb-3">
                      <h6>Description</h6>
                      <p>{selectedProduct.description}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeModal}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    addToCart(selectedProduct, selectedVariant);
                    closeModal();
                  }}
                  disabled={selectedVariant.count === 0}
                >
                  <i className="fas fa-shopping-cart me-2"></i>
                  {selectedVariant.count === 0 ? 'Out of Stock' : `Add ${selectedVariant.size} to Cart - ₱${selectedVariant.price.toLocaleString()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ingredients;