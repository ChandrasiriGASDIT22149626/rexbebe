import React from 'react';
import { ProductVariant } from '../../types/product';

interface SizeSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant;
  onSelect: (variant: ProductVariant) => void;
}

export function SizeSelector({ variants, selectedVariant, onSelect }: SizeSelectorProps) {
  const sizes = Array.from(new Set(variants.map(v => v.size).filter(Boolean)));

  if (sizes.length === 0) return null;

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
        Size: <span className="text-stone-900 font-bold">{selectedVariant.size || 'Standard'}</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {variants.map(v => (
          v.size && (
            <button
              key={v.id}
              onClick={() => onSelect(v)}
              className={`px-4 py-2 text-xs font-medium rounded-full border transition-all ${
                selectedVariant.id === v.id
                  ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                  : 'border-stone-200 text-stone-700 hover:border-stone-400 bg-white'
              }`}
            >
              {v.size}
            </button>
          )
        ))}
      </div>
    </div>
  );
}
