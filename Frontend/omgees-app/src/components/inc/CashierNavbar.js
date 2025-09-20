import React from 'react';
import { Link } from 'react-router-dom';
import omgeesLogo from '../images/omgees.png';

function CashierNavbar({ user, onLogout }) {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary fixed-top">
            <div className="container-fluid">
                <img src={omgeesLogo} alt="OMGees Logo" width="30" height="24" className="d-inline-block align-text-top me-2"/>
                <Link to="/cashier/create-orders" className="navbar-brand fw-bold">OMGees Cashier</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent"
                    aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link to="/cashier/create-orders" className="nav-link px-3">Create Order</Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/cashier/manage-orders" className="nav-link px-3">Manage Orders</Link>
                        </li>
                    </ul>
                </div>
                <div className="d-flex align-items-center p-2">
                    <span className="me-3 text-white">Welcome, {user?.name || 'User'}!</span>
                    <button className="btn btn-outline-light btn-sm" onClick={onLogout}>Logout</button>
                </div>
            </div>
        </nav>
    );
}

export default CashierNavbar;