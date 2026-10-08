const { prisma } = require('./dist/db/prisma');
const bcrypt = require('bcrypt');

async function runAdminNotificationsE2ETests() {
  console.log('=== STARTING ADMIN NOTIFICATIONS & SYSTEM ACTIVITY E2E INTEGRATION TESTS ===\n');

  const baseUrl = 'http://localhost:5000';
  const timestamp = Date.now();

  let admin1Token = '';
  let admin1UserId = '';
  let admin2Token = '';
  let admin2UserId = '';
  let farmerToken = '';
  let consumerToken = '';

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
    // 1. SETUP: Admins, Farmer, Consumer
    // ----------------------------------------------------
    console.log('1. Setting up Test Users (Admins, Farmer, Consumer)...');

    // Admin 1 login
    const admin1LoginRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@krishimarket.in',
        password: 'admin123',
      }),
    });
    const admin1Data = await admin1LoginRes.json();
    admin1Token = admin1Data.data?.token;
    admin1UserId = admin1Data.data?.user?.id;
    assert(admin1LoginRes.status === 200 && admin1Token && admin1UserId, 'Admin 1 authenticated successfully');

    // Create Admin 2 for IDOR testing if not exists
    const admin2Email = `admin2.${timestamp}@krishitest.com`;
    const passwordHash = await bcrypt.hash('Admin2Secret@123', 10);
    const admin2User = await prisma.user.create({
      data: {
        name: 'Secondary Admin',
        email: admin2Email,
        passwordHash: passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    });
    admin2UserId = admin2User.id;

    // Login Admin 2
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
    assert(admin2LoginRes.status === 200 && admin2Token, 'Admin 2 created and authenticated for IDOR verification');

    // Farmer registration / login
    const farmerEmail = `notif.farmer.${timestamp}@krishitest.com`;
    const farmerRegRes = await fetch(`${baseUrl}/api/auth/farmer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Notif Test Farmer',
        email: farmerEmail,
        phone: `+91 9899${String(timestamp).slice(-6)}`,
        password: 'FarmerPassword@123',
        farmName: 'Notif Organic Acres',
        farmLocation: 'Mandya Hub #3',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '562114',
        hub: 'East Hub',
      }),
    });
    const farmerData = await farmerRegRes.json();
    farmerToken = farmerData.data?.token;
    assert(farmerRegRes.status === 201 && farmerToken, 'Farmer registered successfully for RBAC testing');

    // Consumer registration / login
    const consumerEmail = `notif.consumer.${timestamp}@krishitest.com`;
    const consumerRegRes = await fetch(`${baseUrl}/api/auth/consumer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Notif Test Consumer',
        email: consumerEmail,
        phone: `9188${String(timestamp).slice(-6)}`,
        password: 'ConsumerPassword@123',
      }),
    });
    const consumerData = await consumerRegRes.json();
    consumerToken = consumerData.data?.token;
    assert(consumerRegRes.status === 201 && consumerToken, 'Consumer registered successfully for RBAC testing');

    // ----------------------------------------------------
    // 2. SEED TEST NOTIFICATIONS FOR ADMIN 1 & ADMIN 2
    // ----------------------------------------------------
    console.log('\n2. Seeding Test Notifications in PostgreSQL...');

    // Clear existing notifications for Admin 1 to have deterministic counts
    await prisma.notification.deleteMany({
      where: { userId: admin1UserId },
    });

    const notifVerif = await prisma.notification.create({
      data: {
        userId: admin1UserId,
        title: 'New Farmer Registration Pending',
        message: 'Farmer Ramesh Gowda submitted documents for cluster #4.',
        type: 'VERIFICATION',
        link: '/admin/farmers/test-farmer-id',
        isRead: false,
      },
    });

    const notifOrder = await prisma.notification.create({
      data: {
        userId: admin1UserId,
        title: 'High-Value Order Placed',
        message: 'Order #ORD-9901 placed for ₹14,500.',
        type: 'ORDER',
        link: '/admin/orders/ord-9901',
        isRead: false,
      },
    });

    const notifDispute = await prisma.notification.create({
      data: {
        userId: admin1UserId,
        title: 'Consumer Quality Dispute Escalated',
        message: 'Dispute filed on batch #BATCH-3312: Quality discrepancy.',
        type: 'DISPUTE',
        link: '/admin/disputes/disp-44',
        isRead: false,
      },
    });

    const notifInventory = await prisma.notification.create({
      data: {
        userId: admin1UserId,
        title: 'Cold Storage Low Stock Alert',
        message: 'Fresh Shimla Apples inventory fell below threshold (10 kg).',
        type: 'INVENTORY',
        link: '/admin/products/prod-11',
        isRead: true, // Already read
      },
    });

    const notifSystem = await prisma.notification.create({
      data: {
        userId: admin1UserId,
        title: 'Nightly Backup Completed',
        message: 'Database backup synchronized to archival vault.',
        type: 'SYSTEM',
        isRead: false,
      },
    });

    // Seed Notification for Admin 2 (for IDOR tests)
    const notifAdmin2 = await prisma.notification.create({
      data: {
        userId: admin2UserId,
        title: 'Admin 2 Private Notification',
        message: 'This alert belongs strictly to Admin 2.',
        type: 'SYSTEM',
        isRead: false,
      },
    });

    assert(
      notifVerif && notifOrder && notifDispute && notifInventory && notifSystem && notifAdmin2,
      'Test notifications seeded across multiple NotificationTypes in PostgreSQL'
    );

    // ----------------------------------------------------
    // 3. FETCH NOTIFICATIONS & UNREAD COUNT
    // ----------------------------------------------------
    console.log('\n3. Testing Admin Notifications Fetch & Unread Count...');

    const fetchAllRes = await fetch(`${baseUrl}/api/admin/notifications`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const fetchAllData = await fetchAllRes.json();
    assert(fetchAllRes.status === 200, 'GET /api/admin/notifications returns HTTP 200');
    assert(fetchAllData.success === true, 'Response body has success: true');
    assert(fetchAllData.count >= 5, `Fetched ${fetchAllData.count} notifications for Admin 1`);
    assert(fetchAllData.unreadCount === 4, `Unread count correctly reflects 4 unread items (got ${fetchAllData.unreadCount})`);

    // Verify unread count dedicated endpoint
    const unreadCountRes = await fetch(`${baseUrl}/api/admin/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const unreadCountData = await unreadCountRes.json();
    assert(unreadCountRes.status === 200, 'GET /api/admin/notifications/unread-count returns HTTP 200');
    assert(unreadCountData.unreadCount === 4, `Dedicated unread endpoint matches: ${unreadCountData.unreadCount}`);

    // Verify pagination metadata
    assert(fetchAllData.pagination && fetchAllData.pagination.page === 1, 'Pagination metadata is structured properly');

    // ----------------------------------------------------
    // 4. TYPE FILTERING
    // ----------------------------------------------------
    console.log('\n4. Testing Notification Type Filtering...');

    // Filter VERIFICATION
    const verifRes = await fetch(`${baseUrl}/api/admin/notifications?type=VERIFICATION`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const verifData = await verifRes.json();
    assert(
      verifRes.status === 200 &&
        verifData.data.every((n) => n.rawType === 'VERIFICATION' || n.type === 'verification'),
      'Filter ?type=VERIFICATION returns only VERIFICATION notifications'
    );

    // Filter DISPUTE
    const disputeRes = await fetch(`${baseUrl}/api/admin/notifications?type=DISPUTE`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const disputeData = await disputeRes.json();
    assert(
      disputeRes.status === 200 &&
        disputeData.data.every((n) => n.rawType === 'DISPUTE' || n.type === 'dispute'),
      'Filter ?type=DISPUTE returns only DISPUTE notifications'
    );

    // Filter ORDER
    const orderRes = await fetch(`${baseUrl}/api/admin/notifications?type=ORDER`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const orderData = await orderRes.json();
    assert(
      orderRes.status === 200 &&
        orderData.data.every((n) => n.rawType === 'ORDER' || n.type === 'order'),
      'Filter ?type=ORDER returns only ORDER notifications'
    );

    // ----------------------------------------------------
    // 5. STATUS FILTERING (READ / UNREAD)
    // ----------------------------------------------------
    console.log('\n5. Testing Notification Status Filtering (Read / Unread)...');

    const unreadRes = await fetch(`${baseUrl}/api/admin/notifications?status=unread`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const unreadData = await unreadRes.json();
    assert(
      unreadRes.status === 200 && unreadData.data.every((n) => n.isRead === false),
      'Filter ?status=unread returns exclusively unread notifications'
    );

    const readRes = await fetch(`${baseUrl}/api/admin/notifications?status=read`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const readData = await readRes.json();
    assert(
      readRes.status === 200 && readData.data.every((n) => n.isRead === true),
      'Filter ?status=read returns exclusively read notifications'
    );

    // ----------------------------------------------------
    // 6. MARK SINGLE NOTIFICATION AS READ
    // ----------------------------------------------------
    console.log('\n6. Testing Mark Single Notification as Read...');

    const markReadRes = await fetch(`${baseUrl}/api/admin/notifications/${notifVerif.id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const markReadData = await markReadRes.json();
    assert(markReadRes.status === 200, 'PATCH /api/admin/notifications/:id/read returns HTTP 200');
    assert(markReadData.data?.isRead === true, 'Notification isRead changed to true');

    // Verify unread count decremented
    const unreadAfterSingleRes = await fetch(`${baseUrl}/api/admin/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const unreadAfterSingleData = await unreadAfterSingleRes.json();
    assert(
      unreadAfterSingleData.unreadCount === 3,
      `Unread count decremented from 4 to 3 (got ${unreadAfterSingleData.unreadCount})`
    );

    // ----------------------------------------------------
    // 7. MARK ALL NOTIFICATIONS AS READ
    // ----------------------------------------------------
    console.log('\n7. Testing Mark All Notifications as Read...');

    const markAllRes = await fetch(`${baseUrl}/api/admin/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const markAllData = await markAllRes.json();
    assert(markAllRes.status === 200, 'PATCH /api/admin/notifications/read-all returns HTTP 200');
    assert(markAllData.count === 3, `Updated remaining 3 unread notifications (reported ${markAllData.count})`);

    const unreadAfterAllRes = await fetch(`${baseUrl}/api/admin/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const unreadAfterAllData = await unreadAfterAllRes.json();
    assert(unreadAfterAllData.unreadCount === 0, 'Unread count is now 0 in PostgreSQL');

    // ----------------------------------------------------
    // 8. IDOR PROTECTION & CROSS-TENANT ISOLATION
    // ----------------------------------------------------
    console.log('\n8. Testing IDOR Protection (Admin A vs Admin B)...');

    // Admin 1 attempts to mark Admin 2's notification as read
    const idorMarkRes = await fetch(`${baseUrl}/api/admin/notifications/${notifAdmin2.id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    assert(idorMarkRes.status === 403, 'Admin 1 marking Admin 2 notification returns HTTP 403 Forbidden');

    // Admin 1 attempts to delete Admin 2's notification
    const idorDeleteRes = await fetch(`${baseUrl}/api/admin/notifications/${notifAdmin2.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    assert(idorDeleteRes.status === 403, 'Admin 1 deleting Admin 2 notification returns HTTP 403 Forbidden');

    // Admin 1 notification list does NOT include Admin 2's notification
    const admin1ListRes = await fetch(`${baseUrl}/api/admin/notifications`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const admin1ListData = await admin1ListRes.json();
    const hasAdmin2Item = admin1ListData.data.some((n) => n.id === notifAdmin2.id);
    assert(!hasAdmin2Item, "Admin 1 notification list strictly excludes Admin 2's notifications");

    // ----------------------------------------------------
    // 9. RBAC & UNAUTHENTICATED PROTECTION
    // ----------------------------------------------------
    console.log('\n9. Testing RBAC & Security Protection...');

    // Unauthenticated request
    const unauthRes = await fetch(`${baseUrl}/api/admin/notifications`);
    assert(unauthRes.status === 401, 'Unauthenticated GET /api/admin/notifications returns HTTP 401');

    // Consumer token
    const consumerAccessRes = await fetch(`${baseUrl}/api/admin/notifications`, {
      headers: { Authorization: `Bearer ${consumerToken}` },
    });
    assert(consumerAccessRes.status === 403, 'Consumer token on /api/admin/notifications returns HTTP 403 Forbidden');

    // Farmer token
    const farmerAccessRes = await fetch(`${baseUrl}/api/admin/notifications`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert(farmerAccessRes.status === 403, 'Farmer token on /api/admin/notifications returns HTTP 403 Forbidden');

    // ----------------------------------------------------
    // 10. DELETE SINGLE NOTIFICATION
    // ----------------------------------------------------
    console.log('\n10. Testing Single Notification Deletion...');

    const deleteOneRes = await fetch(`${baseUrl}/api/admin/notifications/${notifSystem.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    assert(deleteOneRes.status === 200, 'DELETE /api/admin/notifications/:id returns HTTP 200');

    // Verify deletion in database
    const dbNotif = await prisma.notification.findUnique({
      where: { id: notifSystem.id },
    });
    assert(!dbNotif, 'Notification successfully deleted from PostgreSQL database');

    // ----------------------------------------------------
    // 11. CLEAR ALL NOTIFICATIONS & EMPTY STATE
    // ----------------------------------------------------
    console.log('\n11. Testing Clear All Notifications & Empty State...');

    const clearAllRes = await fetch(`${baseUrl}/api/admin/notifications`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const clearAllData = await clearAllRes.json();
    assert(clearAllRes.status === 200, 'DELETE /api/admin/notifications returns HTTP 200');
    assert(clearAllData.count > 0, `Cleared ${clearAllData.count} notifications for Admin 1`);

    // Verify empty state
    const emptyRes = await fetch(`${baseUrl}/api/admin/notifications`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const emptyData = await emptyRes.json();
    assert(
      emptyRes.status === 200 && emptyData.data.length === 0 && emptyData.unreadCount === 0,
      'Notifications list is now empty (empty state verified)'
    );

    // Verify Admin 2 notification was NOT deleted by Admin 1 clear-all
    const admin2DbNotif = await prisma.notification.findUnique({
      where: { id: notifAdmin2.id },
    });
    assert(!!admin2DbNotif, "Admin 1 clear-all did NOT affect Admin 2's notifications");

    // ----------------------------------------------------
    // 12. BUSINESS EVENTS TRIGGERING ADMIN NOTIFICATIONS
    // ----------------------------------------------------
    console.log('\n12. Testing System Event Notification Integration...');

    // 12a. Farmer Registration triggers VERIFICATION notification to Admins
    const newFarmerEmail = `event.farmer.${Date.now()}@krishitest.com`;
    const eventFarmerRes = await fetch(`${baseUrl}/api/auth/farmer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Event Trigger Farmer',
        email: newFarmerEmail,
        phone: `+91 9555${String(Date.now()).slice(-6)}`,
        password: 'FarmerPass@123',
        farmName: 'Event Greenery',
        farmLocation: 'Hassan Cluster',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '562114',
        hub: 'West Hub',
      }),
    });
    assert(eventFarmerRes.status === 201, 'Farmer registered successfully via API');

    const eventNotifRes = await fetch(`${baseUrl}/api/admin/notifications?type=VERIFICATION`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const eventNotifData = await eventNotifRes.json();
    const verifNotifFound = eventNotifData.data.some((n) =>
      n.message.includes('Event Trigger Farmer') || n.title.includes('Farmer Verification')
    );
    assert(verifNotifFound, 'Farmer registration automatically triggered VERIFICATION alert to Admin 1');

    // 12b. Dispute Status Update triggers DISPUTE notification
    let testDispute = await prisma.dispute.findFirst({ where: { status: 'OPEN' } });
    if (!testDispute) {
      const existingOrder = await prisma.order.findFirst();
      if (existingOrder) {
        testDispute = await prisma.dispute.create({
          data: {
            orderId: existingOrder.id,
            userId: existingOrder.consumerId,
            productName: 'Tomatoes',
            reason: 'PACKAGING_DAMAGED',
            amount: 50.0,
            description: 'Package was torn during transit',
            status: 'OPEN',
          },
        });
      }
    }

    if (testDispute) {
      // Update dispute status via Admin API
      const disputeUpdateRes = await fetch(`${baseUrl}/api/admin/disputes/${testDispute.id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${admin1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'RESOLVED',
          resolutionNote: 'Refund issued to consumer wallet.',
        }),
      });
      assert(disputeUpdateRes.status === 200, 'Admin resolved dispute via API');

      // Check admin notification created
      const disputeNotifRes = await fetch(`${baseUrl}/api/admin/notifications?type=DISPUTE`, {
        headers: { Authorization: `Bearer ${admin1Token}` },
      });
      const disputeNotifData = await disputeNotifRes.json();
      const disputeNotifFound = disputeNotifData.data.some((n) =>
        n.title.toLowerCase().includes('dispute') && (n.message.toLowerCase().includes('resolved') || n.title.toLowerCase().includes('resolved'))
      );
      assert(disputeNotifFound, 'Dispute resolution automatically triggered DISPUTE notification to Admin');
    }

    // 12c. Product Out-of-Stock update triggers INVENTORY notification
    const testProd = await prisma.product.findFirst();
    if (testProd) {
      const stockRes = await fetch(`${baseUrl}/api/admin/products/${testProd.id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${admin1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'OUT_OF_STOCK',
        }),
      });
      assert(stockRes.status === 200, 'Admin marked product as OUT_OF_STOCK via API');

      const invNotifRes = await fetch(`${baseUrl}/api/admin/notifications?type=INVENTORY`, {
        headers: { Authorization: `Bearer ${admin1Token}` },
      });
      const invNotifData = await invNotifRes.json();
      const invFound = invNotifData.data.some((n) =>
        n.title.includes('Out of Stock') || n.message.includes('OUT_OF_STOCK') || n.message.includes(testProd.name)
      );
      assert(invFound, 'Product out-of-stock update automatically triggered INVENTORY notification to Admin');
    }

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    console.log('\nCleaning up secondary test admin and test entities...');
    await prisma.notification.deleteMany({
      where: { userId: { in: [admin1UserId, admin2UserId] } },
    });
    await prisma.user.delete({
      where: { id: admin2UserId },
    });

    console.log(`\n=== E2E TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED ===\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAdminNotificationsE2ETests();
