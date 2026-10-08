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

async function runAdminSalesE2ETests() {
  console.log('=== STARTING ADMIN SALES & PAYOUTS MANAGEMENT E2E INTEGRATION TESTS ===\n');
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
    // ----------------------------------------------------
    // 1. SETUP: Admin, Farmers, Consumer, Products, Orders, Delivered Sales
    // ----------------------------------------------------
    console.log('1. Setting up Test Users, Products, Orders, and Delivered Sales...');

    // Admin login
    const adminLoginRes = await makeRequest('POST', '/api/auth/admin/login', {
      email: 'admin@krishimarket.in',
      password: 'admin123',
    });
    const adminToken = adminLoginRes.data.data?.token;
    assert(adminLoginRes.status === 200 && adminToken, 'Admin logged in via POST /api/auth/admin/login');

    // Register Farmer 1
    const farmer1Res = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Basavaraj Bommai Gowda',
      email: `adm_sales_f1_${timestamp}@krishitest.com`,
      phone: `+91 98450 ${timestamp.toString().slice(-5)}`,
      password: 'password123',
      farmName: 'Cauvery Bio Farm',
      farmLocation: 'Survey 44, Mandya Fringe',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      hub: 'Koramangala',
    });
    const farmer1Id = farmer1Res.data.data?.farmer?.id;
    await makeRequest('POST', `/api/admin/farmers/${farmer1Id}/approve`, {}, adminToken);
    const farmer1Login = await makeRequest('POST', '/api/auth/farmer/login', {
      email: `adm_sales_f1_${timestamp}@krishitest.com`,
      password: 'password123',
    });
    const farmer1Token = farmer1Login.data.data?.token;
    assert(farmer1Login.status === 200 && farmer1Token, 'Farmer 1 registered, approved, and logged in');

    // Register Farmer 2
    const farmer2Res = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Anitha Shivakumar',
      email: `adm_sales_f2_${timestamp}@krishitest.com`,
      phone: `+91 98451 ${timestamp.toString().slice(-5)}`,
      password: 'password123',
      farmName: 'Kanakapura Natural Orchards',
      farmLocation: 'Survey 102, Kanakapura Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560062',
      hub: 'Kanakapura',
    });
    const farmer2Id = farmer2Res.data.data?.farmer?.id;
    await makeRequest('POST', `/api/admin/farmers/${farmer2Id}/approve`, {}, adminToken);
    const farmer2Login = await makeRequest('POST', '/api/auth/farmer/login', {
      email: `adm_sales_f2_${timestamp}@krishitest.com`,
      password: 'password123',
    });
    const farmer2Token = farmer2Login.data.data?.token;
    assert(farmer2Login.status === 200 && farmer2Token, 'Farmer 2 registered, approved, and logged in');

    // Register Consumer
    const consumerRes = await makeRequest('POST', '/api/auth/consumer/register', {
      name: 'Nandini Murthy',
      email: `adm_sales_cons_${timestamp}@krishitest.com`,
      phone: `+91 97410 ${timestamp.toString().slice(-5)}`,
      password: 'password123',
    });
    const consumerToken = consumerRes.data.data?.token;
    assert(consumerRes.status === 201 && consumerToken, 'Consumer registered in PostgreSQL');

    // Create Products
    const prod1Res = await makeRequest(
      'POST',
      '/api/farmer/products',
      {
        name: 'Organic Sweet Bell Peppers',
        category: 'VEGETABLES',
        description: 'Green and yellow crunchy capsicum harvested at peak sweetness.',
        price: 80,
        unit: '1 kg',
        unitShort: 'kg',
        availableQuantity: 100,
      },
      farmer1Token
    );
    const product1 = prod1Res.data.data;
    assert(prod1Res.status === 201 && product1?.id, 'Product 1 created for Farmer 1');

    const prod2Res = await makeRequest(
      'POST',
      '/api/farmer/products',
      {
        name: 'Robusta Golden Bananas',
        category: 'FRUITS',
        description: 'Naturally ripened GI-grade table bananas without chemical carbide.',
        price: 60,
        unit: '1 dozen',
        unitShort: 'dozen',
        availableQuantity: 80,
      },
      farmer2Token
    );
    const product2 = prod2Res.data.data;
    assert(prod2Res.status === 201 && product2?.id, 'Product 2 created for Farmer 2');

    // Place Multi-Farmer Order (Order 1)
    const order1Res = await makeRequest(
      'POST',
      '/api/orders',
      {
        items: [
          { productId: product1.id, quantity: 2 }, // 2 * 80 = 160
          { productId: product2.id, quantity: 3 }, // 3 * 60 = 180
        ],
        deliveryAddress: {
          name: 'Nandini Murthy',
          phone: '+91 97410 99456',
          addressLine: 'Flat 402, Green View Apartments, Koramangala',
          city: 'Bengaluru',
          state: 'Karnataka',
          hub: 'Koramangala',
          pincode: '560034',
        },
        deliverySlot: {
          name: 'Morning Slot',
          timeRange: '8:00 AM – 11:00 AM',
        },
        paymentMethod: 'UPI',
      },
      consumerToken
    );
    const order1 = order1Res.data?.data;
    if (order1Res.status !== 201) {
      console.error('Order 1 failed to create. Status:', order1Res.status, 'Response:', JSON.stringify(order1Res.data));
    }
    assert(order1Res.status === 201 && order1?.id, `Order 1 created: ${order1?.orderNumber}`);

    // Place Single-Farmer Order (Order 2)
    const order2Res = await makeRequest(
      'POST',
      '/api/orders',
      {
        items: [{ productId: product1.id, quantity: 1 }], // 1 * 80 = 80
        deliveryAddress: {
          name: 'Nandini Murthy',
          phone: '+91 97410 99456',
          addressLine: 'Villa 12, Koramangala 4th Block',
          city: 'Bengaluru',
          state: 'Karnataka',
          hub: 'Koramangala',
          pincode: '560034',
        },
        deliverySlot: {
          name: 'Morning Slot',
          timeRange: '8:00 AM – 11:00 AM',
        },
        paymentMethod: 'UPI',
      },
      consumerToken
    );
    const order2 = order2Res.data?.data;
    assert(order2Res.status === 201 && order2?.id, `Order 2 created: ${order2?.orderNumber}`);

    // Progress Order 1 to DELIVERED (generates Sale 1 for Farmer 1 and Sale 2 for Farmer 2)
    await makeRequest('PATCH', `/api/admin/orders/${order1.id}/status`, { status: 'CONFIRMED' }, adminToken);
    await makeRequest('PATCH', `/api/admin/orders/${order1.id}/status`, { status: 'HARVESTING' }, adminToken);
    await makeRequest('PATCH', `/api/admin/orders/${order1.id}/status`, { status: 'PACKED' }, adminToken);
    await makeRequest('PATCH', `/api/admin/orders/${order1.id}/status`, { status: 'OUT_FOR_DELIVERY' }, adminToken);
    const del1 = await makeRequest('PATCH', `/api/admin/orders/${order1.id}/status`, { status: 'DELIVERED' }, adminToken);
    assert(del1.status === 200, 'Order 1 delivered, triggering PostgreSQL Sale records creation');

    // Progress Order 2 to DELIVERED (generates Sale 3 for Farmer 1)
    await makeRequest('PATCH', `/api/admin/orders/${order2.id}/status`, { status: 'CONFIRMED' }, adminToken);
    await makeRequest('PATCH', `/api/admin/orders/${order2.id}/status`, { status: 'HARVESTING' }, adminToken);
    await makeRequest('PATCH', `/api/admin/orders/${order2.id}/status`, { status: 'PACKED' }, adminToken);
    await makeRequest('PATCH', `/api/admin/orders/${order2.id}/status`, { status: 'OUT_FOR_DELIVERY' }, adminToken);
    const del2 = await makeRequest('PATCH', `/api/admin/orders/${order2.id}/status`, { status: 'DELIVERED' }, adminToken);
    assert(del2.status === 200, 'Order 2 delivered, triggering PostgreSQL Sale record creation');

    // ----------------------------------------------------
    // 2. AUTHORIZATION & ACCESS CONTROL
    // ----------------------------------------------------
    console.log('\n2. Testing Access Control & Security Policies...');
    const noAuthRes = await makeRequest('GET', '/api/admin/sales', null, null);
    assert(noAuthRes.status === 401, 'Unauthenticated request to /api/admin/sales returns 401');

    const farmerAuthRes = await makeRequest('GET', '/api/admin/sales', null, farmer1Token);
    assert(farmerAuthRes.status === 403, 'Farmer is blocked from /api/admin/sales (403 Forbidden)');

    const consumerAuthRes = await makeRequest('GET', '/api/admin/sales', null, consumerToken);
    assert(consumerAuthRes.status === 403, 'Consumer is blocked from /api/admin/sales (403 Forbidden)');

    const farmerPayoutBlock = await makeRequest('PATCH', '/api/admin/sales/dummy-id/payout', {}, farmer1Token);
    assert(farmerPayoutBlock.status === 403, 'Farmer cannot call Admin payout mutation (403 Forbidden)');

    const consumerPayoutBlock = await makeRequest('PATCH', '/api/admin/sales/dummy-id/payout', {}, consumerToken);
    assert(consumerPayoutBlock.status === 403, 'Consumer cannot call Admin payout mutation (403 Forbidden)');

    // ----------------------------------------------------
    // 3. ADMIN LIST SALES (GET /api/admin/sales)
    // ----------------------------------------------------
    console.log('\n3. Testing Admin List Sales (GET /api/admin/sales)...');
    const salesListRes = await makeRequest('GET', '/api/admin/sales', null, adminToken);
    assert(salesListRes.status === 200, 'Admin can fetch all platform sales (200 OK)');
    assert(salesListRes.data?.success === true, 'Response contains success: true');
    assert(Array.isArray(salesListRes.data?.data), 'Response data is an array');

    const allSales = salesListRes.data.data;
    assert(allSales.length >= 3, `Retrieved sales from database (count: ${allSales.length})`);

    // Find sale for Order 1, Farmer 1
    const sale1 = allSales.find(
      (s) => s.orderNumber === order1.orderNumber && s.farmerId === farmer1Id
    );
    assert(!!sale1, 'Sale 1 (Farmer 1, Order 1) is present in the admin list');
    assert(sale1?.saleCode && sale1.saleCode.startsWith('SALE-'), 'Sale code is present with SALE- prefix');
    assert(sale1?.orderNumber === order1.orderNumber, 'Order number matches');
    assert(sale1?.farmerName === 'Basavaraj Bommai Gowda', 'Farmer name matches from Farmer.user relation');
    assert(sale1?.farmName === 'Cauvery Bio Farm', 'Farm name matches from Farmer relation');
    assert(sale1?.productName === 'Organic Sweet Bell Peppers', 'Product name matches snapshot');
    assert(sale1?.category === 'VEGETABLES', 'Category is VEGETABLES');
    assert(Number(sale1?.quantity) === 2, 'Quantity is 2');
    assert(sale1?.unit === '1 kg', 'Unit matches');
    assert(Number(sale1?.unitPrice) === 80, 'Unit price matches');
    assert(Number(sale1?.grossAmount) === 160, 'Gross amount is ₹160 (2 * ₹80)');
    // 75% farmer direct share = 160 * 0.75 = 120
    assert(Number(sale1?.revenue) === 120, 'Farmer revenue matches authoritative 75% share (₹120)');
    assert(sale1?.status === 'PENDING_PAYOUT', 'Initial sale status is PENDING_PAYOUT');
    assert(!!sale1?.date, 'Date is present');

    // Find sale for Order 1, Farmer 2
    const sale2 = allSales.find(
      (s) => s.orderNumber === order1.orderNumber && s.farmerId === farmer2Id
    );
    assert(!!sale2, 'Sale 2 (Farmer 2, Order 1) is present in the admin list');
    assert(sale2?.farmerName === 'Anitha Shivakumar', 'Farmer 2 name matches from relation');
    assert(sale2?.farmName === 'Kanakapura Natural Orchards', 'Farm 2 name matches from relation');
    assert(sale2?.productName === 'Robusta Golden Bananas', 'Product 2 name matches');
    assert(Number(sale2?.grossAmount) === 180, 'Gross amount for Banana item is ₹180 (3 * ₹60)');
    // 75% farmer direct share = 180 * 0.75 = 135
    assert(Number(sale2?.revenue) === 135, 'Farmer 2 revenue matches authoritative 75% share (₹135)');

    // ----------------------------------------------------
    // 4. ADMIN GET SALE DETAILS (GET /api/admin/sales/:saleId)
    // ----------------------------------------------------
    console.log('\n4. Testing Admin Get Sale Details (GET /api/admin/sales/:saleId)...');
    const saleDetailsById = await makeRequest('GET', `/api/admin/sales/${sale1.id}`, null, adminToken);
    assert(saleDetailsById.status === 200, 'Admin can fetch sale details by UUID (200 OK)');
    assert(saleDetailsById.data?.success === true, 'Response contains success: true');
    assert(saleDetailsById.data?.data?.saleCode === sale1.saleCode, 'Sale code matches');
    assert(saleDetailsById.data?.data?.orderNumber === order1.orderNumber, 'Order number matches in detail view');
    assert(saleDetailsById.data?.data?.orderStatus === 'DELIVERED', 'Order status is DELIVERED');
    assert(saleDetailsById.data?.data?.farmerName === 'Basavaraj Bommai Gowda', 'Farmer name is present');
    assert(saleDetailsById.data?.data?.farmName === 'Cauvery Bio Farm', 'Farm name is present');
    assert(saleDetailsById.data?.data?.productName === 'Organic Sweet Bell Peppers', 'Product name is present');
    assert(Number(saleDetailsById.data?.data?.revenue) === 120, 'Revenue matches authoritative record');
    assert(saleDetailsById.data?.data?.status === 'PENDING_PAYOUT', 'Payout status is PENDING_PAYOUT');

    // Retrieve by saleCode
    const saleDetailsByCode = await makeRequest('GET', `/api/admin/sales/${sale1.saleCode}`, null, adminToken);
    assert(saleDetailsByCode.status === 200, 'Admin can fetch sale details by saleCode');
    assert(saleDetailsByCode.data?.data?.id === sale1.id, 'Resolved to correct sale UUID');

    // Non-existent sale returns 404
    const notFoundRes = await makeRequest('GET', '/api/admin/sales/non-existent-sale-uuid-9999', null, adminToken);
    assert(notFoundRes.status === 404, 'Invalid sale ID returns 404 Not Found');

    // ----------------------------------------------------
    // 5. REVENUE SUMMARY & METRICS
    // ----------------------------------------------------
    console.log('\n5. Testing Revenue Summary & Database Metrics...');
    const metrics = salesListRes.data?.metrics;
    assert(!!metrics, 'Metrics object is present in response');
    assert(typeof metrics.totalSales === 'number' && metrics.totalSales >= 3, 'Metrics totalSales is calculated from database');
    assert(typeof metrics.totalGrossRevenue === 'number' && metrics.totalGrossRevenue > 0, 'Metrics totalGrossRevenue is calculated from database');
    assert(typeof metrics.totalFarmerRevenue === 'number' && metrics.totalFarmerRevenue > 0, 'Metrics totalFarmerRevenue is calculated from database');
    assert(typeof metrics.pendingPayoutsAmount === 'number' && metrics.pendingPayoutsAmount > 0, 'Metrics pendingPayoutsAmount is calculated from database');

    // ----------------------------------------------------
    // 6. SEARCH & FILTERING
    // ----------------------------------------------------
    console.log('\n6. Testing Admin Search & Filters...');
    // Search by saleCode
    const searchCodeRes = await makeRequest('GET', `/api/admin/sales?search=${sale1.saleCode}`, null, adminToken);
    assert(
      searchCodeRes.status === 200 && searchCodeRes.data?.data?.length === 1 && searchCodeRes.data.data[0].id === sale1.id,
      `Search by saleCode "${sale1.saleCode}" returns exactly matching sale`
    );

    // Search by orderNumber
    const searchOrderRes = await makeRequest('GET', `/api/admin/sales?search=${order1.orderNumber}`, null, adminToken);
    assert(
      searchOrderRes.status === 200 && searchOrderRes.data?.data?.length === 2,
      `Search by orderNumber "${order1.orderNumber}" returns both farmer items (count: 2)`
    );

    // Search by farmerName
    const searchFarmerRes = await makeRequest('GET', `/api/admin/sales?search=Basavaraj`, null, adminToken);
    assert(
      searchFarmerRes.status === 200 && searchFarmerRes.data?.data?.every((s) => s.farmerName.includes('Basavaraj')),
      'Search by farmerName "Basavaraj" returns only Farmer 1 produce sales'
    );

    // Search by productName
    const searchProductRes = await makeRequest('GET', `/api/admin/sales?search=Bananas`, null, adminToken);
    assert(
      searchProductRes.status === 200 && searchProductRes.data?.data?.every((s) => s.productName.includes('Bananas')),
      'Search by productName "Bananas" returns Banana sales'
    );

    // Filter by status=PENDING_PAYOUT
    const filterStatusRes = await makeRequest('GET', '/api/admin/sales?status=PENDING_PAYOUT', null, adminToken);
    assert(
      filterStatusRes.status === 200 && filterStatusRes.data?.data?.every((s) => s.status === 'PENDING_PAYOUT'),
      'Filter by status=PENDING_PAYOUT returns only PENDING_PAYOUT sales'
    );

    // Filter by farmerId
    const filterFarmerRes = await makeRequest('GET', `/api/admin/sales?farmerId=${farmer2Id}`, null, adminToken);
    assert(
      filterFarmerRes.status === 200 && filterFarmerRes.data?.data?.every((s) => s.farmerId === farmer2Id),
      'Filter by farmerId returns only Farmer 2 sales'
    );

    // Filter by category
    const filterCategoryRes = await makeRequest('GET', '/api/admin/sales?category=FRUITS', null, adminToken);
    assert(
      filterCategoryRes.status === 200 && filterCategoryRes.data?.data?.every((s) => s.category.toUpperCase().includes('FRUIT')),
      'Filter by category=FRUITS returns only fruit sales'
    );

    // ----------------------------------------------------
    // 7. PAYOUT MUTATION & STATE MACHINE TRANSITIONS
    // ----------------------------------------------------
    console.log('\n7. Testing Admin Payout Settlement Transitions (PATCH /api/admin/sales/:saleId/payout)...');

    // Valid payout transition
    const customTxRef = `NEFT-KRISHI-UTR-${Date.now().toString().slice(-6)}`;
    const payoutRes = await makeRequest(
      'PATCH',
      `/api/admin/sales/${sale1.id}/payout`,
      {
        transactionReference: customTxRef,
        payoutDate: new Date().toISOString(),
      },
      adminToken
    );

    assert(payoutRes.status === 200, 'Admin can mark sale as PAID_OUT (200 OK)');
    assert(payoutRes.data?.success === true, 'Response contains success: true');
    assert(payoutRes.data?.sale?.status === 'PAID_OUT', 'Sale status successfully transitioned to PAID_OUT');
    assert(payoutRes.data?.sale?.transactionReference === customTxRef, 'Supplied transaction reference accurately saved');
    assert(!!payoutRes.data?.sale?.payoutDate, 'Payout timestamp recorded');

    // Verify database record
    const verifySaleDb = await makeRequest('GET', `/api/admin/sales/${sale1.id}`, null, adminToken);
    assert(verifySaleDb.data?.data?.status === 'PAID_OUT', 'Sale status persisted as PAID_OUT in PostgreSQL');
    assert(verifySaleDb.data?.data?.transactionReference === customTxRef, 'Transaction reference persisted in PostgreSQL');

    // Duplicate payout transition must be rejected
    const duplicatePayoutRes = await makeRequest(
      'PATCH',
      `/api/admin/sales/${sale1.id}/payout`,
      { transactionReference: 'NEFT-DUPLICATE' },
      adminToken
    );
    assert(duplicatePayoutRes.status === 400, 'Duplicate payout transition on already PAID_OUT sale is rejected (400 Bad Request)');

    // Payout on invalid sale ID must return 404
    const notFoundPayoutRes = await makeRequest(
      'PATCH',
      '/api/admin/sales/non-existent-uuid-9999/payout',
      { transactionReference: 'NEFT-123' },
      adminToken
    );
    assert(notFoundPayoutRes.status === 404, 'Payout on non-existent sale ID returns 404 Not Found');

    // Test settling via /api/admin/payouts/:saleId alias
    const aliasTxRef = `IMPS-KRISHI-${Date.now().toString().slice(-6)}`;
    const aliasPayoutRes = await makeRequest(
      'PATCH',
      `/api/admin/payouts/${sale2.id}`,
      { transactionReference: aliasTxRef },
      adminToken
    );
    assert(aliasPayoutRes.status === 200, 'Admin can settle payout via /api/admin/payouts/:saleId alias');
    assert(aliasPayoutRes.data?.sale?.status === 'PAID_OUT', 'Sale 2 transitioned to PAID_OUT via alias');

    // Verify /api/admin/payouts listing alias
    const payoutsAliasRes = await makeRequest('GET', '/api/admin/payouts', null, adminToken);
    assert(payoutsAliasRes.status === 200 && Array.isArray(payoutsAliasRes.data?.data), '/api/admin/payouts alias works');

    // Verify metrics updated (paidPayoutsAmount increased, pendingPayoutsAmount decreased)
    const freshSalesRes = await makeRequest('GET', '/api/admin/sales', null, adminToken);
    const freshMetrics = freshSalesRes.data?.metrics;
    assert(freshMetrics.paidCount >= 2, `Paid payouts count updated in database (got: ${freshMetrics.paidCount})`);
    assert(freshMetrics.paidPayoutsAmount >= 255, `Paid payouts amount reflects settled payouts (got: ₹${freshMetrics.paidPayoutsAmount})`);

    // ----------------------------------------------------
    // 8. TEST SUMMARY
    // ----------------------------------------------------
    console.log('\n==================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Unhandled test exception:', error);
    process.exit(1);
  }
}

runAdminSalesE2ETests();
