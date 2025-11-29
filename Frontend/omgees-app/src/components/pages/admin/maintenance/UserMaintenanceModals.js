import React, { useState } from 'react';
import axios from 'axios';

function UserMaintenanceModals({
  showAddModal,
  setShowAddModal,
  selectedUser,
  setSelectedUser,
  onUserUpdated
}) {

  // Add User Modal
  const AddUserModal = () => {
    const [formData, setFormData] = useState({
      fullname: '',
      email: '',
      contact: '',
      address: '',
      password: '',
      confirmPassword: '',
      user_type: 'customer',
      status: 'active'
    });

    const [passwordError, setPasswordError] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        return;
      }

      try {
        const response = await axios.post('http://localhost:5000/add-users', {
          fullname: formData.fullname,
          email: formData.email,
          contact: formData.contact,
          address: formData.address,
          password: formData.password,
          user_type: formData.user_type,
          status: formData.status
        });

        if (response.data) {
          alert('User added successfully!');
          setShowAddModal(false);
          
          // Reset form
          setFormData({
            fullname: '',
            email: '',
            contact: '',
            address: '',
            password: '',
            confirmPassword: '',
            user_type: 'customer',
            status: 'active'
          });
          setPasswordError('');

          // Refresh users list
          if (onUserUpdated) {
            await onUserUpdated();
          }

          // Activity log
          await axios.post('http://localhost:5000/activity-log', {
            activity: 'Added New User',
            user: 'admin',
            type: 'user',
            details: `User: ${formData.fullname} (${formData.email}), Type: ${formData.user_type}`,
            timestamp: new Date().toISOString()
          }).catch(err => console.error('Activity log error:', err));
        }
      } catch (error) {
        console.error('Error adding user:', error);
        alert('Failed to add user. Please try again.');
      }
    };

    if (!showAddModal) return null;

    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add New User</h5>
              <button type="button" className="btn-close" onClick={() => {
                setShowAddModal(false);
                setPasswordError('');
              }}></button>
            </div>
            <div className="modal-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.fullname}
                    onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="e.g., +63 912 345 6789"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">User Type *</label>
                  <select
                    className="form-select"
                    value={formData.user_type}
                    onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                    required
                  >
                    <option value="customer">Customer</option>
                    <option value="cashier">Cashier</option>
                    <option value="inventory_manager">Inventory Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Address</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
                ></textarea>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      setPasswordError('');
                    }}
                    required
                    minLength="6"
                  />
                  <small className="text-muted">Minimum 6 characters</small>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Confirm Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      setPasswordError('');
                    }}
                    required
                  />
                </div>
              </div>

              {passwordError && (
                <div className="alert alert-danger" role="alert">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  {passwordError}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
                <small className="text-muted">
                  {formData.status === 'active' 
                    ? 'User can log in and access the system' 
                    : 'User cannot log in (account suspended)'}
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => {
                setShowAddModal(false);
                setPasswordError('');
              }}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSubmit}>
                <i className="fas fa-user-plus me-2"></i>
                Add User
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // View User Details Modal
  const ViewUserModal = () => {
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getUserTypeLabel = (type) => {
      const labels = {
        'inventory_manager': 'Inventory Manager',
        'cashier': 'Cashier',
        'admin': 'Admin',
        'customer': 'Customer'
      };
      return labels[type] || type;
    };

    const toggleUserStatus = async () => {
      if (!selectedUser) return;

      const newStatus = selectedUser.status === 'active' ? 'archived' : 'active';
      const confirmMessage = newStatus === 'archived'
        ? 'Are you sure you want to archive this user? They will not be able to log in.'
        : 'Are you sure you want to restore this user? They will be able to log in again.';

      if (!window.confirm(confirmMessage)) return;

      try {
        const updatedUser = { ...selectedUser, status: newStatus };
        await axios.put(`http://localhost:5000/users/${selectedUser.user_id}`, updatedUser);

        alert(`User ${newStatus === 'active' ? 'restored' : 'archived'} successfully!`);
        setSelectedUser(null);

        // Refresh users list
        if (onUserUpdated) {
          await onUserUpdated();
        }

        // Activity log
        await axios.post('http://localhost:5000/activity-log', {
          activity: newStatus === 'active' ? 'Restored User' : 'Archived User',
          user: 'admin',
          type: 'user',
          details: `User: ${selectedUser.fullname} (${selectedUser.email})`,
          timestamp: new Date().toISOString()
        }).catch(err => console.error('Activity log error:', err));
      } catch (error) {
        console.error('Error updating user status:', error);
        alert('Failed to update user status');
      }
    };

    if (!selectedUser) return null;

    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">User Details - {selectedUser.fullname}</h5>
              <button type="button" className="btn-close" onClick={() => setSelectedUser(null)}></button>
            </div>
            <div className="modal-body">
              <div className="row mb-4">
                <div className="col-md-6">
                  <h6 className="text-primary mb-3">
                    <i className="fas fa-user me-2"></i>
                    Basic Information
                  </h6>
                  <table className="table table-sm table-borderless">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}><strong>User ID:</strong></td>
                        <td>#{selectedUser.user_id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted"><strong>Full Name:</strong></td>
                        <td>{selectedUser.fullname}</td>
                      </tr>
                      <tr>
                        <td className="text-muted"><strong>Email:</strong></td>
                        <td>{selectedUser.email}</td>
                      </tr>
                      <tr>
                        <td className="text-muted"><strong>Contact:</strong></td>
                        <td>{selectedUser.contact || 'Not provided'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted"><strong>User Type:</strong></td>
                        <td>
                          <span className="badge bg-info">
                            {getUserTypeLabel(selectedUser.user_type)}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6">
                  <h6 className="text-primary mb-3">
                    <i className="fas fa-info-circle me-2"></i>
                    Account Status
                  </h6>
                  <table className="table table-sm table-borderless">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}><strong>Status:</strong></td>
                        <td>
                          <span className={`badge ${selectedUser.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                            {selectedUser.status === 'active' ? 'Active' : 'Archived'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted"><strong>Created:</strong></td>
                        <td>{formatDate(selectedUser.user_created)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted"><strong>Last Login:</strong></td>
                        <td>
                          {selectedUser.user_lastlogin 
                            ? formatDate(selectedUser.user_lastlogin)
                            : <span className="text-muted">Never logged in</span>
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedUser.address && (
                <div className="row">
                  <div className="col-12">
                    <h6 className="text-primary mb-2">
                      <i className="fas fa-map-marker-alt me-2"></i>
                      Address
                    </h6>
                    <div className="alert alert-light mb-0">
                      {selectedUser.address}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className={`btn ${selectedUser.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                onClick={toggleUserStatus}
              >
                <i className={`fas ${selectedUser.status === 'active' ? 'fa-archive' : 'fa-undo'} me-2`}></i>
                {selectedUser.status === 'active' ? 'Archive User' : 'Restore User'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <AddUserModal />
      <ViewUserModal />
    </>
  );
}

export default UserMaintenanceModals;