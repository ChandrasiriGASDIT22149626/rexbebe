import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { Pool } from 'pg';
import { Product, ProductImage, ProductVariant } from '../types/product';
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
  metaTitle: 'REXBEBE | Sri Lankan Online Store for Baby & Children’s Clothing',
  metaDescription:
    'REXBEBE is a Sri Lankan online store offering stylish and comfortable clothing for babies and children, with collections for different age groups.',
  socialShareImage: '/images/hero/world_bg.webp',
  keywords:
    'REXBEBE, baby clothing Sri Lanka, children clothes Sri Lanka, kids clothing online Sri Lanka, newborn baby clothes, organic baby clothes Sri Lanka, toddler clothing Colombo',
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

let serverPgPool: Pool | null = null;

function getServerPgPool(): Pool | null {
  if (serverPgPool) return serverPgPool;
  if (!process.env.DATABASE_URL) return null;
  try {
    serverPgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    serverPgPool.on('error', (err: any) => {
      console.warn('[serverSeoService] PostgreSQL client warning:', err?.message);
    });
    return serverPgPool;
  } catch (err) {
    console.warn('[serverSeoService] PostgreSQL initialization failed:', err);
    return null;
  }
}

function parseJsonField<T>(val: any, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }
  return val as T;
}

function mapDbRowToProduct(row: any, variants: any[] = [], images: any[] = []): Product {
  const category = parseJsonField(
    row.categoryJson,
    row.categoryId ? { id: row.categoryId, name: 'Toddler', slug: 'toddler' } : { id: 'cat-default', name: 'Baby', slug: 'baby' }
  );
  const subcategory = parseJsonField(
    row.subcategoryJson,
    row.subcategoryId ? { id: row.subcategoryId, name: '24-36 Months', slug: '24-36-months' } : undefined
  );
  const collection = parseJsonField(row.collectionJson, undefined);

  const mappedImages: ProductImage[] = images.map((img: any, idx: number) => ({
    id: img.id || `img-${row.id}-${idx}`,
    url: img.url,
    alt: img.alt || row.name,
    position: Number(img.position || idx + 1),
    partName: img.partName || undefined,
    colorName: img.colorName || undefined,
  }));

  const mappedVariants: ProductVariant[] = variants.map((v: any) => ({
    id: v.id,
    sku: v.sku,
    size: v.size || undefined,
    color: v.color || undefined,
    colorHex: v.colorHex || undefined,
    partColors: parseJsonField(v.partColors, undefined),
    price: Number(v.price ?? row.price ?? 0),
    stockQuantity: Number(v.stockQuantity ?? 0),
    imageUrl: v.imageUrl || undefined,
    partId: v.partId || undefined,
    partName: v.partName || undefined,
    purchaseType: v.purchaseType || 'complete_set',
  }));

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku || undefined,
    shortDescription: row.shortDescription || undefined,
    description: row.description || '',
    price: Number(row.price || 0),
    comparePrice: row.comparePrice != null ? Number(row.comparePrice) : undefined,
    discountPercentage: row.discountPercentage != null ? Number(row.discountPercentage) : undefined,
    saleStartDate: row.saleStartDate ? new Date(row.saleStartDate).toISOString() : undefined,
    saleEndDate: row.saleEndDate ? new Date(row.saleEndDate).toISOString() : undefined,
    isFeatured: Boolean(row.isFeatured),
    isNewArrival: Boolean(row.isNewArrival),
    isBestSeller: Boolean(row.isBestSeller),
    isSaleBadge: Boolean(row.isSaleBadge),
    status: (row.status as any) || 'published',
    brand: row.brand || 'REXBEBE',
    productType: (row.productType as any) || 'single',
    parts: parseJsonField(row.parts, undefined),
    gender: (row.gender as any) || 'Baby',
    ageGroup: row.ageGroup || '0–12 months',
    category,
    subcategory,
    collection,
    images: mappedImages,
    variants: mappedVariants,
    colors: parseJsonField(row.colors, []),
    sizes: parseJsonField(row.sizes, []),
    stockQuantity: Number(row.stockQuantity || 0),
    lowStockThreshold: Number(row.lowStockThreshold || 2),
    stockStatus: (row.stockStatus as any) || 'in_stock',
    fabricMaterial: row.fabricMaterial || undefined,
    careInstructions: row.careInstructions || undefined,
    countryOfOrigin: row.countryOfOrigin || 'Sri Lanka',
    weight: row.weight || undefined,
    features: parseJsonField(row.features, []),
    rating: Number(row.rating || 5.0),
    reviewCount: Number(row.reviewCount || 0),
    reviewsList: parseJsonField(row.reviewsList, []),
    seoTitle: row.seoTitle || undefined,
    seoDescription: row.seoDescription || undefined,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : undefined,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
  };
}

/**
 * Returns all products stored in database or fallback products.json.
 */
export function getServerProducts(): Product[] {
  return readServerData<Product[]>('products.json', []);
}

/**
 * Returns all active products asynchronously from PostgreSQL with fallback to products.json.
 */
export async function getAsyncServerProducts(): Promise<Product[]> {
  const pool = getServerPgPool();
  if (pool) {
    try {
      const res = await pool.query(`SELECT * FROM "Product" ORDER BY "createdAt" DESC`);
      if (res.rows && res.rows.length > 0) {
        const productIds = res.rows.map((r: any) => r.id);
        const [vRes, iRes] = await Promise.all([
          pool.query(`SELECT * FROM "ProductVariant" WHERE "productId" = ANY($1::text[])`, [productIds]),
          pool.query(`SELECT * FROM "ProductImage" WHERE "productId" = ANY($1::text[]) ORDER BY position ASC`, [productIds]),
        ]);
        const variantsByProd = new Map<string, any[]>();
        for (const v of vRes.rows || []) {
          if (!variantsByProd.has(v.productId)) variantsByProd.set(v.productId, []);
          variantsByProd.get(v.productId)!.push(v);
        }
        const imagesByProd = new Map<string, any[]>();
        for (const img of iRes.rows || []) {
          if (!imagesByProd.has(img.productId)) imagesByProd.set(img.productId, []);
          imagesByProd.get(img.productId)!.push(img);
        }
        return res.rows.map((row: any) =>
          mapDbRowToProduct(
            row,
            variantsByProd.get(row.id) || [],
            imagesByProd.get(row.id) || []
          )
        );
      }
    } catch (err) {
      console.warn('[serverSeoService] Database query error for all products:', err);
    }
  }
  return getServerProducts();
}

/**
 * Synchronous product lookup from products.json.
 */
export function getServerProductBySlugSync(slug: string): Product | undefined {
  const clean = slug.toLowerCase().trim();
  const products = getServerProducts();
  return products.find(
    (p) =>
      p.slug.toLowerCase() === clean ||
      p.id.toLowerCase() === clean ||
      (clean === 'pooh-s-honey-time' && p.id === 'prod-1792938412601')
  );
}

/**
 * Looks up a single product by slug or id, querying Neon PostgreSQL first with fallback to products.json.
 */
export async function getServerProductBySlug(slug: string): Promise<Product | undefined> {
  const clean = slug.toLowerCase().trim();

  // 1. Try querying Neon PostgreSQL directly
  const pool = getServerPgPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT * FROM "Product" WHERE LOWER(slug) = $1 OR id = $1 OR ($1 = 'pooh-s-honey-time' AND id = 'prod-1792938412601') LIMIT 1`,
        [clean]
      );
      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        const [vRes, iRes] = await Promise.all([
          pool.query(`SELECT * FROM "ProductVariant" WHERE "productId" = $1`, [row.id]),
          pool.query(`SELECT * FROM "ProductImage" WHERE "productId" = $1 ORDER BY position ASC`, [row.id]),
        ]);
        return mapDbRowToProduct(row, vRes.rows || [], iRes.rows || []);
      }
    } catch (err) {
      console.warn('[serverSeoService] Database query error for product:', err);
    }
  }

  // 2. Fallback to products.json
  return getServerProductBySlugSync(clean);
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
 * Searches PostgreSQL Category table first with fallback to categories.json / navigation.json.
 */
export async function getAsyncServerCategoryBySlug(slug: string): Promise<ResolvedCategoryRecord | undefined> {
  const clean = slug.toLowerCase().trim().replace(/^\//, '');

  const pool = getServerPgPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT * FROM "Category" WHERE LOWER(slug) = $1 OR id = $1 LIMIT 1`,
        [clean]
      );
      if (res.rows && res.rows.length > 0) {
        const cat = res.rows[0];
        return {
          id: cat.id,
          name: cat.name,
          pageTitle: cat.pageTitle || cat.name,
          slug: cat.slug,
          href: cat.href || `/categories/${cat.slug}`,
          description: cat.description || cat.detailedDescription,
          shortDescription: cat.shortDescription,
          detailedDescription: cat.detailedDescription,
          bannerImage: cat.bannerImage,
          thumbnailImage: cat.thumbnailImage,
          seoTitle: cat.seoTitle,
          seoDescription: cat.seoDescription,
          status: cat.status || (cat.isActive ? 'published' : 'draft'),
        };
      }
    } catch (err) {
      console.warn('[serverSeoService] Database query error for category:', err);
    }
  }

  return getServerCategoryBySlug(slug);
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

  // Derive unique clean description:
  // 1. Explicit SEO description
  // 2. Clean shortDescription
  // 3. Clean product description (stripped of markdown)
  // 4. Default high-converting handcrafted description
  const cleanMarkdown = (text: string) =>
    text.replace(/[*_#`~[\]]/g, '').replace(/\s+/g, ' ').trim();

  const customDesc = product.seoDescription?.trim();
  const shortDesc = product.shortDescription ? cleanMarkdown(product.shortDescription) : '';
  const fullDesc = product.description ? cleanMarkdown(product.description).slice(0, 160) : '';

  const description =
    customDesc ||
    shortDesc ||
    fullDesc ||
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

