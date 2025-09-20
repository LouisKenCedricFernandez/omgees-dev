import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import ComposedChart from './charts/ComposedChart';

function Dashboard({ user, onLogout, activities = [], orders = [], inventory = [] }) {
  
  // Calculate real-time statistics from actual data
  const statistics = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(order => 
      new Date(order.timestamp).toDateString() === today
    );
    
    const todayRevenue = todayOrders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + order.total, 0);
    
    const totalUsers = [...new Set(orders.map(order => 
      order.customer.email || order.customer.name
    ))].length;
    
    const activeOrders = orders.filter(order => 
      ['pending', 'processing', 'ready'].includes(order.status)
    ).length;
    
    return {
      totalUsers: totalUsers || 0,
      activeOrders,
      todayRevenue,
      systemUptime: 98 // You can implement real uptime calculation
    };
  }, [orders]);

  // Get low stock alerts from real inventory data
  const lowStockAlerts = useMemo(() => {
    return inventory.filter(item => 
      item.stock <= item.lowStockThreshold && 
      item.stock > 0 && 
      item.status === 'active'
    );
  }, [inventory]);

  // Get out of stock items
  const outOfStockItems = useMemo(() => {
    return inventory.filter(item => 
      item.stock === 0 && item.status === 'active'
    );
  }, [inventory]);

  // Process sales data for the ComposedChart
  const salesChartData = useMemo(() => {
    const last7Days = [];
    const today = new Date();
    
    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      const dayOrders = orders.filter(order => 
        new Date(order.timestamp).toDateString() === dateStr &&
        order.status === 'completed'
      );
      
      const revenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
      const orderCount = dayOrders.length;
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: revenue,
        orders: orderCount,
        fullDate: dateStr
      });
    }
    
    return last7Days;
  }, [orders]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
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
                  <h3 className="mb-1">Welcome, {user.name}!</h3>
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
                  <h4 className="mb-1">{inventory.filter(i => i.status === 'active').length}</h4>
                  <p className="mb-0">Active Products</p>
                </div>
                <i className="bi bi-box fs-2 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        
        {/*Real Sales Chart and Activities*/}
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

          {/* Real-time Activities from actual logs */}
          <div className="col-lg-4 col-xl-5">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">
                  Recent Activities 
                  <span className="badge bg-primary ms-2">{activities.length}</span>
                </h5>
                <Link to="/admin/logs" className="btn btn-sm btn-outline-primary">
                  View all
                </Link> 
              </div>
              <div className="card-body" style={{maxHeight: '320px', overflowY: 'auto'}}>
                {activities.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-clock fs-3 mb-2"></i>
                    <p className="mb-0">No recent activities</p>
                    <small>Activities will appear here as transactions occur</small>
                  </div>
                ) : (
                  activities.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="activity-item d-flex align-items-start mb-3">
                      <div className={`activity-icon bg-${activity.color || 'secondary'} bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0`} style={{width: '32px', height: '32px'}}>
                        <i className={`bi bi-${activity.icon || 'info-circle'} text-${activity.color || 'secondary'}`} style={{fontSize: '0.8rem'}}></i>
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-1 fw-semibold small">{activity.action}</p>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small className="text-muted">by {activity.user}</small>
                          <small className="text-muted">{formatTimeAgo(activity.timestamp)}</small>
                        </div>
                        {activity.details && (
                          <small className="text-info">
                            {activity.details.customer && `Customer: ${activity.details.customer}`}
                            {activity.details.total && ` | ${formatCurrency(activity.details.total)}`}
                            {activity.details.itemCount && ` | ${activity.details.itemCount} items`}
                          </small>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Stock Alerts Section with Real Data */}
              {(lowStockAlerts.length > 0 || outOfStockItems.length > 0) && (
                <div className="card-footer bg-light border-0 pt-3">
                  <h6 className="text-warning mb-2">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    Inventory Alerts
                  </h6>
                  <div style={{maxHeight: '120px', overflowY: 'auto'}}>
                    {outOfStockItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="d-flex justify-content-between align-items-center py-1">
                        <small className="text-truncate me-2">{item.name} ({item.size})</small>
                        <span className="badge bg-danger">Out of Stock</span>
                      </div>
                    ))}
                    {lowStockAlerts.slice(0, 3).map((item) => (
                      <div key={item.id} className="d-flex justify-content-between align-items-center py-1">
                        <small className="text-truncate me-2">{item.name} ({item.size})</small>
                        <span className="badge bg-warning text-dark">{item.stock} left</span>
                      </div>
                    ))}
                    {(lowStockAlerts.length + outOfStockItems.length) > 6 && (
                      <small className="text-muted">...and {(lowStockAlerts.length + outOfStockItems.length) - 6} more items</small>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;