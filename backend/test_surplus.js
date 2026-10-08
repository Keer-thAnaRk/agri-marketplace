const http = require('http');

function makeRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
    };
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch (e) {
            parsed = raw;
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runSurplusTests() {
  console.log('=== STARTING FARMER SURPLUS ENGINE INTEGRATION TESTS ===\n');
  const timestamp = Date.now();
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`   ✓ ${message}`);
      passed++;
    } else {
      console.error(`   ✗ FAILED: ${message}`);
      failed++;
    }
  }

  // 1. Admin login
  console.log('1. Logging in as Admin...');
  const adminLogin = await makeRequest('POST', '/api/auth/admin/login', {
    email: 'admin@krishimarket.in',
    password: 'admin123',
  });
  assert(adminLogin.status === 200, 'Admin login succeeds (status 200)');
  const adminToken = adminLogin.data.data.token;

  // 2. Register Farmer A and approve
  console.log('\n2. Registering and Approving Farmer A...');
  const farmerAEmail = `farmer_surplus_a_${timestamp}@krishi.test`;
  const regFarmerA = await makeRequest('POST', '/api/auth/farmer/register', {
    fullName: 'Anand Kumar',
    email: farmerAEmail,
    phone: `981${String(timestamp).slice(-7)}`,
    password: 'Password123!',
    farmName: 'Anand Bio Farms',
    farmLocation: 'Hassan Belur Road',
    city: 'Hassan',
    state: 'Karnataka',
    pincode: '573201',
    hub: 'Mysuru-Hassan Hub',
    farmingMethod: 'Organic',
    yearsFarming: 8,
    mainCrops: ['Bell Peppers', 'Tomatoes'],
    farmDescription: 'Export quality greenhouse capsicum and organic heirloom crops',
  });
  assert(regFarmerA.status === 201, 'Farmer A registered (status 201)');
  const farmerAToken = regFarmerA.data.data.token;
  const farmerAId = regFarmerA.data.data.farmer.id;

  const approveA = await makeRequest('POST', `/api/admin/farmers/${farmerAId}/approve`, {}, adminToken);
  assert(approveA.status === 200, 'Farmer A approved by admin (status 200)');

  // 3. Register Farmer B (keep pending initially)
  console.log('\n3. Registering Farmer B (Pending verification initially)...');
  const farmerBEmail = `farmer_surplus_b_${timestamp}@krishi.test`;
  const regFarmerB = await makeRequest('POST', '/api/auth/farmer/register', {
    fullName: 'Basavaraj Patil',
    email: farmerBEmail,
    phone: `972${String(timestamp).slice(-7)}`,
    password: 'Password123!',
    farmName: 'Patil Agro',
    farmLocation: 'Dharwad Rural',
    city: 'Dharwad',
    state: 'Karnataka',
    pincode: '580001',
    farmingMethod: 'Natural (ZBNF)',
    yearsFarming: 5,
    mainCrops: ['Spinach', 'Palak'],
    farmDescription: 'Subah-sham fresh greens',
  });
  assert(regFarmerB.status === 201, 'Farmer B registered (status 201)');
  const farmerBToken = regFarmerB.data.data.token;
  const farmerBId = regFarmerB.data.data.farmer.id;

  // 4. Create Product for Farmer A with stock 50, price 60
  console.log('\n4. Creating Product 1 for Farmer A (availableQuantity: 50, price: ₹60)...');
  const createProdRes = await makeRequest('POST', '/api/farmer/products', {
    name: `Organic Shimla Capsicum ${timestamp}`,
    category: 'Vegetables',
    description: 'Crisp green polyhouse bell peppers',
    price: 60,
    unit: '1 kg',
    unitShort: 'kg',
    availableQuantity: 50,
    shelfLifeDays: 5,
    farmingMethod: 'Organic',
    images: ['https://images.unsplash.com/photo-1563565375-f3fdfdbefa83'],
  }, farmerAToken);
  assert(createProdRes.status === 201, 'Product 1 created for Farmer A (status 201)');
  const productA = createProdRes.data.data;
  const productAId = productA.id;

  // Create a Harvest Batch for Product 1
  console.log('\n   Recording Harvest Batch for Product 1 (quantity: 30)...');
  const createBatchRes = await makeRequest('POST', '/api/farmer/harvests', {
    productId: productAId,
    quantity: 30,
    unit: 'kg',
    notes: 'Morning pick for surplus test',
  }, farmerAToken);
  assert(createBatchRes.status === 201, 'Harvest batch created for Farmer A');
  const batchA = createBatchRes.data.data;
  const batchAId = batchA.id;

  // 5. Test 1: Pending farmer cannot create surplus offer → 403
  console.log('\n--- TEST 1: Pending farmer cannot create surplus offer (expect 403) ---');
  const pendingCreate = await makeRequest('POST', '/api/farmer/surplus', {
    productId: productAId,
    availableQuantity: 10,
    discountPercent: 20,
    reason: 'Testing pending block',
  }, farmerBToken);
  assert(pendingCreate.status === 403, 'Pending farmer blocked from creating surplus offer (403 Forbidden)');

  // 6. Test 6 & 7: Input validations (invalid discount, negative quantity)
  console.log('\n--- TEST 6: Invalid discount rejected (expect 400) ---');
  const lowDiscount = await makeRequest('POST', '/api/farmer/surplus', {
    productId: productAId,
    availableQuantity: 10,
    discountPercent: 2, // too low (< 5%)
    reason: 'Too low discount',
  }, farmerAToken);
  assert(lowDiscount.status === 400, 'Discount < 5% rejected (status 400)');

  const highDiscount = await makeRequest('POST', '/api/farmer/surplus', {
    productId: productAId,
    availableQuantity: 10,
    discountPercent: 95, // too high (> 90%)
    reason: 'Too high discount',
  }, farmerAToken);
  assert(highDiscount.status === 400, 'Discount > 90% rejected (status 400)');

  console.log('\n--- TEST 7: Negative or zero quantity rejected (expect 400) ---');
  const negQty = await makeRequest('POST', '/api/farmer/surplus', {
    productId: productAId,
    availableQuantity: -10,
    discountPercent: 20,
    reason: 'Negative quantity test',
  }, farmerAToken);
  assert(negQty.status === 400, 'Negative quantity rejected (status 400)');

  const zeroQty = await makeRequest('POST', '/api/farmer/surplus', {
    productId: productAId,
    availableQuantity: 0,
    discountPercent: 20,
    reason: 'Zero quantity test',
  }, farmerAToken);
  assert(zeroQty.status === 400, 'Zero quantity rejected (status 400)');

  // 7. Test 8: Surplus quantity greater than available inventory rejected
  console.log('\n--- TEST 8: Surplus quantity greater than available stock rejected (expect 400) ---');
  // Stock is 50 + 30 (from harvest) = 80
  const excessQty = await makeRequest('POST', '/api/farmer/surplus', {
    productId: productAId,
    availableQuantity: 500, // exceeds available stock
    discountPercent: 20,
    reason: 'Excess stock test',
  }, farmerAToken);
  assert(excessQty.status === 400, 'Surplus quantity exceeding available stock rejected (status 400)');

  // Also test batch quantity limit when batchId is provided (batch has 30 kg)
  const excessBatchQty = await makeRequest('POST', '/api/farmer/surplus', {
    productId: productAId,
    batchId: batchAId,
    availableQuantity: 35, // exceeds batch 30 kg
    discountPercent: 20,
    reason: 'Excess batch stock test',
  }, farmerAToken);
  assert(excessBatchQty.status === 400, 'Surplus quantity exceeding batch available stock rejected (status 400)');

  // 8. Test 16: Product ownership enforced
  console.log('\n--- TEST 16: Product ownership enforced (expect 403) ---');
  // Approve Farmer B now
  const approveB = await makeRequest('POST', `/api/admin/farmers/${farmerBId}/approve`, {}, adminToken);
  assert(approveB.status === 200, 'Farmer B approved by admin');

  // Farmer B tries to create surplus offer for Farmer A's product
  const crossProduct = await makeRequest('POST', '/api/farmer/surplus', {
    productId: productAId,
    availableQuantity: 10,
    discountPercent: 20,
    reason: 'Cross product test',
  }, farmerBToken);
  assert(crossProduct.status === 403, 'Farmer B cannot create surplus for Farmer A product (403 Forbidden)');

  // 9. Test 15: Harvest batch ownership enforced
  console.log('\n--- TEST 15: Harvest batch ownership enforced (expect 403) ---');
  // Create Product 2 for Farmer B
  const createProdBRes = await makeRequest('POST', '/api/farmer/products', {
    name: `Organic Fresh Palak ${timestamp}`,
    category: 'Vegetables',
    description: 'Crisp green leaves',
    price: 40,
    unit: '1 kg',
    unitShort: 'kg',
    availableQuantity: 40,
    shelfLifeDays: 3,
    farmingMethod: 'Natural (ZBNF)',
  }, farmerBToken);
  assert(createProdBRes.status === 201, 'Product 2 created for Farmer B');
  const productB = createProdBRes.data.data;
  const productBId = productB.id;

  // Farmer B tries to use Farmer A's batchAId on Product B
  const crossBatch = await makeRequest('POST', '/api/farmer/surplus', {
    productId: productBId,
    batchId: batchAId,
    availableQuantity: 10,
    discountPercent: 20,
    reason: 'Cross batch test',
  }, farmerBToken);
  assert(crossBatch.status === 403 || crossBatch.status === 400, 'Cross-farmer batch usage rejected (403/400)');

  // 10. Test 2, 3, 4, 5: Approved Farmer A creates valid surplus offer
  console.log('\n--- TESTS 2, 3, 4, 5: Approved Farmer A creates surplus offer with server price calculation ---');
  const futureExpiry = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  // Client maliciously sends fake offerPrice: 1, original price is 60, discount is 20% -> server price MUST be 48
  const createOfferRes = await makeRequest('POST', '/api/farmer/surplus', {
    productId: productAId,
    batchId: batchAId,
    availableQuantity: 20,
    discountPercent: 20,
    offerPrice: 1, // client attempt to tamper with price
    expiryDate: futureExpiry,
    reason: 'Approaching peak crispness window, clearance flash deal.',
  }, farmerAToken);

  assert(createOfferRes.status === 201, 'TEST 2: Approved farmer created surplus offer (status 201)');
  const offerA = createOfferRes.data.data;
  assert(Boolean(offerA.id), 'TEST 3: Offer has PostgreSQL id');
  assert(Boolean(offerA.offerCode && offerA.offerCode.startsWith('SO-')), `TEST 4: Unique offerCode generated: ${offerA.offerCode}`);
  assert(offerA.originalPrice === 60, 'Original price matches database product price (60)');
  assert(offerA.offerPrice === 48, `TEST 5: Offer price calculated server-side as ₹48 (60 - 20%), tampered price ignored`);
  assert(offerA.availableQuantity === 20, 'Available quantity matches offered 20 kg');
  assert(offerA.status === 'Active', 'Default status is Active');

  // Verify stored in PostgreSQL by fetching directly
  const getOfferA = await makeRequest('GET', `/api/farmer/surplus/${offerA.id}`, null, farmerAToken);
  assert(getOfferA.status === 200, 'TEST 3: Offer retrieved from PostgreSQL via GET /api/farmer/surplus/:id');
  assert(getOfferA.data.data.offerCode === offerA.offerCode, 'Retrieved offerCode matches created offer');

  // 11. Test 9, 10, 11: Tenant Isolation (Farmer B vs Farmer A)
  console.log('\n--- TESTS 9, 10, 11: Multi-tenant isolation between Farmer A and Farmer B ---');
  // Farmer B creates an offer for Product 2
  const createOfferBRes = await makeRequest('POST', '/api/farmer/surplus', {
    productId: productBId,
    availableQuantity: 15,
    discountPercent: 25,
    reason: 'Farmer B flash herbs offer',
  }, farmerBToken);
  assert(createOfferBRes.status === 201, 'Farmer B created surplus offer B');
  const offerB = createOfferBRes.data.data;

  // Farmer A lists surplus offers
  const farmerAList = await makeRequest('GET', '/api/farmer/surplus', null, farmerAToken);
  assert(farmerAList.status === 200, 'Farmer A surplus list returns 200');
  const farmerAIds = farmerAList.data.data.map((o) => o.id);
  assert(!farmerAIds.includes(offerB.id), 'TEST 9: Farmer A does NOT see Farmer B’s offer in list');

  // Farmer A tries to GET Farmer B's offer
  const crossGet = await makeRequest('GET', `/api/farmer/surplus/${offerB.id}`, null, farmerAToken);
  assert(crossGet.status === 404 || crossGet.status === 403, 'TEST 9: Farmer A cannot view Farmer B offer by ID (404/403)');

  // Farmer A tries to PATCH Farmer B's offer
  const crossPatch = await makeRequest('PATCH', `/api/farmer/surplus/${offerB.id}`, {
    discountPercent: 30,
  }, farmerAToken);
  assert(crossPatch.status === 403 || crossPatch.status === 404, 'TEST 10: Farmer A cannot modify Farmer B offer (403/404)');

  // Farmer A tries to DELETE Farmer B's offer
  const crossDelete = await makeRequest('DELETE', `/api/farmer/surplus/${offerB.id}`, null, farmerAToken);
  assert(crossDelete.status === 403 || crossDelete.status === 404, 'TEST 11: Farmer A cannot delete/cancel Farmer B offer (403/404)');

  // 12. Test 12: Approved farmer can edit own offer
  console.log('\n--- TEST 12: Approved farmer can edit own offer ---');
  // Change discount from 20% to 25% -> price should be recalculated server-side to 60 - 15 = 45
  const patchRes = await makeRequest('PATCH', `/api/farmer/surplus/${offerA.id}`, {
    discountPercent: 25,
    reason: 'Updated reason: accelerated flash clearance',
  }, farmerAToken);
  assert(patchRes.status === 200, 'Farmer A successfully edited own offer (status 200)');
  assert(patchRes.data.data.discountPercent === 25, 'Discount updated to 25%');
  assert(patchRes.data.data.offerPrice === 45, 'Offer price recalculated server-side to ₹45 (60 - 25%)');

  // 13. Test 13: Approved farmer can cancel own offer
  console.log('\n--- TEST 13: Approved farmer can cancel own offer ---');
  const cancelRes = await makeRequest('DELETE', `/api/farmer/surplus/${offerA.id}`, null, farmerAToken);
  assert(cancelRes.status === 200, 'Farmer A cancelled own offer (status 200)');
  assert(cancelRes.data.data.status === 'Cancelled' || cancelRes.data.data.rawStatus === 'CANCELLED', 'Offer status updated to Cancelled');

  // 14. Test 14: Expired offer becomes EXPIRED
  console.log('\n--- TEST 14: Expired offer status management (becomes EXPIRED) ---');
  // Create an offer with expiryDate just 1 second in the future
  const shortExpiry = new Date(Date.now() + 1500).toISOString();
  const createShortOffer = await makeRequest('POST', '/api/farmer/surplus', {
    productId: productAId,
    availableQuantity: 5,
    discountPercent: 15,
    expiryDate: shortExpiry,
    reason: 'Expiring offer test',
  }, farmerAToken);
  assert(createShortOffer.status === 201, 'Created short-lived surplus offer');
  const shortOfferId = createShortOffer.data.data.id;

  // Wait 2.5 seconds for it to expire
  console.log('   Waiting 2.5 seconds for offer expiryDate to pass...');
  await new Promise((r) => setTimeout(r, 2500));

  // Fetch list or fetch by id
  const getExpired = await makeRequest('GET', `/api/farmer/surplus/${shortOfferId}`, null, farmerAToken);
  assert(getExpired.status === 200, 'Fetched expired offer');
  assert(getExpired.data.data.status === 'Expired' || getExpired.data.data.rawStatus === 'EXPIRED', 'TEST 14: Overdue offer automatically transitioned to Expired');

  // 15. Test 17: Offer survives page refresh
  console.log('\n--- TEST 17: Offer survives page refresh / re-query ---');
  const refreshGet = await makeRequest('GET', `/api/farmer/surplus/${offerB.id}`, null, farmerBToken);
  assert(refreshGet.status === 200, 'TEST 17: Farmer B offer re-fetched successfully');
  assert(refreshGet.data.data.offerCode === offerB.offerCode, 'Offer code persists identically');
  assert(refreshGet.data.data.availableQuantity === 15, 'Available quantity persists identically');

  // 16. Test 18: Offer survives logout/login
  console.log('\n--- TEST 18: Offer survives logout and fresh login ---');
  const freshLogin = await makeRequest('POST', '/api/auth/farmer/login', {
    email: farmerBEmail,
    password: 'Password123!',
  });
  assert(freshLogin.status === 200, 'Farmer B re-logged in successfully');
  const freshTokenB = freshLogin.data.data.token;

  const freshListB = await makeRequest('GET', '/api/farmer/surplus', null, freshTokenB);
  assert(freshListB.status === 200, 'Fetched surplus list with fresh login token');
  const foundB = freshListB.data.data.find((o) => o.id === offerB.id);
  assert(Boolean(foundB), 'TEST 18: Offer B exists and intact after logout/re-login session');

  console.log(`\n======================================================`);
  console.log(`SURPLUS ENGINE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSurplusTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
