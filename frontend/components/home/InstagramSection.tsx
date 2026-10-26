'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Instagram, Heart, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useAdminData } from '../../hooks/AdminContext';

const DEFAULT_INSTA_POSTS = [
  { id: 1, image: '/images/products/organic-onesie.jpg', likes: '1.2k', handle: '@rexbebe_baby' },
  { id: 2, image: '/images/products/wooden-gym.jpg', likes: '890', handle: '@scandi_nursery' },
  { id: 3, image: '/images/products/hero-nursery.jpg', likes: '2.4k', handle: '@petite_reves' },
  { id: 4, image: '/images/products/baby-girl-fashion.jpg', likes: '1.8k', handle: '@little_luna' },
  { id: 5, image: '/images/products/baby-boy-adventure.jpg', likes: '3.1k', handle: '@cashmere_cuddles' },
];

export function InstagramSection() {
  const { homepageConfig } = useAdminData();
  const postsList =
    homepageConfig.instagram?.posts && homepageConfig.instagram.posts.length > 0
      ? homepageConfig.instagram.posts
      : DEFAULT_INSTA_POSTS;

  const infinitePosts = [
    ...postsList,
    ...postsList,
    ...postsList,
    ...postsList,
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set initial scroll position to middle set for smooth bi-directional looping
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
          container.scrollLeft += 0.8; // Soft linear movement

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
    containerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    resetResumeTimer();
  };

  const handlePrev = () => {
    if (!containerRef.current) return;
    setIsPaused(true);
    containerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    resetResumeTimer();
  };

  // Mouse Drag Logic
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

  return (
    <section className="py-14 sm:py-20 relative overflow-hidden select-none bg-user-pastel-header border-y border-white/60">
      
      {/* Translucent Soft Dreamy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/10 to-white/30 backdrop-blur-md pointer-events-none" />

      {/* FLOATING CUTE ANIMATED BACKGROUND ANIMAL ORNAMENTS */}
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
        className="w-full max-w-full px-2 sm:px-4 lg:px-6 relative z-10 space-y-8"
      >
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/60 pb-6 gap-4 px-2 relative">
          
          <div className="flex-shrink-0">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-white/90 backdrop-blur-md rounded-full border border-pink-200/80 shadow-xs mb-2.5">
              <Instagram className="w-3.5 h-3.5 text-pink-500" />
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-800 font-heading">
                @REXBEBE_ATELIER 🌸
              </span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-sky-600 bg-clip-text text-transparent">FOLLOW </span>
              <span className="bg-gradient-to-r from-sky-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent">REXBEBE </span>
              <motion.span
                animate={{ rotate: [-8, 8, -8], scale: [1, 1.15, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block text-2xl sm:text-3xl"
              >
                🦕
              </motion.span>
            </h2>

            <p className="text-slate-700 text-xs sm:text-sm font-medium mt-1">
              Tag us <span className="font-bold text-pink-600">#RexbebeMoments</span> to be featured in our official global gallery.
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
              <span className="text-[11px] font-extrabold text-pink-700 tracking-wider font-heading uppercase">Real Parents</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0], rotate: [2, -2, 2] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              whileHover={{ scale: 1.08, y: -2 }}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-sky-200/90 shadow-sm cursor-pointer"
            >
              <span className="text-xl">👶</span>
              <span className="text-[11px] font-extrabold text-sky-700 tracking-wider font-heading uppercase">Daily Fits</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              whileHover={{ scale: 1.08, y: -2 }}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-emerald-200/90 shadow-sm cursor-pointer"
            >
              <span className="text-xl">🐰</span>
              <span className="text-[11px] font-extrabold text-emerald-700 tracking-wider font-heading uppercase">#RexbebeMoments</span>
            </motion.div>

          </div>

          <div className="flex items-center space-x-3 flex-shrink-0 self-end lg:self-center">
            {/* Carousel Navigation Arrow Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrev}
                aria-label="Previous photos"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-pink-600 border border-white/90 shadow-sm hover:shadow-md flex items-center justify-center transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Next photos"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-pink-600 border border-white/90 shadow-sm hover:shadow-md flex items-center justify-center transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-xs font-extrabold tracking-wider uppercase text-sky-800 hover:text-pink-600 transition-colors group bg-white/90 hover:bg-white px-5 py-3 rounded-full border border-white/90 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 duration-200"
            >
              <span>JOIN OUR INSTAGRAM</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

        </div>

        {/* Gallery Main Container Box - Transparent Frosted Glass Pastel Card Box */}
        <div className="relative group px-1">
          
          {/* Soft Animated Pastel Glowing Aura Behind Card */}
          <div className="absolute -inset-2 rounded-[40px] bg-gradient-to-r from-pink-300/40 via-purple-300/40 via-sky-300/40 to-emerald-300/40 blur-xl opacity-80 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* Translucent Frosted Glass Card Panel */}
          <div className="relative bg-gradient-to-br from-white/95 via-pink-50/75 via-sky-50/75 to-emerald-50/75 backdrop-blur-xl p-5 sm:p-7 rounded-[36px] border-4 border-white/95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] overflow-hidden">
            
            {/* Cute Corner Accent Badges */}
            <div className="absolute top-3 left-3 text-sm opacity-80 pointer-events-none select-none z-20">🌸</div>
            <div className="absolute top-3 right-3 text-sm opacity-80 pointer-events-none select-none z-20">✨</div>
            <div className="absolute bottom-3 left-3 text-sm opacity-80 pointer-events-none select-none z-20">🧸</div>
            <div className="absolute bottom-3 right-3 text-sm opacity-80 pointer-events-none select-none z-20">🦋</div>

            {/* AUTO-SLIDING HORIZONTAL CAROUSEL TRACK */}
            <div
              ref={containerRef}
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
              className="flex space-x-3 sm:space-x-4 md:space-x-5 overflow-x-auto pb-2 pt-1 touch-pan-x cursor-grab active:cursor-grabbing scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden relative z-10"
            >
              {infinitePosts.map((post, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -8, scale: 1.04 }}
                  className="flex-shrink-0 group/item relative w-[210px] sm:w-[250px] md:w-[275px] lg:w-[295px] aspect-square rounded-[30px] overflow-hidden bg-slate-100 shadow-md hover:shadow-2xl border-4 border-white/95 cursor-pointer transition-all duration-300"
                >
                  <Image
                    src={post.image}
                    alt="REXBEBE Instagram moment"
                    fill
                    className="object-cover group-hover/item:scale-108 transition-transform duration-700 ease-out"
                  />
                  
                  {/* Hover Overlay with Instagram Like Badge */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-between text-white">
                    <div className="self-end bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-white/30">
                      {post.handle}
                    </div>

                    <div className="flex items-center space-x-2 text-xs font-extrabold">
                      <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
                      <span>{post.likes} Likes</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>

      </motion.div>
    </section>
  );
}
