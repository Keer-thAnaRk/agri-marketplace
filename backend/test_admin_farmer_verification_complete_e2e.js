const { prisma } = require('./dist/db/prisma');

async function runCompleteFarmerVerificationTests() {
  console.log('=== STARTING COMPLETE ADMIN FARMER VERIFICATION VERIFICATION SUITE ===\n');

  const baseUrl = 'http://localhost:5000';

  let adminToken = '';
  let adminUserId = '';
  let testFarmerId = '';
  let testUserId = '';
  let testFarmerToken = '';
  let consumerToken = '';
  let consumerUserId = '';

  const timestamp = Date.now();
  const testFarmerEmail = `verify.farmer.${timestamp}@krishitest.com`;
  const testConsumerEmail = `verify.consumer.${timestamp}@krishitest.com`;

  try {
    // -------------------------------------------------------------------------
    // Setup: Admin Login
    // -------------------------------------------------------------------------
    console.log('Setup: Authenticating as Admin via POST /api/auth/admin/login...');
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@krishimarket.in',
        password: 'admin123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    if (!adminLoginRes.ok || !adminLoginData.data?.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
    }
    adminToken = adminLoginData.data.token;
    adminUserId = adminLoginData.data.user.id;
    console.log(`   ✓ Admin authenticated: ${adminLoginData.data.user.email} (${adminUserId})\n`);

    // -------------------------------------------------------------------------
    // Setup: Consumer Registration
    // -------------------------------------------------------------------------
    console.log('Setup: Registering regular Consumer...');
    const consumerRegRes = await fetch(`${baseUrl}/api/auth/consumer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Normal Consumer',
        email: testConsumerEmail,
        password: 'Password123!',
      }),
    });
    const consumerRegData = await consumerRegRes.json();
    consumerToken = consumerRegData.data?.token;
    consumerUserId = consumerRegData.data?.user?.id;
    console.log(`   ✓ Consumer created: ${testConsumerEmail} (${consumerUserId})\n`);

    // -------------------------------------------------------------------------
    // Setup: Farmer Registration (PENDING)
    // -------------------------------------------------------------------------
    console.log('Setup: Registering new test Farmer...');
    const farmerRegRes = await fetch(`${baseUrl}/api/auth/farmer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Govindappa Verification Test',
        email: testFarmerEmail,
        phone: '+91 91234 56789',
        password: 'Password123!',
        farmName: 'Govind Organic Estate',
        farmLocation: 'Survey 108, Devanahalli Hub',
        city: 'Bengaluru Rural',
        state: 'Karnataka',
        pincode: '562110',
        hub: 'Devanahalli Hub',
        farmingMethod: 'ZBNF',
        yearsFarming: 12,
        acreage: 6.5,
        mainCrops: ['Ragi', 'Red Rice', 'Pigeon Pea'],
        farmDescription: 'Zero budget natural farming in Devanahalli.',
        govtIdFileName: 'Govind_Aadhaar.pdf',
        govtIdFileUrl: 'https://storage.krishimarket.in/docs/aadhaar_govind.pdf',
        ownershipDocFileName: 'Devanahalli_RTC_108.pdf',
        ownershipDocFileUrl: 'https://storage.krishimarket.in/docs/rtc_govind.pdf',
      }),
    });
    const farmerRegData = await farmerRegRes.json();
    testFarmerId = farmerRegData.data.farmer.id;
    testUserId = farmerRegData.data.user.id;
    testFarmerToken = farmerRegData.data.token;
    console.log(`   ✓ Test Farmer created: ${testFarmerId} (User: ${testUserId})`);
    console.log(`   ✓ Initial Status: ${farmerRegData.data.verificationStatus}\n`);

    // -------------------------------------------------------------------------
    // Test 1: Admin can retrieve pending farmers
    // -------------------------------------------------------------------------
    console.log('Test 1: Admin can retrieve pending farmers via GET /api/admin/farmers/pending...');
    const pendingRes = await fetch(`${baseUrl}/api/admin/farmers/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pendingData = await pendingRes.json();
    if (!pendingRes.ok || !Array.isArray(pendingData.data)) {
      throw new Error(`Failed to get pending farmers: ${JSON.stringify(pendingData)}`);
    }
    console.log(`   ✓ Pass: Admin retrieved ${pendingData.count} pending farmers.`);

    // -------------------------------------------------------------------------
    // Test 2: Pending farmer appears in Admin UI/API
    // -------------------------------------------------------------------------
    console.log('\nTest 2: Verifying pending farmer appears in Admin API list...');
    const foundPending = pendingData.data.find((f) => f.id === testFarmerId);
    if (!foundPending) {
      throw new Error(`Test farmer ${testFarmerId} not found in pending list!`);
    }
    console.log(`   ✓ Pass: Newly registered farmer correctly appears in pending list with farmName: "${foundPending.farmName}".`);

    // -------------------------------------------------------------------------
    // Test 3: Non-admin cannot retrieve protected verification data
    // -------------------------------------------------------------------------
    console.log('\nTest 3: Non-admin (Consumer & Farmer) cannot retrieve protected verification data...');
    const consumerPendingRes = await fetch(`${baseUrl}/api/admin/farmers/pending`, {
      headers: { Authorization: `Bearer ${consumerToken}` },
    });
    if (consumerPendingRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for consumer on /api/admin/farmers/pending, got ${consumerPendingRes.status}`);
    }
    const farmerPendingRes = await fetch(`${baseUrl}/api/admin/farmers/pending`, {
      headers: { Authorization: `Bearer ${testFarmerToken}` },
    });
    if (farmerPendingRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for farmer on /api/admin/farmers/pending, got ${farmerPendingRes.status}`);
    }
    console.log('   ✓ Pass: Both Consumer and Farmer rejected with 403 Forbidden on pending farmers list.');

    // -------------------------------------------------------------------------
    // Test 4: Non-admin cannot approve
    // -------------------------------------------------------------------------
    console.log('\nTest 4: Non-admin cannot approve farmer...');
    const consumerApproveRes = await fetch(`${baseUrl}/api/admin/farmers/${testFarmerId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${consumerToken}` },
    });
    if (consumerApproveRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden on approve by consumer, got ${consumerApproveRes.status}`);
    }
    console.log('   ✓ Pass: Consumer blocked with 403 Forbidden on approve endpoint.');

    // -------------------------------------------------------------------------
    // Test 5: Non-admin cannot reject
    // -------------------------------------------------------------------------
    console.log('\nTest 5: Non-admin cannot reject farmer...');
    const consumerRejectRes = await fetch(`${baseUrl}/api/admin/farmers/${testFarmerId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${consumerToken}`,
      },
      body: JSON.stringify({ reason: 'Malicious rejection attempt' }),
    });
    if (consumerRejectRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden on reject by consumer, got ${consumerRejectRes.status}`);
    }
    console.log('   ✓ Pass: Consumer blocked with 403 Forbidden on reject endpoint.');

    // -------------------------------------------------------------------------
    // Test 8 & 9: Admin can reject & Rejection reason persists
    // -------------------------------------------------------------------------
    console.log('\nTest 8 & 9: Admin can reject farmer and rejection reason persists...');
    const testRejectionReason = 'The uploaded RTC document does not match the applicant name on the survey land record.';
    const adminRejectRes = await fetch(`${baseUrl}/api/admin/farmers/${testFarmerId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason: testRejectionReason }),
    });
    const adminRejectData = await adminRejectRes.json();
    if (!adminRejectRes.ok) {
      throw new Error(`Admin reject failed: ${JSON.stringify(adminRejectData)}`);
    }
    console.log(`   ✓ Pass: Admin reject responded with HTTP 200.`);

    // -------------------------------------------------------------------------
    // Test 11: Rejected farmer remains rejected in PostgreSQL
    // -------------------------------------------------------------------------
    console.log('\nTest 11: Verifying rejected farmer status in PostgreSQL...');
    const dbFarmerRejected = await prisma.farmer.findUnique({
      where: { id: testFarmerId },
      include: { user: { include: { notifications: true } } },
    });
    if (dbFarmerRejected.verificationStatus !== 'REJECTED' || dbFarmerRejected.isVerified !== false) {
      throw new Error(`Expected status REJECTED & isVerified false in DB, got status: ${dbFarmerRejected.verificationStatus}`);
    }
    if (dbFarmerRejected.rejectionReason !== testRejectionReason) {
      throw new Error(`Rejection reason mismatch in DB: "${dbFarmerRejected.rejectionReason}" vs "${testRejectionReason}"`);
    }
    const rejectNotif = dbFarmerRejected.user.notifications.find((n) =>
      n.message.includes('RTC document')
    );
    if (!rejectNotif) {
      throw new Error('Rejection notification not found in farmer notifications table');
    }
    console.log(`   ✓ Pass: PostgreSQL record has verificationStatus = REJECTED, rejectionReason persisted.`);
    console.log(`   ✓ Pass: Rejection notification created for farmer: "${rejectNotif.title}".`);

    // -------------------------------------------------------------------------
    // Test 6 & 7: Admin can approve & Approval persists in PostgreSQL
    // -------------------------------------------------------------------------
    console.log('\nTest 6 & 7: Admin can approve farmer and approval persists in PostgreSQL...');
    const adminApproveRes = await fetch(`${baseUrl}/api/admin/farmers/${testFarmerId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const adminApproveData = await adminApproveRes.json();
    if (!adminApproveRes.ok) {
      throw new Error(`Admin approve failed: ${JSON.stringify(adminApproveData)}`);
    }
    console.log(`   ✓ Pass: Admin approve responded with HTTP 200.`);

    const dbFarmerApproved = await prisma.farmer.findUnique({
      where: { id: testFarmerId },
      include: { user: { include: { notifications: true } } },
    });
    if (dbFarmerApproved.verificationStatus !== 'APPROVED' || dbFarmerApproved.isVerified !== true) {
      throw new Error(`Expected status APPROVED & isVerified true in DB, got status: ${dbFarmerApproved.verificationStatus}`);
    }
    if (!dbFarmerApproved.approvedAt || dbFarmerApproved.approvedById !== adminUserId) {
      throw new Error(`Missing or incorrect approvedAt/approvedById in DB record.`);
    }
    console.log(`   ✓ Pass: PostgreSQL record has verificationStatus = APPROVED, isVerified = true.`);
    console.log(`   ✓ Pass: approvedAt = ${dbFarmerApproved.approvedAt.toISOString()}, approvedById = ${dbFarmerApproved.approvedById}.`);

    // -------------------------------------------------------------------------
    // Test 10: Approval notification is created
    // -------------------------------------------------------------------------
    console.log('\nTest 10: Verifying approval notification is created...');
    const approveNotif = dbFarmerApproved.user.notifications.find((n) =>
      n.title.includes('Approved')
    );
    if (!approveNotif) {
      throw new Error('Approval notification was not found in farmer user notifications');
    }
    console.log(`   ✓ Pass: Approval notification found in PostgreSQL: "${approveNotif.title}".`);

    // -------------------------------------------------------------------------
    // Test 12: Farmer cannot self-approve
    // -------------------------------------------------------------------------
    console.log('\nTest 12: Verifying farmer cannot self-approve...');
    const farmerSelfApproveRes = await fetch(`${baseUrl}/api/admin/farmers/${testFarmerId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testFarmerToken}` },
    });
    if (farmerSelfApproveRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for farmer self-approval attempt, got ${farmerSelfApproveRes.status}`);
    }
    console.log('   ✓ Pass: Farmer self-approval attempt blocked with 403 Forbidden.');

    // -------------------------------------------------------------------------
    // Test 13: Farmer cannot modify verification status via PATCH /api/farmer/profile
    // -------------------------------------------------------------------------
    console.log('\nTest 13: Farmer cannot modify verification status via profile update...');
    const farmerTamperRes = await fetch(`${baseUrl}/api/farmer/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testFarmerToken}`,
      },
      body: JSON.stringify({
        farmName: 'Govind Tamper Test Farm',
        verificationStatus: 'REJECTED',
        isVerified: false,
      }),
    });
    const farmerTamperData = await farmerTamperRes.json();
    // Verify that the farmer profile still has APPROVED & isVerified true in DB
    const dbFarmerAfterTamper = await prisma.farmer.findUnique({
      where: { id: testFarmerId },
    });
    if (dbFarmerAfterTamper.verificationStatus !== 'APPROVED' || dbFarmerAfterTamper.isVerified !== true) {
      throw new Error('Farmer managed to tamper with verificationStatus via profile API!');
    }
    console.log('   ✓ Pass: Tampering attempt ignored; verificationStatus remains APPROVED in PostgreSQL.');

    // -------------------------------------------------------------------------
    // Test 14: Duplicate approve/reject requests are safely handled
    // -------------------------------------------------------------------------
    console.log('\nTest 14: Testing duplicate approval request is safely handled...');
    const duplicateApproveRes = await fetch(`${baseUrl}/api/admin/farmers/${testFarmerId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const duplicateApproveData = await duplicateApproveRes.json();
    if (!duplicateApproveRes.ok) {
      throw new Error(`Duplicate approve failed: ${JSON.stringify(duplicateApproveData)}`);
    }
    console.log(`   ✓ Pass: Duplicate approve handled idempotently without error.`);

    console.log('\n========================================================================');
    console.log('✓ ALL 14 FARMER VERIFICATION WORKFLOW INTEGRATION TESTS PASSED!');
    console.log('========================================================================\n');
  } finally {
    // Cleanup
    console.log('[CLEANUP] Cleaning up test records from database...');
    try {
      if (testFarmerId) {
        await prisma.farmerDocument.deleteMany({ where: { farmerId: testFarmerId } });
        await prisma.notification.deleteMany({ where: { userId: testUserId } });
        await prisma.farmer.deleteMany({ where: { id: testFarmerId } });
        await prisma.user.deleteMany({ where: { id: testUserId } });
      }
      if (consumerUserId) {
        await prisma.notification.deleteMany({ where: { userId: consumerUserId } });
        await prisma.user.delete({ where: { id: consumerUserId } });
      }
      console.log('✓ Cleanup completed.');
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
    await prisma.$disconnect();
  }
}

runCompleteFarmerVerificationTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
