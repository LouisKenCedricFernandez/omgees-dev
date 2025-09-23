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
  /*const addProduct = (newProduct) => {
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
  };*/

  // Update product function -nt
const updateProduct = (updatedProduct) => {
  const payload = {
    product_id: updatedProduct.id,
    updated_data: {
      product_name: updatedProduct.name,
      product_category: updatedProduct.category,
      product_variant: updatedProduct.size,
      product_totalstock: Number(updatedProduct.stock),
      product_price: Number(updatedProduct.price),
      product_description: updatedProduct.description,
      product_supplier: updatedProduct.supplier,
      product_totalsold: Number(updatedProduct.sold) || 0
    }
  };

  axios.post('http://localhost:5000/update-stock', payload)
    .then(response => {
      setInventory(inventory.map(product =>
        product.id === updatedProduct.id
          ? { ...product, ...updatedProduct, stock: Number(updatedProduct.stock) }
          : product
      ));
      setEditingProduct(null);
    })
    .catch(error => {
      alert('Failed to update product!');
      console.error(error);
    });
};



  // Archive product function
  const archiveProduct = (productId) => {
    setInventory(inventory.map(product => 
      product.id === productId ? {
        ...product,
        status: 'inactive',
        archivedDate: new Date().toISOString()
      } : product
    ));
  };

  // Restore product function (if needed later)
  const restoreProduct = (productId) => {
    setInventory(inventory.map(product => 
      product.id === productId ? {
        ...product,
        status: 'active',
        restoredDate: new Date().toISOString()
      } : product
    ));
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

    // File upload states similar to checkout
    const [productImage, setProductImage] = useState(null);
    const [productImagePreview, setProductImagePreview] = useState(null);

    const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
          return;
        }
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
          alert('Image size should be less than 5MB');
          return;
        }
        
        setProductImage(file);
        
        // Create preview for image
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

    // Add this inside your AddProductModal component

const handleSubmit = async (e) => {
  e.preventDefault();

  const form = new FormData();
  form.append('base_product_id', formData.baseProductId || '');
  form.append('product_name', formData.name);
  form.append('product_category', formData.category);
  form.append('product_variant', formData.size);
  form.append('product_totalstock', formData.stock);
  form.append('product_totalsold', 0);
  form.append('product_description', formData.description);
  form.append('product_supplier', formData.supplier);
  form.append('product_price', formData.price);
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
      // Optionally refresh inventory from backend here
      setShowAddModal(false);
    } else {
      alert('Failed to add product');
    }
  } catch (err) {
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

                {/* Updated Image Upload Section - Similar to checkout */}
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

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Archived</option>
                    </select>
                    <small className="form-text text-muted">
                      {formData.status === 'inactive' ? 'This product is archived and hidden from customers/cashiers' : 'This product is visible to customers and cashiers'}
                    </small>
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
  // Archive by baseProductId - much simpler function
  const archiveProductByBaseId = (baseProductId) => {
    setInventory(inventory.map(product => 
      product.baseProductId === baseProductId ? {
        ...product,
        status: 'inactive',
        archivedDate: new Date().toISOString()
      } : product
    ));
  };

  const restoreProductByBaseId = (baseProductId) => {
    setInventory(inventory.map(product => 
      product.baseProductId === baseProductId ? {
        ...product,
        status: 'active',
        restoredDate: new Date().toISOString()
      } : product
    ));
  };

  const handleArchiveWholeProduct = () => {
    if (!selectedProduct || !selectedProduct.variants) return;
    
    const baseProductId = selectedProduct.variants[0].baseProductId;
    const productName = selectedProduct.name;
    const variantCount = selectedProduct.variants.length;
    
    const confirmation = window.confirm(
      `Are you sure you want to archive all ${variantCount} variants of "${productName}"? ` +
      'Archived items will be hidden from customers and cashiers but can be restored later.'
    );

    if (confirmation) {
      archiveProductByBaseId(baseProductId);
      setSelectedProduct(null);
      alert(`All variants of "${productName}" archived successfully.`);
    }
  };

  const handleRestoreWholeProduct = () => {
    if (!selectedProduct || !selectedProduct.variants) return;
    
    const baseProductId = selectedProduct.variants[0].baseProductId;
    const productName = selectedProduct.name;
    const variantCount = selectedProduct.variants.length;
    
    const confirmation = window.confirm(
      `Are you sure you want to restore all ${variantCount} variants of "${productName}"? ` +
      'They will become visible to customers and cashiers again.'
    );

    if (confirmation) {
      restoreProductByBaseId(baseProductId);
      setSelectedProduct(null);
      alert(`All variants of "${productName}" restored successfully.`);
    }
  };

  if (!selectedProduct) return null;

  // Handle single product variant
  if (selectedProduct.id) {
    const isArchived = selectedProduct.status === 'inactive';
    
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
                  onClick={() => {
                    const confirmation = window.confirm('Are you sure you want to restore this product?');
                    if (confirmation) {
                      restoreProduct(selectedProduct.id);
                      setSelectedProduct(null);
                      alert('Product restored successfully.');
                    }
                  }}
                >
                  <i className="fas fa-undo me-2"></i>Restore Product
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={() => {
                    const confirmation = window.confirm('Are you sure you want to archive this product?');
                    if (confirmation) {
                      archiveProduct(selectedProduct.id);
                      setSelectedProduct(null);
                      alert('Product archived successfully.');
                    }
                  }}
                >
                  <i className="fas fa-archive me-2"></i>Archive Product
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle product group with multiple variants - simplified to archive/restore all at once
  if (selectedProduct.variants) {
    const activeVariants = selectedProduct.variants.filter(v => v.status === 'active');
    const archivedVariants = selectedProduct.variants.filter(v => v.status === 'inactive');
    const allArchived = archivedVariants.length === selectedProduct.variants.length;

    return (
      <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {allArchived ? 'Restore Product' : 'Archive Product'} - {selectedProduct.name}
              </h5>
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
                <p className="text-muted">
                  {selectedProduct.variants.length} variant{selectedProduct.variants.length > 1 ? 's' : ''}
                  {activeVariants.length > 0 && archivedVariants.length > 0 && 
                    ` (${activeVariants.length} active, ${archivedVariants.length} archived)`
                  }
                </p>
              </div>

              <div className="table-responsive mb-3">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Product ID</th>
                      <th>Variant</th>
                      <th>Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProduct.variants.map(variant => {
                      const isArchived = variant.status === 'inactive';
                      return (
                        <tr key={variant.id} className={isArchived ? 'table-secondary' : ''}>
                          <td><strong>#{variant.id}</strong></td>
                          <td><strong>{variant.size}</strong></td>
                          <td>{variant.stock}</td>
                          <td>
                            <span className={`badge ${isArchived ? 'bg-secondary' : 'bg-success'}`}>
                              {isArchived ? 'Archived' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={`alert ${allArchived ? 'alert-info' : 'alert-warning'}`}>
                <i className={`fas ${allArchived ? 'fa-info-circle' : 'fa-exclamation-triangle'} me-2`}></i>
                {allArchived ? (
                  <span>All variants are currently archived. Restoring will make them visible to customers and cashiers again.</span>
                ) : (
                  <span>This will archive ALL variants of this product. They will be hidden from customers and cashiers but can be restored later.</span>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedProduct(null)}>
                Cancel
              </button>
              {allArchived ? (
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={handleRestoreWholeProduct}
                >
                  <i className="fas fa-undo me-2"></i>Restore All Variants
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleArchiveWholeProduct}
                >
                  <i className="fas fa-archive me-2"></i>Archive All Variants
                </button>
              )}
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
      <ArchiveModal />
    </>
  );
}

export default RestockInventory;