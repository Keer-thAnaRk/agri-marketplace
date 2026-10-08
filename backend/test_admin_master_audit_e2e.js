const { prisma } = require('./dist/db/prisma');
const bcrypt = require('bcrypt');

async function runMasterAdminAudit() {
  console.log('================================================================');
  console.log('      MASTER ADMIN MODULE AUDIT, SECURITY & E2E VERIFICATION    ');
  console.log('================================================================\n');

  const baseUrl = 'http://localhost:5000';
  const timestamp = Date.now();

  let admin1Token = '';
  let admin1User = null;
  let admin2Token = '';
  let admin2User = null;
  let farmerToken = '';
  let farmerUser = null;
  let farmerRecord = null;
  let consumerToken = '';
  let consumerUser = null;

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`   ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`   ✗ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // ========================================================================
    // 1. ADMIN AUTHENTICATION AUDIT
    // ========================================================================
    console.log('1. AUDITING ADMIN AUTHENTICATION...');

    // 1a. Valid login
    const validLoginRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@krishimarket.in',
        password: 'admin123',
      }),
    });
    const validLoginData = await validLoginRes.json();
    admin1Token = validLoginData.data?.token;
    admin1User = validLoginData.data?.user;

    assert(validLoginRes.status === 200, 'Valid admin credentials return HTTP 200');
    assert(!!admin1Token, 'Valid admin login issues JWT token');
    assert(admin1User?.role === 'ADMIN', 'Admin user payload reports role ADMIN');

    // 1b. Credential safety: zero exposure of sensitive fields
    assert(!validLoginData.data?.user?.passwordHash, 'passwordHash is NOT exposed in admin login response');
    assert(!validLoginData.data?.user?.password, 'password is NOT exposed in admin login response');

    // 1c. Invalid password rejection
    const invalidPwRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@krishimarket.in',
        password: 'wrong_password_999',
      }),
    });
    assert(invalidPwRes.status === 401, 'Invalid admin password rejected with HTTP 401 Unauthorized');

    // 1d. Invalid email rejection
    const invalidEmailRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent_admin@krishimarket.in',
        password: 'admin123',
      }),
    });
    assert(invalidEmailRes.status === 401, 'Nonexistent admin email rejected with HTTP 401 Unauthorized');

    // 1e. Create secondary admin for cross-tenant IDOR audit
    const admin2Email = `audit.admin2.${timestamp}@krishitest.com`;
    const admin2PasswordHash = await bcrypt.hash('Admin2Secret@123', 10);
    const createdAdmin2 = await prisma.user.create({
      data: {
        name: 'Audit Secondary Admin',
        email: admin2Email,
        passwordHash: admin2PasswordHash,
        role: 'ADMIN',
        isActive: true,
      },
    });
    admin2User = createdAdmin2;

    const admin2LoginRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: admin2Email,
        password: 'Admin2Secret@123',
      }),
    });
    const admin2Data = await admin2LoginRes.json();
    admin2Token = admin2Data.data?.token;
    assert(admin2LoginRes.status === 200 && !!admin2Token, 'Secondary admin created and authenticated for IDOR audits');

    // 1f. Create Consumer & Farmer for RBAC & Escalation audits
    const consumerEmail = `audit.consumer.${timestamp}@krishitest.com`;
    const consumerRegRes = await fetch(`${baseUrl}/api/auth/consumer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Audit Consumer',
        email: consumerEmail,
        phone: `+91 9777${String(timestamp).slice(-6)}`,
        password: 'ConsumerSecret@123',
      }),
    });
    const consumerRegData = await consumerRegRes.json();
    consumerToken = consumerRegData.data?.token;
    consumerUser = consumerRegData.data?.user;
    assert(consumerRegRes.status === 201 && !!consumerToken, 'Test consumer registered for RBAC audits');

    const farmerEmail = `audit.farmer.${timestamp}@krishitest.com`;
    const farmerRegRes = await fetch(`${baseUrl}/api/auth/farmer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Audit Farmer Gowda',
        email: farmerEmail,
        phone: `+91 9666${String(timestamp).slice(-6)}`,
        password: 'FarmerSecret@123',
        farmName: 'Audit Green Fields',
        farmLocation: 'Kolar Agro Cluster',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '562114',
        hub: 'East Hub',
      }),
    });
    const farmerRegData = await farmerRegRes.json();
    farmerToken = farmerRegData.data?.token;
    farmerUser = farmerRegData.data?.user;
    farmerRecord = farmerUser?.id ? await prisma.farmer.findFirst({ where: { userId: farmerUser.id } }) : null;
    assert(farmerRegRes.status === 201 && !!farmerToken && !!farmerRecord, `Test farmer registered (initial status: PENDING) - response status: ${farmerRegRes.status} error: ${farmerRegData.error || 'none'}`);

    // ========================================================================
    // 2. SERVER-SIDE ROUTE PROTECTION & RBAC AUDIT
    // ========================================================================
    console.log('\n2. AUDITING SERVER-SIDE ROUTE PROTECTION ACROSS ALL ADMIN ENDPOINTS...');

    const protectedAdminEndpoints = [
      { method: 'GET', url: '/api/admin/dashboard' },
      { method: 'GET', url: '/api/admin/farmers/pending' },
      { method: 'GET', url: '/api/admin/farmers' },
      { method: 'GET', url: '/api/admin/users' },
      { method: 'GET', url: '/api/admin/products' },
      { method: 'GET', url: '/api/admin/orders' },
      { method: 'GET', url: '/api/admin/deliveries' },
      { method: 'GET', url: '/api/admin/disputes' },
      { method: 'GET', url: '/api/admin/reviews' },
      { method: 'GET', url: '/api/admin/analytics' },
      { method: 'GET', url: '/api/admin/notifications' },
      { method: 'GET', url: '/api/admin/notifications/unread-count' },
    ];

    for (const ep of protectedAdminEndpoints) {
      // Unauthenticated
      const unauthRes = await fetch(`${baseUrl}${ep.url}`, { method: ep.method });
      assert(unauthRes.status === 401, `Unauthenticated ${ep.method} ${ep.url} rejected with HTTP 401`);

      // Consumer role
      const consumerRes = await fetch(`${baseUrl}${ep.url}`, {
        method: ep.method,
        headers: { Authorization: `Bearer ${consumerToken}` },
      });
      assert(consumerRes.status === 403, `Consumer ${ep.method} ${ep.url} rejected with HTTP 403 Forbidden`);

      // Farmer role
      const farmerRes = await fetch(`${baseUrl}${ep.url}`, {
        method: ep.method,
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      assert(farmerRes.status === 403, `Farmer ${ep.method} ${ep.url} rejected with HTTP 403 Forbidden`);

      // Admin role
      const adminRes = await fetch(`${baseUrl}${ep.url}`, {
        method: ep.method,
        headers: { Authorization: `Bearer ${admin1Token}` },
      });
      assert(adminRes.status === 200, `Admin ${ep.method} ${ep.url} granted with HTTP 200 OK`);
    }

    // ========================================================================
    // 3. ROLE ESCALATION & PARAMETER TAMPERING AUDIT
    // ========================================================================
    console.log('\n3. AUDITING PRIVILEGE ESCALATION & PARAMETER TAMPERING...');

    // 3a. Consumer attempts to escalate to ADMIN via user update API
    const escalateRes = await fetch(`${baseUrl}/api/admin/users/${consumerUser.id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${consumerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'ADMIN' }),
    });
    assert(escalateRes.status === 403, 'Consumer cannot access user status update endpoint (HTTP 403)');

    // 3b. Verify consumer role was NOT changed in database
    const dbConsumer = await prisma.user.findUnique({ where: { id: consumerUser.id } });
    assert(dbConsumer.role === 'CONSUMER', 'Consumer role remains strictly CONSUMER in PostgreSQL');

    // 3c. Farmer attempts to self-approve via farmer profile tampering
    const farmerTamperRes = await fetch(`${baseUrl}/api/farmer/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${farmerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        verificationStatus: 'APPROVED',
        isVerified: true,
      }),
    });
    // Check DB status
    const dbFarmerAfterTamper = await prisma.farmer.findUnique({ where: { id: farmerRecord.id } });
    assert(
      dbFarmerAfterTamper.verificationStatus === 'PENDING' && !dbFarmerAfterTamper.isVerified,
      'Farmer profile parameter tampering ignored: verificationStatus remains PENDING in PostgreSQL'
    );

    // ========================================================================
    // 4. IDOR (INSECURE DIRECT OBJECT REFERENCE) AUDIT
    // ========================================================================
    console.log('\n4. AUDITING IDOR (CROSS-TENANT ISOLATION) PROTECTIONS...');

    // 4a. Notification IDOR: Admin 1 cannot mark Admin 2's notification as read
    const admin2Notification = await prisma.notification.create({
      data: {
        userId: admin2User.id,
        title: 'Confidential Alert Admin 2',
        message: 'Restricted administrative event strictly for Admin 2',
        type: 'SYSTEM',
        isRead: false,
      },
    });

    const idorMarkReadRes = await fetch(`${baseUrl}/api/admin/notifications/${admin2Notification.id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    assert(idorMarkReadRes.status === 403, 'Admin 1 cannot mark Admin 2 notification as read (HTTP 403 Forbidden)');

    const idorDeleteRes = await fetch(`${baseUrl}/api/admin/notifications/${admin2Notification.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    assert(idorDeleteRes.status === 403, 'Admin 1 cannot delete Admin 2 notification (HTTP 403 Forbidden)');

    // 4b. Admin self-protection: Admin cannot deactivate their own user account
    const selfDeactivateRes = await fetch(`${baseUrl}/api/admin/users/${admin1User.id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${admin1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive: false }),
    });
    assert(selfDeactivateRes.status === 403, 'Admin cannot deactivate their own account (HTTP 403 Forbidden)');

    // 4c. Non-admin modifying dispute status
    const existingDispute = await prisma.dispute.findFirst();
    if (existingDispute) {
      const consumerDisputeRes = await fetch(`${baseUrl}/api/admin/disputes/${existingDispute.id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${consumerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'RESOLVED', resolutionNote: 'Tampered' }),
      });
      assert(consumerDisputeRes.status === 403, 'Consumer cannot resolve dispute via admin API (HTTP 403 Forbidden)');
    }

    // ========================================================================
    // 5. COMPREHENSIVE 17-STEP REALISTIC END-TO-END WORKFLOW
    // ========================================================================
    console.log('\n5. EXECUTING COMPLETE 17-STEP END-TO-END WORKFLOW IN POSTGRESQL...');

    // Step 1: Admin logs in
    assert(!!admin1Token && admin1User.role === 'ADMIN', 'Step 1: Admin authenticated with valid session');

    // Step 2: Admin views dashboard overview
    const dashRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const dashData = await dashRes.json();
    assert(dashRes.status === 200 && dashData.success === true, 'Step 2: Admin successfully views live dashboard');

    // Step 3: PENDING farmer cannot create product
    const pendingProductRes = await fetch(`${baseUrl}/api/farmer/products`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${farmerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Unauthorized Crop',
        category: 'Vegetables',
        price: 50,
        unit: 'KG',
      }),
    });
    assert(
      pendingProductRes.status === 403,
      'Step 3: PENDING farmer blocked from publishing products (HTTP 403 Forbidden)'
    );

    // Step 4: Admin views pending farmer queue
    const pendingQueueRes = await fetch(`${baseUrl}/api/admin/farmers/pending`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const pendingQueueData = await pendingQueueRes.json();
    const isFarmerInPending = pendingQueueData.data?.some(
      (f) => f.id === farmerRecord.id || f.user?.email === farmerEmail
    );
    assert(isFarmerInPending, 'Step 4: Admin sees newly registered farmer in pending verification queue');

    // Step 5: Admin rejects farmer with reason
    const rejectRes = await fetch(`${baseUrl}/api/admin/farmers/${farmerRecord.id}/reject`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${admin1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'Incomplete land survey certificate attached.' }),
    });
    assert(rejectRes.status === 200, 'Step 5a: Admin rejects farmer application');

    const dbFarmerRejected = await prisma.farmer.findUnique({ where: { id: farmerRecord.id } });
    assert(
      dbFarmerRejected.verificationStatus === 'REJECTED' &&
        dbFarmerRejected.rejectionReason === 'Incomplete land survey certificate attached.',
      'Step 5b: Rejection status and explanation accurately persisted in PostgreSQL'
    );

    // Step 6: Admin approves farmer
    const approveRes = await fetch(`${baseUrl}/api/admin/farmers/${farmerRecord.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    assert(approveRes.status === 200, 'Step 6a: Admin approves farmer application');

    const dbFarmerApproved = await prisma.farmer.findUnique({ where: { id: farmerRecord.id } });
    assert(
      dbFarmerApproved.verificationStatus === 'APPROVED' &&
        dbFarmerApproved.isVerified === true &&
        dbFarmerApproved.approvedById === admin1User.id,
      'Step 6b: Approval status, timestamp, and approvedById persisted in PostgreSQL'
    );

    // Step 7: Farmer receives approval notification
    const farmerNotifs = await prisma.notification.findMany({ where: { userId: farmerUser.id } });
    const hasApprovalNotif = farmerNotifs.some(
      (n) => n.title.includes('Approved') || n.message.includes('approved')
    );
    assert(hasApprovalNotif, 'Step 7: Farmer received profile approval notification');

    // Step 8: Approved farmer can now create product
    const createProdRes = await fetch(`${baseUrl}/api/farmer/products`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${farmerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Audit Organic Drumsticks ${timestamp}`,
        description: 'Fresh drumsticks harvested daily from agroforest',
        category: 'Vegetables',
        price: 85,
        unit: 'KG',
        stock: 50,
        organic: true,
        farmingMethod: 'Natural / ZBNF',
        harvestDate: new Date().toISOString(),
      }),
    });
    const createProdData = await createProdRes.json();
    const createdProductId = createProdData.data?.id;
    assert(createProdRes.status === 201 && !!createdProductId, 'Step 8: Approved farmer successfully published product');

    // Step 9: Admin sees product in marketplace management
    const adminProdRes = await fetch(`${baseUrl}/api/admin/products`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const adminProdData = await adminProdRes.json();
    const foundAdminProd = adminProdData.data?.some((p) => p.id === createdProductId);
    assert(foundAdminProd, 'Step 9: Admin sees newly published product in marketplace management');

    // Step 10: Consumer places order
    const address = await prisma.consumerAddress.create({
      data: {
        userId: consumerUser.id,
        name: 'Audit Consumer',
        phone: '+91 97771 23456',
        addressLine: '42 MG Road, Brigade Junction',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        hub: 'East Hub',
      },
    });

    const orderNumber = `KM-AUDIT-${String(timestamp).slice(-6)}`;
    const testOrder = await prisma.order.create({
      data: {
        orderNumber,
        consumerId: consumerUser.id,
        addressId: address.id,
        deliverySlotName: 'Morning Slot',
        deliverySlotRange: '8:00 AM – 11:00 AM',
        status: 'PLACED',
        subtotal: 170.0,
        deliveryFee: 30.0,
        platformFee: 15.0,
        farmerEarnings: 155.0,
        total: 215.0,
        paymentMethod: 'UPI',
        paymentStatus: 'PAID',
        items: {
          create: [
            {
              productId: createdProductId,
              farmerId: farmerRecord.id,
              productName: `Audit Organic Drumsticks ${timestamp}`,
              productImage: '',
              farmerName: 'Audit Farmer Gowda',
              farmName: 'Audit Green Fields',
              unitPrice: 85.0,
              quantity: 2.0,
              unit: 'KG',
              totalPrice: 170.0,
            },
          ],
        },
      },
    });
    assert(!!testOrder, `Step 10: Order placed (Order #${orderNumber}, total ₹215)`);

    // Step 11: Admin views order details; snapshot data intact
    const adminOrderRes = await fetch(`${baseUrl}/api/admin/orders/${testOrder.id}`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const adminOrderData = await adminOrderRes.json();
    assert(
      adminOrderRes.status === 200 &&
        adminOrderData.data?.orderNumber === orderNumber &&
        adminOrderData.data?.items?.[0]?.unitPrice === 85,
      'Step 11: Admin views order with historical price snapshots intact'
    );

    // Step 12: Delivery batch created and linked to order
    const batchCode = `BAT-AUDIT-${String(timestamp).slice(-6)}`;
    const deliveryBatch = await prisma.deliveryBatch.create({
      data: {
        batchCode,
        hubArea: 'East Hub',
        deliverySlot: 'Morning',
        status: 'PENDING',
        riderName: 'Somesh Delivery Partner',
        riderPhone: '+91 98888 11111',
        riderVehicle: 'EV 2-Wheeler KA-01-EV-4422',
        estimatedDistanceKm: 6.4,
        orders: {
          connect: [{ id: testOrder.id }],
        },
      },
    });
    assert(!!deliveryBatch, `Step 12: Delivery batch created (${batchCode}) linked to order`);

    // Step 13: Admin advances delivery status; order status synchronizes automatically
    const dispatchRes = await fetch(`${baseUrl}/api/admin/deliveries/${deliveryBatch.id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${admin1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'OUT_FOR_DELIVERY' }),
    });
    assert(dispatchRes.status === 200, 'Step 13a: Admin dispatches delivery batch');

    const syncedOrder = await prisma.order.findUnique({ where: { id: testOrder.id } });
    assert(
      syncedOrder.status === 'OUT_FOR_DELIVERY',
      'Step 13b: Order automatically updated to OUT_FOR_DELIVERY in PostgreSQL via delivery batch event'
    );

    // Deliver batch
    await fetch(`${baseUrl}/api/admin/deliveries/${deliveryBatch.id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${admin1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'DELIVERED' }),
    });
    const deliveredOrder = await prisma.order.findUnique({ where: { id: testOrder.id } });
    assert(
      deliveredOrder.status === 'DELIVERED' && !!deliveredOrder.deliveredAt,
      'Step 13c: Order marked DELIVERED with deliveredAt timestamp recorded'
    );

    // Step 14: Dispute filed on delivered order
    const auditDispute = await prisma.dispute.create({
      data: {
        orderId: testOrder.id,
        userId: consumerUser.id,
        productName: `Audit Organic Drumsticks ${timestamp}`,
        reason: 'QUALITY_DEFECT',
        amount: 85.0,
        description: 'Two drumsticks were damaged inside packaging.',
        status: 'OPEN',
      },
    });
    assert(!!auditDispute, `Step 14: Customer dispute created on order`);

    // Step 15: Admin resolves dispute
    const resolveDisputeRes = await fetch(`${baseUrl}/api/admin/disputes/${auditDispute.id}/resolve`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${admin1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resolution: 'Approved partial refund of ₹85 to customer wallet.',
      }),
    });
    assert(resolveDisputeRes.status === 200, 'Step 15a: Admin resolves customer dispute');

    const resolvedDbDispute = await prisma.dispute.findUnique({ where: { id: auditDispute.id } });
    assert(
      resolvedDbDispute.status === 'RESOLVED' &&
        resolvedDbDispute.resolution === 'Approved partial refund of ₹85 to customer wallet.',
      'Step 15b: Dispute resolution persisted in PostgreSQL; historical record intact'
    );

    // Step 16: Consumer leaves verified purchase review; Admin views reviews
    const auditReview = await prisma.review.create({
      data: {
        rating: 5,
        comment: 'Fresh farm-to-table produce, excellent resolution by support team!',
        userId: consumerUser.id,
        farmerId: farmerRecord.id,
        productId: createdProductId,
        verifiedPurchase: true,
      },
    });

    const reviewsRes = await fetch(`${baseUrl}/api/admin/reviews`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const reviewsData = await reviewsRes.json();
    const hasAuditReview = reviewsData.data?.some((r) => r.id === auditReview.id);
    assert(reviewsRes.status === 200 && hasAuditReview, 'Step 16: Admin views verified customer reviews');

    // Step 17: Admin checks analytics & notifications
    const analyticsRes = await fetch(`${baseUrl}/api/admin/analytics?timeRange=30D`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const analyticsData = await analyticsRes.json();
    assert(
      analyticsRes.status === 200 &&
        typeof analyticsData.data?.kpis?.grossOrderValue === 'number' &&
        typeof analyticsData.data?.kpis?.farmerEarnings === 'number' &&
        analyticsData.data?.kpis?.farmerEarnings <= analyticsData.data?.kpis?.grossOrderValue,
      'Step 17a: Analytics KPIs computed from PostgreSQL; farmerEarnings <= grossOrderValue'
    );

    // Admin marks notifications as read
    const markAllReadRes = await fetch(`${baseUrl}/api/admin/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const unreadCountRes = await fetch(`${baseUrl}/api/admin/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const unreadCountData = await unreadCountRes.json();
    assert(
      markAllReadRes.status === 200 && unreadCountData.unreadCount === 0,
      'Step 17b: Admin marks all notifications read; live unread count is 0 in PostgreSQL'
    );

    // ========================================================================
    // CLEANUP TEST ARTIFACTS
    // ========================================================================
    console.log('\nCleaning up master test artifacts...');
    await prisma.notification.deleteMany({
      where: { userId: { in: [admin1User.id, admin2User.id, farmerUser.id, consumerUser.id] } },
    });
    await prisma.user.delete({ where: { id: admin2User.id } });

    console.log(`\n================================================================`);
    console.log(`MASTER AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log(`================================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Master Audit Fatal Error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMasterAdminAudit();
