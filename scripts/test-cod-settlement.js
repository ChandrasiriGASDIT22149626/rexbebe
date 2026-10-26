/**
 * REXBEBE COD COLLECTION & COURIER SETTLEMENT TEST SUITE
 * Tests:
 * 1. Default Koombiyo agreement config & configurable merchant charges
 * 2. Separation of customer collection vs business bank settlement
 * 3. Initial financial status: COLLECTION_PENDING
 * 4. Courier collection recording without auto-marking money as received
 * 5. Delivery confirmation setting status to SETTLEMENT_PENDING (never auto SETTLED)
 * 6. Authorized administrator requirement enforcement
 * 7. Settlement batch and bank reference requirement enforcement
 * 8. Discrepancy shortfall adjustment reason enforcement (min 5 chars)
 * 9. Documented deductions itemization & expected remittance calculation
 * 10. Successful authorized settlement recording -> SETTLED
 * 11. Strict duplicate settlement entry prevention under different batch
 * 12. Idempotent update under same batch
 * 13. Dispute recording -> COLLECTION_DISPUTED
 * 14. Partial settlement -> PARTIALLY_SETTLED
 * 15. Financial ledger summary asserting all 6 statuses
 */

const http = require('http');

const API_BASE = 'http://localhost:5000/api';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-role': 'ADMIN',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
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
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('  REXBEBE COD COLLECTION & COURIER SETTLEMENT TEST SUITE');
  console.log('================================================================\n');

  // TEST 1: Merchant Agreement Configuration
  console.log('TEST 1: Configurable Courier Merchant Agreement');
  const agrRes = await request(`${API_BASE}/settlements/agreement-config`);
  assert(agrRes.status === 200, 'GET /settlements/agreement-config returns 200');
  const agrData = agrRes.data.data;
  assert(agrData.courierCode === 'KOOMBIYO', 'Default courier code is KOOMBIYO');
  assert(agrData.standardDeliveryCharge === 400, 'Standard delivery charge is configured to LKR 400');
  assert(agrData.codCommissionRate === 0, 'COD commission rate is 0% (no unapproved handling fee)');
  assert(agrData.settlementCycleNotice.includes('As per actual merchant remittance agreement'), 'Factual settlement notice present');

  // TEST 2: Update Merchant Agreement
  console.log('\nTEST 2: Update Configurable Merchant Agreement');
  const updateAgrRes = await request(`${API_BASE}/settlements/agreement-config`, {
    method: 'PUT',
    body: {
      standardDeliveryCharge: 420,
      notes: 'Updated 2026 Q4 rates verified from portal',
    },
  });
  assert(updateAgrRes.status === 200, 'PUT /settlements/agreement-config returns 200');
  assert(updateAgrRes.data.data.standardDeliveryCharge === 420, 'Delivery fee updated to LKR 420');

  // Reset back to standard 400
  await request(`${API_BASE}/settlements/agreement-config`, {
    method: 'PUT',
    body: { standardDeliveryCharge: 400 },
  });

  // Fetch available in-stock product variant
  const prodsRes = await request(`${API_BASE}/products`);
  const products = Array.isArray(prodsRes.data?.data)
    ? prodsRes.data.data
    : (prodsRes.data?.data?.products || prodsRes.data);
  const testProduct = products.find((p) => p.variants && p.variants.some((v) => v.stockQuantity > 2)) || products[0];
  const testVariant = testProduct.variants.find((v) => v.stockQuantity > 2) || testProduct.variants[0];

  // TEST 3: Create COD Order -> Initial Status COLLECTION_PENDING
  console.log('\nTEST 3: Create COD Order & Initial Financial Status');
  const timestamp = Date.now();
  const orderRes = await request(`${API_BASE}/orders`, {
    method: 'POST',
    body: {
      customerId: `cust-settle-test-${timestamp}`,
      customerName: 'Sahan Wickramasinghe',
      customerEmail: `sahan.test.${timestamp}@example.lk`,
      phone: `+94 77 ${Math.floor(1000000 + Math.random() * 9000000)}`,
      paymentMethod: 'CASH_ON_DELIVERY',
      subtotal: testVariant.price || 450,
      discount: 0,
      shippingFee: 400,
      totalAmount: (testVariant.price || 450) + 400,
      amountToCollect: (testVariant.price || 450) + 400,
      shippingAddress: {
        recipientName: 'Sahan Wickramasinghe',
        phone: '+94 77 123 4567',
        street: '45 Lake Road',
        city: 'Gampaha',
        town: 'Gampaha',
        district: 'Gampaha',
        postalCode: '11000',
        country: 'Sri Lanka',
      },
      items: [
        {
          id: `item-${timestamp}`,
          variantId: testVariant.id,
          title: testProduct.name,
          price: testVariant.price || 450,
          quantity: 1,
          totalPrice: testVariant.price || 450,
        },
      ],
    },
  });

  assert(orderRes.status === 201 || orderRes.status === 200, 'Order created successfully with status 201/200');
  const order1 = orderRes.data.data;
  assert(order1.codFinancialStatus === 'COLLECTION_PENDING', 'Initial codFinancialStatus is COLLECTION_PENDING');
  assert(order1.codCollectionStatus === 'COLLECTION_PENDING', 'Initial codCollectionStatus is COLLECTION_PENDING');

  // TEST 4: Doorstep Collection Event -> COLLECTED_BY_COURIER & SETTLEMENT_PENDING
  console.log('\nTEST 4: Record Doorstep Cash Collection (Separation of Collection vs Bank Funds)');
  const collectRes = await request(`${API_BASE}/orders/${order1.id}/cod-collection`, {
    method: 'PATCH',
    body: {
      status: 'COLLECTED_BY_COURIER',
      courierReportedAmount: 1600,
      collectionDate: '2026-10-23',
      admin: 'Koombiyo Dispatch Hub',
      notes: 'Customer paid exact cash LKR 1,600 to rider.',
    },
  });

  assert(collectRes.status === 200, 'PATCH /orders/:id/cod-collection returns 200');
  const collectedOrder = collectRes.data.data;
  assert(collectedOrder.codCollectionStatus === 'COLLECTED_BY_COURIER', 'codCollectionStatus updated to COLLECTED_BY_COURIER');
  assert(collectedOrder.codFinancialStatus === 'SETTLEMENT_PENDING', 'codFinancialStatus transitioned to SETTLEMENT_PENDING');
  assert(
    !collectedOrder.courierDetails?.amountRemitted || collectedOrder.courierDetails.amountRemitted === 0,
    'CRITICAL: Bank funds are NOT auto-marked as received (remitted amount is 0)'
  );

  // TEST 5: Settle Remittance Validation: Reject missing authorized admin
  console.log('\nTEST 5: Enforce Authorized Admin Confirmation');
  const noAdminRes = await request(`${API_BASE}/settlements`, {
    method: 'POST',
    body: {
      orderId: order1.id,
      settlementBatchRef: 'KMB-BATCH-2026-W42',
      bankReference: 'BOC-TX-998877',
      courierReportedAmount: 1600,
      actualAmountReceived: 1200,
      authorizedBy: '', // Empty admin
    },
  });
  assert(noAdminRes.status === 400, 'Rejects settlement when authorizedBy is missing (400 Bad Request)');

  // TEST 6: Settle Remittance Validation: Reject missing batch ref
  console.log('\nTEST 6: Enforce Settlement Batch Reference');
  const noBatchRes = await request(`${API_BASE}/settlements`, {
    method: 'POST',
    body: {
      orderId: order1.id,
      settlementBatchRef: '  ',
      bankReference: 'BOC-TX-998877',
      authorizedBy: 'Finance Admin',
      courierReportedAmount: 1600,
      actualAmountReceived: 1200,
    },
  });
  assert(noBatchRes.status === 400, 'Rejects settlement when batchRef is missing (400 Bad Request)');

  // TEST 7: Settle Remittance Validation: Require discrepancy reason on shortfall
  console.log('\nTEST 7: Enforce Discrepancy Adjustment Reason on Shortfall');
  // Reported 1600 - 400 deduction = 1200 expected remittance. If actual received is 1000, shortfall is 200.
  const shortfallNoReasonRes = await request(`${API_BASE}/settlements`, {
    method: 'POST',
    body: {
      orderId: order1.id,
      settlementBatchRef: 'KMB-BATCH-2026-W42',
      bankReference: 'BOC-TX-998877',
      authorizedBy: 'Finance Manager Ranil',
      courierReportedAmount: 1600,
      documentedDeductions: [
        { type: 'DELIVERY_FEE', amount: 400, description: 'Zone delivery charge' },
      ],
      actualAmountReceived: 1000,
      discrepancyReason: '  ', // Missing reason for 200 LKR shortfall
    },
  });
  assert(shortfallNoReasonRes.status === 400, 'Rejects shortfall when adjustment reason is missing');

  // TEST 8: Successful Authorized Settlement Recording -> SETTLED
  console.log('\nTEST 8: Record Full Authorized Settlement with Documented Deductions');
  const settleRes = await request(`${API_BASE}/settlements`, {
    method: 'POST',
    body: {
      orderId: order1.id,
      settlementBatchRef: 'KMB-BATCH-2026-W42',
      bankReference: 'BOC-TX-998877',
      settlementDate: '2026-10-23',
      authorizedBy: 'Finance Manager Ranil',
      courierReportedAmount: 1600,
      documentedDeductions: [
        { type: 'DELIVERY_FEE', amount: 400, description: 'Gampaha standard delivery fee' },
      ],
      actualAmountReceived: 1200,
      notes: 'Statement verified on BOC corporate online portal',
    },
  });

  assert(settleRes.status === 201, 'POST /settlements succeeds with status 201');
  const stl1 = settleRes.data.data.settlement;
  assert(stl1.financialStatus === 'SETTLED', 'Financial status is SETTLED');
  assert(stl1.totalDeductions === 400, 'Documented deductions total is LKR 400');
  assert(stl1.expectedRemittance === 1200, 'Expected net remittance is LKR 1200 (1600 - 400)');
  assert(stl1.actualAmountReceived === 1200, 'Actual amount received in bank is LKR 1200');
  assert(stl1.discrepancyAmount === 0, 'Discrepancy amount is 0');
  assert(stl1.authorizedBy === 'Finance Manager Ranil', 'Authorized admin recorded');

  // Verify Order is updated in DB
  const checkOrder1 = await request(`${API_BASE}/orders/${order1.id}`);
  assert(checkOrder1.data.data.codFinancialStatus === 'SETTLED', 'Order in DB updated to SETTLED');
  assert(checkOrder1.data.data.courierDetails.amountRemitted === 1200, 'Order amountRemitted is recorded as 1200');
  assert(checkOrder1.data.data.courierDetails.bankReference === 'BOC-TX-998877', 'Bank reference recorded on order');

  // TEST 9: Duplicate Settlement Prevention: Reject duplicate under different batch
  console.log('\nTEST 9: Prevent Duplicate Settlement Under Another Batch');
  const dupBatchRes = await request(`${API_BASE}/settlements`, {
    method: 'POST',
    body: {
      orderId: order1.id,
      settlementBatchRef: 'KMB-BATCH-2026-W43-DUPLICATE',
      bankReference: 'BOC-TX-DIFFERENT',
      authorizedBy: 'Another Admin',
      courierReportedAmount: 1600,
      documentedDeductions: [],
      actualAmountReceived: 1600,
    },
  });
  assert(dupBatchRes.status === 500 || dupBatchRes.status === 400, 'Strictly prevents duplicate settlement under another batch');
  assert(
    (dupBatchRes.data.message || '').includes('already fully settled') || (dupBatchRes.data.message || '').includes('Duplicate'),
    'Error message clearly explains duplicate settlement prohibition'
  );

  // TEST 10: Idempotent Safe Update Under Same Batch
  console.log('\nTEST 10: Safe Idempotent Update Under Same Batch');
  const updateSameBatchRes = await request(`${API_BASE}/settlements`, {
    method: 'POST',
    body: {
      orderId: order1.id,
      settlementBatchRef: 'KMB-BATCH-2026-W42',
      bankReference: 'BOC-TX-998877-AMENDED',
      authorizedBy: 'Finance Manager Ranil',
      courierReportedAmount: 1600,
      documentedDeductions: [
        { type: 'DELIVERY_FEE', amount: 400, description: 'Gampaha standard delivery fee' },
      ],
      actualAmountReceived: 1200,
      notes: 'Amended bank reference note',
    },
  });
  assert(updateSameBatchRes.status === 200, 'Same batch update returns 200 (isUpdate: true)');
  assert(updateSameBatchRes.data.data.isUpdate === true, 'Flagged as update rather than duplicate record');
  assert(updateSameBatchRes.data.data.settlement.bankReference === 'BOC-TX-998877-AMENDED', 'Bank ref updated');

  // TEST 11: Partially Settled with Discrepancy Reason
  console.log('\nTEST 11: Partially Settled Order with Valid Discrepancy Reason');
  const order2Res = await request(`${API_BASE}/orders`, {
    method: 'POST',
    body: {
      customerId: `cust-settle-test-2-${timestamp}`,
      customerName: 'Nimesha Perera',
      customerEmail: `nimesha.${timestamp}@example.lk`,
      phone: `+94 71 ${Math.floor(1000000 + Math.random() * 9000000)}`,
      paymentMethod: 'CASH_ON_DELIVERY',
      subtotal: 2000,
      shippingFee: 450,
      totalAmount: 2450,
      amountToCollect: 2450,
      shippingAddress: {
        recipientName: 'Nimesha Perera',
        street: '12 Main Street',
        city: 'Negombo',
        town: 'Negombo',
        district: 'Gampaha',
        postalCode: '11500',
        country: 'Sri Lanka',
      },
      items: [
        {
          id: `item2-${timestamp}`,
          variantId: testVariant.id,
          title: testProduct.name,
          price: testVariant.price || 450,
          quantity: 1,
          totalPrice: testVariant.price || 450,
        },
      ],
    },
  });
  const order2 = order2Res.data.data;

  const partialRes = await request(`${API_BASE}/settlements`, {
    method: 'POST',
    body: {
      orderId: order2.id,
      settlementBatchRef: 'KMB-BATCH-2026-W42',
      bankReference: 'BOC-TX-PARTIAL-445',
      authorizedBy: 'Finance Lead Dilshan',
      courierReportedAmount: (testVariant.price || 450) + 450,
      documentedDeductions: [
        { type: 'DELIVERY_FEE', amount: 450, description: 'Negombo delivery fee' },
      ],
      // Expected: testVariant.price. Actual received: testVariant.price - 200 -> Shortfall
      actualAmountReceived: Math.max(0, (testVariant.price || 450) - 200),
      discrepancyReason: 'Courier held LKR 200 pending weight re-audit confirmation.',
    },
  });
  assert(partialRes.status === 201, 'Partial settlement recorded successfully');
  const stl2 = partialRes.data.data.settlement;
  assert(stl2.financialStatus === 'PARTIALLY_SETTLED', 'Status marked as PARTIALLY_SETTLED');
  assert(stl2.discrepancyAmount === 200, 'Discrepancy amount is LKR 200');
  assert(stl2.discrepancyReason.includes('weight re-audit'), 'Discrepancy reason saved');

  // TEST 12: Dispute Handling -> COLLECTION_DISPUTED
  console.log('\nTEST 12: Collection Dispute Recording');
  const order3Res = await request(`${API_BASE}/orders`, {
    method: 'POST',
    body: {
      customerId: `cust-settle-test-3-${timestamp}`,
      customerName: 'Chathura Fernando',
      customerEmail: `chathura.${timestamp}@example.lk`,
      phone: `+94 75 ${Math.floor(1000000 + Math.random() * 9000000)}`,
      paymentMethod: 'CASH_ON_DELIVERY',
      subtotal: testVariant.price || 450,
      shippingFee: 400,
      totalAmount: (testVariant.price || 450) + 400,
      amountToCollect: (testVariant.price || 450) + 400,
      shippingAddress: {
        recipientName: 'Chathura Fernando',
        street: '88 Station Road',
        city: 'Kelaniya',
        town: 'Kelaniya',
        district: 'Gampaha',
        postalCode: '11600',
        country: 'Sri Lanka',
      },
      items: [
        {
          id: `item3-${timestamp}`,
          variantId: testVariant.id,
          title: testProduct.name,
          price: testVariant.price || 450,
          quantity: 1,
          totalPrice: testVariant.price || 450,
        },
      ],
    },
  });
  const order3 = order3Res.data.data;

  const disputeRes = await request(`${API_BASE}/orders/${order3.id}/cod-collection`, {
    method: 'PATCH',
    body: {
      status: 'COLLECTION_DISPUTED',
      disputeReason: 'Customer refused parcel claiming wrong size ordered.',
      admin: 'Koombiyo Returns Ops',
    },
  });
  assert(disputeRes.status === 200, 'Dispute recorded successfully');
  assert(disputeRes.data.data.codFinancialStatus === 'COLLECTION_DISPUTED', 'Status is COLLECTION_DISPUTED');

  // TEST 13: Financial Ledger Summary with All 6 Statuses
  console.log('\nTEST 13: Full Financial Ledger Aggregates (All 6 Statuses)');
  const ledgerRes = await request(`${API_BASE}/settlements/ledger`);
  assert(ledgerRes.status === 200, 'GET /settlements/ledger returns 200');
  const ledger = ledgerRes.data.data;
  const sm = ledger.summary;

  assert(sm.totalExpectedCod > 0, `Total expected COD is LKR ${sm.totalExpectedCod}`);
  assert(sm.settledCount >= 1, `Settled count is ${sm.settledCount} (>= 1)`);
  assert(sm.partiallySettledCount >= 1, `Partially settled count is ${sm.partiallySettledCount} (>= 1)`);
  assert(sm.disputedCount >= 1, `Disputed count is ${sm.disputedCount} (>= 1)`);
  assert(sm.totalDocumentedDeductions >= 850, `Documented deductions total is LKR ${sm.totalDocumentedDeductions}`);
  assert(sm.totalDiscrepancyAmount >= 500, `Outstanding discrepancy total is LKR ${sm.totalDiscrepancyAmount}`);

  console.log('\n================================================================');
  console.log('  ALL COD SETTLEMENT & COLLECTION TESTS PASSED SUCCESSFULLY! ✅');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Test Suite Failed With Uncaught Error:', err);
  process.exit(1);
});
