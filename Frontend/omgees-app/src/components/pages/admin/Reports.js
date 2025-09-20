import React, { useState, useMemo } from 'react';

function Reports({ transactions = [], inventory = [] }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [movementFilter, setMovementFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showExportModal, setShowExportModal] = useState(false);

  // Calculate product sales and movement from real transaction data
  const productAnalysis = useMemo(() => {
    // Get completed transactions within date range
    const filteredTransactions = transactions.filter(transaction => {
      if (transaction.status !== 'completed') return false;
      
      const transactionDate = new Date(transaction.timestamp);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      return (!start || transactionDate >= start) && (!end || transactionDate <= end);
    });

    // Aggregate sales data by product
    const productSales = {};
    
    filteredTransactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const productKey = item.selectedVariant ? 
          `${item.name}-${item.selectedVariant.size}` : 
          `${item.displayName || item.name}`;
        
        if (!productSales[productKey]) {
          productSales[productKey] = {
            name: item.displayName || item.name,
            baseProductId: item.baseProductId || item.id,
            size: item.selectedVariant?.size || item.size || 'Standard',
            category: item.category || 'Unknown',
            qtySold: 0,
            totalRevenue: 0,
            avgPrice: 0,
            transactions: 0
          };
        }
        
        productSales[productKey].qtySold += item.quantity;
        productSales[productKey].totalRevenue += item.price * item.quantity;
        productSales[productKey].transactions += 1;
        productSales[productKey].avgPrice = productSales[productKey].totalRevenue / productSales[productKey].qtySold;
      });
    });

    // Add movement classification and inventory data
    const productsWithMovement = Object.values(productSales).map(product => {
      // Find matching inventory item
      const inventoryItem = inventory.find(item => 
        item.baseProductId === product.baseProductId || 
        (item.name === product.name && item.size === product.size)
      );

      // Classify movement based on quantity sold
      let movement = 'Non-moving';
      let movementColor = 'danger';
      
      if (product.qtySold >= 50) {
        movement = 'Fast-moving';
        movementColor = 'success';
      } else if (product.qtySold >= 20) {
        movement = 'Medium-moving';
        movementColor = 'info';
      } else if (product.qtySold >= 5) {
        movement = 'Slow-moving';
        movementColor = 'warning';
      }

      return {
        ...product,
        movement,
        movementColor,
        currentStock: inventoryItem?.stock || 0,
        stockStatus: inventoryItem?.status || 'inactive',
        lowStockThreshold: inventoryItem?.lowStockThreshold || 0,
        type: inventoryItem?.category === 'ingredients' ? 'Perishable' : 'Non-Perishable'
      };
    });

    return productsWithMovement;
  }, [transactions, inventory, startDate, endDate]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    return [...new Set(productAnalysis.map(p => p.category))];
  }, [productAnalysis]);

  // Filter products based on filters
  const filteredProducts = useMemo(() => {
    return productAnalysis.filter(product => {
      const movementMatch = movementFilter === 'all' || product.movement === movementFilter;
      const categoryMatch = categoryFilter === 'all' || product.category === categoryFilter;
      return movementMatch && categoryMatch;
    });
  }, [productAnalysis, movementFilter, categoryFilter]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalQty = filteredProducts.reduce((sum, p) => sum + p.qtySold, 0);
    const totalRevenue = filteredProducts.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalProducts = filteredProducts.length;
    
    const movementBreakdown = {
      'Fast-moving': filteredProducts.filter(p => p.movement === 'Fast-moving').length,
      'Medium-moving': filteredProducts.filter(p => p.movement === 'Medium-moving').length,
      'Slow-moving': filteredProducts.filter(p => p.movement === 'Slow-moving').length,
      'Non-moving': filteredProducts.filter(p => p.movement === 'Non-moving').length
    };

    return {
      totalQty,
      totalRevenue,
      totalProducts,
      movementBreakdown,
      avgRevenuePerProduct: totalProducts > 0 ? totalRevenue / totalProducts : 0
    };
  }, [filteredProducts]);

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setMovementFilter('all');
    setCategoryFilter('all');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const exportData = (format) => {
    // Mock export functionality - you can implement actual export logic here
    const exportData = filteredProducts.map(product => ({
      'Product Name': product.name,
      'Category': product.category,
      'Size': product.size,
      'Qty Sold': product.qtySold,
      'Total Revenue': product.totalRevenue,
      'Average Price': product.avgPrice,
      'Movement Type': product.movement,
      'Current Stock': product.currentStock,
      'Stock Status': product.stockStatus
    }));

    console.log(`Exporting ${exportData.length} products as ${format}`, exportData);
    alert(`Export functionality would generate ${format.toUpperCase()} file with ${exportData.length} products`);
    setShowExportModal(false);
  };

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
      <div className="col-md-2">
        <label className="form-label fw-semibold">Category</label>
        <select 
          className="form-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div className="col-md-3">
        <label className="form-label fw-semibold">Product Movement</label>
        <select 
          className="form-select"
          value={movementFilter}
          onChange={(e) => setMovementFilter(e.target.value)}
        >
          <option value="all">All Products</option>
          <option value="Fast-moving">Fast-Moving (50+ sold)</option>
          <option value="Medium-moving">Medium-Moving (20-49 sold)</option>
          <option value="Slow-moving">Slow-Moving (5-19 sold)</option>
          <option value="Non-moving">Non-Moving (0-4 sold)</option>
        </select>
      </div>
      <div className="col-md-3">
        <div className="d-flex gap-2">
          <button className="btn btn-outline-danger" onClick={resetFilters}>
            <i className="bi bi-arrow-clockwise"></i> Reset
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowExportModal(true)}
            disabled={filteredProducts.length === 0}
          >
            <i className="bi bi-download"></i> Export
          </button>
        </div>
      </div>
    </div>
  );

  const renderSummaryCards = () => (
    <div className="row g-3 mb-4">
      <div className="col-md-3">
        <div className="card border-0 bg-primary text-white">
          <div className="card-body text-center">
            <h4 className="mb-1">{summaryStats.totalProducts}</h4>
            <small>Total Products</small>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 bg-success text-white">
          <div className="card-body text-center">
            <h4 className="mb-1">{summaryStats.totalQty.toLocaleString()}</h4>
            <small>Units Sold</small>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 bg-warning text-white">
          <div className="card-body text-center">
            <h4 className="mb-1">{formatCurrency(summaryStats.totalRevenue)}</h4>
            <small>Total Revenue</small>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 bg-info text-white">
          <div className="card-body text-center">
            <h4 className="mb-1">{formatCurrency(summaryStats.avgRevenuePerProduct)}</h4>
            <small>Avg Revenue/Product</small>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMovementSummary = () => (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-light">
        <h6 className="mb-0">Product Movement Summary</h6>
      </div>
      <div className="card-body">
        <div className="row text-center">
          <div className="col-3">
            <div className="text-success fw-bold fs-4">{summaryStats.movementBreakdown['Fast-moving']}</div>
            <small className="text-muted">Fast-Moving</small>
          </div>
          <div className="col-3">
            <div className="text-info fw-bold fs-4">{summaryStats.movementBreakdown['Medium-moving']}</div>
            <small className="text-muted">Medium-Moving</small>
          </div>
          <div className="col-3">
            <div className="text-warning fw-bold fs-4">{summaryStats.movementBreakdown['Slow-moving']}</div>
            <small className="text-muted">Slow-Moving</small>
          </div>
          <div className="col-3">
            <div className="text-danger fw-bold fs-4">{summaryStats.movementBreakdown['Non-moving']}</div>
            <small className="text-muted">Non-Moving</small>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTableHeader = () => (
    <thead className="table-dark sticky-top">
      <tr>
        <th scope="col">Product Name</th>
        <th scope="col" className="text-center">Category</th>
        <th scope="col" className="text-center">Size</th>
        <th scope="col" className="text-center">Qty Sold</th>
        <th scope="col" className="text-center">Current Stock</th>
        <th scope="col" className="text-center">Movement</th>
        <th scope="col" className="text-center">Avg Price</th>
        <th scope="col" className="text-end">Total Revenue</th>
      </tr>
    </thead>
  );

  const renderTableRow = (product) => (
    <tr key={`${product.baseProductId}-${product.size}`}>
      <td>
        <div>
          <div className="fw-semibold">{product.name}</div>
          <small className="text-muted">ID: {product.baseProductId}</small>
        </div>
      </td>
      <td className="text-center">
        <span className={`badge ${product.category === 'ingredients' ? 'bg-success' : 
                                 product.category === 'tools' ? 'bg-primary' : 'bg-warning'}`}>
          {product.category}
        </span>
      </td>
      <td className="text-center">
        <strong>{product.size}</strong>
      </td>
      <td className="text-center">
        <strong>{product.qtySold}</strong>
      </td>
      <td className="text-center">
        <span className={`badge ${product.currentStock === 0 ? 'bg-danger' : 
                                  product.currentStock <= product.lowStockThreshold ? 'bg-warning text-dark' : 'bg-success'}`}>
          {product.currentStock}
        </span>
      </td>
      <td className="text-center">
        <span className={`badge bg-${product.movementColor} ${product.movementColor === 'warning' ? 'text-dark' : ''}`}>
          {product.movement}
        </span>
      </td>
      <td className="text-center">
        {formatCurrency(product.avgPrice)}
      </td>
      <td className="fw-semibold text-end">
        {formatCurrency(product.totalRevenue)}
      </td>
    </tr>
  );

  const renderEmptyState = () => (
    <tr>
      <td colSpan="8" className="text-center py-5 text-muted">
        <i className="bi bi-inbox fs-1 d-block mb-3"></i>
        <h5>No sales data found</h5>
        <p>Try adjusting your filters or date range, or ensure there are completed transactions</p>
      </td>
    </tr>
  );

  const renderTableFooter = () => (
    <tfoot className="table-light">
      <tr className="fw-bold">
        <td colSpan="3">Total</td>
        <td className="text-center">{summaryStats.totalQty.toLocaleString()}</td>
        <td colSpan="3"></td>
        <td className="text-end">{formatCurrency(summaryStats.totalRevenue)}</td>
      </tr>
    </tfoot>
  );

  // Export Modal
  const ExportModal = () => (
    showExportModal && (
      <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Export Sales Report</h5>
              <button type="button" className="btn-close" onClick={() => setShowExportModal(false)}></button>
            </div>
            <div className="modal-body">
              <p>Export {filteredProducts.length} products to:</p>
              <div className="d-grid gap-2">
                <button className="btn btn-outline-success" onClick={() => exportData('excel')}>
                  <i className="bi bi-file-earmark-excel me-2"></i>Excel (.xlsx)
                </button>
                <button className="btn btn-outline-primary" onClick={() => exportData('csv')}>
                  <i className="bi bi-file-earmark-text me-2"></i>CSV (.csv)
                </button>
                <button className="btn btn-outline-danger" onClick={() => exportData('pdf')}>
                  <i className="bi bi-file-earmark-pdf me-2"></i>PDF (.pdf)
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowExportModal(false)}>
                Cancel
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
        <div className="row">
          <div className="col-12">
            
            {/* Summary Cards */}
            {renderSummaryCards()}
            
            {/* Movement Summary */}
            {renderMovementSummary()}
            
            <div className="card border-0 shadow-sm">
              
              {/* Report Header */}
              <div className="card-header bg-white border-0 pb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="mb-0">Sales & Product Movement Report</h2>
                  <span className="badge bg-primary">{filteredProducts.length} products</span>
                </div>
                {renderFilters()}
              </div>
              
              {/* Report Table */}
              <div className="card-body p-0 mt-3">
                <div className="table-responsive" style={{maxHeight: '500px', overflowY: 'auto'}}>
                  <table className="table table-hover mb-0">
                    {renderTableHeader()}
                    <tbody>
                      {filteredProducts.length > 0 
                        ? filteredProducts.map(renderTableRow)
                        : renderEmptyState()
                      }
                    </tbody>
                    {filteredProducts.length > 0 && renderTableFooter()}
                  </table>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal />
    </div>
  );
}

export default Reports;