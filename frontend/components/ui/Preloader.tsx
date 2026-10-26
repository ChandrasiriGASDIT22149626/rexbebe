'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Star } from 'lucide-react';

export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [statusText, setStatusText] = useState('Gathering little adventures...');

  useEffect(() => {
    // Skip preloader on admin paths
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      setIsComplete(true);
      return;
    }

    // Check if preloader has already run in current session
    const hasLoaded = sessionStorage.getItem('rexbebe_preloaded');
    if (hasLoaded) {
      setIsComplete(true);
      return;
    }

    // Dynamic status messages based on progress percentage
    const statusMessages = [
      'Floating into REXBEBE world... 🎈',
      'Knitting organic cashmere... ☁️',
      'Unpacking cute collections... 🌸',
      'Almost ready for playtime! 💖',
    ];

    // Snappy progress duration (~1.2 seconds total load)
    const duration = 1250;
    const intervalTime = 25;
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + increment + (Math.random() * 2), 100);
        
        // Update status text
        const messageIndex = Math.min(
          Math.floor((next / 100) * statusMessages.length),
          statusMessages.length - 1
        );
        setStatusText(statusMessages[messageIndex]);

        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsComplete(true);
            try { sessionStorage.setItem('rexbebe_preloaded', 'true'); } catch {}
          }, 200);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    // Guaranteed fallback timeout: Never keep the preloader visible for more than 1.4s
    const maxSafetyTimer = setTimeout(() => {
      clearInterval(timer);
      setIsComplete(true);
      try { sessionStorage.setItem('rexbebe_preloaded', 'true'); } catch {}
    }, 1400);

    return () => {
      clearInterval(timer);
      clearTimeout(maxSafetyTimer);
    };
  }, []);

  if (isComplete) return null;

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => {
            setIsComplete(true);
            try { sessionStorage.setItem('rexbebe_preloaded', 'true'); } catch {}
          }}
          id="rexbebe-preloader"
          className="fixed inset-0 z-[99999] bg-[#EAF7FD] flex flex-col items-center justify-center select-none overflow-hidden p-4 sm:p-6 cursor-pointer"
          title="Click to enter store"
        >
          {/* Background Atmosphere Matching Homepage Hero (#EAF7FD) */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/80 via-sky-100/50 to-[#EAF7FD] pointer-events-none" />
          
          {/* Floating Soft Background Clouds */}
          <motion.div
            animate={{ x: ['-10%', '110%'] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
            className="absolute top-10 left-0 w-72 h-36 opacity-50 pointer-events-none"
          >
            <svg viewBox="0 0 200 100" className="w-full h-full fill-white drop-shadow-sm">
              <path d="M30 60 Q20 30 50 30 Q70 10 100 20 Q130 10 150 35 Q180 35 170 65 Q180 90 140 85 Q110 95 80 85 Q40 95 30 60 Z" />
            </svg>
          </motion.div>

          <motion.div
            animate={{ x: ['110%', '-20%'] }}
            transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-12 right-0 w-88 h-44 opacity-40 pointer-events-none"
          >
            <svg viewBox="0 0 200 100" className="w-full h-full fill-white drop-shadow-sm">
              <path d="M25 55 Q15 25 45 25 Q65 5 95 15 Q125 5 145 30 Q175 30 165 60 Q175 85 135 80 Q105 90 75 80 Q35 90 25 55 Z" />
            </svg>
          </motion.div>

          {/* Main Preloader Content Container */}
          <div className="relative z-10 max-w-sm sm:max-w-md w-full flex flex-col items-center space-y-6">
            
            {/* Parachute Floating Stage Container */}
            <div className="w-full h-72 sm:h-80 relative flex items-end justify-center overflow-visible">
              
              {/* Entire Parachute + Animal Assembly Moving Across Progress Track */}
              <motion.div
                style={{
                  left: `calc(${Math.min(Math.max(progress, 8), 88)}% - 110px)`,
                }}
                animate={
                  progress >= 100
                    ? { y: [-10, -35, -5], scale: [1, 1.08, 1], rotate: [0, 5, 0] }
                    : {
                        y: [0, -12, 0, -8, 0],
                        rotate: [-2.5, 2.5, -2.5],
                      }
                }
                transition={
                  progress >= 100
                    ? { duration: 0.45, ease: 'easeOut' }
                    : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
                }
                className="absolute bottom-0 flex flex-col items-center transition-[left] duration-200 ease-out z-20"
              >

                {/* 1. PASTEL STRIPED PARACHUTE WITH PROMINENT "REXBEBE" TEXT */}
                <div className="relative w-56 sm:w-64 h-36 sm:h-40 flex flex-col items-center drop-shadow-xl">
                  {/* SVG Pastel Parachute / Hot Air Balloon Dome */}
                  <svg
                    viewBox="0 0 260 160"
                    className="w-full h-full filter drop-shadow-[0_10px_20px_rgba(255,182,193,0.35)]"
                  >
                    <defs>
                      {/* Pastel Stripe Gradients Inspired by Reference Image */}
                      <linearGradient id="pStripePink" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFA6C9" />
                        <stop offset="100%" stopColor="#FF70A6" />
                      </linearGradient>
                      <linearGradient id="pStripeSky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#BAE6FD" />
                        <stop offset="100%" stopColor="#38BDF8" />
                      </linearGradient>
                      <linearGradient id="pStripeYellow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FEF08A" />
                        <stop offset="100%" stopColor="#FACC15" />
                      </linearGradient>
                      <linearGradient id="pStripePurple" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E9D5FF" />
                        <stop offset="100%" stopColor="#C084FC" />
                      </linearGradient>
                      <linearGradient id="pStripeMint" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#A7F3D0" />
                        <stop offset="100%" stopColor="#34D399" />
                      </linearGradient>

                      {/* Glossy Highlight overlay */}
                      <linearGradient id="pGloss" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
                        <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
                      </linearGradient>
                    </defs>

                    {/* Parachute Canopy Main Outer Shape */}
                    <g>
                      {/* Stripe 1 - Left Pink */}
                      <path
                        d="M 15 110 C 15 35, 60 10, 85 10 C 65 30, 45 70, 40 115 C 28 116, 20 113, 15 110 Z"
                        fill="url(#pStripePink)"
                      />
                      {/* Stripe 2 - Left Cyan Blue */}
                      <path
                        d="M 40 115 C 45 70, 65 30, 85 10 C 110 10, 100 50, 95 118 C 75 120, 55 119, 40 115 Z"
                        fill="url(#pStripeSky)"
                      />
                      {/* Stripe 3 - Center Yellow */}
                      <path
                        d="M 95 118 C 100 50, 110 10, 130 8 C 150 10, 160 50, 165 118 C 140 121, 120 121, 95 118 Z"
                        fill="url(#pStripeYellow)"
                      />
                      {/* Stripe 4 - Right Purple */}
                      <path
                        d="M 165 118 C 160 50, 150 10, 175 10 C 195 30, 215 70, 220 115 C 205 119, 185 120, 165 118 Z"
                        fill="url(#pStripePurple)"
                      />
                      {/* Stripe 5 - Far Right Mint */}
                      <path
                        d="M 220 115 C 215 70, 195 30, 175 10 C 200 10, 245 35, 245 110 C 240 113, 232 116, 220 115 Z"
                        fill="url(#pStripeMint)"
                      />

                      {/* Glossy Overlay Mask */}
                      <path
                        d="M 15 110 C 15 35, 245 35, 245 110 Q 130 135 15 110 Z"
                        fill="url(#pGloss)"
                      />

                      {/* Bottom Scallop Trim Ring */}
                      <path
                        d="M 15 110 Q 40 120 65 115 Q 95 122 130 122 Q 165 122 195 115 Q 220 120 245 110"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />

                      {/* Decorative Hearts & Stars on Parachute (Reference style) */}
                      <path
                        d="M 60 45 Q 60 38 67 38 Q 74 38 74 45 Q 74 53 67 59 Q 60 53 60 45 Z"
                        fill="#FFFFFF"
                        opacity="0.95"
                      />
                      <path
                        d="M 186 45 Q 186 38 193 38 Q 200 38 200 45 Q 200 53 193 59 Q 186 53 186 45 Z"
                        fill="#FFFFFF"
                        opacity="0.95"
                      />
                      {/* Top Crown Knot Cap */}
                      <ellipse cx="130" cy="10" rx="14" ry="7" fill="#FFFFFF" opacity="0.9" />
                    </g>
                  </svg>

                  {/* PROMINENT "REXBEBE" BRAND TEXT ON THE PARACHUTE */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] text-center">
                    <motion.div
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="bg-white/95 backdrop-blur-md px-4 py-1.5 sm:px-5 sm:py-2 rounded-full border-2 border-pink-200 shadow-[0_4px_15px_rgba(255,105,180,0.25)] flex items-center justify-center space-x-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                      <span className="font-heading text-sm sm:text-base font-black tracking-[0.2em] text-pink-600 drop-shadow-sm uppercase">
                        REXBEBE
                      </span>
                      <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500 fill-pink-400 shrink-0" />
                    </motion.div>
                  </div>
                </div>

                {/* 2. PARACHUTE SUSPENSION LINES / ROPES LEADING TO ANIMAL */}
                <div className="w-48 sm:w-56 h-12 -mt-2 relative z-10">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 200 50">
                    {/* Left Outer Rope */}
                    <path d="M 25 0 Q 75 35 85 50" stroke="#FF9ECD" strokeWidth="2.5" strokeDasharray="3 1" fill="none" />
                    {/* Left Inner Rope */}
                    <path d="M 65 0 Q 85 30 92 50" stroke="#7DD3FC" strokeWidth="2.5" strokeDasharray="3 1" fill="none" />
                    {/* Center Rope */}
                    <path d="M 100 0 L 100 50" stroke="#FACC15" strokeWidth="2.5" strokeDasharray="3 1" fill="none" />
                    {/* Right Inner Rope */}
                    <path d="M 135 0 Q 115 30 108 50" stroke="#C084FC" strokeWidth="2.5" strokeDasharray="3 1" fill="none" />
                    {/* Right Outer Rope */}
                    <path d="M 175 0 Q 125 35 115 50" stroke="#FF9ECD" strokeWidth="2.5" strokeDasharray="3 1" fill="none" />
                  </svg>
                </div>

                {/* 3. BIGGER DINOSAUR ANIMAL mascot HOLDING/CARRIED BY THE PARACHUTE */}
                <div className="w-36 h-36 sm:w-44 sm:h-44 relative -mt-3 shrink-0 z-20">
                  <Image
                    src="/images/dino_character.png"
                    alt="REXBEBE Mascot Dino with Parachute"
                    width={320}
                    height={320}
                    priority
                    className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.15)]"
                  />

                  {/* Playful Floating Hearts & Sparkles near animal */}
                  <motion.div
                    animate={{ y: [-4, -16, -4], opacity: [0.6, 1, 0.6], scale: [0.9, 1.1, 0.9] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-3 right-0 text-pink-500"
                  >
                    <Heart className="w-5 h-5 fill-pink-400 drop-shadow-sm" />
                  </motion.div>

                  <motion.div
                    animate={{ y: [-2, -10, -2], opacity: [0.4, 0.9, 0.4] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                    className="absolute bottom-4 -left-3 text-amber-400"
                  >
                    <Star className="w-4 h-4 fill-amber-300 drop-shadow-sm" />
                  </motion.div>
                </div>

              </motion.div>
            </div>

            {/* Large Rounded Capsule Progress Bar */}
            <div className="w-full relative pt-2">
              <div className="w-full h-7 sm:h-8 rounded-full bg-white/90 border-4 border-white shadow-[0_8px_25px_rgba(0,0,0,0.08)] relative overflow-hidden">
                {/* Pastel Animated Gradient Fill */}
                <motion.div
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.1 }}
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 via-pink-400 via-amber-400 to-teal-400 shadow-md transition-all relative overflow-hidden"
                >
                  {/* Subtle Inner Highlight Shine */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/5" />
                </motion.div>
              </div>

              {/* Progress Percentage Badge */}
              <div className="absolute right-2 -bottom-7 text-[11px] font-extrabold tracking-wider uppercase text-pink-900/80">
                {Math.round(progress)}%
              </div>
            </div>

            {/* Status Text under Progress Bar */}
            <div className="pt-3 text-center space-y-1">
              <motion.p
                key={statusText}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-800 font-heading flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span>{statusText}</span>
              </motion.p>
              <p className="text-[11px] text-slate-600 font-medium">
                REXBEBE Premium Baby & Toddler Atelier
              </p>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
