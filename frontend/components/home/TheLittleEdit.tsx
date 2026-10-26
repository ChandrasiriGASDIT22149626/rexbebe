'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Heart } from 'lucide-react';
import { Button } from '../ui/Button';

export function TheLittleEdit() {
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
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-white/90 backdrop-blur-md rounded-full border border-sky-200/80 shadow-xs mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-800 font-heading">
                Curated Collection 🌸
              </span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-sky-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">THE LITTLE </span>
              <span className="bg-gradient-to-r from-pink-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent">EDIT </span>
              <motion.span
                animate={{ rotate: [-8, 8, -8], scale: [1, 1.15, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block text-2xl sm:text-3xl"
              >
                ✨
              </motion.span>
            </h2>

            <p className="text-slate-700 text-xs sm:text-sm font-medium mt-1">
              Timeless little pieces for beautiful little days. Crafted for lasting memories.
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
              <span className="text-[11px] font-extrabold text-pink-700 tracking-wider font-heading uppercase">Curated Edit</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0], rotate: [2, -2, 2] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              whileHover={{ scale: 1.08, y: -2 }}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-sky-200/90 shadow-sm cursor-pointer"
            >
              <span className="text-xl">👶</span>
              <span className="text-[11px] font-extrabold text-sky-700 tracking-wider font-heading uppercase">Organic Fibers</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              whileHover={{ scale: 1.08, y: -2 }}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-emerald-200/90 shadow-sm cursor-pointer"
            >
              <span className="text-xl">🐰</span>
              <span className="text-[11px] font-extrabold text-emerald-700 tracking-wider font-heading uppercase">Heirloom Pieces</span>
            </motion.div>

          </div>

          <Link
            href="/collections"
            className="flex-shrink-0 inline-flex items-center space-x-2 text-xs font-extrabold tracking-wider uppercase text-sky-800 hover:text-pink-600 transition-colors self-start lg:self-center group bg-white/90 hover:bg-white px-5 py-3 rounded-full border border-white/90 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 duration-200"
          >
            <span>DISCOVER THE EDIT</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

        </div>

        {/* Section Main Container Box - Transparent Frosted Glass Pastel Card Box */}
        <div className="relative group px-1">
          
          {/* Soft Animated Pastel Glowing Aura Behind Card */}
          <div className="absolute -inset-2 rounded-[40px] bg-gradient-to-r from-pink-300/40 via-purple-300/40 via-sky-300/40 to-emerald-300/40 blur-xl opacity-80 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* Translucent Frosted Glass Card Panel */}
          <div className="relative bg-gradient-to-br from-white/90 via-pink-50/70 via-sky-50/70 to-emerald-50/70 backdrop-blur-xl p-8 sm:p-12 rounded-[36px] border-4 border-white/95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] space-y-6 overflow-hidden">
            
            {/* Cute Corner Accent Badges */}
            <div className="absolute top-3 left-3 text-sm opacity-80 pointer-events-none select-none">🌸</div>
            <div className="absolute top-3 right-3 text-sm opacity-80 pointer-events-none select-none">✨</div>
            <div className="absolute bottom-3 left-3 text-sm opacity-80 pointer-events-none select-none">🧸</div>
            <div className="absolute bottom-3 right-3 text-sm opacity-80 pointer-events-none select-none">🦋</div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
              
              {/* Text & Call to Action Panel */}
              <div className="lg:col-span-5 space-y-6 relative z-10">
                
                <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-white/90 backdrop-blur-md rounded-full border border-sky-200/80 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                  <span className="text-[11px] font-bold tracking-widest uppercase text-slate-800 font-heading">
                    CURATED COLLECTION
                  </span>
                </div>

                <h3 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
                  THE LITTLE EDIT <br />
                  <span className="text-sky-600 font-normal italic">Timeless & Playful</span>
                </h3>

                <p className="text-slate-700 text-xs sm:text-sm sm:text-base leading-relaxed font-medium">
                  Timeless little pieces for beautiful little days. Crafted with delicate pastel color palettes, hand-stitched detailing, and pure organic fibers meant for lasting memories.
                </p>

                <div className="pt-2">
                  <Link href="/collections">
                    <Button variant="accent" size="lg" className="shadow-rexbebe-accent-3d flex items-center space-x-2">
                      <span>EXPLORE COLLECTION</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Visual Anchor & Secondary Decorative Floating Cutouts */}
              <div className="lg:col-span-7 relative z-10 flex justify-center">
                <div className="relative w-full max-w-lg aspect-[4/3] rounded-[30px] overflow-hidden shadow-2xl border-4 border-white/95 bg-gradient-to-br from-sky-50 to-pink-50">
                  <Image
                    src="/images/products/baby-boy-adventure.jpg"
                    alt="The Little Edit Curation"
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />

                  {/* Floating Secondary Decorative Product Card */}
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    whileHover={{ scale: 1.05 }}
                    className="absolute bottom-4 left-4 p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/95 flex items-center space-x-3 max-w-[210px]"
                  >
                    <div className="w-11 h-11 rounded-xl overflow-hidden relative flex-shrink-0 border border-emerald-100 shadow-inner">
                      <Image
                        src="/images/products/organic-onesie.jpg"
                        alt="Organic Onesie"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 font-heading truncate">Sage Onesie Set</p>
                      <p className="text-[11px] text-emerald-600 font-extrabold mt-0.5">LKR 3,850</p>
                    </div>
                  </motion.div>

                  {/* Floating Decorative Badge */}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-pink-100 flex items-center space-x-1.5 text-xs font-extrabold text-slate-800">
                    <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-400" />
                    <span>Editor Choice</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </motion.div>
    </section>
  );
}
