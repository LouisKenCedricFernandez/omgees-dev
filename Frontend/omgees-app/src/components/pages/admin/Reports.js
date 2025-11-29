import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';

function Reports() {
  const [completedOrders, setCompletedOrders] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch completed orders from backend
  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:5000/reports')
      .then(res => res.json())
      .then(data => {
        console.log('📊 Received reports data:', data);
        setCompletedOrders(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching reports:', error);
        setLoading(false);
      });
  }, []);

  // Filter orders based on date range and type
  const filteredOrders = useMemo(() => {
    return completedOrders.filter(order => {
      const orderDate = new Date(order.date || order.timestamp);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      const dateInRange = (!start || orderDate >= start) && (!end || orderDate <= end);
      const typeMatch = typeFilter === 'all' || order.type === typeFilter;
      
      return dateInRange && typeMatch;
    });
  }, [completedOrders, startDate, endDate, typeFilter]);

  // Calculate product-level analytics
  const productAnalytics = useMemo(() => {
    const productMap = {};

    filteredOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const productId = item.product_id || item.id;
        const productName = item.product_name || item.name;
        const quantity = parseInt(item.quantity) || 0;
        const subtotal = parseFloat(item.subtotal) || 0;
        
        // Parse variant from JSON string if needed
        let variant = item.selectedVariant;
        if (typeof variant === 'string') {
          try {
            variant = JSON.parse(variant);
          } catch (e) {
            console.log('Could not parse variant:', variant);
            variant = null;
          }
        }

        // Extract variant name/size from the parsed object
        const variantName = variant?.size || variant?.name || variant?.variant || 'Standard';

        const key = `${productId}-${variantName}`;

        if (!productMap[key]) {
          productMap[key] = {
            productId: productId,
            productName: productName,
            variantName: variantName,
            variant: variant,
            totalQuantitySold: 0,
            totalRevenue: 0,
            orderCount: 0,
            orders: []
          };
        }

        productMap[key].totalQuantitySold += quantity;
        productMap[key].totalRevenue += subtotal;
        productMap[key].orderCount += 1;
        productMap[key].orders.push({
          orderNumber: order.order_number,
          date: order.date,
          quantity: quantity,
          subtotal: subtotal
        });
      });
    });

    // Convert to array and sort by revenue
    return Object.values(productMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredOrders]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
    const totalItems = filteredOrders.reduce((sum, order) => {
      return sum + (order.items || []).reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);
    
    const onlineOrders = filteredOrders.filter(o => o.type === 'online').length;
    const inStoreOrders = filteredOrders.filter(o => o.type === 'in-store').length;

    const uniqueProducts = productAnalytics.length;
    const topProduct = productAnalytics[0] || null;

    return {
      totalOrders,
      totalRevenue,
      totalItems,
      onlineOrders,
      inStoreOrders,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      uniqueProducts,
      topProduct
    };
  }, [filteredOrders, productAnalytics]);

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setTypeFilter('all');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // Generate Excel File
  const exportToExcel = () => {
    const excelData = productAnalytics.map(product => {
      return {
        'Product ID': product.productId,
        'Product Name': product.productName,
        'Variant': product.variantName,
        'Quantity Sold': product.totalQuantitySold,
        'Total Revenue (₱)': product.totalRevenue
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Sales');
    
    const date = new Date().toISOString().split('T')[0];
    const dateRange = startDate && endDate ? `_${startDate}_to_${endDate}` : '';
    XLSX.writeFile(workbook, `Product_Sales_Report${dateRange}_${date}.xlsx`);
    setShowExportConfirm(false);
  };

  const renderFilters = () => (
    <div className="row g-3 align-items-end">
      <div className="col-md-3">
        <label className="form-label fw-semibold">Start Date</label>
        <input 
          type="date" 
          className="form-control"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          max={endDate || undefined}
        />
      </div>
      <div className="col-md-3">
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
        <label className="form-label fw-semibold">Order Type</label>
        <select 
          className="form-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Orders</option>
          <option value="online">Online Orders</option>
          <option value="in-store">In-Store Orders</option>
        </select>
      </div>
      <div className="col-md-3">
        <div className="d-flex gap-2">
          <button className="btn btn-outline-danger" onClick={resetFilters}>
            <i className="bi bi-arrow-clockwise"></i> Reset
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowExportConfirm(true)}
            disabled={filteredOrders.length === 0}
          >
            <i className="bi bi-download"></i> Export to Excel
          </button>
        </div>
      </div>
    </div>
  );

  const renderProductsTable = () => (
    <div className="table-responsive" style={{maxHeight: '500px', overflowY: 'auto'}}>
      <table className="table table-hover mb-0">
        <thead className="table-dark sticky-top">
          <tr>
            <th scope="col">Product ID</th>
            <th scope="col">Product Name</th>
            <th scope="col" className="text-center">Variant</th>
            <th scope="col" className="text-center">Qty Sold</th>
            <th scope="col" className="text-end">Total Revenue</th>
          </tr>
        </thead>
        <tbody>
          {productAnalytics.length > 0 ? productAnalytics.map((product, index) => {
            return (
              <tr key={`${product.productId}-${index}`}>
                <td><code className="small">{product.productId}</code></td>
                <td>{product.productName}</td>
                <td className="text-center">{product.variantName}</td>
                <td className="text-center">
                  <strong className="text-primary">{product.totalQuantitySold}</strong>
                </td>
                <td className="text-end fw-semibold">
                  {formatCurrency(product.totalRevenue)}
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan="5" className="text-center py-5 text-muted">
                <i className="bi bi-box fs-1 d-block mb-3"></i>
                <h5>No product data found</h5>
              </td>
            </tr>
          )}
        </tbody>
        {productAnalytics.length > 0 && (
          <tfoot className="table-light">
            <tr className="fw-bold">
              <td colSpan="3">Total ({productAnalytics.length} unique products)</td>
              <td className="text-center">{summaryStats.totalItems}</td>
              <td className="text-end">{formatCurrency(summaryStats.totalRevenue)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );

  const ExportModal = () => (
    showExportConfirm && (
      <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-file-earmark-excel text-success me-2"></i>
                Export Product Sales Report
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowExportConfirm(false)}></button>
            </div>
            <div className="modal-body">
              <p className="mb-2">
                You are about to export <strong>{productAnalytics.length} products</strong> to an Excel file.
              </p>
              <p className="text-muted mb-0">
                <i className="bi bi-info-circle me-1"></i>
                The file will include Product ID, Product Name, Variant, Quantity Sold, and Total Revenue.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowExportConfirm(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-success" 
                onClick={exportToExcel}
              >
                <i className="bi bi-download me-2"></i>
                Export Now
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="container-fluid bg-light min-vh-100">
      <div className="container py-5">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <div className="mt-3">Loading report data...</div>
          </div>
        ) : (
          <>
            <div className="row">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  {/* Report Header */}
                  <div className="card-header bg-white border-0 pb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h2 className="mb-0">Product Sales Analytics</h2>
                      <span className="badge bg-success">
                        {productAnalytics.length} products
                      </span>
                    </div>
                    {renderFilters()}
                  </div>
                  
                  {/* Products Table */}
                  <div className="card-body p-0 mt-3">
                    {renderProductsTable()}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {/* Export Modal */}
      <ExportModal />
    </div>
  );
}

export default Reports;