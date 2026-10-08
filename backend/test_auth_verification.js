const { createApp } = require('./dist/app');
const { prisma } = require('./dist/db/prisma');
const bcrypt = require('bcrypt');

async function runTests() {
  console.log('--- STARTING BACKEND AUTH & VERIFICATION TESTS ---');
  const app = createApp();

  // Start on an ephemeral port
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Test server running on ${baseUrl}`);

  const testEmailFarmer = `test.farmer.${Date.now()}@example.com`;
  const testEmailAdmin = `test.admin.${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  let farmerToken = '';
  let farmerId = '';
  let farmerUserId = '';
  let adminToken = '';
  let adminUserId = '';

  try {
    // 0. HEALTH CHECK
    console.log('\n[TEST 0] GET /api/health');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    console.log('Health Response:', healthData);
    if (healthData.status !== 'ok') throw new Error('Health check failed');
    console.log('✓ Health check passed');

    // 1. CREATE ADMIN USER IN DATABASE FOR TESTING APPROVAL/REJECTION
    console.log('\n[SETUP] Creating an Admin user for verification tests');
    const adminPasswordHash = await bcrypt.hash(testPassword, 10);
    const adminUser = await prisma.user.create({
      data: {
        email: testEmailAdmin,
        passwordHash: adminPasswordHash,
        name: 'System Admin',
        role: 'ADMIN',
        isActive: true,
      },
    });
    adminUserId = adminUser.id;

    // Generate admin token using jwt utility
    const { generateToken } = require('./dist/utils/jwt');
    adminToken = generateToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });
    console.log(`✓ Admin user created (${adminUserId}) and token generated`);

    // 2. FARMER REGISTRATION
    console.log('\n[TEST 1] POST /api/auth/farmer/register');
    const registerPayload = {
      fullName: 'Gowda Organic Farms',
      email: testEmailFarmer,
      phone: '+91 98450 11223',
      password: testPassword,
      profilePhoto: 'https://images.unsplash.com/photo-1544717305-2782549b5136',
      farmName: 'Gowda Natural Farms',
      farmLocation: 'Survey 14, Haralur Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560102',
      hub: 'HSR Layout',
      farmingMethod: 'Natural (ZBNF)',
      yearsFarming: 6,
      mainCrops: ['Tomatoes', 'Capsicum', 'Palak'],
      farmDescription: 'Practicing pure Subhash Palekar natural farming since 2020.',
      govtIdFileName: 'Aadhaar_Gowda.pdf',
      govtIdFileUrl: 'https://storage.example.com/docs/aadhaar.pdf',
      ownershipDocFileName: 'RTC_Survey14.pdf',
      ownershipDocFileUrl: 'https://storage.example.com/docs/rtc.pdf',
      farmPhotoUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854',
    };

    const regRes = await fetch(`${baseUrl}/api/auth/farmer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload),
    });

    const regData = await regRes.json();
    console.log('Registration Status Code:', regRes.status);
    console.log('Registration Response Summary:', {
      success: regData.success,
      verificationStatus: regData.data?.verificationStatus,
      isVerified: regData.data?.farmer?.isVerified,
      hasToken: !!regData.data?.token,
      userId: regData.data?.user?.id,
      farmerId: regData.data?.farmer?.id,
    });

    if (regRes.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    if (regData.data.verificationStatus !== 'PENDING') throw new Error('Verification status must default to PENDING');
    if (regData.data.farmer.isVerified !== false) throw new Error('isVerified must default to false');
    if (regData.data.user.passwordHash) throw new Error('passwordHash must NEVER be returned in response');

    farmerToken = regData.data.token;
    farmerId = regData.data.farmer.id;
    farmerUserId = regData.data.user.id;

    // Verify documents were created in DB
    const docs = await prisma.farmerDocument.findMany({ where: { farmerId } });
    console.log(`✓ Farmer documents created in DB: count = ${docs.length}`);
    if (docs.length < 3) throw new Error('Expected at least 3 documents to be created');

    // Verify notification was created
    const notifs = await prisma.notification.findMany({ where: { userId: farmerUserId } });
    console.log(`✓ Initial notification created in DB: count = ${notifs.length}`);
    if (notifs.length === 0) throw new Error('Expected registration notification');
    console.log('✓ Farmer registration test PASSED');

    // 3. DUPLICATE REGISTRATION PREVENTION
    console.log('\n[TEST 2] Duplicate Email Registration Prevention');
    const dupRes = await fetch(`${baseUrl}/api/auth/farmer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload),
    });
    const dupData = await dupRes.json();
    console.log('Duplicate Status Code:', dupRes.status);
    if (dupRes.status !== 409) throw new Error('Duplicate email must return 409 Conflict');
    console.log('✓ Duplicate email rejection test PASSED');

    // 4. FARMER LOGIN
    console.log('\n[TEST 3] POST /api/auth/farmer/login');
    // Test with wrong password first
    const badLoginRes = await fetch(`${baseUrl}/api/auth/farmer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmailFarmer, password: 'WrongPassword!' }),
    });
    if (badLoginRes.status !== 401) throw new Error('Wrong password must return 401');
    console.log('✓ Invalid password correctly rejected with 401');

    // Test with valid password
    const loginRes = await fetch(`${baseUrl}/api/auth/farmer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmailFarmer, password: testPassword }),
    });
    const loginData = await loginRes.json();
    console.log('Login Status Code:', loginRes.status);
    console.log('Login Result:', {
      success: loginData.success,
      verificationStatus: loginData.data?.verificationStatus,
      hasToken: !!loginData.data?.token,
    });
    if (loginRes.status !== 200) throw new Error('Valid login must return 200');
    if (!loginData.data.token) throw new Error('Login must return JWT token');
    if (loginData.data.user.passwordHash) throw new Error('Login must not return passwordHash');
    if (loginData.data.verificationStatus !== 'PENDING') throw new Error('Must return PENDING status');
    console.log('✓ Farmer login test PASSED');

    // 5. FARMER STATUS API (GET /api/farmer/status)
    console.log('\n[TEST 4] GET /api/farmer/status (Pending State)');
    const statusRes = await fetch(`${baseUrl}/api/farmer/status`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const statusData = await statusRes.json();
    console.log('Farmer Status Response:', statusData.data);
    if (statusRes.status !== 200) throw new Error('Farmer status must return 200');
    if (statusData.data.verificationStatus !== 'PENDING') throw new Error('Expected PENDING status');
    if (statusData.data.isApproved !== false) throw new Error('isApproved must be false while pending');
    if (statusData.data.isPending !== true) throw new Error('isPending must be true');
    console.log('✓ Farmer status API test PASSED');

    // 6. AUTHORIZATION CHECKS
    console.log('\n[TEST 5] Authorization & Self-Approval Prevention');
    // A farmer must not be able to call admin approval endpoint
    const unauthorizedApproveRes = await fetch(`${baseUrl}/api/admin/farmers/${farmerId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    console.log('Unauthorized Approval Status Code:', unauthorizedApproveRes.status);
    if (unauthorizedApproveRes.status !== 403) throw new Error('Farmer calling admin route must be 403 Forbidden');
    console.log('✓ Non-admin role blocked from approval route');

    // 7. ADMIN GET PENDING FARMERS
    console.log('\n[TEST 6] GET /api/admin/farmers/pending');
    const pendingRes = await fetch(`${baseUrl}/api/admin/farmers/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pendingData = await pendingRes.json();
    console.log(`Pending Farmers Count: ${pendingData.count}`);
    const found = pendingData.data.find((f) => f.id === farmerId);
    if (!found) throw new Error('Registered farmer not found in pending list');
    console.log('✓ Admin pending farmers list test PASSED');

    // 8. ADMIN REJECTION FLOW
    console.log('\n[TEST 7] POST /api/admin/farmers/:farmerId/reject');
    const rejectRes = await fetch(`${baseUrl}/api/admin/farmers/${farmerId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason: 'Aadhaar document scan is blurry. Please re-upload.' }),
    });
    const rejectData = await rejectRes.json();
    console.log('Rejection Response:', {
      success: rejectData.success,
      status: rejectData.data?.verificationStatus,
      rejectionReason: rejectData.data?.rejectionReason,
    });
    if (rejectRes.status !== 200) throw new Error('Admin reject must return 200');
    if (rejectData.data.verificationStatus !== 'REJECTED') throw new Error('Expected status REJECTED');
    if (!rejectData.data.rejectionReason) throw new Error('Expected rejectionReason to be set');

    // Verify farmer status reflects rejection
    const statusAfterReject = await (
      await fetch(`${baseUrl}/api/farmer/status`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      })
    ).json();
    console.log('Status After Reject:', {
      status: statusAfterReject.data.verificationStatus,
      isRejected: statusAfterReject.data.isRejected,
      reason: statusAfterReject.data.rejectionReason,
    });
    if (!statusAfterReject.data.isRejected) throw new Error('isRejected must be true');
    console.log('✓ Admin rejection test PASSED');

    // 9. ADMIN APPROVAL FLOW
    console.log('\n[TEST 8] POST /api/admin/farmers/:farmerId/approve');
    const approveRes = await fetch(`${baseUrl}/api/admin/farmers/${farmerId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const approveData = await approveRes.json();
    console.log('Approval Response:', {
      success: approveData.success,
      status: approveData.data?.verificationStatus,
      isVerified: approveData.data?.isVerified,
      approvedAt: approveData.data?.approvedAt,
      approvedBy: approveData.data?.approvedBy?.name,
    });
    if (approveRes.status !== 200) throw new Error('Admin approve must return 200');
    if (approveData.data.verificationStatus !== 'APPROVED') throw new Error('Expected status APPROVED');
    if (approveData.data.isVerified !== true) throw new Error('Expected isVerified = true');
    if (!approveData.data.approvedAt) throw new Error('Expected approvedAt timestamp');
    if (!approveData.data.approvedBy) throw new Error('Expected approvedBy admin relation');

    // Verify farmer status reflects approval
    const statusAfterApprove = await (
      await fetch(`${baseUrl}/api/farmer/status`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      })
    ).json();
    console.log('Status After Approve:', {
      status: statusAfterApprove.data.verificationStatus,
      isApproved: statusAfterApprove.data.isApproved,
      isVerified: statusAfterApprove.data.isVerified,
      approvedAt: statusAfterApprove.data.approvedAt,
    });
    if (!statusAfterApprove.data.isApproved) throw new Error('isApproved must be true');
    if (!statusAfterApprove.data.isVerified) throw new Error('isVerified must be true');
    console.log('✓ Admin approval test PASSED');

    // 10. VERIFY APPROVAL NOTIFICATION
    const approvalNotifs = await prisma.notification.findMany({
      where: { userId: farmerUserId, title: 'Farmer Profile Approved!' },
    });
    console.log(`✓ Approval notification created in DB: count = ${approvalNotifs.length}`);
    if (approvalNotifs.length === 0) throw new Error('Expected approval notification');

    console.log('\n==================================================');
    console.log('ALL 8 BACKEND AUTH & VERIFICATION TESTS PASSED! 🎉');
    console.log('==================================================');
  } finally {
    // Clean up test records
    console.log('\n[CLEANUP] Cleaning up test records from database...');
    try {
      if (farmerUserId) {
        await prisma.user.delete({ where: { id: farmerUserId } }).catch(() => {});
      }
      if (adminUserId) {
        await prisma.user.delete({ where: { id: adminUserId } }).catch(() => {});
      }
      console.log('✓ Cleanup complete');
    } catch (e) {
      console.warn('Cleanup note:', e.message);
    }
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
