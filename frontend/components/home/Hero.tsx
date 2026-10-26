'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useAdminData } from '../../hooks/AdminContext';

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
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
      className="relative min-h-[85vh] lg:min-h-[92vh] w-full overflow-hidden flex items-center justify-center select-none bg-[#EAF7FD]"
    >
      {/* ========================================================================= */}
      {/* 1. LAYER 0: FULL-WIDTH 3D ENVIRONMENT BACKGROUND & ATMOSPHERE            */}
      {/* ========================================================================= */}
      <motion.div
        style={{ x: bgX, y: bgY }}
        className="absolute inset-0 w-[108%] h-[108%] -left-[4%] -top-[4%] z-0"
      >
        <Image
          src="/images/hero/world_bg.jpg"
          alt="REXBEBE 3D Pastel World"
          fill
          priority
          className="object-cover object-center transform scale-105 filter brightness-[1.02] contrast-[1.01]"
        />

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
      <motion.div style={{ x: midX, y: midY }} className="absolute inset-0 z-10 pointer-events-none">
        
        {/* Drifting Cloud 1 */}
        <motion.div
          animate={{ x: ['-10%', '110%'] }}
          transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
          className="absolute top-12 left-0 w-64 h-32 opacity-80 filter drop-shadow-md"
        >
          <svg viewBox="0 0 200 100" className="w-full h-full fill-white/90">
            <path d="M30 60 Q20 30 50 30 Q70 10 100 20 Q130 10 150 35 Q180 35 170 65 Q180 90 140 85 Q110 95 80 85 Q40 95 30 60 Z" />
          </svg>
        </motion.div>

        {/* Drifting Cloud 2 */}
        <motion.div
          animate={{ x: ['110%', '-20%'] }}
          transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
          className="absolute top-28 right-0 w-80 h-40 opacity-70 filter drop-shadow-sm"
        >
          <svg viewBox="0 0 200 100" className="w-full h-full fill-white/80">
            <path d="M25 55 Q15 25 45 25 Q65 5 95 15 Q125 5 145 30 Q175 30 165 60 Q175 85 135 80 Q105 90 75 80 Q35 90 25 55 Z" />
          </svg>
        </motion.div>

        {/* Floating Pastel Hot Air Balloon */}
        <motion.div
          animate={{
            y: [0, -18, 0],
            rotate: [-2, 2, -2],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-16 right-[22%] w-24 h-32 hidden md:block filter drop-shadow-lg"
        >
          <div className="relative w-full h-full">
            <div className="w-20 h-24 rounded-full bg-gradient-to-tr from-sky-300 via-pink-200 to-amber-200 border-2 border-white flex items-center justify-center shadow-lg">
              <div className="w-full h-full rounded-full opacity-30 bg-[radial-gradient(circle,_transparent_30%,_#fff_70%)]" />
            </div>
            <div className="w-6 h-6 bg-amber-700/80 rounded-sm mx-auto -mt-2 border border-white shadow-md" />
          </div>
        </motion.div>

      </motion.div>

      {/* ========================================================================= */}
      {/* 3. LAYER 2: INTERACTIVE CHARACTERS (REXBEBE DINO & KITTY MASCOT)         */}
      {/* ========================================================================= */}
      <motion.div style={{ x: charX, y: charY }} className="absolute inset-0 z-20 pointer-events-none">
        
        {/* REXBEBE 3D Dinosaur Mascot Character */}
        <div className="absolute bottom-2 right-2 sm:bottom-6 sm:right-[4%] lg:right-[8%] w-[160px] min-[400px]:w-[200px] sm:w-[320px] lg:w-[440px] aspect-square pointer-events-auto group cursor-pointer">
          
          {/* Interactive Speech Bubble */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            key={speechBubbleText}
            transition={{ type: 'spring', damping: 15 }}
            className="absolute -top-12 sm:-top-12 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-2xl shadow-rexbebe-3d border-2 border-sky-200 text-slate-800 text-[11px] sm:text-xs md:text-sm font-bold flex items-center space-x-2 whitespace-normal sm:whitespace-nowrap max-w-[190px] sm:max-w-none text-center sm:text-left z-30"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
            <span className="truncate sm:overflow-visible">{speechBubbleText}</span>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white" />
          </motion.div>

          {/* Dinosaur 3D Character Render */}
          <motion.div
            animate={
              isHoveredDino
                ? { y: [0, -25, 0], rotate: [0, -5, 5, 0], scale: 1.05 }
                : { y: [0, -12, 0], rotate: [-1.5, 1.5, -1.5], scale: 1 }
            }
            transition={{
              duration: isHoveredDino ? 0.6 : 4,
              repeat: isHoveredDino ? 1 : Infinity,
              ease: 'easeInOut',
            }}
            onMouseEnter={handleDinoHover}
            onMouseLeave={() => setIsHoveredDino(false)}
            className="relative w-full h-full drop-shadow-2xl"
          >
            <Image
              src="/images/hero/dino_mascot.png"
              alt="REXBEBE Mascot Dino"
              fill
              className="object-contain"
              priority
            />
          </motion.div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 h-6 bg-slate-900/15 rounded-full blur-md animate-pulse-soft" />
        </div>

        {/* Cute Kitten Mascot Companion */}
        <div className="absolute bottom-4 right-[32%] lg:right-[36%] w-[160px] sm:w-[210px] aspect-square hidden sm:block pointer-events-auto cursor-pointer">
          <motion.div
            animate={
              isHoveredKitty
                ? { y: [0, -18, 0], rotate: [0, 8, -8, 0] }
                : { y: [0, -8, 0], rotate: [1, -1, 1] }
            }
            transition={{
              duration: isHoveredKitty ? 0.5 : 3.5,
              repeat: isHoveredKitty ? 1 : Infinity,
              ease: 'easeInOut',
            }}
            onMouseEnter={() => setIsHoveredKitty(true)}
            onMouseLeave={() => setIsHoveredKitty(false)}
            className="relative w-full h-full drop-shadow-xl"
          >
            <Image
              src="/images/hero/kitty_mascot.png"
              alt="REXBEBE Companion Kitty"
              fill
              className="object-contain"
            />
          </motion.div>

          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900/15 rounded-full blur-sm" />
        </div>

      </motion.div>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 4. HERO CONTENT OVERLAY (NATURALLY BLENDED STORYBOOK TITLE & COPY)        */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full relative z-30">
        <div className="max-w-xl lg:max-w-2xl">
          
          {/* Box removed: Typography floats directly on the landscape artwork */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Headline Section: 3D Glossy Inflatable Balloon Typography in Baby Pink & Baby Green */}
            <div className="space-y-1 sm:space-y-2 relative">
              
              {/* Cute Floating Pastel Cherry Blossom & Heart Accents matching the reference vibe */}
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [-5, 5, -5] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-7 -left-3 text-lg sm:text-2xl pointer-events-none select-none filter drop-shadow-sm opacity-90"
              >
                🌸
              </motion.div>

              <motion.div
                animate={{ y: [0, -6, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
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
                  className="balloon-text-pink text-4xl min-[400px]:text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.15] block"
                >
                  {hero.headlineLine1 || 'Little Moments'}
                </motion.span>

                <motion.span
                  initial={{ opacity: 0, y: 15, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="balloon-text-green text-4xl min-[400px]:text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.15] inline-flex items-center space-x-2 sm:space-x-3 pt-1"
                >
                  <span>{hero.headlineLine2 || 'Big Adventures.'}</span>

                {/* Matching 3D Baby Mint Dinosaur Mascot Graphic */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: [0.8, 1, 1.04, 1],
                    y: [0, -3, 0]
                  }}
                  transition={{
                    opacity: { duration: 0.6, delay: 0.3 },
                    scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                    y: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
                  }}
                  className="relative inline-block align-middle ml-1 sm:ml-2 transform -translate-y-1 drop-shadow-[0_4px_10px_rgba(58,184,131,0.4)]"
                >
                  <svg
                    className="w-9 h-9 min-[400px]:w-11 min-[400px]:h-11 sm:w-16 sm:h-16 filter drop-shadow-sm"
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
