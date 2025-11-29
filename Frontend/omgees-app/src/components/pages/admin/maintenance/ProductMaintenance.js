import React, { useState, useEffect } from 'react';
import RestockInventory from './RestockInventory';

function ProductMaintenance() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch('http://localhost:5000/inventory');
      const data = await res.json();
      
      // Transform backend data to match frontend structure
      const transformedData = data.map(item => ({
        id: item.product_id,
        name: item.product_name,
        size: item.product_variant,
        category: item.product_category,
        supplier: item.product_supplier,
        price: item.product_price,
        stock: item.product_totalstock,
        sold: item.product_totalsold,
        status: item.product_status,
        description: item.product_description,
        image: item.product_image || 'https://via.placeholder.com/200x180/6C757D/white?text=No+Image',
        baseProductId: item.base_product_id,
        lastRestocked: item.last_restocked
      }));
      
      setInventory(transformedData);
      
      // Extract and aggregate suppliers from inventory data
      const suppliersMap = {};
      data.forEach(product => {
        const supplierName = product.product_supplier || 'Unknown';
        
        if (!suppliersMap[supplierName]) {
          suppliersMap[supplierName] = {
            supplier_id: Object.keys(suppliersMap).length + 1,
            supplier_name: supplierName,
            name: supplierName
          };
        }
      });
      
      setSuppliers(Object.values(suppliersMap));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setIsLoading(false);
    }
  };

  const filteredProducts = inventory.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.id.toString().includes(searchQuery);
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(inventory.map(p => p.category))];

  return (
    <div className="container-fluid bg-light min-vh-100">
      <div className="container py-5">
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              
              {/* Header */}
              <div className="card-header bg-white border-0 pb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="mb-0">
                    Product Maintenance
                  </h2>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowAddModal(true)}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Add New Product
                  </button>
                </div>

                {/* Filters */}
                <div className="row g-3">
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <select 
                      className="form-select"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select 
                      className="form-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Archived Only</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <button 
                      className="btn btn-outline-danger w-100"
                      onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('all');
                        setStatusFilter('active');
                      }}
                    >
                      <i className="bi bi-arrow-clockwise"></i> Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Table */}
              <div className="card-body p-0">
                <div className="table-responsive" style={{maxHeight: '600px', overflowY: 'auto'}}>
                  <table className="table table-hover mb-0">
                    <thead className="table-dark sticky-top">
                      <tr>
                        <th>ID</th>
                        <th>Product Name</th>
                        <th>Variant</th>
                        <th>Category</th>
                        <th>Supplier</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan="9" className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-2">Loading products...</p>
                          </td>
                        </tr>
                      ) : filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                          <tr key={product.id} className={product.status === 'inactive' ? 'table-secondary' : ''}>
                            <td><strong>#{product.id}</strong></td>
                            <td>{product.name}</td>
                            <td>{product.size}</td>
                            <td><span className="badge bg-secondary">{product.category}</span></td>
                            <td><small className="text-muted">{product.supplier || 'N/A'}</small></td>
                            <td>₱{product.price.toLocaleString()}</td>
                            <td>{product.stock}</td>
                            <td>
                              <span className={`badge bg-${product.status === 'active' ? 'success' : 'secondary'}`}>
                                {product.status === 'active' ? 'Active' : 'Archived'}
                              </span>
                            </td>
                            <td className="text-center">
                              <div className="btn-group" role="group">
                                <button 
                                  className="btn btn-sm btn-outline-warning"
                                  onClick={() => setEditingProduct(product)}
                                  title="Edit"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => setSelectedProduct(product)}
                                  title={product.status === 'active' ? 'Archive' : 'Restore'}
                                >
                                  <i className={`fas fa-${product.status === 'active' ? 'archive' : 'undo'}`}></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="text-center py-5">
                            <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                            <h5>No products found</h5>
                            <p className="text-muted">Try adjusting your filters</p>
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

      {/* Use RestockInventory component for all modals */}
      <RestockInventory
        inventory={inventory}
        setInventory={setInventory}
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        onProductAdded={fetchInventory}
        suppliers={suppliers}
      />
    </div>
  );
}

export default ProductMaintenance;