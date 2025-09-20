import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Fixed: Both imports from same source
import omgeesLogo from '../images/omgees.png';

function Navbar({ user, onLogout, cartItems = [], onUpdateCart }) {
    const [showCart, setShowCart] = useState(false);
    const navigate = useNavigate();
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

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
            <nav className="navbar sticky-top navbar-expand-lg navbar-custom shadow mt-3">
                <div className="container-fluid">
                    <img src={omgeesLogo} alt="OMGees Logo" width="30" height="24" className="d-inline-block align-text-top navbar-logo me-2"/>
                    <Link to="/" className="navbar-brand fw-bold">OMGees</Link>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent"
                        aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <Link to="/" className="nav-link px-3">Home</Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/about" className="nav-link px-3">About us</Link>
                            </li>
                            <li className="nav-item dropdown">
                                <a 
                                    className="nav-link dropdown-toggle px-3" 
                                    href="/" 
                                    role="button" 
                                    data-bs-toggle="dropdown" 
                                    aria-expanded="false"
                                >
                                    Products
                                </a>
                                <ul className="dropdown-menu">
                                    <li><Link to="/products/ingredients" className="dropdown-item">Ingredients</Link></li>
                                    <li><Link to="/products/tools" className="dropdown-item">Tools</Link></li>
                                    <li><hr className="dropdown-divider"/></li>
                                    <li><Link to="/products/packaging" className="dropdown-item">Packaging</Link></li>
                                </ul>
                            </li>
                        </ul>
                        <div className="d-flex p-2">
                            <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search"/>
                            <button className="btn btn-outline-light" type="button">Search</button>
                        </div>
                    </div>

                    {/* Cart Button */}
                    <div className="d-flex align-items-center me-3">
                        <button 
                            className="btn btn-outline-light position-relative me-3" 
                            type="button" 
                            onClick={() => setShowCart(true)}
                            style={{ border: '1px solid rgba(255,255,255,0.5)' }}
                        >
                            <i className="fas fa-shopping-cart fs-5"></i>
                            {getTotalItems() > 0 && (
                                <span 
                                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                    style={{ fontSize: '0.65rem', minWidth: '18px', height: '18px' }}
                                >
                                    {getTotalItems()}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="d-flex align-items-center p-2">
                        <span className="me-3 text-white">Welcome, {user?.name || 'User'}!</span>
                        <button className="btn btn-outline-primary btn-sm" onClick={onLogout}>Logout</button>
                    </div>
                </div>
            </nav>

            {/* Shopping Cart Offcanvas */}
            {showCart && (
                <div className="offcanvas offcanvas-end show" style={{visibility: 'visible', width: '400px'}} tabIndex="-1">
                    <div className="offcanvas-header border-bottom">
                        <h5 className="offcanvas-title">
                            <i className="fas fa-shopping-cart me-2"></i>Shopping Cart
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
                                <div className="p-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                    {cartItems.map((item) => (
                                        <div key={`${item.id}-${item.selectedVariant?.id || 'default'}`} className="d-flex align-items-center border-bottom py-3">
                                            <img 
                                                src={item.image} 
                                                className="rounded me-3" 
                                                alt={item.name}
                                                style={{width: '60px', height: '60px', objectFit: 'cover'}}
                                            />
                                            <div className="flex-grow-1">
                                                <h6 className="mb-1 small">{item.displayName || item.name}</h6>
                                                <small className="text-muted">₱{item.price.toLocaleString()}</small>
                                                <div className="d-flex align-items-center mt-2">
                                                    <button 
                                                        className="btn btn-sm btn-outline-secondary me-2" 
                                                        onClick={() => updateQuantity(item.id, item.selectedVariant?.id, -1)}
                                                        style={{ width: '28px', height: '28px', padding: '0', fontSize: '0.7rem' }}
                                                    >
                                                        <i className="fas fa-minus"></i>
                                                    </button>
                                                    <span className="mx-2 small fw-bold">{item.quantity}</span>
                                                    <button 
                                                        className="btn btn-sm btn-outline-secondary me-2" 
                                                        onClick={() => updateQuantity(item.id, item.selectedVariant?.id, 1)}
                                                        style={{ width: '28px', height: '28px', padding: '0', fontSize: '0.7rem' }}
                                                    >
                                                        <i className="fas fa-plus"></i>
                                                    </button>
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
                                    ))}
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
                                    >
                                        <i className="fas fa-credit-card me-2"></i>Proceed to Checkout
                                    </button>
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