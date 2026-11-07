'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Sparkles, ShoppingBag, Tag } from 'lucide-react';

export interface SalePopupData {
  enabled: boolean;
  heading: string;
  subheading: string;
  description: string;
  offerBadge: string;
  discountPercentage: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  promoCode: string;
  minSpend: number;
  imageUrl: string;
  shopNowText: string;
  shopNowHref: string;
  startDate?: string;
  endDate?: string;
  displayDelaySeconds: number;
}

export function SalePopupCard({ forceOpen = false, previewData }: { forceOpen?: boolean; previewData?: SalePopupData | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<SalePopupData | null>(previewData || null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (previewData) {
      setData(previewData);
      setIsOpen(true);
      return;
    }

    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    // Check session storage so popup is not shown repeatedly on every navigation
    const isDismissed = sessionStorage.getItem('rexbebe_sale_popup_dismissed');
    if (isDismissed) return;

    let timeoutId: NodeJS.Timeout;

    // Fetch live promotional popup settings from backend
    fetch('/api/promotions/popup')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data && json.data.enabled) {
          setData(json.data);
          const delay = (json.data.displayDelaySeconds || 2) * 1000;
          timeoutId = setTimeout(() => {
            setIsOpen(true);
          }, delay);
        }
      })
      .catch((err) => {
        console.warn('[SalePopupCard] Notice fetching popup config:', err);
      });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [forceOpen, previewData]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (!previewData && !forceOpen) {
      try {
        sessionStorage.setItem('rexbebe_sale_popup_dismissed', 'true');
      } catch (_) {}
    }
  }, [forceOpen, previewData]);

  const handleCopyCode = useCallback(() => {
    if (!data?.promoCode) return;
    try {
      navigator.clipboard.writeText(data.promoCode);
      setCopied(true);
      sessionStorage.setItem('rexbebe_applied_promo', data.promoCode);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  }, [data?.promoCode]);

  const handleShopNow = useCallback(() => {
    if (data?.promoCode) {
      try {
        sessionStorage.setItem('rexbebe_applied_promo', data.promoCode);
      } catch (_) {}
    }
    handleClose();
  }, [data?.promoCode, handleClose]);

  if (!isOpen || !data) return null;

  const displayImage = data.imageUrl || '/images/products/cocomelon-pink-folded-tshirt.jpg';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300">
        {/* Backdrop click to dismiss */}
        <div className="fixed inset-0" onClick={handleClose} aria-hidden="true" />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-lg md:max-w-2xl bg-gradient-to-br from-pink-50/95 via-purple-50/90 to-white dark:from-slate-900 dark:via-purple-950/40 dark:to-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-pink-200/80 dark:border-slate-800 flex flex-col md:flex-row z-10 my-auto"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            aria-label="Close promotional popup"
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white shadow-md flex items-center justify-center transition-all focus:outline-none hover:scale-105 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>

          {/* LEFT SECTION (Mobile: Top Banner, Desktop: Left Column) */}
          <div className="relative w-full md:w-5/12 h-52 sm:h-60 md:h-auto min-h-[220px] md:min-h-[380px] bg-pink-100/60 dark:bg-slate-800 shrink-0 overflow-hidden">
            <Image
              src={displayImage}
              alt={data.heading || 'REXBEBE Baby Clothing Sale'}
              fill
              className="object-cover object-[center_55%] md:object-[48%_center]"
              sizes="(max-width: 768px) 100vw, 320px"
              priority
            />
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-pink-900/30 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-pink-950/10" />

            {/* Offer Badge Overlay on Image */}
            <div className="absolute bottom-3 left-3 md:top-4 md:left-4 md:bottom-auto">
              <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 text-pink-600 dark:text-pink-400 font-extrabold text-[11px] sm:text-xs shadow-md border border-pink-200/80 dark:border-pink-900/60 backdrop-blur-sm">
                <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                <span>{data.offerBadge || `${data.discountPercentage}% OFF`}</span>
              </span>
            </div>
          </div>

          {/* RIGHT SECTION: Offer Details & Actions */}
          <div className="w-full md:w-7/12 p-6 sm:p-7 md:p-8 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              {/* Cute Subheading Pill */}
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                <Tag className="w-3 h-3" />
                <span>{data.subheading || 'SPECIAL OFFER'}</span>
              </div>

              {/* Main Heading */}
              <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                {data.heading || 'LITTLE ONES SALE!'}
              </h2>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {data.description || 'Enjoy special discounts on selected baby clothing! Soft organic cashmere rompers & pastel sets for your little darling.'}
              </p>
            </div>

            {/* Promo Code & Copy Code Section */}
            <div className="space-y-3 pt-1">
              <div className="bg-white/90 dark:bg-slate-800/90 rounded-2xl p-3 border-2 border-dashed border-pink-300 dark:border-pink-800 shadow-xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                    Use Promo Code
                  </span>
                  <span className="font-mono text-base sm:text-lg font-black text-pink-600 dark:text-pink-400 tracking-wider">
                    {data.promoCode}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-200 dark:shadow-none'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied! ✨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <Link
                  href={data.shopNowHref || '/sale'}
                  onClick={handleShopNow}
                  className="w-full inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{data.shopNowText || 'Shop Now 🌸'}</span>
                </Link>

                <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
                  {data.minSpend > 0 ? `Valid on orders over LKR ${data.minSpend.toLocaleString()}.` : 'Discount automatically applied at checkout.'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


export default SalePopupCard;
