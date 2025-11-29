import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../Authentication';
import axios from 'axios';

function TrackOrder() { 
    const { currentUser } = useAuth();
    const [userOrders, setUserOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [markingAsReceived, setMarkingAsReceived] = useState(false);

    // Wrap fetchUserOrders in useCallback to prevent unnecessary re-renders
    const fetchUserOrders = useCallback(async () => {
        const userId = currentUser?.user_id || currentUser?.id;
        
        if (!userId) {
            console.log('❌ No user ID found');
            console.log('Current user:', currentUser);
            return;
        }
        
        setLoading(true);
        try {
            const url = `http://localhost:5000/customer/${userId}/orders`;
            console.log('🌐 Fetching orders from:', url);
            console.log('👤 User ID:', userId);
            
            const response = await axios.get(url);
            
            console.log('📊 Orders received:', response.data.length);
            console.log('📋 Raw orders data:', response.data);
            
            // Map the orders and fetch delivery info if in-transit
            const normalizedOrders = await Promise.all(
                response.data.map(async (order) => {
                    const normalizedOrder = {
                        ...order,
                        status: order.status || 'pending',
                        orderId: order.orderId || order.order_number || order.order_id,
                        timestamp: order.timestamp || order.date || order.created_at
                    };
                    
                    console.log(`Order ${normalizedOrder.orderId} status:`, normalizedOrder.status);
                    
                    // Fetch delivery info if order is in-transit
                    if (normalizedOrder.status === 'in-transit') {
                        try {
                            const deliveryRes = await axios.get(
                                `http://localhost:5000/delivery-info/${normalizedOrder.order_id}`
                            );
                            if (deliveryRes.data.success) {
                                normalizedOrder.deliveryInfo = deliveryRes.data.deliveryInfo;
                                console.log('✅ Delivery info found:', deliveryRes.data.deliveryInfo);
                            }
                        } catch (err) {
                            console.log('⚠️ Could not fetch delivery info:', err.message);
                        }
                    }
                    
                    return normalizedOrder;
                })
            );
            
            console.log('📋 Normalized orders:', normalizedOrders);
            setUserOrders(normalizedOrders);
            
            console.log('✅ Orders loaded successfully');
        } catch (error) {
            console.error('❌ Error fetching orders:', error);
            if (error.response) {
                console.error('Response error:', error.response.data);
                console.error('Status:', error.response.status);
            }
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    // Fetch user orders on mount and refresh every 10 seconds for status updates
    useEffect(() => {
        const userId = currentUser?.user_id || currentUser?.id;
        
        if (userId) {
            fetchUserOrders();
            
            // Set up auto-refresh every 10 seconds to get status updates
            const intervalId = setInterval(() => {
                fetchUserOrders();
            }, 10000);

            // Cleanup interval on unmount
            return () => clearInterval(intervalId);
        }
    }, [currentUser?.user_id, currentUser?.id, fetchUserOrders]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    const getStatusColor = (status) => {
        if (!status) return 'secondary';
        const statusLower = status.toLowerCase();
        const statusColors = {
            'completed': 'success',
            'pending': 'warning',
            'verified': 'info',
            'in-transit': 'primary',
            'cancelled': 'danger'
        };
        return statusColors[statusLower] || 'secondary';
    };

    const getStatusIcon = (status) => {
        if (!status) return 'fa-info-circle';
        const statusLower = status.toLowerCase();
        const icons = {
            'pending': 'fa-clock',
            'verified': 'fa-check-circle',
            'in-transit': 'fa-truck',
            'completed': 'fa-check-double',
            'cancelled': 'fa-times-circle'
        };
        return icons[statusLower] || 'fa-info-circle';
    };

    const getStatusMessage = (status) => {
        if (!status) return 'Order status is being updated.';
        const statusLower = status.toLowerCase();
        const messages = {
            'pending': 'Your order has been received and is being prepared.',
            'verified': 'Your order has been verified!',
            'in-transit': 'Your order is out for delivery! Check tracking details sent to your email!.',
            'completed': 'Your order has been delivered. Thank you!',
            'cancelled': 'This order has been rejected.'
        };
        return messages[statusLower] || 'Order status is being updated.';
    };

    const getStatusDisplayText = (status) => {
    if (!status) return 'Unknown';
    const statusLower = status.toLowerCase();
    const displayTexts = {
        'pending': 'Pending',
        'verified': 'Verified',
        'in-transit': 'Out for Delivery',  // ✅ This is what will be shown
        'completed': 'Completed',
        'cancelled': 'Rejected'
    };
    return displayTexts[statusLower] || status;
    };

    const getProgressWidth = (status) => {
        if (!status) return '0%';
        const statusLower = status.toLowerCase();
        switch(statusLower) {
            case 'pending': return '25%';
            case 'verified': return '50%';
            case 'in-transit': return '75%';
            case 'completed': return '100%';
            case 'cancelled': return '100%';
            default: return '0%';
        }
    };

    const handleMarkAsReceived = async (order) => {
        const confirmReceive = window.confirm(
            `📦 Confirm Delivery Received\n\n` +
            `Order: ${order.orderId}\n` +
            `Total: ${formatCurrency(order.total)}\n\n` +
            `Have you received this order?\n\n` +
            `This action will complete your order.`
        );

        if (!confirmReceive) return;

        setMarkingAsReceived(true);
        try {
            console.log('📬 Marking order as received:', order.orderId);

            const response = await axios.put(
                `http://localhost:5000/order/${order.order_id}/mark-received`
            );

            if (response.data.success) {
                console.log('✅ Order marked as received');

                alert(
                    
                    `Thank you for your purchase!\n\n`
                );

                // Update local state
                setUserOrders(prevOrders =>
                    prevOrders.map(o =>
                        o.orderId === order.orderId
                            ? { ...o, status: 'completed' }
                            : o
                    )
                );

                // Close modal
                setSelectedOrder(null);

                // Refresh orders
                setTimeout(() => {
                    fetchUserOrders();
                }, 1000);
            } else {
                throw new Error(response.data.error || 'Failed to mark order as received');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            alert(`❌ Failed to mark order as received\n\n${error.message}`);
        } finally {
            setMarkingAsReceived(false);
        }
    };

    // Order Details Modal (Read-only for customers)
    const OrderDetailsModal = () => {
        if (!selectedOrder) return null;

        const orderStatus = selectedOrder.status || 'pending';

        return (
            <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
                <div className="modal-dialog modal-xl">
                    <div className="modal-content">
                        <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title">
                                <i className="fas fa-receipt me-2"></i>
                                Order Tracking - {selectedOrder.orderId}
                            </h5>
                            <button 
                                type="button" 
                                className="btn-close btn-close-white" 
                                onClick={() => setSelectedOrder(null)}
                            ></button>
                        </div>
                        <div className="modal-body">
                            {/* Order Status Timeline */}
                            <div className="card bg-light mb-4">
                                <div className="card-body">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className={`bg-${getStatusColor(orderStatus)} text-white rounded-circle p-3 me-3`}
                                             style={{width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                            <i className={`fas ${getStatusIcon(orderStatus)} fs-4`}></i>
                                        </div>
                                        <div>
                                            <h5 className="mb-1">
                                                <span className={`badge bg-${getStatusColor(orderStatus)}`}>
                                                    {getStatusDisplayText(orderStatus)}
                                                </span>
                                            </h5>
                                            <p className="mb-0 text-muted">{getStatusMessage(orderStatus)}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Status Progress Bar */}
                                    <div className="progress" style={{height: '8px'}}>
                                        <div 
                                            className={`progress-bar bg-${getStatusColor(orderStatus)}`}
                                            style={{ width: getProgressWidth(orderStatus) }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <h6><i className="fas fa-info-circle me-2"></i>Order Information</h6>
                                    <table className="table table-sm table-borderless">
                                        <tbody>
                                            <tr>
                                                <td><strong>Order ID:</strong></td>
                                                <td><code>{selectedOrder.orderId}</code></td>
                                            </tr>
                                            <tr>
                                                <td><strong>Order Date:</strong></td>
                                                <td>{new Date(selectedOrder.timestamp || selectedOrder.date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Payment Method:</strong></td>
                                                <td>
                                                    <span className="badge bg-secondary">
                                                        {(selectedOrder.payment?.method || 'N/A').toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                            {(selectedOrder.payment?.referenceNumber || selectedOrder.payment_reference) && (
                                            <tr>
                                                <td><strong>Reference Number:</strong></td>
                                                <td>
                                                <code className="bg-light p-1 rounded">
                                                    {selectedOrder.payment?.referenceNumber || selectedOrder.payment_reference}
                                                </code>
                                                </td>
                                            </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="col-md-6">
                                    <h6><i className="fas fa-shipping-fast me-2"></i>Delivery Information</h6>
                                    {selectedOrder.shipping ? (
                                        <>
                                            <table className="table table-sm table-borderless">
                                                <tbody>
                                                    <tr>
                                                        <td><strong>Method:</strong></td>
                                                        <td>{selectedOrder.shipping.name || 'Customer Arranged Delivery'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Delivery Address:</strong></td>
                                                        <td>{selectedOrder.customer.address}</td>
                                                    </tr>
                                                    {selectedOrder.shipping.estimatedDays && (
                                                        <tr>
                                                            <td><strong>Estimated Time:</strong></td>
                                                            <td>{selectedOrder.shipping.estimatedDays}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>

                                            {/* Show tracking info if order is in-transit */}
                                            {selectedOrder.status === 'in-transit' && selectedOrder.deliveryInfo && (
                                                <div className="alert alert-info mt-3 mb-0">
                                                    <h6 className="alert-heading">
                                                        <i className="fas fa-truck me-2"></i>
                                                        Your order is on its way!
                                                    </h6>
                                                    <p className="mb-2">
                                                        <strong>Courier:</strong> {selectedOrder.deliveryInfo.courier_service}
                                                    </p>
                                                    <p className="mb-2">
                                                        <strong>Tracking Number:</strong>
                                                        <code className="bg-light p-2 rounded ms-2 d-inline-block">
                                                            {selectedOrder.deliveryInfo.tracking_number}
                                                        </code>
                                                    </p>
                                                    {selectedOrder.deliveryInfo.estimated_delivery && (
                                                        <p className="mb-0">
                                                            <strong>Estimated Delivery:</strong>{' '}
                                                            {new Date(selectedOrder.deliveryInfo.estimated_delivery).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-muted">No shipping information available</p>
                                    )}
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col-12">
                                    <h6><i className="fas fa-shopping-bag me-2"></i>Order Items</h6>
                                    <div className="table-responsive">
                                        <table className="table table-striped">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th>Product</th>
                                                    <th className="text-end">Price</th>
                                                    <th className="text-center">Quantity</th>
                                                    <th className="text-end">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrder.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.product_name || item.name}</td>
                                                        <td className="text-end">{formatCurrency(item.price)}</td>
                                                        <td className="text-center">{item.quantity}</td>
                                                        <td className="text-end">{formatCurrency(item.price * item.quantity)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                {selectedOrder.shipping && selectedOrder.shipping.fee > 0 && (
                                                    <tr>
                                                        <td colSpan="3" className="text-end"><strong>Shipping Fee:</strong></td>
                                                        <td className="text-end">{formatCurrency(selectedOrder.shipping.fee)}</td>
                                                    </tr>
                                                )}
                                                <tr className="table-primary">
                                                    <td colSpan="3" className="text-end"><strong>Total Amount:</strong></td>
                                                    <td className="text-end"><strong>{formatCurrency(selectedOrder.total)}</strong></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {selectedOrder.notes && (
                                <div className="alert alert-info">
                                    <strong><i className="fas fa-sticky-note me-2"></i>Order Notes:</strong>
                                    <p className="mb-0 mt-2">{selectedOrder.notes}</p>
                                </div>
                            )}

                            {/* Contact Support */}
                            <div className="alert alert-light border">
                                <strong><i className="fas fa-headset me-2"></i>Need Help?</strong>
                                <p className="mb-0 mt-2">
                                    If you have any questions about your order, please contact us at:
                                    <br/>
                                    📞 +63 917 887 0926 | 📧 omgeescakes@gmail.com
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            {/* Mark as Received Button for In-Transit Orders */}
                            {selectedOrder.status === 'in-transit' && (
                                <button
                                    className="btn btn-success"
                                    onClick={() => handleMarkAsReceived(selectedOrder)}
                                    disabled={markingAsReceived}
                                >
                                    {markingAsReceived ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-check-circle me-2"></i>
                                            Mark as Received
                                        </>
                                    )}
                                </button>
                            )}
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={() => setSelectedOrder(null)}
                            >
                                <i className="fas fa-times me-2"></i>Close
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
                            <div className="card-header bg-primary text-white">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h2 className="mb-1">
                                            <i className="fas fa-box me-2"></i>Track Your Orders
                                        </h2>
                                        <p className="mb-0 small opacity-75">
                                            Monitor the status of your online orders in real-time
                                        </p>
                                    </div>
                                    <div>
                                        <span className="badge bg-white text-primary fs-5">
                                            {userOrders.length} Order{userOrders.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Content */}
                            <div className="card-body p-4">
                                {loading && userOrders.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-3 text-muted">Loading your orders...</p>
                                    </div>
                                ) : userOrders.length > 0 ? (
                                    <div className="row g-4">
                                        {userOrders.map(order => {
                                            const orderStatus = order.status || 'pending';
                                            return (
                                                <div key={order.orderId} className="col-md-6 col-lg-4">
                                                    <div className="card h-100 border shadow-sm hover-shadow" 
                                                         style={{transition: 'all 0.3s', cursor: 'pointer'}}
                                                         onClick={() => setSelectedOrder(order)}
                                                         onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                                         onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                                        <div className={`card-header bg-${getStatusColor(orderStatus)} text-white`}>
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <small>
                                                                    <i className={`fas ${getStatusIcon(orderStatus)} me-2`}></i>
                                                                    {getStatusDisplayText(orderStatus)}
                                                                </small>
                                                                <small>
                                                                    <i className="fas fa-calendar me-1"></i>
                                                                    {new Date(order.timestamp || order.date).toLocaleDateString()}
                                                                </small>
                                                            </div>
                                                        </div>
                                                        <div className="card-body">
                                                            <h6 className="card-title">
                                                                <i className="fas fa-hashtag me-1 text-muted"></i>
                                                                <code>{order.orderId}</code>
                                                            </h6>
                                                            
                                                            <div className="mb-2">
                                                                <small className="text-muted d-block">
                                                                    <i className="fas fa-box me-1"></i>
                                                                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                                                </small>
                                                                <div className="small text-muted mt-1" style={{maxHeight: '40px', overflow: 'hidden'}}>
                                                                    {order.items.slice(0, 2).map((item, idx) => (
                                                                        <div key={idx}>• {item.product_name || item.name}</div>
                                                                    ))}
                                                                    {order.items.length > 2 && (
                                                                        <div className="text-primary">+ {order.items.length - 2} more</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            <hr/>
                                                            
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <div>
                                                                    <small className="text-muted">Total Amount</small>
                                                                    <div className="fw-bold text-primary">{formatCurrency(order.total)}</div>
                                                                </div>
                                                                <button className="btn btn-sm btn-outline-primary">
                                                                    <i className="fas fa-eye me-1"></i>
                                                                    View Details
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <i className="fas fa-shopping-bag display-1 text-muted mb-4"></i>
                                        <h4>No Orders Yet</h4>
                                        <p className="text-muted mb-4">You haven't placed any orders yet. Start shopping to see your orders here!</p>
                                        <Link to="/" className="btn btn-primary">
                                            <i className="fas fa-shopping-cart me-2"></i>Start Shopping
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Auto-refresh indicator */}
                            {userOrders.length > 0 && (
                                <div className="card-footer bg-light text-center border-0">
                                    <small className="text-muted">
                                        <i className="fas fa-sync-alt me-1"></i>
                                        Orders update automatically every 10 seconds
                                    </small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Order Details Modal */}
            <OrderDetailsModal />
        </div>
    );
}

export default TrackOrder;