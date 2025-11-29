import React, { useEffect, useState } from 'react';
import axios from 'axios';

function OrderDelivery({ user }) {
  const [verifiedOrders, setVerifiedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryInfo, setDeliveryInfo] = useState({
    courierService: '',
    trackingNumber: '',
    estimatedDelivery: '',
    deliveryFee: ''
  });
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const API_HOST = 'http://localhost:5000';

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedOrder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedOrder]);

  // Helper: always return an array for items
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

  const fetchVerifiedOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_HOST}/manage-orders`);
      
      console.log('📋 Raw API response:', response.data);
      
      // Filter for online orders that are verified or in-transit
      const filtered = response.data.filter(order => {
        const orderType = order.type || order.order_type || order.orderType;
        const status = order.status;
        
        console.log(`Checking order: type=${orderType}, status=${status}`);
        
        return orderType === 'online' && (status === 'verified' || status === 'in-transit');
      });
      
      console.log('✅ Filtered verified/in-transit orders:', filtered.length);
      
      // Normalize the data structure
      const normalizedOrders = filtered.map(order => ({
        ...order,
        order_id: order.order_id || order.id,
        order_number: order.order_number || order.orderId,
        order_type: order.type || order.order_type || order.orderType,
        customer_name: order.customer_name || order.customer?.name || 'Unknown',
        customer_email: order.customer_email || order.customer?.email || '',
        customer_phone: order.customer_phone || order.customer?.phone || '',
        customer_address: order.customer_address || order.customer?.address || '',
        items: ensureItemsArray(order.items),
        created_at: order.created_at || order.date || order.timestamp,
        subtotal: order.subtotal || 0,
        shipping_fee: order.shipping_fee || order.shipping?.fee || 0,
        total: order.total || 0
      }));
      
      setVerifiedOrders(normalizedOrders);
      console.log('📦 Normalized orders:', normalizedOrders);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      alert('Failed to load orders. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifiedOrders();
    const interval = setInterval(fetchVerifiedOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchVerifiedOrders]);

  const handleSelectOrder = React.useCallback((order) => {
    setSelectedOrder(order);
    setDeliveryInfo({
      courierService: '',
      trackingNumber: '',
      estimatedDelivery: '',
      deliveryFee: ''
    });
  }, []);

  const handleDeliveryInfoChange = React.useCallback((e) => {
    const { name, value } = e.target;
    setDeliveryInfo(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const validateDeliveryInfo = React.useCallback(() => {
    if (!deliveryInfo.courierService.trim()) {
      alert('⚠️ Please select a courier service');
      return false;
    }
    if (!deliveryInfo.trackingNumber.trim()) {
      alert('⚠️ Please enter a tracking number');
      return false;
    }
    if (!deliveryInfo.estimatedDelivery.trim()) {
      alert('⚠️ Please enter estimated delivery date/time');
      return false;
    }
    return true;
  }, [deliveryInfo]);

  const bookDelivery = React.useCallback(async () => {
    if (!validateDeliveryInfo()) return;

    setBookingLoading(true);
    try {
      console.log('📦 Booking delivery for order:', selectedOrder.order_id);

      // Update order status to 'in-transit'
      const statusResponse = await axios.put(
        `${API_HOST}/order/${selectedOrder.order_id}/status`,
        { status: 'in-transit' }
      );

      if (!statusResponse.data.success) {
        throw new Error('Failed to update order status');
      }

      // Save delivery information
      const deliveryData = {
        order_id: selectedOrder.order_id,
        courier_service: deliveryInfo.courierService,
        tracking_number: deliveryInfo.trackingNumber,
        estimated_delivery: deliveryInfo.estimatedDelivery,
        delivery_fee: deliveryInfo.deliveryFee,
        booked_by: user?.fullname || 'Cashier',
        booked_at: new Date().toISOString()
      };

      await axios.post(`${API_HOST}/save-delivery-info`, deliveryData);

      // Send email notification
      const emailData = {
        order_id: selectedOrder.order_id,
        customer_email: selectedOrder.customer_email,
        customer_name: selectedOrder.customer_name,
        courier_service: deliveryInfo.courierService,
        tracking_number: deliveryInfo.trackingNumber,
        estimated_delivery: deliveryInfo.estimatedDelivery,
        delivery_fee: deliveryInfo.deliveryFee,
        order_number: selectedOrder.order_number
      };

      await axios.post(`${API_HOST}/send-delivery-notification`, emailData);

      console.log('✅ Delivery booked and customer notified');

      alert(
        `✅ Delivery Booked Successfully!\n\n` +
        `Order: ${selectedOrder.order_number}\n` +
        `Courier: ${deliveryInfo.courierService}\n` +
        `Tracking: ${deliveryInfo.trackingNumber}\n\n` +
        `Customer notification email sent to:\n${selectedOrder.customer_email}`
      );

      setSelectedOrder(null);
      fetchVerifiedOrders();

    } catch (error) {
      console.error('❌ Error booking delivery:', error);
      const errorMsg = error.response?.data?.error || error.message;
      alert(`❌ Failed to book delivery\n\n${errorMsg}`);
    } finally {
      setBookingLoading(false);
    }
  }, [selectedOrder, deliveryInfo, user, validateDeliveryInfo, fetchVerifiedOrders]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'verified': { bg: 'info', text: 'Ready for Delivery', icon: 'fa-box' },
      'in-transit': { bg: 'warning', text: 'In Transit', icon: 'fa-truck' }
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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDeliveryModal = () => {
    if (!selectedOrder) return null;

    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'block', overflow: 'auto', paddingRight: '17px' }}>
        <div className="modal-dialog" style={{ margin: '3rem auto', maxWidth: '500px' }}>
          <div className="modal-content">
            
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">
                <i className="fas fa-truck me-2"></i>
                Book Delivery - {selectedOrder.order_number}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setSelectedOrder(null)}
              ></button>
            </div>

            <div className="modal-body">
              
              <div className="mb-4 p-3 bg-light rounded">
                <h6 className="text-muted small mb-2">CUSTOMER & DELIVERY</h6>
                <p className="mb-2"><strong>{selectedOrder.customer_name}</strong></p>
                <p className="mb-2 small">
                  <i className="fas fa-envelope me-2"></i>
                  {selectedOrder.customer_email}
                </p>
                <p className="mb-2 small">
                  <i className="fas fa-phone me-2"></i>
                  {selectedOrder.customer_phone}
                </p>
                <p className="mb-0 small">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  {selectedOrder.customer_address}
                </p>
              </div>

              <div className="mb-4">
                <h6 className="mb-3">Delivery Information</h6>
                
                <div className="mb-3">
                  <label className="form-label">Courier Service *</label>
                  <select
                    className="form-select form-select-sm"
                    name="courierService"
                    value={deliveryInfo.courierService}
                    onChange={handleDeliveryInfoChange}
                  >
                    <option value="">-- Select Courier --</option>
                    <option value="Grab">Grab Express</option>
                    <option value="Lalamove">Lalamove</option>
                    <option value="Angkas Padala">Angkas Padala</option>
                    <option value="JNT">J&T Express</option>
                    <option value="2GO">2GO Express</option>
                    <option value="LBC">LBC Express</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Tracking Number *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    name="trackingNumber"
                    placeholder="Enter tracking number"
                    value={deliveryInfo.trackingNumber}
                    onChange={handleDeliveryInfoChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Estimated Delivery *</label>
                  <input
                    type="datetime-local"
                    className="form-control form-control-sm"
                    name="estimatedDelivery"
                    value={deliveryInfo.estimatedDelivery}
                    onChange={handleDeliveryInfoChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Shipping Fee to be paid by Customer *</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    name="deliveryFee"
                    placeholder="Enter amount (e.g., 150)"
                    value={deliveryInfo.deliveryFee}
                    onChange={handleDeliveryInfoChange}
                    step="0.01"
                    min="0"
                  />
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Customer will pay this on delivery
                  </small>
                </div>
              </div>

              <div className="card border-0 bg-light mb-3">
                <div className="card-body py-2">
                  <div className="d-flex justify-content-between fw-bold">
                    <span>Order Total:</span>
                    <span className="text-success">₱{selectedOrder.total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="alert alert-info mb-0 py-2">
                <small>
                  <i className="fas fa-envelope me-2"></i>
                  <strong>Email notification will be sent to:</strong><br/>
                  <code className="small">{selectedOrder.customer_email}</code>
                </small>
              </div>

            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedOrder(null)}
                disabled={bookingLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={bookDelivery}
                disabled={bookingLoading}
              >
                {bookingLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Booking...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle me-2"></i>
                    Book & Notify Customer
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid bg-light min-vh-100" style={{ paddingTop: '80px' }}>
      <div className="container py-5">
        
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-1">
                  <i className="fas fa-truck me-2"></i>Delivery Management
                </h2>
                <p className="text-muted mb-0">Book couriers for verified orders</p>
              </div>
              <button
                className="btn btn-primary"
                onClick={fetchVerifiedOrders}
                disabled={loading}
              >
                <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''} me-2`}></i>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              
              <div className="card-header bg-white border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Ready for Delivery</h5>
                  <span className="badge bg-primary">{verifiedOrders.length} order{verifiedOrders.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="card-body p-0">
                {loading && verifiedOrders.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading orders...</p>
                  </div>
                ) : verifiedOrders.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-dark sticky-top">
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Address</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verifiedOrders.map(order => (
                          <tr key={order.order_id}>
                            <td>
                              <code className="small">{order.order_number}</code>
                            </td>
                            <td>
                              <div>
                                <strong className="small">{order.customer_name}</strong>
                                <br />
                                <small className="text-muted">{order.customer_email}</small>
                              </div>
                            </td>
                            <td>
                              <small style={{ maxWidth: '150px', wordBreak: 'break-word' }}>
                                {order.customer_address}
                              </small>
                            </td>
                            <td>
                              <span className="badge bg-light text-dark">
                                {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td>
                              <strong>₱{order.total?.toLocaleString()}</strong>
                            </td>
                            <td>
                              {getStatusBadge(order.status)}
                            </td>
                            <td>
                              <small>{formatDate(order.created_at)}</small>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleSelectOrder(order)}
                                disabled={order.status === 'in-transit'}
                              >
                                {order.status === 'in-transit' ? (
                                  <>
                                    <i className="fas fa-check me-1"></i>
                                    Already Booked
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-shipping-fast me-1"></i>
                                    Book Delivery
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="fas fa-box display-1 text-muted mb-3"></i>
                    <h5>No Orders Ready for Delivery</h5>
                    <p className="text-muted">All verified orders have been assigned to couriers</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>

      {renderDeliveryModal()}
    </div>
  );
}

export default OrderDelivery;