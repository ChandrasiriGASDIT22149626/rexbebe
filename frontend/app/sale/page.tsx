'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ProductGrid } from '../../components/products/ProductGrid';
import { CategoryHeaderBanner } from '../../components/layout/CategoryHeaderBanner';
import { useAdminData } from '../../hooks/AdminContext';

function SaleContent() {
  const { products } = useAdminData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const genderParam = searchParams.get('gender');
  const categoryParam = searchParams.get('category');
  const discountParam = searchParams.get('discount');
  const filterParam = searchParams.get('filter');

  const activeSub =
    categoryParam ||
    (genderParam ? `${genderParam}-sale` : '') ||
    discountParam ||
    filterParam ||
    'all';

  const [activeTab, setActiveTab] = useState(activeSub);

  useEffect(() => {
    setActiveTab(activeSub);
  }, [activeSub]);

  const handleSelectSub = (val: string) => {
    setActiveTab(val);
    if (val === 'all') {
      router.push('/sale');
    } else if (val === 'girls') {
      router.push('/sale?gender=girls');
    } else if (val === 'boys') {
      router.push('/sale?gender=boys');
    } else if (val === 'newborn') {
      router.push('/sale?category=newborn');
    } else if (['under-20', '20-30', '30-50', '50-plus'].includes(val)) {
      router.push(`/sale?discount=${val}`);
    } else if (['final-sizes', 'almost-gone', 'clearance'].includes(val)) {
      router.push(`/sale?filter=${val}`);
    } else {
      router.push(`/sale?category=${encodeURIComponent(val)}`);
    }
  };

  const saleProducts = products
    .filter((p) => p.comparePrice && p.comparePrice > p.price && p.status !== 'draft' && p.status !== 'unpublished')
    .filter((product) => {
    if (genderParam === 'girls') {
      return (
        product.name.toLowerCase().includes('girl') ||
        product.category.name.toLowerCase().includes('girl') ||
        product.category.slug.toLowerCase().includes('girl')
      );
    }
    if (genderParam === 'boys') {
      return (
        product.name.toLowerCase().includes('boy') ||
        product.category.name.toLowerCase().includes('boy') ||
        product.category.slug.toLowerCase().includes('boy')
      );
    }
    if (categoryParam) {
      return (
        product.name.toLowerCase().includes(categoryParam.toLowerCase()) ||
        product.category.name.toLowerCase().includes(categoryParam.toLowerCase())
      );
    }
    if (filterParam === 'clearance' || filterParam === 'almost-gone') {
      const totalStock = product.variants?.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0) || 0;
      return totalStock < 15;
    }
    if (activeTab && activeTab !== 'all') {
      return (
        product.name.toLowerCase().includes(activeTab.toLowerCase()) ||
        product.category.name.toLowerCase().includes(activeTab.toLowerCase())
      );
    }
    return true;
  });

  const subCategories = [
    { name: 'All Sale', value: 'all', icon: '🔥' },
    { name: 'Baby Girls Sale', value: 'girls', icon: '🌸' },
    { name: 'Baby Boys Sale', value: 'boys', icon: '🦕' },
    { name: 'Newborn Sale', value: 'newborn', icon: '🍼' },
    { name: '20–30% Off', value: '20-30', icon: '🏷️' },
    { name: '30–50% Off', value: '30-50', icon: '✨' },
    { name: 'Last Chance', value: 'clearance', icon: '⚡' },
  ];

  const displayTitle =
    activeTab && activeTab !== 'all'
      ? `SALE — ${activeTab.replace('-', ' ').toUpperCase()}`
      : 'PRIVATE ATELIER SALE';

  return (
    <>
      <CategoryHeaderBanner
        badge="LIMITED SEASONAL CLEARANCE 🔥"
        title={displayTitle}
        highlightWord="OFFERS"
        description="Exclusive savings on previous seasonal capsule releases, organic knitwear, and nursery essentials. Limited quantities available."
        activeSubCategory={activeSub}
        subCategories={subCategories}
        onSelectSubCategory={handleSelectSub}
        totalProducts={saleProducts.length}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <ProductGrid products={saleProducts} />
      </main>
    </>
  );
}

export default function SalePage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="py-20 text-center font-heading font-extrabold text-slate-400">Loading private atelier sale...</div>}>
        <SaleContent />
      </Suspense>
      <Footer />
    </>
  );
}
