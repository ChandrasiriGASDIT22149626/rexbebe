'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ProductImage } from '../../types/product';
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface ProductGalleryProps {
  images: ProductImage[];
  productName?: string;
  activeImageUrl?: string | null;
  activePartName?: string;
  activeColorName?: string;
  hasAuthenticImage?: boolean;
}

export function ProductGallery({
  images,
  productName = 'REXBEBE Boutique Item',
  activeImageUrl,
  activePartName,
  activeColorName,
  hasAuthenticImage = true,
}: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string>(
    activeImageUrl || images[0]?.url || '/images/products/organic-onesie.jpg'
  );

  // Full-screen / Inspection Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);

  // Sync when parent changes active image (e.g., colour selection)
  useEffect(() => {
    if (activeImageUrl) {
      setSelectedImage(activeImageUrl);
    }
  }, [activeImageUrl]);

  // Sync if images array changes
  useEffect(() => {
    if (images.length > 0 && !images.some((img) => img.url === selectedImage)) {
      setSelectedImage(images[0].url);
    }
  }, [images, selectedImage]);

  // Current active image metadata
  const currentImageObj = images.find((img) => img.url === selectedImage);
  const currentAlt =
    currentImageObj?.alt || `${productName} detailed preview`;

  // Find index for next/prev navigation
  const currentIndex = images.findIndex((img) => img.url === selectedImage);

  const handleNextImage = useCallback(() => {
    if (images.length <= 1) return;
    const nextIdx = (currentIndex + 1) % images.length;
    setSelectedImage(images[nextIdx].url);
    setLightboxZoom(1);
  }, [currentIndex, images]);

  const handlePrevImage = useCallback(() => {
    if (images.length <= 1) return;
    const prevIdx = (currentIndex - 1 + images.length) % images.length;
    setSelectedImage(images[prevIdx].url);
    setLightboxZoom(1);
  }, [currentIndex, images]);

  // Keyboard navigation when Lightbox is active
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
        setLightboxZoom(1);
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handleNextImage, handlePrevImage]);

  return (
    <div className="space-y-4">
      {/* 
        MAIN PRODUCT IMAGE CONTAINER:
        - Spacious, generous presentation with high visual quality.
        - Strictly object-contain so NO part of the baby, head, feet, clothing or accessories is cropped.
        - Preserves exact aspect ratio without stretching, squeezing, or distortion.
      */}
      <div className="relative w-full aspect-[4/5] sm:aspect-square md:aspect-[4/5] lg:aspect-square min-h-[460px] sm:min-h-[540px] lg:min-h-[620px] max-h-[760px] rounded-3xl bg-white border border-stone-200/90 shadow-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden group">
        {/* Full-screen Zoom trigger button */}
        <button
          type="button"
          onClick={() => {
            setIsLightboxOpen(true);
            setLightboxZoom(1);
          }}
          className="absolute top-4 right-4 z-10 p-2.5 sm:p-3 rounded-full bg-white/95 backdrop-blur-md shadow-md text-stone-700 hover:text-pink-600 hover:scale-105 transition-all border border-stone-200/80 focus:outline-hidden"
          title="Zoom & Inspect Details"
          aria-label="Open full-screen image inspect viewer"
        >
          <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Color / Variant Badge if available */}
        <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-1">
          {currentImageObj?.colorName ? (
            <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-stone-200/80 text-xs font-black text-stone-800 flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              <span>{currentImageObj.colorName}</span>
              {activePartName && <span className="text-stone-400 font-normal">({activePartName})</span>}
            </div>
          ) : activeColorName ? (
            <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-stone-200/80 text-xs font-black text-stone-800 flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              <span>{activeColorName}</span>
              {activePartName && <span className="text-stone-400 font-normal">({activePartName})</span>}
            </div>
          ) : null}

          {/* Indicator if viewing base photo while custom part variation is selected without separate asset */}
          {activeColorName && !hasAuthenticImage && currentImageObj?.colorName?.toLowerCase() !== activeColorName.toLowerCase() && (
            <div className="px-2.5 py-1 rounded-full bg-amber-500/90 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs">
              Base set view • {activePartName || 'Component'}: {activeColorName}
            </div>
          )}
        </div>

        {/* Clickable Image Viewport with object-contain */}
        <div
          onClick={() => {
            setIsLightboxOpen(true);
            setLightboxZoom(1);
          }}
          className="relative w-full h-full flex items-center justify-center cursor-zoom-in"
          title="Click to zoom and inspect clothing details"
        >
          <Image
            src={selectedImage}
            alt={currentAlt}
            fill
            className="object-contain object-center transition-transform duration-300 group-hover:scale-[1.02]"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 55vw, 680px"
          />
        </div>

        {/* Previous / Next Floating Arrows for Multi-image products */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              aria-label="Previous view"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 backdrop-blur-md border border-stone-200 shadow-sm text-stone-700 hover:text-pink-600 hover:scale-105 opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              aria-label="Next view"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 backdrop-blur-md border border-stone-200 shadow-sm text-stone-700 hover:text-pink-600 hover:scale-105 opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* 
        THUMBNAIL GALLERY:
        - Large, clearly visible thumbnails.
        - Uses object-contain so all views and colorways are seen in full without clipping.
        - Shows color label when present.
      */}
      {images.length > 1 && (
        <div className="space-y-1.5">
          <div className="flex space-x-3 sm:space-x-4 overflow-x-auto touch-scroll no-scrollbar py-1 px-0.5">
            {images.map((img, idx) => {
              const isSelected = selectedImage === img.url;
              return (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setSelectedImage(img.url)}
                  aria-label={`View photo ${idx + 1} (${img.colorName || 'standard'}) of ${productName}`}
                  className={`relative w-20 sm:w-24 h-20 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all p-1 bg-stone-50 flex items-center justify-center ${
                    isSelected
                      ? 'border-pink-600 ring-3 ring-pink-100 scale-102 bg-white'
                      : 'border-stone-200 opacity-75 hover:opacity-100 hover:border-stone-300'
                  }`}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={img.url}
                      alt={img.alt || `${productName} thumbnail ${idx + 1}`}
                      fill
                      className="object-contain object-center"
                      sizes="96px"
                    />
                  </div>
                  {img.colorName && (
                    <span className="absolute bottom-1 inset-x-1 text-[9px] font-black uppercase text-center bg-stone-900/80 text-white rounded-md py-0.5 backdrop-blur-xs truncate px-1">
                      {img.colorName}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <span className="text-[11px] text-stone-400 block">
            Click any thumbnail to preview full clothing design • Click photo to zoom
          </span>
        </div>
      )}

      {/* 
        FULL-SCREEN LIGHTBOX / DETAIL INSPECTION VIEWER
        Allows customers to closely inspect seams, stitches, prints, and fabric texture.
      */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="High-resolution image detail inspect viewer"
          className="fixed inset-0 z-50 bg-stone-950/92 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 transition-opacity animate-in fade-in duration-200"
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between z-20 pb-2 border-b border-stone-800/80">
            <div className="text-white space-y-0.5">
              <h3 className="text-sm sm:text-base font-black truncate max-w-xs sm:max-w-md font-heading">
                {productName}
              </h3>
              <p className="text-[11px] text-stone-400">
                {currentImageObj?.colorName ? `Colour: ${currentImageObj.colorName} • ` : ''}
                Inspecting high-resolution fabric &amp; print details
              </p>
            </div>

            {/* Zoom Controls & Close */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center bg-stone-900/90 rounded-full border border-stone-800 px-2 sm:px-3 py-1 space-x-1 sm:space-x-2 text-stone-300 text-xs">
                <button
                  type="button"
                  onClick={() => setLightboxZoom((z) => Math.max(1, z - 0.5))}
                  disabled={lightboxZoom <= 1}
                  className="p-1 hover:text-white disabled:opacity-30 transition-colors"
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs w-12 text-center text-white">
                  {Math.round(lightboxZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxZoom((z) => Math.min(3, z + 0.5))}
                  disabled={lightboxZoom >= 3}
                  className="p-1 hover:text-white disabled:opacity-30 transition-colors"
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxZoom(1)}
                  className="p-1 text-[11px] text-stone-400 hover:text-white border-l border-stone-700 pl-2 transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setLightboxZoom(1);
                }}
                className="p-2 sm:p-2.5 rounded-full bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition-colors"
                title="Close Viewer (Esc)"
                aria-label="Close Viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Central Full-View Viewport */}
          <div className="relative flex-1 w-full overflow-auto flex items-center justify-center p-2 sm:p-4 my-2">
            <div
              style={{
                transform: `scale(${lightboxZoom})`,
                transformOrigin: 'center center',
              }}
              className="relative w-full h-full max-w-4xl max-h-[75vh] flex items-center justify-center transition-transform duration-150"
            >
              <Image
                src={selectedImage}
                alt={currentAlt}
                fill
                className="object-contain object-center"
                sizes="100vw"
                priority
              />
            </div>

            {/* Navigation Arrows inside Lightbox */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  aria-label="Previous view"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-stone-700/80 shadow-lg transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="Next view"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-stone-700/80 shadow-lg transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Footer Thumbnails */}
          {images.length > 1 && (
            <div className="z-20 pt-2 border-t border-stone-800/80 flex justify-center">
              <div className="flex space-x-2 sm:space-x-3 overflow-x-auto touch-scroll py-1 max-w-full">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedImage(img.url);
                      setLightboxZoom(1);
                    }}
                    className={`relative w-14 sm:w-16 h-14 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all p-1 bg-stone-900 ${
                      selectedImage === img.url
                        ? 'border-pink-500 ring-2 ring-pink-500/40'
                        : 'border-stone-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={img.url}
                        alt={`View ${idx + 1}`}
                        fill
                        className="object-contain"
                        sizes="64px"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
