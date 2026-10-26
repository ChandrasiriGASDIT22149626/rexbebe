const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ [PASS] ${message}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('  REXBEBE FAILED DELIVERY & RETURN-TO-SENDER TEST SUITE');
  console.log('================================================================\n');

  // Step 1: Catalog of Standardized Failure Reasons
  console.log('--- Step 1: Standardized Delivery Failure Reasons Catalog ---');
  const catalogRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/orders/returns/failure-reasons',
    method: 'GET',
  });
  assert(catalogRes.status === 200, 'GET /api/orders/returns/failure-reasons returns 200 OK');
  const catalog = catalogRes.data.data;
  assert(Array.isArray(catalog) && catalog.length >= 6, 'Catalog contains all 6 failure reasons');

  const reasonCodes = catalog.map((r) => r.code);
  assert(reasonCodes.includes('CUSTOMER_UNAVAILABLE'), 'Supports CUSTOMER_UNAVAILABLE');
  assert(reasonCodes.includes('INCORRECT_ADDRESS'), 'Supports INCORRECT_ADDRESS');
  assert(reasonCodes.includes('PHONE_UNREACHABLE'), 'Supports PHONE_UNREACHABLE');
  assert(reasonCodes.includes('CUSTOMER_REFUSED'), 'Supports CUSTOMER_REFUSED');
  assert(reasonCodes.includes('COURIER_ISSUE'), 'Supports COURIER_ISSUE');
  assert(reasonCodes.includes('OTHER'), 'Supports OTHER');

  const refusalEntry = catalog.find((r) => r.code === 'CUSTOMER_REFUSED');
  assert(refusalEntry && refusalEntry.supportsRetry === false, 'Refusal does not support retry');

  // Step 2: Get active product variant for test order
  console.log('\n--- Step 2: Product & Stock Baseline Setup ---');
  const prodRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/products',
    method: 'GET',
  });
  const products = prodRes.data.data;
  assert(products.length > 0, 'Products catalog is loaded');
  let targetProduct = null;
  let targetVariant = null;
  for (const prod of products) {
    const v = (prod.variants || []).find((varItem) => (varItem.stockQuantity || 0) >= 10);
    if (v) {
      targetProduct = prod;
      targetVariant = v;
      break;
    }
  }
  if (!targetVariant) {
    targetProduct = products[0];
    targetVariant = targetProduct.variants[0];
    // replenish for test if needed
    await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/inventory/variants/${targetVariant.id}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    }, { stockQuantity: 20, reason: 'Test setup replenish' });
    targetVariant.stockQuantity = 20;
  }
  const baselineStock = targetVariant.stockQuantity;
  console.log(`Target Variant: ${targetVariant.id}, Baseline Stock: ${baselineStock}`);

  // Step 3: Create COD Order
  console.log('\n--- Step 3: Create Test COD Order ---');
  const orderRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      customerId: 'cust-rts-test-1',
      customerName: 'Kavindu Senanayake',
      customerEmail: 'kavindu.test@rexbebe.lk',
      items: [{ variantId: targetVariant.id, quantity: 2 }],
      paymentMethod: 'CASH_ON_DELIVERY',
      shippingAddress: {
        recipientName: 'Kavindu Senanayake',
        phone: '+94 77 123 4567',
        street: '45 Galle Road',
        city: 'Colombo',
        district: 'Colombo',
        postalCode: '00300',
        country: 'Sri Lanka',
      },
    }
  );
  assert(orderRes.status === 201 || orderRes.status === 200, 'Order created successfully');
  const testOrder = orderRes.data.data;
  assert(testOrder.codCollectionStatus === 'COLLECTION_PENDING', 'Initial COD collection status is COLLECTION_PENDING');
  assert(testOrder.paymentStatus === 'COD_PENDING', 'Initial payment status is COD_PENDING');

  // Book courier to Shipped status
  await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${testOrder.id}/courier/book`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      courierProvider: 'Koombiyo Delivery',
      waybillNumber: 'KMB-TEST-RTS-01',
      bookingDate: '2026-10-23',
      admin: 'Logistics Lead',
    }
  );
  await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${testOrder.id}/courier/delivery-status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      deliveryStatus: 'OUT_FOR_DELIVERY',
      admin: 'Rider Kasun',
    }
  );

  // Step 4: Record Delivery Attempt 1 (Customer Unavailable)
  console.log('\n--- Step 4: Record Delivery Attempt #1 (Customer Unavailable) ---');
  const attempt1Res = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${testOrder.id}/delivery-attempt`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      reasonCode: 'CUSTOMER_UNAVAILABLE',
      reason: 'Customer unavailable',
      date: '2026-10-23T10:00:00Z',
      admin: 'Rider Kasun',
      notes: 'Gate was locked, called mobile 2 times with no answer',
      nextAction: 'SCHEDULE_RETRY',
      scheduledRetryDate: '2026-10-24T10:00:00Z',
    }
  );
  assert(attempt1Res.status === 200, 'Attempt 1 returns 200 OK');
  const afterAttempt1 = attempt1Res.data.data;
  assert(afterAttempt1.courierDetails.deliveryStatus === 'DELIVERY_ATTEMPT_FAILED', 'Delivery status is DELIVERY_ATTEMPT_FAILED');
  assert(afterAttempt1.courierDetails.deliveryAttempts.length === 1, 'Delivery attempt #1 recorded in attempts array');
  assert(afterAttempt1.courierDetails.deliveryAttempts[0].reasonCode === 'CUSTOMER_UNAVAILABLE', 'Reason code recorded');
  assert(afterAttempt1.courierDetails.deliveryAttempts[0].scheduledRetryDate === '2026-10-24T10:00:00Z', 'Retry date recorded');
  assert(afterAttempt1.codCollectionStatus === 'COLLECTION_PENDING', 'COD collection remains strictly PENDING on failed delivery');
  assert(afterAttempt1.status !== 'DELIVERED', 'Failed delivery is NOT treated as a completed sale');
  assert(!afterAttempt1.isRestocked, 'Stock is NOT restored before parcel is returned and inspected');

  // Step 5: Validate Mandatory Notes for "OTHER" Reason
  console.log('\n--- Step 5: Validate Mandatory Documented Notes for Reason OTHER ---');
  const otherInvalidRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${testOrder.id}/delivery-attempt`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      reasonCode: 'OTHER',
      reason: 'Other documented reasons',
      notes: '', // missing
    }
  );
  assert(otherInvalidRes.status === 400, 'Rejects OTHER reason when notes are empty (< 5 chars)');

  // Step 6: Record Delivery Attempt 2 (Multiple Attempts Allowed & Unresolved Alert)
  console.log('\n--- Step 6: Record Delivery Attempt #2 & Flag Unresolved Case ---');
  const attempt2Res = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${testOrder.id}/delivery-attempt`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      reasonCode: 'PHONE_UNREACHABLE',
      reason: 'Customer phone unreachable',
      date: '2026-10-24T11:00:00Z',
      admin: 'Rider Kasun',
      notes: 'Mobile line constantly busy or disconnected',
      nextAction: 'PENDING_CUSTOMER_CONTACT',
    }
  );
  assert(attempt2Res.status === 200, 'Attempt 2 returns 200 OK');
  const afterAttempt2 = attempt2Res.data.data;
  assert(afterAttempt2.courierDetails.deliveryAttempts.length === 2, 'Two delivery attempts recorded');
  assert(afterAttempt2.unresolvedReturnAlert !== undefined, 'Unresolved case alert is flagged for multiple failed attempts');
  assert(afterAttempt2.unresolvedReturnAlert.type === 'MULTIPLE_FAILED_ATTEMPTS', 'Alert type is MULTIPLE_FAILED_ATTEMPTS');

  // Step 7: Check Unresolved Cases API
  console.log('\n--- Step 7: Query Unresolved Cases Endpoint ---');
  const unresolvedRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/orders/returns/unresolved',
    method: 'GET',
  });
  assert(unresolvedRes.status === 200, 'GET /api/orders/returns/unresolved returns 200 OK');
  const cases = unresolvedRes.data.data;
  const matchCase = cases.find((c) => c.orderId === testOrder.id || c.orderNumber === testOrder.orderNumber);
  assert(matchCase !== undefined, 'Test order is present in administrator unresolved cases alerts list');
  assert(matchCase.failedAttemptsCount >= 2, 'Failed attempts count matches in unresolved alert');

  // Step 8: Initiate Return-to-Sender (RTS) & Record Verified Return Charges
  console.log('\n--- Step 8: Initiate Return-to-Sender & Verified Return Charges ---');
  const rtsRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${testOrder.id}/return-to-sender`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      reason: 'Customer uncontactable after 2 doorstep visits - returning parcel to warehouse',
      verifiedReturnCharge: 300,
      admin: 'Logistics Supervisor Nuwan',
    }
  );
  assert(rtsRes.status === 200, 'Initiate RTS returns 200 OK');
  const rtsOrder = rtsRes.data.data;
  assert(rtsOrder.courierDetails.deliveryStatus === 'RETURNING_TO_SENDER', 'Status is RETURNING_TO_SENDER');
  assert(rtsOrder.verifiedReturnCharges === 300, 'Verified return charge recorded as LKR 300');
  assert(!rtsOrder.isRestocked, 'Stock is strictly NOT restored while parcel is in return transit');

  // Step 9: Customer Refusal on New Order
  console.log('\n--- Step 9: Customer Refusal Handling ---');
  const refusalOrderRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      customerId: 'cust-refusal-1',
      customerName: 'Refusal Test Customer',
      customerEmail: 'refusal@rexbebe.lk',
      items: [{ variantId: targetVariant.id, quantity: 1 }],
      paymentMethod: 'CASH_ON_DELIVERY',
      shippingAddress: {
        recipientName: 'Refusal Test Customer',
        phone: '+94 71 888 9999',
        street: '10 Negombo Road',
        city: 'Negombo',
        district: 'Gampaha',
        postalCode: '11500',
        country: 'Sri Lanka',
      },
    }
  );
  const refusalOrder = refusalOrderRes.data.data;
  const refusalAttemptRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${refusalOrder.id}/delivery-attempt`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      reasonCode: 'CUSTOMER_REFUSED',
      reason: 'Customer refused the parcel',
      notes: 'Customer stated they changed their mind and will not accept COD order',
      nextAction: 'INITIATE_RETURN',
    }
  );
  assert(refusalAttemptRes.status === 200, 'Customer refusal recorded successfully');
  const refusalResult = refusalAttemptRes.data.data;
  assert(refusalResult.courierDetails.deliveryStatus === 'RETURNING_TO_SENDER', 'Customer refusal automatically transitions to RETURNING_TO_SENDER');
  async function getVariantStock(variantId) {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/products',
      method: 'GET',
    });
    for (const p of res.data.data) {
      const v = (p.variants || []).find((varItem) => varItem.id === variantId);
      if (v) return v.stockQuantity ?? 0;
    }
    return 0;
  }

  // Step 10: Warehouse Physical Return Reception & Itemized Inspection (Conditional Restocking)
  console.log('\n--- Step 10: Warehouse Physical Reception & Conditional Restock Inspection ---');
  // Check variant stock right before inspection
  const preInspectionStock = await getVariantStock(targetVariant.id);

  // The order has 2 units of targetVariant.
  // Inspection decision: 1 unit INTACT (approved for restock), 1 unit DAMAGED (rejected from restock)
  const inspectionPayload = {
    returnDate: '2026-10-24',
    parcelCondition: 'DAMAGED_TRANSIT',
    decision: 'PARTIAL_RESTOCK',
    inspector: 'QC Inspector Shanika',
    verifiedReturnCharge: 300,
    notes: 'Parcel packaging was crushed during courier transit. 1 unit perfect, 1 unit crushed/unsellable.',
    items: [
      {
        variantId: targetVariant.id,
        condition: 'INTACT',
        quantityReturned: 2,
        quantityToRestock: 1, // Only 1 undamaged unit approved!
        restockApproved: true,
        notes: 'Undamaged garment in original polybag - approved for resale inventory',
      },
    ],
  };

  const inspectRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${testOrder.id}/return-inspection`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    inspectionPayload
  );
  assert(inspectRes.status === 200, 'POST /return-inspection returns 200 OK');
  const inspectedOrder = inspectRes.data.data;
  assert(inspectedOrder.status === 'RETURNED', 'Order status updated to RETURNED');
  assert(inspectedOrder.courierDetails.deliveryStatus === 'RETURNED_TO_SENDER', 'Courier delivery status is RETURNED_TO_SENDER');
  assert(inspectedOrder.returnInspection !== undefined, 'Inspection record saved on order');
  assert(inspectedOrder.returnInspection.parcelCondition === 'DAMAGED_TRANSIT', 'Parcel condition saved');
  assert(inspectedOrder.returnInspection.decision === 'PARTIAL_RESTOCK', 'Restock decision saved');
  assert(inspectedOrder.returnInspection.returnCharges === 300, 'Return charge recorded');
  assert(inspectedOrder.returnInspection.courierExpenses.totalCourierExpense > 0, 'Total courier expenses calculated');
  assert(inspectedOrder.unresolvedReturnAlert === undefined, 'Unresolved case alert resolved upon completed inspection');

  // CRITICAL INVENTORY VERIFICATION:
  // Stock must have increased by EXACTLY 1 (approved unit), NOT 2!
  const postInspectionStock = await getVariantStock(targetVariant.id);
  assert(
    postInspectionStock === preInspectionStock + 1,
    `Inventory updated ONLY for approved returned stock (+1 unit: was ${preInspectionStock}, now ${postInspectionStock}). Damaged unit was NOT restored!`
  );

  // Step 11: Pre-dispatch Cancellation Restock Test
  console.log('\n--- Step 11: Pre-dispatch Order Cancellation Restock Test ---');
  const cancelOrderRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      customerId: 'cust-cancel-test-1',
      customerName: 'Cancel Test Customer',
      customerEmail: 'cancel.test@rexbebe.lk',
      items: [{ variantId: targetVariant.id, quantity: 1 }],
      paymentMethod: 'CASH_ON_DELIVERY',
      shippingAddress: {
        recipientName: 'Cancel Test Customer',
        phone: '+94 77 999 8888',
        street: '10 Kandy Road',
        city: 'Kadawatha',
        district: 'Gampaha',
        postalCode: '11850',
        country: 'Sri Lanka',
      },
    }
  );
  const cancelOrder = cancelOrderRes.data.data;
  const stockBeforeCancel = await getVariantStock(targetVariant.id);

  // Cancel order
  const cancelledRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${cancelOrder.id}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      status: 'CANCELLED',
      admin: 'Customer Care Lead',
      note: 'Customer called to cancel before order left warehouse',
    }
  );
  assert(cancelledRes.status === 200, 'PATCH status CANCELLED returns 200 OK');
  const stockAfterCancel = await getVariantStock(targetVariant.id);
  assert(
    stockAfterCancel === stockBeforeCancel + 1,
    'Stock safely restored on pre-dispatch cancellation (goods never left shelf)'
  );

  // Step 12: Audit Timeline & Tracking History Preservation
  console.log('\n--- Step 12: Complete Order & Tracking History Preservation ---');
  const timeline = inspectedOrder.timeline || [];
  assert(timeline.length >= 4, `Complete timeline preserved (${timeline.length} history events)`);
  const statusesInTimeline = timeline.map((t) => t.status);
  assert(statusesInTimeline.includes('DELIVERY_ATTEMPT_FAILED'), 'Timeline preserves DELIVERY_ATTEMPT_FAILED events');
  assert(statusesInTimeline.includes('RETURNING_TO_SENDER'), 'Timeline preserves RETURNING_TO_SENDER event');
  assert(statusesInTimeline.includes('RETURNED'), 'Timeline preserves RETURNED inspection event');

  console.log('\n================================================================');
  console.log('  ALL FAILED DELIVERY & RETURN-TO-SENDER TESTS PASSED! ✅');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
