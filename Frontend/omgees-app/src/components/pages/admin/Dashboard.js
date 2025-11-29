import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ComposedChart from './charts/ComposedChart';
import axios from 'axios';

function Dashboard({ user, onLogout, activities = [], orders = [], inventory = [] }) {
  const [dborders, setdbOrders] = useState(orders);
  const [dbinventory, setdbInventory] = useState(inventory);

  console.log('User object:', user);

  // Fetch latest orders and inventory from backend
  useEffect(() => {
    axios.get('http://localhost:5000/manage-orders').then(res => setdbOrders(res.data));
    axios.get('http://localhost:5000/inventory').then(res => setdbInventory(res.data));
  }, []);

  useEffect(() => {
    console.log('dbinventory:', dbinventory);
  }, [dbinventory]);

  // Calculate real-time statistics from actual data
  const statistics = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = dborders.filter(order => 
      new Date(order.date).toDateString() === today
    );

    const todayRevenue = todayOrders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + order.total, 0);

    const totalUsers = [...new Set(dborders.map(order => 
      order.customer.email || order.customer.name
    ))].length;

    const activeOrders = dborders.filter(order => 
      ['pending', 'processing', 'ready'].includes(order.status)
    ).length;
    
    return {
      totalUsers: totalUsers || 0,
      activeOrders,
      todayRevenue,
      systemUptime: 98
    };
  }, [dborders]);

  // Calculate order status breakdown
  const orderStatusBreakdown = useMemo(() => {
    const pending = dborders.filter(order => order.status === 'pending').length;
    const verified = dborders.filter(order => order.status === 'verified').length;
    const inTransit = dborders.filter(order => order.status === 'in-transit').length;
    const completed = dborders.filter(order => order.status === 'completed').length;
    const cancelled = dborders.filter(order => order.status === 'cancelled').length;

    return {
      pending,
      verified,
      inTransit,
      completed,
      cancelled,
      total: dborders.length
    };
  }, [dborders]);

  // Get low stock alerts from real inventory data
  const lowStockAlerts = useMemo(() => {
    return dbinventory.filter(item => 
      item.stock <= item.lowStockThreshold && 
      item.stock > 0 && 
      item.status === 'active'
    );
  }, [dbinventory]);

  // Get out of stock items
  const outOfStockItems = useMemo(() => {
    return dbinventory.filter(item => 
      item.stock === 0 && item.status === 'active'
    );
  }, [dbinventory]);

  dborders.forEach(order => {
    if (!order.date || isNaN(new Date(order.date).getTime())) {
      console.warn('Order with invalid date:', order);
    }
  });

  const getDateString = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  };

  const salesChartData = useMemo(() => {
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);

      const dayOrders = dborders.filter(order => {
        const orderDateStr = getDateString(order.date);
        return orderDateStr && orderDateStr === dateStr && order.status === 'completed';
      });

      const revenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
      const orderCount = dayOrders.length;

      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue,
        orders: orderCount,
        fullDate: dateStr
      });
    }
    return last7Days;
  }, [dborders]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // Order Status Visualization Component
  const OrderStatusCard = () => {
    const total = orderStatusBreakdown.total || 1;
    const statusData = [
      { 
        status: 'Pending', 
        count: orderStatusBreakdown.pending, 
        color: 'warning', 
        icon: 'fa-clock',
        percentage: (orderStatusBreakdown.pending / total) * 100
      },
      { 
        status: 'Verified', 
        count: orderStatusBreakdown.verified, 
        color: 'info', 
        icon: 'fa-check-circle',
        percentage: (orderStatusBreakdown.verified / total) * 100
      },
      { 
        status: 'Out for Delivery', 
        count: orderStatusBreakdown.inTransit, 
        color: 'primary', 
        icon: 'fa-truck',
        percentage: (orderStatusBreakdown.inTransit / total) * 100
      },
      { 
        status: 'Completed', 
        count: orderStatusBreakdown.completed, 
        color: 'success', 
        icon: 'fa-check-double',
        percentage: (orderStatusBreakdown.completed / total) * 100
      }
    ];

    return (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-header bg-white border-0">
          <h5 className="card-title mb-0">
            <i className="fas fa-chart-pie me-2"></i>
            Order Status Overview
          </h5>
        </div>
        <div className="card-body pt-2">
          {/* Status Cards Grid */}
          <div className="row g-2 mb-4">
            {statusData.map((item, index) => (
              <div key={index} className="col-6">
                <div className={`bg-${item.color} bg-opacity-10 rounded p-3 text-center`}>
                  <div className={`text-${item.color} mb-2`} style={{ fontSize: '1.5rem' }}>
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  <div className={`fw-bold text-${item.color}`} style={{ fontSize: '1.25rem' }}>
                    {item.count}
                  </div>
                  <small className="text-muted">{item.status}</small>
                </div>
              </div>
            ))}
          </div>

          {/* Cancelled Orders Alert */}
          {orderStatusBreakdown.cancelled > 0 && (
            <div className="alert alert-danger mb-0 py-2">
              <small>
                <i className="fas fa-exclamation-circle me-1"></i>
                <strong>{orderStatusBreakdown.cancelled}</strong> Rejected Orders{orderStatusBreakdown.cancelled > 1 ? 's' : ''}
              </small>
            </div>
          )}

          {/* In-Transit Quick Actions */}
          {orderStatusBreakdown.inTransit > 0 && (
            <div className="alert alert-info mb-0 mt-2 py-2">
              <small>
                <i className="fas fa-truck me-1"></i>
                <strong>{orderStatusBreakdown.inTransit}</strong> order{orderStatusBreakdown.inTransit > 1 ? 's' : ''} currently being delivered
              </small>
            </div>
          )}
        </div>

        {/* Card Footer with Quick Links */}
        <div className="card-footer bg-light border-0 pt-2 pb-2">
          <div className="d-grid gap-2">
            <Link to="/admin/logs" className="btn btn-sm btn-outline-primary">
              <i className="fas fa-list me-1"></i>View All Orders
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid bg-light min-vh-100">
      <div className="container py-5">
        {/*Admin Welcome Card with Real-time Alerts*/} 
        <div className="row">
          <div className="col-12">
            <div className="bg-white rounded-3 shadow-sm p-4 mb-4 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <div className="bg-danger bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-shield-fill-check text-danger fs-4"></i>
                </div>    
                <div>
                  <h3 className="mb-1">Welcome!</h3>
                  <span className="badge bg-danger">Administrator</span>
                </div>
              </div>
              {/* Real Alert badges */}
              <div className="d-flex gap-2">
                {outOfStockItems.length > 0 && (
                  <span className="badge bg-danger">
                    <i className="bi bi-exclamation-octagon me-1"></i>
                    {outOfStockItems.length} Out of Stock
                  </span>
                )}
                {lowStockAlerts.length > 0 && (
                  <span className="badge bg-warning text-dark">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    {lowStockAlerts.length} Low Stock Alert{lowStockAlerts.length > 1 ? 's' : ''}
                  </span>
                )}
                {statistics.activeOrders > 0 && (
                  <span className="badge bg-info">
                    <i className="bi bi-clock me-1"></i>
                    {statistics.activeOrders} Active Order{statistics.activeOrders > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/*Real-time Statistics Cards from Transaction Data*/}
        <div className="row g-3 mb-4">
          <div className="col-lg-3 col-md-6">
            <div className="card bg-primary text-white border-0 shadow-sm">
              <div className="card-body d-flex align-items-center">
                <div className="flex-grow-1">
                  <h4 className="mb-1">{statistics.totalUsers}</h4>
                  <p className="mb-0">Total Customers</p>
                </div>
                <i className="bi bi-people fs-2 opacity-75"></i>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card bg-success text-white border-0 shadow-sm">
              <div className="card-body d-flex align-items-center">
                <div className="flex-grow-1">
                  <h4 className="mb-1">{statistics.activeOrders}</h4>
                  <p className="mb-0">Active Orders</p>
                </div>
                <i className="bi bi-bag-check fs-2 opacity-75"></i>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card bg-warning text-white border-0 shadow-sm">
              <div className="card-body d-flex align-items-center">
                <div className="flex-grow-1">
                  <h4 className="mb-1">{formatCurrency(statistics.todayRevenue)}</h4>
                  <p className="mb-0">Today's Revenue</p>
                </div>
                <i className="bi bi-currency-dollar fs-2 opacity-75"></i>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card bg-info text-white border-0 shadow-sm">
              <div className="card-body d-flex align-items-center">
                <div className="flex-grow-1">
                  <h4 className="mb-1">
                    {dbinventory.filter(i => (i.product_status || '').toLowerCase() === 'active').length}
                  </h4>
                  <p className="mb-0">Active Products</p>
                </div>
                <i className="bi bi-box fs-2 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        
        {/*Real Sales Chart and Order Status Overview*/}
        <div className="row g-4">
          <div className="col-lg-8 col-xl-7">
            <div className="bg-white rounded-3 shadow-sm p-4" style={{height: '60vh'}}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-capitalize mb-0">Sales Overview (Last 7 Days)</h2>
                <div className="text-end">
                  <small className="text-muted">Total: {formatCurrency(salesChartData.reduce((sum, day) => sum + day.revenue, 0))}</small>
                </div>
              </div>
              <ComposedChart data={salesChartData} />
            </div>
          </div>

          {/* Order Status Visualization */}
          <div className="col-lg-4 col-xl-5">
            <OrderStatusCard />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;