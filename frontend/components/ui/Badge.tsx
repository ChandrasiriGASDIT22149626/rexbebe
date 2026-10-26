import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'sage' | 'rose' | 'dark' | 'outline';
}

export function Badge({ children, variant = 'brand' }: BadgeProps) {
  const styles = {
    brand: 'bg-brand-100 text-brand-800 border-brand-200',
    sage: 'bg-sage-100 text-sage-700 border-sage-200',
    rose: 'bg-rose-100 text-rose-700 border-rose-200',
    dark: 'bg-stone-900 text-stone-100 border-stone-800',
    outline: 'bg-transparent text-stone-700 border-stone-300',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 text-[10px] font-semibold tracking-widest uppercase border rounded-full ${styles[variant]}`}>
      {children}
    </span>
  );
}
