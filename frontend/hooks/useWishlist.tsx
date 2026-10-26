'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product } from '../types/product';
import { useAdminData } from './AdminContext';

interface WishlistContextType {
  wishlistItems: Product[];
  wishlistCount: number;
  wishlistIds: string[];
  isLoaded: boolean;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'rexbebe_wishlist_ids';
const WISHLIST_SESSION_KEY = 'rexbebe_wishlist_session_id';

function getWishlistSessionId(): string {
  if (typeof window === 'undefined') return 'wishlist-default';
  let id = localStorage.getItem(WISHLIST_SESSION_KEY);
  if (!id) {
    id = `wl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(WISHLIST_SESSION_KEY, id);
  }
  return id;
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { products } = useAdminData();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Initial Load from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setWishlistIds(parsed);
        }
      }
    } catch (e) {
      console.warn('[useWishlist] Failed to read from localStorage:', e);
    }
    setIsLoaded(true);

    // Sync with backend API in background if available
    const sessionId = getWishlistSessionId();
    fetch(`/api/wishlist?wishlistId=${encodeURIComponent(sessionId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.productIds && Array.isArray(data.data.productIds)) {
          setWishlistIds((prev) => {
            // Merge local and backend IDs
            const merged = Array.from(new Set([...prev, ...data.data.productIds]));
            try {
              localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      })
      .catch(() => {
        // Backend offline or unreachable, local persistence remains active
      });
  }, []);

  // Save to localStorage whenever wishlistIds changes
  const saveIds = useCallback((newIds: string[]) => {
    setWishlistIds(newIds);
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(newIds));
    } catch {}

    // Sync to backend asynchronously
    const sessionId = getWishlistSessionId();
    fetch('/api/wishlist/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wishlistId: sessionId, productIds: newIds }),
    }).catch(() => {});
  }, []);

  const toggleWishlist = useCallback(
    (product: Product) => {
      if (!product?.id) return;
      const pid = product.id;
      setWishlistIds((prev) => {
        const exists = prev.includes(pid);
        const next = exists ? prev.filter((id) => id !== pid) : [...prev, pid];
        try {
          localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
        } catch {}

        // Backend sync
        const sessionId = getWishlistSessionId();
        if (exists) {
          fetch(`/api/wishlist/${encodeURIComponent(pid)}?wishlistId=${encodeURIComponent(sessionId)}`, {
            method: 'DELETE',
          }).catch(() => {});
        } else {
          fetch('/api/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wishlistId: sessionId, productId: pid }),
          }).catch(() => {});
        }

        return next;
      });
    },
    []
  );

  const isInWishlist = useCallback(
    (productId: string) => {
      if (!productId) return false;
      return wishlistIds.includes(productId);
    },
    [wishlistIds]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      if (!productId) return;
      saveIds(wishlistIds.filter((id) => id !== productId));
    },
    [wishlistIds, saveIds]
  );

  const clearWishlist = useCallback(() => {
    saveIds([]);
  }, [saveIds]);

  // Map wishlistIds to authoritative, active Product objects from AdminContext/database
  const wishlistItems = useMemo(() => {
    if (!isLoaded || wishlistIds.length === 0) return [];
    const idSet = new Set(wishlistIds);
    return products.filter((p) => idSet.has(p.id) && p.status !== 'draft' && p.status !== 'unpublished');
  }, [wishlistIds, products, isLoaded]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount: wishlistIds.length,
        wishlistIds,
        isLoaded,
        toggleWishlist,
        isInWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
