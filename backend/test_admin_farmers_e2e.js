const { prisma } = require('./dist/db/prisma');

async function runAdminFarmerE2ETests() {
  console.log('=== STARTING ADMIN FARMER MANAGEMENT E2E INTEGRATION TESTS ===\n');

  const baseUrl = 'http://localhost:5000';

  let adminToken = '';
  let testFarmerId = '';
  let testUserId = '';
  let consumerToken = '';

  const timestamp = Date.now();
  const testFarmerEmail = `e2e.farmer.${timestamp}@krishitest.com`;
  const testConsumerEmail = `e2e.consumer.${timestamp}@krishitest.com`;

  try {
    // 1. Admin Authentication
    console.log('1. Authenticating as Admin via POST /api/auth/admin/login...');
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
    console.log(`   ✓ Admin authenticated successfully. User: ${adminLoginData.data.user.email}`);

    // 2. Fetch all farmers from PostgreSQL
    console.log('\n2. Testing GET /api/admin/farmers...');
    const allFarmersRes = await fetch(`${baseUrl}/api/admin/farmers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const allFarmersData = await allFarmersRes.json();
    if (!allFarmersRes.ok) throw new Error(`GET /api/admin/farmers failed: ${JSON.stringify(allFarmersData)}`);
    console.log(`   ✓ Retrieved ${allFarmersData.count} farmers from PostgreSQL.`);
    if (allFarmersData.data.length > 0) {
      const sample = allFarmersData.data[0];
      console.log(`   ✓ Sample farmer: "${sample.user?.name}" (${sample.farmName}) - Status: ${sample.verificationStatus}`);
      if (!sample.id || !sample.user?.email) throw new Error('Farmer object missing id or user.email');
    }

    // 3. Register a test farmer for full lifecycle test
    console.log('\n3. Registering test farmer (expect status PENDING)...');
    const registerRes = await fetch(`${baseUrl}/api/auth/farmer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Ramesh Patel E2E',
        email: testFarmerEmail,
        phone: '+91 98765 43210',
        password: 'Password123!',
        profilePhoto: 'https://images.unsplash.com/photo-1544717305-2782549b5136',
        farmName: 'Patel Bio Farm',
        farmLocation: 'Survey 42, Nelamangala',
        city: 'Bengaluru Rural',
        state: 'Karnataka',
        pincode: '562123',
        hub: 'Nelamangala Hub',
        farmingMethod: 'Organic Farming',
        yearsFarming: 8,
        mainCrops: ['Tomatoes', 'Carrots', 'Spinach'],
        farmDescription: 'Certified organic vegetable farm operating since 2018.',
        govtIdFileName: 'Aadhaar_Card_Ramesh.pdf',
        govtIdFileUrl: 'https://storage.krishimarket.in/docs/aadhaar.pdf',
        ownershipDocFileName: 'Land_Pattadar_Passbook.pdf',
        ownershipDocFileUrl: 'https://storage.krishimarket.in/docs/land.pdf',
        farmPhotoUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854',
      }),
    });
    const registerData = await registerRes.json();
    if (!registerRes.ok) throw new Error(`Registration failed: ${JSON.stringify(registerData)}`);
    testFarmerId = registerData.data.farmer.id;
    testUserId = registerData.data.user.id;
    console.log(`   ✓ Test farmer created: ${testFarmerId} (User: ${testUserId})`);
    console.log(`   ✓ Verification status: ${registerData.data.verificationStatus}`);

    // 4. Test GET /api/admin/farmers/pending includes test farmer
    console.log('\n4. Testing GET /api/admin/farmers/pending...');
    const pendingRes = await fetch(`${baseUrl}/api/admin/farmers/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pendingData = await pendingRes.json();
    if (!pendingRes.ok) throw new Error(`GET pending failed: ${JSON.stringify(pendingData)}`);
    const foundInPending = pendingData.data.some((f) => f.id === testFarmerId);
    if (!foundInPending) throw new Error(`New farmer ${testFarmerId} not found in pending list!`);
    console.log(`   ✓ Test farmer correctly found in pending list (${pendingData.count} total pending).`);

    // 5. Test GET /api/admin/farmers/:farmerId for test farmer
    console.log(`\n5. Testing GET /api/admin/farmers/${testFarmerId}...`);
    const detailRes = await fetch(`${baseUrl}/api/admin/farmers/${testFarmerId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const detailData = await detailRes.json();
    if (!detailRes.ok) throw new Error(`GET farmer detail failed: ${JSON.stringify(detailData)}`);
    const f = detailData.data;
    console.log(`   ✓ Farmer retrieved: ${f.user.name}`);
    console.log(`   ✓ Farm: ${f.farmName} in ${f.city}, ${f.state}`);
    console.log(`   ✓ Farming method: ${f.farmingMethod}, crops: ${f.mainCrops.join(', ')}`);
    console.log(`   ✓ Verification documents attached: ${f.verificationDocuments?.length || 0}`);
    console.log('   Documents:', JSON.stringify(f.verificationDocuments, null, 2));
    if (!f.verificationDocuments || f.verificationDocuments.length < 3) {
      throw new Error(`Expected at least 3 documents, got ${f.verificationDocuments?.length}`);
    }
    const govtIdDoc = f.verificationDocuments.find((d) => d.type === 'GOVERNMENT_ID');
    if (!govtIdDoc || !govtIdDoc.fileName || !govtIdDoc.fileUrl) {
      throw new Error(`Govt ID document missing or incomplete in response: ${JSON.stringify(govtIdDoc)}`);
    }
    console.log(`   ✓ Document verified: [${govtIdDoc.type}] "${govtIdDoc.title}" (${govtIdDoc.fileName})`);

    // 6. Test POST /api/admin/farmers/:farmerId/reject
    console.log(`\n6. Testing POST /api/admin/farmers/${testFarmerId}/reject...`);
    const rejectionReason = 'Uploaded ID card is illegible. Please submit a clearer color scan.';
    const rejectRes = await fetch(`${baseUrl}/api/admin/farmers/${testFarmerId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason: rejectionReason }),
    });
    const rejectData = await rejectRes.json();
    if (!rejectRes.ok) throw new Error(`Rejection failed: ${JSON.stringify(rejectData)}`);
    const rejectFarmerRecord = rejectData.data;
    if (rejectFarmerRecord.verificationStatus !== 'REJECTED' || rejectFarmerRecord.rejectionReason !== rejectionReason) {
      throw new Error(`Unexpected rejection result: ${JSON.stringify(rejectData)}`);
    }
    console.log(`   ✓ Farmer successfully rejected. Status: ${rejectFarmerRecord.verificationStatus}`);
    console.log(`   ✓ Rejection reason: "${rejectFarmerRecord.rejectionReason}"`);

    // Verify rejection in DB
    const dbFarmerAfterReject = await prisma.farmer.findUnique({
      where: { id: testFarmerId },
      include: { user: { include: { notifications: true } } },
    });
    if (dbFarmerAfterReject.verificationStatus !== 'REJECTED' || dbFarmerAfterReject.isVerified !== false) {
      throw new Error('Database farmer record verificationStatus did not update to REJECTED');
    }
    const rejectNotification = dbFarmerAfterReject.user.notifications.find((n) =>
      n.message.includes('illegible')
    );
    if (!rejectNotification) throw new Error('Rejection notification was not recorded in DB');
    console.log(`   ✓ Database record verified: verificationStatus = REJECTED, isVerified = false`);
    console.log(`   ✓ Farmer notification confirmed: "${rejectNotification.title}"`);

    // 7. Test POST /api/admin/farmers/:farmerId/approve
    console.log(`\n7. Testing POST /api/admin/farmers/${testFarmerId}/approve...`);
    const approveRes = await fetch(`${baseUrl}/api/admin/farmers/${testFarmerId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok) throw new Error(`Approval failed: ${JSON.stringify(approveData)}`);
    const approveFarmerRecord = approveData.data;
    if (approveFarmerRecord.verificationStatus !== 'APPROVED' || approveFarmerRecord.isVerified !== true) {
      throw new Error(`Unexpected approval result: ${JSON.stringify(approveData)}`);
    }
    console.log(`   ✓ Farmer successfully approved. Status: ${approveFarmerRecord.verificationStatus}`);
    console.log(`   ✓ Approved At: ${approveFarmerRecord.approvedAt}, Approved By: ${approveFarmerRecord.approvedById}`);

    // Verify approval in DB
    const dbFarmerAfterApprove = await prisma.farmer.findUnique({
      where: { id: testFarmerId },
      include: { user: { include: { notifications: true } } },
    });
    if (dbFarmerAfterApprove.verificationStatus !== 'APPROVED' || dbFarmerAfterApprove.isVerified !== true) {
      throw new Error('Database farmer record verificationStatus did not update to APPROVED');
    }
    if (!dbFarmerAfterApprove.approvedAt || !dbFarmerAfterApprove.approvedById) {
      throw new Error('Database farmer record missing approvedAt or approvedById');
    }
    console.log(`   ✓ Database record verified: verificationStatus = APPROVED, isVerified = true`);
    console.log(`   ✓ approvedAt and approvedById timestamps correctly written to PostgreSQL`);

    // 8. Test Role Authorization Protection (Non-admin receives 403)
    console.log('\n8. Testing Role Authorization Protection for Non-Admin...');
    const regConsumerRes = await fetch(`${baseUrl}/api/auth/consumer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Regular Consumer',
        email: testConsumerEmail,
        password: 'Password123!',
      }),
    });
    const regConsumerData = await regConsumerRes.json();
    consumerToken = regConsumerData.data?.token;

    const unauthorizedRes = await fetch(`${baseUrl}/api/admin/farmers`, {
      headers: { Authorization: `Bearer ${consumerToken}` },
    });
    if (unauthorizedRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for non-admin on /api/admin/farmers, got ${unauthorizedRes.status}`);
    }
    console.log(`   ✓ Consumer blocked with 403 Forbidden on GET /api/admin/farmers`);

    const unauthorizedApproveRes = await fetch(`${baseUrl}/api/admin/farmers/${testFarmerId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${consumerToken}` },
    });
    if (unauthorizedApproveRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for non-admin on approve, got ${unauthorizedApproveRes.status}`);
    }
    console.log(`   ✓ Consumer blocked with 403 Forbidden on POST /api/admin/farmers/:farmerId/approve`);

    console.log('\n================================================================');
    console.log('✓ ALL ADMIN FARMER MANAGEMENT E2E INTEGRATION TESTS PASSED!');
    console.log('================================================================\n');
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
      if (testConsumerEmail) {
        const cUser = await prisma.user.findUnique({ where: { email: testConsumerEmail } });
        if (cUser) {
          await prisma.notification.deleteMany({ where: { userId: cUser.id } });
          await prisma.user.delete({ where: { id: cUser.id } });
        }
      }
      console.log('✓ Cleanup completed.');
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
    await prisma.$disconnect();
  }
}

runAdminFarmerE2ETests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
