import { db, DatabaseManager } from '../../config/database';

export interface RawCartData {
  id: string;
  items: { variantId: string; quantity: number }[];
  updatedAt?: string;
}

export class PostgresCartRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  public async getCart(cartId: string): Promise<RawCartData | null> {
    if (!cartId) return null;

    const cartRes = await this.database.query(
      `SELECT * FROM "Cart" WHERE id = $1 OR "sessionId" = $1 LIMIT 1`,
      [cartId]
    );

    if (cartRes.rows.length === 0) return null;
    const cart = cartRes.rows[0];

    const itemsRes = await this.database.query(
      `SELECT "variantId", quantity FROM "CartItem" WHERE "cartId" = $1 ORDER BY "createdAt" ASC`,
      [cart.id]
    );

    return {
      id: cart.id,
      items: itemsRes.rows.map((r) => ({
        variantId: r.variantId,
        quantity: Number(r.quantity || 1),
      })),
      updatedAt: cart.updatedAt ? new Date(cart.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  public async saveCart(cartId: string, items: { variantId: string; quantity: number }[]): Promise<void> {
    const now = new Date();

    await this.database.transaction(async (tx) => {
      // Upsert cart
      await tx.query(
        `INSERT INTO "Cart" (id, "sessionId", "createdAt", "updatedAt")
         VALUES ($1, $1, $2, $2)
         ON CONFLICT (id) DO UPDATE SET "updatedAt" = EXCLUDED."updatedAt"`,
        [cartId, now]
      );

      // Delete existing items
      await tx.query(`DELETE FROM "CartItem" WHERE "cartId" = $1`, [cartId]);

      // Insert new items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemId = `ci-${cartId}-${i}-${Date.now()}`;
        // Validate variant exists to avoid FK error
        const variantCheck = await tx.query(
          `SELECT id FROM "ProductVariant" WHERE id = $1 LIMIT 1`,
          [item.variantId]
        );
        if (variantCheck.rows.length > 0) {
          await tx.query(
            `INSERT INTO "CartItem" (id, "cartId", "variantId", quantity, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $5)`,
            [itemId, cartId, item.variantId, item.quantity, now]
          );
        }
      }
    });
  }

  public async clearCart(cartId: string): Promise<void> {
    await this.database.transaction(async (tx) => {
      await tx.query(`DELETE FROM "CartItem" WHERE "cartId" = $1`, [cartId]);
      await tx.query(`UPDATE "Cart" SET "updatedAt" = NOW() WHERE id = $1 OR "sessionId" = $1`, [cartId]);
    });
  }

  public async getAllCarts(): Promise<Record<string, RawCartData>> {
    const cartsRes = await this.database.query(`SELECT * FROM "Cart"`);
    const result: Record<string, RawCartData> = {};

    for (const c of cartsRes.rows) {
      const itemsRes = await this.database.query(
        `SELECT "variantId", quantity FROM "CartItem" WHERE "cartId" = $1`,
        [c.id]
      );
      result[c.id] = {
        id: c.id,
        items: itemsRes.rows.map((r) => ({
          variantId: r.variantId,
          quantity: Number(r.quantity || 1),
        })),
        updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
      };
    }

    return result;
  }
}

export const postgresCartRepository = new PostgresCartRepository();

