'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, AlertCircle, CheckCircle } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { CartItem } from './CartItem';
import { formatCurrency } from '../../utils/formatCurrency';
import { Button } from '../ui/Button';

export function CartDrawer() {
  const { items, isOpen, closeCart, subtotal, shippingFee, total, notification, clearNotification } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between border-l border-purple-100 dark:border-slate-800 rounded-l-3xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-purple-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-900 rounded-tl-3xl">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-300">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">Your Shopping Bag 🛍</h2>
                  <p className="text-[10px] text-purple-600 dark:text-purple-400">{items.length} boutique {items.length === 1 ? 'item' : 'items'}</p>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-full hover:bg-purple-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* In-drawer Notification Alert */}
            {notification && (
              <div
                className={`mx-4 mt-3 p-3 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
                  notification.type === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                    : notification.type === 'error'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {notification.type === 'warning' || notification.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{notification.message}</span>
                </div>
                <button onClick={clearNotification} className="p-1 opacity-70 hover:opacity-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Items Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 touch-scroll">
              {items.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <div className="w-20 h-20 bg-purple-50 dark:bg-slate-800 text-purple-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <p className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">Your shopping bag is empty 🌸</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    Discover handcrafted organic cashmere rompers and toddler sets.
                  </p>
                  <button
                    onClick={closeCart}
                    className="text-xs text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider underline pt-2"
                  >
                    Discover New Arrivals ✨
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <CartItem key={item.variant.id} item={item} />
                ))
              )}
            </div>

            {/* Footer Summary & Action Buttons */}
            {items.length > 0 && (
              <div className="p-6 bg-gradient-to-br from-purple-50/80 via-pink-50/50 to-white dark:from-slate-800/80 dark:via-slate-900/50 dark:to-slate-950 border-t border-purple-100 dark:border-slate-800 space-y-4">
                <div className="space-y-2 text-xs font-medium">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Complimentary Shipping</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {shippingFee === 0 ? 'FREE 🌸' : formatCurrency(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 dark:text-slate-100 pt-2 border-t border-purple-200/80 dark:border-slate-700">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link href="/cart" onClick={closeCart}>
                    <Button variant="secondary" size="md" className="w-full text-[11px] shadow-sm">
                      VIEW CART 🛍
                    </Button>
                  </Link>

                  <Link href="/checkout" onClick={closeCart}>
                    <Button variant="primary" size="md" className="w-full text-[11px] shadow-md">
                      CHECKOUT 🌸
                    </Button>
                  </Link>
                </div>

                <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-light pt-1">
                  Tax included. Islandwide express boutique delivery available.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
