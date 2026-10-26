'use client';

import React from 'react';
import { Search } from 'lucide-react';

export function SearchButtonHeader({ onClick, className = '' }: { onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-8 h-8 xl:w-9 xl:h-9 2xl:w-10 2xl:h-10 text-slate-800 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700/90 rounded-full transition-all duration-200 border border-white/90 dark:border-slate-700 focus:outline-none flex items-center justify-center shadow-xs active:scale-95 group ${className}`}
      aria-label="Search Boutique Catalog"
      title="Search (Ctrl + K)"
    >
      <Search className="w-4 h-4 text-slate-800 dark:text-slate-200 group-hover:scale-110 transition-transform duration-200" />
    </button>
  );
}
