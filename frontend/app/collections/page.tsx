'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ProductGrid } from '../../components/products/ProductGrid';
import { CategoryHeaderBanner } from '../../components/layout/CategoryHeaderBanner';
import { useAdminData } from '../../hooks/AdminContext';

function CollectionsContent() {
  const { products } = useAdminData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const filterParam = searchParams.get('filter') || 'all';

  const [activeSub, setActiveSub] = useState(filterParam);

  useEffect(() => {
    setActiveSub(filterParam);
  }, [filterParam]);

  const handleSelectSub = (val: string) => {
    setActiveSub(val);
    if (val === 'all') {
      router.push('/collections');
    } else {
      router.push(`/collections?filter=${encodeURIComponent(val)}`);
    }
  };

  const filteredProducts = products.filter((product) => {
    if (product.status === 'draft' || product.status === 'unpublished') return false;
    if (activeSub === 'best-sellers') return product.isBestSeller;
    if (activeSub === 'new-season') return product.isNewArrival;
    if (activeSub === 'everyday') return product.price < 20000;
    if (activeSub === 'premium') return product.price >= 20000;
    if (activeSub !== 'all') {
      return (
        product.name.toLowerCase().includes(activeSub.toLowerCase()) ||
        product.category?.name.toLowerCase().includes(activeSub.toLowerCase())
      );
    }
    return true;
  });

  const subCategories = [
    { name: 'All Collections', value: 'all', icon: '🎀' },
    { name: 'Best Sellers', value: 'best-sellers', icon: '🌿' },
    { name: 'New Season', value: 'new-season', icon: '✨' },
    { name: 'Everyday Essentials', value: 'everyday', icon: '🌸' },
    { name: 'Premium Atelier', value: 'premium', icon: '👑' },
  ];

  const displayTitle =
    activeSub && activeSub !== 'all'
      ? activeSub.replace('-', ' ').toUpperCase()
      : 'BOUTIQUE COLLECTIONS';

  return (
    <>
      <CategoryHeaderBanner
        badge="CURATED CAPSULE EDITIONS 🎀"
        title={displayTitle}
        highlightWord="SERIES"
        description="Explore our handpicked seasonal collections crafted with organic cashmere, Scandinavian solid wood, and French flax linen."
        activeSubCategory={activeSub}
        subCategories={subCategories}
        onSelectSubCategory={handleSelectSub}
        totalProducts={filteredProducts.length > 0 ? filteredProducts.length : products.length}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <ProductGrid products={filteredProducts.length > 0 ? filteredProducts : products} />
      </main>
    </>
  );
}

export default function CollectionsPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="py-20 text-center font-heading font-extrabold text-slate-400">Loading boutique collections...</div>}>
        <CollectionsContent />
      </Suspense>
      <Footer />
    </>
  );
}
