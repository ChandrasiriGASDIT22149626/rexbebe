import { db, DatabaseManager } from '../../config/database';
import { InventoryItemView, StockAdjustmentRecord } from '../inventoryRepository';

export class PostgresInventoryRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  public async findAll(): Promise<InventoryItemView[]> {
    const res = await this.database.query(`
      SELECT 
        v.id as "variantId",
        v.sku,
        v.size,
        v.color,
        v."imageUrl",
        v."stockQuantity",
        p.id as "productId",
        p.name as "productName",
        p."lowStockThreshold",
        p."updatedAt",
        c.name as "categoryName",
        (SELECT url FROM "ProductImage" WHERE "productId" = p.id ORDER BY position ASC LIMIT 1) as "mainImage"
      FROM "ProductVariant" v
      JOIN "Product" p ON v."productId" = p.id
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      ORDER BY p.name ASC, v.sku ASC
    `);

    return res.rows.map((row) => {
      const qty = Number(row.stockQuantity || 0);
      const threshold = Number(row.lowStockThreshold || 5);
      let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
      if (qty <= 0) status = 'OUT_OF_STOCK';
      else if (qty <= threshold) status = 'LOW_STOCK';

      return {
        productId: row.productId,
        variantId: row.variantId,
        sku: row.sku || `SKU-${row.productId}`,
        productName: row.productName,
        categoryName: row.categoryName || 'Baby Collection',
        color: row.color || undefined,
        size: row.size || undefined,
        image: row.imageUrl || row.mainImage || undefined,
        quantity: qty,
        reserved: 0,
        lowStockThreshold: threshold,
        stockStatus: status,
        updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
      };
    });
  }

  public async updateStock(
    variantId: string,
    quantity: number,
    reason: string = 'Manual stock adjustment',
    adjustedBy: string = 'admin@rexbebe.com'
  ): Promise<InventoryItemView | null> {
    if (quantity < 0) {
      throw new Error('Stock quantity cannot be negative.');
    }

    return await this.database.transaction(async (tx) => {
      // 1. Fetch current variant
      const varRes = await tx.query(
        `SELECT v.*, p.name as "productName", p."lowStockThreshold"
         FROM "ProductVariant" v
         JOIN "Product" p ON v."productId" = p.id
         WHERE v.id = $1 LIMIT 1`,
        [variantId]
      );

      if (varRes.rows.length === 0) return null;
      const v = varRes.rows[0];
      const prevQty = Number(v.stockQuantity || 0);
      const change = quantity - prevQty;
      const now = new Date();

      // 2. Update variant stock
      await tx.query(
        `UPDATE "ProductVariant"
         SET "stockQuantity" = $1, "updatedAt" = $2
         WHERE id = $3`,
        [quantity, now, variantId]
      );

      // 3. Update parent product total stock and status
      const sumRes = await tx.query(
        `SELECT COALESCE(SUM("stockQuantity"), 0) as total
         FROM "ProductVariant" WHERE "productId" = $1`,
        [v.productId]
      );
      const totalQty = Number(sumRes.rows[0]?.total || 0);
      const threshold = Number(v.lowStockThreshold || 5);
      let prodStatus = 'in_stock';
      if (totalQty <= 0) prodStatus = 'out_of_stock';
      else if (totalQty <= threshold) prodStatus = 'low_stock';

      await tx.query(
        `UPDATE "Product"
         SET "stockQuantity" = $1, "stockStatus" = $2, "updatedAt" = $3
         WHERE id = $4`,
        [totalQty, prodStatus, now, v.productId]
      );

      // 4. Record StockAdjustment
      const adjId = `adj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await tx.query(
        `INSERT INTO "StockAdjustment" (id, "productId", "variantId", sku, type, "previousQty", "newQty", quantity, reason, "adjustedBy", "createdAt")
         VALUES ($1, $2, $3, $4, 'CORRECTION', $5, $6, $7, $8, $9, $10)`,
        [adjId, v.productId, variantId, v.sku, prevQty, quantity, change, reason, adjustedBy, now]
      );

      let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
      if (quantity <= 0) status = 'OUT_OF_STOCK';
      else if (quantity <= threshold) status = 'LOW_STOCK';

      return {
        productId: v.productId,
        variantId,
        sku: v.sku,
        productName: v.productName,
        categoryName: 'Baby Collection',
        color: v.color || undefined,
        size: v.size || undefined,
        image: v.imageUrl || undefined,
        quantity,
        reserved: 0,
        lowStockThreshold: threshold,
        stockStatus: status,
        updatedAt: now.toISOString(),
      };
    });
  }

  /**
   * Atomic inventory deduction executed within a database transaction.
   * Guarantees that stock quantity can never drop below zero under high concurrency.
   */
  public async atomicDeductStock(
    variantId: string,
    deductQty: number,
    reason: string = 'Order Checkout',
    actingUser: string = 'Checkout Service'
  ): Promise<{ success: boolean; remainingQuantity: number }> {
    if (deductQty <= 0) return { success: true, remainingQuantity: 0 };

    return await this.database.transaction(async (tx) => {
      // Atomic conditional decrement: WHERE "stockQuantity" >= $1
      const updateRes = await tx.query(
        `UPDATE "ProductVariant"
         SET "stockQuantity" = "stockQuantity" - $1,
             "updatedAt" = NOW()
         WHERE id = $2 AND "stockQuantity" >= $1
         RETURNING id, "productId", "sku", "stockQuantity"`,
        [deductQty, variantId]
      );

      if (updateRes.rows.length === 0) {
        throw new Error(`Insufficient stock for variant ${variantId}. Requested ${deductQty} unit(s).`);
      }

      const row = updateRes.rows[0];
      const remaining = Number(row.stockQuantity);
      const adjId = `adj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      await tx.query(
        `INSERT INTO "StockAdjustment" (id, "productId", "variantId", sku, type, "previousQty", "newQty", quantity, reason, "adjustedBy", "createdAt")
         VALUES ($1, $2, $3, $4, 'SALE', $5, $6, $7, $8, $9, NOW())`,
        [adjId, row.productId, variantId, row.sku, remaining + deductQty, remaining, -deductQty, reason, actingUser]
      );

      return { success: true, remainingQuantity: remaining };
    });
  }

  public async getAdjustments(): Promise<StockAdjustmentRecord[]> {
    const res = await this.database.query(`
      SELECT 
        s.id,
        s."productId",
        p.name as "productName",
        v.sku,
        v.color,
        v.size,
        s."previousQty" as "previousQuantity",
        s."newQty" as "newQuantity",
        s.quantity as "change",
        s.reason,
        s."adjustedBy",
        s."createdAt" as "timestamp"
      FROM "StockAdjustment" s
      LEFT JOIN "Product" p ON s."productId" = p.id
      LEFT JOIN "ProductVariant" v ON s."variantId" = v.id
      ORDER BY s."createdAt" DESC
      LIMIT 100
    `);

    return res.rows.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.productName || 'Unknown Product',
      sku: r.sku || 'N/A',
      variant: [r.color, r.size].filter(Boolean).join(' ') || 'Standard',
      previousQuantity: Number(r.previousQuantity || 0),
      newQuantity: Number(r.newQuantity || 0),
      change: Number(r.change || 0),
      reason: r.reason || 'Manual adjustment',
      adjustedBy: r.adjustedBy || 'admin@rexbebe.com',
      timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : new Date().toISOString(),
    }));
  }
}

export const postgresInventoryRepository = new PostgresInventoryRepository();

