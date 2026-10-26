import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Sparkles, Home, ArrowRight, ShoppingBag, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Page Not Found (404) | REXBEBE',
  description:
    'The baby boutique page you are looking for may have moved or been updated. Discover handcrafted organic cashmere rompers and nursery essentials at REXBEBE.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#FAF9F6] via-[#FDF2F8]/20 to-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center space-y-8 flex flex-col items-center justify-center">
        {/* Animated Cute Mascot Pill */}
        <div className="relative inline-block animate-float-slow">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-pink-100 via-purple-100 to-sky-100 flex items-center justify-center text-4xl sm:text-5xl shadow-rexbebe-sm border border-white">
            🦕
          </div>
          <span className="absolute -bottom-2 -right-2 bg-amber-400 text-stone-900 text-xs font-black px-2.5 py-1 rounded-full shadow-xs">
            404
          </span>
        </div>

        {/* Headings */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Little Wandering Moment</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-stone-900 tracking-tight">
            We Couldn't Find That Little Page
          </h1>
          <p className="text-sm sm:text-base text-stone-600 max-w-lg mx-auto leading-relaxed">
            The page or product you were looking for may have been moved, renamed, or is temporarily out of season.
            Let's help you find the perfect boutique pieces for your little one.
          </p>
        </div>

        {/* Search Bar for fast re-discovery */}
        <form
          action="/search"
          method="GET"
          className="w-full max-w-md relative flex items-center shadow-xs"
        >
          <Search className="w-4 h-4 text-stone-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            name="q"
            placeholder="Search rompers, dresses, swaddles..."
            className="w-full pl-11 pr-24 py-3 bg-white border border-stone-200 rounded-full text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-300 shadow-xs text-stone-800"
          />
          <button
            type="submit"
            className="absolute right-1.5 px-4 py-2 bg-purple-950 hover:bg-purple-900 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Search
          </button>
        </form>

        {/* Quick Category Discovery Pills */}
        <div className="space-y-3 w-full">
          <span className="text-xs font-extrabold text-stone-400 uppercase tracking-wider block">
            Popular Boutique Categories:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { name: '✨ New In', href: '/new-in' },
              { name: '🌸 Baby Girls', href: '/girls' },
              { name: '🦕 Baby Boys', href: '/boys' },
              { name: '🍼 Newborn Essentials', href: '/baby' },
              { name: '🎁 Luxury Gifting', href: '/gifting' },
              { name: '🏷️ Boutique Sale', href: '/sale' },
            ].map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-pink-50 border border-stone-200 text-xs font-bold text-stone-700 hover:text-pink-600 transition-colors shadow-2xs"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-full bg-purple-950 hover:bg-purple-900 text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-full bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 font-extrabold text-xs uppercase tracking-wider shadow-2xs hover:shadow-xs transition-all"
          >
            <ShoppingBag className="w-4 h-4 text-pink-500" />
            <span>Browse Full Catalog</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
