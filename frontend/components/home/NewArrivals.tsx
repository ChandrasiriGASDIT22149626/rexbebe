'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { ProductCard } from '../products/ProductCard';
import { useAdminData } from '../../hooks/AdminContext';

export function NewArrivals() {
  const { products } = useAdminData();
  const newArrivals = products.filter(
    (p) => p.isNewArrival && p.status !== 'draft' && p.status !== 'unpublished'
  );
  const newProducts = (newArrivals.length > 0 ? newArrivals : products).slice(0, 5);

  return (
    <section className="py-14 sm:py-20 bg-gradient-to-b from-white via-pink-50/20 to-sky-50/20 relative overflow-hidden">
      
      {/* Background Subtle Pastel Glowing Orbs */}
      <div className="absolute top-1/3 left-10 w-[380px] h-[380px] bg-pink-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[380px] h-[380px] bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* FLOATING CUTE ANIMATED BACKGROUND ANIMAL ORNAMENTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [-4, 4, -4] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-6 left-8 text-2xl opacity-75 hidden sm:block"
        >
          🧸
        </motion.div>
        <motion.div
          animate={{ y: [0, -14, 0], rotate: [5, -5, 5] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          className="absolute top-10 right-28 text-2xl opacity-75 hidden md:block"
        >
          👶
        </motion.div>
      </div>

      {/* Outer Container - Full Width (Zero Left & Right Wasted Space) */}
      <motion.div
        initial={{ opacity: 0, y: 35, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-full px-2 sm:px-4 lg:px-6 relative z-10 space-y-8"
      >
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/80 pb-6 gap-4 px-2 relative">
          
          <div className="flex-shrink-0">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-white/95 backdrop-blur-md rounded-full border border-amber-200/90 shadow-xs mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-800 font-heading">
                New This Week ✨
              </span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-amber-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">LITTLE STYLES, </span>
              <span className="bg-gradient-to-r from-sky-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">BIG SMILES </span>
              <motion.span
                animate={{ rotate: [-8, 8, -8], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block text-2xl sm:text-3xl"
              >
                🦕
              </motion.span>
            </h2>

            <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1.5">
              Fresh handcrafted releases in GOTS organic Mongolian cashmere and washed flax linen.
            </p>
          </div>

          {/* Middle Floating Animal & Baby Badges directly filling space */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 py-1 my-1 select-none flex-grow justify-start lg:justify-center">
            
            <motion.div
              animate={{ y: [0, -6, 0], rotate: [-2, 2, -2] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={{ scale: 1.08, y: -2 }}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-pink-200/90 shadow-sm cursor-pointer"
            >
              <span className="text-xl">🧸</span>
              <span className="text-[11px] font-extrabold text-pink-700 tracking-wider font-heading uppercase">Teddy Bears</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0], rotate: [2, -2, 2] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              whileHover={{ scale: 1.08, y: -2 }}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-sky-200/90 shadow-sm cursor-pointer"
            >
              <span className="text-xl">👶</span>
              <span className="text-[11px] font-extrabold text-sky-700 tracking-wider font-heading uppercase">Sweet Babies</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              whileHover={{ scale: 1.08, y: -2 }}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-emerald-200/90 shadow-sm cursor-pointer"
            >
              <span className="text-xl">🐰</span>
              <span className="text-[11px] font-extrabold text-emerald-700 tracking-wider font-heading uppercase">Playful Bunnies</span>
            </motion.div>

          </div>

          <Link
            href="/new-in"
            className="flex-shrink-0 inline-flex items-center space-x-2 text-xs font-extrabold tracking-wider uppercase text-sky-800 hover:text-pink-600 transition-colors self-start lg:self-center group bg-white/90 hover:bg-white px-5 py-3 rounded-full border border-white/90 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 duration-200"
          >
            <span>SHOP NEW ARRIVALS</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 5 Overlapping Cards Grid or Empty State */}
        {newProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 items-stretch px-1">
            {newProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ zIndex: 40, scale: 1.03, y: -10 }}
                className="h-full relative transition-all duration-300 z-10 hover:z-40"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white/80 backdrop-blur-md rounded-3xl border border-white/90 p-8 max-w-md mx-auto space-y-3 shadow-xs">
            <span className="text-4xl block">✨</span>
            <h3 className="font-heading font-black text-slate-800 text-base">
              No products available yet
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              New arrivals are on their way. Please check back soon!
            </p>
          </div>
        )}

      </motion.div>
    </section>
  );
}

