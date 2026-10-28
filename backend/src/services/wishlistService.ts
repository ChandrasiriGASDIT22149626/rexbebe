import fs from 'fs';
import path from 'path';
import { ProductRepository, ProductRecord } from '../repositories/productRepository';
import { prisma } from '../config/database';

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

  /**
   * Retrieves wishlist by session ID or customer ID.
   * Checks persistent PostgreSQL database via Prisma if connected, falling back to durable JSON storage.
   */
  async getWishlist(wishlistId: string, customerId?: string): Promise<WishlistSession> {
    const wishlists = this.loadWishlistsFromDisk();
    let productIds: string[] = wishlists[wishlistId]?.productIds || [];

    // Attempt PostgreSQL fetch if customerId is present
    if (customerId) {
      try {
        const dbWishlist = await prisma.wishlist.findFirst({
          where: { customerId },
          include: { items: true },
        });
        if (dbWishlist && dbWishlist.items.length > 0) {
          const dbIds = dbWishlist.items.map((i) => i.productId);
          // Merge with session IDs
          productIds = Array.from(new Set([...productIds, ...dbIds]));
          wishlists[wishlistId] = {
            id: wishlistId,
            productIds,
            updatedAt: new Date().toISOString(),
          };
          this.saveWishlistsToDisk(wishlists);
        }
      } catch (dbErr) {
        // Fallback to disk persistence if database is offline
      }
    }

    return this.enrichWishlist(wishlistId, productIds);
  }

  /**
   * Adds product to wishlist. Persists to both PostgreSQL (Prisma) and local JSON storage.
   */
  async addItem(wishlistId: string, productId: string, customerId?: string): Promise<WishlistSession> {
    const wishlists = this.loadWishlistsFromDisk();
    if (!wishlists[wishlistId]) {
      wishlists[wishlistId] = { id: wishlistId, productIds: [], updatedAt: new Date().toISOString() };
    }

    if (!wishlists[wishlistId].productIds.includes(productId)) {
      wishlists[wishlistId].productIds.push(productId);
      wishlists[wishlistId].updatedAt = new Date().toISOString();
      this.saveWishlistsToDisk(wishlists);
    }

    // Persist to PostgreSQL via Prisma if customerId exists
    if (customerId) {
      try {
        let dbWishlist = await prisma.wishlist.findFirst({ where: { customerId } });
        if (!dbWishlist) {
          dbWishlist = await prisma.wishlist.create({ data: { customerId } });
        }
        const existing = await prisma.wishlistItem.findFirst({
          where: { wishlistId: dbWishlist.id, productId },
        });
        if (!existing) {
          await prisma.wishlistItem.create({
            data: { wishlistId: dbWishlist.id, productId },
          });
        }
      } catch (dbErr) {
        // Fallback safely if PostgreSQL is offline
      }
    }

    return this.enrichWishlist(wishlistId, wishlists[wishlistId].productIds);
  }

  /**
   * Removes product from wishlist.
   */
  async removeItem(wishlistId: string, productId: string, customerId?: string): Promise<WishlistSession> {
    const wishlists = this.loadWishlistsFromDisk();
    if (wishlists[wishlistId]) {
      wishlists[wishlistId].productIds = wishlists[wishlistId].productIds.filter((id: string) => id !== productId);
      wishlists[wishlistId].updatedAt = new Date().toISOString();
      this.saveWishlistsToDisk(wishlists);
    }

    if (customerId) {
      try {
        const dbWishlist = await prisma.wishlist.findFirst({ where: { customerId } });
        if (dbWishlist) {
          await prisma.wishlistItem.deleteMany({
            where: { wishlistId: dbWishlist.id, productId },
          });
        }
      } catch (dbErr) {
        // Fallback safely
      }
    }

    return this.enrichWishlist(wishlistId, wishlists[wishlistId]?.productIds || []);
  }

  /**
   * Clears all items from the wishlist.
   */
  async clearWishlist(wishlistId: string, customerId?: string): Promise<WishlistSession> {
    const wishlists = this.loadWishlistsFromDisk();
    if (wishlists[wishlistId]) {
      wishlists[wishlistId].productIds = [];
      wishlists[wishlistId].updatedAt = new Date().toISOString();
      this.saveWishlistsToDisk(wishlists);
    }

    if (customerId) {
      try {
        const dbWishlist = await prisma.wishlist.findFirst({ where: { customerId } });
        if (dbWishlist) {
          await prisma.wishlistItem.deleteMany({
            where: { wishlistId: dbWishlist.id },
          });
        }
      } catch (dbErr) {
        // Fallback safely
      }
    }

    return this.enrichWishlist(wishlistId, []);
  }

  /**
   * Synchronizes product IDs from client to backend.
   */
  async syncWishlist(wishlistId: string, productIds: string[], customerId?: string): Promise<WishlistSession> {
    const wishlists = this.loadWishlistsFromDisk();
    const cleanIds = Array.from(new Set(productIds.filter(Boolean)));
    wishlists[wishlistId] = {
      id: wishlistId,
      productIds: cleanIds,
      updatedAt: new Date().toISOString(),
    };
    this.saveWishlistsToDisk(wishlists);

    if (customerId) {
      try {
        let dbWishlist = await prisma.wishlist.findFirst({ where: { customerId } });
        if (!dbWishlist) {
          dbWishlist = await prisma.wishlist.create({ data: { customerId } });
        }
        await prisma.wishlistItem.deleteMany({ where: { wishlistId: dbWishlist.id } });
        for (const pid of cleanIds) {
          await prisma.wishlistItem.create({
            data: { wishlistId: dbWishlist.id, productId: pid },
          });
        }
      } catch (dbErr) {
        // Fallback safely
      }
    }

    return this.enrichWishlist(wishlistId, cleanIds);
  }
}
