import { Metadata } from 'next';
import { Product } from '../types/product';

// Centralized Production Site URL (fallback to custom domain, never localhost or vercel preview in canonicals)
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://rexbebe.com'
).replace(/\/+$/, '');

export const BRAND_NAME = 'REXBEBE';
export const BRAND_LEGAL_NAME = 'REXBEBE Baby & Toddler Boutique';
export const DEFAULT_LOCALE = 'en_US';
export const DEFAULT_CURRENCY = 'LKR';
export const STORE_PHONE = '+94-77-123-4567';
export const STORE_EMAIL = 'concierge@rexbebe.com';
export const LOGO_URL = `${SITE_URL}/images/logo.png`;
export const LOGO_CLEAN_URL = `${SITE_URL}/images/logo_clean.png`;

export const SOCIAL_LINKS = [
  'https://instagram.com/rexbebe.atelier',
  'https://facebook.com/rexbebe.atelier',
  'https://pinterest.com/rexbebe',
  'https://youtube.com/@rexbebe',
];

/**
 * Reusable helper to generate clean canonical URLs.
 */
export function generateCanonicalUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Strip trailing slashes except for root
  const normalized = cleanPath === '/' ? '' : cleanPath.replace(/\/+$/, '');
  return `${SITE_URL}${normalized}`;
}

/**
 * Reusable helper to generate absolute image URLs.
 */
export function generateAbsoluteImageUrl(path: string): string {
  if (!path) return `${SITE_URL}/images/hero/world_bg.jpg`;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Generates OpenGraph metadata standard block.
 */
export function generateOpenGraph({
  title,
  description,
  url,
  image,
  type = 'website',
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: 'website' | 'article';
}) {
  const imageUrl = generateAbsoluteImageUrl(image || '/images/hero/world_bg.jpg');
  return {
    title,
    description,
    url,
    siteName: BRAND_NAME,
    locale: DEFAULT_LOCALE,
    type,
    images: [
      {
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  };
}

/**
 * Generates Twitter card metadata standard block.
 */
export function generateTwitter({
  title,
  description,
  image,
}: {
  title: string;
  description: string;
  image?: string;
}) {
  const imageUrl = generateAbsoluteImageUrl(image || '/images/hero/world_bg.jpg');
  return {
    card: 'summary_large_image' as const,
    title,
    description,
    images: [imageUrl],
    creator: '@rexbebe',
  };
}

/**
 * Generates category metadata helper.
 */
export function generateCategoryMetadata({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const canonical = generateCanonicalUrl(path);
  return {
    title: `${title} | ${BRAND_NAME}`,
    description,
    alternates: {
      canonical,
    },
    openGraph: generateOpenGraph({
      title: `${title} | ${BRAND_NAME}`,
      description,
      url: canonical,
      image,
    }),
    twitter: generateTwitter({
      title: `${title} | ${BRAND_NAME}`,
      description,
      image,
    }),
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Generates dynamic product metadata for App Router.
 */
export function generateProductMetadata(product: Product): Metadata {
  const title = `${product.name} | ${BRAND_NAME}`;
  const priceFormatted = (product.price).toLocaleString();
  const description = `${product.description} Available in premium sizes. Price: LKR ${priceFormatted}. Authentic luxury baby clothing by REXBEBE.`;
  const canonical = generateCanonicalUrl(`/products/${product.slug}`);
  const primaryImage = product.images?.[0]?.url || '/images/products/organic-onesie.jpg';

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
    robots: {
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
 * Generates collection metadata helper.
 */
export function generateCollectionMetadata({
  title,
  description,
  slug,
  image,
}: {
  title: string;
  description: string;
  slug: string;
  image?: string;
}): Metadata {
  const canonical = generateCanonicalUrl(`/collections/${slug}`);
  const fullTitle = `${title} | ${BRAND_NAME} Collections`;
  return {
    title: fullTitle,
    description,
    alternates: {
      canonical,
    },
    openGraph: generateOpenGraph({
      title: fullTitle,
      description,
      url: canonical,
      image,
    }),
    twitter: generateTwitter({
      title: fullTitle,
      description,
      image,
    }),
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Generates static page metadata helper (e.g., /about, /contact, /shipping).
 */
export function generateStaticPageMetadata({
  title,
  description,
  path,
  image,
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const canonical = generateCanonicalUrl(path);
  const fullTitle = `${title} | ${BRAND_NAME}`;
  return {
    title: fullTitle,
    description,
    alternates: {
      canonical,
    },
    openGraph: generateOpenGraph({
      title: fullTitle,
      description,
      url: canonical,
      image,
    }),
    twitter: generateTwitter({
      title: fullTitle,
      description,
      image,
    }),
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}

