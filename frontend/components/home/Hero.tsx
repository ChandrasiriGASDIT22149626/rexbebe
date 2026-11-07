'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform, useInView, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useAdminData } from '../../hooks/AdminContext';

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: '100px' });
  const shouldReduceMotion = useReducedMotion();

  const { homepageConfig } = useAdminData();
  const hero = homepageConfig.hero;
  const [isHoveredDino, setIsHoveredDino] = useState(false);
  const [isHoveredKitty, setIsHoveredKitty] = useState(false);
  const [speechBubbleText, setSpeechBubbleText] = useState(hero.speechBubbleText || 'Welcome to REXBEBE! 🦕✨');

  useEffect(() => {
    if (hero.speechBubbleText) {
      setSpeechBubbleText(hero.speechBubbleText);
    }
  }, [hero.speechBubbleText]);

  // Mouse position state for 3D Parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for multi-layered depth parallax
  const springConfig = { damping: 25, stiffness: 120 };

  // Parallax shifts for different depth layers
  const bgX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), springConfig);
  const bgY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-8, 8]), springConfig);

  const midX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-24, 24]), springConfig);
  const midY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-16, 16]), springConfig);

  const charX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-45, 45]), springConfig);
  const charY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-30, 30]), springConfig);

  const fgX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-65, 65]), springConfig);
  const fgY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-45, 45]), springConfig);

  const rafRef = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || shouldReduceMotion || !isInView) return;
    if (typeof window !== 'undefined' && (window.innerWidth < 768 || (window.matchMedia && window.matchMedia('(hover: none)').matches))) return;
    if (rafRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rafRef.current = requestAnimationFrame(() => {
      mouseX.set(x);
      mouseY.set(y);
      rafRef.current = null;
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    mouseX.set(0);
    mouseY.set(0);
  };

  // Dinosaur interactive speech bubbles on hover
  const dinoQuotes = [
    'Little Moments, Big Adventures! 🦕',
    'Handcrafted 100% Organic Cashmere! ☁️',
    'Made with love for little ones! 💖',
    'Explore our 2026 Collection! 🌸',
  ];

  const handleDinoHover = () => {
    setIsHoveredDino(true);
    const randomQuote = dinoQuotes[Math.floor(Math.random() * dinoQuotes.length)];
    setSpeechBubbleText(randomQuote);
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative h-[calc(100vh-150px)] min-h-[360px] sm:h-[calc(100vh-156px)] sm:min-h-[420px] lg:h-[calc(100vh-190px)] lg:min-h-[480px] lg:max-h-[760px] w-full overflow-hidden flex items-center justify-center select-none bg-white"
    >
      {/* ========================================================================= */}
      {/* 1. LAYER 0: FULL-WIDTH 3D ENVIRONMENT BACKGROUND & ATMOSPHERE            */}
      {/* ========================================================================= */}
      <motion.div
        style={{ x: shouldReduceMotion ? 0 : bgX, y: shouldReduceMotion ? 0 : bgY }}
        className="absolute inset-0 w-[108%] h-[108%] -left-[4%] -top-[4%] z-0"
      >
        {/* Full 3D Pastel World Background - Primary LCP Element */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/images/hero/world_bg.webp"
            alt="REXBEBE 3D Pastel World"
            fill
            priority
            fetchPriority="high"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1376px"
            quality={80}
            className="object-cover object-[center_35%] transform scale-105 filter brightness-[1.02] contrast-[1.01]"
          />
        </div>

        {/* Soft Dreamy Daylight Atmosphere for seamless text integration */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/45 via-white/20 to-transparent lg:w-2/3 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/4 left-4 sm:left-12 w-[500px] h-[400px] bg-gradient-to-br from-white/35 via-white/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* Golden Sunlight Rays Effect */}
      <div className="absolute top-0 left-1/3 w-96 h-[500px] bg-gradient-to-b from-amber-200/25 via-orange-100/10 to-transparent blur-3xl transform -rotate-45 pointer-events-none z-1 animate-pulse-soft" />

      {/* ========================================================================= */}
      {/* 2. LAYER 1: DRIFTING CLOUDS & SWAYING MIDGROUND ELEMENTS                 */}
      {/* ========================================================================= */}
      <motion.div style={{ x: shouldReduceMotion ? 0 : midX, y: shouldReduceMotion ? 0 : midY }} className="absolute inset-0 z-10 pointer-events-none">
        
        {/* Drifting Cloud 1 */}
        <motion.div
          animate={isInView && !shouldReduceMotion ? { x: ['-10%', '110%'] } : { x: '10%' }}
          transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
          className="absolute top-12 left-0 w-64 h-32 opacity-80 filter drop-shadow-md"
        >
          <svg viewBox="0 0 200 100" className="w-full h-full fill-white/90">
            <path d="M30 60 Q20 30 50 30 Q70 10 100 20 Q130 10 150 35 Q180 35 170 65 Q180 90 140 85 Q110 95 80 85 Q40 95 30 60 Z" />
          </svg>
        </motion.div>

        {/* Drifting Cloud 2 */}
        <motion.div
          animate={isInView && !shouldReduceMotion ? { x: ['110%', '-20%'] } : { x: '60%' }}
          transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
          className="absolute top-28 right-0 w-80 h-40 opacity-70 filter drop-shadow-sm"
        >
          <svg viewBox="0 0 200 100" className="w-full h-full fill-white/80">
            <path d="M25 55 Q15 25 45 25 Q65 5 95 15 Q125 5 145 30 Q175 30 165 60 Q175 85 135 80 Q105 90 75 80 Q35 90 25 55 Z" />
          </svg>
        </motion.div>

        {/* Floating Pastel Hot Air Balloon */}
        <motion.div
          animate={
            isInView && !shouldReduceMotion
              ? {
                  y: [0, -18, 0],
                  rotate: [-2, 2, -2],
                }
              : { y: 0, rotate: 0 }
          }
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-16 right-[22%] w-24 h-32 hidden md:block filter drop-shadow-lg"
        >
          <div className="relative w-full h-full flex flex-col items-center">
            {/* Balloon Canopy */}
            <div className="w-20 h-24 rounded-[50%_50%_45%_45%/60%_60%_40%_40%] bg-gradient-to-tr from-sky-300 via-pink-200 to-amber-200 border-2 border-white flex items-center justify-center shadow-lg relative overflow-hidden">
              <div className="w-full h-full opacity-35 bg-[radial-gradient(circle_at_top,_#fff_20%,_transparent_75%)]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/10" />
            </div>
            {/* Basket Ropes */}
            <div className="w-7 flex justify-between px-1 -mt-0.5 relative z-0">
              <div className="w-0.5 h-3 bg-amber-800/40 rounded-full" />
              <div className="w-0.5 h-3 bg-amber-800/40 rounded-full" />
            </div>
            {/* Basket */}
            <div className="w-5 h-4 bg-gradient-to-b from-amber-600 to-amber-800 rounded-b-md border border-white/80 shadow-xs" />
          </div>
        </motion.div>

      </motion.div>

      {/* ========================================================================= */}
      {/* 3. LAYER 2: INTERACTIVE CHARACTERS (REXBEBE DINO & KITTY MASCOT)         */}
      {/* ========================================================================= */}
      <motion.div style={{ x: shouldReduceMotion ? 0 : charX, y: shouldReduceMotion ? 0 : charY }} className="absolute inset-0 z-20 pointer-events-none">
        
        {/* REXBEBE 3D Dinosaur Mascot Character */}
        <div className="absolute bottom-0.5 right-1 sm:bottom-2 sm:right-[4%] lg:right-[6%] w-[110px] min-[400px]:w-[130px] sm:w-[190px] md:w-[230px] lg:w-[280px] xl:w-[320px] aspect-square pointer-events-auto group cursor-pointer">
          
          {/* Interactive Speech Bubble */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            key={speechBubbleText}
            transition={{ type: 'spring', damping: 15 }}
            className="absolute -top-9 sm:-top-10 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-2xl shadow-rexbebe-3d border-2 border-sky-200 text-slate-800 text-[10px] sm:text-xs md:text-sm font-bold flex items-center space-x-1.5 whitespace-normal sm:whitespace-nowrap max-w-[160px] sm:max-w-none text-center sm:text-left z-30"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
            <span className="truncate sm:overflow-visible">{speechBubbleText}</span>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-white" />
          </motion.div>

          {/* Dinosaur 3D Character Render */}
          <motion.div
            animate={
              isHoveredDino
                ? { y: [0, -16, 0], rotate: [0, -4, 4, 0], scale: 1.04 }
                : isInView && !shouldReduceMotion
                ? { y: [0, -8, 0], rotate: [-1.5, 1.5, -1.5], scale: 1 }
                : { y: 0, rotate: 0, scale: 1 }
            }
            transition={{
              duration: isHoveredDino ? 0.6 : 4,
              repeat: isHoveredDino || (isInView && !shouldReduceMotion) ? Infinity : 0,
              ease: 'easeInOut',
            }}
            onMouseEnter={handleDinoHover}
            onMouseLeave={() => setIsHoveredDino(false)}
            className="relative w-full h-full drop-shadow-2xl"
          >
            <div className="relative w-full h-full">
              <Image
                src="/images/hero/dino_mascot.webp"
                alt="REXBEBE Mascot Dino"
                fill
                sizes="(max-width: 640px) 130px, (max-width: 1024px) 230px, 320px"
                className="object-contain"
              />
            </div>
          </motion.div>

          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-900/15 rounded-full blur-md animate-pulse-soft" />
        </div>

        {/* Cute Kitten Mascot Companion */}
        <div className="absolute bottom-1 right-[24%] lg:right-[28%] w-[90px] sm:w-[120px] md:w-[140px] lg:w-[160px] aspect-square hidden sm:block pointer-events-auto cursor-pointer">
          <motion.div
            animate={
              isHoveredKitty
                ? { y: [0, -12, 0], rotate: [0, 6, -6, 0] }
                : isInView && !shouldReduceMotion
                ? { y: [0, -5, 0], rotate: [1, -1, 1] }
                : { y: 0, rotate: 0 }
            }
            transition={{
              duration: isHoveredKitty ? 0.5 : 3.5,
              repeat: isHoveredKitty || (isInView && !shouldReduceMotion) ? Infinity : 0,
              ease: 'easeInOut',
            }}
            onMouseEnter={() => setIsHoveredKitty(true)}
            onMouseLeave={() => setIsHoveredKitty(false)}
            className="relative w-full h-full drop-shadow-xl"
          >
            <Image
              src="/images/hero/kitty_mascot.webp?v=transp2"
              alt="REXBEBE Companion Kitty"
              fill
              unoptimized
              sizes="(max-width: 1024px) 140px, 160px"
              loading="lazy"
              className="object-contain"
            />
          </motion.div>

          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-20 h-3 bg-slate-900/15 rounded-full blur-sm" />
        </div>

      </motion.div>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 4. HERO CONTENT OVERLAY (NATURALLY BLENDED STORYBOOK TITLE & COPY)        */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-10 w-full relative z-30">
        <div className="max-w-xl lg:max-w-2xl">
          
          {/* Box removed: Typography floats directly on the landscape artwork */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-3 sm:space-y-4"
          >
            {/* Headline Section: 3D Glossy Inflatable Balloon Typography in Baby Pink & Baby Green */}
            <div className="space-y-0.5 sm:space-y-1 relative">
              
              {/* Cute Floating Pastel Cherry Blossom & Heart Accents matching the reference vibe */}
              <motion.div
                animate={
                  isInView && !shouldReduceMotion
                    ? { y: [0, -8, 0], rotate: [-5, 5, -5] }
                    : { y: 0, rotate: 0 }
                }
                transition={{ duration: 4, repeat: isInView && !shouldReduceMotion ? Infinity : 0, ease: 'easeInOut' }}
                className="absolute -top-7 -left-3 text-lg sm:text-2xl pointer-events-none select-none filter drop-shadow-sm opacity-90"
              >
                🌸
              </motion.div>

              <motion.div
                animate={
                  isInView && !shouldReduceMotion
                    ? { y: [0, -6, 0], scale: [1, 1.08, 1] }
                    : { y: 0, scale: 1 }
                }
                transition={{ duration: 3.5, repeat: isInView && !shouldReduceMotion ? Infinity : 0, ease: 'easeInOut', delay: 1 }}
                className="absolute -top-5 right-12 text-sm sm:text-lg pointer-events-none select-none filter drop-shadow-sm opacity-85"
              >
                💕
              </motion.div>

              {/* Unified Semantic H1 for SEO with 3D Balloon Typography */}
              <h1 className="relative inline-block">
                <motion.span
                  initial={{ opacity: 0, y: 15, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="balloon-text-pink text-2xl min-[400px]:text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.1] block"
                >
                  {hero.headlineLine1 || 'Little Moments'}
                </motion.span>

                <motion.span
                  initial={{ opacity: 0, y: 15, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="balloon-text-green text-2xl min-[400px]:text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.1] inline-flex items-center space-x-2 sm:space-x-3 pt-0.5"
                >
                  <span>{hero.headlineLine2 || 'Big Adventures.'}</span>

                {/* Matching 3D Baby Mint Dinosaur Mascot Graphic */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={
                    isInView && !shouldReduceMotion
                      ? { 
                          opacity: 1, 
                          scale: [0.8, 1, 1.04, 1],
                          y: [0, -3, 0]
                        }
                      : { opacity: 1, scale: 1, y: 0 }
                  }
                  transition={{
                    opacity: { duration: 0.6, delay: 0.3 },
                    scale: { duration: 4, repeat: isInView && !shouldReduceMotion ? Infinity : 0, ease: 'easeInOut' },
                    y: { duration: 4, repeat: isInView && !shouldReduceMotion ? Infinity : 0, ease: 'easeInOut' }
                  }}
                  className="relative inline-block align-middle ml-1 sm:ml-2 transform -translate-y-1 drop-shadow-[0_4px_10px_rgba(58,184,131,0.4)]"
                >
                  <svg
                    className="w-7 h-7 min-[400px]:w-8 min-[400px]:h-8 sm:w-11 sm:h-11 lg:w-14 lg:h-14 filter drop-shadow-sm"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M52 24C52 24 46 22 42 26C38 30 36 34 32 34C28 34 24 30 20 30C16 30 14 34 14 42C14 48 18 52 22 52H46C50 52 54 48 54 42V32C54 28 56 26 56 26L52 24Z"
                      fill="url(#dinoMascotGradient)"
                    />
                    <path
                      d="M22 52V58M32 52V58M42 52V58M48 52V58"
                      stroke="#3AB883"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M48 32C48 30.3431 46.6569 29 45 29C43.3431 29 42 30.3431 42 32C42 33.6569 43.3431 35 45 35C46.6569 35 48 33.6569 48 32Z"
                      fill="#1E293B"
                    />
                    <path
                      d="M52 22C54 18 58 14 58 14C58 14 54 16 50 18"
                      stroke="#8DE4BF"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="dinoMascotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8DE4BF" />
                        <stop offset="100%" stopColor="#3AB883" />
                      </linearGradient>
                    </defs>
                  </svg>
                </motion.div>
              </motion.span>
            </h1>

            </div>

          </motion.div>

        </div>
      </div>

    </section>
  );
}
