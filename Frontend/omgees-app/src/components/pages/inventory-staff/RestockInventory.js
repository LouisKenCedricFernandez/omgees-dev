import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RestockInventory({ 
  inventory, 
  setInventory, 
  showAddModal, 
  setShowAddModal, 
  editingProduct, 
  setEditingProduct, 
  selectedProduct, 
  setSelectedProduct 
}) {

  // CRUD Functions
  const addProduct = (newProduct) => {
    // Generate new ID based on baseProductId and existing variants
    const baseId = newProduct.baseProductId || Math.max(...inventory.map(p => p.baseProductId || 0), 0) + 1;
    const existingVariants = inventory.filter(p => p.baseProductId === baseId);
    const newId = baseId * 1000 + existingVariants.length + 1;

    const productWithId = {
      ...newProduct,
      id: newId,
      baseProductId: baseId,
      status: 'active',
      lastRestocked: new Date().toISOString(),
      sold: 0
    };

    setInventory([...inventory, productWithId]);
    setShowAddModal(false);
  };

  const updateProduct = (updatedProduct) => {
    const processedData = {
      ...updatedProduct,
      price: Number(updatedProduct.price),
      stock: Number(updatedProduct.stock),
      lowStockThreshold: Number(updatedProduct.lowStockThreshold),
      sold: Number(updatedProduct.sold)
    };

    setInventory(inventory.map(product => 
      product.id === updatedProduct.id ? processedData : product
    ));
    setEditingProduct(null);
  };

  // Removed unused deleteProduct function

  const restockProduct = async (productId, newStock) => {
  try {
    // Update in database
    await axios.post('http://localhost:5000/re-stock', {
      product_id: productId,
      new_stock: newStock
    });
    // Update in local state
    setInventory(inventory.map(product => 
      product.id === productId ? {
        ...product,
        stock: newStock,
        lastRestocked: new Date().toISOString()
      } : product
    ));
  } catch (error) {
    alert('Failed to update stock!');
    console.error(error);
  }
};

  const AddProductModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      category: 'ingredients',
      description: '',
      image: 'https://via.placeholder.com/200x180/6C757D/white?text=New+Product',
      supplier: '',
      size: '',
      price: 0,
      stock: 0,
      lowStockThreshold: 0,
      baseProductId: null // Will be auto-generated or user can specify
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (formData.name && formData.supplier && formData.size) {
    // Send to backend
      try {
        const response = await axios.post('http://localhost:5000/add-product', {
         product_name: formData.name,
          product_category: formData.category,
          product_variant: formData.size,
          product_totalstock: formData.stock,
          product_totalsold: 0,
          product_description: formData.description,
          product_supplier: formData.supplier,
          product_price: formData.price,
          product_status: 'In Stock'
      });
      // Optionally, fetch inventory again or add to local state
      // Example: fetchInventory(); or setInventory([...inventory, response.data]);
      setShowAddModal(false);
    } catch (error) {
      alert('Failed to add product!');
      console.error(error);
    }
    // Reset form
    setFormData({
      name: '',
      category: 'ingredients',
      description: '',
      image: 'https://via.placeholder.com/200x180/6C757D/white?text=New+Product',
      supplier: '',
      size: '',
      price: 0,
      stock: 0,
      lowStockThreshold: 0,
      baseProductId: null
    });
  }
};

    if (!showAddModal) return null;

    return (
      <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add New Product Variant</h5>
              <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Product Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="ingredients">Ingredients</option>
                      <option value="tools">Tools</option>
                      <option value="packaging">Packaging</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Supplier *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Base Product ID (Optional)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.baseProductId || ''}
                      onChange={(e) => setFormData({...formData, baseProductId: e.target.value ? Number(e.target.value) : null})}
                      placeholder="Leave empty for new product"
                    />
                    <small className="form-text text-muted">Use existing ID to add variant to existing product</small>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Image URL</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.image}
                      onChange={(e) => setFormData({...formData, image: e.target.value})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Variant Size/Type *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.size}
                      onChange={(e) => setFormData({...formData, size: e.target.value})}
                      placeholder="e.g., 500ml, Large, Set of 3"
                      required
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-4">
                    <label className="form-label">Price (₱)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Initial Stock</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                      min="0"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Low Stock Threshold</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.lowStockThreshold}
                      onChange={(e) => setFormData({...formData, lowStockThreshold: Number(e.target.value)})}
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const EditProductModal = () => {
    const [formData, setFormData] = useState({});

    // Fixed useEffect - disable eslint warning for this specific case
    useEffect(() => {
      if (editingProduct) {
        setFormData(editingProduct);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingProduct]);

    const handleSubmit = (e) => {
      e.preventDefault();
      updateProduct(formData);
    };

    if (!editingProduct) return null;

    return (
      <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Product - {editingProduct.name} ({editingProduct.size})</h5>
              <button type="button" className="btn-close" onClick={() => setEditingProduct(null)}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Supplier</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.supplier || ''}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Variant Size/Type</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.size || ''}
                      onChange={(e) => setFormData({...formData, size: e.target.value})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={formData.category || 'ingredients'}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="ingredients">Ingredients</option>
                      <option value="tools">Tools</option>
                      <option value="packaging">Packaging</option>
                    </select>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-3">
                    <label className="form-label">Price (₱)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.price || 0}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Stock</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.stock || 0}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      min="0"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Low Stock Threshold</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.lowStockThreshold || 0}
                      onChange={(e) => setFormData({...formData, lowStockThreshold: e.target.value})}
                      min="0"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Units Sold</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.sold || 0}
                      onChange={(e) => setFormData({...formData, sold: e.target.value})}
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingProduct(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const RestockModal = () => {
    const [stockUpdates, setStockUpdates] = useState({});

    // Fixed useEffect - disable eslint warning for this specific case  
    useEffect(() => {
      if (selectedProduct) {
        // If selectedProduct is a single product, create updates object
        if (selectedProduct.id) {
          setStockUpdates({
            [selectedProduct.id]: selectedProduct.stock
          });
        } 
        // If selectedProduct is a product group with variants
        else if (selectedProduct.variants) {
          const initialUpdates = {};
          selectedProduct.variants.forEach(variant => {
            initialUpdates[variant.id] = variant.stock;
          });
          setStockUpdates(initialUpdates);
        }
      } else {
        setStockUpdates({});
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProduct]);

    const updateVariantStock = (variantId, newStock) => {
      setStockUpdates(prev => ({
        ...prev,
        [variantId]: Number(newStock)
      }));
    };

    const handleBulkRestock = () => {
      Object.entries(stockUpdates).forEach(([variantId, newStock]) => {
        const currentVariant = inventory.find(p => p.id === Number(variantId));
        if (currentVariant && currentVariant.stock !== newStock) {
          restockProduct(Number(variantId), newStock);
        }
      });
      setSelectedProduct(null);
      setStockUpdates({});
    };

    const getTotalStockChange = () => {
      let totalChange = 0;
      Object.entries(stockUpdates).forEach(([variantId, newStock]) => {
        const currentVariant = inventory.find(p => p.id === Number(variantId));
        if (currentVariant) {
          totalChange += newStock - currentVariant.stock;
        }
      });
      return totalChange;
    };

    if (!selectedProduct) return null;

    // Handle single product variant
    if (selectedProduct.id) {
      const newStock = stockUpdates[selectedProduct.id] || selectedProduct.stock;
      const stockChange = newStock - selectedProduct.stock;

      return (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
          <div className="modal-dialog modal-md">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Restock Product Variant</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedProduct(null)}></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name}
                    className="img-thumbnail mb-3"
                    style={{width: '120px', height: '120px', objectFit: 'cover'}}
                  />
                  <h6>{selectedProduct.name}</h6>
                  <p className="text-muted mb-1">{selectedProduct.size}</p>
                  <small className="text-muted">Product ID: #{selectedProduct.id}</small>
                </div>
                
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">Current Stock</label>
                    <input type="text" className="form-control" value={selectedProduct.stock} disabled />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Low Stock Threshold</label>
                    <input type="text" className="form-control" value={selectedProduct.lowStockThreshold} disabled />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">New Stock Level</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newStock}
                    onChange={(e) => updateVariantStock(selectedProduct.id, e.target.value)}
                    min="0"
                  />
                </div>
                
                <div className={`alert ${stockChange >= 0 ? 'alert-info' : 'alert-warning'}`}>
                  <small>
                    <strong>Stock Change:</strong> {stockChange >= 0 ? '+' : ''}{stockChange} units
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedProduct(null)}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={() => {
                    restockProduct(selectedProduct.id, newStock);
                    setSelectedProduct(null);
                  }}
                >
                  Update Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle product group with multiple variants
    if (selectedProduct.variants) {
      const totalStockChange = getTotalStockChange();
      const hasChanges = Object.entries(stockUpdates).some(([variantId, newStock]) => {
        const currentVariant = inventory.find(p => p.id === Number(variantId));
        return currentVariant && currentVariant.stock !== newStock;
      });

      return (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Restock Product Variants - {selectedProduct.name}</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedProduct(null)}></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <img 
                    src={selectedProduct.variants[0].image} 
                    alt={selectedProduct.name}
                    className="img-thumbnail mb-3"
                    style={{width: '100px', height: '100px', objectFit: 'cover'}}
                  />
                  <h6>{selectedProduct.name}</h6>
                  <p className="text-muted">Select variants to restock</p>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Product ID</th>
                        <th>Variant</th>
                        <th>Current Stock</th>
                        <th>Threshold</th>
                        <th>New Stock</th>
                        <th>Change</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProduct.variants.map(variant => {
                        const newStock = stockUpdates[variant.id] || variant.stock;
                        const stockChange = newStock - variant.stock;
                        const currentStatus = variant.stock === 0 ? 'danger' : 
                                            variant.stock <= variant.lowStockThreshold ? 'warning' : 'success';
                        const newStatus = newStock === 0 ? 'danger' : 
                                        newStock <= variant.lowStockThreshold ? 'warning' : 'success';

                        return (
                          <tr key={variant.id} className={stockChange !== 0 ? 'table-warning' : ''}>
                            <td><strong>#{variant.id}</strong></td>
                            <td><strong>{variant.size}</strong></td>
                            <td>{variant.stock}</td>
                            <td>{variant.lowStockThreshold}</td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={newStock}
                                onChange={(e) => updateVariantStock(variant.id, e.target.value)}
                                min="0"
                                style={{width: '80px'}}
                              />
                            </td>
                            <td>
                              <span className={`badge ${stockChange > 0 ? 'bg-success' : stockChange < 0 ? 'bg-danger' : 'bg-secondary'}`}>
                                {stockChange > 0 ? '+' : ''}{stockChange}
                              </span>
                            </td>
                            <td>
                              <span className={`badge bg-${currentStatus}`}>•</span>
                              {newStatus !== currentStatus && (
                                <>
                                  <i className="fas fa-arrow-right mx-1"></i>
                                  <span className={`badge bg-${newStatus}`}>•</span>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {hasChanges && (
                  <div className={`alert mt-3 ${totalStockChange >= 0 ? 'alert-info' : 'alert-warning'}`}>
                    <div className="d-flex justify-content-between align-items-center">
                      <small>
                        <strong>Total Stock Change:</strong> {totalStockChange >= 0 ? '+' : ''}{totalStockChange} units across all variants
                      </small>
                      <button 
                        className="btn btn-sm btn-outline-secondary" 
                        onClick={() => {
                          // Reset all changes
                          const resetUpdates = {};
                          selectedProduct.variants.forEach(variant => {
                            resetUpdates[variant.id] = variant.stock;
                          });
                          setStockUpdates(resetUpdates);
                        }}
                      >
                        Reset All
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedProduct(null)}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={handleBulkRestock}
                  disabled={!hasChanges}
                >
                  Update Stock ({Object.keys(stockUpdates).length} variants)
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <AddProductModal />
      <EditProductModal />
      <RestockModal />
    </>
  );
}

export default RestockInventory;