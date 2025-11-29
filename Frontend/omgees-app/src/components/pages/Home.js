import React, { useState } from 'react';
import Slider from '../inc/Slider';
import About from './About';
import Ingredients from './products/Ingredients';
import Tools from './products/Tools';
import Packaging from './products/Packaging';

function Home({ user, onLogout, cartItems, onUpdateCart, searchQuery = '' }) {
    const [activeTab, setActiveTab] = useState('ingredients');

    return (
        <>
            <div className="main-home">
                <section className="slider-section">
                    <Slider />
                </section>
                
                <section className="about-section">
                    <About />
                </section>
            </div>

            {/* Product Tabs Section - Outside main-home */}
            <section className="products-section py-3">
                <div className="container-fluid">
                    {/* Tabs Navigation */}
                    <ul className="nav nav-tabs nav-fill mb-0" role="tablist" style={{fontSize: '0.9rem'}}>
                        <li className="nav-item" role="presentation">
                            <button 
                                className={`nav-link py-2 ${activeTab === 'ingredients' ? 'active' : ''}`}
                                onClick={() => setActiveTab('ingredients')}
                                type="button"
                                aria-selected={activeTab === 'ingredients'}
                            >
                                <i className="fas fa-leaf me-1"></i>
                                Ingredients
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button 
                                className={`nav-link py-2 ${activeTab === 'tools' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tools')}
                                type="button"
                                aria-selected={activeTab === 'tools'}
                            >
                                <i className="fas fa-tools me-1"></i>
                                Tools
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button 
                                className={`nav-link py-2 ${activeTab === 'packaging' ? 'active' : ''}`}
                                onClick={() => setActiveTab('packaging')}
                                type="button"
                                aria-selected={activeTab === 'packaging'}
                            >
                                <i className="fas fa-box me-1"></i>
                                Packaging
                            </button>
                        </li>
                    </ul>

                    {/* Tab Content */}
                    <div className="tab-content">
                        {activeTab === 'ingredients' && (
                            <Ingredients 
                                cartItems={cartItems}
                                onUpdateCart={onUpdateCart}
                                searchQuery={searchQuery}
                            />
                        )}
                        {activeTab === 'tools' && (
                            <Tools 
                                cartItems={cartItems}
                                onUpdateCart={onUpdateCart}
                                searchQuery={searchQuery}
                            />
                        )}
                        {activeTab === 'packaging' && (
                            <Packaging 
                                cartItems={cartItems}
                                onUpdateCart={onUpdateCart}
                                searchQuery={searchQuery}
                            />
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}

export default Home;