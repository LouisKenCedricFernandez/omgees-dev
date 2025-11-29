import React, { useState, useMemo} from 'react';
import axios from 'axios';
import useInventory from '../../../components/hooks/useInventory';

function CreateOrder({ user, onOrderComplete }) {
  const {inventory, isLoading, error, refreshInventory} = useInventory(true);
  const [cartItems, setCartItems] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Convert inventory to usable products for cashier
  const availableProducts = useMemo(() => {
    return inventory
      .filter(item => {
        const totalStock = item.stock || item.product_totalstock || 0;
        const reservedStock = item.product_reservedstock || 0;
        const availableStock = item.available_stock || (totalStock - reservedStock);
        return (item.status === 'In Stock' || item.status === 'active') && availableStock > 0;
      })
      .map(item => {
        const totalStock = item.stock || item.product_totalstock || 0;
        const reservedStock = item.product_reservedstock || 0;
        const availableStock = item.available_stock || (totalStock - reservedStock);
        
        return {
          id: item.id,
          baseProductId: item.baseProductId,
          name: item.name,
          displayName: `${item.name} (${item.size})`,
          price: item.price,
          stock: availableStock, // Use available stock for POS
          totalStock: totalStock,
          reservedStock: reservedStock,
          size: item.size,
          category: item.category,
          image: item.image 
        };
      });
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

  // Filter by search term and category
  const searchFilteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return filteredProducts;
    
    const query = searchTerm.toLowerCase();
    return filteredProducts.filter(product =>
      product.displayName.toLowerCase().includes(query) ||
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  }, [filteredProducts, searchTerm]);

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getChange = () => {
    return amountReceived - getTotal();
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      alert('Please add items to cart');
      return;
    }

    if (paymentMethod === 'cash' && getChange() < 0) {
      alert('Insufficient amount received from customer');
      return;
    }

    const orderData = {
      orderId: `ORD-${Date.now()}`,
      cashierName: user?.fullname || user?.name || 'Store Cashier',
      items: cartItems.map(item => ({
        id: item.id,
        product_id: item.id,
        name: item.displayName,
        product_name: item.displayName,
        price: item.price,
        quantity: item.quantity,
        variant: item.size ? { name: item.size } : null
      })),
      total: getTotal(),
      status: 'completed',
      paymentMethod: paymentMethod,
      notes: orderNotes
    };

    console.log('📦 Submitting order:', orderData);

    try {
      const response = await axios.post('http://localhost:5000/add-order', orderData);
      
      if (response.data.success) {
        console.log('✅ Order created successfully:', response.data.orderNumber);
        await refreshInventory();
        
        try {
          await axios.post('http://localhost:5000/activity-log', {
            activity: 'Created In-Store Order',
            user: user?.email || 'cashier@store.com',
            type: 'order',
            details: `Order ID: ${orderData.orderId}, Total: ₱${getTotal().toLocaleString()}`,
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          console.error('Failed to log activity:', err);
        }

        const completedOrder = {
          orderId: response.data.orderNumber,
          orderType: 'in-store',
          createdBy: user?.email || 'cashier@store.com',
          cashierName: user?.fullname || user?.name || 'Store Cashier',
          timestamp: new Date().toISOString(),
          customer: {
            name: orderData.cashierName,
            phone: '',
            email: ''
          },
          items: cartItems,
          payment: {
            method: paymentMethod,
            status: 'paid',
            amountReceived: paymentMethod === 'cash' ? amountReceived : getTotal(),
            change: paymentMethod === 'cash' ? getChange() : 0
          },
          total: getTotal(),
          status: 'completed',
          notes: orderNotes
        };

        if (onOrderComplete) {
          onOrderComplete(completedOrder);
        }

        alert(
          `✅ Order completed successfully!\n\n` +
          `Order ID: ${response.data.orderNumber}\n` +
          `Total: ₱${getTotal().toLocaleString()}\n` +
          (paymentMethod === 'cash' ? `Change: ₱${getChange().toLocaleString()}` : '')
        );
        
        await refreshInventory();

        setCartItems([]);
        setPaymentMethod('cash');
        setAmountReceived(0);
        setOrderNotes('');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert(`Failed to create order: ${error.response?.data?.error || error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{background: '#f8f9fa'}}>
        <div className="text-center">
          <i className="fas fa-sync fa-spin display-1 text-primary mb-3"></i>
          <h3>Loading POS System...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{background: '#f8f9fa'}}>
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Error loading products: {error}
        </div>
      </div>
    );
  }

  if (availableProducts.length === 0) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{background: '#f8f9fa'}}>
        <div className="text-center">
          <i className="fas fa-box-open display-1 text-muted mb-4"></i>
          <h2>No Products Available</h2>
          <p className="text-muted">No products are currently in stock.</p>
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
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div className="d-flex flex-column gap-2 flex-grow-1">
                        <h5 className="mb-0">
                          <i className="fas fa-box me-2"></i>Product Selection
                        </h5>
                        <div className="d-flex gap-2 flex-wrap">
                          <button 
                            className={`btn btn-sm ${categoryFilter === 'all' ? 'btn-light' : 'btn-outline-light'}`}
                            onClick={() => setCategoryFilter('all')}
                          >
                            All Categories
                          </button>
                          {categories.map(cat => (
                            <button 
                              key={cat}
                              className={`btn btn-sm ${categoryFilter === cat ? 'btn-light' : 'btn-outline-light'}`}
                              onClick={() => setCategoryFilter(cat)}
                            >
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                          ))}
                        <div>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search by product name"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{maxWidth: '300px'}}
                          />
                        </div>
                        </div>
                        
                      </div>
                    </div>
                  </div>
                  <div className="card-body p-2" style={{maxHeight: '500px', overflowY: 'auto'}}>
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-4">
                        <i className="fas fa-search display-4 text-muted mb-3"></i>
                        <p className="text-muted">No products found in this category.</p>
                      </div>
                    ) : searchFilteredProducts.length === 0 ? (
                      <div className="text-center py-4">
                        <i className="fas fa-box-open display-4 text-muted mb-3"></i>
                        <p className="text-muted">No products match your search.</p>
                      </div>
                    ) : (
                      <div className="row g-2">
                        {searchFilteredProducts.map(product => (
                          <div key={product.id} className="col-lg-3 col-md-4 col-sm-6">
                            <div 
                              className="card h-100 shadow-sm product-card" 
                              style={{transition: 'transform 0.2s', cursor: 'pointer', minHeight: '140px'}}
                              onClick={() => addToCart(product)}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                {product.stock <= 5 && (
                                  <span className="position-absolute top-0 end-0 badge bg-warning m-1" style={{fontSize: '0.65rem'}}>
                                    Low Stock
                                  </span>
                                )}
                                {product.reservedStock > 0 && product.stock <= 10 && (
                                  <span className="position-absolute top-0 start-0 badge bg-info m-1" style={{fontSize: '0.65rem'}}>
                                    <i className="fas fa-lock me-1"></i>
                                    {product.reservedStock}
                                  </span>
                                )}
                              <div className="card-body p-2">
                                <h6 className="card-title mb-2">
                                  {product.displayName}
                                </h6>
                                <div className="mb-2">
                                  <span className="text-primary fw-bold">₱{product.price.toLocaleString()}</span>
                                </div>
                                <small className="text-muted d-block">
                                  Available: {product.stock}
                                  {product.reservedStock > 0 && (
                                    <span className="text-warning d-block" style={{fontSize: '0.7rem'}}>
                                      <i className="fas fa-lock me-1"></i>
                                      {product.reservedStock} reserved
                                    </span>
                                  )}
                                </small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="col-lg-4 col-md-5 mb-3">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header bg-primary text-white py-2">
                    <h5 className="mb-0">
                      <i className="fas fa-shopping-cart me-2"></i>Order Summary
                      <span className="badge bg-white text-primary ms-2">{cartItems.length}</span>
                    </h5>
                  </div>
                  <div className="card-body p-3">
                    <div className="mb-3" style={{maxHeight: '400px', overflowY: 'auto'}}>
                      {cartItems.length === 0 ? (
                        <div className="text-center py-5">
                          <i className="fas fa-shopping-cart display-6 text-muted mb-2"></i>
                          <p className="text-muted small">No items in order</p>
                        </div>
                      ) : (
                        cartItems.map(item => (
                          <div key={item.id} className="d-flex align-items-center border-bottom py-2">
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

                    {paymentMethod === 'cash' && (
                      <div className="mb-3">
                        <label className="form-label small fw-bold">Amount Received</label>
                        <input 
                          type="number" 
                          className="form-control form-control-sm"
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                        <div className="small mt-2">
                          <div>Change: <span className="fw-bold text-success">₱{getChange().toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                        </div>
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label small fw-bold">Payment Method</label>
                      <select 
                        className="form-select form-select-sm"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="gcash">GCash</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-bold">Order Notes (Optional)</label>
                      <textarea 
                        className="form-control form-control-sm"
                        rows="2"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Add any special instructions..."
                      />
                    </div>

                    <div className="border-top pt-3">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="h5 mb-0">Total:</span>
                        <span className="h4 mb-0 text-primary fw-bold">₱{getTotal().toLocaleString()}</span>
                      </div>

                      <button 
                        className="btn btn-primary w-100"
                        onClick={handleSubmit}
                        disabled={cartItems.length === 0}
                      >
                        <i className="fas fa-check me-2"></i>Complete Order
                      </button>
                    </div>
                  </div>
                  <div className="card-footer text-muted text-center bg-light border-0 py-2">
                    <small>Order processed by {user?.fullname || user?.name || 'Cashier'}</small>
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