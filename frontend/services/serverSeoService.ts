import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { Product } from '../types/product';
import {
  SITE_URL,
  BRAND_NAME,
  BRAND_LEGAL_NAME,
  DEFAULT_LOCALE,
  DEFAULT_CURRENCY,
  generateCanonicalUrl,
  generateAbsoluteImageUrl,
  generateOpenGraph,
  generateTwitter,
} from '../config/seoConfig';

export interface DatabaseSeoSettings {
  metaTitle: string;
  metaDescription: string;
  socialShareImage: string;
  keywords?: string;
  canonicalDomain?: string;
  googleSiteVerification?: string;
  bingSiteVerification?: string;
  googleAnalyticsId?: string;
  allowRobotsIndexing?: boolean;
  redirects?: Array<{
    id: string;
    fromPath: string;
    toPath: string;
    statusCode: 301 | 302;
    active: boolean;
  }>;
}

export const DEFAULT_DATABASE_SEO: DatabaseSeoSettings = {
  metaTitle: 'REXBEBE | Luxury Baby & Toddler Boutique Online',
  metaDescription:
    'Curated organic cashmere rompers, French flax linen swaddles, handcrafted wooden nursery toys, and pastel baby clothes online at REXBEBE.',
  socialShareImage: '/images/hero/world_bg.jpg',
  keywords:
    'baby clothes, luxury baby clothes, newborn baby clothes, organic baby romper, baby boy clothes, baby girl clothes, cashmere baby clothing, linen baby swaddles, REXBEBE',
  canonicalDomain: SITE_URL,
  googleSiteVerification: '',
  bingSiteVerification: '',
  googleAnalyticsId: '',
  allowRobotsIndexing: true,
  redirects: [],
};

/**
 * Safely reads JSON from backend/data on server-side.
 */
function readServerData<T>(fileName: string, fallback: T): T {
  try {
    const filePath = path.join(process.cwd(), '../backend/data', fileName);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    // Return fallback on build or isolated container environments
  }
  return fallback;
}

/**
 * Returns the current SEO settings persisted in backend/data/seo.json.
 */
export function getDatabaseSeoSettings(): DatabaseSeoSettings {
  const data = readServerData<Partial<DatabaseSeoSettings>>('seo.json', {});
  return {
    ...DEFAULT_DATABASE_SEO,
    ...data,
  };
}

/**
 * Returns all products stored in database.
 */
export function getServerProducts(): Product[] {
  return readServerData<Product[]>('products.json', []);
}

/**
 * Looks up a single product by slug or id.
 */
export function getServerProductBySlug(slug: string): Product | undefined {
  const clean = slug.toLowerCase().trim();
  const products = getServerProducts();
  return products.find(
    (p) => p.slug.toLowerCase() === clean || p.id.toLowerCase() === clean
  );
}

/**
 * Category record interface resolved from navigation.json.
 */
export interface ResolvedCategoryRecord {
  id: string;
  name: string;
  pageTitle?: string;
  slug: string;
  href: string;
  description?: string;
  shortDescription?: string;
  detailedDescription?: string;
  bannerImage?: string;
  thumbnailImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  status?: string;
}

/**
 * Searches navigation.json for a category or subcategory matching the slug or path.
 */
export function getServerCategoryBySlug(slug: string): ResolvedCategoryRecord | undefined {
  const clean = slug.toLowerCase().trim().replace(/^\//, '');
  const navData = readServerData<any>('navigation.json', { items: [] });
  const items = navData.items || [];

  for (const item of items) {
    const itemSlug = (item.slug || item.href?.replace(/^\//, '') || '').toLowerCase();
    if (itemSlug === clean || itemSlug.endsWith(`/${clean}`)) {
      return {
        id: item.id,
        name: item.name,
        pageTitle: item.pageTitle || item.name,
        slug: item.slug || clean,
        href: item.href || `/${clean}`,
        description: item.description,
        shortDescription: item.shortDescription,
        detailedDescription: item.detailedDescription,
        bannerImage: item.bannerImage || item.image,
        thumbnailImage: item.thumbnailImage,
        seoTitle: item.seoTitle,
        seoDescription: item.seoDescription,
        status: item.status || 'published',
      };
    }

    if (item.subGroups && Array.isArray(item.subGroups)) {
      for (const group of item.subGroups) {
        if (group.subItems && Array.isArray(group.subItems)) {
          for (const sub of group.subItems) {
            const subSlug = (sub.slug || sub.href?.replace(/^\//, '') || '').toLowerCase();
            if (
              subSlug === clean ||
              subSlug.endsWith(`/${clean}`) ||
              sub.id?.toLowerCase() === clean
            ) {
              return {
                id: sub.id,
                name: sub.name,
                pageTitle: sub.pageTitle || sub.name,
                slug: sub.slug || clean,
                href: sub.href || `/${clean}`,
                description: sub.description,
                shortDescription: sub.shortDescription,
                detailedDescription: sub.detailedDescription,
                bannerImage: sub.bannerImage,
                thumbnailImage: sub.thumbnailImage,
                seoTitle: sub.seoTitle,
                seoDescription: sub.seoDescription,
                status: sub.status || 'published',
              };
            }
          }
        }
      }
    }
  }

  return undefined;
}

/**
 * Searches collections.json for a collection matching slug.
 */
export function getServerCollectionBySlug(slug: string): any | undefined {
  const clean = slug.toLowerCase().trim();
  const collections = readServerData<any[]>('collections.json', []);
  return collections.find(
    (c) => c.slug?.toLowerCase() === clean || c.id?.toLowerCase() === clean
  );
}

/**
 * Searches pages.json for a CMS page matching slug.
 */
export function getServerPageBySlug(slug: string): any | undefined {
  const clean = slug.toLowerCase().trim().replace(/^\//, '');
  const pages = readServerData<any[]>('pages.json', []);
  return pages.find((p) => {
    const pSlug = (p.slug || p.url?.replace(/^\//, '') || '').toLowerCase();
    return pSlug === clean;
  });
}

/**
 * Builds standard App Router Metadata for any public page.
 */
export function buildPageMetadata({
  title,
  description,
  path = '',
  image,
  type = 'website',
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
}): Metadata {
  const canonical = generateCanonicalUrl(path);
  const socialImage = generateAbsoluteImageUrl(image || '/images/hero/world_bg.jpg');
  const fullTitle = title.includes(BRAND_NAME) ? title : `${title} | ${BRAND_NAME}`;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: BRAND_NAME,
      locale: DEFAULT_LOCALE,
      type,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [socialImage],
      creator: '@rexbebe',
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
  };
}

/**
 * Builds rich App Router Metadata for a specific product.
 */
export function buildProductMetadata(product: Product): Metadata {
  const priceFormatted = product.price.toLocaleString();
  const categoryName = product.category?.name || 'Baby Boutique';
  const customTitle = product.seoTitle?.trim();
  const title = customTitle || `${product.name} | ${BRAND_NAME}`;

  const customDesc = product.seoDescription?.trim();
  const description =
    customDesc ||
    `${product.description} Handcrafted luxury ${categoryName.toLowerCase()} in certified organic cashmere and pure linen. Available sizes: ${
      product.sizes?.join(', ') || 'Newborn to Toddler'
    }. Price: LKR ${priceFormatted}. Fast worldwide delivery at REXBEBE.`;

  const canonical = generateCanonicalUrl(`/products/${product.slug}`);
  const primaryImage =
    product.images?.[0]?.url || '/images/products/organic-onesie.jpg';

  const isDiscontinued = product.status === 'unpublished' || product.status === 'draft';

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      ...generateOpenGraph({
        title,
        description,
        url: canonical,
        image: primaryImage,
      }),
      type: 'website',
    },
    twitter: generateTwitter({
      title,
      description,
      image: primaryImage,
    }),
    robots: isDiscontinued
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
          },
        },
  };
}
