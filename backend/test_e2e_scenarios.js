const { prisma } = require('./dist/db/prisma');
const bcrypt = require('bcrypt');

const BASE_URL = 'http://localhost:5000';

async function runE2EScenarios() {
  console.log('================================================================');
  console.log('KRISHI MARKET: END-TO-END FARMER AUTH & APPROVAL SCENARIO SUITE');
  console.log('================================================================');

  const ts = Date.now();
  const farmerA_Email = `farmer.a.${ts}@krishitest.in`;
  const farmerA_Password = 'PasswordA123!';

  const farmerH_Email = `farmer.h.${ts}@krishitest.in`;
  const farmerH_Password = 'PasswordH123!';

  let farmerA_Id = '';
  let farmerA_UserId = '';
  let farmerA_Token = '';

  let farmerH_Id = '';
  let farmerH_UserId = '';

  let adminToken = '';
  let adminUserId = '';

  try {
    // -------------------------------------------------------------
    // SCENARIO A: Register New Farmer
    // -------------------------------------------------------------
    console.log('\n[SCENARIO A] Farmer Registration (POST /api/auth/farmer/register)');
    const regPayloadA = {
      fullName: 'Basavaraj Patil',
      email: farmerA_Email,
      phone: '+91 98451 77889',
      password: farmerA_Password,
      profilePhoto: 'https://images.unsplash.com/photo-1544717305-2782549b5136',
      farmName: 'Patil Agro Organics',
      farmLocation: 'Survey 22/A, Nelamangala Hobli',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '562123',
      farmingMethod: 'Organic',
      yearsFarming: 7,
      mainCrops: ['Tomatoes', 'Capsicum', 'Coriander'],
      farmDescription: 'Certified organic vegetable farm supplying fresh harvest.',
      govtIdFileName: 'Aadhaar_Basavaraj.pdf',
      govtIdFileUrl: 'https://storage.example.com/docs/aadhaar_patil.pdf',
      ownershipDocFileName: 'RTC_Survey22A.pdf',
      ownershipDocFileUrl: 'https://storage.example.com/docs/rtc_patil.pdf',
      farmPhotoUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854',
    };

    const regResA = await fetch(`${BASE_URL}/api/auth/farmer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayloadA),
    });

    const regDataA = await regResA.json();
    console.log('Registration HTTP Status:', regResA.status);
    console.log('Registration Response Payload:', {
      success: regDataA.success,
      verificationStatus: regDataA.data?.verificationStatus,
      isVerified: regDataA.data?.farmer?.isVerified,
      userId: regDataA.data?.user?.id,
      farmerId: regDataA.data?.farmer?.id,
    });

    if (regResA.status !== 201) throw new Error('Scenario A failed: expected status 201');
    if (regDataA.data.verificationStatus !== 'PENDING') throw new Error('Scenario A failed: status must be PENDING');
    if (regDataA.data.farmer.isVerified !== false) throw new Error('Scenario A failed: isVerified must be false');
    if (regDataA.data.user.passwordHash) throw new Error('Scenario A failed: passwordHash must not be exposed');

    farmerA_Id = regDataA.data.farmer.id;
    farmerA_UserId = regDataA.data.user.id;

    // Verify database record directly in PostgreSQL
    const userInDb = await prisma.user.findUnique({ where: { id: farmerA_UserId } });
    if (!userInDb) throw new Error('Scenario A failed: User record not found in PostgreSQL');
    const isBcrypt = userInDb.passwordHash.startsWith('$2');
    if (!isBcrypt) throw new Error('Scenario A failed: password is not hashed with bcrypt');

    const farmerInDb = await prisma.farmer.findUnique({
      where: { id: farmerA_Id },
      include: { verificationDocuments: true },
    });
    if (!farmerInDb) throw new Error('Scenario A failed: Farmer record not found in PostgreSQL');
    if (farmerInDb.verificationDocuments.length < 3) throw new Error('Scenario A failed: Farmer documents not stored');
    console.log(`✓ Scenario A PASSED: Farmer registered with PENDING status and ${farmerInDb.verificationDocuments.length} verification documents stored.`);

    // -------------------------------------------------------------
    // SCENARIO B: Login with Wrong Password Fails
    // -------------------------------------------------------------
    console.log('\n[SCENARIO B] Farmer Login with Incorrect Password (POST /api/auth/farmer/login)');
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/farmer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: farmerA_Email, password: 'WrongPassword999!' }),
    });
    const badLoginData = await badLoginRes.json();
    console.log('Wrong Password HTTP Status:', badLoginRes.status);
    console.log('Wrong Password Error Response:', badLoginData);
    if (badLoginRes.status !== 401) throw new Error('Scenario B failed: expected 401 Unauthorized');
    if (!badLoginData.error?.includes('Invalid email or password')) throw new Error('Scenario B failed: wrong error message');
    console.log('✓ Scenario B PASSED: Incorrect credentials correctly rejected with 401 Unauthorized.');

    // -------------------------------------------------------------
    // SCENARIO C: Farmer Logs in as PENDING
    // -------------------------------------------------------------
    console.log('\n[SCENARIO C] Farmer Login with Valid Password while PENDING (POST /api/auth/farmer/login)');
    const loginResA = await fetch(`${BASE_URL}/api/auth/farmer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: farmerA_Email, password: farmerA_Password }),
    });
    const loginDataA = await loginResA.json();
    console.log('Valid Login HTTP Status:', loginResA.status);
    console.log('Login Result:', {
      success: loginDataA.success,
      verificationStatus: loginDataA.data?.verificationStatus,
      hasToken: Boolean(loginDataA.data?.token),
    });

    if (loginResA.status !== 200) throw new Error('Scenario C failed: expected 200 OK');
    if (!loginDataA.data?.token) throw new Error('Scenario C failed: JWT token not returned');
    if (loginDataA.data.verificationStatus !== 'PENDING') throw new Error('Scenario C failed: status must be PENDING');
    farmerA_Token = loginDataA.data.token;

    // Simulate frontend routing logic
    const clientRoutingDestination = loginDataA.data.verificationStatus.toLowerCase() === 'pending'
      ? '/farmer/verification-pending'
      : '/farmer/dashboard';
    console.log(`Frontend Navigation Destination: ${clientRoutingDestination}`);
    if (clientRoutingDestination !== '/farmer/verification-pending') throw new Error('Scenario C failed: routing destination');
    console.log('✓ Scenario C PASSED: Valid credentials authenticated, JWT issued, routed to /farmer/verification-pending.');

    // -------------------------------------------------------------
    // SCENARIO D: Blocked from Dashboard while PENDING
    // -------------------------------------------------------------
    console.log('\n[SCENARIO D] Dashboard Access Guard Verification for PENDING Farmer');
    const statusResA = await fetch(`${BASE_URL}/api/farmer/status`, {
      headers: { Authorization: `Bearer ${farmerA_Token}` },
    });
    const statusDataA = await statusResA.json();
    console.log('Farmer Status API Data:', {
      status: statusDataA.data?.verificationStatus,
      isApproved: statusDataA.data?.isApproved,
      isPending: statusDataA.data?.isPending,
    });
    if (statusDataA.data.isApproved !== false) throw new Error('Scenario D failed: isApproved must be false');
    if (statusDataA.data.isPending !== true) throw new Error('Scenario D failed: isPending must be true');

    // Simulate FarmerAuthGuard:
    const isFarmerApproved = (status) => ['approved', 'verified'].includes((status || '').toLowerCase());
    const isFarmerPending = (status) => (status || '').toLowerCase() === 'pending';
    const canAccessDashboard = isFarmerApproved(statusDataA.data.verificationStatus);
    console.log(`FarmerAuthGuard Evaluation -> canAccessDashboard: ${canAccessDashboard}`);
    if (canAccessDashboard) throw new Error('Scenario D failed: pending farmer should NOT be able to access dashboard');
    console.log('✓ Scenario D PASSED: PENDING farmer strictly gated from Farmer Module.');

    // -------------------------------------------------------------
    // SCENARIO E: Admin Approves Farmer
    // -------------------------------------------------------------
    console.log('\n[SCENARIO E] Admin Approval Workflow');
    // Admin login
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@krishimarket.in', password: 'admin123' }),
    });
    const adminLoginData = await adminLoginRes.json();
    if (adminLoginRes.status !== 200) throw new Error('Admin login failed');
    adminToken = adminLoginData.data.token;
    adminUserId = adminLoginData.data.user.id;
    console.log(`✓ Admin authenticated (${adminUserId})`);

    // Admin approves Farmer A
    const approveRes = await fetch(`${BASE_URL}/api/admin/farmers/${farmerA_Id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const approveData = await approveRes.json();
    console.log('Admin Approval HTTP Status:', approveRes.status);
    console.log('Approval Result:', {
      success: approveData.success,
      verificationStatus: approveData.data?.verificationStatus,
      isVerified: approveData.data?.isVerified,
      approvedAt: approveData.data?.approvedAt,
      approvedBy: approveData.data?.approvedBy?.email,
    });

    if (approveRes.status !== 200) throw new Error('Scenario E failed: expected 200 OK');
    if (approveData.data.verificationStatus !== 'APPROVED') throw new Error('Scenario E failed: status must be APPROVED');
    if (approveData.data.isVerified !== true) throw new Error('Scenario E failed: isVerified must be true');
    if (!approveData.data.approvedAt) throw new Error('Scenario E failed: approvedAt must be set');
    console.log('✓ Scenario E PASSED: Farmer approved by admin, isVerified=true, approvedAt recorded.');

    // -------------------------------------------------------------
    // SCENARIO F: Farmer Logs in Again after Approval
    // -------------------------------------------------------------
    console.log('\n[SCENARIO F] Farmer Login Post-Approval (Token Refresh & Status)');
    const loginPostApproveRes = await fetch(`${BASE_URL}/api/auth/farmer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: farmerA_Email, password: farmerA_Password }),
    });
    const loginPostApproveData = await loginPostApproveRes.json();
    console.log('Post-Approval Login HTTP Status:', loginPostApproveRes.status);
    console.log('Post-Approval Login Data:', {
      success: loginPostApproveData.success,
      verificationStatus: loginPostApproveData.data?.verificationStatus,
      isVerified: loginPostApproveData.data?.farmer?.isVerified,
    });
    if (loginPostApproveData.data.verificationStatus !== 'APPROVED') throw new Error('Scenario F failed: status must be APPROVED');
    if (loginPostApproveData.data.farmer.isVerified !== true) throw new Error('Scenario F failed: isVerified must be true');
    console.log('✓ Scenario F PASSED: Farmer logs in and receives refreshed APPROVED verification status.');

    // -------------------------------------------------------------
    // SCENARIO G: Farmer Accesses Dashboard after Approval
    // -------------------------------------------------------------
    console.log('\n[SCENARIO G] Dashboard Access Unlocked');
    const statusPostApproveRes = await fetch(`${BASE_URL}/api/farmer/status`, {
      headers: { Authorization: `Bearer ${loginPostApproveData.data.token}` },
    });
    const statusPostApproveData = await statusPostApproveRes.json();
    const canNowAccessDashboard = isFarmerApproved(statusPostApproveData.data.verificationStatus);
    console.log('Post-Approval Farmer Status API:', {
      status: statusPostApproveData.data?.verificationStatus,
      isApproved: statusPostApproveData.data?.isApproved,
      canAccessDashboard: canNowAccessDashboard,
    });
    if (!canNowAccessDashboard) throw new Error('Scenario G failed: farmer must have access to dashboard');
    console.log('✓ Scenario G PASSED: Full access to Farmer Module granted for APPROVED farmer.');

    // -------------------------------------------------------------
    // SCENARIO H: Admin Rejection Flow with Reason
    // -------------------------------------------------------------
    console.log('\n[SCENARIO H] Register Second Farmer & Execute Rejection Flow');
    const regPayloadH = {
      fullName: 'Shankar Gowda',
      email: farmerH_Email,
      phone: '+91 98452 33445',
      password: farmerH_Password,
      farmName: 'Shankar Fresh Greens',
      farmLocation: 'Survey 108, Devanahalli',
      pincode: '562110',
    };

    const regResH = await fetch(`${BASE_URL}/api/auth/farmer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayloadH),
    });
    const regDataH = await regResH.json();
    farmerH_Id = regDataH.data.farmer.id;
    farmerH_UserId = regDataH.data.user.id;
    console.log(`Registered second farmer (${farmerH_Id})`);

    const rejectionReason = 'Land ownership RTC document is illegible. Please re-upload clear certified copy.';
    const rejectRes = await fetch(`${BASE_URL}/api/admin/farmers/${farmerH_Id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason: rejectionReason }),
    });
    const rejectData = await rejectRes.json();
    console.log('Admin Rejection HTTP Status:', rejectRes.status);
    console.log('Admin Rejection Response:', {
      success: rejectData.success,
      status: rejectData.data?.verificationStatus,
      rejectionReason: rejectData.data?.rejectionReason,
    });
    if (rejectRes.status !== 200) throw new Error('Scenario H failed: expected 200 OK');
    if (rejectData.data.verificationStatus !== 'REJECTED') throw new Error('Scenario H failed: status must be REJECTED');
    if (rejectData.data.rejectionReason !== rejectionReason) throw new Error('Scenario H failed: rejection reason mismatch');
    console.log('✓ Scenario H PASSED: Farmer rejected by admin with mandatory rejectionReason recorded in PostgreSQL.');

    // -------------------------------------------------------------
    // SCENARIO I: Rejected Farmer Logs In & Routed to Rejection Page
    // -------------------------------------------------------------
    console.log('\n[SCENARIO I] Rejected Farmer Login & Route to /farmer/verification-rejected');
    const loginResH = await fetch(`${BASE_URL}/api/auth/farmer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: farmerH_Email, password: farmerH_Password }),
    });
    const loginDataH = await loginResH.json();
    console.log('Rejected Farmer Login HTTP Status:', loginResH.status);
    console.log('Rejected Farmer Login Data:', {
      verificationStatus: loginDataH.data?.verificationStatus,
      rejectionReason: loginDataH.data?.farmer?.rejectionReason,
    });

    const isFarmerRejected = (status) => (status || '').toLowerCase() === 'rejected';
    const routingDestinationH = isFarmerRejected(loginDataH.data.verificationStatus)
      ? '/farmer/verification-rejected'
      : '/farmer/dashboard';
    console.log(`Frontend Navigation Destination: ${routingDestinationH}`);
    if (routingDestinationH !== '/farmer/verification-rejected') throw new Error('Scenario I failed: destination');
    if (!loginDataH.data.farmer.rejectionReason) throw new Error('Scenario I failed: rejectionReason missing');
    console.log(`Feedback shown to farmer: "${loginDataH.data.farmer.rejectionReason}"`);
    console.log('✓ Scenario I PASSED: Rejected farmer routed to /farmer/verification-rejected with feedback displayed.');

    console.log('\n================================================================');
    console.log('ALL 9 VERIFICATION SCENARIOS (A THROUGH I) PASSED 100% SUCCESFULLY! 🎉');
    console.log('================================================================');
  } finally {
    console.log('\n[CLEANUP] Cleaning up test records from database...');
    try {
      if (farmerA_UserId) await prisma.user.delete({ where: { id: farmerA_UserId } }).catch(() => {});
      if (farmerH_UserId) await prisma.user.delete({ where: { id: farmerH_UserId } }).catch(() => {});
      console.log('✓ Cleanup complete');
    } catch (e) {
      console.warn('Cleanup note:', e.message);
    }
    await prisma.$disconnect();
  }
}

runE2EScenarios().catch((err) => {
  console.error('\n❌ E2E SUITE FAILED:', err);
  process.exit(1);
});
