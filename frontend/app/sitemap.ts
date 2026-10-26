import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import { SITE_URL } from '../config/seoConfig';
import { INITIAL_PRODUCTS } from '../data/products';

function readDatabaseJson<T>(fileName: string, fallback: T): T {
  try {
    const filePath = path.join(process.cwd(), '../backend/data', fileName);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch {
    // Return fallback on build/isolated environments
  }
  return fallback;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // Core Static Commercial & Brand Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/shop`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/new-in`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/girls`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/boys`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/baby`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/sale`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/collections`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/size-guide`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/shipping`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/returns`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Dynamic Published Website Pages from database (pages.json)
  const dbPages = readDatabaseJson<any[]>('pages.json', []);
  const publishedPageRoutes: MetadataRoute.Sitemap = dbPages
    .filter((p) => p.status === 'published')
    .map((p) => ({
      url: `${SITE_URL}${p.url.startsWith('/') ? p.url : `/${p.url}`}`,
      lastModified: p.lastUpdated ? new Date(p.lastUpdated) : lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    }));

  // Dynamic Published Collections from database (collections.json)
  const dbCollections = readDatabaseJson<any[]>('collections.json', []);
  const publishedCollectionRoutes: MetadataRoute.Sitemap = dbCollections
    .filter((c) => c.status === 'published')
    .map((c) => ({
      url: `${SITE_URL}/collections/${c.slug}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  // Dynamic Published Navigation Categories from database (navigation.json)
  const dbNav = readDatabaseJson<any>('navigation.json', { items: [] });
  const categoryUrls = new Set<string>();
  const publishedCategoryRoutes: MetadataRoute.Sitemap = [];

  (dbNav.items || []).forEach((item: any) => {
    if (item.status === 'published' && item.href && !categoryUrls.has(item.href)) {
      categoryUrls.add(item.href);
      publishedCategoryRoutes.push({
        url: `${SITE_URL}${item.href}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
    (item.subGroups || []).forEach((grp: any) => {
      (grp.subItems || []).forEach((sub: any) => {
        if (sub.status === 'published' && sub.href && !categoryUrls.has(sub.href)) {
          categoryUrls.add(sub.href);
          publishedCategoryRoutes.push({
            url: `${SITE_URL}${sub.href}`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      });
    });
  });

  // Dynamic Published Products from database (products.json)
  const dbProducts = readDatabaseJson<any[]>('products.json', INITIAL_PRODUCTS);
  const publishedProductRoutes: MetadataRoute.Sitemap = dbProducts
    .filter((prod) => prod.status === 'published' || !prod.status)
    .map((prod) => ({
      url: `${SITE_URL}/products/${prod.slug}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  return [
    ...staticRoutes,
    ...publishedPageRoutes,
    ...publishedCollectionRoutes,
    ...publishedCategoryRoutes,
    ...publishedProductRoutes,
  ];
}
