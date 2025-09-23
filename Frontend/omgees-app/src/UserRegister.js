import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import omgeesLogo from './components/images/omgeesLogo.png';

function UserRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email address is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Address is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

   // Handle form submission for registration -nt
  const handleRegister = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');

  if (!validateForm()) {
    return;
  }

  // Remove confirmPassword before sending
  const { confirmPassword, ...submitData } = formData;

  try {
    const response = await fetch('http://localhost:5000/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData)
    });
    const data = await response.json();
    if (data === "Error") {
      setError('Registration failed. Please try again.');
    } else {
      setSuccess('Account created successfully! You can now sign in.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: '',
        user_type: 'customer',
        status: 'active'
      });
    }
  } catch (err) {
    setError('Server error. Please try again later.');
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
                <p className="text-muted small mb-0">Create your account</p>
              </div>

              {error && (
                <div className="alert alert-danger border-0 py-2 mb-3" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i>
                  <small>{error}</small>
                </div>
              )}

              {success && (
                <div className="alert alert-success border-0 py-2 mb-3" role="alert">
                  <i className="bi bi-check-circle-fill me-1"></i>
                  <small>{success}</small>
                </div>
              )}

              <form onSubmit={handleRegister}>
                <div className="mb-2">
                  <label htmlFor="name" className="form-label fw-semibold small">
                    <i className="bi bi-person me-1"></i>Full Name
                  </label>
                  <input
                    type="text"
                    className="form-control border-1 shadow-sm"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    style={{ 
                      fontSize: '0.875rem',
                      backgroundColor: '#ffffff',
                      borderColor: '#dee2e6'
                    }}
                  />
                </div>

                <div className="mb-2">
                  <label htmlFor="email" className="form-label fw-semibold small">
                    <i className="bi bi-envelope me-1"></i>Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control border-1 shadow-sm"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    style={{ 
                      fontSize: '0.875rem',
                      backgroundColor: '#ffffff',
                      borderColor: '#dee2e6'
                    }}
                  />
                </div>

                <div className="row mb-2">
                  <div className="col-6">
                    <label htmlFor="phone" className="form-label fw-semibold small">
                      <i className="bi bi-telephone me-1"></i>Phone
                    </label>
                    <input
                      type="tel"
                      className="form-control border-1 shadow-sm"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+63 912 345 6789"
                      style={{ 
                        fontSize: '0.875rem',
                        backgroundColor: '#ffffff',
                        borderColor: '#dee2e6'
                      }}
                    />
                  </div>

                  <div className="col-6">
                    <label htmlFor="address" className="form-label fw-semibold small">
                      <i className="bi bi-geo-alt me-1"></i>Address
                    </label>
                    <input
                      type="text"
                      className="form-control border-1 shadow-sm"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Your address"
                      style={{ 
                        fontSize: '0.875rem',
                        backgroundColor: '#ffffff',
                        borderColor: '#dee2e6'
                      }}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-6">
                    <label htmlFor="password" className="form-label fw-semibold small">
                      <i className="bi bi-lock me-1"></i>Password
                    </label>
                    <input
                      type="password"
                      className="form-control border-1 shadow-sm"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password"
                      style={{ 
                        fontSize: '0.875rem',
                        backgroundColor: '#ffffff',
                        borderColor: '#dee2e6'
                      }}
                    />
                  </div>

                  <div className="col-6">
                    <label htmlFor="confirmPassword" className="form-label fw-semibold small">
                      <i className="bi bi-lock-fill me-1"></i>Confirm
                    </label>
                    <input
                      type="password"
                      className="form-control border-1 shadow-sm"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm password"
                      style={{ 
                        fontSize: '0.875rem',
                        backgroundColor: '#ffffff',
                        borderColor: '#dee2e6'
                      }}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-success btn-lg w-100 rounded-pill fw-semibold mb-2"
                  style={{ fontSize: '0.9rem' }}
                >
                  <i className="bi bi-person-plus me-2"></i>
                  Create Account
                </button>
              </form>

              <p className="text-center small mb-0">Already have an account? 
                <Link to="/login" className="link-primary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover"> Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserRegister;