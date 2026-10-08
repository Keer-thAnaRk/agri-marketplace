const http = require('http');
const { prisma } = require('./dist/db/prisma');

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

async function runDashboardTests() {
  console.log('======================================================');
  console.log('=== STARTING FARMER DASHBOARD INTEGRATION TEST SUITE ===');
  console.log('======================================================\n');

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

  const createdUserIds = [];

  try {
    // ------------------------------------------------------------------------
    // SETUP ACTORS
    // ------------------------------------------------------------------------
    console.log('0. Setting up test actors in PostgreSQL...');

    // Health check
    let healthy = false;
    for (let i = 0; i < 5; i++) {
      try {
        const h = await makeRequest('GET', '/api/health');
        if (h.status === 200) {
          healthy = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    assert(healthy, 'Backend server is healthy and responding (200)');

    // Admin login
    const adminLogin = await makeRequest('POST', '/api/auth/admin/login', {
      email: 'admin@krishimarket.in',
      password: 'admin123',
    });
    let adminToken = adminLogin.data?.data?.token;
    if (adminLogin.status === 200 && adminToken) {
      assert(true, 'Admin login succeeds (200)');
    } else {
      const { generateToken } = require('./dist/utils/jwt');
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      adminToken = generateToken({
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      });
      assert(Boolean(adminToken), 'Admin token generated via fallback');
    }

    // Register Farmer A (will be APPROVED)
    const farmerAEmail = `farmerA.dash.${timestamp}@krishitest.com`;
    const farmerAPassword = 'FarmerPassword123!';
    const farmerAReg = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Ramesh Patel',
      email: farmerAEmail,
      password: farmerAPassword,
      phone: `981${String(timestamp).slice(-7)}`,
      farmName: 'Patel Organic Acres',
      farmLocation: 'Survey 101, Mandya Rural',
      city: 'Mandya',
      state: 'Karnataka',
      pincode: '571401',
      mainCrops: ['Carrots', 'Spinach'],
    });
    assert(farmerAReg.status === 201, 'Farmer A registration succeeds (201)');
    const farmerAToken = farmerAReg.data.data.token;
    const farmerAFarmerId = farmerAReg.data.data.farmer.id;
    const farmerAUserId = farmerAReg.data.data.user.id;
    createdUserIds.push(farmerAUserId);

    // Approve Farmer A
    const approveFA = await makeRequest(
      'POST',
      `/api/admin/farmers/${farmerAFarmerId}/approve`,
      {},
      adminToken
    );
    assert(approveFA.status === 200, 'Farmer A approved by admin (200)');

    // Refresh Farmer A token with APPROVED status
    const farmerALogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: farmerAEmail,
      password: farmerAPassword,
    });
    const approvedFarmerAToken = farmerALogin.data.data.token;

    // Register Farmer B (will be APPROVED for isolation tests)
    const farmerBEmail = `farmerB.dash.${timestamp}@krishitest.com`;
    const farmerBPassword = 'FarmerPassword123!';
    const farmerBReg = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Suresh Gowda',
      email: farmerBEmail,
      password: farmerBPassword,
      phone: `982${String(timestamp).slice(-7)}`,
      farmName: 'Gowda Heritage Farm',
      farmLocation: 'Survey 202, Mysuru Outskirts',
      city: 'Mysuru',
      state: 'Karnataka',
      pincode: '570001',
      mainCrops: ['Cabbage', 'Beans'],
    });
    assert(farmerBReg.status === 201, 'Farmer B registration succeeds (201)');
    const farmerBFarmerId = farmerBReg.data.data.farmer.id;
    const farmerBUserId = farmerBReg.data.data.user.id;
    createdUserIds.push(farmerBUserId);

    // Approve Farmer B
    const approveFB = await makeRequest(
      'POST',
      `/api/admin/farmers/${farmerBFarmerId}/approve`,
      {},
      adminToken
    );
    assert(approveFB.status === 200, 'Farmer B approved by admin (200)');

    const farmerBLogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: farmerBEmail,
      password: farmerBPassword,
    });
    const approvedFarmerBToken = farmerBLogin.data.data.token;

    // Register Pending Farmer (will remain PENDING)
    const pendingFarmerEmail = `pending.dash.${timestamp}@krishitest.com`;
    const pendingReg = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Pending Verification Farmer',
      email: pendingFarmerEmail,
      password: 'PendingPassword123!',
      phone: `983${String(timestamp).slice(-7)}`,
      farmName: 'Pending Greenfield Farms',
      farmLocation: 'Survey 303, Hassan',
      city: 'Hassan',
      state: 'Karnataka',
      pincode: '573201',
      mainCrops: ['Coffee'],
    });
    assert(pendingReg.status === 201, 'Pending Farmer registration succeeds (201)');
    const pendingFarmerToken = pendingReg.data.data.token;
    createdUserIds.push(pendingReg.data.data.user.id);

    // Register Rejected Farmer (will be REJECTED by admin)
    const rejectedFarmerEmail = `rejected.dash.${timestamp}@krishitest.com`;
    const rejectedReg = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Rejected Farmer Account',
      email: rejectedFarmerEmail,
      password: 'RejectedPassword123!',
      phone: `984${String(timestamp).slice(-7)}`,
      farmName: 'Rejected Acres',
      farmLocation: 'Survey 404, Tumkur',
      city: 'Tumkur',
      state: 'Karnataka',
      pincode: '572101',
      mainCrops: ['Groundnut'],
    });
    assert(rejectedReg.status === 201, 'Rejected Farmer registration succeeds (201)');
    const rejectedFarmerId = rejectedReg.data.data.farmer.id;
    createdUserIds.push(rejectedReg.data.data.user.id);

    const rejectAction = await makeRequest(
      'POST',
      `/api/admin/farmers/${rejectedFarmerId}/reject`,
      { reason: 'Invalid ownership documents submitted' },
      adminToken
    );
    assert(rejectAction.status === 200, 'Farmer rejected by admin (200)');

    const rejectedLogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: rejectedFarmerEmail,
      password: 'RejectedPassword123!',
    });
    const rejectedFarmerToken = rejectedLogin.data.data.token;

    // Register Consumer
    const consumerEmail = `consumer.dash.${timestamp}@krishitest.com`;
    const consumerReg = await makeRequest('POST', '/api/auth/consumer/register', {
      name: 'Aditi Consumer',
      email: consumerEmail,
      password: 'ConsumerPassword123!',
      phone: `985${String(timestamp).slice(-7)}`,
    });
    assert(consumerReg.status === 201, 'Consumer registration succeeds (201)');
    const consumerToken = consumerReg.data.data.token;
    createdUserIds.push(consumerReg.data.data.user.id);

    // ------------------------------------------------------------------------
    // SECTION 1: AUTHENTICATION & ROLE / APPROVAL GATE ENFORCEMENT
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 1: AUTHENTICATION & APPROVAL GATE ---');

    // 1. Unauthenticated request rejected
    const unauthReq = await makeRequest('GET', '/api/farmer/dashboard');
    assert(
      unauthReq.status === 401,
      `Unauthenticated request to GET /api/farmer/dashboard rejected with 401 (got ${unauthReq.status})`
    );

    // 2. Consumer role rejected
    const consumerReq = await makeRequest('GET', '/api/farmer/dashboard', null, consumerToken);
    assert(
      consumerReq.status === 403,
      `Consumer role rejected with 403 (got ${consumerReq.status})`
    );

    // 3. Pending farmer rejected with 403
    const pendingReq = await makeRequest('GET', '/api/farmer/dashboard', null, pendingFarmerToken);
    assert(
      pendingReq.status === 403,
      `Pending farmer rejected with 403 (got ${pendingReq.status})`
    );
    assert(
      pendingReq.data.verificationStatus === 'PENDING' || pendingReq.data.error.includes('PENDING'),
      'Pending response explicitly identifies pending status'
    );

    // 4. Rejected farmer rejected with 403
    const rejectedReq = await makeRequest('GET', '/api/farmer/dashboard', null, rejectedFarmerToken);
    assert(
      rejectedReq.status === 403,
      `Rejected farmer rejected with 403 (got ${rejectedReq.status})`
    );
    assert(
      rejectedReq.data.verificationStatus === 'REJECTED' || rejectedReq.data.error.includes('REJECTED'),
      'Rejected response explicitly identifies rejected status'
    );

    // ------------------------------------------------------------------------
    // SECTION 2: CLEAN ZERO-STATE FOR NEWLY APPROVED FARMER
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 2: CLEAN ZERO-STATE FOR NEWLY APPROVED FARMER ---');

    const zeroDash = await makeRequest('GET', '/api/farmer/dashboard', null, approvedFarmerAToken);
    assert(
      zeroDash.status === 200,
      `Approved Farmer A accesses dashboard with 200 (got ${zeroDash.status})`
    );
    const zeroData = zeroDash.data.data;
    assert(zeroData.totalProducts === 0, 'Zero-state totalProducts is exactly 0');
    assert(zeroData.activeProducts === 0, 'Zero-state activeProducts is exactly 0');
    assert(zeroData.pendingOrders === 0, 'Zero-state pendingOrders is exactly 0');
    assert(zeroData.monthlyRevenue === 0, 'Zero-state monthlyRevenue is exactly 0');
    assert(zeroData.monthlyTrend === '+0% from last month', 'Zero-state monthlyTrend is +0%');
    assert(Array.isArray(zeroData.recentOrders) && zeroData.recentOrders.length === 0, 'recentOrders is empty array');
    assert(Array.isArray(zeroData.inventory) && zeroData.inventory.length === 0, 'inventory is empty array');
    assert(Array.isArray(zeroData.deliveryBatches) && zeroData.deliveryBatches.length === 0, 'deliveryBatches is empty array');
    assert(
      Array.isArray(zeroData.salesSummary?.monthlyRevenue) && zeroData.salesSummary.monthlyRevenue.length === 0,
      'salesSummary.monthlyRevenue is empty array'
    );

    // ------------------------------------------------------------------------
    // SECTION 3: REAL OPERATIONAL METRICS AGGREGATION
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 3: REAL OPERATIONAL METRICS AGGREGATION ---');

    // 1. Create 2 products for Farmer A (1 ACTIVE in-stock, 1 DRAFT out-of-stock)
    const prodA1 = await makeRequest(
      'POST',
      '/api/farmer/products',
      {
        name: 'Organic Mandya Carrots',
        category: 'VEGETABLES',
        price: 60,
        unit: '1 kg',
        unitShort: 'kg',
        availableQuantity: 50,
        lowStockThreshold: 10,
        farmingMethod: 'ORGANIC',
        status: 'ACTIVE',
        inStock: true,
      },
      approvedFarmerAToken
    );
    assert(prodA1.status === 201, 'Farmer A Product 1 created as ACTIVE (201)');
    const prodA1Id = prodA1.data.data.id;

    const prodA2 = await makeRequest(
      'POST',
      '/api/farmer/products',
      {
        name: 'Hydroponic English Spinach',
        category: 'LEAFY_GREENS',
        price: 45,
        unit: '500 g',
        unitShort: 'g',
        availableQuantity: 0,
        lowStockThreshold: 5,
        farmingMethod: 'HYDROPONIC',
        status: 'DRAFT',
        inStock: false,
      },
      approvedFarmerAToken
    );
    assert(prodA2.status === 201, 'Farmer A Product 2 created as DRAFT (201)');
    const prodA2Id = prodA2.data.data.id;

    // Verify product counts on dashboard
    const dashAfterProducts = await makeRequest('GET', '/api/farmer/dashboard', null, approvedFarmerAToken);
    const prodMetrics = dashAfterProducts.data.data;
    assert(prodMetrics.totalProducts === 2, `totalProducts is 2 (got ${prodMetrics.totalProducts})`);
    assert(prodMetrics.activeProducts === 1, `activeProducts is 1 (got ${prodMetrics.activeProducts})`);
    assert(prodMetrics.inventory.length === 2, `inventory length is 2 (got ${prodMetrics.inventory.length})`);

    // 2. Create consumer order containing Farmer A product (OrderStatus = PLACED)
    const orderRes = await makeRequest(
      'POST',
      '/api/orders',
      {
        items: [{ productId: prodA1Id, quantity: 5 }],
        deliveryAddress: {
          name: 'Aditi Consumer',
          phone: '9851234567',
          addressLine: 'Flat 401, Green Acres, Indiranagar',
          city: 'Bangalore',
          pincode: '560038',
          hub: 'Indiranagar Hub',
        },
        deliverySlot: {
          name: 'Morning Delivery',
          timeRange: '8:00 AM – 11:00 AM',
        },
        paymentMethod: 'ONLINE',
      },
      consumerToken
    );
    assert(orderRes.status === 201, 'Consumer order placed successfully (201)');
    const orderData = orderRes.data.data;
    const orderId = orderData.id;

    // Verify pending orders count
    const dashAfterOrder = await makeRequest('GET', '/api/farmer/dashboard', null, approvedFarmerAToken);
    const orderMetrics = dashAfterOrder.data.data;
    assert(orderMetrics.pendingOrders === 1, `pendingOrders is 1 (got ${orderMetrics.pendingOrders})`);
    assert(orderMetrics.recentOrders.length === 1, `recentOrders has 1 order (got ${orderMetrics.recentOrders.length})`);
    assert(orderMetrics.recentOrders[0].orderNumber === orderData.orderNumber, 'recentOrders matches placed orderNumber');

    // 3. Simulate order completion and Sale record generation
    // Direct delivery update to DELIVERED inside transaction
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'DELIVERED' },
    });

    const { saleService } = require('./dist/services/sale.service');
    const createdSales = await saleService.createSalesForDeliveredOrder(orderId);
    assert(
      (createdSales.createdCount || createdSales.sales?.length || 0) > 0,
      `Sale records created for delivered order (${createdSales.createdCount || createdSales.sales?.length} sale)`
    );

    // Fetch dashboard with live revenue
    const dashAfterSale = await makeRequest('GET', '/api/farmer/dashboard', null, approvedFarmerAToken);
    const saleMetrics = dashAfterSale.data.data;
    assert(
      saleMetrics.monthlyRevenue > 0,
      `monthlyRevenue is > 0 from real Sale records (got ₹${saleMetrics.monthlyRevenue})`
    );
    assert(
      saleMetrics.pendingOrders === 0,
      `pendingOrders decremented to 0 after DELIVERED status (got ${saleMetrics.pendingOrders})`
    );
    assert(
      Array.isArray(saleMetrics.salesSummary?.monthlyRevenue) && saleMetrics.salesSummary.monthlyRevenue.length > 0,
      'salesSummary.monthlyRevenue chart data contains active month entry'
    );
    const chartMonth = saleMetrics.salesSummary.monthlyRevenue[0];
    assert(
      chartMonth.revenue === saleMetrics.monthlyRevenue,
      `Chart revenue (₹${chartMonth.revenue}) perfectly matches monthlyRevenue (₹${saleMetrics.monthlyRevenue})`
    );

    // ------------------------------------------------------------------------
    // SECTION 4: STRICT TENANT ISOLATION / MULTI-TENANCY
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 4: STRICT TENANT ISOLATION ---');

    // Create Product for Farmer B
    const prodB1 = await makeRequest(
      'POST',
      '/api/farmer/products',
      {
        name: 'Gowda Fresh Cabbage',
        category: 'VEGETABLES',
        price: 30,
        unit: '1 kg',
        unitShort: 'kg',
        availableQuantity: 100,
        lowStockThreshold: 15,
        farmingMethod: 'NATURAL',
        status: 'ACTIVE',
        inStock: true,
      },
      approvedFarmerBToken
    );
    assert(prodB1.status === 201, 'Farmer B Product created (201)');

    // Farmer B checks dashboard
    const dashB = await makeRequest('GET', '/api/farmer/dashboard', null, approvedFarmerBToken);
    const metricsB = dashB.data.data;
    assert(metricsB.totalProducts === 1, `Farmer B sees exactly 1 totalProduct (got ${metricsB.totalProducts})`);
    assert(metricsB.activeProducts === 1, `Farmer B sees exactly 1 activeProduct (got ${metricsB.activeProducts})`);
    assert(metricsB.monthlyRevenue === 0, `Farmer B sees ₹0 revenue (does NOT leak Farmer A sales)`);
    assert(metricsB.pendingOrders === 0, `Farmer B sees 0 pendingOrders (does NOT leak Farmer A orders)`);

    // Verify Farmer A dashboard has NOT changed or leaked Farmer B data
    const recheckA = await makeRequest('GET', '/api/farmer/dashboard', null, approvedFarmerAToken);
    const recheckDataA = recheckA.data.data;
    assert(recheckDataA.totalProducts === 2, `Farmer A still has 2 products (does NOT include Farmer B product)`);
    const farmerAProductNames = recheckDataA.inventory.map((i) => i.productName);
    assert(
      !farmerAProductNames.includes('Gowda Fresh Cabbage'),
      'Farmer B product "Gowda Fresh Cabbage" is NOT present in Farmer A inventory'
    );

    // ------------------------------------------------------------------------
    // SECTION 5: PROFILE & METADATA INTEGRITY
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 5: PROFILE & METADATA INTEGRITY ---');

    assert(recheckDataA.profile != null, 'Dashboard returns structured profile object');
    assert(recheckDataA.profile.farmName === 'Patel Organic Acres', 'Profile farmName matches PostgreSQL record');
    assert(recheckDataA.profile.city === 'Mandya', 'Profile city matches PostgreSQL record');
    assert(recheckDataA.profile.isApproved === true, 'Profile indicates isApproved = true');
    assert(recheckDataA.profile.isVerified === true, 'Profile indicates isVerified = true');

  } catch (err) {
    console.error('Unhandled test exception:', err);
    failed++;
  } finally {
    // ------------------------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------------------------
    console.log('\n--- CLEANUP ---');
    try {
      if (createdUserIds.length > 0) {
        const createdOrders = await prisma.order.findMany({
          where: { consumerId: { in: createdUserIds } },
          select: { id: true },
        });
        const orderIds = createdOrders.map((o) => o.id);
        if (orderIds.length > 0) {
          await prisma.sale.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.orderTimeline.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
        }
        const createdFarmers = await prisma.farmer.findMany({
          where: { userId: { in: createdUserIds } },
          select: { id: true },
        });
        const farmerIds = createdFarmers.map((f) => f.id);
        if (farmerIds.length > 0) {
          await prisma.inventory.deleteMany({ where: { product: { farmerId: { in: farmerIds } } } });
          await prisma.product.deleteMany({ where: { farmerId: { in: farmerIds } } });
          await prisma.farmer.deleteMany({ where: { id: { in: farmerIds } } });
        }
        await prisma.user.deleteMany({
          where: { id: { in: createdUserIds } },
        });
        console.log(`   ✓ Cleaned up ${createdUserIds.length} test user accounts and associated records.`);
      }
    } catch (e) {
      console.warn('   Cleanup notice:', e.message);
    }
  }

  console.log('\n======================================================');
  console.log(`TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDashboardTests();
