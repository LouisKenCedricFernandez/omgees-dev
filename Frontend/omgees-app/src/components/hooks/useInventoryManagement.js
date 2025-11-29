import { useState, useCallback } from 'react';

export const useInventoryManagement = (logActivity) => {
  const [currentInventory, setCurrentInventory] = useState([]);

  const handleInventoryUpdate = useCallback((updatedInventory) => {
    const previousCount = currentInventory.length;
    const newCount = updatedInventory.length;
    
    setCurrentInventory(updatedInventory);
    
    // Safe logging - won't break if it fails
    if (newCount > previousCount) {
      logActivity({
        type: 'inventory_added',
        action: `New product variant added to inventory`,
        details: { previousCount, newCount },
        icon: 'plus-circle',
        color: 'success'
      });
    } else if (newCount < previousCount) {
      logActivity({
        type: 'inventory_removed',
        action: `Product variant removed from inventory`,
        details: { previousCount, newCount },
        icon: 'minus-circle',
        color: 'warning'
      });
    } else if (newCount > 0) {
      logActivity({
        type: 'inventory_updated',
        action: `Inventory updated`,
        details: { itemCount: newCount },
        icon: 'arrow-clockwise',
        color: 'info'
      });
    }
    
    console.log('Inventory updated:', updatedInventory.length, 'items');
  }, [currentInventory.length, logActivity]); // Add dependencies

  const convertInventoryToProducts = useCallback((inventory) => {
    // Your existing logic
    const productMap = new Map();
    
    inventory.forEach(item => {
      if (item.status !== 'active') return;
      
      if (productMap.has(item.baseProductId)) {
        const existingProduct = productMap.get(item.baseProductId);
        existingProduct.variants.push({
          id: item.id,
          size: item.size,
          price: item.price,
          count: item.stock
        });
        if (item.price < existingProduct.price) {
          existingProduct.price = item.price;
        }
        existingProduct.count += item.stock;
        existingProduct.sold += item.sold;
      } else {
        productMap.set(item.baseProductId, {
          id: item.baseProductId,
          name: item.name,
          price: item.price,
          image: item.image,
          sold: item.sold,
          count: item.stock,
          description: item.description,
          variants: [{
            id: item.id,
            size: item.size,
            price: item.price,
            count: item.stock
          }]
        });
      }
    });
    
    return Array.from(productMap.values());
  }, []); // No dependencies since it's a pure function

  const deductStock = useCallback((orderItems) => {
    console.log('Deducting stock for items:', orderItems);
    
    setCurrentInventory(prevInventory => {
      const updatedInventory = prevInventory.map(inventoryItem => {
        const matchingOrderItem = orderItems.find(orderItem => {
          if (orderItem.selectedVariant) {
            return orderItem.selectedVariant.id === inventoryItem.id;
          }
          return orderItem.id === inventoryItem.id;
        });
        
        if (matchingOrderItem) {
          const newStock = Math.max(0, inventoryItem.stock - matchingOrderItem.quantity);
          const newSold = inventoryItem.sold + matchingOrderItem.quantity;
          
          console.log(`Updating item ${inventoryItem.id}: stock ${inventoryItem.stock} -> ${newStock}, sold ${inventoryItem.sold} -> ${newSold}`);
          
          return {
            ...inventoryItem,
            stock: newStock,
            sold: newSold
          };
        }
        return inventoryItem;
      });
      
      console.log('Stock deduction completed');
      return updatedInventory;
    });
  }, []); // No dependencies since it uses the functional update pattern

  return {
    currentInventory,
    setCurrentInventory,
    deductStock,
    handleInventoryUpdate,
    convertInventoryToProducts
  };
};