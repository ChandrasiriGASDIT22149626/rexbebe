'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ProductGrid } from '../../components/products/ProductGrid';
import { useAdminData } from '../../hooks/AdminContext';
import { Search, X, Sparkles } from 'lucide-react';

function SearchContent() {
  const { products } = useAdminData();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const activeProducts = products.filter((p) => p.status !== 'draft' && p.status !== 'unpublished');

  const filtered = query.trim()
    ? activeProducts.filter((p) => {
        const q = query.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q) ||
          p.subcategory?.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          (p.sizes || []).some((s) => s.toLowerCase().includes(q)) ||
          (p.colors || []).some((c) => c.name.toLowerCase().includes(q))
        );
      })
    : activeProducts;

  return (
    <main className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[60vh]">
      <div className="max-w-xl mx-auto mb-10 text-center">
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-4">
          Boutique Catalog Search
        </h1>
        
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dresses, rompers, baby sets..."
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-4 py-3.5 pl-11 pr-10 rounded-2xl focus:outline-none focus:border-purple-500 shadow-sm transition-all"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4" />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {query.trim() && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium">
            Showing <strong className="text-slate-900 dark:text-slate-100">{filtered.length}</strong> {filtered.length === 1 ? 'item' : 'items'} for "{query}"
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800 max-w-md mx-auto space-y-3 p-8">
          <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-slate-800 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto text-xl">
            🔍
          </div>
          <p className="font-heading text-lg font-bold text-slate-800 dark:text-slate-200">
            No matching pieces found
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            We couldn't find anything matching "{query}". Try checking your spelling or searching for baby, toddler, cocomelon, or romper.
          </p>
        </div>
      ) : (
        <ProductGrid products={filtered} />
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="py-20 text-center text-xs text-slate-500">Loading search results...</div>}>
        <SearchContent />
      </Suspense>
      <Footer />
    </>
  );
}
