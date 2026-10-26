import React from 'react';
import type { Metadata } from 'next';
import { CategoryShoppingTemplate } from '../../../components/products/CategoryShoppingTemplate';
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd';
import { generateCategoryMetadata } from '../../../config/seoConfig';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cleanTitle = params.slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return generateCategoryMetadata({
    title: `${cleanTitle} Capsule Collection | REXBEBE`,
    description: `Discover the ${cleanTitle} capsule collection at REXBEBE. Pure organic cashmere, handcrafted wooden nursery gym sets, and timeless Scandinavian nursery aesthetics.`,
    path: `/collections/${params.slug}`,
  });
}

export default function CollectionPage({ params }: Props) {
  const cleanTitle = params.slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Collections', url: '/collections' },
    { name: cleanTitle, url: `/collections/${params.slug}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <CategoryShoppingTemplate
        slug={params.slug}
        parentName="Collections"
        parentUrl="/collections"
      />
    </>
  );
}
