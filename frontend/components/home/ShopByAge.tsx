'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

export interface AgeCategoryItem {
  id: string;
  name: string;
  ageRange: string;
  href: string;
  image: string;
  altText: string;
  // Zigzag layout: Card 1 higher, Card 2 lower, Card 3 higher, Card 4 lower
  desktopOffsetClass: string;
  tabletOffsetClass: string;
  mobileOffsetClass: string;
}

const AGE_CATEGORIES: AgeCategoryItem[] = [
  {
    id: 'age-cat-baby',
    name: 'BABY',
    ageRange: '0–12 Months',
    href: '/baby',
    image: '/images/categories/baby.jpg',
    altText: 'REXBEBE Baby Collection (0–12 Months)',
    desktopOffsetClass: 'lg:-translate-y-5', // Card 1 slightly higher
    tabletOffsetClass: 'md:-translate-y-3',
    mobileOffsetClass: '-translate-y-1',
  },
  {
    id: 'age-cat-toddler',
    name: 'TODDLER',
    ageRange: '1–3 Years',
    href: '/toddler',
    image: '/images/categories/toddler.jpg',
    altText: 'REXBEBE Toddler Collection (1–3 Years)',
    desktopOffsetClass: 'lg:translate-y-6', // Card 2 slightly lower
    tabletOffsetClass: 'md:translate-y-3',
    mobileOffsetClass: 'translate-y-1',
  },
  {
    id: 'age-cat-preschool',
    name: 'PRE-SCHOOL',
    ageRange: '3–5 Years',
    href: '/pre-school',
    image: '/images/categories/pre-school.jpg',
    altText: 'REXBEBE Pre-School Collection (3–5 Years)',
    desktopOffsetClass: 'lg:-translate-y-5', // Card 3 slightly higher
    tabletOffsetClass: 'md:-translate-y-3',
    mobileOffsetClass: '-translate-y-1',
  },
  {
    id: 'age-cat-middle-childhood',
    name: 'MIDDLE CHILDHOOD',
    ageRange: '6–10 Years',
    href: '/middle-childhood',
    image: '/images/categories/middle-childhood.jpg',
    altText: 'REXBEBE Middle Childhood Collection (6–10 Years)',
    desktopOffsetClass: 'lg:translate-y-6', // Card 4 slightly lower
    tabletOffsetClass: 'md:translate-y-3',
    mobileOffsetClass: 'translate-y-1',
  },
];

export function ShopByAge() {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      ref={sectionRef}
      className="py-12 sm:py-16 lg:py-20 relative overflow-hidden bg-white border-b border-neutral-100"
      aria-label="Shop By Age Category"
    >
      {/* Expanded outer container with 16–24px horizontal padding to maximize screen width usage */}
      <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-4 lg:px-5 xl:px-6">
        
        {/* Section Header - Rendered immediately on first load */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 lg:mb-14">
          {/* Subtle Stage Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-pink-200/70 shadow-xs mb-3.5">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-700 font-heading">
              Curated By Stage
            </span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 uppercase">
            <span className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 bg-clip-text text-transparent">
              SHOP BY AGE
            </span>
          </h2>

          <p className="text-neutral-500 text-xs sm:text-sm font-medium mt-2 max-w-lg mx-auto">
            Thoughtfully tailored collections designed for every magical step of growing up.
          </p>
        </div>

        {/* 4 Large Full-Width Portrait Cards with Staggered Zigzag Layout - Ready on first paint */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 pt-4 pb-12 lg:pb-20 items-start">
          {AGE_CATEGORIES.map((cat) => {
            const offsetClass = shouldReduceMotion
              ? ''
              : `${cat.desktopOffsetClass} ${cat.tabletOffsetClass} ${cat.mobileOffsetClass}`;

            return (
              <div
                key={cat.id}
                className={`w-full transition-transform duration-500 ease-out ${offsetClass}`}
              >
                <Link
                  href={cat.href}
                  className="group block relative w-full aspect-[400/560] min-h-[300px] sm:min-h-[420px] md:min-h-[480px] lg:min-h-[540px] xl:min-h-[600px] bg-neutral-100 dark:bg-slate-900 overflow-hidden cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.18)]"
                  aria-label={`Shop ${cat.name} (${cat.ageRange})`}
                >
                  {/* Large High-Quality Portrait Image with Cover Fill */}
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <Image
                      src={cat.image}
                      alt={cat.altText}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                      loading="eager"
                      priority={true}
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-106 pointer-events-none"
                    />
                    
                    {/* Subtle Gradient Overlays for Depth & Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 pointer-events-none" />
                  </div>

                  {/* Clean White Translucent Rectangular Category Label Near Bottom */}
                  <div className="absolute bottom-3.5 sm:bottom-5 lg:bottom-6 inset-x-3 sm:inset-x-4 lg:inset-x-5 z-10 pointer-events-none">
                    <div className="bg-white/92 group-hover:bg-white backdrop-blur-md py-2.5 sm:py-3 lg:py-3.5 px-3 sm:px-4 text-center transition-all duration-300 shadow-[0_6px_20px_rgba(0,0,0,0.08)] group-hover:shadow-[0_10px_28px_rgba(0,0,0,0.14)] border border-white/80">
                      <h3 className="text-xs sm:text-sm lg:text-[15px] font-semibold tracking-[0.22em] sm:tracking-[0.25em] text-neutral-900 uppercase transition-all duration-300">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] font-medium tracking-wider text-neutral-500 uppercase mt-0.5">
                        {cat.ageRange}
                      </p>
                    </div>
                  </div>

                  {/* Subtle View Indicator on Hover */}
                  <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 backdrop-blur-md text-neutral-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-sm transform translate-y-1 group-hover:translate-y-0">
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-900" />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default ShopByAge;

