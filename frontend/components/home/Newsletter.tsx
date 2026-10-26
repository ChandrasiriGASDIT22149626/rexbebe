'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Sparkles, Heart, CheckCircle2, ArrowRight } from 'lucide-react';

export function Newsletter() {
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 4000);
  };

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
        className="w-full max-w-full px-2 sm:px-4 lg:px-6 relative z-10 space-y-10"
      >
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/60 pb-6 gap-4 px-2 relative">
          
          <div className="flex-shrink-0">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-white/90 backdrop-blur-md rounded-full border border-pink-200/80 shadow-xs mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-800 font-heading">
                Join The Rexbebe Family 🌸
              </span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-sky-600 bg-clip-text text-transparent">GET FIRST ACCESS </span>
              <span className="bg-gradient-to-r from-sky-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent">TO NEW ARRIVALS </span>
              <motion.span
                animate={{ rotate: [-8, 8, -8], scale: [1, 1.15, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block text-2xl sm:text-3xl"
              >
                ✨
              </motion.span>
            </h2>

            <p className="text-slate-700 text-xs sm:text-sm font-medium mt-1">
              Subscribe to receive exclusive early access to seasonal capsule releases and private pop-up store invitations.
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
              <span className="text-[11px] font-extrabold text-pink-700 tracking-wider font-heading uppercase">Secret Perks</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0], rotate: [2, -2, 2] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              whileHover={{ scale: 1.08, y: -2 }}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-sky-200/90 shadow-sm cursor-pointer"
            >
              <span className="text-xl">👶</span>
              <span className="text-[11px] font-extrabold text-sky-700 tracking-wider font-heading uppercase">Early Access</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              whileHover={{ scale: 1.08, y: -2 }}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-emerald-200/90 shadow-sm cursor-pointer"
            >
              <span className="text-xl">🐰</span>
              <span className="text-[11px] font-extrabold text-emerald-700 tracking-wider font-heading uppercase">Private Invites</span>
            </motion.div>

          </div>

          <div className="flex-shrink-0 inline-flex items-center space-x-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/90 shadow-sm">
            <Heart className="w-4 h-4 text-pink-500 fill-pink-400 animate-pulse" />
            <span className="text-xs font-extrabold text-slate-800 tracking-wider uppercase">JOIN 25,000+ PARENTS</span>
          </div>

        </div>

        {/* Newsletter Main Container Box - Transparent Frosted Glass Pastel Card Box */}
        <div className="relative group px-1">
          
          {/* Soft Animated Pastel Glowing Aura Behind Card */}
          <div className="absolute -inset-2 rounded-[40px] bg-gradient-to-r from-pink-300/40 via-purple-300/40 via-sky-300/40 to-emerald-300/40 blur-xl opacity-80 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* Translucent Frosted Glass Card Panel */}
          <div className="relative bg-gradient-to-br from-white/95 via-pink-50/70 via-sky-50/70 to-emerald-50/70 backdrop-blur-xl p-8 sm:p-14 rounded-[40px] border-4 border-white/95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] text-center space-y-6 overflow-hidden max-w-5xl mx-auto">
            
            {/* Cute Corner Accent Badges */}
            <div className="absolute top-4 left-4 text-base opacity-80 pointer-events-none select-none">✨</div>
            <div className="absolute top-4 right-4 text-base opacity-80 pointer-events-none select-none">☁️</div>
            <div className="absolute bottom-4 left-4 text-base opacity-80 pointer-events-none select-none">🧸</div>
            <div className="absolute bottom-4 right-4 text-base opacity-80 pointer-events-none select-none">🌸</div>

            <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-pink-100/90 text-pink-700 rounded-full text-[11px] font-extrabold tracking-widest uppercase border border-pink-200/90 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>JOIN THE REXBEBE FAMILY</span>
            </div>

            <h3 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              New arrivals, little surprises & special offers
            </h3>

            <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed max-w-xl mx-auto">
              Subscribe to get exclusive preview access to seasonal capsular collections, nursery decor updates & subscriber gifts.
            </p>

            {subscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-emerald-100/90 text-emerald-800 rounded-full border border-emerald-300 flex items-center justify-center space-x-2 font-bold text-xs max-w-md mx-auto shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Welcome to the REXBEBE Family! Check your inbox for your surprise gift 🎁</span>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto pt-2">
                <div className="relative w-full sm:w-80">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address..."
                    className="w-full bg-white/90 backdrop-blur-md border-2 border-purple-200/90 text-xs sm:text-sm pl-11 pr-5 py-3.5 text-slate-800 placeholder-purple-300 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-200/50 rounded-full shadow-sm"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none">
                    ✉
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn-rexbebe-3d btn-3d-pink w-full sm:w-auto px-7 py-3.5 text-xs font-black tracking-wider uppercase flex items-center justify-center space-x-2 whitespace-nowrap"
                >
                  <span>SUBSCRIBE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            <div className="flex items-center justify-center space-x-6 text-[11px] font-bold text-slate-500 pt-2">
              <span className="flex items-center gap-1">✨ No Spam</span>
              <span className="flex items-center gap-1">🌸 Unsubscribe Anytime</span>
              <span className="flex items-center gap-1">💖 100% Privacy</span>
            </div>

          </div>
        </div>

      </motion.div>
    </section>
  );
}
