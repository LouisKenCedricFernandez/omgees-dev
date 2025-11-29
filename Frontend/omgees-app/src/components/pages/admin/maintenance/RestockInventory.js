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
  setSelectedProduct,
  onProductAdded,
  suppliers = []
}) {

  // Update product function - ALIGNED WITH BACKEND
  const updateProduct = (updatedProduct) => {
    const payload = {
      product_id: updatedProduct.product_id || updatedProduct.id,
      updated_data: {
        product_name: updatedProduct.product_name || updatedProduct.name,
        product_category: updatedProduct.product_category || updatedProduct.category,
        product_variant: updatedProduct.product_variant || updatedProduct.size, 
        product_totalstock: Number(updatedProduct.product_totalstock || updatedProduct.stock),
        product_price: Number(updatedProduct.product_price || updatedProduct.price),
        product_description: updatedProduct.product_description || updatedProduct.description,
        product_supplier: updatedProduct.product_supplier || updatedProduct.supplier,
        product_totalsold: Number(updatedProduct.product_totalsold || updatedProduct.sold) || 0
      }
    };

    axios.post('http://localhost:5000/update-stock', payload)
      .then(response => {
        if (response.data.success) {
          setInventory(inventory.map(product =>
            (product.product_id || product.id) === (updatedProduct.product_id || updatedProduct.id)
              ? { ...product, ...updatedProduct }
              : product
          ));
          setEditingProduct(null);

          if (onProductAdded) {
            onProductAdded();
          }

          // Activity Log
          axios.post('http://localhost:5000/activity-log', {
            activity: 'Updated Product',
            user: 'inventory-staff',
            type: 'inventory',
            details: `Product: ${updatedProduct.product_name || updatedProduct.name} (${updatedProduct.product_variant || updatedProduct.size}), New Stock: ${updatedProduct.product_totalstock || updatedProduct.stock}`,
            timestamp: new Date().toISOString()
          }).catch(err => {
            console.error('Failed to log activity:', err);
          });
        }
      })
      .catch(error => {
        alert('Failed to update product!');
        console.error(error);
      });
  };

  //MODALS
const AddProductModal = () => {
  const [formData, setFormData] = useState({
    base_product_id: null,
    product_name: '',
    product_category: 'ingredients',
    product_description: '',
    product_supplier: '',
    product_variant: '',
    product_price: 0,
    product_totalstock: 0,
    product_totalsold: 0,
    product_status: 'active',
    product_image: null
  });

  const [productImage, setProductImage] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [supplierMode, setSupplierMode] = useState('existing'); // 'existing' or 'new'

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      setProductImage(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProductImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setProductImagePreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate supplier selection
    if (supplierMode === 'existing' && !formData.product_supplier) {
      alert('Please select a supplier');
      return;
    }
    if (supplierMode === 'new' && !formData.product_supplier.trim()) {
      alert('Please enter a supplier name');
      return;
    }

    const form = new FormData();
    form.append('base_product_id', formData.base_product_id || '');
    form.append('product_name', formData.product_name);
    form.append('product_category', formData.product_category);
    form.append('product_variant', formData.product_variant);
    form.append('product_totalstock', formData.product_totalstock);
    form.append('product_totalsold', 0);
    form.append('product_description', formData.product_description);
    form.append('product_supplier', formData.product_supplier);
    form.append('product_price', formData.product_price);
    form.append('product_status', 'active');
    form.append('last_restocked', new Date().toISOString());
    if (productImage) {
      form.append('product_image', productImage);
    }

    try {
      const res = await fetch('http://localhost:5000/add-product', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      
      if (data && !data.error) {
        setShowAddModal(false);
        alert('Product added successfully!');
        
        // Reset form
        setFormData({
          base_product_id: null,
          product_name: '',
          product_category: 'ingredients',
          product_description: '',
          product_supplier: '',
          product_variant: '',
          product_price: 0,
          product_totalstock: 0,
          product_totalsold: 0,
          product_status: 'active',
          product_image: null
        });
        setProductImage(null);
        setProductImagePreview(null);
        setSupplierMode('existing');
        
        if (onProductAdded) {
          await onProductAdded();
        }
      } else {
        alert('Failed to add product');
      }
    } catch (err) {
      console.error('Error adding product:', err);
      alert('Error adding product');
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
                    value={formData.product_name}
                    onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    value={formData.product_category}
                    onChange={(e) => setFormData({...formData, product_category: e.target.value})}
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
                  value={formData.product_description}
                  onChange={(e) => setFormData({...formData, product_description: e.target.value})}
                ></textarea>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Supplier *</label>
                  
                  {/* Supplier Mode Toggle */}
                  <div className="btn-group w-100 mb-2" role="group">
                    <button
                      type="button"
                      className={`btn btn-sm ${supplierMode === 'existing' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => {
                        setSupplierMode('existing');
                        setFormData({...formData, product_supplier: ''});
                      }}
                    >
                      <i className="fas fa-list me-1"></i>
                      Select Existing
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${supplierMode === 'new' ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => {
                        setSupplierMode('new');
                        setFormData({...formData, product_supplier: ''});
                      }}
                    >
                      <i className="fas fa-plus me-1"></i>
                      Add New Supplier
                    </button>
                  </div>

                  {/* Supplier Input - Changes based on mode */}
                  {supplierMode === 'existing' ? (
                    <select
                      className="form-select"
                      value={formData.product_supplier}
                      onChange={(e) => setFormData({...formData, product_supplier: e.target.value})}
                      required
                    >
                      <option value="">-- Select a supplier --</option>
                      {suppliers && suppliers.length > 0 ? (
                        suppliers.map((supplier, idx) => {
                          const supplierName = supplier.supplier_name || supplier.name;
                          return (
                            <option 
                              key={`${supplierName}-${idx}`}
                              value={supplierName}
                            >
                              {supplierName}
                            </option>
                          );
                        })
                      ) : (
                        <option disabled>No suppliers available</option>
                      )}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-control"
                      value={formData.product_supplier}
                      onChange={(e) => setFormData({...formData, product_supplier: e.target.value})}
                      placeholder="Enter new supplier name"
                      required
                    />
                  )}
                  
                  <small className="form-text text-muted d-block mt-1">
                    {supplierMode === 'existing' 
                      ? 'Choose from existing suppliers' 
                      : 'Create a new supplier entry'}
                  </small>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Base Product ID (Optional)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.base_product_id || ''}
                    onChange={(e) => setFormData({...formData, base_product_id: e.target.value ? Number(e.target.value) : null})}
                    placeholder="Leave empty for new product"
                  />
                  <small className="form-text text-muted">Use existing ID to add variant to existing product</small>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Product Image</label>
                  <input
                    type="file"
                    className="form-control"
                    id="productImageUpload"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  <small className="form-text text-muted">
                    Upload product image (JPEG, PNG, GIF, WebP - Max 5MB)
                  </small>
                  {productImage && (
                    <div className="text-success small mt-2">
                      <i className="fas fa-check me-1"></i>
                      File uploaded: {productImage.name}
                    </div>
                  )}
                  {productImagePreview && (
                    <div className="mt-3">
                      <label className="form-label small">Preview:</label>
                      <div className="border rounded p-2">
                        <img 
                          src={productImagePreview} 
                          alt="Product preview" 
                          className="img-fluid"
                          style={{ maxHeight: '150px', width: 'auto', borderRadius: '4px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Variant Size/Type *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.product_variant}
                    onChange={(e) => setFormData({...formData, product_variant: e.target.value})}
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
                    value={formData.product_price}
                    onChange={(e) => setFormData({...formData, product_price: Number(e.target.value)})}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Initial Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.product_totalstock}
                    onChange={(e) => setFormData({...formData, product_totalstock: Number(e.target.value)})}
                    min="0"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Units Sold</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.product_totalsold}
                    onChange={(e) => setFormData({...formData, product_totalsold: Number(e.target.value)})}
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
              <h5 className="modal-title">Edit Product - {editingProduct.product_name || editingProduct.name} ({editingProduct.product_variant || editingProduct.size})</h5>
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
                      value={formData.product_name || formData.name || ''}
                      onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Supplier *</label>
                    <select
                      className="form-select"
                      value={formData.product_supplier || formData.supplier || ''}
                      onChange={(e) => setFormData({...formData, product_supplier: e.target.value})}
                      required
                    >
                      <option value="">Select a supplier</option>
                      {suppliers.map((supplier) => (
                        <option 
                          key={supplier.supplier_id || supplier.id} 
                          value={supplier.supplier_name || supplier.name}
                        >
                          {supplier.supplier_name || supplier.name}
                        </option>
                      ))}
                    </select>
                    <small className="form-text text-muted">
                      Can only select from existing suppliers
                    </small>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={formData.product_description || formData.description || ''}
                    onChange={(e) => setFormData({...formData, product_description: e.target.value})}
                  ></textarea>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Variant Size/Type</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.product_variant || formData.size || ''}
                      onChange={(e) => setFormData({...formData, product_variant: e.target.value})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={formData.product_category || formData.category || 'ingredients'}
                      onChange={(e) => setFormData({...formData, product_category: e.target.value})}
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
                      value={formData.product_price || formData.price || 0}
                      onChange={(e) => setFormData({...formData, product_price: e.target.value})}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Stock</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.product_totalstock || formData.stock || 0}
                      onChange={(e) => setFormData({...formData, product_totalstock: e.target.value})}
                      min="0"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Sold</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.product_totalsold || formData.sold || 0}
                      onChange={(e) => setFormData({...formData, product_totalsold: e.target.value})}
                      min="0"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.product_status || formData.status || 'active'}
                      onChange={(e) => setFormData({...formData, product_status: e.target.value})}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Archived</option>
                    </select>
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

  const ArchiveModal = () => {
    const archiveProductByBaseId = async (baseProductId) => {
      try {
        const response = await axios.put(
          `http://localhost:5000/archive-product/${baseProductId}`,
          { archiveAll: true, baseProductId }
        );
        
        if (response.data.success && onProductAdded) {
          onProductAdded();
        }
      } catch (error) {
        console.error('Archive error:', error);
        alert('Failed to archive product');
      }
    };

    const restoreProductByBaseId = async (baseProductId) => {
      try {
        const response = await axios.put(
          `http://localhost:5000/restore-product/${baseProductId}`,
          { restoreAll: true, baseProductId }
        );
        
        if (response.data.success && onProductAdded) {
          onProductAdded();
        }
      } catch (error) {
        console.error('Restore error:', error);
        alert('Failed to restore product');
      }
    };

    const handleArchiveWholeProduct = async () => {
      if (!selectedProduct) return;
      
      const baseProductId = selectedProduct.base_product_id || selectedProduct.baseProductId;
      const productName = selectedProduct.product_name || selectedProduct.name;
      
      const confirmation = window.confirm(
        `Are you sure you want to archive "${productName}"? ` +
        'Archived items will be hidden from customers and cashiers but can be restored later.'
      );

      if (confirmation) {
        await archiveProductByBaseId(baseProductId || selectedProduct.product_id);
        setSelectedProduct(null);
        alert(`"${productName}" archived successfully.`);
      }
    };

    const handleRestoreWholeProduct = async () => {
      if (!selectedProduct) return;
      
      const baseProductId = selectedProduct.base_product_id || selectedProduct.baseProductId;
      const productName = selectedProduct.product_name || selectedProduct.name;
      
      const confirmation = window.confirm(
        `Are you sure you want to restore "${productName}"? ` +
        'It will become visible to customers and cashiers again.'
      );

      if (confirmation) {
        await restoreProductByBaseId(baseProductId || selectedProduct.product_id);
        setSelectedProduct(null);
        alert(`"${productName}" restored successfully.`);
      }
    };

    if (!selectedProduct) return null;

    const isArchived = (selectedProduct.product_status || selectedProduct.status) === 'inactive';
    const productName = selectedProduct.product_name || selectedProduct.name;
    const productVariant = selectedProduct.product_variant || selectedProduct.size;
    const productImage = selectedProduct.product_image || selectedProduct.image;
    const productStock = selectedProduct.product_totalstock || selectedProduct.stock;

    return (
      <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
        <div className="modal-dialog modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {isArchived ? 'Restore Product' : 'Archive Product'}
              </h5>
              <button type="button" className="btn-close" onClick={() => setSelectedProduct(null)}></button>
            </div>
            <div className="modal-body">
              <div className="text-center mb-4">
                <img 
                  src={productImage} 
                  alt={productName}
                  className="img-thumbnail mb-3"
                  style={{width: '120px', height: '120px', objectFit: 'cover'}}
                />
                <h6>{productName}</h6>
                <p className="text-muted mb-1">{productVariant}</p>
                <small className="text-muted">Product ID: #{selectedProduct.product_id || selectedProduct.id}</small>
              </div>
              
              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label">Current Stock</label>
                  <input type="text" className="form-control" value={productStock} disabled />
                </div>
                <div className="col-6">
                  <label className="form-label">Status</label>
                  <input 
                    type="text" 
                    className={`form-control ${isArchived ? 'text-danger' : 'text-success'}`}
                    value={isArchived ? 'Archived' : 'Active'} 
                    disabled 
                  />
                </div>
              </div>
              
              <div className={`alert ${isArchived ? 'alert-info' : 'alert-warning'}`}>
                <i className={`fas ${isArchived ? 'fa-info-circle' : 'fa-exclamation-triangle'} me-2`}></i>
                {isArchived ? (
                  <span>This product is currently archived. Restoring it will make it visible to customers and cashiers again.</span>
                ) : (
                  <span>Archiving this product will hide it from customers and cashiers, but you can restore it later.</span>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedProduct(null)}>
                Cancel
              </button>
              {isArchived ? (
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={handleRestoreWholeProduct}
                >
                  <i className="fas fa-undo me-2"></i>Restore Product
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleArchiveWholeProduct}
                >
                  <i className="fas fa-archive me-2"></i>Archive Product
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <AddProductModal />
      <EditProductModal />
      <ArchiveModal />
    </>
  );
}

export default RestockInventory;