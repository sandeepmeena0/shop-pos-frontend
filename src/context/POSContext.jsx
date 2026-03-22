import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, productService, settingService } from '../services/index.js';
import toast from 'react-hot-toast';

const POSContext = createContext();

export const POSProvider = ({ children }) => {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const u = localStorage.getItem('pos_user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });

  // --- Products (loaded from API) ---
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // --- Cart (kept in localStorage for session persistence) ---
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pos_cart') || '[]'); }
    catch { return []; }
  });

  // --- Hold Orders ---
  const [holdOrders, setHoldOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pos_hold_orders') || '[]'); }
    catch { return []; }
  });

  // --- Settings ---
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // --- Effects ---
  useEffect(() => { localStorage.setItem('pos_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('pos_hold_orders', JSON.stringify(holdOrders)); }, [holdOrders]);

  // Load products and settings when user authenticated
  useEffect(() => {
    if (currentUser) {
      fetchProducts();
      fetchSettings();
    }
  }, [currentUser]);

  // --- Dynamic Theming ---
  useEffect(() => {
    if (settings?.themeColor) {
      document.documentElement.style.setProperty('--theme-primary', settings.themeColor);
      
      // Calculate a slightly darker version for hover (approx -15%)
      // Simple hex to darkened version
      const color = settings.themeColor;
      if (color.startsWith('#') && color.length === 7) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const darken = (c) => Math.max(0, Math.floor(c * 0.85)).toString(16).padStart(2, '0');
        const darkColor = `#${darken(r)}${darken(g)}${darken(b)}`;
        document.documentElement.style.setProperty('--theme-primary-hover', darkColor);
      }
    }
  }, [settings?.themeColor]);

  // --- Settings Actions ---
  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const { data } = await settingService.get();
      setSettings(data);
    } catch (error) {
       console.error("Failed to load settings from API");
       setSettings(null);
    } finally {
       setSettingsLoading(false);
    }
  };

  const updateSettings = async (newData) => {
    try {
      const { data } = await settingService.update(newData);
      setSettings(data);
      toast.success('Settings updated successfully');
      return { success: true };
    } catch (error) {
      toast.error('Failed to update settings');
      return { success: false };
    }
  };

  // --- Auth Actions ---
  const login = async (username, password) => {
    try {
      const { data } = await authService.login({ username, password });
      localStorage.setItem('pos_token', data.token);
      localStorage.setItem('pos_user', JSON.stringify(data));
      setCurrentUser(data);
      return { success: true, user: data };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      return { success: false, message: msg };
    }
  };

  const logout = useCallback(() => {
    // Clear all session data
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_cart');
    localStorage.removeItem('pos_hold_orders');
    // Reset all state
    setCurrentUser(null);
    setProducts([]);
    setCart([]);
    setHoldOrders([]);
    setSettings(null);
  }, []);

  // --- Product Actions ---
  const fetchProducts = useCallback(async (options = {}) => {
    setProductsLoading(true);
    try {
      const { data } = options.showAll ? await productService.getAllAdmin() : await productService.getAll();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // --- Cart Actions ---
  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(p => p._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Only ${product.stock} units in stock`);
          return prev;
        }
        return prev.map(p => p._id === product._id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      if (product.stock === 0) {
        toast.error('This item is out of stock');
        return prev;
      }
      return [{ ...product, quantity: 1, discount: 0 }, ...prev];
    });
  }, []);

  const updateCartItemQuantity = useCallback((id, qty) => {
    setCart(prev => prev.map(item => {
      if (item._id === id) {
        const newQty = Math.max(1, Math.min(qty, item.stock));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(item => item._id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const applyDiscountToItem = useCallback((id, discountAmt) => {
    setCart(prev => prev.map(item => item._id === id ? { ...item, discount: discountAmt } : item));
  }, []);

  // --- Hold Order Actions ---
  const holdCurrentOrder = useCallback((referenceName) => {
    if (cart.length === 0) return;
    const holdOrder = {
      id: 'HLD-' + Date.now(),
      time: new Date().toISOString(),
      reference: referenceName || `Order ${new Date().toLocaleTimeString()}`,
      items: [...cart],
    };
    setHoldOrders(prev => [holdOrder, ...prev]);
    setCart([]);
    toast.success('Order placed on hold');
  }, [cart]);

  const restoreHoldOrder = useCallback((holdOrderId) => {
    const order = holdOrders.find(o => o.id === holdOrderId);
    if (order) {
      setCart(order.items);
      setHoldOrders(prev => prev.filter(o => o.id !== holdOrderId));
    }
  }, [holdOrders]);

  return (
    <POSContext.Provider value={{
      // Auth
      currentUser, login, logout,
      // Products
      products, productsLoading, fetchProducts, setProducts,
      // Cart
      cart, addToCart, updateCartItemQuantity, removeFromCart, clearCart, applyDiscountToItem,
      // Hold
      holdOrders, holdCurrentOrder, restoreHoldOrder,
      // Settings
      settings, setSettings, updateSettings, fetchSettings, settingsLoading,
    }}>
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => useContext(POSContext);
