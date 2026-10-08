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

async function runAdminOrdersE2ETests() {
  console.log('=== STARTING ADMIN ORDER MANAGEMENT E2E INTEGRATION TESTS ===\n');
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
    // 1. SETUP: Admin, Farmers, Consumer, and Orders
    // ----------------------------------------------------
    console.log('1. Authenticating Admin and creating test users...');

    // Admin login
    const adminLoginRes = await makeRequest('POST', '/api/auth/admin/login', {
      email: 'admin@krishimarket.in',
      password: 'admin123',
    });
    const adminToken = adminLoginRes.data.data?.token;
    assert(adminLoginRes.status === 200 && adminToken, 'Admin logged in via POST /api/auth/admin/login');

    // Register Farmer A
    const farmerARes = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Gowda Ramesh',
      email: `adm_ord_farmer_a_${timestamp}@krishitest.com`,
      phone: '+91 98450 11099',
      password: 'password123',
      farmName: 'Gowda Organic Heritage',
      farmLocation: 'Survey 42, Nelamangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '562123',
      hub: 'Nelamangala Hub',
    });
    const farmerAId = farmerARes.data.data?.farmer?.id;
    await makeRequest('POST', `/api/admin/farmers/${farmerAId}/approve`, {}, adminToken);

    const farmerALogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: `adm_ord_farmer_a_${timestamp}@krishitest.com`,
      password: 'password123',
    });
    const farmerAToken = farmerALogin.data.data?.token;
    assert(farmerALogin.status === 200 && farmerAToken, 'Farmer A registered, approved, and logged in');

    // Register Farmer B
    const farmerBRes = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Basavaraj Patil',
      email: `adm_ord_farmer_b_${timestamp}@krishitest.com`,
      phone: '+91 98450 22099',
      password: 'password123',
      farmName: 'Patil Fresh Greens',
      farmLocation: 'Survey 88, Devanahalli',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '562110',
      hub: 'Devanahalli Hub',
    });
    const farmerBId = farmerBRes.data.data?.farmer?.id;
    await makeRequest('POST', `/api/admin/farmers/${farmerBId}/approve`, {}, adminToken);

    const farmerBLogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: `adm_ord_farmer_b_${timestamp}@krishitest.com`,
      password: 'password123',
    });
    const farmerBToken = farmerBLogin.data.data?.token;
    assert(farmerBLogin.status === 200 && farmerBToken, 'Farmer B registered, approved, and logged in');

    // Register Consumer
    const consumerRes = await makeRequest('POST', '/api/auth/consumer/register', {
      name: 'Aditi Rao',
      email: `adm_ord_consumer_${timestamp}@krishitest.com`,
      phone: '+91 98451 77088',
      password: 'consumer123',
    });
    const consumerToken = consumerRes.data.data?.token;
    const consumerId = consumerRes.data.data?.user?.id;
    assert(consumerRes.status === 201 && consumerToken, 'Consumer registered in PostgreSQL');

    // Create Products for Farmer A & Farmer B
    const prodA1Res = await makeRequest(
      'POST',
      '/api/farmer/products',
      {
        name: 'Crisp Bell Peppers',
        category: 'VEGETABLES',
        description: 'Green capsicum fresh from vine',
        price: 70,
        unit: '1 kg',
        unitShort: 'kg',
        availableQuantity: 40,
      },
      farmerAToken
    );
    const prodA1 = prodA1Res.data.data;
    assert(prodA1Res.status === 201 && prodA1.id, `Product A1 created for Farmer A (${prodA1.name})`);

    const prodB1Res = await makeRequest(
      'POST',
      '/api/farmer/products',
      {
        name: 'Golden Robusta Bananas',
        category: 'FRUITS',
        description: 'Naturally ripened sweet bananas',
        price: 50,
        unit: '1 dozen',
        unitShort: 'doz',
        availableQuantity: 60,
      },
      farmerBToken
    );
    const prodB1 = prodB1Res.data.data;
    assert(prodB1Res.status === 201 && prodB1.id, `Product B1 created for Farmer B (${prodB1.name})`);

    // Place Order 1 by Consumer (with items from Farmer A and Farmer B)
    const order1Res = await makeRequest(
      'POST',
      '/api/orders',
      {
        items: [
          { productId: prodA1.id, quantity: 3 },
          { productId: prodB1.id, quantity: 2 },
        ],
        deliveryAddress: {
          name: 'Aditi Rao',
          phone: '+91 98451 77088',
          addressLine: 'Apt 4B, Greenwood Regency, Koramangala',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560034',
          hub: 'Koramangala Hub',
        },
        deliverySlot: {
          name: 'Early Bird Slot',
          timeRange: '06:00 AM - 09:00 AM',
        },
        paymentMethod: 'UPI',
      },
      consumerToken
    );
    const order1 = order1Res.data.data;
    assert(order1Res.status === 201 && order1 && order1.id, `Order 1 created (${order1?.orderNumber}, total ₹${order1?.total})`);

    // Place Order 2 by Consumer (with items only from Farmer B)
    const order2Res = await makeRequest(
      'POST',
      '/api/orders',
      {
        items: [{ productId: prodB1.id, quantity: 4 }],
        deliveryAddress: {
          name: 'Aditi Rao',
          phone: '+91 98451 77088',
          addressLine: 'Apt 4B, Greenwood Regency, Koramangala',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560034',
          hub: 'Koramangala Hub',
        },
        deliverySlot: {
          name: 'Standard Morning',
          timeRange: '09:00 AM - 12:00 PM',
        },
        paymentMethod: 'CARD',
      },
      consumerToken
    );
    const order2 = order2Res.data.data;
    assert(order2Res.status === 201 && order2.id, `Order 2 created (${order2.orderNumber}, total ₹${order2.total})`);

    // ----------------------------------------------------
    // 2. SECURITY & AUTHORIZATION TESTS
    // ----------------------------------------------------
    console.log('\n2. Testing Access Control & Security Policies...');

    // Unauthenticated GET /api/admin/orders
    const unauthRes = await makeRequest('GET', '/api/admin/orders');
    assert(unauthRes.status === 401, 'Unauthenticated access to /api/admin/orders is rejected (401)');

    // Farmer GET /api/admin/orders
    const farmerRes = await makeRequest('GET', '/api/admin/orders', null, farmerAToken);
    assert(farmerRes.status === 403, 'Farmer access to /api/admin/orders is rejected (403 Forbidden)');

    // Consumer GET /api/admin/orders
    const consumerAdminRes = await makeRequest('GET', '/api/admin/orders', null, consumerToken);
    assert(consumerAdminRes.status === 403, 'Consumer access to /api/admin/orders is rejected (403 Forbidden)');

    // Farmer GET /api/admin/orders/:id
    const farmerDetailRes = await makeRequest('GET', `/api/admin/orders/${order1.id}`, null, farmerAToken);
    assert(farmerDetailRes.status === 403, 'Farmer access to /api/admin/orders/:id is rejected (403 Forbidden)');

    // Farmer PATCH /api/admin/orders/:id/status
    const farmerPatchRes = await makeRequest(
      'PATCH',
      `/api/admin/orders/${order1.id}/status`,
      { status: 'CONFIRMED' },
      farmerAToken
    );
    assert(farmerPatchRes.status === 403, 'Farmer status update via admin API is rejected (403 Forbidden)');

    // ----------------------------------------------------
    // 3. ADMIN LIST ORDERS & RESPONSE SHAPE
    // ----------------------------------------------------
    console.log('\n3. Testing Admin View All Orders (GET /api/admin/orders)...');

    const adminListRes = await makeRequest('GET', '/api/admin/orders', null, adminToken);
    assert(adminListRes.status === 200, 'Admin can fetch all platform orders (200 OK)');
    assert(adminListRes.data.success === true, 'Response contains success: true');
    assert(Array.isArray(adminListRes.data.data), 'Response data is an array');

    const listedOrder1 = adminListRes.data.data.find((o) => o.id === order1.id);
    assert(Boolean(listedOrder1), `Order 1 (${order1.orderNumber}) is present in the admin list`);
    assert(listedOrder1.orderNumber === order1.orderNumber, 'Order number matches');
    assert(listedOrder1.customerName === 'Aditi Rao', 'Customer name is present and matches');
    assert(listedOrder1.items.length === 2, 'All 2 order items are present with snapshots');
    assert(Number(listedOrder1.total) === Number(order1.total), 'Order total matches');
    assert(typeof listedOrder1.farmerEarnings === 'number', 'Farmer earnings calculated');
    assert(listedOrder1.paymentStatus === 'PAID', 'Payment status is PAID');
    assert(
      listedOrder1.status.toUpperCase() === 'PLACED' || listedOrder1.orderStatus === 'PLACED',
      'Order status is PLACED'
    );
    assert(Array.isArray(listedOrder1.timeline), 'Order fulfillment timeline is present');

    // ----------------------------------------------------
    // 4. ADMIN SEARCH & FILTER CAPABILITIES
    // ----------------------------------------------------
    console.log('\n4. Testing Search and Filtering...');

    // Search by orderNumber
    const searchOrderRes = await makeRequest(
      'GET',
      `/api/admin/orders?search=${order1.orderNumber}`,
      null,
      adminToken
    );
    assert(
      searchOrderRes.data.data.some((o) => o.id === order1.id),
      `Search by orderNumber '${order1.orderNumber}' returns matching order`
    );

    // Search by customer name
    const searchCustomerRes = await makeRequest(
      'GET',
      `/api/admin/orders?search=Aditi`,
      null,
      adminToken
    );
    assert(
      searchCustomerRes.data.data.length >= 2,
      'Search by customer name "Aditi" returns customer orders'
    );

    // Filter by status=PLACED
    const filterPlacedRes = await makeRequest(
      'GET',
      `/api/admin/orders?status=PLACED`,
      null,
      adminToken
    );
    const allPlaced = filterPlacedRes.data.data.every(
      (o) => o.status.toUpperCase() === 'PLACED' || o.orderStatus === 'PLACED'
    );
    assert(allPlaced && filterPlacedRes.data.data.length > 0, 'Filter by status=PLACED returns only PLACED orders');

    // Filter by paymentStatus=PAID
    const filterPaidRes = await makeRequest(
      'GET',
      `/api/admin/orders?paymentStatus=PAID`,
      null,
      adminToken
    );
    const allPaid = filterPaidRes.data.data.every((o) => o.paymentStatus === 'PAID');
    assert(allPaid && filterPaidRes.data.data.length > 0, 'Filter by paymentStatus=PAID returns only PAID orders');

    // Filter by farmerName
    const filterFarmerRes = await makeRequest(
      'GET',
      `/api/admin/orders?farmerName=Basavaraj`,
      null,
      adminToken
    );
    assert(
      filterFarmerRes.data.data.length >= 1,
      'Filter by farmerName returns orders containing farmer produce'
    );

    // ----------------------------------------------------
    // 5. ADMIN VIEW ORDER BY ID
    // ----------------------------------------------------
    console.log('\n5. Testing Admin View Order Details (GET /api/admin/orders/:orderId)...');

    const detailRes = await makeRequest('GET', `/api/admin/orders/${order1.id}`, null, adminToken);
    assert(detailRes.status === 200, 'Fetching order by ID returns 200 OK');
    const orderDetails = detailRes.data.data;
    assert(orderDetails.id === order1.id, 'Fetched order ID matches requested ID');
    assert(orderDetails.customerEmail === `adm_ord_consumer_${timestamp}@krishitest.com`, 'Customer email is present');
    assert(orderDetails.customerPhone === '+91 98451 77088', 'Customer phone is present');
    assert(orderDetails.deliveryAddress.addressLine === 'Apt 4B, Greenwood Regency, Koramangala', 'Address line matches');
    assert(orderDetails.deliveryAddress.hub === 'Koramangala Hub', 'Hub matches');
    assert(orderDetails.items.length === 2, 'Contains both order items');
    assert(orderDetails.timeline.length >= 1, 'Timeline contains initial PLACED step');

    // Non-existent order ID
    const notFoundRes = await makeRequest('GET', '/api/admin/orders/non-existent-order-id-999', null, adminToken);
    assert(notFoundRes.status === 404, 'Non-existent order ID returns 404 Not Found');

    // ----------------------------------------------------
    // 6. ADMIN STATUS LIFECYCLE TRANSITIONS
    // ----------------------------------------------------
    console.log('\n6. Testing Admin Order Lifecycle Transitions (PATCH /api/admin/orders/:orderId/status)...');

    // PLACED -> CONFIRMED
    const confirmRes = await makeRequest(
      'PATCH',
      `/api/admin/orders/${order1.id}/status`,
      { status: 'CONFIRMED' },
      adminToken
    );
    assert(
      confirmRes.status === 200 &&
        (confirmRes.data.data.status?.toUpperCase() === 'CONFIRMED' ||
          confirmRes.data.data.orderStatus === 'CONFIRMED'),
      'Transition PLACED -> CONFIRMED succeeds'
    );

    // CONFIRMED -> HARVESTING
    const harvestRes = await makeRequest(
      'PATCH',
      `/api/admin/orders/${order1.id}/status`,
      { status: 'HARVESTING' },
      adminToken
    );
    assert(
      harvestRes.status === 200 &&
        (harvestRes.data.data.status?.toUpperCase() === 'HARVESTING' ||
          harvestRes.data.data.orderStatus === 'HARVESTING'),
      'Transition CONFIRMED -> HARVESTING succeeds'
    );

    // HARVESTING -> PACKED
    const packRes = await makeRequest(
      'PATCH',
      `/api/admin/orders/${order1.id}/status`,
      { status: 'PACKED' },
      adminToken
    );
    assert(
      packRes.status === 200 &&
        (packRes.data.data.status?.toUpperCase() === 'PACKED' ||
          packRes.data.data.orderStatus === 'PACKED'),
      'Transition HARVESTING -> PACKED succeeds'
    );

    // PACKED -> OUT_FOR_DELIVERY
    const outRes = await makeRequest(
      'PATCH',
      `/api/admin/orders/${order1.id}/status`,
      { status: 'OUT_FOR_DELIVERY' },
      adminToken
    );
    assert(
      outRes.status === 200 &&
        (outRes.data.data.status?.toUpperCase() === 'OUT_FOR_DELIVERY' ||
          outRes.data.data.orderStatus === 'OUT_FOR_DELIVERY'),
      'Transition PACKED -> OUT_FOR_DELIVERY succeeds'
    );

    // OUT_FOR_DELIVERY -> DELIVERED
    const deliverRes = await makeRequest(
      'PATCH',
      `/api/admin/orders/${order1.id}/status`,
      { status: 'DELIVERED' },
      adminToken
    );
    assert(
      deliverRes.status === 200 &&
        (deliverRes.data.data.status?.toUpperCase() === 'DELIVERED' ||
          deliverRes.data.data.orderStatus === 'DELIVERED'),
      'Transition OUT_FOR_DELIVERY -> DELIVERED succeeds'
    );

    // Verify delivered order has updated timeline steps
    const verifyDelivered = await makeRequest('GET', `/api/admin/orders/${order1.id}`, null, adminToken);
    assert(verifyDelivered.data.data.timeline.length >= 5, 'Timeline updated with all fulfillment steps');

    // Invalid transition: DELIVERED -> PLACED (should be rejected)
    const invalidTransitionRes = await makeRequest(
      'PATCH',
      `/api/admin/orders/${order1.id}/status`,
      { status: 'PLACED' },
      adminToken
    );
    assert(invalidTransitionRes.status === 400, 'Invalid transition DELIVERED -> PLACED is rejected (400 Bad Request)');

    // Invalid status string
    const invalidStatusRes = await makeRequest(
      'PATCH',
      `/api/admin/orders/${order1.id}/status`,
      { status: 'EXPLODED' },
      adminToken
    );
    assert(invalidStatusRes.status === 400, 'Unknown status enum value is rejected (400 Bad Request)');

    // Order 2 cancellation test
    const cancelRes = await makeRequest(
      'PATCH',
      `/api/admin/orders/${order2.id}/status`,
      { status: 'CANCELLED' },
      adminToken
    );
    assert(
      cancelRes.status === 200 &&
        (cancelRes.data.data.status?.toUpperCase() === 'CANCELLED' ||
          cancelRes.data.data.orderStatus === 'CANCELLED'),
      'Order 2 can be CANCELLED by Admin'
    );

    // CANCELLED -> DELIVERED (invalid transition)
    const cancelledToDelivered = await makeRequest(
      'PATCH',
      `/api/admin/orders/${order2.id}/status`,
      { status: 'DELIVERED' },
      adminToken
    );
    assert(cancelledToDelivered.status === 400, 'Transition from CANCELLED to DELIVERED is rejected (400 Bad Request)');

    // ----------------------------------------------------
    // 7. HISTORICAL ORDERITEM & FINANCIAL INTEGRITY AUDIT
    // ----------------------------------------------------
    console.log('\n7. Verifying Historical OrderItem Snapshot & Financial Integrity...');

    const finalOrder1Res = await makeRequest('GET', `/api/admin/orders/${order1.id}`, null, adminToken);
    const finalOrder1 = finalOrder1Res.data.data;

    assert(
      finalOrder1.orderStatus === 'DELIVERED' || finalOrder1.status?.toUpperCase() === 'DELIVERED',
      'Order 1 status persists as DELIVERED in PostgreSQL'
    );
    assert(
      finalOrder1.deliveredAt !== null && finalOrder1.deliveredAt !== undefined,
      'Delivered order has deliveredAt timestamp recorded'
    );
    assert(
      finalOrder1.items.length === 2,
      'Order 1 retains all original OrderItems'
    );
    assert(
      finalOrder1.items[0].productName === 'Crisp Bell Peppers' &&
        finalOrder1.items[0].unitPrice === 70 &&
        finalOrder1.items[0].quantity === 3 &&
        finalOrder1.items[0].totalPrice === 210,
      'OrderItem 1 snapshot (productName, unitPrice, quantity, totalPrice) remains intact'
    );
    assert(
      finalOrder1.items[1].productName === 'Golden Robusta Bananas' &&
        finalOrder1.items[1].unitPrice === 50 &&
        finalOrder1.items[1].quantity === 2 &&
        finalOrder1.items[1].totalPrice === 100,
      'OrderItem 2 snapshot (productName, unitPrice, quantity, totalPrice) remains intact'
    );
    assert(
      finalOrder1.subtotal === 310 && finalOrder1.total === 376,
      'Financial totals (subtotal, total) read directly from order snapshot without recomputation'
    );

    // ----------------------------------------------------
    // 8. SENSITIVE CREDENTIAL LEAKAGE AUDIT
    // ----------------------------------------------------
    console.log('\n8. Verifying Credential Exclusion (Zero Sensitive Data)...');

    const adminListRaw = JSON.stringify(adminListRes.data);
    const orderDetailRaw = JSON.stringify(finalOrder1Res.data);
    const patchRaw = JSON.stringify(deliverRes.data);

    assert(
      !adminListRaw.includes('password') && !adminListRaw.includes('passwordHash'),
      'PasswordHash is NEVER returned in GET /api/admin/orders'
    );
    assert(
      !orderDetailRaw.includes('password') && !orderDetailRaw.includes('passwordHash'),
      'PasswordHash is NEVER returned in GET /api/admin/orders/:id'
    );
    assert(
      !patchRaw.includes('password') && !patchRaw.includes('passwordHash'),
      'PasswordHash is NEVER returned in PATCH /api/admin/orders/:id/status'
    );

    console.log('\n==================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    process.exit(1);
  }
}

runAdminOrdersE2ETests();
