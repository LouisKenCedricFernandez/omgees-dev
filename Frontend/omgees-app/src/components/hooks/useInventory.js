
//dito na nakalagay yung mga props na gagamitin para sa manage inventory natin pre pwede mo rin naman tanggalin ung baseproductid
import { useState, useCallback, useRef } from 'react';

export const useInventory = (initialInventory = []) => {
  const [inventory, setInventory] = useState(initialInventory);
  const hasInitialized = useRef(false);

  const updateInventory = useCallback((newInventory) => {
    setInventory(newInventory);
    hasInitialized.current = true;
  }, []);

  const addProduct = useCallback((newProduct) => {
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

    setInventory(prev => [...prev, productWithId]);
    return productWithId;
  }, [inventory]);

  const updateProduct = useCallback((updatedProduct) => {
    const processedData = {
      ...updatedProduct,
      price: Number(updatedProduct.price),
      stock: Number(updatedProduct.stock),
      lowStockThreshold: Number(updatedProduct.lowStockThreshold),
      sold: Number(updatedProduct.sold)
    };

    setInventory(prev => prev.map(product => 
      product.id === updatedProduct.id ? processedData : product
    ));
  }, []);

  const restockProduct = useCallback((productId, newStock) => {
    setInventory(prev => prev.map(product => 
      product.id === productId ? {
        ...product,
        stock: newStock,
        lastRestocked: new Date().toISOString()
      } : product
    ));
  }, []);

const addVariant = useCallback((baseProductId, newVariant) => {
  // Find all variants with the same baseProductId
  const existingVariants = inventory.filter(p => p.baseProductId === baseProductId);
  // Generate a new unique ID for the variant
  const newId = baseProductId * 1000 + existingVariants.length + 1;

  const variantWithId = {
    ...newVariant,
    id: newId,
    baseProductId,
    status: 'active',
    lastRestocked: new Date().toISOString(),
    sold: 0
  };

  setInventory(prev => [...prev, variantWithId]);
  return variantWithId;
  }, [inventory]);

  const updateVariant = useCallback((variantId, updatedVariant) => {
    setInventory(prev =>
      prev.map(variant =>
        variant.id === variantId
          ? {
              ...variant,
              ...updatedVariant,
              price: Number(updatedVariant.price),
              stock: Number(updatedVariant.stock),
              lowStockThreshold: Number(updatedVariant.lowStockThreshold),
              sold: Number(updatedVariant.sold)
            }
          : variant
      )
    );
  }, []);

  const restockVariant = useCallback((variantId, newStock) => {
    setInventory(prev =>
      prev.map(variant =>
        variant.id === variantId
          ? {
              ...variant,
              stock: newStock,
              lastRestocked: new Date().toISOString()
            }
          : variant
      )
    );
  }, []);

  return {
    inventory,
    updateInventory,
    addProduct,
    updateProduct,
    restockProduct,
    hasInitialized: hasInitialized.current,
    addVariant, 
    updateVariant, 
    restockVariant 
  };
};
