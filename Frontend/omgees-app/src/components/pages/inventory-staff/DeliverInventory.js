import React, { useState} from 'react';
import useInventory from '../../../components/hooks/useInventory';

function DeliverInventory() {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);

  const { inventory, isLoading, refreshInventory } = useInventory(true);

  // Get unique suppliers from inventory
  const suppliers = [...new Set(inventory.map(p => p.supplier))];

  // Filter products
  const filteredProducts = inventory.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.id.toString().includes(searchQuery);
    const matchesSupplier = supplierFilter === 'all' || product.supplier === supplierFilter;
    const isActive = product.status === 'active';
    
    return matchesSearch && matchesSupplier && isActive;
  });

  // Add product to delivery
  const addToDelivery = (product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, { 
        ...product, 
        inboundQuantity: 0 
      }]);
    }
  };

  // Update inbound quantity
  const updateInboundQuantity = (productId, quantity) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.id === productId ? { ...p, inboundQuantity: parseInt(quantity) || 0 } : p
    ));
  };

  // Remove from delivery
  const removeFromDelivery = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  // Get detected supplier from selected products
  const getDetectedSupplier = () => {
    if (selectedProducts.length === 0) return null;
    
    const suppliers = [...new Set(selectedProducts.map(p => p.supplier))];
    
    if (suppliers.length === 1) {
      return suppliers[0];
    } else if (suppliers.length > 1) {
      return 'Multiple Suppliers';
    }
    return null;
  };

  // Submit delivery
  const handleSubmitDelivery = async () => {
    const validProducts = selectedProducts.filter(p => p.inboundQuantity > 0);
    
    if (validProducts.length === 0) {
      alert('Please add quantities for at least one product');
      return;
    }

    const detectedSupplier = getDetectedSupplier();
    if (!detectedSupplier || detectedSupplier === 'Multiple Suppliers') {
      alert('Please ensure all products are from the same supplier');
      return;
    }

    try {
      // Update each product's stock
      for (const product of validProducts) {
        const newStock = product.stock + product.inboundQuantity;
        
        await fetch('http://localhost:5000/re-stock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: product.id,
            new_stock: newStock
          })
        });

        // Log activity
        await fetch('http://localhost:5000/activity-log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            activity: 'Inbound Delivery',
            user: 'inventory-staff',
            type: 'inventory',
            details: `Product: ${product.name} (${product.size}), Received: ${product.inboundQuantity} units, Supplier: ${detectedSupplier}`
          })
        });
      }

      alert(`✅ Delivery Received!\n\n${validProducts.length} products updated successfully.`);
      
      // Reset form
      setSelectedProducts([]);
      setDeliveryNote('');
      setShowConfirmModal(false);
      
      // Refresh inventory
      refreshInventory();
      
    } catch (error) {
      console.error('Error submitting delivery:', error);
      alert('❌ Failed to process delivery. Please try again.');
    }
  };

  return (
    <div className="container-fluid bg-light min-vh-100">
      <div className="container py-5">
        <div className="row">
          {/* Left: Product Selection */}
          <div className="col-md-6 mb-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="fas fa-search me-2"></i>
                  Select Products
                </h5>
              </div>
              <div className="card-body">
                {/* Search & Filter */}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <select 
                      className="form-select"
                      value={supplierFilter}
                      onChange={(e) => setSupplierFilter(e.target.value)}
                    >
                      <option value="all">All Suppliers</option>
                      {suppliers.map(supplier => (
                        <option key={supplier} value={supplier}>{supplier}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Product List */}
                <div style={{maxHeight: '500px', overflowY: 'auto'}}>
                  {isLoading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border" role="status"></div>
                      <p className="mt-2">Loading products...</p>
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <div key={product.id} className="card mb-2 shadow-sm">
                        <div className="card-body p-2">
                          <div className="d-flex align-items-center">
                            <img 
                              src={product.image} 
                              alt={product.name}
                              style={{width: '50px', height: '50px', objectFit: 'cover'}}
                              className="rounded me-3"
                            />
                            <div className="flex-grow-1">
                              <strong className="d-block">{product.name}</strong>
                              <small className="text-muted">
                                {product.size} • Current: {product.stock} units
                              </small>
                            </div>
                            <button 
                              className="btn btn-sm btn-success"
                              onClick={() => addToDelivery(product)}
                              disabled={selectedProducts.find(p => p.id === product.id)}
                            >
                              <i className="fas fa-plus"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                      <p>No products found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Delivery Summary */}
          <div className="col-md-6 mb-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="fas fa-truck-loading me-2"></i>
                  Inbound Delivery
                </h5>
              </div>
              <div className="card-body">
                {/* Delivery Info */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Detected Supplier</label>
                  <div className="alert alert-info mb-0 py-2">
                    {selectedProducts.length === 0 ? (
                      <span className="text-muted"><i className="fas fa-info-circle me-2"></i>No products selected</span>
                    ) : getDetectedSupplier() === 'Multiple Suppliers' ? (
                      <span className="text-danger"><i className="fas fa-exclamation-triangle me-2"></i>Multiple suppliers detected - please select products from one supplier only</span>
                    ) : (
                      <span className="text-success"><i className="fas fa-check-circle me-2"></i><strong>{getDetectedSupplier()}</strong></span>
                    )}
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Delivery Date</label>
                    <input 
                      type="date"
                      className="form-control"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Delivery Note (Optional)</label>
                  <textarea 
                    className="form-control"
                    rows="2"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    placeholder="Add notes about this delivery..."
                  ></textarea>
                </div>

                <hr />

                {/* Selected Products */}
                <h6 className="mb-3">Products to Receive ({selectedProducts.length})</h6>
                <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                  {selectedProducts.length > 0 ? (
                    selectedProducts.map(product => (
                      <div key={product.id} className="card mb-2">
                        <div className="card-body p-2">
                          <div className="d-flex align-items-center gap-2">
                            <div className="flex-grow-1">
                              <strong className="d-block small">{product.name}</strong>
                              <small className="text-muted">{product.size}</small>
                            </div>
                            <input 
                              type="number"
                              className="form-control form-control-sm"
                              style={{width: '80px'}}
                              value={product.inboundQuantity}
                              onChange={(e) => updateInboundQuantity(product.id, e.target.value)}
                              min="0"
                              placeholder="Qty"
                            />
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeFromDelivery(product.id)}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <i className="fas fa-box-open fs-1 d-block mb-2"></i>
                      <small>No products selected</small>
                    </div>
                  )}
                </div>
              </div>
              <div className="card-footer bg-light">
                <button 
                  className="btn btn-success w-100"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={
                    selectedProducts.filter(p => p.inboundQuantity > 0).length === 0 || 
                    !getDetectedSupplier() || 
                    getDetectedSupplier() === 'Multiple Suppliers'
                  }
                >
                  <i className="fas fa-check me-2"></i>
                  Receive Delivery ({selectedProducts.filter(p => p.inboundQuantity > 0).length} items)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="fas fa-clipboard-check me-2"></i>
                  Confirm Inbound Delivery
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowConfirmModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Delivery Information</strong>
                  <div className="mt-2">
                    <p className="mb-1"><strong>Supplier:</strong> {getDetectedSupplier()}</p>
                    <p className="mb-1"><strong>Date:</strong> {new Date(deliveryDate).toLocaleDateString()}</p>
                    {deliveryNote && <p className="mb-0"><strong>Note:</strong> {deliveryNote}</p>}
                  </div>
                </div>

                <h6>Products to Receive:</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Variant</th>
                        <th className="text-end">Current Stock</th>
                        <th className="text-end">Receiving</th>
                        <th className="text-end">New Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProducts.filter(p => p.inboundQuantity > 0).map(product => (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td>{product.size}</td>
                          <td className="text-end">{product.stock}</td>
                          <td className="text-end text-success"><strong>+{product.inboundQuantity}</strong></td>
                          <td className="text-end"><strong>{product.stock + product.inboundQuantity}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-success" onClick={handleSubmitDelivery}>
                  <i className="fas fa-check me-2"></i>
                  Confirm & Receive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliverInventory;