'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, RefreshCw, Headset, Award, Sparkles, Heart } from 'lucide-react';
import { useAdminData } from '../../hooks/AdminContext';

const ICON_MAP: Record<string, any> = {
  Award,
  ShieldCheck,
  Truck,
  RefreshCw,
  Headset,
  Sparkles,
  Heart,
};

const DEFAULT_SERVICES = [
  {
    iconName: 'Award',
    title: 'PREMIUM QUALITY',
    subtitle: 'GOTS Organic Certified',
    color: 'text-pink-600 bg-pink-100/80 border-pink-200',
    active: true,
  },
  {
    iconName: 'ShieldCheck',
    title: 'SECURE PAYMENT',
    subtitle: '100% Encrypted & Safe',
    color: 'text-emerald-700 bg-emerald-100/80 border-emerald-200',
    active: true,
  },
  {
    iconName: 'Truck',
    title: 'ISLANDWIDE DELIVERY',
    subtitle: 'Express delivery in LK',
    color: 'text-sky-700 bg-sky-100/80 border-sky-200',
    active: true,
  },
  {
    iconName: 'RefreshCw',
    title: 'EASY RETURNS',
    subtitle: 'Hassle-free 14-day exchange',
    color: 'text-amber-700 bg-orange-100/80 border-orange-200',
    active: true,
  },
  {
    iconName: 'Headset',
    title: 'CUSTOMER SUPPORT',
    subtitle: 'Friendly 24/7 care',
    color: 'text-purple-700 bg-purple-100/80 border-purple-200',
    active: true,
  },
];

export function WhyRexbebe() {
  const { homepageConfig } = useAdminData();
  const rawItems = homepageConfig.whyRexbebe || DEFAULT_SERVICES;
  const items = rawItems.filter(i => i.active !== false);

  return (
    <section className="py-8 bg-user-pastel-header backdrop-blur-md border-y border-white/80 shadow-xs relative z-20">
      <div className="w-full max-w-full px-2 sm:px-4 lg:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {items.map((item, idx) => {
            const Icon = ICON_MAP[item.iconName] || Award;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-3 p-3.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/90 shadow-xs hover:shadow-md transition-all duration-300"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-inner ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-heading text-[11px] font-extrabold text-slate-900 tracking-wide uppercase truncate">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

