'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ProductGrid } from '../../components/products/ProductGrid';
import { CategoryHeaderBanner } from '../../components/layout/CategoryHeaderBanner';
import { useAdminData } from '../../hooks/AdminContext';

function GiftingContent() {
  const { products } = useAdminData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeParam = searchParams.get('type') || 'all';

  const [activeSub, setActiveSub] = useState(typeParam);

  useEffect(() => {
    setActiveSub(typeParam);
  }, [typeParam]);

  const handleSelectSub = (val: string) => {
    setActiveSub(val);
    if (val === 'all') {
      router.push('/gifting');
    } else {
      router.push(`/gifting?type=${encodeURIComponent(val)}`);
    }
  };

  // Filter products for gifting
  const giftingProducts = products.filter((product) => {
    if (product.status === 'draft' || product.status === 'unpublished') return false;
    if (activeSub === 'all') return true;
    if (activeSub === 'baby-gift-sets' || activeSub === 'newborn-gifts') {
      return (
        product.name.toLowerCase().includes('set') ||
        product.name.toLowerCase().includes('swaddle') ||
        product.category?.slug.includes('swaddles') ||
        product.category?.slug.includes('clothing')
      );
    }
    if (activeSub === 'baby-shower' || activeSub === 'birthday-gifts') {
      return (
        product.isFeatured ||
        product.rating >= 4.8 ||
        product.category?.slug.includes('toys')
      );
    }
    return (
      product.name.toLowerCase().includes(activeSub.toLowerCase()) ||
      product.category?.name.toLowerCase().includes(activeSub.toLowerCase())
    );
  });

  const subCategories = [
    { name: 'All Gifts', value: 'all', icon: '🎁' },
    { name: 'Baby Gift Sets', value: 'baby-gift-sets', icon: '🎀' },
    { name: 'Newborn Gifts', value: 'newborn-gifts', icon: '🍼' },
    { name: 'Baby Shower Gifts', value: 'baby-shower', icon: '🌸' },
    { name: 'Birthday Gifts', value: 'birthday-gifts', icon: '✨' },
    { name: 'Gift Cards', value: 'gift-cards', icon: '💌' },
  ];

  const displayTitle =
    activeSub && activeSub !== 'all'
      ? activeSub.replace(/-/g, ' ').toUpperCase()
      : 'BESPOKE BABY GIFTING';

  return (
    <>
      <CategoryHeaderBanner
        badge="HEIRLOOM GIFTING ATELIER 🎁"
        title={displayTitle}
        highlightWord="COLLECTION"
        description="Handcrafted keepsake gift hampers, organic cashmere newborn welcome sets, French flax linen bundles, and personalized luxury gift vouchers."
        activeSubCategory={activeSub}
        subCategories={subCategories}
        onSelectSubCategory={handleSelectSub}
        totalProducts={giftingProducts.length > 0 ? giftingProducts.length : products.length}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <ProductGrid products={giftingProducts.length > 0 ? giftingProducts : products} />
      </main>
    </>
  );
}

export default function GiftingPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className="py-20 text-center font-heading font-extrabold text-slate-400">
            Loading bespoke baby gifting...
          </div>
        }
      >
        <GiftingContent />
      </Suspense>
      <Footer />
    </>
  );
}
