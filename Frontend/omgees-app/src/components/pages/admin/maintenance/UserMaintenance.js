import React, { useState, useMemo, useEffect } from 'react';
import UserMaintenanceModals from './UserMaintenanceModals'; 

function UserMaintenance() {
  const [dbUsers, setDbUsers] = useState([]);
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/users');
      const data = await res.json();
      setDbUsers(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setDbUsers([]);
      setIsLoading(false);
    }
  };

  const userTypes = useMemo(() => {
    return [...new Set(dbUsers.map(user => user.user_type))];
  }, [dbUsers]);

  const filteredUsers = useMemo(() => {
    return dbUsers.filter(user => {
      const typeMatch = userTypeFilter === 'all' || user.user_type === userTypeFilter;
      const statusMatch = statusFilter === 'all' || user.status === statusFilter;
      const searchMatch = !searchTerm ||
        user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      return typeMatch && statusMatch && searchMatch;
    });
  }, [dbUsers, userTypeFilter, statusFilter, searchTerm]);

  const getUserTypeLabel = (type) => {
    const labels = {
      'inventory_manager': 'Inventory Manager',
      'cashier': 'Cashier',
      'admin': 'Admin',
      'customer': 'Customer'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const resetFilters = () => {
    setUserTypeFilter('all');
    setStatusFilter('active');
    setSearchTerm('');
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
                  <h2 className="mb-0">User Maintenance</h2>
                  <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <i className="fas fa-plus me-2"></i>Add User
                  </button>
                </div>

                {/* Filters */}
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
                    <button className="btn btn-outline-danger w-100" onClick={resetFilters}>
                      <i className="bi bi-arrow-clockwise"></i> Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="card-body p-0">
                <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <table className="table table-hover mb-0">
                    <thead className="table-dark sticky-top">
                      <tr>
                        <th>User</th>
                        <th className="text-center">Type</th>
                        <th className="text-center">Status</th>
                        <th className="text-center">Created</th>
                        <th className="text-center">Last Login</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan="6" className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-2">Loading users...</p>
                          </td>
                        </tr>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                          <tr key={user.user_id} className={user.status === 'archived' ? 'table-secondary' : ''}>
                            <td>
                              <div>
                                <div className="fw-semibold">{user.fullname}</div>
                                <small className="text-muted">{user.email}</small>
                                {user.contact && <div><small className="text-muted">{user.contact}</small></div>}
                              </div>
                            </td>
                            <td className="text-center">
                              {getUserTypeLabel(user.user_type)}
                            </td>
                            <td className="text-center">
                              <span className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                {user.status === 'active' ? 'Active' : 'Archived'}
                              </span>
                            </td>
                            <td className="text-center">
                              <small>{user.user_created ? formatDate(user.user_created) : 'N/A'}</small>
                            </td>
                            <td className="text-center">
                              <small>{user.user_lastlogin ? formatDate(user.user_lastlogin) : 'Never'}</small>
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setSelectedUser(user)}
                                title="View Details"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-5 text-muted">
                            <i className="bi bi-people fs-1 d-block mb-3"></i>
                            <h5>No users found</h5>
                            <p>Try adjusting your filters or search terms</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Use UserMaintenanceModals component */}
      <UserMaintenanceModals
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        onUserUpdated={fetchUsers}
      />
    </div>
  );
}

export default UserMaintenance;