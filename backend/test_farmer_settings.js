const http = require('http');
const { prisma } = require('./dist/db/prisma');

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

async function runSettingsTests() {
  console.log('======================================================');
  console.log('=== STARTING FARMER SETTINGS INTEGRATION TEST SUITE ===');
  console.log('======================================================\n');

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

  const createdUserIds = [];

  try {
    // ------------------------------------------------------------------------
    // SETUP ACTORS
    // ------------------------------------------------------------------------
    console.log('0. Setting up test actors in PostgreSQL...');

    // Health check
    const health = await makeRequest('GET', '/api/health');
    assert(health.status === 200, 'Backend is healthy and responding (200)');

    // Admin login
    const adminLogin = await makeRequest('POST', '/api/auth/admin/login', {
      email: 'admin@krishimarket.in',
      password: 'admin123',
    });
    let adminToken = adminLogin.data?.data?.token;
    if (adminLogin.status === 200 && adminToken) {
      assert(true, 'Admin login succeeds (200)');
    } else {
      const { generateToken } = require('./dist/utils/jwt');
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      adminToken = generateToken({
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      });
      assert(Boolean(adminToken), 'Admin token generated via fallback');
    }

    // Register Farmer 1
    const farmer1Email = `farmer1.settings.${timestamp}@krishitest.com`;
    const farmer1InitialPassword = 'InitialPassword123!';
    const farmer1Reg = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Ramesh Patel',
      email: farmer1Email,
      password: farmer1InitialPassword,
      phone: `981${String(timestamp).slice(-7)}`,
      farmName: 'Patel Organic Acres',
      farmLocation: 'Survey 101, Mandya Rural',
      city: 'Mandya',
      state: 'Karnataka',
      pincode: '571401',
      mainCrops: ['Carrots', 'Spinach'],
    });
    assert(farmer1Reg.status === 201, 'Farmer 1 registration succeeds (201)');
    const farmer1Token = farmer1Reg.data.data.token;
    const farmer1FarmerId = farmer1Reg.data.data.farmer.id;
    const farmer1UserId = farmer1Reg.data.data.user.id;
    createdUserIds.push(farmer1UserId);

    // Approve Farmer 1
    await makeRequest(
      'POST',
      `/api/admin/farmers/${farmer1FarmerId}/approve`,
      {},
      adminToken
    );

    const farmer1Login = await makeRequest('POST', '/api/auth/farmer/login', {
      email: farmer1Email,
      password: farmer1InitialPassword,
    });
    const approvedFarmer1Token = farmer1Login.data.data.token;

    // Register Farmer 2
    const farmer2Email = `farmer2.settings.${timestamp}@krishitest.com`;
    const farmer2InitialPassword = 'Farmer2Password123!';
    const farmer2Reg = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Suresh Gowda',
      email: farmer2Email,
      password: farmer2InitialPassword,
      phone: `982${String(timestamp).slice(-7)}`,
      farmName: 'Gowda Heritage Farm',
      farmLocation: 'Survey 202, Mysuru Outskirts',
      city: 'Mysuru',
      state: 'Karnataka',
      pincode: '570001',
      mainCrops: ['Cabbage', 'Beans'],
    });
    assert(farmer2Reg.status === 201, 'Farmer 2 registration succeeds (201)');
    const farmer2FarmerId = farmer2Reg.data.data.farmer.id;
    const farmer2UserId = farmer2Reg.data.data.user.id;
    createdUserIds.push(farmer2UserId);

    await makeRequest(
      'POST',
      `/api/admin/farmers/${farmer2FarmerId}/approve`,
      {},
      adminToken
    );

    const farmer2Login = await makeRequest('POST', '/api/auth/farmer/login', {
      email: farmer2Email,
      password: farmer2InitialPassword,
    });
    const approvedFarmer2Token = farmer2Login.data.data.token;

    // Register Consumer
    const consumerEmail = `consumer.settings.${timestamp}@krishitest.com`;
    const consumerReg = await makeRequest('POST', '/api/auth/consumer/register', {
      name: 'Aditi Consumer',
      email: consumerEmail,
      password: 'ConsumerPassword123!',
      phone: `985${String(timestamp).slice(-7)}`,
    });
    assert(consumerReg.status === 201, 'Consumer registration succeeds (201)');
    const consumerToken = consumerReg.data.data.token;
    createdUserIds.push(consumerReg.data.data.user.id);

    // ------------------------------------------------------------------------
    // CRITERION 1: Authenticated farmer can access settings
    // ------------------------------------------------------------------------
    console.log('\n--- CRITERION 1: AUTHENTICATED FARMER CAN ACCESS SETTINGS ---');

    const getSettingsRes = await makeRequest('GET', '/api/farmer/settings', null, approvedFarmer1Token);
    assert(getSettingsRes.status === 200, 'GET /api/farmer/settings returns 200');
    assert(getSettingsRes.data.success === true, 'Response has success = true');
    const settingsData = getSettingsRes.data.data;
    assert(settingsData.account.name === 'Ramesh Patel', 'Account name matches registration');
    assert(settingsData.account.email === farmer1Email, 'Account email matches registration');
    assert(typeof settingsData.notifications.orderAlerts === 'boolean', 'orderAlerts is boolean');
    assert(typeof settingsData.security.twoFactorAuth === 'boolean', 'twoFactorAuth is boolean');
    assert(settingsData.preferences.currency === 'INR (₹)', 'Currency default is INR (₹)');
    assert(typeof settingsData.language === 'string', 'Language is string');

    // ------------------------------------------------------------------------
    // CRITERIA 2 & 3: Unauthenticated user is rejected & Non-farmer is rejected
    // ------------------------------------------------------------------------
    console.log('\n--- CRITERIA 2 & 3: AUTHENTICATION & ROLE ENFORCEMENT ---');

    const unauthGet = await makeRequest('GET', '/api/farmer/settings');
    assert(unauthGet.status === 401, 'Unauthenticated GET /api/farmer/settings rejected with 401');

    const unauthPatch = await makeRequest('PATCH', '/api/farmer/settings', { language: 'Kannada' });
    assert(unauthPatch.status === 401, 'Unauthenticated PATCH /api/farmer/settings rejected with 401');

    const unauthPassword = await makeRequest('PATCH', '/api/farmer/settings/password', {
      currentPassword: 'abc',
      newPassword: 'xyz',
    });
    assert(unauthPassword.status === 401, 'Unauthenticated PATCH /api/farmer/settings/password rejected with 401');

    const consumerGet = await makeRequest('GET', '/api/farmer/settings', null, consumerToken);
    assert(consumerGet.status === 403, 'Consumer role GET /api/farmer/settings rejected with 403');

    const consumerPatch = await makeRequest('PATCH', '/api/farmer/settings', { language: 'Kannada' }, consumerToken);
    assert(consumerPatch.status === 403, 'Consumer role PATCH /api/farmer/settings rejected with 403');

    const consumerPassword = await makeRequest(
      'PATCH',
      '/api/farmer/settings/password',
      { currentPassword: 'abc', newPassword: 'xyz' },
      consumerToken
    );
    assert(consumerPassword.status === 403, 'Consumer role PATCH /api/farmer/settings/password rejected with 403');

    // ------------------------------------------------------------------------
    // CRITERIA 4 & 5: Farmer updates allowed settings & changes persist in DB
    // ------------------------------------------------------------------------
    console.log('\n--- CRITERIA 4 & 5: UPDATE SETTINGS & POSTGRESQL PERSISTENCE ---');

    const updatePayload = {
      account: {
        name: 'Ramesh Patel Updated',
        phone: '9819999888',
      },
      notifications: {
        orderAlerts: false,
        smsAlerts: true,
        inventoryWarnings: false,
        marketingEmail: true,
      },
      security: {
        twoFactorAuth: false,
      },
      preferences: {
        payoutSchedule: 'Monthly Direct Deposit',
        autoPauseLowStock: false,
      },
      language: 'Kannada',
    };

    const patchRes = await makeRequest('PATCH', '/api/farmer/settings', updatePayload, approvedFarmer1Token);
    assert(patchRes.status === 200, 'PATCH /api/farmer/settings returns 200');
    assert(patchRes.data.success === true, 'Update returns success = true');
    assert(patchRes.data.data.account.name === 'Ramesh Patel Updated', 'Updated name reflected in response');
    assert(patchRes.data.data.account.phone === '9819999888', 'Updated phone reflected in response');
    assert(patchRes.data.data.notifications.orderAlerts === false, 'orderAlerts updated to false');
    assert(patchRes.data.data.notifications.marketingEmail === true, 'marketingEmail updated to true');
    assert(patchRes.data.data.security.twoFactorAuth === false, 'twoFactorAuth updated to false');
    assert(patchRes.data.data.preferences.payoutSchedule === 'Monthly Direct Deposit', 'payoutSchedule updated');
    assert(patchRes.data.data.preferences.autoPauseLowStock === false, 'autoPauseLowStock updated to false');
    assert(patchRes.data.data.language === 'Kannada', 'language updated to Kannada');

    // Direct PostgreSQL inspection
    const dbUser1 = await prisma.user.findUnique({
      where: { id: farmer1UserId },
    });
    assert(dbUser1.name === 'Ramesh Patel Updated', 'PostgreSQL User.name updated directly');
    assert(dbUser1.phone === '9819999888', 'PostgreSQL User.phone updated directly');
    const dbSettings = dbUser1.settings;
    assert(dbSettings.notifications.orderAlerts === false, 'PostgreSQL User.settings.notifications.orderAlerts is false');
    assert(dbSettings.notifications.marketingEmail === true, 'PostgreSQL User.settings.notifications.marketingEmail is true');
    assert(dbSettings.security.twoFactorAuth === false, 'PostgreSQL User.settings.security.twoFactorAuth is false');
    assert(dbSettings.preferences.payoutSchedule === 'Monthly Direct Deposit', 'PostgreSQL User.settings.preferences.payoutSchedule matches');
    assert(dbSettings.language === 'Kannada', 'PostgreSQL User.settings.language matches');

    // Re-fetch via GET endpoint
    const regetRes = await makeRequest('GET', '/api/farmer/settings', null, approvedFarmer1Token);
    assert(regetRes.data.data.language === 'Kannada', 'GET endpoint returns persisted Kannada language');
    assert(regetRes.data.data.account.name === 'Ramesh Patel Updated', 'GET endpoint returns persisted name');

    // ------------------------------------------------------------------------
    // CRITERION 6: Farmer cannot modify another user’s settings
    // ------------------------------------------------------------------------
    console.log('\n--- CRITERION 6: CROSS-TENANT ISOLATION ---');

    // Farmer 2 attempts to send payload with Farmer 1's userId or farmerId
    const crossAttack = await makeRequest(
      'PATCH',
      '/api/farmer/settings',
      {
        userId: farmer1UserId,
        farmerId: farmer1FarmerId,
        account: { name: 'Compromised Farmer Name' },
      },
      approvedFarmer2Token
    );
    assert(
      crossAttack.status === 403,
      `Cross-tenant injection with userId/farmerId rejected with 403 Forbidden (got ${crossAttack.status})`
    );

    // Verify Farmer 1 record in PostgreSQL remains untouched
    const checkUser1Again = await prisma.user.findUnique({ where: { id: farmer1UserId } });
    assert(
      checkUser1Again.name === 'Ramesh Patel Updated',
      'Farmer 1 name in PostgreSQL completely untouched by Farmer 2 request'
    );

    // ------------------------------------------------------------------------
    // CRITERIA 7, 8, 9: Farmer cannot change role, isActive, or verification state
    // ------------------------------------------------------------------------
    console.log('\n--- CRITERIA 7, 8, 9: PROTECTED GOVERNANCE FIELDS IMMUTABILITY ---');

    // 7. Role tampering rejected
    const roleAttack = await makeRequest(
      'PATCH',
      '/api/farmer/settings',
      { role: 'ADMIN' },
      approvedFarmer1Token
    );
    assert(roleAttack.status === 403, `Role promotion to ADMIN rejected with 403 (got ${roleAttack.status})`);

    // 8. isActive tampering rejected
    const activeAttack = await makeRequest(
      'PATCH',
      '/api/farmer/settings',
      { isActive: false },
      approvedFarmer1Token
    );
    assert(activeAttack.status === 403, `isActive modification rejected with 403 (got ${activeAttack.status})`);

    // 9. Verification state tampering rejected
    const verifyAttack = await makeRequest(
      'PATCH',
      '/api/farmer/settings',
      { verificationStatus: 'APPROVED', isVerified: true, approvedBy: 'self' },
      approvedFarmer1Token
    );
    assert(verifyAttack.status === 403, `Verification status modification rejected with 403 (got ${verifyAttack.status})`);

    // Confirm PostgreSQL user fields remain uncompromised
    const safeUser = await prisma.user.findUnique({ where: { id: farmer1UserId } });
    assert(safeUser.role === 'FARMER', 'PostgreSQL User.role remains FARMER');
    assert(safeUser.isActive === true, 'PostgreSQL User.isActive remains true');

    // ------------------------------------------------------------------------
    // CRITERIA 10 & 11: Correct current password required & incorrect rejected
    // ------------------------------------------------------------------------
    console.log('\n--- CRITERIA 10 & 11: PASSWORD VALIDATION & CURRENT PASSWORD CHECK ---');

    // Empty current password
    const emptyCurrent = await makeRequest(
      'PATCH',
      '/api/farmer/settings/password',
      { currentPassword: '', newPassword: 'NewValidPassword123!' },
      approvedFarmer1Token
    );
    assert(emptyCurrent.status === 400, 'Empty current password rejected with 400 Bad Request');

    // Empty new password
    const emptyNew = await makeRequest(
      'PATCH',
      '/api/farmer/settings/password',
      { currentPassword: farmer1InitialPassword, newPassword: '' },
      approvedFarmer1Token
    );
    assert(emptyNew.status === 400, 'Empty new password rejected with 400 Bad Request');

    // Short new password (<6 chars)
    const shortNew = await makeRequest(
      'PATCH',
      '/api/farmer/settings/password',
      { currentPassword: farmer1InitialPassword, newPassword: '12345' },
      approvedFarmer1Token
    );
    assert(shortNew.status === 400, 'Short new password (<6 chars) rejected with 400 Bad Request');

    // New password identical to current
    const sameNew = await makeRequest(
      'PATCH',
      '/api/farmer/settings/password',
      { currentPassword: farmer1InitialPassword, newPassword: farmer1InitialPassword },
      approvedFarmer1Token
    );
    assert(sameNew.status === 400, 'New password identical to current rejected with 400 Bad Request');

    // Incorrect current password
    const incorrectCurrent = await makeRequest(
      'PATCH',
      '/api/farmer/settings/password',
      { currentPassword: 'WrongPassword999!', newPassword: 'NewSecretPass123!' },
      approvedFarmer1Token
    );
    assert(incorrectCurrent.status === 400, 'Incorrect current password rejected with 400 Bad Request');
    assert(
      incorrectCurrent.data.error.includes('Incorrect current password'),
      'Error message clarifies incorrect current password'
    );

    // ------------------------------------------------------------------------
    // CRITERIA 12 & 13: New password securely hashed & passwordHash never returned
    // ------------------------------------------------------------------------
    console.log('\n--- CRITERIA 12 & 13: PASSWORD HASHING & ZERO EXPOSURE ---');

    const oldHash = safeUser.passwordHash;
    const newPasswordCandidate = 'FreshStrongPassword2026!';

    const changeSuccess = await makeRequest(
      'PATCH',
      '/api/farmer/settings/password',
      { currentPassword: farmer1InitialPassword, newPassword: newPasswordCandidate },
      approvedFarmer1Token
    );
    assert(changeSuccess.status === 200, 'Valid password change returns 200 OK');
    assert(changeSuccess.data.success === true, 'Response indicates success = true');

    // Never return passwordHash or password in response
    assert(changeSuccess.data.passwordHash === undefined, 'passwordHash is not present in response');
    assert(changeSuccess.data.password === undefined, 'password is not present in response');
    const rawResString = JSON.stringify(changeSuccess.data);
    assert(!rawResString.includes('passwordHash'), 'Raw response JSON does not contain "passwordHash"');

    // Direct check in PostgreSQL
    const updatedUserWithHash = await prisma.user.findUnique({ where: { id: farmer1UserId } });
    assert(
      updatedUserWithHash.passwordHash !== newPasswordCandidate,
      'PostgreSQL passwordHash is NOT plain text'
    );
    assert(
      updatedUserWithHash.passwordHash.startsWith('$2'),
      'PostgreSQL passwordHash is a valid bcrypt hash string'
    );
    assert(
      updatedUserWithHash.passwordHash !== oldHash,
      'PostgreSQL passwordHash was updated to a new hash'
    );

    // ------------------------------------------------------------------------
    // CRITERIA 14 & 15: Login works with new password; old password fails
    // ------------------------------------------------------------------------
    console.log('\n--- CRITERIA 14 & 15: LOGIN VERIFICATION WITH NEW VS OLD PASSWORD ---');

    // Login with old password must fail
    const oldLogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: farmer1Email,
      password: farmer1InitialPassword,
    });
    assert(
      oldLogin.status === 401,
      `Old password no longer works (Status: ${oldLogin.status} Unauthorized)`
    );

    // Login with new password must succeed
    const newLogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: farmer1Email,
      password: newPasswordCandidate,
    });
    assert(
      newLogin.status === 200,
      `New password successfully logs in (Status: ${newLogin.status} OK)`
    );
    assert(
      Boolean(newLogin.data?.data?.token),
      'New login returns valid fresh JWT token'
    );

    // ------------------------------------------------------------------------
    // CRITERIA 16 & 17: Notification preferences persistence & toggles
    // ------------------------------------------------------------------------
    console.log('\n--- CRITERIA 16 & 17: NOTIFICATION PREFERENCES TOGGLE & PERSISTENCE ---');

    const freshToken = newLogin.data.data.token;
    const toggleNotifications = await makeRequest(
      'PATCH',
      '/api/farmer/settings',
      {
        notifications: {
          orderAlerts: true,
          smsAlerts: false,
          inventoryWarnings: true,
          marketingEmail: false,
        },
      },
      freshToken
    );
    assert(toggleNotifications.status === 200, 'Notification preferences updated via fresh token (200)');
    assert(toggleNotifications.data.data.notifications.orderAlerts === true, 'orderAlerts toggled to true');
    assert(toggleNotifications.data.data.notifications.smsAlerts === false, 'smsAlerts toggled to false');

    const dbUserFresh = await prisma.user.findUnique({ where: { id: farmer1UserId } });
    assert(
      dbUserFresh.settings.notifications.smsAlerts === false,
      'PostgreSQL confirms smsAlerts persisted as false'
    );

  } catch (err) {
    console.error('Unhandled test exception:', err);
    failed++;
  } finally {
    // ------------------------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------------------------
    console.log('\n--- CLEANUP ---');
    try {
      if (createdUserIds.length > 0) {
        const createdFarmers = await prisma.farmer.findMany({
          where: { userId: { in: createdUserIds } },
          select: { id: true },
        });
        const farmerIds = createdFarmers.map((f) => f.id);
        if (farmerIds.length > 0) {
          await prisma.inventoryItem.deleteMany({ where: { farmerId: { in: farmerIds } } });
          await prisma.product.deleteMany({ where: { farmerId: { in: farmerIds } } });
          await prisma.farmerDocument.deleteMany({ where: { farmerId: { in: farmerIds } } });
          await prisma.farmer.deleteMany({ where: { id: { in: farmerIds } } });
        }
        await prisma.user.deleteMany({
          where: { id: { in: createdUserIds } },
        });
        console.log(`   ✓ Cleaned up ${createdUserIds.length} test user accounts.`);
      }
    } catch (e) {
      console.warn('   Cleanup notice:', e.message);
    }
  }

  console.log('\n======================================================');
  console.log(`TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSettingsTests();
