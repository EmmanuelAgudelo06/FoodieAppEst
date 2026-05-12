import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadCart();
  }, []);


  // Bug #6: era "}, []" → el efecto solo corría al montar, el contador nunca se actualizaba al agregar/quitar ítems
  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(total);
  }, [cartItems]);

  const loadCart = async () => {
    try {
      const stored = await AsyncStorage.getItem('@foodie_cart');
      if (stored) {
        // Bug #7: era "setCartItems(stored)" — guardaba el string JSON como estado, rompiendo todo el carrito al reabrir la app
        setCartItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = async (items) => {
    try {
      // Bug #8: era "setItem('@foodie_cart', items)" — AsyncStorage solo acepta strings, pasarle el array lanzaba error y no persistía nada
      await AsyncStorage.setItem('@foodie_cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };
  
  const addToCart = (dish) => {
    const updatedCart = [...cartItems];
    updatedCart.push({  
      id: dish.id,
      name: dish.name,
      price: dish.price,
      image: dish.image,
      quantity: 1,
    });
    setCartItems(updatedCart);
    saveCart(updatedCart);
  };
  
  const removeFromCart = (dishId) => {
    // Bug #9: era "const updatedCart = cartItems" → referencia al mismo array, mutación directa del estado, React no detectaba el cambio
    const updatedCart = [...cartItems];
    const index = updatedCart.findIndex(item => item.id === dishId);
    if (index > -1) {
      updatedCart.splice(index, 1);  
    }
    setCartItems(updatedCart); 
    saveCart(updatedCart);
  };

  // F08: Incrementa o decrementa la cantidad de un ítem; si llega a 0 lo elimina
  const updateQuantity = (dishId, delta) => {
    const updatedCart = [...cartItems];
    const index = updatedCart.findIndex(item => item.id === dishId);
    if (index > -1) {
      const newQty = updatedCart[index].quantity + delta;
      if (newQty <= 0) {
        updatedCart.splice(index, 1);
      } else {
        updatedCart[index] = { ...updatedCart[index], quantity: newQty };
      }
      setCartItems(updatedCart);
      saveCart(updatedCart);
    }
  };

  // F03: Actualiza las notas especiales asociadas a un ítem del carrito
  const updateNote = (dishId, note) => {
    const updated = cartItems.map(item =>
      item.id === dishId ? { ...item, notes: note } : item
    );
    setCartItems(updated);
    saveCart(updated);
  };

  const clearCart = () => {
    setCartItems([]);
    saveCart([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        removeFromCart,
        clearCart,
        getCartTotal,
        updateQuantity,
        updateNote,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
