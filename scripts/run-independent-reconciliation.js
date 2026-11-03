/**
 * Strict Independent Reconciliation Audit Script
 * Reads all 23 JSON files, queries rexbebe_staging, and validates every entity.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { db } = require('../backend/dist/config/database');

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function run() {
  const dataDir = path.resolve(__dirname, '../backend/data');
  const results = {};

  // 1. Audit Admin Users
  const rawAdmin = JSON.parse(fs.readFileSync(path.join(dataDir, 'admin_users.json'), 'utf8'));
  const dbAdmin = await db.query(`SELECT id, email, role, status FROM "AdminUser" ORDER BY id`);
  results.adminUsers = {
    sourceCount: rawAdmin.length,
    dbCount: dbAdmin.rows.length,
    sourceIds: rawAdmin.map(x => x.id).sort(),
    dbIds: dbAdmin.rows.map(x => x.id).sort(),
  };

  // 2. Audit Categories
  const rawCats = JSON.parse(fs.readFileSync(path.join(dataDir, 'categories.json'), 'utf8'));
  const dbCats = await db.query(`SELECT id, name, slug, "parentId" FROM "Category" ORDER BY id`);
  results.categories = {
    sourceCount: rawCats.length,
    dbCount: dbCats.rows.length,
    sourceIds: rawCats.map(x => x.id).sort(),
    dbIds: dbCats.rows.map(x => x.id).sort(),
  };

  // 3. Audit Collections
  const rawColls = JSON.parse(fs.readFileSync(path.join(dataDir, 'collections.json'), 'utf8'));
  const dbColls = await db.query(`SELECT id, name, slug FROM "Collection" ORDER BY id`);
  results.collections = {
    sourceCount: rawColls.length,
    dbCount: dbColls.rows.length,
    sourceIds: rawColls.map(x => x.id).sort(),
    dbIds: dbColls.rows.map(x => x.id).sort(),
  };

  // 4. Audit Products, Variants, Images
  const rawProds = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf8'));
  const dbProds = await db.query(`SELECT id, name, slug, price, "stockQuantity" FROM "Product" ORDER BY id`);
  const rawVariants = rawProds.flatMap(p => (p.variants || []).map(v => ({ ...v, productId: p.id })));
  const dbVariants = await db.query(`SELECT id, "productId", sku, price, "stockQuantity" FROM "ProductVariant" ORDER BY id`);
  const rawImages = rawProds.flatMap(p => (p.images || []).map(img => ({ ...img, productId: p.id })));
  const dbImages = await db.query(`SELECT id, "productId", url, position FROM "ProductImage" ORDER BY id`);

  results.products = {
    sourceCount: rawProds.length,
    dbCount: dbProds.rows.length,
    sourceIds: rawProds.map(x => x.id).sort(),
    dbIds: dbProds.rows.map(x => x.id).sort(),
  };

  results.variants = {
    sourceCount: rawVariants.length,
    dbCount: dbVariants.rows.length,
    sourceIds: rawVariants.map(x => x.id),
    dbIds: dbVariants.rows.map(x => x.id),
    duplicateInSource: rawVariants.filter((v, i, a) => a.findIndex(t => t.id === v.id) !== i).map(x => x.id),
  };

  results.images = {
    sourceCount: rawImages.length,
    dbCount: dbImages.rows.length,
    sourceIds: rawImages.map(x => x.id).sort(),
    dbIds: dbImages.rows.map(x => x.id).sort(),
  };

  // 5. Stock Adjustments
  const rawAdj = JSON.parse(fs.readFileSync(path.join(dataDir, 'stock_adjustments.json'), 'utf8'));
  const dbAdj = await db.query(`SELECT id, "productId", "variantId", quantity FROM "StockAdjustment" ORDER BY id`);
  results.stockAdjustments = {
    sourceCount: rawAdj.length,
    dbCount: dbAdj.rows.length,
    sourceIds: rawAdj.map(x => x.id).sort(),
    dbIds: dbAdj.rows.map(x => x.id).sort(),
  };

  // 6. Orders, OrderItems, OrderTimelineEvents
  const rawOrders = JSON.parse(fs.readFileSync(path.join(dataDir, 'orders.json'), 'utf8'));
  const dbOrders = await db.query(`SELECT id, "orderNumber", "totalAmount", status FROM "Order" ORDER BY id`);
  const rawOrderItems = rawOrders.flatMap(o => (o.items || []).map(i => ({ ...i, orderId: o.id })));
  const dbOrderItems = await db.query(`SELECT id, "orderId", "variantId", title, price, quantity FROM "OrderItem" ORDER BY id`);
  const rawTimeline = rawOrders.flatMap(o => (o.timeline || []).map((t, idx) => ({ ...t, orderId: o.id, syntheticId: `${o.id}-tl-${idx}` })));
  const dbTimeline = await db.query(`SELECT id, "orderId", status, note FROM "OrderTimelineEvent" ORDER BY id`);

  results.orders = {
    sourceCount: rawOrders.length,
    dbCount: dbOrders.rows.length,
    sourceIds: rawOrders.map(x => x.id).sort(),
    dbIds: dbOrders.rows.map(x => x.id).sort(),
  };

  results.orderItems = {
    sourceCount: rawOrderItems.length,
    dbCount: dbOrderItems.rows.length,
    sourceIds: rawOrderItems.map(x => x.id).sort(),
    dbIds: dbOrderItems.rows.map(x => x.id).sort(),
  };

  results.orderTimeline = {
    sourceCount: rawTimeline.length,
    dbCount: dbTimeline.rows.length,
  };

  // 7. Courier Agreements
  const rawAgreements = JSON.parse(fs.readFileSync(path.join(dataDir, 'courier_agreements.json'), 'utf8'));
  const dbAgreements = await db.query(`SELECT id, "courierCode", "agreementReference" FROM "CourierMerchantAgreement"`);
  results.courierAgreements = {
    sourceCount: rawAgreements ? 1 : 0,
    dbCount: dbAgreements.rows.length,
  };

  // 8. Delivery Settings
  const rawDelivery = JSON.parse(fs.readFileSync(path.join(dataDir, 'delivery_settings.json'), 'utf8'));
  const dbDelivery = await db.query(`SELECT id, jsonb_array_length(zones) as zone_count FROM "DeliveryZoneSettings"`);
  results.deliverySettings = {
    sourceCount: 1,
    sourceZones: (rawDelivery.zones || []).length,
    dbCount: dbDelivery.rows.length,
    dbZones: Number(dbDelivery.rows[0]?.zone_count || 0),
  };

  // 9. Store Settings & SEO
  const rawSettings = JSON.parse(fs.readFileSync(path.join(dataDir, 'settings.json'), 'utf8'));
  const dbSettings = await db.query(`SELECT id FROM "StoreSettings"`);
  const rawSeo = JSON.parse(fs.readFileSync(path.join(dataDir, 'seo.json'), 'utf8'));
  const dbSeo = await db.query(`SELECT id, "metaTitle" FROM "SeoSettings"`);
  results.storeSettings = { sourceCount: 1, dbCount: dbSettings.rows.length };
  results.seoSettings = { sourceCount: 1, dbCount: dbSeo.rows.length };

  // 10. Pages & Homepage
  const rawPages = JSON.parse(fs.readFileSync(path.join(dataDir, 'pages.json'), 'utf8'));
  const dbPages = await db.query(`SELECT id, slug, status FROM "WebsitePage" ORDER BY id`);
  const rawHomepage = JSON.parse(fs.readFileSync(path.join(dataDir, 'homepage.json'), 'utf8'));
  const dbHomepage = await db.query(`SELECT id FROM "HomepageConfig"`);
  results.pages = {
    sourceCount: rawPages.length,
    dbCount: dbPages.rows.length,
    sourceIds: rawPages.map(x => x.id).sort(),
    dbIds: dbPages.rows.map(x => x.id).sort(),
  };
  results.homepage = { sourceCount: 1, dbCount: dbHomepage.rows.length };

  // 11. Media Assets
  const rawMedia = JSON.parse(fs.readFileSync(path.join(dataDir, 'media.json'), 'utf8'));
  const dbMedia = await db.query(`SELECT id, name, url FROM "MediaAsset" ORDER BY id`);
  results.media = {
    sourceCount: rawMedia.length,
    dbCount: dbMedia.rows.length,
    sourceIds: rawMedia.map(x => x.id).sort(),
    dbIds: dbMedia.rows.map(x => x.id).sort(),
  };

  // 12. Audit Logs
  const rawAudit = JSON.parse(fs.readFileSync(path.join(dataDir, 'audit_logs.json'), 'utf8'));
  const dbAudit = await db.query(`SELECT id, action, "createdAt" FROM "AuditLog" ORDER BY id`);
  results.auditLogs = {
    sourceCount: rawAudit.length,
    dbCount: dbAudit.rows.length,
    sourceIds: rawAudit.map(x => x.id).sort(),
    dbIds: dbAudit.rows.map(x => x.id).sort(),
  };

  // 13. Notifications
  const rawNotifs = JSON.parse(fs.readFileSync(path.join(dataDir, 'notifications.json'), 'utf8'));
  const dbNotifs = await db.query(`SELECT id, title, type FROM "Notification" ORDER BY id`);
  results.notifications = {
    sourceCount: rawNotifs.length,
    dbCount: dbNotifs.rows.length,
    sourceIds: rawNotifs.map(x => x.id).sort(),
    dbIds: dbNotifs.rows.map(x => x.id).sort(),
  };

  // 14. Navigation Items
  const rawNav = JSON.parse(fs.readFileSync(path.join(dataDir, 'navigation.json'), 'utf8'));
  const dbNav = await db.query(`SELECT id, name, href FROM "NavigationItem" ORDER BY id`);
  results.navigation = {
    sourceCount: (rawNav.items || []).length,
    dbCount: dbNav.rows.length,
    sourceIds: (rawNav.items || []).map(x => x.id).sort(),
    dbIds: dbNav.rows.map(x => x.id).sort(),
  };

  // 15. Settlements
  const rawSettlements = JSON.parse(fs.readFileSync(path.join(dataDir, 'settlements.json'), 'utf8'));
  const dbSettlements = await db.query(`SELECT id FROM "SettlementRecord"`);
  results.settlements = {
    sourceCount: rawSettlements.length,
    dbCount: dbSettlements.rows.length,
  };

  // 16. Carts & Wishlists
  const rawCarts = JSON.parse(fs.readFileSync(path.join(dataDir, 'carts.json'), 'utf8'));
  const dbCarts = await db.query(`SELECT id, "sessionId" FROM "Cart"`);
  const rawWishlists = JSON.parse(fs.readFileSync(path.join(dataDir, 'wishlists.json'), 'utf8'));
  const dbWishlists = await db.query(`SELECT id, "customerId" FROM "Wishlist"`);
  results.carts = {
    sourceCount: Object.keys(rawCarts).length,
    dbCount: dbCarts.rows.length,
  };
  results.wishlists = {
    sourceCount: Object.keys(rawWishlists).length,
    dbCount: dbWishlists.rows.length,
  };

  // 17. Empty / Schema-Ready Files
  const rawContact = JSON.parse(fs.readFileSync(path.join(dataDir, 'contact_messages.json'), 'utf8'));
  const rawFeedback = JSON.parse(fs.readFileSync(path.join(dataDir, 'feedback.json'), 'utf8'));
  const rawRedirects = JSON.parse(fs.readFileSync(path.join(dataDir, 'redirects.json'), 'utf8'));
  results.emptyFiles = {
    contactMessages: { sourceCount: rawContact.length },
    feedback: { sourceCount: rawFeedback.length },
    redirects: { sourceCount: rawRedirects.length },
  };

  // 18. Waybill Allocations
  const dbWaybills = await db.query(`SELECT status, COUNT(*) as c FROM "WaybillAllocation" GROUP BY status`);
  results.waybills = {
    breakdown: dbWaybills.rows,
  };

  // 19. Check SHA-256 Hashes of all 23 files
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  results.hashes = {};
  for (const f of files) {
    const raw = fs.readFileSync(path.join(dataDir, f));
    results.hashes[f] = {
      bytes: raw.length,
      sha256: sha256(raw),
    };
  }

  // 20. Foreign Key & Orphan Checks
  const fkChecks = {
    orphanOrderItems: (await db.query(`SELECT COUNT(*) as c FROM "OrderItem" oi LEFT JOIN "Order" o ON oi."orderId" = o.id WHERE o.id IS NULL`)).rows[0].c,
    orphanTimeline: (await db.query(`SELECT COUNT(*) as c FROM "OrderTimelineEvent" te LEFT JOIN "Order" o ON te."orderId" = o.id WHERE o.id IS NULL`)).rows[0].c,
    orphanVariants: (await db.query(`SELECT COUNT(*) as c FROM "ProductVariant" pv LEFT JOIN "Product" p ON pv."productId" = p.id WHERE p.id IS NULL`)).rows[0].c,
    orphanImages: (await db.query(`SELECT COUNT(*) as c FROM "ProductImage" pi LEFT JOIN "Product" p ON pi."productId" = p.id WHERE p.id IS NULL`)).rows[0].c,
    orphanCustomers: (await db.query(`SELECT COUNT(*) as c FROM "Order" o LEFT JOIN "Customer" c ON o."customerId" = c.id WHERE o."customerId" IS NOT NULL AND c.id IS NULL`)).rows[0].c,
    orphanWishlistCustomers: (await db.query(`SELECT COUNT(*) as c FROM "Wishlist" w LEFT JOIN "Customer" c ON w."customerId" = c.id WHERE c.id IS NULL`)).rows[0].c,
  };
  results.fkChecks = fkChecks;

  console.log(JSON.stringify(results, null, 2));
  await db.close();
}

run().catch(console.error);

