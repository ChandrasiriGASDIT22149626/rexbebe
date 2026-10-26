'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { SubItem, MenuItem } from './ShopDropdownMenu';

export const NEW_IN_MENU_TREE: MenuItem[] = [
  {
    title: 'JUST DROPPED',
    href: '/new-in',
    subItems: [
      { name: 'Newborn', href: '/new-in?category=newborn' },
      { name: 'Baby Girls', href: '/new-in?category=girls' },
      { name: 'Baby Boys', href: '/new-in?category=boys' },
    ],
  },
  {
    title: 'NEW CLOTHING',
    href: '/new-in',
    subItems: [
      { name: 'New Dresses', href: '/new-in?category=dresses' },
      { name: 'New Rompers', href: '/new-in?category=rompers' },
      { name: 'New Tops & T-Shirts', href: '/new-in?category=tops-tshirts' },
      { name: 'New Shirts', href: '/new-in?category=shirts' },
      { name: 'New Sets', href: '/new-in?category=sets' },
      { name: 'New Sleepwear', href: '/new-in?category=sleepwear' },
    ],
  },
  {
    title: 'NEW SEASON',
    href: '/new-in',
    subItems: [
      { name: 'Spring / Summer', href: '/new-in?season=spring-summer' },
      { name: 'Festive', href: '/new-in?season=festive' },
      { name: 'Special Occasion', href: '/new-in?season=special-occasion' },
    ],
  },
  {
    title: 'TRENDING NOW',
    href: '/new-in',
    subItems: [
      { name: 'Best New Sellers', href: '/new-in?trending=best-sellers' },
      { name: 'Most Loved', href: '/new-in?trending=most-loved' },
      { name: 'New Arrivals', href: '/new-in?trending=new-arrivals' },
    ],
  },
];

interface NewInDropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewInDropdownMenu({ isOpen, onClose }: NewInDropdownMenuProps) {
  const [activeHoverItem, setActiveHoverItem] = useState<MenuItem | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onMouseLeave={() => {
            setActiveHoverItem(null);
            onClose();
          }}
          className="absolute top-[calc(100%+6px)] left-0 z-[150] flex items-start select-none before:absolute before:-top-3 before:inset-x-0 before:h-3 before:content-[''] pointer-events-auto"
        >
          {/* Solid Opaque Dark Dropdown Box */}
          <div
            className="w-[280px] rounded-[32px] border border-white/10 p-6 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)] space-y-3.5 relative text-stone-100"
            style={{ backgroundColor: '#141414' }}
          >
            {NEW_IN_MENU_TREE.map((item, idx) => {
              const hasSub = item.subItems && item.subItems.length > 0;
              const isHovered = activeHoverItem?.title === item.title;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveHoverItem(hasSub ? item : null)}
                  className="relative group"
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center justify-between text-[13px] font-extrabold tracking-wider uppercase transition-colors py-1.5 px-3 rounded-xl ${
                      isHovered
                        ? 'text-white bg-white/15 shadow-sm'
                        : 'text-stone-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{item.title}</span>
                    {hasSub && (
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isHovered ? 'text-amber-400 translate-x-1' : 'text-stone-400'
                        }`}
                      />
                    )}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Secondary Flyout Panel */}
          <AnimatePresence>
            {activeHoverItem && activeHoverItem.subItems && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="ml-3 w-[240px] rounded-[32px] border border-white/10 p-6 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)] space-y-2.5 z-[110] text-stone-100"
                style={{ backgroundColor: '#141414' }}
              >
                <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-white border-b border-white/10 pb-2 mb-3">
                  {activeHoverItem.title}
                </div>
                {activeHoverItem.subItems.map((sub, i) => (
                  <Link
                    key={i}
                    href={sub.href}
                    onClick={onClose}
                    className="block text-[12px] font-semibold tracking-wide text-stone-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all"
                  >
                    {sub.name}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
