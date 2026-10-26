'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { useAdminData } from '../../hooks/AdminContext';
import { formatCurrency } from '../../utils/formatCurrency';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_TAGS = [
  'Cashmere Romper',
  'Giraffe T-Shirt',
  'French Linen',
  'CoComelon',
  'Organic Cotton',
  '0-6 Months',
  'Toddler Set',
];

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const { products } = useAdminData();
  const [query, setQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const filteredProducts = query.trim()
    ? products
        .filter((p) => p.status !== 'draft' && p.status !== 'unpublished')
        .filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.description.toLowerCase().includes(query.toLowerCase()) ||
            p.category?.name.toLowerCase().includes(query.toLowerCase()) ||
            p.subcategory?.name?.toLowerCase().includes(query.toLowerCase()) ||
            p.sku?.toLowerCase().includes(query.toLowerCase()) ||
            (p.sizes || []).some((s) => s.toLowerCase().includes(query.toLowerCase())) ||
            (p.colors || []).some((c) => c.name.toLowerCase().includes(query.toLowerCase()))
        )
    : [];

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Search Box Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative max-w-4xl mx-auto mt-6 md:mt-16 px-4 z-10"
          >
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-purple-100 dark:border-slate-800">
              
              {/* Form Input Header */}
              <form onSubmit={handleSearchSubmit} className="relative flex items-center border-b border-purple-100 dark:border-slate-800 p-4 md:p-6 bg-purple-50/40 dark:bg-slate-800/40">
                <Search className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-4 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for dresses, rompers, baby sets..."
                  className="w-full text-base md:text-xl font-heading font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Clear query"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-2xl hover:bg-purple-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close search"
                >
                  <X className="w-6 h-6" />
                </button>
              </form>

              {/* Suggestions / Results Area */}
              <div className="p-6 max-h-[70vh] overflow-y-auto touch-scroll">
                {query.trim() === '' ? (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-bold tracking-widest uppercase text-purple-900 dark:text-purple-300 mb-3">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Trending Searches 🌸</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_TAGS.map((tag, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleTagClick(tag)}
                            className="px-4 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-purple-700 dark:hover:text-purple-300 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-2xl transition-all shadow-xs flex items-center space-x-2"
                          >
                            <Tag className="w-3.5 h-3.5 text-purple-400" />
                            <span>{tag}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-purple-100 dark:border-slate-800">
                      <h3 className="text-xs font-bold tracking-widest uppercase text-purple-400 dark:text-purple-400 mb-4">
                        Curated Boutique Recommendations
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {products
                          .filter((p) => p.status !== 'draft' && p.status !== 'unpublished')
                          .slice(0, 4)
                          .map((prod) => (
                            <Link
                              key={prod.id}
                              href={`/products/${prod.slug}`}
                              onClick={onClose}
                              className="group block p-2.5 rounded-2xl hover:bg-purple-50/50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-purple-100 dark:hover:border-slate-700"
                            >
                              <div className="aspect-[4/5] bg-[#FAF7F2] dark:bg-slate-900 rounded-xl overflow-hidden mb-2 relative flex items-center justify-center">
                                <Image
                                  src={prod.images[0]?.url || '/images/products/organic-onesie.jpg'}
                                  alt={prod.name}
                                  fill
                                  sizes="120px"
                                  className="w-full h-full object-contain object-center pointer-events-none group-hover:scale-105 transition-transform duration-300 ease-out will-change-transform"
                                />
                              </div>
                              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                {prod.name}
                              </h4>
                              <p className="text-xs text-purple-700 dark:text-purple-300 font-bold mt-0.5">
                                {formatCurrency(prod.price)}
                              </p>
                            </Link>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-purple-100 dark:border-slate-800 text-xs">
                      <span className="text-purple-700 dark:text-purple-300 font-medium">
                        Found <strong className="text-slate-900 dark:text-slate-100">{filteredProducts.length}</strong> results for "{query}"
                      </span>
                      {filteredProducts.length > 0 && (
                        <button
                          onClick={() => handleSearchSubmit()}
                          className="text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center space-x-1"
                        >
                          <span>View All in Search Page</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <p className="text-sm font-medium">No luxury pieces match "{query}"</p>
                        <p className="text-xs mt-1 text-slate-400 dark:text-slate-500">
                          Try searching for t-shirt, romper, cocomelon, or giraffe
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredProducts.map((product) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            onClick={onClose}
                            className="flex items-center space-x-4 p-3 rounded-2xl border border-purple-100 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50/50 dark:hover:bg-slate-800/50 transition-all group shadow-xs"
                          >
                            <div className="w-14 aspect-[4/5] bg-[#FAF7F2] dark:bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 relative flex items-center justify-center">
                              <Image
                                src={product.images[0]?.url || '/images/products/organic-onesie.jpg'}
                                alt={product.name}
                                fill
                                sizes="64px"
                                className="w-full h-full object-contain object-center pointer-events-none group-hover:scale-105 transition-transform duration-300 ease-out will-change-transform"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] uppercase tracking-wider text-purple-600 dark:text-purple-300 font-bold bg-purple-100 dark:bg-purple-950/70 px-2 py-0.5 rounded-full">
                                {product.category?.name || 'Collection'}
                              </span>
                              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 mt-1">
                                {product.name}
                              </h4>
                              <p className="text-xs text-purple-900 dark:text-purple-200 font-bold mt-0.5">
                                {formatCurrency(product.price)}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
