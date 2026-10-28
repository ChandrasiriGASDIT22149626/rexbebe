'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export function ThemeToggleButton({ className = '' }: { className?: string }) {
  const { isDarkMode, toggleTheme, mounted } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative w-8 h-8 xl:w-9 xl:h-9 2xl:w-10 2xl:h-10 text-slate-800 dark:text-amber-400 bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700/90 rounded-full transition-all duration-200 border border-white/90 dark:border-slate-700 focus:outline-none flex items-center justify-center shadow-xs active:scale-95 group ${className}`}
      aria-label={mounted && isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={mounted && isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {!mounted ? (
        <span className="w-4 h-4 block" aria-hidden="true" />
      ) : isDarkMode ? (
        <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 dark:text-slate-200 group-hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
}
