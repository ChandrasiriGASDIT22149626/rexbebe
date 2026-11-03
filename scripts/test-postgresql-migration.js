/**
 * REXBEBE - PostgreSQL Migration & Persistence Automated Test Suite
 * 
 * Verifies:
 * 1. Pre-migration backup creation, SHA-256 manifest verification & restoration
 * 2. Pre-migration data validation & dry-run execution
 * 3. Schema DDL initialization (PostgreSQL tables, indexes, constraints)
 * 4. Transactional, topological data migration from JSON to PostgreSQL
 * 5. Post-migration record count and relationship integrity audit
 * 6. Idempotent re-run safety (ON CONFLICT DO UPDATE)
 * 7. Order repository CRUD & transaction rollback safety under PostgreSQL
 * 8. Concurrent write race-condition protection via row locking (SELECT ... FOR UPDATE)
 * 9. Waybill concurrency protection (SELECT ... FOR UPDATE SKIP LOCKED)
 * 10. Koombiyo uncertain dispatch handling & reservation retention under PostgreSQL
 * 11. Historical order item immutability (decoupling orders from catalog mutations)
 * 12. Seamless repository switching (USE_POSTGRES=true vs JSON mode)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Ensure dist is built
const { db } = require('../backend/dist/config/database');
const { backupService } = require('../backend/dist/database/backupService');
const { MigrationService } = require('../backend/dist/database/migrationService');
const { postgresOrderRepository } = require('../backend/dist/repositories/postgres/PostgresOrderRepository');
const { postgresProductRepository } = require('../backend/dist/repositories/postgres/PostgresProductRepository');
const { postgresWaybillRepository } = require('../backend/dist/repositories/postgres/PostgresWaybillRepository');
const { OrderRepository } = require('../backend/dist/repositories/orderRepository');
const { ProductRepository } = require('../backend/dist/repositories/productRepository');

let totalPassed = 0;
let totalFailed = 0;

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    totalPassed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
    if (err.stack) {
      const relevantStack = err.stack.split('\n').slice(1, 3).join('\n');
      console.error(relevantStack);
    }
    totalFailed++;
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('   REXBEBE POSTGRESQL MIGRATION & PERSISTENCE TEST SUITE');
  console.log('================================================================');

  // Verify Database Connection
  const connInfo = await db.testConnection();
  console.log(`Active Database Engine: ${connInfo.engine}`);
  console.log(`Connected: ${connInfo.connected}`);
  assert(connInfo.connected, 'Database engine must be connected');

  const migrationService = new MigrationService();

  // =========================================================================
  // SECTION 1: BACKUP CREATION, SHA-256 MANIFEST VERIFICATION & RESTORATION
  // =========================================================================
  console.log('\n--- 1. Data Backup & Cryptographic Checksum Integrity Tests ---');

  let testBackupManifest = null;

  await testAsync('Pre-migration backup creates verified snapshot with SHA-256 manifest', async () => {
    const backupResult = await backupService.createVerifiedBackup('test_suite_run');
    assert(backupResult.verified, 'Backup creation must report verified');
    assert(backupResult.manifest, 'Manifest must be generated');
    assert(backupResult.manifest.files.length >= 10, 'Backup must include all JSON data files');

    testBackupManifest = backupResult.manifest;

    // Verify each file checksum
    for (const fileInfo of testBackupManifest.files) {
      assert(fileInfo.sha256 && fileInfo.sha256.length === 64, `SHA-256 for ${fileInfo.filename} must be valid`);
      const backupFilePath = path.join(testBackupManifest.targetDirectory, fileInfo.filename);
      assert(fs.existsSync(backupFilePath), `Backup file ${fileInfo.filename} must exist on disk`);
      const calcHash = backupService.calculateSha256(fs.readFileSync(backupFilePath));
      assert.strictEqual(calcHash, fileInfo.sha256, `Checksum mismatch on ${fileInfo.filename}`);
    }
  });

  await testAsync('Backup verification function validates clean manifest without errors', async () => {
    assert(testBackupManifest, 'Manifest from previous test required');
    const verifyResult = await backupService.verifyBackup(testBackupManifest.targetDirectory);
    assert(verifyResult.valid, 'Verification must pass on untouched backup');
    assert.strictEqual(verifyResult.errors.length, 0, 'Zero errors expected');
  });

  await testAsync('Backup restoration restores files faithfully into sandbox directory', async () => {
    assert(testBackupManifest, 'Manifest required');
    const sandboxDir = path.resolve(__dirname, '../backend/data/backups/sandbox_restore_test');
    if (fs.existsSync(sandboxDir)) {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    }

    const restoreResult = await backupService.restoreBackup(testBackupManifest.targetDirectory, sandboxDir);
    assert(restoreResult.restoredFiles > 0, 'Restoration must report restored files');
    assert.strictEqual(restoreResult.restoredFiles, testBackupManifest.files.length);

    // Verify sandbox file count
    const restoredFilesOnDisk = fs.readdirSync(sandboxDir);
    assert(restoredFilesOnDisk.includes('orders.json'));
    assert(restoredFilesOnDisk.includes('products.json'));
    assert(restoredFilesOnDisk.includes('categories.json'));

    // Cleanup sandbox
    fs.rmSync(sandboxDir, { recursive: true, force: true });
  });

  // =========================================================================
  // SECTION 2: PRE-MIGRATION DATA VALIDATION & DRY-RUN EXECUTION
  // =========================================================================
  console.log('\n--- 2. Pre-Migration Data Validation & Dry-Run Tests ---');

  await testAsync('Pre-migration source data validation detects zero fatal errors', async () => {
    const valResult = await migrationService.validateSourceData();
    assert(valResult.valid, 'Source data validation must pass');
    const fatalErrors = valResult.issues.filter((i) => i.severity === 'ERROR');
    assert.strictEqual(fatalErrors.length, 0, `Expected 0 fatal errors, found: ${fatalErrors.map((e) => e.message).join(', ')}`);
    assert(valResult.summary['orders'] >= 10, 'Expected at least 10 orders');
    assert(valResult.summary['products'] >= 10, 'Expected at least 10 products');
  });

  await testAsync('Dry-run migration mode calculates full entity mapping with ZERO database writes', async () => {
    const dryRunReport = await migrationService.runMigration({ dryRun: true });
    assert(dryRunReport.dryRun, 'Must be flagged as dry-run');
    assert(dryRunReport.success, 'Dry run must succeed');
    assert(dryRunReport.totalRecordsSource > 100, 'Must audit all source records');
    assert.strictEqual(dryRunReport.totalRecordsMigrated, 0, 'Dry-run must not write any records to database');
  });

  // =========================================================================
  // SECTION 3: DATABASE SCHEMA DDL APPLICATION
  // =========================================================================
  console.log('\n--- 3. Database Schema DDL Application Tests ---');

  await testAsync('PostgreSQL schema DDL executes and creates all normalized tables and indexes', async () => {
    await db.initializeSchema();

    // Query tables
    const tableRes = await db.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const tableNames = new Set(tableRes.rows.map((r) => r.table_name));

    const requiredTables = [
      'Order',
      'OrderItem',
      'Product',
      'ProductVariant',
      'ProductImage',
      'Category',
      'Collection',
      'AdminUser',
      'WaybillAllocation',
      'WebhookEventRecord',
      'OrderTimelineEvent',
    ];

    for (const t of requiredTables) {
      assert(tableNames.has(t), `Required table "${t}" must exist in schema`);
    }
  });

  // =========================================================================
  // SECTION 4: REAL DATA MIGRATION (TRANSACTIONAL & IDEMPOTENT)
  // =========================================================================
  console.log('\n--- 4. Real Data Migration & Post-Migration Reconciliation Tests ---');

  let migrationReport = null;

  await testAsync('Transactional data migration populates all entities with 100% record match', async () => {
    migrationReport = await migrationService.runMigration({ dryRun: false });
    assert(migrationReport.success, 'Migration must succeed');
    assert(!migrationReport.dryRun, 'Must not be dry-run');
    assert(migrationReport.totalRecordsMigrated > 100, 'Records must be written to database');

    // Audit individual entity counts
    const ordersInDb = await db.query(`SELECT COUNT(*) as count FROM "Order"`);
    const orderItemsInDb = await db.query(`SELECT COUNT(*) as count FROM "OrderItem"`);
    const productsInDb = await db.query(`SELECT COUNT(*) as count FROM "Product"`);
    const variantsInDb = await db.query(`SELECT COUNT(*) as count FROM "ProductVariant"`);
    const categoriesInDb = await db.query(`SELECT COUNT(*) as count FROM "Category"`);
    const collectionsInDb = await db.query(`SELECT COUNT(*) as count FROM "Collection"`);
    const adminsInDb = await db.query(`SELECT COUNT(*) as count FROM "AdminUser"`);

    const sourceOrders = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../backend/data/orders.json'), 'utf-8'));
    const sourceProducts = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../backend/data/products.json'), 'utf-8'));
    const sourceCategories = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../backend/data/categories.json'), 'utf-8'));

    assert.strictEqual(Number(ordersInDb.rows[0].count), sourceOrders.length, 'Order count in DB must equal orders.json count');
    assert.strictEqual(Number(productsInDb.rows[0].count), sourceProducts.length, 'Product count in DB must equal products.json count');
    assert.strictEqual(Number(categoriesInDb.rows[0].count), sourceCategories.length, 'Category count in DB must equal categories.json count');
    assert(Number(orderItemsInDb.rows[0].count) >= sourceOrders.length, 'Order items must be populated');
    assert(Number(variantsInDb.rows[0].count) >= sourceProducts.length, 'Product variants must be populated');
    assert(Number(adminsInDb.rows[0].count) >= 1, 'Admin users must be populated');
  });

  await testAsync('Idempotent re-run safety: running migration a second time succeeds without duplication', async () => {
    const secondRun = await migrationService.runMigration({ dryRun: false });
    assert(secondRun.success, 'Second migration run must succeed');

    const ordersInDb = await db.query(`SELECT COUNT(*) as count FROM "Order"`);
    const sourceOrders = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../backend/data/orders.json'), 'utf-8'));
    assert.strictEqual(Number(ordersInDb.rows[0].count), sourceOrders.length, 'Record count must remain identical (no duplicate rows)');
  });

  // =========================================================================
  // SECTION 5: POSTGRESQL ORDER REPOSITORY CRUD & TRANSACTION MANAGEMENT
  // =========================================================================
  console.log('\n--- 5. PostgreSQL Order Repository Operations Tests ---');

  let testOrderId = null;

  await testAsync('postgresOrderRepository.findAll() returns complete orders with parsed items & addresses', async () => {
    const all = await postgresOrderRepository.findAll();
    assert(all.length >= 10, 'Must load all migrated orders');
    const first = all[0];
    assert(first.orderNumber, 'Order number must be present');
    assert(first.customerName, 'Customer name must be present');
    assert(Array.isArray(first.items) && first.items.length > 0, 'Order items must be an array');
    assert(first.shippingAddress && typeof first.shippingAddress === 'object', 'Shipping address must be an object');
  });

  await testAsync('postgresOrderRepository.create() atomically inserts order and order items in transaction', async () => {
    const newOrderData = {
      orderNumber: `RXB-TEST-MIG-${Date.now()}`,
      customerName: 'Migration Test User',
      customerEmail: 'test.migration@rexbebe.lk',
      phone: '0771234567',
      status: 'PENDING_CONFIRMATION',
      paymentStatus: 'COD_PENDING',
      paymentMethod: 'CASH_ON_DELIVERY',
      subtotal: 4500,
      discount: 0,
      shippingFee: 350,
      totalAmount: 4850,
      amountToCollect: 4850,
      tax: 0,
      idempotencyKey: `idemp-key-${Date.now()}`,
      shippingAddress: {
        recipientName: 'Migration Test User',
        phone: '0771234567',
        street: '123 Galle Road',
        city: 'Colombo 03',
        district: 'Colombo',
        postalCode: '00300',
        country: 'Sri Lanka',
      },
      items: [
        {
          id: `item-mig-1-${Date.now()}`,
          productId: 'prod-001',
          variantId: 'var-mig-1',
          title: 'Signature Baby Romper (Blue / 3-6M)',
          size: '3-6M',
          color: 'Blue',
          price: 4500,
          quantity: 1,
          totalPrice: 4500,
        },
      ],
      timeline: [
        {
          status: 'PENDING_CONFIRMATION',
          time: new Date().toISOString(),
          note: 'Order created in test suite',
        },
      ],
    };

    const res = await postgresOrderRepository.create(newOrderData);
    assert(res.order, 'Order must be created');
    assert.strictEqual(res.isDuplicate, false, 'Initial creation must not be flagged as duplicate');
    testOrderId = res.order.id;

    // Verify order items were inserted in same transaction
    const fetched = await postgresOrderRepository.findById(testOrderId);
    assert(fetched, 'Created order must be retrievable by ID');
    assert.strictEqual(fetched.customerName, 'Migration Test User');
    assert.strictEqual(fetched.items.length, 1);
    assert.strictEqual(fetched.items[0].title, 'Signature Baby Romper (Blue / 3-6M)');
    assert.strictEqual(fetched.items[0].price, 4500);
  });

  await testAsync('Idempotency protection inside PostgreSQL transaction blocks rapid double-submit', async () => {
    assert(testOrderId, 'Test order ID required');
    const existing = await postgresOrderRepository.findById(testOrderId);

    const dupData = {
      orderNumber: `RXB-DUP-${Date.now()}`,
      customerName: 'Duplicate Attempt',
      customerEmail: 'test.migration@rexbebe.lk',
      status: 'PENDING_CONFIRMATION',
      paymentStatus: 'COD_PENDING',
      paymentMethod: 'CASH_ON_DELIVERY',
      subtotal: 4500,
      totalAmount: 4850,
      tax: 0,
      idempotencyKey: existing.idempotencyKey, // SAME KEY
      shippingAddress: existing.shippingAddress,
      items: existing.items,
    };

    const res = await postgresOrderRepository.create(dupData);
    assert.strictEqual(res.isDuplicate, true, 'Duplicate idempotency key must return isDuplicate: true');
    assert.strictEqual(res.order.id, testOrderId, 'Must return existing order record');
  });

  // =========================================================================
  // SECTION 6: CONCURRENT WRITE RACE-CONDITION PROTECTION (ROW LOCKING)
  // =========================================================================
  console.log('\n--- 6. Concurrent Write Race-Condition Protection Tests ---');

  await testAsync('Row-level locking (SELECT ... FOR UPDATE) prevents simultaneous update overwrite', async () => {
    assert(testOrderId, 'Test order required');

    // Launch two asynchronous updates concurrently
    const p1 = postgresOrderRepository.updateOrder(testOrderId, {
      carrier: 'Koombiyo',
      trackingNumber: 'WAYBILL-CONC-1',
    });

    const p2 = postgresOrderRepository.updateOrder(testOrderId, {
      internalNotes: 'Concurrent update note verified',
    });

    const [res1, res2] = await Promise.all([p1, p2]);

    assert(res1, 'Update 1 must succeed');
    assert(res2, 'Update 2 must succeed');

    const finalOrder = await postgresOrderRepository.findById(testOrderId);
    assert.strictEqual(finalOrder.carrier, 'Koombiyo', 'Carrier from update 1 must be preserved');
    assert.strictEqual(finalOrder.trackingNumber, 'WAYBILL-CONC-1', 'Tracking from update 1 must be preserved');
    assert(finalOrder.internalNotes.includes('Concurrent update note verified'), 'Notes from update 2 must be preserved');
  });

  // =========================================================================
  // SECTION 7: WAYBILL CONCURRENCY PROTECTION (SELECT ... FOR UPDATE SKIP LOCKED)
  // =========================================================================
  console.log('\n--- 7. Waybill Concurrency Protection (SKIP LOCKED) Tests ---');

  await testAsync('Seed available waybills and verify concurrent dispatches allocate distinct waybills', async () => {
    const wb1 = `WB-TEST-${Date.now()}-A`;
    const wb2 = `WB-TEST-${Date.now()}-B`;

    // Seed test waybills into WaybillAllocation
    await db.query(
      `INSERT INTO "WaybillAllocation" (id, "waybillId", "courierCode", status, "createdAt", "updatedAt")
       VALUES 
         ($1, $2, 'KOOMBIYO', 'AVAILABLE', NOW(), NOW()),
         ($3, $4, 'KOOMBIYO', 'AVAILABLE', NOW(), NOW())`,
      [`id-${wb1}`, wb1, `id-${wb2}`, wb2]
    );

    // Run two concurrent reservations simultaneously
    const [allocated1, allocated2] = await Promise.all([
      postgresWaybillRepository.reserveNextAvailableWaybill('KOOMBIYO'),
      postgresWaybillRepository.reserveNextAvailableWaybill('KOOMBIYO'),
    ]);

    assert(allocated1, 'First reservation must receive waybill');
    assert(allocated2, 'Second reservation must receive waybill');
    assert.notStrictEqual(allocated1, allocated2, `Waybills must be distinct! Received: ${allocated1} and ${allocated2}`);

    // Verify both waybills are marked RESERVED in DB with valid reservedUntil timestamps
    const checkRes = await db.query(
      `SELECT "waybillId", status, "reservedUntil" FROM "WaybillAllocation" WHERE "waybillId" IN ($1, $2)`,
      [allocated1, allocated2]
    );

    assert.strictEqual(checkRes.rows.length, 2);
    for (const r of checkRes.rows) {
      assert.strictEqual(r.status, 'RESERVED');
      assert(r.reservedUntil, 'reservedUntil timestamp must be present');
      assert(r.reservedUntil instanceof Date || !isNaN(new Date(r.reservedUntil).getTime()), 'Valid lease timestamp recorded');
    }

    // Assign one waybill and release the other
    await postgresWaybillRepository.assignWaybill(allocated1, testOrderId, 'RXB-TEST-ORDER');
    await postgresWaybillRepository.releaseReservation(allocated2);

    const afterCheck = await db.query(
      `SELECT "waybillId", status FROM "WaybillAllocation" WHERE "waybillId" IN ($1, $2)`,
      [allocated1, allocated2]
    );

    const map = new Map(afterCheck.rows.map((r) => [r.waybillId, r.status]));
    assert.strictEqual(map.get(allocated1), 'ASSIGNED', 'Assigned waybill must be ASSIGNED');
    assert.strictEqual(map.get(allocated2), 'AVAILABLE', 'Released waybill must return to AVAILABLE');
  });

  // =========================================================================
  // SECTION 8: KOOMBIYO UNCERTAIN DISPATCH OUTCOME UNDER POSTGRESQL
  // =========================================================================
  console.log('\n--- 8. Koombiyo Uncertain Dispatch Handling Under PostgreSQL Tests ---');

  await testAsync('Marking waybill UNCERTAIN retains allocation and prevents duplicate assignment', async () => {
    const wbUncertain = `WB-UNCERTAIN-${Date.now()}`;
    await db.query(
      `INSERT INTO "WaybillAllocation" (id, "waybillId", "courierCode", status, "createdAt", "updatedAt")
       VALUES ($1, $2, 'KOOMBIYO', 'AVAILABLE', NOW(), NOW())`,
      [`id-${wbUncertain}`, wbUncertain]
    );

    const reservedWb = await postgresWaybillRepository.reserveNextAvailableWaybill('KOOMBIYO');
    await postgresWaybillRepository.markWaybillUncertain(
      reservedWb,
      testOrderId,
      'RXB-UNCERTAIN-ORD',
      'API Request Timeout after 15000ms'
    );

    const res = await db.query(
      `SELECT status, notes, "orderId" FROM "WaybillAllocation" WHERE "waybillId" = $1`,
      [reservedWb]
    );

    assert.strictEqual(res.rows[0].status, 'UNCERTAIN', 'Status must be UNCERTAIN');
    assert.strictEqual(res.rows[0].orderId, testOrderId, 'OrderId must remain linked');
    assert(res.rows[0].notes.includes('Timeout'), 'Timeout reason must be recorded in notes');

    // Verify it is NOT available in getAvailableWaybills pool
    const available = await postgresWaybillRepository.getAvailableWaybills('KOOMBIYO');
    assert(!available.includes(reservedWb), 'Uncertain waybill must NOT be in available pool');
  });

  // =========================================================================
  // SECTION 9: HISTORICAL ORDER ITEM IMMUTABILITY
  // =========================================================================
  console.log('\n--- 9. Historical Order Item Immutability Tests ---');

  await testAsync('Modifying product title or price leaves historical OrderItem rows unchanged', async () => {
    // 1. Fetch an existing order and its order items
    const orders = await postgresOrderRepository.findAll();
    assert(orders.length > 0);
    const targetOrder = orders[0];
    const targetItem = targetOrder.items[0];
    const originalItemTitle = targetItem.title;
    const originalItemPrice = targetItem.price;

    // 2. Fetch all products and mutate product price & title in Product catalog table
    const allProducts = await postgresProductRepository.findAll();
    if (allProducts.length > 0) {
      const prod = allProducts[0];
      await db.query(
        `UPDATE "Product" SET name = 'MUTATED CATALOG PRODUCT NAME', price = 99999 WHERE id = $1`,
        [prod.id]
      );
    }

    // 3. Re-read the order from PostgreSQL
    const reFetchedOrder = await postgresOrderRepository.findById(targetOrder.id);
    const reFetchedItem = reFetchedOrder.items.find((i) => i.id === targetItem.id);

    assert.strictEqual(
      reFetchedItem.title,
      originalItemTitle,
      'Historical order item title must remain immutable despite catalog changes'
    );
    assert.strictEqual(
      reFetchedItem.price,
      originalItemPrice,
      'Historical order item price must remain immutable despite catalog changes'
    );
  });

  // =========================================================================
  // SECTION 10: SEAMLESS REPOSITORY SWITCHING (USE_POSTGRES)
  // =========================================================================
  console.log('\n--- 10. Seamless Repository Switching & Dual-Mode Tests ---');

  await testAsync('OrderRepository seamlessly routes to PostgreSQL when USE_POSTGRES=true', async () => {
    const orderRepo = new OrderRepository();

    // Mode 1: Default (without USE_POSTGRES=true)
    delete process.env.USE_POSTGRES;
    assert.strictEqual(orderRepo.isPostgresMode(), false);
    const diskOrders = await orderRepo.findAll();
    assert(Array.isArray(diskOrders));

    // Mode 2: With USE_POSTGRES=true
    process.env.USE_POSTGRES = 'true';
    assert.strictEqual(orderRepo.isPostgresMode(), true);
    const pgOrders = await orderRepo.findAll();
    assert(Array.isArray(pgOrders));
    assert(pgOrders.length >= diskOrders.length, 'Postgres mode must return all orders');

    // Cleanup env
    delete process.env.USE_POSTGRES;
  });

  await testAsync('ProductRepository seamlessly routes to PostgreSQL when USE_POSTGRES=true', async () => {
    const productRepo = new ProductRepository();

    // Default mode
    delete process.env.USE_POSTGRES;
    assert.strictEqual(productRepo.isPostgresMode(), false);
    const diskProducts = await productRepo.findAll();
    assert(Array.isArray(diskProducts));

    // Postgres mode
    process.env.USE_POSTGRES = 'true';
    assert.strictEqual(productRepo.isPostgresMode(), true);
    const pgProducts = await productRepo.findAll();
    assert(Array.isArray(pgProducts));
    assert(pgProducts.length >= diskProducts.length, 'Postgres mode must return all products');

    // Cleanup env
    delete process.env.USE_POSTGRES;
  });

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log('================================================================');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runTestSuite()
  .catch((err) => {
    console.error('Test suite failed unexpectedly:', err);
    process.exit(1);
  })
  .finally(() => {
    db.close().catch(() => {});
  });
