'use client';

import React from 'react';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { CartItemState, useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatCurrency';

export function CartItem({ item }: { item: CartItemState }) {
  const { updateQuantity, removeFromCart } = useCart();
  const itemImage = item.variant.imageUrl || item.product.images[0]?.url || '/images/products/organic-onesie.jpg';
  const availableStock = item.variant.stockQuantity ?? item.product.stockQuantity ?? 999;
  const isMaxStock = item.quantity >= availableStock;

  return (
    <div className="flex space-x-4 pb-4 border-b border-stone-100 dark:border-slate-800">
      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-100 dark:bg-slate-800 flex-shrink-0">
        <Image src={itemImage} alt={item.product.name} fill className="object-cover" />
      </div>

      <div className="flex-1 space-y-1">
        <h4 className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
          {item.variant.partName ? `${item.product.name} (${item.variant.partName})` : item.product.name}
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {item.variant.partName && (
            <span className="font-bold text-pink-700 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/60 px-1.5 py-0.5 rounded text-[10px] mr-1.5 border border-pink-100 dark:border-pink-900">
              {item.variant.partName}
            </span>
          )}
          {item.variant.color && `Color: ${item.variant.color} `}
          {item.variant.size && `| Size: ${item.variant.size}`}
        </p>

        {isMaxStock && availableStock < 999 && (
          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
            Max available stock ({availableStock}) reached
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center border border-stone-200 dark:border-slate-700 rounded-full px-2 py-0.5 text-xs bg-white dark:bg-slate-800">
            <button
              onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
              className="w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-bold"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="px-2 font-bold min-w-5 text-center text-slate-900 dark:text-slate-100">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
              disabled={isMaxStock}
              className={`w-6 h-6 flex items-center justify-center font-bold ${
                isMaxStock
                  ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              aria-label="Increase quantity"
              title={isMaxStock ? 'Max stock reached' : 'Increase quantity'}
            >
              +
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-black text-slate-900 dark:text-slate-100">
              {formatCurrency((item.variant.price || item.product.price) * item.quantity)}
            </span>
            <button
              onClick={() => removeFromCart(item.variant.id)}
              className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
              aria-label="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
