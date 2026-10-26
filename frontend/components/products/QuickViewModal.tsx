'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Heart, Check, ChevronRight, Star, ShieldCheck, Sparkles } from 'lucide-react';
import { Product, ProductVariant } from '../../types/product';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCart } from '../../hooks/useCart';
import { WishlistButton } from './WishlistButton';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddedNotice, setShowAddedNotice] = useState(false);

  // Initialize or reset selections when product changes
  useEffect(() => {
    if (product) {
      setSelectedImageIndex(0);
      setQuantity(1);
      setShowAddedNotice(false);

      const variants = product.variants || [];
      const firstVar = variants[0] || null;
      setSelectedVariant(firstVar);

      if (firstVar?.size) {
        setSelectedSize(firstVar.size);
      } else if (product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
      } else {
        setSelectedSize('Standard');
      }

      if (firstVar?.color) {
        setSelectedColor(firstVar.color);
      } else if (product.colors && product.colors.length > 0) {
        setSelectedColor(product.colors[0].name);
      } else {
        setSelectedColor('');
      }
    }
  }, [product]);

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const images = product.images && product.images.length > 0
    ? product.images.map((img) => img.url)
    : ['/images/products/organic-onesie.jpg'];

  const currentImageUrl = images[selectedImageIndex] || images[0] || '/images/products/organic-onesie.jpg';

  const totalStock = product.stockQuantity ?? (product.variants || []).reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
  const isSoldOut = totalStock <= 0;

  const unitPrice = selectedVariant?.price ?? product.price;
  const totalPrice = unitPrice * quantity;

  const unitComparePrice = product.comparePrice;
  const totalComparePrice = unitComparePrice ? unitComparePrice * quantity : null;

  const isSaleActive = Boolean(
    (product.isSaleBadge ?? true) &&
    unitComparePrice &&
    unitComparePrice > unitPrice &&
    (!product.saleStartDate || new Date(product.saleStartDate) <= new Date()) &&
    (!product.saleEndDate || new Date(product.saleEndDate) >= new Date())
  );

  const discountPercent = isSaleActive && unitComparePrice
    ? Math.round(((unitComparePrice - unitPrice) / unitComparePrice) * 100)
    : 0;

  const installmentAmount = (totalPrice / 3).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Unique sizes from variants or product
  const availableSizes = Array.from(
    new Set([
      ...(product.sizes || []),
      ...(product.variants || []).map((v) => v.size).filter(Boolean) as string[],
    ])
  );

  // Unique colors
  const availableColors = product.colors && product.colors.length > 0
    ? product.colors
    : Array.from(
        new Map(
          (product.variants || [])
            .filter((v) => v.color && v.colorHex)
            .map((v) => [v.color!.toLowerCase(), { name: v.color!, hex: v.colorHex! }])
        ).values()
      );

  const handleSelectColor = (colorName: string) => {
    setSelectedColor(colorName);
    // Find matching variant
    const matchVar = (product.variants || []).find(
      (v) => v.color?.toLowerCase() === colorName.toLowerCase()
    );
    if (matchVar) {
      setSelectedVariant(matchVar);
    }
    // Switch to corresponding image if available
    const colorImgIndex = (product.images || []).findIndex(
      (img) => img.colorName?.toLowerCase() === colorName.toLowerCase()
    );
    if (colorImgIndex !== -1) {
      setSelectedImageIndex(colorImgIndex);
    }
  };

  const handleSelectSize = (sizeName: string) => {
    setSelectedSize(sizeName);
    const matchVar = (product.variants || []).find(
      (v) => v.size?.toLowerCase() === sizeName.toLowerCase()
    );
    if (matchVar) {
      setSelectedVariant(matchVar);
    }
  };

  const handleAddToCart = async () => {
    if (isSoldOut) return;
    setIsAdding(true);

    const variantToUse: ProductVariant = selectedVariant || {
      id: `var-${product.id}-${selectedSize || 'std'}`,
      sku: product.sku || 'REX-STD',
      size: selectedSize,
      color: selectedColor,
      price: product.price,
      stockQuantity: product.stockQuantity || 10,
    };

    addToCart(product, variantToUse, quantity);

    setIsAdding(false);
    setShowAddedNotice(true);
    setTimeout(() => setShowAddedNotice(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="quick-view-title">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
            className="relative w-full max-w-4xl transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 text-left shadow-2xl transition-all border border-stone-200/80 dark:border-slate-800 my-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 flex items-center justify-center transition-all shadow-xs"
              aria-label="Close product view"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Left Column: Image Gallery Showcase */}
              <div className="bg-[#FAF9F6] dark:bg-slate-950 p-4 sm:p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-100 dark:border-slate-800">
                {/* Main Large Image Display */}
                <div className="relative w-full aspect-square bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xs border border-stone-200/60 dark:border-slate-800 flex items-center justify-center">
                  <Image
                    src={currentImageUrl}
                    alt={product.name}
                    fill
                    className="object-contain p-2 sm:p-3"
                    sizes="(max-width: 768px) 90vw, 450px"
                    priority
                  />

                  {/* Corner Badges */}
                  <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
                    {isSoldOut ? (
                      <span className="px-2.5 py-1 bg-stone-900 text-white text-[11px] font-black rounded-md uppercase tracking-wider">
                        Sold Out
                      </span>
                    ) : (
                      <>
                        {product.isNewArrival && (
                          <span className="px-2.5 py-1 bg-[#2563EB] text-white text-[11px] font-bold rounded-md shadow-xs">
                            New Arrival
                          </span>
                        )}
                        {isSaleActive && (
                          <span className="px-2.5 py-1 bg-rose-600 text-white text-[11px] font-bold rounded-md shadow-xs">
                            {discountPercent > 0 ? `-${discountPercent}% OFF` : 'Sale'}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Wishlist Button inside image container */}
                  <div className="absolute top-3 right-3 z-10">
                    <WishlistButton productId={product.id} product={product} />
                  </div>
                </div>

                {/* Thumbnails Strip */}
                {images.length > 1 && (
                  <div className="flex items-center gap-2.5 mt-4 overflow-x-auto pb-1 justify-center sm:justify-start">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-white ${
                          selectedImageIndex === idx
                            ? 'border-amber-600 ring-2 ring-amber-200 scale-105'
                            : 'border-stone-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-contain p-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Product Info & Actions */}
              <div className="p-5 sm:p-7 flex flex-col justify-between space-y-4 bg-white dark:bg-slate-900">
                <div className="space-y-3.5">
                  {/* Category & Boutique Tag */}
                  <div className="flex items-center space-x-2 text-[11px] font-extrabold uppercase tracking-widest text-amber-900 dark:text-amber-400">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>REXBEBE CURATED BOUTIQUE</span>
                  </div>

                  {/* Product Title */}
                  <h2 id="quick-view-title" className="text-lg sm:text-2xl font-black text-stone-900 dark:text-slate-100 uppercase tracking-tight leading-snug">
                    {product.name}
                  </h2>

                  {/* Price Row */}
                  <div className="flex items-baseline flex-wrap gap-x-2.5 gap-y-1 pt-0.5">
                    <span className="text-xl sm:text-2xl font-black text-stone-950 dark:text-white font-mono">
                      {formatCurrency(totalPrice)}
                    </span>
                    {isSaleActive && totalComparePrice && (
                      <span className="text-sm text-stone-400 dark:text-slate-400 line-through font-mono">
                        {formatCurrency(totalComparePrice)}
                      </span>
                    )}
                    {quantity > 1 && (
                      <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        ({formatCurrency(unitPrice)} each)
                      </span>
                    )}
                  </div>

                  {/* Installment Badge */}
                  <div className="inline-flex items-center space-x-1 px-3 py-1 bg-stone-100 rounded-lg text-xs text-stone-600 font-medium">
                    <span>or 3 × LKR {installmentAmount} with</span>
                    <span className="font-bold text-stone-800">koko</span>
                    <span className="font-bold text-sky-700">mintpay</span>
                  </div>

                  {/* Short Description */}
                  {product.description && (
                    <p className="text-xs sm:text-sm text-stone-600 line-clamp-3 leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  {/* Colors Selector */}
                  {availableColors.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold uppercase tracking-wider text-stone-700">Color:</span>
                        <span className="text-stone-900 font-bold">{selectedColor || 'Select'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {availableColors.map((c, i) => {
                          const isSelected = selectedColor?.toLowerCase() === c.name.toLowerCase();
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectColor(c.name)}
                              className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                                isSelected
                                  ? 'ring-2 ring-stone-900 ring-offset-2 scale-110 border-white'
                                  : 'border-stone-300 hover:scale-105'
                              }`}
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Size Selector */}
                  {availableSizes.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold uppercase tracking-wider text-stone-700">Size:</span>
                        <span className="text-stone-900 font-bold">{selectedSize || 'Select'}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {availableSizes.map((s, i) => {
                          const isSelected = selectedSize.toLowerCase() === s.toLowerCase();
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectSize(s)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                isSelected
                                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                                  : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200'
                              }`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quantity & Stock Indicator */}
                  <div className="flex items-center space-x-4 pt-2">
                    <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-3 py-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200 font-bold transition-colors"
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <span className="px-3 py-1.5 text-xs font-bold text-stone-900 min-w-[28px] text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="px-3 py-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200 font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Ready to Dispatch</span>
                    </div>
                  </div>
                </div>

                {/* Actions Bottom Bar */}
                <div className="space-y-2.5 pt-3 border-t border-stone-100">
                  {showAddedNotice && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-center space-x-2 shadow-xs"
                    >
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Added {quantity} item(s) to bag!</span>
                    </motion.div>
                  )}

                  {/* Main Add To Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isSoldOut || isAdding}
                    className={`w-full py-3.5 px-6 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center space-x-2 shadow-md ${
                      isSoldOut
                        ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                        : 'bg-stone-900 hover:bg-amber-900 text-white active:scale-[0.99]'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {isSoldOut
                        ? 'Sold Out'
                        : isAdding
                        ? 'Adding...'
                        : `Add to Bag • ${formatCurrency(totalPrice)}`}
                    </span>
                  </button>

                  {/* Direct Link to Full Product Detail Page */}
                  <div className="text-center pt-1">
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={onClose}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-amber-900 hover:underline hover:text-amber-800"
                    >
                      <span>View Full Product Details & Sizing Guide</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
