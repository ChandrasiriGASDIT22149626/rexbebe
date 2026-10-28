'use client';

import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { Product, ProductVariant } from '../types/product';
import { useAdminData } from './AdminContext';
import { fetchApi } from '../services/api';
import { INITIAL_PRODUCTS } from '../data/products';
export { INITIAL_PRODUCTS };

export interface CartItemState {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface CartNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

interface CartContextType {
  items: CartItemState[];
  isOpen: boolean;
  isLoaded: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => { success: boolean; message: string };
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => { success: boolean; message?: string };
  clearCart: () => void;
  subtotal: number;
  shippingFee: number;
  total: number;
  itemCount: number;
  notification: CartNotification | null;
  clearNotification: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'rexbebe_cart_items_v2';
const CART_SESSION_KEY = 'rexbebe_cart_session_id';

function getCartSessionId(): string {
  if (typeof window === 'undefined') return 'cart-default';
  let id = localStorage.getItem(CART_SESSION_KEY);
  if (!id) {
    id = `cart-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(CART_SESSION_KEY, id);
  }
  return id;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { products } = useAdminData();
  const [items, setItems] = useState<CartItemState[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [notification, setNotification] = useState<CartNotification | null>(null);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const showNotification = useCallback((message: string, type: CartNotification['type'] = 'info') => {
    const notif: CartNotification = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
    };
    setNotification(notif);
    setTimeout(() => {
      setNotification((curr) => (curr?.id === notif.id ? null : curr));
    }, 3500);
  }, []);

  const clearNotification = useCallback(() => setNotification(null), []);

  // Save cart to localStorage and backend
  const persistCart = useCallback((cartItems: CartItemState[]) => {
    try {
      const serializable = cartItems.map((item) => ({
        productId: item.product.id,
        variantId: item.variant.id,
        quantity: item.quantity,
      }));
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(serializable));
    } catch (e) {
      console.warn('[useCart] Failed to write to localStorage:', e);
    }

    // Backend sync
    const sessionId = getCartSessionId();
    fetchApi('/cart/validate', {
      method: 'POST',
      body: JSON.stringify({
        cartId: sessionId,
        items: cartItems.map((i) => ({ variantId: i.variant.id, quantity: i.quantity })),
      }),
    }).catch(() => {});
  }, []);

  // 1. Initial Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const rawList = JSON.parse(saved);
        if (Array.isArray(rawList) && rawList.length > 0 && products.length > 0) {
          const restored: CartItemState[] = [];

          for (const raw of rawList) {
            const product = products.find((p) => p.id === raw.productId) || products.find((p) => (p.variants || []).some((v) => v.id === raw.variantId));
            if (!product) continue;

            const variant = (product.variants || []).find((v) => v.id === raw.variantId) || {
              id: raw.variantId || `var-default-${product.id}`,
              sku: product.sku || 'REX-STD',
              price: product.price,
              stockQuantity: product.stockQuantity || 0,
            };

            const liveStock = variant.stockQuantity ?? product.stockQuantity ?? 0;
            if (liveStock > 0) {
              const qty = Math.min(raw.quantity || 1, liveStock);
              restored.push({
                product,
                variant: {
                  ...variant,
                  price: variant.price || product.price, // Live price guarantee
                },
                quantity: qty,
              });
            }
          }

          setItems(restored);
        }
      }
    } catch (e) {
      console.warn('[useCart] Error reading saved cart:', e);
    }
    setIsLoaded(true);
  }, [products]);

  // Add item to cart with stock validation and price validation
  const addToCart = useCallback(
    (product: Product, variant: ProductVariant, quantity: number = 1): { success: boolean; message: string } => {
      // Find authoritative live product & variant from catalog
      const liveProduct = products.find((p) => p.id === product.id) || product;
      const liveVariant = (liveProduct.variants || []).find((v) => v.id === variant.id) || variant;

      const availableStock = liveVariant.stockQuantity ?? liveProduct.stockQuantity ?? 0;

      if (availableStock <= 0) {
        const msg = `Sorry, "${liveProduct.name}" is currently sold out.`;
        showNotification(msg, 'warning');
        return { success: false, message: msg };
      }

      let outcomeMessage = '';
      let success = true;

      setItems((prev) => {
        const existingIndex = prev.findIndex((item) => item.variant.id === liveVariant.id);
        let updated: CartItemState[];

        if (existingIndex > -1) {
          const currentQty = prev[existingIndex].quantity;
          const desiredQty = currentQty + quantity;

          if (desiredQty > availableStock) {
            outcomeMessage = `Added maximum available stock (${availableStock} items) to your bag.`;
            const copy = [...prev];
            copy[existingIndex] = {
              ...copy[existingIndex],
              product: liveProduct,
              variant: { ...liveVariant, price: liveVariant.price || liveProduct.price },
              quantity: availableStock,
            };
            updated = copy;
          } else {
            outcomeMessage = `Added ${quantity} × "${liveProduct.name}" to your bag.`;
            const copy = [...prev];
            copy[existingIndex] = {
              ...copy[existingIndex],
              product: liveProduct,
              variant: { ...liveVariant, price: liveVariant.price || liveProduct.price },
              quantity: desiredQty,
            };
            updated = copy;
          }
        } else {
          const initialQty = Math.min(quantity, availableStock);
          if (quantity > availableStock) {
            outcomeMessage = `Only ${availableStock} in stock; added all available to your bag.`;
          } else {
            outcomeMessage = `Added "${liveProduct.name}" to your bag.`;
          }

          updated = [
            ...prev,
            {
              product: liveProduct,
              variant: { ...liveVariant, price: liveVariant.price || liveProduct.price },
              quantity: initialQty,
            },
          ];
        }

        persistCart(updated);
        return updated;
      });

      showNotification(outcomeMessage, 'success');
      openCart();
      return { success, message: outcomeMessage };
    },
    [products, persistCart, openCart, showNotification]
  );

  const updateQuantity = useCallback(
    (variantId: string, quantity: number): { success: boolean; message?: string } => {
      if (quantity <= 0) {
        removeFromCart(variantId);
        return { success: true, message: 'Item removed from bag' };
      }

      let message: string | undefined;

      setItems((prev) => {
        const target = prev.find((i) => i.variant.id === variantId);
        if (!target) return prev;

        const liveStock = target.variant.stockQuantity ?? target.product.stockQuantity ?? 999;
        let finalQty = quantity;

        if (quantity > liveStock) {
          finalQty = liveStock;
          message = `Maximum stock available is ${liveStock}.`;
          showNotification(message, 'warning');
        }

        const updated = prev.map((item) =>
          item.variant.id === variantId ? { ...item, quantity: finalQty } : item
        );

        persistCart(updated);
        return updated;
      });

      return { success: true, message };
    },
    [persistCart, showNotification]
  );

  const removeFromCart = useCallback(
    (variantId: string) => {
      setItems((prev) => {
        const itemToRemove = prev.find((i) => i.variant.id === variantId);
        const updated = prev.filter((item) => item.variant.id !== variantId);
        persistCart(updated);
        if (itemToRemove) {
          showNotification(`Removed "${itemToRemove.product.name}" from your bag.`, 'info');
        }
        return updated;
      });
    },
    [persistCart, showNotification]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
    const sessionId = getCartSessionId();
    fetchApi(`/cart?cartId=${encodeURIComponent(sessionId)}`, { method: 'DELETE' }).catch(() => {});
    showNotification('Shopping bag cleared', 'info');
  }, [showNotification]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.variant.price || item.product.price) * item.quantity, 0);
  }, [items]);

  const shippingFee = useMemo(() => {
    return subtotal >= 50000 || subtotal === 0 ? 0 : 1500;
  }, [subtotal]);

  const total = useMemo(() => subtotal + shippingFee, [subtotal, shippingFee]);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        isLoaded,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        shippingFee,
        total,
        itemCount,
        notification,
        clearNotification,
      }}
    >
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
