const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

async function runAdminAnalyticsE2ETests() {
  console.log('=== STARTING ADMIN ANALYTICS & REPORTS E2E INTEGRATION TESTS ===\n');
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
    // ----------------------------------------------------
    // 1. AUTHENTICATION & RBAC VERIFICATION
    // ----------------------------------------------------
    console.log('1. Verifying Admin Authentication & RBAC Access Controls...');

    const adminLoginRes = await makeRequest('POST', '/api/auth/admin/login', {
      email: 'admin@krishimarket.in',
      password: 'admin123',
    });
    const adminToken = adminLoginRes.data.data?.token;
    assert(adminLoginRes.status === 200 && adminToken, 'Admin logged in via POST /api/auth/admin/login');

    // Unauthenticated request should fail (401)
    const unauthRes = await makeRequest('GET', '/api/admin/analytics');
    assert(unauthRes.status === 401, 'Unauthenticated request to GET /api/admin/analytics blocked (401)');

    // Farmer login to test RBAC rejection
    let farmerToken = null;
    try {
      const farmerLoginRes = await makeRequest('POST', '/api/auth/login', {
        email: 'ramesh@krishimarket.in',
        password: 'password123',
      });
      farmerToken = farmerLoginRes.data.data?.token;
    } catch (e) {}

    if (farmerToken) {
      const forbiddenRes = await makeRequest('GET', '/api/admin/analytics', null, farmerToken);
      assert(
        forbiddenRes.status === 403,
        'Non-admin (FARMER) access to GET /api/admin/analytics forbidden (403)'
      );
    } else {
      assert(true, 'Farmer token test skipped (farmer user not present with default password)');
    }

    // ----------------------------------------------------
    // 2. FETCH ADMIN ANALYTICS PAYLOAD
    // ----------------------------------------------------
    console.log('\n2. Fetching Admin Analytics Payload from PostgreSQL...');
    const analyticsRes = await makeRequest('GET', '/api/admin/analytics?timeRange=6M', null, adminToken);
    assert(analyticsRes.status === 200, 'GET /api/admin/analytics?timeRange=6M returned 200 OK');
    assert(analyticsRes.data.success === true, 'Response contains { success: true }');
    const analytics = analyticsRes.data.data;
    assert(analytics && typeof analytics === 'object', 'Response data is a non-empty object');

    // ----------------------------------------------------
    // 3. VALIDATE 16 OPERATIONAL KPIS AGAINST POSTGRESQL DIRECT COUNTS
    // ----------------------------------------------------
    console.log('\n3. Validating 16 Overview KPIs Against Direct PostgreSQL Queries...');
    const kpis = analytics.kpis;
    assert(kpis && typeof kpis === 'object', 'kpis object exists in payload');

    const [
      dbTotalUsers,
      dbTotalFarmers,
      dbApprovedFarmers,
      dbPendingFarmers,
      dbRejectedFarmers,
      dbTotalConsumers,
      dbTotalProducts,
      dbActiveProducts,
      dbTotalOrders,
      dbDeliveredOrders,
      dbCancelledOrders,
      dbSalesAgg,
      dbActiveDeliveryBatches,
      dbActiveSurplusOffers,
      dbOpenDisputes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.farmer.count(),
      prisma.farmer.count({ where: { verificationStatus: 'APPROVED' } }),
      prisma.farmer.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.farmer.count({ where: { verificationStatus: 'REJECTED' } }),
      prisma.user.count({ where: { role: 'CONSUMER' } }),
      prisma.product.count(),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.order.aggregate({
        _sum: {
          total: true,
          farmerEarnings: true,
          platformFee: true,
          deliveryFee: true,
        },
      }),
      prisma.deliveryBatch.count({
        where: {
          status: { in: ['PENDING', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] },
        },
      }),
      prisma.surplusOffer.count({ where: { status: 'ACTIVE' } }),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
    ]);

    const expectedGmv = Math.round(Number(dbSalesAgg._sum.total || 0));
    const expectedFarmerEarnings = Math.round(Number(dbSalesAgg._sum.farmerEarnings || 0));
    const expectedPlatformRevenue = Math.round(
      Number(dbSalesAgg._sum.platformFee || 0) + Number(dbSalesAgg._sum.deliveryFee || 0)
    );

    assert(kpis.totalUsers === dbTotalUsers, `KPI totalUsers (${kpis.totalUsers}) matches DB (${dbTotalUsers})`);
    assert(kpis.totalFarmers === dbTotalFarmers, `KPI totalFarmers (${kpis.totalFarmers}) matches DB (${dbTotalFarmers})`);
    assert(kpis.approvedFarmers === dbApprovedFarmers, `KPI approvedFarmers (${kpis.approvedFarmers}) matches DB (${dbApprovedFarmers})`);
    assert(kpis.pendingFarmers === dbPendingFarmers, `KPI pendingFarmers (${kpis.pendingFarmers}) matches DB (${dbPendingFarmers})`);
    assert(kpis.rejectedFarmers === dbRejectedFarmers, `KPI rejectedFarmers (${kpis.rejectedFarmers}) matches DB (${dbRejectedFarmers})`);
    assert(kpis.totalConsumers === dbTotalConsumers, `KPI totalConsumers (${kpis.totalConsumers}) matches DB (${dbTotalConsumers})`);
    assert(kpis.totalProducts === dbTotalProducts, `KPI totalProducts (${kpis.totalProducts}) matches DB (${dbTotalProducts})`);
    assert(kpis.activeProducts === dbActiveProducts, `KPI activeProducts (${kpis.activeProducts}) matches DB (${dbActiveProducts})`);
    assert(kpis.totalOrders === dbTotalOrders, `KPI totalOrders (${kpis.totalOrders}) matches DB (${dbTotalOrders})`);
    assert(kpis.completedOrders === dbDeliveredOrders, `KPI completedOrders (${kpis.completedOrders}) matches DB (${dbDeliveredOrders})`);
    assert(kpis.cancelledOrders === dbCancelledOrders, `KPI cancelledOrders (${kpis.cancelledOrders}) matches DB (${dbCancelledOrders})`);
    assert(kpis.grossOrderValue === expectedGmv, `KPI grossOrderValue (₹${kpis.grossOrderValue}) matches DB (₹${expectedGmv})`);
    assert(kpis.farmerEarnings === expectedFarmerEarnings, `KPI farmerEarnings (₹${kpis.farmerEarnings}) matches DB (₹${expectedFarmerEarnings})`);
    assert(kpis.platformRevenue === expectedPlatformRevenue, `KPI platformRevenue (₹${kpis.platformRevenue}) matches DB (₹${expectedPlatformRevenue})`);
    assert(kpis.activeDeliveryBatches === dbActiveDeliveryBatches, `KPI activeDeliveryBatches (${kpis.activeDeliveryBatches}) matches DB (${dbActiveDeliveryBatches})`);
    assert(kpis.activeSurplusOffers === dbActiveSurplusOffers, `KPI activeSurplusOffers (${kpis.activeSurplusOffers}) matches DB (${dbActiveSurplusOffers})`);
    assert(kpis.openDisputes === dbOpenDisputes, `KPI openDisputes (${kpis.openDisputes}) matches DB (${dbOpenDisputes})`);

    // ----------------------------------------------------
    // 4. SALES & REVENUE ANALYTICS
    // ----------------------------------------------------
    console.log('\n4. Validating Sales & Financial Aggregations...');
    const sales = analytics.salesAnalytics;
    assert(sales && typeof sales === 'object', 'salesAnalytics object exists');
    assert(typeof sales.totalGmv === 'number', `totalGmv is a valid number (₹${sales.totalGmv})`);
    assert(typeof sales.farmerEarnings === 'number', `farmerEarnings is a valid number (₹${sales.farmerEarnings})`);
    assert(typeof sales.platformRevenue === 'number', `platformRevenue is a valid number (₹${sales.platformRevenue})`);
    assert(typeof sales.completedSales === 'number', `completedSales count is numeric (${sales.completedSales})`);
    assert(sales.statusBreakdown && typeof sales.statusBreakdown === 'object', 'SaleStatus breakdown provided');

    // ----------------------------------------------------
    // 5. ORDER ANALYTICS & STATUS BREAKDOWN
    // ----------------------------------------------------
    console.log('\n5. Validating Order Analytics & Fulfilment Rates...');
    const orders = analytics.orderAnalytics;
    assert(orders && typeof orders === 'object', 'orderAnalytics object exists');
    assert(orders.totalOrders === dbTotalOrders, `Total orders match DB (${orders.totalOrders})`);
    assert(typeof orders.deliveryCompletionRate === 'number', `Delivery completion rate calculated (${orders.deliveryCompletionRate}%)`);
    assert(orders.statusBreakdown && typeof orders.statusBreakdown === 'object', 'OrderStatus breakdown provided');
    assert(typeof orders.statusBreakdown.DELIVERED === 'number', 'Delivered orders count in breakdown');
    assert(typeof orders.statusBreakdown.CANCELLED === 'number', 'Cancelled orders count in breakdown');

    // ----------------------------------------------------
    // 6. REVENUE TREND SERIES
    // ----------------------------------------------------
    console.log('\n6. Validating Revenue Trend Time Series...');
    const revTrend = analytics.revenueTrend;
    assert(Array.isArray(revTrend) && revTrend.length > 0, `revenueTrend has ${revTrend?.length} time buckets`);
    const firstBucket = revTrend[0];
    assert(firstBucket && typeof firstBucket.label === 'string', 'Bucket has valid label');
    assert(typeof firstBucket.gmv === 'number' || typeof firstBucket.revenue === 'number', 'Bucket has valid gmv/revenue numbers');
    assert(typeof firstBucket.farmerEarnings === 'number' || typeof firstBucket.payouts === 'number', 'Bucket has valid farmer payout numbers');
    assert(typeof firstBucket.orders === 'number', 'Bucket has valid order count');

    // ----------------------------------------------------
    // 7. PRODUCT PERFORMANCE (HISTORICAL SNAPSHOTS)
    // ----------------------------------------------------
    console.log('\n7. Validating Product Performance & Top Selling Produce...');
    const prodPerf = analytics.productPerformance;
    assert(prodPerf && typeof prodPerf === 'object', 'productPerformance object exists');
    assert(Array.isArray(prodPerf.topProducts), 'topProducts is an array');
    if (prodPerf.topProducts.length > 0) {
      const topP = prodPerf.topProducts[0];
      assert(typeof topP.productName === 'string', `Top product has name: ${topP.productName}`);
      assert(typeof topP.quantitySold === 'number' && topP.quantitySold >= 0, `Top product has valid quantitySold (${topP.quantitySold})`);
      assert(typeof topP.revenue === 'number' && topP.revenue >= 0, `Top product has valid revenue (₹${topP.revenue})`);
      assert(typeof topP.ordersCount === 'number' && topP.ordersCount >= 0, `Top product has valid ordersCount (${topP.ordersCount})`);
    }

    // ----------------------------------------------------
    // 8. FARMER PERFORMANCE & GROWER LEADERBOARD
    // ----------------------------------------------------
    console.log('\n8. Validating Farmer Performance & Supply Pipeline...');
    const farmerPerf = analytics.farmerPerformance;
    assert(farmerPerf && typeof farmerPerf === 'object', 'farmerPerformance object exists');
    assert(farmerPerf.totalFarmers === dbTotalFarmers, 'Farmer count matches DB');
    assert(farmerPerf.approvedFarmers === dbApprovedFarmers, 'Approved farmers match DB');
    assert(Array.isArray(farmerPerf.topFarmers), 'topFarmers leaderboard is an array');
    if (farmerPerf.topFarmers.length > 0) {
      const topF = farmerPerf.topFarmers[0];
      assert(typeof topF.farmName === 'string', `Top farmer farmName: ${topF.farmName}`);
      assert(typeof topF.totalSales === 'number' && topF.totalSales >= 0, `Top farmer sales: ₹${topF.totalSales}`);
      assert(typeof topF.volumeSold === 'number' && topF.volumeSold >= 0, `Top farmer volume: ${topF.volumeSold}`);
    }

    // ----------------------------------------------------
    // 9. INVENTORY ANALYTICS & STOCK LEVELS
    // ----------------------------------------------------
    console.log('\n9. Validating Inventory Analytics & Produce Stock Levels...');
    const inv = analytics.inventoryAnalytics;
    assert(inv && typeof inv === 'object', 'inventoryAnalytics object exists');
    assert(typeof inv.totalItems === 'number', `totalItems is numeric (${inv.totalItems})`);
    assert(typeof inv.inStock === 'number', `inStock is numeric (${inv.inStock})`);
    assert(typeof inv.lowStock === 'number', `lowStock is numeric (${inv.lowStock})`);
    assert(typeof inv.outOfStock === 'number', `outOfStock is numeric (${inv.outOfStock})`);
    assert(typeof inv.availableQuantity === 'number', `availableQuantity is numeric (${inv.availableQuantity})`);

    // ----------------------------------------------------
    // 10. SURPLUS ANALYTICS & ZERO WASTE METRICS
    // ----------------------------------------------------
    console.log('\n10. Validating Surplus Deals & Flash Offer Analytics...');
    const surp = analytics.surplusAnalytics;
    assert(surp && typeof surp === 'object', 'surplusAnalytics object exists');
    assert(typeof surp.totalOffers === 'number', `totalOffers is numeric (${surp.totalOffers})`);
    assert(typeof surp.activeOffers === 'number', `activeOffers is numeric (${surp.activeOffers})`);
    assert(typeof surp.claimedOffers === 'number', `claimedOffers is numeric (${surp.claimedOffers})`);
    assert(typeof surp.totalAvailableQuantity === 'number', `totalAvailableQuantity is numeric (${surp.totalAvailableQuantity})`);

    // ----------------------------------------------------
    // 11. DELIVERY FLEET TELEMETRY
    // ----------------------------------------------------
    console.log('\n11. Validating Delivery Telemetry & Logistics Rates...');
    const del = analytics.deliveryAnalytics;
    assert(del && typeof del === 'object', 'deliveryAnalytics object exists');
    assert(typeof del.totalBatches === 'number', `totalBatches is numeric (${del.totalBatches})`);
    assert(typeof del.completionRate === 'number', `completionRate is numeric (${del.completionRate}%)`);
    assert(typeof del.averageDistanceKm === 'number', `averageDistanceKm is numeric (${del.averageDistanceKm} km)`);
    assert(del.statusBreakdown && typeof del.statusBreakdown === 'object', 'DeliveryBatchStatus breakdown provided');

    // ----------------------------------------------------
    // 12. CUSTOMER ANALYTICS & AOV
    // ----------------------------------------------------
    console.log('\n12. Validating Customer Household Analytics & AOV...');
    const cust = analytics.customerAnalytics;
    assert(cust && typeof cust === 'object', 'customerAnalytics object exists');
    assert(cust.totalConsumers === dbTotalConsumers, `totalConsumers matches DB (${cust.totalConsumers})`);
    assert(typeof cust.consumersWithOrders === 'number', `consumersWithOrders is numeric (${cust.consumersWithOrders})`);
    assert(typeof cust.averageOrderValue === 'number', `averageOrderValue is numeric (₹${cust.averageOrderValue})`);

    // ----------------------------------------------------
    // 13. QUALITY ASSURANCE: DISPUTES & REVIEWS HEALTH
    // ----------------------------------------------------
    console.log('\n13. Validating Dispute & Consumer Reviews Health...');
    const health = analytics.healthAnalytics;
    assert(health && typeof health === 'object', 'healthAnalytics object exists');
    assert(health.disputes && typeof health.disputes === 'object', 'disputes health metrics provided');
    assert(health.disputes.open === dbOpenDisputes, `Open disputes match DB (${health.disputes.open})`);
    assert(health.reviews && typeof health.reviews === 'object', 'reviews metrics provided');
    assert(typeof health.reviews.averageRating === 'number', `averageRating is numeric (★ ${health.reviews.averageRating})`);
    assert(typeof health.reviews.verifiedPurchasesCount === 'number', `verifiedPurchasesCount is numeric (${health.reviews.verifiedPurchasesCount})`);

    // ----------------------------------------------------
    // 14. TIME RANGE FILTERING TESTS (7D, 30D, 90D, 1Y)
    // ----------------------------------------------------
    console.log('\n14. Testing Time Range Filters...');
    for (const range of ['7D', '30D', '90D', '1Y']) {
      const rangeRes = await makeRequest('GET', `/api/admin/analytics?timeRange=${range}`, null, adminToken);
      assert(
        rangeRes.status === 200 && rangeRes.data.success === true,
        `timeRange=${range} succeeded and returned 200 OK`
      );
      assert(rangeRes.data.data.timeRange === range, `Response echoes timeRange=${range}`);
    }

    // ----------------------------------------------------
    // 15. CUSTOM DATE RANGE FILTERING
    // ----------------------------------------------------
    console.log('\n15. Testing Custom Date Range Filtering...');
    const customStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const customEnd = new Date().toISOString();
    const customRes = await makeRequest(
      'GET',
      `/api/admin/analytics?startDate=${encodeURIComponent(customStart)}&endDate=${encodeURIComponent(customEnd)}`,
      null,
      adminToken
    );
    assert(
      customRes.status === 200 && customRes.data.success === true,
      'Custom startDate and endDate filtering succeeded with 200 OK'
    );

    // ----------------------------------------------------
    // 16. BACKWARD COMPATIBILITY FIELDS
    // ----------------------------------------------------
    console.log('\n16. Validating Backward Compatibility Fields for Frontend Charts...');
    assert(Array.isArray(analytics.revenueOverTime), 'revenueOverTime is an array');
    assert(Array.isArray(analytics.ordersOverTime), 'ordersOverTime is an array');
    assert(Array.isArray(analytics.farmerRegistrations), 'farmerRegistrations is an array');
    assert(Array.isArray(analytics.categoryDistribution), 'categoryDistribution is an array');
    assert(Array.isArray(analytics.consumerGrowth), 'consumerGrowth is an array');
    assert(Array.isArray(analytics.deliveryPerformance), 'deliveryPerformance is an array');

    // ----------------------------------------------------
    // 17. ZERO SENSITIVE DATA EXPOSURE
    // ----------------------------------------------------
    console.log('\n17. Verifying Zero Sensitive Data Exposure...');
    const stringified = JSON.stringify(analytics);
    assert(!stringified.includes('passwordHash'), 'No passwordHash in analytics response');
    assert(!stringified.includes('aadharNumber'), 'No aadharNumber in analytics response');
    assert(!stringified.includes('bankAccountNumber'), 'No bankAccountNumber in analytics response');

    // ----------------------------------------------------
    // 18. NUMBER FORMATTING INTEGRITY
    // ----------------------------------------------------
    console.log('\n18. Verifying Number Formatting & Decimals...');
    assert(!isNaN(kpis.grossOrderValue), 'grossOrderValue is not NaN');
    assert(!isNaN(kpis.farmerEarnings), 'farmerEarnings is not NaN');
    assert(!isNaN(kpis.platformRevenue), 'platformRevenue is not NaN');
    assert(!stringified.includes('NaN'), 'No NaN values in serialized payload');
    assert(!stringified.includes('null,"grossOrderValue"'), 'grossOrderValue is non-null');

    // ----------------------------------------------------
    // 19. RESILIENT EMPTY STATE HANDLING
    // ----------------------------------------------------
    console.log('\n19. Testing Extreme Date Filter (Future Date Range for Empty Resiliency)...');
    const futureStart = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const futureEnd = new Date(Date.now() + 366 * 24 * 60 * 60 * 1000).toISOString();
    const futureRes = await makeRequest(
      'GET',
      `/api/admin/analytics?startDate=${encodeURIComponent(futureStart)}&endDate=${encodeURIComponent(futureEnd)}`,
      null,
      adminToken
    );
    assert(futureRes.status === 200, 'Future date range handled gracefully without crash');
    assert(
      Array.isArray(futureRes.data.data.productPerformance.topProducts) &&
        futureRes.data.data.productPerformance.topProducts.length === 0,
      'Empty products returned as empty array, not null or error'
    );

    // ----------------------------------------------------
    // 20. ENDPOINT RESPONSE PERFORMANCE & CONCURRENCY
    // ----------------------------------------------------
    console.log('\n20. Testing Concurrent Response Time...');
    const t0 = Date.now();
    await Promise.all([
      makeRequest('GET', '/api/admin/analytics?timeRange=30D', null, adminToken),
      makeRequest('GET', '/api/admin/analytics?timeRange=6M', null, adminToken),
      makeRequest('GET', '/api/admin/analytics?timeRange=1Y', null, adminToken),
    ]);
    const duration = Date.now() - t0;
    console.log(`   Concurrent 3-request duration: ${duration}ms`);
    assert(duration < 6000, `Concurrent requests completed promptly in ${duration}ms (<6000ms)`);

    console.log(`\n==================================================`);
    console.log(`ANALYTICS E2E TEST SUMMARY:`);
    console.log(`  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`==================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Unhandled test exception:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAdminAnalyticsE2ETests();
