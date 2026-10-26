'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { NavItemConfig } from '../../types/admin';
import { CategoryTreeNode } from '../../services/categoryService';

interface DynamicDropdownMenuProps {
  item: NavItemConfig;
  categoryNode?: CategoryTreeNode | null;
  isOpen: boolean;
  onClose: () => void;
  onMouseEnterMenu?: () => void;
  onMouseLeaveMenu?: () => void;
  align?: 'left' | 'right' | 'center';
}

export function DynamicDropdownMenu({
  item,
  categoryNode,
  isOpen,
  onClose,
  onMouseEnterMenu,
  onMouseLeaveMenu,
  align = 'left',
}: DynamicDropdownMenuProps) {
  const isBaby = item.name?.toUpperCase() === 'BABY' || item.slug === 'baby';
  const isToddler = item.name?.toUpperCase() === 'TODDLER' || item.slug === 'toddler';

  // Subcategories from categoryNode.children or pre-defined genuine subcategories
  const subCategories =
    categoryNode?.children && categoryNode.children.length > 0
      ? categoryNode.children.map((c) => ({
          id: c.id,
          name: c.name,
          href: c.href || `/shop/${c.slug}`,
        }))
      : isBaby
      ? [
          { id: 'cat-1792557187526-0diww5', name: '0–6 Months', href: '/shop/0-6-months' },
          { id: 'cat-1792557258002-3h3f33', name: '6–12 Months', href: '/shop/6-12-months' },
        ]
      : isToddler
      ? [
          { id: 'cat-1792557309838-hnx0zw', name: '12-18 months', href: '/shop/12-18-months' },
          { id: 'cat-1792557336208-96k1zz', name: '18-24 Months', href: '/shop/18-24-months' },
          { id: 'cat-1792557360998-u1t8v2', name: '24-36 Months', href: '/shop/24-36-months' },
          { id: 'cat-1792858682846-ak63fm', name: '6-10 Months', href: '/shop/6-10-months' },
        ]
      : [];

  const title = isBaby ? 'BABY COLLECTION' : isToddler ? 'TODDLER COLLECTION' : `${item.name} COLLECTION`;
  const viewAllHref = item.href || (isBaby ? '/shop/baby' : isToddler ? '/shop/toddler' : '/shop');

  const alignClass =
    align === 'right'
      ? 'right-0 left-auto'
      : align === 'center'
      ? 'left-1/2 -translate-x-1/2'
      : 'left-0 right-auto';

  return (
    <div
      onMouseEnter={onMouseEnterMenu}
      onMouseLeave={onMouseLeaveMenu || onClose}
      className={`nav-dropdown-menu absolute top-[calc(100%+6px)] ${alignClass} z-[200] select-none before:absolute before:-top-4 before:inset-x-0 before:h-4 before:content-[''] ${
        isOpen ? 'is-open' : ''
      }`}
      role="menu"
      aria-label={`${item.name} menu`}
    >
      <div
        className="w-[280px] sm:w-[320px] rounded-[24px] border border-white/10 p-5 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)] bg-[#141414] text-stone-100 space-y-3"
      >
        {/* Header with Title & View All */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] font-heading font-black tracking-widest uppercase text-amber-400 block">
              {title}
            </span>
            <span className="text-xs font-heading font-extrabold text-white">
              By Age Range
            </span>
          </div>
          <Link
            href={viewAllHref}
            onClick={onClose}
            className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-300 hover:text-white uppercase tracking-wider bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Subcategories List */}
        <ul className="space-y-1 pt-1">
          {subCategories.map((sub) => (
            <li key={sub.id}>
              <Link
                href={sub.href}
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-heading font-bold text-stone-300 hover:text-white hover:bg-white/10 transition-all group/item"
              >
                <span className="group-hover/item:translate-x-1 transition-transform">
                  {sub.name}
                </span>
                <span className="text-[10px] text-stone-500 group-hover/item:text-amber-400 transition-colors">
                  Shop &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Footer Accent */}
        <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-widest">
          <span className="flex items-center space-x-1 text-amber-400 font-extrabold">
            <Sparkles className="w-3 h-3" />
            <span>REXBEBE Atelier</span>
          </span>
          <span className="text-emerald-400 font-bold">100% Organic</span>
        </div>
      </div>
    </div>
  );
}
