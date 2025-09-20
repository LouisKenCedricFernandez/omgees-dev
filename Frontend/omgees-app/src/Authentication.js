import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Initial demo users
  const initialUsers = {
    'customer@example.com': {
      password: 'password123',
      type: 'customer',
      name: 'Lowis Ken',
      phone: '+63 912 345 6789',
      address: '123 Sample Street, Barangay ABC, Quezon City, Metro Manila 1100'
    },
    'admin@example.com': {
      password: 'admin123',
      type: 'admin',
      name: 'Cedric Fornandis',
      phone: '',
      address: ''
    },
    'cashier@example.com': {
      password: 'cashier123',
      type: 'cashier',
      name: 'Maria Santos',
      phone: '+63 912 555 7890',
      address: 'Store Location'
    },
    'inventory@example.com': {
      password: 'inventory123',
      type: 'inventory_manager',
      name: 'Jose Rodriguez',
      phone: '+63 912 555 1234',
      address: 'Store Location'
    }
  };

  const [users, setUsers] = useState(initialUsers);
  const [currentUser, setCurrentUser] = useState(null);

  const authenticateUser = (email, password) => {
    const user = users[email];
    
    if (user && user.password === password) {
      return {
        email: email,
        name: user.name,
        type: user.type,
        phone: user.phone,
        address: user.address
      };
    }
    return null;
  };

  const login = (email, password) => {
    const user = authenticateUser(email, password);
    if (user) {
      setCurrentUser(user);
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password. Please try again.' };
  };

  const register = (userData) => {
    const { name, email, phone, address, password } = userData;
    
    // Check if user already exists
    if (users[email]) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    // Create new user (all new registrations are customers by default)
    const newUser = {
      password: password,
      type: 'customer',
      name: name,
      phone: phone,
      address: address
    };

    // Add user to users object
    setUsers(prevUsers => ({
      ...prevUsers,
      [email]: newUser
    }));

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.type === 'admin',
    isCashier: currentUser?.type === 'cashier',
    isInventoryManager: currentUser?.type === 'inventory_manager',
    isCustomer: currentUser?.type === 'customer'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};