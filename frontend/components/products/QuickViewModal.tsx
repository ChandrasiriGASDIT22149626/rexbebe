'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, ArrowRight, Check, ChevronRight, Star, ShieldCheck, Sparkles } from 'lucide-react';
import { Product, ProductVariant } from '../../types/product';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCart } from '../../hooks/useCart';
import { WishlistButton } from './WishlistButton';
import { InstallmentBadges } from './InstallmentBadges';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  initialSize?: string | null;
}

export function QuickViewModal({ product, isOpen, onClose, initialSize }: QuickViewModalProps) {
  const router = useRouter();
  const { addToCart, closeCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddedNotice, setShowAddedNotice] = useState(false);

  // Initialize or reset selections when product or initialSize changes
  useEffect(() => {
    if (product) {
      setSelectedImageIndex(0);
      setQuantity(1);
      setShowAddedNotice(false);

      const variants = product.variants || [];

      // Determine starting size: prioritize initialSize if provided
      let startingSize = '';
      if (initialSize) {
        startingSize = initialSize;
      } else if (variants[0]?.size) {
        startingSize = variants[0].size;
      } else if (product.sizes && product.sizes.length > 0) {
        startingSize = product.sizes[0];
      } else {
        startingSize = 'Standard';
      }
      setSelectedSize(startingSize);

      // Determine starting color
      let startingColor = '';
      if (variants[0]?.color) {
        startingColor = variants[0].color;
      } else if (product.colors && product.colors.length > 0) {
        startingColor = product.colors[0].name;
      }
      setSelectedColor(startingColor);

      // Find best matched variant
      const matched = variants.find(
        (v) =>
          (!startingSize || v.size?.toLowerCase() === startingSize.toLowerCase()) &&
          (!startingColor || v.color?.toLowerCase() === startingColor.toLowerCase())
      ) || variants.find((v) => !startingSize || v.size?.toLowerCase() === startingSize.toLowerCase()) || variants[0] || null;

      setSelectedVariant(matched);
    }
  }, [product, initialSize]);

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
    : ['/images/products/organic-onesie.webp'];

  const currentImageUrl = images[selectedImageIndex] || images[0] || '/images/products/organic-onesie.webp';

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

  // Unique sizes from variants and product.sizes
  const availableSizes = Array.from(
    new Set([
      ...(product.sizes || []),
      ...(product.variants || []).map((v) => v.size).filter(Boolean) as string[],
    ])
  );

  // Check if a specific size is in stock
  const isSizeInStock = (sizeName: string): boolean => {
    if (isSoldOut) return false;
    const sizeVariants = (product.variants || []).filter(
      (v) => v.size?.toLowerCase() === sizeName.toLowerCase()
    );
    if (sizeVariants.length === 0) return totalStock > 0;
    return sizeVariants.some((v) => (v.stockQuantity ?? 0) > 0);
  };

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
      (v) =>
        v.color?.toLowerCase() === colorName.toLowerCase() &&
        (!selectedSize || v.size?.toLowerCase() === selectedSize.toLowerCase())
    ) || (product.variants || []).find(
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
      (v) =>
        v.size?.toLowerCase() === sizeName.toLowerCase() &&
        (!selectedColor || v.color?.toLowerCase() === selectedColor.toLowerCase())
    ) || (product.variants || []).find(
      (v) => v.size?.toLowerCase() === sizeName.toLowerCase()
    );

    if (matchVar) {
      setSelectedVariant(matchVar);
    }
  };

  // Resolve active variant to add
  const resolveVariantToUse = (): ProductVariant => {
    if (selectedVariant) {
      return {
        ...selectedVariant,
        size: selectedSize || selectedVariant.size,
        color: selectedColor || selectedVariant.color,
      };
    }

    return {
      id: `var-${product.id}-${(selectedSize || 'std').toLowerCase().replace(/\s+/g, '-')}`,
      sku: product.sku || 'REX-STD',
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      price: product.price,
      stockQuantity: product.stockQuantity || 10,
    };
  };

  // Add to Bag action
  const handleAddToCart = () => {
    if (isSoldOut) return;
    setIsAdding(true);

    const variantToUse = resolveVariantToUse();
    addToCart(product, variantToUse, quantity);

    setIsAdding(false);
    setShowAddedNotice(true);
    setTimeout(() => setShowAddedNotice(false), 2500);
  };

  // Direct Proceed to Checkout action
  const handleProceedToCheckout = () => {
    if (isSoldOut) return;

    const variantToUse = resolveVariantToUse();
    addToCart(product, variantToUse, quantity);

    // Close the cart drawer if opened by addToCart to prevent overlaying
    closeCart();
    onClose();

    // Navigate straight to Personal Information page
    router.push('/checkout');
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.05 }}
            className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl sm:rounded-3xl bg-white text-left shadow-2xl transition-all border border-neutral-200 my-4 sm:my-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-all shadow-xs"
              aria-label="Close product options view"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Left Column: Image Gallery Showcase */}
              <div className="bg-[#FAF9F6] p-4 sm:p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-100">
                {/* Main Large Image Display (Fixed 4:5 Aspect Ratio & Soft Clean Background) */}
                <div className="relative w-full aspect-[4/5] bg-white rounded-xl overflow-hidden shadow-xs border border-neutral-200/60 flex items-center justify-center p-2 sm:p-3">
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
                      <span className="px-2.5 py-1 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-none">
                        Sold Out
                      </span>
                    ) : (
                      <>
                        <span className="px-2.5 py-1 bg-[#00A699] text-white text-[10px] font-bold tracking-wide">
                          In stock
                        </span>
                        {isSaleActive && (
                          <span className="px-2.5 py-1 bg-rose-600 text-white text-[10px] font-bold shadow-xs">
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
                  <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 justify-center sm:justify-start">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative w-11 sm:w-13 aspect-[4/5] rounded-lg overflow-hidden border transition-all flex-shrink-0 bg-white ${
                          selectedImageIndex === idx
                            ? 'border-neutral-900 ring-2 ring-neutral-900/20 scale-105'
                            : 'border-neutral-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-contain p-0.5" sizes="55px" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Product Info, Options & Actions */}
              <div className="p-5 sm:p-7 flex flex-col justify-between space-y-4 bg-white">
                <div className="space-y-3">
                  {/* Category & Boutique Tag */}
                  <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>REXBEBE BOUTIQUE COLLECTION</span>
                  </div>

                  {/* Product Title */}
                  <h2 id="quick-view-title" className="text-lg sm:text-xl md:text-2xl font-bold text-neutral-900 capitalize tracking-tight leading-snug">
                    {product.name}
                  </h2>

                  {/* Price Row */}
                  <div className="flex items-baseline flex-wrap gap-x-2.5 gap-y-1 pt-0.5">
                    <span className="text-xl sm:text-2xl font-bold text-neutral-900">
                      Rs {unitPrice.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {isSaleActive && unitComparePrice && (
                      <span className="text-xs sm:text-sm text-neutral-400 line-through">
                        Rs {unitComparePrice.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                    {quantity > 1 && (
                      <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-sm">
                        Total: {formatCurrency(totalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Dynamic 3 Installments + Mintpay & Koko Logos */}
                  <div className="pt-0.5">
                    <InstallmentBadges price={unitPrice} currencyPrefix="Rs" />
                  </div>

                  {/* Short Description */}
                  {product.description && (
                    <p className="text-xs sm:text-[13px] text-neutral-600 line-clamp-2 leading-relaxed pt-1">
                      {product.description}
                    </p>
                  )}

                  {/* Colors Selector */}
                  {availableColors.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold uppercase tracking-wider text-neutral-700">Colour:</span>
                        <span className="text-neutral-900 font-bold">{selectedColor || 'Select Colour'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {availableColors.map((c, i) => {
                          const isSelected = selectedColor?.toLowerCase() === c.name.toLowerCase();
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectColor(c.name)}
                              className={`w-7 h-7 rounded-full border transition-all cursor-pointer ${
                                isSelected
                                  ? 'ring-2 ring-neutral-900 ring-offset-2 scale-110 border-white'
                                  : 'border-neutral-300 hover:scale-105'
                              }`}
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                              aria-label={`Select colour ${c.name}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Size Selector (Clean rectangular box styling matching card reference) */}
                  {availableSizes.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold uppercase tracking-wider text-neutral-700">Size:</span>
                        <span className="text-neutral-900 font-bold">{selectedSize || 'Select Size'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {availableSizes.map((s, i) => {
                          const isSelected = selectedSize.toLowerCase() === s.toLowerCase();
                          const inStock = isSizeInStock(s);
                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={!inStock}
                              onClick={() => handleSelectSize(s)}
                              className={`min-w-[36px] h-[30px] px-2.5 text-xs font-semibold flex items-center justify-center transition-all select-none ${
                                isSelected
                                  ? 'border-2 border-neutral-900 bg-neutral-900 text-white font-bold'
                                  : inStock
                                  ? 'border border-neutral-300 text-neutral-800 bg-white hover:border-neutral-700'
                                  : 'border border-neutral-200 text-neutral-300 bg-neutral-50 cursor-not-allowed line-through'
                              }`}
                              title={inStock ? `Size ${s}` : `Size ${s} is sold out`}
                              aria-label={`Size ${s}${inStock ? '' : ' (Sold out)'}`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quantity & Dispatch Badge */}
                  <div className="flex items-center space-x-4 pt-2">
                    <div className="flex items-center border border-neutral-300 bg-white">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-3 py-1.5 text-neutral-600 hover:text-black font-bold transition-colors disabled:opacity-40"
                        disabled={quantity <= 1 || isSoldOut}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="px-3 py-1.5 text-xs font-bold text-neutral-900 min-w-[32px] text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="px-3 py-1.5 text-neutral-600 hover:text-black font-bold transition-colors disabled:opacity-40"
                        disabled={isSoldOut}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-xs font-medium text-emerald-700 flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Ready for express islandwide delivery</span>
                    </div>
                  </div>
                </div>

                {/* Actions Bottom Bar */}
                <div className="space-y-2.5 pt-3 border-t border-neutral-100">
                  {showAddedNotice && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold flex items-center justify-center space-x-2"
                    >
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Added {quantity} × &quot;{product.name}&quot; ({selectedSize || 'Standard'}) to your shopping bag!</span>
                    </motion.div>
                  )}

                  {/* PRIMARY ACTION: PROCEED TO CHECKOUT */}
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    disabled={isSoldOut}
                    className={`w-full py-3.5 px-6 font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center space-x-2 shadow-sm ${
                      isSoldOut
                        ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                        : 'bg-neutral-900 hover:bg-black text-white active:scale-[0.99]'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {isSoldOut ? 'Sold Out' : `Proceed to Checkout • ${formatCurrency(totalPrice)}`}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>

                  {/* SECONDARY ACTION: ADD TO CART */}
                  {!isSoldOut && (
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={isAdding}
                      className="w-full py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] transition-all flex items-center justify-center space-x-1.5 border border-neutral-300 hover:border-black text-neutral-800 hover:text-black bg-white active:scale-[0.99]"
                    >
                      <span>{isAdding ? 'Adding to bag...' : 'Add to Bag & Continue Shopping'}</span>
                    </button>
                  )}

                  {/* Direct Link to Full Product Detail Page */}
                  <div className="text-center pt-1">
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={onClose}
                      className="inline-flex items-center space-x-1 text-xs font-medium text-neutral-600 hover:text-black hover:underline"
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

export default QuickViewModal;
