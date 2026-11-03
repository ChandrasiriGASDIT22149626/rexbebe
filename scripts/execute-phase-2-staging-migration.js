/**
 * Phase 2 Staging Ingestion & Lossless Verification Script for REXBEBE
 * 
 * Verifies:
 * 1. Verified pre-migration backup of all 23 JSON files with SHA-256 checksums
 * 2. Lossless data ingestion into native PostgreSQL 16 staging database (rexbebe_staging)
 * 3. Idempotency & Resumability: Runs migration twice to prove zero-error rerun safety
 * 4. Deep integrity audit: Foreign keys, orphan records, variant stock quantities, historical order snapshots
 * 5. Original JSON files untouched: SHA-256 hashes re-verified against backup manifest
 * 6. Runtime persistence mode: USE_POSTGRES strictly remains 'false'
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { db } = require('../backend/dist/config/database');
const { backupService } = require('../backend/dist/database/backupService');
const { MigrationService } = require('../backend/dist/database/migrationService');

let totalPassed = 0;
let totalFailed = 0;

async function testStep(name, fn) {
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    totalPassed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split('\n').slice(1, 4).join('\n'));
    }
    totalFailed++;
  }
}

function calculateSha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function runPhase2() {
  console.log('================================================================');
  console.log('   REXBEBE PHASE 2: STAGING LOSSLESS INGESTION & AUDIT');
  console.log('================================================================');

  const dataDir = path.resolve(__dirname, '../backend/data');
  let backupManifest;

  // STEP 1: Verify Active Persistence Mode
  await testStep('1. Verify Persistence Mode Safety (USE_POSTGRES=false)', async () => {
    assert.strictEqual(process.env.USE_POSTGRES, 'false', 'USE_POSTGRES must be strictly false');
    console.log('   Current Runtime Mode: Safe JSON file persistence active');
  });

  // STEP 2: Pre-Migration Backup & SHA-256 Checksums
  await testStep('2. Create Verified Pre-Migration Backup & SHA-256 Manifest', async () => {
    const backupRes = await backupService.createVerifiedBackup('phase2_staging_pre_migration');
    assert.strictEqual(backupRes.verified, true, 'Backup verification must pass');
    backupManifest = backupRes.manifest;
    assert.strictEqual(backupManifest.totalFiles, 23, `Manifest must cover 23 files, got: ${backupManifest.totalFiles}`);
    console.log(`   Backup ID: ${backupManifest.backupId}`);
    console.log(`   Backup Location: ${backupRes.backupDir}`);
    console.log(`   Total Backed-Up Files: ${backupManifest.totalFiles} (${backupManifest.totalBytes} bytes)`);
  });

  // STEP 3: Execute Full Ingestion Migration into Staging PostgreSQL
  let migrationReport;
  await testStep('3. Execute Complete Staging Ingestion (MigrationService)', async () => {
    // Clean up any test orders from earlier concurrency tests
    await db.query(`
      DELETE FROM "OrderTimelineEvent" WHERE "orderId" IN (SELECT id FROM "Order" WHERE "customerEmail" LIKE '%concurrency.tester%');
      DELETE FROM "OrderItem" WHERE "orderId" IN (SELECT id FROM "Order" WHERE "customerEmail" LIKE '%concurrency.tester%');
      DELETE FROM "Order" WHERE "customerEmail" LIKE '%concurrency.tester%';
    `);

    const migration = new MigrationService(dataDir, db);
    migrationReport = await migration.runMigration({ dryRun: false });
    assert.strictEqual(migrationReport.success, true, 'Migration must succeed');
    assert.ok(migrationReport.totalEntitiesMigrated >= 18, `Entities migrated: ${migrationReport.totalEntitiesMigrated}`);
    assert.ok(migrationReport.totalRecordsMigrated > 300, `Records migrated: ${migrationReport.totalRecordsMigrated}`);
    console.log(`   Ingestion Completed in ${migrationReport.executionTimeMs}ms`);
    console.log(`   Entities Migrated: ${migrationReport.totalEntitiesMigrated}`);
    console.log(`   Total DB Records Migrated: ${migrationReport.totalRecordsMigrated}`);
  });

  // STEP 4: Idempotency & Resumability Check (Run Migration a Second Time)
  await testStep('4. Verify Migration Idempotency & Resumability (Re-Run Safety)', async () => {
    const migration = new MigrationService(dataDir, db);
    const rerunReport = await migration.runMigration({ dryRun: false });
    assert.strictEqual(rerunReport.success, true, 'Re-run migration must succeed without collision');
    assert.strictEqual(rerunReport.totalRecordsMigrated, migrationReport.totalRecordsMigrated, 'Total records count must remain identical on re-run');
    console.log(`   Re-run succeeded cleanly with 0 duplicate key errors. Total records: ${rerunReport.totalRecordsMigrated}`);
  });

  // STEP 5: Detailed Record Count Reconciliation (Source JSON vs PostgreSQL)
  await testStep('5. Detailed Table Count Reconciliation Audit', async () => {
    const checks = [
      { table: 'Product', expected: 17, source: 'products.json' },
      { table: 'ProductVariant', expected: 18, source: 'products.json (variants)' },
      { table: 'ProductImage', expected: 17, source: 'products.json (images)' },
      { table: 'Category', expected: 12, source: 'categories.json' },
      { table: 'Collection', expected: 4, source: 'collections.json' },
      { table: 'AdminUser', expected: 4, source: 'admin_users.json' },
      { table: 'StockAdjustment', expected: 3, source: 'stock_adjustments.json' },
      { table: 'Order', expected: 13, source: 'orders.json' },
      { table: 'OrderItem', expected: 13, source: 'orders.json (items)' },
      { table: 'OrderTimelineEvent', expected: 46, source: 'orders.json (timeline)' },
      { table: 'CourierMerchantAgreement', expected: 1, source: 'courier_agreements.json' },
      { table: 'DeliveryZoneSettings', expected: 1, source: 'delivery_settings.json' },
      { table: 'StoreSettings', expected: 1, source: 'settings.json' },
      { table: 'SeoSettings', expected: 1, source: 'seo.json' },
      { table: 'WebsitePage', expected: 6, source: 'pages.json' },
      { table: 'HomepageConfig', expected: 1, source: 'homepage.json' },
      { table: 'MediaAsset', expected: 45, source: 'media.json' },
      { table: 'AuditLog', expected: 83, source: 'audit_logs.json' },
      { table: 'Notification', expected: 6, source: 'notifications.json' },
      { table: 'NavigationItem', expected: 7, source: 'navigation.json' },
      { table: 'Cart', expected: 1, source: 'carts.json' },
      { table: 'Wishlist', expected: 2, source: 'wishlists.json' },
    ];

    for (const c of checks) {
      const res = await db.query(`SELECT COUNT(*) as count FROM "${c.table}"`);
      const count = Number(res.rows[0].count);
      assert.strictEqual(count, c.expected, `Table "${c.table}" count mismatch: expected ${c.expected}, got ${count}`);
    }
    console.log(`   All ${checks.length} entity tables matched exact JSON source counts!`);
  });

  // STEP 6: Deep Foreign Key & Orphan Record Audit
  await testStep('6. Foreign Key Integrity & Orphan Records Audit', async () => {
    // 1. OrderItems without an Order
    const orphanItemsRes = await db.query(`
      SELECT COUNT(*) as c FROM "OrderItem" oi 
      LEFT JOIN "Order" o ON oi."orderId" = o.id 
      WHERE o.id IS NULL
    `);
    assert.strictEqual(Number(orphanItemsRes.rows[0].c), 0, 'No orphaned OrderItems allowed');

    // 2. Timeline events without an Order
    const orphanTimelineRes = await db.query(`
      SELECT COUNT(*) as c FROM "OrderTimelineEvent" te 
      LEFT JOIN "Order" o ON te."orderId" = o.id 
      WHERE o.id IS NULL
    `);
    assert.strictEqual(Number(orphanTimelineRes.rows[0].c), 0, 'No orphaned OrderTimelineEvents allowed');

    // 3. ProductVariants without a Product
    const orphanVariantsRes = await db.query(`
      SELECT COUNT(*) as c FROM "ProductVariant" pv 
      LEFT JOIN "Product" p ON pv."productId" = p.id 
      WHERE p.id IS NULL
    `);
    assert.strictEqual(Number(orphanVariantsRes.rows[0].c), 0, 'No orphaned ProductVariants allowed');

    // 4. ProductImages without a Product
    const orphanImagesRes = await db.query(`
      SELECT COUNT(*) as c FROM "ProductImage" pi 
      LEFT JOIN "Product" p ON pi."productId" = p.id 
      WHERE p.id IS NULL
    `);
    assert.strictEqual(Number(orphanImagesRes.rows[0].c), 0, 'No orphaned ProductImages allowed');

    // 5. Orders referencing non-existent Customers
    const orphanCustOrdersRes = await db.query(`
      SELECT COUNT(*) as c FROM "Order" o 
      LEFT JOIN "Customer" c ON o."customerId" = c.id 
      WHERE o."customerId" IS NOT NULL AND c.id IS NULL
    `);
    assert.strictEqual(Number(orphanCustOrdersRes.rows[0].c), 0, 'All customerId references in Order must exist in Customer');

    console.log('   Orphan audit passed: 0 orphaned items, variants, images, timeline events, or customers.');
  });

  // STEP 7: Stock Quantities & Order Financial Snapshots Validation
  await testStep('7. Stock Quantities & Order Financial Snapshots Validation', async () => {
    const rawProducts = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf8'));
    const seenCheckIds = new Set();
    for (const p of rawProducts) {
      for (const v of (p.variants || [])) {
        const vId = seenCheckIds.has(v.id) ? `${v.id}-${p.id}` : v.id;
        seenCheckIds.add(v.id);
        const vRes = await db.query(`SELECT "stockQuantity", price FROM "ProductVariant" WHERE id = $1`, [vId]);
        assert.strictEqual(vRes.rows.length, 1, `Variant ${vId} must exist in DB`);
        assert.strictEqual(Number(vRes.rows[0].stockQuantity), Number(v.stockQuantity || 0), `Stock mismatch on ${vId}`);
        assert.strictEqual(Number(vRes.rows[0].price), Number(v.price || p.price || 0), `Price mismatch on ${vId}`);
      }
    }

    const rawOrders = JSON.parse(fs.readFileSync(path.join(dataDir, 'orders.json'), 'utf8'));
    for (const o of rawOrders) {
      const oRes = await db.query(`SELECT "orderNumber", "totalAmount", status, "paymentMethod" FROM "Order" WHERE id = $1`, [o.id]);
      assert.strictEqual(oRes.rows.length, 1, `Order ${o.id} must exist in DB`);
      assert.strictEqual(oRes.rows[0].orderNumber, o.orderNumber);
      assert.strictEqual(Number(oRes.rows[0].totalAmount), Number(o.totalAmount));
      assert.strictEqual(oRes.rows[0].status, o.status);
    }

    console.log(`   Verified stock quantities across 18 variants and financial snapshots across 13 orders.`);
  });

  // STEP 8: Verify Original JSON Files Integrity (Zero File Modification)
  await testStep('8. Verify Original JSON Data Integrity (SHA-256 Hashes Match)', async () => {
    assert.ok(backupManifest, 'Backup manifest must be available');
    for (const entry of backupManifest.files) {
      const currentFilePath = path.join(dataDir, entry.filename);
      assert.ok(fs.existsSync(currentFilePath), `Original file must still exist: ${entry.filename}`);
      const raw = fs.readFileSync(currentFilePath);
      const currentHash = calculateSha256(raw);
      assert.strictEqual(currentHash, entry.sha256, `SHA-256 hash mismatch on ${entry.filename}! Original file was modified!`);
      assert.strictEqual(raw.length, entry.bytes, `Byte length mismatch on ${entry.filename}!`);
    }
    console.log(`   Cryptographic verification passed: All 23 original JSON files are 100% byte-for-byte identical to pre-migration state.`);
  });

  // STEP 9: Confirm Final Runtime Environment Safety
  await testStep('9. Confirm Runtime Persistence Safety (USE_POSTGRES=false retained)', async () => {
    assert.strictEqual(process.env.USE_POSTGRES, 'false', 'USE_POSTGRES must remain false');
    console.log('   Final Confirmation: USE_POSTGRES=false. Application runtime remains safely in JSON mode.');
  });

  console.log('================================================================');
  console.log(`   PHASE 2 AUDIT COMPLETE: ${totalPassed} PASSED | ${totalFailed} FAILED`);
  console.log('================================================================');

  await db.close();
  if (totalFailed > 0) process.exit(1);
}

runPhase2().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
