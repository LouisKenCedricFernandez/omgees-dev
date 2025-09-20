import React, { useState } from 'react';
import { useAuth } from './Authentication';
import { Link } from 'react-router-dom';
import omgeesLogo from './components/images/omgeesLogo.png';

function UserLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); 

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    
    const result = login(email, password);
    
    if (!result.success) {
      setError(result.error);
    }
  };

  const fillDemo = (type) => {
    switch(type) {
      case 'customer':
        setEmail('customer@example.com');
        setPassword('password123');
        break;
      case 'admin':
        setEmail('admin@example.com');
        setPassword('admin123');
        break;
      case 'cashier':
        setEmail('cashier@example.com');
        setPassword('cashier123');
        break;
      case 'inventory':
        setEmail('inventory@example.com');
        setPassword('inventory123');
        break;
      default:
        break;
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center custom-bg-login">
      <div className="row justify-content-center w-100">
        <div className="col-12 col-sm-8 col-md-6 col-lg-4">
          <div className="card shadow-lg border-0 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <div className="card-body p-3">
              <div className="text-center mb-3">
                <img src={omgeesLogo} alt="OMGees Logo" width="100" height="100" className="d-inline-block align-text-top me-2"/>
                <p className="text-muted small mb-0">Welcome, please sign in</p>
              </div>

              <div className="alert alert-info border-0 mb-3 py-2">
                <h6 className="alert-heading fw-bold mb-2 small">Demo Accounts:</h6>
                
                <div className="row g-1">
                  <div className="col-6">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-truncate me-1"><strong>Customer</strong></small>
                      <button 
                        className="btn btn-outline-info btn-sm py-0 px-1"
                        style={{ fontSize: '0.7rem' }}
                        onClick={() => fillDemo('customer')}
                      >
                        Fill
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-6">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-truncate me-1"><strong>Admin</strong></small>
                      <button 
                        className="btn btn-outline-info btn-sm py-0 px-1"
                        style={{ fontSize: '0.7rem' }}
                        onClick={() => fillDemo('admin')}
                      >
                        Fill
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-6">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-truncate me-1"><strong>Cashier</strong></small>
                      <button 
                        className="btn btn-outline-success btn-sm py-0 px-1"
                        style={{ fontSize: '0.7rem' }}
                        onClick={() => fillDemo('cashier')}
                      >
                        Fill
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-6">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-truncate me-1"><strong>Inventory</strong></small>
                      <button 
                        className="btn btn-outline-warning btn-sm py-0 px-1"
                        style={{ fontSize: '0.7rem' }}
                        onClick={() => fillDemo('inventory')}
                      >
                        Fill
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger border-0 py-2 mb-3" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i>
                  <small>{error}</small>
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="mb-2">
                  <label htmlFor="email" className="form-label fw-semibold small">
                    <i className="bi bi-envelope me-1"></i>Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control form-control-lg border-1 shadow-sm"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                    style={{ 
                      fontSize: '0.875rem',
                      backgroundColor: '#ffffff',
                      borderColor: '#dee2e6'
                    }} 
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label fw-semibold small">
                    <i className="bi bi-lock me-1"></i>Password
                  </label>
                  <input
                    type="password"
                    className="form-control form-control-lg border-1 shadow-sm"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                    style={{ 
                      fontSize: '0.875rem',
                      backgroundColor: '#ffffff',
                      borderColor: '#dee2e6'
                    }} 
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg w-100 rounded-pill fw-semibold mb-2"
                  style={{ fontSize: '0.9rem' }}
                >
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Sign In
                </button>
              </form>

              <p className="text-center small mb-0">Don't have an account yet? 
                <Link to="/login/register" className="link-primary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover"> Sign up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserLogin;