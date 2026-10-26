'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useAdminData } from '../../hooks/AdminContext';

const DEFAULT_CATEGORIES = [
  {
    name: 'NEWBORN',
    subtitle: 'First little moments',
    href: '/baby',
    image: '/images/products/organic-onesie.jpg',
    bg: 'from-pink-100/80 via-rose-50/70 to-pink-50/60',
    ringBorder: 'border-pink-300 group-hover:border-pink-400',
    dotBg: 'bg-pink-400',
    badge: '🌸',
  },
  {
    name: 'BABY GIRLS',
    subtitle: 'Sweet little looks',
    href: '/girls',
    image: '/images/products/baby-girl-fashion.jpg',
    bg: 'from-purple-100/80 via-pink-50/70 to-peach-50/60',
    ringBorder: 'border-purple-300 group-hover:border-purple-400',
    dotBg: 'bg-purple-400',
    badge: '👑',
  },
  {
    name: 'BABY BOYS',
    subtitle: 'Everyday adventures',
    href: '/boys',
    image: '/images/products/baby-boy-fashion.jpg',
    bg: 'from-sky-100/80 via-blue-50/70 to-cyan-50/60',
    ringBorder: 'border-sky-300 group-hover:border-sky-400',
    dotBg: 'bg-sky-400',
    badge: '🦕',
  },
  {
    name: 'DRESSES',
    subtitle: 'Made to twirl',
    href: '/shop?category=Dresses',
    image: '/images/products/editorial-baby-lifestyle.jpg',
    bg: 'from-rose-100/80 via-pink-50/70 to-rose-50/60',
    ringBorder: 'border-rose-300 group-hover:border-rose-400',
    dotBg: 'bg-rose-400',
    badge: '✨',
  },
  {
    name: 'ROMPERS',
    subtitle: 'Soft everyday comfort',
    href: '/shop?category=Rompers',
    image: '/images/products/baby-boy-adventure.jpg',
    bg: 'from-emerald-100/80 via-mint-50/70 to-teal-50/60',
    ringBorder: 'border-emerald-300 group-hover:border-emerald-400',
    dotBg: 'bg-emerald-400',
    badge: '🌿',
  },
  {
    name: 'SETS',
    subtitle: 'Little looks, perfectly paired',
    href: '/new-in',
    image: '/images/products/hero-nursery.jpg',
    bg: 'from-amber-100/80 via-orange-50/70 to-amber-50/60',
    ringBorder: 'border-amber-300 group-hover:border-amber-400',
    dotBg: 'bg-amber-400',
    badge: '🎀',
  },
];

export function CategorySection() {
  const { homepageConfig } = useAdminData();
  const categoriesList =
    homepageConfig.categories && homepageConfig.categories.length > 0
      ? homepageConfig.categories
      : DEFAULT_CATEGORIES;

  const infiniteCategories = [
    ...categoriesList,
    ...categoriesList,
    ...categoriesList,
    ...categoriesList,
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set initial scroll offset to middle set for smooth bi-directional looping
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const singleSetWidth = container.scrollWidth / 4;
    if (singleSetWidth > 0 && container.scrollLeft === 0) {
      container.scrollLeft = singleSetWidth;
    }
  }, []);

  // Continuous auto-sliding RAF loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    let animationFrameId: number;

    const step = () => {
      if (container && !isPaused && !isMouseDownRef.current) {
        const singleSetWidth = container.scrollWidth / 4;
        if (singleSetWidth > 0) {
          container.scrollLeft += 0.75; // Soft, continuous linear movement
          
          // Infinite wraparound logic
          if (container.scrollLeft >= singleSetWidth * 3) {
            container.scrollLeft -= singleSetWidth * 2;
          } else if (container.scrollLeft <= 0) {
            container.scrollLeft += singleSetWidth * 2;
          }
        }
      }
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPaused]);

  const resetResumeTimer = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 3500);
  };

  const handleNext = () => {
    if (!containerRef.current) return;
    setIsPaused(true);
    containerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    resetResumeTimer();
  };

  const handlePrev = () => {
    if (!containerRef.current) return;
    setIsPaused(true);
    containerRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    resetResumeTimer();
  };

  // Mouse Drag Logic for Desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    isMouseDownRef.current = true;
    setIsPaused(true);
    startXRef.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeftStartRef.current = containerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    containerRef.current.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUpOrLeaveTrack = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      resetResumeTimer();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrev();
    }
  };

  return (
    <section className="py-14 sm:py-18 relative overflow-hidden select-none bg-user-pastel-header border-y border-white/60">
      
      {/* Translucent Soft Dreamy Overlay for Depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/10 to-white/30 backdrop-blur-md pointer-events-none" />

      {/* FLOATING CUTE ANIMATED BACKGROUND ANIMAL & BABY ORNAMENTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [-4, 4, -4], scale: [1, 1.08, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-4 left-6 text-2xl opacity-70 filter drop-shadow-sm hidden sm:block"
        >
          🧸
        </motion.div>

        <motion.div
          animate={{ y: [0, -14, 0], rotate: [5, -5, 5], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          className="absolute top-12 right-36 text-2xl opacity-75 filter drop-shadow-sm hidden md:block"
        >
          👶
        </motion.div>

        <motion.div
          animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
          className="absolute bottom-6 left-12 text-2xl opacity-65 filter drop-shadow-sm hidden lg:block"
        >
          🐰
        </motion.div>

        <motion.div
          animate={{ y: [0, -15, 0], rotate: [4, -4, 4] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 2.1 }}
          className="absolute bottom-8 right-16 text-2xl opacity-70 filter drop-shadow-sm hidden md:block"
        >
          🐥
        </motion.div>
      </div>

      {/* Section Reveal Motion Container */}
      <motion.div
        initial={{ opacity: 0, y: 35, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-full px-2 sm:px-4 lg:px-6 relative z-10 space-y-6 sm:space-y-8"
      >
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/60 pb-6 gap-4 px-2 relative">
          <div className="flex-shrink-0">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-white/90 backdrop-blur-md rounded-full border border-pink-200/80 shadow-xs mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-800 font-heading">
                Explore The Boutique 🌸
              </span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-sky-600 bg-clip-text text-transparent">SHOP THE </span>
              <span className="bg-gradient-to-r from-sky-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent">LITTLE WORLD </span>
              <motion.span
                animate={{ rotate: [-8, 8, -8], scale: [1, 1.15, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block text-2xl"
              >
                🦕
              </motion.span>
            </h2>
            <p className="text-slate-700 text-xs sm:text-sm font-medium mt-1">
              Little styles for every little moment.
            </p>
          </div>

          {/* 4 Soft 3D Puffy Toy Block Category Buttons Inspired by 3D Reference */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 py-1 my-1 select-none flex-grow justify-start lg:justify-center">
            
            {/* 1. CUTE BEARS 3D Puffy Button */}
            <Link href="/baby">
              <motion.div
                animate={{ y: [0, -5, 0], rotate: [-1.5, 1.5, -1.5] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ scale: 1.06, y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="relative flex items-center space-x-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-b from-white via-pink-100/90 to-rose-100/95 border-[2.5px] border-pink-200/90 shadow-[0_10px_22px_-4px_rgba(244,114,182,0.32),inset_0_4px_6px_rgba(255,255,255,0.95),inset_0_-3px_6px_rgba(219,39,119,0.08)] cursor-pointer group transition-all duration-300 overflow-hidden"
              >
                {/* Top Gloss Highlight Shine */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none rounded-t-full" />
                <motion.span
                  animate={{ rotate: [-8, 8, -8], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-xl sm:text-2xl filter drop-shadow-xs relative z-10"
                >
                  🧸
                </motion.span>
                <span className="font-heading text-xs sm:text-sm font-black tracking-widest text-pink-700 group-hover:text-pink-800 uppercase relative z-10">
                  CUTE BEARS
                </span>
              </motion.div>
            </Link>

            {/* 2. LITTLE BABIES 3D Puffy Button */}
            <Link href="/baby">
              <motion.div
                animate={{ y: [0, -6, 0], rotate: [1.5, -1.5, 1.5] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                whileHover={{ scale: 1.06, y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="relative flex items-center space-x-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-b from-white via-sky-100/90 to-blue-100/95 border-[2.5px] border-sky-200/90 shadow-[0_10px_22px_-4px_rgba(56,189,248,0.32),inset_0_4px_6px_rgba(255,255,255,0.95),inset_0_-3px_6px_rgba(2,132,199,0.08)] cursor-pointer group transition-all duration-300 overflow-hidden"
              >
                {/* Top Gloss Highlight Shine */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none rounded-t-full" />
                <motion.span
                  animate={{ scale: [1, 1.18, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-xl sm:text-2xl filter drop-shadow-xs relative z-10"
                >
                  👶
                </motion.span>
                <span className="font-heading text-xs sm:text-sm font-black tracking-widest text-sky-800 group-hover:text-sky-900 uppercase relative z-10">
                  LITTLE BABIES
                </span>
              </motion.div>
            </Link>

            {/* 3. SWEET ANIMALS 3D Puffy Button */}
            <Link href="/girls">
              <motion.div
                animate={{ y: [0, -5, 0], rotate: [-2, 2, -2] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                whileHover={{ scale: 1.06, y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="relative flex items-center space-x-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-b from-white via-emerald-100/90 to-mint-100/95 border-[2.5px] border-emerald-200/90 shadow-[0_10px_22px_-4px_rgba(52,211,153,0.32),inset_0_4px_6px_rgba(255,255,255,0.95),inset_0_-3px_6px_rgba(5,150,105,0.08)] cursor-pointer group transition-all duration-300 overflow-hidden"
              >
                {/* Top Gloss Highlight Shine */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none rounded-t-full" />
                <motion.span
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-xl sm:text-2xl filter drop-shadow-xs relative z-10"
                >
                  🐰
                </motion.span>
                <span className="font-heading text-xs sm:text-sm font-black tracking-widest text-emerald-800 group-hover:text-emerald-900 uppercase relative z-10">
                  SWEET ANIMALS
                </span>
              </motion.div>
            </Link>

            {/* 4. TINY DUCKLINGS 3D Puffy Button */}
            <Link href="/boys">
              <motion.div
                animate={{ y: [0, -6, 0], rotate: [2, -2, 2] }}
                transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
                whileHover={{ scale: 1.06, y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="relative flex items-center space-x-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-b from-white via-yellow-100/90 to-amber-100/95 border-[2.5px] border-amber-200/90 shadow-[0_10px_22px_-4px_rgba(251,191,36,0.32),inset_0_4px_6px_rgba(255,255,255,0.95),inset_0_-3px_6px_rgba(217,119,6,0.08)] cursor-pointer group transition-all duration-300 overflow-hidden"
              >
                {/* Top Gloss Highlight Shine */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none rounded-t-full" />
                <motion.span
                  animate={{ rotate: [-6, 6, -6] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-xl sm:text-2xl filter drop-shadow-xs relative z-10"
                >
                  🐥
                </motion.span>
                <span className="font-heading text-xs sm:text-sm font-black tracking-widest text-amber-800 group-hover:text-amber-900 uppercase relative z-10">
                  TINY DUCKLINGS
                </span>
              </motion.div>
            </Link>

          </div>

          <div className="flex items-center space-x-2 flex-shrink-0 self-end lg:self-center">
            {/* Carousel Navigation Arrows */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrev}
                aria-label="Previous categories"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-pink-600 border border-white/90 shadow-sm hover:shadow-md flex items-center justify-center transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Next categories"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-pink-600 border border-white/90 shadow-sm hover:shadow-md flex items-center justify-center transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* AUTO-SLIDING HORIZONTAL CAROUSEL TRACK */}
        <div
          ref={containerRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => {
            handleMouseUpOrLeaveTrack();
            setIsPaused(false);
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeaveTrack}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={resetResumeTimer}
          aria-label="Category Carousel"
          role="region"
          className="flex space-x-3 sm:space-x-4 md:space-x-5 lg:space-x-6 overflow-x-auto pb-4 pt-2 touch-pan-x cursor-grab active:cursor-grabbing focus:outline-none scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {infiniteCategories.map((cat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: (idx % 6) * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="flex-shrink-0 group text-center cursor-pointer w-[170px] sm:w-[205px] md:w-[225px] lg:w-[255px]"
            >
              <Link href={cat.href} className="block group focus:outline-none">
                
                {/* Circle Container with Subtle Floating Animation */}
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: (idx % 6) * 0.3 }}
                  className="relative w-[160px] h-[160px] sm:w-[195px] sm:h-[195px] md:w-[215px] md:h-[215px] lg:w-[245px] lg:h-[245px] mx-auto transition-all duration-300 ease-out transform group-hover:scale-[1.04] group-hover:-translate-y-[4px]"
                >
                  
                  {/* White Outer Ring + Soft Pastel Border + Shadow */}
                  <div className={`w-full h-full rounded-full p-2 sm:p-2.5 bg-white/95 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.09)] group-hover:shadow-[0_18px_40px_-5px_rgba(244,114,182,0.2)] border-2 sm:border-[3.5px] ${cat.ringBorder} transition-all duration-300`}>
                    <div className="w-full h-full rounded-full overflow-hidden relative shadow-inner bg-slate-50">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>

                  {/* Cute Small Pastel Badge */}
                  <div className={`absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full ${cat.dotBg} text-white flex items-center justify-center text-xs sm:text-sm lg:text-base shadow-md border-2 border-white transform group-hover:scale-[1.06] transition-transform duration-300 select-none`}>
                    {cat.badge}
                  </div>
                </motion.div>

                {/* Category Title & Micro Description */}
                <div className="mt-4 sm:mt-4.5 space-y-0.5">
                  <h3 className="font-heading text-xs sm:text-sm lg:text-base font-extrabold text-slate-900 group-hover:text-pink-600 transition-colors duration-300 tracking-wider uppercase">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-700 font-semibold truncate px-1">
                    {cat.subtitle}
                  </p>
                </div>

              </Link>
            </motion.div>
          ))}
        </div>

      </motion.div>
    </section>
  );
}
