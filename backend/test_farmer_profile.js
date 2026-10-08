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

async function runProfileTests() {
  console.log('====================================================');
  console.log('=== STARTING FARMER PROFILE INTEGRATION TEST SUITE ===');
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

  let farmer1UserId = null;
  let farmer2UserId = null;
  let consumerUserId = null;

  try {
    // ------------------------------------------------------------------------
    // SETUP ACTORS
    // ------------------------------------------------------------------------
    console.log('0. Setting up test actors in PostgreSQL...');

    // Health check wait
    let healthy = false;
    for (let i = 0; i < 5; i++) {
      try {
        const h = await makeRequest('GET', '/api/health');
        if (h.status === 200) {
          healthy = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    assert(healthy, 'Backend server is healthy and responding (200)');

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
      assert(Boolean(adminToken), 'Admin token generated via test fallback');
    }

    // Register Farmer 1 (will be approved)
    const farmer1Email = `farmer1.profile.${timestamp}@krishitest.com`;
    const farmer1Password = 'FarmerPassword123!';
    const farmer1Reg = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Original Farmer One',
      email: farmer1Email,
      password: farmer1Password,
      phone: `981${String(timestamp).slice(-7)}`,
      farmName: 'Original Green Haven',
      farmLocation: 'Survey 42, Mandya Rural',
      city: 'Mandya',
      state: 'Karnataka',
      pincode: '571401',
      mainCrops: ['Tomatoes', 'Brinjal'],
    });
    assert(farmer1Reg.status === 201, 'Farmer 1 registration succeeds (201)');
    const farmer1Token = farmer1Reg.data.data.token;
    const farmer1FarmerId = farmer1Reg.data.data.farmer.id;
    farmer1UserId = farmer1Reg.data.data.user.id;

    // Approve Farmer 1
    const approveF1 = await makeRequest(
      'POST',
      `/api/admin/farmers/${farmer1FarmerId}/approve`,
      {},
      adminToken
    );
    assert(approveF1.status === 200, 'Farmer 1 approved by admin (200)');

    // Register Farmer 2 (will remain pending)
    const farmer2Email = `farmer2.profile.${timestamp}@krishitest.com`;
    const farmer2Reg = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Pending Farmer Two',
      email: farmer2Email,
      password: 'FarmerPassword123!',
      phone: `982${String(timestamp).slice(-7)}`,
      farmName: 'Sunset Valley Farm',
      farmLocation: 'Survey 88, Kolar',
      city: 'Kolar',
      state: 'Karnataka',
      pincode: '563101',
      mainCrops: ['Spinach'],
    });
    assert(farmer2Reg.status === 201, 'Farmer 2 registration succeeds (201)');
    const farmer2Token = farmer2Reg.data.data.token;
    const farmer2FarmerId = farmer2Reg.data.data.farmer.id;
    farmer2UserId = farmer2Reg.data.data.user.id;

    // Register Consumer
    const consumerEmail = `consumer.profile.${timestamp}@krishitest.com`;
    const consumerReg = await makeRequest('POST', '/api/auth/consumer/register', {
      name: 'Regular Consumer',
      email: consumerEmail,
      password: 'ConsumerPassword123!',
      phone: `989${String(timestamp).slice(-7)}`,
    });
    assert(consumerReg.status === 201, 'Consumer registration succeeds (201)');
    const consumerToken = consumerReg.data.data.token;
    consumerUserId = consumerReg.data.data.user.id;

    console.log('\n----------------------------------------------------');
    console.log('CRITERION 1: Approved farmer can update profile');
    console.log('----------------------------------------------------');
    const updatePayload1 = {
      farmName: 'EcoVeda Organics Sanctum',
      location: 'Maddur Taluk, Mandya, Karnataka',
      farmLocation: 'Sy No 45/2B, Maddur Taluk, Mandya',
      city: 'Maddur',
      state: 'Karnataka',
      pincode: '571428',
      hub: 'Mysuru Highway Hub',
      farmingMethod: 'Natural (ZBNF)',
      yearsFarming: 6,
      acreage: 12.5,
      mainCrops: ['Heirloom Tomatoes', 'Desi Sweet Corn', 'Red Amaranth'],
      farmDescription: 'Practicing Subhash Palekar Natural Farming with zero synthetic fertilizers.',
      story: 'Generational farm transitioned to pure regenerative natural agriculture in 2018.',
      soilPractices: ['Jeevamrutha', 'Mulching', 'Agni Astra'],
      waterSource: 'Solar powered rainwater harvesting tank',
      certifications: ['Jaivik Bharat', 'NPOP India Organic'],
      coverImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854',
      gallery: [
        'https://images.unsplash.com/photo-1',
        'https://images.unsplash.com/photo-2',
      ],
    };

    const updateRes1 = await makeRequest('PATCH', '/api/farmer/profile', updatePayload1, farmer1Token);
    assert(updateRes1.status === 200, 'PATCH /api/farmer/profile returns 200');
    assert(updateRes1.data.success === true, 'Response indicates success = true');
    assert(updateRes1.data.data.farmName === 'EcoVeda Organics Sanctum', 'farmName updated in response');
    assert(updateRes1.data.data.farmingMethod === 'NATURAL_ZBNF', 'farmingMethod mapped to Prisma enum');
    assert(updateRes1.data.data.farmingMethodDisplay === 'Natural (ZBNF)', 'farmingMethodDisplay returns formatted label');
    assert(updateRes1.data.data.acreage === 12.5, 'acreage updated in response (12.5)');
    assert(updateRes1.data.data.yearsFarming === 6, 'yearsFarming updated in response (6)');
    assert(updateRes1.data.data.pincode === '571428', 'pincode updated in response (571428)');
    assert(
      Array.isArray(updateRes1.data.data.mainCrops) && updateRes1.data.data.mainCrops.length === 3,
      'mainCrops array updated in response'
    );

    console.log('\n----------------------------------------------------');
    console.log('CRITERION 2: Changes persist in PostgreSQL');
    console.log('----------------------------------------------------');
    const dbFarmer1 = await prisma.farmer.findUnique({
      where: { id: farmer1FarmerId },
      include: { user: true },
    });
    assert(dbFarmer1 !== null, 'Farmer record located directly in PostgreSQL');
    assert(dbFarmer1.farmName === 'EcoVeda Organics Sanctum', 'PostgreSQL Farmer.farmName matches update');
    assert(dbFarmer1.farmingMethod === 'NATURAL_ZBNF', 'PostgreSQL Farmer.farmingMethod is NATURAL_ZBNF');
    assert(Number(dbFarmer1.acreage) === 12.5, 'PostgreSQL Farmer.acreage is 12.5');
    assert(dbFarmer1.yearsFarming === 6, 'PostgreSQL Farmer.yearsFarming is 6');
    assert(dbFarmer1.pincode === '571428', 'PostgreSQL Farmer.pincode is 571428');
    assert(dbFarmer1.hub === 'Mysuru Highway Hub', 'PostgreSQL Farmer.hub matches update');
    assert(dbFarmer1.mainCrops.includes('Desi Sweet Corn'), 'PostgreSQL mainCrops contains Desi Sweet Corn');
    assert(dbFarmer1.soilPractices.includes('Jeevamrutha'), 'PostgreSQL soilPractices contains Jeevamrutha');

    console.log('\n----------------------------------------------------');
    console.log('CRITERION 3: Farmer can retrieve updated profile');
    console.log('----------------------------------------------------');
    const getProfileMeRes = await makeRequest('GET', '/api/farmer/profile', null, farmer1Token);
    assert(getProfileMeRes.status === 200, 'GET /api/farmer/profile returns 200');
    assert(getProfileMeRes.data.success === true, 'GET /api/farmer/profile success = true');
    assert(getProfileMeRes.data.data.farmName === 'EcoVeda Organics Sanctum', 'Retrieved profile has updated farmName');
    assert(getProfileMeRes.data.data.farmerId === farmer1FarmerId, 'Retrieved profile matches authenticated farmerId');

    const getProfileParamRes = await makeRequest(
      'GET',
      `/api/farmer/profile/${farmer1FarmerId}`,
      null,
      farmer1Token
    );
    assert(getProfileParamRes.status === 200, 'GET /api/farmer/profile/:farmerId returns 200 for own ID');
    assert(getProfileParamRes.data.data.farmName === 'EcoVeda Organics Sanctum', 'Param fetch returns updated data');

    console.log('\n----------------------------------------------------');
    console.log('CRITERION 4: Farmer cannot update another farmer’s profile (cross-tenant denied)');
    console.log('----------------------------------------------------');
    // Farmer 2 attempts to update Farmer 1 via param
    const crossTenantParam = await makeRequest(
      'PATCH',
      `/api/farmer/profile/${farmer1FarmerId}`,
      { farmName: 'Hacked By Farmer Two' },
      farmer2Token
    );
    assert(crossTenantParam.status === 403, 'Cross-tenant PATCH by :farmerId rejected with 403 Forbidden');

    // Farmer 2 attempts to pass farmer1FarmerId in body to /api/farmer/profile
    const crossTenantBodyFarmerId = await makeRequest(
      'PATCH',
      '/api/farmer/profile',
      { farmerId: farmer1FarmerId, farmName: 'Hacked By Body FarmerId' },
      farmer2Token
    );
    assert(crossTenantBodyFarmerId.status === 403, 'Tampering farmerId in body rejected with 403 Forbidden');

    // Farmer 2 attempts to pass farmer1UserId in body to /api/farmer/profile
    const crossTenantBodyUserId = await makeRequest(
      'PATCH',
      '/api/farmer/profile',
      { userId: farmer1UserId, farmName: 'Hacked By Body UserId' },
      farmer2Token
    );
    assert(crossTenantBodyUserId.status === 403, 'Tampering userId in body rejected with 403 Forbidden');

    // Farmer 2 attempts to view Farmer 1's profile via GET /api/farmer/profile/:farmer1FarmerId
    const crossTenantGet = await makeRequest(
      'GET',
      `/api/farmer/profile/${farmer1FarmerId}`,
      null,
      farmer2Token
    );
    assert(crossTenantGet.status === 403, 'Cross-tenant GET /api/farmer/profile/:farmerId rejected with 403');

    // Verify Farmer 1 in DB remained completely unaltered
    const dbFarmer1AfterAttack = await prisma.farmer.findUnique({ where: { id: farmer1FarmerId } });
    assert(
      dbFarmer1AfterAttack.farmName === 'EcoVeda Organics Sanctum',
      'Farmer 1 record in PostgreSQL completely untouched by cross-tenant attacks'
    );

    console.log('\n----------------------------------------------------');
    console.log('CRITERION 5: Unauthenticated request rejected (401)');
    console.log('----------------------------------------------------');
    const noTokenPatch = await makeRequest('PATCH', '/api/farmer/profile', { farmName: 'No Token Farm' });
    assert(noTokenPatch.status === 401, 'Unauthenticated PATCH /api/farmer/profile returns 401 Unauthorized');

    const noTokenGet = await makeRequest('GET', '/api/farmer/profile', null);
    assert(noTokenGet.status === 401, 'Unauthenticated GET /api/farmer/profile returns 401 Unauthorized');

    const badTokenPatch = await makeRequest(
      'PATCH',
      '/api/farmer/profile',
      { farmName: 'Bad Token Farm' },
      'invalid.jwt.token'
    );
    assert(badTokenPatch.status === 401, 'Invalid Bearer token returns 401 Unauthorized');

    console.log('\n----------------------------------------------------');
    console.log('CRITERION 6: Non-farmer (Consumer) rejected (403)');
    console.log('----------------------------------------------------');
    const consumerPatch = await makeRequest(
      'PATCH',
      '/api/farmer/profile',
      { farmName: 'Consumer Tries Farming' },
      consumerToken
    );
    assert(consumerPatch.status === 403, 'Consumer role PATCH /api/farmer/profile returns 403 Forbidden');

    const consumerGet = await makeRequest('GET', '/api/farmer/profile', null, consumerToken);
    assert(consumerGet.status === 403, 'Consumer role GET /api/farmer/profile returns 403 Forbidden');

    console.log('\n----------------------------------------------------');
    console.log('CRITERION 7: Invalid data rejected (400 Bad Request)');
    console.log('----------------------------------------------------');
    // Empty farmName
    const emptyFarmName = await makeRequest(
      'PATCH',
      '/api/farmer/profile',
      { farmName: '   ' },
      farmer1Token
    );
    assert(emptyFarmName.status === 400, 'Empty farmName rejected with 400 Bad Request');
    assert(emptyFarmName.data.error.includes('cannot be empty'), 'Error message specifies farmName cannot be empty');

    // Empty name
    const emptyName = await makeRequest(
      'PATCH',
      '/api/farmer/profile',
      { name: '' },
      farmer1Token
    );
    assert(emptyName.status === 400, 'Empty name rejected with 400 Bad Request');

    // Negative acreage
    const negAcreage = await makeRequest(
      'PATCH',
      '/api/farmer/profile',
      { acreage: -5 },
      farmer1Token
    );
    assert(negAcreage.status === 400, 'Negative acreage rejected with 400 Bad Request');
    assert(negAcreage.data.error.includes('non-negative'), 'Error message specifies acreage must be non-negative');

    // Negative yearsFarming
    const negYears = await makeRequest(
      'PATCH',
      '/api/farmer/profile',
      { yearsFarming: -2 },
      farmer1Token
    );
    assert(negYears.status === 400, 'Negative yearsFarming rejected with 400 Bad Request');

    // Invalid pincode (not 6 digits)
    const invalidPin = await makeRequest(
      'PATCH',
      '/api/farmer/profile',
      { pincode: '5600' },
      farmer1Token
    );
    assert(invalidPin.status === 400, 'Invalid pincode (4 digits) rejected with 400 Bad Request');
    assert(invalidPin.data.error.includes('pincode'), 'Error message specifies invalid pincode');

    console.log('\n----------------------------------------------------');
    console.log('CRITERIA 8-12: Verification fields cannot be modified by farmer');
    console.log('----------------------------------------------------');
    // Farmer 2 is PENDING. Tries to self-approve and set admin fields
    const selfApproveAttempt = await makeRequest(
      'PATCH',
      '/api/farmer/profile',
      {
        farmName: 'Sunset Valley Self Approve',
        verificationStatus: 'APPROVED',
        isVerified: true,
        approvedAt: new Date().toISOString(),
        approvedById: adminLogin.data.data.user.id,
        rejectionReason: 'Self cleared',
      },
      farmer2Token
    );
    assert(selfApproveAttempt.status === 200, 'Profile update request processed (200)');

    // Check Farmer 2 directly in DB
    const dbFarmer2 = await prisma.farmer.findUnique({ where: { id: farmer2FarmerId } });
    assert(
      dbFarmer2.verificationStatus === 'PENDING',
      'CRITERION 8: verificationStatus remains PENDING in PostgreSQL'
    );
    assert(
      dbFarmer2.isVerified === false,
      'CRITERION 9: isVerified remains false in PostgreSQL'
    );
    assert(
      dbFarmer2.approvedAt === null,
      'CRITERION 10: approvedAt remains null in PostgreSQL'
    );
    assert(
      dbFarmer2.approvedById === null,
      'CRITERION 11: approvedById remains null in PostgreSQL'
    );
    assert(
      dbFarmer2.rejectionReason === null,
      'CRITERION 12: rejectionReason remains unchanged in PostgreSQL'
    );

    // Verify Farmer 1 (who is APPROVED) also cannot be modified via profile update to change verification status
    const farmer1Tamper = await makeRequest(
      'PATCH',
      '/api/farmer/profile',
      {
        verificationStatus: 'REJECTED',
        isVerified: false,
        rejectionReason: 'Tampered rejection',
      },
      farmer1Token
    );
    assert(farmer1Tamper.status === 200, 'Farmer 1 update processed (200)');
    const dbFarmer1Status = await prisma.farmer.findUnique({ where: { id: farmer1FarmerId } });
    assert(
      dbFarmer1Status.verificationStatus === 'APPROVED',
      'Farmer 1 verificationStatus remains APPROVED in PostgreSQL'
    );
    assert(
      dbFarmer1Status.isVerified === true,
      'Farmer 1 isVerified remains true in PostgreSQL'
    );
    assert(
      dbFarmer1Status.rejectionReason === null,
      'Farmer 1 rejectionReason remains null in PostgreSQL'
    );

    console.log('\n----------------------------------------------------');
    console.log('CRITERION 13: User-level fields update in PostgreSQL User table');
    console.log('----------------------------------------------------');
    const userFieldsUpdate = await makeRequest(
      'PATCH',
      '/api/farmer/profile',
      {
        name: 'Gowda Ramachandrappa',
        phone: '9845012345',
        avatar: 'https://images.unsplash.com/photo-farmer-gowda-updated.jpg',
      },
      farmer1Token
    );
    assert(userFieldsUpdate.status === 200, 'User fields update returns 200');
    assert(userFieldsUpdate.data.data.name === 'Gowda Ramachandrappa', 'Response reflects updated name');
    assert(userFieldsUpdate.data.data.phone === '9845012345', 'Response reflects updated phone');
    assert(
      userFieldsUpdate.data.data.avatar === 'https://images.unsplash.com/photo-farmer-gowda-updated.jpg',
      'Response reflects updated avatar'
    );

    // Direct DB verification on User model
    const dbUser1 = await prisma.user.findUnique({ where: { id: farmer1UserId } });
    assert(dbUser1 !== null, 'User record found in PostgreSQL');
    assert(dbUser1.name === 'Gowda Ramachandrappa', 'PostgreSQL User.name updated atomically');
    assert(dbUser1.phone === '9845012345', 'PostgreSQL User.phone updated atomically');
    assert(
      dbUser1.avatar === 'https://images.unsplash.com/photo-farmer-gowda-updated.jpg',
      'PostgreSQL User.avatar updated atomically'
    );

    console.log('\n----------------------------------------------------');
    console.log('CRITERION 14: Farmer authentication still works after update');
    console.log('----------------------------------------------------');
    const loginAfterUpdate = await makeRequest('POST', '/api/auth/farmer/login', {
      email: farmer1Email,
      password: farmer1Password,
    });
    assert(loginAfterUpdate.status === 200, 'Farmer login succeeds after profile update (200)');
    assert(
      loginAfterUpdate.data.data.user.name === 'Gowda Ramachandrappa',
      'Login response reflects updated user name'
    );
    const refreshedToken = loginAfterUpdate.data.data.token;
    assert(Boolean(refreshedToken), 'New authenticated token issued');

    // Retrieve profile with freshly issued login token
    const fetchWithNewToken = await makeRequest('GET', '/api/farmer/profile', null, refreshedToken);
    assert(fetchWithNewToken.status === 200, 'GET /api/farmer/profile with refreshed token succeeds (200)');
    assert(
      fetchWithNewToken.data.data.name === 'Gowda Ramachandrappa',
      'Profile with refreshed token returns updated user details'
    );

    console.log('\n====================================================');
    console.log(`TEST RUN COMPLETE: ${passed} passed, ${failed} failed`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Unhandled test suite error:', err);
    process.exitCode = 1;
  } finally {
    console.log('Cleaning up test data from PostgreSQL...');
    try {
      if (farmer1UserId) {
        await prisma.user.delete({ where: { id: farmer1UserId } }).catch(() => {});
      }
      if (farmer2UserId) {
        await prisma.user.delete({ where: { id: farmer2UserId } }).catch(() => {});
      }
      if (consumerUserId) {
        await prisma.user.delete({ where: { id: consumerUserId } }).catch(() => {});
      }
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }
    await prisma.$disconnect();
  }
}

runProfileTests();
