import { MetadataRoute } from 'next';
import { SITE_URL } from '../config/seoConfig';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/images/',
          '/uploads/',
          '/_next/static/',
          '/_next/image',
          '/favicon.ico',
        ],
        disallow: [
          '/admin/',
          '/admin',
          '/cart/',
          '/cart',
          '/checkout/',
          '/checkout',
          '/account/',
          '/account',
          '/order-tracking/',
          '/order-tracking',
          '/track-order/',
          '/track-order',
          '/order/',
          '/order',
          '/api/',
          '/api',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

