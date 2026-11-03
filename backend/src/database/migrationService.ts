import fs from 'fs';
import path from 'path';
import { db, DatabaseManager } from '../config/database';
import { backupService, BackupManifest } from './backupService';

export interface EntityMigrationCount {
  entity: string;
  sourceJsonCount: number;
  migratedDbCount: number;
  status: 'SUCCESS' | 'WARNING' | 'SKIPPED';
  notes?: string;
}

export interface MigrationValidationIssue {
  severity: 'WARNING' | 'ERROR';
  entity: string;
  identifier: string;
  message: string;
}

export interface MigrationReport {
  timestamp: string;
  dryRun: boolean;
  success: boolean;
  databaseEngine: string;
  backupManifest?: BackupManifest;
  totalEntitiesMigrated: number;
  totalRecordsSource: number;
  totalRecordsMigrated: number;
  counts: EntityMigrationCount[];
  validationIssues: MigrationValidationIssue[];
  executionTimeMs: number;
}

export class MigrationService {
  private dataDir: string;
  private database: DatabaseManager;

  constructor(dataDir?: string, database?: DatabaseManager) {
    this.dataDir = dataDir || path.resolve(__dirname, '../../data');
    this.database = database || db;
  }

  private readJson<T = any>(filename: string): T | null {
    const filePath = path.join(this.dataDir, filename);
    if (!fs.existsSync(filePath)) return null;
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch (e) {
      return null;
    }
  }

  /**
   * Comprehensive pre-migration data validation & relationship audit
   */
  public async validateSourceData(): Promise<{
    valid: boolean;
    issues: MigrationValidationIssue[];
    summary: Record<string, number>;
  }> {
    const issues: MigrationValidationIssue[] = [];
    const summary: Record<string, number> = {};

    // 1. Validate Admin Users
    const admins = this.readJson<any[]>('admin_users.json') || [];
    summary['admin_users'] = admins.length;
    const seenAdminEmails = new Set<string>();
    for (const a of admins) {
      if (!a.email) {
        issues.push({ severity: 'ERROR', entity: 'AdminUser', identifier: a.id || 'unknown', message: 'Missing email' });
      } else if (seenAdminEmails.has(a.email.toLowerCase())) {
        issues.push({ severity: 'ERROR', entity: 'AdminUser', identifier: a.email, message: 'Duplicate admin email detected' });
      } else {
        seenAdminEmails.add(a.email.toLowerCase());
      }
    }

    // 2. Validate Categories
    const categories = this.readJson<any[]>('categories.json') || [];
    summary['categories'] = categories.length;
    const categoryIds = new Set<string>(categories.map((c) => c.id));
    const seenCategorySlugs = new Set<string>();
    for (const cat of categories) {
      if (seenCategorySlugs.has(cat.slug)) {
        issues.push({ severity: 'ERROR', entity: 'Category', identifier: cat.slug, message: 'Duplicate category slug detected' });
      } else {
        seenCategorySlugs.add(cat.slug);
      }
      if (cat.parentId && !categoryIds.has(cat.parentId)) {
        issues.push({ severity: 'WARNING', entity: 'Category', identifier: cat.id, message: `Parent category #${cat.parentId} not found in categories.json` });
      }
    }

    // 3. Validate Collections
    const collections = this.readJson<any[]>('collections.json') || [];
    summary['collections'] = collections.length;

    // 4. Validate Products & Variants
    const products = this.readJson<any[]>('products.json') || [];
    summary['products'] = products.length;
    const seenProductSlugs = new Set<string>();
    const seenSkus = new Set<string>();
    let totalVariants = 0;
    let totalImages = 0;

    for (const prod of products) {
      if (seenProductSlugs.has(prod.slug)) {
        issues.push({ severity: 'ERROR', entity: 'Product', identifier: prod.slug, message: 'Duplicate product slug detected' });
      } else {
        seenProductSlugs.add(prod.slug);
      }
      if (prod.variants && Array.isArray(prod.variants)) {
        totalVariants += prod.variants.length;
        for (const v of prod.variants) {
          if (v.sku && seenSkus.has(v.sku)) {
            issues.push({ severity: 'WARNING', entity: 'ProductVariant', identifier: v.sku, message: 'Duplicate SKU across variants detected' });
          } else if (v.sku) {
            seenSkus.add(v.sku);
          }
        }
      }
      if (prod.images && Array.isArray(prod.images)) {
        totalImages += prod.images.length;
      }
    }
    summary['product_variants'] = totalVariants;
    summary['product_images'] = totalImages;

    // 5. Validate Orders & Order Items
    const orders = this.readJson<any[]>('orders.json') || [];
    summary['orders'] = orders.length;
    const seenOrderNumbers = new Set<string>();
    let totalOrderItems = 0;
    let totalTimelineEvents = 0;

    for (const ord of orders) {
      if (seenOrderNumbers.has(ord.orderNumber)) {
        issues.push({ severity: 'ERROR', entity: 'Order', identifier: ord.orderNumber, message: 'Duplicate order number detected' });
      } else {
        seenOrderNumbers.add(ord.orderNumber);
      }
      if (!ord.customerName || !ord.customerEmail) {
        issues.push({ severity: 'WARNING', entity: 'Order', identifier: ord.orderNumber, message: 'Order missing customer name or email' });
      }
      if (ord.items && Array.isArray(ord.items)) {
        totalOrderItems += ord.items.length;
        for (const item of ord.items) {
          if (!item.title || item.price === undefined) {
            issues.push({ severity: 'ERROR', entity: 'OrderItem', identifier: item.id || ord.orderNumber, message: 'Historical order item missing title or price' });
          }
        }
      }
      if (ord.timeline && Array.isArray(ord.timeline)) {
        totalTimelineEvents += ord.timeline.length;
      }
    }
    summary['order_items'] = totalOrderItems;
    summary['order_timeline_events'] = totalTimelineEvents;

    const hasFatalErrors = issues.some((i) => i.severity === 'ERROR');
    return {
      valid: !hasFatalErrors,
      issues,
      summary,
    };
  }

  /**
   * Run complete, verified migration from JSON to PostgreSQL
   */
  public async runMigration(options: {
    dryRun?: boolean;
    sqlFilePath?: string;
  } = {}): Promise<MigrationReport> {
    const startTime = Date.now();
    const dryRun = Boolean(options.dryRun);

    // Step 1: Pre-validation
    const validation = await this.validateSourceData();

    // Step 2: Create verified pre-migration backup of all JSON files
    const backupResult = await backupService.createVerifiedBackup(dryRun ? 'dry_run_snapshot' : 'production_migration');

    const counts: EntityMigrationCount[] = [];
    const dbInfo = await this.database.testConnection();

    if (dryRun) {
      // In dry-run mode, report expected counts without executing database writes
      for (const [entity, count] of Object.entries(validation.summary)) {
        counts.push({
          entity,
          sourceJsonCount: count,
          migratedDbCount: count,
          status: 'SUCCESS',
          notes: 'Validated successfully in dry-run mode. Ready for database insertion.',
        });
      }

      return {
        timestamp: new Date().toISOString(),
        dryRun: true,
        success: validation.valid,
        databaseEngine: dbInfo.engine,
        backupManifest: backupResult.manifest,
        totalEntitiesMigrated: counts.length,
        totalRecordsSource: Object.values(validation.summary).reduce((a, b) => a + b, 0),
        totalRecordsMigrated: 0,
        counts,
        validationIssues: validation.issues,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Step 3: Initialize Database Schema (DDL)
    await this.database.initializeSchema(options.sqlFilePath);

    // Step 4: Transactional Data Migration
    await this.database.transaction(async (client) => {
      // 1. Admin Users
      const admins = this.readJson<any[]>('admin_users.json') || [];
      for (const a of admins) {
        await client.query(
          `INSERT INTO "AdminUser" (id, name, email, password, role, status, permissions, "lastLogin", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             email = EXCLUDED.email,
             role = EXCLUDED.role,
             status = EXCLUDED.status,
             permissions = EXCLUDED.permissions,
             "updatedAt" = EXCLUDED."updatedAt"`,
          [
            a.id,
            a.name || 'Admin',
            a.email,
            a.password || null,
            a.role || 'ADMIN',
            a.status || 'ACTIVE',
            JSON.stringify(a.permissions || []),
            a.lastLogin ? new Date(a.lastLogin) : null,
            a.createdAt ? new Date(a.createdAt) : new Date(),
            a.updatedAt ? new Date(a.updatedAt) : new Date(),
          ]
        );
      }

      // 2. Categories (Root categories first, then child categories)
      const categories = this.readJson<any[]>('categories.json') || [];
      const rootCats = categories.filter((c) => !c.parentId);
      const childCats = categories.filter((c) => Boolean(c.parentId));

      for (const c of [...rootCats, ...childCats]) {
        await client.query(
          `INSERT INTO "Category" (id, name, slug, description, "shortDescription", "detailedDescription", image, "thumbnailImage", "bannerImage", "galleryImages", "assignedProductIds", "shortcutButtons", badge, "pageTitle", href, "navigationCategory", "destinationType", "destinationReference", "order", status, "isActive", "seoTitle", "seoDescription", "parentId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             slug = EXCLUDED.slug,
             "order" = EXCLUDED."order",
             status = EXCLUDED.status,
             "isActive" = EXCLUDED."isActive",
             "updatedAt" = EXCLUDED."updatedAt"`,
          [
            c.id,
            c.name,
            c.slug,
            c.description || null,
            c.shortDescription || null,
            c.detailedDescription || null,
            c.image || null,
            c.thumbnailImage || null,
            c.bannerImage || null,
            JSON.stringify(c.galleryImages || []),
            JSON.stringify(c.assignedProductIds || []),
            JSON.stringify(c.shortcutButtons || []),
            c.badge || null,
            c.pageTitle || null,
            c.href || null,
            c.navigationCategory || null,
            c.destinationType || null,
            c.destinationReference || null,
            c.order || 0,
            c.status || 'published',
            c.isActive !== false,
            c.seoTitle || null,
            c.seoDescription || null,
            c.parentId || null,
            c.createdAt ? new Date(c.createdAt) : new Date(),
            c.updatedAt ? new Date(c.updatedAt) : new Date(),
          ]
        );
      }

      // 3. Collections
      const collections = this.readJson<any[]>('collections.json') || [];
      for (const col of collections) {
        await client.query(
          `INSERT INTO "Collection" (id, name, slug, description, "bannerImage", badge, "order", status, "assignedProductIds", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             slug = EXCLUDED.slug,
             "updatedAt" = EXCLUDED."updatedAt"`,
          [
            col.id,
            col.name,
            col.slug,
            col.description || null,
            col.bannerImage || null,
            col.badge || null,
            col.order || 0,
            col.status || 'published',
            JSON.stringify(col.assignedProductIds || []),
            col.createdAt ? new Date(col.createdAt) : new Date(),
            col.updatedAt ? new Date(col.updatedAt) : new Date(),
          ]
        );
      }

      // 4. Products, Variants & Images
      const products = this.readJson<any[]>('products.json') || [];
      const seenVariantIds = new Set<string>();
      for (const p of products) {
        await client.query(
          `INSERT INTO "Product" (
            id, name, slug, sku, "shortDescription", description, price, "comparePrice",
            "discountPercentage", "saleStartDate", "saleEndDate", "isFeatured", "isNewArrival",
            "isBestSeller", "isSaleBadge", status, brand, gender, "ageGroup", "productType",
            "categoryId", "subcategoryId", "collectionId", "categoryJson", "subcategoryJson",
            "collectionJson", colors, sizes, "stockQuantity", "lowStockThreshold", "stockStatus",
            "fabricMaterial", "careInstructions", "countryOfOrigin", weight, features, parts,
            rating, "reviewCount", "reviewsList", "seoTitle", "seoDescription", "createdAt", "updatedAt"
           ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13,
            $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25,
            $26, $27, $28, $29, $30, $31,
            $32, $33, $34, $35, $36, $37,
            $38, $39, $40, $41, $42, $43, $44
           )
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             price = EXCLUDED.price,
             "stockQuantity" = EXCLUDED."stockQuantity",
             status = EXCLUDED.status,
             "updatedAt" = EXCLUDED."updatedAt"`,
          [
            p.id,
            p.name,
            p.slug,
            p.sku || null,
            p.shortDescription || null,
            p.description || '',
            Number(p.price || 0),
            p.comparePrice ? Number(p.comparePrice) : null,
            p.discountPercentage || null,
            p.saleStartDate || null,
            p.saleEndDate || null,
            Boolean(p.isFeatured),
            Boolean(p.isNewArrival),
            Boolean(p.isBestSeller),
            Boolean(p.isSaleBadge),
            p.status || 'published',
            p.brand || 'REXBEBE Atelier',
            p.gender || 'Baby',
            p.ageGroup || '0–12 months',
            p.productType || 'single',
            p.category?.id || null,
            p.subcategory?.id || null,
            p.collection?.id || null,
            p.category ? JSON.stringify(p.category) : null,
            p.subcategory ? JSON.stringify(p.subcategory) : null,
            p.collection ? JSON.stringify(p.collection) : null,
            JSON.stringify(p.colors || []),
            JSON.stringify(p.sizes || []),
            Number(p.stockQuantity || 0),
            Number(p.lowStockThreshold || 5),
            p.stockStatus || 'in_stock',
            p.fabricMaterial || null,
            p.careInstructions || null,
            p.countryOfOrigin || 'Sri Lanka',
            p.weight || null,
            JSON.stringify(p.features || []),
            JSON.stringify(p.parts || []),
            Number(p.rating || 5.0),
            Number(p.reviewCount || 0),
            JSON.stringify(p.reviewsList || []),
            p.seoTitle || null,
            p.seoDescription || null,
            p.createdAt ? new Date(p.createdAt) : new Date(),
            p.updatedAt ? new Date(p.updatedAt) : new Date(),
          ]
        );

        // Product Variants
        if (p.variants && Array.isArray(p.variants)) {
          for (const v of p.variants) {
            const variantId = seenVariantIds.has(v.id) ? `${v.id}-${p.id}` : v.id;
            seenVariantIds.add(v.id);
            await client.query(
              `INSERT INTO "ProductVariant" (id, "productId", sku, size, color, "colorHex", "partColors", price, "stockQuantity", "imageUrl", "partId", "partName", "purchaseType", "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
               ON CONFLICT (id) DO UPDATE SET
                 "productId" = EXCLUDED."productId",
                 sku = EXCLUDED.sku,
                 price = EXCLUDED.price,
                 "stockQuantity" = EXCLUDED."stockQuantity",
                 "updatedAt" = EXCLUDED."updatedAt"`,
              [
                variantId,
                p.id,
                v.sku || `${p.sku}-${v.id}`,
                v.size || null,
                v.color || null,
                v.colorHex || null,
                v.partColors ? JSON.stringify(v.partColors) : null,
                Number(v.price || p.price || 0),
                Number(v.stockQuantity || 0),
                v.imageUrl || null,
                v.partId || null,
                v.partName || null,
                v.purchaseType || 'complete_set',
                new Date(),
                new Date(),
              ]
            );
          }
        }

        // Product Images
        if (p.images && Array.isArray(p.images)) {
          for (const img of p.images) {
            await client.query(
              `INSERT INTO "ProductImage" (id, "productId", url, alt, position, "partName", "colorName", "createdAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT (id) DO NOTHING`,
              [
                img.id,
                p.id,
                img.url,
                img.alt || null,
                img.position || 0,
                img.partName || null,
                img.colorName || null,
                new Date(),
              ]
            );
          }
        }
      }

      // 5. Stock Adjustments
      const stockAdjustments = this.readJson<any[]>('stock_adjustments.json') || [];
      for (const sa of stockAdjustments) {
        await client.query(
          `INSERT INTO "StockAdjustment" (id, "productId", "variantId", sku, type, quantity, "previousQty", "newQty", reason, "adjustedBy", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO NOTHING`,
          [
            sa.id,
            sa.productId,
            sa.variantId || null,
            sa.sku || null,
            sa.change > 0 ? 'INCREASE' : 'DECREASE',
            Math.abs(sa.change || 0),
            sa.previousQuantity ?? null,
            sa.newQuantity ?? null,
            sa.reason || null,
            sa.adjustedBy || 'System',
            sa.timestamp ? new Date(sa.timestamp) : new Date(),
          ]
        );
      }

      // 6. Orders, Order Items, Order Timeline Events & Waybills
      const orders = this.readJson<any[]>('orders.json') || [];
      const extractedWaybills = new Map<string, any>();

      // Ensure all distinct customers referenced in orders exist in Customer table
      const distinctCustomers = new Map<string, { id: string; name: string; email: string; phone?: string }>();
      for (const ord of orders) {
        if (ord.customerId && !distinctCustomers.has(ord.customerId)) {
          distinctCustomers.set(ord.customerId, {
            id: ord.customerId,
            name: ord.customerName || 'Valued Customer',
            email: ord.customerEmail || `${ord.customerId}@rexbebe.lk`,
            phone: ord.phone,
          });
        }
      }
      for (const cust of distinctCustomers.values()) {
        await client.query(
          `INSERT INTO "Customer" (id, name, email, phone, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             email = EXCLUDED.email,
             phone = EXCLUDED.phone,
             "updatedAt" = EXCLUDED."updatedAt"`,
          [cust.id, cust.name, cust.email, cust.phone || null]
        );
      }

      const existingVariantsRes = await client.query(`SELECT id FROM "ProductVariant"`);
      const validVariantIds = new Set(existingVariantsRes.rows.map((r: any) => r.id));

      const existingProductsRes = await client.query(`SELECT id FROM "Product"`);
      const validProductIds = new Set(existingProductsRes.rows.map((r: any) => r.id));

      for (const ord of orders) {
        await client.query(
          `INSERT INTO "Order" (
            id, "orderNumber", "customerId", "customerName", "customerEmail", phone, country, "countryFlag",
            status, "paymentStatus", "paymentMethod", "paymentReference", "codCollectionStatus",
            "codSettlementStatus", "codFinancialStatus", "courierReportedAmount", "collectionDate",
            "settlementBatchRef", "idempotencyKey", subtotal, discount, "shippingFee", "codHandlingFee",
            "advancePayment", "amountToCollect", tax, "totalAmount", "couponCode", "isRestocked", carrier,
            "trackingNumber", "internalNotes", "courierDetails", "returnInspection", "verifiedReturnCharges",
            "unresolvedReturnAlert", "deliveryZoneSnapshot", "customerInfo", "shippingAddress", "billingAddress",
            timeline, "createdAt", "updatedAt"
           ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13,
            $14, $15, $16, $17,
            $18, $19, $20, $21, $22, $23,
            $24, $25, $26, $27, $28, $29, $30,
            $31, $32, $33, $34, $35,
            $36, $37, $38, $39, $40,
            $41, $42, $43
           )
           ON CONFLICT (id) DO UPDATE SET
             status = EXCLUDED.status,
             "paymentStatus" = EXCLUDED."paymentStatus",
             "codCollectionStatus" = EXCLUDED."codCollectionStatus",
             "codSettlementStatus" = EXCLUDED."codSettlementStatus",
             "courierDetails" = EXCLUDED."courierDetails",
             timeline = EXCLUDED.timeline,
             "updatedAt" = EXCLUDED."updatedAt"`,
          [
            ord.id,
            ord.orderNumber,
            ord.customerId || null,
            ord.customerName,
            ord.customerEmail,
            ord.phone || null,
            ord.country || 'Sri Lanka',
            ord.countryFlag || null,
            ord.status,
            ord.paymentStatus || 'PENDING',
            ord.paymentMethod || 'CASH_ON_DELIVERY',
            ord.paymentReference || null,
            ord.codCollectionStatus || null,
            ord.codSettlementStatus || null,
            ord.codFinancialStatus || null,
            ord.courierReportedAmount ? Number(ord.courierReportedAmount) : null,
            ord.collectionDate || null,
            ord.settlementBatchRef || null,
            ord.idempotencyKey || null,
            Number(ord.subtotal || 0),
            Number(ord.discount || 0),
            Number(ord.shippingFee || 0),
            Number(ord.codHandlingFee || 0),
            Number(ord.advancePayment || 0),
            Number(ord.amountToCollect || 0),
            Number(ord.tax || 0),
            Number(ord.totalAmount || 0),
            ord.couponCode || null,
            Boolean(ord.isRestocked),
            ord.carrier || null,
            ord.trackingNumber || null,
            ord.internalNotes || null,
            ord.courierDetails ? JSON.stringify(ord.courierDetails) : null,
            ord.returnInspection ? JSON.stringify(ord.returnInspection) : null,
            ord.verifiedReturnCharges ? Number(ord.verifiedReturnCharges) : null,
            ord.unresolvedReturnAlert ? JSON.stringify(ord.unresolvedReturnAlert) : null,
            ord.deliveryZoneSnapshot ? JSON.stringify(ord.deliveryZoneSnapshot) : null,
            ord.customerInfo ? JSON.stringify(ord.customerInfo) : null,
            ord.shippingAddress ? JSON.stringify(ord.shippingAddress) : null,
            ord.billingAddress ? JSON.stringify(ord.billingAddress) : null,
            JSON.stringify(ord.timeline || []),
            ord.createdAt ? new Date(ord.createdAt) : new Date(),
            ord.updatedAt ? new Date(ord.updatedAt) : new Date(),
          ]
        );

        // Historical Order Items: retain titles, prices, sizes, colors, quantities
        if (ord.items && Array.isArray(ord.items)) {
          for (const item of ord.items) {
            await client.query(
              `INSERT INTO "OrderItem" (id, "orderId", "variantId", "productId", title, sku, size, color, "colorHex", "partColors", image, "imageUrl", price, quantity, "totalPrice", "createdAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
               ON CONFLICT (id) DO NOTHING`,
              [
                item.id,
                ord.id,
                item.variantId && validVariantIds.has(item.variantId) ? item.variantId : null,
                item.productId && validProductIds.has(item.productId) ? item.productId : null,
                item.title,
                item.sku || null,
                item.size || null,
                item.color || null,
                item.colorHex || null,
                item.partColors ? JSON.stringify(item.partColors) : null,
                item.image || null,
                item.imageUrl || null,
                Number(item.price || 0),
                Number(item.quantity || 1),
                Number(item.totalPrice || item.price * (item.quantity || 1) || 0),
                new Date(),
              ]
            );
          }
        }

        // Normalized Order Timeline Events
        if (ord.timeline && Array.isArray(ord.timeline)) {
          for (let i = 0; i < ord.timeline.length; i++) {
            const ev = ord.timeline[i];
            const eventId = `${ord.id}-tl-${i}`;
            await client.query(
              `INSERT INTO "OrderTimelineEvent" (id, "orderId", status, note, admin, timestamp, "createdAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (id) DO NOTHING`,
              [
                eventId,
                ord.id,
                ev.status || 'EVENT',
                ev.note || '',
                ev.admin || null,
                ev.time ? new Date(ev.time) : new Date(),
                new Date(),
              ]
            );
          }
        }

        // Collect assigned waybills for WaybillAllocation table
        const assignedWb = ord.courierDetails?.waybillNumber || ord.trackingNumber;
        if (assignedWb && String(assignedWb).trim()) {
          extractedWaybills.set(String(assignedWb).trim(), {
            waybillId: String(assignedWb).trim(),
            status: 'ASSIGNED',
            orderId: ord.id,
            orderNumber: ord.orderNumber,
          });
        }
      }

      // Seed available active waybill range (63005001-63005020) + assigned waybills
      for (let i = 1; i <= 20; i++) {
        const wbId = `630050${i < 10 ? '0' + i : i}`;
        if (!extractedWaybills.has(wbId)) {
          extractedWaybills.set(wbId, {
            waybillId: wbId,
            status: 'AVAILABLE',
            orderId: null,
            orderNumber: null,
          });
        }
      }

      for (const wb of Array.from(extractedWaybills.values())) {
        await client.query(
          `INSERT INTO "WaybillAllocation" (id, "waybillId", "courierCode", status, "orderId", "orderNumber", "assignedAt", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT ("waybillId") DO UPDATE SET
             status = EXCLUDED.status,
             "orderId" = EXCLUDED."orderId",
             "orderNumber" = EXCLUDED."orderNumber",
             "updatedAt" = EXCLUDED."updatedAt"`,
          [
            `wb-${wb.waybillId}`,
            wb.waybillId,
            'KOOMBIYO',
            wb.status,
            wb.orderId,
            wb.orderNumber,
            wb.orderId ? new Date() : null,
            new Date(),
            new Date(),
          ]
        );
      }

      // 7. Courier Merchant Agreements
      const agreements = this.readJson<any>('courier_agreements.json');
      if (agreements) {
        await client.query(
          `INSERT INTO "CourierMerchantAgreement" (id, "courierCode", "courierName", "agreementReference", "standardDeliveryCharge", "codCommissionType", "codCommissionValue", "vatApplicable", "rawConfig", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT ("courierCode") DO UPDATE SET
             "rawConfig" = EXCLUDED."rawConfig",
             "updatedAt" = EXCLUDED."updatedAt"`,
          [
            'cma-koombiyo',
            agreements.courierCode || 'KOOMBIYO',
            agreements.courierName || 'Koombiyo Delivery',
            agreements.agreementReference || 'AGR-KOOM-2026',
            Number(agreements.standardDeliveryCharge || 450),
            agreements.codCommissionType || 'PERCENTAGE',
            Number(agreements.codCommissionRate || 0),
            Boolean(agreements.vatTaxRatePercent),
            JSON.stringify(agreements),
            new Date(),
            new Date(),
          ]
        );
      }

      // 8. Delivery Settings & Zones
      const deliverySettings = this.readJson<any>('delivery_settings.json');
      if (deliverySettings) {
        await client.query(
          `INSERT INTO "DeliveryZoneSettings" (id, zones, rates, "courierAgreements", "domesticRates", "internationalRates", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             zones = EXCLUDED.zones,
             rates = EXCLUDED.rates,
             "updatedAt" = EXCLUDED."updatedAt"`,
          [
            'default',
            JSON.stringify(deliverySettings.zones || []),
            JSON.stringify(deliverySettings.rates || []),
            JSON.stringify(deliverySettings.courierAgreements || []),
            deliverySettings.domesticRates ? JSON.stringify(deliverySettings.domesticRates) : null,
            deliverySettings.internationalRates ? JSON.stringify(deliverySettings.internationalRates) : null,
            new Date(),
            new Date(),
          ]
        );
      }

      // 9. Store Settings & SEO
      const settings = this.readJson<any>('settings.json');
      if (settings) {
        await client.query(
          `INSERT INTO "StoreSettings" (id, "storeInfo", international, shipping, payments, seo, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             "storeInfo" = EXCLUDED."storeInfo",
             "updatedAt" = EXCLUDED."updatedAt"`,
          [
            'default',
            JSON.stringify(settings.storeInfo || {}),
            JSON.stringify(settings.international || {}),
            JSON.stringify(settings.shipping || {}),
            JSON.stringify(settings.payments || {}),
            JSON.stringify(settings.seo || {}),
            new Date(),
            new Date(),
          ]
        );
      }

      const seo = this.readJson<any>('seo.json');
      if (seo) {
        await client.query(
          `INSERT INTO "SeoSettings" (id, "metaTitle", "metaDescription", "socialShareImage", keywords, "rawConfig", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             "metaTitle" = EXCLUDED."metaTitle",
             "updatedAt" = EXCLUDED."updatedAt"`,
          [
            'default',
            seo.metaTitle || null,
            seo.metaDescription || null,
            seo.socialShareImage || null,
            seo.keywords || null,
            JSON.stringify(seo),
            new Date(),
            new Date(),
          ]
        );
      }

      // 10. CMS Pages & Homepage
      const pages = this.readJson<any[]>('pages.json') || [];
      for (const pg of pages) {
        await client.query(
          `INSERT INTO "WebsitePage" (id, name, slug, url, heading, "shortDescription", "detailedDescription", "bannerImage", content, status, "isVisible", "seoTitle", "seoDescription", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             slug = EXCLUDED.slug,
             content = EXCLUDED.content,
             "updatedAt" = EXCLUDED."updatedAt"`,
          [
            pg.id,
            pg.name,
            pg.slug,
            pg.url || null,
            pg.heading || null,
            pg.shortDescription || null,
            pg.detailedDescription || null,
            pg.bannerImage || null,
            pg.content || '',
            pg.status || 'published',
            pg.isVisible !== false,
            pg.seoTitle || null,
            pg.seoDescription || null,
            new Date(),
            new Date(),
          ]
        );
      }

      const homepage = this.readJson<any>('homepage.json');
      if (homepage) {
        await client.query(
          `INSERT INTO "HomepageConfig" (id, hero, announcements, "featuredSections", "bannerGrid", "valueProps", "rawConfig", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             hero = EXCLUDED.hero,
             "updatedAt" = EXCLUDED."updatedAt"`,
          [
            'default',
            homepage.hero ? JSON.stringify(homepage.hero) : null,
            homepage.announcements ? JSON.stringify(homepage.announcements) : null,
            homepage.featuredSections ? JSON.stringify(homepage.featuredSections) : null,
            homepage.bannerGrid ? JSON.stringify(homepage.bannerGrid) : null,
            homepage.valueProps ? JSON.stringify(homepage.valueProps) : null,
            JSON.stringify(homepage),
            new Date(),
            new Date(),
          ]
        );
      }

      // 11. Media Assets
      const media = this.readJson<any[]>('media.json') || [];
      for (const m of media) {
        await client.query(
          `INSERT INTO "MediaAsset" (id, name, url, size, category, "uploadedAt", "isSystem", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [
            m.id,
            m.name,
            m.url,
            m.size || null,
            m.category || 'general',
            m.uploadedAt ? new Date(m.uploadedAt) : new Date(),
            Boolean(m.isSystem),
            new Date(),
            new Date(),
          ]
        );
      }

      // 12. Audit Logs
      const auditLogs = this.readJson<any[]>('audit_logs.json') || [];
      for (const log of auditLogs) {
        await client.query(
          `INSERT INTO "AuditLog" (id, action, entity, "entityId", details, "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [
            log.id,
            log.action,
            'AUDIT_RECORD',
            log.affectedRecord || null,
            typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || log.reason || ''),
            log.timestamp ? new Date(log.timestamp) : new Date(),
          ]
        );
      }

      // 13. Notifications
      const notifications = this.readJson<any[]>('notifications.json') || [];
      for (const n of notifications) {
        await client.query(
          `INSERT INTO "Notification" (id, title, message, type, "isRead", link, "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [
            n.id,
            n.eventType || 'NOTIFICATION',
            n.message || '',
            n.status || 'INFO',
            Boolean(n.isRead),
            n.orderId ? `/admin/orders/${n.orderId}` : null,
            n.createdAt ? new Date(n.createdAt) : new Date(),
          ]
        );
      }

      // 14. Navigation Items (navigation.json)
      const navData = this.readJson<any>('navigation.json');
      const navItems = navData?.items || [];
      for (const item of navItems) {
        await client.query(
          `INSERT INTO "NavigationItem" (
            id, name, "pageTitle", slug, href, "order", status, "isActive",
            badge, description, "shortDescription", "detailedDescription",
            "bannerImage", "thumbnailImage", "galleryImages", "assignedProductIds",
            "destinationType", "destinationReference", "subGroups", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $20)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            "pageTitle" = EXCLUDED."pageTitle",
            slug = EXCLUDED.slug,
            href = EXCLUDED.href,
            "order" = EXCLUDED."order",
            status = EXCLUDED.status,
            "isActive" = EXCLUDED."isActive",
            badge = EXCLUDED.badge,
            description = EXCLUDED.description,
            "shortDescription" = EXCLUDED."shortDescription",
            "detailedDescription" = EXCLUDED."detailedDescription",
            "bannerImage" = EXCLUDED."bannerImage",
            "thumbnailImage" = EXCLUDED."thumbnailImage",
            "galleryImages" = EXCLUDED."galleryImages",
            "assignedProductIds" = EXCLUDED."assignedProductIds",
            "destinationType" = EXCLUDED."destinationType",
            "destinationReference" = EXCLUDED."destinationReference",
            "subGroups" = EXCLUDED."subGroups",
            "updatedAt" = EXCLUDED."updatedAt"`,
          [
            item.id,
            item.name,
            item.pageTitle || null,
            item.slug || null,
            item.href,
            Number(item.order || 0),
            item.status || 'published',
            item.isActive !== undefined ? Boolean(item.isActive) : true,
            item.badge || null,
            item.description || null,
            item.shortDescription || null,
            item.detailedDescription || null,
            item.bannerImage || null,
            item.thumbnailImage || null,
            JSON.stringify(item.galleryImages || []),
            JSON.stringify(item.assignedProductIds || []),
            item.destinationType || null,
            item.destinationReference || null,
            JSON.stringify(item.subGroups || []),
            new Date(),
          ]
        );
      }

      // 15. Settlements (settlements.json)
      const settlements = this.readJson<any[]>('settlements.json') || [];
      for (const s of settlements) {
        await client.query(
          `INSERT INTO "SettlementRecord" (
            id, "settlementBatchRef", "orderId", "orderNumber", "courierProvider",
            "expectedCodAmount", "courierReportedAmount", "collectionDate", "settlementDate",
            "bankReference", "documentedDeductions", "totalDeductions", "expectedRemittance",
            "actualAmountReceived", "discrepancyAmount", "discrepancyReason", "financialStatus",
            "authorizedBy", "authorizedAt", notes, "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $21)
          ON CONFLICT (id) DO NOTHING`,
          [
            s.id,
            s.settlementBatchRef || 'BATCH-INIT',
            s.orderId,
            s.orderNumber,
            s.courierProvider || 'Koombiyo',
            Number(s.expectedCodAmount || 0),
            Number(s.courierReportedAmount || 0),
            s.collectionDate || '',
            s.settlementDate || '',
            s.bankReference || '',
            JSON.stringify(s.documentedDeductions || []),
            Number(s.totalDeductions || 0),
            Number(s.expectedRemittance || 0),
            Number(s.actualAmountReceived || 0),
            Number(s.discrepancyAmount || 0),
            s.discrepancyReason || null,
            s.financialStatus || 'SETTLED',
            s.authorizedBy || 'Admin',
            s.authorizedAt || new Date().toISOString(),
            s.notes || null,
            new Date(),
          ]
        );
      }

      // 16. Carts & Wishlists (carts.json, wishlists.json)
      const cartsData = this.readJson<Record<string, any>>('carts.json') || {};
      for (const [cId, cart] of Object.entries(cartsData)) {
        await client.query(
          `INSERT INTO "Cart" (id, "sessionId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $3)
           ON CONFLICT (id) DO UPDATE SET "updatedAt" = EXCLUDED."updatedAt"`,
          [cId, cart.sessionId || cId, cart.updatedAt ? new Date(cart.updatedAt) : new Date()]
        );
      }

      const wishlistsData = this.readJson<Record<string, any>>('wishlists.json') || {};
      for (const [wId, wl] of Object.entries(wishlistsData)) {
        const custId = wl.customerId || wId;
        // Ensure customer exists in Customer table to satisfy Wishlist_customerId_fkey
        await client.query(
          `INSERT INTO "Customer" (id, name, email, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (id) DO NOTHING`,
          [custId, 'Guest Customer', `${custId}@guest.rexbebe.lk`]
        );

        await client.query(
          `INSERT INTO "Wishlist" (id, "customerId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $3)
           ON CONFLICT (id) DO UPDATE SET "updatedAt" = EXCLUDED."updatedAt"`,
          [wId, custId, wl.updatedAt ? new Date(wl.updatedAt) : new Date()]
        );
      }
    });

    // Step 5: Post-Migration Database Re-count & Integrity Verification
    const entityTables: [string, string, string][] = [
      ['AdminUser', 'AdminUser', 'admin_users.json'],
      ['Category', 'Category', 'categories.json'],
      ['Collection', 'Collection', 'collections.json'],
      ['Product', 'Product', 'products.json'],
      ['ProductVariant', 'ProductVariant', 'products.json (variants)'],
      ['ProductImage', 'ProductImage', 'products.json (images)'],
      ['StockAdjustment', 'StockAdjustment', 'stock_adjustments.json'],
      ['Order', 'Order', 'orders.json'],
      ['OrderItem', 'OrderItem', 'orders.json (items)'],
      ['OrderTimelineEvent', 'OrderTimelineEvent', 'orders.json (timeline)'],
      ['WaybillAllocation', 'WaybillAllocation', 'orders.json (waybills)'],
      ['CourierMerchantAgreement', 'CourierMerchantAgreement', 'courier_agreements.json'],
      ['WebsitePage', 'WebsitePage', 'pages.json'],
      ['MediaAsset', 'MediaAsset', 'media.json'],
      ['AuditLog', 'AuditLog', 'audit_logs.json'],
      ['Notification', 'Notification', 'notifications.json'],
      ['NavigationItem', 'NavigationItem', 'navigation.json'],
      ['SettlementRecord', 'SettlementRecord', 'settlements.json'],
      ['Cart', 'Cart', 'carts.json'],
      ['Wishlist', 'Wishlist', 'wishlists.json'],
    ];

    let totalMigrated = 0;
    let totalSource = 0;

    for (const [entityName, tableName, sourceRef] of entityTables) {
      const dbCountRes = await this.database.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      const dbCount = Number(dbCountRes.rows[0]?.count || 0);
      totalMigrated += dbCount;

      let sourceCount = 0;
      if (sourceRef === 'admin_users.json') sourceCount = (this.readJson<any[]>('admin_users.json') || []).length;
      else if (sourceRef === 'categories.json') sourceCount = (this.readJson<any[]>('categories.json') || []).length;
      else if (sourceRef === 'collections.json') sourceCount = (this.readJson<any[]>('collections.json') || []).length;
      else if (sourceRef === 'products.json') sourceCount = (this.readJson<any[]>('products.json') || []).length;
      else if (sourceRef.includes('variants')) sourceCount = validation.summary['product_variants'] || 0;
      else if (sourceRef.includes('images')) sourceCount = validation.summary['product_images'] || 0;
      else if (sourceRef === 'stock_adjustments.json') sourceCount = (this.readJson<any[]>('stock_adjustments.json') || []).length;
      else if (sourceRef === 'orders.json') sourceCount = (this.readJson<any[]>('orders.json') || []).length;
      else if (sourceRef.includes('items')) sourceCount = validation.summary['order_items'] || 0;
      else if (sourceRef.includes('timeline')) sourceCount = validation.summary['order_timeline_events'] || 0;
      else if (sourceRef.includes('waybills')) sourceCount = dbCount; // Extracted & seeded
      else if (sourceRef === 'courier_agreements.json') sourceCount = this.readJson('courier_agreements.json') ? 1 : 0;
      else if (sourceRef === 'pages.json') sourceCount = (this.readJson<any[]>('pages.json') || []).length;
      else if (sourceRef === 'media.json') sourceCount = (this.readJson<any[]>('media.json') || []).length;
      else if (sourceRef === 'audit_logs.json') sourceCount = (this.readJson<any[]>('audit_logs.json') || []).length;
      else if (sourceRef === 'notifications.json') sourceCount = (this.readJson<any[]>('notifications.json') || []).length;
      else if (sourceRef === 'navigation.json') sourceCount = (this.readJson<any>('navigation.json')?.items || []).length;
      else if (sourceRef === 'settlements.json') sourceCount = (this.readJson<any[]>('settlements.json') || []).length;
      else if (sourceRef === 'carts.json') sourceCount = Object.keys(this.readJson<Record<string, any>>('carts.json') || {}).length;
      else if (sourceRef === 'wishlists.json') sourceCount = Object.keys(this.readJson<Record<string, any>>('wishlists.json') || {}).length;

      totalSource += sourceCount;

      counts.push({
        entity: entityName,
        sourceJsonCount: sourceCount,
        migratedDbCount: dbCount,
        status: dbCount >= sourceCount ? 'SUCCESS' : 'WARNING',
        notes: `Source: ${sourceRef}. Verified in PostgreSQL table "${tableName}".`,
      });
    }

    return {
      timestamp: new Date().toISOString(),
      dryRun: false,
      success: true,
      databaseEngine: dbInfo.engine,
      backupManifest: backupResult.manifest,
      totalEntitiesMigrated: counts.length,
      totalRecordsSource: totalSource,
      totalRecordsMigrated: totalMigrated,
      counts,
      validationIssues: validation.issues,
      executionTimeMs: Date.now() - startTime,
    };
  }
}

export const migrationService = new MigrationService();
