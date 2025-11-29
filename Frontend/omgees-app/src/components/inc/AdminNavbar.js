import React from 'react';
import { Link } from 'react-router-dom';
import omgeesLogo from '../images/omgees.png';

function AdminNavbar({ user, onLogout }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div className="container-fluid">
        <img 
          src={omgeesLogo} 
          alt="OMGees Logo" 
          width="30" 
          height="24" 
          className="d-inline-block align-text-top navbar-logo me-2"
        />
        <Link to="/admin/dashboard" className="navbar-brand fw-bold">
          OMGees Administrator
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
              <Link to="/admin/dashboard" className="nav-link px-3">
                <i className="fas fa-tachometer-alt me-2"></i>Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/admin/logs" className="nav-link px-3">
                <i className="fas fa-clipboard-list me-2"></i>Transaction Logs
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/admin/reports" className="nav-link px-3">
                <i className="fas fa-chart-bar me-2"></i>Reports
              </Link>
            </li>
            
            {/* MAINTENANCE DROPDOWN */}
            <li className="nav-item dropdown">
              <a 
                className="nav-link dropdown-toggle px-3" 
                href="#" 
                id="maintenanceDropdown" 
                role="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <i className="fas fa-cogs me-2"></i>Maintenance
              </a>
              <ul className="dropdown-menu dropdown-menu-dark" aria-labelledby="maintenanceDropdown">
                <li>
                  <Link to="/admin/maintenance/users" className="dropdown-item">
                    <i className="fas fa-users me-2"></i>Users
                  </Link>
                </li>
                <li>
                  <Link to="/admin/maintenance/products" className="dropdown-item">
                    <i className="fas fa-box me-2"></i>Products
                  </Link>
                </li>
                <li>
                  <Link to="/admin/maintenance/suppliers" className="dropdown-item">
                    <i className="fas fa-truck me-2"></i>Suppliers
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </div>
        
        <div className="d-flex align-items-center p-2">
          {user && (
            <span className="text-white me-3">
              <i className="fas fa-user-shield me-2"></i>
              {user.fullname || user.name}
            </span>
          )}
          <button className="btn btn-outline-info btn-sm" onClick={onLogout}>
            <i className="fas fa-sign-out-alt me-2"></i>Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default AdminNavbar;