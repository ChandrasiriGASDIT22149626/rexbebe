'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Tag, Gift, Heart, Compass, Baby, Shirt, Award } from 'lucide-react';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory?: string;
}

export const SHOP_TAXONOMY = [
  {
    title: 'BY AGE',
    icon: Compass,
    items: [
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
    icon: Shirt,
    items: [
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
    icon: Shirt,
    items: [
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
    icon: Baby,
    items: [
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
    icon: Heart,
    items: [
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
    icon: Sparkles,
    items: [
      { name: 'Party Wear', href: '/categories/party-wear' },
      { name: 'Birthday Outfits', href: '/categories/birthday-outfits' },
      { name: 'Festive Wear', href: '/categories/festive-wear' },
      { name: 'Photo Shoot Outfits', href: '/categories/photo-shoot' },
      { name: 'Special Occasion Sets', href: '/categories/special-occasion-sets' },
    ],
  },
  {
    title: 'GIFTING',
    icon: Gift,
    items: [
      { name: 'Baby Gift Sets', href: '/gifting?type=baby-gift-sets' },
      { name: 'Newborn Gifts', href: '/gifting?type=newborn-gifts' },
      { name: 'Baby Shower Gifts', href: '/gifting?type=baby-shower' },
      { name: 'Birthday Gifts', href: '/gifting?type=birthday-gifts' },
      { name: 'Gift Cards', href: '/gifting?type=gift-cards' },
    ],
  },
  {
    title: 'SHOP BY COLLECTION',
    icon: Award,
    items: [
      { name: 'New Arrivals', href: '/new-in' },
      { name: 'Best Sellers', href: '/collections?filter=best-sellers' },
      { name: 'Everyday Collection', href: '/collections?filter=everyday' },
      { name: 'Premium Collection', href: '/collections?filter=premium' },
      { name: 'Sale', href: '/sale' },
    ],
  },
];

export function MegaMenu({ isOpen, onClose }: MegaMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onMouseLeave={onClose}
          className="absolute top-full left-0 w-full bg-white/98 backdrop-blur-2xl border-b border-stone-200/80 shadow-2xl z-50 text-stone-800"
        >
          {/* Top Quick Access Bar */}
          <div className="bg-stone-900 text-white px-6 lg:px-8 py-3.5 border-b border-stone-800">
            <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
              <Link
                href="/shop"
                onClick={onClose}
                className="flex items-center gap-2 text-amber-300 hover:text-white transition-colors group font-extrabold"
              >
                <span>SHOP ALL PRODUCTS</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center space-x-6 text-[11px] font-medium text-stone-300">
                <span className="flex items-center gap-1 text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" /> Premium Artisan Quality
                </span>
                <span className="hidden sm:inline">Free Shipping Available</span>
                <Link href="/sale" onClick={onClose} className="text-rose-400 font-bold hover:underline">
                  Special Sale Up to 30% Off
                </Link>
              </div>
            </div>
          </div>

          {/* Main Category Columns Grid */}
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
            <div className="grid grid-cols-4 gap-x-8 gap-y-8">
              {SHOP_TAXONOMY.map((group, idx) => {
                const IconComponent = group.icon;
                return (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2">
                      <IconComponent className="w-4 h-4 text-amber-700" />
                      <h3 className="text-[12px] font-bold tracking-wider uppercase text-stone-900">
                        {group.title}
                      </h3>
                    </div>
                    <ul className="space-y-1.5">
                      {group.items.map((item, i) => (
                        <li key={i}>
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className="text-[12px] text-stone-600 hover:text-amber-800 hover:font-medium transition-all flex items-center justify-between group py-0.5"
                          >
                            <span className="group-hover:translate-x-1 transition-transform duration-150">
                              {item.name}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

