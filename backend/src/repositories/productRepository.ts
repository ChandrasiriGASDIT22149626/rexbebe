import fs from 'fs';
import path from 'path';
import { CategoryRepository } from './categoryRepository';

export interface ProductPartImage {
  id?: string;
  colorName?: string;
  sizeName?: string;
  url: string;
  alt?: string;
  isRecolored?: boolean;
  recolorSourceUrl?: string;
}

export interface ProductPart {
  id: string;
  name: string;
  type: 'T-shirt' | 'Shirt' | 'Pants' | 'Shorts' | 'Dress' | 'Romper' | 'Hat' | 'Jacket' | 'Other';
  description?: string;
  colors: ProductColorOption[];
  defaultColor?: string;
  images?: ProductPartImage[];
  active: boolean;
  isPurchasableIndividually?: boolean;
  price?: number;
  comparePrice?: number;
  skuPrefix?: string;
  sizes?: string[];
  maskUrl?: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size?: string;
  color?: string;
  colorHex?: string;
  partColors?: Record<string, string>;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  partId?: string;
  partName?: string;
  purchaseType?: 'complete_set' | 'individual_part';
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  position: number;
  partName?: string;
  colorName?: string;
}

export interface ProductColorOption {
  name: string;
  hex: string;
}

export interface ProductReviewItem {
  id: string;
  author: string;
  location?: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  verified?: boolean;
  fit?: string;
  helpfulCount?: number;
  status?: 'approved' | 'pending' | 'rejected';
}

export interface ProductRecord {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  shortDescription?: string;
  description: string;
  price: number;
  comparePrice?: number;
  discountPercentage?: number;
  saleStartDate?: string;
  saleEndDate?: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller?: boolean;
  isSaleBadge?: boolean;
  status?: 'draft' | 'published' | 'unpublished';
  brand?: string;
  productType?: 'single' | 'set';
  parts?: ProductPart[];
  gender?: 'Baby' | 'Girls' | 'Boys' | 'Unisex';
  ageGroup?: string;
  category: { id: string; name: string; slug: string };
  subcategory?: { id: string; name: string; slug: string };
  collection?: { id: string; name: string; slug: string };
  images: ProductImage[];
  variants: ProductVariant[];
  colors?: ProductColorOption[];
  sizes?: string[];
  stockQuantity?: number;
  lowStockThreshold?: number;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order';
  fabricMaterial?: string;
  careInstructions?: string;
  countryOfOrigin?: string;
  weight?: string;
  features?: string[];
  rating: number;
  reviewCount: number;
  reviewsList?: ProductReviewItem[];
  seoTitle?: string;
  seoDescription?: string;
}

const STORAGE_FILE_PATH = path.resolve(__dirname, '../../data/products.json');

export class ProductRepository {
  private products: ProductRecord[] = [];

  constructor() {
    this.products = this.loadFromDisk();
  }

  private loadFromDisk(): ProductRecord[] {
    try {
      const seedPath = path.resolve(__dirname, '../../data/products.seed.json');

      if (fs.existsSync(STORAGE_FILE_PATH)) {
        const raw = fs.readFileSync(STORAGE_FILE_PATH, 'utf-8');
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {
          console.warn('[ProductRepository] Error parsing products.json:', e);
        }
      }

      // If products.json file does not exist, seed once from products.seed.json
      if (fs.existsSync(seedPath)) {
        const seedRaw = fs.readFileSync(seedPath, 'utf-8');
        const seedParsed = JSON.parse(seedRaw);
        if (Array.isArray(seedParsed) && seedParsed.length > 0) {
          const dir = path.dirname(STORAGE_FILE_PATH);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(seedParsed, null, 2), 'utf-8');
          console.log(`[ProductRepository] Successfully seeded ${seedParsed.length} products from seed file.`);
          return seedParsed;
        }
      }
    } catch (err) {
      console.warn('[ProductRepository] Error loading products from disk:', err);
    }
    return [];
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(STORAGE_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(this.products, null, 2), 'utf-8');

      // Also persist to frontend/data/products.json so frontend and backend remain 100% in sync
      const frontendPath = path.resolve(__dirname, '../../../frontend/data/products.json');
      if (fs.existsSync(path.dirname(frontendPath))) {
        fs.writeFileSync(frontendPath, JSON.stringify(this.products, null, 2), 'utf-8');
      }
    } catch (err) {
      console.error('[ProductRepository] Error saving products to disk:', err);
    }
  }

  async findAll(query?: any): Promise<ProductRecord[]> {
    // Reload from disk to catch external changes
    this.products = this.loadFromDisk();
    let result = [...this.products];

    if (query?.category) {
      const cat = String(query.category).toLowerCase().trim();
      const targetIds = new Set<string>([cat]);
      const assignedProdIds = new Set<string>();

      try {
        const catRepo = CategoryRepository.getInstance();
        const found = catRepo.findById(query.category) || catRepo.findBySlug(query.category);
        if (found) {
          targetIds.add(found.id.toLowerCase());
          targetIds.add(found.slug.toLowerCase());
          targetIds.add(found.name.toLowerCase());
          if (Array.isArray(found.assignedProductIds)) {
            found.assignedProductIds.forEach((pid) => assignedProdIds.add(pid));
          }
          const descendants = catRepo.getDescendants(found.id);
          for (const d of descendants) {
            targetIds.add(d.id.toLowerCase());
            targetIds.add(d.slug.toLowerCase());
            targetIds.add(d.name.toLowerCase());
            if (Array.isArray(d.assignedProductIds)) {
              d.assignedProductIds.forEach((pid) => assignedProdIds.add(pid));
            }
          }
        }
      } catch (err) {
        console.warn('[ProductRepository] Error resolving category descendants:', err);
      }

      result = result.filter((p) => {
        if (assignedProdIds.has(p.id)) return true;
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
            (p.sizes || []).some((s) => s.replace(/[\u2010-\u2015]/g, '-').includes('12-18')) ||
            (p.variants || []).some((v) => (v.size || '').replace(/[\u2010-\u2015]/g, '-').includes('12-18'))
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

    if (query?.sale === 'true') {
      result = result.filter((p) => p.comparePrice && p.comparePrice > p.price);
    }

    if (query?.gender) {
      const gen = String(query.gender).toLowerCase();
      result = result.filter(
        (p) =>
          p.gender?.toLowerCase() === gen ||
          p.gender?.toLowerCase() === 'unisex' ||
          p.name.toLowerCase().includes(gen)
      );
    }

    if (query?.search) {
      const search = String(query.search).toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.sku?.toLowerCase().includes(search) ||
          p.category.name.toLowerCase().includes(search)
      );
    }

    return result;
  }

  async findBySlug(slug: string): Promise<ProductRecord | null> {
    this.products = this.loadFromDisk();
    const product = this.products.find((p) => p.slug === slug);
    return product || null;
  }

  async findById(id: string): Promise<ProductRecord | null> {
    this.products = this.loadFromDisk();
    const product = this.products.find((p) => p.id === id);
    return product || null;
  }

  async findVariant(variantId: string): Promise<{ product: ProductRecord; variant: ProductVariant } | null> {
    this.products = this.loadFromDisk();
    for (const p of this.products) {
      const v = (p.variants || []).find((varItem) => varItem.id === variantId);
      if (v) return { product: p, variant: v };
    }
    return null;
  }

  async findByIds(ids: string[]): Promise<ProductRecord[]> {
    this.products = this.loadFromDisk();
    const set = new Set(ids);
    return this.products.filter((p) => set.has(p.id));
  }

  async create(data: any): Promise<ProductRecord> {
    this.products = this.loadFromDisk();
    const id = data.id || `prod-${Date.now()}`;
    const baseSlug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    // Ensure unique slug
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

    const newProduct: ProductRecord = {
      id,
      name: data.name,
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
    this.saveToDisk();
    return newProduct;
  }

  async update(id: string, updateData: any): Promise<ProductRecord | null> {
    this.products = this.loadFromDisk();
    const idx = this.products.findIndex((p) => p.id === id);
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

    this.saveToDisk();
    return this.products[idx];
  }

  async duplicate(id: string): Promise<ProductRecord | null> {
    this.products = this.loadFromDisk();
    const original = this.products.find((p) => p.id === id);
    if (!original) return null;

    const newId = `prod-${Date.now()}`;
    const baseSlug = `${original.slug}-copy`;
    let slug = baseSlug;
    let counter = 1;
    while (this.products.some((p) => p.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const duplicated: ProductRecord = {
      ...original,
      id: newId,
      name: `${original.name} (Copy)`,
      slug,
      sku: `${original.sku || 'REX'}-COPY-${Math.floor(Math.random() * 900 + 100)}`,
      status: 'draft',
      images: original.images.map((img, idx) => ({
        ...img,
        id: `img-${Date.now()}-${idx}`,
      })),
      variants: original.variants.map((v, idx) => ({
        ...v,
        id: `var-${Date.now()}-${idx}`,
        sku: `${v.sku}-CPY`,
      })),
      rating: 5.0,
      reviewCount: 0,
      reviewsList: [],
    };

    this.products.unshift(duplicated);
    this.saveToDisk();
    return duplicated;
  }

  async delete(id: string): Promise<boolean> {
    this.products = this.loadFromDisk();
    const idx = this.products.findIndex((p) => p.id === id || p.slug === id);
    if (idx === -1) return false;

    const removedProduct = this.products[idx];
    const targetId = removedProduct.id;
    const targetSlug = removedProduct.slug;

    this.products.splice(idx, 1);
    this.saveToDisk();

    // 1. Clean up references in categories.json & in-memory CategoryRepository
    try {
      CategoryRepository.getInstance().removeProductReference(targetId);
      if (targetSlug && targetSlug !== targetId) {
        CategoryRepository.getInstance().removeProductReference(targetSlug);
      }
    } catch (catRepoErr) {
      console.warn('[ProductRepository] Notice cleaning CategoryRepository instance:', catRepoErr);
    }

    try {
      const categoriesFilePath = path.resolve(__dirname, '../../data/categories.json');
      if (fs.existsSync(categoriesFilePath)) {
        const categories = JSON.parse(fs.readFileSync(categoriesFilePath, 'utf-8'));
        let catModified = false;
        categories.forEach((cat: any) => {
          if (Array.isArray(cat.assignedProductIds)) {
            const initialLen = cat.assignedProductIds.length;
            cat.assignedProductIds = cat.assignedProductIds.filter(
              (pId: string) => pId !== targetId && pId !== targetSlug
            );
            if (cat.assignedProductIds.length !== initialLen) {
              catModified = true;
            }
          }
        });
        if (catModified) {
          fs.writeFileSync(categoriesFilePath, JSON.stringify(categories, null, 2), 'utf-8');
        }
      }
    } catch (catErr) {
      console.warn('[ProductRepository] Notice cleaning up categories references:', catErr);
    }

    // 2. Clean up references in collections.json
    try {
      const collectionsFilePath = path.resolve(__dirname, '../../data/collections.json');
      if (fs.existsSync(collectionsFilePath)) {
        const collections = JSON.parse(fs.readFileSync(collectionsFilePath, 'utf-8'));
        let modified = false;
        collections.forEach((c: any) => {
          if (Array.isArray(c.assignedProductIds)) {
            const initialLen = c.assignedProductIds.length;
            c.assignedProductIds = c.assignedProductIds.filter(
              (pId: string) => pId !== targetId && pId !== targetSlug
            );
            if (c.assignedProductIds.length !== initialLen) {
              modified = true;
            }
          }
        });
        if (modified) {
          fs.writeFileSync(collectionsFilePath, JSON.stringify(collections, null, 2), 'utf-8');
        }
      }
    } catch (collErr) {
      console.warn('[ProductRepository] Notice cleaning up collections references:', collErr);
    }

    // 3. Clean up references in navigation.json
    try {
      const navigationFilePath = path.resolve(__dirname, '../../data/navigation.json');
      if (fs.existsSync(navigationFilePath)) {
        const nav = JSON.parse(fs.readFileSync(navigationFilePath, 'utf-8'));
        let navModified = false;
        (nav.items || []).forEach((item: any) => {
          if (Array.isArray(item.assignedProductIds)) {
            const initialLen = item.assignedProductIds.length;
            item.assignedProductIds = item.assignedProductIds.filter(
              (pId: string) => pId !== targetId && pId !== targetSlug
            );
            if (item.assignedProductIds.length !== initialLen) navModified = true;
          }
          (item.subGroups || []).forEach((grp: any) => {
            (grp.subItems || []).forEach((sub: any) => {
              if (Array.isArray(sub.assignedProductIds)) {
                const initialLen = sub.assignedProductIds.length;
                sub.assignedProductIds = sub.assignedProductIds.filter(
                  (pId: string) => pId !== targetId && pId !== targetSlug
                );
                if (sub.assignedProductIds.length !== initialLen) navModified = true;
              }
            });
          });
        });
        if (navModified) {
          fs.writeFileSync(navigationFilePath, JSON.stringify(nav, null, 2), 'utf-8');
        }
      }
    } catch (navErr) {
      console.warn('[ProductRepository] Notice cleaning up navigation references:', navErr);
    }

    // 4. Clean up feedback.json reviews for this product
    try {
      const feedbackFilePath = path.resolve(__dirname, '../../data/feedback.json');
      if (fs.existsSync(feedbackFilePath)) {
        const feedback = JSON.parse(fs.readFileSync(feedbackFilePath, 'utf-8'));
        if (Array.isArray(feedback)) {
          const filtered = feedback.filter(
            (fb: any) => fb.productId !== targetId && fb.productId !== targetSlug
          );
          if (filtered.length !== feedback.length) {
            fs.writeFileSync(feedbackFilePath, JSON.stringify(filtered, null, 2), 'utf-8');
          }
        }
      }
    } catch (fbErr) {
      console.warn('[ProductRepository] Notice cleaning up feedback references:', fbErr);
    }

    // 5. Clean up unreferenced media assets and physical upload files safely
    try {
      const mediaFilePath = path.resolve(__dirname, '../../data/media.json');
      if (fs.existsSync(mediaFilePath)) {
        const mediaList = JSON.parse(fs.readFileSync(mediaFilePath, 'utf-8'));
        if (Array.isArray(mediaList)) {
          const productImgUrls: string[] = [];
          (removedProduct.images || []).forEach((img: any) => {
            if (img.url) productImgUrls.push(img.url);
          });
          (removedProduct.parts || []).forEach((part: any) => {
            (part.images || []).forEach((pimg: any) => {
              if (pimg.url) productImgUrls.push(pimg.url);
            });
          });

          const otherProductsJson = JSON.stringify(this.products);
          const urlsToRemove: string[] = [];

          productImgUrls.forEach((url) => {
            if (url.includes('/uploads/')) {
              const filename = path.basename(url);
              if (!otherProductsJson.includes(filename)) {
                urlsToRemove.push(url);
                urlsToRemove.push(filename);
              }
            }
          });

          if (urlsToRemove.length > 0) {
            const filteredMedia = mediaList.filter((m: any) => {
              const mUrl = m.url || '';
              const mName = m.name || '';
              const match = urlsToRemove.some((u) => mUrl.includes(u) || mName.includes(u));
              if (match) {
                const backendUploadPath = path.resolve(__dirname, '../../uploads', mName);
                const frontendUploadPath = path.resolve(__dirname, '../../../frontend/public/uploads', mName);
                if (fs.existsSync(backendUploadPath)) {
                  try { fs.unlinkSync(backendUploadPath); } catch {}
                }
                if (fs.existsSync(frontendUploadPath)) {
                  try { fs.unlinkSync(frontendUploadPath); } catch {}
                }
                return false;
              }
              return true;
            });

            if (filteredMedia.length !== mediaList.length) {
              fs.writeFileSync(mediaFilePath, JSON.stringify(filteredMedia, null, 2), 'utf-8');
            }
          }
        }
      }
    } catch (mediaErr) {
      console.warn('[ProductRepository] Notice cleaning up media references:', mediaErr);
    }

    // 6. Verify and preserve order snapshots (Requirement 9)
    let orderCount = 0;
    try {
      const ordersFilePath = path.resolve(__dirname, '../../data/orders.json');
      if (fs.existsSync(ordersFilePath)) {
        const orders = JSON.parse(fs.readFileSync(ordersFilePath, 'utf-8'));
        if (Array.isArray(orders)) {
          orders.forEach((ord: any) => {
            const hasItem = (ord.items || []).some(
              (it: any) => it.productId === targetId || it.productId === targetSlug
            );
            if (hasItem) orderCount++;
          });
        }
      }
    } catch (ordErr) {
      console.warn('[ProductRepository] Notice checking order references:', ordErr);
    }

    // 7. Record audit log
    try {
      const auditFilePath = path.resolve(__dirname, '../../data/audit_logs.json');
      const logs = fs.existsSync(auditFilePath) ? JSON.parse(fs.readFileSync(auditFilePath, 'utf-8')) : [];
      logs.unshift({
        id: `log-${Date.now()}`,
        userEmail: 'admin@rexbebe.com',
        userName: 'Admin Executive',
        action: 'PRODUCT_PERMANENT_DELETE',
        details: `Permanently deleted product "${removedProduct.name}" (${removedProduct.sku || targetId}). Cleaned category & collection references. Preserved ${orderCount} historical order snapshots intact.`,
        ip: '127.0.0.1',
        timestamp: new Date().toISOString(),
      });
      if (logs.length > 500) logs.pop();
      fs.writeFileSync(auditFilePath, JSON.stringify(logs, null, 2), 'utf-8');
    } catch (auditErr) {
      console.warn('[ProductRepository] Notice recording audit log:', auditErr);
    }

    return true;
  }

  async toggleBestSeller(id: string): Promise<ProductRecord | null> {
    this.products = this.loadFromDisk();
    const product = this.products.find((p) => p.id === id);
    if (!product) return null;
    product.isBestSeller = !product.isBestSeller;
    this.saveToDisk();
    return product;
  }

  async toggleNewArrival(id: string): Promise<ProductRecord | null> {
    this.products = this.loadFromDisk();
    const product = this.products.find((p) => p.id === id);
    if (!product) return null;
    product.isNewArrival = !product.isNewArrival;
    this.saveToDisk();
    return product;
  }

  async toggleFeatured(id: string): Promise<ProductRecord | null> {
    this.products = this.loadFromDisk();
    const product = this.products.find((p) => p.id === id);
    if (!product) return null;
    product.isFeatured = !product.isFeatured;
    this.saveToDisk();
    return product;
  }

  async updateStatus(id: string, status: 'draft' | 'published' | 'unpublished'): Promise<ProductRecord | null> {
    this.products = this.loadFromDisk();
    const product = this.products.find((p) => p.id === id);
    if (!product) return null;
    product.status = status;
    this.saveToDisk();
    return product;
  }
}
