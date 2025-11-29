import React from 'react';
import { Link } from 'react-router-dom';
import omgeesLogo from '../images/omgees.png';

function PublicNavbar() {
    return (
        <nav className="navbar fixed-top navbar-expand-lg navbar-custom shadow">
            <div className="container-fluid">
                <img 
                    src={omgeesLogo} 
                    alt="OMGees Logo" 
                    width="30" 
                    height="24" 
                    className="d-inline-block align-text-top navbar-logo me-2"
                />
                <Link to="/home" className="navbar-brand fw-bold">
                    OMGees
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
                            <Link to="/home" className="nav-link px-3">
                                <i className="fas fa-home me-2"></i>Home
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Login Button */}
                <div className="d-flex align-items-center me-3">
                    <Link to="/login" className="btn btn-outline-primary btn-sm">
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Login
                    </Link>
                </div>
            </div>
        </nav>
    );
}

export default PublicNavbar;