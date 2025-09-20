import React, {useState} from 'react';
import './App.css';
import { AuthProvider, useAuth } from './Authentication';
import UserLogin from './UserLogin';
import UserRegister from './UserRegister';
import AdminNavbar from './components/inc/AdminNavbar';
import CashierNavbar from './components/inc/CashierNavbar';
import InventoryNavbar from './components/inc/InventoryNavbar';
import Logs from './components/pages/admin/Logs';
import Details from './components/pages/admin/Details';
import Reports from './components/pages/admin/Reports';
import Maintenance from './components/pages/admin/Maintenance';
import Navbar from './components/inc/Navbar';
import Home from './components/pages/Home';
import About from './components/pages/About';
import Contact from './components/pages/Contact';
import Checkout from './components/pages/Checkout';
import Ingredients from './components/pages/products/Ingredients';
import Tools from './components/pages/products/Tools';
import Packaging from './components/pages/products/Packaging';
import Dashboard from './components/pages/admin/Dashboard';
import CreateOrder from './components/pages/cashier-staff/CreateOrder';
import ManageOrder from './components/pages/cashier-staff/ManageOrder';
import ManageInventory from './components/pages/inventory-staff/ManageInventory';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function AppContent() {
  const { isAuthenticated, isAdmin, isCashier, isInventoryManager, isCustomer, currentUser, logout } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentInventory, setCurrentInventory] = useState([]);
  
  // MINIMAL monitoring - only add if admin exists
  const [activities, setActivities] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);

  // Safe activity logging that won't break if admin monitoring fails
const logActivity = (activity) => {
  try {
    const newActivity = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'System',
      userType: currentUser?.type || 'system',
      ...activity
    };
    
    console.log('📝 ACTIVITY LOGGED:', newActivity); // Debug line
    
    // Always log activities - admin can view them later
    setActivities(prev => [newActivity, ...prev.slice(0, 99)]);
    
  } catch (error) {
    console.warn('Activity logging failed:', error);
  }
};

  // Your existing functions - keep them unchanged
  const convertInventoryToProducts = (inventory) => {
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
  };

  // Fixed stock deduction function
  const deductStock = (orderItems) => {
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
  };

  const handleInventoryUpdate = (updatedInventory) => {
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
  };

  const handleUpdateCart = (updatedItems) => {
    setCartItems(updatedItems);
  };  

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
  };

  if (!isAuthenticated) {
    return (
      <div className="login">
        <Routes>
          <Route path="/login" element={<UserLogin />} />
          <Route path="/login/register" element={<UserRegister />} />
          <Route path="/*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }
  
  return (
    <div className="App">
      {isAdmin ? (
        <div className="admin-section">
          <AdminNavbar user={currentUser} onLogout={logout} />
          <div className="admin-content" style={{ paddingTop: '70px' }}>
            <Routes>
              <Route 
                path="/admin/dashboard" 
                element={
                  <Dashboard 
                    user={currentUser} 
                    onLogout={logout} 
                    activities={activities || []}
                    orders={orders || []}
                    inventory={currentInventory || []}
                  />
                } 
              />
              <Route 
                path="/admin/logs" 
                element={
                  <Logs 
                    transactions={allTransactions || []}
                    activities={activities || []}
                  />
                } 
              />
              <Route path="/admin/logs/details" element={<Details/>} />
              <Route 
                path="/admin/reports" 
                element={
                  <Reports 
                    transactions={allTransactions || []}
                    inventory={currentInventory || []}
                  />
                } 
              />
              <Route path="/admin/maintenance" element={<Maintenance/>} />
              <Route path="/*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      ) : isCashier ? (
        <div className="cashier-section">
          <CashierNavbar user={currentUser} onLogout={logout} />
          <div className="cashier-content" style={{ paddingTop: '70px' }}>
            <Routes>
              <Route 
                path="/cashier/create-orders" 
                element={
                  <CreateOrder 
                    user={currentUser} 
                    onOrderComplete={handleOrderComplete}
                    inventory={currentInventory}
                  />
                } 
              />
              <Route 
                path="/cashier/manage-orders" 
                element={
                  <ManageOrder 
                    user={currentUser} 
                    orders={orders} 
                    onUpdateOrder={handleOrderStatusUpdate} 
                  />
                } 
              />
              <Route path="/*" element={<Navigate to="/cashier/create-orders" replace />} />
            </Routes>
          </div>
        </div>
      ) : isInventoryManager ? (
        <div className="inventory-section">
          <InventoryNavbar user={currentUser} onLogout={logout} />
          <div className="inventory-content" style={{ paddingTop: '70px' }}>
            <Routes>
              <Route 
                path="/inventory/manage" 
                element={
                  <ManageInventory 
                    user={currentUser}
                    onInventoryUpdate={handleInventoryUpdate}
                    initialInventory={currentInventory}
                  />
                } 
              />
              <Route path="/*" element={<Navigate to="/inventory/manage" replace />} />
            </Routes>
          </div>
        </div>
      ) : isCustomer ? (
        <div className="customer-section">
          <Navbar user={currentUser} onLogout={logout} cartItems={cartItems} onUpdateCart={handleUpdateCart} />
          <Routes>
            <Route path="/" element={<Home user={currentUser} onLogout={logout} />} />
            <Route path="/about" element={<About />} />
            <Route 
              path="/checkout" 
              element={
                <Checkout 
                  cartItems={cartItems} 
                  onUpdateCart={handleUpdateCart} 
                  user={currentUser} 
                  onOrderComplete={handleOrderComplete} 
                />
              } 
            />
            <Route 
              path="/products/ingredients" 
              element={
                <Ingredients 
                  cartItems={cartItems} 
                  onUpdateCart={handleUpdateCart}
                  products={convertInventoryToProducts(currentInventory).filter(p => 
                    currentInventory.some(item => 
                      item.baseProductId === p.id && 
                      item.category === 'ingredients' && 
                      item.status === 'active'
                    )
                  )}
                />
              } 
            />
            <Route 
              path="/products/tools" 
              element={
                <Tools 
                  cartItems={cartItems} 
                  onUpdateCart={handleUpdateCart}
                  products={convertInventoryToProducts(currentInventory).filter(p => 
                    currentInventory.some(item => 
                      item.baseProductId === p.id && 
                      item.category === 'tools' && 
                      item.status === 'active'
                    )
                  )}
                />
              } 
            />
            <Route 
              path="/products/packaging" 
              element={
                <Packaging 
                  cartItems={cartItems} 
                  onUpdateCart={handleUpdateCart}
                  products={convertInventoryToProducts(currentInventory).filter(p => 
                    currentInventory.some(item => 
                      item.baseProductId === p.id && 
                      item.category === 'packaging' && 
                      item.status === 'active'
                    )
                  )}
                />
              } 
            />
            <Route path="/*" element={<Navigate to="/" replace />} />
          </Routes>
          <Contact />
        </div>
      ) : (
        <div className="container py-5">
          <div className="alert alert-danger">
            <h4>Access Error</h4>
            <p>Your account type is not recognized. Please contact an administrator.</p>
            <button className="btn btn-primary" onClick={logout}>Continue</button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;