import { db, DatabaseManager } from '../../config/database';

export interface RawWishlistData {
  id: string;
  productIds: string[];
  updatedAt?: string;
}

export class PostgresWishlistRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  public async getWishlist(wishlistId: string, customerId?: string): Promise<RawWishlistData | null> {
    if (!wishlistId && !customerId) return null;

    let res = await this.database.query(
      `SELECT * FROM "Wishlist" WHERE id = $1 ${customerId ? 'OR "customerId" = $2' : ''} LIMIT 1`,
      customerId ? [wishlistId, customerId] : [wishlistId]
    );

    if (res.rows.length === 0) return null;
    const wl = res.rows[0];

    const itemsRes = await this.database.query(
      `SELECT "productId" FROM "WishlistItem" WHERE "wishlistId" = $1 ORDER BY "createdAt" ASC`,
      [wl.id]
    );

    return {
      id: wl.id,
      productIds: itemsRes.rows.map((r) => r.productId),
      updatedAt: wl.updatedAt ? new Date(wl.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  public async saveWishlist(wishlistId: string, productIds: string[], customerId?: string): Promise<void> {
    const custId = customerId || wishlistId;
    const now = new Date();

    await this.database.transaction(async (tx) => {
      // 1. Ensure Customer exists to satisfy FK
      await tx.query(
        `INSERT INTO "Customer" (id, name, email, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [custId, 'Guest Customer', `${custId}@guest.rexbebe.lk`]
      );

      // 2. Upsert Wishlist
      await tx.query(
        `INSERT INTO "Wishlist" (id, "customerId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $3)
         ON CONFLICT (id) DO UPDATE SET "updatedAt" = EXCLUDED."updatedAt"`,
        [wishlistId, custId, now]
      );

      // 3. Clear existing items
      await tx.query(`DELETE FROM "WishlistItem" WHERE "wishlistId" = $1`, [wishlistId]);

      // 4. Insert valid product items
      for (let i = 0; i < productIds.length; i++) {
        const pid = productIds[i];
        // Validate product exists
        const prodCheck = await tx.query(`SELECT id FROM "Product" WHERE id = $1 LIMIT 1`, [pid]);
        if (prodCheck.rows.length > 0) {
          const itemId = `wi-${wishlistId}-${i}-${Date.now()}`;
          await tx.query(
            `INSERT INTO "WishlistItem" (id, "wishlistId", "productId", "createdAt")
             VALUES ($1, $2, $3, $4)`,
            [itemId, wishlistId, pid, now]
          );
        }
      }
    });
  }

  public async clearWishlist(wishlistId: string): Promise<void> {
    await this.database.transaction(async (tx) => {
      await tx.query(`DELETE FROM "WishlistItem" WHERE "wishlistId" = $1`, [wishlistId]);
      await tx.query(`UPDATE "Wishlist" SET "updatedAt" = NOW() WHERE id = $1`, [wishlistId]);
    });
  }

  public async getAllWishlists(): Promise<Record<string, RawWishlistData>> {
    const res = await this.database.query(`SELECT * FROM "Wishlist"`);
    const result: Record<string, RawWishlistData> = {};

    for (const wl of res.rows) {
      const itemsRes = await this.database.query(
        `SELECT "productId" FROM "WishlistItem" WHERE "wishlistId" = $1`,
        [wl.id]
      );
      result[wl.id] = {
        id: wl.id,
        productIds: itemsRes.rows.map((r) => r.productId),
        updatedAt: wl.updatedAt ? new Date(wl.updatedAt).toISOString() : new Date().toISOString(),
      };
    }

    return result;
  }
}

export const postgresWishlistRepository = new PostgresWishlistRepository();

