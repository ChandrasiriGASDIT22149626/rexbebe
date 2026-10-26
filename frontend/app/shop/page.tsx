'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SharedCategoryPageTemplate } from '../../components/products/CategoryShoppingTemplate';

function ShopContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const ageParam = searchParams.get('age');

  let activeSlug = 'newborn';
  if (categoryParam) {
    activeSlug = categoryParam.toLowerCase();
  } else if (ageParam) {
    if (ageParam.includes('0-3m') || ageParam === 'newborn') {
      activeSlug = 'newborn';
    } else {
      activeSlug = `age-${ageParam}`;
    }
  }

  return (
    <SharedCategoryPageTemplate
      slug={activeSlug}
      parentName="Home"
      parentUrl="/"
    />
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center font-heading font-extrabold text-slate-400">Loading boutique collection...</div>}>
      <ShopContent />
    </Suspense>
  );
}
