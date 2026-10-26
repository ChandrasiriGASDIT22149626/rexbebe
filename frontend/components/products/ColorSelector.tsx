import React from 'react';
import { ProductVariant } from '../../types/product';

interface ColorSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant;
  onSelect: (variant: ProductVariant) => void;
}

export function ColorSelector({ variants, selectedVariant, onSelect }: ColorSelectorProps) {
  const colors = Array.from(new Set(variants.map(v => v.color).filter(Boolean)));

  if (colors.length === 0) return null;

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
        Color: <span className="text-stone-900 font-bold">{selectedVariant.color}</span>
      </label>
      <div className="flex items-center space-x-3">
        {variants.map(v => (
          v.colorHex && (
            <button
              key={v.id}
              onClick={() => onSelect(v)}
              className={`w-7 h-7 rounded-full border-2 transition-all p-0.5 ${
                selectedVariant.id === v.id ? 'border-brand-600 ring-2 ring-brand-200' : 'border-stone-200'
              }`}
              title={v.color}
            >
              <span className="block w-full h-full rounded-full" style={{ backgroundColor: v.colorHex }} />
            </button>
          )
        ))}
      </div>
    </div>
  );
}
