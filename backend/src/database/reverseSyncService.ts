import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db, DatabaseManager } from '../config/database';

export interface ReverseSyncExportResult {
  exportDir: string;
  timestamp: string;
  exportedFiles: { filename: string; recordCount: number; sha256: string }[];
  success: boolean;
}

function safeParseJson<T = any>(value: any, fallback?: T): any {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback !== undefined ? fallback : value;
  }
}

export class ReverseSyncService {
  private database: DatabaseManager;
  private dataDir: string;

  constructor(database?: DatabaseManager, dataDir?: string) {
    this.database = database || db;
    this.dataDir = dataDir || path.resolve(__dirname, '../../data');
  }

  private sha256(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Safely export all PostgreSQL tables back to exact JSON format in a dedicated export directory.
   * NEVER overwrites the original 23 data files unless overwriteActiveData is explicitly set to true.
   */
  public async exportPostgresToJson(options: {
    targetDir?: string;
    overwriteActiveData?: boolean;
  } = {}): Promise<ReverseSyncExportResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportDir =
      options.targetDir ||
      path.join(this.dataDir, 'backups', `rollback_export_${timestamp}`);

    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const exportedFiles: { filename: string; recordCount: number; sha256: string }[] = [];

    const saveFile = (filename: string, data: any) => {
      const content = JSON.stringify(data, null, 2);
      const filePath = path.join(exportDir, filename);
      fs.writeFileSync(filePath, content, 'utf-8');

      if (options.overwriteActiveData) {
        fs.writeFileSync(path.join(this.dataDir, filename), content, 'utf-8');
      }

      exportedFiles.push({
        filename,
        recordCount: Array.isArray(data) ? data.length : 1,
        sha256: this.sha256(content),
      });
    };

    // 1. Categories
    const catsRes = await this.database.query(`SELECT * FROM "Category" ORDER BY "order" ASC, "name" ASC`);
    const categories = catsRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description || undefined,
      shortDescription: r.shortDescription || undefined,
      detailedDescription: r.detailedDescription || undefined,
      image: r.image || undefined,
      thumbnailImage: r.thumbnailImage || undefined,
      bannerImage: r.bannerImage || undefined,
      galleryImages: safeParseJson(r.galleryImages, []),
      assignedProductIds: safeParseJson(r.assignedProductIds, []),
      shortcutButtons: safeParseJson(r.shortcutButtons, []),
      badge: r.badge || undefined,
      pageTitle: r.pageTitle || undefined,
      href: r.href || undefined,
      navigationCategory: r.navigationCategory || undefined,
      destinationType: r.destinationType || undefined,
      destinationReference: r.destinationReference || undefined,
      order: Number(r.order || 0),
      status: r.status || 'published',
      isActive: Boolean(r.isActive),
      seoTitle: r.seoTitle || undefined,
      seoDescription: r.seoDescription || undefined,
      parentId: r.parentId || undefined,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    }));
    saveFile('categories.json', categories);

    // 2. Collections
    const colsRes = await this.database.query(`SELECT * FROM "Collection" ORDER BY "order" ASC`);
    const collections = colsRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description || undefined,
      bannerImage: r.bannerImage || undefined,
      badge: r.badge || undefined,
      order: Number(r.order || 0),
      status: r.status || 'published',
      assignedProductIds: safeParseJson(r.assignedProductIds, []),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    }));
    saveFile('collections.json', collections);

    // 3. Products (with variants and images)
    const prodsRes = await this.database.query(`SELECT * FROM "Product" ORDER BY "createdAt" ASC`);
    const variantsRes = await this.database.query(`SELECT * FROM "ProductVariant" ORDER BY id ASC`);
    const imagesRes = await this.database.query(`SELECT * FROM "ProductImage" ORDER BY position ASC`);

    const variantsByProd = new Map<string, any[]>();
    for (const v of variantsRes.rows) {
      if (!variantsByProd.has(v.productId)) variantsByProd.set(v.productId, []);
      variantsByProd.get(v.productId)!.push({
        id: v.id,
        sku: v.sku,
        size: v.size || undefined,
        color: v.color || undefined,
        colorHex: v.colorHex || undefined,
        partColors: safeParseJson(v.partColors, undefined),
        price: Number(v.price || 0),
        stockQuantity: Number(v.stockQuantity || 0),
        imageUrl: v.imageUrl || undefined,
        partId: v.partId || undefined,
        partName: v.partName || undefined,
        purchaseType: v.purchaseType || 'complete_set',
      });
    }

    const imagesByProd = new Map<string, any[]>();
    for (const img of imagesRes.rows) {
      if (!imagesByProd.has(img.productId)) imagesByProd.set(img.productId, []);
      imagesByProd.get(img.productId)!.push({
        id: img.id,
        url: img.url,
        alt: img.alt || '',
        position: Number(img.position || 0),
        partName: img.partName || undefined,
        colorName: img.colorName || undefined,
      });
    }

    const products = prodsRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      sku: r.sku || undefined,
      shortDescription: r.shortDescription || undefined,
      description: r.description || '',
      price: Number(r.price || 0),
      comparePrice: r.comparePrice ? Number(r.comparePrice) : undefined,
      discountPercentage: r.discountPercentage ? Number(r.discountPercentage) : undefined,
      saleStartDate: r.saleStartDate || undefined,
      saleEndDate: r.saleEndDate || undefined,
      isFeatured: Boolean(r.isFeatured),
      isNewArrival: Boolean(r.isNewArrival),
      isBestSeller: Boolean(r.isBestSeller),
      isSaleBadge: Boolean(r.isSaleBadge),
      status: r.status || 'published',
      brand: r.brand || 'REXBEBE Atelier',
      gender: r.gender || 'Baby',
      ageGroup: r.ageGroup || '0–12 months',
      productType: r.productType || 'single',
      categoryId: r.categoryId || undefined,
      subcategoryId: r.subcategoryId || undefined,
      collectionId: r.collectionId || undefined,
      category: safeParseJson(r.categoryJson, undefined),
      subcategory: safeParseJson(r.subcategoryJson, undefined),
      collection: safeParseJson(r.collectionJson, undefined),
      colors: safeParseJson(r.colors, []),
      sizes: safeParseJson(r.sizes, []),
      stockQuantity: Number(r.stockQuantity || 0),
      lowStockThreshold: Number(r.lowStockThreshold || 5),
      stockStatus: r.stockStatus || 'in_stock',
      fabricMaterial: r.fabricMaterial || undefined,
      careInstructions: r.careInstructions || undefined,
      countryOfOrigin: r.countryOfOrigin || 'Sri Lanka',
      weight: r.weight || undefined,
      features: safeParseJson(r.features, []),
      parts: safeParseJson(r.parts, undefined),
      rating: Number(r.rating || 5.0),
      reviewCount: Number(r.reviewCount || 0),
      reviewsList: safeParseJson(r.reviewsList, []),
      seoTitle: r.seoTitle || undefined,
      seoDescription: r.seoDescription || undefined,
      variants: variantsByProd.get(r.id) || [],
      images: imagesByProd.get(r.id) || [],
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    }));
    saveFile('products.json', products);

    // 4. Orders (with items and timeline)
    const ordersRes = await this.database.query(`SELECT * FROM "Order" ORDER BY "createdAt" ASC`);
    const itemsRes = await this.database.query(`SELECT * FROM "OrderItem" ORDER BY "id" ASC`);
    const eventsRes = await this.database.query(`SELECT * FROM "OrderTimelineEvent" ORDER BY "timestamp" ASC`);

    const itemsByOrder = new Map<string, any[]>();
    for (const it of itemsRes.rows) {
      if (!itemsByOrder.has(it.orderId)) itemsByOrder.set(it.orderId, []);
      itemsByOrder.get(it.orderId)!.push({
        id: it.id,
        orderId: it.orderId,
        variantId: it.variantId || undefined,
        productId: it.productId || undefined,
        title: it.title,
        sku: it.sku || undefined,
        size: it.size || undefined,
        color: it.color || undefined,
        colorHex: it.colorHex || undefined,
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
        totalPrice: Number(it.totalPrice || 0),
        image: it.image || undefined,
        imageUrl: it.imageUrl || undefined,
      });
    }

    const eventsByOrder = new Map<string, any[]>();
    for (const ev of eventsRes.rows) {
      if (!eventsByOrder.has(ev.orderId)) eventsByOrder.set(ev.orderId, []);
      eventsByOrder.get(ev.orderId)!.push({
        id: ev.id,
        status: ev.status,
        note: ev.note,
        admin: ev.admin || undefined,
        time: ev.timestamp ? new Date(ev.timestamp).toISOString() : new Date().toISOString(),
      });
    }

    const orders = ordersRes.rows.map((r) => ({
      id: r.id,
      orderNumber: r.orderNumber,
      customerId: r.customerId || undefined,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      phone: r.phone || undefined,
      country: r.country || 'Sri Lanka',
      countryFlag: r.countryFlag || undefined,
      status: r.status,
      paymentStatus: r.paymentStatus,
      paymentMethod: r.paymentMethod,
      paymentReference: r.paymentReference || undefined,
      codCollectionStatus: r.codCollectionStatus || undefined,
      codSettlementStatus: r.codSettlementStatus || undefined,
      codFinancialStatus: r.codFinancialStatus || undefined,
      courierReportedAmount: r.courierReportedAmount ? Number(r.courierReportedAmount) : undefined,
      collectionDate: r.collectionDate || undefined,
      idempotencyKey: r.idempotencyKey || undefined,
      subtotal: Number(r.subtotal || 0),
      discount: Number(r.discount || 0),
      shippingFee: Number(r.shippingFee || 0),
      codHandlingFee: Number(r.codHandlingFee || 0),
      advancePayment: Number(r.advancePayment || 0),
      amountToCollect: Number(r.amountToCollect || 0),
      tax: Number(r.tax || 0),
      totalAmount: Number(r.totalAmount || 0),
      couponCode: r.couponCode || undefined,
      isRestocked: Boolean(r.isRestocked),
      carrier: r.carrier || undefined,
      trackingNumber: r.trackingNumber || undefined,
      courierDetails: safeParseJson(r.courierDetails, {}),
      returnInspection: safeParseJson(r.returnInspection, undefined),
      verifiedReturnCharges: r.verifiedReturnCharges ? Number(r.verifiedReturnCharges) : undefined,
      unresolvedReturnAlert: safeParseJson(r.unresolvedReturnAlert, undefined),
      deliveryZoneSnapshot: safeParseJson(r.deliveryZoneSnapshot, undefined),
      shippingAddress: safeParseJson(r.shippingAddress, {}),
      billingAddress: safeParseJson(r.billingAddress, {}),
      items: itemsByOrder.get(r.id) || [],
      timeline: eventsByOrder.get(r.id) || safeParseJson(r.timeline, []),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    }));
    saveFile('orders.json', orders);

    // 5. Admin Users
    const adminsRes = await this.database.query(`SELECT * FROM "AdminUser" ORDER BY "createdAt" ASC`);
    saveFile('admin_users.json', adminsRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      status: r.status,
      permissions: safeParseJson(r.permissions, []),
      lastLogin: r.lastLogin ? new Date(r.lastLogin).toISOString() : null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    })));

    // 6. Navigation
    const navRes = await this.database.query(`SELECT * FROM "NavigationItem" ORDER BY "order" ASC`);
    saveFile('navigation.json', {
      items: navRes.rows.map((r) => ({
        id: r.id,
        name: r.name,
        pageTitle: r.pageTitle || undefined,
        slug: r.slug || undefined,
        href: r.href,
        order: Number(r.order || 0),
        status: r.status || 'published',
        isActive: Boolean(r.isActive),
        badge: r.badge || undefined,
        description: r.description || undefined,
        shortDescription: r.shortDescription || undefined,
        detailedDescription: r.detailedDescription || undefined,
        bannerImage: r.bannerImage || undefined,
        thumbnailImage: r.thumbnailImage || undefined,
        galleryImages: safeParseJson(r.galleryImages, []),
        assignedProductIds: safeParseJson(r.assignedProductIds, []),
        destinationType: r.destinationType || undefined,
        destinationReference: r.destinationReference || undefined,
        subGroups: safeParseJson(r.subGroups, []),
      })),
    });

    // 7. Website Pages
    const pagesRes = await this.database.query(`SELECT * FROM "WebsitePage" ORDER BY "slug" ASC`);
    saveFile('pages.json', pagesRes.rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      content: r.content,
      status: r.status || 'published',
      seoTitle: r.seoTitle || undefined,
      seoDescription: r.seoDescription || undefined,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    })));

    // 8. Media Assets
    const mediaRes = await this.database.query(`SELECT * FROM "MediaAsset" ORDER BY "createdAt" ASC`);
    saveFile('media.json', mediaRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      url: r.url,
      mimeType: r.mimeType || undefined,
      size: Number(r.size || 0),
      category: r.category || 'general',
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    })));

    // 9. Audit Logs
    const auditRes = await this.database.query(`SELECT * FROM "AuditLog" ORDER BY "createdAt" ASC`);
    saveFile('audit_logs.json', auditRes.rows.map((r) => ({
      id: r.id,
      timestamp: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      actingAdministrator: r.entity || 'System Automated Process',
      affectedRecord: r.entityId || 'N/A',
      action: r.action,
      details: safeParseJson(r.details, r.details || {}),
    })));

    // 10. Notifications
    const notifsRes = await this.database.query(`SELECT * FROM "Notification" ORDER BY "createdAt" ASC`);
    saveFile('notifications.json', notifsRes.rows.map((r) => ({
      id: r.id,
      orderId: r.link ? r.link.replace('/admin/orders/', '') : undefined,
      orderNumber: r.link ? r.link.replace('/admin/orders/', '') : undefined,
      eventType: r.type || 'NOTIFICATION',
      channel: 'SMS',
      recipient: 'Customer',
      subject: r.title,
      message: r.message,
      status: 'DELIVERED',
      confirmedSuccess: true,
      timestamp: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    })));

    // 11. Delivery Settings
    const delRes = await this.database.query(`SELECT * FROM "DeliveryZoneSettings" LIMIT 1`);
    if (delRes.rows.length > 0) {
      const r = delRes.rows[0];
      saveFile('delivery_settings.json', {
        defaultDeliveryFee: Number(r.defaultDeliveryFee || 450),
        freeDeliveryThreshold: Number(r.freeDeliveryThreshold || 25000),
        codHandlingFee: Number(r.codHandlingFee || 0),
        minCodAmount: Number(r.minCodAmount || 500),
        maxCodAmount: Number(r.maxCodAmount || 100000),
        returnFeeDefault: Number(r.returnFeeDefault || 350),
        customerDeliveryNotice: r.customerDeliveryNotice || '',
        rateDisclaimer: r.rateDisclaimer || '',
        unsupportedAddressPolicy: r.unsupportedAddressPolicy || 'REQUIRE_REVIEW',
        unsupportedAddressNotice: r.unsupportedAddressNotice || '',
        activeCouriers: safeParseJson(r.activeCouriers, []),
        districtRates: safeParseJson(r.districtRates, []),
        weightTiers: safeParseJson(r.weightTiers, []),
        deliveryZones: safeParseJson(r.deliveryZones, []),
      });
    }

    // 12. Singletons: StoreSettings, HomepageConfig, SeoSettings
    const storeRes = await this.database.query(`SELECT * FROM "StoreSettings" LIMIT 1`);
    if (storeRes.rows.length > 0) saveFile('settings.json', safeParseJson(storeRes.rows[0].data, {}));

    const homeRes = await this.database.query(`SELECT * FROM "HomepageConfig" LIMIT 1`);
    if (homeRes.rows.length > 0) saveFile('homepage.json', safeParseJson(homeRes.rows[0].data, {}));

    const seoRes = await this.database.query(`SELECT * FROM "SeoSettings" LIMIT 1`);
    if (seoRes.rows.length > 0) saveFile('seo.json', safeParseJson(seoRes.rows[0].data, {}));

    // 13. Other entities: Carts, Wishlists, Stock Adjustments, Agreements, Contact, Feedback, Settlements
    const cartsRes = await this.database.query(`SELECT * FROM "Cart"`);
    saveFile('carts.json', cartsRes.rows.map((r) => ({ id: r.id, sessionId: r.sessionId, items: [], updatedAt: r.updatedAt })));

    const wishRes = await this.database.query(`SELECT * FROM "Wishlist"`);
    saveFile('wishlists.json', wishRes.rows.map((r) => ({ id: r.id, customerId: r.customerId, productIds: [], updatedAt: r.updatedAt })));

    const stockAdjRes = await this.database.query(`SELECT * FROM "StockAdjustment" ORDER BY "createdAt" ASC`);
    saveFile('stock_adjustments.json', stockAdjRes.rows.map((r) => ({
      id: r.id,
      productId: r.productId,
      variantId: r.variantId || undefined,
      sku: r.sku || undefined,
      type: r.type,
      quantity: Number(r.quantity || 0),
      previousQty: r.previousQty ? Number(r.previousQty) : undefined,
      newQty: r.newQty ? Number(r.newQty) : undefined,
      reason: r.reason || undefined,
      adjustedBy: r.adjustedBy || undefined,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    })));

    const cmaRes = await this.database.query(`SELECT * FROM "CourierMerchantAgreement" LIMIT 1`);
    if (cmaRes.rows.length > 0) {
      const r = cmaRes.rows[0];
      saveFile('courier_agreements.json', {
        courierCode: r.courierCode,
        courierName: r.courierName,
        agreementReference: r.agreementReference,
        standardDeliveryCharge: Number(r.standardDeliveryCharge || 450),
        codCommissionType: r.codCommissionType,
        codCommissionValue: Number(r.codCommissionValue || 0),
        vatApplicable: Boolean(r.vatApplicable),
      });
    }

    const contactRes = await this.database.query(`SELECT * FROM "ContactMessage"`);
    saveFile('contact_messages.json', contactRes.rows.map((r) => ({ ...r })));

    const reviewsRes = await this.database.query(`SELECT * FROM "Review"`);
    saveFile('feedback.json', reviewsRes.rows.map((r) => ({ ...r })));

    const stlRes = await this.database.query(`SELECT * FROM "SettlementRecord"`);
    saveFile('settlements.json', stlRes.rows.map((r) => ({ ...r })));

    // Pass-through files
    const passThroughs = ['redirects.json', 'products.seed.json'];
    for (const pt of passThroughs) {
      const srcPath = path.join(this.dataDir, pt);
      if (fs.existsSync(srcPath)) {
        saveFile(pt, JSON.parse(fs.readFileSync(srcPath, 'utf-8')));
      }
    }

    return {
      exportDir,
      timestamp,
      exportedFiles,
      success: true,
    };
  }
}

export const reverseSyncService = new ReverseSyncService();
