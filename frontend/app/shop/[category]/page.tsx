import React from 'react';
import type { Metadata } from 'next';
import { CategoryShoppingTemplate } from '../../../components/products/CategoryShoppingTemplate';
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd';
import { generateCategoryMetadata } from '../../../config/seoConfig';

interface Props {
  params: { category: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cleanCategory = params.category.replace(/-/g, ' ');
  const formattedTitle = cleanCategory.replace(/\b\w/g, (l) => l.toUpperCase());

  return generateCategoryMetadata({
    title: `${formattedTitle} - Baby Boutique Collection`,
    description: `Shop our curated ${cleanCategory} collection for babies and toddlers at REXBEBE. Certified organic cashmere, pure linen, and gentle pastel hues.`,
    path: `/shop/${params.category}`,
  });
}

export default function DynamicShopCategoryPage({ params }: Props) {
  const cleanCategory = params.category.replace(/-/g, ' ');
  const formattedTitle = cleanCategory.replace(/\b\w/g, (l) => l.toUpperCase());

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
    { name: formattedTitle, url: `/shop/${params.category}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <CategoryShoppingTemplate
        slug={params.category}
        parentName="Shop"
        parentUrl="/shop"
      />
    </>
  );
}
