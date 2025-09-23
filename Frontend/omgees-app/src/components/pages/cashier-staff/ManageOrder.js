import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ManageOrder({ user, orders = [], onUpdateOrder }) {
  // Filter states
  const [dborders, setDborders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // helper: always return an array for items (defensive parsing)
const ensureItemsArray = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return [parsed];
      return [];
    } catch (e) {
      // fallback: comma-separated list or plain string
      try {
        return items.split(',').map(s => s.trim()).filter(Boolean);
      } catch (_) {
        return [];
      }
    }
  }
  if (typeof items === 'object') return [items];
  return [];
};


  useEffect(() => {
  axios.get('http://localhost:5000/manage-orders')
    .then(res => {
      const orders = res.data.map(order => ({
        ...order,
        items: ensureItemsArray(order.items)
      }));
      setDborders(orders);
    })
    .catch(err => console.error(err));
}, []);


  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = dborders.map(order => 
      order.orderId === orderId 
        ? { ...order, status: newStatus }
        : order
    );
    if (onUpdateOrder) {
      onUpdateOrder(updatedOrders);
    }
  };

  // Filter logic
  const filteredOrders = dborders.filter(order => {
  const orderDate = new Date(order.timestamp);
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const dateInRange = (!start || orderDate >= start) && (!end || orderDate <= end);
  const statusMatch = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();
  const typeMatch = typeFilter === 'all' || order.orderType === typeFilter;
  return dateInRange && statusMatch && typeMatch;
});

  // Helper functions
  const resetFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { bg: 'warning', text: 'Pending' },
      'processing': { bg: 'info', text: 'Processing' },
      'ready': { bg: 'success', text: 'Ready' },
      'completed': { bg: 'primary', text: 'Completed' },
      'cancelled': { bg: 'danger', text: 'Cancelled' }
    };
    const config = statusConfig[status] || { bg: 'secondary', text: status };
    return <span className={`badge bg-${config.bg}`}>{config.text}</span>;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusCount = (status) => {
    if (status === 'pending-processing') {
      return filteredOrders.filter(o => ['pending', 'processing'].includes(o.status)).length;
    }
    return filteredOrders.filter(o => o.status === status).length;
  };

  // Render filters
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
      <div className="col-md-3">
        <label className="form-label fw-semibold">Status</label>
        <select 
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="col-md-3">
        <label className="form-label fw-semibold">Order Type</label>
        <select 
          className="form-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="online">Online Orders</option>
          <option value="in-store">In-Store Orders</option>
        </select>
      </div>
      <div className="col-md-2">
        <div className="d-flex gap-2">
          <button className="btn btn-outline-danger" onClick={resetFilters}>
            <i className="bi bi-arrow-clockwise"></i> Reset
          </button>
        </div>
      </div>
    </div>
  );

  const renderSummaryFooter = () => (
    <div className="card-footer bg-light border-0">
      <div className="row text-center">
        <div className="col-md-2">
          <div className="fw-semibold text-warning">{getStatusCount('pending')}</div>
          <small className="text-muted">Pending</small>
        </div>
        <div className="col-md-2">
          <div className="fw-semibold text-info">{getStatusCount('processing')}</div>
          <small className="text-muted">Processing</small>
        </div>
        <div className="col-md-2">
          <div className="fw-semibold text-success">{getStatusCount('ready')}</div>
          <small className="text-muted">Ready</small>
        </div>
        <div className="col-md-2">
          <div className="fw-semibold text-primary">{getStatusCount('completed')}</div>
          <small className="text-muted">Completed</small>
        </div>
        <div className="col-md-2">
          <div className="fw-semibold text-danger">{getStatusCount('cancelled')}</div>
          <small className="text-muted">Cancelled</small>
        </div>
        <div className="col-md-2">
          <div className="fw-semibold text-dark">{filteredOrders.length}</div>
          <small className="text-muted">Total Shown</small>
        </div>
      </div>
    </div>
  );

  const OrderDetailsModal = () => {
    if (!selectedOrder) return null;

    const items = ensureItemsArray(selectedOrder.items);

    return (
      <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Order Details - {selectedOrder.orderId}</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setSelectedOrder(null)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <h6>Order Information</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td><strong>Order ID:</strong></td>
                        <td>{selectedOrder.orderId}</td>
                      </tr>
                      <tr>
                        <td><strong>Type:</strong></td>
                        <td>
                          <span className={`badge ${selectedOrder.orderType === 'online' ? 'bg-info' : 'bg-success'}`}>
                            {selectedOrder.orderType === 'online' ? 'Online' : 'In-Store'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Date:</strong></td>
                        <td>{formatDate(selectedOrder.timestamp)}</td>
                      </tr>
                      <tr>
                        <td><strong>Status:</strong></td>
                        <td>{getStatusBadge(selectedOrder.status)}</td>
                      </tr>
                      {selectedOrder.cashierName && (
                        <tr>
                          <td><strong>Cashier:</strong></td>
                          <td>{selectedOrder.cashierName}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6">
                  <h6>Customer Information</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td><strong>Name:</strong></td>
                        <td>{selectedOrder.customer.name || selectedOrder.customer.username}</td>
                      </tr>
                      {selectedOrder.customer.email && (
                        <tr>
                          <td><strong>Email:</strong></td>
                          <td>{selectedOrder.customer.email}</td>
                        </tr>
                      )}
                      {selectedOrder.customer.phone && (
                        <tr>
                          <td><strong>Phone:</strong></td>
                          <td>{selectedOrder.customer.phone}</td>
                        </tr>
                      )}
                      {selectedOrder.customer.address && (
                        <tr>
                          <td><strong>Address:</strong></td>
                          <td style={{maxWidth: '200px', wordBreak: 'break-word'}}>{selectedOrder.customer.address}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-12">
                  <h6>Order Items</h6>
                  <div className="table-responsive">
                    <table className="table table-striped table-sm">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Price</th>
                          <th>Quantity</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* made some changes here */}
                        {items.map((item, index) => (
                            <tr key={item.id || index}>
                            <td>{item.displayName || item.name}</td>
                            <td>₱{Number(item.price || 0).toLocaleString()}</td>
                            <td>{Number(item.quantity || 0)}</td>
                            <td>₱{(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        {selectedOrder.shipping && selectedOrder.shipping.fee > 0 && (
                          <tr>
                            <td colSpan="3"><strong>Shipping:</strong></td>
                            <td>₱{selectedOrder.shipping.fee.toLocaleString()}</td>
                          </tr>
                        )}
                        <tr>
                          <td colSpan="3"><strong>Total:</strong></td>
                          <td><strong>₱{selectedOrder.total.toLocaleString()}</strong></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {selectedOrder.shipping && (
                <div className="row mb-3">
                  <div className="col-12">
                    <h6>Shipping Information</h6>
                    <p><strong>Method:</strong> {
                      selectedOrder.shipping.name || 
                      (selectedOrder.shipping.method === 'customer_delivery' ? 'Customer Arranged Delivery' : 
                       selectedOrder.shipping.method === 'pickup' ? 'Store Pickup' : selectedOrder.shipping.method)
                    }</p>
                    <p><strong>Estimated:</strong> {selectedOrder.shipping.estimatedDays}</p>
                  </div>
                </div>
              )}

              <div className="row mb-3">
               <div className="col-12">
              <h6>Payment Information</h6>
             <p>
              <strong>Method:</strong>{" "}
              {(selectedOrder.payment?.method || '').toUpperCase()}
             </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {getStatusBadge(selectedOrder.payment?.status || '')}
                 </p>
                   {selectedOrder.paymentProof && (
                  <p>
                  <strong>Payment Proof:</strong> {selectedOrder.paymentProof}
                </p>
                )}
              </div>
            </div>

              {selectedOrder.notes && (
                <div className="row">
                  <div className="col-12">
                    <h6>Order Notes</h6>
                    <p className="text-muted">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <div className="me-auto">
                <select 
                  className="form-select form-select-sm"
                  value={selectedOrder.status}
                  onChange={(e) => {
                    updateOrderStatus(selectedOrder.orderId, e.target.value);
                    setSelectedOrder({...selectedOrder, status: e.target.value});
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedOrder(null)}>
                Close
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
              
              {/* Manage Order Header */}
              <div className="card-header bg-white border-0 pb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="mb-0">Order Management</h2>
                  <span className="badge bg-primary">{filteredOrders.length} orders</span>
                </div>
                {renderFilters()}
              </div>
              
              {/* Manage Order Body - Table */}
              <div className="card-body p-0 mt-3">
                <div className="table-responsive" style={{maxHeight: '500px', overflowY: 'auto'}}>
                  <table className="table table-hover mb-0">
                    <thead className="table-dark sticky-top">
                      <tr>
                        <th scope="col">Order ID</th>
                        <th scope="col" className="text-center">Type</th>
                        <th scope="col" className="text-center">Customer</th>
                        <th scope="col" className="text-center">Items</th>
                        <th scope="col" className="text-center">Total</th>
                        <th scope="col" className="text-center">Status</th>
                        <th scope="col" className="text-center">Date</th>
                        <th scope="col" className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length > 0 ? (
                        filteredOrders.map(order => (
                          <tr key={order.orderId}>
                            <th scope="row" className="fw-normal">
                              <code className="small">{order.orderId}</code>
                            </th>
                            <td className="text-center">
                              <span className={`badge ${order.orderType === 'online' ? 'bg-info' : 'bg-success'}`}>
                                {order.orderType === 'online' ? 'Online' : 'In-Store'}
                              </span>
                            </td>
                            <td className="text-center">
                              <div>
                                <strong className="small">{order.customer.name || order.customer.username}</strong>
                                {order.customer.email && <br/>}
                                {order.customer.email && <small className="text-muted">{order.customer.email}</small>}
                              </div>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-light text-dark">
                                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td className="text-center">
                              <strong>₱{order.total.toLocaleString()}</strong>
                            </td>
                            <td className="text-center">
                              {getStatusBadge(order.status)}
                            </td>
                            <td className="text-center">
                              <small>{formatDate(order.timestamp)}</small>
                            </td>
                            <td className="text-center">
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setSelectedOrder({ ...order, items: ensureItemsArray(order.items) })}
                              >
                                <i className="fas fa-eye"></i> View
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center py-5 text-muted">
                            <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                            <h5>No orders found</h5>
                            <p>Try adjusting your filters or date range</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Summary Footer */}
              {filteredOrders.length > 0 && renderSummaryFooter()}
              
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal />
    </div>
  );
}

export default ManageOrder;