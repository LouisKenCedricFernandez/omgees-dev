import React, { useState, useMemo } from 'react';
import useInventory from '../../../components/hooks/useInventory';
import * as XLSX from 'xlsx';

function ManageInventory({ user }) {
  const [stockFilter, setStockFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  const { inventory, isLoading, error, setError } = useInventory(true); 

  // Generate Excel File
  const exportToExcel = () => {
    const excelData = inventory.map(item => {
      const stockStatus = getStockStatus(item.stock, item.lowStockThreshold);
      return {
        'Product ID': item.id,
        'Product Name': item.name,
        'Category': item.category,
        'Variant': item.size,
        'Price (₱)': item.price,
        'Total Stock': item.stock,
        'Reserved Stock': item.reserved || 0,
        'Available Stock': (item.stock - (item.reserved || 0)),
        'Low Stock Threshold': item.lowStockThreshold,
        'Stock Status': stockStatus.status,
        'Sold': item.sold,
        'Supplier': item.supplier,
        'Status': item.status,
        'Last Restocked': new Date(item.lastRestocked).toLocaleDateString()
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Inventory_${date}.xlsx`);
    setShowExportConfirm(false);
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStockStatus = (stock, threshold) => {
    if (stock === 0) return { status: 'Out of Stock', color: 'danger' };
    if (stock <= threshold) return { status: 'Low Stock', color: 'warning' };
    if (stock <= threshold * 2) return { status: 'Medium Stock', color: 'info' };
    return { status: 'High Stock', color: 'success' };
  };

  // Get unique categories and suppliers for filter dropdowns
  const categories = useMemo(() => {
    return [...new Set(inventory.map(product => product.category))];
  }, [inventory]);

  const suppliers = useMemo(() => {
    return [...new Set(inventory.map(product => product.supplier))];
  }, [inventory]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return inventory.filter(product => {
      const categoryMatch = categoryFilter === 'all' || product.category === categoryFilter;
      const supplierMatch = supplierFilter === 'all' || product.supplier === supplierFilter;
      
      const stockStatus = getStockStatus(product.stock, product.lowStockThreshold);
      const statusMatch = 
        statusFilter === 'all' ||
        (statusFilter === 'high-stock' && stockStatus.status === 'High Stock') ||
        (statusFilter === 'medium-stock' && stockStatus.status === 'Medium Stock') ||
        (statusFilter === 'low-stock' && stockStatus.status === 'Low Stock') ||
        (statusFilter === 'out-of-stock' && stockStatus.status === 'Out of Stock');
      
      if (stockFilter === 'all') {
        return categoryMatch && supplierMatch && statusMatch;
      }
      
      const stockLevelMatch = 
        (stockFilter === 'normal' && stockStatus.status === 'High Stock') ||
        (stockFilter === 'low' && (stockStatus.status === 'Low Stock' || stockStatus.status === 'Medium Stock')) ||
        (stockFilter === 'out' && stockStatus.status === 'Out of Stock');
      
      return categoryMatch && supplierMatch && statusMatch && stockLevelMatch;
    });
  }, [inventory, stockFilter, categoryFilter, supplierFilter, statusFilter]);

  const resetFilters = () => {
    setStockFilter('all');
    setCategoryFilter('all');
    setSupplierFilter('all');
    setStatusFilter('all');
  };

  // Group products by base product
  const productSummary = useMemo(() => {
    const groupedProducts = {};
    
    filteredProducts.forEach(product => {
      const key = `${product.baseProductId}-${product.name}`;
      if (!groupedProducts[key]) {
        groupedProducts[key] = {
          baseProductId: product.baseProductId,
          name: product.name,
          category: product.category,
          variants: [],
          totalStock: 0,
          reservedStock: 0,
          availableStock: 0,
          totalSold: 0,
          overallStatus: 'High Stock',
          hasArchivedVariants: false,
          allVariantsArchived: true
        };
      }
      
      groupedProducts[key].variants.push(product);
      groupedProducts[key].totalStock += product.stock;
      groupedProducts[key].reservedStock += (product.reserved || 0);
      groupedProducts[key].availableStock += (product.stock - (product.reserved || 0));
      groupedProducts[key].totalSold += product.sold;
      
      if (product.status === 'inactive') {
        groupedProducts[key].hasArchivedVariants = true;
      } else {
        groupedProducts[key].allVariantsArchived = false;
      }
      
      const variantStatus = getStockStatus(product.stock, product.lowStockThreshold);
      if (variantStatus.status === 'Out of Stock' || groupedProducts[key].overallStatus === 'Out of Stock') {
        groupedProducts[key].overallStatus = 'Out of Stock';
      } else if (variantStatus.status === 'Low Stock' && groupedProducts[key].overallStatus !== 'Out of Stock') {
        groupedProducts[key].overallStatus = 'Low Stock';
      } else if (variantStatus.status === 'Medium Stock' && groupedProducts[key].overallStatus === 'High Stock') {
        groupedProducts[key].overallStatus = 'Medium Stock';
      }
      
      if (groupedProducts[key].allVariantsArchived) {
        groupedProducts[key].overallStatus = 'Archived';
      }
    });
    
    return Object.values(groupedProducts);
  }, [filteredProducts]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Out of Stock': return 'danger';
      case 'Low Stock': return 'warning';
      case 'Medium Stock': return 'info';
      case 'Archived': return 'secondary';
      default: return 'success';
    }
  };

  const renderFilters = () => (
    <div className="row g-3 align-items-end">
      <div className="col-md-2">
        <label className="form-label fw-semibold">Stock Level</label>
        <select 
          className="form-select"
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
        >
          <option value="all">All Stock Levels</option>
          <option value="normal">High Stock</option>
          <option value="low">Low/Medium Stock</option>
          <option value="out">Out of Stock</option>
        </select>
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
              {category ? category.charAt(0).toUpperCase() + category.slice(1) : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="col-md-2">
        <label className="form-label fw-semibold">Supplier</label>
        <select 
          className="form-select"
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
        >
          <option value="all">All Suppliers</option>
          {suppliers.map(supplier => (
            <option key={supplier} value={supplier}>
              {supplier}
            </option>
          ))}
        </select>
      </div>
      <div className="col-md-2">
        <label className="form-label fw-semibold">Stock Status</label>
        <select 
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="high-stock">High Stock</option>
          <option value="medium-stock">Medium Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
      </div>
      <div className="col-md-4">
        <div className="d-flex gap-2">
          <button className="btn btn-outline-danger" onClick={resetFilters}>
            <i className="bi bi-arrow-clockwise"></i> Reset
          </button>
          <button className="btn btn-outline-success" onClick={() => setShowExportConfirm(true)}>
            <i className="fas fa-file-excel me-2"></i>Export to Excel
          </button>
        </div>
      </div>                  
    </div>
  );

  const ProductDetailsModal = () => {
    if (!selectedProduct) return null;

    return (
      <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-box me-2"></i>
                Product Details - {selectedProduct.name}
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setSelectedProduct(null)}
              ></button>
            </div>
            <div className="modal-body">
              {/* Product Overview */}
              <div className="row mb-4">
                <div className="col-md-4">
                  <img 
                    src={selectedProduct.variants[0].image} 
                    className="img-fluid rounded shadow-sm" 
                    alt={selectedProduct.name}
                    style={{width: '100%', height: '200px', objectFit: 'cover'}}
                  />
                </div>
                <div className="col-md-8">
                  <h6 className="text-muted mb-3">PRODUCT INFORMATION</h6>
                  <div className="row g-3">
                    <div className="col-6">
                      <small className="text-muted d-block">Base Product ID</small>
                      <strong>#{selectedProduct.baseProductId.toString().padStart(3, '0')}</strong>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Category</small>
                      <span className="badge bg-secondary">{selectedProduct.category}</span>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Supplier</small>
                      <strong>{selectedProduct.variants[0].supplier}</strong>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Overall Status</small>
                      <span className={`badge bg-${getStatusColor(selectedProduct.overallStatus)}`}>
                        {selectedProduct.overallStatus}
                      </span>
                    </div>
                  </div>
                  
                  <hr className="my-3" />
                  
                  <div className="row g-3">
                    <div className="col-4 text-center">
                      <small className="text-muted d-block">Total Stock</small>
                      <h4 className="mb-0">{selectedProduct.totalStock}</h4>
                    </div>
                    <div className="col-4 text-center">
                      <small className="text-muted d-block">Reserved</small>
                      <h4 className="mb-0 text-warning">{selectedProduct.reservedStock}</h4>
                    </div>
                    <div className="col-4 text-center">
                      <small className="text-muted d-block">Available</small>
                      <h4 className="mb-0 text-success">{selectedProduct.availableStock}</h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="text-muted">DESCRIPTION</h6>
                  <p className="text-muted">{selectedProduct.variants[0].description || 'No description available'}</p>
                </div>
              </div>

              {/* Variants Table */}
              <div className="row">
                <div className="col-12">
                  <h6 className="text-muted mb-3">PRODUCT VARIANTS ({selectedProduct.variants.length})</h6>
                  <div className="table-responsive">
                    <table className="table table-striped table-sm">
                      <thead className="table-dark">
                        <tr>
                          <th>ID</th>
                          <th>Variant</th>
                          <th>Price</th>
                          <th>Total Stock</th>
                          <th>Reserved</th>
                          <th>Available</th>
                          <th>Low Stock Alert</th>
                          <th>Sold</th>
                          <th>Last Restocked</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProduct.variants.map((variant) => {
                          const stockStatus = getStockStatus(variant.stock, variant.lowStockThreshold);
                          const isArchived = variant.status === 'inactive';
                          const reserved = variant.reserved || 0;
                          const available = variant.stock - reserved;
                          
                          return (
                            <tr key={variant.id} className={isArchived ? 'table-secondary' : ''}>
                              <td><strong>#{variant.id}</strong></td>
                              <td><strong>{variant.size}</strong></td>
                              <td>₱{variant.price.toLocaleString()}</td>
                              <td>{variant.stock}</td>
                              <td className="text-warning">{reserved}</td>
                              <td className="text-success"><strong>{available}</strong></td>
                              <td>{variant.lowStockThreshold}</td>
                              <td>{variant.sold}</td>
                              <td>{formatDate(variant.lastRestocked)}</td>
                              <td>
                                <div className="d-flex flex-column gap-1">
                                  <span className={`badge bg-${stockStatus.color}`}>
                                    {stockStatus.status}
                                  </span>
                                  <span className={`badge bg-${isArchived ? 'secondary' : 'success'}`}>
                                    {isArchived ? 'Archived' : 'Active'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="table-secondary">
                        <tr>
                          <td colSpan="3"><strong>TOTALS</strong></td>
                          <td><strong>{selectedProduct.totalStock}</strong></td>
                          <td className="text-warning"><strong>{selectedProduct.reservedStock}</strong></td>
                          <td className="text-success"><strong>{selectedProduct.availableStock}</strong></td>
                          <td>-</td>
                          <td><strong>{selectedProduct.totalSold}</strong></td>
                          <td colSpan="2">-</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedProduct(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {isLoading && (
        <div className="position-fixed top-0 end-0 m-3" style={{ zIndex: 9999 }}>
          <div className="alert alert-info shadow-sm" role="alert">
            <div className="d-flex align-items-center">
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
              <strong>Loading inventory...</strong>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="position-fixed top-0 end-0 m-3" style={{ zIndex: 9999 }}>
          <div className="alert alert-danger shadow-sm" role="alert">
            <i className="fas fa-exclamation-circle me-2"></i>
            <strong>Error:</strong> {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        </div>
      )}
      
      <div className="container-fluid bg-light min-vh-100">
        <div className="container py-5">
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                
                {/* Header */}
                <div className="card-header bg-white border-0 pb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="mb-0">
                      <i className="fas fa-boxes me-2"></i>
                      Inventory Overview
                    </h2>
                    <span className="badge bg-primary fs-6">
                      {productSummary.length} Products
                    </span>
                  </div>
                  {renderFilters()}
                </div>
                
                {/* Table */}
                <div className="card-body p-0 mt-3">
                  <div className="table-responsive" style={{maxHeight: '500px', overflowY: 'auto'}}>
                    <table className="table table-hover mb-0">
                      <thead className="table-dark sticky-top">
                        <tr>
                          <th scope="col">Product Name</th>
                          <th scope="col" className="text-center">Category</th>
                          <th scope="col" className="text-center">Variants</th>
                          <th scope="col" className="text-center">Total Stock</th>
                          <th scope="col" className="text-center">Reserved</th>
                          <th scope="col" className="text-center">Available</th>
                          <th scope="col" className="text-center">Total Sold</th>
                          <th scope="col" className="text-center">Status</th>
                          <th scope="col" className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productSummary.length > 0 ? (
                          productSummary.map((productGroup) => (
                            <tr key={`${productGroup.baseProductId}-${productGroup.name}`} 
                                className={productGroup.allVariantsArchived ? 'table-secondary' : ''}>
                              <td className="fw-semibold">
                                {productGroup.name}
                                {productGroup.hasArchivedVariants && !productGroup.allVariantsArchived && (
                                  <small className="text-muted d-block">
                                    <i className="fas fa-info-circle me-1"></i>Has archived variants
                                  </small>
                                )}
                              </td>
                              <td className="text-center">{productGroup.category}</td>
                              <td className="text-center">
                                {productGroup.variants.length}
                                {productGroup.hasArchivedVariants && (
                                  <small className="text-muted d-block">
                                    {productGroup.variants.filter(v => v.status === 'active').length} active
                                  </small>
                                )}
                              </td>
                              <td className="text-center"><strong>{productGroup.totalStock}</strong></td>
                              <td className="text-center text-warning"><strong>{productGroup.reservedStock}</strong></td>
                              <td className="text-center text-success"><strong>{productGroup.availableStock}</strong></td>
                              <td className="text-center">{productGroup.totalSold}</td>
                              <td className="text-center">
                                <span className={`badge bg-${getStatusColor(productGroup.overallStatus)}`}>
                                  {productGroup.overallStatus}
                                </span>
                              </td>
                              <td className="text-center">
                                <button 
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => setSelectedProduct(productGroup)}
                                  title="View Details"
                                >
                                  <i className="fas fa-eye"></i> View
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" className="text-center py-5 text-muted">
                              <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                              <h5>No products found</h5>
                              <p>Try adjusting your filters</p>
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

        <ProductDetailsModal />
        
        {/* Export Modal */}
        {showExportConfirm && (
          <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-file-excel text-success me-2"></i>
                    Export Inventory
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowExportConfirm(false)}></button>
                </div>
                <div className="modal-body">
                  <p>Export <strong>{inventory.length} products</strong> to Excel?</p>
                  <p className="text-muted small">
                    <i className="fas fa-info-circle me-1"></i>
                    Includes product details, stock levels, reserved stock, and status.
                  </p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowExportConfirm(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-success" onClick={exportToExcel}>
                    <i className="fas fa-download me-2"></i>Export
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ManageInventory;