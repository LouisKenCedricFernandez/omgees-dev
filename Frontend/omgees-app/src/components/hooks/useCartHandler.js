import { useState, useCallback } from 'react'; // ADD THIS LINE

export const useCartHandler = () => {
  const [cartItems, setCartItems] = useState([]);

  const handleUpdateCart = useCallback((updatedItems) => {
    setCartItems(updatedItems);
  }, []);

  return {
    cartItems,
    handleUpdateCart
  };
};