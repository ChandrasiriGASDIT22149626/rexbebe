'use client';

import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlist } from '../../hooks/useWishlist';

export function WishlistButtonHeader({ className = '' }: { className?: string }) {
  const { wishlistCount } = useWishlist();

  return (
    <Link
      href="/wishlist"
      className={`relative w-8 h-8 xl:w-9 xl:h-9 2xl:w-10 2xl:h-10 text-slate-800 dark:text-slate-200 hover:text-pink-600 dark:hover:text-pink-400 bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700/90 rounded-full transition-all duration-200 border border-white/90 dark:border-slate-700 focus:outline-none flex items-center justify-center shadow-xs active:scale-95 group ${className}`}
      aria-label={`Wishlist (${wishlistCount} items)`}
      title={`Wishlist (${wishlistCount} items)`}
    >
      <Heart
        className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
          wishlistCount > 0
            ? 'fill-pink-500 text-pink-500'
            : 'text-slate-800 dark:text-slate-200'
        }`}
      />
      {wishlistCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-in fade-in zoom-in duration-200">
          {wishlistCount > 99 ? '99+' : wishlistCount}
        </span>
      )}
    </Link>
  );
}
