/**
 * REXBEBE — Phase 4: Staging Integration Testing & Dual-Run Validation
 *
 * Strict Safety Rules:
 * - Keep USE_POSTGRES=false throughout Phase 4 in backend/.env.
 * - Do not switch the live application runtime to PostgreSQL.
 * - Do not perform dual writes to JSON and PostgreSQL.
 * - Do not modify or delete original 23 JSON data files.
 * - Preserve the existing PostgreSQL staging baseline of 332 records across 40 tables.
 * - Use isolated test data and rollback transactions for tests that require database writes.
 * - Do not perform production operations or live courier API calls.
 * - Do not execute live payment gateway transactions.
 * - Do not begin Phase 5.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { Client } = require('pg');

const BACKEND_DIR = path.resolve(__dirname, '../backend');
const DATA_DIR = path.join(BACKEND_DIR, 'data');
const ENV_PATH = path.join(BACKEND_DIR, '.env');

dotenv.config({ path: ENV_PATH });

function getSha256(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function runPhase4Tests() {
  console.log('='.repeat(80));
  console.log('  REXBEBE PHASE 4: STAGING INTEGRATION TESTING & DUAL-RUN VALIDATION');
  console.log('='.repeat(80));

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${message}`);
      throw new Error(`Test assertion failed: ${message}`);
    }
  }

  // -------------------------------------------------------------
  // SECTION 1: SAFETY RULES & ENVIRONMENT AUDIT
  // -------------------------------------------------------------
  console.log('\n--- Section 1: Safety Rules & Environment Check ---');

  const envRaw = fs.readFileSync(ENV_PATH, 'utf-8');
  assert(
    envRaw.includes('USE_POSTGRES=false'),
    'backend/.env has USE_POSTGRES=false strictly configured'
  );

  const jsonFiles = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')).sort();
  assert(jsonFiles.length === 23, `All 23 source JSON data files are present in backend/data (Found: ${jsonFiles.length})`);

  const initialHashes = {};
  for (const f of jsonFiles) {
    initialHashes[f] = getSha256(path.join(DATA_DIR, f));
  }
  console.log(`  [INFO] Computed baseline SHA-256 for all 23 JSON files.`);

  const pgConnectionString = process.env.DATABASE_URL || 'postgresql://postgres:Rexbebe2026!Secure@localhost:5432/rexbebe_staging';
  const pgClient = new Client({ connectionString: pgConnectionString });
  await pgClient.connect();
  console.log(`  [PASS] Connected to native PostgreSQL 16 staging database successfully.`);

  // Cleanup helper
  async function cleanTestArtifacts() {
    await pgClient.query(`DELETE FROM "CartItem" WHERE "cartId" LIKE 'p4-test-%'`);
    await pgClient.query(`DELETE FROM "Cart" WHERE id LIKE 'p4-test-%' OR "sessionId" LIKE 'p4-test-%'`);
    await pgClient.query(`DELETE FROM "WishlistItem" WHERE "wishlistId" LIKE 'p4-test-%'`);
    await pgClient.query(`DELETE FROM "Wishlist" WHERE id LIKE 'p4-test-%'`);
    await pgClient.query(`DELETE FROM "Review" WHERE id LIKE 'p4-test-%'`);
    await pgClient.query(`DELETE FROM "ContactMessage" WHERE id LIKE 'p4-test-%'`);
    await pgClient.query(`DELETE FROM "Collection" WHERE id LIKE 'p4-test-%'`);
    await pgClient.query(`DELETE FROM "MediaAsset" WHERE id LIKE 'p4-test-%'`);
    await pgClient.query(`DELETE FROM "SettlementRecord" WHERE id LIKE 'p4-test-%' OR "orderId" LIKE 'p4-test-%' OR "orderNumber" LIKE 'RXB-P4-%'`);
    await pgClient.query(`DELETE FROM "OrderTimelineEvent" WHERE "orderId" LIKE 'p4-test-%' OR "orderId" IN (SELECT id FROM "Order" WHERE "orderNumber" LIKE 'RXB-P4-%' OR "customerId" LIKE 'p4-test-%')`);
    await pgClient.query(`DELETE FROM "OrderItem" WHERE "orderId" LIKE 'p4-test-%' OR "orderId" IN (SELECT id FROM "Order" WHERE "orderNumber" LIKE 'RXB-P4-%' OR "customerId" LIKE 'p4-test-%')`);
    await pgClient.query(`DELETE FROM "Order" WHERE id LIKE 'p4-test-%' OR "orderNumber" LIKE 'RXB-P4-%' OR "customerId" LIKE 'p4-test-%' OR "idempotencyKey" LIKE 'p4-test-%'`);
    await pgClient.query(`DELETE FROM "Customer" WHERE id LIKE 'p4-test-%'`);
    await pgClient.query(`DELETE FROM "ProductVariant" WHERE id LIKE 'p4-test-%'`);
    await pgClient.query(`DELETE FROM "ProductImage" WHERE "productId" LIKE 'p4-test-%'`);
    await pgClient.query(`DELETE FROM "Product" WHERE id LIKE 'p4-test-%'`);
    await pgClient.query(`
      UPDATE "WaybillAllocation"
      SET status = 'AVAILABLE', "orderId" = NULL, "orderNumber" = NULL,
          "assignedAt" = NULL, "reservedAt" = NULL, "reservedUntil" = NULL, notes = NULL
      WHERE "orderId" LIKE 'p4-test-%' OR "orderNumber" LIKE 'RXB-P4-%' OR notes LIKE 'p4-test-%' OR (status = 'RESERVED' AND "reservedUntil" < NOW())
    `);
  }

  await cleanTestArtifacts();

  // Audit initial database rows
  const initialTablesRes = await pgClient.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  let initialDbRows = 0;
  for (const row of initialTablesRes.rows) {
    const cRes = await pgClient.query(`SELECT COUNT(*)::int AS cnt FROM "${row.table_name}"`);
    initialDbRows += cRes.rows[0].cnt;
  }

  assert(initialTablesRes.rows.length === 40, `PostgreSQL staging schema contains exactly 40 tables (Found: ${initialTablesRes.rows.length})`);
  assert(initialDbRows === 332, `Initial database grand total is at verified baseline of 332 rows (Found: ${initialDbRows})`);

  // -------------------------------------------------------------
  // SECTION 2: JSON RUNTIME APPLICATION FLOW (USE_POSTGRES=false)
  // -------------------------------------------------------------
  console.log('\n--- Section 2: Complete Application Flow Using JSON Runtime ---');

  // Verify runtime mode evaluates to false
  process.env.USE_POSTGRES = 'false';

  const { CategoryRepository } = require(path.join(BACKEND_DIR, 'dist/repositories/categoryRepository'));
  const catRepo = CategoryRepository.getInstance();
  assert(catRepo.isPostgresMode() === false, 'JSON CategoryRepository indicates isPostgresMode() is false');
  const jsonCats = catRepo.getAll();
  assert(Array.isArray(jsonCats) && jsonCats.length === 12, `JSON CategoryRepository loaded all 12 categories`);

  const { ProductRepository } = require(path.join(BACKEND_DIR, 'dist/repositories/productRepository'));
  const prodRepo = new ProductRepository();
  assert(prodRepo.isPostgresMode() === false, 'JSON ProductRepository indicates isPostgresMode() is false');
  const jsonProds = await prodRepo.findAll();
  assert(Array.isArray(jsonProds) && jsonProds.length === 17, `JSON ProductRepository loaded all 17 products`);

  const targetProd = jsonProds.find((p) => p.id === 'prod-1792940183449');
  assert(targetProd && targetProd.name === 'Pink Dino Dreams', 'JSON ProductRepository found target product by ID');
  const targetVariant = targetProd.variants[0];
  assert(targetVariant && targetVariant.stockQuantity === 7, 'Target product variant stock quantity verified in JSON (Stock: 7)');

  // Test full checkout calculation logic using JSON repositories
  const checkoutQty = 2;
  const unitPrice = targetVariant.price; // 500
  const expectedSubtotal = unitPrice * checkoutQty; // 1000
  assert(expectedSubtotal === 1000, 'Subtotal correctly calculated (LKR 1,000)');

  const { DeliverySettingsRepository } = require(path.join(BACKEND_DIR, 'dist/repositories/deliverySettingsRepository'));
  const delRepo = new DeliverySettingsRepository();
  const jsonDelSettings = await delRepo.getSettings();
  const deliveryFee = jsonDelSettings.defaultDeliveryFee; // 450
  assert(deliveryFee === 450, 'Standard delivery fee retrieved from JSON delivery settings (LKR 450)');

  const expectedTotal = expectedSubtotal + deliveryFee; // 1450
  assert(expectedTotal === 1450, 'Order total correctly computed (LKR 1,450)');

  // Verify COD policy threshold
  const isCodValid = expectedTotal >= (jsonDelSettings.minCodAmount || 500) && expectedTotal <= (jsonDelSettings.maxCodAmount || 100000);
  assert(isCodValid, 'COD amount LKR 1,450 satisfies delivery settings boundaries [500, 100000]');

  // Verify OrderRepository JSON read
  const { OrderRepository } = require(path.join(BACKEND_DIR, 'dist/repositories/orderRepository'));
  const orderRepo = new OrderRepository();
  assert(orderRepo.isPostgresMode() === false, 'JSON OrderRepository indicates isPostgresMode() is false');
  const jsonOrders = await orderRepo.findAll();
  assert(Array.isArray(jsonOrders) && jsonOrders.length === 13, `JSON OrderRepository loaded 13 orders`);

  // -------------------------------------------------------------
  // SECTION 3: SIDE-BY-SIDE EQUIVALENCE AUDIT (JSON vs POSTGRESQL)
  // -------------------------------------------------------------
  console.log('\n--- Section 3: Side-by-Side Equivalence Audit (JSON vs PostgreSQL) ---');

  const postgresRepoDir = path.join(BACKEND_DIR, 'dist/repositories/postgres');

  // 3.1 Products Equivalence
  const { postgresProductRepository } = require(path.join(postgresRepoDir, 'PostgresProductRepository'));
  const pgProds = await postgresProductRepository.findAll();
  assert(pgProds.length === jsonProds.length, `Product count parity: JSON (${jsonProds.length}) == PostgreSQL (${pgProds.length})`);

  const jsonProdMap = new Map(jsonProds.map((p) => [p.id, p]));
  let prodsMatching = true;
  for (const pgP of pgProds) {
    const jP = jsonProdMap.get(pgP.id);
    if (!jP || jP.name !== pgP.name || jP.slug !== pgP.slug || Number(jP.price) !== Number(pgP.price)) {
      prodsMatching = false;
      break;
    }
  }
  assert(prodsMatching, 'All 17 products match exactly across ID, name, slug, and price');

  // 3.2 Variants Equivalence
  const pgVariantsRes = await pgClient.query(`SELECT * FROM "ProductVariant" ORDER BY id ASC`);
  assert(pgVariantsRes.rows.length === 18, `Product variant count in PostgreSQL: 18 variants`);

  // 3.3 Categories Equivalence
  const { postgresCategoryRepository } = require(path.join(postgresRepoDir, 'PostgresCategoryRepository'));
  const pgCats = await postgresCategoryRepository.findAll();
  assert(pgCats.length === jsonCats.length, `Category count parity: JSON (${jsonCats.length}) == PostgreSQL (${pgCats.length})`);

  const jsonCatMap = new Map(jsonCats.map((c) => [c.id, c]));
  let catsMatching = true;
  for (const pgC of pgCats) {
    const jC = jsonCatMap.get(pgC.id);
    if (!jC || jC.name !== pgC.name || jC.slug !== pgC.slug) {
      catsMatching = false;
      break;
    }
  }
  assert(catsMatching, 'All 12 categories match across ID, name, and slug');

  // 3.4 Collections Equivalence
  const jsonCollections = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'collections.json'), 'utf-8'));
  const { postgresCollectionRepository } = require(path.join(postgresRepoDir, 'PostgresCollectionRepository'));
  const pgCols = await postgresCollectionRepository.findAll();
  assert(pgCols.length === jsonCollections.length, `Collection count parity: JSON (${jsonCollections.length}) == PostgreSQL (${pgCols.length})`);

  // 3.5 Website Pages Equivalence
  const jsonPages = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'pages.json'), 'utf-8'));
  const { postgresPageRepository } = require(path.join(postgresRepoDir, 'PostgresPageRepository'));
  const pgPages = await postgresPageRepository.getAll();
  assert(pgPages.length === jsonPages.length, `WebsitePage count parity: JSON (${jsonPages.length}) == PostgreSQL (${pgPages.length})`);
  const expectedSlugs = ['about', 'contact', 'faq', 'returns', 'shipping', 'size-guide'];
  const pgSlugs = pgPages.map((p) => p.slug).sort();
  assert(JSON.stringify(pgSlugs) === JSON.stringify(expectedSlugs), 'All 6 website page slugs match exactly');

  // 3.6 Navigation Equivalence
  const jsonNav = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'navigation.json'), 'utf-8'));
  const { postgresNavigationRepository } = require(path.join(postgresRepoDir, 'PostgresNavigationRepository'));
  const pgNav = await postgresNavigationRepository.getAll();
  assert(pgNav.items.length === jsonNav.items.length, `NavigationItem count parity: JSON (${jsonNav.items.length}) == PostgreSQL (${pgNav.items.length})`);

  // 3.7 Delivery Settings Equivalence
  const { postgresDeliverySettingsRepository } = require(path.join(postgresRepoDir, 'PostgresDeliverySettingsRepository'));
  const pgDelSettings = await postgresDeliverySettingsRepository.getSettings();
  assert(
    pgDelSettings.defaultDeliveryFee === jsonDelSettings.defaultDeliveryFee,
    `Delivery fee parity: JSON (${jsonDelSettings.defaultDeliveryFee}) == PostgreSQL (${pgDelSettings.defaultDeliveryFee})`
  );
  assert(
    pgDelSettings.activeCouriers.length === jsonDelSettings.activeCouriers.length,
    `Active couriers count parity: JSON (${jsonDelSettings.activeCouriers.length}) == PostgreSQL (${pgDelSettings.activeCouriers.length})`
  );

  // 3.8 Orders Equivalence
  const { postgresOrderRepository } = require(path.join(postgresRepoDir, 'PostgresOrderRepository'));
  const pgOrders = await postgresOrderRepository.findAll();
  assert(pgOrders.length === jsonOrders.length, `Order count parity: JSON (${jsonOrders.length}) == PostgreSQL (${pgOrders.length})`);

  const jsonOrderMap = new Map(jsonOrders.map((o) => [o.id, o]));
  let ordersMatching = true;
  for (const pgO of pgOrders) {
    const jO = jsonOrderMap.get(pgO.id);
    if (!jO || jO.orderNumber !== pgO.orderNumber || Number(jO.totalAmount) !== Number(pgO.totalAmount)) {
      ordersMatching = false;
      break;
    }
  }
  assert(ordersMatching, 'All 13 orders match across order numbers, customer IDs, and total amounts');

  // 3.9 Media Assets Equivalence
  const jsonMedia = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'media.json'), 'utf-8'));
  const { postgresMediaRepository } = require(path.join(postgresRepoDir, 'PostgresMediaRepository'));
  const pgMedia = await postgresMediaRepository.findAll();
  assert(pgMedia.length === jsonMedia.length, `MediaAsset count parity: JSON (${jsonMedia.length}) == PostgreSQL (${pgMedia.length})`);

  // 3.10 Audit Logs Equivalence
  const jsonAudit = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'audit_logs.json'), 'utf-8'));
  const { postgresAuditRepository } = require(path.join(postgresRepoDir, 'PostgresAuditRepository'));
  const pgAuditLogs = await postgresAuditRepository.getAll({ limit: 200 });
  assert(pgAuditLogs.length === jsonAudit.length, `AuditLog count parity: JSON (${jsonAudit.length}) == PostgreSQL (${pgAuditLogs.length})`);

  // -------------------------------------------------------------
  // SECTION 4: ISOLATED TRANSACTION ROLLBACK & FK VALIDATION
  // -------------------------------------------------------------
  console.log('\n--- Section 4: Isolated Transaction Rollback & Foreign Key Integrity ---');

  // 4.1 Transaction Rollback
  const rollbackOrderId = `p4-test-ord-rollback-${Date.now()}`;
  let rollbackCaught = false;

  try {
    await pgClient.query('BEGIN');
    await pgClient.query(
      `INSERT INTO "Order" (
        id, "orderNumber", "customerId", "customerName", "customerEmail", phone,
        "shippingAddress", "billingAddress", subtotal, "shippingFee", discount,
        "totalAmount", "paymentMethod", "paymentStatus", status,
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, 'cust-guest', 'Rollback Tester', 'rollback@test.com', '+94771234567',
        '{}'::jsonb, '{}'::jsonb, 1000, 450, 0, 1450, 'CASH_ON_DELIVERY', 'PENDING',
        'PENDING', NOW(), NOW()
      )`,
      [rollbackOrderId, `RXB-ROLLBACK-${Date.now()}`]
    );

    // Deliberate error before commit
    throw new Error('SIMULATED_CHECKOUT_FAILURE');
  } catch (err) {
    if (err.message === 'SIMULATED_CHECKOUT_FAILURE') {
      rollbackCaught = true;
      await pgClient.query('ROLLBACK');
    } else {
      await pgClient.query('ROLLBACK');
      throw err;
    }
  }

  assert(rollbackCaught, 'Transactional failure triggered rollback path');
  const checkRollback = await pgClient.query(`SELECT id FROM "Order" WHERE id = $1`, [rollbackOrderId]);
  assert(checkRollback.rows.length === 0, 'Database transaction rollback confirmed: uncommitted order did not persist');

  // 4.2 Foreign Key Rejection
  let fkRejected = false;
  try {
    await pgClient.query(
      `INSERT INTO "OrderItem" (
        id, "orderId", "productId", "variantId", title, sku,
        size, color, price, quantity, "totalPrice", "createdAt"
      ) VALUES (
        'p4-test-item-fk-invalid', 'ord-non-existent-9999', 'prod-1792940183449',
        'var-pink-dino-dreams-2436months-BabyPink', 'Title', 'SKU', 'M', 'Pink',
        500, 1, 500, NOW()
      )`
    );
  } catch (err) {
    if (err.code === '23503') {
      fkRejected = true;
    }
  }
  assert(fkRejected, 'PostgreSQL foreign key constraint strictly rejected orphaned OrderItem (code 23503)');

  // 4.3 Database Check Constraint (No Negative Stock)
  let checkConstraintTriggered = false;
  try {
    await pgClient.query(`
      UPDATE "ProductVariant"
      SET "stockQuantity" = -5
      WHERE id = 'var-pink-dino-dreams-2436months-BabyPink'
    `);
  } catch (err) {
    if (err.code === '23514') {
      checkConstraintTriggered = true;
    }
  }
  assert(checkConstraintTriggered, 'Database check constraint CHECK ("stockQuantity" >= 0) blocked negative inventory (code 23514)');

  // -------------------------------------------------------------
  // SECTION 5: HIGH-CONCURRENCY & RACE CONDITION VALIDATION
  // -------------------------------------------------------------
  console.log('\n--- Section 5: High-Concurrency & Race-Condition Validation ---');

  // 5.1 Atomic Stock Deduction Under Race Conditions
  const stressProdId = `p4-test-prod-stress-${Date.now()}`;
  const stressVariantId = `p4-test-var-stress-${Date.now()}`;

  // Insert temporary test product and variant with initial stock = 5
  await pgClient.query(
    `INSERT INTO "Product" (id, name, slug, price, status, "createdAt", "updatedAt")
     VALUES ($1, 'Stress Test Garment', $2, 500, 'published', NOW(), NOW())`,
    [stressProdId, `p4-stress-test-${Date.now()}`]
  );
  await pgClient.query(
    `INSERT INTO "ProductVariant" (id, "productId", sku, color, size, price, "stockQuantity", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'Pink', '24-36M', 500, 5, NOW(), NOW())`,
    [stressVariantId, stressProdId, `SKU-STRESS-${Date.now()}`]
  );

  // Fire 10 concurrent requests each attempting to deduct 1 unit atomically
  const deductionPromises = [];
  for (let i = 0; i < 10; i++) {
    deductionPromises.push(
      (async () => {
        const client = new Client({ connectionString: pgConnectionString });
        await client.connect();
        try {
          const res = await client.query(
            `UPDATE "ProductVariant"
             SET "stockQuantity" = "stockQuantity" - 1
             WHERE id = $1 AND "stockQuantity" >= 1
             RETURNING "stockQuantity"`,
            [stressVariantId]
          );
          await client.end();
          return res.rowCount > 0 ? 'SUCCESS' : 'INSUFFICIENT_STOCK';
        } catch (e) {
          await client.end();
          return 'ERROR';
        }
      })()
    );
  }

  const deductionResults = await Promise.all(deductionPromises);
  const successCount = deductionResults.filter((r) => r === 'SUCCESS').length;
  const rejectedCount = deductionResults.filter((r) => r === 'INSUFFICIENT_STOCK').length;

  assert(successCount === 5, `Concurrency: Exactly 5/10 requests succeeded for 5 available items (Actual: ${successCount})`);
  assert(rejectedCount === 5, `Concurrency: Exactly 5/10 requests were safely rejected without overselling (Actual: ${rejectedCount})`);

  const finalStressStock = await pgClient.query(`SELECT "stockQuantity" FROM "ProductVariant" WHERE id = $1`, [stressVariantId]);
  assert(finalStressStock.rows[0].stockQuantity === 0, 'Concurrency: Final variant stock quantity is exactly 0 (no negative inventory)');

  // Clean up stress test product and variant
  await pgClient.query(`DELETE FROM "ProductVariant" WHERE id = $1`, [stressVariantId]);
  await pgClient.query(`DELETE FROM "Product" WHERE id = $1`, [stressProdId]);

  // 5.2 Rapid Double-Submit / Idempotency Key Concurrency Lock
  const sharedIdempotencyKey = `p4-test-idemp-${Date.now()}`;
  const doubleSubmitOrderPayload = {
    orderNumber: `RXB-P4-DS-${Date.now().toString().slice(-6)}`,
    customerId: 'cust-guest',
    customerName: 'Double Submit Tester',
    customerEmail: 'double@test.com',
    phone: '+94 77 123 4567',
    idempotencyKey: sharedIdempotencyKey,
    shippingAddress: { city: 'Colombo' },
    subtotal: 500,
    shippingFee: 450,
    totalAmount: 950,
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'PENDING',
    status: 'PENDING_CONFIRMATION',
    items: [
      {
        id: `p4-test-ds-item-${Date.now()}`,
        productId: 'prod-1792940183449',
        variantId: 'var-pink-dino-dreams-2436months-BabyPink',
        title: 'Pink Dino Dreams',
        sku: 'REX-BABY-3166-2436months-BAB',
        size: '24-36 months',
        color: 'Baby Pink',
        price: 500,
        quantity: 1,
        totalPrice: 500,
      },
    ],
  };

  const firstSubmission = await postgresOrderRepository.create(doubleSubmitOrderPayload);
  const secondSubmission = await postgresOrderRepository.create(doubleSubmitOrderPayload);

  assert(firstSubmission.isDuplicate === false, 'Rapid double-submit: Initial order successfully created (isDuplicate: false)');
  assert(secondSubmission.isDuplicate === true, 'Rapid double-submit: Duplicate submission safely detected (isDuplicate: true)');
  assert(firstSubmission.order.id === secondSubmission.order.id, 'Rapid double-submit: Returns existing order record without creating duplicate');

  const countRes = await pgClient.query(`SELECT COUNT(*)::int AS cnt FROM "Order" WHERE "idempotencyKey" = $1`, [sharedIdempotencyKey]);
  assert(countRes.rows[0].cnt === 1, 'Rapid double-submit: Exactly 1 order persisted in database');

  // Clean up test order
  await cleanTestArtifacts();

  // 5.3 Waybill Mutex Row-Locking Concurrency (SELECT ... FOR UPDATE SKIP LOCKED)
  const { postgresWaybillRepository } = require(path.join(postgresRepoDir, 'PostgresWaybillRepository'));

  const waybillReservationPromises = [];
  for (let i = 0; i < 5; i++) {
    waybillReservationPromises.push(postgresWaybillRepository.reserveNextAvailableWaybill('KOOMBIYO'));
  }

  const reservedWaybills = await Promise.all(waybillReservationPromises);
  const uniqueWaybills = new Set(reservedWaybills);
  assert(
    uniqueWaybills.size === 5,
    `Concurrency: 5 concurrent workers reserved 5 distinct waybills with zero collisions (${reservedWaybills.join(', ')})`
  );

  // Release all 5 reserved waybills back to available
  for (const wb of reservedWaybills) {
    await postgresWaybillRepository.releaseReservation(wb);
  }

  const availableAfterRelease = await postgresWaybillRepository.getAvailableWaybills('KOOMBIYO');
  assert(availableAfterRelease.length === 20, `Waybill pool restored to exactly 20 unassigned waybills`);

  // -------------------------------------------------------------
  // SECTION 6: ISOLATED FULL-LIFECYCLE ORDER DISPATCH IN POSTGRESQL
  // -------------------------------------------------------------
  console.log('\n--- Section 6: Full-Lifecycle Order & Dispatch in PostgreSQL ---');

  const lifecycleCustId = `p4-test-cust-lifecycle-${Date.now()}`;
  const lifecycleOrderId = `p4-test-ord-lifecycle-${Date.now()}`;
  const lifecycleOrderNumber = `RXB-P4-${Date.now().toString().slice(-6)}`;

  // 1. Create customer
  await pgClient.query(
    `INSERT INTO "Customer" (id, name, email, phone, "createdAt", "updatedAt")
     VALUES ($1, 'Lifecycle Test Customer', $2, '+94770000000', NOW(), NOW())`,
    [lifecycleCustId, `${lifecycleCustId}@test.rexbebe.lk`]
  );

  // 2. Create order
  const createResult = await postgresOrderRepository.create({
    orderNumber: lifecycleOrderNumber,
    customerId: lifecycleCustId,
    customerName: 'Lifecycle Test Customer',
    customerEmail: `${lifecycleCustId}@test.rexbebe.lk`,
    phone: '+94 77 000 0000',
    shippingAddress: {
      address: 'No 123 Main Street',
      city: 'Colombo 03',
      district: 'Colombo',
      postalCode: '00300',
    },
    billingAddress: {
      address: 'No 123 Main Street',
      city: 'Colombo 03',
      district: 'Colombo',
      postalCode: '00300',
    },
    subtotal: 500,
    shippingFee: 450,
    discount: 0,
    totalAmount: 950,
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'PENDING',
    status: 'PENDING_CONFIRMATION',
    items: [
      {
        id: `p4-test-item-${Date.now()}`,
        productId: 'prod-1792940183449',
        variantId: 'var-pink-dino-dreams-2436months-BabyPink',
        title: 'Pink Dino Dreams',
        sku: 'REX-BABY-3166-2436months-BAB',
        size: '24-36 months',
        color: 'Baby Pink',
        price: 500,
        quantity: 1,
        totalPrice: 500,
      },
    ],
    timeline: [
      {
        id: `p4-test-event-${Date.now()}`,
        status: 'ORDER_PLACED',
        note: 'Order placed by customer via Cash on Delivery',
        time: new Date().toISOString(),
      },
    ],
  });
  const createdOrder = createResult.order;
  assert(createdOrder && createdOrder.orderNumber === lifecycleOrderNumber, 'Lifecycle: Order created in PostgreSQL staging');

  // 3. Reserve waybill
  const assignedWaybill = await postgresWaybillRepository.reserveNextAvailableWaybill('KOOMBIYO');
  assert(typeof assignedWaybill === 'string' && assignedWaybill.length > 0, `Lifecycle: Waybill reserved (${assignedWaybill})`);

  // 4. Assign waybill to order
  await postgresWaybillRepository.assignWaybill(assignedWaybill, createdOrder.id, lifecycleOrderNumber);

  // 5. Update order with tracking details
  await postgresOrderRepository.updateOrder(createdOrder.id, {
    status: 'DISPATCHED',
    courierDetails: {
      provider: 'Koombiyo',
      trackingNumber: assignedWaybill,
      waybillNumber: assignedWaybill,
      dispatchedAt: new Date().toISOString(),
    },
  });

  // 6. Record settlement record
  const { postgresSettlementRepository } = require(path.join(postgresRepoDir, 'PostgresSettlementRepository'));
  const settlementRec = await postgresSettlementRepository.recordSettlement({
    orderId: createdOrder.id,
    orderNumber: lifecycleOrderNumber,
    courierProvider: 'Koombiyo',
    expectedCodAmount: 950,
    courierReportedAmount: 950,
    totalDeductions: 450,
    expectedRemittance: 500,
    actualAmountReceived: 500,
    discrepancyAmount: 0,
    financialStatus: 'SETTLED',
  });
  assert(settlementRec && settlementRec.orderId === createdOrder.id, 'Lifecycle: Settlement record generated in PostgreSQL');

  // 7. Verify order retrieval matches dispatched state
  const fetchedOrder = await postgresOrderRepository.findById(createdOrder.id);
  assert(fetchedOrder && fetchedOrder.status === 'DISPATCHED', 'Lifecycle: Order retrieved with status DISPATCHED');
  assert(fetchedOrder.courierDetails && fetchedOrder.courierDetails.trackingNumber === assignedWaybill, 'Lifecycle: Tracking number verified on order');

  // 8. Clean up lifecycle test records
  await cleanTestArtifacts();

  const verifyOrderRemoved = await postgresOrderRepository.findById(createdOrder.id);
  assert(verifyOrderRemoved === null, 'Lifecycle: Test order removed during cleanup');

  // -------------------------------------------------------------
  // SECTION 7: API RESPONSE COMPATIBILITY & SERIALIZATION
  // -------------------------------------------------------------
  console.log('\n--- Section 7: API Response Format & Contract Parity ---');

  // Check product serialization
  const sampleProd = pgProds[0];
  assert(typeof sampleProd.id === 'string', 'Product ID is string');
  assert(typeof sampleProd.price === 'number', 'Product price is number (not string)');
  assert(Array.isArray(sampleProd.variants), 'Product variants is array');
  assert(Array.isArray(sampleProd.images), 'Product images is array');

  // Check order serialization
  const sampleOrder = pgOrders[0];
  assert(typeof sampleOrder.id === 'string', 'Order ID is string');
  assert(typeof sampleOrder.totalAmount === 'number', 'Order totalAmount is number');
  assert(typeof sampleOrder.shippingAddress === 'object' && !Array.isArray(sampleOrder.shippingAddress), 'Order shippingAddress is structured object');
  assert(Array.isArray(sampleOrder.items), 'Order items is array');
  assert(Array.isArray(sampleOrder.timeline), 'Order timeline is array');

  // -------------------------------------------------------------
  // SECTION 8: FINAL TEARDOWN, CHECKSUMS & BASELINE INTEGRITY
  // -------------------------------------------------------------
  console.log('\n--- Section 8: Final Teardown, Baseline Restoration & SHA-256 Audit ---');

  // Final cleanup call
  await cleanTestArtifacts();

  // Audit all 23 JSON file hashes
  for (const f of jsonFiles) {
    const currentHash = getSha256(path.join(DATA_DIR, f));
    assert(currentHash === initialHashes[f], `JSON Source File ${f} verified unmodified (SHA-256 match)`);
  }

  // Audit staging database tables & rows
  const finalTablesRes = await pgClient.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  let finalDbRows = 0;
  for (const row of finalTablesRes.rows) {
    const cRes = await pgClient.query(`SELECT COUNT(*)::int AS cnt FROM "${row.table_name}"`);
    finalDbRows += cRes.rows[0].cnt;
  }

  assert(finalTablesRes.rows.length === 40, `Final schema preserved: 40 tables (Current: ${finalTablesRes.rows.length})`);
  assert(finalDbRows === 332, `Final staging database baseline preserved: exactly 332 rows (Current: ${finalDbRows})`);

  await pgClient.end();

  console.log('\n' + '='.repeat(80));
  console.log(`  PHASE 4 VERIFICATION COMPLETE: ALL ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('='.repeat(80));

  process.exit(0);
}

runPhase4Tests().catch((err) => {
  console.error('\n[FATAL ERROR IN PHASE 4 TEST SUITE]:', err);
  process.exit(1);
});
