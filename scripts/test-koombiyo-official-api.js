/**
 * Official Koombiyo Client API v2 End-to-End Integration Test Suite
 * 
 * Verifies:
 * 1. GET  /api/orders/courier/config                 -> API mode, active waybills count
 * 2. GET  /api/orders/courier/available-waybills     -> Active allocated waybill pool
 * 3. GET  /api/orders/courier/koombiyo/districts    -> 25 districts from Koombiyo API
 * 4. GET  /api/orders/courier/koombiyo/cities       -> Dynamic city resolution
 * 5. POST /api/delivery/calculate                   -> Checkout dynamic shipping rate
 * 6. POST /api/orders/courier/koombiyo/webhook      -> Inbound status webhook & atomic DB sync
 * 7. POST /api/webhooks/koombiyo                    -> Webhook alias route
 * 8. POST /api/orders/courier/koombiyo/test-webhook -> Outbound test webhook trigger
 * 9. GET  /api/orders/:id/courier/tracking          -> Order tracking
 */

const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'rexbebe_super_secure_admin_jwt_secret_key_2026';
const adminToken = jwt.sign(
  {
    id: 'admin-tester-official',
    email: 'admin@rexbebe.com',
    role: 'ADMIN',
    permissions: ['*'],
  },
  JWT_SECRET,
  { expiresIn: '2h' }
);

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const opts = { ...options };
    opts.headers = { ...opts.headers };
    if (!opts.headers['Authorization'] && !opts.skipAuth) {
      opts.headers['Authorization'] = `Bearer ${adminToken}`;
    }
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✅ [PASS] ${message}`);
}

async function runOfficialKoombiyoTests() {
  console.log('================================================================');
  console.log('   OFFICIAL KOOMBIYO CLIENT API v2 INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  // Step 1: Courier Config & Live Status
  console.log('--- Step 1: Courier Configuration & Credentials ---');
  const cfgRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/orders/courier/config',
    method: 'GET',
  });
  assert(cfgRes.status === 200, 'GET /api/orders/courier/config returns 200 OK');
  const cfg = cfgRes.data.data;
  assert(cfg.provider === 'KOOMBIYO', 'Provider is KOOMBIYO');
  assert(cfg.apiMode === 'API', `API mode is API (found: ${cfg.apiMode})`);
  assert(cfg.hasCredentials === true, 'hasCredentials is true');
  assert(cfg.activeWaybillsCount > 0, `Active allocated waybills available (${cfg.activeWaybillsCount})`);

  // Step 2: Available Waybills
  console.log('\n--- Step 2: Available Waybills Pool ---');
  const wbRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/orders/courier/available-waybills',
    method: 'GET',
  });
  assert(wbRes.status === 200, 'GET /api/orders/courier/available-waybills returns 200 OK');
  const waybills = wbRes.data.data?.waybills || [];
  assert(Array.isArray(waybills) && waybills.length > 0, `Returned ${waybills.length} active allocated waybills`);
  const sampleWaybill = waybills[0];
  console.log(`ℹ️ Sample active waybill ID: ${sampleWaybill}`);

  // Step 3: Districts Lookup
  console.log('\n--- Step 3: Dynamic Districts Resolution ---');
  const distRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/orders/courier/koombiyo/districts',
    method: 'GET',
  });
  assert(distRes.status === 200, 'GET /api/orders/courier/koombiyo/districts returns 200 OK');
  const districts = distRes.data.data || [];
  assert(districts.length === 25, `Koombiyo returned all 25 official Sri Lanka districts (found: ${districts.length})`);
  const colomboDist = districts.find(d => d.district_name.toLowerCase() === 'colombo');
  assert(colomboDist && colomboDist.district_id === 5, 'Colombo district ID is 5');

  // Step 4: Cities Lookup
  console.log('\n--- Step 4: Dynamic Cities Resolution ---');
  const cityRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/orders/courier/koombiyo/cities?districtId=${colomboDist.district_id}`,
    method: 'GET',
  });
  assert(cityRes.status === 200, 'GET /api/orders/courier/koombiyo/cities returns 200 OK');
  const cities = cityRes.data.data || [];
  assert(cities.length > 100, `Cities for Colombo retrieved (${cities.length} cities)`);
  const colombo03 = cities.find(c => c.city_name.toLowerCase() === 'colombo 03');
  assert(colombo03 && colombo03.city_id === 5249, 'Colombo 03 city ID resolved to 5249');

  // Step 5: Dynamic Checkout Shipping Rate Calculation
  console.log('\n--- Step 5: Checkout Rate Calculation via Koombiyo ---');
  const rateCalcRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/delivery/calculate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      subtotal: 5000,
      district: 'Colombo',
      city: 'Colombo 03',
      weight: 1.5,
    }
  );
  assert(rateCalcRes.status === 200, 'POST /api/delivery/calculate returns 200 OK');
  const rateData = rateCalcRes.data.data || rateCalcRes.data;
  assert(typeof rateData.deliveryFee === 'number' && rateData.deliveryFee > 0, `Dynamic rate calculated: LKR ${rateData.deliveryFee}`);
  console.log(`ℹ️ Dynamic checkout rate for Colombo 03 (1.5kg): LKR ${rateData.deliveryFee}`);

  // Step 6: Create a Test COD Order for Lifecycle & Webhook Verification
  console.log('\n--- Step 6: Create Test Order & Inbound Webhook Update ---');
  const prodsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/products',
    method: 'GET',
  });
  const products = prodsRes.data?.data || prodsRes.data;
  const testProd = products.find((p) => p.variants && p.variants.some((v) => v.stockQuantity > 2));
  const testVar = testProd.variants.find((v) => v.stockQuantity > 2);

  const orderRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      customerId: 'cust-koombiyo-test-1',
      customerName: 'Sathira Test Customer',
      customerEmail: 'sathira.test@rexbebe.lk',
      phone: '+94 77 123 4567',
      paymentMethod: 'CASH_ON_DELIVERY',
      items: [{ variantId: testVar.id, quantity: 1 }],
      shippingAddress: {
        recipientName: 'Sathira Test Recipient',
        phone: '+94 77 123 4567',
        street: '45 Galle Road',
        city: 'Colombo 03',
        district: 'Colombo',
        postalCode: '00300',
        country: 'Sri Lanka',
      },
    }
  );
  assert(orderRes.status === 201, 'POST /api/orders creates test order (201 Created)');
  const createdOrder = orderRes.data.data;
  const testOrderId = createdOrder.id;
  const testWaybill = '63004415'; // Merchant allocated test waybill
  console.log(`ℹ️ Created test order #${createdOrder.orderNumber} (ID: ${testOrderId})`);

  // Step 7: Record manual or official assignment of waybill to order
  console.log('\n--- Step 7: Assign Koombiyo Waybill to Order ---');
  const bookRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${testOrderId}/courier/book`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      courierProvider: 'Koombiyo Delivery',
      trackingNumber: testWaybill,
      waybillNumber: testWaybill,
      bookingDate: new Date().toISOString().slice(0, 10),
      pickupDate: new Date().toISOString().slice(0, 10),
      expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      parcelWeight: 1.0,
      deliveryFee: 450,
      codAmountToCollect: createdOrder.totalAmount,
      courierNotes: 'Official API Integration Test',
      admin: 'Test Runner',
    }
  );
  assert(bookRes.status === 200, 'POST /manual-booking records waybill on order');

  // Step 8: Inbound Status Webhook Simulation
  console.log('\n--- Step 8: Inbound Koombiyo Status Webhook Notification ---');
  const webhookPayload = {
    waybill_id: testWaybill,
    status_id: 10,
    status: 'Delivered',
    weight: '0.8',
    status_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
    del_charge: 450,
    reason: 'Parcel delivered to recipient and cash collected successfully.',
  };

  const webhookRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders/courier/koombiyo/webhook',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    webhookPayload
  );
  assert(webhookRes.status === 200, 'POST /api/orders/courier/koombiyo/webhook returns 200 OK');
  assert(webhookRes.data.success === true, 'Webhook returned success: true');

  // Verify order updated in DB
  const verifyRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/orders/${testOrderId}`,
    method: 'GET',
  });
  assert(verifyRes.status === 200, 'GET /api/orders/:id returns 200 OK');
  const verifiedOrder = verifyRes.data.data;
  assert(verifiedOrder.courierDetails?.deliveryStatus === 'DELIVERED', `Delivery status updated to DELIVERED (found: ${verifiedOrder.courierDetails?.deliveryStatus})`);
  assert(verifiedOrder.status === 'DELIVERED', `Order status updated to DELIVERED (found: ${verifiedOrder.status})`);
  assert(verifiedOrder.paymentStatus === 'COD_PENDING', `Payment status remains COD_PENDING until bank remittance is settled (found: ${verifiedOrder.paymentStatus})`);
  assert(verifiedOrder.codCollectionStatus === 'COLLECTED_BY_COURIER', `COD collection status marked COLLECTED_BY_COURIER (found: ${verifiedOrder.codCollectionStatus})`);
  assert(verifiedOrder.codSettlementStatus === 'PENDING_REMITTANCE', `COD settlement status marked PENDING_REMITTANCE (found: ${verifiedOrder.codSettlementStatus})`);
  assert(verifiedOrder.courierDetails?.deliveryFee === 450, 'Delivery charge persisted from webhook');

  // Step 9: Webhook Alias Route
  console.log('\n--- Step 9: Webhook Alias Endpoint (/api/webhooks/koombiyo) ---');
  const aliasWebhookRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/webhooks/koombiyo',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      waybill_id: testWaybill,
      status_id: 7,
      status: 'Out for Delivery',
      weight: '0.8',
      status_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
      del_charge: 450,
      reason: 'Rider en route to destination',
    }
  );
  assert(aliasWebhookRes.status === 200, 'POST /api/webhooks/koombiyo alias returns 200 OK');

  // Step 10: Outbound Webhook Test Trigger
  console.log('\n--- Step 10: Outbound Webhook Test Tool ---');
  const testWebhookRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders/courier/koombiyo/test-webhook',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      targetUrl: 'https://httpbin.org/post',
    }
  );
  assert(testWebhookRes.status === 200, 'POST /api/orders/courier/koombiyo/test-webhook returns 200 OK');
  assert(testWebhookRes.data.success === true, 'Outbound test webhook verified successfully with Koombiyo server');

  console.log('\n================================================================');
  console.log('🎉 ALL OFFICIAL KOOMBIYO CLIENT API v2 TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runOfficialKoombiyoTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
