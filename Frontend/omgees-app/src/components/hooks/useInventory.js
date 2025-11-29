import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useInventory = (autoFetch = true) => {
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Normalize product data from backend to frontend format
  const normalizeProduct = useCallback((product) => ({
    id: product.product_id,
    baseProductId: product.base_product_id ?? product.product_id ?? 0,
    name: product.product_name ?? "",
    category: product.product_category ?? "",
    size: product.product_variant ?? "",
    variant: product.product_variant ?? "",
    image: product.product_image
      ? `http://localhost:5000/${product.product_image.replace(/^public\//, '').replace(/^\/?uploads\//, 'uploads/')}`
      : "https://via.placeholder.com/150",
    description: product.product_description ?? "",
    supplier: product.product_supplier ?? "",
    stock: product.product_totalstock ?? 0,
    sold: product.product_totalsold ?? 0,
    lowStockThreshold: product.lowStockThreshold ?? 10,
    status: product.product_status ?? "active",
    price: product.product_price ?? 0,
    lastRestocked: product.last_restocked ?? new Date().toISOString(),
  }), []);

  // Fetch inventory from backend
  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('http://localhost:5000/inventory');
      console.log('Fetched inventory:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        const normalized = response.data.map(normalizeProduct);
        setInventory(normalized);
        return normalized;
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err.message || 'Failed to fetch inventory');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [normalizeProduct]);

  // Refresh inventory (alias for fetchInventory for clarity)
  const refreshInventory = useCallback(() => {
    return fetchInventory();
  }, [fetchInventory]);

  // Update local inventory state
  const updateInventory = useCallback((updatedInventory) => {
    setInventory(updatedInventory);
  }, []);

  // Update a single product in the inventory
  const updateProduct = useCallback((productId, updates) => {
    setInventory(prev => 
      prev.map(product => 
        product.id === productId 
          ? { ...product, ...updates }
          : product
      )
    );
  }, []);

  // Add a new product to inventory
  const addProduct = useCallback((newProduct) => {
    setInventory(prev => [...prev, normalizeProduct(newProduct)]);
  }, [normalizeProduct]);

  // Remove a product from inventory
  const removeProduct = useCallback((productId) => {
    setInventory(prev => prev.filter(product => product.id !== productId));
  }, []);

  // Archive/Restore products
  const archiveProduct = useCallback(async (productId, archiveAll = false, baseProductId = null) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/archive-product/${productId}`,
        { archiveAll, baseProductId }
      );
      
      if (response.data.success) {
        await refreshInventory();
        return response.data;
      }
    } catch (err) {
      console.error('Archive error:', err);
      throw err;
    }
  }, [refreshInventory]);

  const restoreProduct = useCallback(async (productId, restoreAll = false, baseProductId = null) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/restore-product/${productId}`,
        { restoreAll, baseProductId }
      );
      
      if (response.data.success) {
        await refreshInventory();
        return response.data;
      }
    } catch (err) {
      console.error('Restore error:', err);
      throw err;
    }
  }, [refreshInventory]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchInventory();
    }
  }, [autoFetch, fetchInventory]);

  return {
    inventory,
    isLoading,
    error,
    fetchInventory,
    refreshInventory,
    updateInventory,
    updateProduct,
    addProduct,
    removeProduct,
    archiveProduct,
    restoreProduct,
    setInventory,
    setError 
  };
};

export default useInventory;