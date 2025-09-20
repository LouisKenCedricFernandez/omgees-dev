import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Checkout({ cartItems = [], onUpdateCart, onOrderComplete, user }) {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [customerInfo, setCustomerInfo] = useState({
    username: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  // Sync user data when user prop changes
  useEffect(() => {
    if (user) {
      setCustomerInfo({
        username: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const [shippingInfo, setShippingInfo] = useState({
    method: 'customer_delivery',
    fee: 0,
    estimatedDays: 'Customer arranged',
    name: 'Customer Arranged Delivery'
  });
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'cash',
    bankName: '',
    accountName: ''
  });
    const [orderNotes, setOrderNotes] = useState('');
    const [paymentProof, setPaymentProof] = useState(null);
    const activeCartItems = cartItems;

    if (cartItems.length === 0) {
    return (
      <div className="container-fluid bg-light min-vh-100">
        <div className="container py-5">
          <div className="row">
            <div className="col-12 text-center">
              <div className="card border-0 shadow-sm">
                <div className="card-body py-5">
                  <i className="fas fa-shopping-cart display-1 text-muted mb-4"></i>
                  <h2>Your cart is empty</h2>
                  <p className="text-muted">Add some items to your cart before checking out.</p>
                  <button 
                    className="btn btn-primary btn-lg" 
                    onClick={() => navigate('/products/ingredients')}
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getSubtotal = () => {
    return activeCartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalPrice = () => {
    return getSubtotal() + shippingInfo.fee;
  };

  const updateQuantity = (productId, variantId, change) => {
    if (onUpdateCart) {
      const updatedItems = activeCartItems.map(item => {
        if (item.id === productId && 
            (variantId ? item.selectedVariant?.id === variantId : !item.selectedVariant)) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      }).filter(Boolean);
      onUpdateCart(updatedItems);
    }
  };

  const removeFromCart = (productId, variantId) => {
    if (onUpdateCart) {
      const updatedItems = activeCartItems.filter(item => 
        !(item.id === productId && 
          (variantId ? item.selectedVariant?.id === variantId : !item.selectedVariant))
      );
      onUpdateCart(updatedItems);
    }
  };

  const handleShippingMethodChange = (method) => {
    const shippingOptions = {
      customer_delivery: { fee: 0, estimatedDays: 'Customer arranged', name: 'Customer Arranged Delivery' },
      pickup: { fee: 0, estimatedDays: 'Ready in 1-2 days', name: 'Store Pickup' }
    };
    setShippingInfo({
      method,
      ...shippingOptions[method]
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentProof(file);
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return activeCartItems.length > 0;
      case 2:
        return customerInfo.username && customerInfo.email && customerInfo.address;
      case 3:
        return shippingInfo.method;
      case 4:
        if (paymentInfo.method === 'cash') return true;
        if (paymentInfo.method === 'gcash') {
          return paymentProof;
        }
        if (paymentInfo.method === 'bank') {
          return paymentInfo.bankName && paymentInfo.accountName && paymentProof;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (validateStep(4)) {
        const newOrder = {
        orderId: `ORD-${Date.now()}`,
        orderType: 'online',
        createdBy: user?.email || customerInfo.email,
        cashierName: null,
        timestamp: new Date().toISOString(),
        customer: customerInfo,
        items: activeCartItems,
        shipping: shippingInfo,
        payment: paymentInfo,
        total: getTotalPrice(),
        status: 'pending', // Online orders start as pending, not completed
        notes: orderNotes,
        paymentProof: paymentProof?.name || null
        };

        // Pass the order to parent component for management
        if (onOrderComplete) {
        onOrderComplete(newOrder);
        }
        
        // Clear the cart to prevent duplicate orders
        if (onUpdateCart) {
        onUpdateCart([]);
        }
        
        alert('Order placed successfully! Thank you for your purchase.');
        console.log('Order Details:', newOrder);
        
        // Redirect to home page
        navigate('/');
    }
  };

  const StepIndicator = () => (
    <div className="row mb-4">
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body py-3">
            <div className="d-flex justify-content-center align-items-center">
              {[
                { step: 1, title: "Cart", icon: "fas fa-shopping-cart" },
                { step: 2, title: "Info", icon: "fas fa-user" },
                { step: 3, title: "Shipping", icon: "fas fa-truck" },
                { step: 4, title: "Payment", icon: "fas fa-credit-card" }
              ].map((item, index) => (
                <div key={item.step} className="d-flex flex-column align-items-center position-relative mx-2">
                  <div 
                    className={`rounded-circle d-flex align-items-center justify-content-center ${
                      currentStep >= item.step ? 'bg-primary text-white' : 'bg-light text-muted'
                    }`}
                    style={{ width: '35px', height: '35px' }}
                  >
                    <i className={item.icon} style={{ fontSize: '0.8rem' }}></i>
                  </div>
                  <small className={`mt-1 ${currentStep >= item.step ? 'text-primary fw-bold' : 'text-muted'}`}
                         style={{ fontSize: '0.65rem' }}>
                    {item.title}
                  </small>
                  {index < 3 && (
                    <div 
                      className={`position-absolute ${
                        currentStep > item.step ? 'bg-primary' : 'bg-light'
                      }`}
                      style={{ 
                        width: '50px', 
                        height: '2px', 
                        top: '17px', 
                        left: '42px',
                        zIndex: -1
                      }}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const OrderSummary = () => (
    <div className="card h-100 border-0 shadow-sm">
      <div className="card-header bg-success text-white">
        <h5 className="mb-0">Order Summary</h5>
      </div>
      <div className="card-body">
        {activeCartItems.map((item) => (
          <div key={`${item.id}-${item.selectedVariant?.id || 'default'}`} className="d-flex align-items-center mb-3">
            <img 
              src={item.image} 
              alt={item.name}
              className="rounded me-3" 
              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
            />
            <div className="flex-grow-1">
              <h6 className="mb-1 small">{item.displayName || item.name}</h6>
              <small className="text-muted">₱{item.price.toLocaleString()} x {item.quantity}</small>
            </div>
            <div className="fw-bold small">₱{(item.price * item.quantity).toLocaleString()}</div>
          </div>
        ))}
        <hr />
        <div className="table-responsive">
          <table className="table table-borderless table-sm mb-0">
            <tbody>
              <tr>
                <td className="fw-bold">Subtotal:</td>
                <td className="text-end">₱{getSubtotal().toLocaleString()}</td>
              </tr>
              <tr>
                <td className="fw-bold">Shipping:</td>
                <td className="text-end">₱{shippingInfo.fee.toLocaleString()}</td>
              </tr>
              <tr className="border-top">
                <td className="fw-bold h5">Total:</td>
                <td className="text-end fw-bold h5 text-primary">₱{getTotalPrice().toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="card-footer text-muted text-center bg-light border-0">
        <small>Secure checkout powered by OMGees</small>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Review Your Cart</h5>
            </div>
            <div className="card-body">
              {activeCartItems.map((item) => (
                <div key={`${item.id}-${item.selectedVariant?.id || 'default'}`} className="d-flex align-items-center border-bottom py-3">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="rounded me-3" 
                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                  />
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{item.displayName || item.name}</h6>
                    <p className="text-muted mb-2">₱{item.price.toLocaleString()}</p>
                    <div className="d-flex align-items-center">
                      <button 
                        className="btn btn-sm btn-outline-secondary me-2" 
                        onClick={() => updateQuantity(item.id, item.selectedVariant?.id, -1)}
                        style={{ width: '30px', height: '30px', padding: '0' }}
                      >
                        <i className="fas fa-minus" style={{ fontSize: '0.7rem' }}></i>
                      </button>
                      <span className="mx-3 fw-bold">{item.quantity}</span>
                      <button 
                        className="btn btn-sm btn-outline-secondary me-2" 
                        onClick={() => updateQuantity(item.id, item.selectedVariant?.id, 1)}
                        style={{ width: '30px', height: '30px', padding: '0' }}
                      >
                        <i className="fas fa-plus" style={{ fontSize: '0.7rem' }}></i>
                      </button>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold h6 text-primary">₱{(item.price * item.quantity).toLocaleString()}</div>
                    <button 
                      className="btn btn-sm btn-outline-danger" 
                      onClick={() => removeFromCart(item.id, item.selectedVariant?.id)}
                      style={{ width: '30px', height: '30px', padding: '0' }}
                    >
                      <i className="fas fa-trash" style={{ fontSize: '0.7rem' }}></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Customer Information</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Username *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={customerInfo.username}
                    onChange={(e) => setCustomerInfo({...customerInfo, username: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email *</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    placeholder="+63 9XX XXX XXXX"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Complete Address *</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  placeholder="House/Unit/Floor No., Street, Subdivision/Village, City, Province, ZIP Code"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                  required
                ></textarea>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Shipping Method</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="form-check mb-3 p-3 border rounded">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="shipping" 
                    checked={shippingInfo.method === 'customer_delivery'}
                    onChange={() => handleShippingMethodChange('customer_delivery')}
                  />
                  <label className="form-check-label w-100">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>Customer Arranged Delivery</strong>
                        <div className="text-muted small">You book and pay your preferred delivery service</div>
                        <div className="text-info small">
                          <i className="fas fa-mobile-alt me-1"></i>Use Grab, Lalamove, Angkas Padala, etc.
                        </div>
                      </div>
                      <div className="fw-bold text-success">FREE</div>
                    </div>
                  </label>
                </div>

                <div className="form-check mb-3 p-3 border rounded bg-light">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="shipping" 
                    checked={shippingInfo.method === 'pickup'}
                    onChange={() => handleShippingMethodChange('pickup')}
                  />
                  <label className="form-check-label w-100">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>Store Pickup</strong>
                        <div className="text-muted small">Ready in 1-2 business days</div>
                        <div className="text-success small">
                          <i className="fas fa-star me-1"></i>Recommended
                        </div>
                      </div>
                      <div className="fw-bold text-success">FREE</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Customer Delivery Instructions */}
              {shippingInfo.method === 'customer_delivery' && (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Customer Arranged Delivery Instructions:</strong>
                  <ul className="mt-2 mb-0">
                    <li>Your order will be packed and ready for pickup at our store</li>
                    <li>We will notify you when your order is ready (1-2 business days)</li>
                    <li>Book your preferred delivery service (Grab, Lalamove, Angkas Padala, etc.)</li>
                    <li>Provide the delivery driver with your order reference number</li>
                    <li>You are responsible for all delivery fees and arrangements</li>
                  </ul>
                  <div className="mt-2">
                    <strong>Store Address for Pickup:</strong><br/>
                    123 Main Street, Quezon City, Metro Manila<br/>
                    Contact: +63 912 345 6789
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Order Notes (Optional)</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  placeholder="Any special instructions for your order..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Payment Method</h5>
            </div>
            <div className="card-body">
              <div className="mb-4">
                {/* Cash Payment */}
                <div className="form-check mb-3 p-3 border rounded">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="payment" 
                    value="cash"
                    checked={paymentInfo.method === 'cash'}
                    onChange={(e) => setPaymentInfo({...paymentInfo, method: e.target.value})}
                  />
                  <label className="form-check-label w-100">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-money-bill-wave me-3 text-success"></i>
                      <div>
                        <strong>Cash Payment</strong>
                        <div className="text-muted small">Pay with cash when picking up your order</div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* GCash Payment */}
                <div className="form-check mb-3 p-3 border rounded">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="payment" 
                    value="gcash"
                    checked={paymentInfo.method === 'gcash'}
                    onChange={(e) => setPaymentInfo({...paymentInfo, method: e.target.value})}
                  />
                  <label className="form-check-label w-100">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-mobile-alt me-3 text-info"></i>
                      <div>
                        <strong>GCash</strong>
                        <div className="text-muted small">Scan QR code to pay with GCash</div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Bank Transfer */}
                <div className="form-check mb-3 p-3 border rounded">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="payment" 
                    value="bank"
                    checked={paymentInfo.method === 'bank'}
                    onChange={(e) => setPaymentInfo({...paymentInfo, method: e.target.value})}
                  />
                  <label className="form-check-label w-100">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-university me-3 text-warning"></i>
                      <div>
                        <strong>Bank Transfer</strong>
                        <div className="text-muted small">Transfer to our bank account</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Payment method details */}
              {paymentInfo.method === 'cash' && (
                <div className="border-top pt-4">
                  <div className="alert alert-success">
                    <i className="fas fa-money-bill-wave me-2"></i>
                    <strong>Cash Payment Information:</strong>
                    <div className="mt-2">
                      <strong>Payment Process:</strong>
                      <ul className="mt-1 mb-0">
                        <li>Your order will be prepared and ready for pickup</li>
                        <li>We will notify you when your order is ready (1-2 business days)</li>
                        <li>Visit our store during business hours to pay and collect</li>
                        <li>Please bring exact change when possible</li>
                        <li>Valid ID may be required for order verification</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              {/* GCASH Payment method with file upload for payment confirmation */}
              {paymentInfo.method === 'gcash' && (
                <div className="border-top pt-4">
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>GCash Payment Instructions:</strong>
                    <ol className="mt-2 mb-0">
                      <li>Scan the QR code below using your GCash app</li>
                      <li>Pay the exact amount: ₱{getTotalPrice().toLocaleString()}</li>
                      <li>Take a screenshot of the payment confirmation</li>
                      <li>Upload the screenshot below</li>
                    </ol>
                  </div>
                  
                  <div className="text-center mb-4">
                    <div className="bg-light p-4 rounded">
                      <div className="bg-white p-3 d-inline-block rounded shadow">
                        <svg width="150" height="150" viewBox="0 0 200 200" className="border">
                          <rect width="200" height="200" fill="white"/>
                          <rect x="20" y="20" width="20" height="20" fill="black"/>
                          <rect x="60" y="20" width="20" height="20" fill="black"/>
                          <rect x="80" y="20" width="20" height="20" fill="black"/>
                          <rect x="120" y="20" width="20" height="20" fill="black"/>
                          <rect x="160" y="20" width="20" height="20" fill="black"/>
                          <text x="100" y="110" textAnchor="middle" fontSize="10" fill="black">GCash QR</text>
                          <text x="100" y="125" textAnchor="middle" fontSize="8" fill="black">₱{getTotalPrice().toLocaleString()}</text>
                        </svg>
                      </div>
                      <p className="mt-2 text-muted small">GCash QR Code</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Upload Payment Screenshot *</label>
                    <input 
                      type="file" 
                      className="form-control" 
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    {paymentProof && (
                      <div className="text-success small mt-1">
                        <i className="fas fa-check me-1"></i>
                        File uploaded: {paymentProof.name}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Bank Transfer Payment method with file upload for payment confirmation */}
              {paymentInfo.method === 'bank' && (
                <div className="border-top pt-4">
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Bank Transfer Instructions:</strong>
                    <div className="mt-2">
                      <strong>BDO Unibank</strong><br/>
                      Account Name: Your Store Name<br/>
                      Account Number: 1234-5678-9012<br/>
                      Amount to Transfer: ₱{getTotalPrice().toLocaleString()}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Bank Name *</label>
                    <select 
                      className="form-control"
                      value={paymentInfo.bankName}
                      onChange={(e) => setPaymentInfo({...paymentInfo, bankName: e.target.value})}
                    >
                      <option value="">Select Bank</option>
                      <option value="BDO">BDO Unibank</option>
                      <option value="BPI">Bank of the Philippine Islands (BPI)</option>
                      <option value="Metrobank">Metrobank</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Account Holder Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Name on the bank account"
                      value={paymentInfo.accountName}
                      onChange={(e) => setPaymentInfo({...paymentInfo, accountName: e.target.value})}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Upload Bank Transfer Receipt *</label>
                    <input 
                      type="file" 
                      className="form-control" 
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                    />
                    {paymentProof && (
                      <div className="text-success small mt-1">
                        <i className="fas fa-check me-1"></i>
                        File uploaded: {paymentProof.name}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="alert alert-info">
                <i className="fas fa-lock me-2"></i>
                Your payment information is secure and encrypted.
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container-fluid bg-light min-vh-100">
      <div className="container py-5">
        <StepIndicator />

        <div className="row">
          <div className="col-lg-8 col-md-7 mb-4">
            {renderStepContent()}
            
            <div className="d-flex justify-content-between mt-4">
              <button 
                className="btn btn-outline-secondary"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <i className="fas fa-arrow-left me-2"></i>Previous
              </button>
              
              {currentStep < 4 ? (
                <button 
                  className="btn btn-primary"
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                >
                  Next<i className="fas fa-arrow-right ms-2"></i>
                </button>
              ) : (
                <button 
                  className="btn btn-success btn-lg"
                  onClick={handleSubmit}
                  disabled={!validateStep(4)}
                >
                  <i className="fas fa-check me-2"></i>Place Order - ₱{getTotalPrice().toLocaleString()}
                </button>
              )}
            </div>
          </div>

          <div className="col-lg-4 col-md-5 mb-4">
            <OrderSummary />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;