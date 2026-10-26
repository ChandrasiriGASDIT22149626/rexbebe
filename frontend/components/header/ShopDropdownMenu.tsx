'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export interface SubItem {
  name: string;
  href: string;
}

export interface MenuItem {
  title: string;
  href: string;
  subItems?: SubItem[];
}

export const SHOP_MENU_TREE: MenuItem[] = [
  {
    title: 'SHOP ALL',
    href: '/shop',
  },
  {
    title: 'BY AGE',
    href: '/shop',
    subItems: [
      { name: 'Newborn (0–3M)', href: '/shop?age=0-3m' },
      { name: '3–6 Months', href: '/shop?age=3-6m' },
      { name: '6–12 Months', href: '/shop?age=6-12m' },
      { name: '1–2 Years', href: '/shop?age=1-2y' },
      { name: '2–3 Years', href: '/shop?age=2-3y' },
      { name: '3–4 Years', href: '/shop?age=3-4y' },
      { name: '4–6 Years', href: '/shop?age=4-6y' },
    ],
  },
  {
    title: 'BABY GIRLS',
    href: '/girls',
    subItems: [
      { name: 'Dresses', href: '/girls?category=dresses' },
      { name: 'Rompers', href: '/girls?category=rompers' },
      { name: 'Tops', href: '/girls?category=tops' },
      { name: 'T-Shirts', href: '/girls?category=t-shirts' },
      { name: 'Skirts', href: '/girls?category=skirts' },
      { name: 'Shorts', href: '/girls?category=shorts' },
      { name: 'Leggings', href: '/girls?category=leggings' },
      { name: 'Sets', href: '/girls?category=sets' },
      { name: 'Sleepwear', href: '/girls?category=sleepwear' },
    ],
  },
  {
    title: 'BABY BOYS',
    href: '/boys',
    subItems: [
      { name: 'Rompers', href: '/boys?category=rompers' },
      { name: 'T-Shirts', href: '/boys?category=t-shirts' },
      { name: 'Shirts', href: '/boys?category=shirts' },
      { name: 'Polos', href: '/boys?category=polos' },
      { name: 'Shorts', href: '/boys?category=shorts' },
      { name: 'Trousers', href: '/boys?category=trousers' },
      { name: 'Sets', href: '/boys?category=sets' },
      { name: 'Sleepwear', href: '/boys?category=sleepwear' },
    ],
  },
  {
    title: 'NEWBORN',
    href: '/baby',
    subItems: [
      { name: 'Newborn Essentials', href: '/baby?category=essentials' },
      { name: 'Bodysuits', href: '/baby?category=bodysuits' },
      { name: 'Rompers', href: '/baby?category=rompers' },
      { name: 'Sleepsuits', href: '/baby?category=sleepsuits' },
      { name: 'Swaddles', href: '/baby?category=swaddles' },
      { name: 'Hats & Mittens', href: '/baby?category=hats-mittens' },
      { name: 'Newborn Gift Sets', href: '/baby?category=gift-sets' },
    ],
  },
  {
    title: 'BABY ESSENTIALS',
    href: '/categories/baby-clothing',
    subItems: [
      { name: 'Bodysuits', href: '/categories/bodysuits' },
      { name: 'Bibs', href: '/categories/bibs' },
      { name: 'Swaddles', href: '/categories/swaddles' },
      { name: 'Blankets', href: '/categories/blankets' },
      { name: 'Sleepsuits', href: '/categories/sleepsuits' },
      { name: 'Everyday Essentials', href: '/categories/everyday-essentials' },
    ],
  },
  {
    title: 'SPECIAL OCCASIONS',
    href: '/categories/special-occasions',
    subItems: [
      { name: 'Party Wear', href: '/categories/party-wear' },
      { name: 'Birthday Outfits', href: '/categories/birthday-outfits' },
      { name: 'Festive Wear', href: '/categories/festive-wear' },
      { name: 'Photo Shoot Outfits', href: '/categories/photo-shoot' },
      { name: 'Special Occasion Sets', href: '/categories/special-occasion-sets' },
    ],
  },
  {
    title: 'GIFTING',
    href: '/gifting',
    subItems: [
      { name: 'Baby Gift Sets', href: '/gifting?type=baby-gift-sets' },
      { name: 'Newborn Gifts', href: '/gifting?type=newborn-gifts' },
      { name: 'Baby Shower Gifts', href: '/gifting?type=baby-shower' },
      { name: 'Birthday Gifts', href: '/gifting?type=birthday-gifts' },
      { name: 'Gift Cards', href: '/gifting?type=gift-cards' },
    ],
  },
  {
    title: 'SHOP BY COLLECTION',
    href: '/collections',
    subItems: [
      { name: 'New Arrivals', href: '/new-in' },
      { name: 'Best Sellers', href: '/collections?filter=best-sellers' },
      { name: 'Everyday Collection', href: '/collections?filter=everyday' },
      { name: 'Premium Collection', href: '/collections?filter=premium' },
      { name: 'Sale', href: '/sale' },
    ],
  },
];

interface ShopDropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  align?: 'left' | 'right';
}

export function ShopDropdownMenu({ isOpen, onClose, align = 'left' }: ShopDropdownMenuProps) {
  const [activeHoverItem, setActiveHoverItem] = useState<MenuItem | null>(null);
  const isRightAligned = align === 'right';

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
          className={`absolute top-[calc(100%+6px)] ${
            isRightAligned ? 'right-0 left-auto flex-row-reverse' : 'left-0 right-auto flex-row'
          } z-[150] flex items-start select-none before:absolute before:-top-3 before:inset-x-0 before:h-3 before:content-[''] pointer-events-auto`}
        >
          {/* Main Solid Opaque Dark Dropdown Box */}
          <div
            className="w-[300px] rounded-[32px] border border-white/10 p-5 sm:p-6 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)] space-y-2 relative text-stone-100"
            style={{ backgroundColor: '#141414' }}
          >
            <div className="text-[10px] font-heading font-black tracking-[0.25em] uppercase text-white px-2.5 pb-2 border-b border-white/10 flex items-center justify-between">
              <span>SHOP COLLECTION</span>
              <span className="text-[8px] bg-white/10 text-amber-300 px-1.5 py-0.5 rounded font-extrabold border border-white/10">ATELIER</span>
            </div>
            <div className="pt-1 space-y-1">
              {SHOP_MENU_TREE.map((item, idx) => {
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
                      className={`flex items-center justify-between text-[12px] xl:text-[13px] font-heading font-extrabold tracking-wider uppercase transition-all duration-150 py-1.5 px-3 rounded-2xl ${
                        isHovered
                          ? 'text-white bg-white/15 shadow-sm'
                          : 'text-stone-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="truncate">{item.title}</span>
                      {hasSub && (
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform duration-150 shrink-0 ml-2 ${
                            isHovered ? 'text-amber-400 translate-x-1' : 'text-stone-400'
                          }`}
                        />
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sub-item Secondary Flyout Panel */}
          <AnimatePresence>
            {activeHoverItem && activeHoverItem.subItems && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className={`${
                  isRightAligned ? 'mr-3' : 'ml-3'
                } w-[270px] rounded-[32px] border border-white/10 p-5 sm:p-6 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)] space-y-2 z-[110] text-stone-100`}
                style={{ backgroundColor: '#141414' }}
              >
                <div className="text-[10px] font-heading font-black tracking-[0.25em] uppercase text-white border-b border-white/10 pb-2 mb-2 flex items-center justify-between">
                  <span className="truncate">{activeHoverItem.title}</span>
                  <span className="text-[8px] text-stone-400 uppercase font-bold">{activeHoverItem.subItems.length} items</span>
                </div>
                <div className="space-y-0.5 max-h-[70vh] overflow-y-auto pr-1">
                  {activeHoverItem.subItems.map((sub, i) => (
                    <Link
                      key={i}
                      href={sub.href}
                      onClick={onClose}
                      className="block text-[12px] font-medium tracking-wide text-stone-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all truncate"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
