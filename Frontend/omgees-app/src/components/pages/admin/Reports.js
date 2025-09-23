import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';

function Reports({ transactions = [], inventory = [] }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [movementFilter, setMovementFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showExportModal, setShowExportModal] = useState(false);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);


    // Fetch reports on component mount -nt
  useEffect(() => {
  axios
    .get('http://localhost:5000/reports')
    .then(response => {
      setReports(response.data);
      setLoading(false);
    })
    .catch(error => {
      console.error('Error fetching reports:', error);
      setLoading(false);
    });
}, []);

  // Calculate product sales and movement from real transaction data
  const productAnalysis = useMemo(() => {
    console.log('Analyzing transactions:', transactions.length);
    console.log('Inventory structure:', inventory.length);
    
    // Get completed transactions within date range
    const filteredTransactions = transactions.filter(transaction => {
      if (transaction.status !== 'completed') return false;
      
      const transactionDate = new Date(transaction.timestamp);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      return (!start || transactionDate >= start) && (!end || transactionDate <= end);
    });

    console.log('Filtered transactions:', filteredTransactions.length);

    // Create a lookup map for inventory variants
    const variantLookup = {};
    inventory.forEach(product => {
      if (product.variants) {
        product.variants.forEach(variant => {
          variantLookup[variant.id] = {
            ...variant,
            productName: product.name,
            category: product.category,
            supplier: product.supplier
          };
        });
      }
    });

    console.log('Variant lookup created:', Object.keys(variantLookup).length);

    // Aggregate sales data by variant
    const variantSales = {};
    
    filteredTransactions.forEach(transaction => {
      transaction.items.forEach(item => {
        // Handle different item structures
        let variantId;
        let itemName;
        let itemSize;
        let itemCategory;
        
        if (item.selectedVariant) {
          // Customer orders with selected variants
          variantId = item.selectedVariant.id;
          itemName = item.name;
          itemSize = item.selectedVariant.size;
        } else {
          // Cashier orders or direct items
          variantId = item.id;
          itemName = item.displayName || item.name;
          itemSize = item.size;
        }
        
        // Look up variant details from inventory
        const variantDetails = variantLookup[variantId];
        if (variantDetails) {
          itemCategory = variantDetails.category;
          itemName = variantDetails.productName;
          itemSize = variantDetails.size;
        } else {
          itemCategory = item.category || 'Unknown';
        }

        const productKey = `${variantId}`;
        
        if (!variantSales[productKey]) {
          variantSales[productKey] = {
            id: variantId,
            name: itemName,
            size: itemSize,
            category: itemCategory,
            qtySold: 0,
            totalRevenue: 0,
            avgPrice: 0,
            transactions: 0
          };
        }
        
        variantSales[productKey].qtySold += item.quantity;
        variantSales[productKey].totalRevenue += item.price * item.quantity;
        variantSales[productKey].transactions += 1;
        variantSales[productKey].avgPrice = variantSales[productKey].totalRevenue / variantSales[productKey].qtySold;
      });
    });

    console.log('Variant sales calculated:', Object.keys(variantSales).length);

    // Add movement classification and current inventory data
    const productsWithMovement = Object.values(variantSales).map(product => {
      // Find current inventory status
      const currentVariant = variantLookup[product.id];
      
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
        currentStock: currentVariant?.stock || 0,
        stockStatus: currentVariant?.status || 'inactive',
        lowStockThreshold: currentVariant?.lowStockThreshold || 0,
        supplier: currentVariant?.supplier || 'Unknown',
        type: product.category === 'ingredients' ? 'Perishable' : 'Non-Perishable'
      };
    });

    console.log('Final analysis:', productsWithMovement.length);
    return productsWithMovement;
  }, [transactions, inventory, startDate, endDate]);

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
    const exportData = filteredProducts.map(product => ({
      'Product Name': product.name,
      'Variant': product.size,
      'Category': product.category,
      'Qty Sold': product.qtySold,
      'Total Revenue': product.totalRevenue,
      'Average Price': product.avgPrice.toFixed(2),
      'Movement Type': product.movement,
      'Current Stock': product.currentStock,
      'Supplier': product.supplier
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
      <div className="col-md-4">
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
      <div className="col-md-4">
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

  const renderTableHeader = () => (
    <thead className="table-dark sticky-top">
      <tr>
        <th scope="col">Product Name</th>
        <th scope="col" className="text-center">Qty Sold</th>
        <th scope="col" className="text-center">Movement</th>
        <th scope="col" className="text-center">Total Amount</th>
        <th scope="col" className="text-end">Total Revenue</th>
      </tr>
    </thead>
  );

  const renderTableRow = (product) => (
    <tr key={`${product.id}`}>
      <td>
        <div>
          <div className="fw-semibold">{product.name}</div>
          <small className="text-muted">ID: {product.id}</small>
        </div>
      </td>
      <td className="text-center">
        <strong>{product.qtySold}</strong>
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
      <td colSpan="5" className="text-center py-5 text-muted">
        <i className="bi bi-inbox fs-1 d-block mb-3"></i>
        <h5>No sales data found</h5>
        <p>Try adjusting your filters, date range, or complete some transactions first</p>
        <small className="text-info">
          Transactions: {transactions.length} | Products: {inventory.length}
        </small>
      </td>
    </tr>
  );

  const renderTableFooter = () => (
    <tfoot className="table-light">
      <tr className="fw-bold">
        <td>Total</td>
        <td colSpan="3"></td>
        <td className="text-end">{formatCurrency(summaryStats.totalRevenue)}</td>
      </tr>
    </tfoot>
  );

  // Export Modal (same as before)
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
            <div className="card border-0 shadow-sm">
              {/* Report Header */}
              <div className="card-header bg-white border-0 pb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="mb-0">Sales & Product Movement Report</h2>
                  <span className="badge bg-primary">{filteredProducts.length} variants</span>
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