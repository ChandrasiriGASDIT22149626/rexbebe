import fs from 'fs';
import path from 'path';

// Static JSON imports to ensure 100% inclusion in Vercel serverless bundle
import defaultCategories from '../data/categories.json';
import defaultNavigation from '../data/navigation.json';
import defaultProducts from '../data/products.json';
import defaultSettings from '../data/settings.json';
import defaultDelivery from '../data/delivery_settings.json';
import defaultPages from '../data/pages.json';

// Types
export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  pageTitle?: string;
  href?: string;
  parentId?: string | null;
  order: number;
  status: 'published' | 'draft' | 'unpublished' | 'archived';
  isActive: boolean;
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
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
  parentName?: string;
  level?: string;
  children?: CategoryRecord[];
}

export interface CategoryTreeNode extends CategoryRecord {
  children: CategoryTreeNode[];
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
  status?: string;
  order: number;
  isActive: boolean;
  destinationType?: string;
  destinationReference?: string;
  subGroups?: any[];
}

// Storage helpers
function getSharedBackendDataPath(filename: string): string | null {
  const p1 = path.resolve(process.cwd(), '..', 'backend', 'data', filename);
  if (fs.existsSync(p1)) return p1;
  const p2 = path.resolve(process.cwd(), 'backend', 'data', filename);
  if (fs.existsSync(p2)) return p2;
  return null;
}

function getFilePath(filename: string): string {
  const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
  const tmpPath = path.join('/tmp', filename);
  if (isVercel && fs.existsSync(tmpPath)) {
    return tmpPath;
  }
  // If local development, prioritize canonical shared backend/data file
  const sharedPath = getSharedBackendDataPath(filename);
  if (sharedPath) {
    return sharedPath;
  }
  const localDataPath = path.resolve(process.cwd(), 'data', filename);
  if (fs.existsSync(localDataPath)) {
    return localDataPath;
  }
  const frontendDataPath = path.resolve(process.cwd(), 'frontend', 'data', filename);
  if (fs.existsSync(frontendDataPath)) {
    return frontendDataPath;
  }
  return localDataPath;
}

function saveData(filename: string, data: any) {
  try {
    const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
    if (isVercel) {
      fs.writeFileSync(path.join('/tmp', filename), JSON.stringify(data, null, 2), 'utf-8');
    }
    // Always persist to shared backend/data if folder exists (local dev)
    const sharedPath = getSharedBackendDataPath(filename);
    if (sharedPath && fs.existsSync(path.dirname(sharedPath))) {
      fs.writeFileSync(sharedPath, JSON.stringify(data, null, 2), 'utf-8');
    }
    // Also persist to local frontend data folder so both stay identical
    const localDataPath = path.resolve(process.cwd(), 'data', filename);
    if (fs.existsSync(path.dirname(localDataPath))) {
      fs.writeFileSync(localDataPath, JSON.stringify(data, null, 2), 'utf-8');
    }
    const frontendDataPath = path.resolve(process.cwd(), 'frontend', 'data', filename);
    if (fs.existsSync(path.dirname(frontendDataPath))) {
      fs.writeFileSync(frontendDataPath, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn(`[serverApi] Notice writing ${filename}:`, e);
  }
}

function loadData<T>(filename: string, fallback: T): T {
  try {
    const filePath = getFilePath(filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.warn(`[serverApi] Notice reading ${filename}:`, e);
  }
  return fallback;
}

// State Singletons
class ServerStore {
  private categories: CategoryRecord[] = [];
  private navigation: { items: NavItemConfig[] } = { items: [] };
  private products: any[] = [];

  constructor() {
    this.reload();
  }

  public reload() {
    const loadedCats = loadData<CategoryRecord[]>('categories.json', (defaultCategories as unknown) as CategoryRecord[]);
    // Filter out accidental duplicate subGroup records
    this.categories = (loadedCats || []).filter(
      (c) => c.id !== 'grp-12-18-months-1792557309870' && c.id !== 'grp-0-6-months-1792557187552' && c.name !== 'CATEGORIES'
    );
    this.navigation = loadData<{ items: NavItemConfig[] }>('navigation.json', (defaultNavigation as unknown) as { items: NavItemConfig[] });
    this.products = loadData<any[]>('products.json', (defaultProducts as unknown) as any[]);
  }

  public getCategories(query?: { status?: string; parentId?: string }): CategoryRecord[] {
    this.reload();
    let result = [...this.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
    if (query?.status && query.status !== 'all') {
      result = result.filter((c) => c.status === query.status);
    }
    if (query?.parentId !== undefined) {
      const targetParent = query.parentId === 'root' || query.parentId === 'null' ? null : query.parentId;
      result = result.filter((c) => (targetParent === null ? !c.parentId || c.parentId === 'root' || c.parentId === 'none' : c.parentId === targetParent));
    }
    return result;
  }

  public getCategoryTree(): CategoryTreeNode[] {
    this.reload();
    const all = [...this.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
    const nodeMap = new Map<string, CategoryTreeNode>();
    all.forEach((c) => {
      nodeMap.set(c.id, { ...c, children: [] });
    });

    const roots: CategoryTreeNode[] = [];
    all.forEach((c) => {
      const node = nodeMap.get(c.id)!;
      if (!c.parentId || c.parentId === 'root' || c.parentId === 'none' || !nodeMap.has(c.parentId)) {
        roots.push(node);
      } else {
        const parent = nodeMap.get(c.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      }
    });

    return roots;
  }

  public findCategoryById(idOrSlug: string): CategoryRecord | null {
    this.reload();
    const s = idOrSlug.toLowerCase();
    return this.categories.find((c) => c.id === idOrSlug || c.slug.toLowerCase() === s) || null;
  }

  public getAncestors(id: string): CategoryRecord[] {
    this.reload();
    const ancestors: CategoryRecord[] = [];
    let current = this.findCategoryById(id);
    const visited = new Set<string>();
    while (current?.parentId && !visited.has(current.parentId)) {
      visited.add(current.parentId);
      const parent = this.findCategoryById(current.parentId);
      if (parent) {
        ancestors.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    return ancestors;
  }

  public getDescendants(id: string): CategoryRecord[] {
    this.reload();
    const descendants: CategoryRecord[] = [];
    const collect = (parentId: string) => {
      const children = this.categories.filter((c) => c.parentId === parentId);
      for (const child of children) {
        descendants.push(child);
        collect(child.id);
      }
    };
    collect(id);
    return descendants;
  }

  public createCategory(input: any): CategoryRecord {
    const cleanName = (input.name || '').trim();
    if (!cleanName) throw new Error('Category name is required');
    let cleanSlug = (input.slug || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    if (!cleanSlug) cleanSlug = `cat-${Date.now()}`;

    // Normalize parentId
    let parentId = input.parentId;
    if (['root', 'none', 'null', 'nav-home', 'nav-about', 'nav-contact', ''].includes(parentId)) {
      parentId = null;
    }

    // Reuse and repair existing record if slug or ID already exists
    const existing = (input.id && this.findCategoryById(input.id)) || this.findCategoryById(cleanSlug);
    if (existing) {
      return this.updateCategory(existing.id, {
        ...input,
        parentId,
        slug: cleanSlug,
      });
    }

    const effectiveStatus = input.status || 'published';
    const effectiveIsActive = input.isActive !== undefined ? input.isActive : effectiveStatus === 'published';

    const newCat: CategoryRecord = {
      id: input.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name: cleanName,
      pageTitle: input.pageTitle || cleanName,
      slug: cleanSlug,
      href: input.href || `/shop/${cleanSlug}`,
      parentId,
      order: input.order !== undefined ? Number(input.order) : this.categories.length + 1,
      status: effectiveStatus,
      isActive: effectiveIsActive,
      destinationType: input.destinationType || 'CATEGORY_PAGE',
      destinationReference: input.destinationReference || cleanSlug,
      badge: input.badge,
      description: input.description || input.shortDescription,
      shortDescription: input.shortDescription,
      detailedDescription: input.detailedDescription,
      bannerImage: input.bannerImage,
      thumbnailImage: input.thumbnailImage,
      galleryImages: Array.isArray(input.galleryImages) ? input.galleryImages : [],
      assignedProductIds: Array.isArray(input.assignedProductIds) ? input.assignedProductIds : [],
      shortcutButtons: Array.isArray(input.shortcutButtons) ? input.shortcutButtons : [],
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.categories.push(newCat);
    saveData('categories.json', this.categories);
    this.syncCategoryWithNav(newCat, 'save');
    return newCat;
  }

  public updateCategory(idOrSlug: string, input: any): CategoryRecord {
    const existingIndex = this.categories.findIndex((c) => c.id === idOrSlug || c.slug.toLowerCase() === idOrSlug.toLowerCase());
    if (existingIndex === -1) throw new Error(`Category ${idOrSlug} not found`);

    const existing = this.categories[existingIndex];
    let parentId = input.parentId !== undefined ? input.parentId : existing.parentId;
    if (['root', 'none', 'null', 'nav-home', 'nav-about', 'nav-contact', ''].includes(parentId)) {
      parentId = null;
    }

    const updated: CategoryRecord = {
      ...existing,
      ...input,
      id: existing.id,
      parentId,
      updatedAt: new Date().toISOString(),
    };

    if (input.status !== undefined && input.isActive === undefined) {
      updated.isActive = input.status === 'published';
    }

    this.categories[existingIndex] = updated;
    saveData('categories.json', this.categories);
    this.syncCategoryWithNav(updated, 'save');
    return updated;
  }

  public deleteCategory(idOrSlug: string): boolean {
    const existing = this.findCategoryById(idOrSlug);
    if (!existing) return false;

    const toDeleteIds = new Set<string>([existing.id, existing.slug]);
    const descendants = this.getDescendants(existing.id);
    descendants.forEach((d) => {
      toDeleteIds.add(d.id);
      toDeleteIds.add(d.slug);
    });

    this.categories = this.categories.filter((c) => !toDeleteIds.has(c.id));
    saveData('categories.json', this.categories);
    this.syncCategoryWithNav(existing, 'delete');
    return true;
  }

  private syncCategoryWithNav(cat: CategoryRecord, action: 'save' | 'delete') {
    let items = [...(this.navigation.items || [])];
    if (action === 'delete') {
      const delIds = new Set<string>([cat.id, cat.slug]);
      items = items.filter((i: any) => !delIds.has(i.id) && !delIds.has(i.slug));
      items.forEach((item: any) => {
        if (item.subGroups) {
          item.subGroups.forEach((grp: any) => {
            if (grp.subItems) {
              grp.subItems = grp.subItems.filter((s: any) => !delIds.has(s.id) && !delIds.has(s.slug));
            }
          });
        }
      });
      this.navigation = { items };
      saveData('navigation.json', this.navigation);
      return;
    }

    // Save action: update existing or insert into parent
    let found = false;
    for (const item of items) {
      if (item.id === cat.id || item.slug === cat.slug) {
        item.name = cat.name.toUpperCase();
        item.pageTitle = cat.pageTitle || cat.name;
        item.status = cat.status;
        item.isActive = cat.isActive !== false;
        item.destinationType = cat.destinationType;
        item.destinationReference = cat.destinationReference;
        item.galleryImages = cat.galleryImages || [];
        found = true;
        break;
      }
      for (const grp of item.subGroups || []) {
        for (const sub of grp.subItems || []) {
          if (sub.id === cat.id || sub.slug === cat.slug) {
            sub.name = cat.name;
            sub.pageTitle = cat.pageTitle || cat.name;
            sub.status = cat.status;
            sub.isActive = cat.isActive !== false;
            sub.destinationType = cat.destinationType;
            sub.destinationReference = cat.destinationReference;
            sub.galleryImages = cat.galleryImages || [];
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }

    if (!found) {
      if (!cat.parentId) {
        items.push({
          id: cat.id,
          name: cat.name.toUpperCase(),
          pageTitle: cat.pageTitle || cat.name,
          slug: cat.slug,
          href: cat.href || `/shop/${cat.slug}`,
          order: cat.order || items.length + 1,
          status: cat.status,
          isActive: cat.isActive !== false,
          destinationType: cat.destinationType,
          destinationReference: cat.destinationReference,
          galleryImages: cat.galleryImages || [],
          subGroups: [],
        });
      } else {
        const parentNav = items.find((i: any) => i.id === cat.parentId || i.slug === cat.parentId);
        if (parentNav) {
          if (!parentNav.subGroups || parentNav.subGroups.length === 0) {
            parentNav.subGroups = [
              {
                id: `grp-${cat.slug}-${Date.now()}`,
                title: 'CATEGORIES',
                slug: cat.slug,
                href: `/shop/${cat.slug}`,
                subItems: [],
              },
            ];
          }
          const targetGroup = parentNav.subGroups[0];
          targetGroup.subItems = targetGroup.subItems || [];
          targetGroup.subItems.push({
            id: cat.id,
            name: cat.name,
            pageTitle: cat.pageTitle || cat.name,
            slug: cat.slug,
            href: cat.href || `/shop/${cat.slug}`,
            status: cat.status,
            isActive: cat.isActive !== false,
            parentId: cat.parentId,
            order: cat.order || 1,
            destinationType: cat.destinationType,
            destinationReference: cat.destinationReference,
            galleryImages: cat.galleryImages || [],
          });
        }
      }
    }

    this.navigation = { items };
    saveData('navigation.json', this.navigation);
  }

  public getNavigation(isPublic: boolean = true) {
    let items = [...(this.navigation.items || [])];
    if (isPublic) {
      items = items.filter((i) => i.isActive !== false && i.status !== 'draft' && i.status !== 'unpublished');
    }
    return { items };
  }

  public updateNavigation(newConfig: { items: NavItemConfig[] }) {
    if (newConfig && Array.isArray(newConfig.items)) {
      this.navigation = newConfig;
      saveData('navigation.json', this.navigation);
    }
    return this.navigation;
  }

  public getProducts(query?: any): any[] {
    this.reload();
    let result = [...this.products];

    if (query?.category) {
      const cat = String(query.category).toLowerCase().trim();
      const targetIds = new Set<string>([cat]);
      const foundCat = this.findCategoryById(query.category);
      if (foundCat) {
        targetIds.add(foundCat.id.toLowerCase());
        targetIds.add(foundCat.slug.toLowerCase());
        targetIds.add(foundCat.name.toLowerCase());
        const descendants = this.getDescendants(foundCat.id);
        descendants.forEach((d) => {
          targetIds.add(d.id.toLowerCase());
          targetIds.add(d.slug.toLowerCase());
          targetIds.add(d.name.toLowerCase());
        });
      }

      result = result.filter((p) => {
        if (Array.isArray(foundCat?.assignedProductIds) && foundCat.assignedProductIds.includes(p.id)) return true;
        const pCat = p.category;
        const pSub = p.subcategory;
        const pCatId = String((p as any).categoryId || (typeof pCat === 'object' ? pCat?.id : pCat) || '').toLowerCase();
        const pCatSlug = String((typeof pCat === 'object' ? pCat?.slug : pCat) || '').toLowerCase();
        const pCatName = String((typeof pCat === 'object' ? pCat?.name : pCat) || '').toLowerCase();
        const pSubId = String((p as any).subcategoryId || (typeof pSub === 'object' ? pSub?.id : pSub) || '').toLowerCase();
        const pSubSlug = String((typeof pSub === 'object' ? pSub?.slug : pSub) || '').toLowerCase();
        const pSubName = String((typeof pSub === 'object' ? pSub?.name : pSub) || '').toLowerCase();
        return (
          (pCatId && targetIds.has(pCatId)) ||
          (pCatSlug && targetIds.has(pCatSlug)) ||
          (pCatName && targetIds.has(pCatName)) ||
          (pSubId && targetIds.has(pSubId)) ||
          (pSubSlug && targetIds.has(pSubSlug)) ||
          (pSubName && targetIds.has(pSubName)) ||
          (cat === 'toddler' && (
            pCatSlug.includes('toddler') ||
            pCatName.includes('toddler') ||
            pCatId === 'cat-1792557286988-6ozkat' ||
            p.name?.toLowerCase().includes('toddler') ||
            pSubSlug.includes('12-18') ||
            pSubSlug.includes('18-24') ||
            pSubSlug.includes('24-36') ||
            pSubName.includes('12-18') ||
            pSubName.includes('18-24') ||
            pSubName.includes('24-36')
          )) ||
          ((cat.includes('12-18') || cat.includes('12–18')) && (
            pSubSlug.includes('12-18') ||
            pSubName.includes('12-18') ||
            pSubId === 'cat-1792557309838-hnx0zw' ||
            (p.sizes || []).some((s: string) => s.replace(/[\u2010-\u2015]/g, '-').includes('12-18')) ||
            (p.variants || []).some((v: any) => (v.size || '').replace(/[\u2010-\u2015]/g, '-').includes('12-18'))
          ))
        );
      });
    }

    if (query?.status) {
      result = result.filter((p) => p.status === query.status);
    }
    if (query?.featured === 'true') {
      result = result.filter((p) => p.isFeatured);
    }
    if (query?.bestseller === 'true') {
      result = result.filter((p) => p.isBestSeller);
    }
    if (query?.newarrival === 'true') {
      result = result.filter((p) => p.isNewArrival);
    }
    if (query?.search) {
      const search = String(query.search).toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search) ||
          p.sku?.toLowerCase().includes(search)
      );
    }

    return result;
  }

  public findProductById(idOrSlug: string): any | null {
    this.reload();
    return this.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
  }

  public createProduct(data: any): any {
    this.reload();
    const id = data.id || `prod-${Date.now()}`;
    const baseSlug =
      data.slug ||
      (data.name || 'product')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    let slug = baseSlug;
    let counter = 1;
    while (this.products.some((p) => p.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const price = Number(data.price) || 0;
    const comparePrice =
      data.comparePrice && Number(data.comparePrice) > price ? Number(data.comparePrice) : undefined;
    const discountPercentage =
      comparePrice && comparePrice > price
        ? Math.round((1 - price / comparePrice) * 100)
        : undefined;

    const newProduct = {
      id,
      name: data.name || 'New Product',
      slug,
      sku: data.sku || `REX-${slug.substring(0, 6).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
      shortDescription: data.shortDescription || data.description?.slice(0, 100) || '',
      description: data.description || '',
      price,
      comparePrice,
      discountPercentage,
      saleStartDate: data.saleStartDate,
      saleEndDate: data.saleEndDate,
      isFeatured: Boolean(data.isFeatured),
      isNewArrival: data.isNewArrival ?? true,
      isBestSeller: Boolean(data.isBestSeller),
      isSaleBadge: Boolean(data.isSaleBadge || (comparePrice && comparePrice > price)),
      status: data.status || 'published',
      brand: data.brand || 'REXBEBE Atelier',
      gender: data.gender || 'Baby',
      ageGroup: data.ageGroup || '0–3 months',
      category: data.category || { id: 'cat-clothing', name: 'Baby Clothing', slug: 'baby-clothing' },
      subcategory: data.subcategory,
      collection: data.collection,
      images:
        data.images && data.images.length > 0
          ? data.images
          : [{ id: `img-${Date.now()}`, url: '/images/products/organic-onesie.jpg', alt: data.name, position: 1 }],
      variants:
        data.variants && data.variants.length > 0
          ? data.variants
          : [
              {
                id: `var-${Date.now()}`,
                sku: `${slug.substring(0, 4).toUpperCase()}-STD`,
                size: 'Standard',
                color: 'Natural',
                colorHex: '#E6DFD5',
                price,
                stockQuantity: Number(data.stockQuantity) || 20,
              },
            ],
      colors: data.colors,
      sizes: data.sizes,
      stockQuantity: Number(data.stockQuantity) || 20,
      lowStockThreshold: Number(data.lowStockThreshold) || 5,
      stockStatus: data.stockStatus || 'in_stock',
      fabricMaterial: data.fabricMaterial || '100% GOTS Certified Organic Cotton',
      careInstructions: data.careInstructions || 'Gentle machine wash with cold water. Line dry in shade.',
      countryOfOrigin: data.countryOfOrigin || 'Sri Lanka',
      weight: data.weight || '160g',
      features: data.features || ['Ultra-soft organic fabric', 'Nickel-free buttons', 'Gentle seams'],
      rating: data.rating || 5.0,
      reviewCount: data.reviewCount || 1,
      reviewsList: data.reviewsList || [],
      productType: data.productType || 'single',
      parts: data.parts || [],
      seoTitle: data.seoTitle || `${data.name} | REXBEBE Baby Clothing`,
      seoDescription: data.seoDescription || data.shortDescription || data.description?.slice(0, 150),
    };

    this.products.unshift(newProduct);
    saveData('products.json', this.products);
    return newProduct;
  }

  public updateProduct(id: string, updateData: any): any | null {
    this.reload();
    const idx = this.products.findIndex((p) => p.id === id || p.slug === id);
    if (idx === -1) return null;

    const current = this.products[idx];
    const price = updateData.price !== undefined ? Number(updateData.price) : current.price;
    const comparePrice =
      updateData.comparePrice !== undefined
        ? updateData.comparePrice && Number(updateData.comparePrice) > price
          ? Number(updateData.comparePrice)
          : undefined
        : current.comparePrice;

    const discountPercentage =
      comparePrice && comparePrice > price
        ? Math.round((1 - price / comparePrice) * 100)
        : undefined;

    this.products[idx] = {
      ...current,
      ...updateData,
      price,
      comparePrice,
      discountPercentage,
    };

    saveData('products.json', this.products);
    return this.products[idx];
  }

  public duplicateProduct(id: string): any | null {
    this.reload();
    const original = this.products.find((p) => p.id === id);
    if (!original) return null;

    const newId = `prod-${Date.now()}`;
    const baseSlug = `${original.slug}-copy`;
    let slug = baseSlug;
    let counter = 1;
    while (this.products.some((p) => p.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const duplicated = {
      ...original,
      id: newId,
      name: `${original.name} (Copy)`,
      slug,
      sku: `${original.sku || 'REX'}-COPY-${Math.floor(Math.random() * 900 + 100)}`,
      status: 'draft',
      images: (original.images || []).map((img: any, idx: number) => ({
        ...img,
        id: `img-${Date.now()}-${idx}`,
      })),
      variants: (original.variants || []).map((v: any, idx: number) => ({
        ...v,
        id: `var-${Date.now()}-${idx}`,
        sku: `${v.sku}-CPY`,
      })),
      rating: 5.0,
      reviewCount: 0,
      reviewsList: [],
    };

    this.products.unshift(duplicated);
    saveData('products.json', this.products);
    return duplicated;
  }

  public deleteProduct(id: string): boolean {
    this.reload();
    const idx = this.products.findIndex((p) => p.id === id || p.slug === id);
    if (idx === -1) return false;

    const removedProduct = this.products[idx];
    const targetId = removedProduct.id;
    const targetSlug = removedProduct.slug;

    this.products.splice(idx, 1);
    saveData('products.json', this.products);

    // Clean up category assignedProductIds
    let catModified = false;
    this.categories.forEach((cat) => {
      if (Array.isArray(cat.assignedProductIds)) {
        const len = cat.assignedProductIds.length;
        cat.assignedProductIds = cat.assignedProductIds.filter((pid) => pid !== targetId && pid !== targetSlug);
        if (cat.assignedProductIds.length !== len) catModified = true;
      }
    });
    if (catModified) {
      saveData('categories.json', this.categories);
    }

    // Clean up navigation assignedProductIds
    let navModified = false;
    (this.navigation.items || []).forEach((item: any) => {
      if (Array.isArray(item.assignedProductIds)) {
        const len = item.assignedProductIds.length;
        item.assignedProductIds = item.assignedProductIds.filter((pid: string) => pid !== targetId && pid !== targetSlug);
        if (item.assignedProductIds.length !== len) navModified = true;
      }
      (item.subGroups || []).forEach((grp: any) => {
        (grp.subItems || []).forEach((sub: any) => {
          if (Array.isArray(sub.assignedProductIds)) {
            const len = sub.assignedProductIds.length;
            sub.assignedProductIds = sub.assignedProductIds.filter((pid: string) => pid !== targetId && pid !== targetSlug);
            if (sub.assignedProductIds.length !== len) navModified = true;
          }
        });
      });
    });
    if (navModified) {
      saveData('navigation.json', this.navigation);
    }

    return true;
  }

  public toggleProductField(id: string, field: 'isBestSeller' | 'isNewArrival' | 'isFeatured'): any | null {
    this.reload();
    const product = this.products.find((p) => p.id === id || p.slug === id);
    if (!product) return null;

    product[field] = !product[field];
    saveData('products.json', this.products);
    return product;
  }

  public updateProductStatus(id: string, status: 'draft' | 'published' | 'unpublished'): any | null {
    this.reload();
    const product = this.products.find((p) => p.id === id || p.slug === id);
    if (!product) return null;

    product.status = status;
    saveData('products.json', this.products);
    return product;
  }

  public getPages() {
    return loadData<any[]>('pages.json', (defaultPages as unknown) as any[]);
  }

  public getDeliverySettings() {
    return loadData<any>('delivery_settings.json', (defaultDelivery as unknown) as any);
  }

  public getSettings() {
    return loadData<any>('settings.json', (defaultSettings as unknown) as any);
  }
}

export const serverStore = new ServerStore();
