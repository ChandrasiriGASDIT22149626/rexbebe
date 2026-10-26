'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ProductGrid } from '../../components/products/ProductGrid';
import { CategoryHeaderBanner } from '../../components/layout/CategoryHeaderBanner';
import { useAdminData } from '../../hooks/AdminContext';

function BoysContent() {
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
      router.push('/boys');
    } else {
      router.push(`/boys?category=${encodeURIComponent(val)}`);
    }
  };

  // Filter products for Baby Boys
  const boysProducts = products.filter((product) => {
    if (product.status === 'draft' || product.status === 'unpublished') return false;
    if (product.gender === 'Boys') return true;
    const isBoyProduct =
      product.category?.name.toLowerCase().includes('boy') ||
      product.category?.slug.toLowerCase().includes('boy') ||
      product.name.toLowerCase().includes('boy') ||
      product.name.toLowerCase().includes('blue') ||
      product.name.toLowerCase().includes('shirt') ||
      product.name.toLowerCase().includes('short') ||
      product.name.toLowerCase().includes('nursery') ||
      product.name.toLowerCase().includes('nordic') ||
      product.name.toLowerCase().includes('celeste');

    if (!isBoyProduct) return false;

    if (activeSub && activeSub.toLowerCase() !== 'all') {
      const subMatch =
        product.name.toLowerCase().includes(activeSub.toLowerCase()) ||
        product.category?.name.toLowerCase().includes(activeSub.toLowerCase()) ||
        product.category?.slug.toLowerCase().includes(activeSub.toLowerCase());
      if (!subMatch) return false;
    }

    return true;
  });

  const subCategories = [
    { name: 'All Boys', value: 'all', icon: '🦕' },
    { name: 'Rompers', value: 'rompers', icon: '🌿' },
    { name: 'T-Shirts & Shirts', value: 'shirts', icon: '✨' },
    { name: 'Shorts & Trousers', value: 'shorts', icon: '🧢' },
    { name: 'Matching Sets', value: 'sets', icon: '🎀' },
    { name: 'Sleepwear', value: 'sleepwear', icon: '☁️' },
  ];

  const displayTitle =
    activeSub && activeSub !== 'all'
      ? `BOYS ${activeSub.toUpperCase()}`
      : 'BABY BOYS';

  return (
    <>
      <CategoryHeaderBanner
        badge="EVERYDAY ADVENTURES 🦕"
        title={displayTitle}
        highlightWord="COLLECTION"
        description="Durable organic cotton rompers, classic linen shirts, cozy knit sets, and playful everyday outfits tailored for little explorers."
        activeSubCategory={activeSub}
        subCategories={subCategories}
        onSelectSubCategory={handleSelectSub}
        totalProducts={boysProducts.length > 0 ? boysProducts.length : products.length}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <ProductGrid products={boysProducts.length > 0 ? boysProducts : products} />
      </main>
    </>
  );
}

export default function BoysPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="py-20 text-center font-heading font-extrabold text-slate-400">Loading baby boys collection...</div>}>
        <BoysContent />
      </Suspense>
      <Footer />
    </>
  );
}
