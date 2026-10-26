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
export const STORE_PHONE = '+94 77 123 4567';
export const STORE_EMAIL = 'care@rexbebe.com';
export const STORE_ADDRESS = {
  streetAddress: '142 Galle Road',
  addressLocality: 'Colombo 03',
  addressRegion: 'Western Province',
  postalCode: '00300',
  addressCountry: 'LK',
};
export const STORE_GEO = {
  latitude: 6.9044,
  longitude: 79.8540,
};
export const LOGO_URL = `${SITE_URL}/images/logo.webp`;
export const LOGO_CLEAN_URL = `${SITE_URL}/images/logo_clean.webp`;

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
  if (!path) return `${SITE_URL}/images/hero/world_bg.webp`;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Formats clean SEO title ensuring no duplicate branding suffix.
 */
export function formatSeoTitle(rawTitle: string): { default: string; absolute: string } {
  const clean = rawTitle.trim();
  const withBrand = clean.includes(BRAND_NAME) ? clean : `${clean} | ${BRAND_NAME}`;
  return {
    default: clean,
    absolute: withBrand,
  };
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
  const fullTitle = title.includes(BRAND_NAME) ? title : `${title} | ${BRAND_NAME}`;
  const imageUrl = generateAbsoluteImageUrl(image || '/images/hero/world_bg.webp');
  return {
    title: fullTitle,
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
        alt: fullTitle,
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
  const imageUrl = generateAbsoluteImageUrl(image || '/images/hero/world_bg.webp');
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
  const formattedTitle = formatSeoTitle(title);
  return {
    title: {
      absolute: formattedTitle.absolute,
    },
    description,
    alternates: {
      canonical,
    },
    openGraph: generateOpenGraph({
      title: formattedTitle.absolute,
      description,
      url: canonical,
      image,
    }),
    twitter: generateTwitter({
      title: formattedTitle.absolute,
      description,
      image,
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
 * Generates dynamic product metadata for App Router.
 */
export function generateProductMetadata(product: Product): Metadata {
  const customTitle = product.seoTitle?.trim();
  const rawTitle = customTitle || product.name;
  const formattedTitle = formatSeoTitle(rawTitle);

  const priceFormatted = product.price ? product.price.toLocaleString('en-LK') : '0';
  const customDesc = product.seoDescription?.trim();
  const description = customDesc ||
    `${product.name} crafted in luxury certified organic cotton. Price: LKR ${priceFormatted}. Newborn to toddler sizes with islandwide delivery across Sri Lanka by REXBEBE.`;

  const canonical = generateCanonicalUrl(`/products/${product.slug}`);
  const primaryImage = product.images?.[0]?.url || '/images/products/organic-onesie.webp';

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
  const formattedTitle = formatSeoTitle(`${title} Collection`);
  return {
    title: {
      absolute: formattedTitle.absolute,
    },
    description,
    alternates: {
      canonical,
    },
    openGraph: generateOpenGraph({
      title: formattedTitle.absolute,
      description,
      url: canonical,
      image,
    }),
    twitter: generateTwitter({
      title: formattedTitle.absolute,
      description,
      image,
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
  const formattedTitle = formatSeoTitle(title);
  return {
    title: {
      absolute: formattedTitle.absolute,
    },
    description,
    alternates: {
      canonical,
    },
    openGraph: generateOpenGraph({
      title: formattedTitle.absolute,
      description,
      url: canonical,
      image,
    }),
    twitter: generateTwitter({
      title: formattedTitle.absolute,
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
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
          },
        },
  };
}


