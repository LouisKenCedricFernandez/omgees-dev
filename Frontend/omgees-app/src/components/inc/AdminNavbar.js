import React from 'react';
import {Link} from 'react-router';
import omgeesLogo from '../images/omgees.png';

function AdminNavbar({user, onLogout}) {
    return (
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
                <div className="container-fluid">
                    <img src={omgeesLogo} alt="OMGees Logo" width="30" height="24" className="d-inline-block align-text-top navbar-logo me-2"/>
                    <Link to="/admin/dashboard" className="navbar-brand fw-bold">OMGees Administrator</Link>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent"
                        aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <Link to="/admin/dashboard" className="nav-link px-3">Dashboard</Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/admin/logs" className="nav-link px-3">Transaction Logs</Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/admin/reports" className="nav-link px-3">Reports</Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/admin/maintenance" className="nav-link px-3">Maintenance</Link>
                            </li>
                        </ul>                                                      
                    </div>
                    <div className="d-flex align-items-center p-2">
                            <button className="btn btn-outline-info btn-sm" onClick={onLogout}>Logout</button>
                    </div>
                </div>
            </nav>
    );
}

export default AdminNavbar;