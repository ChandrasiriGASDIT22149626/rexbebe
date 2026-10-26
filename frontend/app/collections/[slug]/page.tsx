import React from 'react';
import type { Metadata } from 'next';
import { redirect, RedirectType } from 'next/navigation';
import { CategoryShoppingTemplate } from '../../../components/products/CategoryShoppingTemplate';
import { BreadcrumbJsonLd } from '../../../components/seo/JsonLd';
import { generateCategoryMetadata } from '../../../config/seoConfig';
import {
  getServerCollectionBySlug,
  checkServerRedirect,
} from '../../../services/serverSeoService';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const currentPath = `/collections/${params.slug}`;
  const redirectTarget = checkServerRedirect(currentPath);
  if (redirectTarget) {
    return {
      robots: { index: false, follow: true },
    };
  }

  const collection = getServerCollectionBySlug(params.slug);
  const cleanTitle = params.slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const title =
    collection?.seoTitle?.trim() || `${collection?.name || cleanTitle} Capsule Collection | REXBEBE`;
  const description =
    collection?.seoDescription?.trim() ||
    collection?.description?.trim() ||
    `Discover the ${collection?.name || cleanTitle} capsule collection at REXBEBE. Pure organic cashmere, handcrafted wooden nursery gym sets, and timeless nursery aesthetics delivered across Sri Lanka.`;

  return generateCategoryMetadata({
    title,
    description,
    path: currentPath,
    image: collection?.bannerImage || '/images/hero/world_bg.webp',
  });
}

export default function CollectionPage({ params }: Props) {
  const currentPath = `/collections/${params.slug}`;
  const redirectTarget = checkServerRedirect(currentPath);
  if (redirectTarget) {
    redirect(redirectTarget, RedirectType.replace);
  }

  const collection = getServerCollectionBySlug(params.slug);
  const cleanTitle = collection?.name || params.slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Collections', url: '/collections' },
    { name: cleanTitle, url: currentPath },
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

