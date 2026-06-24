import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Keep localStorage in sync with cart state
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, shopId, shopName, quantity = 1) => {
    const availableStock = product.stock[shopId] || 0;
    
    if (availableStock <= 0) {
      throw new Error(`This item is currently out of stock at ${shopName}.`);
    }
    if (availableStock < 1) {
      throw new Error(`Stock is only ${availableStock} units, but the minimum order quantity is 1.`);
    }

    // Clamp the requested quantity to [1, 2]
    const clampedQty = Math.max(1, Math.min(2, quantity));

    setCartItems(prevItems => {
      // Find if item already exists in cart for the SAME shop
      const existingIndex = prevItems.findIndex(
        item => item.productId === product.id && item.shopId === shopId
      );

      if (existingIndex > -1) {
        const existingItem = prevItems[existingIndex];
        const maxAllowed = Math.min(2, availableStock);
        const newQuantity = Math.min(maxAllowed, existingItem.quantity + clampedQty);

        if (newQuantity === existingItem.quantity) {
          throw new Error(`Cannot add more. The limit is 2 units, and you already have ${existingItem.quantity} in your cart.`);
        }

        const updatedItems = [...prevItems];
        updatedItems[existingIndex] = {
          ...existingItem,
          quantity: newQuantity
        };
        return updatedItems;
      } else {
        // New item entry
        if (clampedQty > availableStock) {
          throw new Error(`Cannot add requested amount. Stock is only ${availableStock} units at ${shopName}.`);
        }

        return [
          ...prevItems,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
            quantity: clampedQty,
            shopId,
            shopName,
            maxStock: availableStock
          }
        ];
      }
    });
  };

  const updateQuantity = (productId, shopId, newQuantity) => {
    const clampedQty = Math.max(1, Math.min(2, newQuantity));

    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.productId === productId && item.shopId === shopId) {
          const maxAllowed = Math.min(2, item.maxStock);
          const finalQuantity = Math.min(maxAllowed, clampedQty);
          return { ...item, quantity: finalQuantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId, shopId) => {
    setCartItems(prevItems =>
      prevItems.filter(item => !(item.productId === productId && item.shopId === shopId))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Calculations
  const totalPrice = parseFloat(
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
  );
  
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalPrice,
        totalItems
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
