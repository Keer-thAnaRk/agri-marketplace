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

async function runHarvestTests() {
  console.log('=== STARTING FARMER HARVEST & QR TRACEABILITY INTEGRATION TESTS ===\n');
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
  const farmerAEmail = `farmer_harv_a_${timestamp}@krishi.test`;
  const regFarmerA = await makeRequest('POST', '/api/auth/farmer/register', {
    fullName: 'Ramesh Gowda',
    email: farmerAEmail,
    phone: `988${String(timestamp).slice(-7)}`,
    password: 'Password123!',
    farmName: 'Gowda Organic Farms',
    farmLocation: 'Mandya Rural',
    city: 'Mandya',
    state: 'Karnataka',
    pincode: '571401',
    hub: 'Mysuru-Mandya Hub',
    farmingMethod: 'Organic',
    yearsFarming: 12,
    mainCrops: ['Tomatoes', 'Capsicum'],
    farmDescription: 'Pesticide-free organic heirloom crops',
  });
  assert(regFarmerA.status === 201, 'Farmer A registered (status 201)');
  const farmerAToken = regFarmerA.data.data.token;
  const farmerAId = regFarmerA.data.data.farmer.id;

  const approveA = await makeRequest('POST', `/api/admin/farmers/${farmerAId}/approve`, {}, adminToken);
  assert(approveA.status === 200, 'Farmer A approved by admin (status 200)');

  // 3. Register Farmer B (keep pending)
  console.log('\n3. Registering Farmer B (Pending verification)...');
  const farmerBEmail = `farmer_harv_b_${timestamp}@krishi.test`;
  const regFarmerB = await makeRequest('POST', '/api/auth/farmer/register', {
    fullName: 'Suresh Patel',
    email: farmerBEmail,
    phone: `977${String(timestamp).slice(-7)}`,
    password: 'Password123!',
    farmName: 'Patel Fields',
    farmLocation: 'Kolar East',
    city: 'Kolar',
    state: 'Karnataka',
    pincode: '563101',
    farmingMethod: 'Natural (ZBNF)',
    yearsFarming: 6,
    mainCrops: ['Potatoes'],
    farmDescription: 'Zero budget natural farming',
  });
  assert(regFarmerB.status === 201, 'Farmer B registered (status 201)');
  const farmerBToken = regFarmerB.data.data.token;

  // 4. Create Product for Farmer A with stock 50
  console.log('\n4. Creating Product for Farmer A with initial stock 50...');
  const createProdRes = await makeRequest('POST', '/api/farmer/products', {
    name: `Organic Vine Tomatoes ${timestamp}`,
    category: 'Vegetables',
    description: 'Sweet, juicy heirloom vine tomatoes',
    price: 60,
    unit: '1 kg',
    unitShort: 'kg',
    availableQuantity: 50,
    shelfLifeDays: 7,
    farmingMethod: 'Organic',
    images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea'],
  }, farmerAToken);
  assert(createProdRes.status === 201, 'Product created for Farmer A (status 201)');
  const productA = createProdRes.data.data;
  const productAId = productA.id;

  // 5. Test Auth barrier: GET /api/farmer/harvests without token
  console.log('\n5. Testing Authorization barriers on Harvest API...');
  const unauthGet = await makeRequest('GET', '/api/farmer/harvests');
  assert(unauthGet.status === 401, 'Unauthenticated GET /api/farmer/harvests returns 401');

  // 6. Test Pending farmer barrier: Farmer B cannot create harvest
  const pendingCreate = await makeRequest('POST', '/api/farmer/harvests', {
    productId: productAId,
    quantity: 30,
    unit: 'kg',
  }, farmerBToken);
  assert(pendingCreate.status === 403, 'Pending Farmer B cannot create harvest (403 Forbidden)');

  // 7. Test Validation on harvest creation
  console.log('\n6. Testing Input Validation on POST /api/farmer/harvests...');
  const invalidQty = await makeRequest('POST', '/api/farmer/harvests', {
    productId: productAId,
    quantity: -10,
    unit: 'kg',
  }, farmerAToken);
  assert(invalidQty.status === 400, 'Rejects negative quantity (status 400)');

  const missingProd = await makeRequest('POST', '/api/farmer/harvests', {
    productId: 'non-existent-product-id',
    quantity: 100,
    unit: 'kg',
  }, farmerAToken);
  assert(missingProd.status === 404 || missingProd.status === 400, 'Rejects non-existent product ID (400 or 404)');

  // 8. Farmer A records valid harvest (100 kg)
  console.log('\n7. Farmer A records valid morning harvest batch (100 kg)...');
  const harvestDate = new Date().toISOString();
  const createHarvestRes = await makeRequest('POST', '/api/farmer/harvests', {
    productId: productAId,
    quantity: 100,
    unit: 'kg',
    harvestDate,
    expectedShelfLifeDays: 7,
    notes: 'Picked at dawn 5:30 AM with high Brix sweetness.',
  }, farmerAToken);
  assert(createHarvestRes.status === 201, 'Harvest created successfully (status 201)');
  const harvestBatch = createHarvestRes.data.data;
  assert(Boolean(harvestBatch.id), 'Harvest has unique id');
  assert(Boolean(harvestBatch.batchNumber), `Batch number generated: ${harvestBatch.batchNumber}`);
  assert(Boolean(harvestBatch.qrCodeUrl && harvestBatch.qrCodeUrl.startsWith('data:image/png;base64,')), 'QR code DataURL generated');
  assert(harvestBatch.freshnessScore >= 95, `Freshness score dynamically calculated: ${harvestBatch.freshnessScore}%`);
  assert(Array.isArray(harvestBatch.traceabilityEvents) && harvestBatch.traceabilityEvents.length === 2, 'Initial 2 traceability events created (FARM_ORIGIN & HARVEST)');
  assert(harvestBatch.traceabilityEvents[0].step === 'farm', 'First event is farm origin step');
  assert(harvestBatch.traceabilityEvents[1].step === 'harvest', 'Second event is dawn harvest step');

  // 9. Verify Atomic Stock Synchronization in PostgreSQL
  console.log('\n8. Verifying Atomic Stock Synchronization in Inventory and Products...');
  const invRes = await makeRequest('GET', `/api/farmer/inventory/${productAId}`, null, farmerAToken);
  assert(invRes.status === 200, 'Inventory item fetched (status 200)');
  assert(invRes.data.data.availableQuantity === 150, `Inventory stock increased from 50 to 150 (got ${invRes.data.data.availableQuantity})`);
  assert(invRes.data.data.currentStock === 150, `Inventory currentStock is 150`);

  const prodRes = await makeRequest('GET', `/api/farmer/products/${productAId}`, null, farmerAToken);
  assert(prodRes.status === 200, 'Product fetched (status 200)');
  assert(prodRes.data.data.availableQuantity === 150, `Product availableQuantity updated to 150 (got ${prodRes.data.data.availableQuantity})`);
  assert(prodRes.data.data.inStock === true, 'Product inStock is true');

  // 10. Verify GET /api/farmer/harvests (List & Isolation)
  console.log('\n9. Testing Tenant Data Isolation on GET /api/farmer/harvests...');
  const farmerAHarvests = await makeRequest('GET', '/api/farmer/harvests', null, farmerAToken);
  assert(farmerAHarvests.status === 200, 'Farmer A harvests list returns 200');
  assert(farmerAHarvests.data.count >= 1, `Farmer A sees their harvest (count: ${farmerAHarvests.data.count})`);

  const farmerBHarvests = await makeRequest('GET', '/api/farmer/harvests', null, farmerBToken);
  assert(farmerBHarvests.status === 200, 'Farmer B harvests list returns 200');
  assert(farmerBHarvests.data.count === 0, `Farmer B sees ZERO harvests belonging to Farmer A (count: ${farmerBHarvests.data.count})`);

  // 11. Verify GET /api/farmer/harvests/:id (Single batch lookup & Isolation)
  console.log('\n10. Testing GET /api/farmer/harvests/:id by ID and BatchNumber...');
  const getById = await makeRequest('GET', `/api/farmer/harvests/${harvestBatch.id}`, null, farmerAToken);
  assert(getById.status === 200, 'Farmer A can fetch batch by UUID');

  const getByBatchNum = await makeRequest('GET', `/api/farmer/harvests/${harvestBatch.batchNumber}`, null, farmerAToken);
  assert(getByBatchNum.status === 200, 'Farmer A can fetch batch by batchNumber');
  assert(getByBatchNum.data.data.id === harvestBatch.id, 'Fetched batch matches correct harvest');

  const farmerBCrossAccess = await makeRequest('GET', `/api/farmer/harvests/${harvestBatch.id}`, null, farmerBToken);
  assert(farmerBCrossAccess.status === 404 || farmerBCrossAccess.status === 403, 'Farmer B cannot access Farmer A batch (404/403)');

  // 12. Add Traceability Event: POST /api/farmer/harvests/:id/events
  console.log('\n11. Adding Traceability Events (PACK & DISPATCH)...');
  const addPackEvent = await makeRequest('POST', `/api/farmer/harvests/${harvestBatch.id}/events`, {
    step: 'PACK',
    title: 'Clean Air Crate Packaging',
    location: 'Mandya Rural Packhouse Bay 2',
    details: 'Produce sorted into recyclable vented crates and sealed.',
    verifiedBy: 'Krishi Quality Officer Vinay K.',
  }, farmerAToken);
  assert(addPackEvent.status === 201, 'Traceability PACK event added (status 201)');
  assert(addPackEvent.data.data.step === 'pack', 'Event step mapped correctly to "pack"');
  assert(addPackEvent.data.data.orderIndex === 3, 'Order index correctly set to 3');

  const addDispatchEvent = await makeRequest('POST', `/api/farmer/harvests/${harvestBatch.id}/events`, {
    step: 'DISPATCH',
    title: 'Dispatched to Bengaluru Central Hub',
    location: 'Mandya Hub Gate 1',
    details: 'Loaded onto climate-monitored EV transport vehicle.',
    verifiedBy: 'Fleet Logistics Manager',
  }, farmerAToken);
  assert(addDispatchEvent.status === 201, 'Traceability DISPATCH event added (status 201)');
  assert(addDispatchEvent.data.data.orderIndex === 4, 'Order index correctly set to 4');

  // Verify non-owning farmer cannot add event
  const farmerBAddEvent = await makeRequest('POST', `/api/farmer/harvests/${harvestBatch.id}/events`, {
    step: 'DELIVERY',
    title: 'Unauthorized Delivery',
    details: 'Should fail',
  }, farmerBToken);
  assert(farmerBAddEvent.status === 403 || farmerBAddEvent.status === 404, 'Farmer B cannot add events to Farmer A batch (403/404)');

  // 13. Public Trace Endpoint: GET /api/trace/:batchId
  console.log('\n12. Testing Public Consumer Traceability (GET /api/trace/:batchId)...');
  const publicTraceRes = await makeRequest('GET', `/api/trace/${harvestBatch.batchNumber}`);
  assert(publicTraceRes.status === 200, 'Public trace returns 200 OK without any auth token');
  const publicData = publicTraceRes.data.data;
  assert(publicData.batchNumber === harvestBatch.batchNumber, 'Public trace matches batchNumber');
  assert(publicData.product.name === productA.name, 'Public trace contains correct product name');
  assert(publicData.farm.farmName === 'Gowda Organic Farms', 'Public trace contains farm name');
  assert(publicData.freshness.percentage >= 95, `Public trace has calculated freshness: ${publicData.freshness.percentage}%`);
  assert(publicData.traceabilityEvents.length === 4, `All 4 provenance milestones present in public timeline (got ${publicData.traceabilityEvents.length})`);

  // Verify strict data privacy (No sensitive fields leaked)
  console.log('\n13. Verifying Strict Consumer Privacy & Sensitive Data Stripping...');
  assert(publicData.farmerEmail === undefined, 'No farmerEmail in public response');
  assert(publicData.farmerPhone === undefined, 'No farmerPhone in public response');
  assert(publicData.passwordHash === undefined, 'No passwordHash in public response');
  assert(publicData.farm.email === undefined, 'No farm.email in public response');
  assert(publicData.farm.phone === undefined, 'No farm.phone in public response');
  assert(publicData.farm.documents === undefined, 'No farm documents leaked');

  // 14. Non-existent batchId in public trace returns 404
  const invalidTrace = await makeRequest('GET', '/api/trace/NON-EXISTENT-BATCH-1234');
  assert(invalidTrace.status === 404, 'Non-existent batch returns 404 Not Found');

  console.log(`\n======================================================`);
  console.log(`HARVEST & TRACEABILITY TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runHarvestTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
