'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Heart,
  Baby,
  Shirt,
  Calendar,
  Gift,
  CheckCircle2,
} from 'lucide-react';
import { NavItemConfig } from '../../types/admin';

interface ShopMegaMenuProps {
  item: NavItemConfig;
  isOpen: boolean;
  onClose: () => void;
}

// Icon mapper for column headers
const COLUMN_ICONS: Record<string, string> = {
  'SHOP ALL': '🛍️',
  'BY AGE': '🍼',
  'SHOP BY AGE': '🍼',
  'BABY GIRLS': '🌸',
  'BABY BOYS': '🦕',
  'NEWBORN': '🧸',
  'BABY ESSENTIALS': '🤍',
  'NEWBORN & BABY ESSENTIALS': '🧸',
  'NURSERY & TOYS': '✨',
  'SPECIAL OCCASIONS': '👑',
  'GIFTING': '🎁',
  'SHOP BY COLLECTION': '✨',
};

export function ShopMegaMenu({ item, isOpen, onClose }: ShopMegaMenuProps) {
  const subGroups = item.subGroups || [];

  if (!isOpen || subGroups.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.985 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed left-1/2 -translate-x-1/2 top-[calc(100%+8px)] z-50 select-none w-[94vw] max-w-[1240px]"
          role="menu"
          aria-label="Shop Mega Menu"
        >
          {/* Main Solid Warm-White / Soft-Cream Mega Menu Panel */}
          <div className="bg-[#FAF9F5]/98 dark:bg-stone-900/98 backdrop-blur-2xl rounded-[32px] border border-amber-200/70 dark:border-stone-700 p-6 sm:p-8 lg:p-9 shadow-[0_25px_70px_-15px_rgba(40,20,10,0.18)] text-stone-900 dark:text-stone-100 max-h-[85vh] overflow-y-auto">
            
            {/* SECTION 2: PROFESSIONAL MENU HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 mb-6 border-b border-stone-200/80 dark:border-stone-800">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-stone-800 flex items-center justify-center text-amber-800 dark:text-amber-400">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-heading font-black text-sm sm:text-base tracking-widest uppercase text-stone-900 dark:text-white">
                      SHOP ALL
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-stone-800 text-amber-900 dark:text-amber-300">
                      Boutique Catalogue
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 font-medium italic mt-0.5">
                    Explore our little world of baby clothing and everyday essentials.
                  </p>
                </div>
              </div>

              <Link
                href="/shop"
                onClick={onClose}
                className="inline-flex items-center space-x-1.5 text-xs font-black tracking-wider uppercase text-amber-900 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors group shrink-0 self-start sm:self-center"
              >
                <span>VIEW ALL PRODUCTS</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-150" />
              </Link>
            </div>

            {/* SECTION 1, 3, 5: SPACIOUS CATEGORY COLUMNS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8">
              {subGroups.map((group) => {
                const subItems = group.subItems || [];
                const icon = COLUMN_ICONS[group.title] || '🌸';

                return (
                  <div key={group.id} className="space-y-3 min-w-0">
                    {/* Column Heading */}
                    <div className="pb-2 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between">
                      <Link
                        href={group.href || '/shop'}
                        onClick={onClose}
                        className="font-heading font-black text-[12px] sm:text-[13px] tracking-wider uppercase text-stone-900 dark:text-white hover:text-amber-800 dark:hover:text-amber-400 transition-colors flex items-center space-x-1.5 truncate"
                      >
                        <span className="text-sm shrink-0">{icon}</span>
                        <span className="truncate">{group.title}</span>
                      </Link>
                    </div>

                    {/* Submenu Item Links: Clean, spacious, single-line scanning */}
                    <ul className="space-y-2">
                      {subItems.map((subItem) => {
                        const isExternal =
                          subItem.destinationType === 'EXTERNAL_URL' ||
                          subItem.href.startsWith('http');

                        return (
                          <li key={subItem.id}>
                            <Link
                              href={subItem.href}
                              target={isExternal && subItem.openInNewTab ? '_blank' : undefined}
                              rel={isExternal && subItem.openInNewTab ? 'noopener noreferrer' : undefined}
                              onClick={onClose}
                              className="group flex items-center justify-between text-[12px] sm:text-[13px] font-semibold text-stone-700 dark:text-stone-300 hover:text-amber-950 dark:hover:text-white transition-all duration-150 py-0.5 rounded-md"
                            >
                              <span className="truncate group-hover:translate-x-1 group-hover:text-amber-900 dark:group-hover:text-amber-300 transition-all duration-150">
                                {subItem.name}
                              </span>

                              {subItem.badge ? (
                                <span className="text-[8px] bg-[#C68A4C] text-white px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider shrink-0 ml-1.5">
                                  {subItem.badge}
                                </span>
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1.5" />
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}

              {/* SECTION 6: FEATURED ATELIER PROMOTION CARD (Large Screen Only) */}
              <div className="hidden xl:flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-pink-50/60 to-purple-50/60 dark:from-stone-800 dark:to-stone-800/60 border border-amber-200/60 dark:border-stone-700 shadow-2xs">
                <div className="space-y-3">
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden shadow-xs border border-white/80 dark:border-stone-600">
                    <Image
                      src="/images/products/baby-girl-fashion.jpg"
                      alt="Featured Atelier Edit"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-amber-900 dark:text-amber-300 border border-amber-200/60">
                      ATELIER EDIT ✨
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-heading font-black text-xs uppercase tracking-wide text-stone-900 dark:text-white">
                      Spring Capsule
                    </h4>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-snug line-clamp-2">
                      Handcrafted Mongolian cashmere and French flax linen twirls.
                    </p>
                  </div>
                </div>

                <Link
                  href="/new-in"
                  onClick={onClose}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 font-bold text-[11px] uppercase tracking-wider flex items-center justify-center space-x-1 hover:bg-stone-800 transition-colors shadow-2xs"
                >
                  <span>Explore New In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

            {/* BOTTOM TRUST VALUES ACCENT BAR */}
            <div className="mt-8 pt-4 border-t border-stone-200/80 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              <div className="flex items-center space-x-1.5 text-emerald-800 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% GOTS Certified Organic Cotton</span>
              </div>
              <div className="flex items-center space-x-1.5 text-amber-800 dark:text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hypoallergenic Flatlock Seams</span>
              </div>
              <div className="flex items-center space-x-1.5 text-purple-800 dark:text-purple-400">
                <Heart className="w-3.5 h-3.5" />
                <span>Hassle-Free 14-Day Exchanges</span>
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
