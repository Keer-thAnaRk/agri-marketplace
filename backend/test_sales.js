const http = require('http');

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

async function runSalesTests() {
  console.log('=== STARTING SALES & PAYOUTS INTEGRATION TESTS ===\n');
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

  try {
    // 0. Setup actors: Admin, Farmer A (Approved), Farmer B (Approved, no sales), Farmer P (Pending), Farmer R (Rejected), Consumer
    console.log('0. Setting up test actors in PostgreSQL...');

    // Admin login
    const adminLogin = await makeRequest('POST', '/api/auth/admin/login', {
      email: 'admin@krishimarket.in',
      password: 'admin123',
    });
    assert(adminLogin.status === 200, 'Admin login succeeds (200)');
    const adminToken = adminLogin.data.data.token;

    // Register Farmer A (Active Approved Farmer)
    const farmerAEmail = `ravi.sales.${timestamp}@krishitest.com`;
    const farmerARes = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Ravi Kumar Sales',
      email: farmerAEmail,
      password: 'FarmerPassword123!',
      phone: `981${String(timestamp).slice(-7)}`,
      farmName: 'Ravi Organic Harvests',
      farmLocation: 'Sarjapur Hobli',
      location: 'Sarjapur Road, Bengaluru',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '562125',
      hub: 'Sarjapur Road',
      farmingMethod: 'ORGANIC',
      yearsFarming: 10,
      acreage: 5.0,
      mainCrops: ['Country Tomatoes', 'Palak'],
    });
    assert(farmerARes.status === 201, 'Farmer A registered (201)');
    const farmerAId = farmerARes.data.data.farmer.id;

    // Approve Farmer A
    const approveA = await makeRequest(
      'POST',
      `/api/admin/farmers/${farmerAId}/approve`,
      { notes: 'Sales testing approval' },
      adminToken
    );
    assert(approveA.status === 200, 'Farmer A approved by admin (200)');

    const farmerALogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: farmerAEmail,
      password: 'FarmerPassword123!',
    });
    const farmerAToken = farmerALogin.data.data.token;

    // Register Farmer B (Approved Farmer with Zero Sales)
    const farmerBEmail = `suresh.sales.${timestamp}@krishitest.com`;
    const farmerBRes = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Suresh Gowda',
      email: farmerBEmail,
      password: 'FarmerPassword123!',
      phone: `982${String(timestamp).slice(-7)}`,
      farmName: 'Cauvery Bio Farm',
      farmLocation: 'Mandya District',
      location: 'Koramangala, Bengaluru',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '571401',
      hub: 'Koramangala',
      farmingMethod: 'NATURAL',
      yearsFarming: 4,
      acreage: 3.0,
      mainCrops: ['Potatoes'],
    });
    assert(farmerBRes.status === 201, 'Farmer B registered (201)');
    const farmerBId = farmerBRes.data.data.farmer.id;

    const approveB = await makeRequest(
      'POST',
      `/api/admin/farmers/${farmerBId}/approve`,
      { notes: 'Sales testing approval B' },
      adminToken
    );
    assert(approveB.status === 200, 'Farmer B approved by admin (200)');

    const farmerBLogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: farmerBEmail,
      password: 'FarmerPassword123!',
    });
    const farmerBToken = farmerBLogin.data.data.token;

    // Register Farmer P (Pending verification)
    const farmerPEmail = `pending.sales.${timestamp}@krishitest.com`;
    const farmerPRes = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Pending Farmer',
      email: farmerPEmail,
      password: 'FarmerPassword123!',
      phone: `983${String(timestamp).slice(-7)}`,
      farmName: 'Pending Farm',
      farmLocation: 'Hubli',
      location: 'Hubli, Karnataka',
      city: 'Hubli',
      state: 'Karnataka',
      pincode: '580020',
      hub: 'Hubli Central',
      farmingMethod: 'CONVENTIONAL',
      yearsFarming: 2,
      acreage: 2.0,
      mainCrops: ['Millets'],
    });
    assert(farmerPRes.status === 201, 'Farmer P registered as PENDING (201)');
    const farmerPLogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: farmerPEmail,
      password: 'FarmerPassword123!',
    });
    const farmerPToken = farmerPLogin.data.data.token;

    // Register Farmer R (Rejected verification)
    const farmerREmail = `rejected.sales.${timestamp}@krishitest.com`;
    const farmerRRes = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Rejected Farmer',
      email: farmerREmail,
      password: 'FarmerPassword123!',
      phone: `984${String(timestamp).slice(-7)}`,
      farmName: 'Rejected Farm',
      farmLocation: 'Bellary',
      location: 'Bellary, Karnataka',
      city: 'Bellary',
      state: 'Karnataka',
      pincode: '583101',
      hub: 'Bellary Central',
      farmingMethod: 'CONVENTIONAL',
      yearsFarming: 1,
      acreage: 1.0,
      mainCrops: ['Cotton'],
    });
    const farmerRId = farmerRRes.data.data.farmer.id;
    await makeRequest(
      'POST',
      `/api/admin/farmers/${farmerRId}/reject`,
      { reason: 'Invalid land records provided' },
      adminToken
    );
    const farmerRLogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: farmerREmail,
      password: 'FarmerPassword123!',
    });
    const farmerRToken = farmerRLogin.data.data.token;

    // Consumer Setup
    const consumerEmail = `consumer.sales.${timestamp}@krishitest.com`;
    const consumerReg = await makeRequest('POST', '/api/auth/consumer/register', {
      name: 'Ananya Consumer',
      email: consumerEmail,
      password: 'ConsumerPassword123!',
      phone: `989${String(timestamp).slice(-7)}`,
    });
    const consumerToken = consumerReg.data?.data?.token;
    assert(consumerReg.status === 201 && !!consumerToken, 'Consumer authenticated successfully');

    // Create Products for Farmer A
    const prodARes = await makeRequest(
      'POST',
      '/api/farmer/products',
      {
        name: 'Country Nati Tomatoes',
        category: 'VEGETABLES',
        description: 'Vine-ripened organic tomatoes',
        price: 50.0,
        unit: '1 kg',
        unitShort: 'kg',
        availableQuantity: 100,
        farmingMethod: 'ORGANIC',
      },
      farmerAToken
    );
    assert(prodARes.status === 201, 'Farmer A created Product 1 (Tomatoes @ ₹50/kg)');
    const prodAId = prodARes.data.data.id;

    // =========================================================================
    // SCENARIO 2: Non-delivered order does not create sale
    // =========================================================================
    console.log('\n--- Scenario 2: Non-delivered order does not create sale ---');
    const orderPlacedRes = await makeRequest(
      'POST',
      '/api/orders',
      {
        items: [{ productId: prodAId, quantity: 2 }], // 2 kg @ ₹50 = ₹100
        paymentMethod: 'UPI',
        deliveryAddress: {
          name: 'Ananya Sharma',
          phone: '+91 98451 99012',
          addressLine: '12 Green Glen, Sarjapur Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '562125',
          hub: 'Sarjapur Road',
        },
        deliverySlot: {
          name: 'Morning Fresh',
          timeRange: '8:00 AM – 11:00 AM',
        },
      },
      consumerToken
    );
    assert(orderPlacedRes.status === 201, 'Order 1 placed (status: PLACED)');
    const order1Id = orderPlacedRes.data.data.id;

    const salesCheck1 = await makeRequest('GET', '/api/farmer/sales', null, farmerAToken);
    const order1Sales = (salesCheck1.data.data || []).filter(
      (s) => s.rawOrderId === order1Id || s.orderId === orderPlacedRes.data.data.orderNumber
    );
    assert(order1Sales.length === 0, 'Scenario 2: Non-delivered order (PLACED) creates 0 sales');

    // =========================================================================
    // SCENARIO 3: Cancelled order does not create sale
    // =========================================================================
    console.log('\n--- Scenario 3: Cancelled order does not create sale ---');
    const cancelRes = await makeRequest(
      'PATCH',
      `/api/farmer/orders/${order1Id}/status`,
      { status: 'Cancelled' },
      farmerAToken
    );
    assert(cancelRes.status === 200, 'Order 1 cancelled successfully');

    const salesCheck2 = await makeRequest('GET', '/api/farmer/sales', null, farmerAToken);
    const cancelledSales = (salesCheck2.data.data || []).filter(
      (s) => s.rawOrderId === order1Id || s.orderId === orderPlacedRes.data.data.orderNumber
    );
    assert(cancelledSales.length === 0, 'Scenario 3: Cancelled order creates 0 sales');

    // =========================================================================
    // SCENARIO 1 & 4-8: Delivered order creates sale with correct fields & 75% revenue
    // =========================================================================
    console.log('\n--- Scenario 1 & 4-8: Delivered order creates sale ---');
    const order2Res = await makeRequest(
      'POST',
      '/api/orders',
      {
        items: [{ productId: prodAId, quantity: 4 }], // 4 kg @ ₹50 = ₹200 gross
        paymentMethod: 'UPI',
        deliveryAddress: {
          name: 'Ananya Sharma',
          phone: '+91 98451 99012',
          addressLine: '12 Green Glen, Sarjapur Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '562125',
          hub: 'Sarjapur Road',
        },
        deliverySlot: {
          name: 'Morning Fresh',
          timeRange: '8:00 AM – 11:00 AM',
        },
      },
      consumerToken
    );
    assert(order2Res.status === 201, 'Order 2 placed (4 kg Tomatoes @ ₹50)');
    const order2 = order2Res.data.data;
    const order2Id = order2.id;
    const order2ItemId = order2.items[0].id;

    // Advance Order 2 to DELIVERED
    await makeRequest('PATCH', `/api/farmer/orders/${order2Id}/status`, { status: 'Confirmed' }, farmerAToken);
    await makeRequest('PATCH', `/api/farmer/orders/${order2Id}/status`, { status: 'Preparing' }, farmerAToken);
    await makeRequest('PATCH', `/api/farmer/orders/${order2Id}/status`, { status: 'Ready' }, farmerAToken);
    await makeRequest('PATCH', `/api/farmer/orders/${order2Id}/status`, { status: 'Completed' }, farmerAToken); // Completed == DELIVERED

    const salesCheck3 = await makeRequest('GET', '/api/farmer/sales', null, farmerAToken);
    assert(salesCheck3.status === 200, 'GET /api/farmer/sales returns 200');
    const deliveredSales = (salesCheck3.data.data || []).filter(
      (s) => s.rawOrderId === order2Id || s.orderId === order2.orderNumber
    );

    // Scenario 1: Delivered order creates sale
    assert(deliveredSales.length === 1, 'Scenario 1: Delivered order creates exactly 1 sale record');
    const createdSale = deliveredSales[0];

    // Scenario 4: Correct farmerId stored
    assert(createdSale.farmerId === farmerAId, 'Scenario 4: Correct farmerId stored');

    // Scenario 5: Correct orderId stored
    assert(
      createdSale.rawOrderId === order2Id || createdSale.orderId === order2.orderNumber,
      'Scenario 5: Correct orderId stored'
    );

    // Scenario 6: Correct orderItemId stored
    assert(createdSale.orderItemId === order2ItemId, 'Scenario 6: Correct orderItemId stored');

    // Scenario 7: Correct quantity stored
    assert(Number(createdSale.quantity) === 4, 'Scenario 7: Correct quantity (4 kg) stored');

    // Scenario 8: Correct revenue calculated (75% of ₹200 gross = ₹150)
    // Gross = 4 * 50 = 200. 75% = 150.00
    assert(
      Number(createdSale.revenue) === 150,
      `Scenario 8: Correct 75% farmer direct share calculated (expected ₹150, got ₹${createdSale.revenue})`
    );
    assert(createdSale.status === 'PENDING_PAYOUT', 'Initial sale status is PENDING_PAYOUT');

    // =========================================================================
    // SCENARIO 9: Duplicate sale creation prevented
    // =========================================================================
    console.log('\n--- Scenario 9: Duplicate sale creation prevented ---');
    // Try to advance or process the order again
    const reDelivered = await makeRequest(
      'PATCH',
      `/api/farmer/orders/${order2Id}/status`,
      { status: 'Completed' },
      farmerAToken
    );
    assert(reDelivered.status === 200, 'Idempotent order status call succeeded');

    const salesCheckDup = await makeRequest('GET', '/api/farmer/sales', null, farmerAToken);
    const matchingSales = (salesCheckDup.data.data || []).filter(
      (s) => s.rawOrderId === order2Id || s.orderId === order2.orderNumber
    );
    assert(matchingSales.length === 1, 'Scenario 9: Duplicate sale creation prevented (count remains 1)');

    // =========================================================================
    // SCENARIO 10: Farmer can retrieve own sales
    // =========================================================================
    console.log('\n--- Scenario 10: Farmer can retrieve own sales ---');
    assert(
      salesCheckDup.data.success === true && salesCheckDup.data.count >= 1,
      'Scenario 10: Farmer A successfully retrieved own sales'
    );

    // =========================================================================
    // SCENARIO 11: Farmer cannot retrieve another farmer's sales
    // =========================================================================
    console.log('\n--- Scenario 11: Farmer cannot retrieve another farmer\'s sales ---');
    const farmerBSales = await makeRequest('GET', '/api/farmer/sales', null, farmerBToken);
    assert(farmerBSales.status === 200, 'Farmer B gets 200 for sales list');
    const leakCheck = (farmerBSales.data.data || []).find((s) => s.farmerId === farmerAId);
    assert(!leakCheck, 'Scenario 11: Farmer B CANNOT retrieve Farmer A sales (0 records leaked)');

    // Even if Farmer B passes ?farmerId=farmerAId as query param
    const spoofQuery = await makeRequest(
      'GET',
      `/api/farmer/sales?farmerId=${farmerAId}`,
      null,
      farmerBToken
    );
    const spoofLeak = (spoofQuery.data.data || []).find((s) => s.farmerId === farmerAId);
    assert(!spoofLeak, 'Scenario 11: Server ignores query parameter farmerId spoofing');

    // =========================================================================
    // SCENARIO 12: Consumer cannot access farmer sales
    // =========================================================================
    console.log('\n--- Scenario 12: Consumer cannot access farmer sales ---');
    const consumerSalesAccess = await makeRequest('GET', '/api/farmer/sales', null, consumerToken);
    assert(
      consumerSalesAccess.status === 403,
      `Scenario 12: Consumer receives 403 Forbidden accessing farmer sales (got ${consumerSalesAccess.status})`
    );

    // =========================================================================
    // SCENARIO 13: Pending farmer receives 403
    // =========================================================================
    console.log('\n--- Scenario 13: Pending farmer receives 403 ---');
    const pendingAccess = await makeRequest('GET', '/api/farmer/sales', null, farmerPToken);
    assert(
      pendingAccess.status === 403,
      `Scenario 13: Pending farmer receives 403 Forbidden (got ${pendingAccess.status})`
    );

    // =========================================================================
    // SCENARIO 14: Rejected farmer receives 403
    // =========================================================================
    console.log('\n--- Scenario 14: Rejected farmer receives 403 ---');
    const rejectedAccess = await makeRequest('GET', '/api/farmer/sales', null, farmerRToken);
    assert(
      rejectedAccess.status === 403,
      `Scenario 14: Rejected farmer receives 403 Forbidden (got ${rejectedAccess.status})`
    );

    // =========================================================================
    // SCENARIO 15: Approved farmer can access sales
    // =========================================================================
    console.log('\n--- Scenario 15: Approved farmer can access sales ---');
    const approvedAccess = await makeRequest('GET', '/api/farmer/sales', null, farmerAToken);
    assert(
      approvedAccess.status === 200 && approvedAccess.data.success === true,
      'Scenario 15: Approved farmer can access sales (200 OK)'
    );

    // =========================================================================
    // SCENARIO 16: Admin can view payouts
    // =========================================================================
    console.log('\n--- Scenario 16: Admin can view payouts ---');
    const adminSalesView = await makeRequest('GET', '/api/admin/sales', null, adminToken);
    assert(adminSalesView.status === 200, 'Scenario 16: Admin can view platform sales/payouts (200)');
    assert(
      adminSalesView.data.data.some((s) => s.id === createdSale.id || s.saleCode === createdSale.saleCode),
      'Admin view contains Farmer A delivered sale record'
    );
    assert(adminSalesView.data.metrics.pendingPayout >= 150, 'Admin metrics show pending payout >= ₹150');

    // =========================================================================
    // SCENARIO 17: Farmer cannot mark payout as paid
    // =========================================================================
    console.log('\n--- Scenario 17: Farmer cannot mark payout as paid ---');
    const targetSaleId = createdSale.rawId || createdSale.id;
    const farmerPayoutAttempt = await makeRequest(
      'PATCH',
      `/api/admin/sales/${targetSaleId}/payout`,
      { transactionReference: 'ILLEGAL-REF-123' },
      farmerAToken
    );
    assert(
      farmerPayoutAttempt.status === 403,
      `Scenario 17: Farmer receives 403 trying to mark sale as paid (got ${farmerPayoutAttempt.status})`
    );

    // =========================================================================
    // SCENARIO 18: Admin can mark eligible payout as PAID_OUT
    // =========================================================================
    console.log('\n--- Scenario 18: Admin can mark eligible payout as PAID_OUT ---');
    const payoutPayload = {
      transactionReference: 'TXN-BANK-NEFT-99482',
      payoutDate: '2026-09-27T12:00:00.000Z',
    };
    const adminPayoutRes = await makeRequest(
      'PATCH',
      `/api/admin/sales/${targetSaleId}/payout`,
      payoutPayload,
      adminToken
    );
    assert(adminPayoutRes.status === 200, 'Scenario 18: Admin successfully marks payout as PAID_OUT (200)');
    assert(adminPayoutRes.data.sale.status === 'PAID_OUT', 'Sale status updated to PAID_OUT');

    // =========================================================================
    // SCENARIO 19: Already paid sale cannot be paid again
    // =========================================================================
    console.log('\n--- Scenario 19: Already paid sale cannot be paid again ---');
    const doublePayoutRes = await makeRequest(
      'PATCH',
      `/api/admin/sales/${targetSaleId}/payout`,
      { transactionReference: 'TXN-DOUBLE-PAY' },
      adminToken
    );
    assert(
      doublePayoutRes.status === 400,
      `Scenario 19: Duplicate payout on already paid sale rejected with 400 (got ${doublePayoutRes.status})`
    );

    // =========================================================================
    // SCENARIO 20: payoutDate is stored
    // =========================================================================
    console.log('\n--- Scenario 20: payoutDate is stored ---');
    assert(
      !!adminPayoutRes.data.sale.payoutDate,
      `Scenario 20: payoutDate is stored (${adminPayoutRes.data.sale.payoutDate})`
    );

    // =========================================================================
    // SCENARIO 21: transactionReference is stored
    // =========================================================================
    console.log('\n--- Scenario 21: transactionReference is stored ---');
    assert(
      adminPayoutRes.data.sale.transactionReference === 'TXN-BANK-NEFT-99482',
      `Scenario 21: transactionReference is stored (${adminPayoutRes.data.sale.transactionReference})`
    );

    // =========================================================================
    // SCENARIO 22: Monthly revenue calculation is correct
    // =========================================================================
    console.log('\n--- Scenario 22: Monthly revenue calculation is correct ---');
    const summaryRes = await makeRequest('GET', '/api/farmer/sales/summary', null, farmerAToken);
    assert(summaryRes.status === 200, 'GET /api/farmer/sales/summary returns 200');
    const summary = summaryRes.data.summary;
    assert(summary.totalRevenue === 150, `Scenario 22: Total revenue is ₹150 (got ₹${summary.totalRevenue})`);
    assert(summary.paidOut === 150, `Scenario 22: Paid out amount is ₹150 (got ₹${summary.paidOut})`);
    assert(summary.pendingPayout === 0, `Scenario 22: Pending payout is ₹0 (got ₹${summary.pendingPayout})`);
    assert(
      Array.isArray(summary.monthlyRevenue) && summary.monthlyRevenue.length >= 1,
      'Scenario 22: Monthly revenue array populated from real DB sales'
    );
    const currentMonthEntry = summary.monthlyRevenue[summary.monthlyRevenue.length - 1];
    assert(currentMonthEntry.revenue === 150, `Current month revenue matches ₹150 (got ₹${currentMonthEntry.revenue})`);

    // =========================================================================
    // SCENARIO 23: Product performance calculation is correct
    // =========================================================================
    console.log('\n--- Scenario 23: Product performance calculation is correct ---');
    assert(
      Array.isArray(summary.topProducts) && summary.topProducts.length >= 1,
      'Scenario 23: topProducts populated'
    );
    const topProd = summary.topProducts[0];
    assert(topProd.name === 'Country Nati Tomatoes', `Top product name matches (${topProd.name})`);
    assert(topProd.revenue === 150, `Top product revenue matches ₹150 (got ₹${topProd.revenue})`);
    assert(topProd.quantitySold === '4 kg', `Top product quantity matches 4 kg (got ${topProd.quantitySold})`);
    assert(topProd.percent === 100, `Top product percent is 100% (got ${topProd.percent}%)`);

    // =========================================================================
    // SCENARIO 24: Dashboard shows ₹0 for farmer with no sales
    // =========================================================================
    console.log('\n--- Scenario 24: Dashboard shows ₹0 for farmer with no sales ---');
    const farmerBSummary = await makeRequest('GET', '/api/farmer/sales/summary', null, farmerBToken);
    assert(farmerBSummary.status === 200, 'Farmer B summary returns 200');
    const bSummary = farmerBSummary.data.summary;
    assert(bSummary.totalRevenue === 0, `Scenario 24: totalRevenue is ₹0 (got ₹${bSummary.totalRevenue})`);
    assert(bSummary.todaySales === 0, `Scenario 24: todaySales is ₹0 (got ₹${bSummary.todaySales})`);
    assert(bSummary.thisMonthSales === 0, `Scenario 24: thisMonthSales is ₹0 (got ₹${bSummary.thisMonthSales})`);
    assert(bSummary.totalEarnings === 0, `Scenario 24: totalEarnings is ₹0 (got ₹${bSummary.totalEarnings})`);
    assert(bSummary.pendingPayout === 0, `Scenario 24: pendingPayout is ₹0 (got ₹${bSummary.pendingPayout})`);
    assert(bSummary.paidOut === 0, `Scenario 24: paidOut is ₹0 (got ₹${bSummary.paidOut})`);
    assert(bSummary.monthlyRevenue.length === 0, 'Scenario 24: monthlyRevenue is empty array []');
    assert(bSummary.topProducts.length === 0, 'Scenario 24: topProducts is empty array []');

    // =========================================================================
    // SCENARIO 25: Sales survive logout/login
    // =========================================================================
    console.log('\n--- Scenario 25: Sales survive logout/login ---');
    // Login Farmer A again to get a fresh session
    const reLoginA = await makeRequest('POST', '/api/auth/farmer/login', {
      email: farmerAEmail,
      password: 'FarmerPassword123!',
    });
    assert(reLoginA.status === 200, 'Farmer A re-login succeeded');
    const freshTokenA = reLoginA.data.data.token;

    const freshSalesA = await makeRequest('GET', '/api/farmer/sales', null, freshTokenA);
    assert(freshSalesA.status === 200, 'Fresh session GET /api/farmer/sales returns 200');
    const freshSaleRecord = (freshSalesA.data.data || []).find((s) => s.orderItemId === order2ItemId);
    assert(
      !!freshSaleRecord && freshSaleRecord.status === 'PAID_OUT' && Number(freshSaleRecord.revenue) === 150,
      'Scenario 25: Sales survive logout/login with identical state in fresh session'
    );

    // =========================================================================
    // SCENARIO 26: Sales survive page refresh
    // =========================================================================
    console.log('\n--- Scenario 26: Sales survive page refresh ---');
    // Simulate page refresh by fetching summary and sales multiple times
    const refresh1 = await makeRequest('GET', '/api/farmer/sales/summary', null, freshTokenA);
    const refresh2 = await makeRequest('GET', '/api/farmer/sales', null, freshTokenA);
    assert(
      refresh1.status === 200 &&
      refresh2.status === 200 &&
      refresh1.data.summary.totalRevenue === 150 &&
      refresh2.data.data.length >= 1,
      'Scenario 26: Sales survive multiple page refreshes from PostgreSQL persistence'
    );

  } catch (error) {
    console.error('Fatal error during sales test execution:', error);
    failed++;
  }

  console.log('\n==================================================');
  console.log(`SALES INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSalesTests();
