import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import omgeesLogo from '../images/omgees.png';

function Navbar({ user, onLogout, cartItems = [], onUpdateCart }) {
    const [showCart, setShowCart] = useState(false);
    const navigate = useNavigate();
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [stockWarnings, setStockWarnings] = useState([]);

    const toastRef = useRef(null);

    useEffect(() => {
        if (showToast && toastRef.current) {
            const timer = setTimeout(() => {
                setShowToast(false);
                setToastMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    // Stock validation function
    const validateStock = useCallback(() => {
        const warnings = [];
        cartItems.forEach(item => {
            const availableStock = item.selectedVariant 
                ? (item.selectedVariant.count || item.selectedVariant.product_totalstock || 0)
                : (item.count || item.product_totalstock || 0);
            
            if (item.quantity > availableStock) {
                warnings.push({
                    itemName: item.displayName || item.name,
                    requested: item.quantity,
                    available: availableStock,
                    itemId: item.id,
                    variantId: item.selectedVariant?.id
                });
            }
        });
        setStockWarnings(warnings);
        return warnings.length === 0;
    }, [cartItems]);

    // Run stock validation whenever cart items change
    useEffect(() => {
        if (cartItems.length > 0) {
            validateStock();
        } else {
            setStockWarnings([]);
        }
    }, [cartItems, validateStock]);

    // Auto-fix stock quantities
    const fixStockQuantities = () => {
        if (stockWarnings.length > 0 && onUpdateCart) {
            const fixedItems = cartItems.map(item => {
                const warning = stockWarnings.find(w => 
                    w.itemId === item.id && 
                    (w.variantId ? w.variantId === item.selectedVariant?.id : !item.selectedVariant)
                );
                
                if (warning && warning.available > 0) {
                    return { ...item, quantity: warning.available };
                } else if (warning && warning.available === 0) {
                    return null;
                }
                return item;
            }).filter(Boolean);
            
            onUpdateCart(fixedItems);
            showToastMessage('Cart quantities adjusted to available stock levels');
        }
    };

    const showToastMessage = (message) => {
        setToastMessage(message);
        setShowToast(true);
    };

    const updateQuantity = (productId, variantId, change) => {
        const updatedItems = cartItems.map(item => {
            if (item.id === productId && 
                (variantId ? item.selectedVariant?.id === variantId : !item.selectedVariant)) {
                const newQuantity = item.quantity + change;
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
            }
            return item;
        }).filter(Boolean);

        if (onUpdateCart) {
            onUpdateCart(updatedItems);
        }
    };

    const handleQuantityChange = (productId, variantId, newQuantity) => {
        const quantity = parseInt(newQuantity) || 0;
        if (quantity <= 0) return;
        
        const updatedItems = cartItems.map(item => {
            if (item.id === productId && 
                (variantId ? item.selectedVariant?.id === variantId : !item.selectedVariant)) {
                return { ...item, quantity };
            }
            return item;
        });

        if (onUpdateCart) {
            onUpdateCart(updatedItems);
        }
    };

    const removeFromCart = (productId, variantId) => {
        const itemToRemove = cartItems.find(item => 
            item.id === productId && 
            (variantId ? item.selectedVariant?.id === variantId : !item.selectedVariant)
        );
        
        const updatedItems = cartItems.filter(item => 
            !(item.id === productId && 
              (variantId ? item.selectedVariant?.id === variantId : !item.selectedVariant))
        );

        if (onUpdateCart) {
            onUpdateCart(updatedItems);
        }
        
        if (itemToRemove) {
            showToastMessage(`${itemToRemove.displayName || itemToRemove.name} removed from cart`);
        }
    };

    const getTotalPrice = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getTotalItems = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    return (
        <>
            <nav className="navbar fixed-top navbar-expand-lg navbar-custom shadow">
                <div className="container-fluid">
                    <img 
                        src={omgeesLogo} 
                        alt="OMGees Logo" 
                        width="30" 
                        height="24" 
                        className="d-inline-block align-text-top navbar-logo me-2"
                    />
                    <Link to="/" className="navbar-brand fw-bold">OMGees</Link>
                    <button 
                        className="navbar-toggler" 
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#navbarSupportedContent"
                        aria-controls="navbarSupportedContent" 
                        aria-expanded="false" 
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <Link to="/" className="nav-link px-3">
                                    <i className="fas fa-home me-2"></i>Home
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/track-order" className="nav-link px-3">
                                    <i className="fas fa-shipping-fast me-2"></i>Orders
                                </Link>
                            </li>
                            <li className="nav-item">
                                <button 
                                    className="btn btn-outline-light btn-sm position-relative px-3 mt-1" 
                                    type="button" 
                                    onClick={() => setShowCart(true)}
                                    style={{ border: '1px solid rgba(255,255,255,0.5)' }}
                                >
                                    <i className="fas fa-shopping-cart me-1"></i>
                                    {getTotalItems() > 0 && (
                                        <span 
                                            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                            style={{ fontSize: '0.65rem', minWidth: '18px', height: '18px' }}
                                        >
                                            {getTotalItems()}
                                        </span>
                                    )}
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* User Display and Logout Button*/}
                    <div className="d-flex align-items-center me-3">
                        {user && (
                            <span className="text-white me-3">
                                <i className="fas fa-user me-2"></i>
                                {user.fullname || user.name}
                            </span>
                        )}
                        <button className="btn btn-outline-primary btn-sm" onClick={onLogout}>
                            <i className="fas fa-sign-out-alt me-2"></i>Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Shopping Cart Offcanvas - Keep all your existing cart code */}
            {showCart && (
                <div className="offcanvas offcanvas-end show" style={{visibility: 'visible', width: '400px'}} tabIndex="-1">
                    <div className="offcanvas-header border-bottom">
                        <h5 className="offcanvas-title">
                            <i className="fas fa-shopping-cart me-2"></i>Shopping Cart
                            {stockWarnings.length > 0 && (
                                <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.7rem' }}>
                                    <i className="fas fa-exclamation-triangle me-1"></i>
                                    {stockWarnings.length} stock issue{stockWarnings.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={() => setShowCart(false)}
                        ></button>
                    </div>
                    <div className="offcanvas-body p-0">
                        {cartItems.length === 0 ? (
                            <div className="text-center p-4">
                                <i className="fas fa-shopping-cart display-4 text-muted mb-3"></i>
                                <p className="text-muted mb-3">Your cart is empty</p>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => setShowCart(false)}
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Stock Warning Alert */}
                                {stockWarnings.length > 0 && (
                                    <div className="alert alert-warning border-0 m-3 mb-2 p-2">
                                        <div className="d-flex align-items-start">
                                            <i className="fas fa-exclamation-triangle text-warning me-2" style={{ fontSize: '0.9rem', marginTop: '2px' }}></i>
                                            <div className="flex-grow-1">
                                                <h6 className="fw-bold mb-1" style={{ fontSize: '0.85rem' }}>Stock Issue</h6>
                                                <p className="mb-2 small" style={{ fontSize: '0.75rem' }}>Some items exceed available stock:</p>
                                                <ul className="mb-2 ps-3" style={{ fontSize: '0.75rem' }}>
                                                    {stockWarnings.map((warning, index) => (
                                                        <li key={index}>
                                                            <strong>{warning.itemName}</strong>: 
                                                            Requested {warning.requested}, Available {warning.available}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <button 
                                                    className="btn btn-warning btn-sm w-100" 
                                                    onClick={fixStockQuantities}
                                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                                >
                                                    <i className="fas fa-magic me-1"></i>
                                                    Auto-fix Quantities
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="p-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                    {cartItems.map((item) => {
                                        const warning = stockWarnings.find(w => 
                                            w.itemId === item.id && 
                                            (w.variantId ? w.variantId === item.selectedVariant?.id : !item.selectedVariant)
                                        );

                                        return (
                                            <div 
                                                key={`${item.id}-${item.selectedVariant?.id || 'default'}`} 
                                                className={`d-flex align-items-center border-bottom py-3 ${warning ? 'border border-warning rounded p-2 mb-2' : ''}`}
                                            >
                                                <img 
                                                    src={item.image} 
                                                    className="rounded me-3" 
                                                    alt={item.name}
                                                    style={{width: '60px', height: '60px', objectFit: 'cover'}}
                                                />
                                                <div className="flex-grow-1">
                                                    <h6 className="mb-1 small">{item.displayName || item.name}</h6>
                                                    <small className="text-muted">₱{item.price.toLocaleString()}</small>
                                                    {warning && (
                                                        <div className="text-warning small mt-1">
                                                            <i className="fas fa-exclamation-triangle me-1"></i>
                                                            Only {warning.available} available
                                                        </div>
                                                    )}
                                                    <div className="d-flex align-items-center mt-2">
                                                        <div className="input-group" style={{ width: '120px' }}>
                                                            <button 
                                                                className="btn btn-sm btn-outline-secondary" 
                                                                type="button"
                                                                onClick={() => updateQuantity(item.id, item.selectedVariant?.id, -1)}
                                                                style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                                                            >
                                                                <i className="fas fa-minus"></i>
                                                            </button>
                                                            <input 
                                                                type="number" 
                                                                className="form-control form-control-sm text-center" 
                                                                value={item.quantity}
                                                                onChange={(e) => handleQuantityChange(item.id, item.selectedVariant?.id, e.target.value)}
                                                                min="1"
                                                                style={{ fontSize: '0.8rem', padding: '0.25rem' }}
                                                            />
                                                            <button 
                                                                className="btn btn-sm btn-outline-secondary" 
                                                                type="button"
                                                                onClick={() => updateQuantity(item.id, item.selectedVariant?.id, 1)}
                                                                style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                                                            >
                                                                <i className="fas fa-plus"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fw-bold small text-primary">₱{(item.price * item.quantity).toLocaleString()}</div>
                                                    <button 
                                                        className="btn btn-sm btn-outline-danger mt-1" 
                                                        onClick={() => removeFromCart(item.id, item.selectedVariant?.id)}
                                                        style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Cart Total */}
                                <div className="border-top p-3 mt-auto bg-light">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="mb-0">Total ({getTotalItems()} items):</h6>
                                        <h5 className="mb-0 text-primary fw-bold">₱{getTotalPrice().toLocaleString()}</h5>
                                    </div>
                                    <button 
                                        className="btn btn-primary w-100 mb-2"
                                        onClick={() => {
                                            setShowCart(false);
                                            navigate('/checkout');
                                        }}
                                        disabled={stockWarnings.length > 0}
                                    >
                                        <i className="fas fa-credit-card me-2"></i>Proceed to Checkout
                                    </button>
                                    {stockWarnings.length > 0 && (
                                        <small className="text-warning d-block text-center mb-2">
                                            <i className="fas fa-exclamation-triangle me-1"></i>
                                            Fix stock issues to proceed
                                        </small>
                                    )}
                                    <button 
                                        className="btn btn-outline-secondary w-100" 
                                        onClick={() => setShowCart(false)}
                                    >
                                        Continue Shopping
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop for offcanvas */}
            {showCart && (
                <div 
                    className="offcanvas-backdrop show" 
                    onClick={() => setShowCart(false)}
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        zIndex: 1040,
                        width: '100vw',
                        height: '100vh'
                    }}
                ></div>
            )}

            {/* Toast Notification */}
            {showToast && (
                <div 
                    ref={toastRef}
                    className="position-fixed top-0 end-0 p-3" 
                    style={{zIndex: 9999}}
                >
                    <div className="toast show align-items-center text-white bg-success border-0">
                        <div className="d-flex">
                            <div className="toast-body">
                                <i className="fas fa-check-circle me-2"></i>{toastMessage}
                            </div>
                            <button 
                                type="button" 
                                className="btn-close btn-close-white me-2 m-auto" 
                                onClick={() => setShowToast(false)}
                            ></button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Navbar;