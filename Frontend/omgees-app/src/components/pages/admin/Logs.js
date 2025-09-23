import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Logs({ transactions = [], activities = [] }) {
  // Filter states
  const [dbOrders, setDbOrders] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('activities'); // 'activities' or 'transactions'

  // Process activities with more details
  const processedActivities = useMemo(() => {
    return activities.map(activity => ({
      ...activity,
      displayTime: new Date(activity.timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));
  }, [activities]);

   // Fetch orders from backend on component mount -nt
  useEffect(() => {
  axios.get('http://localhost:5000/manage-orders')
    .then(res => {
      setDbOrders(res.data);
    })
    .catch(err => {
      console.error('Failed to fetch orders:', err);
    });
}, []);

  // Get unique activity types and user types for filters
  const activityTypes = useMemo(() => {
    return [...new Set(activities.map(a => a.type))];
  }, [activities]);

  const userTypes = useMemo(() => {
    return [...new Set(activities.map(a => a.userType))];
  }, [activities]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    return processedActivities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      const dateInRange = (!start || activityDate >= start) && (!end || activityDate <= end);
      const typeMatch = activityTypeFilter === 'all' || activity.type === activityTypeFilter;
      const userMatch = userTypeFilter === 'all' || activity.userType === userTypeFilter;
      
      return dateInRange && typeMatch && userMatch;
    });
  }, [processedActivities, startDate, endDate, activityTypeFilter, userTypeFilter]);

// ...existing code...

// Filter transactions -nt
const filteredTransactions = useMemo(() => {
  return dbOrders.filter(transaction => {
    const isActualTransaction =
      transaction.order_id && // <-- match DB field
      transaction.customer &&
      (transaction.total !== undefined && transaction.total !== null) &&
      (transaction.type === 'online' || transaction.type === 'in-store'); // <-- match DB field

    const transactionDate = new Date(transaction.date); // <-- match DB field
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const dateInRange = (!start || transactionDate >= start) && (!end || transactionDate <= end);

    return isActualTransaction && dateInRange;
  });
}, [dbOrders, startDate, endDate]);


  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setActivityTypeFilter('all');
    setUserTypeFilter('all');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'completed': 'success',
      'pending': 'warning',
      'processing': 'info',
      'cancelled': 'danger',
      'ready': 'primary'
    };
    return statusColors[status] || 'secondary';
  };

  // Render components
  const renderFilters = () => (
    <div className="row g-3 align-items-end">
      <div className="col-md-2">
        <label className="form-label fw-semibold">Start Date</label>
        <input 
          type="date" 
          className="form-control"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          max={endDate || undefined}
        />
      </div>
      <div className="col-md-2">
        <label className="form-label fw-semibold">End Date</label>
        <input 
          type="date" 
          className="form-control"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          min={startDate || undefined}
        />
      </div>
      {activeTab === 'activities' && (
        <>
          <div className="col-md-3">
            <label className="form-label fw-semibold">Activity Type</label>
            <select 
              className="form-select"
              value={activityTypeFilter}
              onChange={(e) => setActivityTypeFilter(e.target.value)}
            >
              <option value="all">All Activity Types</option>
              {activityTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">User Type</label>
            <select 
              className="form-select"
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
            >
              <option value="all">All User Types</option>
              {userTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
      <div className="col-md-2">
        <div className="d-flex gap-2">
          <button className="btn btn-outline-danger" onClick={resetFilters}>
            <i className="bi bi-arrow-clockwise"></i> Reset
          </button>
        </div>
      </div>
    </div>
  );

  const renderActivitiesTable = () => (
    <div className="table-responsive" style={{maxHeight: '500px', overflowY: 'auto'}}>
      <table className="table table-hover mb-0">
        <thead className="table-dark sticky-top">
          <tr>
            <th scope="col">Activity</th>
            <th scope="col" className="text-center">User</th>
            <th scope="col" className="text-center">Type</th>
            <th scope="col" className="text-center">Timestamp</th>
            <th scope="col" className="text-center">Details</th>
          </tr>
        </thead>
        <tbody>
          {filteredActivities.length > 0 ? (
            filteredActivities.map(activity => (
              <tr key={activity.id}>
                <td>
                  <div className="d-flex align-items-center">
                    <div className={`activity-icon bg-${activity.color} bg-opacity-10 rounded-circle p-2 me-3`}>
                      <i className={`bi bi-${activity.icon} text-${activity.color}`}></i>
                    </div>
                    <div>
                      <div className="fw-semibold">{activity.action}</div>
                      <small className="text-muted">{activity.type.replace('_', ' ')}</small>
                    </div>
                  </div>
                </td>
                <td className="text-center">
                  <div>
                    <strong>{activity.user}</strong>
                    <br />
                    <span className={`badge bg-${activity.userType === 'admin' ? 'danger' : 
                                                 activity.userType === 'cashier' ? 'success' : 
                                                 activity.userType === 'inventory_manager' ? 'warning' : 'info'}`}>
                      {activity.userType.replace('_', ' ')}
                    </span>
                  </div>
                </td>
                <td className="text-center">
                  <span className={`badge bg-${activity.color}`}>
                    {activity.type.replace('_', ' ')}
                  </span>
                </td>
                <td className="text-center">
                  <small>{activity.displayTime}</small>
                </td>
                <td className="text-center">
                  <small>
                    {activity.details?.customer && <div>Customer: {activity.details.customer}</div>}
                    {activity.details?.total && <div>{formatCurrency(activity.details.total)}</div>}
                    {activity.details?.itemCount && <div>{activity.details.itemCount} items</div>}
                    {activity.details?.orderId && <div>Order: {activity.details.orderId}</div>}
                  </small>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center py-5 text-muted">
                <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                <h5>No activities found</h5>
                <p>Try adjusting your filters or date range</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderTransactionsTable = () => (
    <div className="table-responsive" style={{maxHeight: '500px', overflowY: 'auto'}}>
      <table className="table table-hover mb-0">
        <thead className="table-dark sticky-top">
          <tr>
            <th scope="col">Order ID</th>
            <th scope="col" className="text-center">Customer</th>
            <th scope="col" className="text-center">Type</th>
            <th scope="col" className="text-center">Total</th>
            <th scope="col" className="text-center">Status</th>
            <th scope="col" className="text-center">Date</th>
            <th scope="col" className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map(transaction => (
              <tr key={transaction.orderId}>
                <th scope="row" className="fw-normal">
                  <code className="small">{transaction.orderId}</code>
                </th>
                <td className="text-center">
                  <div>
                    <strong className="small">{transaction.customer.name || transaction.customer.username}</strong>
                    {transaction.customer.email && <br/>}
                    {transaction.customer.email && <small className="text-muted">{transaction.customer.email}</small>}
                  </div>
                </td>
                <td className="text-center">
                  <span className={`badge ${transaction.orderType === 'online' ? 'bg-info' : 'bg-success'}`}>
                    {transaction.orderType === 'online' ? 'Online' : 'In-Store'}
                  </span>
                </td>
                <td className="text-center">
                  <strong>{formatCurrency(transaction.total)}</strong>
                </td>
                <td className="text-center">
                  <span className={`badge bg-${getStatusColor(transaction.status)}`}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </span>
                </td>
                <td className="text-center">
                  <small>{new Date(transaction.timestamp).toLocaleString()}</small>
                </td>
                <td className="text-center">
                  <Link to="/admin/logs/details" className="btn btn-sm btn-outline-primary">
                    <i className="fas fa-eye"></i> View
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center py-5 text-muted">
                <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                <h5>No transactions found</h5>
                <p>Try adjusting your filters or date range</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="container-fluid bg-light min-vh-100">
      <div className="container py-5">
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              
              {/* Card Header */}
              <div className="card-header bg-white border-0 pb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="mb-0">System Logs & Activities</h2>
                  <div className="d-flex gap-2">
                    <span className="badge bg-primary">
                      {activeTab === 'activities' ? filteredActivities.length : filteredTransactions.length} records
                    </span>
                  </div>
                </div>

                {/* Tab Navigation */}
                <ul className="nav nav-tabs mb-4">
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'activities' ? 'active' : ''}`}
                      onClick={() => setActiveTab('activities')}
                    >
                      <i className="bi bi-activity me-2"></i>
                      Activity Logs ({activities.length})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'transactions' ? 'active' : ''}`}
                      onClick={() => setActiveTab('transactions')}
                    >
                      <i className="bi bi-receipt me-2"></i>
                      Transaction History ({dbOrders.length})
                    </button>
                  </li>
                </ul>

                {renderFilters()}
              </div>
              
              {/* Card Body - Tables */}
              <div className="card-body p-0 mt-3">
                {activeTab === 'activities' ? renderActivitiesTable() : renderTransactionsTable()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Logs;