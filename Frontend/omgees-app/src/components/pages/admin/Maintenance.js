import React, { useState, useMemo, useEffect } from 'react';

import axios from 'axios';

function Maintenance() {
  const [dbusers, setDbUsers] = useState([]);
  // Filter states
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

   // Fetch users on mount -nt
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/users');
        setDbUsers(res.data);
      } catch (error) {
        console.error("Error fetching users:", error);
        setDbUsers([]);
      }
    };

    fetchUsers();
  }, []);

// Get unique user types for filter -nt
const userTypes = useMemo(() => {
  return [...new Set(dbusers.map(user => user.type))];
}, [dbusers]);

// Filter users
const filteredUsers = useMemo(() => {
  return dbusers.filter(user => {
    const typeMatch = userTypeFilter === 'all' || user.type === userTypeFilter;
    const statusMatch = statusFilter === 'all' || user.status === statusFilter;
    const searchMatch = !searchTerm ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return typeMatch && statusMatch && searchMatch;
  });
}, [dbusers, userTypeFilter, statusFilter, searchTerm]);

  // Helper functions -
  const resetFilters = () => {
    setUserTypeFilter('all');
    setStatusFilter('active');
    setSearchTerm('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

 // Add new user-nt
// ...existing code...
const addUser = async (newUser) => {
  try {
    // Map frontend fields to backend fields
    const payload = {
      fullname: newUser.name,
      email: newUser.email,
      contact: newUser.phone,
      address: newUser.address,
      password: newUser.password,
      user_type: newUser.type,
      status: 'active'
    };
    const res = await axios.post('http://localhost:5000/add-users', payload);
    setDbUsers((prev) => [...prev, res.data]);
  } catch (err) {
    console.error("Error adding user:", err);
  }
};
// ...existing code...

// Update user details -nt
const updateUser = async (updatedUser) => {
  try {
    await axios.put(`http://localhost:5000/users`, updatedUser);
    setDbUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
  } catch (err) {
    console.error("Error updating user:", err);
  }
};

// Toggle user active/archived status -nt
const toggleUserStatus = async (id) => {
  try {
    const user = dbusers.find((u) => u.id === id);
    const newStatus = user.status === "active" ? "archived" : "active";
    const updatedUser = { ...user, status: newStatus };
    await axios.put(`http://localhost:5000/users`, updatedUser);
    setDbUsers((prev) =>
      prev.map((u) => (u.id === id ? updatedUser : u))
    );
  } catch (err) {
    console.error("Error toggling user status:", err);
  }
};

  const getUserTypeBadge = (type) => {
    const badges = {
      'admin': 'bg-danger',
      'cashier': 'bg-success',
      'inventory_manager': 'bg-warning text-dark',
      'customer': 'bg-info'
    };
    return badges[type] || 'bg-secondary';
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

  // Components
  const renderFilters = () => (
    <div className="row g-3 align-items-end">
      <div className="col-md-3">
        <label className="form-label fw-semibold">Search Users</label>
        <input 
          type="text"
          className="form-control"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="col-md-3">
        <label className="form-label fw-semibold">User Type</label>
        <select 
          className="form-select"
          value={userTypeFilter}
          onChange={(e) => setUserTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          {userTypes.map(type => (
            <option key={type} value={type}>
              {getUserTypeLabel(type)}
            </option>
          ))}
        </select>
      </div>
      <div className="col-md-3">
        <label className="form-label fw-semibold">Status</label>
        <select 
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="archived">Archived Only</option>
        </select>
      </div>
      <div className="col-md-3">
        <div className="d-flex gap-2">
          <button className="btn btn-outline-danger" onClick={resetFilters}>
            <i className="bi bi-arrow-clockwise"></i> Reset
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <i className="bi bi-person-plus"></i> Add User
          </button>
        </div>
      </div>
    </div>
  );
  
  const renderTableHeader = () => (
    <thead className="table-dark sticky-top">
      <tr>
        <th scope="col">User</th>
        <th scope="col" className="text-center">Type</th>
        <th scope="col" className="text-center">Status</th>
        <th scope="col" className="text-center">Created</th>
        <th scope="col" className="text-center">Last Login</th>
        <th scope="col" className="text-center">Actions</th>
      </tr>
    </thead>
  );

  const renderTableRow = (user) => (
    <tr key={user.id} className={user.status === 'archived' ? 'table-secondary' : ''}>
      <td>
        <div>
          <div className="fw-semibold">{user.name}</div>
          <small className="text-muted">{user.email}</small>
          {user.phone && <div><small className="text-muted">{user.phone}</small></div>}
        </div>
      </td>
      <td className="text-center">
        <span className={`badge ${getUserTypeBadge(user.type)}`}>
          {getUserTypeLabel(user.type)}
        </span>
      </td>
      <td className="text-center">
        <span className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
          {user.status === 'active' ? 'Active' : 'Archived'}
        </span>
      </td>
      <td className="text-center">
        <small>{formatDate(user.createdDate)}</small>
      </td>
      <td className="text-center">
        <small>{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</small>
      </td>
      <td className="text-center">
        <div className="btn-group" role="group">
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={() => setSelectedUser(user)}
            title="View Details"
          >
            <i className="fas fa-eye"></i>
          </button>
          <button 
            className="btn btn-sm btn-outline-warning"
            onClick={() => setEditingUser(user)}
            title="Edit User"
          >
            <i className="fas fa-edit"></i>
          </button>
          <button 
          className={`btn btn-sm ${user.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
          onClick={() => toggleUserStatus(user.id)} // Use toggleUserStatus from useAuth
          title={user.status === 'active' ? 'Archive User' : 'Restore User'}
          >
          <i className={`fas ${user.status === 'active' ? 'fa-archive' : 'fa-undo'}`}></i>
        </button>
        </div>
      </td>
    </tr>
  );

  const renderEmptyState = () => (
    <tr>
      <td colSpan="6" className="text-center py-5 text-muted">
        <i className="bi bi-people fs-1 d-block mb-3"></i>
        <h5>No users found</h5>
        <p>Try adjusting your filters or search terms</p>
      </td>
    </tr>
  );

  // Modals
  const AddUserModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      type: 'customer',
      phone: '',
      address: '',
      password: ''
    });

    const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.password) {
        addUser(formData); // Use the addUser from useAuth
        setFormData({
        name: '',
        email: '',
        type: 'customer',
        phone: '',
        address: '',
        password: ''
        });
        setShowAddModal(false); // Close modal after adding
    }
    };

    if (!showAddModal) return null;

    return (
      <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add New User</h5>
              <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">User Type *</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="customer">Customer</option>
                      <option value="cashier">Cashier</option>
                      <option value="inventory_manager">Inventory Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="+63 9XX XXX XXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const EditUserModal = () => {
    const [formData, setFormData] = useState(editingUser || {});

    const handleSubmit = (e) => {
    e.preventDefault();
    updateUser(formData); // Use updateUser from useAuth
    setEditingUser(null); // Close modal after updating
    };

    if (!editingUser) return null;

    return (
      <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit User - {editingUser.name}</h5>
              <button type="button" className="btn-close" onClick={() => setEditingUser(null)}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">User Type</label>
                    <select
                      className="form-select"
                      value={formData.type || 'customer'}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="customer">Customer</option>
                      <option value="cashier">Cashier</option>
                      <option value="inventory_manager">Inventory Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  ></textarea>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const UserDetailsModal = () => {
    if (!selectedUser) return null;

    return (
      <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">User Details - {selectedUser.name}</h5>
              <button type="button" className="btn-close" onClick={() => setSelectedUser(null)}></button>
            </div>
            <div className="modal-body">
              <div className="row mb-4">
                <div className="col-md-6">
                  <h6>Basic Information</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td><strong>User ID:</strong></td>
                        <td>#{selectedUser.id}</td>
                      </tr>
                      <tr>
                        <td><strong>Name:</strong></td>
                        <td>{selectedUser.name}</td>
                      </tr>
                      <tr>
                        <td><strong>Email:</strong></td>
                        <td>{selectedUser.email}</td>
                      </tr>
                      <tr>
                        <td><strong>Phone:</strong></td>
                        <td>{selectedUser.phone || 'Not provided'}</td>
                      </tr>
                      <tr>
                        <td><strong>User Type:</strong></td>
                        <td>
                          <span className={`badge ${getUserTypeBadge(selectedUser.type)}`}>
                            {getUserTypeLabel(selectedUser.type)}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6">
                  <h6>Account Status</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td><strong>Status:</strong></td>
                        <td>
                          <span className={`badge ${selectedUser.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                            {selectedUser.status === 'active' ? 'Active' : 'Archived'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Created:</strong></td>
                        <td>{formatDate(selectedUser.createdDate)}</td>
                      </tr>
                      <tr>
                        <td><strong>Last Login:</strong></td>
                        <td>{selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never logged in'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedUser.address && (
                <div className="row">
                  <div className="col-12">
                    <h6>Address</h6>
                    <p className="text-muted">{selectedUser.address}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedUser(null)}>
                Close
              </button>
              <button 
                type="button" 
                className="btn btn-warning" 
                onClick={() => {
                  setEditingUser(selectedUser);
                  setSelectedUser(null);
                }}
              >
                Edit User
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid bg-light min-vh-100">
      <div className="container py-5">
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              {/* Header */}
              <div className="card-header bg-white border-0 pb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="mb-0">Maintenance</h2>
                  <span className="badge bg-primary">{filteredUsers.length}</span>
                </div>
                {renderFilters()}
              </div>
              
              {/* Table */}
              <div className="card-body p-0 mt-3">
                <div className="table-responsive" style={{maxHeight: '500px', overflowY: 'auto'}}>
                  <table className="table table-hover mb-0">
                    {renderTableHeader()}
                    <tbody>
                      {filteredUsers.length > 0 
                        ? filteredUsers.map(renderTableRow)
                        : renderEmptyState()
                      }
                    </tbody>
                  </table>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddUserModal />
      <EditUserModal />
      <UserDetailsModal />
    </div>
  );
}

export default Maintenance;