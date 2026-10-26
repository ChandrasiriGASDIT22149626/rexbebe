'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';

interface HeaderLogoProps {
  className?: string;
  imgClassName?: string;
}

export function HeaderLogo({
  className = '',
  imgClassName = 'w-28 min-[400px]:w-36 md:w-44 lg:w-32 xl:w-40 2xl:w-48',
}: HeaderLogoProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`relative flex-shrink-0 group select-none ${className}`}>
      {/* Continuous Gentle Floating & Breathing Animation */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: [0, -3.5, 0],
                scale: [1, 1.018, 1],
              }
        }
        transition={{
          duration: 4.2,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
        whileHover={{
          scale: 1.04,
          y: -4,
          transition: { duration: 0.22, ease: 'easeOut' },
        }}
        whileTap={{
          scale: 0.97,
          transition: { duration: 0.12 },
        }}
        className="relative inline-block overflow-visible"
      >
        <Link
          href="/"
          aria-label="REXBEBE Home"
          className="block focus:outline-none transition-all relative"
        >
          {/* Ambient Glow Pulse Layer */}
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    filter: [
                      'drop-shadow(0 2px 6px rgba(255, 255, 255, 0.5))',
                      'drop-shadow(0 4px 14px rgba(245, 158, 11, 0.25))',
                      'drop-shadow(0 2px 6px rgba(255, 255, 255, 0.5))',
                    ],
                  }
            }
            transition={{
              duration: 5.5,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            }}
            className="relative"
          >
            {/* Pure 100% Transparent REXBEBE Mascot Logo Image */}
            <Image
              src="/images/logo.png"
              alt="REXBEBE"
              width={433}
              height={162}
              priority
              className={`${imgClassName} h-auto object-contain transition-all duration-300 filter drop-shadow-xs`}
            />

            {/* Subtle Light Reflection Glint Sweeping Across Logo */}
            {!shouldReduceMotion && (
              <motion.div
                initial={{ x: '-130%', opacity: 0 }}
                animate={{
                  x: ['-130%', '220%'],
                  opacity: [0, 0.18, 0.35, 0.18, 0],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  repeatDelay: 5,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-amber-200/40 to-transparent skew-x-[-22deg]"
              />
            )}
          </motion.div>
        </Link>
      </motion.div>
    </div>
  );
}
