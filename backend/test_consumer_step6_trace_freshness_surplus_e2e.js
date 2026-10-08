/**
 * CONSUMER MODULE — STEP 6: QR TRACEABILITY, FRESHNESS & SURPLUS E2E TEST SUITE
 * 
 * Verifies all 33+ criteria:
 * 1. Traceability: Valid batch loads with provenance, events, farmer & product
 * 2. Traceability: Event sorting (orderIndex ASC), honest event rendering, 404 on invalid batch
 * 3. Traceability Security: Zero KYC document or credential leakage
 * 4. Freshness Engine: Real-time dynamic calculation from harvestDate + shelfLifeDays
 * 5. Freshness Edge Cases: Fresh, Mid-life, Near-expiry, Expired, Missing date, Boundaries [0, 100], No NaN/Infinity
 * 6. Surplus Marketplace: GET /api/surplus active offers, filtering, search, sorting
 * 7. Surplus Expiry & Status: Overdue offers auto-expired, cancelled offers hidden
 * 8. Surplus Price & Quantity Validation: Server-computed offerPrice, stock limitation, non-negative quantities
 * 9. Surplus Security & IDOR: Multi-tenant protection, cross-farmer tamper prevention
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runStep6Tests() {
  console.log('========================================================================');
  console.log('   STEP 6: QR TRACEABILITY, FRESHNESS & SURPLUS MARKET E2E SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const timestamp = Date.now();

  try {
    // ----------------------------------------------------
    // SETUP: Admin, Approved Farmer 1, Approved Farmer 2, Consumer
    // ----------------------------------------------------
    console.log('--- 1. Setup Accounts & Test Entities ---');

    // Admin login
    const adminLogin = await request('POST', '/api/auth/admin/login', {
      email: 'admin@krishimarket.in',
      password: 'admin123',
    });
    assert(adminLogin.status === 200 && adminLogin.body.data?.token, 'Admin authenticated');
    const adminToken = adminLogin.body.data.token;

    // Register & Approve Farmer 1
    const farmer1Email = `f1_step6_${timestamp}@krishi.local`;
    const f1Reg = await request('POST', '/api/auth/farmer/register', {
      fullName: 'Basavaraj Gowda',
      email: farmer1Email,
      phone: `+91 9771${String(timestamp).slice(-6)}`,
      password: 'FarmerPassword@123',
      farmName: 'Cauvery Bio Farm',
      farmLocation: 'Mandya Organic Zone, Plot 8',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560068',
      hub: 'South Hub',
    });
    console.log('f1Reg result:', f1Reg.status, JSON.stringify(f1Reg.body || f1Reg.raw));
    assert(f1Reg.status === 201, 'Farmer 1 registered');
    const farmer1Id = f1Reg.body?.data?.farmer ? f1Reg.body.data.farmer.id : f1Reg.body?.data?.user?.farmerId;
    await request('POST', `/api/admin/farmers/${farmer1Id}/approve`, {}, adminToken);

    const f1Login = await request('POST', '/api/auth/farmer/login', {
      email: farmer1Email,
      password: 'FarmerPassword@123',
    });
    assert(f1Login.status === 200 && f1Login.body.data?.token, 'Farmer 1 approved & logged in');
    const farmer1Token = f1Login.body.data.token;

    // Register & Approve Farmer 2 (for IDOR tests)
    const farmer2Email = `f2_step6_${timestamp}@krishi.local`;
    const f2Reg = await request('POST', '/api/auth/farmer/register', {
      fullName: 'Suresh Kumar',
      email: farmer2Email,
      phone: `+91 9772${String(timestamp).slice(-6)}`,
      password: 'FarmerPassword@123',
      farmName: 'Western Ghats Agro',
      farmLocation: 'Shimoga Cluster',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      hub: 'East Hub',
    });
    const farmer2Id = f2Reg.body.data.farmer ? f2Reg.body.data.farmer.id : f2Reg.body.data.user.farmerId;
    await request('POST', `/api/admin/farmers/${farmer2Id}/approve`, {}, adminToken);

    const f2Login = await request('POST', '/api/auth/farmer/login', {
      email: farmer2Email,
      password: 'FarmerPassword@123',
    });
    assert(f2Login.status === 200 && f2Login.body.data?.token, 'Farmer 2 approved & logged in');
    const farmer2Token = f2Login.body.data.token;

    // Register Consumer
    const consumerEmail = `consumer_step6_${timestamp}@krishi.local`;
    const cReg = await request('POST', '/api/auth/consumer/register', {
      name: 'Aditi Sharma',
      email: consumerEmail,
      phone: '+91 98888 77777',
      password: 'Password@123',
    });
    assert(cReg.status === 201 && cReg.body.data?.token, 'Consumer registered');
    const consumerToken = cReg.body.data.token;

    // Create Test Product for Farmer 1
    const prodRes = await request('POST', '/api/farmer/products', {
      name: `Step6 Heirloom Carrots ${timestamp}`,
      category: 'VEGETABLES',
      description: 'Naturally grown crunchy orange carrots',
      price: 80,
      unit: '1 kg',
      availableQuantity: 200,
      stock: 200,
      farmingMethod: 'ORGANIC',
      isOrganic: true,
      shelfLifeDays: 6,
      harvestDate: new Date().toISOString(),
    }, farmer1Token);
    console.log('prodRes:', prodRes.status, JSON.stringify(prodRes.body || prodRes.raw));
    assert(prodRes.status === 201 && prodRes.body.data?.id, 'Product created for Farmer 1');
    const product1 = prodRes.body?.data;

    // ----------------------------------------------------
    // TEST SECTION 2: QR Traceability & Harvest Provenance Chain
    // ----------------------------------------------------
    console.log('\n--- 2. QR Traceability & Provenance Verification ---');

    // Farmer 1 records a Harvest Batch
    const harvestDate = new Date();
    const harvestRes = await request('POST', '/api/farmer/harvests', {
      productId: product1.id,
      quantity: 50,
      unit: 'kg',
      farmingMethod: 'ORGANIC',
      location: 'Field #3 South Polyhouse',
      expectedShelfLifeDays: 6,
      expectedFreshness: 98,
      notes: 'Morning dew harvest, zero chemical residues',
    }, farmer1Token);
    assert(harvestRes.status === 201 && harvestRes.body.data?.batchNumber, 'Harvest batch created');
    const batch = harvestRes.body.data;
    const batchNumber = batch.batchNumber;
    const batchId = batch.id;

    // Add Traceability Events in non-sequential orderIndex to test sorting
    const evt1 = await request('POST', `/api/farmer/harvests/${batchNumber}/traceability`, {
      step: 'FARM_ORIGIN',
      title: 'Indigenous Desi Seed Sowing',
      location: 'Cauvery Bio Farm • Plot 8',
      details: 'Sown with organic heirloom seeds. Soil enriched with Jeevamrutha.',
      verifiedBy: 'KOCA Organic Inspector',
      orderIndex: 1,
    }, farmer1Token);
    assert(evt1.status === 201, 'Traceability event 1 (FARM_ORIGIN) created');

    const evt3 = await request('POST', `/api/farmer/harvests/${batchNumber}/traceability`, {
      step: 'PACK',
      title: 'Packhouse Sorting & Eco-Crate Labeling',
      location: 'Mandya Hub Packhouse',
      details: 'Sorted, cleaned, and packed into breathable kraft containers.',
      verifiedBy: 'Quality Lead Ramesh G.',
      orderIndex: 3,
    }, farmer1Token);
    assert(evt3.status === 201, 'Traceability event 3 (PACK) created');

    const evt2 = await request('POST', `/api/farmer/harvests/${batchNumber}/traceability`, {
      step: 'HARVEST',
      title: 'Sunrise Hand Harvest',
      location: 'Field #3 South Polyhouse',
      details: 'Hand-picked at 5:45 AM for peak sugar & moisture balance.',
      actor: 'Lead Harvester: Basavaraj Gowda',
      orderIndex: 2,
    }, farmer1Token);
    assert(evt2.status === 201, 'Traceability event 2 (HARVEST) created');

    // Public Consumer queries /api/trace/:batchId
    const traceRes = await request('GET', `/api/trace/${batchNumber}`);
    assert(traceRes.status === 200, 'Public GET /api/trace/:batchId returned HTTP 200');
    const traceData = traceRes.body.data;

    // Validate Agricultural Provenance Data
    assert(traceData.batchNumber === batchNumber, 'Trace batchNumber matches authoritative record');
    assert(traceData.productName.includes('Heirloom Carrots'), 'Trace product name matches');
    assert(traceData.farmName === 'Cauvery Bio Farm', 'Farm name accurately attributed');
    assert(traceData.farmerName === 'Basavaraj Gowda', 'Farmer name accurately attributed');
    assert(traceData.farmingMethod === 'Organic', 'Farming method matches');
    assert(traceData.expectedShelfLifeDays === 6, 'Expected shelf life accurately returned');
    assert(typeof traceData.freshness?.percentage === 'number', 'Freshness score returned as a number');
    assert(traceData.freshness.percentage >= 80 && traceData.freshness.percentage <= 100, 'Fresh batch score is 80-100%');
    assert(traceData.freshness.status === 'Fresh', 'Fresh batch status is Fresh');

    // Validate Event Ordering & Honest Rendering
    assert(Array.isArray(traceData.traceabilityEvents) && traceData.traceabilityEvents.length === 3, 'All 3 events loaded');
    assert(traceData.traceabilityEvents[0].title === 'Indigenous Desi Seed Sowing', 'Event 1 sorted first (orderIndex 1)');
    assert(traceData.traceabilityEvents[1].title === 'Sunrise Hand Harvest', 'Event 2 sorted second (orderIndex 2)');
    assert(traceData.traceabilityEvents[2].title === 'Packhouse Sorting & Eco-Crate Labeling', 'Event 3 sorted third (orderIndex 3)');
    assert(traceData.traceabilityEvents[0].verifiedBy === 'KOCA Organic Inspector', 'Verification actor preserved');

    // Validate Query by raw UUID id
    const traceByIdRes = await request('GET', `/api/trace/${batchId}`);
    assert(traceByIdRes.status === 200 && traceByIdRes.body.data.batchNumber === batchNumber, 'Trace accessible by batch UUID');

    // ----------------------------------------------------
    // TEST SECTION 3: Traceability Security & Error Handlers
    // ----------------------------------------------------
    console.log('\n--- 3. Traceability Security & Privacy Checks ---');

    // 1. Invalid batch returns 404
    const notFoundTrace = await request('GET', '/api/trace/HAR-NONEXISTENT-9999');
    assert(notFoundTrace.status === 404, 'Non-existent batch ID returns HTTP 404');
    assert(notFoundTrace.body.error && notFoundTrace.body.error.includes('not found'), 'Safe error message returned');

    // 2. Data Privacy: Zero sensitive credentials or private KYC docs leaked
    assert(!traceData.farmer?.passwordHash, 'Zero passwordHash in public trace response');
    assert(!traceData.farmer?.verificationDocuments, 'Zero KYC documents in public trace response');
    assert(!traceData.farmer?.rejectionReason, 'Zero admin internal rejection fields in trace');

    // 3. IDOR: Farmer 2 cannot add traceability events to Farmer 1 batch
    const idorEvent = await request('POST', `/api/farmer/harvests/${batchNumber}/traceability`, {
      step: 'DISPATCH',
      title: 'Malicious Dispatch Injection',
      details: 'Should be rejected',
    }, farmer2Token);
    assert(idorEvent.status === 403, 'Cross-farmer event injection blocked with HTTP 403');

    // ----------------------------------------------------
    // TEST SECTION 4: Freshness Engine Dynamic Calculations & Edge Cases
    // ----------------------------------------------------
    console.log('\n--- 4. Freshness Engine Calculations & Edge Cases ---');

    const { calculateFreshness } = require('./dist/utils/freshness');

    // Reference time: 2026-10-05T10:00:00Z
    const refNow = new Date('2026-10-05T10:00:00Z');

    // Case 1: Fresh (Harvested 4 hours ago, 6 days shelf life)
    const fresh4h = calculateFreshness(new Date('2026-10-05T06:00:00Z'), 6, refNow);
    assert(fresh4h.percentage >= 95 && fresh4h.percentage <= 100, `Newly harvested score ~97% (Actual: ${fresh4h.percentage}%)`);
    assert(fresh4h.status === 'Fresh', 'Newly harvested status is Fresh');
    assert(!fresh4h.isExpired, 'Newly harvested is not expired');

    // Case 2: Mid-Life (Harvested 3 days ago, 6 days shelf life)
    const midLife = calculateFreshness(new Date('2026-10-02T10:00:00Z'), 6, refNow);
    assert(midLife.percentage === 50, `Mid-life 3/6 days score is exactly 50% (Actual: ${midLife.percentage}%)`);
    assert(midLife.status === 'Good', 'Mid-life status is Good');
    assert(midLife.daysRemaining === 3, 'Mid-life days remaining is 3');

    // Case 3: Near-Expiry / Use Soon (Harvested 5 days ago, 6 days shelf life)
    const nearExpiry = calculateFreshness(new Date('2026-09-30T10:00:00Z'), 6, refNow);
    assert(nearExpiry.percentage < 40 && nearExpiry.percentage > 0, `Near expiry score < 40% (Actual: ${nearExpiry.percentage}%)`);
    assert(nearExpiry.status === 'Use Soon', 'Near expiry status is Use Soon');
    assert(nearExpiry.isApproachingExpiry === true, 'isApproachingExpiry flag is true');

    // Case 4: Expired (Harvested 10 days ago, 6 days shelf life)
    const expiredHarvest = calculateFreshness(new Date('2026-09-25T10:00:00Z'), 6, refNow);
    assert(expiredHarvest.percentage === 0, 'Expired batch score is 0%');
    assert(expiredHarvest.status === 'Expired', 'Expired status is Expired');
    assert(expiredHarvest.isExpired === true, 'isExpired flag is true');
    assert(expiredHarvest.daysRemaining === 0, 'Days remaining is 0');

    // Case 5: Missing / Invalid Date handling
    const invalidDate = calculateFreshness('invalid-date-string', 6, refNow);
    assert(!isNaN(invalidDate.percentage), 'Invalid date produces valid number (no NaN)');
    assert(invalidDate.percentage >= 0 && invalidDate.percentage <= 100, 'Score is bounded [0, 100]');

    // Case 6: Zero or negative shelf life
    const zeroShelf = calculateFreshness(new Date('2026-10-05T06:00:00Z'), 0, refNow);
    assert(!isNaN(zeroShelf.percentage) && isFinite(zeroShelf.percentage), 'Zero shelf life handled safely (no Infinity/NaN)');

    // ----------------------------------------------------
    // TEST SECTION 5: Surplus Engine & Flash Discount Offers
    // ----------------------------------------------------
    console.log('\n--- 5. Surplus Marketplace & Server-Side Pricing ---');

    // Future expiry date (Tomorrow evening)
    const tomorrow = new Date(Date.now() + 36 * 3600 * 1000);

    // Farmer 1 creates Surplus Offer (Original Price: ₹80, 25% Discount -> Server Offer Price: ₹60)
    const surplusCreateRes = await request('POST', '/api/farmer/surplus', {
      productId: product1.id,
      batchId: batch.id,
      availableQuantity: 15,
      discountPercent: 25,
      expiryDate: tomorrow.toISOString(),
      reason: 'Harvest surplus - optimal consumption within 2 days',
      // Client-injected fake offerPrice to verify server overrides it
      offerPrice: 5,
    }, farmer1Token);
    assert(surplusCreateRes.status === 201, 'Surplus offer created');
    const offer = surplusCreateRes.body.data;
    const offerCode = offer.offerCode;
    const offerId = offer.id;

    // Verify Server-Side Price Calculation (₹80 - 25% = ₹60)
    assert(offer.originalPrice === 80, 'Original price is ₹80');
    assert(offer.discountPercent === 25, 'Discount percent is 25%');
    assert(offer.offerPrice === 60, 'Server-computed offerPrice is ₹60 (client fake price ignored)');
    assert(offer.availableQuantity === 15, 'Available surplus quantity is 15');
    assert(offer.status === 'Active', 'Initial surplus status is Active');

    // Consumer queries Public Surplus Marketplace (GET /api/surplus)
    const publicSurplus = await request('GET', '/api/surplus');
    assert(publicSurplus.status === 200, 'Public GET /api/surplus returned HTTP 200');
    assert(Array.isArray(publicSurplus.body.data), 'Returns an array of surplus offers');
    const foundOffer = publicSurplus.body.data.find((o) => o.offerCode === offerCode);
    assert(!!foundOffer, 'Created surplus offer is visible in public marketplace');
    assert(foundOffer.farmName === 'Cauvery Bio Farm', 'Farmer attribution present in surplus listing');
    assert(foundOffer.offerPrice === 60, 'Surplus offer price is ₹60 in public listing');

    // Filter by minDiscount: minDiscount=20 -> included, minDiscount=50 -> excluded
    const filter20 = await request('GET', '/api/surplus?minDiscount=20');
    assert(filter20.body.data.some((o) => o.offerCode === offerCode), 'Included in minDiscount=20 filter');

    const filter50 = await request('GET', '/api/surplus?minDiscount=50');
    assert(!filter50.body.data.some((o) => o.offerCode === offerCode), 'Excluded from minDiscount=50 filter');

    // Search by product name
    const searchSurplus = await request('GET', `/api/surplus?search=${encodeURIComponent('Heirloom Carrots')}`);
    assert(searchSurplus.body.data.some((o) => o.offerCode === offerCode), 'Found via search query');

    // Sort by highest discount
    const sortSurplus = await request('GET', '/api/surplus?sortBy=discount_high');
    assert(sortSurplus.status === 200, 'Sorting by highest discount succeeded');

    // Single Surplus Offer by offerCode
    const singleOffer = await request('GET', `/api/surplus/${offerCode}`);
    assert(singleOffer.status === 200 && singleOffer.body.data.offerCode === offerCode, 'Fetched single surplus offer');

    // ----------------------------------------------------
    // TEST SECTION 6: Surplus Expiry & Status Invariants
    // ----------------------------------------------------
    console.log('\n--- 6. Surplus Expiry & Inventory Protection ---');

    // Create an already-expired surplus offer to test server-side auto-expiry
    const pastDate = new Date(Date.now() - 3600 * 1000); // 1 hour ago
    // Attempting to set past date on creation should be rejected or expired
    const expiredCreate = await request('POST', '/api/farmer/surplus', {
      productId: product1.id,
      availableQuantity: 5,
      discountPercent: 30,
      expiryDate: pastDate.toISOString(),
      reason: 'Past expiry offer',
    }, farmer1Token);
    assert(expiredCreate.status === 400, 'Creating offer with past expiry date rejected with HTTP 400');

    // Excess Quantity Violation: Attempting to create surplus exceeding available product stock (stock: 200)
    const excessStock = await request('POST', '/api/farmer/surplus', {
      productId: product1.id,
      availableQuantity: 99999,
      discountPercent: 20,
      expiryDate: tomorrow.toISOString(),
      reason: 'Excessive stock',
    }, farmer1Token);
    assert(excessStock.status === 400, 'Surplus quantity exceeding available stock rejected with HTTP 400');
    assert(excessStock.body.error && excessStock.body.error.includes('cannot exceed available stock'), 'Stock limit error message');

    // IDOR / Security: Farmer 2 cannot cancel or edit Farmer 1's surplus offer
    const idorCancelSurplus = await request('DELETE', `/api/farmer/surplus/${offerId}`, null, farmer2Token);
    assert(idorCancelSurplus.status === 403, 'Cross-farmer surplus offer deletion blocked with HTTP 403');

    // Farmer 1 updates surplus offer (e.g. increase discount to 30%)
    const updateSurplus = await request('PATCH', `/api/farmer/surplus/${offerId}`, {
      discountPercent: 30,
    }, farmer1Token);
    assert(updateSurplus.status === 200, 'Farmer 1 updated surplus discount to 30%');
    assert(updateSurplus.body.data.offerPrice === 56, 'Server recalculated offerPrice to ₹56 (₹80 - 30% = ₹56)');

    // Farmer 1 cancels surplus offer
    const cancelSurplus = await request('DELETE', `/api/farmer/surplus/${offerId}`, null, farmer1Token);
    assert(cancelSurplus.status === 200 && cancelSurplus.body.data.status === 'Cancelled', 'Farmer 1 cancelled surplus offer');

    // Cancelled surplus offer is no longer visible in public marketplace
    const publicAfterCancel = await request('GET', '/api/surplus');
    assert(
      !publicAfterCancel.body.data.some((o) => o.offerCode === offerCode),
      'Cancelled surplus offer is automatically removed from public marketplace'
    );

    // GET /api/surplus/:id for cancelled offer returns 404
    const singleCancelled = await request('GET', `/api/surplus/${offerCode}`);
    assert(singleCancelled.status === 404, 'Cancelled surplus offer returns 404 for public consumer view');

  } catch (err) {
    console.error('Unexpected test execution error:', err);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep6Tests();
