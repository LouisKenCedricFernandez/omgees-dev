import React from 'react';
import { Link } from 'react-router-dom';
import omgeesLogo from '../images/omgees.png';

function InventoryNavbar({ user, onLogout }) {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-success fixed-top">
            <div className="container-fluid">
                <img 
                    src={omgeesLogo} 
                    alt="OMGees Logo" 
                    width="30" 
                    height="24" 
                    className="d-inline-block align-text-top me-2"
                />
                <Link to="/inventory/manage" className="navbar-brand fw-bold">
                    OMGees Inventory
                </Link>
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
                            <Link to="/inventory/manage" className="nav-link px-3">
                                <i className="fas fa-boxes me-2"></i>Overview
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/inventory/delivery" className="nav-link px-3">
                                <i className="fas fa-truck-loading me-2"></i>Inbound Delivery
                            </Link>
                        </li>
                    </ul>
                </div>
                
                <div className="d-flex align-items-center p-2">
                    {user && (
                        <span className="text-white me-3">
                            <i className="fas fa-user-cog me-2"></i>
                            {user.fullname || user.name}
                        </span>
                    )}
                    <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
                        <i className="fas fa-sign-out-alt me-2"></i>Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default InventoryNavbar;