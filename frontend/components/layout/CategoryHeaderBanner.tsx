'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, Image as ImageIcon, X } from 'lucide-react';

export interface SubCategoryOption {
  name: string;
  value: string;
  icon?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface CategoryHeaderBannerProps {
  badge: string;
  title: string;
  highlightWord?: string;
  description: string;
  bannerImage?: string;
  galleryImages?: string[];
  breadcrumbs?: BreadcrumbItem[];
  activeSubCategory?: string;
  subCategories?: SubCategoryOption[];
  onSelectSubCategory?: (value: string) => void;
  totalProducts?: number;
}

export function CategoryHeaderBanner({
  badge,
  title,
  highlightWord,
  description,
  bannerImage,
  galleryImages = [],
  breadcrumbs,
  activeSubCategory = 'all',
  subCategories = [],
  onSelectSubCategory,
  totalProducts,
}: CategoryHeaderBannerProps) {
  const [activeGalleryModal, setActiveGalleryModal] = useState<string | null>(null);

  return (
    <div className="relative overflow-hidden bg-user-pastel-header border-b border-white/60 select-none py-5 sm:py-7 mb-6">
      {/* Background Soft Shader */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/10 to-white/40 backdrop-blur-md pointer-events-none" />

      {/* Floating Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [-4, 4, -4] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-4 left-8 text-2xl opacity-60 hidden sm:block"
        >
          🌸
        </motion.div>
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [5, -5, 5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          className="absolute top-8 right-12 text-2xl opacity-65 hidden sm:block"
        >
          ✨
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-3">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center justify-center flex-wrap gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-widest">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            breadcrumbs.map((b, idx) => (
              <React.Fragment key={b.url + idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="text-slate-800 font-extrabold">{b.name}</span>
                ) : (
                  <Link href={b.url} className="hover:text-pink-600 transition-colors">
                    {b.name}
                  </Link>
                )}
              </React.Fragment>
            ))
          ) : (
            <>
              <Link href="/" className="hover:text-pink-600 transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 font-extrabold">{title}</span>
            </>
          )}
        </nav>

        {/* Optional Uploaded Category Hero Banner Image */}
        {bannerImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto my-3 relative h-48 sm:h-64 md:h-80 w-full rounded-3xl overflow-hidden shadow-md border-2 border-white/80 group"
          >
            <Image
              src={bannerImage}
              alt={title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white drop-shadow-md">
              <span className="text-xs font-bold uppercase tracking-widest bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                Official Atelier Banner
              </span>
            </div>
          </motion.div>
        )}

        {/* Main Title with Pastel Highlight (Reduced size for elegance) */}
        <h1 className="font-heading text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight">
          {(() => {
            const trimmedTitle = title.trim();
            // Case 1: title explicitly includes highlightWord
            if (highlightWord && trimmedTitle.toUpperCase().includes(highlightWord.toUpperCase())) {
              const regex = new RegExp(`\\s*${highlightWord}\\s*`, 'i');
              const base = trimmedTitle.replace(regex, ' ').trim();
              return (
                <>
                  {base && <span className="text-slate-900">{base} </span>}
                  <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-sky-500 bg-clip-text text-transparent">
                    {highlightWord.toUpperCase()}
                  </span>
                </>
              );
            }
            // Case 2: title has multiple words, highlight the last word with gradient
            const words = trimmedTitle.split(/\s+/);
            if (words.length > 1) {
              const lastWord = words[words.length - 1];
              const rest = words.slice(0, -1).join(' ');
              return (
                <>
                  <span className="text-slate-900">{rest} </span>
                  <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-sky-500 bg-clip-text text-transparent">
                    {lastWord}
                  </span>
                </>
              );
            }
            // Case 3: single word
            return <span className="text-slate-900">{trimmedTitle}</span>;
          })()}
        </h1>

        {/* Optional Gallery Lookbook Strip */}
        {galleryImages && galleryImages.length > 0 && (
          <div className="pt-2 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-2 text-xs font-bold text-slate-500 mb-2">
              <ImageIcon className="w-3.5 h-3.5 text-pink-500" />
              <span>COLLECTION GALLERY ({galleryImages.length})</span>
            </div>
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 px-2">
              {galleryImages.map((img, idx) => (
                <button
                  key={img + idx}
                  onClick={() => setActiveGalleryModal(img)}
                  className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 border-white shadow-xs hover:scale-108 transition-all shrink-0 cursor-pointer"
                >
                  <Image src={img} alt={`${title} gallery ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sub-Category Soft 3D Puffy Filter Badges */}
        {subCategories.length > 0 && (
          <div className="pt-2 sm:pt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-3xl mx-auto px-2">
            {subCategories.map((sub) => {
              const isActive = activeSubCategory.toLowerCase() === sub.value.toLowerCase();

              return (
                <button
                  key={sub.value}
                  onClick={() => onSelectSubCategory && onSelectSubCategory(sub.value)}
                  className={`
                    btn-rexbebe-3d px-3.5 sm:px-4 py-2 text-[11px] sm:text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center space-x-1.5 shrink-0 min-h-[36px]
                    ${isActive ? 'btn-3d-pink scale-105 ring-2 ring-pink-300' : 'btn-3d-sky'}
                  `}
                >
                  {sub.icon && <span>{sub.icon}</span>}
                  <span>{sub.name}</span>
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* Gallery Lightbox Modal */}
      <AnimatePresence>
        {activeGalleryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveGalleryModal(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          >
            <div className="relative max-w-3xl max-h-[85vh] w-full aspect-square sm:aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl">
              <Image
                src={activeGalleryModal}
                alt="Enlarged gallery view"
                fill
                className="object-contain"
              />
              <button
                onClick={() => setActiveGalleryModal(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
