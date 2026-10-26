const http = require('http');

function apiRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, text: body });
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

async function runCodTestSuite() {
  console.log('=====================================================');
  console.log('   REXBEBE CASH ON DELIVERY (COD) CHECKOUT TEST SUITE');
  console.log('=====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, name, details = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
    }
  }

  try {
    // 1. Fetch available in-stock products
    console.log('--- Step 1: Find Active Product Variant for Testing ---');
    const prodsRes = await apiRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/products',
      method: 'GET',
    });
    assert(prodsRes.status === 200, 'GET /api/products returns 200 OK');
    const products = prodsRes.data?.data || prodsRes.data;
    const testProduct = products.find((p) => p.variants && p.variants.some((v) => v.stockQuantity > 2));
    assert(!!testProduct, 'Found available product with stock > 2 for testing');

    const testVariant = testProduct.variants.find((v) => v.stockQuantity > 2);
    console.log(`Using Product: "${testProduct.name}" (Variant: ${testVariant.id}, Size: ${testVariant.size}, Color: ${testVariant.color}, Price: LKR ${testVariant.price}, Stock: ${testVariant.stockQuantity})`);

    const initialStock = testVariant.stockQuantity;

    // 2. Validate Client / Server input validations
    console.log('\n--- Step 2: Validate Required Customer and Delivery Fields ---');

    // Test missing recipient name
    const missingNameRes = await apiRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        items: [{ variantId: testVariant.id, quantity: 1 }],
        shippingAddress: {
          recipientName: '',
          phone: '+94 77 123 4567',
          street: '123 Galle Road',
          city: 'Colombo',
          district: 'Colombo',
        },
        paymentMethod: 'CASH_ON_DELIVERY',
      }
    );
    assert(missingNameRes.status === 400, 'Rejects missing customer recipient name with 400 Bad Request');

    // Test invalid phone number
    const invalidPhoneRes = await apiRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        items: [{ variantId: testVariant.id, quantity: 1 }],
        shippingAddress: {
          recipientName: 'Amasha Perera',
          phone: '123', // too short
          street: '123 Galle Road',
          city: 'Colombo',
          district: 'Colombo',
        },
        paymentMethod: 'CASH_ON_DELIVERY',
      }
    );
    assert(invalidPhoneRes.status === 400, 'Rejects invalid short phone number with 400 Bad Request');

    // Test missing street address
    const missingStreetRes = await apiRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        items: [{ variantId: testVariant.id, quantity: 1 }],
        shippingAddress: {
          recipientName: 'Amasha Perera',
          phone: '+94 77 123 4567',
          street: '',
          city: 'Colombo',
          district: 'Colombo',
        },
        paymentMethod: 'CASH_ON_DELIVERY',
      }
    );
    assert(missingStreetRes.status === 400, 'Rejects missing street delivery address with 400 Bad Request');

    // Test invalid email format when provided
    const invalidEmailRes = await apiRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        items: [{ variantId: testVariant.id, quantity: 1 }],
        shippingAddress: {
          recipientName: 'Amasha Perera',
          phone: '+94 77 123 4567',
          email: 'not-an-email',
          street: '123 Galle Road',
          city: 'Colombo',
          district: 'Colombo',
        },
        paymentMethod: 'CASH_ON_DELIVERY',
      }
    );
    assert(invalidEmailRes.status === 400, 'Rejects malformed email address with 400 Bad Request');

    // 3. Backend Price & Stock Tamper Resistance Test
    console.log('\n--- Step 3: Server Price Calculation & Untrusted Client Total Resistance ---');
    const testIdempotencyKey = `idem-test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const orderPayload = {
      customerId: 'cust-test-suite',
      customerName: 'Kavindu Senanayake',
      customerEmail: 'kavindu.cod@example.com',
      phone: '+94 71 987 6543',
      items: [{ variantId: testVariant.id, quantity: 1 }],
      shippingAddress: {
        recipientName: 'Kavindu Senanayake',
        phone: '+94 71 987 6543',
        email: 'kavindu.cod@example.com',
        street: '78 Flower Road, Apt 4B',
        city: 'Colombo 07',
        town: 'Colombo',
        district: 'Colombo',
        postalCode: '00700',
        country: 'Sri Lanka',
        deliveryInstructions: 'Ring doorbell twice, leave with concierge if not answering.',
      },
      paymentMethod: 'CASH_ON_DELIVERY',
      idempotencyKey: testIdempotencyKey,
      // TAMPER ATTEMPT: Try to pass fake cheap price and 0 total
      totalAmount: 1,
      subtotal: 1,
      shippingFee: 0,
      codHandlingFee: 9999, // Unapproved fee attempt
    };

    const placeRes = await apiRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      orderPayload
    );

    assert(placeRes.status === 201 || placeRes.status === 200, 'COD Order placed successfully (HTTP 201/200)');
    const createdOrder = placeRes.data?.data || placeRes.data;

    // Verify Server-Authoritative Totals (TAMPER REJECTED)
    assert(createdOrder.subtotal === testVariant.price, `Subtotal strictly computed by server from DB (Expected ${testVariant.price}, got ${createdOrder.subtotal})`);
    assert(createdOrder.codHandlingFee === 0, `No unapproved COD handling fee injected (codHandlingFee is 0, got ${createdOrder.codHandlingFee})`);
    assert(createdOrder.totalAmount === createdOrder.subtotal + createdOrder.shippingFee, `Total securely computed on server: subtotal (${createdOrder.subtotal}) + shipping (${createdOrder.shippingFee}) = ${createdOrder.totalAmount}`);
    assert(createdOrder.amountToCollect === createdOrder.totalAmount, `Final payable amount at delivery equals totalAmount (${createdOrder.amountToCollect})`);

    // 4. Verify Unique Order Number, Statuses, and Saved Item Details
    console.log('\n--- Step 4: Verify Order Number, Statuses, and Persisted Fields ---');
    assert(/^RXB-2026-\d{6}$/.test(createdOrder.orderNumber), `Generated unique order number matches RXB-2026-XXXXXX format: ${createdOrder.orderNumber}`);
    assert(createdOrder.status === 'PENDING_CONFIRMATION', `Initial order status is 'PENDING_CONFIRMATION' (Pending Confirmation): ${createdOrder.status}`);
    assert(createdOrder.paymentStatus === 'COD_PENDING', `Payment status is 'COD_PENDING' (Unpaid pending doorstep collection): ${createdOrder.paymentStatus}`);
    assert(createdOrder.codCollectionStatus === 'COLLECTION_PENDING', `Root COD collection status is 'COLLECTION_PENDING' (Collection Pending): ${createdOrder.codCollectionStatus}`);
    assert(createdOrder.courierDetails?.codCollectionStatus === 'COLLECTION_PENDING', `Courier COD collection status is 'COLLECTION_PENDING': ${createdOrder.courierDetails?.codCollectionStatus}`);

    // Verify Item Details: Products, Sizes, Colours, Quantities
    const orderItem = createdOrder.items[0];
    assert(orderItem.title && orderItem.title.length > 0, `Ordered product title stored: ${orderItem.title}`);
    assert(orderItem.size === testVariant.size, `Ordered product size stored: ${orderItem.size}`);
    assert(orderItem.color === testVariant.color, `Ordered product colour stored: ${orderItem.color}`);
    assert(orderItem.quantity === 1, `Ordered product quantity stored: ${orderItem.quantity}`);
    assert(orderItem.price === testVariant.price, `Ordered product unit price stored: ${orderItem.price}`);
    assert(orderItem.totalPrice === testVariant.price * 1, `Ordered product total price stored: ${orderItem.totalPrice}`);

    // 5. Verify Inventory Deduction
    console.log('\n--- Step 5: Verify Inventory Stock Deduction ---');
    const prodsAfterRes = await apiRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/products',
      method: 'GET',
    });
    const productsAfter = prodsAfterRes.data?.data || prodsAfterRes.data;
    const currentProduct = productsAfter.find((p) => p.id === testProduct.id);
    const currentVariant = currentProduct.variants.find((v) => v.id === testVariant.id);
    assert(currentVariant.stockQuantity === initialStock - 1, `Variant stock accurately deducted from ${initialStock} to ${currentVariant.stockQuantity}`);

    // 6. Test Duplicate Order Prevention (Idempotency & Double Submit)
    console.log('\n--- Step 6: Test Duplicate Order Prevention ---');
    const duplicateRes = await apiRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      orderPayload
    );
    const duplicateOrder = duplicateRes.data?.data || duplicateRes.data;
    assert(duplicateOrder.id === createdOrder.id, 'Duplicate submission with identical idempotencyKey returns existing order ID without creating a new order');
    assert(duplicateOrder.orderNumber === createdOrder.orderNumber, 'Duplicate submission returns exact same order number');

    // Confirm NO duplicate stock deduction occurred
    const prodsAfterDupRes = await apiRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/products',
      method: 'GET',
    });
    const currentVariantAfterDup = (prodsAfterDupRes.data?.data || prodsAfterDupRes.data)
      .find((p) => p.id === testProduct.id)
      .variants.find((v) => v.id === testVariant.id);
    assert(currentVariantAfterDup.stockQuantity === initialStock - 1, `Duplicate submission did not deduct additional stock (remains ${currentVariantAfterDup.stockQuantity})`);

    // 7. Verify Order Persistence across queries (GET /api/orders/:id and :orderNumber)
    console.log('\n--- Step 7: Verify Database Persistence & Order Retrieval ---');
    const getByIdRes = await apiRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${createdOrder.id}`,
      method: 'GET',
    });
    assert(getByIdRes.status === 200, `GET /api/orders/${createdOrder.id} returns 200 OK`);
    assert(getByIdRes.data?.data?.orderNumber === createdOrder.orderNumber, 'Retrieved order matches orderNumber');

    const getByOrderNumRes = await apiRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${createdOrder.orderNumber}`,
      method: 'GET',
    });
    assert(getByOrderNumRes.status === 200, `GET /api/orders/${createdOrder.orderNumber} by order number returns 200 OK`);
    assert(getByOrderNumRes.data?.data?.id === createdOrder.id, 'Looked up by order number successfully returns persistent order record');

    // 8. Test Frontend Order Confirmation Page HTTP Rendering
    console.log('\n--- Step 8: Verify Frontend Order Confirmation Page ---');
    const frontendRes = await apiRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/order/${createdOrder.orderNumber}`,
      method: 'GET',
    });
    assert(frontendRes.status === 200, `GET http://localhost:3000/order/${createdOrder.orderNumber} returns 200 OK`);
    assert(
      typeof frontendRes.text === 'string' && frontendRes.text.includes(createdOrder.orderNumber),
      'Frontend HTML contains the unique order number'
    );

    // Summary
    console.log('\n=====================================================');
    console.log(`RESULTS: ${passed} / ${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
    console.log('=====================================================\n');

    if (passed === total) {
      console.log('🎉 ALL COD CHECKOUT REQUIREMENTS FULLY VERIFIED!');
    } else {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  }
}

runCodTestSuite();
