import {useState, useCallback} from 'react';

// hooks/useOrderOperations.js
export const useOrderOperations = () => {
  const updateOrderStatus = useCallback((orders, orderId, newStatus) => {
    return orders.map(order => 
      order.orderId === orderId 
        ? { ...order, status: newStatus }
        : order
    );
  }, []);

  const filterOrdersByDateRange = useCallback((orders, startDate, endDate) => {
    // Shared filtering logic
  }, []);

  const filterOrdersByStatus = useCallback((orders, status) => {
    // Shared status filtering
  }, []);

  return {
    updateOrderStatus,
    filterOrdersByDateRange,
    filterOrdersByStatus
  };
};
