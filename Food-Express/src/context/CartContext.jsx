import { useState } from 'react';
import { CartContext } from './CartContextDef';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addItem = (restaurantId, item) => {
    setCartItems(prev => {
      const existing = prev.find(
        (cartItem) => cartItem.id === item.id && cartItem.restaurantId === restaurantId,
      );
      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === item.id && cartItem.restaurantId === restaurantId
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        );
      }
      return [...prev, { ...item, restaurantId, quantity: 1 }];
    });
    return true;
  };

  const removeItem = (itemId, restaurantId) =>
    setCartItems((prev) =>
      prev.filter((item) => item.id !== itemId || item.restaurantId !== restaurantId),
    );

  const updateQuantity = (itemId, restaurantId, quantity) =>
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId && item.restaurantId === restaurantId
          ? { ...item, quantity }
          : item,
      ),
    );

  const clearCart = () => setCartItems([]);

  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addItem, removeItem, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};
