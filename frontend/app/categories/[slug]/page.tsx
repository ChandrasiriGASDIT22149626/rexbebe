import React from 'react';
import type { Metadata } from 'next';
import { redirect, RedirectType } from 'next/navigation';
import { CategoryShoppingTemplate } from '../../../components/products/CategoryShoppingTemplate';
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd';
import { generateCategoryMetadata } from '../../../config/seoConfig';
import {
  getServerCategoryBySlug,
  checkServerRedirect,
} from '../../../services/serverSeoService';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const currentPath = `/categories/${params.slug}`;
  const redirectTarget = checkServerRedirect(currentPath) || checkServerRedirect(`/shop/${params.slug}`);
  if (redirectTarget) {
    return {
      robots: { index: false, follow: true },
    };
  }

  const category = getServerCategoryBySlug(params.slug);
  const cleanFallback = params.slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const title = category?.seoTitle?.trim() || `${category?.name || cleanFallback} - Luxury Baby Boutique`;
  const description =
    category?.seoDescription?.trim() ||
    category?.description?.trim() ||
    `Shop our curated collection of luxury ${category?.name || cleanFallback} for babies and toddlers at REXBEBE. Crafted with certified organic cashmere, pure linen, and gentle pastel hues with islandwide delivery across Sri Lanka.`;

  return generateCategoryMetadata({
    title,
    description,
    path: currentPath,
    image: category?.bannerImage || category?.thumbnailImage || '/images/hero/world_bg.webp',
  });
}

export default function CategoryPage({ params }: Props) {
  const currentPath = `/categories/${params.slug}`;
  const redirectTarget = checkServerRedirect(currentPath) || checkServerRedirect(`/shop/${params.slug}`);
  if (redirectTarget) {
    redirect(redirectTarget, RedirectType.replace);
  }

  const category = getServerCategoryBySlug(params.slug);
  const displayName = category?.name || params.slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
    { name: displayName, url: currentPath },
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

