const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

async function runAdminDashboardE2ETests() {
  console.log('=== STARTING ADMIN DASHBOARD & ANALYTICS E2E INTEGRATION TESTS ===\n');
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

  try {
    // ----------------------------------------------------
    // 1. SETUP: Admin, Farmer, Consumer, Products, Orders, Disputes, Batches
    // ----------------------------------------------------
    console.log('1. Authenticating Admin and creating test records in PostgreSQL...');

    // Admin login
    const adminLoginRes = await makeRequest('POST', '/api/auth/admin/login', {
      email: 'admin@krishimarket.in',
      password: 'admin123',
    });
    const adminToken = adminLoginRes.data.data?.token;
    assert(adminLoginRes.status === 200 && adminToken, 'Admin logged in via POST /api/auth/admin/login');

    // Register Farmer (Approved)
    const farmerRes = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Venkatesh Murthy',
      email: `adm_dash_f_${timestamp}@krishitest.com`,
      phone: `+91 98450 ${timestamp.toString().slice(-5)}`,
      password: 'password123',
      farmName: 'Venkatesh Agrotech Farm',
      farmLocation: 'Survey 12, Kengeri Hobli',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560060',
      hub: 'Kengeri',
    });
    const farmerId = farmerRes.data.data?.farmer?.id;
    assert(farmerRes.status === 201 && farmerId, 'Farmer registered in PostgreSQL');

    const approveRes = await makeRequest('POST', `/api/admin/farmers/${farmerId}/approve`, {}, adminToken);
    assert(approveRes.status === 200, 'Farmer approved by Admin via POST /api/admin/farmers/:id/approve');

    const farmerLogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: `adm_dash_f_${timestamp}@krishitest.com`,
      password: 'password123',
    });
    const farmerToken = farmerLogin.data.data?.token;
    assert(farmerLogin.status === 200 && farmerToken, 'Farmer logged in with JWT');

    // Register Pending Farmer (To verify pending count)
    const pendingFarmerRes = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Girish Kumar',
      email: `adm_dash_pend_${timestamp}@krishitest.com`,
      phone: `+91 98451 ${timestamp.toString().slice(-5)}`,
      password: 'password123',
      farmName: 'Girish Green Acres',
      farmLocation: 'Survey 89, Nelamangala',
      city: 'Bengaluru Rural',
      state: 'Karnataka',
      pincode: '562123',
      hub: 'Nelamangala',
    });
    assert(pendingFarmerRes.status === 201, 'Pending Farmer registered (verificationStatus: PENDING)');

    // Register Consumer
    const consumerRes = await makeRequest('POST', '/api/auth/consumer/register', {
      name: 'Sahana Rao',
      email: `adm_dash_c_${timestamp}@krishitest.com`,
      phone: '+91 97410 44332',
      password: 'password123',
    });
    const consumerToken = consumerRes.data.data?.token;
    const consumerUserId = consumerRes.data.data?.user?.id;
    assert(consumerRes.status === 201 && consumerToken && consumerUserId, 'Consumer registered in PostgreSQL');

    // Create Test Product
    const prodRes = await makeRequest(
      'POST',
      '/api/farmer/products',
      {
        name: 'Farm Fresh Palak Spinach',
        category: 'VEGETABLES',
        description: 'Tender baby spinach leaves harvested at dawn.',
        price: 40,
        unit: '250 g bunch',
        unitShort: 'bunch',
        availableQuantity: 200,
      },
      farmerToken
    );
    const product = prodRes.data.data;
    assert(prodRes.status === 201 && product?.id, 'Product created in PostgreSQL');

    // Place an Order
    const orderRes = await makeRequest(
      'POST',
      '/api/orders',
      {
        items: [{ productId: product.id, quantity: 3 }], // 3 * 40 = 120
        deliveryAddress: {
          name: 'Sahana Rao',
          phone: '+91 97410 44332',
          addressLine: 'Flat 304, Palm Grove, Kengeri',
          city: 'Bengaluru',
          state: 'Karnataka',
          hub: 'Kengeri',
          pincode: '560060',
        },
        deliverySlot: {
          name: 'Morning Slot',
          timeRange: '8:00 AM – 11:00 AM',
        },
        paymentMethod: 'UPI',
      },
      consumerToken
    );
    const order = orderRes.data?.data;
    assert(orderRes.status === 201 && order?.id, `Order created in PostgreSQL: ${order?.orderNumber}`);

    // Create Dispute for this order
    const dispute = await prisma.dispute.create({
      data: {
        orderId: order.id,
        userId: consumerUserId,
        productName: 'Farm Fresh Palak Spinach',
        reason: 'Leaves slightly wilted in monsoon heat',
        amount: 120,
        description: 'Spinach arrived wilted.',
        status: 'OPEN',
      },
    });
    assert(dispute && dispute.id, `Dispute created in PostgreSQL: ${dispute.id}`);

    // ----------------------------------------------------
    // 2. AUTHORIZATION & ACCESS CONTROL
    // ----------------------------------------------------
    console.log('\n2. Testing Access Control & Role Protection for Dashboard & Analytics APIs...');

    // 2.1 Unauthenticated requests
    const unauthDash = await makeRequest('GET', '/api/admin/dashboard');
    assert(unauthDash.status === 401, 'Unauthenticated GET /api/admin/dashboard returns 401 Unauthorized');

    const unauthAna = await makeRequest('GET', '/api/admin/analytics');
    assert(unauthAna.status === 401, 'Unauthenticated GET /api/admin/analytics returns 401 Unauthorized');

    // 2.2 Farmer role requests
    const farmerDash = await makeRequest('GET', '/api/admin/dashboard', null, farmerToken);
    assert(farmerDash.status === 403, 'Farmer role blocked from /api/admin/dashboard (403 Forbidden)');

    const farmerAna = await makeRequest('GET', '/api/admin/analytics', null, farmerToken);
    assert(farmerAna.status === 403, 'Farmer role blocked from /api/admin/analytics (403 Forbidden)');

    // 2.3 Consumer role requests
    const consumerDash = await makeRequest('GET', '/api/admin/dashboard', null, consumerToken);
    assert(consumerDash.status === 403, 'Consumer role blocked from /api/admin/dashboard (403 Forbidden)');

    const consumerAna = await makeRequest('GET', '/api/admin/analytics', null, consumerToken);
    assert(consumerAna.status === 403, 'Consumer role blocked from /api/admin/analytics (403 Forbidden)');

    // ----------------------------------------------------
    // 3. ADMIN DASHBOARD API (GET /api/admin/dashboard)
    // ----------------------------------------------------
    console.log('\n3. Testing GET /api/admin/dashboard with Live PostgreSQL Data...');

    const dashRes = await makeRequest('GET', '/api/admin/dashboard', null, adminToken);
    assert(dashRes.status === 200, 'Admin successfully fetched /api/admin/dashboard (200 OK)');
    assert(dashRes.data.success === true, 'Response indicates success: true');
    const data = dashRes.data.data;
    assert(data !== undefined, 'Response contains data object');

    // 3.1 Farmer Metrics
    console.log('\n3.1 Verifying Real Farmer Metrics...');
    assert(typeof data.farmerStats?.total === 'number' && data.farmerStats.total >= 2, `Total farmers count: ${data.farmerStats.total}`);
    assert(typeof data.farmerStats?.pending === 'number' && data.farmerStats.pending >= 1, `Pending farmers count: ${data.farmerStats.pending}`);
    assert(typeof data.farmerStats?.approved === 'number' && data.farmerStats.approved >= 1, `Approved farmers count: ${data.farmerStats.approved}`);
    assert(typeof data.farmerStats?.rejected === 'number', `Rejected farmers count: ${data.farmerStats.rejected}`);
    assert(typeof data.consumerStats?.total === 'number' && data.consumerStats.total >= 1, `Total consumers count: ${data.consumerStats.total}`);

    // Verify metrics object for stat cards
    assert(data.metrics?.totalFarmers === data.farmerStats.total, 'metrics.totalFarmers matches farmerStats.total');
    assert(data.metrics?.pendingVerification === data.farmerStats.pending, 'metrics.pendingVerification matches pending count');
    assert(data.metrics?.approvedFarmers === data.farmerStats.approved, 'metrics.approvedFarmers matches approved count');

    // 3.2 Product Metrics
    console.log('\n3.2 Verifying Real Product Metrics...');
    assert(typeof data.productStats?.total === 'number' && data.productStats.total >= 1, `Total products count: ${data.productStats.total}`);
    assert(typeof data.productStats?.active === 'number' && data.productStats.active >= 1, `Active products count: ${data.productStats.active}`);
    assert(typeof data.productStats?.draft === 'number', `Draft products count: ${data.productStats.draft}`);
    assert(typeof data.productStats?.outOfStock === 'number', `Out-of-stock products count: ${data.productStats.outOfStock}`);
    assert(typeof data.productStats?.expired === 'number', `Expired products count: ${data.productStats.expired}`);
    assert(data.metrics?.totalProducts === data.productStats.total, 'metrics.totalProducts matches productStats.total');

    // 3.3 Order Metrics
    console.log('\n3.3 Verifying Real Order Metrics...');
    assert(typeof data.orderStats?.total === 'number' && data.orderStats.total >= 1, `Total orders count: ${data.orderStats.total}`);
    assert(typeof data.orderStats?.placed === 'number' && data.orderStats.placed >= 1, `Placed orders count: ${data.orderStats.placed}`);
    assert(typeof data.orderStats?.active === 'number' && data.orderStats.active >= 1, `Active pipeline orders count: ${data.orderStats.active}`);
    assert(typeof data.orderStats?.delivered === 'number', `Delivered orders count: ${data.orderStats.delivered}`);
    assert(typeof data.orderStats?.cancelled === 'number', `Cancelled orders count: ${data.orderStats.cancelled}`);
    assert(data.metrics?.activeOrders === data.orderStats.active, 'metrics.activeOrders matches active count');

    // 3.4 Revenue Metrics
    console.log('\n3.4 Verifying Real Revenue Metrics...');
    assert(typeof data.revenueStats?.totalRevenue === 'number' && data.revenueStats.totalRevenue > 0, `Total GMV revenue: ₹${data.revenueStats.totalRevenue}`);
    assert(typeof data.revenueStats?.totalFarmerEarnings === 'number', `Farmer earnings: ₹${data.revenueStats.totalFarmerEarnings}`);
    assert(typeof data.revenueStats?.pendingPayouts === 'number', `Pending payouts: ₹${data.revenueStats.pendingPayouts}`);
    assert(typeof data.revenueStats?.paidPayouts === 'number', `Paid payouts: ₹${data.revenueStats.paidPayouts}`);
    assert(typeof data.revenueStats?.refundedAmount === 'number', `Refunded amount: ₹${data.revenueStats.refundedAmount}`);
    assert(data.metrics?.totalRevenue === data.revenueStats.totalRevenue, 'metrics.totalRevenue matches total GMV');
    assert(data.metrics?.pendingPayouts === data.revenueStats.pendingPayouts, 'metrics.pendingPayouts matches pending payouts');

    // 3.5 Dispute Metrics
    console.log('\n3.5 Verifying Real Dispute Metrics...');
    assert(typeof data.disputeStats?.total === 'number' && data.disputeStats.total >= 1, `Total disputes count: ${data.disputeStats.total}`);
    assert(typeof data.disputeStats?.open === 'number' && data.disputeStats.open >= 1, `Open disputes count: ${data.disputeStats.open}`);
    assert(typeof data.disputeStats?.underReview === 'number', `Under review disputes count: ${data.disputeStats.underReview}`);
    assert(typeof data.disputeStats?.resolved === 'number', `Resolved disputes count: ${data.disputeStats.resolved}`);
    assert(typeof data.disputeStats?.rejected === 'number', `Rejected disputes count: ${data.disputeStats.rejected}`);

    // 3.6 Delivery Batch Metrics
    console.log('\n3.6 Verifying Real Delivery Batch Metrics...');
    assert(typeof data.deliveryStats?.total === 'number', `Total delivery batches count: ${data.deliveryStats.total}`);
    assert(typeof data.deliveryStats?.pending === 'number', `Pending batches count: ${data.deliveryStats.pending}`);
    assert(typeof data.deliveryStats?.delivered === 'number', `Delivered batches count: ${data.deliveryStats.delivered}`);

    // ----------------------------------------------------
    // 4. CHARTS & TIME SERIES DATA
    // ----------------------------------------------------
    console.log('\n4. Verifying Real Database Charts Data...');

    // 4.1 Revenue Over Time Chart
    assert(Array.isArray(data.charts?.revenueOverTime) && data.charts.revenueOverTime.length >= 1, 'revenueOverTime chart contains data points');
    const revPoint = data.charts.revenueOverTime[data.charts.revenueOverTime.length - 1];
    assert(typeof revPoint.month === 'string', `Month label is present: "${revPoint.month}"`);
    assert(typeof revPoint.revenue === 'number', `Revenue is a database number: ₹${revPoint.revenue}`);
    assert(typeof revPoint.orders === 'number', `Orders count is a database number: ${revPoint.orders}`);

    // 4.2 Orders Over Time Chart
    assert(Array.isArray(data.charts?.ordersOverTime) && data.charts.ordersOverTime.length >= 1, 'ordersOverTime chart contains data points');

    // 4.3 Farmer Registrations Chart
    assert(Array.isArray(data.charts?.farmerRegistrations) && data.charts.farmerRegistrations.length >= 1, 'farmerRegistrations chart contains data points');
    const farmerPoint = data.charts.farmerRegistrations[data.charts.farmerRegistrations.length - 1];
    assert(typeof farmerPoint.registered === 'number', `Registered count: ${farmerPoint.registered}`);
    assert(typeof farmerPoint.approved === 'number', `Approved count: ${farmerPoint.approved}`);

    // 4.4 Category Distribution
    assert(Array.isArray(data.charts?.categoryDistribution) && data.charts.categoryDistribution.length >= 1, 'categoryDistribution pie chart contains slices');
    const vegCategory = data.charts.categoryDistribution.find((c) => c.name.toLowerCase().includes('vegetable'));
    assert(vegCategory !== undefined, `Found Vegetable category: count = ${vegCategory?.count}, value = ${vegCategory?.value}%`);

    // ----------------------------------------------------
    // 5. RECENT OPERATIONAL SECTIONS
    // ----------------------------------------------------
    console.log('\n5. Verifying Real Recent Data Sections...');

    // 5.1 Recent Farmers
    assert(Array.isArray(data.recentFarmers) && data.recentFarmers.length >= 1, 'recentFarmers is an array of records');
    const foundFarmer = data.recentFarmers.find((f) => f.id === farmerId);
    assert(foundFarmer !== undefined, `Created farmer found in recentFarmers list: "${foundFarmer?.name}"`);
    assert(foundFarmer?.farmName === 'Venkatesh Agrotech Farm', `Farm name matches: "${foundFarmer?.farmName}"`);
    assert(foundFarmer?.verificationStatus === 'approved', `Verification status matches: "${foundFarmer?.verificationStatus}"`);

    // 5.2 Pending Farmers Queue
    assert(Array.isArray(data.pendingFarmers) && data.pendingFarmers.length >= 1, 'pendingFarmers queue is populated');
    const foundPending = data.pendingFarmers.find((pf) => pf.farmName === 'Girish Green Acres');
    assert(foundPending !== undefined, `Pending farmer found in pending queue: "${foundPending?.name}"`);

    // 5.3 Recent Orders
    assert(Array.isArray(data.recentOrders) && data.recentOrders.length >= 1, 'recentOrders is an array of records');
    const foundOrder = data.recentOrders.find((o) => o.id === order.id);
    assert(foundOrder !== undefined, `Created order found in recentOrders: "${foundOrder?.orderNumber}"`);
    assert(foundOrder?.customerName === 'Sahana Rao', `Customer name matches: "${foundOrder?.customerName}"`);
    assert(foundOrder?.total === Number(order.total), `Total matches: ₹${foundOrder?.total}`);

    // 5.4 Recent Disputes
    assert(Array.isArray(data.recentDisputes) && data.recentDisputes.length >= 1, 'recentDisputes is an array of records');
    const foundDispute = data.recentDisputes.find((d) => d.id === dispute.id);
    assert(foundDispute !== undefined, `Created dispute found in recentDisputes: "${foundDispute?.disputeNumber}"`);
    assert(foundDispute?.reason.includes('monsoon heat'), `Reason matches: "${foundDispute?.reason}"`);

    // 5.5 Recent Activities
    assert(Array.isArray(data.recentActivities), 'recentActivities is an array of live audit records');

    // ----------------------------------------------------
    // 6. ADMIN ANALYTICS API (GET /api/admin/analytics)
    // ----------------------------------------------------
    console.log('\n6. Testing GET /api/admin/analytics with Time Range Switching...');

    // 6.1 Default 6M
    const ana6MRes = await makeRequest('GET', '/api/admin/analytics?timeRange=6M', null, adminToken);
    assert(ana6MRes.status === 200, 'GET /api/admin/analytics?timeRange=6M returned 200');
    assert(ana6MRes.data.data?.timeRange === '6M', 'Returned timeRange is 6M');
    assert(ana6MRes.data.data?.revenueOverTime?.length === 6, 'Contains 6 monthly buckets for 6M');
    assert(ana6MRes.data.data?.consumerGrowth?.length === 6, 'Contains 6 consumer growth buckets');
    assert(ana6MRes.data.data?.deliveryPerformance?.length === 7, 'Contains 7 daily delivery performance buckets');

    // 6.2 Switching to 1M
    const ana1MRes = await makeRequest('GET', '/api/admin/analytics?timeRange=1M', null, adminToken);
    assert(ana1MRes.status === 200, 'GET /api/admin/analytics?timeRange=1M returned 200');
    assert(ana1MRes.data.data?.timeRange === '1M', 'Returned timeRange is 1M');
    assert(ana1MRes.data.data?.revenueOverTime?.length === 30, 'Contains 30 daily buckets for 1M');

    // 6.3 Switching to 1Y
    const ana1YRes = await makeRequest('GET', '/api/admin/analytics?timeRange=1Y', null, adminToken);
    assert(ana1YRes.status === 200, 'GET /api/admin/analytics?timeRange=1Y returned 200');
    assert(ana1YRes.data.data?.timeRange === '1Y', 'Returned timeRange is 1Y');
    assert(ana1YRes.data.data?.revenueOverTime?.length === 12, 'Contains 12 monthly buckets for 1Y');

    // ----------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------
    console.log('\n======================================================');
    console.log(`TOTAL TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected error during E2E test execution:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAdminDashboardE2ETests();
