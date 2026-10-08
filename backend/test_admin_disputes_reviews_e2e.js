const { prisma } = require('./dist/db/prisma');

async function runAdminDisputesReviewsE2ETests() {
  console.log('=== STARTING ADMIN DISPUTES & REVIEWS E2E INTEGRATION TESTS ===\n');

  const baseUrl = 'http://localhost:5000';
  const timestamp = Date.now();

  let adminToken = '';
  let farmerToken = '';
  let consumerToken = '';

  let farmerId = '';
  let farmerUserId = '';
  let consumerUserId = '';
  let productId = '';
  let orderId = '';
  let orderNumber = '';

  let testDispute1Id = '';
  let testDispute2Id = '';
  let testReviewId = '';

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
    // 1. SETUP: Admin, Farmer, Consumer, Product, Order
    // ----------------------------------------------------
    console.log('1. Authenticating Admin and creating test entities in PostgreSQL...');

    // Admin login
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@krishimarket.in',
        password: 'admin123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data?.token;
    assert(adminLoginRes.status === 200 && adminToken, 'Admin logged in successfully');

    // Register Farmer
    const farmerEmail = `adm.disp.farmer.${timestamp}@krishitest.com`;
    const farmerRegRes = await fetch(`${baseUrl}/api/auth/farmer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Manjunath Gowda',
        email: farmerEmail,
        phone: '+91 98450 77123',
        password: 'password123',
        farmName: 'Manjunath Natural Organics',
        farmLocation: 'Hoskote Green Valley',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '562114',
        hub: 'East Hub',
      }),
    });
    const farmerRegData = await farmerRegRes.json();
    farmerToken = farmerRegData.data?.token;
    farmerUserId = farmerRegData.data?.user?.id;
    const farmerRecord = await prisma.farmer.findFirst({ where: { userId: farmerUserId } });
    farmerId = farmerRecord.id;
    assert(farmerToken && farmerId, 'Test farmer created and token issued');

    // Register Consumer
    const consumerEmail = `adm.disp.consumer.${timestamp}@krishitest.com`;
    const consumerRegRes = await fetch(`${baseUrl}/api/auth/consumer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Asha Kulkarni',
        email: consumerEmail,
        phone: '+91 98860 11999',
        password: 'password123',
      }),
    });
    const consumerRegData = await consumerRegRes.json();
    consumerToken = consumerRegData.data?.token;
    consumerUserId = consumerRegData.data?.user?.id;
    assert(consumerToken && consumerUserId, 'Test consumer registered successfully');

    // Create a Product
    const testProduct = await prisma.product.create({
      data: {
        farmerId,
        name: `Organic Robusta Banana ${timestamp}`,
        category: 'FRUITS',
        description: 'Fresh naturally ripened bananas from Hoskote.',
        price: 60.0,
        unit: 'DOZEN',
        unitShort: 'dz',
        status: 'ACTIVE',
        availableQuantity: 50.0,
        farmingMethod: 'ORGANIC',
        isOrganic: true,
        harvestDate: new Date(),
        images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e'],
      },
    });
    productId = testProduct.id;
    assert(productId, 'Test product seeded into PostgreSQL');

    // Create a Customer Address & Order
    const address = await prisma.consumerAddress.create({
      data: {
        userId: consumerUserId,
        name: 'Asha Kulkarni',
        phone: '+91 98860 11999',
        addressLine: 'Flat 402, Green Glen Apartments',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560103',
        hub: 'East Hub',
      },
    });

    orderNumber = `KM-DISP-${timestamp.toString().slice(-6)}`;
    const testOrder = await prisma.order.create({
      data: {
        orderNumber,
        consumerId: consumerUserId,
        addressId: address.id,
        deliverySlotName: 'Morning Slot',
        deliverySlotRange: '8:00 AM – 11:00 AM',
        status: 'DELIVERED',
        subtotal: 120.0,
        deliveryFee: 30.0,
        platformFee: 15.0,
        farmerEarnings: 105.0,
        total: 165.0,
        paymentMethod: 'UPI',
        paymentStatus: 'PAID',
        deliveredAt: new Date(),
        items: {
          create: [
            {
              productId,
              farmerId,
              productName: testProduct.name,
              productImage: testProduct.images[0],
              farmerName: 'Manjunath Gowda',
              farmName: 'Manjunath Natural Organics',
              unitPrice: 60.0,
              quantity: 2.0,
              unit: 'DOZEN',
              totalPrice: 120.0,
            },
          ],
        },
      },
    });
    orderId = testOrder.id;
    assert(orderId, `Test delivered order created: ${orderNumber}`);

    // Create 2 Test Disputes
    const disp1 = await prisma.dispute.create({
      data: {
        orderId,
        userId: consumerUserId,
        productName: testProduct.name,
        reason: 'Transit bruising on ripe bananas',
        amount: 120.0,
        status: 'OPEN',
        description: 'Half of the bananas were overripe and skin was severely crushed during transit.',
      },
    });
    testDispute1Id = disp1.id;

    const disp2 = await prisma.dispute.create({
      data: {
        orderId,
        userId: consumerUserId,
        productName: testProduct.name,
        reason: 'Incorrect weight delivered',
        amount: 60.0,
        status: 'OPEN',
        description: 'One bundle was short by 3 bananas.',
      },
    });
    testDispute2Id = disp2.id;
    assert(testDispute1Id && testDispute2Id, 'Created 2 test disputes in OPEN status in PostgreSQL');

    // Create 1 Test Review
    const rev1 = await prisma.review.create({
      data: {
        userId: consumerUserId,
        farmerId,
        productId,
        rating: 5,
        comment: `Incredible freshness and authentic natural taste! Highly recommended from ${farmerEmail}.`,
        verifiedPurchase: true,
      },
    });
    testReviewId = rev1.id;
    assert(testReviewId, 'Created test verified review in PostgreSQL');

    // ----------------------------------------------------
    // TEST 1: Admin Dispute List
    // ----------------------------------------------------
    console.log('\n2. Testing Admin Dispute List (GET /api/admin/disputes)...');
    const dispListRes = await fetch(`${baseUrl}/api/admin/disputes`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dispListData = await dispListRes.json();
    assert(dispListRes.status === 200, 'GET /api/admin/disputes returns HTTP 200');
    assert(dispListData.success === true, 'Response payload contains success: true');
    assert(Array.isArray(dispListData.data), 'Returns data as array of disputes');
    assert(dispListData.data.length >= 2, `Contains at least ${dispListData.data.length} disputes`);
    assert(dispListData.metrics && typeof dispListData.metrics.totalDisputes === 'number', 'Contains dispute metrics');

    const foundDisp1 = dispListData.data.find((d) => d.id === testDispute1Id);
    assert(foundDisp1 !== undefined, 'Newly created dispute is present in list');
    assert(foundDisp1.orderNumber === orderNumber, 'Dispute includes order number');
    assert(foundDisp1.customerName === 'Asha Kulkarni', 'Dispute includes customer name');
    assert(foundDisp1.productName === testProduct.name, 'Dispute includes product name');
    assert(Number(foundDisp1.amount) === 120, 'Dispute includes correct claim amount');

    // ----------------------------------------------------
    // TEST 2: Admin Dispute Details
    // ----------------------------------------------------
    console.log('\n3. Testing Admin Dispute Details (GET /api/admin/disputes/:disputeId)...');
    const dispDetailRes = await fetch(`${baseUrl}/api/admin/disputes/${testDispute1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dispDetailData = await dispDetailRes.json();
    assert(dispDetailRes.status === 200, 'GET /api/admin/disputes/:id returns HTTP 200');
    assert(dispDetailData.success === true, 'Dispute details success: true');
    assert(dispDetailData.data.id === testDispute1Id, 'Dispute ID matches');
    assert(dispDetailData.data.description.includes('Half of the bananas'), 'Full consumer statement description returned');
    assert(dispDetailData.data.order && dispDetailData.data.order.orderNumber === orderNumber, 'Related order details included');
    assert(Array.isArray(dispDetailData.data.timeline) && dispDetailData.data.timeline.length >= 1, 'Timeline array included');

    // IDOR / Not found
    const invalidDispRes = await fetch(`${baseUrl}/api/admin/disputes/cuidnonexistent9999`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(invalidDispRes.status === 404, 'Non-existent dispute ID returns HTTP 404');

    // ----------------------------------------------------
    // TEST 3: Unauthorized Dispute Access
    // ----------------------------------------------------
    console.log('\n4. Testing Unauthorized Dispute Access...');
    // Unauthenticated
    const unauthDispRes = await fetch(`${baseUrl}/api/admin/disputes`);
    assert(unauthDispRes.status === 401, 'Unauthenticated request to list disputes returns HTTP 401');

    // Farmer role
    const farmerDispRes = await fetch(`${baseUrl}/api/admin/disputes`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert(farmerDispRes.status === 403, 'FARMER role accessing Admin disputes returns HTTP 403 Forbidden');

    // Consumer role
    const consumerDispRes = await fetch(`${baseUrl}/api/admin/disputes`, {
      headers: { Authorization: `Bearer ${consumerToken}` },
    });
    assert(consumerDispRes.status === 403, 'CONSUMER role accessing Admin disputes returns HTTP 403 Forbidden');

    // ----------------------------------------------------
    // TEST 4: Dispute Search
    // ----------------------------------------------------
    console.log('\n5. Testing Dispute Search...');
    // Search by orderNumber
    const searchOrderRes = await fetch(`${baseUrl}/api/admin/disputes?search=${orderNumber}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchOrderData = await searchOrderRes.json();
    assert(searchOrderRes.status === 200, 'Search by orderNumber returns HTTP 200');
    assert(searchOrderData.data.some((d) => d.orderNumber === orderNumber), 'Search by orderNumber finds dispute');

    // Search by product name
    const searchProdRes = await fetch(`${baseUrl}/api/admin/disputes?search=Robusta+Banana`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchProdData = await searchProdRes.json();
    assert(searchProdData.data.some((d) => d.id === testDispute1Id), 'Search by crop/product finds dispute');

    // Search by customer name
    const searchCustRes = await fetch(`${baseUrl}/api/admin/disputes?search=Asha+Kulkarni`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchCustData = await searchCustRes.json();
    assert(searchCustData.data.some((d) => d.id === testDispute1Id), 'Search by customer name finds dispute');

    // ----------------------------------------------------
    // TEST 5: Dispute Status Filter
    // ----------------------------------------------------
    console.log('\n6. Testing Dispute Status Filters (OPEN, UNDER_REVIEW, RESOLVED, REJECTED)...');
    const filterOpenRes = await fetch(`${baseUrl}/api/admin/disputes?status=OPEN`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const filterOpenData = await filterOpenRes.json();
    assert(filterOpenRes.status === 200, 'Status filter OPEN returns HTTP 200');
    assert(filterOpenData.data.every((d) => d.status === 'Open' || d.rawStatus === 'OPEN'), 'All filtered results have OPEN status');

    // ----------------------------------------------------
    // TEST 6: Valid Dispute Status Update (OPEN -> UNDER_REVIEW)
    // ----------------------------------------------------
    console.log('\n7. Testing Valid Dispute Status Update (OPEN -> UNDER_REVIEW)...');
    const updateReviewRes = await fetch(`${baseUrl}/api/admin/disputes/${testDispute1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'UNDER_REVIEW' }),
    });
    const updateReviewData = await updateReviewRes.json();
    assert(updateReviewRes.status === 200, 'PATCH /api/admin/disputes/:id/status to UNDER_REVIEW returns HTTP 200');
    assert(updateReviewData.data.status === 'Under Review' || updateReviewData.data.rawStatus === 'UNDER_REVIEW', 'Status updated to Under Review');

    // Check DB persistence
    const dbDisp1 = await prisma.dispute.findUnique({ where: { id: testDispute1Id } });
    assert(dbDisp1.status === 'UNDER_REVIEW', 'Status persisted as UNDER_REVIEW in PostgreSQL');

    // ----------------------------------------------------
    // TEST 7: Invalid Dispute Status Rejected
    // ----------------------------------------------------
    console.log('\n8. Testing Invalid Dispute Status Rejection (HTTP 400)...');
    const invalidStatusRes = await fetch(`${baseUrl}/api/admin/disputes/${testDispute1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'BOGUS_STATUS' }),
    });
    assert(invalidStatusRes.status === 400, 'Invalid status string returns HTTP 400');

    // ----------------------------------------------------
    // TEST 8: Dispute Resolution & Persistence (UNDER_REVIEW -> RESOLVED)
    // ----------------------------------------------------
    console.log('\n9. Testing Dispute Resolution (UNDER_REVIEW -> RESOLVED)...');
    // First test missing resolution notes
    const noNotesRes = await fetch(`${baseUrl}/api/admin/disputes/${testDispute1Id}/resolve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ resolution: '' }),
    });
    assert(noNotesRes.status === 400, 'Resolving without description returns HTTP 400');

    // Successful resolution
    const resolveRes = await fetch(`${baseUrl}/api/admin/disputes/${testDispute1Id}/resolve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        resolution: 'Full refund of ₹120 credited to consumer wallet. Produce batch inspected at hub.',
      }),
    });
    const resolveData = await resolveRes.json();
    assert(resolveRes.status === 200, 'PATCH /api/admin/disputes/:id/resolve returns HTTP 200');
    assert(resolveData.data.status === 'Resolved' || resolveData.data.rawStatus === 'RESOLVED', 'Dispute marked RESOLVED');
    assert(resolveData.data.resolution.includes('Full refund of ₹120'), 'Resolution notes returned');

    // Verify DB persistence
    const dbResolvedDisp = await prisma.dispute.findUnique({ where: { id: testDispute1Id } });
    assert(dbResolvedDisp.status === 'RESOLVED', 'PostgreSQL status is RESOLVED');
    assert(dbResolvedDisp.resolution.includes('Full refund of ₹120'), 'PostgreSQL resolution stored properly');
    assert(dbResolvedDisp.description.includes('Half of the bananas'), 'Original dispute description preserved intact');

    // Verify consumer notification created
    const notif = await prisma.notification.findFirst({
      where: { userId: consumerUserId, type: 'DISPUTE' },
      orderBy: { createdAt: 'desc' },
    });
    assert(notif !== null && notif.title.includes('Resolved'), 'Consumer notification created for dispute resolution');

    // ----------------------------------------------------
    // TEST 9: Terminal State Protection (RESOLVED -> OPEN blocked)
    // ----------------------------------------------------
    console.log('\n10. Testing Invalid State Transition (RESOLVED -> OPEN blocked)...');
    const blockedReopenRes = await fetch(`${baseUrl}/api/admin/disputes/${testDispute1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'OPEN' }),
    });
    assert(blockedReopenRes.status === 400, 'Reopening permanently RESOLVED dispute returns HTTP 400');

    // ----------------------------------------------------
    // TEST 10: Dispute Rejection & Persistence
    // ----------------------------------------------------
    console.log('\n11. Testing Dispute Rejection (OPEN -> REJECTED)...');
    const rejectRes = await fetch(`${baseUrl}/api/admin/disputes/${testDispute2Id}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        reason: 'Order photographic proof and packaging scale tare confirms complete quantity was dispatched.',
      }),
    });
    const rejectData = await rejectRes.json();
    assert(rejectRes.status === 200, 'PATCH /api/admin/disputes/:id/reject returns HTTP 200');
    assert(rejectData.data.status === 'Rejected' || rejectData.data.rawStatus === 'REJECTED', 'Dispute marked REJECTED');

    // Verify DB persistence and non-deletion
    const dbRejectedDisp = await prisma.dispute.findUnique({ where: { id: testDispute2Id } });
    assert(dbRejectedDisp !== null, 'Rejected dispute is preserved (NOT deleted)');
    assert(dbRejectedDisp.status === 'REJECTED', 'PostgreSQL status is REJECTED');
    assert(dbRejectedDisp.resolution.includes('Order photographic proof'), 'Rejection explanation preserved in PostgreSQL');

    // Blocked reopening of rejected dispute
    const blockedReopenReject = await fetch(`${baseUrl}/api/admin/disputes/${testDispute2Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'OPEN' }),
    });
    assert(blockedReopenReject.status === 400, 'Reopening permanently REJECTED dispute returns HTTP 400');

    // ----------------------------------------------------
    // TEST 11: Admin Review List (GET /api/admin/reviews)
    // ----------------------------------------------------
    console.log('\n12. Testing Admin Review List (GET /api/admin/reviews)...');
    const revListRes = await fetch(`${baseUrl}/api/admin/reviews`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const revListData = await revListRes.json();
    assert(revListRes.status === 200, 'GET /api/admin/reviews returns HTTP 200');
    assert(revListData.success === true, 'Review list success: true');
    assert(Array.isArray(revListData.data), 'Returns reviews as array');
    assert(revListData.data.length >= 1, `Contains ${revListData.data.length} reviews`);
    assert(revListData.metrics && typeof revListData.metrics.totalReviews === 'number', 'Review platform metrics included');

    const foundRev = revListData.data.find((r) => r.id === testReviewId);
    assert(foundRev !== undefined, 'Newly seeded review is present in admin list');
    assert(foundRev.rating === 5, 'Review rating is 5');
    assert(foundRev.verifiedPurchase === true, 'verifiedPurchase is true');
    assert(foundRev.comment.includes('Incredible freshness'), 'Review comment text matches');

    // ----------------------------------------------------
    // TEST 12: Unauthorized Review Access
    // ----------------------------------------------------
    console.log('\n13. Testing Unauthorized Review Access...');
    const unauthRevRes = await fetch(`${baseUrl}/api/admin/reviews`);
    assert(unauthRevRes.status === 401, 'Unauthenticated request to list reviews returns HTTP 401');

    const farmerRevRes = await fetch(`${baseUrl}/api/admin/reviews`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert(farmerRevRes.status === 403, 'FARMER role accessing Admin reviews returns HTTP 403');

    const consumerRevRes = await fetch(`${baseUrl}/api/admin/reviews`, {
      headers: { Authorization: `Bearer ${consumerToken}` },
    });
    assert(consumerRevRes.status === 403, 'CONSUMER role accessing Admin reviews returns HTTP 403');

    // ----------------------------------------------------
    // TEST 13: Review Relations (Customer, Farmer, Product)
    // ----------------------------------------------------
    console.log('\n14. Testing Review Relations (Customer, Farmer, Product)...');
    assert(foundRev.customer && foundRev.customer.name === 'Asha Kulkarni', 'Customer relation populated correctly');
    assert(foundRev.customer.email === consumerEmail, 'Customer email populated');
    assert(foundRev.farmer && foundRev.farmer.farmName === 'Manjunath Natural Organics', 'Farmer farmName relation populated');
    assert(foundRev.farmer.farmerName === 'Manjunath Gowda', 'Farmer name relation populated');
    assert(foundRev.product && foundRev.product.name === testProduct.name, 'Product relation populated correctly');
    assert(foundRev.product.category === 'FRUITS', 'Product category populated');

    // ----------------------------------------------------
    // TEST 14: Sensitive Fields Not Exposed
    // ----------------------------------------------------
    console.log('\n15. Verifying Sensitive Fields (passwordHash, tokens) are NEVER Exposed...');
    const allDisputeJson = JSON.stringify(dispListData);
    const allReviewJson = JSON.stringify(revListData);
    const detailDisputeJson = JSON.stringify(dispDetailData);

    assert(!allDisputeJson.includes('passwordHash'), 'Dispute list does NOT expose passwordHash');
    assert(!allReviewJson.includes('passwordHash'), 'Review list does NOT expose passwordHash');
    assert(!detailDisputeJson.includes('passwordHash'), 'Dispute detail does NOT expose passwordHash');
    assert(!allDisputeJson.includes('"token"'), 'Dispute list does NOT expose tokens');
    assert(!allReviewJson.includes('"token"'), 'Review list does NOT expose tokens');

    // ----------------------------------------------------
    // TEST 15: Existing Orders & Data Relationships Intact
    // ----------------------------------------------------
    console.log('\n16. Verifying Data Consistency and Historical Integrity...');
    const dbOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, disputes: true },
    });
    assert(dbOrder !== null, 'Order was NOT deleted by dispute resolution or rejection');
    assert(dbOrder.items.length === 1, 'Order items remain completely intact');
    assert(dbOrder.disputes.length === 2, 'Both disputes correctly link to order');
    assert(Number(dbOrder.total) === 165.0, 'Order financials preserved');

    const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
    assert(dbProduct !== null, 'Product was NOT deleted');

    const dbFarmer = await prisma.farmer.findUnique({ where: { id: farmerId } });
    assert(dbFarmer !== null, 'Farmer was NOT deleted');

    console.log('\n=== ALL ADMIN DISPUTES & REVIEWS E2E TESTS COMPLETED ===');
    console.log(`Results: ${passed} PASSED, ${failed} FAILED\n`);

    if (failed > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('Unexpected test error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAdminDisputesReviewsE2ETests();
