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

async function runInventoryTests() {
  console.log('=== STARTING FARMER INVENTORY INTEGRATION TESTS ===\n');
  const timestamp = Date.now();

  // 1. Admin login
  console.log('1. Logging in as Admin...');
  const adminLogin = await makeRequest('POST', '/api/auth/admin/login', {
    email: 'admin@krishimarket.in',
    password: 'admin123',
  });
  if (adminLogin.status !== 200) {
    throw new Error('Admin login failed: ' + JSON.stringify(adminLogin.data));
  }
  const adminToken = adminLogin.data.data.token;
  console.log('   ✓ Admin login successful.');

  // 2. Register Farmer A
  const farmerAEmail = `farmer_inv_a_${timestamp}@krishitest.com`;
  console.log(`2. Registering Farmer A (${farmerAEmail})...`);
  const regA = await makeRequest('POST', '/api/auth/farmer/register', {
    fullName: 'Narayan Murthy',
    email: farmerAEmail,
    password: 'Password@123',
    phone: '9876543220',
    farmName: 'Shanti Agro Farm',
    farmLocation: 'Survey 14, Doddaballapura',
    pincode: '561203',
    farmingMethod: 'Organic',
  });
  if (regA.status !== 201) {
    throw new Error('Farmer A registration failed: ' + JSON.stringify(regA.data));
  }
  const tokenA = regA.data.data.token;
  const farmerAId = regA.data.data.farmer.id;
  console.log(`   ✓ Farmer A registered. ID: ${farmerAId}, Status: ${regA.data.data.verificationStatus}`);

  // Test 1: Pending farmer cannot modify inventory -> 403
  console.log('Test 1: Testing: Pending farmer cannot modify inventory (expect 403)...');
  const pendingPatch = await makeRequest(
    'PATCH',
    '/api/farmer/inventory/dummy-prod-id',
    { delta: 10, reason: 'Harvest addition' },
    tokenA
  );
  console.log(`   Response status: ${pendingPatch.status}`);
  if (pendingPatch.status === 403) {
    console.log('   ✓ PASS: Pending farmer blocked from modifying inventory (403 Forbidden).');
  } else {
    throw new Error('FAILED: Expected 403 but got ' + pendingPatch.status);
  }

  // Admin approves Farmer A
  console.log('Approving Farmer A...');
  const approveA = await makeRequest('POST', `/api/admin/farmers/${farmerAId}/approve`, {}, adminToken);
  if (approveA.status !== 200) throw new Error('Approve A failed: ' + JSON.stringify(approveA.data));
  console.log('   ✓ Farmer A approved.');

  // Create Product 1 for Farmer A with availableQuantity = 50, lowStockThreshold = 15
  console.log('Creating Product 1 for Farmer A...');
  const createProd1 = await makeRequest(
    'POST',
    '/api/farmer/products',
    {
      name: 'Organic Palak Greens',
      category: 'Vegetables',
      price: 35,
      unit: '250 g bunch',
      unitShort: 'bunch',
      availableQuantity: 50,
      lowStockThreshold: 15,
      shelfLifeDays: 4,
      farmingMethod: 'Organic',
    },
    tokenA
  );
  if (createProd1.status !== 201) {
    throw new Error('Product 1 creation failed: ' + JSON.stringify(createProd1.data));
  }
  const prod1 = createProd1.data.data;
  console.log(`   ✓ Product 1 created. ID: ${prod1.id}, available: ${prod1.availableQuantity}`);

  // Test 2: Approved farmer can view own inventory
  console.log('Test 2: Testing: Approved farmer can view own inventory...');
  const invListA = await makeRequest('GET', '/api/farmer/inventory', null, tokenA);
  if (invListA.status !== 200 || !Array.isArray(invListA.data.data)) {
    throw new Error('Failed to view inventory: ' + JSON.stringify(invListA.data));
  }
  const item1 = invListA.data.data.find((i) => i.productId === prod1.id);
  if (!item1) throw new Error('InventoryItem for Product 1 not found in inventory list!');
  console.log(`   ✓ PASS: Approved farmer retrieved inventory. Found Product 1 with available: ${item1.availableQuantity}, status: ${item1.status}`);

  // Test 3: Approved farmer can update own stock
  console.log('Test 3: Testing: Approved farmer can update own stock...');
  const updateRes1 = await makeRequest(
    'PATCH',
    `/api/farmer/inventory/${prod1.id}`,
    { delta: 10, reason: 'Fresh Morning Picking' },
    tokenA
  );
  if (updateRes1.status !== 200 || !updateRes1.data.success) {
    throw new Error('Stock update failed: ' + JSON.stringify(updateRes1.data));
  }
  console.log('   ✓ PASS: Stock updated successfully.');

  // Test 4: InventoryItem updated in PostgreSQL
  console.log('Test 4: Verifying InventoryItem updated in PostgreSQL...');
  const updatedItem1 = updateRes1.data.data;
  if (updatedItem1.availableQuantity !== 60 || updatedItem1.currentStock !== 60) {
    throw new Error(`FAILED: Expected availableQuantity 60, got ${updatedItem1.availableQuantity}`);
  }
  console.log(`   ✓ PASS: InventoryItem in DB has availableQuantity = ${updatedItem1.availableQuantity}, currentStock = ${updatedItem1.currentStock}`);

  // Test 5: Product availableQuantity synchronized
  console.log('Test 5: Verifying Product availableQuantity synchronized...');
  const getProdRes1 = await makeRequest('GET', `/api/farmer/products/${prod1.id}`, null, tokenA);
  if (getProdRes1.status !== 200 || getProdRes1.data.data.availableQuantity !== 60) {
    throw new Error(`FAILED: Product availableQuantity not synchronized! Got ${getProdRes1.data.data?.availableQuantity}`);
  }
  console.log(`   ✓ PASS: Product availableQuantity is 60.`);

  // Test 6: Product inStock synchronized
  console.log('Test 6: Verifying Product inStock synchronized...');
  if (getProdRes1.data.data.inStock !== true) {
    throw new Error('FAILED: Product inStock should be true when quantity > 0');
  }
  console.log('   ✓ PASS: Product inStock is true.');

  // Test 7: InventoryLog created
  console.log('Test 7: Verifying InventoryLog created in PostgreSQL...');
  const singleInv1 = await makeRequest('GET', `/api/farmer/inventory/${prod1.id}`, null, tokenA);
  if (singleInv1.status !== 200 || !singleInv1.data.data.logs || singleInv1.data.data.logs.length === 0) {
    throw new Error('FAILED: Inventory logs missing or empty: ' + JSON.stringify(singleInv1.data));
  }
  const latestLog = singleInv1.data.data.logs[0];
  console.log(`   ✓ PASS: InventoryLog record verified! Type: ${latestLog.type}, Amount: ${latestLog.amount}, New Qty: ${latestLog.newQuantity}, Reason: "${latestLog.reason}"`);

  // Test 8: Zero stock produces OUT_OF_STOCK
  console.log('Test 8: Testing: Zero stock produces OUT_OF_STOCK...');
  const zeroStockRes = await makeRequest(
    'PATCH',
    `/api/farmer/inventory/${prod1.id}`,
    { quantity: 0, reason: 'Sold out to wholesale partner' },
    tokenA
  );
  if (zeroStockRes.status !== 200 || zeroStockRes.data.data.status !== 'Out of Stock') {
    throw new Error(`FAILED: Expected 'Out of Stock', got status '${zeroStockRes.data?.data?.status}'`);
  }
  // Verify Product inStock is false when availableQuantity is 0
  const zeroProd = await makeRequest('GET', `/api/farmer/products/${prod1.id}`, null, tokenA);
  if (zeroProd.data.data.inStock !== false) {
    throw new Error('FAILED: Product inStock should be false when quantity is 0');
  }
  console.log('   ✓ PASS: Zero stock correctly sets status = OUT_OF_STOCK and Product.inStock = false.');

  // Test 9: Stock below threshold produces LOW_STOCK
  console.log('Test 9: Testing: Stock below threshold (10 <= 15) produces LOW_STOCK...');
  const lowStockRes = await makeRequest(
    'PATCH',
    `/api/farmer/inventory/${prod1.id}`,
    { quantity: 10, reason: 'Small harvest batch' },
    tokenA
  );
  if (lowStockRes.status !== 200 || lowStockRes.data.data.status !== 'Low Stock') {
    throw new Error(`FAILED: Expected 'Low Stock', got '${lowStockRes.data?.data?.status}'`);
  }
  console.log('   ✓ PASS: Stock below threshold correctly produces LOW_STOCK.');

  // Test 10: Stock above threshold produces IN_STOCK
  console.log('Test 10: Testing: Stock above threshold (40 > 15) produces IN_STOCK...');
  const inStockRes = await makeRequest(
    'PATCH',
    `/api/farmer/inventory/${prod1.id}`,
    { quantity: 40, reason: 'Major harvest restock' },
    tokenA
  );
  if (inStockRes.status !== 200 || inStockRes.data.data.status !== 'In Stock') {
    throw new Error(`FAILED: Expected 'In Stock', got '${inStockRes.data?.data?.status}'`);
  }
  console.log('   ✓ PASS: Stock above threshold correctly produces IN_STOCK.');

  // Test 11: Negative quantity rejected -> 400
  console.log('Test 11: Testing: Negative quantity rejected (expect 400)...');
  const negQtyRes = await makeRequest(
    'PATCH',
    `/api/farmer/inventory/${prod1.id}`,
    { quantity: -25 },
    tokenA
  );
  if (negQtyRes.status === 400) {
    console.log('   ✓ PASS: Negative quantity rejected with 400 Bad Request.');
  } else {
    throw new Error(`FAILED: Expected 400 but got ${negQtyRes.status}`);
  }

  // Also test reducing more than available stock
  console.log('Testing: Reducing more than available stock rejected (expect 400)...');
  const overReduceRes = await makeRequest(
    'PATCH',
    `/api/farmer/inventory/${prod1.id}`,
    { delta: -100 },
    tokenA
  );
  if (overReduceRes.status === 400) {
    console.log('   ✓ PASS: Reduction exceeding stock rejected with 400 Bad Request.');
  } else {
    throw new Error(`FAILED: Expected 400 but got ${overReduceRes.status}`);
  }

  // Register and approve Farmer B
  const farmerBEmail = `farmer_inv_b_${timestamp}@krishitest.com`;
  console.log(`Registering Farmer B (${farmerBEmail})...`);
  const regB = await makeRequest('POST', '/api/auth/farmer/register', {
    fullName: 'Anand Kumar',
    email: farmerBEmail,
    password: 'Password@123',
    phone: '9876543221',
    farmName: 'Kumar Greens',
    farmLocation: 'Survey 88, Hoskote',
    pincode: '562114',
    farmingMethod: 'Natural (ZBNF)',
  });
  const tokenB = regB.data.data.token;
  const farmerBId = regB.data.data.farmer.id;
  await makeRequest('POST', `/api/admin/farmers/${farmerBId}/approve`, {}, adminToken);
  console.log(`   ✓ Farmer B registered and approved. ID: ${farmerBId}`);

  // Test 12: Farmer A cannot view Farmer B inventory
  console.log(`Test 12: Testing: Farmer B cannot view Farmer A's inventory for Product ${prod1.id} (expect 404)...`);
  const crossView = await makeRequest('GET', `/api/farmer/inventory/${prod1.id}`, null, tokenB);
  if (crossView.status === 404) {
    console.log("   ✓ PASS: Farmer B cannot view Farmer A's inventory (404 Not Found).");
  } else {
    throw new Error(`FAILED: Expected 404 but got ${crossView.status}`);
  }

  // Test 13: Farmer A cannot modify Farmer B inventory
  console.log(`Test 13: Testing: Farmer B cannot modify Farmer A's inventory for Product ${prod1.id} (expect 403)...`);
  const crossModify = await makeRequest(
    'PATCH',
    `/api/farmer/inventory/${prod1.id}`,
    { delta: 50 },
    tokenB
  );
  if (crossModify.status === 403) {
    console.log("   ✓ PASS: Farmer B cannot modify Farmer A's inventory (403 Forbidden).");
  } else {
    throw new Error(`FAILED: Expected 403 but got ${crossModify.status}`);
  }

  // Test 14: Inventory survives page refresh (repeated GET fetches same fresh state from DB)
  console.log('Test 14: Testing: Inventory survives page refresh / re-fetching from DB...');
  const refreshGet = await makeRequest('GET', `/api/farmer/inventory/${prod1.id}`, null, tokenA);
  if (refreshGet.status !== 200 || refreshGet.data.data.availableQuantity !== 40) {
    throw new Error('FAILED: Inventory state lost on refresh: ' + JSON.stringify(refreshGet.data));
  }
  console.log(`   ✓ PASS: Inventory survives refresh. Available quantity remains ${refreshGet.data.data.availableQuantity}.`);

  // Test 15: Inventory survives logout/login
  console.log('Test 15: Testing: Inventory survives logout and re-login...');
  const reLogin = await makeRequest('POST', '/api/auth/farmer/login', {
    email: farmerAEmail,
    password: 'Password@123',
  });
  if (reLogin.status !== 200) throw new Error('Re-login failed: ' + JSON.stringify(reLogin.data));
  const freshTokenA = reLogin.data.data.token;
  const reLoginGet = await makeRequest('GET', '/api/farmer/inventory', null, freshTokenA);
  const foundAfterReLogin = reLoginGet.data.data.find((i) => i.productId === prod1.id);
  if (!foundAfterReLogin || foundAfterReLogin.availableQuantity !== 40) {
    throw new Error('FAILED: Inventory state lost after re-login: ' + JSON.stringify(foundAfterReLogin));
  }
  console.log(`   ✓ PASS: Inventory survives re-login. Available quantity: ${foundAfterReLogin.availableQuantity}.`);

  // Test 16: No duplicate InventoryItem is created
  console.log('Test 16: Testing: No duplicate InventoryItem is created...');
  const allInvForFarmerA = await makeRequest('GET', '/api/farmer/inventory', null, tokenA);
  const prod1Items = allInvForFarmerA.data.data.filter((i) => i.productId === prod1.id);
  if (prod1Items.length !== 1) {
    throw new Error(`FAILED: Duplicate inventory items found! Count: ${prod1Items.length}`);
  }
  console.log(`   ✓ PASS: Exactly 1 InventoryItem exists for Product 1 (no duplicates).`);

  console.log('\n======================================================');
  console.log('✓ ALL 16 BACKEND INVENTORY INTEGRATION TESTS PASSED!');
  console.log('======================================================\n');
}

runInventoryTests().catch((err) => {
  console.error('\n❌ INVENTORY TEST RUNNER FAILED:', err);
  process.exit(1);
});
