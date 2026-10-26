'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, CheckCircle2, Sparkles, Heart } from 'lucide-react';
import { useAdminData } from '../../hooks/AdminContext';

const DEFAULT_REVIEWS = [
  {
    name: 'Elena Rostova',
    role: 'Newborn Mom',
    location: 'Colombo, Sri Lanka',
    rating: 5,
    text: 'The Aurelia cashmere romper is insanely soft! My 4-month-old daughter looks adorable and sleeps so comfortably in it. The quality exceeds luxury European boutiques.',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    productImage: '/images/products/organic-onesie.jpg',
    productName: 'Aurelia Organic Cashmere Romper',
    badgeEmoji: '🧸',
  },
  {
    name: 'Samantha & Noah',
    role: 'Parents of 6-month-old',
    location: 'Kandy, Sri Lanka',
    rating: 5,
    text: 'The wooden play gym is a masterpiece. Solid beechwood with hand-crocheted rattles that keep our little boy mesmerized for hours. Packaging was gorgeous!',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    productImage: '/images/products/baby-boy-adventure.jpg',
    productName: 'Nordic Artisan Wooden Play Gym',
    badgeEmoji: '👶',
  },
  {
    name: 'Dr. Priya Fernando',
    role: 'Pediatrician & Mom',
    location: 'Galle, Sri Lanka',
    rating: 5,
    text: 'As a pediatrician and mom, I am super picky about fabrics. REXBEBE’s French linen swaddles are 100% breathable and get softer after every single wash.',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    productImage: '/images/products/editorial-baby-lifestyle.jpg',
    productName: 'Maison Luxe Organic Linen Swaddle',
    badgeEmoji: '🐰',
  },
];

export function CustomerReviews() {
  const { homepageConfig } = useAdminData();
  const reviewsList =
    homepageConfig.reviews && homepageConfig.reviews.length > 0
      ? homepageConfig.reviews
      : DEFAULT_REVIEWS;

  return (
    <section className="py-14 sm:py-20 relative overflow-hidden select-none bg-user-pastel-header border-y border-white/60">
      
      {/* Translucent Soft Dreamy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/10 to-white/30 backdrop-blur-md pointer-events-none" />

      {/* FLOATING CUTE ANIMATED BACKGROUND ANIMAL & BABY ORNAMENTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [-4, 4, -4], scale: [1, 1.08, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-6 left-8 text-2xl opacity-75 hidden sm:block"
        >
          🧸
        </motion.div>

        <motion.div
          animate={{ y: [0, -14, 0], rotate: [5, -5, 5], scale: [1, 1.1, 1] }}
          transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          className="absolute top-10 right-36 text-2xl opacity-75 hidden md:block"
        >
          👶
        </motion.div>

        <motion.div
          animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
          className="absolute bottom-8 left-12 text-2xl opacity-70 hidden lg:block"
        >
          🐰
        </motion.div>

        <motion.div
          animate={{ y: [0, -15, 0], rotate: [4, -4, 4] }}
          transition={{ duration: 5.4, repeat: Infinity, ease: 'easeInOut', delay: 2.1 }}
          className="absolute bottom-6 right-16 text-2xl opacity-75 hidden md:block"
        >
          🐥
        </motion.div>
      </div>

      {/* Section Reveal Motion Container - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 35, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-full px-2 sm:px-4 lg:px-6 relative z-10 space-y-8 sm:space-y-10"
      >
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/60 pb-6 gap-4 px-2 relative">
          
          <div className="flex-shrink-0">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-white/90 backdrop-blur-md rounded-full border border-pink-200/80 shadow-xs mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-800 font-heading">
                Loved By Little Ones & Parents 🌸
              </span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-sky-600 bg-clip-text text-transparent">WHAT HAPPY </span>
              <span className="bg-gradient-to-r from-sky-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent">FAMILIES SAY </span>
              <motion.span
                animate={{ rotate: [-8, 8, -8], scale: [1, 1.15, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block text-2xl sm:text-3xl"
              >
                🦕
              </motion.span>
            </h2>

            <p className="text-slate-700 text-xs sm:text-sm font-medium mt-1">
              Over 5,000+ happy parents trust REXBEBE for pure organic nursery luxury.
            </p>
          </div>

          {/* Middle Floating Animal & Baby Badges */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 py-1 my-1 select-none flex-grow justify-start lg:justify-center">
            
            <motion.div
              animate={{ y: [0, -6, 0], rotate: [-2, 2, -2] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={{ scale: 1.08, y: -2 }}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-pink-200/90 shadow-sm cursor-pointer"
            >
              <span className="text-xl">🧸</span>
              <span className="text-[11px] font-extrabold text-pink-700 tracking-wider font-heading uppercase">Happy Babies</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0], rotate: [2, -2, 2] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              whileHover={{ scale: 1.08, y: -2 }}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-sky-200/90 shadow-sm cursor-pointer"
            >
              <span className="text-xl">👶</span>
              <span className="text-[11px] font-extrabold text-sky-700 tracking-wider font-heading uppercase">Loved Parents</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              whileHover={{ scale: 1.08, y: -2 }}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-emerald-200/90 shadow-sm cursor-pointer"
            >
              <span className="text-xl">🐰</span>
              <span className="text-[11px] font-extrabold text-emerald-700 tracking-wider font-heading uppercase">5-Star Care</span>
            </motion.div>

          </div>

          <div className="flex-shrink-0 inline-flex items-center space-x-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/90 shadow-sm">
            <Heart className="w-4 h-4 text-pink-500 fill-pink-400 animate-pulse" />
            <span className="text-xs font-extrabold text-slate-800 tracking-wider uppercase">99.8% PARENT SATISFACTION</span>
          </div>

        </div>

        {/* Testimonial Cards Grid with Product Images & Frosted Glass Pastel Box Styling */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch px-1">
          {reviewsList.map((rev, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -10, scale: 1.03 }}
              className="relative group flex flex-col justify-between"
            >
              {/* Soft Animated Pastel Glowing Aura Behind Card */}
              <div className="absolute -inset-2 rounded-[38px] bg-gradient-to-r from-pink-300/40 via-purple-300/40 via-sky-300/40 to-emerald-300/40 blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* Translucent Frosted Glass Card Panel */}
              <div className="relative bg-gradient-to-br from-white/95 via-pink-50/70 via-sky-50/70 to-emerald-50/70 backdrop-blur-xl p-6 sm:p-7 rounded-[34px] border-4 border-white/95 shadow-xl hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] transition-all duration-300 flex flex-col justify-between overflow-hidden h-full z-10">
                
                {/* Cute Corner Accent Badges */}
                <div className="absolute top-2.5 left-2.5 text-xs opacity-75 pointer-events-none select-none z-20">🌸</div>
                <div className="absolute top-2.5 right-2.5 text-xs opacity-75 pointer-events-none select-none z-20">✨</div>
                <div className="absolute bottom-2.5 left-2.5 text-xs opacity-75 pointer-events-none select-none z-20">🧸</div>
                <div className="absolute bottom-2.5 right-2.5 text-xs opacity-75 pointer-events-none select-none z-20">🦋</div>

                {/* Product Preview Image Header Banner */}
                <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-5 bg-slate-100 shadow-inner">
                  <Image
                    src={rev.productImage}
                    alt={rev.productName}
                    fill
                    className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  
                  {/* Product Name Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-pink-300 bg-black/40 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/20">
                      PURCHASED ITEM
                    </span>
                    <p className="text-xs font-bold font-heading truncate mt-1 drop-shadow-sm">
                      {rev.productName}
                    </p>
                  </div>

                  {/* Floating Cute Emoji Badge */}
                  <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-base shadow-md border border-white">
                    {rev.badgeEmoji}
                  </div>
                </div>

                {/* Review Text & Rating */}
                <div className="space-y-3 flex-grow">
                  <div className="flex items-center space-x-1 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed italic">
                    "{rev.text}"
                  </p>
                </div>

                {/* Customer Avatar & Verified Badge */}
                <div className="flex items-center space-x-3 pt-5 border-t border-slate-100/90 mt-5">
                  <img
                    src={rev.avatar}
                    alt={rev.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-pink-200 shadow-sm"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-heading text-xs font-extrabold text-slate-900 group-hover:text-pink-600 transition-colors">
                        {rev.name}
                      </h4>
                      {rev.verified && (
                        <span className="flex items-center text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 mr-0.5" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">{rev.role} • {rev.location}</p>
                  </div>
                </div>

              </div>
            </motion.div>
          ))}
        </div>

      </motion.div>
    </section>
  );
}
