import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { INITIAL_PRODUCTS } from '../../../../data/products';
import { Product } from '../../../../types/product';
import {
  SITE_URL,
  BRAND_NAME,
  DEFAULT_CURRENCY,
  generateAbsoluteImageUrl,
} from '../../../../config/seoConfig';

export const dynamic = 'force-dynamic';

function getLiveProducts(): Product[] {
  try {
    const dbPath = path.resolve(process.cwd(), '../backend/data/products.json');
    if (fs.existsSync(dbPath)) {
      const parsed = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return INITIAL_PRODUCTS;
}

export async function GET() {
  const liveProducts = getLiveProducts();
  const itemsXml = liveProducts.flatMap((product: Product) => {
    const primaryImg = product.images?.[0]?.url
      ? generateAbsoluteImageUrl(product.images[0].url)
      : `${SITE_URL}/images/products/organic-onesie.jpg`;

    // Map each variant or the base product
    const variants = product.variants?.length ? product.variants : [{ id: product.id, sku: product.id, price: product.price, stockQuantity: 10, color: 'Pastel', size: 'Standard' }];

    return variants.map((variant: any) => {
      const inStock = (variant.stockQuantity ?? 1) > 0;
      const sku = variant.sku || `${product.id}-${variant.id}`;
      const color = variant.color || 'Pastel';
      const size = variant.size || '0-3M';

      return `
    <item>
      <g:id>${escapeXml(sku)}</g:id>
      <g:title>${escapeXml(product.name)} - ${escapeXml(color)} (${escapeXml(size)})</g:title>
      <g:description>${escapeXml(product.description)}</g:description>
      <g:link>${SITE_URL}/products/${product.slug}</g:link>
      <g:image_link>${primaryImg}</g:image_link>
      <g:brand>${BRAND_NAME}</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${inStock ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${product.price} ${DEFAULT_CURRENCY}</g:price>
      <g:mpn>${escapeXml(sku)}</g:mpn>
      <g:identifier_exists>no</g:identifier_exists>
      <g:age_group>infant</g:age_group>
      <g:gender>unisex</g:gender>
      <g:color>${escapeXml(color)}</g:color>
      <g:size>${escapeXml(size)}</g:size>
      <g:product_type>${escapeXml(product.category?.name || 'Baby Clothes')}</g:product_type>
      <g:item_group_id>${escapeXml(product.id)}</g:item_group_id>
    </item>`;
    });
  }).join('');

  const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${BRAND_NAME} - Google Merchant Product Feed</title>
    <link>${SITE_URL}</link>
    <description>Luxury baby and toddler boutique catalog ready for Google Merchant Center</description>
    ${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(feedXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
