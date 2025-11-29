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
  // Load current user from localStorage so auth persists across refreshes
  const [currentUserState, setCurrentUserState] = useState(() => {
    try {
      const raw = localStorage.getItem('omgees_currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Failed to parse stored currentUser', e);
      return null;
    }
  });

  // Wrapper to keep state and localStorage in sync
  const setCurrentUser = (user) => {
    setCurrentUserState(user);
    try {
      if (user) {
        localStorage.setItem('omgees_currentUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('omgees_currentUser');
      }
    } catch (e) {
      console.warn('Failed to persist currentUser to localStorage', e);
    }
  };

  // Demo users for the application
  const [users, setUsers] = useState({
    'customer@example.com': {
      id: 1, // Make sure each user has an id
      password: 'password123',
      type: 'customer',
      name: 'Lowis Ken',
      phone: '+63 912 345 6789',
      address: '123 Sample Street, Barangay ABC, Quezon City, Metro Manila 1100',
      status: 'active',
      createdDate: new Date().toISOString(),
      lastLogin: null
    },
    'admin@example.com': {
      id: 2,
      password: 'admin123',
      type: 'admin',
      name: 'Cedric Fornandis',
      phone: '',
      address: '',
      status: 'active',
      createdDate: new Date().toISOString(),
      lastLogin: null
    },
    'cashier@example.com': {
      id: 3,
      password: 'cashier123',
      type: 'cashier',
      name: 'Maria Santos',
      phone: '+63 912 555 7890',
      address: 'Store Location',
      status: 'active',
      createdDate: new Date().toISOString(),
      lastLogin: null
    },
    'inventory@example.com': {
      id: 4,
      password: 'inventory123',
      type: 'inventory_manager',
      name: 'Jose Rodriguez',
      phone: '+63 912 555 1234',
      address: 'Store Location',
      status: 'active',
      createdDate: new Date().toISOString(),
      lastLogin: null
    }
  });

  // Add user management functions
  const addUser = (newUser) => {
    const email = newUser.email;
    const userWithId = {
      ...newUser,
      id: Math.max(...Object.values(users).map(u => u.id || 0), 0) + 1,
      status: 'active'
    };
    setUsers(prev => ({
      ...prev,
      [email]: userWithId
    }));
  };

  const updateUser = (updatedUser) => {
    const email = updatedUser.email;
    
    // Update the main users state
    setUsers(prev => ({
      ...prev,
      [email]: updatedUser
    }));
    
    // If this is the current user, also update currentUser state
    if (currentUserState && currentUserState.email === email) {
      // keep persisted user in sync
      setCurrentUser(updatedUser);
    }
  };

  const toggleUserStatus = (userId) => {
    setUsers(prev => {
      const updatedUsers = { ...prev };
      
      // Find and update user by ID
      Object.keys(updatedUsers).forEach(email => {
        if (updatedUsers[email].id === userId) {
          updatedUsers[email] = {
            ...updatedUsers[email],
            status: updatedUsers[email].status === 'active' ? 'archived' : 'active'
          };
        }
      });
      
      return updatedUsers;
    });
  };
  
  const register = (userData) => {
    // This is a placeholder for registration functionality
    // In a real app, this would create a new user in the database
    console.log('Registration data:', userData);
    return { success: false, error: 'Registration not implemented in demo' };
  };

  const authenticateUser = (email, password) => {
    const user = users[email];
    
    if (user && user.password === password) {
      return {
        email: email,
        name: user.name,
        type: user.type,
        phone: user.contact,
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
  
  const logout = () => {
    setCurrentUser(null);
  };

  const getAllUsers = () => {
    return Object.entries(users).map(([email, userData]) => ({
      ...userData,
      email
    }));
  };

  // Backend user setter -nt
    const setBackendUser = (user) => {
    // Called by backend login flow to set the authenticated user
    setCurrentUser(user);
  };
  // Add these to your value object:
  const value = {
    currentUser: currentUserState,
    login,
    register, // Added register to the context value
    logout,
    setBackendUser,// Added setter for backend user -nt
    isAuthenticated: !!currentUserState,
    isAdmin: currentUserState?.type === 'admin',
    isCashier: currentUserState?.type === 'cashier',
    isInventoryManager: currentUserState?.type === 'inventory_manager',
    isCustomer: currentUserState?.type === 'customer',
    users: getAllUsers(),
    addUser,
    updateUser,
    toggleUserStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};