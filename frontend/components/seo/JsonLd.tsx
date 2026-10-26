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

export function LocalBusinessJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: 'REXBEBE Baby Boutique Flagship Store',
    description:
      'Premier baby and toddler boutique in Colombo, Sri Lanka featuring certified organic cotton baby clothes, newborn sets, and wooden nursery essentials.',
    url: SITE_URL,
    logo: LOGO_CLEAN_URL,
    image: `${SITE_URL}/images/hero/world_bg.webp`,
    telephone: STORE_PHONE,
    email: STORE_EMAIL,
    priceRange: 'LKR 450 - LKR 15000',
    currenciesAccepted: 'LKR',
    paymentAccepted: 'Cash, Credit Card, PayHere, Bank Transfer, Cash on Delivery',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '142 Galle Road',
      addressLocality: 'Colombo 03',
      addressRegion: 'Western Province',
      postalCode: '00300',
      addressCountry: 'LK',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 6.9044,
      longitude: 79.8540,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:30',
        closes: '19:30',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Sunday'],
        opens: '10:00',
        closes: '17:00',
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

export function ProductJsonLd({ product }: { product: Product }) {
  const primaryImage = product.images?.[0]?.url
    ? generateAbsoluteImageUrl(product.images[0].url)
    : `${SITE_URL}/images/products/organic-onesie.webp`;

  const allImages = product.images?.length
    ? product.images.map((img) => generateAbsoluteImageUrl(img.url))
    : [primaryImage];

  const inStock = product.variants?.some((v) => v.stockQuantity > 0) ?? ((product.stockQuantity ?? 1) > 0);

  // Requirement: Add review ratings only when genuine review data exists
  const hasGenuineReviews = Boolean(
    product.rating &&
    product.reviewCount &&
    product.reviewCount > 0 &&
    (product.reviewsList?.length || product.reviewCount > 0)
  );

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: allImages,
    description: product.description || `${product.name} luxury baby clothing by REXBEBE.`,
    sku: product.variants?.[0]?.sku || product.sku || product.id,
    mpn: product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || BRAND_NAME,
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
        applicableCountry: 'LK',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '650',
          currency: DEFAULT_CURRENCY,
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'LK',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'd',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'd',
          },
        },
      },
    },
    aggregateRating: hasGenuineReviews
      ? {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.reviewCount,
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
