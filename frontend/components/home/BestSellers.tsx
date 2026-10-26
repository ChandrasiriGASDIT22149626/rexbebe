'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ProductCard } from '../products/ProductCard';
import { useAdminData } from '../../hooks/AdminContext';

export function BestSellers() {
  const { products, homepageConfig } = useAdminData();
  const bsConfig = homepageConfig.bestSellers;
  const bestSellerList = products.filter(p => p.isBestSeller);
  const featuredFavorites = (bestSellerList.length > 0 ? bestSellerList : products).slice(0, bsConfig.maxItems || 4);

  return (
    <section className="py-14 sm:py-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-100/70 via-purple-50/50 via-sky-100/60 to-emerald-50/40 relative overflow-hidden">
      
      {/* Background Multi-Color Pastel Glowing Spheres */}
      <div className="absolute top-10 left-10 w-[420px] h-[420px] bg-pink-200/40 rounded-full blur-3xl pointer-events-none animate-pulse-soft" />
      <div className="absolute top-1/3 right-10 w-[420px] h-[420px] bg-sky-200/40 rounded-full blur-3xl pointer-events-none animate-pulse-soft" />
      <div className="absolute bottom-10 left-1/3 w-[350px] h-[350px] bg-emerald-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-5 right-1/4 w-[350px] h-[350px] bg-orange-200/35 rounded-full blur-3xl pointer-events-none" />

      {/* FLOATING CUTE ANIMATED BACKGROUND ANIMAL & BABY ORNAMENTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [-4, 4, -4], scale: [1, 1.08, 1] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-6 left-8 text-2xl opacity-75 filter drop-shadow-sm hidden sm:block"
        >
          🧸
        </motion.div>

        <motion.div
          animate={{ y: [0, -14, 0], rotate: [5, -5, 5], scale: [1, 1.1, 1] }}
          transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
          className="absolute top-10 right-40 text-2xl opacity-75 filter drop-shadow-sm hidden md:block"
        >
          👶
        </motion.div>

        <motion.div
          animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut', delay: 1.3 }}
          className="absolute bottom-8 left-10 text-2xl opacity-70 filter drop-shadow-sm hidden lg:block"
        >
          🐰
        </motion.div>

        <motion.div
          animate={{ y: [0, -15, 0], rotate: [4, -4, 4] }}
          transition={{ duration: 5.4, repeat: Infinity, ease: 'easeInOut', delay: 1.9 }}
          className="absolute bottom-6 right-14 text-2xl opacity-75 filter drop-shadow-sm hidden md:block"
        >
          🐥
        </motion.div>
      </div>

      {/* Section Wrapper - Full Width (No unused left/right margins) */}
      <motion.div
        initial={{ opacity: 0, y: 35, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-full px-2 sm:px-4 lg:px-6 relative z-10 space-y-8 sm:space-y-10"
      >
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/60 pb-6 gap-4 px-2 relative">
          <div className="flex-shrink-0">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-pink-200/80 shadow-xs mb-3">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-800 font-heading">
                {bsConfig.badge || 'Parent Favorites 💖'}
              </span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-rose-500 bg-clip-text text-transparent">
                {bsConfig.title || 'FEATURED LITTLE FAVORITES'}
              </span>
              <motion.span
                animate={{ rotate: [-8, 8, -8], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block text-2xl sm:text-3xl"
              >
                ✨
              </motion.span>
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1.5">
              {bsConfig.subtitle || 'The styles parents keep coming back for.'}
            </p>
          </div>

          {/* Middle Cute Animated Floating Animals & Baby Badges directly filling header space */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 py-1 my-1 select-none flex-grow justify-start lg:justify-center">
            
            {/* Cute Bear Pill */}
            <motion.div
              animate={{ y: [0, -6, 0], rotate: [-2, 2, -2] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={{ scale: 1.08, y: -2 }}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-pink-200/90 shadow-sm cursor-pointer"
            >
              <motion.span
                animate={{ rotate: [-10, 10, -10] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="text-xl"
              >
                🧸
              </motion.span>
              <span className="text-[11px] font-extrabold text-pink-700 tracking-wider font-heading uppercase">Teddy Bears</span>
            </motion.div>

            {/* Little Baby Pill */}
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [2, -2, 2] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              whileHover={{ scale: 1.08, y: -2 }}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-sky-200/90 shadow-sm cursor-pointer"
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-xl"
              >
                👶
              </motion.span>
              <span className="text-[11px] font-extrabold text-sky-700 tracking-wider font-heading uppercase">Sweet Babies</span>
            </motion.div>

            {/* Playful Bunny Pill */}
            <motion.div
              animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              whileHover={{ scale: 1.08, y: -2 }}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-purple-200/90 shadow-sm cursor-pointer"
            >
              <motion.span
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="text-xl"
              >
                🐰
              </motion.span>
              <span className="text-[11px] font-extrabold text-purple-700 tracking-wider font-heading uppercase">Playful Bunnies</span>
            </motion.div>

            {/* Cute Chick Pill */}
            <motion.div
              animate={{ y: [0, -7, 0], rotate: [3, -3, 3] }}
              transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              whileHover={{ scale: 1.08, y: -2 }}
              className="hidden sm:flex items-center space-x-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-amber-200/90 shadow-sm cursor-pointer"
            >
              <motion.span
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-xl"
              >
                🐥
              </motion.span>
              <span className="text-[11px] font-extrabold text-amber-700 tracking-wider font-heading uppercase">Little Chicks</span>
            </motion.div>

          </div>

          <Link
            href="/shop"
            className="flex-shrink-0 inline-flex items-center space-x-2 text-xs font-extrabold tracking-wider uppercase text-sky-800 hover:text-pink-600 transition-colors self-start lg:self-center group bg-white/90 hover:bg-white px-5 py-3 rounded-full border border-white/90 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 duration-200"
          >
            <span>DISCOVER ALL FAVORITES</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 4 Overlapping Cards Grid or Empty State */}
        {featuredFavorites.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 items-stretch px-1">
            {featuredFavorites.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 36, rotate: idx % 2 === 0 ? -1.2 : 1.2, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ zIndex: 40, scale: 1.03, y: -12 }}
                className="h-full relative transition-all duration-300 z-10 hover:z-40"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white/80 backdrop-blur-md rounded-3xl border border-white/90 p-8 max-w-md mx-auto space-y-3 shadow-xs">
            <span className="text-4xl block">🧸</span>
            <h3 className="font-heading font-black text-slate-800 text-base">
              No products available yet
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We&apos;re preparing our boutique favorites. Please check back soon!
            </p>
          </div>
        )}

      </motion.div>
    </section>
  );
}



