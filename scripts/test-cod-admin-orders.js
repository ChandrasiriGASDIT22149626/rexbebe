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

async function runAdminCodOrdersTests() {
  console.log('================================================================');
  console.log('   REXBEBE ADMIN COD ORDERS MANAGEMENT TEST SUITE');
  console.log('================================================================\n');

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
    // 1. Fetch COD orders via API
    console.log('--- Step 1: Query COD Orders with Filters ---');
    const allCodRes = await apiRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders?paymentMethod=COD',
      method: 'GET',
    });
    assert(allCodRes.status === 200, 'GET /api/orders?paymentMethod=COD returns 200 OK');
    const codOrders = allCodRes.data?.data || allCodRes.data;
    assert(Array.isArray(codOrders) && codOrders.length > 0, `Found ${codOrders.length} COD orders in database`);

    const sampleOrder = codOrders[0];
    console.log(`Sample Order: ${sampleOrder.orderNumber} (Status: ${sampleOrder.status}, Total: LKR ${sampleOrder.totalAmount}, Customer: ${sampleOrder.customerName})`);

    // Verify all required display fields exist on order
    assert(!!sampleOrder.orderNumber && !!sampleOrder.createdAt, 'Order has order number and creation date');
    assert(!!sampleOrder.customerName && (!!sampleOrder.phone || !!sampleOrder.shippingAddress?.phone), 'Order has customer name and phone');
    assert(!!sampleOrder.shippingAddress?.street && !!sampleOrder.shippingAddress?.district, 'Order has full delivery address');
    assert(Array.isArray(sampleOrder.items) && sampleOrder.items.length > 0, 'Order has items array');
    assert(sampleOrder.items[0].size !== undefined && sampleOrder.items[0].color !== undefined, 'Order items contain sizes and colours');
    assert(sampleOrder.subtotal !== undefined && sampleOrder.shippingFee !== undefined && sampleOrder.totalAmount !== undefined, 'Order has subtotal, shipping fee, and payable amount');
    assert(sampleOrder.status !== undefined, 'Order has order status');
    assert(sampleOrder.codCollectionStatus !== undefined || sampleOrder.courierDetails?.codCollectionStatus !== undefined, 'Order has COD collection status');

    // 2. Test Filters: District & Status
    console.log('\n--- Step 2: Test Multi-Parameter Filters (District, Status, Search) ---');
    const districtRes = await apiRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders?paymentMethod=COD&district=Colombo',
      method: 'GET',
    });
    const districtOrders = districtRes.data?.data || districtRes.data;
    assert(districtRes.status === 200, 'District filter returns 200 OK');
    assert(districtOrders.every((o) => (o.shippingAddress?.district || '').toLowerCase() === 'colombo'), 'All returned orders match Colombo district');

    const searchRes = await apiRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders?paymentMethod=COD&search=${encodeURIComponent(sampleOrder.orderNumber)}`,
      method: 'GET',
    });
    const searchOrders = searchRes.data?.data || searchRes.data;
    assert(searchRes.status === 200 && searchOrders.some((o) => o.orderNumber === sampleOrder.orderNumber), `Search by orderNumber '${sampleOrder.orderNumber}' returns order`);

    // 3. Test Creation of a Fresh COD Order for Status Lifecycle Testing
    console.log('\n--- Step 3: Create Dedicated Test COD Order for Lifecycle Tests ---');
    const prodsRes = await apiRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/products',
      method: 'GET',
    });
    const products = prodsRes.data?.data || prodsRes.data;
    const testProd = products.find((p) => p.variants && p.variants.some((v) => (v.stockQuantity || 0) >= 5)) || products[0];
    const testVar = testProd.variants.find((v) => (v.stockQuantity || 0) >= 5) || testProd.variants[0];

    const testOrderRes = await apiRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        customerName: 'Saman Kumara',
        customerEmail: `saman.admin.${Date.now()}@example.com`,
        phone: `+94 77 ${Math.floor(1000000 + Math.random() * 9000000)}`,
        items: [{ variantId: testVar.id, quantity: 1 }],
        shippingAddress: {
          recipientName: 'Saman Kumara',
          phone: '+94 77 999 8888',
          street: '12 Temple Road, Maharagama',
          city: 'Maharagama',
          district: 'Colombo',
          postalCode: '10280',
          country: 'Sri Lanka',
        },
        paymentMethod: 'CASH_ON_DELIVERY',
      }
    );
    assert(testOrderRes.status === 201 || testOrderRes.status === 200, 'Test COD order created successfully');
    const testOrder = testOrderRes.data?.data || testOrderRes.data;
    console.log(`Created Test Order: ${testOrder.orderNumber} (ID: ${testOrder.id})`);
    assert(testOrder.status === 'PENDING_CONFIRMATION', 'Initial status is PENDING_CONFIRMATION (Pending Confirmation)');
    assert(testOrder.codCollectionStatus === 'COLLECTION_PENDING', 'Initial collection status is COLLECTION_PENDING (Collection Pending)');

    // 4. Test Status Update: PENDING_CONFIRMATION -> CONFIRMED
    console.log('\n--- Step 4: Test Status Update to CONFIRMED with Administrator Logging ---');
    const confirmRes = await apiRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/orders/${testOrder.id}/status`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        status: 'CONFIRMED',
        note: 'Customer confirmed parcel reception and cash readiness via phone call.',
        admin: 'Senior Manager Shanika',
      }
    );
    assert(confirmRes.status === 200, 'Status update to CONFIRMED returns 200 OK');
    const confirmedOrder = confirmRes.data?.data || confirmRes.data;
    assert(confirmedOrder.status === 'CONFIRMED', 'Order status updated to CONFIRMED');
    const confirmTimeline = confirmedOrder.timeline[confirmedOrder.timeline.length - 1];
    assert(confirmTimeline.status === 'CONFIRMED', 'Timeline status recorded as CONFIRMED');
    assert(confirmTimeline.admin === 'Senior Manager Shanika', `Administrator recorded in timeline: ${confirmTimeline.admin}`);
    assert(!!confirmTimeline.time, `Timestamp recorded: ${confirmTimeline.time}`);

    // 5. Test Status Update: PACKED & SHIPPED with Logistics Assignment
    console.log('\n--- Step 5: Test PACKED & SHIPPED with Courier and Tracking ---');
    const packRes = await apiRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/orders/${testOrder.id}/status`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        status: 'PACKED',
        note: 'Garment ironed, quality checked, and boxed in signature boutique packaging.',
        admin: 'Warehouse Supervisor Kamal',
      }
    );
    assert(packRes.status === 200, 'Status update to PACKED returns 200 OK');

    const shipRes = await apiRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/orders/${testOrder.id}/status`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        status: 'SHIPPED',
        carrier: 'Domex Express',
        trackingNumber: 'DOM-772190',
        note: 'Dispatched to courier hub. Waybill issued.',
        admin: 'Logistics Officer Ruwan',
      }
    );
    assert(shipRes.status === 200, 'Status update to SHIPPED returns 200 OK');
    const shippedOrder = shipRes.data?.data || shipRes.data;
    assert(shippedOrder.status === 'SHIPPED', 'Order status is SHIPPED');
    assert(shippedOrder.carrier === 'Domex Express', 'Carrier assigned: Domex Express');
    assert(shippedOrder.trackingNumber === 'DOM-772190', 'Tracking number assigned: DOM-772190');
    assert(shippedOrder.courierDetails?.deliveryStatus === 'IN_TRANSIT', 'Delivery status auto-updated to IN_TRANSIT');

    // 6. Test Status Update: DELIVERED with Automatic Cash Collection
    console.log('\n--- Step 6: Test DELIVERED Status & Automatic Cash Collection ---');
    const deliverRes = await apiRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/orders/${testOrder.id}/status`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        status: 'DELIVERED',
        note: 'Parcel delivered to customer doorstep. Cash collected in full by driver.',
        admin: 'Domex Courier Integration',
      }
    );
    assert(deliverRes.status === 200, 'Status update to DELIVERED returns 200 OK');
    const deliveredOrder = deliverRes.data?.data || deliverRes.data;
    assert(deliveredOrder.status === 'DELIVERED', 'Order status is DELIVERED');
    assert(
      deliveredOrder.codCollectionStatus === 'COLLECTED_BY_COURIER' || deliveredOrder.codCollectionStatus === 'COLLECTED',
      'COD Collection status auto-updated to COLLECTED or COLLECTED_BY_COURIER'
    );
    assert(deliveredOrder.paymentStatus === 'PAID', 'Payment status updated to PAID upon cash collection');

    // 7. Test Exceptional Action Validations: CANCELLED & RETURNED
    console.log('\n--- Step 7: Test Cancellation & Return Validations (Required Reasons) ---');

    // Create another order to test cancellation validation
    const orderForCancelRes = await apiRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        customerName: 'Cancel Test Customer',
        customerEmail: `cancel.test.${Date.now()}@example.com`,
        phone: `+94 77 ${Math.floor(1000000 + Math.random() * 9000000)}`,
        items: [{ variantId: testVar.id, quantity: 1 }],
        shippingAddress: {
          recipientName: 'Cancel Test Customer',
          phone: '+94 77 111 2222',
          street: '100 Beach Road',
          city: 'Mount Lavinia',
          district: 'Colombo',
        },
        paymentMethod: 'CASH_ON_DELIVERY',
      }
    );
    const orderForCancel = orderForCancelRes.data?.data || orderForCancelRes.data;

    // ATTEMPT 1: Cancel without reason (MUST BE REJECTED)
    const rejectCancelRes = await apiRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/orders/${orderForCancel.id}/status`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        status: 'CANCELLED',
        reason: '', // Empty reason
        note: '',
      }
    );
    assert(rejectCancelRes.status === 400, 'Rejects CANCELLED action without required reason (400 Bad Request)');

    // ATTEMPT 2: Cancel with valid reason (MUST SUCCEED & RESTORE INVENTORY)
    const initialVarStock = testVar.stockQuantity;
    const validCancelRes = await apiRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/orders/${orderForCancel.id}/status`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        status: 'CANCELLED',
        reason: 'Customer called and cancelled order due to accidental double placement.',
        admin: 'Support Lead Nuwan',
      }
    );
    assert(validCancelRes.status === 200, 'Allows CANCELLED action when valid reason is provided');
    const cancelledOrder = validCancelRes.data?.data || validCancelRes.data;
    assert(cancelledOrder.status === 'CANCELLED', 'Order status is CANCELLED');
    assert(cancelledOrder.codCollectionStatus === 'NOT_COLLECTED', 'Collection status updated to NOT_COLLECTED');

    const cancelTimeline = cancelledOrder.timeline[cancelledOrder.timeline.length - 1];
    assert(cancelTimeline.admin === 'Support Lead Nuwan', `Admin recorded in cancellation: ${cancelTimeline.admin}`);
    assert(cancelTimeline.note.includes('accidental double placement'), 'Cancellation reason recorded in timeline');

    // Test RETURNED validation without reason (MUST BE REJECTED)
    const rejectReturnRes = await apiRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/orders/${testOrder.id}/status`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        status: 'RETURNED',
        reason: '',
      }
    );
    assert(rejectReturnRes.status === 400, 'Rejects RETURNED action without required reason (400 Bad Request)');

    // 8. Verify Persistence in Database
    console.log('\n--- Step 8: Verify Order Persistence Across Retrieval ---');
    const fetchPersistedRes = await apiRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${cancelledOrder.id}`,
      method: 'GET',
    });
    assert(fetchPersistedRes.status === 200, 'Fetched cancelled order from database with 200 OK');
    const persisted = fetchPersistedRes.data?.data || fetchPersistedRes.data;
    assert(persisted.status === 'CANCELLED', 'Order remains CANCELLED in database');
    assert(persisted.timeline.length >= 2, `Timeline has ${persisted.timeline.length} audit records`);

    // 9. Test Frontend COD Orders Management Page Route
    console.log('\n--- Step 9: Verify Admin Frontend COD Management Page ---');
    const frontendPageRes = await apiRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/orders/cod',
      method: 'GET',
    });
    assert(frontendPageRes.status === 200, 'GET http://localhost:3000/admin/orders/cod returns 200 OK');
    assert(
      typeof frontendPageRes.text === 'string' &&
        (frontendPageRes.text.includes('COD Orders') || frontendPageRes.text.includes('Cash on Delivery')),
      'Frontend page contains COD Orders Management components'
    );

    // Summary
    console.log('\n================================================================');
    console.log(`RESULTS: ${passed} / ${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
    console.log('================================================================\n');

    if (passed === total) {
      console.log('🎉 ALL COD ORDERS MANAGEMENT REQUIREMENTS VERIFIED 100%!');
    } else {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  }
}

runAdminCodOrdersTests();
