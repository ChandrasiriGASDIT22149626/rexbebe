'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ProductGrid } from '../../components/products/ProductGrid';
import { CategoryHeaderBanner } from '../../components/layout/CategoryHeaderBanner';
import { useAdminData } from '../../hooks/AdminContext';

function NewInContent() {
  const { products } = useAdminData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get('category') || 'all';

  const [activeSub, setActiveSub] = useState(categoryParam);

  useEffect(() => {
    setActiveSub(categoryParam);
  }, [categoryParam]);

  const handleSelectSub = (val: string) => {
    setActiveSub(val);
    if (val === 'all') {
      router.push('/new-in');
    } else {
      router.push(`/new-in?category=${encodeURIComponent(val)}`);
    }
  };

  // New arrivals products
  const newArrivals = products.filter((p) => {
    if (!p.isNewArrival || p.status === 'draft' || p.status === 'unpublished') return false;
    if (activeSub && activeSub.toLowerCase() !== 'all') {
      return (
        p.name.toLowerCase().includes(activeSub.toLowerCase()) ||
        p.category?.name.toLowerCase().includes(activeSub.toLowerCase())
      );
    }
    return true;
  });

  const subCategories = [
    { name: 'All New In', value: 'all', icon: '✨' },
    { name: 'Newborn', value: 'Newborn', icon: '🌸' },
    { name: 'Girls', value: 'Girl', icon: '👑' },
    { name: 'Boys', value: 'Boy', icon: '🦕' },
    { name: 'Toys & Gear', value: 'Nursery', icon: '🧸' },
  ];

  return (
    <>
      <CategoryHeaderBanner
        badge="NEW SEASON RELEASE ✨"
        title="NEW ARRIVALS"
        highlightWord="ATELIER"
        description="Freshly knitted organic cashmere pieces, latest Scandinavian wooden nursery arrivals, and limited season debuts."
        activeSubCategory={activeSub}
        subCategories={subCategories}
        onSelectSubCategory={handleSelectSub}
        totalProducts={newArrivals.length > 0 ? newArrivals.length : products.length}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <ProductGrid products={newArrivals.length > 0 ? newArrivals : products} />
      </main>
    </>
  );
}

export default function NewInPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="py-20 text-center font-heading font-extrabold text-slate-400">Loading new arrivals...</div>}>
        <NewInContent />
      </Suspense>
      <Footer />
    </>
  );
}
