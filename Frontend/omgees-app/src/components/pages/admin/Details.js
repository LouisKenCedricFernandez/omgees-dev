import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const OrderDetailsModal = ({ show, onClose, order }) => {
  if (!order) return null;

  const API_HOST = 'http://localhost:5000';

  const getImageSrc = (img) => {
    if (!img) return null;
    if (typeof img === 'string' && img.startsWith('http')) return img;
    return `${API_HOST}${img}`;
  };

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

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { bg: 'warning', text: 'Pending' },
      'ready': { bg: 'success', text: 'Ready' },
      'completed': { bg: 'primary', text: 'Completed' },
      'cancelled': { bg: 'danger', text: 'Cancelled' }
    };
    const config = statusConfig[status?.toLowerCase()] || { bg: 'secondary', text: status };
    return <span className={`badge bg-${config.bg}`}>{config.text}</span>;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const items = ensureItemsArray(order.items);
  const customer = typeof order.customer === 'string' 
    ? { name: order.customer }
    : order.customer || {};
  const shipping = order.shipping || {};
  const payment = order.payment || {};

  return (
    <>
      {/* Modal Backdrop */}
      {show && (
        <div 
          className="modal-backdrop fade show" 
          style={{ zIndex: 1040 }}
          onClick={onClose}
        ></div>
      )}
      
      {/* Modal */}
      <div 
        className={`modal fade ${show ? 'show d-block' : ''}`} 
        tabIndex="-1" 
        style={{ zIndex: 1050 }}
      >
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            {/* Modal Header */}
            <div className="modal-header">
              <h5 className="modal-title">Order Details - {order.order_id || order.orderId}</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
              ></button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {/* Order and Customer Information Row */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <h6>Order Information</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td><strong>Order ID:</strong></td>
                        <td>{order.order_id || order.orderId}</td>
                      </tr>
                      <tr>
                        <td><strong>Type:</strong></td>
                        <td>
                          <span className={`badge ${order.type === 'online' ? 'bg-info' : 'bg-success'}`}>
                            {order.type === 'online' ? 'Online' : 'In-Store'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Date:</strong></td>
                        <td>{formatDate(order.date || order.timestamp)}</td>
                      </tr>
                      <tr>
                        <td><strong>Status:</strong></td>
                        <td>{getStatusBadge(order.status)}</td>
                      </tr>
                      {order.cashierName && (
                        <tr>
                          <td><strong>Cashier:</strong></td>
                          <td>{order.cashierName}</td>
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
                        <td>{customer.name || customer.username || 'N/A'}</td>
                      </tr>
                      {customer.email && (
                        <tr>
                          <td><strong>Email:</strong></td>
                          <td className="text-break">{customer.email}</td>
                        </tr>
                      )}
                      {(customer.phone || customer.contact) && (
                        <tr>
                          <td><strong>Phone:</strong></td>
                          <td>{customer.phone || customer.contact}</td>
                        </tr>
                      )}
                      {customer.address && (
                        <tr>
                          <td><strong>Address:</strong></td>
                          <td style={{maxWidth: '200px', wordBreak: 'break-word'}}>{customer.address}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Items */}
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
                        {items.length > 0 ? (
                          items.map((item, index) => (
                            <tr key={item.id || index}>
                              <td>
                                {item.product_name || item.name}
                                {item.selectedVariant && (
                                  <div className="text-muted small">
                                    Variant: {item.selectedVariant.name}
                                  </div>
                                )}
                              </td>
                              <td>₱{Number(item.price || 0).toLocaleString()}</td>
                              <td>{Number(item.quantity || 0)}</td>
                              <td>₱{(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center text-muted">No items found</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        {shipping.fee && shipping.fee > 0 && (
                          <tr>
                            <td colSpan="3"><strong>Shipping:</strong></td>
                            <td>₱{Number(shipping.fee).toLocaleString()}</td>
                          </tr>
                        )}
                        <tr>
                          <td colSpan="3"><strong>Total:</strong></td>
                          <td><strong>₱{Number(order.total || 0).toLocaleString()}</strong></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              {shipping && (shipping.name || shipping.method) && (
                <div className="row mb-3">
                  <div className="col-12">
                    <h6>Shipping Information</h6>
                    <p><strong>Method:</strong> {
                      shipping.name || 
                      (shipping.method === 'customer_delivery' ? 'Customer Arranged Delivery' : 
                       shipping.method === 'pickup' ? 'Store Pickup' : shipping.method)
                    }</p>
                    {shipping.estimatedDays && (
                      <p><strong>Estimated:</strong> {shipping.estimatedDays}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Information */}
              <div className="row mb-3">
                <div className="col-12">
                  <h6>Payment Information</h6>
                  <p>
                    <strong>Method:</strong>{" "}
                    <span className="badge bg-secondary">
                      {(payment.method || order.payment_method || 'cash').toUpperCase()}
                    </span>
                  </p>
                  
                  {/* Payment Proof Display */}
                  {(order.paymentProof || order.payment_proof) ? (
                    <div className="mt-3">
                      <strong className="d-block mb-2">
                        <i className="fas fa-receipt me-2"></i>Payment Proof:
                      </strong>
                      <div className="card border">
                        <div className="card-body p-3">
                          <div className="text-center mb-2">
                            <img 
                              src={getImageSrc(order.paymentProof || order.payment_proof)} 
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
                              href={getImageSrc(order.paymentProof || order.payment_proof)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-primary"
                            >
                              <i className="fas fa-external-link-alt me-1"></i>
                              View Full Size
                            </a>
                          </div>
                          {(payment.referenceNumber || order.payment_reference) && (
                            <p className="mt-2 mb-0">
                              <strong>Reference Number:</strong>{" "}
                              <code className="bg-light p-2 rounded">
                                {payment.referenceNumber || order.payment_reference}
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

              {/* Order Notes */}
              {order.notes && (
                <div className="row">
                  <div className="col-12">
                    <h6>Order Notes</h6>
                    <p className="text-muted">{order.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetailsModal;