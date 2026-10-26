'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles, ArrowRight, Heart } from 'lucide-react';
import { useAdminData } from '../../hooks/AdminContext';
import { LookbookSlide } from '../../types/admin';

const DEFAULT_LOOKBOOK_COLLECTIONS: LookbookSlide[] = [
  {
    id: 1,
    tag: 'NEW COLLECTION 🌸',
    title: 'NORDIC COZY KNITS',
    subtitle: 'Soft organic Mongolian cashmere & flax linen for gentle morning hugs.',
    href: '/shop?category=Clothing',
    image: '/images/products/organic-onesie.jpg',
    badgeEmoji: '🧸',
    buttonText: 'EXPLORE COLLECTION',
    gradient: 'from-pink-900/80 via-rose-900/50 to-transparent',
    accentColor: 'border-pink-300 text-pink-700 bg-pink-50/90',
    buttonBg: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600',
  },
  {
    id: 2,
    tag: 'EDITORIAL LOOKBOOK 👑',
    title: 'SWEET TWIRLS & DREAMS',
    subtitle: 'Ethereal party dresses, delicate lace overlays, and dreamlike twirls.',
    href: '/shop?category=Dresses',
    image: '/images/products/editorial-baby-lifestyle.jpg',
    badgeEmoji: '✨',
    buttonText: 'EXPLORE COLLECTION',
    gradient: 'from-purple-900/80 via-pink-900/50 to-transparent',
    accentColor: 'border-purple-300 text-purple-700 bg-purple-50/90',
    buttonBg: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600',
  },
  {
    id: 3,
    tag: 'SIGNATURE LINE 🦕',
    title: 'LITTLE ADVENTURES',
    subtitle: 'Playful, durable everyday sets crafted for first steps and big smiles.',
    href: '/shop?category=Rompers',
    image: '/images/products/baby-boy-adventure.jpg',
    badgeEmoji: '👶',
    buttonText: 'EXPLORE COLLECTION',
    gradient: 'from-slate-950/85 via-sky-950/50 to-transparent',
    accentColor: 'border-sky-300 text-sky-700 bg-sky-50/90',
    buttonBg: 'bg-gradient-to-r from-sky-500 to-teal-500 text-white hover:from-sky-600 hover:to-teal-600',
  },
  {
    id: 4,
    tag: 'GOTS ORGANIC 🌿',
    title: 'NEWBORN COTTON BLISS',
    subtitle: 'Cloud-soft, hypoallergenic bodysuits designed for sensitive baby skin.',
    href: '/baby',
    image: '/images/products/baby-girl-fashion.jpg',
    badgeEmoji: '🐰',
    buttonText: 'EXPLORE COLLECTION',
    gradient: 'from-emerald-950/85 via-teal-950/50 to-transparent',
    accentColor: 'border-emerald-300 text-emerald-700 bg-emerald-50/90',
    buttonBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600',
  },
  {
    id: 5,
    tag: 'PASTEL FAVORITES 🎀',
    title: 'MATCHING NURSERY SETS',
    subtitle: 'Coordinated top and bottom ensembles for effortless daily cuteness.',
    href: '/new-in',
    image: '/images/products/hero-nursery.jpg',
    badgeEmoji: '🐥',
    buttonText: 'EXPLORE COLLECTION',
    gradient: 'from-amber-950/85 via-orange-950/50 to-transparent',
    accentColor: 'border-amber-300 text-amber-700 bg-amber-50/90',
    buttonBg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600',
  },
];

export function FeaturedCollection() {
  const { homepageConfig } = useAdminData();
  const collections =
    homepageConfig.lookbook && homepageConfig.lookbook.length > 0
      ? homepageConfig.lookbook
      : DEFAULT_LOOKBOOK_COLLECTIONS;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = collections.length;

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  // Auto rotation timer
  useEffect(() => {
    if (isPlaying && !isHovered) {
      timerRef.current = setInterval(() => {
        handleNext();
      }, 5500);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isHovered, activeIndex]);

  // Helper to get shortest offset around loop (-2, -1, 0, 1, 2)
  const getOffset = (index: number) => {
    let diff = index - activeIndex;
    if (diff > Math.floor(total / 2)) diff -= total;
    if (diff < -Math.floor(total / 2)) diff += total;
    return diff;
  };

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden select-none bg-gradient-to-b from-[#FAF9F6] via-[#FFF5F8]/40 to-[#F0FDF4]/30 border-y border-white/80">
      
      {/* Background Soft Pastel Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[480px] h-[480px] bg-pink-200/30 rounded-full blur-3xl pointer-events-none animate-pulse-soft" />
      <div className="absolute bottom-1/4 right-1/4 w-[480px] h-[480px] bg-sky-200/30 rounded-full blur-3xl pointer-events-none animate-pulse-soft" />
      <div className="absolute top-1/2 right-1/3 w-[360px] h-[360px] bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />

      {/* FLOATING CUTE ANIMATED BACKGROUND ANIMAL & BABY ORNAMENTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ y: [0, -14, 0], rotate: [-4, 4, -4], scale: [1, 1.1, 1] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-8 left-8 text-3xl opacity-75 filter drop-shadow-sm hidden sm:block"
        >
          🧸
        </motion.div>

        <motion.div
          animate={{ y: [0, -16, 0], rotate: [6, -6, 6], scale: [1, 1.12, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          className="absolute top-12 right-16 text-3xl opacity-75 filter drop-shadow-sm hidden md:block"
        >
          👶
        </motion.div>

        <motion.div
          animate={{ y: [0, -12, 0], rotate: [-4, 4, -4] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
          className="absolute bottom-12 left-14 text-3xl opacity-70 filter drop-shadow-sm hidden lg:block"
        >
          🐰
        </motion.div>

        <motion.div
          animate={{ y: [0, -15, 0], rotate: [5, -5, 5] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 2.1 }}
          className="absolute bottom-10 right-20 text-3xl opacity-75 filter drop-shadow-sm hidden md:block"
        >
          🐥
        </motion.div>
      </div>

      {/* Main Section Outer Container */}
      <div className="w-full max-w-full px-2 sm:px-4 lg:px-6 relative z-10 space-y-10 sm:space-y-14">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/80 pb-6 gap-4 px-2 relative">
          
          <div className="flex-shrink-0">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-pink-200/90 shadow-xs mb-3">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-800 font-heading">
                Pastel Lookbook 👑
              </span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-rose-500 bg-clip-text text-transparent">THE LITTLE </span>
              <span className="bg-gradient-to-r from-sky-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent">EDIT & LOOKBOOK </span>
              <motion.span
                animate={{ rotate: [-8, 8, -8], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block text-2xl sm:text-3xl"
              >
                ✨
              </motion.span>
            </h2>

            <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1.5">
              Curated seasonal looks and editorial baby-fashion curations for every little moment.
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
              <motion.span
                animate={{ rotate: [-10, 10, -10] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="text-xl"
              >
                🧸
              </motion.span>
              <span className="text-[11px] font-extrabold text-pink-700 tracking-wider font-heading uppercase">Teddy Bears</span>
            </motion.div>

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

            <motion.div
              animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              whileHover={{ scale: 1.08, y: -2 }}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-emerald-200/90 shadow-sm cursor-pointer"
            >
              <motion.span
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="text-xl"
              >
                🐰
              </motion.span>
              <span className="text-[11px] font-extrabold text-emerald-700 tracking-wider font-heading uppercase">Playful Bunnies</span>
            </motion.div>

          </div>

          {/* Top Right Quick Action */}
          <Link
            href="/collections"
            className="flex-shrink-0 inline-flex items-center space-x-2 text-xs font-extrabold tracking-wider uppercase text-sky-800 hover:text-pink-600 transition-colors self-start lg:self-center group bg-white/90 hover:bg-white px-5 py-3 rounded-full border border-white/90 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 duration-200"
          >
            <span>VIEW ALL LOOKBOOKS</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

        </div>

        {/* 3D COVERFLOW LAYERED CAROUSEL STAGE */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative w-full h-[500px] sm:h-[560px] lg:h-[610px] flex items-center justify-center overflow-hidden py-4"
        >
          {collections.map((item, index) => {
            const offset = getOffset(index);
            const isCenter = offset === 0;
            const isAbsVisible = Math.abs(offset) <= 2;

            if (!isAbsVisible) return null;

            // Compute dynamic 3D values for compact, connected, immersive overlapping deck
            let xPos = '0%';
            let scale = 1;
            let rotateZ = 0;
            let zIndex = 30;
            let opacity = 1;
            let filterBlur = 'blur(0px)';

            if (offset === 0) {
              xPos = '0%';
              scale = 1;
              rotateZ = 0;
              zIndex = 30;
              opacity = 1;
              filterBlur = 'blur(0px)';
            } else if (offset === -1) {
              xPos = '-29%';
              scale = 0.90;
              rotateZ = -5;
              zIndex = 20;
              opacity = 0.88;
              filterBlur = 'blur(0px)';
            } else if (offset === 1) {
              xPos = '29%';
              scale = 0.90;
              rotateZ = 5;
              zIndex = 20;
              opacity = 0.88;
              filterBlur = 'blur(0px)';
            } else if (offset === -2) {
              xPos = '-55%';
              scale = 0.78;
              rotateZ = -10;
              zIndex = 10;
              opacity = 0.60;
              filterBlur = 'blur(0.5px)';
            } else if (offset === 2) {
              xPos = '55%';
              scale = 0.78;
              rotateZ = 10;
              zIndex = 10;
              opacity = 0.60;
              filterBlur = 'blur(0.5px)';
            }

            return (
              <motion.div
                key={item.id}
                onClick={() => setActiveIndex(index)}
                animate={{
                  x: xPos,
                  scale,
                  rotateZ,
                  opacity,
                  filter: filterBlur,
                }}
                whileHover={{
                  scale: isCenter ? 1.04 : scale + 0.05,
                  y: -12,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 28,
                  mass: 0.9,
                }}
                style={{ zIndex }}
                className={`group absolute w-[315px] sm:w-[410px] lg:w-[475px] h-[450px] sm:h-[510px] lg:h-[555px] rounded-[34px] cursor-pointer transition-shadow duration-300 ${
                  isCenter
                    ? 'shadow-[0_32px_75px_-12px_rgba(0,0,0,0.35)] ring-4 ring-pink-300/50'
                    : 'shadow-2xl hover:shadow-[0_22px_50px_-10px_rgba(0,0,0,0.28)]'
                }`}
              >
                {/* SOFT ANIMATED PASTEL LOADING / PROGRESS GLOW AURA RING (Appears on Hover) */}
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-2.5 sm:-inset-3 rounded-[38px] bg-[conic-gradient(from_0deg,#f472b6_0%,#c084fc_25%,#38bdf8_50%,#4ade80_75%,#f472b6_100%)] opacity-0 group-hover:opacity-75 blur-md transition-opacity duration-500 pointer-events-none z-0"
                />

                {/* Card Inner Container with Border Frame */}
                <div className="relative w-full h-full rounded-[34px] overflow-hidden border-4 border-white/95 bg-white z-10 shadow-inner">

                  {/* Full-Bleed Image */}
                  <div className="relative w-full h-full bg-slate-100">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      priority={isCenter}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                    />

                    {/* Soft Hover Progress / Loading Indicator Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-white/30 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                      <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="h-full w-1/2 bg-gradient-to-r from-transparent via-pink-400 via-sky-400 to-transparent"
                      />
                    </div>

                    {/* Gradient Scrim Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient || 'from-slate-950/85 via-sky-950/50 to-transparent'}`} />
                    <div className="absolute inset-0 bg-slate-950/15 group-hover:bg-slate-950/10 transition-colors duration-300" />

                    {/* Top Floating Badge */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
                      <span className={`inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase border shadow-md backdrop-blur-md ${item.accentColor || 'border-pink-300 text-pink-700 bg-pink-50/90'}`}>
                        <span>{item.tag}</span>
                      </span>

                      <span className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-xl shadow-md border border-white transform group-hover:rotate-12 transition-transform duration-300">
                        {item.badgeEmoji}
                      </span>
                    </div>

                    {/* Bottom Text Content & Action Button Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-20 space-y-3 text-white">
                      <h3 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight drop-shadow-md group-hover:text-pink-100 transition-colors duration-300">
                        {item.title}
                      </h3>

                      <p className="text-xs sm:text-sm font-medium text-slate-100/90 line-clamp-2 leading-relaxed drop-shadow-sm max-w-sm">
                        {item.subtitle}
                      </p>

                      {/* Explore CTA */}
                      <div className="pt-2">
                        <Link
                          href={item.href}
                          className={`inline-flex items-center space-x-2.5 px-6 py-3 rounded-full text-xs font-extrabold tracking-wider uppercase shadow-lg transform transition-all duration-300 group-hover:scale-105 active:scale-95 ${item.buttonBg || 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'}`}
                        >
                          <span>{item.buttonText || 'EXPLORE COLLECTION'}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* BOTTOM NAVIGATION CONTROLS & MINIMAL PROGRESS BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 pt-2">
          
          <div className="flex items-center space-x-4 bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/90 shadow-md">
            
            {/* Previous Slide Button */}
            <button
              onClick={handlePrev}
              aria-label="Previous lookbook slide"
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-pink-500 text-slate-700 hover:text-white flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95 focus:outline-none"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Slide Counter */}
            <div className="font-mono text-xs font-extrabold text-slate-800 tracking-wider min-w-[50px] text-center select-none">
              0{activeIndex + 1} <span className="text-slate-400 font-normal">/</span> 0{total}
            </div>

            {/* Minimal Progress Bar */}
            <div className="w-28 sm:w-44 h-1.5 bg-slate-200/80 rounded-full overflow-hidden relative">
              <motion.div
                animate={{ width: `${((activeIndex + 1) / total) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-sky-500 rounded-full"
              />
            </div>

            {/* Pause / Play Toggle */}
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 focus:outline-none"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 translate-x-0.5" />}
            </button>

            {/* Next Slide Button */}
            <button
              onClick={handleNext}
              aria-label="Next lookbook slide"
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-pink-500 text-slate-700 hover:text-white flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95 focus:outline-none"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

          </div>

        </div>

      </div>
    </section>
  );
}
