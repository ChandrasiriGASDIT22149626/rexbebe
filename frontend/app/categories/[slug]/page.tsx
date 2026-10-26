import React from 'react';
import type { Metadata } from 'next';
import { CategoryShoppingTemplate } from '../../../components/products/CategoryShoppingTemplate';
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd';
import { generateCategoryMetadata } from '../../../config/seoConfig';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cleanSlug = params.slug.replace(/-/g, ' ');
  const title = cleanSlug.replace(/\b\w/g, (l) => l.toUpperCase());

  return generateCategoryMetadata({
    title: `${title} - Baby Boutique Collection`,
    description: `Shop our curated collection of luxury ${cleanSlug} for babies and toddlers at REXBEBE. Crafted with certified organic cashmere, pure linen, and gentle pastel hues.`,
    path: `/categories/${params.slug}`,
  });
}

export default function CategoryPage({ params }: Props) {
  const cleanSlug = params.slug.replace(/-/g, ' ');
  const formattedTitle = cleanSlug.replace(/\b\w/g, (l) => l.toUpperCase());

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
    { name: formattedTitle, url: `/categories/${params.slug}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <CategoryShoppingTemplate
        slug={params.slug}
        parentName="Categories"
        parentUrl="/categories"
      />
    </>
  );
}
