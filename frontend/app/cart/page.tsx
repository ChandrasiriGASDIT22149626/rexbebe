'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { useCart } from '../../hooks/useCart';
import { CartItem } from '../../components/cart/CartItem';
import { CartSummary } from '../../components/cart/CartSummary';
import { Button } from '../../components/ui/Button';
import { ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';

export default function CartPage() {
  const { items, clearCart } = useCart();

  return (
    <>
      <Header />
      <main className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[60vh]">
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-8">
          Shopping Bag
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800 max-w-md mx-auto space-y-4 p-8">
            <div className="w-16 h-16 bg-purple-50 dark:bg-slate-800 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto text-2xl shadow-xs">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <p className="font-heading text-xl font-bold text-slate-800 dark:text-slate-200">
              Your shopping bag is currently empty
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Explore our boutique collections for handcrafted organic rompers and baby sets.
            </p>
            <div className="pt-2">
              <Link href="/shop" className="inline-block">
                <Button variant="primary" size="md">
                  <span>Continue Shopping</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-8 space-y-4 bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800">
              {items.map((item) => (
                <CartItem key={item.variant.id} item={item} />
              ))}
              <div className="pt-4 flex justify-between items-center">
                <Link href="/shop" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
                  ← Continue Shopping
                </Link>
                <button
                  onClick={clearCart}
                  className="flex items-center space-x-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Shopping Bag</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <CartSummary />
              <Link href="/checkout" className="block">
                <Button variant="primary" size="lg" className="w-full text-xs font-extrabold shadow-md">
                  Proceed to Checkout 🌸
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
