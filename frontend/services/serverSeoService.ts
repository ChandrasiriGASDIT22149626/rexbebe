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
  formatSeoTitle,
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
  metaTitle: 'REXBEBE | Luxury Baby & Toddler Boutique Online Sri Lanka',
  metaDescription:
    'Handcrafted organic cashmere rompers, French flax linen swaddles, wooden nursery toys, and pastel baby clothes online in Sri Lanka with express islandwide delivery.',
  socialShareImage: '/images/hero/world_bg.webp',
  keywords:
    'baby clothes Sri Lanka, baby clothing online Sri Lanka, toddler clothes Sri Lanka, kids clothing Sri Lanka, newborn baby clothes, organic baby romper, REXBEBE',
  canonicalDomain: SITE_URL,
  googleSiteVerification: '',
  bingSiteVerification: '',
  googleAnalyticsId: '',
  allowRobotsIndexing: true,
  redirects: [],
};

/**
 * Safely reads JSON from backend/data or frontend/data on server-side.
 */
function readServerData<T>(fileName: string, fallback: T): T {
  try {
    const filePath = path.join(process.cwd(), '../backend/data', fileName);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    }
    const localPath = path.join(process.cwd(), 'data', fileName);
    if (fs.existsSync(localPath)) {
      const raw = fs.readFileSync(localPath, 'utf-8');
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
 * Category record interface resolved from categories.json and navigation.json.
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
 * Searches categories.json and navigation.json for a category matching the slug.
 */
export function getServerCategoryBySlug(slug: string): ResolvedCategoryRecord | undefined {
  const clean = slug.toLowerCase().trim().replace(/^\//, '');

  // 1. Try categories.json (authoritative category catalog)
  const categories = readServerData<any[]>('categories.json', []);
  const directMatch = categories.find(
    (c) => c.slug?.toLowerCase() === clean || c.id?.toLowerCase() === clean
  );
  if (directMatch) {
    return {
      id: directMatch.id,
      name: directMatch.name,
      pageTitle: directMatch.pageTitle || directMatch.name,
      slug: directMatch.slug,
      href: `/categories/${directMatch.slug}`,
      description: directMatch.description || directMatch.detailedDescription,
      shortDescription: directMatch.shortDescription,
      detailedDescription: directMatch.detailedDescription,
      bannerImage: directMatch.bannerImage || directMatch.image,
      thumbnailImage: directMatch.thumbnailImage,
      seoTitle: directMatch.seoTitle,
      seoDescription: directMatch.seoDescription,
      status: directMatch.status || (directMatch.isActive ? 'published' : 'draft'),
    };
  }

  // 2. Try navigation.json
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
  const socialImage = generateAbsoluteImageUrl(image || '/images/hero/world_bg.webp');
  const formattedTitle = formatSeoTitle(title);

  return {
    title: {
      absolute: formattedTitle.absolute,
    },
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: formattedTitle.absolute,
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
          alt: formattedTitle.absolute,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: formattedTitle.absolute,
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
            'max-image-preview': 'large',
          },
        },
  };
}

/**
 * Builds rich App Router Metadata for a specific product.
 */
export function buildProductMetadata(product: Product): Metadata {
  const priceFormatted = product.price ? product.price.toLocaleString('en-LK') : '0';
  const categoryName = product.category?.name || 'Baby Boutique';
  const customTitle = product.seoTitle?.trim();
  const rawTitle = customTitle || product.name;
  const formattedTitle = formatSeoTitle(rawTitle);

  const customDesc = product.seoDescription?.trim();
  const description =
    customDesc ||
    `${product.name} handcrafted in luxury certified organic cotton for newborn and toddlers. Available sizes: ${
      product.sizes?.join(', ') || 'Newborn to Toddler'
    }. Price: LKR ${priceFormatted}. Fast islandwide delivery in Sri Lanka and worldwide by REXBEBE.`;

  const canonical = generateCanonicalUrl(`/products/${product.slug}`);
  const primaryImage =
    product.images?.[0]?.url || '/images/products/organic-onesie.webp';

  const isDiscontinued = product.status === 'unpublished' || product.status === 'draft';

  return {
    title: {
      absolute: formattedTitle.absolute,
    },
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      ...generateOpenGraph({
        title: formattedTitle.absolute,
        description,
        url: canonical,
        image: primaryImage,
      }),
      type: 'website',
    },
    twitter: generateTwitter({
      title: formattedTitle.absolute,
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

/**
 * Checks if a 301/308 redirect exists for a given pathname.
 */
export function checkServerRedirect(urlPath: string): string | null {
  const clean = urlPath.trim();
  const redirects = readServerData<Array<{ fromPath?: string; source?: string; toPath?: string; destination?: string; active?: boolean }>>(
    'redirects.json',
    []
  );

  for (const r of redirects) {
    if (r.active === false) continue;
    const source = r.fromPath || r.source;
    const target = r.toPath || r.destination;
    if (source && target) {
      if (source === clean || source.toLowerCase() === clean.toLowerCase()) {
        return target;
      }
    }
  }
  return null;
}

