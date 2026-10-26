/**
 * REXBEBE DELIVERY ZONES & CHARGES SETTINGS TEST SUITE
 * Tests:
 * 1. Initial configured rates (Nearby Gampaha: 400, Other Gampaha: 450, Outstation: 500)
 * 2. Town resolution and delivery fee calculation for various towns
 * 3. Prevention of arbitrary guessing for unmapped towns (request review)
 * 4. Zone management (add zone, edit fee, add/remove towns, reassign town)
 * 5. Order placement saving order-time deliveryZoneSnapshot
 * 6. Historical order immutability verification (changing settings never modifies past orders)
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
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ [PASS] ${message}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('   REXBEBE DELIVERY ZONES & DELIVERY CHARGES TEST SUITE');
  console.log('================================================================\n');

  // STEP 1: Verify Delivery Settings and Initial Zones
  console.log('--- Step 1: Inspect Initial Delivery Settings & Zones ---');
  const settingsRes = await request(`${API_BASE}/delivery-settings`);
  assert(settingsRes.status === 200, 'GET /api/delivery-settings returns 200 OK');
  const settings = settingsRes.data.data;
  assert(Array.isArray(settings.deliveryZones), 'deliveryZones is an array');
  assert(settings.deliveryZones.length >= 3, `Found ${settings.deliveryZones.length} delivery zones (expected >= 3)`);

  const nearbyZone = settings.deliveryZones.find((z) => z.code === 'GAMPAHA_NEARBY');
  assert(nearbyZone !== undefined, 'Found "Nearby towns in Gampaha District" zone');
  assert(nearbyZone.deliveryFee === 400, `Nearby towns fee is LKR 400 (got: ${nearbyZone.deliveryFee})`);
  assert(nearbyZone.towns.includes('Wattala'), 'Nearby towns includes Wattala');
  assert(nearbyZone.towns.includes('Ja-Ela'), 'Nearby towns includes Ja-Ela');
  assert(nearbyZone.isInitialRate === true, 'Nearby zone marked as initial business rate');

  const otherZone = settings.deliveryZones.find((z) => z.code === 'GAMPAHA_OTHER');
  assert(otherZone !== undefined, 'Found "Other towns in Gampaha District" zone');
  assert(otherZone.deliveryFee === 450, `Other towns fee is LKR 450 (got: ${otherZone.deliveryFee})`);
  assert(otherZone.towns.includes('Minuwangoda'), 'Other towns includes Minuwangoda');
  assert(otherZone.towns.includes('Nittambuwa'), 'Other towns includes Nittambuwa');
  assert(otherZone.isInitialRate === true, 'Other zone marked as initial business rate');

  const outstationZone = settings.deliveryZones.find((z) => z.code === 'OUTSTATION');
  assert(outstationZone !== undefined, 'Found "Outstation" zone');
  assert(outstationZone.deliveryFee === 500, `Outstation fee is LKR 500 (got: ${outstationZone.deliveryFee})`);
  assert(outstationZone.towns.includes('Kandy'), 'Outstation includes Kandy');
  assert(outstationZone.towns.includes('Galle'), 'Outstation includes Galle');

  assert(
    settings.unsupportedAddressPolicy === 'REQUIRE_REVIEW',
    `Initial unsupported address policy is REQUIRE_REVIEW (got: ${settings.unsupportedAddressPolicy})`
  );

  // STEP 2: Find product variant for testing calculations
  console.log('\n--- Step 2: Fetch Product for Testing Order Pricing ---');
  const prodsRes = await request(`${API_BASE}/products`);
  const products = Array.isArray(prodsRes.data?.data)
    ? prodsRes.data.data
    : (prodsRes.data?.data?.products || prodsRes.data);
  const testProduct = products.find((p) => p.variants && p.variants.some((v) => v.stockQuantity > 0)) || products[0];
  const testVariant = testProduct.variants.find((v) => v.stockQuantity > 0) || testProduct.variants[0];
  console.log(`Using Variant: ${testVariant.id} (${testProduct.name} - Price: LKR ${testVariant.price})`);

  // STEP 3: Test Zone & Delivery Fee Calculation for Different Configured Towns
  console.log('\n--- Step 3: Test Delivery Calculations for Configured Towns ---');

  // 3A: Gampaha Nearby Town (Wattala) -> 400
  const wattalaCalc = await request(`${API_BASE}/delivery/calculate`, {
    method: 'POST',
    body: {
      district: 'Gampaha',
      town: 'Wattala',
      items: [{ variantId: testVariant.id, quantity: 1 }],
      paymentMethod: 'CASH_ON_DELIVERY',
    },
  });
  assert(wattalaCalc.status === 200, 'Calculate Wattala returns 200 OK');
  assert(wattalaCalc.data.data.deliveryFee === 400, `Wattala delivery fee is LKR 400 (got: ${wattalaCalc.data.data.deliveryFee})`);
  assert(wattalaCalc.data.data.zoneName === 'Nearby towns in Gampaha District', 'Zone name is "Nearby towns in Gampaha District"');
  assert(wattalaCalc.data.data.requiresDeliveryReview === false, 'Requires review is false for Wattala');

  // 3B: Gampaha Other Town (Minuwangoda) -> 450
  const minuwangodaCalc = await request(`${API_BASE}/delivery/calculate`, {
    method: 'POST',
    body: {
      district: 'Gampaha',
      town: 'Minuwangoda',
      items: [{ variantId: testVariant.id, quantity: 1 }],
      paymentMethod: 'CASH_ON_DELIVERY',
    },
  });
  assert(minuwangodaCalc.status === 200, 'Calculate Minuwangoda returns 200 OK');
  assert(minuwangodaCalc.data.data.deliveryFee === 450, `Minuwangoda delivery fee is LKR 450 (got: ${minuwangodaCalc.data.data.deliveryFee})`);
  assert(minuwangodaCalc.data.data.zoneName === 'Other towns in Gampaha District', 'Zone name is "Other towns in Gampaha District"');

  // 3C: Outstation Town (Kandy) -> 500
  const kandyCalc = await request(`${API_BASE}/delivery/calculate`, {
    method: 'POST',
    body: {
      district: 'Kandy',
      town: 'Kandy',
      items: [{ variantId: testVariant.id, quantity: 1 }],
      paymentMethod: 'CASH_ON_DELIVERY',
    },
  });
  assert(kandyCalc.status === 200, 'Calculate Kandy returns 200 OK');
  assert(kandyCalc.data.data.deliveryFee === 500, `Kandy delivery fee is LKR 500 (got: ${kandyCalc.data.data.deliveryFee})`);
  assert(kandyCalc.data.data.zoneName === 'Outstation', 'Zone name is "Outstation"');

  // 3D: Outstation Town (Galle) -> 500
  const galleCalc = await request(`${API_BASE}/delivery/calculate`, {
    method: 'POST',
    body: {
      district: 'Galle',
      town: 'Galle',
      items: [{ variantId: testVariant.id, quantity: 1 }],
      paymentMethod: 'CASH_ON_DELIVERY',
    },
  });
  assert(galleCalc.status === 200, 'Calculate Galle returns 200 OK');
  assert(galleCalc.data.data.deliveryFee === 500, `Galle delivery fee is LKR 500 (got: ${galleCalc.data.data.deliveryFee})`);

  // STEP 4: Test Unsupported / Unmapped Town (Do Not Guess Arbitrary Fee)
  console.log('\n--- Step 4: Test Unmapped Town Policy (No Arbitrary Guessing) ---');
  const unmappedCalc = await request(`${API_BASE}/delivery/calculate`, {
    method: 'POST',
    body: {
      district: 'Gampaha',
      town: 'NonExistentVillageXYZ',
      items: [{ variantId: testVariant.id, quantity: 1 }],
      paymentMethod: 'CASH_ON_DELIVERY',
    },
  });
  assert(unmappedCalc.status === 200, 'Calculate unmapped town returns 200 OK');
  assert(unmappedCalc.data.data.requiresDeliveryReview === true, 'Unmapped town flags requiresDeliveryReview: true');
  assert(unmappedCalc.data.data.isUnmapped === true, 'isUnmapped is true');
  assert(unmappedCalc.data.data.deliveryFee === 0, 'No arbitrary delivery fee guessed (set to 0 / pending review)');
  assert(unmappedCalc.data.data.deliveryZoneSnapshot.zoneId === 'UNMAPPED_REVIEW_REQUIRED', 'Snapshot has UNMAPPED_REVIEW_REQUIRED zoneId');

  // STEP 5: Test Zone Management (Add Town, Remove Town, Reassign Town)
  console.log('\n--- Step 5: Test Zone Management & Town Reassignment ---');
  // Add town 'KirindiwelaNorth' to Nearby zone
  const addTownRes = await request(`${API_BASE}/delivery/zones/zone-gampaha-nearby/towns`, {
    method: 'POST',
    body: { town: 'KirindiwelaNorth' },
  });
  assert(addTownRes.status === 200, 'Add town to zone returns 200 OK');
  assert(addTownRes.data.data.towns.includes('KirindiwelaNorth'), 'Town added to Nearby zone');

  // Reassign 'KirindiwelaNorth' from Nearby to Other zone
  const reassignRes = await request(`${API_BASE}/delivery/zones/reassign-town`, {
    method: 'POST',
    body: {
      town: 'KirindiwelaNorth',
      fromZoneId: 'zone-gampaha-nearby',
      toZoneId: 'zone-gampaha-other',
    },
  });
  assert(reassignRes.status === 200, 'Reassign town returns 200 OK');
  assert(!reassignRes.data.data.fromZone.towns.includes('KirindiwelaNorth'), 'Town removed from origin zone');
  assert(reassignRes.data.data.toZone.towns.includes('KirindiwelaNorth'), 'Town added to destination zone');

  // Remove town from Other zone
  const removeTownRes = await request(
    `${API_BASE}/delivery/zones/zone-gampaha-other/towns/${encodeURIComponent('KirindiwelaNorth')}`,
    { method: 'DELETE' }
  );
  assert(removeTownRes.status === 200, 'Remove town returns 200 OK');
  assert(!removeTownRes.data.data.towns.includes('KirindiwelaNorth'), 'Town successfully removed');

  // STEP 6: Test Order Placement with Order-Time DeliveryZoneSnapshot
  console.log('\n--- Step 6: Test Order Creation & DeliveryZoneSnapshot Persistence ---');
  const orderRes = await request(`${API_BASE}/orders`, {
    method: 'POST',
    body: {
      customerId: 'cust-delivery-test',
      customerName: 'Delivery Zone Tester',
      customerEmail: 'delivery-test@rexbebe.lk',
      phone: '0771234567',
      items: [{ variantId: testVariant.id, quantity: 1 }],
      shippingAddress: {
        recipientName: 'Delivery Zone Tester',
        phone: '0771234567',
        street: '12 Beach Road',
        city: 'Wattala',
        town: 'Wattala',
        district: 'Gampaha',
        postalCode: '11300',
        country: 'Sri Lanka',
      },
      paymentMethod: 'CASH_ON_DELIVERY',
    },
  });
  assert(orderRes.status === 201 || orderRes.status === 200, 'Order created successfully');
  const placedOrder = orderRes.data.data;
  console.log(`Placed Order: ${placedOrder.orderNumber} (ID: ${placedOrder.id})`);
  assert(placedOrder.shippingFee === 400, `Applied shipping fee is LKR 400 (got: ${placedOrder.shippingFee})`);
  assert(placedOrder.deliveryZoneSnapshot !== undefined, 'Order has deliveryZoneSnapshot');
  assert(placedOrder.deliveryZoneSnapshot.zoneId === 'zone-gampaha-nearby', 'Snapshot zoneId is zone-gampaha-nearby');
  assert(placedOrder.deliveryZoneSnapshot.deliveryFee === 400, 'Snapshot deliveryFee is 400');
  assert(placedOrder.deliveryZoneSnapshot.town === 'Wattala', 'Snapshot town is Wattala');
  assert(placedOrder.deliveryZoneSnapshot.district === 'Gampaha', 'Snapshot district is Gampaha');
  assert(placedOrder.deliveryZoneSnapshot.isInitialRate === true, 'Snapshot confirms initial rate');

  // STEP 7: Verify Historical Order Immutability
  console.log('\n--- Step 7: Verify Historical Order Immutability ---');
  console.log('Modifying current zone delivery fee from LKR 400 to LKR 430 in settings...');
  const updateZoneRes = await request(`${API_BASE}/delivery/zones/zone-gampaha-nearby`, {
    method: 'PUT',
    body: { deliveryFee: 430 },
  });
  assert(updateZoneRes.status === 200, 'Zone fee updated to 430 in settings');

  // Fetch the previously placed order
  const fetchedOrderRes = await request(`${API_BASE}/orders/${placedOrder.id}`);
  assert(fetchedOrderRes.status === 200, 'Fetch order returns 200 OK');
  const orderAfterZoneUpdate = fetchedOrderRes.data.data;

  assert(
    orderAfterZoneUpdate.shippingFee === 400,
    `Historical order shipping fee remains 400 (got: ${orderAfterZoneUpdate.shippingFee})`
  );
  assert(
    orderAfterZoneUpdate.totalAmount === placedOrder.totalAmount,
    `Historical order totalAmount remains unchanged (got: ${orderAfterZoneUpdate.totalAmount})`
  );
  assert(
    orderAfterZoneUpdate.amountToCollect === placedOrder.amountToCollect,
    `Historical order amountToCollect remains unchanged (got: ${orderAfterZoneUpdate.amountToCollect})`
  );
  assert(
    orderAfterZoneUpdate.deliveryZoneSnapshot.deliveryFee === 400,
    `Historical snapshot rate remains 400 (got: ${orderAfterZoneUpdate.deliveryZoneSnapshot.deliveryFee})`
  );

  // Restore zone fee back to 400
  await request(`${API_BASE}/delivery/zones/zone-gampaha-nearby`, {
    method: 'PUT',
    body: { deliveryFee: 400 },
  });
  console.log('Restored zone delivery fee back to LKR 400.');

  // STEP 8: Verify Frontend Admin Page & Checkout Page
  console.log('\n--- Step 8: Verify Frontend Admin Settings Page & Checkout Page ---');
  const adminPageRes = await request('http://localhost:3000/admin/settings/delivery');
  assert(adminPageRes.status === 200, 'GET http://localhost:3000/admin/settings/delivery returns 200 OK');

  const checkoutPageRes = await request('http://localhost:3000/checkout');
  assert(checkoutPageRes.status === 200, 'GET http://localhost:3000/checkout returns 200 OK');

  console.log('\n================================================================');
  console.log('RESULTS: ALL ASSERTIONS PASSED (100%)');
  console.log('================================================================');
  console.log('🎉 DELIVERY ZONES & CHARGES SETTINGS VERIFIED 100%!\n');
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
