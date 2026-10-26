'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ProductGrid } from '../../components/products/ProductGrid';
import { CategoryHeaderBanner } from '../../components/layout/CategoryHeaderBanner';
import { useAdminData } from '../../hooks/AdminContext';

function GirlsContent() {
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
      router.push('/girls');
    } else {
      router.push(`/girls?category=${encodeURIComponent(val)}`);
    }
  };

  // Filter products for Baby Girls
  const girlsProducts = products.filter((product) => {
    if (product.status === 'draft' || product.status === 'unpublished') return false;
    if (product.gender === 'Girls') return true;
    const isGirlProduct =
      product.category?.name.toLowerCase().includes('girl') ||
      product.category?.name.toLowerCase().includes('dress') ||
      product.category?.slug.toLowerCase().includes('girl') ||
      product.name.toLowerCase().includes('girl') ||
      product.name.toLowerCase().includes('dress') ||
      product.name.toLowerCase().includes('floral') ||
      product.name.toLowerCase().includes('pink') ||
      product.name.toLowerCase().includes('skirt') ||
      product.name.toLowerCase().includes('aurelia');

    if (!isGirlProduct) return false;

    if (activeSub && activeSub.toLowerCase() !== 'all') {
      const subMatch =
        product.name.toLowerCase().includes(activeSub.toLowerCase()) ||
        (product.category?.name && product.category.name.toLowerCase().includes(activeSub.toLowerCase())) ||
        (product.category?.slug && product.category.slug.toLowerCase().includes(activeSub.toLowerCase()));
      if (!subMatch) return false;
    }

    return true;
  });

  const subCategories = [
    { name: 'All Girls', value: 'all', icon: '👑' },
    { name: 'Dresses', value: 'dresses', icon: '✨' },
    { name: 'Rompers', value: 'rompers', icon: '🌸' },
    { name: 'Tops & Tees', value: 'tops', icon: '🎀' },
    { name: 'Sets', value: 'sets', icon: '💫' },
    { name: 'Sleepwear', value: 'sleepwear', icon: '☁️' },
  ];

  const displayTitle =
    activeSub && activeSub !== 'all'
      ? `GIRLS ${activeSub.toUpperCase()}`
      : 'BABY GIRLS';

  return (
    <>
      <CategoryHeaderBanner
        badge="SWEET LITTLE LOOKS 👑"
        title={displayTitle}
        highlightWord="COLLECTION"
        description="Charming organic cotton dresses, delicate lace detailing, handcrafted knitwear, and dreamy twirl-ready outfits for little princesses."
        activeSubCategory={activeSub}
        subCategories={subCategories}
        onSelectSubCategory={handleSelectSub}
        totalProducts={girlsProducts.length > 0 ? girlsProducts.length : products.length}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <ProductGrid products={girlsProducts.length > 0 ? girlsProducts : products} />
      </main>
    </>
  );
}

export default function GirlsPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="py-20 text-center font-heading font-extrabold text-slate-400">Loading baby girls collection...</div>}>
        <GirlsContent />
      </Suspense>
      <Footer />
    </>
  );
}
