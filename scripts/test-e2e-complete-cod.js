/**
 * REXBEBE COMPLETE END-TO-END COD VERIFICATION SUITE
 * Tests all 20 required scenarios:
 *  1. Customer places COD order
 *  2. Order appears in Admin Dashboard
 *  3. Stock deducted accurately
 *  4. Delivery zone and fee snapshotted
 *  5. Admin confirms and packs order
 *  6. Koombiyo booking recorded
 *  7. Tracking number saved
 *  8. Delivery status updates
 *  9. Successful delivery recorded
 * 10. COD collection confirmed
 * 11. Settlement reconciled
 * 12. Partial settlement & dispute adjustment handled
 * 13. Failed delivery & RTS processed
 * 14. Returned inventory restocked only when inspected & approved
 * 15. Duplicate requests prevented (no duplicate orders/stock deductions)
 * 16. Historical order totals unchanged when settings change
 * 17. Unauthorized users forbidden from accessing COD financial records (HTTP 401/403)
 * 18. Persistence across data store verified
 * 19. Existing checkout, payments, and product pages continue working
 * 20. Responsive layouts verified
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const BACKEND_PORT = 5000;
const FRONTEND_PORT = 3000;
const API_BASE = `http://localhost:${BACKEND_PORT}/api`;
const JWT_SECRET = 'rexbebe_super_secret_jwt_token_key_2026';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (options.role === 'CUSTOMER') {
      const customerToken = jwt.sign({ id: 'cust-e2e-1', email: 'customer@rexbebe.lk', role: 'CUSTOMER' }, JWT_SECRET);
      headers['Authorization'] = `Bearer ${customerToken}`;
    } else if (options.role === 'ADMIN') {
      headers['x-admin-role'] = 'ADMIN';
    } else if (options.auth === false) {
      // No auth header
    } else {
      headers['x-admin-role'] = 'ADMIN';
    }

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers,
    };

    const req = http.request(reqOptions, (res) => {
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
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failedTests++;
  }
}

async function runSuite() {
  console.log('================================================================');
  console.log('   REXBEBE COMPLETE E2E 20-SCENARIO VERIFICATION SUITE');
  console.log('================================================================\n');

  // Baseline data setup
  const prodsRes = await request(`${API_BASE}/products`);
  const products = Array.isArray(prodsRes.data?.data) ? prodsRes.data.data : (prodsRes.data?.data?.products || prodsRes.data);
  const testProduct = products.find(p => p.variants && p.variants.some(v => v.stockQuantity >= 5)) || products[0];
  const testVariant = testProduct.variants.find(v => v.stockQuantity >= 5) || testProduct.variants[0];
  const initialStock = testVariant.stockQuantity;

  console.log(`Product: "${testProduct.name}" (Variant: ${testVariant.name || testVariant.id}, Stock: ${initialStock})\n`);

  // ----------------------------------------------------------------
  // SCENARIO 1: Customer places COD order
  // ----------------------------------------------------------------
  console.log('--- SCENARIO 1: Customer places COD order ---');
  const timestamp = Date.now();
  const orderRes = await request(`${API_BASE}/orders`, {
    method: 'POST',
    body: {
      customerId: `cust-e2e-${timestamp}`,
      customerName: 'Kavindu Bandara',
      customerEmail: `kavindu.${timestamp}@example.lk`,
      phone: '+94 77 123 4567',
      paymentMethod: 'CASH_ON_DELIVERY',
      items: [{ variantId: testVariant.id, quantity: 2 }],
      shippingAddress: {
        recipientName: 'Kavindu Bandara',
        street: '12 Temple Road',
        city: 'Wattala',
        district: 'Gampaha',
        postalCode: '11300',
        phone: '+94 77 123 4567',
      },
    },
  });

  assert(orderRes.status === 201 || orderRes.status === 200, 'Order creation returns 201/200');
  const order1 = orderRes.data?.data || orderRes.data;
  assert(!!order1.orderNumber, `Order placed with number: ${order1.orderNumber}`);
  assert(order1.status === 'PENDING_CONFIRMATION', 'Initial order status is PENDING_CONFIRMATION');
  assert(order1.paymentMethod === 'CASH_ON_DELIVERY' || order1.paymentMethod === 'COD', 'Payment method is COD');
  assert(order1.codFinancialStatus === 'COLLECTION_PENDING', 'Financial status is COLLECTION_PENDING');
  assert(order1.amountToCollect > 0, `Amount to collect recorded: LKR ${order1.amountToCollect}`);

  // ----------------------------------------------------------------
  // SCENARIO 2: Appears in Admin Dashboard
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 2: Appears in Admin Dashboard ---');
  const adminCodOrders = await request(`${API_BASE}/orders?paymentMethod=COD`);
  assert(adminCodOrders.status === 200, 'Admin COD orders endpoint returns 200');
  const foundInList = (adminCodOrders.data?.data || adminCodOrders.data).some(o => o.id === order1.id || o.orderNumber === order1.orderNumber);
  assert(foundInList, 'New COD order is present in Admin orders list');

  const analyticsRes = await request(`${API_BASE}/orders/reports/cod-analytics`);
  assert(analyticsRes.status === 200, 'GET /api/orders/reports/cod-analytics returns 200');
  assert(analyticsRes.data.data.summaryCards.totalCodOrders.count > 0, 'Analytics reflects total COD orders');
  assert(analyticsRes.data.data.summaryCards.pendingConfirmationOrders.count > 0, 'Analytics reflects pending confirmation count');

  // ----------------------------------------------------------------
  // SCENARIO 3: Stock deducted accurately
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 3: Stock deducted accurately ---');
  const prodsAfter = await request(`${API_BASE}/products`);
  const productsAfter = Array.isArray(prodsAfter.data?.data) ? prodsAfter.data.data : (prodsAfter.data?.data?.products || prodsAfter.data);
  const updatedVariant = productsAfter.find(p => p.id === testProduct.id).variants.find(v => v.id === testVariant.id);
  assert(updatedVariant.stockQuantity === initialStock - 2, `Stock deducted by ordered qty (was: ${initialStock}, now: ${updatedVariant.stockQuantity})`);

  // ----------------------------------------------------------------
  // SCENARIO 4: Delivery zone and fee snapshotted
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 4: Delivery zone and fee snapshotted ---');
  assert(!!order1.deliveryZoneSnapshot, 'order.deliveryZoneSnapshot is present');
  assert(order1.deliveryZoneSnapshot.town.toLowerCase() === 'wattala', 'Snapshot records town Wattala');
  assert(order1.deliveryZoneSnapshot.district.toLowerCase() === 'gampaha', 'Snapshot records district Gampaha');
  assert(order1.deliveryZoneSnapshot.deliveryFee === 400, 'Snapshot fee matches configured zone fee LKR 400');
  assert(order1.deliveryFee === 400 || order1.shippingFee === 400, 'Order delivery fee matches snapshot');

  // ----------------------------------------------------------------
  // SCENARIO 5: Admin confirms and packs
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 5: Admin confirms and packs ---');
  const confirmRes = await request(`${API_BASE}/orders/${order1.id}/status`, {
    method: 'PATCH',
    body: { status: 'CONFIRMED', adminName: 'Admin Supun', note: 'Phone confirmed with customer' },
  });
  assert(confirmRes.status === 200, 'Order confirmation returns 200');
  assert((confirmRes.data?.data || confirmRes.data).status === 'CONFIRMED', 'Order status is now CONFIRMED');

  const packRes = await request(`${API_BASE}/orders/${order1.id}/status`, {
    method: 'PATCH',
    body: { status: 'PACKED', adminName: 'Warehouse Lead Anura', note: 'Quality check passed & securely packed' },
  });
  assert(packRes.status === 200, 'Order packed returns 200');
  assert((packRes.data?.data || packRes.data).status === 'PACKED', 'Order status is now PACKED');

  // ----------------------------------------------------------------
  // SCENARIO 6: Koombiyo booking recorded
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 6: Koombiyo booking recorded ---');
  const bookRes = await request(`${API_BASE}/orders/${order1.id}/courier/book`, {
    method: 'POST',
    body: {
      carrier: 'Koombiyo Delivery',
      waybillNumber: `KB-E2E-${timestamp}`,
      pickupDate: new Date().toISOString(),
      admin: 'Operations Lead Dilshan',
      instructions: 'Hand over baby clothing parcel with invoice',
    },
  });
  assert(bookRes.status === 200, 'Courier booking returns 200');
  const bookedOrder = bookRes.data?.data || bookRes.data;
  assert(bookedOrder.status === 'READY_TO_SHIP', 'Order status is READY_TO_SHIP');
  assert(bookedOrder.courierDetails?.deliveryStatus === 'READY_FOR_PICKUP', 'Courier delivery status is READY_FOR_PICKUP');

  // ----------------------------------------------------------------
  // SCENARIO 7: Tracking number saved
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 7: Tracking number saved ---');
  assert(bookedOrder.trackingNumber === `KB-E2E-${timestamp}`, 'Tracking number recorded accurately');
  assert(bookedOrder.courierDetails?.waybillNumber === `KB-E2E-${timestamp}`, 'Waybill number recorded in courierDetails');
  assert(bookedOrder.courierDetails?.trackingUrl?.includes('koombiyo'), 'Official Koombiyo tracking URL generated');

  // ----------------------------------------------------------------
  // SCENARIO 8: Delivery status updates
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 8: Delivery status updates ---');
  const pickupRes = await request(`${API_BASE}/orders/${order1.id}/courier/delivery-status`, {
    method: 'PATCH',
    body: { deliveryStatus: 'PICKED_UP', admin: 'Dispatcher Kasun' },
  });
  assert(pickupRes.status === 200, 'Status update to PICKED_UP returns 200');

  const transitRes = await request(`${API_BASE}/orders/${order1.id}/courier/delivery-status`, {
    method: 'PATCH',
    body: { deliveryStatus: 'IN_TRANSIT', admin: 'Hub Supervisor Ruwan' },
  });
  assert(transitRes.status === 200, 'Status update to IN_TRANSIT returns 200');

  const outForDeliveryRes = await request(`${API_BASE}/orders/${order1.id}/courier/delivery-status`, {
    method: 'PATCH',
    body: { deliveryStatus: 'OUT_FOR_DELIVERY', admin: 'Rider Dinesh' },
  });
  assert(outForDeliveryRes.status === 200, 'Status update to OUT_FOR_DELIVERY returns 200');

  // ----------------------------------------------------------------
  // SCENARIO 9: Successful delivery recorded
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 9: Successful delivery recorded ---');
  const deliverRes = await request(`${API_BASE}/orders/${order1.id}/courier/delivery-status`, {
    method: 'PATCH',
    body: { deliveryStatus: 'DELIVERED', admin: 'Rider Dinesh', deliveryNotes: 'Received by customer at doorstep' },
  });
  assert(deliverRes.status === 200, 'Status update to DELIVERED returns 200');
  const deliveredOrder = deliverRes.data?.data || deliverRes.data;
  assert(deliveredOrder.status === 'DELIVERED', 'Order status is DELIVERED');
  assert(deliveredOrder.courierDetails?.deliveryStatus === 'DELIVERED', 'Courier delivery status is DELIVERED');

  // ----------------------------------------------------------------
  // SCENARIO 10: COD collection confirmed (Separation from Settlement)
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 10: COD collection confirmed ---');
  const collectionRes = await request(`${API_BASE}/orders/${order1.id}/cod-collection`, {
    method: 'PATCH',
    body: {
      status: 'COLLECTED_BY_COURIER',
      courierReportedAmount: order1.amountToCollect,
      collectionDate: '2026-10-23',
      admin: 'Koombiyo Dispatch Hub',
      notes: 'Customer paid exact cash to rider.',
    },
  });
  assert(collectionRes.status === 200, 'COD collection recording returns 200');
  const collectedOrder = collectionRes.data?.data || collectionRes.data;
  assert(collectedOrder.codCollectionStatus === 'COLLECTED_BY_COURIER', 'COD collection status is COLLECTED_BY_COURIER');
  assert(collectedOrder.codFinancialStatus === 'SETTLEMENT_PENDING', 'Financial status transitioned to SETTLEMENT_PENDING');
  assert(!collectedOrder.courierDetails?.amountRemitted || collectedOrder.courierDetails.amountRemitted === 0, 'CRITICAL: Bank remittance remains 0 until actual bank settlement');

  // ----------------------------------------------------------------
  // SCENARIO 11: Settlement reconciled
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 11: Settlement reconciled ---');
  const expectedCod = order1.amountToCollect;
  const deliveryCharge = 400;
  const netRemittance = expectedCod - deliveryCharge;

  const settleRes = await request(`${API_BASE}/settlements`, {
    method: 'POST',
    body: {
      orderId: order1.id,
      settlementBatchRef: `KB-SETTLE-BATCH-${timestamp}`,
      bankReference: `BOC-TXN-REF-${timestamp}`,
      courierReportedAmount: expectedCod,
      actualAmountReceived: netRemittance,
      settlementDate: new Date().toISOString(),
      authorizedBy: 'Senior Accountant Fernando',
      documentedDeductions: [{ type: 'DELIVERY_FEE', amount: deliveryCharge, description: 'Standard Koombiyo Delivery Charge' }],
      notes: 'Full bank remittance verified via online banking statement',
    },
  });
  assert(settleRes.status === 201, 'Settlement recorded with 201 Created');
  const settleData = settleRes.data?.data?.settlement || settleRes.data?.data;
  assert(settleData.financialStatus === 'SETTLED' || settleData.codFinancialStatus === 'SETTLED', 'Financial status is SETTLED');
  assert(settleData.actualAmountReceived === netRemittance, `Actual bank amount received is LKR ${netRemittance}`);
  assert(settleData.discrepancyAmount === 0, 'Discrepancy amount is 0');

  // ----------------------------------------------------------------
  // SCENARIO 12: Partial settlement & dispute adjustment handled
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 12: Partial settlement & dispute adjustment ---');
  // Create another order for partial settlement
  const order2Res = await request(`${API_BASE}/orders`, {
    method: 'POST',
    body: {
      customerId: `cust-dispute-${timestamp}`,
      customerName: 'Roshan Silva',
      customerEmail: `roshan.${timestamp}@example.lk`,
      phone: '+94 71 999 8888',
      paymentMethod: 'CASH_ON_DELIVERY',
      items: [{ variantId: testVariant.id, quantity: 1 }],
      shippingAddress: {
        recipientName: 'Roshan Silva',
        street: '88 Station Road',
        city: 'Kandy',
        district: 'Kandy',
        postalCode: '20000',
        phone: '+94 71 999 8888',
      },
    },
  });
  const order2 = order2Res.data?.data || order2Res.data;

  // Shortfall without discrepancyReason must fail
  const badShortfall = await request(`${API_BASE}/settlements`, {
    method: 'POST',
    body: {
      orderId: order2.id,
      settlementBatchRef: `KB-BATCH-ERR-${timestamp}`,
      bankReference: `HNB-ERR-${timestamp}`,
      courierReportedAmount: order2.amountToCollect,
      actualAmountReceived: 100, // short
      authorizedBy: 'Finance Lead',
      // missing discrepancyReason
    },
  });
  assert(badShortfall.status === 400, 'Rejects shortfall when discrepancyReason is missing (HTTP 400)');

  // Shortfall WITH discrepancyReason succeeds as PARTIALLY_SETTLED
  const partialSettle = await request(`${API_BASE}/settlements`, {
    method: 'POST',
    body: {
      orderId: order2.id,
      settlementBatchRef: `KB-PARTIAL-${timestamp}`,
      bankReference: `HNB-TXN-${timestamp}`,
      courierReportedAmount: order2.amountToCollect,
      documentedDeductions: [{ type: 'DELIVERY_FEE', amount: 450, description: 'Delivery fee' }],
      actualAmountReceived: Math.max(0, order2.amountToCollect - 450 - 200),
      settlementDate: new Date().toISOString(),
      authorizedBy: 'Finance Lead Nimal',
      discrepancyReason: 'Courier held LKR 200 pending zone surcharge investigation',
    },
  });
  assert(partialSettle.status === 201, 'Partial settlement with valid reason returns 201');
  const partialData = partialSettle.data?.data?.settlement || partialSettle.data?.data;
  assert(partialData.financialStatus === 'PARTIALLY_SETTLED', 'Status is PARTIALLY_SETTLED');
  assert(partialData.discrepancyAmount === 200, 'Discrepancy of LKR 200 recorded');

  // Dispute recording via cod-collection endpoint
  const disputeRes = await request(`${API_BASE}/orders/${order2.id}/cod-collection`, {
    method: 'PATCH',
    body: {
      status: 'COLLECTION_DISPUTED',
      disputeReason: 'Parcel reported lost in courier transit hub',
      admin: 'Senior Auditor Perera',
    },
  });
  assert(disputeRes.status === 200, 'Dispute recorded with HTTP 200');
  assert(disputeRes.data.data.codFinancialStatus === 'COLLECTION_DISPUTED', 'Status transitioned to COLLECTION_DISPUTED');

  // ----------------------------------------------------------------
  // SCENARIO 13: Failed delivery & RTS processed
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 13: Failed delivery & RTS processed ---');
  const order3Res = await request(`${API_BASE}/orders`, {
    method: 'POST',
    body: {
      customerId: `cust-fail-${timestamp}`,
      customerName: 'Chamari Atapattu',
      customerEmail: `chamari.${timestamp}@example.lk`,
      phone: '+94 77 444 3333',
      paymentMethod: 'CASH_ON_DELIVERY',
      items: [{ variantId: testVariant.id, quantity: 1 }],
      shippingAddress: {
        recipientName: 'Chamari Atapattu',
        street: '72 Sea Street',
        city: 'Galle',
        district: 'Galle',
        postalCode: '80000',
        phone: '+94 77 444 3333',
      },
    },
  });
  const order3 = order3Res.data?.data || order3Res.data;

  // Record failed attempt
  const failRes = await request(`${API_BASE}/orders/${order3.id}/delivery-attempt`, {
    method: 'POST',
    body: {
      reasonCode: 'CUSTOMER_UNAVAILABLE',
      failureNotes: 'Gate locked, security confirmed recipient travelling',
      canRetry: true,
      retryDate: new Date(Date.now() + 86400000).toISOString(),
      adminName: 'Koombiyo Dispatcher',
    },
  });
  assert(failRes.status === 200, 'Delivery attempt failure returns 200');
  const failedOrder = failRes.data?.data || failRes.data;
  assert(failedOrder.courierDetails?.deliveryStatus === 'DELIVERY_ATTEMPT_FAILED', 'Delivery status is DELIVERY_ATTEMPT_FAILED');
  assert(failedOrder.codCollectionStatus === 'COLLECTION_PENDING', 'COD collection remains strictly PENDING on failed delivery');

  // Initiate RTS
  const rtsRes = await request(`${API_BASE}/orders/${order3.id}/return-to-sender`, {
    method: 'POST',
    body: {
      reason: 'Exceeded max delivery attempts, returning to sender warehouse',
      verifiedReturnCharge: 350,
      admin: 'Logistics Supervisor Nuwan',
    },
  });
  assert(rtsRes.status === 200, 'Initiate RTS returns 200');
  const rtsOrder = rtsRes.data?.data || rtsRes.data;
  assert(rtsOrder.courierDetails?.deliveryStatus === 'RETURNING_TO_SENDER', 'Delivery status is RETURNING_TO_SENDER');
  assert(rtsOrder.verifiedReturnCharges === 350 || rtsOrder.courierDetails?.returnCharge === 350, 'Verified return charge recorded: LKR 350');

  // ----------------------------------------------------------------
  // SCENARIO 14: Returned inventory restocked only when inspected & approved
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 14: Restocked only when inspected & approved ---');
  // Fetch current stock before inspection
  const prodsBeforeInspect = await request(`${API_BASE}/products`);
  const stockBeforeInspect = (prodsBeforeInspect.data?.data || prodsBeforeInspect.data)
    .find(p => p.id === testProduct.id).variants.find(v => v.id === testVariant.id).stockQuantity;

  // Perform return inspection with RESTOCK_APPROVED
  const inspectRes = await request(`${API_BASE}/orders/${order3.id}/return-inspection`, {
    method: 'POST',
    body: {
      returnDate: '2026-10-24',
      parcelCondition: 'INTACT_SEALED',
      decision: 'RESTOCK_APPROVED',
      inspector: 'Warehouse QA Nimalka',
      verifiedReturnCharge: 350,
      notes: 'Package intact, tags attached, restocked to shelf',
      items: [
        {
          variantId: testVariant.id,
          condition: 'INTACT',
          quantityReturned: 1,
          quantityToRestock: 1,
          restockApproved: true,
          notes: 'Restocked into active inventory',
        },
      ],
    },
  });
  assert(inspectRes.status === 200, 'Return inspection returns 200');
  const inspectedOrder = inspectRes.data?.data || inspectRes.data;
  assert(inspectedOrder.status === 'RETURNED', 'Order status is RETURNED');
  assert(inspectedOrder.courierDetails?.deliveryStatus === 'RETURNED_TO_SENDER', 'Delivery status is RETURNED_TO_SENDER');

  // Verify stock was incremented by 1
  const prodsAfterInspect = await request(`${API_BASE}/products`);
  const stockAfterInspect = (prodsAfterInspect.data?.data || prodsAfterInspect.data)
    .find(p => p.id === testProduct.id).variants.find(v => v.id === testVariant.id).stockQuantity;
  assert(stockAfterInspect === stockBeforeInspect + 1, `Stock restocked correctly (+1: was ${stockBeforeInspect}, now ${stockAfterInspect})`);

  // ----------------------------------------------------------------
  // SCENARIO 15: Duplicate requests prevented (Idempotency & Double Submit)
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 15: Duplicate requests prevented ---');
  const idempotencyKey = `e2e-idem-key-${Date.now()}`;
  const duplicatePayload = {
    customerId: 'cust-duplicate-test',
    customerName: 'Idempotency Tester',
    customerEmail: 'idem@example.com',
    phone: '+94 77 123 4567',
    paymentMethod: 'CASH_ON_DELIVERY',
    idempotencyKey: idempotencyKey,
    items: [{ variantId: testVariant.id, quantity: 1 }],
    shippingAddress: {
      recipientName: 'Idempotency Tester',
      phone: '+94 77 123 4567',
      street: '1 Idem Street',
      city: 'Wattala',
      district: 'Gampaha',
    },
  };

  const firstSubmission = await request(`${API_BASE}/orders`, { method: 'POST', body: duplicatePayload });
  assert(firstSubmission.status === 201 || firstSubmission.status === 200, 'First submission succeeded');
  const orderNum1 = firstSubmission.data?.data?.orderNumber || firstSubmission.data?.orderNumber;

  const stockBeforeDup = (await request(`${API_BASE}/products`)).data.data.find(p => p.id === testProduct.id).variants.find(v => v.id === testVariant.id).stockQuantity;

  // Immediate identical second submission
  const secondSubmission = await request(`${API_BASE}/orders`, { method: 'POST', body: duplicatePayload });
  const orderNum2 = secondSubmission.data?.data?.orderNumber || secondSubmission.data?.orderNumber;
  assert(orderNum1 === orderNum2, `Duplicate request returns identical existing order (${orderNum1})`);

  const stockAfterDup = (await request(`${API_BASE}/products`)).data.data.find(p => p.id === testProduct.id).variants.find(v => v.id === testVariant.id).stockQuantity;
  assert(stockBeforeDup === stockAfterDup, 'CRITICAL: No double stock deduction on duplicate order');

  // ----------------------------------------------------------------
  // SCENARIO 16: Historical order totals unchanged when settings change
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 16: Historical order totals unchanged ---');
  // Temporarily update delivery settings
  const settingsRes = await request(`${API_BASE}/delivery-settings`);
  const initialSettings = settingsRes.data?.data;
  const nearbyZone = initialSettings.deliveryZones.find(z => z.id === 'zone-gampaha-nearby');
  const origFee = nearbyZone.deliveryFee;

  // Change zone fee from 400 to 499
  await request(`${API_BASE}/delivery-settings/zones/zone-gampaha-nearby`, {
    method: 'PUT',
    body: { deliveryFee: 499 },
  });

  // Re-fetch order1
  const historicOrder = (await request(`${API_BASE}/orders/${order1.id}`)).data?.data;
  assert(historicOrder.deliveryFee === 400 || historicOrder.shippingFee === 400, 'Historic order delivery fee unchanged (400)');
  assert(historicOrder.totalAmount === order1.totalAmount, 'Historic order totalAmount unchanged');
  assert(historicOrder.amountToCollect === order1.amountToCollect, 'Historic order amountToCollect unchanged');

  // Restore fee back
  await request(`${API_BASE}/delivery-settings/zones/zone-gampaha-nearby`, {
    method: 'PUT',
    body: { deliveryFee: origFee },
  });

  // ----------------------------------------------------------------
  // SCENARIO 17: Unauthorized users forbidden from accessing COD financial records
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 17: Unauthorized users forbidden (HTTP 401/403) ---');
  const unauthedRes = await request(`${API_BASE}/settlements/ledger`, { auth: false });
  assert(unauthedRes.status === 401, `Unauthenticated request blocked with 401 Unauthorized (got: ${unauthedRes.status})`);

  const customerRes = await request(`${API_BASE}/settlements/ledger`, { role: 'CUSTOMER' });
  assert(customerRes.status === 403, `Customer role request blocked with 403 Forbidden (got: ${customerRes.status})`);

  const adminRes = await request(`${API_BASE}/settlements/ledger`, { role: 'ADMIN' });
  assert(adminRes.status === 200, `Authorized ADMIN request allowed with 200 OK (got: ${adminRes.status})`);

  // ----------------------------------------------------------------
  // SCENARIO 18: Persistence across data store verified
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 18: Persistence across data store verified ---');
  const backendDataDir = path.resolve(__dirname, '../backend/data');
  const ordersFile = path.join(backendDataDir, 'orders.json');
  const settlementsFile = path.join(backendDataDir, 'settlements.json');
  const auditLogsFile = path.join(backendDataDir, 'audit_logs.json');
  const notificationsFile = path.join(backendDataDir, 'notifications.json');

  assert(fs.existsSync(ordersFile), 'backend/data/orders.json exists and is persistent');
  assert(fs.existsSync(settlementsFile), 'backend/data/settlements.json exists and is persistent');
  assert(fs.existsSync(auditLogsFile), 'backend/data/audit_logs.json exists and is persistent');
  assert(fs.existsSync(notificationsFile), 'backend/data/notifications.json exists and is persistent');

  const parsedOrders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
  const foundPersistentOrder = parsedOrders.some(o => o.id === order1.id);
  assert(foundPersistentOrder, 'Test COD order is written to disk in orders.json');

  const parsedSettlements = JSON.parse(fs.readFileSync(settlementsFile, 'utf8'));
  const foundPersistentSettlement = parsedSettlements.some(s => s.orderId === order1.id);
  assert(foundPersistentSettlement, 'Settlement record is written to disk in settlements.json');

  // ----------------------------------------------------------------
  // SCENARIO 19: Existing checkout, payments, and product pages continue working
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 19: Existing pages continue working ---');
  const checkPages = [
    { url: `${API_BASE}/products`, name: 'Products API' },
    { url: `${API_BASE}/categories`, name: 'Categories API' },
    { url: `${API_BASE}/delivery-settings`, name: 'Delivery Settings API' },
    { url: `http://localhost:${FRONTEND_PORT}/checkout`, name: 'Frontend Checkout Page' },
    { url: `http://localhost:${FRONTEND_PORT}/admin/settings/delivery`, name: 'Frontend Delivery Settings' },
    { url: `http://localhost:${FRONTEND_PORT}/admin/reports/cod`, name: 'Frontend COD Analytics & Reports' },
    { url: `http://localhost:${FRONTEND_PORT}/admin/orders/cod`, name: 'Frontend Admin COD Orders' },
  ];

  for (const page of checkPages) {
    const res = await request(page.url, { auth: false });
    assert(res.status === 200, `${page.name} returns HTTP 200 OK`);
  }

  // ----------------------------------------------------------------
  // SCENARIO 20: Responsive layouts verified
  // ----------------------------------------------------------------
  console.log('\n--- SCENARIO 20: Responsive layouts verified ---');
  const codReportFile = path.resolve(__dirname, '../frontend/app/admin/reports/cod/page.tsx');
  const codOrdersFile = path.resolve(__dirname, '../frontend/app/admin/orders/cod/page.tsx');
  const adminPageFile = path.resolve(__dirname, '../frontend/app/admin/page.tsx');

  const reportContent = fs.readFileSync(codReportFile, 'utf8');
  const ordersContent = fs.readFileSync(codOrdersFile, 'utf8');
  const adminContent = fs.readFileSync(adminPageFile, 'utf8');

  assert(reportContent.includes('overflow-x-auto'), 'COD reports page has responsive overflow-x-auto for tables');
  assert(reportContent.includes('grid grid-cols-') || reportContent.includes('grid-cols-2'), 'COD reports layout uses responsive multi-column grid');
  assert(ordersContent.includes('flex-col sm:flex-row') || ordersContent.includes('grid'), 'Admin COD orders view uses responsive layouts');
  assert(adminContent.includes('Cash on Delivery (COD) Command Center'), 'Admin Dashboard features COD Command Center');

  // Summary
  console.log('\n================================================================');
  console.log(`TOTAL SCENARIO TESTS: ${totalTests}`);
  console.log(`PASSED: ${passedTests}`);
  console.log(`FAILED: ${failedTests}`);
  console.log('================================================================');

  if (failedTests > 0) {
    console.error('❌ SOME TESTS FAILED');
    process.exit(1);
  } else {
    console.log('🎉 ALL 20 SCENARIOS PASSED WITH 100% SUCCESS! ✅');
  }
}

runSuite().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
