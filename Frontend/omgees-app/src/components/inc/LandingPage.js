import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from './Slider';
import About from '../pages/About';
import Ingredients from '../pages/products/Ingredients';
import Tools from '../pages/products/Tools';
import Packaging from '../pages/products/Packaging';

function LandingPage() {
    const [activeTab, setActiveTab] = useState('ingredients');
    const [showAuthOverlay, setShowAuthOverlay] = useState(false);
    const navigate = useNavigate();

    const handleProductInteraction = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowAuthOverlay(true);
    };

    const mockUpdateCart = (items) => {
        setShowAuthOverlay(true);
    };

    return (
        <>
            <div className="main-home" onClick={handleProductInteraction}>
                <section className="slider-section">
                    <Slider />
                </section>
                
                <section className="about-section">
                    <About />
                </section>
            </div>

            {/* Product Tabs Section */}
            <section className="products-section py-3" onClick={handleProductInteraction}>
                <div className="container-fluid">
                    <ul className="nav nav-tabs nav-fill mb-0" role="tablist" style={{fontSize: '0.9rem'}}>
                        <li className="nav-item" role="presentation">
                            <button 
                                className={`nav-link py-2 ${activeTab === 'ingredients' ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTab('ingredients');
                                }}
                                type="button"
                            >
                                <i className="fas fa-leaf me-1"></i>
                                Ingredients
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button 
                                className={`nav-link py-2 ${activeTab === 'tools' ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTab('tools');
                                }}
                                type="button"
                            >
                                <i className="fas fa-tools me-1"></i>
                                Tools
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button 
                                className={`nav-link py-2 ${activeTab === 'packaging' ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTab('packaging');
                                }}
                                type="button"
                            >
                                <i className="fas fa-box me-1"></i>
                                Packaging
                            </button>
                        </li>
                    </ul>

                    <div className="tab-content" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        {activeTab === 'ingredients' && (
                            <Ingredients 
                                cartItems={[]}
                                onUpdateCart={mockUpdateCart}
                            />
                        )}
                        {activeTab === 'tools' && (
                            <Tools 
                                cartItems={[]}
                                onUpdateCart={mockUpdateCart}
                            />
                        )}
                        {activeTab === 'packaging' && (
                            <Packaging 
                                cartItems={[]}
                                onUpdateCart={mockUpdateCart}
                            />
                        )}
                    </div>
                </div>
            </section>

            {showAuthOverlay && (
                <>
                    <div 
                        className="position-fixed top-0 start-0 w-100 h-100 bg-dark"
                        style={{ 
                            zIndex: 9998, 
                            opacity: 0.85,
                            backdropFilter: 'blur(4px)'
                        }}
                        onClick={() => setShowAuthOverlay(false)}
                    ></div>
                    <div 
                        className="position-fixed top-50 start-50 translate-middle bg-white rounded-4 shadow-lg"
                        style={{ 
                            zIndex: 9999, 
                            maxWidth: '380px', 
                            width: '90%',
                            padding: '2rem 2.5rem',
                            animation: 'fadeInScale 0.3s ease-out'
                        }}
                    >
                        <div className="text-center">
                            <div 
                                className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 mb-3"
                                style={{ width: '60px', height: '60px' }}
                            >
                                <i className="fas fa-lock text-primary" style={{ fontSize: '1.5rem' }}></i>
                            </div>
                            <h5 className="fw-bold mb-2" style={{ fontSize: '1.25rem' }}>Sign In Required</h5>
                            <p className="text-muted mb-4" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                                Please sign in or create an account to browse products and place orders.
                            </p>
                            <div className="d-grid gap-2">
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => navigate('/login')}
                                    style={{ 
                                        padding: '0.65rem 1rem',
                                        fontSize: '0.9rem',
                                        fontWeight: '500'
                                    }}
                                >
                                    <i className="fas fa-sign-in-alt me-2"></i>
                                    Sign In
                                </button>
                                <button 
                                    className="btn btn-outline-primary"
                                    onClick={() => navigate('/login/register')}
                                    style={{ 
                                        padding: '0.65rem 1rem',
                                        fontSize: '0.9rem',
                                        fontWeight: '500'
                                    }}
                                >
                                    <i className="fas fa-user-plus me-2"></i>
                                    Create Account
                                </button>
                                <button 
                                    className="btn btn-link text-muted mt-1"
                                    onClick={() => setShowAuthOverlay(false)}
                                    style={{ 
                                        fontSize: '0.8rem',
                                        textDecoration: 'none',
                                        padding: '0.25rem'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                    <style>{`
                        @keyframes fadeInScale {
                            from {
                                opacity: 0;
                                transform: translate(-50%, -50%) scale(0.9);
                            }
                            to {
                                opacity: 1;
                                transform: translate(-50%, -50%) scale(1);
                            }
                        }
                    `}</style>
                </>
            )}
        </>
    );
}

export default LandingPage;