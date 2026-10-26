'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '../../hooks/useWishlist';
import { useAdminData } from '../../hooks/AdminContext';
import { Product } from '../../types/product';

export function WishlistButton({
  productId,
  product: passedProduct,
  className = '',
}: {
  productId: string;
  product?: Product;
  className?: string;
}) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { products } = useAdminData();
  const isSaved = isInWishlist(productId);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const product = passedProduct || products.find((p) => p.id === productId);
    if (!product) return;
    toggleWishlist(product);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`p-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-xs hover:bg-white dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 hover:text-rose-500 dark:hover:text-rose-400 transition-all focus:outline-none active:scale-90 ${className}`}
      aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
      title={isSaved ? 'Saved in Wishlist' : 'Add to Wishlist'}
    >
      <Heart
        className={`w-4 h-4 transition-transform duration-200 ${
          isSaved ? 'fill-rose-500 text-rose-500 scale-110' : 'text-stone-700 dark:text-slate-200'
        }`}
      />
    </button>
  );
}
