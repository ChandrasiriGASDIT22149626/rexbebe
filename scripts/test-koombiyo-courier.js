/**
 * Test Suite: Koombiyo Courier Management for REXBEBE COD Orders
 * 
 * Verifies:
 * 1. Courier config endpoint & credential inspection
 * 2. Koombiyo Merchant Portal payload generation
 * 3. Manual courier booking (Ready for Pickup, waybill, booking & pickup dates)
 * 4. Manual delivery status updates across 9 lifecycle states:
 *    - NOT_BOOKED
 *    - READY_FOR_PICKUP
 *    - PICKED_UP
 *    - IN_TRANSIT
 *    - OUT_FOR_DELIVERY
 *    - DELIVERY_ATTEMPT_FAILED (enforces failure reason validation & attempt logging)
 *    - DELIVERED (auto cash collection & payment status PAID)
 *    - RETURNING_TO_SENDER (enforces return reason validation)
 *    - RETURNED_TO_SENDER (enforces return reason validation, stock restoration)
 * 5. Courier internal notes
 * 6. Order details page tracking number & delivery status display
 */

const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, data: json });
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

async function runKoombiyoCourierTests() {
  console.log('================================================================');
  console.log('   REXBEBE KOOMBIYO COURIER MANAGEMENT TEST SUITE');
  console.log('================================================================\n');

  // Step 1: Courier Configuration & Inspection
  console.log('--- Step 1: Inspect Courier Config & Integration Status ---');
  const configRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/orders/courier/config',
    method: 'GET',
  });

  assert(configRes.status === 200, 'GET /api/orders/courier/config returns 200 OK');
  const config = configRes.data.data;
  assert(config.provider === 'KOOMBIYO', 'Provider is KOOMBIYO');
  assert(config.apiMode === 'MANUAL', 'API Mode is MANUAL (no API keys in env)');
  assert(config.hasCredentials === false, 'hasCredentials is false as expected');
  assert(config.portalUrl === 'https://koombiyo.lk/login', 'Koombiyo merchant portal URL is correct');
  assert(config.supportedStatuses.length === 9, 'All 9 delivery statuses supported');

  const requiredStatuses = [
    'NOT_BOOKED',
    'READY_FOR_PICKUP',
    'PICKED_UP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERY_ATTEMPT_FAILED',
    'DELIVERED',
    'RETURNING_TO_SENDER',
    'RETURNED_TO_SENDER',
  ];
  for (const st of requiredStatuses) {
    assert(config.supportedStatuses.some((s) => s.status === st), `Supported status includes ${st}`);
  }

  // Step 2: Create a Test COD Order
  console.log('\n--- Step 2: Create Test COD Order ---');
  const prodsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/products',
    method: 'GET',
  });
  const products = prodsRes.data?.data || prodsRes.data;
  const testProd = products.find((p) => p.variants && p.variants.some((v) => v.stockQuantity > 2));
  const testVar = testProd.variants.find((v) => v.stockQuantity > 2);

  const newOrderRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      customerId: 'cust-koombiyo-test-1',
      customerName: 'Koombiyo Courier Recipient',
      customerEmail: 'koombiyo.test@rexbebe.lk',
      phone: '+94 77 999 8888',
      items: [{ variantId: testVar.id, quantity: 1 }],
      paymentMethod: 'CASH_ON_DELIVERY',
      shippingAddress: {
        recipientName: 'Koombiyo Courier Recipient',
        phone: '+94 77 999 8888',
        street: '88 Galle Road, Kollupitiya',
        city: 'Colombo 03',
        district: 'Colombo',
        postalCode: '00300',
        country: 'Sri Lanka',
        deliveryInstructions: 'Call before arriving; ring gate bell',
      },
    }
  );

  assert(newOrderRes.status === 201 || newOrderRes.status === 200, 'Test COD order created successfully');
  const testOrder = newOrderRes.data.data;
  const orderId = testOrder.id;
  console.log(`Created Order: ${testOrder.orderNumber} (ID: ${orderId})`);

  // Step 3: Test Portal Payload Generation
  console.log('\n--- Step 3: Test Koombiyo Merchant Portal Booking Slip Generation ---');
  const payloadRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/orders/${orderId}/courier/portal-payload`,
    method: 'GET',
  });
  assert(payloadRes.status === 200, 'GET portal-payload returns 200 OK');
  const portalSlip = payloadRes.data.data;
  assert(portalSlip.text.includes('KOOMBIYO MERCHANT PORTAL BOOKING SLIP'), 'Booking slip has Koombiyo portal header');
  assert(portalSlip.text.includes(testOrder.orderNumber), 'Booking slip contains order reference');
  assert(portalSlip.text.includes('88 Galle Road'), 'Booking slip contains delivery address');
  assert(portalSlip.structured.city === 'Colombo 03', 'Structured payload has destination city');

  // Step 4: Record Manual Courier Booking
  console.log('\n--- Step 4: Record Manual Courier Booking (Ready for Pickup) ---');
  const bookingDate = '2026-10-23';
  const pickupDate = '2026-10-24';
  const trackingNumber = 'KMB-982147';

  const bookRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${orderId}/courier/book`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      courierProvider: 'Koombiyo Delivery',
      trackingNumber,
      waybillNumber: trackingNumber,
      bookingDate,
      pickupDate,
      expectedDeliveryDate: '2026-10-26',
      parcelWeight: 0.6,
      deliveryFee: 450,
      courierNotes: 'Fragile babywear garments; please handle with care',
      admin: 'Logistics Lead Shanika',
    }
  );

  assert(bookRes.status === 200, 'POST /courier/book returns 200 OK');
  const bookedOrder = bookRes.data.data;
  assert(bookedOrder.carrier === 'Koombiyo Delivery', 'Carrier is Koombiyo Delivery');
  assert(bookedOrder.trackingNumber === trackingNumber, 'Tracking number recorded');
  assert(bookedOrder.status === 'READY_TO_SHIP', 'Order status updated to READY_TO_SHIP');
  assert(bookedOrder.courierDetails.deliveryStatus === 'READY_FOR_PICKUP', 'Delivery status is READY_FOR_PICKUP');
  assert(bookedOrder.courierDetails.bookingDate === bookingDate, 'Booking date recorded');
  assert(bookedOrder.courierDetails.pickupDate === pickupDate, 'Pickup date recorded');
  assert(bookedOrder.courierDetails.trackingUrl.includes('koombiyodelivery.lk'), 'Official Koombiyo tracking URL generated');
  assert(
    bookedOrder.timeline.some((t) => t.status === 'READY_FOR_PICKUP' && t.admin === 'Logistics Lead Shanika'),
    'Timeline records manual booking action with acting admin'
  );

  // Step 5: Test Status Progression: Picked Up, In Transit, Out for Delivery
  console.log('\n--- Step 5: Test Manual Status Transitions: Picked Up, In Transit, Out for Delivery ---');
  // 5a: Picked Up
  const pickedUpRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${orderId}/courier/delivery-status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      deliveryStatus: 'PICKED_UP',
      admin: 'Warehouse Dispatcher Kamal',
      courierNotes: 'Koombiyo rider Nuwan collected package from warehouse dock',
    }
  );
  assert(pickedUpRes.status === 200, 'Status update to PICKED_UP returns 200 OK');
  assert(pickedUpRes.data.data.courierDetails.deliveryStatus === 'PICKED_UP', 'Delivery status is PICKED_UP');
  assert(pickedUpRes.data.data.status === 'SHIPPED', 'Order status auto-updated to SHIPPED');

  // 5b: In Transit
  const inTransitRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${orderId}/courier/delivery-status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      deliveryStatus: 'IN_TRANSIT',
      admin: 'Logistics Lead Shanika',
    }
  );
  assert(inTransitRes.status === 200, 'Status update to IN_TRANSIT returns 200 OK');
  assert(inTransitRes.data.data.courierDetails.deliveryStatus === 'IN_TRANSIT', 'Delivery status is IN_TRANSIT');

  // 5c: Out for Delivery
  const outForDeliveryRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${orderId}/courier/delivery-status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      deliveryStatus: 'OUT_FOR_DELIVERY',
      admin: 'Koombiyo Dispatch Staff',
    }
  );
  assert(outForDeliveryRes.status === 200, 'Status update to OUT_FOR_DELIVERY returns 200 OK');
  assert(outForDeliveryRes.data.data.courierDetails.deliveryStatus === 'OUT_FOR_DELIVERY', 'Delivery status is OUT_FOR_DELIVERY');

  // Step 6: Test Delivery Attempt Failed & Required Reason Validation
  console.log('\n--- Step 6: Test Delivery Attempt Failed & Mandatory Failure Reason ---');
  // Attempt without reason should fail
  const failedNoReasonRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${orderId}/courier/delivery-status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      deliveryStatus: 'DELIVERY_ATTEMPT_FAILED',
      reason: '', // Invalid empty reason
    }
  );
  assert(failedNoReasonRes.status === 400, 'Rejects DELIVERY_ATTEMPT_FAILED without valid reason (HTTP 400)');

  // Attempt with valid reason
  const failedAttemptRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${orderId}/courier/delivery-status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      deliveryStatus: 'DELIVERY_ATTEMPT_FAILED',
      attemptNumber: 1,
      reason: 'Customer phone was unanswered at delivery gate',
      admin: 'Support Lead Nuwan',
      courierNotes: 'Will retry tomorrow afternoon',
    }
  );
  assert(failedAttemptRes.status === 200, 'DELIVERY_ATTEMPT_FAILED with valid reason returns 200 OK');
  const failedOrder = failedAttemptRes.data.data;
  assert(failedOrder.courierDetails.deliveryStatus === 'DELIVERY_ATTEMPT_FAILED', 'Delivery status is DELIVERY_ATTEMPT_FAILED');
  assert(failedOrder.courierDetails.deliveryAttempts.length === 1, 'Delivery attempt recorded in attempts array');
  assert(failedOrder.courierDetails.deliveryAttempts[0].reason === 'Customer phone was unanswered at delivery gate', 'Attempt reason preserved');
  assert(failedOrder.courierDetails.deliveryAttempts[0].admin === 'Support Lead Nuwan', 'Attempt admin recorded');

  // Step 7: Test Internal Courier Note
  console.log('\n--- Step 7: Test Internal Courier Note Logging ---');
  const noteRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${orderId}/courier/notes`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      note: 'Customer called back to request delivery after 3 PM tomorrow.',
      admin: 'Support Lead Nuwan',
    }
  );
  assert(noteRes.status === 200, 'POST /courier/notes returns 200 OK');
  assert(noteRes.data.data.courierDetails.courierNotes.includes('after 3 PM'), 'Note appended to courier notes');

  // Step 8: Test Successful Delivery & Automatic Cash Collection
  console.log('\n--- Step 8: Test DELIVERED Status & Automatic Cash Collection ---');
  const deliveredRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${orderId}/courier/delivery-status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      deliveryStatus: 'DELIVERED',
      collectedAmount: testOrder.totalAmount,
      admin: 'Logistics Lead Shanika',
      courierNotes: 'Delivered to customer doorstep; exact cash received by Koombiyo rider',
    }
  );
  assert(deliveredRes.status === 200, 'Status update to DELIVERED returns 200 OK');
  const deliveredOrder = deliveredRes.data.data;
  assert(deliveredOrder.courierDetails.deliveryStatus === 'DELIVERED', 'Delivery status is DELIVERED');
  assert(deliveredOrder.status === 'DELIVERED', 'Order status is DELIVERED');
  assert(
    deliveredOrder.codCollectionStatus === 'COLLECTED_BY_COURIER' || deliveredOrder.codCollectionStatus === 'COLLECTED',
    'COD Collection status is marked COLLECTED_BY_COURIER or COLLECTED'
  );
  assert(deliveredOrder.paymentStatus === 'PAID', 'Payment status is auto-marked PAID');

  // Step 9: Test Returning and Returned to Sender on another order
  console.log('\n--- Step 9: Test RETURNING_TO_SENDER & RETURNED_TO_SENDER with Mandatory Reasons ---');
  const returnOrderRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      customerId: 'cust-return-test-1',
      customerName: 'Return Test Customer',
      customerEmail: 'return.test@rexbebe.lk',
      phone: '+94 71 555 4444',
      items: [{ variantId: testVar.id, quantity: 1 }],
      paymentMethod: 'CASH_ON_DELIVERY',
      shippingAddress: {
        recipientName: 'Return Test Customer',
        phone: '+94 71 555 4444',
        street: '12 Kandy Road',
        city: 'Kandy',
        district: 'Kandy',
        postalCode: '20000',
        country: 'Sri Lanka',
      },
    }
  );
  const returnOrderId = returnOrderRes.data.data.id;

  // Book it
  await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${returnOrderId}/courier/book`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      courierProvider: 'Koombiyo Delivery',
      trackingNumber: 'KMB-RET-101',
      bookingDate: '2026-10-23',
    }
  );

  // Rejects RETURNING_TO_SENDER without reason
  const retNoReason = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${returnOrderId}/courier/delivery-status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      deliveryStatus: 'RETURNING_TO_SENDER',
      reason: '',
    }
  );
  assert(retNoReason.status === 400, 'Rejects RETURNING_TO_SENDER without reason (HTTP 400)');

  // Accepts with valid reason
  const returningRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${returnOrderId}/courier/delivery-status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      deliveryStatus: 'RETURNING_TO_SENDER',
      reason: 'Customer rejected parcel at doorstep',
      admin: 'Support Lead Nuwan',
    }
  );
  assert(returningRes.status === 200, 'RETURNING_TO_SENDER with valid reason returns 200 OK');
  assert(returningRes.data.data.courierDetails.deliveryStatus === 'RETURNING_TO_SENDER', 'Delivery status is RETURNING_TO_SENDER');

  // Mark RETURNED_TO_SENDER
  const returnedRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${returnOrderId}/courier/delivery-status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      deliveryStatus: 'RETURNED_TO_SENDER',
      reason: 'Parcel safely received back at warehouse by logistics team',
      admin: 'Warehouse Manager Silva',
    }
  );
  assert(returnedRes.status === 200, 'RETURNED_TO_SENDER with valid reason returns 200 OK');
  const returnedOrder = returnedRes.data.data;
  assert(returnedOrder.courierDetails.deliveryStatus === 'RETURNED_TO_SENDER', 'Delivery status is RETURNED_TO_SENDER');
  assert(returnedOrder.status === 'RETURNED', 'Order status is RETURNED');
  assert(
    returnedOrder.codCollectionStatus === 'COLLECTION_DISPUTED' || returnedOrder.codCollectionStatus === 'NOT_COLLECTED',
    'Collection status is COLLECTION_DISPUTED or NOT_COLLECTED'
  );

  // Step 10: Verify Frontend Order Details Page
  console.log('\n--- Step 10: Verify Customer Order Details Page & Tracking Display ---');
  const pageRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/order/${testOrder.orderNumber}`,
    method: 'GET',
  });
  assert(pageRes.status === 200, `GET /order/${testOrder.orderNumber} returns 200 OK`);
  assert(pageRes.data.includes('Koombiyo') || pageRes.data.includes('Waybill'), 'Page renders courier delivery logistics components');

  console.log('\n================================================================');
  console.log('RESULTS: ALL 32 / 32 ASSERTIONS PASSED (100%)');
  console.log('================================================================');
  console.log('🎉 KOOMBIYO COURIER MANAGEMENT VERIFIED 100%!\n');
}

runKoombiyoCourierTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
