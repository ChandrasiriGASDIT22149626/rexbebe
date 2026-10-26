'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'dark' | 'ghost' | 'pink' | 'purple' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyle =
    'relative inline-flex items-center justify-center font-heading font-black tracking-widest uppercase transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-full overflow-hidden cursor-pointer active:scale-95 border-[2.5px]';

  const sizeStyles = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-xs tracking-wider',
    lg: 'px-8 py-4 text-sm tracking-wider',
  };

  const variantStyles = {
    // Primary: Sky 3D Puffy Pill
    primary:
      'bg-gradient-to-b from-white via-sky-100/90 to-blue-100/95 border-sky-200/90 text-sky-800 shadow-[0_10px_22px_-4px_rgba(56,189,248,0.32),inset_0_4px_6px_rgba(255,255,255,0.95),inset_0_-3px_6px_rgba(2,132,199,0.08)] hover:shadow-[0_14px_28px_-4px_rgba(56,189,248,0.45)] hover:text-sky-900',
    // Accent: Amber 3D Puffy Pill
    accent:
      'bg-gradient-to-b from-white via-yellow-100/90 to-amber-100/95 border-amber-200/90 text-amber-800 shadow-[0_10px_22px_-4px_rgba(251,191,36,0.32),inset_0_4px_6px_rgba(255,255,255,0.95),inset_0_-3px_6px_rgba(217,119,6,0.08)] hover:shadow-[0_14px_28px_-4px_rgba(251,191,36,0.45)] hover:text-amber-900',
    // Pink: Pink 3D Puffy Pill
    pink:
      'bg-gradient-to-b from-white via-pink-100/90 to-rose-100/95 border-pink-200/90 text-pink-700 shadow-[0_10px_22px_-4px_rgba(244,114,182,0.32),inset_0_4px_6px_rgba(255,255,255,0.95),inset_0_-3px_6px_rgba(219,39,119,0.08)] hover:shadow-[0_14px_28px_-4px_rgba(244,114,182,0.45)] hover:text-pink-800',
    // Purple: Purple 3D Puffy Pill
    purple:
      'bg-gradient-to-b from-white via-purple-100/90 to-purple-200/95 border-purple-200/90 text-purple-700 shadow-[0_10px_22px_-4px_rgba(192,132,252,0.32),inset_0_4px_6px_rgba(255,255,255,0.95),inset_0_-3px_6px_rgba(147,51,234,0.08)] hover:shadow-[0_14px_28px_-4px_rgba(192,132,252,0.45)] hover:text-purple-800',
    // Emerald: Emerald 3D Puffy Pill
    emerald:
      'bg-gradient-to-b from-white via-emerald-100/90 to-mint-100/95 border-emerald-200/90 text-emerald-800 shadow-[0_10px_22px_-4px_rgba(52,211,153,0.32),inset_0_4px_6px_rgba(255,255,255,0.95),inset_0_-3px_6px_rgba(5,150,105,0.08)] hover:shadow-[0_14px_28px_-4px_rgba(52,211,153,0.45)] hover:text-emerald-900',
    // Secondary: Cream / Soft Slate 3D Puffy
    secondary:
      'bg-gradient-to-b from-white via-slate-50 to-slate-100/90 border-slate-200 text-slate-800 shadow-[0_8px_20px_-3px_rgba(0,0,0,0.1),inset_0_3.5px_5px_rgba(255,255,255,0.95)] hover:bg-white',
    dark:
      'bg-gradient-to-b from-slate-800 via-slate-900 to-black border-slate-700 text-white shadow-[0_10px_25px_-4px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:bg-slate-900',
    outline:
      'bg-gradient-to-b from-white/90 via-sky-50/50 to-sky-100/60 border-sky-300 text-sky-900 shadow-sm hover:border-sky-400',
    ghost:
      'bg-transparent border-transparent text-slate-800 hover:bg-white/60 shadow-none border-0',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.04, y: -2 }}
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {/* Top Gloss Reflection Layer */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none rounded-t-full" />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}

