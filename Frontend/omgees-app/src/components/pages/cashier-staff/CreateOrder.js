import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';

function CreateOrder({ user, onOrderComplete }) {
  const [inventory, setInventory] = useState([]);
   const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderNotes, setOrderNotes] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [amountReceived, setAmountReceived] = useState(0);

  // Fetch inventory on component mount
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

  const handlePayment = async (orderData) => {
  try {
    const response = await fetch('http://localhost:5000/add-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    const result = await response.json();
    if (result.success) {
      // Payment/order recorded successfully
      // You can show a success message or redirect here
    } else {
      // Handle error
    }
  } catch (error) {
    // Handle network or server error
  }
};
 

  // Convert inventory to usable products for cashier
  const availableProducts = useMemo(() => {
  return inventory
    .filter(item => 
      (item.status === 'In Stock' || item.status === 'active') && item.stock > 0
    )
    .map(item => ({
      id: item.id,
      baseProductId: item.baseProductId,
      name: item.name,
      displayName: `${item.name} (${item.size})`,
      price: item.price,
      stock: item.stock,
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

  const getChange = () => {
  return amountReceived - getTotal();
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

    // For cash payments, validate sufficient amount
    if (paymentMethod === 'cash' && getChange() < 0) {
      alert('Insufficient amount received from customer');
      return;
    }

    const newOrder = {
      orderId: `ORD-${Date.now()}`,
      orderType: 'in-store',
      createdBy: user?.email || 'cashier@store.com',
      cashierName: user?.name || 'Store Cashier',
      timestamp: new Date().toISOString(),
      customer: {
        name: 'Walk-in Customer', // Keep this generic
        phone: '',
        email: ''
      },
      items: cartItems,
      payment: {
        method: paymentMethod,
        status: 'completed',
        amountReceived: paymentMethod === 'cash' ? amountReceived : getTotal(),
        change: paymentMethod === 'cash' ? getChange() : 0
      },
      total: getTotal(),
      status: 'completed',
      notes: orderNotes
    };

    axios.post('http://localhost:5000/add-order', newOrder)
  .then(response => {
    if (response.data.success) {
      // For each item in the order, update stock and sold
      cartItems.forEach(item => {
  axios.post('http://localhost:5000/update-stock', {
    product_id: item.id,
    updated_data: {
      product_name: item.name,
      product_category: item.category,
      product_variant: item.size,
      product_totalstock: item.stock - item.quantity,
      product_price: item.price,
      product_description: item.description || "",
      product_supplier: item.supplier || "",
      product_totalsold: (item.sold || 0) + item.quantity
    }
  });
});
      // Optionally show a success message or do something else
      console.log('Order/payment recorded in database');
    } else {
      // Optionally show an error message
      console.error('Order/payment failed to record in database');
    }
  })
  .catch(error => {
    // Handle network/server error
    console.error('Network/server error:', error);
  });
    

    // Pass the order to parent component
    if (onOrderComplete) {
      onOrderComplete(newOrder);
    }

    console.log('In-Store Order Created:', newOrder);
    alert(`Order completed successfully! ${paymentMethod === 'cash' ? `Change: ₱${getChange().toLocaleString()}` : ''}`);
    
    // Handle payment recording
    handlePayment(user?.id, getTotal());

    // Reset form
    setCartItems([]);
    setPaymentMethod('cash');
    setAmountReceived(0);
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
                  <div className="card-header bg-primary text-white py-2">
                    <h5 className="mb-0">
                      <i className="fas fa-user me-2"></i>Product Transaction
                    </h5>
                  </div>
                  <div className="card-body p-3">
                    <h6 className="mb-3">
                      <i className="fas fa-shopping-cart me-2"></i>Items
                      <span className="badge bg-primary ms-2">{cartItems.length}</span>
                    </h6>

                    <div className="mb-3" style={{maxHeight: '200px', overflowY: 'auto'}}>
                      {cartItems.length === 0 ? (
                        <div className="text-center py-3">
                          <i className="fas fa-shopping-cart display-6 text-muted mb-2"></i>
                          <p className="text-muted small">No items in list</p>
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
                        <option value="gcash">GCash</option>
                        <option value="card">Bank Transfer</option>
                      </select>
                    </div>
                    {/* Payment Calculation Section */}
                    <div className="border-top pt-3">
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="small fw-semibold">Total Amount:</span>
                          <span className="small fw-bold text-primary">₱{getTotal().toLocaleString()}</span>
                        </div>
                        
                        {paymentMethod === 'cash' && (
                          <>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <label className="small fw-semibold mb-0">Amount Received:</label>
                              <input 
                                type="number" 
                                className="form-control form-control-sm"
                                placeholder="0.00"
                                value={amountReceived}
                                onChange={(e) => setAmountReceived(Number(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                style={{ width: '120px' }}
                              />
                              <span className="small fw-semibold">Change:</span>
                              <span className={`small fw-bold ${getChange() < 0 ? 'text-danger' : 'text-primary'}`}>
                                ₱{getChange().toLocaleString()}
                              </span>
                            </div>
                            {getChange() < 0 && (
                              <small className="text-danger">
                                <i className="fas fa-exclamation-triangle me-1"></i>
                                Insufficient amount received
                              </small>
                            )}
                          </>
                        )}
                      </div>
                      <button 
                        className="btn btn-primary w-100"
                        onClick={handleSubmit}
                        disabled={cartItems.length === 0 || (paymentMethod === 'cash' && getChange() < 0)}
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