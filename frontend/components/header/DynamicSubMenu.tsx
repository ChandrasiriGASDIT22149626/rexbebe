'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { NavSubGroup } from '../../types/admin';

interface DynamicSubMenuProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subGroups?: NavSubGroup[];
  align?: 'left' | 'right';
}

export function DynamicSubMenu({
  isOpen,
  onClose,
  title,
  subGroups,
  align = 'left',
}: DynamicSubMenuProps) {
  if (!subGroups || subGroups.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onMouseLeave={onClose}
          className={`absolute top-[calc(100%+8px)] ${
            align === 'right' ? 'right-0 left-auto' : 'left-0 right-auto'
          } z-[100] flex items-start select-none`}
        >
          <div
            className="min-w-[280px] max-w-[500px] rounded-[32px] border border-white/10 p-6 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)] relative text-stone-100"
            style={{ backgroundColor: '#141414' }}
          >
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-white border-b border-white/10 pb-2 mb-4 flex items-center justify-between">
              <span>{title}</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-amber-300 font-bold border border-white/10">Menu</span>
            </div>

            <div className={`grid ${subGroups.length > 1 ? 'grid-cols-2 gap-6' : 'grid-cols-1 gap-2'}`}>
              {subGroups.map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="text-[11px] font-heading font-black tracking-widest uppercase text-amber-300 px-2 pb-1 border-b border-white/10">
                    {group.title}
                  </div>
                  <div className="space-y-1">
                    {group.subItems.map((subItem) => (
                      <Link
                        key={subItem.id}
                        href={subItem.href}
                        onClick={onClose}
                        className="flex items-center justify-between text-[12px] font-extrabold tracking-wider uppercase text-stone-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all"
                      >
                        <span>{subItem.name}</span>
                        {subItem.badge && (
                          <span className="text-[8px] bg-[#C68A4C] text-white px-1.5 py-0.2 rounded font-bold">
                            {subItem.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
