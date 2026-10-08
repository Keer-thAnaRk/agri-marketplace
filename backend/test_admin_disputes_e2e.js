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

async function runAdminDisputesE2ETests() {
  console.log('=== STARTING ADMIN DISPUTES MANAGEMENT E2E INTEGRATION TESTS ===\n');
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
    // 1. SETUP: Admin, Farmer, Consumer, Product, Orders
    // ----------------------------------------------------
    console.log('1. Setting up Test Users, Products, Orders, and Disputes in PostgreSQL...');

    // Admin login
    const adminLoginRes = await makeRequest('POST', '/api/auth/admin/login', {
      email: 'admin@krishimarket.in',
      password: 'admin123',
    });
    const adminToken = adminLoginRes.data.data?.token;
    assert(adminLoginRes.status === 200 && adminToken, 'Admin logged in via POST /api/auth/admin/login');

    // Register & Approve Farmer
    const farmerRes = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Ramesh Patel',
      email: `adm_disp_farmer_${timestamp}@krishitest.com`,
      phone: '+91 98450 11999',
      password: 'password123',
      farmName: 'Sunrise Hydroponics',
      farmLocation: 'Survey 18, Devanahalli',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '562110',
      hub: 'Devanahalli',
    });
    const farmerId = farmerRes.data.data?.farmer?.id;
    await makeRequest('POST', `/api/admin/farmers/${farmerId}/approve`, {}, adminToken);
    const farmerLogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: `adm_disp_farmer_${timestamp}@krishitest.com`,
      password: 'password123',
    });
    const farmerToken = farmerLogin.data.data?.token;
    assert(farmerLogin.status === 200 && farmerToken, 'Farmer registered, approved, and logged in');

    // Register Consumer
    const consumerRes = await makeRequest('POST', '/api/auth/consumer/register', {
      name: 'Pooja Hegde',
      email: `adm_disp_cons_${timestamp}@krishitest.com`,
      phone: '+91 97410 55432',
      password: 'password123',
    });
    const consumerToken = consumerRes.data.data?.token;
    const consumerUserId = consumerRes.data.data?.user?.id;
    assert(consumerRes.status === 201 && consumerToken && consumerUserId, 'Consumer registered in PostgreSQL');

    // Create Product
    const prodRes = await makeRequest(
      'POST',
      '/api/farmer/products',
      {
        name: 'Crisp Hydroponic Lettuce',
        category: 'VEGETABLES',
        description: 'Pesticide-free butterhead lettuce heads.',
        price: 95,
        unit: '250g pack',
        unitShort: 'pack',
        availableQuantity: 150,
      },
      farmerToken
    );
    const product = prodRes.data.data;
    assert(prodRes.status === 201 && product?.id, 'Product created for Farmer');

    // Place Order 1
    const order1Res = await makeRequest(
      'POST',
      '/api/orders',
      {
        items: [{ productId: product.id, quantity: 2 }], // 2 * 95 = 190
        deliveryAddress: {
          name: 'Pooja Hegde',
          phone: '+91 97410 55432',
          addressLine: 'Apt 101, Palm Meadows, Whitefield',
          city: 'Bengaluru',
          state: 'Karnataka',
          hub: 'Whitefield',
          pincode: '560066',
        },
        deliverySlot: {
          name: 'Morning Slot',
          timeRange: '8:00 AM – 11:00 AM',
        },
        paymentMethod: 'UPI',
      },
      consumerToken
    );
    const order1 = order1Res.data?.data;
    assert(order1Res.status === 201 && order1?.id, `Order 1 created: ${order1?.orderNumber}`);

    // Place Order 2
    const order2Res = await makeRequest(
      'POST',
      '/api/orders',
      {
        items: [{ productId: product.id, quantity: 1 }], // 1 * 95 = 95
        deliveryAddress: {
          name: 'Pooja Hegde',
          phone: '+91 97410 55432',
          addressLine: 'Apt 101, Palm Meadows, Whitefield',
          city: 'Bengaluru',
          state: 'Karnataka',
          hub: 'Whitefield',
          pincode: '560066',
        },
        deliverySlot: {
          name: 'Morning Slot',
          timeRange: '8:00 AM – 11:00 AM',
        },
        paymentMethod: 'COD',
      },
      consumerToken
    );
    const order2 = order2Res.data?.data;
    assert(order2Res.status === 201 && order2?.id, `Order 2 created: ${order2?.orderNumber}`);

    // Create 3 Disputes in PostgreSQL via Prisma
    const dispute1 = await prisma.dispute.create({
      data: {
        orderId: order1.id,
        userId: consumerUserId,
        productName: 'Crisp Hydroponic Lettuce',
        reason: 'Transit wilting and broken leaves',
        amount: 190,
        description: 'Lettuce pack arrived warm with crushed leaves from transit.',
        status: 'OPEN',
      },
    });
    assert(dispute1 && dispute1.id, `Dispute 1 created in DB (Status: OPEN): ${dispute1.id}`);

    const dispute2 = await prisma.dispute.create({
      data: {
        orderId: order2.id,
        userId: consumerUserId,
        productName: 'Crisp Hydroponic Lettuce',
        reason: 'Incorrect weight delivered',
        amount: 95,
        description: 'Delivered pack weighed 180g instead of specified 250g.',
        status: 'UNDER_REVIEW',
      },
    });
    assert(dispute2 && dispute2.id, `Dispute 2 created in DB (Status: UNDER_REVIEW): ${dispute2.id}`);

    const dispute3 = await prisma.dispute.create({
      data: {
        orderId: order1.id,
        userId: consumerUserId,
        productName: 'Crisp Hydroponic Lettuce',
        reason: 'Late delivery damaged product',
        amount: 190,
        description: 'Delivery arrived 4 hours late beyond freshness window.',
        status: 'OPEN',
      },
    });
    assert(dispute3 && dispute3.id, `Dispute 3 created in DB (Status: OPEN): ${dispute3.id}`);

    // ----------------------------------------------------
    // 2. ROLE AUTHORIZATION & PERMISSION TESTS
    // ----------------------------------------------------
    console.log('\n2. Testing Role-Based Authorization on Admin Dispute Endpoints...');

    // 2.1 Unauthenticated requests
    const unauthListRes = await makeRequest('GET', '/api/admin/disputes');
    assert(unauthListRes.status === 401, 'Unauthenticated GET /api/admin/disputes rejected with 401');

    const unauthGetRes = await makeRequest('GET', `/api/admin/disputes/${dispute1.id}`);
    assert(unauthGetRes.status === 401, 'Unauthenticated GET /api/admin/disputes/:id rejected with 401');

    const unauthPatchRes = await makeRequest('PATCH', `/api/admin/disputes/${dispute1.id}/status`, {
      status: 'UNDER_REVIEW',
    });
    assert(unauthPatchRes.status === 401, 'Unauthenticated PATCH /api/admin/disputes/:id/status rejected with 401');

    // 2.2 Farmer role attempts
    const farmerListRes = await makeRequest('GET', '/api/admin/disputes', null, farmerToken);
    assert(farmerListRes.status === 403, 'Farmer GET /api/admin/disputes rejected with 403 Forbidden');

    const farmerPatchRes = await makeRequest(
      'PATCH',
      `/api/admin/disputes/${dispute1.id}/status`,
      { status: 'RESOLVED', resolution: 'Unauthorized' },
      farmerToken
    );
    assert(farmerPatchRes.status === 403, 'Farmer PATCH /api/admin/disputes/:id/status rejected with 403 Forbidden');

    // 2.3 Consumer role attempts
    const consumerListRes = await makeRequest('GET', '/api/admin/disputes', null, consumerToken);
    assert(consumerListRes.status === 403, 'Consumer GET /api/admin/disputes rejected with 403 Forbidden');

    const consumerPatchRes = await makeRequest(
      'PATCH',
      `/api/admin/disputes/${dispute1.id}/status`,
      { status: 'RESOLVED', resolution: 'Unauthorized' },
      consumerToken
    );
    assert(consumerPatchRes.status === 403, 'Consumer PATCH /api/admin/disputes/:id/status rejected with 403 Forbidden');

    // ----------------------------------------------------
    // 3. ADMIN DISPUTE LISTING & AGGREGATION METRICS
    // ----------------------------------------------------
    console.log('\n3. Testing Admin Dispute Listing & Platform Metrics...');

    const listRes = await makeRequest('GET', '/api/admin/disputes', null, adminToken);
    assert(listRes.status === 200, 'Admin successfully fetched /api/admin/disputes');
    assert(listRes.data.success === true, 'Response indicates success: true');
    assert(Array.isArray(listRes.data.data), 'Returns an array of dispute records');

    const foundDispute1 = listRes.data.data.find((d) => d.id === dispute1.id);
    assert(foundDispute1 !== undefined, 'Created dispute 1 is present in admin list');
    assert(foundDispute1?.orderNumber === order1.orderNumber, `Includes real order number: ${foundDispute1?.orderNumber}`);
    assert(foundDispute1?.customerName === 'Pooja Hegde', `Includes customer name: ${foundDispute1?.customerName}`);
    assert(foundDispute1?.customerEmail === `adm_disp_cons_${timestamp}@krishitest.com`, `Includes customer email`);
    assert(foundDispute1?.farmerName === 'Ramesh Patel', `Attributed to correct farmer: ${foundDispute1?.farmerName}`);
    assert(foundDispute1?.farmName === 'Sunrise Hydroponics', `Attributed to correct farm: ${foundDispute1?.farmName}`);
    assert(foundDispute1?.amount === 190, `Disputed amount matches: ₹${foundDispute1?.amount}`);
    assert(foundDispute1?.status === 'Open', `Status normalized for display: ${foundDispute1?.status}`);
    assert(foundDispute1?.rawStatus === 'OPEN', `Raw Prisma enum included: ${foundDispute1?.rawStatus}`);
    assert(Array.isArray(foundDispute1?.timeline) && foundDispute1.timeline.length >= 1, 'Includes mediation timeline');

    // Metrics validation
    const metrics = listRes.data.metrics;
    assert(metrics && typeof metrics.totalDisputes === 'number', 'Metrics object included with totalDisputes');
    assert(metrics.openCount >= 2, `openCount metric is accurate: ${metrics.openCount}`);
    assert(metrics.reviewCount >= 1, `reviewCount metric is accurate: ${metrics.reviewCount}`);
    assert(metrics.totalDisputedAmount >= 475, `totalDisputedAmount metric is accurate: ₹${metrics.totalDisputedAmount}`);

    // ----------------------------------------------------
    // 4. SEARCH & FILTERING
    // ----------------------------------------------------
    console.log('\n4. Testing Search and Filtering Capabilities...');

    // 4.1 Filter by status OPEN
    const openFilterRes = await makeRequest('GET', '/api/admin/disputes?status=OPEN', null, adminToken);
    assert(openFilterRes.status === 200, 'Filtered by status=OPEN returned 200');
    assert(
      openFilterRes.data.data.every((d) => d.rawStatus === 'OPEN' || d.status === 'Open'),
      'All records in OPEN filter have status OPEN'
    );
    assert(openFilterRes.data.data.some((d) => d.id === dispute1.id), 'Dispute 1 found in OPEN filter');
    assert(!openFilterRes.data.data.some((d) => d.id === dispute2.id), 'Dispute 2 NOT found in OPEN filter');

    // 4.2 Filter by status UNDER_REVIEW
    const reviewFilterRes = await makeRequest('GET', '/api/admin/disputes?status=UNDER_REVIEW', null, adminToken);
    assert(reviewFilterRes.status === 200, 'Filtered by status=UNDER_REVIEW returned 200');
    assert(reviewFilterRes.data.data.some((d) => d.id === dispute2.id), 'Dispute 2 found in UNDER_REVIEW filter');
    assert(!reviewFilterRes.data.data.some((d) => d.id === dispute1.id), 'Dispute 1 NOT found in UNDER_REVIEW filter');

    // 4.3 Search by Order Number
    const searchOrderRes = await makeRequest('GET', `/api/admin/disputes?search=${encodeURIComponent(order1.orderNumber)}`, null, adminToken);
    assert(searchOrderRes.status === 200, 'Search by orderNumber returned 200');
    assert(searchOrderRes.data.data.some((d) => d.id === dispute1.id), 'Dispute 1 found in orderNumber search');

    // 4.4 Search by Customer Name
    const searchCustRes = await makeRequest('GET', '/api/admin/disputes?search=Pooja%20Hegde', null, adminToken);
    assert(searchCustRes.status === 200, 'Search by customer name returned 200');
    assert(searchCustRes.data.data.some((d) => d.id === dispute1.id), 'Dispute 1 found in customer name search');

    // 4.5 Search by Product / Crop Name
    const searchCropRes = await makeRequest('GET', '/api/admin/disputes?search=Hydroponic%20Lettuce', null, adminToken);
    assert(searchCropRes.status === 200, 'Search by product name returned 200');
    assert(searchCropRes.data.data.some((d) => d.id === dispute1.id), 'Dispute 1 found in crop name search');

    // 4.6 Search by Dispute Number
    const dispNum = foundDispute1.disputeNumber;
    const searchDispNumRes = await makeRequest('GET', `/api/admin/disputes?search=${encodeURIComponent(dispNum)}`, null, adminToken);
    assert(searchDispNumRes.status === 200, 'Search by disputeNumber returned 200');
    assert(searchDispNumRes.data.data.some((d) => d.disputeNumber === dispNum), 'Dispute found by disputeNumber search');

    // ----------------------------------------------------
    // 5. SINGLE DISPUTE RETRIEVAL
    // ----------------------------------------------------
    console.log('\n5. Testing Single Dispute Retrieval...');

    // 5.1 By CUID ID
    const getByIdRes = await makeRequest('GET', `/api/admin/disputes/${dispute1.id}`, null, adminToken);
    assert(getByIdRes.status === 200, 'GET /api/admin/disputes/:id returned 200');
    assert(getByIdRes.data.data?.id === dispute1.id, 'Fetched dispute matches ID');
    assert(getByIdRes.data.data?.order?.id === order1.id, 'Includes full order relation');
    assert(getByIdRes.data.data?.order?.consumer?.name === 'Pooja Hegde', 'Includes consumer in order relation');

    // 5.2 By disputeNumber
    const getByNumRes = await makeRequest('GET', `/api/admin/disputes/${dispNum}`, null, adminToken);
    assert(getByNumRes.status === 200, 'GET /api/admin/disputes/:disputeNumber returned 200');
    assert(getByNumRes.data.data?.id === dispute1.id, 'Fetched dispute by disputeNumber matches ID');

    // 5.3 Non-existent ID returns 404
    const getNotFoundRes = await makeRequest('GET', '/api/admin/disputes/non-existent-disp-id-999', null, adminToken);
    assert(getNotFoundRes.status === 404, 'Non-existent dispute ID returns 404 Not Found');

    // ----------------------------------------------------
    // 6. STATE TRANSITIONS & BUSINESS LOGIC ENFORCEMENT
    // ----------------------------------------------------
    console.log('\n6. Testing Dispute State Machine & Business Rules...');

    // 6.1 Transition OPEN -> UNDER_REVIEW
    const startReviewRes = await makeRequest(
      'PATCH',
      `/api/admin/disputes/${dispute1.id}/status`,
      { status: 'UNDER_REVIEW' },
      adminToken
    );
    assert(startReviewRes.status === 200, 'Transition OPEN -> UNDER_REVIEW succeeded with 200');
    assert(startReviewRes.data.data?.rawStatus === 'UNDER_REVIEW', 'Status updated to UNDER_REVIEW');
    assert(startReviewRes.data.data?.status === 'Under Review', 'Display status is Under Review');

    // 6.2 Validation: Transition UNDER_REVIEW -> RESOLVED WITHOUT resolution notes fails
    const emptyResolveRes = await makeRequest(
      'PATCH',
      `/api/admin/disputes/${dispute1.id}/status`,
      { status: 'RESOLVED', resolution: '' },
      adminToken
    );
    assert(emptyResolveRes.status === 400, 'Transition to RESOLVED without resolution note rejected with 400 Bad Request');

    // 6.3 Transition UNDER_REVIEW -> RESOLVED WITH resolution notes
    const resolveRes = await makeRequest(
      'PATCH',
      `/api/admin/disputes/${dispute1.id}/status`,
      {
        status: 'RESOLVED',
        resolution: 'Full refund of ₹190 credited to consumer wallet. Packaging upgraded to rigid clamshell.',
      },
      adminToken
    );
    assert(resolveRes.status === 200, 'Transition UNDER_REVIEW -> RESOLVED with notes succeeded with 200');
    assert(resolveRes.data.data?.rawStatus === 'RESOLVED', 'Status updated to RESOLVED');
    assert(resolveRes.data.data?.status === 'Resolved', 'Display status is Resolved');
    assert(
      resolveRes.data.data?.resolutionNote?.includes('Full refund of ₹190'),
      'Resolution note recorded and persisted in DB'
    );

    // 6.4 Terminal State Protection: Attempting to modify a RESOLVED dispute fails
    const modifyResolvedRes = await makeRequest(
      'PATCH',
      `/api/admin/disputes/${dispute1.id}/status`,
      { status: 'UNDER_REVIEW' },
      adminToken
    );
    assert(modifyResolvedRes.status === 400, 'Attempting to change status of RESOLVED dispute rejected with 400');

    const rejectResolvedRes = await makeRequest(
      'PATCH',
      `/api/admin/disputes/${dispute1.id}/status`,
      { status: 'REJECTED', resolution: 'Rejecting already resolved' },
      adminToken
    );
    assert(rejectResolvedRes.status === 400, 'Attempting to REJECT an already RESOLVED dispute rejected with 400');

    // 6.5 Transition Dispute 3: OPEN -> UNDER_REVIEW -> REJECTED
    console.log('\n6.5 Testing Rejection Flow for Dispute 3...');
    // Move to review first
    await makeRequest('PATCH', `/api/admin/disputes/${dispute3.id}/status`, { status: 'UNDER_REVIEW' }, adminToken);

    // Rejection without reason fails
    const emptyRejectRes = await makeRequest(
      'PATCH',
      `/api/admin/disputes/${dispute3.id}/status`,
      { status: 'REJECTED', resolution: '' },
      adminToken
    );
    assert(emptyRejectRes.status === 400, 'Transition to REJECTED without explanation rejected with 400 Bad Request');

    // Rejection with reason succeeds
    const rejectRes = await makeRequest(
      'PATCH',
      `/api/admin/disputes/${dispute3.id}/status`,
      {
        status: 'REJECTED',
        resolution: 'Delivery GPS log confirms delivery was completed within requested 3-hour window.',
      },
      adminToken
    );
    assert(rejectRes.status === 200, 'Transition UNDER_REVIEW -> REJECTED succeeded with 200');
    assert(rejectRes.data.data?.rawStatus === 'REJECTED', 'Status updated to REJECTED');
    assert(rejectRes.data.data?.status === 'Rejected', 'Display status is Rejected');

    // Terminal State Protection: Attempting to reopen a REJECTED dispute fails
    const reopenRejectedRes = await makeRequest(
      'PATCH',
      `/api/admin/disputes/${dispute3.id}/status`,
      { status: 'OPEN' },
      adminToken
    );
    assert(reopenRejectedRes.status === 400, 'Attempting to reopen a REJECTED dispute rejected with 400');

    // ----------------------------------------------------
    // 7. CONSUMER DATABASE NOTIFICATIONS
    // ----------------------------------------------------
    console.log('\n7. Verifying PostgreSQL Database Notifications for Consumer...');

    const notifications = await prisma.notification.findMany({
      where: {
        userId: consumerUserId,
        type: 'DISPUTE',
      },
      orderBy: { createdAt: 'desc' },
    });
    assert(notifications.length >= 2, `Created ${notifications.length} DISPUTE notifications in PostgreSQL`);
    const resolvedNotification = notifications.find((n) => n.title.includes('Resolved'));
    assert(resolvedNotification !== undefined, `Found resolution notification: "${resolvedNotification?.title}"`);
    assert(resolvedNotification?.link?.includes(order1.orderNumber), `Notification links to order ${order1.orderNumber}`);

    const rejectedNotification = notifications.find((n) => n.title.includes('Rejected'));
    assert(rejectedNotification !== undefined, `Found rejection notification: "${rejectedNotification?.title}"`);

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

runAdminDisputesE2ETests();
