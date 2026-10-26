'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

export function CartButtonHeader({ className = '' }: { className?: string }) {
  const { openCart, itemCount } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      className={`relative w-8 h-8 xl:w-9 xl:h-9 2xl:w-10 2xl:h-10 text-slate-800 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700/90 rounded-full transition-all duration-200 border border-white/90 dark:border-slate-700 focus:outline-none flex items-center justify-center shadow-xs active:scale-95 group ${className}`}
      aria-label={`Shopping Cart (${itemCount} items)`}
      title={`Shopping Cart (${itemCount} items)`}
    >
      <ShoppingBag className="w-4 h-4 text-slate-800 dark:text-slate-200 group-hover:scale-110 transition-transform duration-200" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-in fade-in zoom-in duration-200">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}
