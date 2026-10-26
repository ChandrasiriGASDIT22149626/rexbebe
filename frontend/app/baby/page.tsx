'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SharedCategoryPageTemplate } from '../../components/products/CategoryShoppingTemplate';

function BabyContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const activeSlug = categoryParam ? categoryParam.toLowerCase() : 'newborn';

  return (
    <SharedCategoryPageTemplate
      slug={activeSlug}
      parentName="Home"
      parentUrl="/"
    />
  );
}

export default function BabyPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center font-heading font-extrabold text-slate-400">Loading newborn collection...</div>}>
      <BabyContent />
    </Suspense>
  );
}
