'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Product, ProductVariant } from '../../types/product';
import { formatCurrency } from '../../utils/formatCurrency';
import { Button } from '../ui/Button';
import { useCart } from '../../hooks/useCart';
import { SizeGuide } from './SizeGuide';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Flame,
  Gift,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Heart,
} from 'lucide-react';
import { WishlistButton } from './WishlistButton';

export function ProductInfo({
  product,
  onActiveImageChange,
  onGarmentSelectionChange,
}: {
  product: Product;
  onActiveImageChange?: (url: string) => void;
  onGarmentSelectionChange?: (info: { partName?: string; colorName?: string; hasAuthenticImage?: boolean }) => void;
}) {
  const { addToCart } = useCart();

  // Purchasable individual components
  const purchasableParts = useMemo(() => {
    return (product.parts || []).filter((p) => p.active && p.isPurchasableIndividually);
  }, [product]);

  // Purchase Mode: 'complete_set' (all pieces together) vs 'individual_part' (single garment)
  const [purchaseMode, setPurchaseMode] = useState<'complete_set' | 'individual_part'>('complete_set');

  // Currently focused part for individual piece purchasing or inspection
  const [activePartId, setActivePartId] = useState<string>(() => {
    return purchasableParts[0]?.id || product.parts?.[0]?.id || '';
  });

  const activePart = useMemo(() => {
    return product.parts?.find((p) => p.id === activePartId) || product.parts?.[0] || null;
  }, [product, activePartId]);

  // Initialize selected part colors if product has clothing components
  const [selectedPartColors, setSelectedPartColors] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (product.parts && product.parts.length > 0) {
      product.parts.forEach((p) => {
        initial[p.name] = p.defaultColor || p.colors?.[0]?.name || 'Standard';
      });
    }
    return initial;
  });

  // Available Sizes list based on active mode
  // Available Sizes list based on active mode
  const availableSizes = useMemo(() => {
    if (purchaseMode === 'individual_part' && activePart?.sizes && activePart.sizes.length > 0) {
      return activePart.sizes;
    }
    if (product.sizes && product.sizes.length > 0) {
      return product.sizes;
    }
    const fromVariants = Array.from(
      new Set(product.variants?.map((v) => v.size).filter(Boolean) as string[])
    );
    return fromVariants;
  }, [product, purchaseMode, activePart]);

  // Available Colors list - strictly only what the admin configured
  const availableColors = useMemo(() => {
    if (purchaseMode === 'individual_part' && activePart?.colors && activePart.colors.length > 0) {
      return activePart.colors;
    }
    if (product.colors && product.colors.length > 0) {
      return product.colors;
    }
    const map = new Map<string, string>();
    (product.variants || []).forEach((v) => {
      if (v.color && v.colorHex && !map.has(v.color)) {
        map.set(v.color, v.colorHex);
      }
    });
    if (map.size > 0) {
      return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
    }
    return [];
  }, [product, purchaseMode, activePart]);

  const [selectedSize, setSelectedSize] = useState<string>(() => availableSizes[0] || '');

  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string }>(() => {
    if (product.colors && product.colors.length > 0) {
      return product.colors[0];
    }
    const firstVar = product.variants?.[0];
    if (firstVar?.color) {
      return { name: firstVar.color, hex: firstVar.colorHex || '#3B82F6' };
    }
    return { name: '', hex: '' };
  });

  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [registrySaved, setRegistrySaved] = useState(false);
  const [activeSpecTab, setActiveSpecTab] = useState<'fabric' | 'care' | 'details'>('fabric');

  // Synchronize image when color or part colors change
  const syncImageForColor = useCallback(
    (colName: string, partName?: string) => {
      if (!colName) return;
      let matchedUrl: string | null = null;
      let hasAuth = false;

      // 1. Check part-specific images
      if (partName && product.parts) {
        const part = product.parts.find((p) => p.name === partName);
        const partImg = part?.images?.find((img) => img.colorName?.toLowerCase() === colName.toLowerCase());
        if (partImg?.url) {
          matchedUrl = partImg.url;
          hasAuth = true;
        }
      }

      // 2. Check main product images matching colorName
      if (!matchedUrl && product.images) {
        const matchImg = product.images.find((img) => img.colorName?.toLowerCase() === colName.toLowerCase());
        if (matchImg?.url) {
          matchedUrl = matchImg.url;
          hasAuth = true;
        }
      }

      // 3. Check variant image
      if (!matchedUrl && product.variants) {
        const matchVar = product.variants.find((v) => v.color?.toLowerCase() === colName.toLowerCase() && v.imageUrl);
        if (matchVar?.imageUrl) {
          matchedUrl = matchVar.imageUrl;
          hasAuth = true;
        }
      }

      if (matchedUrl) {
        onActiveImageChange?.(matchedUrl);
      }

      onGarmentSelectionChange?.({
        partName: partName || activePart?.name,
        colorName: colName,
        hasAuthenticImage: hasAuth,
      });
    },
    [product, onActiveImageChange, onGarmentSelectionChange, activePart]
  );

  // Helper to find Complete Set Variant - STRICT per size and colour
  const findMatchingSetVariant = useCallback(
    (sz: string, colName: string, partsMap: Record<string, string>): ProductVariant | null => {
      if (!product.variants || product.variants.length === 0) return null;

      const setVariants = product.variants.filter((v) => !v.purchaseType || v.purchaseType === 'complete_set');

      // 1. Exact match by size + partColors if partsMap provided
      if (Object.keys(partsMap).length > 0) {
        const exactPartMatch = setVariants.find((v) => {
          if (v.size !== sz) return false;
          if (v.partColors) {
            return Object.entries(partsMap).every(
              ([partName, partCol]) =>
                !v.partColors?.[partName] ||
                v.partColors[partName].toLowerCase() === partCol.toLowerCase()
            );
          }
          return v.color?.toLowerCase() === colName.toLowerCase();
        });
        if (exactPartMatch) return exactPartMatch;
      }

      // 2. Exact match by size + color
      const exactMatch = setVariants.find(
        (v) => v.size === sz && (!colName || v.color?.toLowerCase() === colName.toLowerCase())
      );
      if (exactMatch) return exactMatch;

      // If no exact match for this size and colour combination, return null (never borrow another size's inventory!)
      return null;
    },
    [product]
  );

  // Helper to find Individual Part Variant - STRICT per size and colour
  const findMatchingPartVariant = useCallback(
    (partId: string, sz: string, colName: string): ProductVariant | null => {
      if (!product.variants || product.variants.length === 0) return null;

      const partVars = product.variants.filter((v) => v.purchaseType === 'individual_part' && v.partId === partId);
      if (partVars.length === 0) return null;

      const exact = partVars.find(
        (v) => v.size === sz && (!colName || v.color?.toLowerCase() === colName.toLowerCase())
      );
      if (exact) return exact;

      return null;
    },
    [product]
  );

  // Resolve currently active variant - STRICTLY REAL INVENTORY RECORD, NEVER SYNTHETIC
  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (purchaseMode === 'individual_part' && activePart) {
      return findMatchingPartVariant(activePart.id, selectedSize, selectedColor.name);
    }
    return findMatchingSetVariant(selectedSize, selectedColor.name, selectedPartColors);
  }, [purchaseMode, activePart, selectedSize, selectedColor, selectedPartColors, findMatchingPartVariant, findMatchingSetVariant]);

  // Stock status calculation
  const currentStock = selectedVariant ? (selectedVariant.stockQuantity ?? 0) : 0;
  const isOutOfStock = !selectedVariant || currentStock <= 0;
  const isLowStock = Boolean(selectedVariant && currentStock > 0 && currentStock <= (product.lowStockThreshold || 5));

  // Keep quantity safely clamped within available stock
  useEffect(() => {
    if (currentStock > 0 && quantity > currentStock) {
      setQuantity(currentStock);
    } else if (currentStock <= 0) {
      setQuantity(1);
    }
  }, [currentStock, quantity]);

  // Initial sync on mount
  useEffect(() => {
    if (selectedColor.name) {
      syncImageForColor(selectedColor.name, activePart?.name);
    }
  }, [selectedColor.name]);

  // Handle overall color change
  const handleSelectColor = (col: { name: string; hex: string }) => {
    setSelectedColor(col);

    // Ensure selectedSize aligns with the available sizes for this colour
    if (purchaseMode === 'individual_part' && activePart) {
      const partVars = (product.variants || []).filter(
        (v) => v.purchaseType === 'individual_part' && v.partId === activePart.id && v.color?.toLowerCase() === col.name.toLowerCase()
      );
      if (partVars.length > 0 && partVars[0].size && !partVars.some((v) => v.size === selectedSize)) {
        setSelectedSize(partVars[0].size);
      }
    } else {
      const setVars = (product.variants || []).filter(
        (v) => (!v.purchaseType || v.purchaseType === 'complete_set') && v.color?.toLowerCase() === col.name.toLowerCase()
      );
      if (setVars.length > 0 && setVars[0].size && !setVars.some((v) => v.size === selectedSize)) {
        setSelectedSize(setVars[0].size);
      }
    }

    // Sync customizable part color if applicable
    if (product.parts && product.parts.length > 0) {
      const primaryPart =
        product.parts.find((p) => ['T-shirt', 'Shirt', 'Dress', 'Romper'].includes(p.type) || p.name.toLowerCase().includes('shirt')) ||
        product.parts[0];
      if (primaryPart && primaryPart.colors.some((c) => c.name.toLowerCase() === col.name.toLowerCase())) {
        setSelectedPartColors((prev) => ({
          ...prev,
          [primaryPart.name]: col.name,
        }));
      }
    }

    syncImageForColor(col.name, activePart?.name);
  };

  // Handle individual component part color change
  const handleSelectPartColor = (part: any, col: { name: string; hex: string }) => {
    const updated = { ...selectedPartColors, [part.name]: col.name };
    setSelectedPartColors(updated);

    const isPrimaryGarment =
      ['T-shirt', 'Shirt', 'Dress', 'Romper'].includes(part.type) ||
      part.name.toLowerCase().includes('shirt');

    if (isPrimaryGarment) {
      setSelectedColor(col);
      // Auto-adjust size if current size not valid for this primary color
      const setVars = (product.variants || []).filter(
        (v) => (!v.purchaseType || v.purchaseType === 'complete_set') && v.color?.toLowerCase() === col.name.toLowerCase()
      );
      if (setVars.length > 0 && setVars[0].size && !setVars.some((v) => v.size === selectedSize)) {
        setSelectedSize(setVars[0].size);
      }
      syncImageForColor(col.name, part.name);
    } else {
      // Secondary component selection (e.g. Summer Shorts or Baby Hat)
      // Check if this part has an independent distinct photo asset for this color
      const partImg = part?.images?.find((img: any) => img.colorName?.toLowerCase() === col.name.toLowerCase());
      if (partImg?.url && !partImg.url.includes('dino-baby-set.jpg')) {
        onActiveImageChange?.(partImg.url);
        onGarmentSelectionChange?.({
          partName: part.name,
          colorName: col.name,
          hasAuthenticImage: true,
        });
      } else {
        // Keep primary garment set image active and inform gallery of component selection
        onGarmentSelectionChange?.({
          partName: part.name,
          colorName: col.name,
          hasAuthenticImage: false,
        });
      }
    }
  };

  // Active pricing based on purchase option
  const activePrice =
    purchaseMode === 'individual_part' && activePart
      ? (activePart.price && activePart.price > 0 ? activePart.price : Math.round(product.price * 0.45))
      : product.price;

  const activeComparePrice =
    purchaseMode === 'individual_part' && activePart
      ? activePart.comparePrice
      : product.comparePrice;
  const discountPercent =
    activeComparePrice && activeComparePrice > activePrice
      ? Math.round((1 - activePrice / activeComparePrice) * 100)
      : null;

  return (
    <div className="space-y-6">
      <div>
        {/* Category & Certifications */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs font-extrabold tracking-widest uppercase text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-100/90 shadow-2xs">
            {product.category?.name || 'Baby Collection'}
          </span>
          {product.subcategory?.name && (
            <span className="text-xs font-bold text-pink-700 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-100/80">
              {product.subcategory.name}
            </span>
          )}
          <span className="inline-flex items-center text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
            <Sparkles className="w-3 h-3 mr-1 text-amber-600" />
            {product.brand || 'REXBEBE Atelier'}
          </span>
        </div>

        {/* Product Title */}
        <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl text-slate-900 font-extrabold tracking-tight mt-1">
          {product.name}
          {purchaseMode === 'individual_part' && activePart && (
            <span className="block text-lg sm:text-xl font-bold text-pink-600 mt-1">
              — {activePart.name} Piece
            </span>
          )}
        </h1>

        {/* Price and Discount */}
        <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 mt-3">
          <span className="text-2xl sm:text-3xl font-black text-slate-900">
            {formatCurrency(activePrice * quantity)}
          </span>
          {activeComparePrice && activeComparePrice > activePrice && (
            <span className="text-base sm:text-lg text-slate-400 line-through font-medium">
              {formatCurrency(activeComparePrice * quantity)}
            </span>
          )}
          {quantity > 1 && (
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
              ({formatCurrency(activePrice)} each)
            </span>
          )}
          {discountPercent !== null && (
            <span className="bg-pink-100 text-pink-700 text-xs font-extrabold px-2.5 py-1 rounded-full border border-pink-200">
              Save {discountPercent}%
            </span>
          )}
        </div>

        {/* Live Viewing Urgency Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-1.5 sm:space-y-0 sm:space-x-3 mt-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900">
          <div className="flex items-center space-x-1.5 font-bold">
            <Eye className="w-4 h-4 text-amber-600 animate-pulse flex-shrink-0" />
            <span>Parents are viewing this right now</span>
          </div>
          <span className="hidden sm:inline text-amber-300">|</span>
          <div className="flex items-center space-x-1.5 font-bold">
            {isOutOfStock ? (
              <span className="text-rose-600 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {!selectedVariant ? 'Selected Option Not Available' : 'Currently Out of Stock'}
              </span>
            ) : isLowStock ? (
              <span className="text-rose-600 flex items-center">
                <Flame className="w-4 h-4 mr-1 text-rose-500 animate-bounce" />
                Only {currentStock} left in stock — order soon!
              </span>
            ) : (
              <span className="text-emerald-700 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                In Stock &amp; Ready to Ship ({currentStock} available)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Short & Full Description */}
      <div className="border-y border-slate-100 py-4 space-y-2">
        {product.shortDescription && (
          <p className="text-sm font-semibold text-slate-800 leading-relaxed">
            {product.shortDescription}
          </p>
        )}
        <p className="text-stone-600 text-sm font-normal leading-relaxed">
          {product.description}
        </p>
      </div>

      {/* PURCHASE OPTION SELECTOR (Complete Outfit vs Individual Piece) */}
      {product.productType === 'set' && purchasableParts.length > 0 && (
        <div className="p-4 rounded-3xl bg-pink-50/50 border border-pink-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-pink-800 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Purchase Configuration</span>
            </span>
            <span className="text-[11px] font-bold text-pink-600">
              {purchaseMode === 'complete_set' ? 'Full Set Selected' : 'Individual Garment Selected'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setPurchaseMode('complete_set');
                const defaultCol = product.colors?.[0] || { name: 'Red', hex: '#EF4444' };
                syncImageForColor(defaultCol.name);
              }}
              className={`p-3 rounded-2xl text-left border transition-all ${
                purchaseMode === 'complete_set'
                  ? 'bg-white border-pink-500 shadow-md ring-2 ring-pink-200'
                  : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
              }`}
            >
              <div className="font-extrabold text-xs text-slate-900">Complete Outfit</div>
              <div className="text-[11px] text-pink-600 font-bold mt-0.5">{formatCurrency(product.price)}</div>
              <div className="text-[10px] text-slate-400 mt-1">All coordinated pieces included</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setPurchaseMode('individual_part');
                const p = purchasableParts[0];
                if (p) {
                  setActivePartId(p.id);
                  const pCol = p.colors?.[0] || { name: 'Red', hex: '#EF4444' };
                  setSelectedColor(pCol);
                  syncImageForColor(pCol.name, p.name);
                }
              }}
              className={`p-3 rounded-2xl text-left border transition-all ${
                purchaseMode === 'individual_part'
                  ? 'bg-white border-pink-500 shadow-md ring-2 ring-pink-200'
                  : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
              }`}
            >
              <div className="font-extrabold text-xs text-slate-900">Individual Piece</div>
              <div className="text-[11px] text-pink-600 font-bold mt-0.5">
                From {formatCurrency(Math.min(...purchasableParts.map((p) => p.price || product.price)))}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Buy single piece separately</div>
            </button>
          </div>

          {purchaseMode === 'individual_part' && (
            <div className="space-y-1.5 pt-2 border-t border-pink-100 animate-in fade-in">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block">
                Select Garment to Purchase Alone:
              </label>
              <div className="flex flex-wrap gap-2">
                {purchasableParts.map((p) => {
                  const isSelected = activePartId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setActivePartId(p.id);
                        const pCol = p.colors?.[0] || { name: 'Red', hex: '#EF4444' };
                        setSelectedColor(pCol);
                        syncImageForColor(pCol.name, p.name);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all border flex items-center space-x-1.5 ${
                        isSelected
                          ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span>{p.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected ? 'bg-pink-800 text-white' : 'bg-pink-50 text-pink-700 font-bold'
                        }`}
                      >
                        {formatCurrency(p.price || 0)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CLOTHING SWATCH SELECTOR */}
      {purchaseMode === 'complete_set' && product.parts && product.parts.length > 0 ? (
        <div className="space-y-4 p-4 rounded-3xl bg-pink-50/40 border border-pink-100/70">
          <div className="flex items-center space-x-1.5 text-xs font-black text-pink-700 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Customize Set Components &amp; Colours</span>
          </div>
          {product.parts.map((part) => {
            const activePartCol = selectedPartColors[part.name] || part.defaultColor || part.colors?.[0]?.name;
            return (
              <div key={part.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800">
                    {part.name} ({part.type}):{' '}
                    <span className="font-black text-pink-600">{activePartCol}</span>
                  </span>
                  {part.description && (
                    <span className="text-[11px] text-slate-400 hidden sm:inline">{part.description}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2.5">
                  {part.colors.map((col, idx) => (
                    <button
                      key={`${col.name}-${idx}`}
                      type="button"
                      onClick={() => handleSelectPartColor(part, col)}
                      className={`w-7 h-7 rounded-full border-2 transition-all p-0.5 flex items-center justify-center ${
                        activePartCol?.toLowerCase() === col.name.toLowerCase()
                          ? 'border-pink-500 ring-2 ring-pink-200 scale-110'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                      title={`${part.name} in ${col.name}`}
                    >
                      <span
                        className="w-full h-full rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: col.hex }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        availableColors.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Colour:{' '}
              <span className="text-slate-900 font-black">{selectedColor.name}</span>
            </label>
            <div className="flex items-center space-x-3">
              {availableColors.map((col, idx) => (
                <button
                  key={`${col.name}-${idx}`}
                  type="button"
                  onClick={() => handleSelectColor(col)}
                  className={`w-8 h-8 rounded-full border-2 transition-all p-0.5 flex items-center justify-center ${
                    selectedColor.name === col.name
                      ? 'border-pink-500 ring-2 ring-pink-200 scale-110'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                  title={col.name}
                >
                  <span
                    className="w-full h-full rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: col.hex }}
                  />
                </button>
              ))}
            </div>
          </div>
        )
      )}

      {/* Size Selector with real stock validation per size */}
      {availableSizes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Size:{' '}
              <span className="text-slate-900 font-black">{selectedSize}</span>
            </label>
            <button
              type="button"
              onClick={() => setIsSizeGuideOpen(true)}
              className="text-xs text-pink-700 underline font-bold hover:text-pink-900"
            >
              Size &amp; Fit Guide
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((sz) => {
              const szVar =
                purchaseMode === 'individual_part' && activePart
                  ? findMatchingPartVariant(activePart.id, sz, selectedColor.name)
                  : findMatchingSetVariant(sz, selectedColor.name, selectedPartColors);

              const szStock = szVar ? (szVar.stockQuantity ?? 0) : 0;
              const isSoldOut = szStock <= 0;
              const isSelected = selectedSize === sz;

              return (
                <button
                  key={sz}
                  type="button"
                  disabled={isSoldOut}
                  onClick={() => {
                    if (!isSoldOut) setSelectedSize(sz);
                  }}
                  className={`relative px-4 py-2 text-xs font-extrabold rounded-full border transition-all flex items-center space-x-1.5 ${
                    isSoldOut
                      ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                      : isSelected
                      ? 'border-pink-500 bg-pink-500 text-white shadow-sm'
                      : 'border-slate-200 text-slate-700 hover:border-slate-400 bg-white'
                  }`}
                  title={isSoldOut ? `${sz} is Sold Out for ${selectedColor.name}` : `${sz} (${szStock} in stock)`}
                >
                  <span>{sz}</span>
                  {isSoldOut ? (
                    <span className="text-[9px] font-black uppercase text-rose-500 no-underline ml-1">
                      Sold Out
                    </span>
                  ) : szStock <= (product.lowStockThreshold || 5) ? (
                    <span
                      className={`text-[9px] font-bold px-1 rounded-full ${
                        isSelected ? 'bg-pink-700 text-white' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {szStock} left
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity & Add to Cart */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
        <div className="flex items-center justify-between sm:justify-start border border-slate-200 rounded-full px-3 py-2 bg-slate-50">
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="text-slate-500 hover:text-slate-900 font-extrabold px-2 text-sm disabled:opacity-40"
          >
            -
          </button>
          <span className="text-xs font-black w-8 text-center text-slate-900">{quantity}</span>
          <button
            type="button"
            disabled={isOutOfStock || quantity >= currentStock}
            onClick={() => setQuantity(quantity + 1)}
            className="text-slate-500 hover:text-slate-900 font-extrabold px-2 text-sm disabled:opacity-40"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <Button
            variant="primary"
            size="lg"
            disabled={!selectedVariant || isOutOfStock}
            className={`flex-1 btn-rexbebe-3d text-sm font-black py-3.5 tracking-wider uppercase ${
              !selectedVariant || isOutOfStock ? 'opacity-50 cursor-not-allowed bg-slate-300' : ''
            }`}
            onClick={() => {
              if (selectedVariant && !isOutOfStock) {
                addToCart(product, selectedVariant, quantity);
              }
            }}
          >
            {!selectedVariant
              ? 'Option Unavailable'
              : isOutOfStock
              ? 'Sold Out'
              : `Add to Cart — ${formatCurrency((selectedVariant.price || activePrice) * quantity)}`}
          </Button>

          <div className="shrink-0">
            <WishlistButton productId={product.id} />
          </div>

          <button
            type="button"
            onClick={() => setRegistrySaved(!registrySaved)}
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-center flex-shrink-0 ${
              registrySaved
                ? 'bg-pink-100 border-pink-300 text-pink-700'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
            title="Add to Baby Registry"
          >
            <Gift className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Specifications & Product Information Tabs */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveSpecTab('fabric')}
            className={`pb-2.5 px-3 text-xs font-extrabold transition-colors border-b-2 ${
              activeSpecTab === 'fabric'
                ? 'border-pink-500 text-pink-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Fabric &amp; Care
          </button>
          <button
            type="button"
            onClick={() => setActiveSpecTab('details')}
            className={`pb-2.5 px-3 text-xs font-extrabold transition-colors border-b-2 ${
              activeSpecTab === 'details'
                ? 'border-pink-500 text-pink-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Product Specs
          </button>
          <button
            type="button"
            onClick={() => setActiveSpecTab('care')}
            className={`pb-2.5 px-3 text-xs font-extrabold transition-colors border-b-2 ${
              activeSpecTab === 'care'
                ? 'border-pink-500 text-pink-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Features &amp; Origin
          </button>
        </div>

        <div className="bg-slate-50/70 rounded-2xl p-4 text-xs text-slate-700 space-y-2">
          {activeSpecTab === 'fabric' && (
            <div className="space-y-2">
              <div>
                <span className="font-extrabold text-slate-900">Material Composition:</span>{' '}
                {product.fabricMaterial || '100% GOTS Certified Organic Cotton'}
              </div>
              <div>
                <span className="font-extrabold text-slate-900">Care Instructions:</span>{' '}
                {product.careInstructions || 'Gentle machine wash cold with baby detergent. Dry flat in shade.'}
              </div>
            </div>
          )}

          {activeSpecTab === 'details' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-extrabold text-slate-900">Product SKU:</span>{' '}
                {selectedVariant?.sku || product.sku || 'N/A'}
              </div>
              <div>
                <span className="font-extrabold text-slate-900">Brand:</span>{' '}
                {product.brand || 'REXBEBE Atelier'}
              </div>
              <div>
                <span className="font-extrabold text-slate-900">Gender:</span>{' '}
                {product.gender || 'Baby Unisex'}
              </div>
              <div>
                <span className="font-extrabold text-slate-900">Age Range:</span>{' '}
                {product.ageGroup || 'Newborn – 2 Years'}
              </div>
              {product.weight && (
                <div>
                  <span className="font-extrabold text-slate-900">Item Weight:</span>{' '}
                  {product.weight}
                </div>
              )}
            </div>
          )}

          {activeSpecTab === 'care' && (
            <div className="space-y-2">
              <div>
                <span className="font-extrabold text-slate-900">Country of Origin:</span>{' '}
                {product.countryOfOrigin || 'Sri Lanka & Portugal'}
              </div>
              {product.features && product.features.length > 0 && (
                <div>
                  <span className="font-extrabold text-slate-900 block mb-1">Key Highlights:</span>
                  <ul className="list-disc pl-4 space-y-1">
                    {product.features.map((feat, idx) => (
                      <li key={idx}>{feat}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Luxury Quality Guarantees */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-600 font-bold">
        <div className="flex flex-col items-center space-y-1 p-2 rounded-2xl bg-purple-50/60 border border-purple-100/60">
          <Truck className="w-4 h-4 text-purple-700" />
          <span>Express Islandwide Delivery</span>
        </div>
        <div className="flex flex-col items-center space-y-1 p-2 rounded-2xl bg-pink-50/60 border border-pink-100/60">
          <ShieldCheck className="w-4 h-4 text-pink-700" />
          <span>GOTS Organic Certified</span>
        </div>
        <div className="flex flex-col items-center space-y-1 p-2 rounded-2xl bg-sky-50/60 border border-sky-100/60">
          <RotateCcw className="w-4 h-4 text-sky-700" />
          <span>30-Day Easy Returns</span>
        </div>
      </div>

      <SizeGuide isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
    </div>
  );
}
