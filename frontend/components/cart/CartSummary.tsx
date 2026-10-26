import React from 'react';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatCurrency';

export function CartSummary() {
  const { subtotal, shippingFee, total } = useCart();

  return (
    <div className="bg-brand-50/60 dark:bg-slate-800/60 p-6 rounded-2xl border border-brand-100 dark:border-slate-700 space-y-4">
      <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">Order Summary</h3>
      
      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex justify-between">
          <span>Items Subtotal</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Estimated Shipping</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {shippingFee === 0 ? 'Complimentary 🌸' : formatCurrency(shippingFee)}
          </span>
        </div>
        <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-slate-100 pt-3 border-t border-brand-200 dark:border-slate-700">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
