'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export interface BoysCategoryItem {
  name: string;
  href: string;
}

export const BOYS_MENU_ITEMS: BoysCategoryItem[] = [
  { name: 'Rompers', href: '/boys?category=rompers' },
  { name: 'T-Shirts', href: '/boys?category=t-shirts' },
  { name: 'Shirts', href: '/boys?category=shirts' },
  { name: 'Polos', href: '/boys?category=polos' },
  { name: 'Shorts', href: '/boys?category=shorts' },
  { name: 'Trousers', href: '/boys?category=trousers' },
  { name: 'Sets', href: '/boys?category=sets' },
  { name: 'Sleepwear', href: '/boys?category=sleepwear' },
];

interface BoysDropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  align?: 'left' | 'right';
}

export function BoysDropdownMenu({ isOpen, onClose, align = 'right' }: BoysDropdownMenuProps) {
  const isRightAligned = align === 'right';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onMouseLeave={onClose}
          className={`absolute top-[calc(100%+6px)] ${
            isRightAligned ? 'right-0 left-auto' : 'left-0 right-auto'
          } z-[150] flex items-start select-none before:absolute before:-top-3 before:inset-x-0 before:h-3 before:content-[''] pointer-events-auto`}
        >
          <div
            className="w-[260px] rounded-[32px] border border-white/10 p-6 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)] space-y-2.5 relative text-stone-100"
            style={{ backgroundColor: '#141414' }}
          >
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-white border-b border-white/10 pb-2 mb-3">
              BABY BOYS
            </div>
            {BOYS_MENU_ITEMS.map((item, idx) => (
              <div key={idx} className="relative group">
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="block text-[13px] font-extrabold tracking-wider uppercase text-stone-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all"
                >
                  {item.name}
                </Link>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
