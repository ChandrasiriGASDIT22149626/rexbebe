const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== REXBEBE FEATURE VERIFICATION SUITE ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  try {
    // TEST 1: Categories & Menu Form API (No SEO fields required, correct parent/children)
    console.log('\n--- 1. Testing Categories & Menu ---');
    const catRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/categories',
      method: 'GET',
    });
    assert(catRes.status === 200 && Array.isArray(catRes.data?.data || catRes.data), 'GET /api/categories returns 200');
    const categories = catRes.data?.data || catRes.data;
    assert(categories.length > 0, `Categories found: ${categories.length}`);

    // TEST 2: Product Parts & Clothing Components Data
    console.log('\n--- 2. Testing Dino Adventure Baby Set & Clothing Parts ---');
    const dinoRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/products/dino-adventure-baby-set',
      method: 'GET',
    });
    assert(dinoRes.status === 200, 'GET /api/products/dino-adventure-baby-set returns 200');
    const dino = dinoRes.data?.data || dinoRes.data;
    assert(dino.name === 'REXBEBE Dino Adventure 3-Piece Baby Set', 'Product name matches exactly');
    assert(dino.productType === 'set', 'Product type is "set"');
    assert(Array.isArray(dino.parts) && dino.parts.length === 3, 'Product has 3 clothing components (T-Shirt, Shorts, Hat)');

    const tshirtPart = dino.parts.find((p) => p.name === 'Dinosaur T-Shirt');
    const shortsPart = dino.parts.find((p) => p.name === 'Summer Shorts');
    const hatPart = dino.parts.find((p) => p.name === 'Baby Hat');

    assert(tshirtPart && tshirtPart.type === 'T-shirt', 'Component 1 is Dinosaur T-Shirt (type: T-shirt)');
    assert(shortsPart && shortsPart.type === 'Shorts', 'Component 2 is Summer Shorts (type: Shorts)');
    assert(hatPart && hatPart.type === 'Hat', 'Component 3 is Baby Hat (type: Hat)');
    assert(tshirtPart.colors.length >= 3, 'T-Shirt has available colours Red, Yellow, Blue');

    // TEST 3: Size Management and Size-Specific Inventory Matrix
    console.log('\n--- 3. Testing Size & Stock Matrix ---');
    const var03Red = dino.variants.find((v) => v.size === '0–3 Months' && v.color === 'Red');
    const var03Yel = dino.variants.find((v) => v.size === '0–3 Months' && v.color === 'Yellow');
    const var03Blu = dino.variants.find((v) => v.size === '0–3 Months' && v.color === 'Blue');
    const var36Yel = dino.variants.find((v) => v.size === '3–6 Months' && v.color === 'Yellow');

    assert(var03Red && var03Red.stockQuantity === 5, '0–3 Months / Red T-Shirt stock = 5');
    assert(var03Yel && var03Yel.stockQuantity === 3, '0–3 Months / Yellow T-Shirt stock = 3');
    assert(var03Blu && var03Blu.stockQuantity === 0, '0–3 Months / Blue T-Shirt stock = 0 (Sold Out)');
    assert(var36Yel && var36Yel.stockQuantity === 0, '3–6 Months / Yellow T-Shirt stock = 0 (Sold Out)');

    // TEST 4: Automatic Stock Deduction When Orders Are Placed
    console.log('\n--- 4. Testing Order Placement & Stock Deduction ---');
    // Customer orders 2 units of Yellow T-shirt in size 0–3 Months (stock is 3)
    const initialQty = var03Yel.stockQuantity;
    const orderPayload = {
      customerId: 'test-cust-123',
      customerName: 'Test Parent Elena',
      customerEmail: 'elena.parent@example.com',
      items: [{ variantId: var03Yel.id, quantity: 2 }],
      shippingAddress: {
        recipientName: 'Elena Rostova',
        street: '45 Park Avenue',
        city: 'Colombo',
        state: 'Western Province',
        postalCode: '00700',
        country: 'Sri Lanka',
      },
      paymentMethod: 'CASH_ON_DELIVERY',
    };

    const orderRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      orderPayload
    );

    assert(orderRes.status === 201 || orderRes.status === 200, 'Order successfully created with 200/201 status');
    const orderData = orderRes.data?.data || orderRes.data;
    assert(orderData.orderNumber, `Order placed with Order Number: ${orderData.orderNumber}`);

    // Verify stock was reduced from 3 to 1
    const dinoUpdatedRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/products/dino-adventure-baby-set',
      method: 'GET',
    });
    const dinoUpdated = dinoUpdatedRes.data?.data || dinoUpdatedRes.data;
    const updatedVar03Yel = dinoUpdated.variants.find((v) => v.id === var03Yel.id);
    assert(updatedVar03Yel.stockQuantity === initialQty - 2, `Stock deducted: was ${initialQty}, now ${updatedVar03Yel.stockQuantity} (3 - 2 = 1)`);

    // TEST 5: Low-Stock Alerts for Administrators
    console.log('\n--- 5. Testing Admin Dashboard Low-Stock Alerts ---');
    const overviewRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/overview',
      method: 'GET',
    });
    assert(overviewRes.status === 200, 'GET /api/admin/overview returns 200');
    const overview = overviewRes.data?.data || overviewRes.data;
    const alerts = overview.lowStockAlerts || overview.inventory?.lowStockAlerts || [];
    assert(Array.isArray(alerts), 'lowStockAlerts array returned in admin overview');

    const yellowAlert = alerts.find((a) => a.variantId === var03Yel.id);
    assert(yellowAlert && yellowAlert.status === 'LOW_STOCK', `Yellow 0–3M (${yellowAlert?.remainingQuantity} units) correctly triggers LOW_STOCK warning`);

    const blueAlert = alerts.find((a) => a.variantId === var03Blu.id);
    assert(blueAlert && blueAlert.remainingQuantity === 0 && blueAlert.status === 'OUT_OF_STOCK', 'Blue 0–3M (0 units) correctly triggers OUT_OF_STOCK warning');

    // TEST 6: Prevent Overselling
    console.log('\n--- 6. Testing Concurrency & Overselling Prevention ---');
    const overbuyPayload = {
      customerId: 'test-cust-123',
      customerName: 'Oversell Tester',
      customerEmail: 'test@example.com',
      items: [{ variantId: var03Yel.id, quantity: 100 }], // requesting 100 when only 1 is left
      shippingAddress: orderPayload.shippingAddress,
      paymentMethod: 'CASH_ON_DELIVERY',
    };

    const overbuyRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      overbuyPayload
    );
    assert(overbuyRes.status === 400, 'Ordering more units than available returns 400 Bad Request (prevented overselling)');

    // Summary
    console.log(`\n========================================`);
    console.log(`RESULTS: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
