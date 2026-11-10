import React from 'react';
import type { Metadata } from 'next';
import { redirect, RedirectType, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { ProductDetailView } from '../../../components/products/ProductDetailView';
import {
  getServerProductBySlug,
  buildProductMetadata,
  checkServerRedirect,
} from '../../../services/serverSeoService';
import { formatSeoTitle } from '../../../config/seoConfig';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const currentPath = `/products/${params.slug}`;
  const redirectTarget = checkServerRedirect(currentPath);
  if (redirectTarget) {
    // If redirect exists, metadata doesn't need indexing
    return {
      robots: { index: false, follow: true },
    };
  }

  const product = await getServerProductBySlug(params.slug);

  if (!product) {
    return {
      title: { absolute: formatSeoTitle('Product Not Found').absolute },
      description: 'The requested baby boutique item is no longer available in our collection.',
      robots: { index: false, follow: false },
    };
  }

  return buildProductMetadata(product);
}

export default async function ProductDetailPage({ params }: Props) {
  const currentPath = `/products/${params.slug}`;
  const redirectTarget = checkServerRedirect(currentPath);
  if (redirectTarget) {
    redirect(redirectTarget, RedirectType.replace);
  }

  const initialProduct = await getServerProductBySlug(params.slug);

  if (!initialProduct) {
    notFound();
  }

  // Do not expose unpublished or draft products to search engines or public users
  if (initialProduct.status !== 'published') {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('rexbebe_admin_token')?.value;
    if (!adminToken) {
      notFound();
    }
  }

  return (
    <ProductDetailView slug={params.slug} initialProduct={initialProduct} />
  );
}

