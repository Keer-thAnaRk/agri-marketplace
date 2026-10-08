/**
 * Comprehensive Final Production Verification Test Suite for Farmer Module
 * 
 * Verifies:
 * - Scenario A: New Farmer Registration -> PENDING -> Verification-Pending only -> Business APIs 403 Forbidden
 * - Scenario B: Admin Rejects Farmer -> REJECTED -> Reason recorded -> Business APIs 403 Forbidden
 * - Scenario C: Admin Approves Farmer -> APPROVED -> Full portal access enabled
 * - Scenario D: Approved Farmer creates product -> PostgreSQL persistence verified (Product & Inventory)
 * - Scenario E: Approved Farmer creates harvest -> PostgreSQL persistence verified (HarvestBatch & TraceabilityEvent)
 * - Scenario F: Consumer scans QR -> Public /api/trace/:batchId works without auth, ZERO sensitive data leaks
 * - Scenario G: Multi-Tenant Data Isolation -> Farmer A cannot access, modify, or delete Farmer B's resources
 * - Scenario H: Authentication & Authorization Security -> 401 for unauthenticated, 403 for Consumer/Farmer privilege escalation
 * - Scenario I: Error Handling -> Proper 400/404 HTTP statuses and JSON errors, zero mock fallbacks
 */

const http = require('http');
const { prisma } = require('./dist/db/prisma');
const bcrypt = require('bcrypt');
const { generateToken } = require('./dist/utils/jwt');

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

async function runProductionVerification() {
  console.log('========================================================================');
  console.log('=== STARTING FINAL FARMER MODULE PRODUCTION VERIFICATION TEST SUITE ===');
  console.log('========================================================================\n');

  const ts = Date.now();
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

  try {
    // ---------------------------------------------------------
    // SETUP: Create Admin & Consumer Users for authorization checks
    // ---------------------------------------------------------
    console.log('[SETUP] Creating Admin & Consumer accounts in PostgreSQL...');
    const adminEmail = `admin.verify.${ts}@example.com`;
    const consumerEmail = `consumer.verify.${ts}@example.com`;
    const passwordHash = await bcrypt.hash('SecurePassword123!', 10);

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: 'Super Admin',
        role: 'ADMIN',
        isActive: true,
      },
    });
    const adminToken = generateToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });

    const consumerUser = await prisma.user.create({
      data: {
        email: consumerEmail,
        passwordHash,
        name: 'Regular Consumer',
        role: 'CONSUMER',
        isActive: true,
      },
    });
    const consumerToken = generateToken({
      userId: consumerUser.id,
      email: consumerUser.email,
      role: consumerUser.role,
    });
    console.log(`   ✓ Admin token and Consumer token generated successfully.`);

    // ---------------------------------------------------------
    // SCENARIO A: New Farmer Registers -> Status PENDING
    // ---------------------------------------------------------
    console.log('\n---------------------------------------------------------');
    console.log('[SCENARIO A] New Farmer Registration & Pending Approval Gate');
    console.log('---------------------------------------------------------');

    const farmerAEmail = `farmer.a.${ts}@example.com`;
    const regPayloadA = {
      fullName: 'Ramesh Patel',
      email: farmerAEmail,
      password: 'Password123!',
      phone: '9876543210',
      farmName: 'Patel Natural Agro',
      farmLocation: 'Mandya Rural, Karnataka',
      city: 'Mandya',
      state: 'Karnataka',
      pincode: '571401',
      farmingMethod: 'Natural / Zero Budget',
      yearsOfFarming: 8,
      acreage: 6,
      mainCrops: ['Ragi', 'Sugarcane', 'Organic Bananas'],
      farmDescription: 'Pesticide-free heritage farming using jeevamrutha and drip irrigation.',
    };

    const regResA = await makeRequest('POST', '/api/auth/farmer/register', regPayloadA);
    assert(regResA.status === 201, `Farmer A registration returned 201 (Status: ${regResA.status})`);
    assert(regResA.data.success === true, 'Farmer A registration success flag is true');
    assert(regResA.data.data.verificationStatus === 'PENDING', 'Farmer A initial status is PENDING');

    const farmerAToken = regResA.data.data.token;
    const farmerAId = regResA.data.data.farmer.id;
    const farmerAUserId = regResA.data.data.user.id;

    // Check verification status endpoint
    const statusResA = await makeRequest('GET', '/api/farmer/status', null, farmerAToken);
    assert(statusResA.status === 200, `GET /api/farmer/status returned 200`);
    assert(statusResA.data.data.isApproved === false, 'isApproved is false for pending farmer');
    assert(statusResA.data.data.isPending === true, 'isPending is true for pending farmer');
    assert(statusResA.data.data.verificationStatus === 'PENDING', 'verificationStatus is PENDING');

    // Pending farmer can view profile and notifications
    const profileResA = await makeRequest('GET', '/api/farmer/profile', null, farmerAToken);
    assert(profileResA.status === 200, 'Pending farmer can view own profile (200 OK)');
    assert(profileResA.data.data.farmName === 'Patel Natural Agro', 'Profile matches registered farmName');

    const notifResA = await makeRequest('GET', '/api/farmer/notifications', null, farmerAToken);
    assert(notifResA.status === 200, 'Pending farmer can view notifications (200 OK)');
    assert(Array.isArray(notifResA.data.data), 'Notifications is an array');

    // CRITICAL: Pending farmer is STRICTLY BLOCKED from all business endpoints (403)
    console.log('   Testing Pending Gate across all business endpoints:');
    const blockedEndpointsPending = [
      { method: 'GET', path: '/api/farmer/dashboard', name: 'Dashboard' },
      { method: 'GET', path: '/api/farmer/products', name: 'Products (List)' },
      { method: 'POST', path: '/api/farmer/products', body: { name: 'Test' }, name: 'Products (Create)' },
      { method: 'GET', path: '/api/farmer/inventory', name: 'Inventory (List)' },
      { method: 'GET', path: '/api/farmer/harvests', name: 'Harvests (List)' },
      { method: 'POST', path: '/api/farmer/harvests', body: { quantity: 10 }, name: 'Harvests (Create)' },
      { method: 'GET', path: '/api/farmer/surplus', name: 'Surplus (List)' },
      { method: 'POST', path: '/api/farmer/surplus', body: { price: 10 }, name: 'Surplus (Create)' },
      { method: 'GET', path: '/api/farmer/orders', name: 'Orders (List)' },
      { method: 'GET', path: '/api/farmer/deliveries/batches', name: 'Deliveries (List)' },
      { method: 'GET', path: '/api/farmer/sales', name: 'Sales (List)' },
      { method: 'GET', path: '/api/farmer/sales/summary', name: 'Sales (Summary)' },
    ];

    for (const ep of blockedEndpointsPending) {
      const res = await makeRequest(ep.method, ep.path, ep.body, farmerAToken);
      assert(
        res.status === 403,
        `PENDING Farmer blocked from ${ep.name} with 403 Forbidden (Actual: ${res.status})`
      );
    }

    // ---------------------------------------------------------
    // SCENARIO B: Admin Rejects Farmer -> Status REJECTED
    // ---------------------------------------------------------
    console.log('\n---------------------------------------------------------');
    console.log('[SCENARIO B] Admin Rejection & Rejected Approval Gate');
    console.log('---------------------------------------------------------');

    const rejectionReason = 'Land ownership documents RTC photocopy is blurred. Please upload a clear scanned copy.';
    const rejectRes = await makeRequest(
      'PATCH',
      `/api/admin/farmers/${farmerAId}/reject`,
      { reason: rejectionReason },
      adminToken
    );
    assert(rejectRes.status === 200, `Admin reject returned 200 OK (Status: ${rejectRes.status})`);
    assert(rejectRes.data.data.verificationStatus === 'REJECTED', 'Farmer status updated to REJECTED in PostgreSQL');

    // Verify status endpoint reflects rejection and reason
    const rejectedStatusCheck = await makeRequest('GET', '/api/farmer/status', null, farmerAToken);
    assert(rejectedStatusCheck.status === 200, 'GET /api/farmer/status returned 200');
    assert(rejectedStatusCheck.data.data.isRejected === true, 'isRejected flag is true');
    assert(rejectedStatusCheck.data.data.rejectionReason === rejectionReason, 'Rejection reason matches exactly');

    // CRITICAL: REJECTED farmer is STRICTLY BLOCKED from all business endpoints (403)
    console.log('   Testing Rejected Gate across all business endpoints:');
    for (const ep of blockedEndpointsPending) {
      const res = await makeRequest(ep.method, ep.path, ep.body, farmerAToken);
      assert(
        res.status === 403,
        `REJECTED Farmer blocked from ${ep.name} with 403 Forbidden (Actual: ${res.status})`
      );
    }

    // ---------------------------------------------------------
    // SCENARIO C: Admin Approves Farmer -> Status APPROVED
    // ---------------------------------------------------------
    console.log('\n---------------------------------------------------------');
    console.log('[SCENARIO C] Admin Approval & Full Portal Access');
    console.log('---------------------------------------------------------');

    const approveRes = await makeRequest(
      'PATCH',
      `/api/admin/farmers/${farmerAId}/approve`,
      {},
      adminToken
    );
    assert(approveRes.status === 200, `Admin approve returned 200 OK (Status: ${approveRes.status})`);
    assert(approveRes.data.data.verificationStatus === 'APPROVED', 'Farmer status updated to APPROVED in PostgreSQL');

    // Re-login Farmer A to get a refreshed token reflecting approved status
    const loginResA = await makeRequest('POST', '/api/auth/farmer/login', {
      email: farmerAEmail,
      password: 'Password123!',
    });
    assert(loginResA.status === 200, 'Farmer A re-login returned 200 OK');
    const approvedFarmerAToken = loginResA.data.data.token;

    // Check status API now shows approved
    const approvedStatusCheck = await makeRequest('GET', '/api/farmer/status', null, approvedFarmerAToken);
    assert(approvedStatusCheck.data.data.isApproved === true, 'isApproved flag is true');
    assert(approvedStatusCheck.data.data.isPending === false, 'isPending flag is false');
    assert(approvedStatusCheck.data.data.verificationStatus === 'APPROVED', 'Status is APPROVED');

    // Verify business endpoints are now accessible
    const dashResA = await makeRequest('GET', '/api/farmer/dashboard', null, approvedFarmerAToken);
    assert(dashResA.status === 200, 'APPROVED Farmer can access Dashboard (200 OK)');
    assert(dashResA.data.data.totalProducts === 0, 'New approved farmer has 0 products');
    assert(dashResA.data.data.monthlyRevenue === 0, 'New approved farmer has 0 revenue');

    const prodsResA = await makeRequest('GET', '/api/farmer/products', null, approvedFarmerAToken);
    assert(prodsResA.status === 200, 'APPROVED Farmer can access Products list (200 OK)');
    assert(Array.isArray(prodsResA.data.data) && prodsResA.data.data.length === 0, 'Initial product list is empty []');

    // ---------------------------------------------------------
    // SCENARIO D: Approved Farmer Creates Product -> PostgreSQL Persistence
    // ---------------------------------------------------------
    console.log('\n---------------------------------------------------------');
    console.log('[SCENARIO D] Product Creation & Database Persistence');
    console.log('---------------------------------------------------------');

    const productPayloadA = {
      name: 'Organic Shimla Apples',
      category: 'FRUITS',
      price: 180,
      unit: 'kg',
      stock: 45,
      description: 'Crisp, naturally ripened organic apples grown without synthetic pesticides.',
      harvestDate: new Date().toISOString(),
      shelfLifeDays: 14,
      farmingMethod: 'Natural / Zero Budget',
      images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6'],
    };

    const createProdRes = await makeRequest('POST', '/api/farmer/products', productPayloadA, approvedFarmerAToken);
    assert(createProdRes.status === 201, `Product creation returned 201 Created (Status: ${createProdRes.status})`);
    assert(createProdRes.data.success === true, 'Product creation success flag is true');
    const productA = createProdRes.data.data;
    assert(productA.name === 'Organic Shimla Apples', 'Created product has correct name');

    // Verify in PostgreSQL directly via Prisma
    const dbProduct = await prisma.product.findUnique({
      where: { id: productA.id },
      include: { inventory: true },
    });
    assert(dbProduct !== null, 'Product record found in PostgreSQL database via Prisma');
    assert(dbProduct.farmerId === farmerAId, 'Product farmerId correctly maps to Farmer A');
    assert(Number(dbProduct.price) === 180, 'Product price persisted correctly (180)');
    assert(dbProduct.inventory !== null, 'Inventory record auto-created and linked in PostgreSQL');
    assert(Number(dbProduct.inventory.currentStock) === 45, 'Inventory currentStock persisted correctly (45)');

    // Verify in Farmer's Inventory API
    const invResA = await makeRequest('GET', '/api/farmer/inventory', null, approvedFarmerAToken);
    assert(invResA.status === 200, 'GET /api/farmer/inventory returned 200 OK');
    assert(invResA.data.data.length === 1, 'Inventory API lists exactly 1 item');
    assert(invResA.data.data[0].productName === 'Organic Shimla Apples', 'Inventory item productName matches');

    // ---------------------------------------------------------
    // SCENARIO E: Approved Farmer Creates Harvest -> Batch & Traceability
    // ---------------------------------------------------------
    console.log('\n---------------------------------------------------------');
    console.log('[SCENARIO E] Harvest Recording & QR Traceability Generation');
    console.log('---------------------------------------------------------');

    const harvestPayloadA = {
      productId: productA.id,
      quantity: 120,
      unit: 'kg',
      expectedShelfLife: 14,
      notes: 'Morning picking batch harvested at 6:30 AM before sunrise.',
    };

    const createHarvestRes = await makeRequest('POST', '/api/farmer/harvests', harvestPayloadA, approvedFarmerAToken);
    assert(createHarvestRes.status === 201, `Harvest creation returned 201 Created (Status: ${createHarvestRes.status})`);
    assert(createHarvestRes.data.success === true, 'Harvest creation success flag is true');
    const harvestA = createHarvestRes.data.data;
    assert(Boolean(harvestA.batchNumber), `Batch number generated: ${harvestA.batchNumber}`);
    assert(Boolean(harvestA.qrCodeUrl), 'QR Code Data URL successfully generated');

    // Verify in PostgreSQL directly via Prisma
    const dbHarvest = await prisma.harvestBatch.findUnique({
      where: { id: harvestA.id },
      include: { traceabilityEvents: true },
    });
    assert(dbHarvest !== null, 'HarvestBatch record verified in PostgreSQL via Prisma');
    assert(dbHarvest.farmerId === farmerAId, 'HarvestBatch farmerId correctly maps to Farmer A');
    assert(dbHarvest.traceabilityEvents.length > 0, `Auto-created ${dbHarvest.traceabilityEvents.length} traceability event(s) in PostgreSQL`);

    // Add a manual traceability event
    const eventPayload = {
      step: 'PACK',
      title: 'Grading and Cold Storage Entry',
      location: 'Patel Packhouse, Mandya',
      details: 'Visual inspection completed, Grade A sorting done.',
    };
    const addEventRes = await makeRequest('POST', `/api/farmer/harvests/${harvestA.id}/events`, eventPayload, approvedFarmerAToken);
    assert(addEventRes.status === 201, 'POST /api/farmer/harvests/:id/events returned 201 Created');

    // ---------------------------------------------------------
    // SCENARIO F: Consumer Scans QR -> Public Traceability Security
    // ---------------------------------------------------------
    console.log('\n---------------------------------------------------------');
    console.log('[SCENARIO F] Public QR Traceability & Zero-Leak Security');
    console.log('---------------------------------------------------------');

    // Public scan WITHOUT any Authorization header
    const publicTraceRes = await makeRequest('GET', `/api/trace/${harvestA.batchNumber}`);
    assert(publicTraceRes.status === 200, `Public GET /api/trace/:batchId returned 200 without auth`);
    assert(publicTraceRes.data.success === true, 'Public trace success flag is true');
    const traceData = publicTraceRes.data.data;

    assert(traceData.batchNumber === harvestA.batchNumber, 'Public trace batchNumber matches');
    assert(traceData.productName === 'Organic Shimla Apples', 'Public trace productName matches');
    assert(traceData.farmName === 'Patel Natural Agro', 'Public trace farmName matches');
    assert(Array.isArray(traceData.traceabilityEvents) && traceData.traceabilityEvents.length >= 2, 'Traceability events present');

    // ZERO LEAK SECURITY AUDIT: Ensure sensitive data is NEVER returned
    assert(traceData.passwordHash === undefined, 'ZERO LEAK: passwordHash is undefined in public response');
    assert(traceData.verificationDocuments === undefined, 'ZERO LEAK: verificationDocuments is undefined');
    assert(traceData.govtId === undefined && traceData.landRecords === undefined, 'ZERO LEAK: Government ID / Land records absent');
    assert(traceData.tokens === undefined && traceData.token === undefined, 'ZERO LEAK: Authentication tokens absent');
    assert(traceData.phone === undefined, 'ZERO LEAK: Private farmer phone number absent');
    assert(JSON.stringify(traceData).includes('password') === false, 'ZERO LEAK: "password" string absent from response JSON');

    // ---------------------------------------------------------
    // SCENARIO G: Multi-Tenant Data Isolation (Farmer A vs Farmer B)
    // ---------------------------------------------------------
    console.log('\n---------------------------------------------------------');
    console.log('[SCENARIO G] Multi-Tenant Data Isolation & Cross-Farmer Protection');
    console.log('---------------------------------------------------------');

    // Register Farmer B
    const farmerBEmail = `farmer.b.${ts}@example.com`;
    const regPayloadB = {
      fullName: 'Lakshmi Devi',
      email: farmerBEmail,
      password: 'Password123!',
      phone: '9123456780',
      farmName: 'Devi Organic Greens',
      farmLocation: 'Kolar, Karnataka',
      city: 'Kolar',
      state: 'Karnataka',
      pincode: '563101',
      farmingMethod: 'Certified Organic (NPOP)',
      yearsOfFarming: 12,
      acreage: 4,
      mainCrops: ['Spinach', 'Palak', 'Coriander'],
      farmDescription: 'Heritage greens grown using open well irrigation.',
    };

    const regResB = await makeRequest('POST', '/api/auth/farmer/register', regPayloadB);
    const farmerBId = regResB.data.data.farmer.id;

    // Approve Farmer B
    await makeRequest('PATCH', `/api/admin/farmers/${farmerBId}/approve`, {}, adminToken);

    // Login Farmer B
    const loginResB = await makeRequest('POST', '/api/auth/farmer/login', {
      email: farmerBEmail,
      password: 'Password123!',
    });
    const farmerBToken = loginResB.data.data.token;

    // Farmer B creates a product
    const createProdBRes = await makeRequest('POST', '/api/farmer/products', {
      name: 'Baby Palak Fresh Greens',
      category: 'LEAFY_GREENS',
      price: 40,
      unit: 'bunch',
      stock: 60,
      description: 'Tender baby spinach bunches.',
      harvestDate: new Date().toISOString(),
      shelfLifeDays: 3,
      farmingMethod: 'Certified Organic',
      images: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb'],
    }, farmerBToken);
    const productB = createProdBRes.data.data;

    // Farmer B creates a harvest
    const createHarvestBRes = await makeRequest('POST', '/api/farmer/harvests', {
      productId: productB.id,
      quantity: 150,
      unit: 'bunch',
      expectedShelfLife: 3,
    }, farmerBToken);
    const harvestB = createHarvestBRes.data.data;

    // CROSS-TENANT ISOLATION TESTS:
    console.log('   Testing Cross-Tenant Multi-Tenant Isolation:');

    // 1. Farmer A list products -> MUST NOT contain Product B
    const aProducts = await makeRequest('GET', '/api/farmer/products', null, approvedFarmerAToken);
    const hasProductBInA = aProducts.data.data.some((p) => p.id === productB.id);
    assert(hasProductBInA === false, 'Farmer A cannot see Farmer B product in list');

    // 2. Farmer B list products -> MUST NOT contain Product A
    const bProducts = await makeRequest('GET', '/api/farmer/products', null, farmerBToken);
    const hasProductAInB = bProducts.data.data.some((p) => p.id === productA.id);
    assert(hasProductAInB === false, 'Farmer B cannot see Farmer A product in list');

    // 3. Farmer A attempts to mutate Farmer B product -> 403 or 404
    const mutateProdRes = await makeRequest('PUT', `/api/farmer/products/${productB.id}`, {
      price: 999,
    }, approvedFarmerAToken);
    assert(
      mutateProdRes.status === 403 || mutateProdRes.status === 404,
      `Farmer A cannot mutate Farmer B product (Status: ${mutateProdRes.status})`
    );

    // 4. Farmer A attempts to delete Farmer B product -> 403 or 404
    const deleteProdRes = await makeRequest('DELETE', `/api/farmer/products/${productB.id}`, null, approvedFarmerAToken);
    assert(
      deleteProdRes.status === 403 || deleteProdRes.status === 404,
      `Farmer A cannot delete Farmer B product (Status: ${deleteProdRes.status})`
    );

    // 5. Farmer A attempts to view Farmer B harvest -> 403 or 404
    const viewHarvestBRes = await makeRequest('GET', `/api/farmer/harvests/${harvestB.id}`, null, approvedFarmerAToken);
    assert(
      viewHarvestBRes.status === 403 || viewHarvestBRes.status === 404,
      `Farmer A cannot view Farmer B harvest details (Status: ${viewHarvestBRes.status})`
    );

    // 6. Farmer A attempts to view Farmer B profile with explicit ID param -> 403 Forbidden
    const viewProfileBRes = await makeRequest('GET', `/api/farmer/profile/${farmerBId}`, null, approvedFarmerAToken);
    assert(
      viewProfileBRes.status === 403,
      `Farmer A cannot view Farmer B profile by ID (Status: ${viewProfileBRes.status})`
    );

    // 7. Farmer A attempts to update Farmer B profile with explicit ID param -> 403 Forbidden
    const updateProfileBRes = await makeRequest('PATCH', `/api/farmer/profile/${farmerBId}`, {
      farmName: 'Hacked Farm',
    }, approvedFarmerAToken);
    assert(
      updateProfileBRes.status === 403,
      `Farmer A cannot update Farmer B profile by ID (Status: ${updateProfileBRes.status})`
    );

    // 8. Farmer A dashboard aggregates ONLY Farmer A metrics
    const dashARes = await makeRequest('GET', '/api/farmer/dashboard', null, approvedFarmerAToken);
    assert(dashARes.data.data.totalProducts === 1, 'Farmer A dashboard totalProducts is 1 (excludes B)');
    const dashBRes = await makeRequest('GET', '/api/farmer/dashboard', null, farmerBToken);
    assert(dashBRes.data.data.totalProducts === 1, 'Farmer B dashboard totalProducts is 1 (excludes A)');

    // ---------------------------------------------------------
    // SCENARIO H: Authentication & Privilege Escalation Security
    // ---------------------------------------------------------
    console.log('\n---------------------------------------------------------');
    console.log('[SCENARIO H] Authentication & Privilege Escalation Security');
    console.log('---------------------------------------------------------');

    // 1. Unauthenticated requests to protected endpoints return 401
    const unauthRes = await makeRequest('GET', '/api/farmer/products');
    assert(unauthRes.status === 401, `Unauthenticated request returned 401 (Actual: ${unauthRes.status})`);

    // 2. Consumer token calling Farmer API returns 403
    const consumerOnFarmerRes = await makeRequest('GET', '/api/farmer/products', null, consumerToken);
    assert(consumerOnFarmerRes.status === 403, `Consumer token calling Farmer API returned 403 (Actual: ${consumerOnFarmerRes.status})`);

    // 3. Farmer token calling Admin API returns 403
    const farmerOnAdminRes = await makeRequest('PATCH', `/api/admin/farmers/${farmerAId}/approve`, {}, approvedFarmerAToken);
    assert(farmerOnAdminRes.status === 403, `Farmer token calling Admin approval returned 403 (Actual: ${farmerOnAdminRes.status})`);

    // 4. Privilege escalation attempt: Farmer tries to modify their own role or verificationStatus
    const escalationRes = await makeRequest('PATCH', '/api/farmer/profile', {
      role: 'ADMIN',
      isVerified: true,
      verificationStatus: 'APPROVED',
      approvedBy: 'hacker',
    }, approvedFarmerAToken);
    assert(escalationRes.status === 200, 'Profile update returns 200 (sanitizes input)');
    
    // Check in PostgreSQL that role and governance fields were NOT touched
    const dbUserCheck = await prisma.user.findUnique({ where: { id: farmerAUserId } });
    assert(dbUserCheck.role === 'FARMER', 'Privilege Escalation Blocked: Role remains FARMER');

    // ---------------------------------------------------------
    // SCENARIO I: Database / API Error Handling
    // ---------------------------------------------------------
    console.log('\n---------------------------------------------------------');
    console.log('[SCENARIO I] Proper Error Handling & Zero-Fake-Data Guarantee');
    console.log('---------------------------------------------------------');

    // Invalid product creation (negative price)
    const invalidPriceRes = await makeRequest('POST', '/api/farmer/products', {
      name: 'Bad Product',
      category: 'FRUITS',
      price: -50,
      unit: 'kg',
    }, approvedFarmerAToken);
    assert(
      invalidPriceRes.status === 400,
      `Negative price returned 400 Bad Request (Status: ${invalidPriceRes.status})`
    );
    assert(invalidPriceRes.data.success === false, 'Error response contains success: false');

    // Non-existent harvest query
    const notFoundHarvest = await makeRequest('GET', '/api/farmer/harvests/non-existent-batch-id-999', null, approvedFarmerAToken);
    assert(
      notFoundHarvest.status === 404,
      `Non-existent harvest returned 404 Not Found (Status: ${notFoundHarvest.status})`
    );

    // Non-existent public trace query
    const notFoundTrace = await makeRequest('GET', '/api/trace/NON-EXISTENT-QR-1234');
    assert(
      notFoundTrace.status === 404,
      `Non-existent public trace returned 404 Not Found (Status: ${notFoundTrace.status})`
    );

    // ---------------------------------------------------------
    // SUMMARY
    // ---------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
    console.log('========================================================================');

    if (failed === 0) {
      console.log('\n>>> FARMER MODULE — FINAL VERIFICATION PASSED <<<\n');
    } else {
      console.error(`\n>>> FINAL VERIFICATION COMPLETED WITH ${failed} FAILURES <<<\n`);
    }

  } catch (err) {
    console.error('Fatal error during test execution:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  process.exit(failed > 0 ? 1 : 0);
}

runProductionVerification();
