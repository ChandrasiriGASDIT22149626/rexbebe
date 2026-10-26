import fs from 'fs';
import path from 'path';
import { ProductRepository, ProductRecord } from '../repositories/productRepository';

export interface WishlistSession {
  id: string;
  items: ProductRecord[];
  productIds: string[];
  count: number;
  updatedAt: string;
}

const STORAGE_PATH = path.resolve(__dirname, '../../data/wishlists.json');

export class WishlistService {
  private productRepo = new ProductRepository();

  private loadWishlistsFromDisk(): Record<string, { id: string; productIds: string[]; updatedAt?: string }> {
    try {
      if (fs.existsSync(STORAGE_PATH)) {
        const raw = fs.readFileSync(STORAGE_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[WishlistService] Error reading wishlists.json:', e);
    }
    return {};
  }

  private saveWishlistsToDisk(wishlists: Record<string, any>): void {
    try {
      const dir = path.dirname(STORAGE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STORAGE_PATH, JSON.stringify(wishlists, null, 2), 'utf-8');
    } catch (e) {
      console.error('[WishlistService] Error saving wishlists.json:', e);
    }
  }

  private async enrichWishlist(id: string, productIds: string[]): Promise<WishlistSession> {
    const validProducts: ProductRecord[] = [];
    const validIds: string[] = [];

    for (const pid of productIds) {
      const product = await this.productRepo.findById(pid);
      if (product && product.status !== 'draft' && product.status !== 'unpublished') {
        validProducts.push(product);
        validIds.push(product.id);
      }
    }

    return {
      id,
      items: validProducts,
      productIds: validIds,
      count: validProducts.length,
      updatedAt: new Date().toISOString(),
    };
  }

  async getWishlist(wishlistId: string): Promise<WishlistSession> {
    const wishlists = this.loadWishlistsFromDisk();
    const raw = wishlists[wishlistId] || { id: wishlistId, productIds: [] };
    return this.enrichWishlist(wishlistId, raw.productIds);
  }

  async addItem(wishlistId: string, productId: string): Promise<WishlistSession> {
    const wishlists = this.loadWishlistsFromDisk();
    if (!wishlists[wishlistId]) {
      wishlists[wishlistId] = { id: wishlistId, productIds: [], updatedAt: new Date().toISOString() };
    }

    if (!wishlists[wishlistId].productIds.includes(productId)) {
      wishlists[wishlistId].productIds.push(productId);
      wishlists[wishlistId].updatedAt = new Date().toISOString();
      this.saveWishlistsToDisk(wishlists);
    }

    return this.enrichWishlist(wishlistId, wishlists[wishlistId].productIds);
  }

  async removeItem(wishlistId: string, productId: string): Promise<WishlistSession> {
    const wishlists = this.loadWishlistsFromDisk();
    if (wishlists[wishlistId]) {
      wishlists[wishlistId].productIds = wishlists[wishlistId].productIds.filter((id: string) => id !== productId);
      wishlists[wishlistId].updatedAt = new Date().toISOString();
      this.saveWishlistsToDisk(wishlists);
    }

    return this.enrichWishlist(wishlistId, wishlists[wishlistId]?.productIds || []);
  }

  async clearWishlist(wishlistId: string): Promise<WishlistSession> {
    const wishlists = this.loadWishlistsFromDisk();
    if (wishlists[wishlistId]) {
      wishlists[wishlistId].productIds = [];
      wishlists[wishlistId].updatedAt = new Date().toISOString();
      this.saveWishlistsToDisk(wishlists);
    }
    return this.enrichWishlist(wishlistId, []);
  }

  async syncWishlist(wishlistId: string, productIds: string[]): Promise<WishlistSession> {
    const wishlists = this.loadWishlistsFromDisk();
    const cleanIds = Array.from(new Set(productIds.filter(Boolean)));
    wishlists[wishlistId] = {
      id: wishlistId,
      productIds: cleanIds,
      updatedAt: new Date().toISOString(),
    };
    this.saveWishlistsToDisk(wishlists);
    return this.enrichWishlist(wishlistId, cleanIds);
  }
}
