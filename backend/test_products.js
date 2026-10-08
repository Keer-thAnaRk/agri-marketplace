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
  console.log('=== STARTING FARMER PRODUCTS INTEGRATION TESTS ===\n');
  const timestamp = Date.now();

  // 1. Admin login to get admin token for approval
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
  const farmerAEmail = `farmer_a_${timestamp}@krishitest.com`;
  console.log(`2. Registering Farmer A (${farmerAEmail})...`);
  const regA = await makeRequest('POST', '/api/auth/farmer/register', {
    fullName: 'Ramesh Gowda',
    email: farmerAEmail,
    password: 'Password@123',
    phone: '9876543210',
    farmName: 'Gowda Organic Farms',
    farmLocation: 'Survey 42, Nelamangala',
    pincode: '562123',
    farmingMethod: 'Organic',
  });
  if (regA.status !== 201) {
    throw new Error('Farmer A registration failed: ' + JSON.stringify(regA.data));
  }
  const tokenA = regA.data.data.token;
  const farmerAId = regA.data.data.farmer.id;
  console.log(`   ✓ Farmer A registered. ID: ${farmerAId}, Status: ${regA.data.data.verificationStatus}`);

  // 3. Test: PENDING farmer cannot create product
  console.log('3. Testing: PENDING Farmer A cannot create product (expect 403)...');
  const pendingCreate = await makeRequest(
    'POST',
    '/api/farmer/products',
    {
      name: 'Organic Desi Tomatoes',
      price: 55,
      category: 'Vegetables',
      availableQuantity: 50,
      unit: '1 kg',
      unitShort: 'kg',
    },
    tokenA
  );
  console.log(`   Response status: ${pendingCreate.status}`);
  if (pendingCreate.status === 403) {
    console.log('   ✓ PASS: PENDING farmer blocked from creating products (403 Forbidden).');
  } else {
    throw new Error('FAILED: Expected 403 but got ' + pendingCreate.status + ': ' + JSON.stringify(pendingCreate.data));
  }

  // 4. Admin approves Farmer A
  console.log('4. Admin approving Farmer A...');
  const approveA = await makeRequest(
    'POST',
    `/api/admin/farmers/${farmerAId}/approve`,
    {},
    adminToken
  );
  if (approveA.status !== 200) {
    throw new Error('Approval failed: ' + JSON.stringify(approveA.data));
  }
  console.log('   ✓ Farmer A approved.');

  // 5. Test: APPROVED Farmer A CAN create products
  console.log('5. Testing: APPROVED Farmer A creates product in PostgreSQL (expect 201)...');
  const createRes = await makeRequest(
    'POST',
    '/api/farmer/products',
    {
      name: 'Organic Desi Tomatoes',
      category: 'Vegetables',
      description: 'Farm-fresh native country tomatoes grown with jeevamrutha.',
      price: 60,
      unit: '1 kg',
      unitShort: 'kg',
      availableQuantity: 40,
      lowStockThreshold: 10,
      shelfLifeDays: 5,
      farmingMethod: 'Organic',
      isOrganic: true,
      status: 'Active',
    },
    tokenA
  );
  console.log(`   Response status: ${createRes.status}`);
  if (createRes.status !== 201 || !createRes.data.data?.id) {
    throw new Error('FAILED to create product: ' + JSON.stringify(createRes.data));
  }
  const productA1 = createRes.data.data;
  console.log(`   ✓ PASS: Product created successfully! ID: ${productA1.id}`);
  console.log(`     - Name: ${productA1.name}`);
  console.log(`     - Price: ₹${productA1.price}`);
  console.log(`     - Category: ${productA1.category}`);
  console.log(`     - Available: ${productA1.availableQuantity} ${productA1.unitShort}`);
  console.log(`     - Freshness Score: ${productA1.freshnessScore}%`);
  console.log(`     - Farmer Name: ${productA1.farmerName} (${productA1.farmName})`);

  // 6. Test: Validation fails on invalid input
  console.log('6. Testing: Validation error on negative price (expect 400)...');
  const invalidPriceRes = await makeRequest(
    'POST',
    '/api/farmer/products',
    {
      name: 'Bad Price Item',
      price: -10,
    },
    tokenA
  );
  if (invalidPriceRes.status === 400) {
    console.log('   ✓ PASS: Rejected invalid price (400 Bad Request).');
  } else {
    throw new Error('FAILED: Expected 400 but got ' + invalidPriceRes.status);
  }

  // 7. Test: GET /api/farmer/products returns Farmer A's products
  console.log('7. Testing: GET /api/farmer/products for Farmer A...');
  const listA = await makeRequest('GET', '/api/farmer/products', null, tokenA);
  if (listA.status !== 200 || !Array.isArray(listA.data.data)) {
    throw new Error('FAILED to fetch products: ' + JSON.stringify(listA.data));
  }
  console.log(`   ✓ PASS: Retrieved ${listA.data.count} product(s) for Farmer A.`);
  const foundInList = listA.data.data.find((p) => p.id === productA1.id);
  if (!foundInList) throw new Error('Created product not in product list!');
  console.log('   ✓ PASS: Created product present in response list.');

  // 8. Test: GET /api/farmer/products/:id
  console.log(`8. Testing: GET /api/farmer/products/${productA1.id}...`);
  const getSingle = await makeRequest('GET', `/api/farmer/products/${productA1.id}`, null, tokenA);
  if (getSingle.status !== 200 || getSingle.data.data?.id !== productA1.id) {
    throw new Error('FAILED to get single product: ' + JSON.stringify(getSingle.data));
  }
  console.log('   ✓ PASS: Successfully retrieved single product.');

  // 9. Test: PATCH /api/farmer/products/:id
  console.log(`9. Testing: PATCH /api/farmer/products/${productA1.id} (updating price and quantity)...`);
  const patchRes = await makeRequest(
    'PATCH',
    `/api/farmer/products/${productA1.id}`,
    {
      price: 68,
      availableQuantity: 75,
      description: 'Updated premium organic desi tomatoes.',
    },
    tokenA
  );
  if (patchRes.status !== 200) {
    throw new Error('FAILED to update product: ' + JSON.stringify(patchRes.data));
  }
  console.log(`   ✓ PASS: Product updated. New price: ₹${patchRes.data.data.price}, Qty: ${patchRes.data.data.availableQuantity}`);

  // 10. Register & Approve Farmer B to test cross-farmer data isolation
  const farmerBEmail = `farmer_b_${timestamp}@krishitest.com`;
  console.log(`10. Registering and Approving Farmer B (${farmerBEmail})...`);
  const regB = await makeRequest('POST', '/api/auth/farmer/register', {
    fullName: 'Suresh Patil',
    email: farmerBEmail,
    password: 'Password@123',
    phone: '9876543211',
    farmName: 'Patil Natural Greens',
    farmLocation: 'Survey 108, Devanahalli',
    pincode: '562110',
    farmingMethod: 'Natural (ZBNF)',
  });
  const tokenB = regB.data.data.token;
  const farmerBId = regB.data.data.farmer.id;
  await makeRequest('POST', `/api/admin/farmers/${farmerBId}/approve`, {}, adminToken);
  console.log(`   ✓ Farmer B registered and approved. ID: ${farmerBId}`);

  // 11. Isolation Test: Farmer B GET /api/farmer/products
  console.log('11. Testing: Farmer B GET /api/farmer/products must NOT show Farmer A’s products...');
  const listB = await makeRequest('GET', '/api/farmer/products', null, tokenB);
  if (listB.status !== 200 || listB.data.count !== 0) {
    throw new Error('FAILED isolation: Farmer B sees products! Count: ' + listB.data.count);
  }
  console.log('   ✓ PASS: Farmer B product list is empty (strict data isolation).');

  // 12. Isolation Test: Farmer B cannot GET Farmer A's product by ID (expect 404)
  console.log(`12. Testing: Farmer B GET /api/farmer/products/${productA1.id} (expect 404)...`);
  const crossGet = await makeRequest('GET', `/api/farmer/products/${productA1.id}`, null, tokenB);
  if (crossGet.status === 404) {
    console.log('   ✓ PASS: Farmer B cannot view Farmer A’s product (404 Not Found).');
  } else {
    throw new Error('FAILED isolation: Expected 404 but got ' + crossGet.status);
  }

  // 13. Isolation Test: Farmer B cannot PATCH Farmer A's product (expect 403)
  console.log(`13. Testing: Farmer B PATCH /api/farmer/products/${productA1.id} (expect 403)...`);
  const crossPatch = await makeRequest(
    'PATCH',
    `/api/farmer/products/${productA1.id}`,
    { price: 999 },
    tokenB
  );
  if (crossPatch.status === 403) {
    console.log('   ✓ PASS: Farmer B blocked from editing Farmer A’s product (403 Forbidden).');
  } else {
    throw new Error('FAILED isolation: Expected 403 but got ' + crossPatch.status);
  }

  // 14. Isolation Test: Farmer B cannot DELETE Farmer A's product (expect 403)
  console.log(`14. Testing: Farmer B DELETE /api/farmer/products/${productA1.id} (expect 403)...`);
  const crossDelete = await makeRequest('DELETE', `/api/farmer/products/${productA1.id}`, null, tokenB);
  if (crossDelete.status === 403) {
    console.log('   ✓ PASS: Farmer B blocked from deleting Farmer A’s product (403 Forbidden).');
  } else {
    throw new Error('FAILED isolation: Expected 403 but got ' + crossDelete.status);
  }

  // 15. Test: Farmer A DELETE /api/farmer/products/:id
  console.log(`15. Testing: Farmer A deletes their own product...`);
  const deleteRes = await makeRequest('DELETE', `/api/farmer/products/${productA1.id}`, null, tokenA);
  if (deleteRes.status !== 200 || !deleteRes.data.deleted) {
    throw new Error('FAILED to delete product: ' + JSON.stringify(deleteRes.data));
  }
  console.log('   ✓ PASS: Product successfully deleted from database.');

  // 16. Verify product no longer exists
  console.log(`16. Testing: Verify deleted product returns 404...`);
  const verifyDeleted = await makeRequest('GET', `/api/farmer/products/${productA1.id}`, null, tokenA);
  if (verifyDeleted.status === 404) {
    console.log('   ✓ PASS: Deleted product correctly returns 404 Not Found.');
  } else {
    throw new Error('FAILED: Expected 404 for deleted product but got ' + verifyDeleted.status);
  }

  console.log('\n======================================================');
  console.log('✓ ALL 16 BACKEND PRODUCT INTEGRATION TESTS PASSED!');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUNNER FAILED:', err);
  process.exit(1);
});
