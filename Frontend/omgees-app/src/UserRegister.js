import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import omgeesLogo from './components/images/omgeesLogo.png';

function UserRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState('register');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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

  // Step 1: Send verification code
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStep('verify');
        setSuccess('Verification code sent to your email!');
      } else {
        setError(data.message || 'Failed to send verification code');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code and complete registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);

    try {
      const verifyResponse = await fetch('http://localhost:5000/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          code: verificationCode 
        })
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyData.valid) {
        setError('Invalid verification code. Please try again.');
        setLoading(false);
        return;
      }

      const { confirmPassword, ...submitData } = formData;

      const response = await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...submitData,
          user_type: 'customer',
          status: 'active',
          verified: true
        })
      });

      const data = await response.json();
      
      if (data === "Error") {
        setError('Registration failed. Please try again.');
      } else {
        setSuccess('Account created successfully!');
        setStep('success');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('New verification code sent to your email!');
        setVerificationCode('');
      } else {
        setError(data.message || 'Failed to resend code');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (step === 'success') {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center custom-bg-login">
        <div className="row justify-content-center w-100">
          <div className="col-12 col-sm-8 col-md-6 col-lg-4">
            <div className="card shadow-lg border-0 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
              <div className="card-body p-4 text-center">
                <div className="mb-4">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
                </div>
                <h4 className="text-success mb-3">Registration Successful!</h4>
                <p className="text-muted mb-4">
                  Your account has been verified and created successfully.
                  Redirecting to login...
                </p>
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verification screen
  if (step === 'verify') {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center custom-bg-login">
        <div className="row justify-content-center w-100">
          <div className="col-12 col-sm-8 col-md-6 col-lg-4">
            <div className="card shadow-lg border-0 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <img src={omgeesLogo} alt="OMGees Logo" width="80" height="80" className="mb-2"/>
                  <h5 className="mb-2">Verify Your Email</h5>
                  <p className="text-muted small mb-0">
                    We've sent a 6-digit verification code to<br/>
                    <strong>{formData.email}</strong>
                  </p>
                  <p className="text-primary small mt-2 mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    Please check your email inbox (and spam folder)
                  </p>
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
                <div>
                  <div className="mb-3">
                    <label htmlFor="verificationCode" className="form-label fw-semibold small">
                      Enter Verification Code
                    </label>
                    <input
                      type="text"
                      className="form-control text-center shadow-sm"
                      id="verificationCode"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength="6"
                      style={{ 
                        fontSize: '1.5rem',
                        letterSpacing: '0.5rem',
                        backgroundColor: '#ffffff'
                      }}
                    />
                    <small className="text-muted d-block mt-1">
                      Enter the 6-digit code from your email
                    </small>
                  </div>

                  <button
                    onClick={handleVerifyAndRegister}
                    className="btn btn-primary btn-lg w-100 rounded-pill fw-semibold mb-2"
                    disabled={loading || verificationCode.length !== 6}
                    style={{ fontSize: '0.9rem' }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Verify & Create Account
                      </>
                    )}
                  </button>

                  <div className="text-center mb-0">
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none p-1"
                      onClick={handleResendCode}
                      disabled={loading}
                      style={{ fontSize: '0.75rem' }}
                    >
                      <i className="bi bi-arrow-clockwise me-1" style={{ fontSize: '0.75rem' }}></i>
                      Didn't receive code? Resend
                    </button>
                  </div>
                </div>

                <p className="text-center mb-0">
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none p-1"
                    onClick={() => setStep('register')}
                    style={{ fontSize: '0.75rem' }}
                  >
                    <i className="bi bi-arrow-left me-1" style={{ fontSize: '0.75rem' }}></i>
                    Back to Registration
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration form main screen
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
                  className="btn btn-primary btn-lg w-100 rounded-pill fw-semibold mb-2"
                  disabled={loading}
                  style={{ fontSize: '0.9rem' }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-plus me-2"></i>
                      Verify Email & Register
                    </>
                  )}
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