'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ShoppingBag, Eye, Heart } from 'lucide-react';
import { Product } from '../../types/product';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCart } from '../../hooks/useCart';
import { WishlistButton } from './WishlistButton';

const QuickViewModal = dynamic(
  () => import('./QuickViewModal').then((m) => m.QuickViewModal),
  { ssr: false }
);

export const ProductCard = React.memo(function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedColorName, setSelectedColorName] = useState<string | null>(null);

  const images = product.images || [];
  const primaryImage = images[0]?.url || '/images/products/organic-onesie.jpg';
  const secondaryImage = images[1]?.url || primaryImage;

  // Resolve colour-specific image if a colour is selected/hovered
  const displayImage = React.useMemo(() => {
    if (!selectedColorName) return primaryImage;
    const matchImg = images.find(
      (img) => img.colorName?.toLowerCase() === selectedColorName.toLowerCase()
    );
    if (matchImg?.url) return matchImg.url;
    const matchVar = product.variants?.find(
      (v) => v.color?.toLowerCase() === selectedColorName.toLowerCase() && v.imageUrl
    );
    return matchVar?.imageUrl || primaryImage;
  }, [selectedColorName, images, product.variants, primaryImage]);

  const [currentImgSrc, setCurrentImgSrc] = useState<string>(displayImage);
  const [currentSecSrc, setCurrentSecSrc] = useState<string>(secondaryImage);

  React.useEffect(() => {
    setCurrentImgSrc(displayImage);
  }, [displayImage]);

  React.useEffect(() => {
    setCurrentSecSrc(secondaryImage);
  }, [secondaryImage]);

  const defaultVariant = product.variants?.[0] || {
    id: `var-default-${product.id}`,
    sku: product.sku || 'REX-STD',
    price: product.price,
    stockQuantity: product.stockQuantity || 0,
  };

  const totalStock = product.stockQuantity ?? (product.variants || []).reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
  const isSoldOut = totalStock <= 0;

  const isSaleActive = Boolean(
    (product.isSaleBadge ?? true) &&
    product.comparePrice &&
    product.comparePrice > product.price &&
    (!product.saleStartDate || new Date(product.saleStartDate) <= new Date()) &&
    (!product.saleEndDate || new Date(product.saleEndDate) >= new Date())
  );

  const discountPercent = isSaleActive && product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  // 3x Buy-Now-Pay-Later installment (e.g. Koko / Mintpay popular in Sri Lanka)
  const installmentAmount = (product.price / 3).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Only display colours that the admin actually configured
  const swatches = React.useMemo(() => {
    if (product.colors && product.colors.length > 0) {
      return product.colors;
    }
    const list: { name: string; hex: string }[] = [];
    const seen = new Set<string>();
    (product.variants || []).forEach((v) => {
      if (v.colorHex && !seen.has(v.colorHex.toLowerCase())) {
        seen.add(v.colorHex.toLowerCase());
        list.push({ name: v.color || 'Color', hex: v.colorHex });
      }
    });
    return list;
  }, [product]);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSoldOut) return;
    setIsAdding(true);
    addToCart(product, defaultVariant);
    setTimeout(() => setIsAdding(false), 800);
  };

  const [isHovered, setIsHovered] = useState(false);
  const [isImgLoaded, setIsImgLoaded] = useState(false);

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-stone-200/90 dark:border-slate-800 hover:border-amber-400/80 dark:hover:border-amber-400/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform h-full overflow-hidden"
      >
        {/* Product Image Container (Fixed 4:5 Aspect Ratio, Soft Cream Background, Card 2 Reference Size) */}
        <div className="relative w-full aspect-[4/5] flex-shrink-0 bg-[#FAF7F2] dark:bg-slate-900 overflow-hidden cursor-pointer select-none flex items-center justify-center p-2 sm:p-2.5">
          <div
            onClick={() => setIsQuickViewOpen(true)}
            className="relative w-full aspect-[1312/1199] overflow-hidden flex items-center justify-center"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsQuickViewOpen(true);
            }}
            aria-label={`View ${product.name}`}
          >
            {/* Shimmer Placeholder while loading */}
            {!isImgLoaded && (
              <div className="absolute inset-0 bg-[#F5EFE6]/60 dark:bg-slate-800 animate-pulse rounded-lg pointer-events-none" />
            )}

            {/* Primary or Colour-Specific Image */}
            <Image
              src={currentImgSrc}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
              loading="lazy"
              decoding="async"
              onLoad={() => setIsImgLoaded(true)}
              className={`w-full h-full object-contain object-center pointer-events-none transition-[opacity,transform] duration-300 ease-out will-change-transform ${
                images.length > 1 && !selectedColorName
                  ? 'group-hover:opacity-0 group-hover:scale-105 opacity-100 scale-100'
                  : 'group-hover:scale-105 opacity-100 scale-100'
              }`}
              priority={false}
              onError={() => {
                setIsImgLoaded(true);
                if (currentImgSrc !== '/images/products/organic-onesie.jpg') {
                  setCurrentImgSrc('/images/products/organic-onesie.jpg');
                }
              }}
            />

            {/* Secondary Image loaded strictly on card hover for smooth lookbook preview without extra network overhead */}
            {isHovered && images.length > 1 && !selectedColorName && (
              <Image
                src={currentSecSrc}
                alt={`${product.name} back view`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain object-center pointer-events-none transition-[opacity,transform] duration-300 ease-out will-change-transform opacity-0 scale-100 group-hover:opacity-100 group-hover:scale-105"
                onError={() => {
                  if (currentSecSrc !== currentImgSrc) {
                    setCurrentSecSrc(currentImgSrc);
                  }
                }}
              />
            )}
          </div>

          {/* Top-Right Badges */}
          <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none flex flex-col gap-1 items-end">
            {isSoldOut ? (
              <span className="px-2.5 py-0.5 bg-stone-900 text-white text-[10px] sm:text-[11px] font-black rounded-md shadow-xs tracking-tight uppercase">
                Sold Out
              </span>
            ) : (
              <>
                {product.isNewArrival && (
                  <span className="px-2.5 py-0.5 bg-[#2563EB] text-white text-[10px] sm:text-[11px] font-bold rounded-md shadow-xs tracking-tight">
                    New
                  </span>
                )}
                {isSaleActive && (
                  <span className="px-2.5 py-0.5 bg-rose-600 text-white text-[10px] sm:text-[11px] font-bold rounded-md shadow-xs tracking-tight">
                    {discountPercent > 0 ? `-${discountPercent}%` : 'Sale'}
                  </span>
                )}
                {!product.isNewArrival && !isSaleActive && product.isBestSeller && (
                  <span className="px-2.5 py-0.5 bg-emerald-700 text-white text-[10px] sm:text-[11px] font-bold rounded-md shadow-xs tracking-tight">
                    Best Seller
                  </span>
                )}
              </>
            )}
          </div>

          {/* Top-Left Wishlist Heart Button */}
          <div className="absolute top-2.5 left-2.5 z-10 opacity-90 group-hover:opacity-100 transition-opacity">
            <WishlistButton productId={product.id} product={product} />
          </div>

          {/* Dual Action Bar (Slide up on desktop hover: View Product + Quick Add) */}
          <div className="absolute inset-x-0 bottom-0 p-2.5 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-250 ease-out hidden sm:flex items-center space-x-2 bg-gradient-to-t from-stone-950/70 via-stone-950/40 to-transparent">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsQuickViewOpen(true);
              }}
              className="flex-1 py-2 px-2.5 bg-white/95 hover:bg-stone-900 text-stone-900 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 backdrop-blur-xs active:scale-95"
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
                className="flex-1 py-2 px-2.5 bg-stone-900 hover:bg-amber-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 active:scale-95"
                title="Quick Add to Bag"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isAdding ? 'Added ✓' : 'Add'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Product Details Section (Consistent Heights & Spacing across all cards) */}
        <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between bg-white dark:bg-slate-900">
          <div className="space-y-1">
            {/* Product Name (Fixed Height, 1-Line Truncate) */}
            <Link href={`/products/${product.slug}`} className="block group/link">
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-slate-100 uppercase tracking-tight truncate group-hover/link:text-amber-800 dark:group-hover/link:text-amber-400 transition-colors h-5 leading-5">
                {product.name}
              </h3>
            </Link>

            {/* Pricing Row (Fixed Height) */}
            <div className="flex items-baseline space-x-2 pt-0.5 h-5 sm:h-6">
              <span className="text-sm sm:text-base font-black text-stone-950 dark:text-white font-mono">
                {formatCurrency(product.price)}
              </span>
              {isSaleActive && product.comparePrice && (
                <span className="text-xs sm:text-[13px] text-stone-400 dark:text-slate-400 line-through font-mono">
                  {formatCurrency(product.comparePrice)}
                </span>
              )}
            </div>

            {/* Installment Subtext (Fixed Height) */}
            <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-slate-400 font-medium tracking-tight truncate h-4">
              or LKR {installmentAmount} with{' '}
              <span className="font-bold text-stone-700 dark:text-slate-300">koko</span>{' '}
              <span className="font-bold text-sky-700 dark:text-sky-400">mintpay</span>
            </p>
          </div>

          {/* Color Swatch Dots & Mobile Actions (Fixed Height) */}
          <div className="pt-2 flex items-center justify-between min-h-[28px]">
            {swatches.length > 0 ? (
              <div className="flex items-center space-x-1.5 overflow-hidden">
                {swatches.slice(0, 5).map((s, idx) => {
                  const isSelected = selectedColorName?.toLowerCase() === s.name.toLowerCase();
                  return (
                    <button
                      key={`${s.hex}-${idx}`}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedColorName((prev) => (prev === s.name ? null : s.name));
                      }}
                      onMouseEnter={() => setSelectedColorName(s.name)}
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-stone-900 dark:ring-white ring-offset-1 scale-110 border-white'
                          : 'border-stone-300 dark:border-slate-600 hover:scale-110'
                      }`}
                      style={{ backgroundColor: s.hex }}
                      title={`View ${s.name} colour`}
                      aria-label={`View ${s.name} colour`}
                    />
                  );
                })}
                {swatches.length > 5 && (
                  <span className="text-[10px] text-stone-400 font-semibold">+{swatches.length - 5}</span>
                )}
              </div>
            ) : (
              <div className="h-4" />
            )}

            {/* Mobile Action Buttons: View + Add */}
            <div className="flex items-center space-x-1.5 sm:hidden">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsQuickViewOpen(true);
                }}
                className="p-1.5 rounded-full bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 transition-colors shadow-2xs"
                title="View Product"
                aria-label="View Product"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>

              {!isSoldOut && (
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  className="p-1.5 rounded-full bg-stone-900 dark:bg-slate-700 text-white hover:bg-amber-900 dark:hover:bg-amber-600 transition-colors shadow-2xs"
                  title="Add to Cart"
                  aria-label="Add to Cart"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Quick View Modal (Mounted on Demand) */}
      {isQuickViewOpen && (
        <QuickViewModal
          product={product}
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
        />
      )}
    </>
  );
});
