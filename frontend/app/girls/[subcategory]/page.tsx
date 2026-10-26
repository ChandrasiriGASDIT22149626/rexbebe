import React from 'react';
import type { Metadata } from 'next';
import { CategoryShoppingTemplate } from '../../../components/products/CategoryShoppingTemplate';
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd';
import { generateCategoryMetadata } from '../../../config/seoConfig';

interface Props {
  params: { subcategory: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cleanTitle = params.subcategory.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return generateCategoryMetadata({
    title: `${cleanTitle} - Baby Girls Luxury Collection | REXBEBE`,
    description: `Explore our handcrafted ${cleanTitle} collection for baby girls at REXBEBE. Heirloom quality, GOTS-certified organic cotton, and delicate twirl-ready styling.`,
    path: `/girls/${params.subcategory}`,
  });
}

export default function GirlsSubcategoryPage({ params }: Props) {
  const cleanTitle = params.subcategory.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Girls', url: '/girls' },
    { name: cleanTitle, url: `/girls/${params.subcategory}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <CategoryShoppingTemplate
        slug={params.subcategory}
        parentName="Girls"
        parentUrl="/girls"
      />
    </>
  );
}
