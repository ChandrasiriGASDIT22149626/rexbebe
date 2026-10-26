import fs from 'fs';
import path from 'path';

export interface NavSubItem {
  id: string;
  name: string;
  pageTitle?: string;
  slug?: string;
  href: string;
  destinationType?: string;
  destinationReference?: string;
  badge?: string;
  description?: string;
  shortDescription?: string;
  detailedDescription?: string;
  bannerImage?: string;
  thumbnailImage?: string;
  galleryImages?: string[];
  assignedProductIds?: string[];
  shortcutButtons?: any[];
  status?: string;
  order?: number;
  isActive?: boolean;
  openInNewTab?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  parentId?: string;
}

export interface NavSubGroup {
  id: string;
  title: string;
  slug?: string;
  href: string;
  description?: string;
  destinationType?: string;
  order?: number;
  subItems: NavSubItem[];
}

export interface NavItemConfig {
  id: string;
  name: string;
  pageTitle?: string;
  slug?: string;
  href: string;
  badge?: string;
  description?: string;
  shortDescription?: string;
  detailedDescription?: string;
  bannerImage?: string;
  thumbnailImage?: string;
  galleryImages?: string[];
  assignedProductIds?: string[];
  shortcutButtons?: any[];
  status?: string;
  order: number;
  isActive: boolean;
  destinationType?: string;
  destinationReference?: string;
  openInNewTab?: boolean;
  dropdownType?: string;
  image?: string;
  icon?: string;
  seoTitle?: string;
  seoDescription?: string;
  subGroups?: NavSubGroup[];
}

export interface NavigationConfig {
  items: NavItemConfig[];
}

export const DEFAULT_BRAND_NAVIGATION: NavigationConfig = {
  items: [
    {
      id: 'nav-home',
      name: 'HOME',
      pageTitle: 'HOME',
      slug: 'home',
      href: '/',
      order: 1,
      status: 'published',
      isActive: true,
      destinationType: 'HOMEPAGE',
      galleryImages: [],
      assignedProductIds: [],
      subGroups: [],
    },
    {
      id: 'nav-about',
      name: 'ABOUT US',
      pageTitle: 'ABOUT US',
      slug: 'about-us',
      href: '/about',
      order: 2,
      status: 'published',
      isActive: true,
      galleryImages: [],
      assignedProductIds: [],
      subGroups: [],
    },
    {
      id: 'cat-1792556617917-72c7r7',
      name: 'BABY',
      pageTitle: 'BABY',
      slug: 'baby',
      href: '/shop/baby',
      destinationType: 'CATEGORY_PAGE',
      destinationReference: 'party-dresses',
      order: 3,
      status: 'published',
      isActive: true,
      galleryImages: [],
      assignedProductIds: [],
      subGroups: [
        {
          id: 'grp-0-6-months-1792557187552',
          title: '0–6 Months',
          slug: '0-6-months',
          href: '/baby/0-6-months',
          subItems: [
            {
              id: 'cat-1792557187526-0diww5',
              name: '0–6 Months',
              pageTitle: '0–6 MONTHS',
              slug: '0-6-months',
              href: '/baby/0-6-months',
              destinationType: 'CATEGORY_PAGE',
              destinationReference: 'party-dresses',
              order: 1,
              status: 'published',
              isActive: true,
              galleryImages: [],
              assignedProductIds: [],
              parentId: 'cat-1792556617917-72c7r7',
            },
            {
              id: 'cat-1792557258002-3h3f33',
              name: '6–12 Months',
              pageTitle: '6–12 MONTHS',
              slug: '6-12-months',
              href: '/baby/6-12-months',
              destinationType: 'CATEGORY_PAGE',
              destinationReference: 'party-dresses',
              order: 2,
              status: 'published',
              isActive: true,
              galleryImages: [],
              assignedProductIds: [],
              parentId: 'cat-1792556617917-72c7r7',
            },
          ],
        },
      ],
    },
    {
      id: 'cat-1792557286988-6ozkat',
      name: 'TODDLER',
      pageTitle: 'TODDLER',
      slug: 'toddler',
      href: '/shop/toddler',
      destinationType: 'CATEGORY_PAGE',
      destinationReference: 'party-dresses',
      order: 4,
      status: 'published',
      isActive: true,
      galleryImages: [],
      assignedProductIds: [],
      subGroups: [
        {
          id: 'grp-12-18-months-1792557309870',
          title: '12-18 months',
          slug: '12-18-months',
          href: '/shop/12-18-months',
          subItems: [
            {
              id: 'cat-1792557309838-hnx0zw',
              name: '12-18 months',
              pageTitle: '12-18 MONTHS',
              slug: '12-18-months',
              href: '/shop/12-18-months',
              destinationType: 'CATEGORY_PAGE',
              destinationReference: 'party-dresses',
              order: 1,
              status: 'published',
              isActive: true,
              galleryImages: [],
              assignedProductIds: [],
              parentId: 'cat-1792557286988-6ozkat',
            },
            {
              id: 'cat-1792557336208-96k1zz',
              name: '18-24 Months',
              pageTitle: '18-24 MONTHS',
              slug: '18-24-months',
              href: '/shop/18-24-months',
              destinationType: 'CATEGORY_PAGE',
              destinationReference: 'party-dresses',
              order: 2,
              status: 'published',
              isActive: true,
              galleryImages: [],
              assignedProductIds: [],
              parentId: 'cat-1792557286988-6ozkat',
            },
            {
              id: 'cat-1792557360998-u1t8v2',
              name: '24-36 Months',
              pageTitle: '24-36 MONTHS',
              slug: '24-36-months',
              href: '/shop/24-36-months',
              destinationType: 'CATEGORY_PAGE',
              destinationReference: 'party-dresses',
              order: 3,
              status: 'published',
              isActive: true,
              galleryImages: [],
              assignedProductIds: [],
              parentId: 'cat-1792557286988-6ozkat',
            },
          ],
        },
      ],
    },
    {
      id: 'cat-1792557393548-4ibray',
      name: 'PRE-SCHOOL',
      pageTitle: 'PRE-SCHOOL',
      slug: 'pre-school',
      href: '/shop/pre-school',
      destinationType: 'CATEGORY_PAGE',
      destinationReference: 'party-dresses',
      order: 5,
      status: 'published',
      isActive: true,
      galleryImages: [],
      assignedProductIds: [],
      subGroups: [],
    },
    {
      id: 'cat-1792557421459-sapv4x',
      name: 'MILD CHILDHOOD',
      pageTitle: 'MILD CHILDHOOD',
      slug: 'mild-childhood',
      href: '/shop/mild-childhood',
      destinationType: 'CATEGORY_PAGE',
      destinationReference: 'party-dresses',
      order: 6,
      status: 'published',
      isActive: true,
      galleryImages: [],
      assignedProductIds: [],
      subGroups: [],
    },
    {
      id: 'nav-contact',
      name: 'CONTACT US',
      pageTitle: 'CONTACT US',
      slug: 'contact-us',
      href: '/contact',
      order: 7,
      status: 'published',
      isActive: true,
      galleryImages: [],
      assignedProductIds: [],
      subGroups: [],
    },
  ],
};

const STORAGE_FILE_PATH = path.resolve(__dirname, '../../data/navigation.json');

class NavigationStorage {
  private config: NavigationConfig;

  constructor() {
    this.config = this.loadFromDisk();
  }

  private loadFromDisk(): NavigationConfig {
    try {
      if (fs.existsSync(STORAGE_FILE_PATH)) {
        const raw = fs.readFileSync(STORAGE_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          if (!parsed.items.some((i: any) => i.id === 'nav-home' || i.href === '/' || i.name?.toUpperCase() === 'HOME')) {
            parsed.items.unshift({
              id: 'nav-home',
              name: 'HOME',
              pageTitle: 'HOME',
              slug: 'home',
              href: '/',
              order: 1,
              status: 'published',
              isActive: true,
              destinationType: 'HOMEPAGE',
              galleryImages: [],
              assignedProductIds: [],
              subGroups: [],
            });
          }
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[NavigationStorage] Failed to read from disk, using brand defaults:', err);
    }
    return DEFAULT_BRAND_NAVIGATION;
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(STORAGE_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (err) {
      console.error('[NavigationStorage] Failed to write to disk:', err);
    }
  }

  public getAll(): NavigationConfig {
    this.config = this.loadFromDisk();
    return this.config;
  }

  public syncWithCategoryRecords(cats: any[]): boolean {
    this.config = this.loadFromDisk();
    let items = [...(this.config.items || [])];
    let changed = false;

    // 1. Sync custom categories from categories.json (if not hidden and not non-category pages)
    for (const cat of cats) {
      if (cat.id === 'nav-about' || cat.id === 'nav-contact' || cat.slug === 'about-us' || cat.slug === 'contact-us') {
        continue;
      }
      if (cat.badge === 'HIDDEN' || cat.badge === 'CATALOG_ONLY') {
        const idx = items.findIndex((i) => i.id === cat.id);
        if (idx !== -1) {
          items.splice(idx, 1);
          changed = true;
        }
        continue;
      }

      if (!cat.parentId || cat.parentId === 'root' || cat.parentId === 'none') {
        const existing = items.find((i) => i.id === cat.id || (cat.slug && i.slug === cat.slug));
        if (!existing) {
          items.push({
            id: cat.id,
            name: cat.name.toUpperCase(),
            pageTitle: cat.pageTitle || cat.name,
            slug: cat.slug,
            href: cat.href || `/shop/${cat.slug}`,
            badge: cat.badge,
            order: cat.order || items.length + 1,
            status: cat.status || 'published',
            isActive: cat.isActive !== false,
            description: cat.description,
            shortDescription: cat.shortDescription,
            detailedDescription: cat.detailedDescription,
            bannerImage: cat.bannerImage,
            thumbnailImage: cat.thumbnailImage,
            galleryImages: cat.galleryImages || [],
            assignedProductIds: cat.assignedProductIds || [],
            subGroups: [],
          });
          changed = true;
        } else {
          if (
            existing.status !== cat.status ||
            existing.isActive !== (cat.isActive !== false) ||
            existing.name !== cat.name.toUpperCase()
          ) {
            existing.status = cat.status;
            existing.isActive = cat.isActive !== false;
            existing.name = cat.name.toUpperCase();
            changed = true;
          }
        }
      } else {
        // Sync subcategories
        for (const item of items) {
          for (const grp of item.subGroups || []) {
            const sub = (grp.subItems || []).find((s: any) => s.id === cat.id || (cat.slug && s.slug === cat.slug));
            if (sub) {
              if (
                sub.status !== cat.status ||
                sub.isActive !== (cat.isActive !== false) ||
                sub.name !== cat.name ||
                sub.destinationType !== cat.destinationType ||
                sub.destinationReference !== cat.destinationReference
              ) {
                sub.status = cat.status;
                sub.isActive = cat.isActive !== false;
                sub.name = cat.name;
                if (cat.destinationType) sub.destinationType = cat.destinationType;
                if (cat.destinationReference) sub.destinationReference = cat.destinationReference;
                if (cat.galleryImages) sub.galleryImages = cat.galleryImages;
                changed = true;
              }
            }
          }
        }
      }
    }

    // 2. Prune any category items from navigation that were permanently deleted from categories.json
    const validCatIds = new Set(cats.map((c) => c.id));
    const validCatSlugs = new Set(cats.map((c) => c.slug).filter(Boolean));
    const coreNavIds = new Set([
      'nav-home',
      'nav-about',
      'cat-1792556617917-72c7r7',
      'cat-1792557286988-6ozkat',
      'cat-1792557393548-4ibray',
      'cat-1792557421459-sapv4x',
      'nav-contact',
    ]);

    // Ensure permanent Home, About Us and Contact Us pages exist
    if (!items.some((i) => i.id === 'nav-home' || i.href === '/' || i.name?.toUpperCase() === 'HOME')) {
      items.unshift({
        id: 'nav-home',
        name: 'HOME',
        pageTitle: 'HOME',
        slug: 'home',
        href: '/',
        order: 1,
        status: 'published',
        isActive: true,
        destinationType: 'HOMEPAGE',
        galleryImages: [],
        assignedProductIds: [],
        subGroups: [],
      });
      changed = true;
    } else {
      const home = items.find((i) => i.id === 'nav-home' || i.href === '/' || i.name?.toUpperCase() === 'HOME');
      if (home && (!home.isActive || home.status === 'draft' || home.status === 'unpublished')) {
        home.isActive = true;
        home.status = 'published';
        changed = true;
      }
    }

    if (!items.some((i) => i.id === 'nav-about' || i.href === '/about')) {
      items.push({
        id: 'nav-about',
        name: 'ABOUT US',
        pageTitle: 'ABOUT US',
        slug: 'about-us',
        href: '/about',
        order: 2,
        status: 'published',
        isActive: true,
        galleryImages: [],
        assignedProductIds: [],
        subGroups: [],
      });
      changed = true;
    }

    if (!items.some((i) => i.id === 'nav-contact' || i.href === '/contact')) {
      items.push({
        id: 'nav-contact',
        name: 'CONTACT US',
        pageTitle: 'CONTACT US',
        slug: 'contact-us',
        href: '/contact',
        order: 999,
        status: 'published',
        isActive: true,
        galleryImages: [],
        assignedProductIds: [],
        subGroups: [],
      });
      changed = true;
    }

    const initialLen = items.length;
    items = items.filter((item) => {
      if (item.id.startsWith('nav-') && !['nav-home', 'nav-about', 'nav-contact'].includes(item.id)) {
        return false;
      }
      if (coreNavIds.has(item.id)) return true;
      if (item.badge === 'HIDDEN' || item.badge === 'CATALOG_ONLY') return false;
      if (item.id.startsWith('cat-') || item.slug) {
        const exists = validCatIds.has(item.id) || (item.slug && validCatSlugs.has(item.slug));
        return exists;
      }
      return false;
    });
    if (items.length !== initialLen) changed = true;

    // 3. Also prune deleted subItems from subGroups
    for (const item of items) {
      if (item.subGroups && Array.isArray(item.subGroups)) {
        for (const grp of item.subGroups) {
          if (grp.subItems && Array.isArray(grp.subItems)) {
            const subLen = grp.subItems.length;
            grp.subItems = grp.subItems.filter((sub: any) => {
              if (sub.id && sub.id.startsWith('cat-')) {
                return validCatIds.has(sub.id) || (sub.slug && validCatSlugs.has(sub.slug));
              }
              return true;
            });
            if (grp.subItems.length !== subLen) changed = true;
          }
        }
      }
    }

    if (changed) {
      this.config = { items };
      this.saveToDisk();
    }
    return changed;
  }

  public getPublic(): NavigationConfig {
    this.config = this.loadFromDisk();

    const isTestRecord = (item: { name?: string; slug?: string; id?: string }) => {
      const id = (item.id || '').toUpperCase();
      return (
        id.startsWith('MOCK-') ||
        id.startsWith('TEST-MOCK-') ||
        id.startsWith('E2E-DUMMY-') ||
        id.includes('CAT-HIVE-TEST')
      );
    };

    const activeItems = (this.config.items || [])
      .filter(
        (item) =>
          item.isActive !== false &&
          item.status !== 'draft' &&
          item.status !== 'unpublished' &&
          !isTestRecord(item) &&
          item.badge !== 'HIDDEN' &&
          item.badge !== 'CATALOG_ONLY'
      )
      .map((item) => ({
        ...item,
        subGroups: (item.subGroups || []).map((grp) => ({
          ...grp,
          subItems: (grp.subItems || []).filter(
            (sub) =>
              sub.isActive !== false &&
              sub.status !== 'draft' &&
              sub.status !== 'unpublished' &&
              !isTestRecord(sub)
          ),
        })),
      }));

    // Ensure canonical ordering: HOME first, ABOUT US second, category items in middle, CONTACT US at very end
    const homeIdx = activeItems.findIndex(i => i.id === 'nav-home' || i.href === '/' || i.name?.toUpperCase() === 'HOME');
    let homeItm = homeIdx !== -1 ? activeItems.splice(homeIdx, 1)[0] : {
      id: 'nav-home',
      name: 'HOME',
      pageTitle: 'HOME',
      slug: 'home',
      href: '/',
      order: 1,
      status: 'published',
      isActive: true,
      destinationType: 'HOMEPAGE',
      galleryImages: [],
      assignedProductIds: [],
      subGroups: [],
    };

    const aboutIdx = activeItems.findIndex(i => i.id === 'nav-about' || i.href === '/about' || i.name?.toUpperCase() === 'ABOUT US');
    let aboutItm = aboutIdx !== -1 ? activeItems.splice(aboutIdx, 1)[0] : {
      id: 'nav-about',
      name: 'ABOUT US',
      pageTitle: 'ABOUT US',
      slug: 'about-us',
      href: '/about',
      order: 2,
      status: 'published',
      isActive: true,
      galleryImages: [],
      assignedProductIds: [],
      subGroups: [],
    };
    aboutItm.order = 2;

    const contactIdx = activeItems.findIndex(i => i.id === 'nav-contact' || i.href === '/contact' || i.name?.toUpperCase() === 'CONTACT US');
    let contactItm = contactIdx !== -1 ? activeItems.splice(contactIdx, 1)[0] : {
      id: 'nav-contact',
      name: 'CONTACT US',
      pageTitle: 'CONTACT US',
      slug: 'contact-us',
      href: '/contact',
      order: 999,
      status: 'published',
      isActive: true,
      galleryImages: [],
      assignedProductIds: [],
      subGroups: [],
    };
    contactItm.order = 999;

    activeItems.sort((a, b) => (a.order || 0) - (b.order || 0));

    return { items: [homeItm, aboutItm, ...activeItems, contactItm] };
  }

  public updateAll(newConfig: NavigationConfig): NavigationConfig {
    if (!newConfig || !Array.isArray(newConfig.items)) {
      throw new Error('Invalid navigation config provided');
    }
    const items = [...newConfig.items];
    if (!items.some((i) => i.id === 'nav-home' || i.href === '/' || i.name?.toUpperCase() === 'HOME')) {
      items.unshift({
        id: 'nav-home',
        name: 'HOME',
        pageTitle: 'HOME',
        slug: 'home',
        href: '/',
        order: 1,
        status: 'published',
        isActive: true,
        destinationType: 'HOMEPAGE',
        galleryImages: [],
        assignedProductIds: [],
        subGroups: [],
      });
    }
    this.config = { items };
    this.saveToDisk();
    return this.config;
  }

  public reset(): NavigationConfig {
    this.config = JSON.parse(JSON.stringify(DEFAULT_BRAND_NAVIGATION));
    this.saveToDisk();
    return this.config;
  }
}

export const navigationStorage = new NavigationStorage();
