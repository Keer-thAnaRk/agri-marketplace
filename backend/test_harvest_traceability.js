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

async function runTests() {
  console.log('================================================================');
  console.log('  FARMER HARVEST + QR TRACEABILITY DATABASE INTEGRATION TESTS   ');
  console.log('================================================================\n');

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

  // --- SETUP ---
  console.log('--- Step 0: Setup Admin and Farmers ---');
  // 1. Admin login
  const adminLogin = await makeRequest('POST', '/api/auth/admin/login', {
    email: 'admin@krishimarket.in',
    password: 'admin123',
  });
  assert(adminLogin.status === 200, 'Admin login succeeds');
  const adminToken = adminLogin.data.data.token;

  // 2. Register Farmer 1 (Approved)
  const f1Email = `farmer_trace_1_${timestamp}@krishi.test`;
  const regF1 = await makeRequest('POST', '/api/auth/farmer/register', {
    fullName: 'Anand Kumar',
    email: f1Email,
    phone: `981${String(timestamp).slice(-7)}`,
    password: 'Password123!',
    farmName: 'Anand Heritage Organics',
    farmLocation: 'Nelamangala Taluk, Bengaluru Rural',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '562123',
    hub: 'Bengaluru North Hub',
    farmingMethod: 'Organic',
    yearsFarming: 8,
    mainCrops: ['Organic Spinach', 'Heirloom Carrots'],
    farmDescription: 'Certified organic agroforestry farm',
  });
  assert(regF1.status === 201, 'Farmer 1 registered successfully');
  const farmer1Token = regF1.data.data.token;
  const farmer1Id = regF1.data.data.farmer.id;

  const appF1 = await makeRequest('POST', `/api/admin/farmers/${farmer1Id}/approve`, {}, adminToken);
  assert(appF1.status === 200, 'Farmer 1 approved by admin');

  // 3. Register Farmer 2 (Approved - for cross tenant testing)
  const f2Email = `farmer_trace_2_${timestamp}@krishi.test`;
  const regF2 = await makeRequest('POST', '/api/auth/farmer/register', {
    fullName: 'Basavaraj Patil',
    email: f2Email,
    phone: `982${String(timestamp).slice(-7)}`,
    password: 'Password123!',
    farmName: 'Patil Natural Fields',
    farmLocation: 'Dharwad Rural',
    city: 'Dharwad',
    state: 'Karnataka',
    pincode: '580001',
    hub: 'Hubballi Hub',
    farmingMethod: 'Natural (ZBNF)',
    yearsFarming: 15,
    mainCrops: ['Jowar', 'Millets'],
    farmDescription: 'Natural zero-budget farm',
  });
  assert(regF2.status === 201, 'Farmer 2 registered successfully');
  const farmer2Token = regF2.data.data.token;
  const farmer2Id = regF2.data.data.farmer.id;

  const appF2 = await makeRequest('POST', `/api/admin/farmers/${farmer2Id}/approve`, {}, adminToken);
  assert(appF2.status === 200, 'Farmer 2 approved by admin');

  // 4. Register Farmer 3 (Pending verification)
  const f3Email = `farmer_trace_pending_${timestamp}@krishi.test`;
  const regF3 = await makeRequest('POST', '/api/auth/farmer/register', {
    fullName: 'Prakash Rao',
    email: f3Email,
    phone: `983${String(timestamp).slice(-7)}`,
    password: 'Password123!',
    farmName: 'Prakash Eco Farm',
    farmLocation: 'Hassan',
    city: 'Hassan',
    state: 'Karnataka',
    pincode: '573201',
    hub: 'Mysuru-Mandya Hub',
    farmingMethod: 'Organic',
    yearsFarming: 3,
    mainCrops: ['Coffee', 'Cardamom'],
  });
  assert(regF3.status === 201, 'Farmer 3 registered (PENDING status)');
  const pendingFarmerToken = regF3.data.data.token;

  // 5. Register Farmer 4 (Rejected)
  const f4Email = `farmer_trace_rejected_${timestamp}@krishi.test`;
  const regF4 = await makeRequest('POST', '/api/auth/farmer/register', {
    fullName: 'Ramesh Rejected',
    email: f4Email,
    phone: `984${String(timestamp).slice(-7)}`,
    password: 'Password123!',
    farmName: 'Fake Farm',
    farmLocation: 'Unknown',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    hub: 'Bengaluru South Hub',
    farmingMethod: 'Conventional',
    yearsFarming: 1,
  });
  assert(regF4.status === 201, 'Farmer 4 registered');
  const rejectedFarmerId = regF4.data.data.farmer.id;

  const rejF4 = await makeRequest('POST', `/api/admin/farmers/${rejectedFarmerId}/reject`, {
    reason: 'Invalid documentation provided during audit',
  }, adminToken);
  assert(rejF4.status === 200, 'Farmer 4 rejected by admin');

  const f4Login = await makeRequest('POST', '/api/auth/farmer/login', {
    email: f4Email,
    password: 'Password123!',
  });
  const rejectedFarmerToken = f4Login.data.data.token;

  // 6. Create Product and Harvest Batch for Farmer 1
  console.log('\n--- Step 1: Create Product & Harvest for Farmer 1 ---');
  const prodRes = await makeRequest('POST', '/api/farmer/products', {
    name: `Organic Baby Spinach ${timestamp}`,
    category: 'Vegetables',
    description: 'Crisp pesticide-free tender organic baby spinach leaves',
    price: 40,
    unit: '250 g',
    unitShort: 'g',
    availableQuantity: 40,
    shelfLifeDays: 5,
    farmingMethod: 'Organic',
    images: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb'],
  }, farmer1Token);
  assert(prodRes.status === 201, 'Product created for Farmer 1');
  const product1Id = prodRes.data.data.id;

  const harvRes = await makeRequest('POST', '/api/farmer/harvests', {
    productId: product1Id,
    quantity: 80,
    unit: 'kg',
    harvestDate: new Date().toISOString(),
    expectedShelfLifeDays: 5,
    notes: 'Hand-picked at dawn 5:45 AM under optimal humidity.',
  }, farmer1Token);
  assert(harvRes.status === 201, 'Harvest batch created for Farmer 1');
  const harvest1 = harvRes.data.data;
  const batchId = harvest1.id;
  const batchNumber = harvest1.batchNumber;

  console.log(`\nHarvest Batch created: ID=${batchId}, BatchNumber=${batchNumber}\n`);

  // --- 17 CRITERIA VERIFICATION ---
  console.log('--- Criterion 1: Approved farmer can retrieve own harvest ---');
  const getOwnById = await makeRequest('GET', `/api/farmer/harvests/${batchId}`, null, farmer1Token);
  assert(getOwnById.status === 200, 'GET /api/farmer/harvests/:id returns 200 for owner');
  assert(getOwnById.data.data.id === batchId, 'Returned harvest ID matches requested batch');

  const getOwnByBatchNum = await makeRequest('GET', `/api/farmer/harvests/${batchNumber}`, null, farmer1Token);
  assert(getOwnByBatchNum.status === 200, 'GET /api/farmer/harvests/:batchId returns 200 using batchNumber');
  assert(getOwnByBatchNum.data.data.batchNumber === batchNumber, 'Returned batchNumber matches');

  console.log('\n--- Criterion 2: Farmer cannot retrieve another farmer harvest ---');
  const crossGet = await makeRequest('GET', `/api/farmer/harvests/${batchId}`, null, farmer2Token);
  assert(crossGet.status === 403 || crossGet.status === 404, `Farmer 2 cannot view Farmer 1 harvest (Status: ${crossGet.status})`);
  assert(crossGet.data.success === false, 'crossGet returns success: false');

  console.log('\n--- Criterion 3: Approved farmer can retrieve own traceability events ---');
  const getEventsRes = await makeRequest('GET', `/api/farmer/harvests/${batchId}/traceability`, null, farmer1Token);
  assert(getEventsRes.status === 200, 'GET /api/farmer/harvests/:batchId/traceability returns 200');
  assert(Array.isArray(getEventsRes.data.data), 'traceability data is an array');
  assert(getEventsRes.data.count >= 2, `Contains initial provenance events (count: ${getEventsRes.data.count})`);

  console.log('\n--- Criterion 4: Approved farmer can create a traceability event ---');
  const addPackRes = await makeRequest('POST', `/api/farmer/harvests/${batchId}/traceability`, {
    step: 'PACK',
    title: 'Nitrogen-Flush Protective Crate Pack',
    location: 'Nelamangala Organic Bay 3',
    details: 'Graded Grade-A+, sealed in recyclable bio-crates with moisture sensors.',
    verifiedBy: 'Krishi Quality Inspector K. Rao',
    actor: 'Anand Kumar',
  }, farmer1Token);
  assert(addPackRes.status === 201, 'POST /api/farmer/harvests/:batchId/traceability returns 201 Created');
  assert(addPackRes.data.data.step === 'pack', 'Returned event step mapped to "pack"');
  assert(addPackRes.data.data.title === 'Nitrogen-Flush Protective Crate Pack', 'Returned event has correct title');

  console.log('\n--- Criterion 5: Event persists in PostgreSQL ---');
  const fetchPersistedEvents = await makeRequest('GET', `/api/farmer/harvests/${batchId}/traceability`, null, farmer1Token);
  assert(fetchPersistedEvents.status === 200, 'Subsequent fetch returns 200');
  const persistedPack = fetchPersistedEvents.data.data.find(e => e.title === 'Nitrogen-Flush Protective Crate Pack');
  assert(Boolean(persistedPack), 'Newly created event is retrieved from PostgreSQL database');
  assert(persistedPack.step === 'pack', 'Persisted step is "pack"');
  assert(persistedPack.details.includes('Grade-A+'), 'Persisted details match exactly');

  console.log('\n--- Criterion 6: Farmer cannot add an event to another farmer batch ---');
  const crossAddRes = await makeRequest('POST', `/api/farmer/harvests/${batchId}/traceability`, {
    step: 'DISPATCH',
    title: 'Unauthorized Dispatch Attempt',
    details: 'Should be rejected',
  }, farmer2Token);
  assert(crossAddRes.status === 403 || crossAddRes.status === 404, `Farmer 2 denied from adding event to Farmer 1 batch (Status: ${crossAddRes.status})`);
  assert(crossAddRes.data.success === false, 'crossAdd returns success: false');

  console.log('\n--- Criterion 7: Invalid traceability step rejected ---');
  const invalidStepRes = await makeRequest('POST', `/api/farmer/harvests/${batchId}/traceability`, {
    step: 'TELEPORTATION',
    title: 'Invalid Step Event',
    details: 'This should fail validation',
  }, farmer1Token);
  assert(invalidStepRes.status === 400, `Invalid step rejected with 400 Bad Request (Status: ${invalidStepRes.status})`);
  assert(invalidStepRes.data.success === false, 'invalidStep returns success: false');

  console.log('\n--- Criterion 8: Invalid event data rejected ---');
  const emptyTitleRes = await makeRequest('POST', `/api/farmer/harvests/${batchId}/traceability`, {
    step: 'DISPATCH',
    title: '   ',
    details: 'Missing valid title',
  }, farmer1Token);
  assert(emptyTitleRes.status === 400, `Empty title rejected with 400 (Status: ${emptyTitleRes.status})`);

  const emptyDetailsRes = await makeRequest('POST', `/api/farmer/harvests/${batchId}/traceability`, {
    step: 'DISPATCH',
    title: 'Valid Title',
    details: '',
  }, farmer1Token);
  assert(emptyDetailsRes.status === 400, `Empty details rejected with 400 (Status: ${emptyDetailsRes.status})`);

  const invalidTimeRes = await makeRequest('POST', `/api/farmer/harvests/${batchId}/traceability`, {
    step: 'DISPATCH',
    title: 'Valid Title',
    details: 'Valid details',
    timestamp: 'not-a-valid-date-string',
  }, farmer1Token);
  assert(invalidTimeRes.status === 400, `Invalid timestamp format rejected with 400 (Status: ${invalidTimeRes.status})`);

  console.log('\n--- Criterion 9: QR URL points to correct batch ---');
  assert(Boolean(harvest1.qrCodeUrl), 'Harvest batch has qrCodeUrl field');
  assert(harvest1.qrCodeUrl.startsWith('data:image/png;base64,'), 'qrCodeUrl is a valid PNG Data URL');
  // Also verify single fetch returns qrCodeUrl
  assert(Boolean(getOwnById.data.data.qrCodeUrl), 'Fetched harvest batch preserves qrCodeUrl');

  console.log('\n--- Criterion 10: Public trace endpoint works without authentication ---');
  const publicNoAuth = await makeRequest('GET', `/api/trace/${batchNumber}`);
  assert(publicNoAuth.status === 200, 'GET /api/trace/:batchId returns 200 without Authorization header');

  console.log('\n--- Criterion 11: Public trace endpoint returns correct batch ---');
  const publicData = publicNoAuth.data.data;
  assert(publicData.batchNumber === batchNumber, `publicData.batchNumber matches (${publicData.batchNumber})`);
  assert(publicData.batchId === batchId, 'publicData.batchId matches');
  assert(publicData.product.name.includes('Spinach'), 'publicData product name matches');
  assert(publicData.farm.farmName === 'Anand Heritage Organics', 'publicData farm name matches');
  assert(publicData.traceabilityEvents.length >= 3, `publicData contains all logged events (count: ${publicData.traceabilityEvents.length})`);
  assert(publicData.freshness.percentage >= 90, `Freshness score present: ${publicData.freshness.percentage}%`);

  console.log('\n--- Criterion 12: Public trace endpoint returns 404 for invalid batch ---');
  const public404 = await makeRequest('GET', '/api/trace/NON-EXISTENT-BATCH-9999');
  assert(public404.status === 404, `Invalid batch returns 404 Not Found (Status: ${public404.status})`);
  assert(public404.data.success === false, 'public404 returns success: false');

  console.log('\n--- Criterion 13: Public endpoint does not expose passwordHash ---');
  assert(publicData.passwordHash === undefined, 'Top-level passwordHash is undefined');
  assert(publicData.farmer?.user?.passwordHash === undefined, 'Nested farmer user passwordHash is undefined');
  assert(publicData.farm?.passwordHash === undefined, 'Nested farm passwordHash is undefined');
  assert(JSON.stringify(publicData).includes('passwordHash') === false, 'Raw JSON does not contain "passwordHash" anywhere');

  console.log('\n--- Criterion 14: Public endpoint does not expose private farmer documents ---');
  assert(publicData.documents === undefined, 'Top-level documents is undefined');
  assert(publicData.verificationDocuments === undefined, 'Top-level verificationDocuments is undefined');
  assert(publicData.farm?.verificationDocuments === undefined, 'farm.verificationDocuments is undefined');
  assert(publicData.farm?.documents === undefined, 'farm.documents is undefined');
  assert(publicData.farmerPhone === undefined, 'farmerPhone is undefined');
  assert(publicData.farm?.phone === undefined, 'farm.phone is undefined');
  assert(JSON.stringify(publicData).includes('verificationDocuments') === false, 'Raw JSON does not contain private documents');

  console.log('\n--- Criterion 15: PENDING farmer cannot manage traceability ---');
  const pendingAddRes = await makeRequest('POST', `/api/farmer/harvests/${batchId}/traceability`, {
    step: 'DISPATCH',
    title: 'Pending Farmer Dispatch',
    details: 'Should be blocked by requireApprovedFarmer',
  }, pendingFarmerToken);
  assert(pendingAddRes.status === 403, `PENDING farmer blocked with 403 Forbidden (Status: ${pendingAddRes.status})`);
  assert(pendingAddRes.data.success === false, 'pendingAdd returns success: false');
  assert(pendingAddRes.data.error.includes('not approved'), 'Error message informs farmer is not approved');

  console.log('\n--- Criterion 16: REJECTED farmer cannot manage traceability ---');
  const rejectedAddRes = await makeRequest('POST', `/api/farmer/harvests/${batchId}/traceability`, {
    step: 'DISPATCH',
    title: 'Rejected Farmer Dispatch',
    details: 'Should be blocked by requireApprovedFarmer',
  }, rejectedFarmerToken);
  assert(rejectedAddRes.status === 403, `REJECTED farmer blocked with 403 Forbidden (Status: ${rejectedAddRes.status})`);
  assert(rejectedAddRes.data.success === false, 'rejectedAdd returns success: false');
  assert(rejectedAddRes.data.error.includes('not approved'), 'Error message informs farmer is not approved');

  console.log('\n--- Criterion 17: APPROVED farmer can manage own traceability ---');
  const approvedDispatchRes = await makeRequest('POST', `/api/farmer/harvests/${batchId}/traceability`, {
    step: 'DISPATCH',
    title: 'Climate Controlled EV Dispatch',
    location: 'Nelamangala Logistics Bay 1',
    details: 'Dispatched in refrigerated electric vehicle maintained at 4°C.',
    verifiedBy: 'Fleet Dispatcher Suresh N.',
    actor: 'Anand Kumar',
  }, farmer1Token);
  assert(approvedDispatchRes.status === 201, `APPROVED farmer succeeds with 201 Created (Status: ${approvedDispatchRes.status})`);
  assert(approvedDispatchRes.data.data.step === 'dispatch', 'Dispatch step recorded');
  assert(approvedDispatchRes.data.data.orderIndex === 4, 'Order index chronologically incremented to 4');

  const finalTraceCheck = await makeRequest('GET', `/api/trace/${batchNumber}`);
  assert(finalTraceCheck.status === 200, 'Public trace retrieved after dispatch');
  assert(finalTraceCheck.data.data.traceabilityEvents.length === 4, `All 4 events now live in public trace (count: ${finalTraceCheck.data.data.traceabilityEvents.length})`);

  console.log('\n================================================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED across all 17 criteria`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
