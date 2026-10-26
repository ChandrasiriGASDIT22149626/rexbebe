import React from 'react';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { ProductDetailView } from '../../../components/products/ProductDetailView';
import { generateProductMetadata } from '../../../config/seoConfig';
import { Product } from '../../../types/product';

interface Props {
  params: { slug: string };
}

function getProductFromStorage(slug: string): Product | undefined {
  const cleanSlug = slug.toLowerCase().trim();

  // Try reading from persistent backend data file (Authoritative Database)
  try {
    const filePath = path.resolve(process.cwd(), '../backend/data/products.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const list: Product[] = JSON.parse(raw);
      const match = list.find((p) => p.slug.toLowerCase() === cleanSlug || p.id === cleanSlug);
      return match || undefined;
    }
  } catch (e) {
    // ignore
  }

  // If database file is not accessible, return undefined
  return undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProductFromStorage(params.slug);

  if (!product) {
    return {
      title: 'Product Not Found | REXBEBE Luxury Baby Boutique',
      description: 'The requested product is no longer available in our boutique catalog.',
    };
  }

  return generateProductMetadata(product);
}

export default function ProductDetailPage({ params }: Props) {
  const initialProduct = getProductFromStorage(params.slug);

  return (
    <ProductDetailView slug={params.slug} initialProduct={initialProduct} />
  );
}
