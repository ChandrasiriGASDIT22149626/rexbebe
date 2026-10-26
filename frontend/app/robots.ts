import { MetadataRoute } from 'next';
import { SITE_URL } from '../config/seoConfig';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/cart/',
          '/checkout/',
          '/account/',
          '/order-tracking/',
          '/order/',
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
