import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { getProduct } from '@/data/placeholders';

/**
 * Cart context for the Customer app.
 * Stores items in memory. Each item has { productId, quantity }.
 * TEMP: replace with API calls when backend is ready.
 */
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const add = useCallback((productId) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  }, []);

  const setQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  const remove = useCallback((productId) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const product = getProduct(item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  }, [items]);

  /** Get quantity of a specific product in cart */
  const getQuantity = useCallback(
    (productId) => {
      const item = items.find((i) => i.productId === productId);
      return item ? item.quantity : 0;
    },
    [items]
  );

  const value = useMemo(
    () => ({ items, add, setQuantity, remove, clear, count, subtotal, getQuantity }),
    [items, add, setQuantity, remove, clear, count, subtotal, getQuantity]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
