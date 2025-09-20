import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';

function CreateOrder({ user, onOrderComplete }) {
  const [inventory, setInventory] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    axios.get('http://localhost:5000/inventory')
      .then(res => {
        if (Array.isArray(res.data)) {
          // Normalize fields for frontend use
          const normalized = res.data.map(product => ({
            id: product.product_id ?? product.id,
            baseProductId: product.baseProductId ?? product.id ?? 0,
            name: product.product_name ?? product.name ?? "",
            displayName: `${product.product_name ?? product.name ?? ""} (${product.product_variant ?? product.size ?? ""})`,
            price: product.product_price ?? product.price ?? 0,
            stock: product.product_totalstock ?? product.stock ?? 0,
            size: product.product_variant ?? product.size ?? "",
            category: product.product_category ?? product.category ?? "",
            image: product.image ?? "https://via.placeholder.com/150",
            status: product.product_status ?? product.status ?? "In Stock"
          }));
          setInventory(normalized);
        }
      })
      .catch(err => {
        console.error('Failed to load inventory:', err);
      });
  }, []);
  
  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderNotes, setOrderNotes] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Convert inventory to usable products for cashier
  const availableProducts = useMemo(() => {
  return inventory
    .filter(item => item.status === 'In Stock' && item.stock > 0)
    .map(item => ({
  id: item.id,
  baseProductId: item.baseProductId,
  name: item.name,
  displayName: `${item.name} (${item.size})`,
  price: item.price ?? item.product_price ?? 0,
  stock: item.stock ?? item.product_totalstock ?? 0,
  size: item.size,
  category: item.category,
  image: item.image
}));
}, [inventory]);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (categoryFilter === 'all') return availableProducts;
    return availableProducts.filter(product => product.category === categoryFilter);
  }, [availableProducts, categoryFilter]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(availableProducts.map(p => p.category))];
    return cats;
  }, [availableProducts]);

  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCartItems(cartItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        alert('Insufficient stock available');
      }
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, change) => {
    const product = availableProducts.find(p => p.id === productId);
    setCartItems(cartItems.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) return null;
        if (newQuantity > product.stock) {
          alert('Insufficient stock available');
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      alert('Please add items to cart');
      return;
    }

    if (!customerInfo.name) {
      alert('Please enter customer name');
      return;
    }

    const newOrder = {
      orderId: `ORD-${Date.now()}`,
      orderType: 'in-store',
      createdBy: user?.email || 'cashier@store.com',
      cashierName: user?.name || 'Store Cashier',
      timestamp: new Date().toISOString(),
      customer: customerInfo,
      items: cartItems,
      payment: {
        method: paymentMethod,
        status: 'completed'
      },
      total: getTotal(),
      status: 'completed',
      notes: orderNotes
    };

    // Pass the order to parent component
    if (onOrderComplete) {
      onOrderComplete(newOrder);
    }

    console.log('In-Store Order Created:', newOrder);
    alert('Order completed successfully!');
    
    // Reset
    setCustomerInfo({ name: '', phone: '', email: '' });
    setCartItems([]);
    setPaymentMethod('cash');
    setOrderNotes('');
  };

  // Show if no products available
  if (availableProducts.length === 0) {
    return (
      <div className="container-fluid bg-light min-vh-100">
        <div className="container py-4">
          <div className="row">
            <div className="col-12 text-center py-5">
              <div className="card border-0 shadow-sm">
                <div className="card-body py-5">
                  <i className="fas fa-box-open display-1 text-muted mb-4"></i>
                  <h2>No Products Available</h2>
                  <p className="text-muted">No products are currently in stock or available for sale.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid bg-light min-vh-100">
      <div className="container py-4">
        <div className="row">
          <div className="col-12">
            <div className="row">
              {/* Product Selection */}
              <div className="col-lg-8 col-md-7 mb-3">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header bg-primary text-white py-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">
                        <i className="fas fa-box me-2"></i>Product Selection
                      </h5>
                      <div className="d-flex gap-2">
                        <select 
                          className="form-select form-select-sm"
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          style={{width: 'auto'}}
                        >
                          <option value="all">All Categories</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="card-body p-3">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-4">
                        <i className="fas fa-search display-4 text-muted mb-3"></i>
                        <p className="text-muted">No products found in this category.</p>
                      </div>
                    ) : (
                      <div className="row g-3">
                        {filteredProducts.map(product => (
                          <div key={product.id} className="col-md-4 col-sm-6">
                            <div className="card h-100 shadow-sm product-card" style={{transition: 'transform 0.2s'}}
                                 onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                 onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                              <div className="position-relative">
                                <img 
                                  src={product.image} 
                                  className="card-img-top" 
                                  alt={product.name}
                                  style={{height: '120px', objectFit: 'cover'}}
                                />
                                {product.stock <= 5 && (
                                  <span className="position-absolute top-0 end-0 badge bg-warning">
                                    Low Stock
                                  </span>
                                )}
                              </div>
                              <div className="card-body p-2">
                                <h6 className="card-title text-truncate mb-2" style={{fontSize: '0.9rem'}}>
                                  {product.displayName}
                                </h6>
                                <div className="mb-2">
                                  <span className="text-primary fw-bold">₱{product.price.toLocaleString()}</span>
                                </div>
                                <small className="text-muted d-block mb-2">Stock: {product.stock}</small>
                                <div className="d-grid">
                                  <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={() => addToCart(product)}
                                    disabled={product.stock === 0}
                                  >
                                    <i className="fas fa-plus me-1"></i>Add to Cart
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Information & Order Details */}
              <div className="col-lg-4 col-md-5 mb-3">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header bg-success text-white py-2">
                    <h5 className="mb-0">
                      <i className="fas fa-user me-2"></i>Customer Information
                    </h5>
                  </div>
                  <div className="card-body p-3">
                    <div className="mb-3">
                      <label className="form-label">Customer Name *</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        placeholder="Enter customer name"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Phone Number</label>
                      <input 
                        type="tel" 
                        className="form-control form-control-sm" 
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input 
                        type="email" 
                        className="form-control form-control-sm" 
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                        placeholder="Optional"
                      />
                    </div>

                    <hr />

                    <h6 className="mb-3">
                      <i className="fas fa-shopping-cart me-2"></i>Cart Items
                      <span className="badge bg-primary ms-2">{cartItems.length}</span>
                    </h6>

                    <div className="mb-3" style={{maxHeight: '200px', overflowY: 'auto'}}>
                      {cartItems.length === 0 ? (
                        <div className="text-center py-3">
                          <i className="fas fa-shopping-cart display-6 text-muted mb-2"></i>
                          <p className="text-muted small">No items in cart</p>
                        </div>
                      ) : (
                        cartItems.map(item => (
                          <div key={item.id} className="d-flex align-items-center border-bottom py-2">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="rounded me-2" 
                              style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                            />
                            <div className="flex-grow-1">
                              <div className="small fw-bold">{item.displayName}</div>
                              <div className="small text-muted">₱{item.price.toLocaleString()}</div>
                            </div>
                            <div className="d-flex align-items-center">
                              <button 
                                className="btn btn-sm btn-outline-secondary me-1"
                                onClick={() => updateQuantity(item.id, -1)}
                                style={{ width: '25px', height: '25px', padding: '0', fontSize: '0.7rem' }}
                              >
                                <i className="fas fa-minus"></i>
                              </button>
                              <span className="mx-1 small">{item.quantity}</span>
                              <button 
                                className="btn btn-sm btn-outline-secondary me-1"
                                onClick={() => updateQuantity(item.id, 1)}
                                style={{ width: '25px', height: '25px', padding: '0', fontSize: '0.7rem' }}
                              >
                                <i className="fas fa-plus"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeFromCart(item.id)}
                                style={{ width: '25px', height: '25px', padding: '0', fontSize: '0.7rem' }}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <hr />

                    <div className="mb-3">
                      <label className="form-label">Payment Method</label>
                      <select 
                        className="form-control form-control-sm"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Credit/Debit Card</option>
                        <option value="gcash">GCash</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Order Notes</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Optional notes"
                      />
                    </div>

                    <div className="border-top pt-3">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Total:</h5>
                        <h4 className="mb-0 text-primary">₱{getTotal().toLocaleString()}</h4>
                      </div>
                      
                      <button 
                        className="btn btn-success w-100"
                        onClick={handleSubmit}
                        disabled={cartItems.length === 0 || !customerInfo.name}
                      >
                        <i className="fas fa-check me-2"></i>Complete Order
                      </button>
                    </div>
                  </div>
                  <div className="card-footer text-muted text-center bg-light border-0 py-2">
                    <small>Order processed by {user?.name || 'Cashier'}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateOrder;