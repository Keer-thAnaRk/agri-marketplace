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

async function runNotificationsTests() {
  console.log('====================================================');
  console.log('=== STARTING FARMER NOTIFICATIONS INTEGRATION TESTS ===');
  console.log('====================================================\n');

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
    // ------------------------------------------------------------------------
    // SETUP ACTORS
    // ------------------------------------------------------------------------
    console.log('0. Setting up test actors in PostgreSQL...');

    // Admin login
    const adminLogin = await makeRequest('POST', '/api/auth/admin/login', {
      email: 'admin@krishimarket.in',
      password: 'admin123',
    });
    assert(adminLogin.status === 200, 'Admin login succeeds (200)');
    const adminToken = adminLogin.data.data.token;

    // Register Farmer 1 (will be approved)
    const farmer1Email = `farmer1.notif.${timestamp}@krishitest.com`;
    const farmer1Reg = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Farmer One Notif',
      email: farmer1Email,
      password: 'FarmerPassword123!',
      phone: `981${String(timestamp).slice(-7)}`,
      farmName: 'Farm One Green Valley',
      farmLocation: 'Mandya Rural, Karnataka',
      city: 'Mandya',
      state: 'Karnataka',
      pincode: '571401',
      mainCrops: ['Organic Tomatoes'],
    });
    assert(farmer1Reg.status === 201, 'Farmer 1 registration succeeds (201)');
    const farmer1Token = farmer1Reg.data.data.token;
    const farmer1FarmerId = farmer1Reg.data.data.farmer.id;
    const farmer1UserId = farmer1Reg.data.data.user.id;

    // Register Farmer 2 (will remain pending)
    const farmer2Email = `farmer2.notif.${timestamp}@krishitest.com`;
    const farmer2Reg = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Farmer Two Notif',
      email: farmer2Email,
      password: 'FarmerPassword123!',
      phone: `982${String(timestamp).slice(-7)}`,
      farmName: 'Farm Two Sun Harvests',
      farmLocation: 'Kolar Rural, Karnataka',
      city: 'Kolar',
      state: 'Karnataka',
      pincode: '563101',
      mainCrops: ['Fresh Spinach'],
    });
    assert(farmer2Reg.status === 201, 'Farmer 2 registration succeeds (201)');
    const farmer2Token = farmer2Reg.data.data.token;
    const farmer2UserId = farmer2Reg.data.data.user.id;

    // Register Farmer 3 (will be rejected)
    const farmer3Email = `farmer3.notif.${timestamp}@krishitest.com`;
    const farmer3Reg = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Farmer Three Notif',
      email: farmer3Email,
      password: 'FarmerPassword123!',
      phone: `983${String(timestamp).slice(-7)}`,
      farmName: 'Farm Three Orchards',
      farmLocation: 'Shimoga, Karnataka',
      city: 'Shimoga',
      state: 'Karnataka',
      pincode: '577201',
      mainCrops: ['Apples'],
    });
    assert(farmer3Reg.status === 201, 'Farmer 3 registration succeeds (201)');
    const farmer3Token = farmer3Reg.data.data.token;
    const farmer3FarmerId = farmer3Reg.data.data.farmer.id;

    // Register Consumer (non-farmer)
    const consumerEmail = `consumer.notif.${timestamp}@krishitest.com`;
    const consumerReg = await makeRequest('POST', '/api/auth/consumer/register', {
      name: 'Regular Consumer',
      email: consumerEmail,
      password: 'ConsumerPassword123!',
      phone: `989${String(timestamp).slice(-7)}`,
    });
    assert(consumerReg.status === 201, 'Consumer registration succeeds (201)');
    const consumerToken = consumerReg.data?.data?.token;

    // Admin approves Farmer 1
    const approveRes = await makeRequest(
      'POST',
      `/api/admin/farmers/${farmer1FarmerId}/approve`,
      { notes: 'Approved for notifications testing' },
      adminToken
    );
    assert(approveRes.status === 200, 'Admin approves Farmer 1 (200)');

    // Admin rejects Farmer 3
    const rejectRes = await makeRequest(
      'POST',
      `/api/admin/farmers/${farmer3FarmerId}/reject`,
      { reason: 'Document photos are blurry and unreadable.' },
      adminToken
    );
    assert(rejectRes.status === 200, 'Admin rejects Farmer 3 (200)');

    console.log('\n--- CRITERION 1: Farmer retrieves own notifications ---');
    const f1NotifsRes = await makeRequest('GET', '/api/farmer/notifications', null, farmer1Token);
    assert(f1NotifsRes.status === 200, 'GET /api/farmer/notifications returns 200 OK');
    assert(f1NotifsRes.data.success === true, 'Response contains success: true');
    assert(Array.isArray(f1NotifsRes.data.data), 'Response data is an array of notifications');
    assert(f1NotifsRes.data.count >= 2, `Farmer 1 has at least 2 notifications (found: ${f1NotifsRes.data.count})`);
    const allBelongToFarmer1 = f1NotifsRes.data.data.every((n) => n.userId === farmer1UserId);
    assert(allBelongToFarmer1, 'All notifications returned belong strictly to Farmer 1 (userId match)');

    console.log('\n--- CRITERION 2: Cross-farmer notification read denied (404/403) ---');
    const farmer1NotifId = f1NotifsRes.data.data[0].id;
    // Farmer 2 attempts to view Farmer 1's notification by ID
    const crossGetRes = await makeRequest(
      'GET',
      `/api/farmer/notifications/${farmer1NotifId}`,
      null,
      farmer2Token
    );
    assert(
      crossGetRes.status === 403 || crossGetRes.status === 404,
      `Cross-farmer GET single notification denied with 403/404 (status: ${crossGetRes.status})`
    );

    // Farmer 2's notification feed must NOT contain Farmer 1's notification
    const f2NotifsRes = await makeRequest('GET', '/api/farmer/notifications', null, farmer2Token);
    assert(f2NotifsRes.status === 200, 'Farmer 2 can retrieve their own notifications');
    const hasF1Notif = f2NotifsRes.data.data.some((n) => n.id === farmer1NotifId);
    assert(!hasF1Notif, 'Farmer 2 notification list does NOT include Farmer 1 notifications');

    console.log('\n--- CRITERION 3: Farmer marks own notification as read ---');
    const targetNotif = f1NotifsRes.data.data.find((n) => !n.isRead) || f1NotifsRes.data.data[0];
    const initialUnreadCount = f1NotifsRes.data.unreadCount;
    const markReadRes = await makeRequest(
      'PATCH',
      `/api/farmer/notifications/${targetNotif.id}/read`,
      {},
      farmer1Token
    );
    assert(markReadRes.status === 200, 'PATCH /api/farmer/notifications/:id/read returns 200 OK');
    assert(markReadRes.data.success === true, 'Mark read response contains success: true');
    assert(markReadRes.data.data.isRead === true, 'Returned notification has isRead: true');

    // Verify persistence in PostgreSQL
    const f1AfterMark = await makeRequest('GET', '/api/farmer/notifications', null, farmer1Token);
    const updatedInList = f1AfterMark.data.data.find((n) => n.id === targetNotif.id);
    assert(updatedInList.isRead === true, 'Notification is persisted as isRead = true in PostgreSQL');
    assert(
      f1AfterMark.data.unreadCount <= initialUnreadCount,
      `Unread count updated in DB (new: ${f1AfterMark.data.unreadCount})`
    );

    console.log('\n--- CRITERION 4: Cross-farmer mark-as-read denied (404/403) ---');
    // Farmer 2 tries to mark Farmer 1's notification as read
    const crossMarkRes = await makeRequest(
      'PATCH',
      `/api/farmer/notifications/${farmer1NotifId}/read`,
      {},
      farmer2Token
    );
    assert(
      crossMarkRes.status === 403 || crossMarkRes.status === 404,
      `Cross-farmer PATCH mark-read rejected with 403/404 (status: ${crossMarkRes.status})`
    );

    console.log('\n--- CRITERION 5: Mark-all-read affects only current farmer ---');
    // Check Farmer 2 has unread notifications
    const f2BeforeAll = await makeRequest('GET', '/api/farmer/notifications', null, farmer2Token);
    const f2UnreadBefore = f2BeforeAll.data.unreadCount;
    assert(f2UnreadBefore > 0, `Farmer 2 has unread notifications before test (${f2UnreadBefore})`);

    // Farmer 1 calls mark-all-read
    const markAllF1 = await makeRequest(
      'POST',
      '/api/farmer/notifications/mark-all-read',
      {},
      farmer1Token
    );
    assert(markAllF1.status === 200, 'Farmer 1 mark-all-read returns 200 OK');
    assert(markAllF1.data.success === true, 'Farmer 1 mark-all-read response success: true');

    // Verify Farmer 1 has 0 unread
    const f1AfterAll = await makeRequest('GET', '/api/farmer/notifications', null, farmer1Token);
    assert(f1AfterAll.data.unreadCount === 0, 'Farmer 1 now has 0 unread notifications in PostgreSQL');
    const allF1Read = f1AfterAll.data.data.every((n) => n.isRead === true);
    assert(allF1Read, 'All Farmer 1 notifications are marked isRead = true');

    // Verify Farmer 2 still has the same unread notifications (UNTOUCHED)
    const f2AfterAll = await makeRequest('GET', '/api/farmer/notifications', null, farmer2Token);
    assert(
      f2AfterAll.data.unreadCount === f2UnreadBefore,
      `Farmer 2 unread notifications remain completely untouched (${f2AfterAll.data.unreadCount})`
    );

    console.log('\n--- CRITERION 6: Unauthenticated request rejected (401) ---');
    const unauthGet = await makeRequest('GET', '/api/farmer/notifications', null, null);
    assert(unauthGet.status === 401, 'Unauthenticated GET /api/farmer/notifications returns 401');

    const unauthPatch = await makeRequest(
      'PATCH',
      `/api/farmer/notifications/${farmer1NotifId}/read`,
      {},
      null
    );
    assert(unauthPatch.status === 401, 'Unauthenticated PATCH :id/read returns 401');

    const unauthPost = await makeRequest(
      'POST',
      '/api/farmer/notifications/mark-all-read',
      {},
      null
    );
    assert(unauthPost.status === 401, 'Unauthenticated POST mark-all-read returns 401');

    console.log('\n--- CRITERION 7: Non-farmer (Consumer) rejected (403) ---');
    const consumerGet = await makeRequest('GET', '/api/farmer/notifications', null, consumerToken);
    assert(consumerGet.status === 403, 'Consumer role GET /api/farmer/notifications returns 403 Forbidden');

    const consumerPatch = await makeRequest(
      'PATCH',
      `/api/farmer/notifications/${farmer1NotifId}/read`,
      {},
      consumerToken
    );
    assert(consumerPatch.status === 403, 'Consumer role PATCH :id/read returns 403 Forbidden');

    const consumerPost = await makeRequest(
      'POST',
      '/api/farmer/notifications/mark-all-read',
      {},
      consumerToken
    );
    assert(consumerPost.status === 403, 'Consumer role POST mark-all-read returns 403 Forbidden');

    console.log('\n--- CRITERION 8: Existing registration/approval notification appears from PostgreSQL ---');
    // Farmer 1 registered -> "Registration Submitted"
    // Farmer 1 approved -> "Farm Profile Approved!"
    const regNotif = f1NotifsRes.data.data.find(
      (n) => n.title.includes('Registration Submitted') || n.title.includes('Registration')
    );
    assert(Boolean(regNotif), 'Registration notification exists in PostgreSQL for Farmer 1');
    if (regNotif) {
      assert(regNotif.type === 'verification', `Registration notification type is 'verification' (got ${regNotif.type})`);
      assert(Boolean(regNotif.timestamp), `Registration notification has formatted timestamp: "${regNotif.timestamp}"`);
    }

    const approveNotif = f1NotifsRes.data.data.find(
      (n) => n.title.includes('Farm Profile Approved') || n.title.includes('Approved')
    );
    assert(Boolean(approveNotif), 'Approval notification exists in PostgreSQL for Farmer 1');
    if (approveNotif) {
      assert(approveNotif.type === 'verification', `Approval notification type is 'verification' (got ${approveNotif.type})`);
      assert(Boolean(approveNotif.message), 'Approval notification contains message');
    }

    console.log('\n--- CRITERION 9: Existing rejection notification appears from PostgreSQL ---');
    // Farmer 3 was rejected by Admin
    const f3NotifsRes = await makeRequest('GET', '/api/farmer/notifications', null, farmer3Token);
    assert(f3NotifsRes.status === 200, 'Rejected farmer can retrieve their notifications (200 OK)');
    const rejectNotif = f3NotifsRes.data.data.find(
      (n) => n.title.includes('Verification Requires Attention') || n.message.includes('blurry')
    );
    assert(Boolean(rejectNotif), 'Admin rejection notification exists in PostgreSQL for Farmer 3');
    if (rejectNotif) {
      assert(
        rejectNotif.message.includes('blurry'),
        `Rejection notification contains admin reason in message: "${rejectNotif.message}"`
      );
    }

    console.log('\n--- CRITERION 10: No localStorage notification data required for normal operation ---');
    // Verify each notification returned has full database fields and does not rely on browser localStorage
    const sample = f1NotifsRes.data.data[0];
    assert(typeof sample.id === 'string' && sample.id.length > 0, 'Notification has DB ID');
    assert(typeof sample.title === 'string' && sample.title.length > 0, 'Notification has DB title');
    assert(typeof sample.message === 'string' && sample.message.length > 0, 'Notification has DB message');
    assert(typeof sample.type === 'string', 'Notification has DB type');
    assert(typeof sample.isRead === 'boolean', 'Notification has DB boolean isRead');
    assert(typeof sample.timestamp === 'string', 'Notification has generated relative timestamp');
    assert(Boolean(sample.createdAt), 'Notification has PostgreSQL ISO createdAt');

    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Unexpected test execution failure:', err);
    process.exit(1);
  }
}

runNotificationsTests();
