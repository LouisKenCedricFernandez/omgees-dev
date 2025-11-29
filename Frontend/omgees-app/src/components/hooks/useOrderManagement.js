import { useState, useCallback, useEffect } from 'react'; // ADD THIS LINE

//handOrderComplete tsaka handleOrderStatus nandito
export const useOrderManagement = (currentUser, logActivity, deductStock) => {
  const [orders, setOrders] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);

  useEffect(() => {
  if (currentUser) {
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.customer?.email === currentUser.email) {
          return {
            ...order,
            customer: {
              ...order.customer,
              name: currentUser.name,
              phone: currentUser.phone,
              address: currentUser.address
            }
          };
        }
        return order;
      })
    );
  }
}, [currentUser, setOrders]); // ADD setOrders here 
 
  const handleOrderComplete = (newOrder) => {
    console.log('New order received:', newOrder);
    
    // Use cashier name for in-store orders, customer name for online orders
    const displayName = newOrder.orderType === 'in-store' 
      ? newOrder.cashierName || 'Store Cashier'
      : newOrder.customer.name || newOrder.customer.username;
    
    // Log to ACTIVITIES (for Activity Logs tab)
    logActivity({
      type: 'order_completed',
      action: `Order ${newOrder.orderId} completed`,
      details: {
        orderId: newOrder.orderId,
        orderType: newOrder.orderType,
        total: newOrder.total,
        itemCount: newOrder.items.length,
        customer: displayName
      },
      icon: 'check-circle',
      color: 'success'
    });

    // Stock deduction
    if (newOrder.orderType === 'in-store' && newOrder.status === 'completed') {
      deductStock(newOrder.items);
    } else if (newOrder.orderType === 'online' && newOrder.status === 'completed') {
      deductStock(newOrder.items);
    }
    
    setOrders(prevOrders => [...prevOrders, newOrder]);
    
    // Only add ACTUAL ORDERS to allTransactions (for Transaction Logs tab)
    setAllTransactions(prev => [...prev, newOrder]); // This should only be orders, not activities
  };
  const handleOrderStatusUpdate = (updatedOrders) => {
    updatedOrders.forEach((updatedOrder, index) => {
      const originalOrder = orders[index];
      
      if (originalOrder && 
          originalOrder.status !== 'completed' && 
          updatedOrder.status === 'completed') {
        console.log(`Order ${updatedOrder.orderId} marked as completed, deducting stock`);
        deductStock(updatedOrder.items);
        
        logActivity({
          type: 'order_status_changed',
          action: `Order ${updatedOrder.orderId} status changed to completed`,
          details: { orderId: updatedOrder.orderId },
          icon: 'arrow-clockwise',
          color: 'success'
        });
      }
    });
    
    setOrders(updatedOrders);
    
    // FIXED: Also update allTransactions to reflect the status changes
    setAllTransactions(prevTransactions => 
      prevTransactions.map(transaction => {
        const updatedOrder = updatedOrders.find(order => order.orderId === transaction.orderId);
        return updatedOrder ? updatedOrder : transaction;
      })
    );
  };

  return {
    orders,
    allTransactions,
    handleOrderComplete,
    handleOrderStatusUpdate
  };
};