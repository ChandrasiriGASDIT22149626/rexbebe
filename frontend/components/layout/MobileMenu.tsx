'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, ChevronDown, ArrowRight, Search, Heart, ShoppingBag, Sun, Moon } from 'lucide-react';
import { useAdminData } from '../../hooks/AdminContext';
import { useWishlist } from '../../hooks/useWishlist';
import { useCart } from '../../hooks/useCart';
import { useTheme } from '../../hooks/useTheme';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch?: () => void;
}

export function MobileMenu({ isOpen, onClose, onOpenSearch }: MobileMenuProps) {
  const { navigationConfig } = useAdminData();
  const { wishlistCount } = useWishlist();
  const { itemCount, openCart } = useCart();
  const { isDarkMode, toggleTheme, mounted } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNavId, setExpandedNavId] = useState<string | null>(null);
  const [expandedSubGroupId, setExpandedSubGroupId] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
    }
  };

  // Strictly and only the 7 navigation items in this exact order:
  // 1. HOME
  // 2. ABOUT US
  // 3. BABY — dropdown menu
  // 4. TODDLER — dropdown menu
  // 5. PRE-SCHOOL
  // 6. MILD CHILDHOOD
  // 7. CONTACT US
  const mobileNavItems = useMemo(() => {
    const rawItems = navigationConfig?.items || [];

    const homeItem = rawItems.find(
      (i) => i.id === 'nav-home' || i.slug === 'home' || i.name?.toUpperCase() === 'HOME'
    );

    const aboutItem = rawItems.find(
      (i) => i.id === 'nav-about' || i.slug === 'about-us' || i.name?.toUpperCase() === 'ABOUT US'
    );

    const babyItem = rawItems.find(
      (i) => i.id === 'cat-1792556617917-72c7r7' || i.slug === 'baby' || i.name?.toUpperCase() === 'BABY'
    );

    const toddlerItem = rawItems.find(
      (i) => i.id === 'cat-1792557286988-6ozkat' || i.slug === 'toddler' || i.name?.toUpperCase() === 'TODDLER'
    );

    const preSchoolItem = rawItems.find(
      (i) => i.id === 'cat-1792557393548-4ibray' || i.slug === 'pre-school' || i.name?.toUpperCase() === 'PRE-SCHOOL'
    );

    const mildChildhoodItem = rawItems.find(
      (i) => i.id === 'cat-1792557421459-sapv4x' || i.slug === 'mild-childhood' || i.name?.toUpperCase() === 'MILD CHILDHOOD'
    );

    const contactItem = rawItems.find(
      (i) => i.id === 'nav-contact' || i.slug === 'contact-us' || i.name?.toUpperCase() === 'CONTACT US'
    );

    return [
      {
        id: homeItem?.id || 'nav-home',
        name: 'HOME',
        slug: 'home',
        href: '/',
        order: 1,
        isActive: true,
        status: 'published',
      },
      {
        id: aboutItem?.id || 'nav-about',
        name: 'ABOUT US',
        slug: 'about-us',
        href: aboutItem?.href || '/about',
        order: 2,
        isActive: true,
        status: 'published',
      },
      {
        id: babyItem?.id || 'cat-1792556617917-72c7r7',
        name: 'BABY',
        slug: babyItem?.slug || 'baby',
        href: babyItem?.href || '/shop/baby',
        order: 3,
        isActive: true,
        status: 'published',
        subGroups: babyItem?.subGroups || [
          {
            id: 'grp-baby-collection',
            title: 'BABY COLLECTION',
            slug: 'baby',
            href: '/shop/baby',
            subItems: [
              { id: 'cat-1792557187526-0diww5', name: '0–6 Months', slug: '0-6-months', href: '/shop/0-6-months' },
              { id: 'cat-1792557258002-3h3f33', name: '6–12 Months', slug: '6-12-months', href: '/shop/6-12-months' },
            ],
          },
        ],
      },
      {
        id: toddlerItem?.id || 'cat-1792557286988-6ozkat',
        name: 'TODDLER',
        slug: toddlerItem?.slug || 'toddler',
        href: toddlerItem?.href || '/shop/toddler',
        order: 4,
        isActive: true,
        status: 'published',
        subGroups: toddlerItem?.subGroups || [
          {
            id: 'grp-toddler-collection',
            title: 'TODDLER COLLECTION',
            slug: 'toddler',
            href: '/shop/toddler',
            subItems: [
              { id: 'cat-1792557309838-hnx0zw', name: '12-18 months', slug: '12-18-months', href: '/shop/12-18-months' },
              { id: 'cat-1792557336208-96k1zz', name: '18-24 Months', slug: '18-24-months', href: '/shop/18-24-months' },
              { id: 'cat-1792557360998-u1t8v2', name: '24-36 Months', slug: '24-36-months', href: '/shop/24-36-months' },
            ],
          },
        ],
      },
      {
        id: preSchoolItem?.id || 'cat-1792557393548-4ibray',
        name: 'PRE-SCHOOL',
        slug: preSchoolItem?.slug || 'pre-school',
        href: preSchoolItem?.href || '/shop/pre-school',
        order: 5,
        isActive: true,
        status: 'published',
      },
      {
        id: mildChildhoodItem?.id || 'cat-1792557421459-sapv4x',
        name: 'MILD CHILDHOOD',
        slug: mildChildhoodItem?.slug || 'mild-childhood',
        href: mildChildhoodItem?.href || '/shop/mild-childhood',
        order: 6,
        isActive: true,
        status: 'published',
      },
      {
        id: contactItem?.id || 'nav-contact',
        name: 'CONTACT US',
        slug: 'contact-us',
        href: contactItem?.href || '/contact',
        order: 7,
        isActive: true,
        status: 'published',
      },
    ];
  }, [navigationConfig?.items]);

  // Lock body scroll and listen for Escape key when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Drawer menu */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            className="absolute left-0 top-0 bottom-0 w-[85%] max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xl flex flex-col justify-between border-r border-stone-200 dark:border-slate-800 z-10"
          >
            {/* Header inside drawer */}
            <div className="p-4 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between bg-stone-50/70 dark:bg-slate-800/60 flex-shrink-0">
              <Link href="/" onClick={onClose} aria-label="REXBEBE Home" className="block">
                <Image
                  src="/images/logo.png"
                  alt="REXBEBE"
                  width={240}
                  height={120}
                  className="w-28 sm:w-32 h-auto object-contain dark:brightness-110"
                />
              </Link>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-100 rounded-full hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded Search Bar for Mobile */}
            <div className="p-3 border-b border-stone-100 dark:border-slate-800 bg-stone-50/40 dark:bg-slate-800/40">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="w-4 h-4 text-purple-500 dark:text-purple-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dresses, rompers..."
                  className="w-full bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 pl-9 pr-8 py-2 rounded-xl focus:outline-none focus:border-purple-500 transition-colors shadow-2xs"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="absolute right-2 text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider"
                  >
                    GO
                  </button>
                )}
              </form>
            </div>

            {/* Quick Action Badges (Wishlist & Cart) */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-purple-50/30 dark:bg-slate-800/30 border-b border-stone-100 dark:border-slate-800">
              <Link
                href="/wishlist"
                onClick={onClose}
                className="flex items-center justify-center space-x-2 py-2 px-3 bg-white dark:bg-slate-800 rounded-xl border border-pink-100 dark:border-slate-700 shadow-2xs text-xs font-bold text-slate-800 dark:text-slate-200 active:scale-95 transition-all"
              >
                <Heart className={`w-3.5 h-3.5 ${wishlistCount > 0 ? 'fill-pink-500 text-pink-500' : 'text-slate-500'}`} />
                <span>Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="w-4 h-4 bg-pink-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => {
                  onClose();
                  openCart();
                }}
                className="flex items-center justify-center space-x-2 py-2 px-3 bg-white dark:bg-slate-800 rounded-xl border border-sky-100 dark:border-slate-700 shadow-2xs text-xs font-bold text-slate-800 dark:text-slate-200 active:scale-95 transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Bag</span>
                {itemCount > 0 && (
                  <span className="w-4 h-4 bg-sky-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Scrollable Dynamic Navigation Area - Strictly the 7 items */}
            <div className="flex-1 overflow-y-auto touch-scroll p-4 space-y-1.5 text-xs font-semibold tracking-wider uppercase text-stone-800 dark:text-slate-200">
              {mobileNavItems.map((item) => {
                const hasSub = (item.name === 'BABY' || item.name === 'TODDLER') && Boolean(item.subGroups && item.subGroups.length > 0);
                const isExpanded = expandedNavId === item.id;
                const isItemActive = item.href === '/' ? pathname === '/' : pathname === item.href;

                if (!hasSub) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href || '#'}
                      onClick={onClose}
                      className={`flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-xl transition-colors font-bold ${
                        isItemActive
                          ? 'bg-[#181818] text-white shadow-sm'
                          : 'hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-amber-900 text-stone-800 dark:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                }

                return (
                  <div key={item.id} className="space-y-0.5">
                    <button
                      onClick={() => setExpandedNavId(isExpanded ? null : item.id)}
                      className="w-full flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-amber-900 transition-colors text-left font-extrabold text-stone-900 dark:text-stone-100"
                      aria-expanded={isExpanded}
                    >
                      <span className="truncate">{item.name}</span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-stone-400 dark:text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-amber-700 dark:text-amber-400' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pl-3 space-y-1 py-1 border-l-2 border-amber-300 dark:border-amber-700 ml-3"
                        >
                          {item.href && item.href !== '#' && (
                            <Link
                              href={item.href}
                              onClick={onClose}
                              className="px-3 py-2 text-[11px] font-bold tracking-wider text-amber-950 dark:text-amber-300 hover:text-amber-700 transition-colors bg-amber-50/70 dark:bg-amber-950/40 rounded-lg min-h-[38px] flex items-center justify-between"
                            >
                              <span>VIEW ALL {item.name}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
                            </Link>
                          )}

                          {item.subGroups?.map((group: any) => {
                            const isGroupExpanded = expandedSubGroupId === group.id;
                            const hasSubItems = Boolean(group.subItems && group.subItems.length > 0);

                            if (!hasSubItems) {
                              return (
                                <Link
                                  key={group.id}
                                  href={group.href || item.href}
                                  onClick={onClose}
                                  className="block px-3 py-2 text-[11px] font-bold text-stone-800 dark:text-slate-200 hover:text-amber-800 min-h-[38px] flex items-center"
                                >
                                  {group.title}
                                </Link>
                              );
                            }

                            return (
                              <div key={group.id} className="space-y-0.5">
                                <button
                                  onClick={() => setExpandedSubGroupId(isGroupExpanded ? null : group.id)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-stone-700 dark:text-slate-300 hover:text-amber-800 dark:hover:text-amber-400 transition-colors text-left min-h-[38px]"
                                >
                                  <span>{group.title}</span>
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                                      isGroupExpanded ? 'rotate-180 text-amber-700' : ''
                                    }`}
                                  />
                                </button>

                                <AnimatePresence>
                                  {isGroupExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden pl-3 space-y-1 border-l border-stone-200 dark:border-slate-700 ml-2 py-1"
                                    >
                                      {group.subItems?.map((sub: any) => (
                                        <Link
                                          key={sub.id}
                                          href={sub.href}
                                          onClick={onClose}
                                          className="block px-2.5 py-1.5 text-[11px] font-medium tracking-normal text-stone-600 dark:text-slate-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors min-h-[36px] flex items-center justify-between"
                                        >
                                          <span>{sub.name}</span>
                                        </Link>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Bottom Dark/Light Mode Switch & Footer Link */}
            <div className="p-4 border-t border-stone-100 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-800/60 flex-shrink-0 space-y-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs font-bold text-stone-800 dark:text-slate-100 shadow-2xs active:scale-98 transition-all"
              >
                <div className="flex items-center space-x-2">
                  {!mounted ? (
                    <span className="w-4 h-4 block" aria-hidden="true" />
                  ) : isDarkMode ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                  )}
                  <span>{!mounted ? 'Theme' : isDarkMode ? 'Light Mode ☀️' : 'Dark Mode 🌙'}</span>
                </div>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-slate-300">
                  {!mounted ? '...' : isDarkMode ? 'Active: Dark' : 'Active: Light'}
                </span>
              </button>

              <div className="text-[10px] text-center text-stone-400 dark:text-slate-500">
                REXBEBE Boutique Atelier — Sri Lanka
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
