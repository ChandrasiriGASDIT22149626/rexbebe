/**
 * READ-ONLY Audit Script: Query exact table row counts in rexbebe_staging
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const { db } = require('../backend/dist/config/database');

async function audit() {
  const tables = [
    'AdminUser',
    'Category',
    'Collection',
    'Product',
    'ProductVariant',
    'ProductImage',
    'StockAdjustment',
    'Order',
    'OrderItem',
    'OrderTimelineEvent',
    'WaybillAllocation',
    'CourierMerchantAgreement',
    'DeliveryZoneSettings',
    'StoreSettings',
    'SeoSettings',
    'WebsitePage',
    'HomepageConfig',
    'MediaAsset',
    'AuditLog',
    'Notification',
    'NavigationItem',
    'SettlementRecord',
    'Cart',
    'CartItem',
    'Wishlist',
    'WishlistItem',
    'Customer',
    'Address',
    'WebhookEventRecord'
  ];

  console.log('TABLE ROW COUNTS IN REXBEBE_STAGING:');
  console.log('------------------------------------');
  let sumAll = 0;
  const tableCounts = {};

  for (const t of tables) {
    try {
      const res = await db.query(`SELECT COUNT(*) as c FROM "${t}"`);
      const count = Number(res.rows[0].c);
      tableCounts[t] = count;
      sumAll += count;
      console.log(`${t.padEnd(26)} : ${count}`);
    } catch (err) {
      console.log(`${t.padEnd(26)} : ERROR - ${err.message}`);
    }
  }

  console.log('------------------------------------');
  console.log(`TOTAL SUM ACROSS ALL 29 TABLES: ${sumAll}`);

  // Let's also check the 20 tables tracked in MigrationService.entityTables:
  const entityTables = [
    'AdminUser',
    'Category',
    'Collection',
    'Product',
    'ProductVariant',
    'ProductImage',
    'StockAdjustment',
    'Order',
    'OrderItem',
    'OrderTimelineEvent',
    'WaybillAllocation',
    'CourierMerchantAgreement',
    'WebsitePage',
    'MediaAsset',
    'AuditLog',
    'Notification',
    'NavigationItem',
    'SettlementRecord',
    'Cart',
    'Wishlist'
  ];
  let sumEntityTables = 0;
  for (const t of entityTables) {
    sumEntityTables += (tableCounts[t] || 0);
  }
  console.log(`SUM OF 20 ENTITY TABLES (MigrationService): ${sumEntityTables}`);

  // Tables NOT in entityTables:
  const configTables = ['DeliveryZoneSettings', 'StoreSettings', 'SeoSettings', 'HomepageConfig', 'Customer', 'CartItem', 'WishlistItem', 'Address', 'WebhookEventRecord'];
  let sumConfigTables = 0;
  for (const t of configTables) {
    sumConfigTables += (tableCounts[t] || 0);
  }
  console.log(`SUM OF CONFIG & AUXILIARY TABLES: ${sumConfigTables}`);

  await db.close();
}

audit().catch(console.error);

