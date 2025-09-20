import React, { useState, useEffect, use } from 'react';
import RestockInventory from './RestockInventory';
import axios from 'axios';

function ManageInventory({user, onInventoryUpdate, initialInventory = []}) {
  const [stockFilter, setStockFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [restockingProduct, setRestockingProduct] = useState(null);

  // Initialize inventory from props or use default data
  const defaultInventory = [
    // data for database inventory structure
  ];

  const [inventory, setInventory] = useState(
    initialInventory.length > 0 ? initialInventory : defaultInventory
  );
  // Fetch inventory from backend on component mount
   useEffect(() => {
  axios.get('http://localhost:5000/inventory')
    .then(response => {
      if (response.data && Array.isArray(response.data)) {
        // Normalize each product
        const normalized = response.data.map(product => ({
          id: product.product_id,
          //baseProductId: product.baseProductId ?? product.id ?? 0,
          name: product.product_name ?? "",
          category: product.product_category ?? "",
          variant: product.productvariant ?? "",
          image: product.image ?? "https://via.placeholder.com/150",
          description: product.product_description ?? "",
          supplier: product.product_supplier ?? "",
          stock: product.stock ?? product.product_totalstock ?? 0,
          sold: product.sold ?? product.product_totalsold ?? 0,
          lowStockThreshold: product.lowStockThreshold ?? 10,
          status: product.product_status ?? "In Stock",
          price: product.product_price ?? 0,
          lastRestocked: product.lastRestocked ?? new Date().toISOString(),
          //size: product.size ?? "",
        }));
        setInventory(normalized);
      }
    })
    .catch(error => {
      console.error('Error fetching inventory data:', error);
    });
  }, []);

  // Update inventory when initialInventory prop changes (from parent state updates)
  useEffect(() => {
    if (initialInventory.length > 0) {
      setInventory(initialInventory);
    }
  }, [initialInventory]);

  // Notify parent when inventory changes
  useEffect(() => {
    if (onInventoryUpdate) {
      onInventoryUpdate(inventory);
    }
  }, [inventory, onInventoryUpdate]);

  const handleInventoryChange = (updatedInventory) => {
    setInventory(updatedInventory);
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
    return { status: 'In Stock', color: 'success' };
  };

  // Get unique categories and suppliers for filter dropdowns
  const categories = [...new Set(inventory.map(product => product.category))];
  const suppliers = [...new Set(inventory.map(product => product.supplier))];

  const filterProducts = () => {
    return inventory.filter(product => {
      const categoryMatch = categoryFilter === 'all' || product.category === categoryFilter;
      const supplierMatch = supplierFilter === 'all' || product.supplier === supplierFilter;
      
      if (stockFilter === 'all') {
        return categoryMatch && supplierMatch;
      }
      
      const stockStatus = getStockStatus(product.stock, product.lowStockThreshold);
      const statusMatch = 
        (stockFilter === 'normal' && stockStatus.status === 'In Stock') ||
        (stockFilter === 'low' && (stockStatus.status === 'Low Stock' || stockStatus.status === 'Medium Stock')) ||
        (stockFilter === 'out' && stockStatus.status === 'Out of Stock');
      
      return categoryMatch && supplierMatch && statusMatch;
    });
  };

  const resetFilters = () => {
    setStockFilter('all');
    setCategoryFilter('all');
    setSupplierFilter('all');
  };

  const filteredProducts = filterProducts();

  // Group products by base product/brand for summary view
  const getProductSummary = () => {
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
          totalSold: 0,
          overallStatus: 'In Stock'
        };
      }
      
      groupedProducts[key].variants.push(product);
      groupedProducts[key].totalStock += product.stock;
      groupedProducts[key].totalSold += product.sold;
      
      // Product status or stock-level
      const variantStatus = getStockStatus(product.stock, product.lowStockThreshold);
      if (variantStatus.status === 'Out of Stock' || groupedProducts[key].overallStatus === 'Out of Stock') {
        groupedProducts[key].overallStatus = 'Out of Stock';
      } else if (variantStatus.status === 'Low Stock' && groupedProducts[key].overallStatus !== 'Out of Stock') {
        groupedProducts[key].overallStatus = 'Low Stock';
      } else if (variantStatus.status === 'Medium Stock' && groupedProducts[key].overallStatus === 'In Stock') {
        groupedProducts[key].overallStatus = 'Medium Stock';
      }
    });
    
    return Object.values(groupedProducts);
  };

  const productSummary = getProductSummary();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Out of Stock': return 'danger';
      case 'Low Stock': return 'warning';
      case 'Medium Stock': return 'info';
      default: return 'success';
    }
  };

  const renderFilters = () => (
    <div className="row g-3 align-items-end">
      <div className="col-md-3">
        <label className="form-label fw-semibold">Stock Level</label>
        <select 
          className="form-select"
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
        >
          <option value="all">All Stock Levels</option>
          <option value="normal">In Stock</option>
          <option value="low">Low/Medium Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>
      <div className="col-md-3">
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
      <div className="col-md-3">
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
      <div className="col-md-3">
        <div className="d-flex gap-2">
          <button className="btn btn-outline-danger" onClick={resetFilters}>
            <i className="bi bi-arrow-clockwise"></i> Reset
          </button>
        </div>
      </div>
    </div>
  );

  const renderTableHeader = () => (
    <thead className="table-dark sticky-top">
      <tr>
        <th scope="col">Product Name</th>
        <th scope="col" className="text-center">Category</th>
        <th scope="col" className="text-center">Variants</th>
        <th scope="col" className="text-center">Total Stock</th>
        <th scope="col" className="text-center">Total Sold</th>
        <th scope="col" className="text-center">Status</th>
        <th scope="col" className="text-center">Actions</th>
      </tr>
    </thead>
  );

  const renderTableRow = (productGroup) => (
    <tr key={`${productGroup.baseProductId}-${productGroup.name}`}>
      <td className="fw-semibold">{productGroup.name}</td>
      <td className="text-center">
        <span className="badge bg-secondary">{productGroup.category}</span>
      </td>
      <td className="text-center">{productGroup.variants.length}</td>
      <td className="text-center">{productGroup.totalStock}</td>
      <td className="text-center">{productGroup.totalSold}</td>
      <td className="text-center">
        <span className={`badge bg-${getStatusColor(productGroup.overallStatus)}`}>
          {productGroup.overallStatus}
        </span>
      </td>
      <td className="text-center">
        <div className="btn-group" role="group">
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={() => setSelectedProduct(productGroup)}
            title="View Details"
          >
            <i className="fas fa-eye"></i>
          </button>
          <button 
            className="btn btn-sm btn-outline-success"
            onClick={() => setRestockingProduct(productGroup)}
            title="Restock"
          >
            <i className="fas fa-plus"></i>
          </button>
          <button 
            className="btn btn-sm btn-outline-warning"
            onClick={() => setEditingProduct(productGroup.variants[0])}
            title="Edit"
          >
            <i className="fas fa-edit"></i>
          </button>
        </div>
      </td>
    </tr>
  );

  const renderEmptyState = () => (
    <tr>
      <td colSpan="7" className="text-center py-5 text-muted">
        <i className="bi bi-inbox fs-1 d-block mb-3"></i>
        <h5>No products found</h5>
        <p>Try adjusting your filters</p>
      </td>
    </tr>
  );

  const ProductDetailsModal = () => {
    if (!selectedProduct) return null;

    return (
      <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Product Details - {selectedProduct.name}</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setSelectedProduct(null)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row mb-4">
                <div className="col-md-4">
                  <img 
                    src={selectedProduct.variants[0].image} 
                    className="img-fluid rounded" 
                    alt={selectedProduct.name}
                    style={{width: '100%', height: '200px', objectFit: 'cover'}}
                  />
                </div>
                <div className="col-md-8">
                  <h6>Product Information</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td><strong>Base Product ID:</strong></td>
                        <td>#{selectedProduct.baseProductId.toString().padStart(3, '0')}</td>
                      </tr>
                      <tr>
                        <td><strong>Category:</strong></td>
                        <td><span className="badge bg-secondary">{selectedProduct.category}</span></td>
                      </tr>
                      <tr>
                        <td><strong>Supplier:</strong></td>
                        <td>{selectedProduct.variants[0].supplier}</td>
                      </tr>
                      <tr>
                        <td><strong>Total Variants:</strong></td>
                        <td>{selectedProduct.variants.length}</td>
                      </tr>
                      <tr>
                        <td><strong>Overall Status:</strong></td>
                        <td>
                          <span className={`badge bg-${getStatusColor(selectedProduct.overallStatus)}`}>
                            {selectedProduct.overallStatus}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-12">
                  <h6>Description</h6>
                  <p className="text-muted">{selectedProduct.variants[0].description}</p>
                </div>
              </div>

              <div className="row">
                <div className="col-12">
                  <h6>Product Variants</h6>
                  <div className="table-responsive">
                    <table className="table table-striped table-sm">
                      <thead>
                        <tr>
                          <th>Product ID</th>
                          <th>Variant</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Low Stock Threshold</th>
                          <th>Sold</th>
                          <th>Last Restocked</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProduct.variants.map((variant) => {
                          const stockStatus = getStockStatus(variant.stock, variant.lowStockThreshold);
                          return (
                            <tr key={variant.id}>
                              <td><strong>#{variant.id}</strong></td>
                              <td><strong>{variant.size}</strong></td>
                              <td>₱{variant.price.toLocaleString()}</td>
                              <td>{variant.stock}</td>
                              <td>{variant.lowStockThreshold}</td>
                              <td>{variant.sold}</td>
                              <td>{formatDate(variant.lastRestocked)}</td>
                              <td>
                                <span className={`badge bg-${stockStatus.color}`}>
                                  {stockStatus.status}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group" role="group">
                                  <button 
                                    className="btn btn-xs btn-outline-success"
                                    onClick={() => {
                                      setRestockingProduct(variant);
                                      setSelectedProduct(null);
                                    }}
                                    title="Restock"
                                  >
                                    <i className="fas fa-plus"></i>
                                  </button>
                                  <button 
                                    className="btn btn-xs btn-outline-primary"
                                    onClick={() => {
                                      setEditingProduct(variant);
                                      setSelectedProduct(null);
                                    }}
                                    title="Edit"
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="table-secondary">
                          <td colSpan="2"><strong>Total</strong></td>
                          <td>-</td>
                          <td><strong>{selectedProduct.totalStock}</strong></td>
                          <td>-</td>
                          <td><strong>{selectedProduct.totalSold}</strong></td>
                          <td>-</td>
                          <td>-</td>
                          <td>-</td>
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
    <div className="container-fluid bg-light min-vh-100">
      <div className="container py-5">
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              
              {/* Inventory Header */}
              <div className="card-header bg-white border-0 pb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="mb-0">Inventory Overview</h2>
                  <div className="d-flex gap-2 align-items-center">
                    <span className="badge bg-primary">{productSummary.length} product groups</span>
                    <span className="badge bg-info">{filteredProducts.length} total variants</span>
                    <button className="btn btn-success btn-sm" onClick={() => setShowAddModal(true)}>
                      <i className="fas fa-plus me-1"></i>Add Product
                    </button>
                  </div>
                </div>
                {renderFilters()}
                
              </div>
              
              {/* Inventory Body - Table */}
              <div className="card-body p-0 mt-3">
                <div className="table-responsive" style={{maxHeight: '500px', overflowY: 'auto'}}>
                  <table className="table table-hover mb-0">
                    {renderTableHeader()}
                    <tbody>
                      {productSummary.length > 0 
                        ? productSummary.map(renderTableRow)
                        : renderEmptyState()
                      }
                    </tbody>
                  </table>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>

      {/* For Product Details to show */}
      <ProductDetailsModal />
      
      {/* RestockCenter handles all CRUD modals */}
      <RestockInventory 
        inventory={inventory}
        setInventory={handleInventoryChange}
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        selectedProduct={restockingProduct}
        setSelectedProduct={setRestockingProduct}
      />
    </div>
  );
}

export default ManageInventory;