import React, { useState } from 'react';
import { useAuth } from './Authentication';
import { Link, useNavigate } from 'react-router-dom';
import omgeesLogo from './components/images/omgeesLogo.png';
import axios from 'axios';


function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); 

  //to navigate after login
  const { setBackendUser } = useAuth();
  const navigate = useNavigate();


  // Handle form submission for login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/login', {
        email: email,
        password: password
      });
      const data = res.data;
      
      console.log('📡 Login response:', data); // Debug log
      
      if (data.status === "Success") {
        // ✅ Include ALL user fields, especially user_id
        const userData = {
          user_id: data.user.user_id,      // ✅ Critical: Include user_id
          id: data.user.id,                // ✅ Also include id as fallback
          email: data.user.email,
          fullname: data.user.fullname,    // ✅ Use fullname from backend
          name: data.user.name,            // ✅ Also include name
          contact: data.user.contact,      // ✅ Include contact
          phone: data.user.phone,          // ✅ Include phone as fallback
          address: data.user.address,      // ✅ Include address
          type: data.user_type,
          user_type: data.user.user_type   // ✅ Include both formats
        };
        
        console.log('👤 Setting user data:', userData); // Debug log
        
        setBackendUser(userData);

        // Navigation
        if (data.user_type === "admin") {
          navigate('/admin/dashboard');
        } else if (data.user_type === "cashier") {
          navigate('/cashier/create-orders');
        } else if (data.user_type === "inventory_manager") {
          navigate('/inventory/manage');
        } else {
          navigate('/');
        }
      } else {
        setError('Invalid email or password.');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('Server error. Please try again later.');
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center custom-bg-login">
      <div className="row justify-content-center w-100">
        <div className="col-12 col-sm-8 col-md-6 col-lg-4">
          <div className="card shadow-lg border-0 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <div className="card-body p-3">
              {/* Back to Home Button */}
              <div className="text-start mb-2">
                <Link 
                  to="/home" 
                  className="btn btn-sm btn-outline-primary rounded-pill"
                  style={{ fontSize: '0.8rem' }}
                >
                  <i className="fas fa-home me-2"></i>
                  Home
                </Link>
              </div>

              <div className="text-center mb-3">
                <img src={omgeesLogo} alt="OMGees Logo" width="100" height="100" className="d-inline-block align-text-top me-2"/>
                <p className="text-muted small mb-0">Welcome, please sign in</p>
              </div>
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

                {error && (
                  <div className="alert alert-danger py-2 small" role="alert">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    {error}
                  </div>
                )}

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