const { prisma } = require('./dist/db/prisma');

async function runAdminUsersE2ETests() {
  console.log('=== STARTING ADMIN USER MANAGEMENT E2E INTEGRATION TESTS ===\n');

  const baseUrl = 'http://localhost:5000';

  let adminToken = '';
  let adminUserId = '';
  let testConsumerUserId = '';
  let consumerToken = '';

  const timestamp = Date.now();
  const testConsumerEmail = `e2e.consumer.users.${timestamp}@krishitest.com`;

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
    adminUserId = adminLoginData.data.user.id;
    console.log(`   ✓ Admin authenticated successfully. ID: ${adminUserId}, Email: ${adminLoginData.data.user.email}`);

    // Register a test consumer user for testing status changes
    console.log('\n2. Registering test consumer user for status lifecycle tests...');
    const regRes = await fetch(`${baseUrl}/api/auth/consumer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Test Consumer ${timestamp}`,
        email: testConsumerEmail,
        password: 'Password123!',
        phone: '+91 99887 76655',
      }),
    });
    const regData = await regRes.json();
    if (!regRes.ok || !regData.data?.user?.id) {
      throw new Error(`Consumer registration failed: ${JSON.stringify(regData)}`);
    }
    testConsumerUserId = regData.data.user.id;
    consumerToken = regData.data.token;
    console.log(`   ✓ Test consumer created with ID: ${testConsumerUserId}`);

    // 3. Test listing all users
    console.log('\n3. Testing GET /api/admin/users (listing all platform users)...');
    const allUsersRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const allUsersData = await allUsersRes.json();
    if (!allUsersRes.ok || !allUsersData.success) {
      throw new Error(`GET /api/admin/users failed: ${JSON.stringify(allUsersData)}`);
    }
    console.log(`   ✓ Total users in database: ${allUsersData.pagination?.total || allUsersData.data.length}`);
    if (!Array.isArray(allUsersData.data) || allUsersData.data.length === 0) {
      throw new Error('Expected at least 1 user in the database.');
    }

    // Verify user list includes multiple roles
    const rolesPresent = new Set(allUsersData.data.map((u) => u.role));
    console.log(`   ✓ Roles found in response sample: ${Array.from(rolesPresent).join(', ')}`);

    // Verify sensitive data is NOT present in list
    for (const u of allUsersData.data) {
      if ('passwordHash' in u || 'password' in u) {
        throw new Error(`Security breach: passwordHash exposed in user listing for user ${u.id}`);
      }
    }
    console.log('   ✓ Security check passed: passwordHash is NOT exposed in user listing.');

    // 4. Test filtering by role
    console.log('\n4. Testing GET /api/admin/users?role=FARMER...');
    const farmerRoleRes = await fetch(`${baseUrl}/api/admin/users?role=FARMER`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const farmerRoleData = await farmerRoleRes.json();
    if (!farmerRoleRes.ok || !farmerRoleData.success) {
      throw new Error(`Filter by role=FARMER failed: ${JSON.stringify(farmerRoleData)}`);
    }
    for (const u of farmerRoleData.data) {
      if (u.role !== 'FARMER') throw new Error(`Role filter returned non-FARMER user: ${u.role}`);
    }
    console.log(`   ✓ Retrieved ${farmerRoleData.data.length} farmers; all have role FARMER.`);

    console.log('   Testing GET /api/admin/users?role=ADMIN...');
    const adminRoleRes = await fetch(`${baseUrl}/api/admin/users?role=ADMIN`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminRoleData = await adminRoleRes.json();
    if (!adminRoleRes.ok || !adminRoleData.success) {
      throw new Error(`Filter by role=ADMIN failed: ${JSON.stringify(adminRoleData)}`);
    }
    for (const u of adminRoleData.data) {
      if (u.role !== 'ADMIN') throw new Error(`Role filter returned non-ADMIN user: ${u.role}`);
    }
    console.log(`   ✓ Retrieved ${adminRoleData.data.length} admins; all have role ADMIN.`);

    // 5. Test search filter
    console.log('\n5. Testing search filter via GET /api/admin/users?search=...');
    const searchRes = await fetch(`${baseUrl}/api/admin/users?search=${encodeURIComponent(testConsumerEmail)}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchData = await searchRes.json();
    if (!searchRes.ok || !searchData.success) {
      throw new Error(`Search failed: ${JSON.stringify(searchData)}`);
    }
    const foundUser = searchData.data.find((u) => u.email === testConsumerEmail);
    if (!foundUser) {
      throw new Error(`Search by email failed to find user with email ${testConsumerEmail}`);
    }
    console.log(`   ✓ Search successfully found target user: "${foundUser.name}" (${foundUser.email})`);

    // 6. Test pagination
    console.log('\n6. Testing pagination via GET /api/admin/users?page=1&limit=2...');
    const pageRes = await fetch(`${baseUrl}/api/admin/users?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pageData = await pageRes.json();
    if (!pageRes.ok || !pageData.success) {
      throw new Error(`Pagination failed: ${JSON.stringify(pageData)}`);
    }
    if (pageData.data.length > 2) {
      throw new Error(`Expected at most 2 items, got ${pageData.data.length}`);
    }
    if (!pageData.pagination || pageData.pagination.limit !== 2) {
      throw new Error(`Pagination metadata incorrect: ${JSON.stringify(pageData.pagination)}`);
    }
    console.log(`   ✓ Pagination successful: limit=${pageData.pagination.limit}, total=${pageData.pagination.total}, totalPages=${pageData.pagination.totalPages}`);

    // 7. Test user details retrieval
    console.log(`\n7. Testing GET /api/admin/users/${testConsumerUserId} (user detail)...`);
    const detailRes = await fetch(`${baseUrl}/api/admin/users/${testConsumerUserId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const detailData = await detailRes.json();
    if (!detailRes.ok || !detailData.success) {
      throw new Error(`GET user detail failed: ${JSON.stringify(detailData)}`);
    }
    const userDetail = detailData.data;
    if (userDetail.id !== testConsumerUserId || userDetail.email !== testConsumerEmail) {
      throw new Error('User detail response does not match expected user');
    }
    if ('passwordHash' in userDetail || 'password' in userDetail) {
      throw new Error('Security breach: passwordHash exposed in user detail endpoint!');
    }
    console.log(`   ✓ User details retrieved successfully. Name: ${userDetail.name}, Role: ${userDetail.role}, IsActive: ${userDetail.isActive}`);

    // 8. Test deactivating user
    console.log(`\n8. Testing account deactivation via PATCH /api/admin/users/${testConsumerUserId}/status...`);
    const deactivateRes = await fetch(`${baseUrl}/api/admin/users/${testConsumerUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: false }),
    });
    const deactivateData = await deactivateRes.json();
    if (!deactivateRes.ok || !deactivateData.success) {
      throw new Error(`Deactivation failed: ${JSON.stringify(deactivateData)}`);
    }
    if (deactivateData.data.isActive !== false) {
      throw new Error('Expected deactivated user response to have isActive === false');
    }
    console.log('   ✓ API returned deactivated status: isActive = false');

    // 9. Verify in database directly
    console.log('9. Verifying direct database state in PostgreSQL via Prisma...');
    const dbUserAfterDeactivate = await prisma.user.findUnique({
      where: { id: testConsumerUserId },
    });
    if (!dbUserAfterDeactivate || dbUserAfterDeactivate.isActive !== false) {
      throw new Error('Database assertion failed: isActive is not false in PostgreSQL!');
    }
    console.log('   ✓ Verified in PostgreSQL: user.isActive === false');

    // 10. Test reactivating user
    console.log(`\n10. Testing account reactivation via PATCH /api/admin/users/${testConsumerUserId}/status...`);
    const activateRes = await fetch(`${baseUrl}/api/admin/users/${testConsumerUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: true }),
    });
    const activateData = await activateRes.json();
    if (!activateRes.ok || !activateData.success) {
      throw new Error(`Reactivation failed: ${JSON.stringify(activateData)}`);
    }
    if (activateData.data.isActive !== true) {
      throw new Error('Expected activated user response to have isActive === true');
    }
    console.log('   ✓ API returned activated status: isActive = true');

    // 11. Verify in database directly
    console.log('11. Verifying direct database state in PostgreSQL via Prisma...');
    const dbUserAfterActivate = await prisma.user.findUnique({
      where: { id: testConsumerUserId },
    });
    if (!dbUserAfterActivate || dbUserAfterActivate.isActive !== true) {
      throw new Error('Database assertion failed: isActive is not true in PostgreSQL!');
    }
    console.log('   ✓ Verified in PostgreSQL: user.isActive === true');

    // 12. Test Admin Self-Protection (Admin CANNOT deactivate their own account)
    console.log(`\n12. Testing Admin Self-Protection: attempting to deactivate self (${adminUserId})...`);
    const selfDeactivateRes = await fetch(`${baseUrl}/api/admin/users/${adminUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: false }),
    });
    const selfDeactivateData = await selfDeactivateRes.json();
    if (selfDeactivateRes.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden for self-deactivation, got HTTP ${selfDeactivateRes.status}: ${JSON.stringify(selfDeactivateData)}`);
    }
    console.log(`   ✓ Correctly rejected with HTTP 403 Forbidden: "${selfDeactivateData.error}"`);

    // Verify Admin is still active in database
    const dbAdmin = await prisma.user.findUnique({ where: { id: adminUserId } });
    if (!dbAdmin || !dbAdmin.isActive) {
      throw new Error('Critical: Admin account was deactivated!');
    }
    console.log('   ✓ Verified in PostgreSQL: Admin user remains active.');

    // 13. Test Role security: attempting to alter role via status endpoint
    console.log('\n13. Testing role security: attempting to change role to ADMIN via status update...');
    const roleTamperRes = await fetch(`${baseUrl}/api/admin/users/${testConsumerUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: true, role: 'ADMIN' }),
    });
    const roleTamperData = await roleTamperRes.json();
    if (!roleTamperRes.ok) {
      throw new Error(`Request failed: ${JSON.stringify(roleTamperData)}`);
    }
    const dbUserAfterTamper = await prisma.user.findUnique({ where: { id: testConsumerUserId } });
    if (dbUserAfterTamper.role === 'ADMIN') {
      throw new Error('Security breach: Role was modified via status endpoint!');
    }
    console.log(`   ✓ Role security preserved: user.role is still "${dbUserAfterTamper.role}" (not promoted to ADMIN).`);

    // 14. Non-admin access rejection
    console.log('\n14. Testing access control: non-admin (consumer) attempting to access admin users endpoint...');
    const nonAdminRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${consumerToken}` },
    });
    if (nonAdminRes.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden for consumer token, got HTTP ${nonAdminRes.status}`);
    }
    console.log('   ✓ Consumer access correctly blocked with HTTP 403 Forbidden.');

    console.log('\n=== ALL ADMIN USER MANAGEMENT E2E TESTS PASSED SUCCESSFULLY! ===\n');
  } finally {
    // Cleanup test user
    if (testConsumerUserId) {
      try {
        await prisma.user.delete({ where: { id: testConsumerUserId } });
        console.log(`Cleaned up test user ${testConsumerUserId}.`);
      } catch (e) {
        console.error('Failed to cleanup test user:', e.message);
      }
    }
    await prisma.$disconnect();
  }
}

runAdminUsersE2ETests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
