'use client';

import React from 'react';
import { Header } from '../../../components/layout/Header';
import { Footer } from '../../../components/layout/Footer';
import { ProductGrid } from '../../../components/products/ProductGrid';
import { useWishlist } from '../../../hooks/useWishlist';
import Link from 'next/link';

export default function WishlistPage() {
  const { wishlistItems } = useWishlist();

  return (
    <>
      <Header />
      <main className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[60vh]">
        <h1 className="font-serif text-3xl text-stone-900 font-normal mb-8">My Saved Wishlist</h1>
        {wishlistItems.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center mx-auto text-2xl">
              🤍
            </div>
            <p className="text-sm text-stone-600">Your wishlist is currently empty.</p>
            <Link
              href="/shop"
              className="inline-block px-5 py-2.5 rounded-full bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <ProductGrid products={wishlistItems} />
        )}
      </main>
      <Footer />
    </>
  );
}
