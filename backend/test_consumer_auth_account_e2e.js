/**
 * Comprehensive E2E Verification Suite for CONSUMER MODULE — STEP 1
 * Authentication, Registration & Account Foundation
 * Tests PostgreSQL via Prisma directly & via HTTP REST APIs.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const baseUrl = process.env.API_URL || 'http://localhost:5000';

async function runConsumerModuleStep1E2E() {
  console.log('================================================================');
  console.log('  CONSUMER MODULE STEP 1 — AUTH, PROFILE & ADDRESS E2E TESTS    ');
  console.log('================================================================\n');

  const timestamp = Date.now();
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
    // ------------------------------------------------------------------------
    // SECTION 1: CONSUMER REGISTRATION TESTS
    // ------------------------------------------------------------------------
    console.log('1. AUDITING CONSUMER REGISTRATION...');

    const consumerEmailA = `consumer_a_${timestamp}@krishitest.com`;
    const consumerPasswordA = 'ConsumerPass@123';

    // 1.1 Valid Registration
    const regResA = await fetch(`${baseUrl}/api/auth/consumer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pooja Hegde',
        email: consumerEmailA,
        phone: '+91 98450 11223',
        password: consumerPasswordA,
      }),
    });
    const regDataA = await regResA.json();

    assert(regResA.status === 201, 'Valid consumer registration returns HTTP 201');
    assert(!!regDataA.data?.token, 'Consumer registration issues JWT auth token');
    assert(regDataA.data?.user?.email === consumerEmailA, 'Returned user email matches registration');
    assert(regDataA.data?.user?.role === 'CONSUMER', 'Registered user has role CONSUMER');
    assert(regDataA.data?.user?.passwordHash === undefined, 'passwordHash is NOT exposed in registration response');
    assert(regDataA.data?.user?.password === undefined, 'plaintext password is NOT exposed in registration response');

    // 1.2 Verify in PostgreSQL
    const dbUserA = await prisma.user.findUnique({
      where: { email: consumerEmailA },
    });
    assert(dbUserA !== null, 'Consumer record persisted in PostgreSQL');
    assert(dbUserA.isActive === true, 'Consumer isActive initialized to true');
    assert(dbUserA.passwordHash.startsWith('$2'), 'Consumer password securely hashed with bcrypt in PostgreSQL');

    // 1.3 Duplicate Email Registration
    const dupRes = await fetch(`${baseUrl}/api/auth/consumer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Consumer',
        email: consumerEmailA,
        password: 'anotherpassword',
      }),
    });
    assert(dupRes.status === 409, 'Duplicate email registration rejected with HTTP 409 Conflict');

    // 1.4 Short Password Validation
    const shortPassRes = await fetch(`${baseUrl}/api/auth/consumer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Short Pass User',
        email: `short_pass_${timestamp}@krishitest.com`,
        password: '123',
      }),
    });
    assert(shortPassRes.status === 400, 'Registration with password < 6 chars rejected with HTTP 400');

    // 1.5 Missing Name Validation
    const missingNameRes = await fetch(`${baseUrl}/api/auth/consumer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `no_name_${timestamp}@krishitest.com`,
        password: 'validpassword123',
      }),
    });
    assert(missingNameRes.status === 400, 'Registration with missing name rejected with HTTP 400');

    // Register Consumer B for IDOR and Multi-Tenant Isolation Audits
    const consumerEmailB = `consumer_b_${timestamp}@krishitest.com`;
    const consumerPasswordB = 'ConsumerPassB@123';
    const regResB = await fetch(`${baseUrl}/api/auth/consumer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kavitha Reddy',
        email: consumerEmailB,
        phone: '+91 98450 44556',
        password: consumerPasswordB,
      }),
    });
    const regDataB = await regResB.json();
    const tokenB = regDataB.data.token;
    const userB = regDataB.data.user;
    assert(regResB.status === 201 && !!tokenB, 'Consumer B registered and authenticated for multi-tenant isolation tests');

    // ------------------------------------------------------------------------
    // SECTION 2: CONSUMER LOGIN TESTS
    // ------------------------------------------------------------------------
    console.log('\n2. AUDITING CONSUMER LOGIN...');

    // 2.1 Valid Login
    const loginResA = await fetch(`${baseUrl}/api/auth/consumer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: consumerEmailA,
        password: consumerPasswordA,
      }),
    });
    const loginDataA = await loginResA.json();
    const tokenA = loginDataA.data?.token;

    assert(loginResA.status === 200, 'Valid consumer credentials return HTTP 200');
    assert(!!tokenA, 'Consumer login returns valid JWT token');
    assert(loginDataA.data?.user?.role === 'CONSUMER', 'Consumer login reports role CONSUMER');
    assert(loginDataA.data?.user?.passwordHash === undefined, 'passwordHash is NOT exposed in login response');

    // 2.2 Invalid Password
    const badPassRes = await fetch(`${baseUrl}/api/auth/consumer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: consumerEmailA,
        password: 'WrongPassword!999',
      }),
    });
    assert(badPassRes.status === 401, 'Invalid consumer password rejected with HTTP 401 Unauthorized');

    // 2.3 Non-existent Email
    const badEmailRes = await fetch(`${baseUrl}/api/auth/consumer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `ghost_consumer_${timestamp}@nonexistent.in`,
        password: 'password123',
      }),
    });
    assert(badEmailRes.status === 401, 'Non-existent consumer email rejected with HTTP 401 Unauthorized');

    // 2.4 Deactivated Account Login Rejection
    await prisma.user.update({
      where: { email: consumerEmailA },
      data: { isActive: false },
    });
    const deactLoginRes = await fetch(`${baseUrl}/api/auth/consumer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: consumerEmailA,
        password: consumerPasswordA,
      }),
    });
    assert(deactLoginRes.status === 403, 'Deactivated consumer account login rejected with HTTP 403 Forbidden');

    // Reactivate consumer A
    await prisma.user.update({
      where: { email: consumerEmailA },
      data: { isActive: true },
    });

    // ------------------------------------------------------------------------
    // SECTION 3: SERVER-SIDE RBAC & ROLE PROTECTION
    // ------------------------------------------------------------------------
    console.log('\n3. AUDITING SERVER-SIDE RBAC & ROUTE PROTECTION...');

    // 3.1 Unauthenticated requests rejected
    const unauthProfileRes = await fetch(`${baseUrl}/api/consumer/profile`);
    assert(unauthProfileRes.status === 401, 'Unauthenticated GET /api/consumer/profile rejected with HTTP 401');

    const unauthAddressesRes = await fetch(`${baseUrl}/api/consumer/addresses`);
    assert(unauthAddressesRes.status === 401, 'Unauthenticated GET /api/consumer/addresses rejected with HTTP 401');

    // 3.2 Consumer accessing Admin APIs rejected (403)
    const consAdminUsersRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(consAdminUsersRes.status === 403, 'Consumer token accessing Admin users API rejected with HTTP 403 Forbidden');

    const consAdminOrdersRes = await fetch(`${baseUrl}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(consAdminOrdersRes.status === 403, 'Consumer token accessing Admin orders API rejected with HTTP 403 Forbidden');

    const consAdminAnalyticsRes = await fetch(`${baseUrl}/api/admin/analytics`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(consAdminAnalyticsRes.status === 403, 'Consumer token accessing Admin analytics API rejected with HTTP 403 Forbidden');

    // 3.3 Consumer accessing Farmer APIs rejected (403)
    const consFarmerProductsRes = await fetch(`${baseUrl}/api/farmer/products`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(consFarmerProductsRes.status === 403, 'Consumer token accessing Farmer products API rejected with HTTP 403 Forbidden');

    // ------------------------------------------------------------------------
    // SECTION 4: CONSUMER PROFILE MANAGEMENT
    // ------------------------------------------------------------------------
    console.log('\n4. AUDITING CONSUMER PROFILE MANAGEMENT...');

    // 4.1 Retrieve Own Profile
    const profileResA = await fetch(`${baseUrl}/api/consumer/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const profileDataA = await profileResA.json();

    assert(profileResA.status === 200, 'Consumer successfully retrieves own profile (HTTP 200)');
    assert(profileDataA.data?.email === consumerEmailA, 'Profile payload email matches authenticated user');
    assert(profileDataA.data?.name === 'Pooja Hegde', 'Profile payload name matches user');
    assert(profileDataA.data?.passwordHash === undefined, 'passwordHash is NEVER returned in profile response');

    // 4.2 Update Profile (Name & Phone)
    const updateProfRes = await fetch(`${baseUrl}/api/consumer/profile`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Pooja R. Hegde',
        phone: '+91 98450 99999',
      }),
    });
    const updateProfData = await updateProfRes.json();

    assert(updateProfRes.status === 200, 'Consumer updates own profile (HTTP 200)');
    assert(updateProfData.data?.name === 'Pooja R. Hegde', 'Updated name reflected in API response');
    assert(updateProfData.data?.phone === '+91 98450 99999', 'Updated phone reflected in API response');

    const updatedDbUserA = await prisma.user.findUnique({ where: { email: consumerEmailA } });
    assert(updatedDbUserA.name === 'Pooja R. Hegde', 'Profile update persisted in PostgreSQL');

    // 4.3 Privilege Escalation & Tampering Protection
    const tamperRes = await fetch(`${baseUrl}/api/consumer/profile`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'ADMIN',
        isActive: false,
        email: 'hacked_admin@krishimarket.in',
      }),
    });
    const unTamperedDbUser = await prisma.user.findUnique({ where: { email: consumerEmailA } });
    assert(unTamperedDbUser.role === 'CONSUMER', 'Role parameter tampering blocked: user remains CONSUMER');
    assert(unTamperedDbUser.email === consumerEmailA, 'Email parameter tampering ignored: email unchanged');

    // 4.4 Empty Name Validation
    const emptyNameRes = await fetch(`${baseUrl}/api/consumer/profile`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '   ',
      }),
    });
    assert(emptyNameRes.status === 400, 'Profile update with blank name rejected with HTTP 400');

    // ------------------------------------------------------------------------
    // SECTION 5: ADDRESS MANAGEMENT & DEFAULT ADDRESS RULES
    // ------------------------------------------------------------------------
    console.log('\n5. AUDITING CONSUMER ADDRESS MANAGEMENT & DEFAULT RULES...');

    // 5.1 Create First Address (should automatically become Default)
    const addr1Res = await fetch(`${baseUrl}/api/consumer/addresses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Pooja R. Hegde (Home)',
        phone: '+91 98450 99999',
        addressLine: 'Flat 402, Greenwood Regency, Sarjapur Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560035',
        hub: 'Sarjapur Hub',
      }),
    });
    const addr1Data = await addr1Res.json();
    const addr1Id = addr1Data.data?.id;

    assert(addr1Res.status === 201, 'First delivery address created successfully (HTTP 201)');
    assert(addr1Data.data?.isDefault === true, 'First address automatically set as default');
    assert(addr1Data.data?.hub === 'Sarjapur Hub', 'Address hub area correctly populated');

    // 5.2 Create Second Address with isDefault: false
    const addr2Res = await fetch(`${baseUrl}/api/consumer/addresses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Pooja Work / Studio',
        phone: '+91 98450 99999',
        addressLine: '7th Floor, UB City Tower, Vittal Mallya Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        hub: 'Central Hub',
        isDefault: false,
      }),
    });
    const addr2Data = await addr2Res.json();
    const addr2Id = addr2Data.data?.id;

    assert(addr2Res.status === 201, 'Second delivery address created successfully (HTTP 201)');
    assert(addr2Data.data?.isDefault === false, 'Second address created with isDefault: false');

    // Verify Address 1 remains default in PostgreSQL
    const checkDbAddr1 = await prisma.consumerAddress.findUnique({ where: { id: addr1Id } });
    assert(checkDbAddr1.isDefault === true, 'Address 1 remains primary default in PostgreSQL');

    // 5.3 Set Second Address as Default
    const setDefaultRes = await fetch(`${baseUrl}/api/consumer/addresses/${addr2Id}/default`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(setDefaultRes.status === 200, 'Set address 2 as default returned HTTP 200');

    // Verify Default Address Rule via PostgreSQL Prisma query:
    const allAddressesA = await prisma.consumerAddress.findMany({
      where: { userId: dbUserA.id },
    });
    const defaultAddresses = allAddressesA.filter((a) => a.isDefault);
    assert(defaultAddresses.length === 1, 'Default Address Rule verified: Exactly 1 default address exists in PostgreSQL');
    assert(defaultAddresses[0].id === addr2Id, 'Address 2 is now the single primary default');

    const checkDbAddr1After = await prisma.consumerAddress.findUnique({ where: { id: addr1Id } });
    assert(checkDbAddr1After.isDefault === false, 'Address 1 isDefault was atomically flipped to false via transaction');

    // 5.4 Update Address
    const updateAddrRes = await fetch(`${baseUrl}/api/consumer/addresses/${addr1Id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Pooja R. Hegde (Parents Villa)',
        addressLine: 'Villa #12, Palm Meadows, Whitefield',
        pincode: '560066',
        hub: 'Whitefield Hub',
      }),
    });
    const updateAddrData = await updateAddrRes.json();

    assert(updateAddrRes.status === 200, 'Address updated successfully (HTTP 200)');
    assert(updateAddrData.data?.name === 'Pooja R. Hegde (Parents Villa)', 'Updated address name reflected');
    assert(updateAddrData.data?.hub === 'Whitefield Hub', 'Updated hub reflected');

    // 5.5 List Addresses
    const listAddrRes = await fetch(`${baseUrl}/api/consumer/addresses`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listAddrData = await listAddrRes.json();
    assert(listAddrRes.status === 200, 'GET /api/consumer/addresses returns HTTP 200');
    assert(listAddrData.data?.length === 2, 'GET /api/consumer/addresses returns all 2 addresses for Consumer A');

    // ------------------------------------------------------------------------
    // SECTION 6: IDOR (CROSS-TENANT ISOLATION) TESTS
    // ------------------------------------------------------------------------
    console.log('\n6. AUDITING IDOR (CROSS-TENANT ISOLATION) SECURITY...');

    // Create address for Consumer B
    const addrBRes = await fetch(`${baseUrl}/api/consumer/addresses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenB}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Kavitha Residence',
        phone: '+91 98450 44556',
        addressLine: 'Plot 88, HSR Sector 2',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560102',
        hub: 'HSR Hub',
      }),
    });
    const addrBData = await addrBRes.json();
    const addrBId = addrBData.data?.id;
    assert(addrBRes.status === 201 && !!addrBId, 'Consumer B created own address');

    // 6.1 Consumer A attempting to update Consumer B's address
    const idorUpdateRes = await fetch(`${baseUrl}/api/consumer/addresses/${addrBId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Malicious Overwrite by Consumer A',
      }),
    });
    assert(idorUpdateRes.status === 403 || idorUpdateRes.status === 404, 'IDOR Protection: Consumer A cannot update Consumer B address (HTTP 403/404)');

    const untouchedAddrB = await prisma.consumerAddress.findUnique({ where: { id: addrBId } });
    assert(untouchedAddrB.name === 'Kavitha Residence', 'Consumer B address data preserved intact in PostgreSQL');

    // 6.2 Consumer A attempting to delete Consumer B's address
    const idorDeleteRes = await fetch(`${baseUrl}/api/consumer/addresses/${addrBId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(idorDeleteRes.status === 403 || idorDeleteRes.status === 404, 'IDOR Protection: Consumer A cannot delete Consumer B address (HTTP 403/404)');

    const stillExistingAddrB = await prisma.consumerAddress.findUnique({ where: { id: addrBId } });
    assert(stillExistingAddrB !== null, 'Consumer B address was NOT deleted');

    // 6.3 Consumer A attempting to set Consumer B's address as default
    const idorDefaultRes = await fetch(`${baseUrl}/api/consumer/addresses/${addrBId}/default`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(idorDefaultRes.status === 403 || idorDefaultRes.status === 404, 'IDOR Protection: Consumer A cannot set Consumer B address as default (HTTP 403/404)');

    // 6.4 Delete Own Address
    const deleteRes = await fetch(`${baseUrl}/api/consumer/addresses/${addr1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(deleteRes.status === 200, 'Consumer A can delete own address (HTTP 200)');

    const deletedAddr = await prisma.consumerAddress.findUnique({ where: { id: addr1Id } });
    assert(deletedAddr === null, 'Address successfully deleted from PostgreSQL');

    // ------------------------------------------------------------------------
    // SECTION 7: INPUT VALIDATION TESTS
    // ------------------------------------------------------------------------
    console.log('\n7. AUDITING ADDRESS INPUT VALIDATION...');

    const emptyLineRes = await fetch(`${baseUrl}/api/consumer/addresses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test',
        phone: '+91 99999 88888',
        addressLine: '',
        pincode: '560001',
      }),
    });
    assert(emptyLineRes.status === 400, 'Address creation with blank addressLine rejected with HTTP 400');

    const emptyPincodeRes = await fetch(`${baseUrl}/api/consumer/addresses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test',
        phone: '+91 99999 88888',
        addressLine: '123 Main St',
        pincode: '',
      }),
    });
    assert(emptyPincodeRes.status === 400, 'Address creation with blank pincode rejected with HTTP 400');

    // Clean up test data
    console.log('\nCleaning up test consumer records from PostgreSQL...');
    await prisma.consumerAddress.deleteMany({
      where: { userId: { in: [dbUserA.id, userB.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [dbUserA.id, userB.id] } },
    });
    console.log('Cleanup completed.');

    console.log(`\n================================================================`);
    console.log(`CONSUMER STEP 1 E2E TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log(`================================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Consumer Step 1 Test Fatal Error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runConsumerModuleStep1E2E();
