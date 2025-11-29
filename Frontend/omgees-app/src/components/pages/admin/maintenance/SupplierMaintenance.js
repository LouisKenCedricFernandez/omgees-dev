import React, { useState, useEffect } from 'react';

function SupplierMaintenance() {
  const [supplierList, setSupplierList] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [supplierStats, setSupplierStats] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setIsLoadingSuppliers(true);
    try {
      const res = await fetch('http://localhost:5000/suppliers');
      const data = await res.json();
      setSupplierList(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setSupplierList([]);
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  const fetchSupplierProducts = async (supplierName) => {
    try {
      const res = await fetch(`http://localhost:5000/suppliers/${encodeURIComponent(supplierName)}/products`);
      const data = await res.json();
      setSupplierProducts(data);
    } catch (error) {
      console.error("Error fetching supplier products:", error);
      setSupplierProducts([]);
    }
  };

  const fetchSupplierStats = async (supplierName) => {
    try {
      const res = await fetch(`http://localhost:5000/suppliers/${encodeURIComponent(supplierName)}/stats`);
      const data = await res.json();
      setSupplierStats(data);
    } catch (error) {
      console.error("Error fetching supplier stats:", error);
    }
  };

  const handleSelectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    fetchSupplierProducts(supplier.supplier_name);
    fetchSupplierStats(supplier.supplier_name);
  };

  const handleRenameSupplier = async (oldName, newName) => {
    if (!newName.trim()) {
      alert('Please enter a valid supplier name');
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/suppliers/${encodeURIComponent(oldName)}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: newName.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Supplier renamed successfully');
        setEditingSupplier(null);
        await fetchSuppliers();
        if (selectedSupplier?.supplier_name === oldName) {
          handleSelectSupplier({ ...selectedSupplier, supplier_name: newName.trim() });
        }
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error renaming supplier: ' + err.message);
      console.error("Error renaming supplier:", err);
    }
  };

  const handleArchiveSupplier = async (supplierName) => {
    if (!window.confirm(`Archive all products from "${supplierName}"? This will set all products to inactive.`)) return;
    try {
      const res = await fetch(`http://localhost:5000/suppliers/${encodeURIComponent(supplierName)}/archive`, {
        method: 'PUT'
      });
      if (res.ok) {
        alert('Supplier archived successfully');
        await fetchSuppliers();
        setSelectedSupplier(null);
        setSupplierProducts([]);
        setSupplierStats(null);
      }
    } catch (err) {
      alert('Error archiving supplier: ' + err.message);
      console.error("Error archiving supplier:", err);
    }
  };

  const handleRestoreSupplier = async (supplierName) => {
    if (!window.confirm(`Restore all products from "${supplierName}"? This will set all products to active.`)) return;
    try {
      const res = await fetch(`http://localhost:5000/suppliers/${encodeURIComponent(supplierName)}/restore`, {
        method: 'PUT'
      });
      if (res.ok) {
        alert('Supplier restored successfully');
        await fetchSuppliers();
        setSelectedSupplier(null);
        setSupplierProducts([]);
        setSupplierStats(null);
      }
    } catch (err) {
      alert('Error restoring supplier: ' + err.message);
      console.error("Error restoring supplier:", err);
    }
  };

  const filteredSuppliers = supplierList.filter(supplier =>
    supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid bg-light min-vh-100">
      <div className="container py-5">
        <div className="row mb-4">
          <div className="col-12">
            <h2>Supplier Maintenance</h2>
            <p className="text-muted">Manage suppliers and their associated products</p>
          </div>
        </div>

        <div className="row g-3">
          {/* Left: Supplier List */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0"><i className="fas fa-list me-2"></i>Suppliers ({filteredSuppliers.length})</h5>
              </div>
              <div className="card-body">
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {isLoadingSuppliers ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2">Loading suppliers...</p>
                  </div>
                ) : filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((supplier, idx) => (
                    <div
                      key={idx}
                      className={`p-3 border-bottom cursor-pointer ${
                        selectedSupplier?.supplier_name === supplier.supplier_name
                          ? 'bg-light border-start border-primary border-5'
                          : 'border-start border-transparent border-5'
                      }`}
                      onClick={() => handleSelectSupplier(supplier)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1 fw-bold">{supplier.supplier_name}</h6>
                          <small className="text-muted d-block"><i className="fas fa-box me-1"></i>{supplier.active_products} active of {supplier.product_count}</small>
                          <small className="text-muted d-block"><i className="fas fa-cube me-1"></i>Stock: {supplier.total_stock}</small>
                        </div>
                        <span className="badge bg-primary">{supplier.product_count}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5 text-muted">
                    <i className="fas fa-store fs-1 d-block mb-3"></i>
                    <p>No suppliers found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Supplier Details */}
          <div className="col-lg-7">
            {selectedSupplier ? (
              <div>
                {/* Supplier Header Card */}
                <div className="card border-0 shadow-sm mb-3">
                  <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0"><i className="fas fa-info-circle me-2"></i>{selectedSupplier.supplier_name}</h5>
                    <div className="btn-group btn-group-sm" role="group">
                      <button className="btn btn-outline-primary text-light" onClick={() => setEditingSupplier(selectedSupplier)} title="Edit">
                        <i className="fas fa-edit me-1"></i>Edit
                      </button>
                      <button className="btn btn-outline-primary text-light" onClick={() => handleArchiveSupplier(selectedSupplier.supplier_name)} title="Archive">
                        <i className="fas fa-archive me-1"></i>Archive
                      </button>
                      <button className="btn btn-outline-primary text-light" onClick={() => handleRestoreSupplier(selectedSupplier.supplier_name)} title="Restore">
                        <i className="fas fa-undo me-1"></i>Restore
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    {supplierStats ? (
                      <div className="row g-3">
                        <div className="col-6 col-md-4">
                          <div className="text-center">
                            <small className="text-muted d-block">Total Products</small>
                            <h4 className="mb-0 fw-bold">{supplierStats.total_products}</h4>
                          </div>
                        </div>
                        <div className="col-6 col-md-4">
                          <div className="text-center">
                            <small className="text-success d-block">Active</small>
                            <h4 className="mb-0 fw-bold text-success">{supplierStats.active_products}</h4>
                          </div>
                        </div>
                        <div className="col-6 col-md-4">
                          <div className="text-center">
                            <small className="text-muted d-block">Archived</small>
                            <h4 className="mb-0 fw-bold text-secondary">{supplierStats.archived_products}</h4>
                          </div>
                        </div>
                        <div className="col-6 col-md-4">
                          <div className="text-center">
                            <small className="text-muted d-block">Total Stock</small>
                            <h4 className="mb-0 fw-bold">{supplierStats.total_stock}</h4>
                          </div>
                        </div>
                        <div className="col-6 col-md-4">
                          <div className="text-center">
                            <small className="text-muted d-block">Total Sold</small>
                            <h4 className="mb-0 fw-bold">{supplierStats.total_sold}</h4>
                          </div>
                        </div>
                        <div className="col-6 col-md-4">
                          <div className="text-center">
                            <small className="text-muted d-block">Avg Price</small>
                            <h4 className="mb-0 fw-bold">₱{(supplierStats.avg_price || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</h4>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <p className="mt-2 small">Loading statistics...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Products from Supplier */}
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h6 className="mb-0"><i className="fas fa-box me-2"></i>Products</h6>
                    <span className="badge bg-primary">{supplierProducts.length}</span>
                  </div>
                  <div className="card-body p-0">
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {supplierProducts.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-sm table-hover mb-0">
                            <thead className="table-light sticky-top">
                              <tr>
                                <th>Product Name</th>
                                <th>Variant</th>
                                <th className="text-end">Price</th>
                                <th className="text-end">Stock</th>
                                <th className="text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {supplierProducts.map(prod => (
                                <tr key={prod.product_id} className={prod.product_status === 'inactive' ? 'table-secondary' : ''}>
                                  <td>
                                    <small className="fw-semibold">{prod.product_name}</small>
                                  </td>
                                  <td>
                                    <small className="text-muted">{prod.product_variant || 'N/A'}</small>
                                  </td>
                                  <td className="text-end"><small>₱{(prod.product_price || 0).toLocaleString()}</small></td>
                                  <td className="text-end"><small>{prod.product_totalstock}</small></td>
                                  <td className="text-center">
                                    <span className={`badge bg-${prod.product_status === 'active' ? 'success' : 'secondary'}`}>
                                      {prod.product_status === 'active' ? 'Active' : 'Archived'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted">
                          <i className="fas fa-box-open fs-3 d-block mb-2"></i>
                          <small>No products from this supplier</small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card border-0 shadow-sm d-flex align-items-center justify-content-center" style={{ height: '600px' }}>
                <div className="text-center text-muted">
                  <i className="fas fa-arrow-left fs-1 d-block mb-3"></i>
                  <p>Select a supplier to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Supplier Modal */}
      {editingSupplier && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title"><i className="fas fa-edit me-2"></i>Edit Supplier</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditingSupplier(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Current Supplier Name</label>
                  <input type="text" className="form-control" value={editingSupplier.supplier_name} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">New Supplier Name *</label>
                  <input type="text" className="form-control" placeholder="Enter new supplier name" id="newSupplierName" defaultValue={editingSupplier.supplier_name} />
                  <small className="text-muted"><i className="fas fa-info-circle me-1"></i>This will update for all {editingSupplier.product_count} products</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingSupplier(null)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={() => {
                  const newName = document.getElementById('newSupplierName').value;
                  handleRenameSupplier(editingSupplier.supplier_name, newName);
                }}>
                  <i className="fas fa-save me-2"></i>Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupplierMaintenance;