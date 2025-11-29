import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Gcash from '../images/GcashQR.jpg';
/* eslint-disable no-unused-vars */

function Checkout({ cartItems = [], onUpdateCart, onOrderComplete, user }) {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [customerInfo, setCustomerInfo] = useState({
        username: user.fullname || '',
        email: user.email || '',
        contact: user.contact || '',
        address: user.address || ''
    });

  // Sync user data when user prop changes
  useEffect(() => {
    if (user) {
      console.log('✅ Auto-filling user data:', user);
      setCustomerInfo({
        username: user.fullname || '',
        email: user.email || '',
        contact: user.contact || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const [shippingInfo, setShippingInfo] = useState({
    method: 'customer_delivery',
    fee: 0,
    estimatedDays: 'Arranged by customer',
    name: 'Arranged Delivery'
  });
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'gcash',
    bankName: '',
    accountName: '',
    referenceNumber: ''
  });
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  const [stockWarnings, setStockWarnings] = useState([]);
  
  // Resolve image path saved by multer / stored in DB
  const API_HOST = 'http://localhost:5000';
  const getImageSrc = (img) => {
    if (!img) return 'https://via.placeholder.com/150';
    if (typeof img === 'string' && img.startsWith('http')) return img;
    return `${API_HOST}/${img.replace(/^public\//, '').replace(/^\/?uploads\//, 'uploads/')}`;
  };

  // Memoize normalization so references are stable and hooks don't re-run unnecessarily
  const normalizedCartItems = useMemo(() => {
    const list = cartItems.map(item => ({
      ...item,
      image: getImageSrc(item.image)
    }));
    console.log('Cart item images:', list.map(i => i.image));
    return list;
  }, [cartItems]);

  const activeCartItems = normalizedCartItems;

  useEffect(() => {
    if (cartItems.length > 0) {
        console.log('=== CART ITEMS DEBUG ===');
        cartItems.forEach((item, idx) => {
            console.log(`Item ${idx + 1}:`, {
                id: item.id || item.product_id,
                name: item.name || item.product_name,
                price: item.price || item.product_price,
                quantity: item.quantity,
                stock: item.product_totalstock || item.count,
                variant: item.selectedVariant
            });
        });
    }
}, [cartItems]);

  // Stock validation function wrapped in useCallback (depends on normalized items)
  const validateStock = useCallback(() => {
      const warnings = [];
      normalizedCartItems.forEach(item => {
          // Use available_stock (total - reserved) instead of just total stock
          const availableStock = item.selectedVariant 
              ? (item.selectedVariant.available_stock || item.selectedVariant.count || 0)
              : (item.available_stock || item.count || 0);
          
          const totalStock = item.product_totalstock || item.stock || 0;
          const reservedStock = item.product_reservedstock || 0;
          
          console.log(`Stock check for ${item.name}:`, {
              quantity: item.quantity,
              availableStock,
              totalStock,
              reservedStock,
              variant: item.selectedVariant?.name
          });
          
          if (item.quantity > availableStock) {
              warnings.push({
                  itemName: item.displayName || item.name,
                  requested: item.quantity,
                  available: availableStock,
                  reserved: reservedStock,
                  itemId: item.id,
                  variantId: item.selectedVariant?.id
              });
          }
      });
      setStockWarnings(warnings);
      return warnings.length === 0;
  }, [normalizedCartItems]);

  // Run stock validation whenever cart items change
  useEffect(() => {
    if (normalizedCartItems.length > 0) {
      validateStock();
    } else {
      setStockWarnings([]);
    }
  }, [normalizedCartItems, validateStock]);

  const validateStockFromBackend = async () => {
  try {
    console.log('🔍 Checking real-time stock availability...');
    
    const response = await fetch('http://localhost:5000/inventory');
    if (!response.ok) {
      throw new Error('Failed to fetch inventory');
    }
    
    const inventory = await response.json();
    const warnings = [];
    
    activeCartItems.forEach(item => {
      const product = inventory.find(p => p.product_id === item.id);
      
      if (!product) {
        warnings.push({
          itemName: item.displayName || item.name,
          requested: item.quantity,
          available: 0,
          message: 'Product no longer available'
        });
        return;
      }
      
      // Calculate available stock (total - reserved)
      const availableStock = product.available_stock || 
                            (product.product_totalstock - (product.product_reservedstock || 0));
      
      console.log(`Stock check for ${product.product_name}:`, {
        total: product.product_totalstock,
        reserved: product.product_reservedstock,
        available: availableStock,
        requested: item.quantity
      });
      
      if (item.quantity > availableStock) {
        warnings.push({
          itemName: item.displayName || item.name,
          requested: item.quantity,
          available: availableStock,
          reserved: product.product_reservedstock || 0
        });
      }
    });
    
    if (warnings.length > 0) {
      console.log('❌ Stock validation failed:', warnings);
      setStockWarnings(warnings);
      return false;
    }
    
    console.log('✅ All items have sufficient stock');
    setStockWarnings([]);
    return true;
    
  } catch (error) {
    console.error('❌ Stock validation error:', error);
    alert('⚠️ Unable to verify stock availability.\n\nPlease try again or contact support.');
    return false;
  }
};

  const getSubtotal = () => {
    return activeCartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalPrice = () => {
    return getSubtotal() + shippingInfo.fee;
  };

  // Updated quantity handler for direct input
  const handleQuantityChange = (productId, variantId, newQuantity) => {
    if (onUpdateCart) {
      const quantity = parseInt(newQuantity) || 0;
      if (quantity <= 0) return;
      
      const updatedItems = activeCartItems.map(item => {
        if (item.id === productId && 
            (variantId ? item.selectedVariant?.id === variantId : !item.selectedVariant)) {
          return { ...item, quantity };
        }
        return item;
      });
      onUpdateCart(updatedItems);
    }
  };

  const handleShippingMethodChange = (method) => {
    const shippingOptions = {
      customer_delivery: { fee: 0, estimatedDays: 'Arranged by customer', name: 'Arranged Delivery' },
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
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPaymentProofPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPaymentProofPreview(null);
      }
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        const hasUsername = customerInfo.username && customerInfo.username.trim().length > 0;
        const hasEmail = customerInfo.email && customerInfo.email.trim().length > 0;
        const hasAddress = customerInfo.address && customerInfo.address.trim().length > 0;
        
        return hasUsername && hasEmail && hasAddress;
      case 2:
        return shippingInfo.method;
      case 3:
        if (paymentInfo.method === 'gcash') {
          return paymentProof !== null;
        }
        return true;
    default:
        return true;
      }
  };

  const nextStep = async () => {
    if (!validateStep(currentStep)) {
      return;
    }
    
    // CRITICAL: Validate real-time stock BEFORE going to payment step
    if (currentStep === 2) {
      console.log('🛡️ Validating stock before payment step...');
      
      const isStockValid = await validateStockFromBackend();
      
      if (!isStockValid) {
        const warningMessage = stockWarnings.map(w => 
          `• ${w.itemName}: Requested ${w.requested}, Available ${w.available}`
        ).join('\n');
        
        alert(
          '⚠️ Stock Unavailable\n\n' +
          'These items are no longer available:\n\n' +
          warningMessage + '\n\n' +
          'Please go back and adjust your cart.'
        );
        
        setCurrentStep(1); // Force user back to step 1 to review
        return;
      }
      
      console.log('✅ Stock validated, proceeding to payment...');
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

const handleSubmit = async () => {
  console.log('=== FINAL ORDER SUBMISSION ===');
  
  // Final stock validation before submission
  const isStockValid = await validateStockFromBackend();
  if (!isStockValid) {
    alert('⚠️ Stock has changed.\nPlease review your cart and try again.');
    setCurrentStep(1);
    return;
  }

  const name = String(customerInfo.username || '').trim();
  const email = String(customerInfo.email || '').trim();
  const contact = String(customerInfo.contact || '').trim();
  const address = String(customerInfo.address || '').trim();

  if (!name || !email || !address) {
    alert('⚠️ Please fill in:\n• Full Name\n• Email\n• Address');
    setCurrentStep(1);
    return;
  }

  if (!validateStep(3)) {
    alert('⚠️ Please complete payment information.');
    return;
  }

  const processOrder = async () => {
    try {
      const formData = new FormData();
      
      const orderData = {
        type: 'online',
        customer: {
          name: name,
          email: email,
          contact: contact,
          address: address
        },
        items: activeCartItems.map(item => {
          let fullProductName = item.name || item.product_name;
          if (item.selectedVariant && item.selectedVariant.name) {
            fullProductName = `${fullProductName} - ${item.selectedVariant.name}`;
          }
          
          return {
            id: item.id || item.product_id,
            name: fullProductName,
            selectedVariant: item.selectedVariant || null,
            price: parseFloat(item.price || 0),
            quantity: parseInt(item.quantity || 1)
          };
        }),
        total: getTotalPrice(),
        status: 'pending',
        shipping: {
          method: shippingInfo.method,
          fee: shippingInfo.fee,
          estimatedDays: shippingInfo.estimatedDays,
          name: shippingInfo.name
        },
        payment: {
          method: paymentInfo.method,
          referenceNumber: paymentInfo.referenceNumber || '' 
        },
        notes: orderNotes || '',
        userId: user?.user_id || user?.id || null
      };

      console.log('📦 Order data:', orderData);
      
      formData.append('orderData', JSON.stringify(orderData));
      
      if (paymentProof) {
        formData.append('paymentProof', paymentProof);
      }

      console.log('🚀 Sending to backend...');
      const response = await fetch('http://localhost:5000/online-order', {
        method: 'POST',
        body: formData
      });
      
      const responseText = await response.text();
      console.log('📡 Response:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid server response');
      }
      
      if (!response.ok) {
        throw new Error(result.error || `Server error (${response.status})`);
      }
      
      if (!result.success) {
        throw new Error('Order confirmation failed');
      }
      
      console.log('✅ Order placed! Number:', result.orderNumber);
      
      // Clear cart
      if (onOrderComplete) onOrderComplete(result);
      if (onUpdateCart) onUpdateCart([]);
      
      // Show success message with invoice download option
      const downloadInvoice = window.confirm(
        `✅ Order Placed Successfully!\n\n` +
        `📋 Order Number: ${result.orderNumber}\n` +
        `💰 Total: ₱${result.total.toLocaleString()}\n` +
        `📧 Email: ${result.customer.email}\n\n` +
        `An email has been sent for your invoice\n`+
        'Thank you for shopping with OMGees!\n\n' 
      );
      
      // Navigate to home after confirmation
      setTimeout(() => {
        navigate('/');
      }, 1000);
      
    } catch (err) {
      console.error('❌ Error:', err);
      alert(`❌ Order Failed\n\n${err.message}\n\nPlease try again or contact support.`);
    }
  };
  
  processOrder();
};
  
  const StepIndicator = () => (
    <div className="row mb-4">
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body py-3">
            <div className="d-flex justify-content-center align-items-center">
                {[
                  { step: 1, title: "Info", icon: "fas fa-user" },
                  { step: 2, title: "Shipping", icon: "fas fa-truck" },
                  { step: 3, title: "Payment", icon: "fas fa-credit-card" }
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
        {stockWarnings.length > 0 && (
          <small className="d-block mt-1">
            <i className="fas fa-exclamation-triangle me-1"></i>
            Stock issues detected
          </small>
        )}
      </div>
      <div className="card-body">
        {activeCartItems.map((item) => {
          const warning = stockWarnings.find(w => 
            w.itemId === item.id && 
            (w.variantId ? w.variantId === item.selectedVariant?.id : !item.selectedVariant)
          );
          
          return (
            <div key={`${item.id}-${item.selectedVariant?.id || 'default'}`} 
                className={`d-flex align-items-center mb-3 ${warning ? 'border border-warning rounded p-2' : ''}`}>
              <img 
                src={item.image} 
                alt={item.name}
                className="rounded me-3" 
                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/40'; }}
              />
              <div className="flex-grow-1">
                <h6 className="mb-1 small">{item.displayName || item.name}</h6>
                <div className="small text-muted">₱{item.price.toLocaleString()} x {item.quantity}</div>
                {warning && (
                  <div className="text-warning small">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    Only {warning.available} available
                    {warning.reserved > 0 && (
                      <span className="d-block">
                        ({warning.reserved} reserved by other orders)
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="fw-bold small">₱{(item.price * item.quantity).toLocaleString()}</div>
            </div>
          );
        })}
        <hr />
        <div className="d-flex justify-content-between align-items-center">
          <span className="fw-bold h5 mb-0">Total:</span>
          <span className="fw-bold h5 mb-0 text-primary">₱{getTotalPrice().toLocaleString()}</span>
        </div>
      </div>
      <div className="card-footer text-muted text-center bg-light border-0">
        <small>Secure checkout by OMGees</small>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Customer Information</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Full Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={customerInfo.username || ''}
                    onChange={(e) => setCustomerInfo({...customerInfo, username: e.target.value})}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email Address *</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={customerInfo.email || ''}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    placeholder="your.email@example.com"
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
                    value={customerInfo.contact || ''}
                    onChange={(e) => setCustomerInfo({...customerInfo, contact: e.target.value})}
                    placeholder="09XX XXX XXXX"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Complete Address *</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  value={customerInfo.address || ''}
                  onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                  placeholder="Street, Barangay, City, Province"
                  required
                ></textarea>
              </div>

              {user && (
                <div className="alert alert-info">
                  <i className="fas fa-user-check me-2"></i>
                  Using your account information. You can edit any field above as needed.
                </div>
              )}
              
              {!user && (
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  You are checking out as a guest. <a href="/login">Login</a> to save your information for future orders.
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Shipping Method</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="form-check mb-3 p-3 border rounded shadow-sm">
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
                        <strong>Arranged Delivery</strong>
                        <div className="text-muted small">Customer COD for preferred delivery service</div>
                        <div className="text-info small">
                          <i className="fas fa-mobile-alt me-1"></i>We use Grab, Lalamove, Angkas Padala, etc.
                        </div>
                      </div>
                      <div className="fw-bold text-success">Prices may VARY</div>
                    </div>
                  </label>
                </div>

                <div className="form-check mb-3 p-3 border rounded bg-light shadow-sm">
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
                    163 Pontiac Street, Fairview, Quezon City, Philippines<br/>
                    Contact: +63 906 512 8417
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

      case 3:
        return (
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Payment Method</h5>
            </div>
            <div className="card-body">
              <div className="mb-4">
                  <div className="form-check mb-3 p-3 border rounded shadow-sm">
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
                          <div className="text-muted small">Pay via GCash</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {paymentInfo.method === 'gcash' && (
                  <div className="border-top pt-4">
                    {/* GCash QR Code Section */}
                    <div className="alert alert-info mb-4">
                      <h6 className="alert-heading fw-bold">
                        <i className="fas fa-qrcode me-2"></i>
                        Scan to Pay with GCash
                      </h6>
                      <div className="row align-items-center">
                        <div className="col-md-4 text-center mb-3 mb-md-0">
                          {/* QR Code Image */}
                          <div className="bg-white p-3 rounded border d-inline-block">
                            <img 
                              src={Gcash} 
                              alt="GCash QR Code"
                              className="img-fluid"
                              style={{ maxWidth: '180px', height: 'auto' }}
                            />
                          </div>
                        </div>
                        <div className="col-md-8">
                          <p className="mb-2"><strong>Payment Instructions:</strong></p>
                          <ol className="small mb-2">
                            <li>Open your GCash app</li>
                            <li>Tap "Scan QR" and scan the QR code on the left</li>
                            <li>Enter the amount: <strong className="text-primary">₱{getTotalPrice().toLocaleString()}</strong></li>
                            <li>Complete the payment</li>
                            <li>Take a screenshot of the confirmation</li>
                            <li>Upload the screenshot below</li>
                          </ol>
                          <div className="bg-light p-2 rounded small">
                            <strong>Account Name:</strong> OMGees Store<br/>
                            <strong>Mobile Number:</strong> 0912-345-6789
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">GCash Reference Number *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Enter the 13-digit reference number from your receipt"
                        value={paymentInfo.referenceNumber}
                        onChange={(e) => setPaymentInfo({...paymentInfo, referenceNumber: e.target.value})}
                        required
                      />
                      <small className="text-muted">
                        <i className="fas fa-info-circle me-1"></i>
                        Found on your GCash transaction receipt
                      </small>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Upload Payment Screenshot *</label>
                      <input 
                        type="file" 
                        className="form-control" 
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                      <small className="text-muted">
                        <i className="fas fa-camera me-1"></i>
                        Upload a clear screenshot showing the payment confirmation
                      </small>
                      {paymentProof && (
                        <div className="text-success small mt-2">
                          <i className="fas fa-check me-1"></i>
                          {paymentProof.name}
                        </div>
                      )}
                    {paymentProofPreview && (
                      <div className="mt-3">
                        <label className="form-label small">Preview:</label>
                        <div className="border rounded p-2 bg-light">
                          <img 
                            src={paymentProofPreview} 
                            alt="Payment proof preview" 
                            className="img-fluid"
                            style={{ maxHeight: '200px', width: 'auto' }}
                          />
                        </div>
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
              
              {currentStep < 3 ? (
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
                  disabled={!validateStep(4) || stockWarnings.length > 0}
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