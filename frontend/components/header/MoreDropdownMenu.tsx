'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles, FolderTree } from 'lucide-react';
import { NavItemConfig } from '../../types/admin';
import { CategoryTreeNode } from '../../services/categoryService';

interface MoreDropdownMenuProps {
  items: NavItemConfig[];
  categoryTree: CategoryTreeNode[];
  isOpen: boolean;
  onClose: () => void;
  onMouseEnterMenu?: () => void;
  onMouseLeaveMenu?: () => void;
}

export function MoreDropdownMenu({
  items,
  categoryTree,
  isOpen,
  onClose,
  onMouseEnterMenu,
  onMouseLeaveMenu,
}: MoreDropdownMenuProps) {
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  if (!isOpen || items.length === 0) return null;

  // Filter only explicit test runner mock fixtures
  const isTestRecord = (item: { name?: string; slug?: string; id?: string }) => {
    const id = (item.id || '').toUpperCase();
    return (
      id.startsWith('MOCK-') ||
      id.startsWith('TEST-MOCK-') ||
      id.startsWith('E2E-DUMMY-') ||
      id.includes('CAT-HIVE-TEST')
    );
  };

  const handleMouseEnterItem = (itemId: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setHoveredItemId(itemId);
  };

  const handleMouseLeaveItem = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredItemId(null);
    }, 150);
  };

  const handleMouseEnterSubmenu = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={onMouseEnterMenu}
        onMouseLeave={onMouseLeaveMenu || onClose}
        className="absolute top-[calc(100%+6px)] right-0 z-[150] select-none before:absolute before:-top-3 before:inset-x-0 before:h-3 before:content-[''] pointer-events-auto"
      >
        {/* Main Panel: Primary Overflow Categories */}
        <div
          className="w-72 sm:w-80 p-5 space-y-3 relative text-stone-100 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)] rounded-[28px] border border-white/10"
          style={{ backgroundColor: '#141414' }}
        >
          {/* Header Row */}
          <div className="text-[10px] font-heading font-black tracking-[0.25em] uppercase text-white px-2 pb-2 border-b border-white/10 flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-amber-300">
              <FolderTree className="w-3.5 h-3.5" />
              <span>More Categories</span>
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-stone-300 font-bold border border-white/10">
              {items.length} items
            </span>
          </div>

          {/* List of Overflow Categories */}
          <ul className="space-y-1">
            {items.map((item) => {
              const node = categoryTree.find(
                (c) =>
                  c.id === item.id ||
                  (c.slug && item.slug && c.slug.toLowerCase() === item.slug.toLowerCase()) ||
                  (c.name && item.name && c.name.toLowerCase() === item.name.toLowerCase())
              );

              // Find direct subcategories
              const subcategories = (node?.children || []).filter(
                (c) => c.status !== 'draft' && c.status !== 'unpublished' && !isTestRecord(c)
              );

              // Fallback to legacy subGroups if any
              const legacySubItems = (item.subGroups || []).flatMap((g) =>
                (g.subItems || []).filter(
                  (s) => s.isActive !== false && s.status !== 'draft' && s.status !== 'unpublished' && !isTestRecord(s)
                )
              );

              const childItems = subcategories.length > 0 ? subcategories : legacySubItems;
              const hasKids = childItems.length > 0;
              const isHovered = hoveredItemId === item.id;

              return (
                <li
                  key={item.id}
                  onMouseEnter={() => handleMouseEnterItem(item.id)}
                  onMouseLeave={handleMouseLeaveItem}
                  className="relative"
                >
                  <Link
                    href={item.href || `/shop/${item.slug}`}
                    onClick={onClose}
                    onFocus={() => handleMouseEnterItem(item.id)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[12px] font-bold tracking-wider uppercase transition-all group ${
                      isHovered
                        ? 'bg-white/15 text-white shadow-xs'
                        : 'text-stone-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span className="text-[8px] bg-[#C68A4C] text-white px-1.5 py-0.2 rounded-md font-bold uppercase tracking-widest shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {hasKids && (
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isHovered ? 'text-amber-400 translate-x-0.5' : 'text-stone-500'
                        }`}
                      />
                    )}
                  </Link>

                  {/* Submenu Panel: Opens Directly Beside The Hovered Parent Category */}
                  {hasKids && isHovered && (
                    <div
                      onMouseEnter={handleMouseEnterSubmenu}
                      onMouseLeave={handleMouseLeaveItem}
                      className="absolute right-full top-0 mr-2 z-30 w-64 sm:w-72 rounded-[22px] border border-white/10 bg-[#161616] p-4 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.85)] before:absolute before:-right-4 before:inset-y-0 before:w-5 before:content-[''] pointer-events-auto animate-in fade-in slide-in-from-right-2 duration-150"
                    >
                      {/* Submenu Header */}
                      <div className="text-[10px] font-heading font-black tracking-[0.2em] uppercase text-amber-300 px-2 pb-2 border-b border-white/10 flex items-center justify-between mb-2">
                        <span className="truncate">{item.name}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-stone-300 font-bold border border-white/10">
                          {childItems.length} {childItems.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      {/* Content-adaptive Subcategory List */}
                      <ul className="space-y-1 max-h-[340px] overflow-y-auto pr-1">
                        {childItems.map((child: any) => (
                          <li key={child.id}>
                            <Link
                              href={child.href || `/shop/${child.slug}`}
                              onClick={onClose}
                              className="flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-bold text-stone-300 hover:text-white hover:bg-white/10 transition-all group"
                            >
                              <span className="truncate group-hover:text-amber-200 transition-colors">
                                {child.name}
                              </span>
                              {child.badge && (
                                <span className="text-[8px] bg-[#C68A4C] text-white px-1.5 py-0.2 rounded-md font-bold uppercase shrink-0 ml-1">
                                  {child.badge}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Bottom Accent */}
          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2">
            <span className="flex items-center space-x-1 text-amber-400 font-extrabold">
              <Sparkles className="w-3 h-3" />
              <span>REXBEBE Boutique</span>
            </span>
            <span className="text-emerald-400 font-bold">100% Curated</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
