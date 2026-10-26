import React from 'react';
import { Product } from '../../types/product';
import {
  SITE_URL,
  BRAND_NAME,
  BRAND_LEGAL_NAME,
  STORE_PHONE,
  STORE_EMAIL,
  LOGO_CLEAN_URL,
  SOCIAL_LINKS,
  DEFAULT_CURRENCY,
  generateAbsoluteImageUrl,
} from '../../config/seoConfig';

export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND_NAME,
    legalName: BRAND_LEGAL_NAME,
    url: SITE_URL,
    logo: LOGO_CLEAN_URL,
    sameAs: SOCIAL_LINKS,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: STORE_PHONE,
        contactType: 'customer service',
        email: STORE_EMAIL,
        areaServed: 'Worldwide',
        availableLanguage: ['English', 'Sinhala'],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ProductJsonLd({ product }: { product: Product }) {
  const primaryImage = product.images?.[0]?.url
    ? generateAbsoluteImageUrl(product.images[0].url)
    : `${SITE_URL}/images/products/organic-onesie.jpg`;

  const allImages = product.images?.length
    ? product.images.map((img) => generateAbsoluteImageUrl(img.url))
    : [primaryImage];

  const inStock = product.variants?.some((v) => v.stockQuantity > 0) ?? true;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: allImages,
    description: product.description,
    sku: product.variants?.[0]?.sku || product.id,
    mpn: product.id,
    brand: {
      '@type': 'Brand',
      name: BRAND_NAME,
    },
    category: product.category?.name || 'Baby Clothing',
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: DEFAULT_CURRENCY,
      price: product.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: BRAND_NAME,
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'US',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: DEFAULT_CURRENCY,
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'LK',
        },
      },
    },
    aggregateRating: product.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.reviewCount || 24,
          bestRating: '5',
          worstRating: '1',
        }
      : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ItemListJsonLd({
  name,
  itemListElement,
}: {
  name: string;
  itemListElement: { name: string; url: string; image?: string; position: number }[];
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: itemListElement.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      url: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
      name: item.name,
      image: item.image ? generateAbsoluteImageUrl(item.image) : undefined,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
