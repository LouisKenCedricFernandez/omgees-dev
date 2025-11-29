import React from 'react';
import {Link} from 'react-router-dom'; 

function Contact() {
    return (
    <footer className="footer-custom text-dark py-5 mt-5">
      <div className="container">
        <div className="row">

          {/* First Column - Company Info */}
          <div className="col-lg-4 col-md-6 mb-4">
            <h5 className="mb-3">OMGees Bakery Supplies Trading</h5>
            <p className="mb-3">
              We are dedicated to providing excellent services and innovative solutions 
              to help your business grow and succeed in today's competitive market.
            </p>
            <div className="d-flex">
              <a href="/" className="text-dark me-3" aria-label="Facebook">
                <i className="fab fa-facebook-f fa-2x"></i>
              </a>
              <a href="/" className="text-dark" aria-label="Instagram">
                <i className="fab fa-instagram fa-2x"></i>
              </a>
            </div>
          </div>

          {/* Second Column - Quick Links */}
          <div className="col-lg-4 col-md-6 mb-4">
            <h5 className="mb-3">Quick Links</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="text-dark text-decoration-none">
                  <i className="fas fa-angle-right me-2"></i>Home
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/products/ingredients" className="text-dark text-decoration-none">
                  <i className="fas fa-angle-right me-2"></i>Ingredients
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/products/tools" className="text-dark text-decoration-none">
                  <i className="fas fa-angle-right me-2"></i>Tools
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/products/packaging" className="text-dark text-decoration-none">
                  <i className="fas fa-angle-right me-2"></i>Packaging
                </Link>
              </li>
            </ul>
          </div>

          {/* Third Column - Contact Info */}
          <div className="col-lg-4 col-md-12 mb-4">
            <h5 className="mb-3">Contact Info</h5>
            <div className="mb-3">
              <i className="fas fa-map-marker-alt me-3"></i>
              <span>163 Pontiac Street, Fairview<br />Quezon City, NCR, Philippines</span>
            </div>
            <div className="mb-3">
              <i className="fas fa-phone me-3"></i>
              <span>+639-06-512-8417</span>
            </div>
            <div className="mb-3">
              <i className="fas fa-clock me-3"></i>
              <span>Mon - Sat: 8:00 AM - 7:00 PM</span>
            </div>
            <div className="mb-3">
              <i className="fas fa-clock me-3"></i>
              <span>Sun: 9:00 AM - 3:00 PM</span>
            </div>
          </div>
        </div>

        {/* Copyright Row */}
        <hr className="my-4" />
        <div className="row">
          <div className="col-md-6">
            <p className="mb-0">
              &copy; 2024 OMGees Bakery Supplies Trading. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
    );
}

export default Contact;