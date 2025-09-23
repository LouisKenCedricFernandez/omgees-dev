import React, { useState } from 'react';
import { useAuth } from '../../Authentication';

function Profile({ orders = [], onOrderUpdate }) { 
    const { currentUser, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [editingOrder, setEditingOrder] = useState(null);
    const [editedItems, setEditedItems] = useState([]);
    const [editedAddress, setEditedAddress] = useState('');

    // Initialize form data when editing starts
    const startEditing = () => {
        setFormData({
            ...currentUser
        });
        setIsEditing(true);
    };

    // Add the missing handleSubmit function
    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.name && formData.email) {
            updateUser(formData);
            setIsEditing(false);
            alert('Profile updated successfully!');
        }
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

    // Filter orders for current user
    const userOrders = orders.filter(order => 
        order.customer?.email === currentUser?.email || 
        order.createdBy === currentUser?.email
    );

    // Handle order cancellation
    const handleCancelOrder = (orderId) => {
        const confirmation = window.confirm('Are you sure you want to cancel this order?');
        if (confirmation && onOrderUpdate) {
            const updatedOrders = orders.map(order =>
                order.orderId === orderId 
                    ? { ...order, status: 'cancelled' }
                    : order
            );
            onOrderUpdate(updatedOrders);
            setSelectedOrder(null);
            alert('Order cancelled successfully');
        }
    };

    // Initialize editing when modal opens
    const startEditingOrder = (order) => {
        setEditedItems([...order.items]);
        setEditedAddress(order.customer.address);
        setEditingOrder(order);
        setSelectedOrder(null);
    };

    const updateItemQuantity = (itemIndex, newQuantity) => {
        if (newQuantity <= 0) {
            setEditedItems(editedItems.filter((_, index) => index !== itemIndex));
        } else {
            setEditedItems(editedItems.map((item, index) => 
                index === itemIndex ? { ...item, quantity: newQuantity } : item
            ));
        }
    };

    const getEditedTotal = () => {
        return editedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const handleSaveChanges = () => {
        if (editedItems.length === 0) {
            alert('Cannot save order with no items');
            return;
        }

        const updatedOrder = {
            ...editingOrder,
            items: editedItems,
            total: getEditedTotal(),
            customer: {
                ...editingOrder.customer,
                address: editedAddress
            }
        };

        if (onOrderUpdate) {
            const updatedOrders = orders.map(order =>
                order.orderId === editingOrder.orderId ? updatedOrder : order
            );
            onOrderUpdate(updatedOrders);
        }

        setEditingOrder(null);
        alert('Order updated successfully!');
    };

    // Order Details Modal with Edit Capability
    const OrderDetailsModal = () => {
        if (!selectedOrder) return null;

        const canEdit = selectedOrder.status === 'pending' && selectedOrder.orderType === 'online';

        return (
            <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
                <div className="modal-dialog modal-xl">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Order Details - {selectedOrder.orderId}</h5>
                            <button type="button" className="btn-close" onClick={() => setSelectedOrder(null)}></button>
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
                                                <td><strong>Date:</strong></td>
                                                <td>{new Date(selectedOrder.timestamp).toLocaleDateString()}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Status:</strong></td>
                                                <td>
                                                    <span className={`badge bg-${getStatusColor(selectedOrder.status)}`}>
                                                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td><strong>Payment:</strong></td>
                                                <td>{selectedOrder.payment.method.toUpperCase()}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="col-md-6">
                                    <h6>Shipping Information</h6>
                                    {selectedOrder.shipping && (
                                        <table className="table table-sm">
                                            <tbody>
                                                <tr>
                                                    <td><strong>Method:</strong></td>
                                                    <td>{selectedOrder.shipping.name || 'Customer Arranged'}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Address:</strong></td>
                                                    <td>{selectedOrder.customer.address}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col-12">
                                    <h6>Order Items</h6>
                                    <div className="table-responsive">
                                        <table className="table table-striped">
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Price</th>
                                                    <th>Quantity</th>
                                                    <th>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrder.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.displayName || item.name}</td>
                                                        <td>{formatCurrency(item.price)}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>{formatCurrency(item.price * item.quantity)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td colSpan="3"><strong>Total:</strong></td>
                                                    <td><strong>{formatCurrency(selectedOrder.total)}</strong></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                                Close
                            </button>
                            {canEdit && (
                                <>
                                    <button 
                                        type="button" 
                                        className="btn btn-warning"
                                        onClick={() => startEditingOrder(selectedOrder)}
                                    >
                                        <i className="fas fa-edit me-2"></i>Edit Order
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-danger"
                                        onClick={() => handleCancelOrder(selectedOrder.orderId)}
                                    >
                                        <i className="fas fa-times me-2"></i>Cancel Order
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Order Edit Modal
    const OrderEditModal = () => {
        if (!editingOrder) return null;

        return (
            <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Edit Order - {editingOrder.orderId}</h5>
                            <button type="button" className="btn-close" onClick={() => setEditingOrder(null)}></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">Delivery Address</label>
                                <textarea 
                                    className="form-control"
                                    rows="3"
                                    value={editedAddress}
                                    onChange={(e) => setEditedAddress(e.target.value)}
                                />
                            </div>

                            <h6>Order Items</h6>
                            <div className="table-responsive">
                                <table className="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Price</th>
                                            <th>Quantity</th>
                                            <th>Total</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {editedItems.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.displayName || item.name}</td>
                                                <td>{formatCurrency(item.price)}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <button 
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                                        >
                                                            -
                                                        </button>
                                                        <span className="mx-2">{item.quantity}</span>
                                                        <button 
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </td>
                                                <td>{formatCurrency(item.price * item.quantity)}</td>
                                                <td>
                                                    <button 
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => updateItemQuantity(index, 0)}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="3"><strong>New Total:</strong></td>
                                            <td><strong>{formatCurrency(getEditedTotal())}</strong></td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setEditingOrder(null)}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleSaveChanges}>
                                <i className="fas fa-save me-2"></i>Save Changes
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
                                    <h2 className="mb-0">My Profile</h2>
                                    <div className="d-flex gap-2">
                                        <span className="badge bg-info">{userOrders.length} orders</span>
                                    </div>
                                </div>

                                {/* Tab Navigation */}
                                <ul className="nav nav-tabs">
                                    <li className="nav-item">
                                        <button 
                                            className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('profile')}
                                        >
                                            <i className="fas fa-user me-2"></i>
                                            Profile Information
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button 
                                            className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('orders')}
                                        >
                                            <i className="fas fa-shopping-bag me-2"></i>
                                            Order History ({userOrders.length})
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            
                            {/* Content */}
                            <div className="card-body">
                                {activeTab === 'profile' ? (
                                    <div className="row">
                                        <div className="col-lg-8 mx-auto">
                                            <div className="row mb-4">
                                                <div className="col-md-4 text-center mb-3">
                                                    <div className="bg-primary rounded-circle mx-auto d-flex align-items-center justify-content-center" 
                                                         style={{width: '120px', height: '120px'}}>
                                                        <i className="fas fa-user text-white" style={{fontSize: '3rem'}}></i>
                                                    </div>
                                                    <h5 className="mt-3">{currentUser?.name}</h5>
                                                    <p className="text-muted">{currentUser?.type?.replace('_', ' ')}</p>
                                                </div>
                                                <div className="col-md-8">
                                                    {isEditing ? (
                                                        <form onSubmit={handleSubmit}>
                                                            <div className="row mb-3">
                                                                <div className="col-md-6">
                                                                    <label className="form-label">Full Name</label>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control"
                                                                        value={formData.name || ''}
                                                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                                        required
                                                                    />
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <label className="form-label">Email Address</label>
                                                                    <input
                                                                        type="email"
                                                                        className="form-control"
                                                                        value={formData.email || ''}
                                                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="row mb-3">
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
                                                                    rows="3"
                                                                    value={formData.address || ''}
                                                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                                                ></textarea>
                                                            </div>
                                                            <div className="d-flex gap-2">
                                                                <button type="submit" className="btn btn-primary">
                                                                    <i className="fas fa-save me-2"></i>Save Changes
                                                                </button>
                                                                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </form>
                                                    ) : (
                                                        <div>
                                                            <table className="table table-borderless">
                                                                <tbody>
                                                                    <tr>
                                                                        <td><strong>Email:</strong></td>
                                                                        <td>{currentUser?.email}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td><strong>Phone:</strong></td>
                                                                        <td>{currentUser?.phone || 'Not provided'}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td><strong>Address:</strong></td>
                                                                        <td>{currentUser?.address || 'Not provided'}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                            <button className="btn btn-primary" onClick={startEditing}>
                                                                <i className="fas fa-edit me-2"></i>Edit Profile
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th>Order ID</th>
                                                    <th>Date</th>
                                                    <th>Items</th>
                                                    <th>Total</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userOrders.length > 0 ? (
                                                    userOrders.map(order => (
                                                        <tr key={order.orderId}>
                                                            <td>
                                                                <code className="small">{order.orderId}</code>
                                                            </td>
                                                            <td>
                                                                <div>
                                                                    <div className="small">{new Date(order.timestamp).toLocaleDateString()}</div>
                                                                    <small className="text-muted">{new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div>
                                                                    <strong>{order.items.length}</strong> item{order.items.length > 1 ? 's' : ''}
                                                                    <div className="small text-muted">
                                                                        {order.items.slice(0, 2).map(item => 
                                                                            item.displayName || item.name
                                                                        ).join(', ')}
                                                                        {order.items.length > 2 && '...'}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <strong>{formatCurrency(order.total)}</strong>
                                                                {order.shipping?.method && (
                                                                    <div className="small text-muted">
                                                                        {order.shipping.method === 'pickup' ? 'Pickup' : 'Delivery'}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className={`badge bg-${getStatusColor(order.status)}`}>
                                                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <button 
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    onClick={() => setSelectedOrder(order)}
                                                                >
                                                                    <i className="fas fa-eye me-1"></i>View
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" className="text-center py-4 text-muted">
                                                            <i className="fas fa-shopping-bag fs-1 d-block mb-3"></i>
                                                            <h5>No orders yet</h5>
                                                            <p>Start shopping to see your order history here</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Add modals here */}
            <OrderDetailsModal />
            <OrderEditModal />
        </div>
    );
}

export default Profile;