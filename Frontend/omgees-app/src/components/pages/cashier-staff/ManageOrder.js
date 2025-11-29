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
  const API_HOST = 'http://localhost:5000';

  const getImageSrc = (img) => {
  if (!img) return null;
  if (typeof img === 'string' && img.startsWith('http')) return img;
  return `${API_HOST}${img}`;
  };
  
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
      const orders = res.data.map(order => {
        let customerObj = {};
        if (typeof order.customer === 'string') {
          try {
            customerObj = JSON.parse(order.customer);
          } catch (e) {
            // If not JSON, treat as plain string (e.g., cashier name)
            customerObj = { name: order.customer };
          }
        } else if (typeof order.customer === 'object' && order.customer !== null) {
          customerObj = order.customer;
        }
        return {
          ...order,
          orderId: order.order_id || order.orderId || order.id,
          type: order.type || order.orderType,
          customer: customerObj,
          items: ensureItemsArray(order.items),
          timestamp: order.timestamp || order.date
        };
      });
      setDborders(orders);
    })
    .catch(err => console.error(err));
}, []);


const updateOrderStatus = async (orderId, newStatus) => {
  console.log('Updating status for:', orderId, 'to:', newStatus);
  
  try {
    const orderToUpdate = dborders.find(order => order.order_id === orderId);
    
    if (!orderToUpdate) {
      console.error('Order not found in local state');
      alert('Order not found. Please refresh the page.');
      return;
    }

    console.log('Found order:', orderToUpdate.order_id, 'Current status:', orderToUpdate.status);

    // FRONTEND VALIDATION for online orders
    if (orderToUpdate.type === 'online' || orderToUpdate.orderType === 'online') {
      // Prevent changing verified orders back to pending
      if (orderToUpdate.status === 'verified' && newStatus === 'pending') {
        alert('⚠️ Verified orders cannot be changed back to pending.');
        return;
      }
      
      // Prevent changing cancelled orders
      if (orderToUpdate.status === 'cancelled' && newStatus !== 'cancelled') {
        alert('⚠️ Cancelled orders cannot be changed.');
        return;
      }
      
      // Only allow pending → verified or cancelled
      if (orderToUpdate.status === 'pending' && newStatus !== 'verified' && newStatus !== 'cancelled' && newStatus !== 'pending') {
        alert('⚠️ Pending orders can only be changed to Verified or Cancelled.');
        return;
      }

      // Confirm cancellation
      if (newStatus === 'cancelled') {
        const confirmCancel = window.confirm(
          '⚠️ Are you sure you want to cancel this order?\n\n' +
          'This action will release the reserved stock.\n' +
          (orderToUpdate.status === 'verified' ? 'Stock will be restored to inventory.\n' : '') +
          '\nThis action cannot be undone.'
        );
        if (!confirmCancel) return;
      }

      // Confirm verification
      if (newStatus === 'verified') {
        const confirmVerify = window.confirm(
          '✅ Verify this order?\n\n' +
          'Stock will be permanently deducted from inventory.\n' +
          'Once verified, the order cannot be changed back to pending.'
        );
        if (!confirmVerify) return;
      }
    }
    
    const response = await axios.put(
      `http://localhost:5000/order/${orderToUpdate.order_id}/status`, 
      { status: newStatus }
    );

    console.log('Backend response:', response.data);

    if (response.data.success) {
      console.log('Status update successful, updating local state...');
      
      // Update local state immediately
      const updatedOrders = dborders.map(order => {
        if (order.order_id === orderToUpdate.order_id) {
          console.log(`Updating order ${order.order_id}: ${order.status} → ${newStatus}`);
          return { ...order, status: newStatus };
        }
        return order;
      });
      
      setDborders(updatedOrders);
      
      // Update selected order if it's open
      if (selectedOrder && selectedOrder.order_id === orderToUpdate.order_id) {
        console.log('Updating selected order modal');
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      // Verify the update by fetching fresh data
      setTimeout(() => {
        axios.get(`http://localhost:5000/order/${orderToUpdate.order_id}/status`)
          .then(verifyRes => {
            if (verifyRes.data.success) {
              console.log('Status verified:', verifyRes.data.order.status);
              if (verifyRes.data.order.status !== newStatus) {
                console.error('Status mismatch detected! Refreshing...');
                fetchOrders();
              }
            }
          })
          .catch(err => console.error('Status verification failed:', err));
      }, 500);

      const statusMessage = newStatus === 'verified' 
        ? '✅ Order verified! Stock has been deducted from inventory.' 
        : newStatus === 'cancelled'
        ? '❌ Order cancelled. Reserved stock has been released.'
        : `✅ Order status updated to ${newStatus}!`;

      alert(statusMessage);
    } else {
      throw new Error(response.data.error || 'Update failed');
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    const errorMsg = error.response?.data?.error || error.message || 'Failed to update order status. Please try again.';
    alert(`❌ ${errorMsg}`);
    
    // Refresh orders on error to ensure consistency
    fetchOrders();
  }
};

// ADD THIS HELPER FUNCTION
const fetchOrders = () => {
  axios.get('http://localhost:5000/manage-orders')
    .then(res => {
      const orders = res.data.map(order => ({
        ...order,
        orderId: order.order_id || order.orderId,
        type: order.type || order.orderType,
        customer: typeof order.customer === 'string' 
          ? JSON.parse(order.customer) 
          : order.customer,
        items: ensureItemsArray(order.items),
        timestamp: order.timestamp || order.date
      }));
      setDborders(orders);
    })
    .catch(err => console.error(err));
};


  // Filter logic
  const filteredOrders = dborders.filter(order => {
  const orderDate = new Date(order.timestamp);
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const dateInRange = (!start || orderDate >= start) && (!end || orderDate <= end);
  const statusMatch = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();
  const typeMatch = typeFilter === 'all' || order.type === typeFilter;
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
      'pending': { bg: 'warning', text: 'Pending', icon: 'fa-clock' },
      'verified': { bg: 'info', text: 'Verified', icon: 'fa-check-circle' },
      'in-transit': { bg: 'primary', text: 'Out for Delivery', icon: 'fa-truck' },
      'completed': { bg: 'success', text: 'Completed', icon: 'fa-check-double' },
      'cancelled': { bg: 'danger', text: 'Rejected', icon: 'fa-times-circle' }
    };
    const config = statusConfig[status] || { bg: 'secondary', text: status, icon: 'fa-info-circle' };
    return (
      <span className={`badge bg-${config.bg}`}>
        <i className={`fas ${config.icon} me-1`}></i>
        {config.text}
      </span>
    );
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleInvoiceDownload = async (order) => {
  try {
    // Show confirmation dialog
    const shouldDownload = window.confirm(
      `📄 Download Invoice\n\n` +
      `Order: ${order.orderId}\n` +
      `Customer: ${order.customer.name}\n` +
      `Total: ₱${order.total.toLocaleString()}\n\n` +
      `Would you like to download the invoice for this order?\n\n` +
      `This invoice serves as proof of purchase.`
    );

    if (!shouldDownload) {
      return;
    }

    console.log('📥 Downloading invoice for order:', order.order_id);

    // Show loading state
    const loadingToast = document.createElement('div');
    loadingToast.className = 'position-fixed top-0 start-50 translate-middle-x mt-3 alert alert-info';
    loadingToast.style.zIndex = '9999';
    loadingToast.innerHTML = `
      <i class="fas fa-spinner fa-spin me-2"></i>
      Generating invoice...
    `;
    document.body.appendChild(loadingToast);

    // Trigger download
    const url = `http://localhost:5000/generate-invoice/${order.order_id}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${order.orderId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Remove loading toast after delay
    setTimeout(() => {
      document.body.removeChild(loadingToast);
      
      // Show success message
      const successToast = document.createElement('div');
      successToast.className = 'position-fixed top-0 start-50 translate-middle-x mt-3 alert alert-success';
      successToast.style.zIndex = '9999';
      successToast.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        Invoice downloaded successfully!
      `;
      document.body.appendChild(successToast);
      
      setTimeout(() => {
        document.body.removeChild(successToast);
      }, 3000);
    }, 2000);

  } catch (error) {
    console.error('❌ Invoice download error:', error);
    alert(`❌ Failed to download invoice\n\n${error.message}\n\nPlease try again.`);
  }
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
          <option value="verified">Verified</option>
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

const OrderDetailsModal = () => {
  if (!selectedOrder) return null;

  const items = ensureItemsArray(selectedOrder.items);
  
  const isOnlineOrder = selectedOrder.type === 'online' || selectedOrder.orderType === 'online';
  const currentStatus = selectedOrder.status;

  return (
    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          
          {/* MODAL HEADER */}
          <div className="modal-header">
            <h5 className="modal-title">Order Details - {selectedOrder.orderId}</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setSelectedOrder(null)}
            ></button>
          </div>
          
          {/* MODAL BODY */}
          <div className="modal-body">
            
            {/* ORDER AND CUSTOMER INFORMATION */}
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
                      <td>{formatDate(selectedOrder.date)}</td>
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
                        <td style={{maxWidth: '200px', wordBreak: 'break-word'}}>
                          {selectedOrder.customer.address}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ORDER ITEMS */}
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
                      {items.map((item, index) => (
                        <tr key={item.id || index}>
                          <td>{item.product_name || item.name}</td>
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

            {/* SHIPPING INFORMATION */}
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

            {/* PAYMENT INFORMATION */}
            <div className="row mb-3">
              <div className="col-12">
                <h6>Payment Information</h6>
                <p>
                  <strong>Method:</strong>{" "}
                  <span className="badge bg-secondary">
                    {(selectedOrder.payment?.method || selectedOrder.payment_method || 'cash').toUpperCase()}
                  </span>
                </p>
                
                {/* Payment Proof Display */}
                {(selectedOrder.paymentProof || selectedOrder.payment_proof) ? (
                  <div className="mt-3">
                    <strong className="d-block mb-2">
                      <i className="fas fa-receipt me-2"></i>Payment Proof:
                    </strong>
                    <div className="card border">
                      <div className="card-body p-3">
                        <div className="text-center mb-2">
                          <img 
                            src={getImageSrc(selectedOrder.paymentProof || selectedOrder.payment_proof)} 
                            alt="Payment proof" 
                            className="img-fluid rounded border shadow-sm"
                            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                            }}
                          />
                        </div>
                        <div className="d-flex gap-2 justify-content-center">
                          <a 
                            href={getImageSrc(selectedOrder.paymentProof || selectedOrder.payment_proof)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-primary"
                          >
                            <i className="fas fa-external-link-alt me-1"></i>
                            View Full Size
                          </a>
                        </div>
                        {(selectedOrder.payment?.referenceNumber || selectedOrder.payment_reference) && (
                          <p className="mt-2 mb-0">
                            <strong>Reference Number:</strong>{" "}
                            <code className="bg-light p-2 rounded">
                              {selectedOrder.payment?.referenceNumber || selectedOrder.payment_reference}
                            </code>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-info mt-2 mb-0">
                    <i className="fas fa-info-circle me-2"></i>
                    No payment proof uploaded
                  </div>
                )}
              </div>
            </div>
            
            {/* ORDER NOTES */}
            {selectedOrder.notes && (
              <div className="row">
                <div className="col-12">
                  <h6>Order Notes</h6>
                  <p className="text-muted">{selectedOrder.notes}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* MODAL FOOTER */}
          <div className="modal-footer">
            
            {/* ACTION BUTTONS SECTION */}
            <div className="me-auto d-flex gap-2 align-items-center flex-wrap">
              {isOnlineOrder ? (
                <>
                  {/* PENDING STATUS - Show Verify and Cancel Buttons */}
                  {currentStatus === 'pending' && (
                    <>
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => updateOrderStatus(selectedOrder.order_id, 'verified')}
                      >
                        <i className="fas fa-check-circle me-1"></i>
                        Verify Order
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => updateOrderStatus(selectedOrder.order_id, 'cancelled')}
                      >
                        <i className="fas fa-times-circle me-1"></i>
                        Cancel Order
                      </button>
                      <small className="text-muted">
                        <i className="fas fa-lock me-1"></i>
                        Stock is reserved
                      </small>
                    </>
                  )}
                  
                  {/* VERIFIED STATUS - Show Badge and Cancel Button */}
                  {currentStatus === 'verified' && (
                    <>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-success">
                          <i className="fas fa-check-circle me-1"></i>
                          Order Verified
                        </span>
                      </div>
                      <small className="text-muted d-block w-100">
                        <i className="fas fa-box me-1"></i>
                        Stock has been deducted from inventory
                      </small>
                    </>
                  )}
                  
                  {/* CANCELLED STATUS - Show Warning */}
                  {currentStatus === 'cancelled' && (
                    <div className="alert alert-danger mb-0 py-2 px-3">
                      <i className="fas fa-ban me-2"></i>
                      This order has been rejected and cannot be modified.
                    </div>
                  )}
                </>
              ) : (
                /* IN-STORE ORDERS - Show Completed Badge */
                <div>
                  <span className="badge bg-success">
                    <i className="fas fa-shopping-bag me-1"></i>
                    Completed (In-Store)
                  </span>
                  <small className="text-muted d-block mt-1">
                    In-store orders are automatically completed
                  </small>
                </div>
              )}
            </div>
            {/*\INVOICE BUTTON */}
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={() => handleInvoiceDownload(selectedOrder)}
            >
              <i className="fas fa-file-invoice me-1"></i>
              Download Invoice
            </button>
            
            {/* CLOSE BUTTON */}
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              onClick={() => setSelectedOrder(null)}
            >
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
                              <span className={`badge ${order.type === 'online' ? 'bg-info' : 'bg-success'}`}>
                                {order.type === 'online' ? 'Online' : 'In-Store'}
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
                                {order.totalQuantity} item{order.totalQuantity !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td className="text-center">
                              <strong>₱{order.total.toLocaleString()}</strong>
                            </td>
                            <td className="text-center">
                              {getStatusBadge(order.status)}
                            </td>
                            <td className="text-center">
                              <small>{formatDate(order.date)}</small>
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