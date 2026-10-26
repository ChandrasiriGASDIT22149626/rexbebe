'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ProductGrid } from '../../components/products/ProductGrid';
import { useWishlist } from '../../hooks/useWishlist';
import { Heart, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function SavedWishlistPage() {
  const { wishlistItems, wishlistCount, clearWishlist, isLoaded } = useWishlist();

  return (
    <>
      <Header />
      <main className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[60vh]">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/60 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Heart className="w-6 h-6 fill-rose-500" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl text-slate-900 dark:text-slate-100 font-extrabold">
            My Saved Wishlist
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">
            You have {wishlistCount} luxury {wishlistCount === 1 ? 'piece' : 'pieces'} saved in your boutique wishlist.
          </p>
          {wishlistCount > 0 && (
            <div className="pt-3">
              <button
                onClick={clearWishlist}
                className="inline-flex items-center space-x-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Wishlist</span>
              </button>
            </div>
          )}
        </div>

        {!isLoaded ? (
          <div className="py-20 text-center text-xs font-bold text-slate-400 animate-pulse">
            Loading your saved boutique pieces...
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800 max-w-md mx-auto space-y-4 p-8 shadow-xs">
            <p className="font-heading text-lg font-bold text-slate-800 dark:text-slate-200">
              Your wishlist is currently empty
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Save your favorite cashmere rompers, swaddles, and toddler pieces by tapping the heart icon on any product.
            </p>
            <div className="pt-2">
              <Link href="/shop" className="inline-block">
                <Button variant="primary" size="md" className="shadow-md">
                  <span>Explore Boutique Shop</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <ProductGrid products={wishlistItems} />
        )}
      </main>
      <Footer />
    </>
  );
}
