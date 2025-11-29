import React, { useState, useMemo } from 'react';
import useInventory from '../../../components/hooks/useInventory';

function Packaging({ cartItems = [], onUpdateCart, searchQuery = '' }) {
  const { inventory, isLoading, error } = useInventory(true);
  
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const products = useMemo(() => {
    return inventory
      .filter(item => 
        (item.status === 'In Stock' || item.status === 'active') && 
        item.stock > 0 &&
        item.category === 'packaging'
      )
      .map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        count: item.stock,
        sold: item.sold,
        image: item.image,
        description: item.description,
        variants: [
          {
            id: item.id,
            size: item.size || item.variant || "Default",
            price: item.price,
            count: item.stock,
          }
        ]
      }));
  }, [inventory]);

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }
    return products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [products, searchQuery]);

  React.useEffect(() => {
    setDisplayedProducts(filteredProducts.slice(0, 6));
  }, [filteredProducts]);

  const loadMoreProducts = () => {
    const currentCount = displayedProducts.length;
    const nextProducts = filteredProducts.slice(currentCount, currentCount + 3);
    setDisplayedProducts([...displayedProducts, ...nextProducts]);
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setSelectedVariant(product.variants[0]); 
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
    // Helper to find if item already exists
    const findCartItem = (productId, variantId) => {
      return cartItems.find(item => {
        const itemVariantId = item.selectedVariant?.id;
        return item.id === productId && 
              (variantId ? itemVariantId === variantId : !item.selectedVariant);
      });
    };

    const variantId = variant?.id;
    const existingItem = findCartItem(product.id, variantId);
    
    // Get available stock
    const availableStock = variant ? variant.count : product.count;
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    
    // Check stock availability
    if (currentCartQuantity >= availableStock) {
      alert('❌ Insufficient stock available');
      return;
    }
    
    let updatedCart;
    
    if (existingItem) {
      // Item exists - increment quantity
      updatedCart = cartItems.map(item => {
        const itemVariantId = item.selectedVariant?.id;
        if (item.id === product.id && 
            (variantId ? itemVariantId === variantId : !item.selectedVariant)) {
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      });
      
      const itemName = variant ? `${product.name} (${variant.size})` : product.name;
      alert(`✅ Quantity updated for ${itemName}!`);
      
    } else {
      // New item - add to cart
      const productToAdd = variant ? 
        { 
          ...product, 
          selectedVariant: variant, 
          price: variant.price, 
          count: variant.count, 
          displayName: `${product.name} (${variant.size})` 
        } : 
        product;
      
      updatedCart = [...cartItems, { ...productToAdd, quantity: 1 }];
      
      const itemName = variant ? `${product.name} (${variant.size})` : product.name;
      alert(`✅ ${itemName} added to cart!`);
    }
    
    if (onUpdateCart) {
      onUpdateCart(updatedCart);
    }
  };

  const hasMoreProducts = displayedProducts.length < filteredProducts.length;

  if (isLoading) {
    return (
      <div className="container py-3">
        <div className="row">
          <div className="col-12 text-center py-5">
            <div className="card border-0 shadow-sm">
              <div className="card-body py-5">
                <i className="fas fa-sync fa-spin display-1 text-primary mb-4"></i>
                <h2>Loading Packaging...</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-3">
        <div className="row">
          <div className="col-12 text-center py-5">
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Error loading packaging: {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="container py-3">
        <div className="row">
          <div className="col-12 text-center py-5">
            <div className="card border-0 shadow-sm">
              <div className="card-body py-5">
                <i className="fas fa-box display-1 text-muted mb-4"></i>
                <h2>
                  {searchQuery ? `No Packaging Found for "${searchQuery}"` : 'No Packaging Available'}
                </h2>
                <p className="text-muted">
                  {searchQuery ? 'Try a different search term' : 'Check back later for new products.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-3">
      {/* Search Query Display */}
      {searchQuery && (
        <div className="alert alert-info mb-3" role="alert">
          <i className="fas fa-search me-2"></i>
          Showing results for: <strong>"{searchQuery}"</strong>
          <span className="ms-2 text-muted">({filteredProducts.length} found)</span>
        </div>
      )}

      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="mb-3">Packaging & Containers</h2>
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
                <h6 className="card-title text-truncate mb-2" style={{fontSize: '0.85rem'}}>
                  {product.name}
                </h6>

                <div className="mb-2">
                  <span className="text-primary fw-bold">₱{product.price.toLocaleString()}</span>
                </div>

                <small className="text-muted d-block mb-2">{product.sold} sold</small>

                <small className="text-muted d-block mb-2">{product.count} available</small>

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
              <i className="fas fa-plus-circle me-2"></i>Load More Products ({filteredProducts.length - displayedProducts.length} remaining)
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

export default Packaging;