'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, ProductVariant } from '../../types/product';
import { useCart } from '../../hooks/useCart';
import { WishlistButton } from './WishlistButton';
import { QuickViewModal } from './QuickViewModal';
import { InstallmentBadges } from './InstallmentBadges';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export const ProductCard = React.memo(function ProductCard({
  product,
  priority = false,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isImgLoaded, setIsImgLoaded] = useState(false);
  const [sizePromptFlash, setSizePromptFlash] = useState(false);

  // Extract all images
  const images = useMemo(() => {
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    return [{ id: 'img-fallback', url: '/images/products/organic-onesie.webp', alt: product.name, position: 0 }];
  }, [product.images, product.name]);

  // Extract all configured sizes for this product from variants and product.sizes
  const configuredSizes = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    // 1. From product.sizes if explicitly declared
    if (product.sizes && Array.isArray(product.sizes)) {
      product.sizes.forEach((s) => {
        if (s && !seen.has(s.trim())) {
          seen.add(s.trim());
          list.push(s.trim());
        }
      });
    }

    // 2. From product.variants
    (product.variants || []).forEach((v) => {
      if (v.size && !seen.has(v.size.trim())) {
        seen.add(v.size.trim());
        list.push(v.size.trim());
      }
    });

    return list;
  }, [product.sizes, product.variants]);

  // Selected size state
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Calculate total stock from variants or top-level product
  const totalStock = useMemo(() => {
    if (typeof product.stockQuantity === 'number') {
      return product.stockQuantity;
    }
    return (product.variants || []).reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
  }, [product.stockQuantity, product.variants]);

  const isSoldOut = totalStock <= 0;

  // Determine stock availability per size
  const isSizeAvailable = (size: string): boolean => {
    if (isSoldOut) return false;
    const variants = (product.variants || []).filter(
      (v) => v.size?.toLowerCase() === size.toLowerCase()
    );
    if (variants.length === 0) {
      // If variant has no specific size track, check product overall stock
      return totalStock > 0;
    }
    return variants.some((v) => (v.stockQuantity ?? 0) > 0);
  };

  // Find active variant based on selected size
  const activeVariant: ProductVariant = useMemo(() => {
    const variants = product.variants || [];
    if (selectedSize) {
      const match = variants.find(
        (v) => v.size?.toLowerCase() === selectedSize.toLowerCase() && (v.stockQuantity ?? 0) > 0
      ) || variants.find((v) => v.size?.toLowerCase() === selectedSize.toLowerCase());
      if (match) return match;
    }

    return variants[0] || {
      id: `var-default-${product.id}`,
      sku: product.sku || 'REX-STD',
      price: product.price,
      stockQuantity: totalStock,
    };
  }, [product.variants, product.id, product.sku, product.price, selectedSize, totalStock]);

  // Resolve thumbnail variant for light rendering
  const getCardThumbnailUrl = (url: string) => {
    if (!url) return '/images/products/organic-onesie.webp';
    if (url.includes('-thumb.')) return url;
    if (url.endsWith('.webp')) return url.replace('.webp', '-thumb.webp');
    if (url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png')) {
      return url.replace(/\.[^.]+$/, '-thumb.webp');
    }
    return url;
  };

  // Current primary and secondary image URLs
  const primaryImageUrl = images[activeImageIndex]?.url || images[0]?.url || '/images/products/organic-onesie.webp';
  const secondaryImageUrl = images.length > 1 ? images[1]?.url : primaryImageUrl;

  const [currentImgSrc, setCurrentImgSrc] = useState<string>(() => getCardThumbnailUrl(primaryImageUrl));

  useEffect(() => {
    setCurrentImgSrc(getCardThumbnailUrl(primaryImageUrl));
  }, [primaryImageUrl]);

  // Sale calculations
  const isSaleActive = Boolean(
    (product.isSaleBadge ?? true) &&
    product.comparePrice &&
    product.comparePrice > product.price &&
    (!product.saleStartDate || new Date(product.saleStartDate) <= new Date()) &&
    (!product.saleEndDate || new Date(product.saleEndDate) >= new Date())
  );

  // Handle Add to Cart: Opens product options selection screen
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSoldOut) return;

    // Open options selection modal so customer selects required size, colour, quantity, and can proceed to checkout
    setIsQuickViewOpen(true);
  };

  // Carousel arrow handlers
  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setActiveImageIndex(0);
        }}
        className="group relative flex flex-col w-full bg-white dark:bg-slate-900 text-left transition-all duration-200"
      >
        {/* =========================================================================
            1. PRODUCT IMAGE CONTAINER (Consistent Portrait 4:5, Uncropped Aspect Ratio)
           ========================================================================= */}
        <div className="relative w-full aspect-[4/5] bg-[#F8F8F8] dark:bg-slate-800 overflow-hidden cursor-pointer select-none">
          <Link
            href={`/products/${product.slug}`}
            className="block relative w-full h-full p-1.5 sm:p-2"
            aria-label={`View ${product.name}`}
          >
            {/* Shimmer Placeholder while loading */}
            {!isImgLoaded && (
              <div className="absolute inset-0 bg-neutral-200/50 dark:bg-slate-700/50 animate-pulse pointer-events-none" />
            )}

            {/* Primary Product Image */}
            <Image
              src={currentImgSrc}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              loading={priority ? undefined : 'lazy'}
              decoding="async"
              onLoad={() => setIsImgLoaded(true)}
              className={`w-full h-full object-contain object-center pointer-events-none transition-opacity duration-300 ease-in-out ${
                isHovered && images.length > 1 && activeImageIndex === 0 ? 'opacity-0' : 'opacity-100'
              }`}
              onError={() => {
                setIsImgLoaded(true);
                if (currentImgSrc.includes('-thumb.')) {
                  setCurrentImgSrc(primaryImageUrl);
                } else if (currentImgSrc !== '/images/products/organic-onesie.webp') {
                  setCurrentImgSrc('/images/products/organic-onesie.webp');
                }
              }}
            />

            {/* Secondary Image on Hover for Smooth Fashion Lookbook Swap */}
            {images.length > 1 && (
              <Image
                src={getCardThumbnailUrl(secondaryImageUrl)}
                alt={`${product.name} secondary view`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
                decoding="async"
                className={`w-full h-full object-contain object-center pointer-events-none transition-opacity duration-300 ease-in-out ${
                  isHovered && activeImageIndex === 0 ? 'opacity-100' : 'opacity-0'
                }`}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )}
          </Link>

          {/* =========================================================================
              2. STOCK AVAILABILITY BADGE (Top-Left: Teal 'In stock' or Dark 'Sold out')
             ========================================================================= */}
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
            {isSoldOut ? (
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-neutral-800 text-white text-[10px] sm:text-[11px] font-medium tracking-wide uppercase">
                Sold out
              </span>
            ) : (
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#00A699] text-white text-[10px] sm:text-[11px] font-medium tracking-wide">
                In stock
              </span>
            )}
          </div>

          {/* =========================================================================
              3. ACTION BUTTONS (Top-Right: Wishlist Heart & Quick View)
             ========================================================================= */}
          <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5 items-center">
            {/* Wishlist Button */}
            <div className="transition-transform duration-200 hover:scale-105">
              <WishlistButton
                productId={product.id}
                product={product}
                className="w-8 h-8 sm:w-9 sm:h-9 !bg-white/95 hover:!bg-white text-neutral-700 shadow-sm flex items-center justify-center !p-0"
              />
            </div>

            {/* Quick View Eye Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsQuickViewOpen(true);
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 bg-white/95 hover:bg-white text-neutral-700 hover:text-black rounded-full shadow-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105"
              title="Quick view"
              aria-label={`Quick view ${product.name}`}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {/* =========================================================================
              4. IMAGE CAROUSEL ARROWS (Bottom-Right: Shown on hover when multiple images)
             ========================================================================= */}
          {images.length > 1 && (
            <div className="absolute bottom-2.5 right-2.5 z-10 hidden sm:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={handlePrevImage}
                className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-neutral-800 shadow-sm flex items-center justify-center transition-transform active:scale-90"
                aria-label="Previous image"
                title="Previous image"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-neutral-800 shadow-sm flex items-center justify-center transition-transform active:scale-90"
                aria-label="Next image"
                title="Next image"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* =========================================================================
              5. DESKTOP HOVER SLIDE-UP ACTION BAR (Quick Add)
             ========================================================================= */}
          <div className="absolute inset-x-0 bottom-0 p-2.5 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out hidden sm:flex items-center gap-2 bg-gradient-to-t from-black/60 via-black/25 to-transparent">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsQuickViewOpen(true);
              }}
              className="flex-1 py-2 px-2 bg-white/95 hover:bg-white text-neutral-900 text-xs font-semibold uppercase tracking-wider rounded-none transition-all shadow-sm flex items-center justify-center space-x-1.5 active:scale-98"
              title="View Product"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View</span>
            </button>

            {!isSoldOut && (
              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={isAdding}
                className={`flex-1 py-2 px-2 text-xs font-semibold uppercase tracking-wider rounded-none transition-all shadow-sm flex items-center justify-center space-x-1.5 active:scale-98 ${
                  isAdding
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-900 hover:bg-black text-white'
                }`}
                title="Add to Cart"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isAdding ? 'Added ✓' : 'Add to Cart'}</span>
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            6. PRODUCT DETAILS SECTION (Directly Beneath Image, Matching Reference)
           ========================================================================= */}
        <div className="pt-2.5 sm:pt-3 pb-1 flex flex-col space-y-1">
          {/* Product Name (Title Case, Clean Sans-Serif, Regular Weight) */}
          <Link href={`/products/${product.slug}`} className="block group/link">
            <h3 className="text-[13px] sm:text-[14px] md:text-[15px] font-normal text-neutral-800 dark:text-neutral-200 capitalize truncate group-hover/link:text-black dark:group-hover/link:text-white transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Pricing Row (Bold, Exact Format matching Reference) */}
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
              Rs {product.price.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {isSaleActive && product.comparePrice && (
              <span className="text-xs sm:text-[13px] text-neutral-400 dark:text-neutral-500 line-through">
                Rs {product.comparePrice.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>

          {/* Installment Subtext (Dynamic 3 installments + Mintpay & Koko Logos) */}
          <InstallmentBadges price={product.price} currencyPrefix="Rs" />

          {/* =========================================================================
              7. PRODUCT SIZE SELECTOR (Beneath Installments, Matching Reference)
             ========================================================================= */}
          {configuredSizes.length > 0 && (
            <div
              className={`pt-2 flex flex-wrap gap-1 sm:gap-1.5 items-center transition-all ${
                sizePromptFlash ? 'ring-2 ring-amber-400 rounded-sm p-0.5' : ''
              }`}
            >
              {configuredSizes.map((size) => {
                const available = isSizeAvailable(size);
                const isSelected = selectedSize?.toLowerCase() === size.toLowerCase();

                return (
                  <button
                    key={size}
                    type="button"
                    disabled={!available}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (available) {
                        setSelectedSize((prev) =>
                          prev?.toLowerCase() === size.toLowerCase() ? null : size
                        );
                      }
                    }}
                    className={`min-w-[28px] sm:min-w-[32px] h-[24px] sm:h-[26px] px-1 sm:px-1.5 text-[10px] sm:text-[11px] flex items-center justify-center transition-all select-none ${
                      isSelected
                        ? 'border-2 border-neutral-900 dark:border-white font-bold text-neutral-900 dark:text-white bg-white dark:bg-slate-800'
                        : available
                        ? 'border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 bg-white dark:bg-slate-900 hover:border-neutral-500'
                        : 'border border-neutral-200 dark:border-neutral-800 text-neutral-300 dark:text-neutral-600 bg-neutral-50 dark:bg-slate-800/40 cursor-not-allowed line-through'
                    }`}
                    title={available ? `Select size ${size}` : `Size ${size} is sold out`}
                    aria-label={`Size ${size}${available ? '' : ' (Sold out)'}`}
                  >
                    {size.replace(/\s*months?/i, 'M')}
                  </button>
                );
              })}
            </div>
          )}

          {/* Mobile Quick Action Buttons (Compact, touch-friendly) */}
          <div className="pt-2 flex sm:hidden items-center justify-between">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsQuickViewOpen(true);
              }}
              className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:text-black uppercase tracking-wider flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Details</span>
            </button>

            {!isSoldOut && (
              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={isAdding}
                className="px-3 py-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-transform"
              >
                <ShoppingBag className="w-3 h-3" />
                <span>{isAdding ? 'Added' : 'Add'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Product Options & Quick View Modal */}
      {isQuickViewOpen && (
        <QuickViewModal
          product={product}
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
          initialSize={selectedSize}
        />
      )}
    </>
  );
});
