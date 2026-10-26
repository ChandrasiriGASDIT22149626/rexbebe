'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { DynamicDropdownMenu } from './DynamicDropdownMenu';
import { useAdminData } from '../../hooks/AdminContext';
import { categoryService, CategoryTreeNode } from '../../services/categoryService';

interface MainNavigationProps {
  onHoverShop?: (isHovering: boolean) => void;
  isShopMegaMenuOpen?: boolean;
}

const INITIAL_CATEGORY_TREE: CategoryTreeNode[] = [
  {
    id: 'cat-1792556617917-72c7r7',
    name: 'BABY',
    slug: 'baby',
    href: '/shop/baby',
    status: 'published',
    isActive: true,
    depth: 0,
    children: [
      {
        id: 'cat-1792557187526-0diww5',
        name: '0–6 Months',
        slug: '0-6-months',
        href: '/shop/0-6-months',
        status: 'published',
        isActive: true,
        depth: 1,
        children: [],
      },
      {
        id: 'cat-1792557258002-3h3f33',
        name: '6–12 Months',
        slug: '6-12-months',
        href: '/shop/6-12-months',
        status: 'published',
        isActive: true,
        depth: 1,
        children: [],
      },
    ],
  },
  {
    id: 'cat-1792557286988-6ozkat',
    name: 'TODDLER',
    slug: 'toddler',
    href: '/shop/toddler',
    status: 'published',
    isActive: true,
    depth: 0,
    children: [
      {
        id: 'cat-1792557309838-hnx0zw',
        name: '12-18 months',
        slug: '12-18-months',
        href: '/shop/12-18-months',
        status: 'published',
        isActive: true,
        depth: 1,
        children: [],
      },
      {
        id: 'cat-1792557336208-96k1zz',
        name: '18-24 Months',
        slug: '18-24-months',
        href: '/shop/18-24-months',
        status: 'published',
        isActive: true,
        depth: 1,
        children: [],
      },
      {
        id: 'cat-1792557360998-u1t8v2',
        name: '24-36 Months',
        slug: '24-36-months',
        href: '/shop/24-36-months',
        status: 'published',
        isActive: true,
        depth: 1,
        children: [],
      },
      {
        id: 'cat-1792858682846-ak63fm',
        name: '6-10 Months',
        slug: '6-10-months',
        href: '/shop/6-10-months',
        status: 'published',
        isActive: true,
        depth: 1,
        children: [],
      },
    ],
  },
];

export function MainNavigation({ onHoverShop }: MainNavigationProps) {
  const pathname = usePathname();
  const { navigationConfig } = useAdminData();
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>(INITIAL_CATEGORY_TREE);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch published category tree for dynamic dropdown data
  useEffect(() => {
    let mounted = true;
    categoryService
      .getCategoryTree(undefined, true)
      .then((res: any) => {
        const tree = Array.isArray(res) ? res : (res?.data || []);
        if (mounted && Array.isArray(tree) && tree.length > 0) {
          setCategoryTree(tree);
        }
      })
      .catch((err) => console.warn('[MainNavigation] Error loading category tree:', err));
    return () => {
      mounted = false;
    };
  }, []);

  // Close any open dropdown on route change
  useEffect(() => {
    setActiveDropdownId(null);
    if (onHoverShop) onHoverShop(false);
  }, [pathname, onHoverShop]);

  // Click outside and Escape key handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        navContainerRef.current &&
        !navContainerRef.current.contains(event.target as Node)
      ) {
        setActiveDropdownId(null);
        if (onHoverShop) onHoverShop(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveDropdownId(null);
        if (onHoverShop) onHoverShop(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onHoverShop]);

  // Strictly and only the 7 navigation items in this exact order:
  // 1. HOME
  // 2. ABOUT US
  // 3. BABY — dropdown menu
  // 4. TODDLER — dropdown menu
  // 5. PRE-SCHOOL
  // 6. MILD CHILDHOOD
  // 7. CONTACT US
  const activeNavItems = useMemo(() => {
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
              { id: 'cat-1792858682846-ak63fm', name: '6-10 Months', slug: '6-10-months', href: '/shop/6-10-months' },
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

  const handleMouseEnterItem = (itemId: string, hasDropdown: boolean) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    if (hasDropdown) {
      setActiveDropdownId(itemId);
      if (onHoverShop) onHoverShop(true);
    } else {
      setActiveDropdownId(null);
      if (onHoverShop) onHoverShop(false);
    }
  };

  const handleMouseEnterMenu = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  };

  const handleMouseLeaveItem = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    leaveTimeoutRef.current = setTimeout(() => {
      setActiveDropdownId(null);
      if (onHoverShop) onHoverShop(false);
    }, 280);
  };

  const handleItemClick = (e: React.MouseEvent, item: any, hasDropdown: boolean) => {
    if (hasDropdown) {
      if (activeDropdownId !== item.id) {
        e.preventDefault();
        e.stopPropagation();
        setActiveDropdownId(item.id);
        if (onHoverShop) onHoverShop(true);
      }
    }
  };

  return (
    <nav className="hidden lg:flex items-center min-w-0 flex-shrink-0" ref={navContainerRef}>
      {/* Outer Floating Rounded Capsule Track matching reference screenshot */}
      <div
        className="bg-[#f0ece5]/90 dark:bg-slate-900/90 backdrop-blur-md p-1 xl:p-1.5 rounded-full border border-white/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)] flex items-center space-x-0.5 xl:space-x-1 relative"
        onMouseLeave={handleMouseLeaveItem}
      >
        {activeNavItems.map((item, index) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || (item.href && item.href !== '#' && pathname.startsWith(item.href));

          const hasDropdown = item.name === 'BABY' || item.name === 'TODDLER';

          const categoryNode = hasDropdown
            ? categoryTree.find(
                (c) =>
                  c.id === item.id ||
                  (c.slug && item.slug && c.slug.toLowerCase() === item.slug.toLowerCase()) ||
                  (c.name && item.name && c.name.toLowerCase() === item.name.toLowerCase()) ||
                  (c.slug && item.href && (item.href === `/shop/${c.slug}` || item.href === `/category/${c.slug}`))
              )
            : null;

          const isDropdownOpen = activeDropdownId === item.id;
          const isHighlighted = isActive || isDropdownOpen;
          const align: 'left' | 'right' = index >= 4 ? 'right' : 'left';

          return (
            <div
              key={item.id || item.slug || item.name}
              className="relative group nav-dropdown-container"
              onMouseEnter={() => handleMouseEnterItem(item.id, hasDropdown)}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <Link
                  href={item.href || '#'}
                  onClick={(e) => handleItemClick(e, item, hasDropdown)}
                  onMouseEnter={() => handleMouseEnterItem(item.id, hasDropdown)}
                  className={`flex items-center space-x-1 xl:space-x-1.5 px-3 py-1.5 xl:px-4 xl:py-2 rounded-full transition-all duration-200 text-[11px] xl:text-xs 2xl:text-[13px] font-heading font-extrabold tracking-tight xl:tracking-wide uppercase select-none ${
                    isHighlighted
                      ? 'bg-[#181818] text-white shadow-md'
                      : 'text-stone-800 dark:text-slate-200 hover:text-amber-900 dark:hover:text-amber-300 hover:bg-white/60 dark:hover:bg-slate-800/80'
                  }`}
                  aria-expanded={hasDropdown ? isDropdownOpen : undefined}
                  aria-haspopup={hasDropdown ? 'true' : undefined}
                >
                  <span className="whitespace-nowrap">{item.name}</span>

                  {hasDropdown && (
                    <ChevronDown
                      className={`w-3 h-3 xl:w-3.5 xl:h-3.5 transition-transform duration-200 ${
                        isHighlighted ? 'text-white rotate-180' : 'text-stone-500'
                      }`}
                    />
                  )}
                </Link>
              </motion.div>

              {/* Functional Dynamic Dropdown Menu for BABY & TODDLER */}
              {hasDropdown && (
                <DynamicDropdownMenu
                  item={item as any}
                  categoryNode={categoryNode}
                  isOpen={isDropdownOpen}
                  onClose={() => {
                    setActiveDropdownId(null);
                    if (onHoverShop) onHoverShop(false);
                  }}
                  onMouseEnterMenu={handleMouseEnterMenu}
                  onMouseLeaveMenu={handleMouseLeaveItem}
                  align={align}
                />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
