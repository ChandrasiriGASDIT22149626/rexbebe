/**
 * REXBEBE — Phase 3 Comprehensive Repository Modernization Verification
 *
 * Strict Requirements:
 * - Verify USE_POSTGRES=false in backend/.env
 * - Zero modification/corruption of original 23 JSON data files
 * - Test all 20+ repository interfaces in both JSON fallback mode and PostgreSQL mode
 * - Clean up any test records so staging database returns to baseline (332 rows across 29 tables)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { Client } = require('pg');

const BACKEND_DIR = path.resolve(__dirname, '../backend');
const DATA_DIR = path.join(BACKEND_DIR, 'data');
const ENV_PATH = path.join(BACKEND_DIR, '.env');

// Load environment variables
dotenv.config({ path: ENV_PATH });

function getSha256(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function runPhase3Tests() {
  console.log('='.repeat(80));
  console.log('  REXBEBE PHASE 3: REPOSITORY MODERNIZATION VERIFICATION TEST SUITE');
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
  // TEST SECTION 1: SAFETY RULES & ENVIRONMENT INTEGRITY
  // -------------------------------------------------------------
  console.log('\n--- Section 1: Safety Rules & Environment Check ---');

  const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
  assert(/USE_POSTGRES=false/.test(envContent), 'backend/.env has USE_POSTGRES=false strictly configured');

  const jsonFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  assert(jsonFiles.length === 23, `All 23 source JSON data files are present in backend/data (Found: ${jsonFiles.length})`);

  // Snapshot initial SHA-256 hashes
  const initialHashes = {};
  for (const f of jsonFiles) {
    initialHashes[f] = getSha256(path.join(DATA_DIR, f));
  }
  console.log(`  [INFO] Computed baseline SHA-256 for all 23 JSON files.`);

  // Verify PostgreSQL connection
  const pgClient = new Client({
    connectionString: 'postgresql://postgres:Rexbebe2026!Secure@localhost:5432/rexbebe_staging'
  });
  await pgClient.connect();
  const dbVer = await pgClient.query('SELECT version()');
  assert(dbVer.rows.length > 0 && dbVer.rows[0].version.includes('PostgreSQL 16'), 'Native PostgreSQL 16 is live and connected on localhost:5432');

  const initialCountRes = await pgClient.query(`
    SELECT SUM(n_live_tup)::int AS total
    FROM pg_stat_user_tables
    WHERE schemaname = 'public';
  `);
  console.log(`  [INFO] Connected to rexbebe_staging successfully.`);

  // -------------------------------------------------------------
  // TEST SECTION 2: COMPILED BACKEND REPOSITORIES INSPECTION
  // -------------------------------------------------------------
  console.log('\n--- Section 2: PostgreSQL Repositories Coverage ---');

  const postgresRepoDir = path.join(BACKEND_DIR, 'dist/repositories/postgres');
  assert(fs.existsSync(postgresRepoDir), 'Compiled postgres repositories directory exists (dist/repositories/postgres)');

  const expectedPostgresRepos = [
    'PostgresAdminUserRepository.js',
    'PostgresAuditRepository.js',
    'PostgresCartRepository.js',
    'PostgresCategoryRepository.js',
    'PostgresCollectionRepository.js',
    'PostgresContactRepository.js',
    'PostgresCustomerRepository.js',
    'PostgresDeliverySettingsRepository.js',
    'PostgresInventoryRepository.js',
    'PostgresMediaRepository.js',
    'PostgresNavigationRepository.js',
    'PostgresNotificationRepository.js',
    'PostgresOrderRepository.js',
    'PostgresPageRepository.js',
    'PostgresProductRepository.js',
    'PostgresReviewRepository.js',
    'PostgresSettingsRepository.js',
    'PostgresSettlementRepository.js',
    'PostgresWaybillRepository.js',
  ];

  for (const repoFile of expectedPostgresRepos) {
    const exists = fs.existsSync(path.join(postgresRepoDir, repoFile));
    assert(exists, `Repository compiled: ${repoFile}`);
  }

  async function cleanTestRecords() {
    await pgClient.query(`DELETE FROM "CartItem" WHERE "cartId" LIKE 'cart-test-%'`);
    await pgClient.query(`DELETE FROM "Cart" WHERE id LIKE 'cart-test-%' OR "sessionId" LIKE 'cart-test-%'`);
    await pgClient.query(`DELETE FROM "WishlistItem" WHERE "wishlistId" LIKE 'wl-test-%'`);
    await pgClient.query(`DELETE FROM "Wishlist" WHERE id LIKE 'wl-test-%'`);
    await pgClient.query(`DELETE FROM "Customer" WHERE id LIKE 'wl-test-%' OR id LIKE 'cust-test-%'`);
    await pgClient.query(`DELETE FROM "Review" WHERE id LIKE 'rev-test-%'`);
    await pgClient.query(`DELETE FROM "ContactMessage" WHERE id LIKE 'msg-test-%'`);
    await pgClient.query(`DELETE FROM "Collection" WHERE id LIKE 'col-test-%'`);
    await pgClient.query(`DELETE FROM "MediaAsset" WHERE id LIKE 'media-test-%'`);
  }
  await cleanTestRecords();

  // -------------------------------------------------------------
  // TEST SECTION 3: DIRECT TESTING OF EACH POSTGRESQL REPOSITORY
  // -------------------------------------------------------------
  console.log('\n--- Section 3: Direct PostgreSQL Repositories Functional Testing ---');

  // Set DB config for imported modules
  process.env.DATABASE_URL = 'postgresql://postgres:Rexbebe2026!Secure@localhost:5432/rexbebe_staging';

  // 3.1 PostgresCollectionRepository
  const { postgresCollectionRepository } = require(path.join(postgresRepoDir, 'PostgresCollectionRepository'));
  const collections = await postgresCollectionRepository.findAll();
  assert(Array.isArray(collections) && collections.length > 0, `PostgresCollectionRepository.findAll() returned ${collections.length} collections`);
  const testColId = `col-test-${Date.now()}`;
  const createdCol = await postgresCollectionRepository.create({
    id: testColId,
    name: 'Phase 3 Test Capsule',
    slug: `phase-3-test-${Date.now()}`,
    description: 'Automated test capsule',
    status: 'draft',
    order: 99,
  });
  assert(createdCol.id === testColId, 'PostgresCollectionRepository.create() creates collection in DB');
  const foundCol = await postgresCollectionRepository.findById(testColId);
  assert(foundCol && foundCol.name === 'Phase 3 Test Capsule', 'PostgresCollectionRepository.findById() returns created item');
  const updatedCol = await postgresCollectionRepository.update(testColId, { name: 'Phase 3 Updated Capsule' });
  assert(updatedCol && updatedCol.name === 'Phase 3 Updated Capsule', 'PostgresCollectionRepository.update() updates item');
  const delCol = await postgresCollectionRepository.delete(testColId);
  assert(delCol === true, 'PostgresCollectionRepository.delete() removes item');

  // 3.2 PostgresMediaRepository
  const { postgresMediaRepository } = require(path.join(postgresRepoDir, 'PostgresMediaRepository'));
  const mediaList = await postgresMediaRepository.findAll();
  assert(Array.isArray(mediaList) && mediaList.length > 0, `PostgresMediaRepository.findAll() returned ${mediaList.length} media assets`);
  const testMediaId = `media-test-${Date.now()}`;
  const createdMedia = await postgresMediaRepository.create({
    id: testMediaId,
    name: 'phase3-test.webp',
    url: '/uploads/phase3-test.webp',
    category: 'general',
  });
  assert(createdMedia.id === testMediaId, 'PostgresMediaRepository.create() creates media asset in DB');
  const delMedia = await postgresMediaRepository.delete(testMediaId);
  assert(delMedia === true, 'PostgresMediaRepository.delete() removes media asset');

  // 3.3 PostgresCartRepository
  const { postgresCartRepository } = require(path.join(postgresRepoDir, 'PostgresCartRepository'));
  const testCartId = `cart-test-${Date.now()}`;
  await postgresCartRepository.saveCart(testCartId, [{ variantId: 'var-pink-dino-dreams-2436months-BabyPink', quantity: 2 }]);
  const retrievedCart = await postgresCartRepository.getCart(testCartId);
  assert(retrievedCart && retrievedCart.items.length === 1 && retrievedCart.items[0].quantity === 2, 'PostgresCartRepository saveCart/getCart works with items');
  await postgresCartRepository.clearCart(testCartId);
  const clearedCart = await postgresCartRepository.getCart(testCartId);
  assert(clearedCart && clearedCart.items.length === 0, 'PostgresCartRepository.clearCart() clears items');
  // Clean up test cart
  await pgClient.query(`DELETE FROM "Cart" WHERE id = $1`, [testCartId]);

  // 3.4 PostgresWishlistRepository
  const { postgresWishlistRepository } = require(path.join(postgresRepoDir, 'PostgresWishlistRepository'));
  const testWishlistId = `wl-test-${Date.now()}`;
  await postgresWishlistRepository.saveWishlist(testWishlistId, ['prod-1792939920902']);
  const retrievedWishlist = await postgresWishlistRepository.getWishlist(testWishlistId);
  assert(retrievedWishlist && retrievedWishlist.productIds.includes('prod-1792939920902'), 'PostgresWishlistRepository saveWishlist/getWishlist works');
  await postgresWishlistRepository.clearWishlist(testWishlistId);
  const clearedWishlist = await postgresWishlistRepository.getWishlist(testWishlistId);
  assert(clearedWishlist && clearedWishlist.productIds.length === 0, 'PostgresWishlistRepository.clearWishlist() clears items');
  // Clean up test wishlist & placeholder customer
  await pgClient.query(`DELETE FROM "Wishlist" WHERE id = $1`, [testWishlistId]);
  await pgClient.query(`DELETE FROM "Customer" WHERE id = $1`, [testWishlistId]);

  // 3.5 PostgresSettingsRepository
  const { postgresSettingsRepository } = require(path.join(postgresRepoDir, 'PostgresSettingsRepository'));
  const storeSettings = await postgresSettingsRepository.getStoreSettings();
  assert(storeSettings !== null && typeof storeSettings === 'object', 'PostgresSettingsRepository.getStoreSettings() returns settings');
  const homepageConfig = await postgresSettingsRepository.getHomepageConfig();
  assert(homepageConfig !== null && typeof homepageConfig === 'object', 'PostgresSettingsRepository.getHomepageConfig() returns homepage config');
  const seoSettings = await postgresSettingsRepository.getSeoSettings();
  assert(seoSettings !== null && typeof seoSettings === 'object', 'PostgresSettingsRepository.getSeoSettings() returns SEO settings');

  // 3.6 PostgresContactRepository
  const { postgresContactRepository } = require(path.join(postgresRepoDir, 'PostgresContactRepository'));
  const testMsgId = `msg-test-${Date.now()}`;
  const createdMsg = await postgresContactRepository.create({
    id: testMsgId,
    name: 'Sarah Connor',
    email: 'sarah@test.com',
    message: 'Testing contact inquiry persistence',
  });
  assert(createdMsg.id === testMsgId, 'PostgresContactRepository.create() creates contact message');
  const allMsgs = await postgresContactRepository.findAll();
  assert(allMsgs.some(m => m.id === testMsgId), 'PostgresContactRepository.findAll() includes created message');
  const delMsg = await postgresContactRepository.delete(testMsgId);
  assert(delMsg === true, 'PostgresContactRepository.delete() deletes message');

  // 3.7 PostgresReviewRepository
  const { postgresReviewRepository } = require(path.join(postgresRepoDir, 'PostgresReviewRepository'));
  const testRevId = `rev-test-${Date.now()}`;
  const createdRev = await postgresReviewRepository.create({
    id: testRevId,
    productId: 'prod-1792939920902',
    authorName: 'Verified Parent',
    rating: 5,
    comment: 'Super soft organic cotton baby romper!',
    status: 'approved',
  });
  assert(createdRev.id === testRevId, 'PostgresReviewRepository.create() creates review');
  const delRev = await postgresReviewRepository.delete(testRevId);
  assert(delRev === true, 'PostgresReviewRepository.delete() deletes review');

  // 3.8 PostgresCategoryRepository
  const { postgresCategoryRepository } = require(path.join(postgresRepoDir, 'PostgresCategoryRepository'));
  const dbCats = await postgresCategoryRepository.findAll();
  assert(Array.isArray(dbCats) && dbCats.length === 12, `PostgresCategoryRepository.findAll() returned exactly ${dbCats.length} categories`);
  const catById = await postgresCategoryRepository.findById(dbCats[0].id);
  assert(catById && catById.id === dbCats[0].id, 'PostgresCategoryRepository.findById() returns correct category');

  // 3.9 PostgresProductRepository
  const { postgresProductRepository } = require(path.join(postgresRepoDir, 'PostgresProductRepository'));
  const dbProds = await postgresProductRepository.findAll();
  assert(Array.isArray(dbProds) && dbProds.length === 17, `PostgresProductRepository.findAll() returned exactly ${dbProds.length} products`);
  const prodVariant = await postgresProductRepository.findVariant('var-pink-dino-dreams-2436months-BabyPink');
  assert(prodVariant && prodVariant.variant.sku === 'REX-BABY-3166-2436months-BAB', 'PostgresProductRepository.findVariant() finds SKU and parent product');

  // 3.10 PostgresOrderRepository
  const { postgresOrderRepository } = require(path.join(postgresRepoDir, 'PostgresOrderRepository'));
  const dbOrders = await postgresOrderRepository.findAll();
  assert(Array.isArray(dbOrders) && dbOrders.length === 13, `PostgresOrderRepository.findAll() returned exactly ${dbOrders.length} orders`);

  // 3.11 PostgresInventoryRepository
  const { postgresInventoryRepository } = require(path.join(postgresRepoDir, 'PostgresInventoryRepository'));
  const invList = await postgresInventoryRepository.findAll();
  assert(Array.isArray(invList) && invList.length > 0, `PostgresInventoryRepository.findAll() returned ${invList.length} inventory records`);

  // 3.12 PostgresDeliverySettingsRepository
  const { postgresDeliverySettingsRepository } = require(path.join(postgresRepoDir, 'PostgresDeliverySettingsRepository'));
  const delSettings = await postgresDeliverySettingsRepository.getSettings();
  assert(delSettings && (delSettings.defaultDeliveryFee === 450 || (delSettings.activeCouriers && delSettings.activeCouriers.length > 0)), 'PostgresDeliverySettingsRepository.getSettings() returns delivery settings');

  // 3.13 PostgresSettlementRepository
  const { postgresSettlementRepository } = require(path.join(postgresRepoDir, 'PostgresSettlementRepository'));
  const agreement = await postgresSettlementRepository.getCourierAgreement('KOOMBIYO');
  assert(agreement && (agreement.standardDeliveryCharge === 400 || agreement.standardDeliveryCharge === 450), 'PostgresSettlementRepository.getCourierAgreement() returns Koombiyo terms');

  // 3.14 PostgresPageRepository
  const { postgresPageRepository } = require(path.join(postgresRepoDir, 'PostgresPageRepository'));
  const pages = await postgresPageRepository.getAll();
  assert(Array.isArray(pages) && pages.length === 6, `PostgresPageRepository.getAll() returned ${pages.length} website pages`);

  // 3.15 PostgresCustomerRepository
  const { postgresCustomerRepository } = require(path.join(postgresRepoDir, 'PostgresCustomerRepository'));
  const custs = await postgresCustomerRepository.findAll();
  assert(Array.isArray(custs) && custs.length === 5, `PostgresCustomerRepository.findAll() returned exactly ${custs.length} customer records`);

  // 3.16 PostgresNavigationRepository
  const { postgresNavigationRepository } = require(path.join(postgresRepoDir, 'PostgresNavigationRepository'));
  const navConfig = await postgresNavigationRepository.getAll();
  assert(navConfig && Array.isArray(navConfig.items) && navConfig.items.length === 7, `PostgresNavigationRepository.getAll() returned ${navConfig?.items?.length} items`);

  // 3.17 PostgresNotificationRepository
  const { postgresNotificationRepository } = require(path.join(postgresRepoDir, 'PostgresNotificationRepository'));
  const notifs = await postgresNotificationRepository.getAll();
  assert(Array.isArray(notifs) && notifs.length === 6, `PostgresNotificationRepository.getAll() returned ${notifs.length} notifications`);

  // 3.18 PostgresAuditRepository
  const { postgresAuditRepository } = require(path.join(postgresRepoDir, 'PostgresAuditRepository'));
  const auditLogs = await postgresAuditRepository.getAll({ limit: 10 });
  assert(Array.isArray(auditLogs) && auditLogs.length > 0, `PostgresAuditRepository.getAll() returned ${auditLogs.length} audit logs`);

  // 3.19 PostgresWaybillRepository
  const { postgresWaybillRepository } = require(path.join(postgresRepoDir, 'PostgresWaybillRepository'));
  const unassigned = await postgresWaybillRepository.getAvailableWaybills('KOOMBIYO');
  assert(Array.isArray(unassigned) && unassigned.length === 20, `PostgresWaybillRepository.getAvailableWaybills() returned ${unassigned.length} unassigned waybills`);

  // Ensure all transient test records are removed before proceeding
  await cleanTestRecords();

  // -------------------------------------------------------------
  // TEST SECTION 4: JSON FALLBACK MODE VALIDATION (USE_POSTGRES=false)
  // -------------------------------------------------------------
  console.log('\n--- Section 4: JSON Fallback Mode Verification (USE_POSTGRES=false) ---');
  process.env.USE_POSTGRES = 'false';

  const { CategoryRepository } = require(path.join(BACKEND_DIR, 'dist/repositories/categoryRepository'));
  const catRepo = CategoryRepository.getInstance();
  assert(catRepo.isPostgresMode() === false, 'CategoryRepository.isPostgresMode() correctly returns false');
  const jsonCats = catRepo.getAll();
  assert(Array.isArray(jsonCats) && jsonCats.length === 12, `CategoryRepository.getAll() loaded ${jsonCats.length} categories from disk`);

  const { ProductRepository } = require(path.join(BACKEND_DIR, 'dist/repositories/productRepository'));
  const prodRepo = new ProductRepository();
  assert(prodRepo.isPostgresMode() === false, 'ProductRepository.isPostgresMode() correctly returns false');
  const jsonProds = await prodRepo.findAll();
  assert(Array.isArray(jsonProds) && jsonProds.length === 17, `ProductRepository.findAll() loaded ${jsonProds.length} products from disk`);

  const { OrderRepository } = require(path.join(BACKEND_DIR, 'dist/repositories/orderRepository'));
  const orderRepo = new OrderRepository();
  assert(orderRepo.isPostgresMode() === false, 'OrderRepository.isPostgresMode() correctly returns false');
  const jsonOrders = await orderRepo.findAll();
  assert(Array.isArray(jsonOrders) && jsonOrders.length === 13, `OrderRepository.findAll() loaded ${jsonOrders.length} orders from disk`);

  const { CartService } = require(path.join(BACKEND_DIR, 'dist/services/cartService'));
  const cartService = new CartService();
  assert(cartService.isPostgresMode() === false, 'CartService.isPostgresMode() correctly returns false');

  const { WishlistService } = require(path.join(BACKEND_DIR, 'dist/services/wishlistService'));
  const wishlistService = new WishlistService();
  assert(wishlistService.isPostgresMode() === false, 'WishlistService.isPostgresMode() correctly returns false');

  // -------------------------------------------------------------
  // TEST SECTION 5: FINAL INTEGRITY CHECK & BASELINE RESTORATION
  // -------------------------------------------------------------
  console.log('\n--- Section 5: Data Non-Destruction & Baseline Check ---');

  // Check SHA-256 hashes of all 23 JSON data files
  for (const f of jsonFiles) {
    const currentHash = getSha256(path.join(DATA_DIR, f));
    assert(currentHash === initialHashes[f], `File ${f} is bit-for-bit unmodified (SHA-256 match)`);
  }

  // Check database row counts across all tables
  const tablesRes = await pgClient.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  let totalDbRows = 0;
  for (const row of tablesRes.rows) {
    const tName = row.table_name;
    const cRes = await pgClient.query(`SELECT COUNT(*)::int AS cnt FROM "${tName}"`);
    totalDbRows += cRes.rows[0].cnt;
  }

  assert(totalDbRows === 332, `Database grand total is preserved at exact baseline of 332 rows (Current: ${totalDbRows})`);
  assert(tablesRes.rows.length === 40, `Database table count is preserved at exactly 40 schema tables (29 tracked + 11 empty schema-ready tables; Current: ${tablesRes.rows.length})`);

  await pgClient.end();

  console.log('\n' + '='.repeat(80));
  console.log(`  PHASE 3 VERIFICATION COMPLETE: ALL ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('='.repeat(80));
}

runPhase3Tests().catch((err) => {
  console.error('\n[FATAL ERROR IN PHASE 3 TEST SUITE]:', err);
  process.exit(1);
});
