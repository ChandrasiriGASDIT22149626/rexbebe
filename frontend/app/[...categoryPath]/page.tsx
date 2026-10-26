import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryShoppingTemplate } from '../../components/products/CategoryShoppingTemplate';
import { BreadcrumbJsonLd } from '../../components/seo/JsonLd';
import { generateCategoryMetadata } from '../../config/seoConfig';

interface Props {
  params: { categoryPath: string[] };
}

// Known top-level reserved routes that have dedicated pages or assets
const RESERVED_PREFIXES = new Set([
  'api', '_next', 'images', 'icons', 'uploads', 'favicon.ico',
  'admin', 'cart', 'checkout', 'shop', 'girls', 'boys', 'baby',
  'new-in', 'sale', 'collections', 'about', 'contact', 'faq',
  'order', 'order-tracking', 'search', 'wishlist', 'categories',
  'terms', 'privacy', 'shipping', 'returns', 'cookies', 'reviews',
  'size-guide', 'store-locator', 'account', 'pages', 'track-order'
]);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pathParts = params.categoryPath || [];
  if (pathParts.length === 0 || RESERVED_PREFIXES.has(pathParts[0].toLowerCase())) {
    return {};
  }

  const targetSlug = pathParts[pathParts.length - 1];
  const cleanCategory = targetSlug.replace(/-/g, ' ');
  const formattedTitle = cleanCategory.replace(/\b\w/g, (l) => l.toUpperCase());

  return generateCategoryMetadata({
    title: `${formattedTitle} - Baby Boutique Collection`,
    description: `Shop our curated ${cleanCategory} collection for babies and toddlers at REXBEBE. Certified organic cashmere, pure linen, and gentle pastel hues.`,
    path: `/${pathParts.join('/')}`,
  });
}

export default function DynamicCategoryFallbackPage({ params }: Props) {
  const pathParts = params.categoryPath || [];
  if (pathParts.length === 0 || RESERVED_PREFIXES.has(pathParts[0].toLowerCase())) {
    notFound();
  }

  // The leaf category slug is the last segment (e.g. 'krish-boxer' from ['krish-home-wear', 'krish-boxer'])
  const targetSlug = pathParts[pathParts.length - 1];
  const cleanCategory = targetSlug.replace(/-/g, ' ');
  const formattedTitle = cleanCategory.replace(/\b\w/g, (l) => l.toUpperCase());

  const parentName = pathParts.length > 1
    ? pathParts[0].replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : 'Shop';
  const parentUrl = pathParts.length > 1
    ? `/shop/${pathParts[0]}`
    : '/shop';

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: parentName, url: parentUrl },
    { name: formattedTitle, url: `/${pathParts.join('/')}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <CategoryShoppingTemplate
        slug={targetSlug}
        parentName={parentName}
        parentUrl={parentUrl}
      />
    </>
  );
}
