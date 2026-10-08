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

async function runOrderTests() {
  console.log('=== STARTING KRISHI CORE ORDER MANAGEMENT INTEGRATION TESTS ===\n');
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
    // SETUP: Admin, Farmers (A, B, C, D), Consumers (A, B)
    // ----------------------------------------------------
    console.log('1. Setting up Test Users and Products...');
    // Admin login
    const adminLoginRes = await makeRequest('POST', '/api/auth/admin/login', {
      email: 'admin@krishimarket.in',
      password: 'admin123',
    });
    const adminToken = adminLoginRes.data.data.token;
    assert(adminLoginRes.status === 200 && adminToken, 'Admin logged in');

    // Register Farmer A
    const farmerARes = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Ramesh Gowda',
      email: `farmer_ord_a_${timestamp}@krishitest.com`,
      phone: '+91 98450 11001',
      password: 'password123',
      farmName: 'Gowda Heritage Farms',
      farmLocation: 'Survey 42, Nelamangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '562123',
      hub: 'Nelamangala / North Hub',
    });
    const farmerAId = farmerARes.data.data.farmer.id;
    await makeRequest('POST', `/api/admin/farmers/${farmerAId}/approve`, {}, adminToken);

    const farmerALogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: `farmer_ord_a_${timestamp}@krishitest.com`,
      password: 'password123',
    });
    const farmerAToken = farmerALogin.data.data.token;

    // Register Farmer B
    const farmerBRes = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Suresh Patil',
      email: `farmer_ord_b_${timestamp}@krishitest.com`,
      phone: '+91 98450 22002',
      password: 'password123',
      farmName: 'Patil Organic Meadows',
      farmLocation: 'Survey 108, Devanahalli',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '562110',
      hub: 'Devanahalli / North Hub',
    });
    const farmerBId = farmerBRes.data.data.farmer.id;
    await makeRequest('POST', `/api/admin/farmers/${farmerBId}/approve`, {}, adminToken);

    const farmerBLogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: `farmer_ord_b_${timestamp}@krishitest.com`,
      password: 'password123',
    });
    const farmerBToken = farmerBLogin.data.data.token;

    // Register Farmer C (PENDING)
    const farmerCRes = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Pending Farmer C',
      email: `farmer_ord_c_${timestamp}@krishitest.com`,
      phone: '+91 98450 33003',
      password: 'password123',
      farmName: 'Pending Farm',
      farmLocation: 'Hoskote',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '562114',
    });
    const farmerCLogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: `farmer_ord_c_${timestamp}@krishitest.com`,
      password: 'password123',
    });
    const farmerCToken = farmerCLogin.data.data.token;

    // Register Farmer D (REJECTED)
    const farmerDRes = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Rejected Farmer D',
      email: `farmer_ord_d_${timestamp}@krishitest.com`,
      phone: '+91 98450 44004',
      password: 'password123',
      farmName: 'Rejected Farm',
      farmLocation: 'Kolar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '563101',
    });
    const farmerDId = farmerDRes.data.data.farmer.id;
    await makeRequest(
      'POST',
      `/api/admin/farmers/${farmerDId}/reject`,
      { reason: 'Incomplete documentation' },
      adminToken
    );

    const farmerDLogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: `farmer_ord_d_${timestamp}@krishitest.com`,
      password: 'password123',
    });
    const farmerDToken = farmerDLogin.data.data.token;

    // Register Consumer A
    const consumerARes = await makeRequest('POST', '/api/auth/consumer/register', {
      name: 'Ananya Sharma',
      email: `consumer_ord_a_${timestamp}@krishitest.com`,
      phone: '+91 98451 99012',
      password: 'consumer123',
    });
    const consumerAToken = consumerARes.data.data.token;
    const consumerAId = consumerARes.data.data.user.id;
    assert(consumerARes.status === 201 && consumerAToken, 'Consumer A registered in PostgreSQL');

    // Register Consumer B
    const consumerBRes = await makeRequest('POST', '/api/auth/consumer/register', {
      name: 'Rohit Verma',
      email: `consumer_ord_b_${timestamp}@krishitest.com`,
      phone: '+91 98452 88013',
      password: 'consumer123',
    });
    const consumerBToken = consumerBRes.data.data.token;
    const consumerBId = consumerBRes.data.data.user.id;
    assert(consumerBRes.status === 201 && consumerBToken, 'Consumer B registered in PostgreSQL');

    // Create Product A1 (Farmer A: Price 60, Qty 50)
    const prodA1Res = await makeRequest(
      'POST',
      '/api/farmer/products',
      {
        name: 'Country Nati Tomatoes',
        category: 'VEGETABLES',
        description: 'Juicy local vine-ripened tomatoes',
        price: 60,
        unit: '1 kg',
        unitShort: 'kg',
        images: ['https://images.unsplash.com/photo-nati-tomatoes.jpg'],
        availableQuantity: 50,
      },
      farmerAToken
    );
    const prodA1 = prodA1Res.data.data;
    assert(prodA1Res.status === 201 && prodA1.id, `Product A1 created (${prodA1.name}, 50 kg @ ₹60)`);

    // Create Product B1 (Farmer B: Price 80, Qty 40)
    const prodB1Res = await makeRequest(
      'POST',
      '/api/farmer/products',
      {
        name: 'Hydroponic English Cucumber',
        category: 'VEGETABLES',
        description: 'Crisp pesticide-free cucumbers',
        price: 80,
        unit: '1 kg',
        unitShort: 'kg',
        images: ['https://images.unsplash.com/photo-cucumber.jpg'],
        availableQuantity: 40,
      },
      farmerBToken
    );
    const prodB1 = prodB1Res.data.data;
    assert(prodB1Res.status === 201 && prodB1.id, `Product B1 created (${prodB1.name}, 40 kg @ ₹80)`);

    console.log('\n--- EXECUTING 22 TEST CASES ---');

    // =========================================================================
    // Test 1: Consumer can place valid order
    // =========================================================================
    console.log('\nTest 1: Consumer can place valid order...');
    const placeOrderPayload = {
      items: [
        { productId: prodA1.id, quantity: 5 },
        { productId: prodB1.id, quantity: 3 },
      ],
      deliveryAddress: {
        name: 'Ananya Sharma',
        phone: '+91 98451 99012',
        addressLine: 'Villa 18, Ferns Meadows, HSR Layout',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560102',
        hub: 'HSR Layout',
      },
      deliverySlot: {
        name: 'Morning Slot',
        timeRange: '8:00 AM – 11:00 AM',
      },
      paymentMethod: 'UPI',
    };

    const orderRes = await makeRequest('POST', '/api/orders', placeOrderPayload, consumerAToken);
    assert(orderRes.status === 201, 'POST /api/orders returns 201 Created');
    const orderData = orderRes.data.data;
    const orderId = orderData.id;
    const orderNumber = orderData.orderNumber;

    // =========================================================================
    // Test 2: Order stored in PostgreSQL
    // =========================================================================
    console.log('\nTest 2: Order stored in PostgreSQL...');
    assert(orderData.id && orderData.orderNumber, `Order stored with ID: ${orderId}, Number: ${orderNumber}`);
    assert(orderData.consumerId === consumerAId, 'Order correctly linked to Consumer A ID');
    assert(orderData.status === 'PLACED', `Initial order status is PLACED (got: ${orderData.status})`);
    assert(orderData.timeline && orderData.timeline.length >= 1, 'Initial timeline step recorded in PostgreSQL');
    assert(orderData.timeline[0].status === 'PLACED', 'Initial timeline step status is PLACED');

    // =========================================================================
    // Test 3: OrderItems stored correctly
    // =========================================================================
    console.log('\nTest 3: OrderItems stored correctly...');
    assert(orderData.items && orderData.items.length === 2, 'Exactly 2 OrderItems stored');
    const itemA = orderData.items.find((i) => i.productId === prodA1.id);
    const itemB = orderData.items.find((i) => i.productId === prodB1.id);
    assert(itemA && Number(itemA.quantity) === 5, 'Item A quantity is 5');
    assert(itemB && Number(itemB.quantity) === 3, 'Item B quantity is 3');

    // =========================================================================
    // Test 4: Historical product/farmer snapshot stored
    // =========================================================================
    console.log('\nTest 4: Historical product/farmer snapshot stored...');
    assert(itemA.productName === 'Country Nati Tomatoes', 'Historical productName stored');
    assert(itemA.farmerName === 'Ramesh Gowda', 'Historical farmerName stored');
    assert(itemA.farmName === 'Gowda Heritage Farms', 'Historical farmName stored');
    assert(Number(itemA.unitPrice) === 60, 'Historical unitPrice stored (60)');
    assert(Number(itemA.totalPrice) === 300, 'Historical totalPrice calculated (300)');
    assert(itemB.farmName === 'Patil Organic Meadows', 'Historical farmName for Item B stored');

    // =========================================================================
    // Test 5: Server calculates price correctly
    // =========================================================================
    console.log('\nTest 5: Server calculates price correctly...');
    // Item 1: 5 * 60 = 300
    // Item 2: 3 * 80 = 240
    // Subtotal: 540
    // Delivery fee: 0 (subtotal > 499)
    // Platform fee: 10% of 540 = 54
    // Farmer earnings: 75% of 540 = 405
    // Total: 540 + 0 + 54 = 594
    assert(Number(orderData.subtotal) === 540, `Subtotal is 540 (got: ${orderData.subtotal})`);
    assert(Number(orderData.deliveryFee) === 0, `Delivery fee is 0 (> 499 free delivery) (got: ${orderData.deliveryFee})`);
    assert(Number(orderData.platformFee) === 54, `Platform fee is 54 (10%) (got: ${orderData.platformFee})`);
    assert(Number(orderData.farmerEarnings) === 405, `Farmer earnings is 405 (75%) (got: ${orderData.farmerEarnings})`);
    assert(Number(orderData.total) === 594, `Total is 594 (got: ${orderData.total})`);

    // =========================================================================
    // Test 6: Client cannot manipulate price
    // =========================================================================
    console.log('\nTest 6: Client cannot manipulate price...');
    const fakePricePayload = {
      items: [{ productId: prodA1.id, quantity: 2, price: 1, unitPrice: 1, totalPrice: 2 }],
      subtotal: 2,
      deliveryFee: 0,
      platformFee: 0,
      farmerEarnings: 1,
      total: 2,
      deliveryAddress: {
        name: 'Hacker',
        phone: '+91 99999 99999',
        addressLine: 'Hacker St',
        pincode: '560001',
      },
    };
    const fakePriceRes = await makeRequest('POST', '/api/orders', fakePricePayload, consumerAToken);
    assert(fakePriceRes.status === 201, 'Order created successfully');
    // True subtotal: 2 * 60 = 120. Delivery fee: 35. Platform fee: 12. Total = 120 + 35 + 12 = 167.
    assert(Number(fakePriceRes.data.data.subtotal) === 120, `Subtotal derived from DB price: 120 (got: ${fakePriceRes.data.data.subtotal})`);
    assert(Number(fakePriceRes.data.data.total) === 167, `Total derived server-side: 167 (got: ${fakePriceRes.data.data.total})`);

    // =========================================================================
    // Test 7: Insufficient inventory rejects order
    // =========================================================================
    console.log('\nTest 7: Insufficient inventory rejects order...');
    const excessivePayload = {
      items: [{ productId: prodA1.id, quantity: 1000 }],
      deliveryAddress: { name: 'Ananya', phone: '+91 98451 99012', addressLine: 'HSR', pincode: '560102' },
    };
    const excessiveRes = await makeRequest('POST', '/api/orders', excessivePayload, consumerAToken);
    assert(excessiveRes.status === 400, `Excessive order rejected with 400 (got: ${excessiveRes.status})`);
    assert(excessiveRes.data.error.includes('Insufficient inventory'), 'Error specifies insufficient inventory');

    // =========================================================================
    // Test 8: Failed order does not partially modify inventory
    // =========================================================================
    console.log('\nTest 8: Failed order does not partially modify inventory...');
    // Check Product B1 stock before
    const invBBefore = await makeRequest('GET', '/api/farmer/inventory', null, farmerBToken);
    const itemBBefore = invBBefore.data.data.find((i) => i.productId === prodB1.id);
    const availBBefore = itemBBefore.availableQuantity;

    const partialFailPayload = {
      items: [
        { productId: prodB1.id, quantity: 5 }, // valid
        { productId: prodA1.id, quantity: 5000 }, // invalid
      ],
      deliveryAddress: { name: 'Ananya', phone: '+91 98451 99012', addressLine: 'HSR', pincode: '560102' },
    };
    const partialFailRes = await makeRequest('POST', '/api/orders', partialFailPayload, consumerAToken);
    assert(partialFailRes.status === 400, 'Partial failure transaction rejected (400 Bad Request)');

    const invBAfter = await makeRequest('GET', '/api/farmer/inventory', null, farmerBToken);
    const itemBAfter = invBAfter.data.data.find((i) => i.productId === prodB1.id);
    assert(itemBAfter.availableQuantity === availBBefore, `Product B available stock untouched: ${availBBefore} (got: ${itemBAfter.availableQuantity})`);

    // =========================================================================
    // Test 9: Inventory reservation works
    // =========================================================================
    console.log('\nTest 9: Inventory reservation works...');
    // Prod A started at 50, order 1 reserved 5, order 2 (fake price test) reserved 2 => available should be 43, reserved 7
    const invA = await makeRequest('GET', '/api/farmer/inventory', null, farmerAToken);
    const itemAInv = invA.data.data.find((i) => i.productId === prodA1.id);
    assert(itemAInv.availableQuantity === 43, `Product A availableQuantity correctly decremented to 43 (got: ${itemAInv.availableQuantity})`);
    assert(itemAInv.reservedQuantity === 7, `Product A reservedQuantity correctly incremented to 7 (got: ${itemAInv.reservedQuantity})`);

    // =========================================================================
    // Test 10: Product stock synchronizes
    // =========================================================================
    console.log('\nTest 10: Product stock synchronizes...');
    const prodAGet = await makeRequest('GET', `/api/farmer/products/${prodA1.id}`, null, farmerAToken);
    assert(Number(prodAGet.data.data.availableQuantity) === 43, `Product table availableQuantity is 43 (got: ${prodAGet.data.data.availableQuantity})`);
    assert(Number(prodAGet.data.data.reservedQuantity) === 7, `Product table reservedQuantity is 7 (got: ${prodAGet.data.data.reservedQuantity})`);
    assert(prodAGet.data.data.inStock === true, 'Product inStock remains true');

    // =========================================================================
    // Test 11: Farmer can see own order items
    // =========================================================================
    console.log('\nTest 11: Farmer can see own order items...');
    const farmerAOrdersRes = await makeRequest('GET', '/api/farmer/orders', null, farmerAToken);
    assert(farmerAOrdersRes.status === 200, 'Farmer A GET /api/farmer/orders returns 200');
    const farmerAOrder = farmerAOrdersRes.data.data.find((o) => o.id === orderNumber || o.rawId === orderId);
    assert(farmerAOrder !== undefined, 'Farmer A sees the multi-farmer order');
    assert(farmerAOrder.items.length === 1, `Farmer A sees only 1 item in multi-farmer order (got: ${farmerAOrder.items.length})`);
    assert(farmerAOrder.items[0].productId === prodA1.id, 'Item belongs to Farmer A');

    // =========================================================================
    // Test 12: Farmer cannot see another farmer's items
    // =========================================================================
    console.log('\nTest 12: Farmer cannot see another farmer\'s items...');
    const farmerBOrdersRes = await makeRequest('GET', '/api/farmer/orders', null, farmerBToken);
    const farmerBOrder = farmerBOrdersRes.data.data.find((o) => o.id === orderNumber || o.rawId === orderId);
    assert(farmerBOrder !== undefined, 'Farmer B sees the multi-farmer order');
    assert(farmerBOrder.items.length === 1, `Farmer B sees only 1 item (got: ${farmerBOrder.items.length})`);
    assert(farmerBOrder.items[0].productId === prodB1.id, 'Farmer B sees ONLY Product B1');
    assert(!farmerBOrder.items.some((i) => i.productId === prodA1.id), 'Farmer B CANNOT see Farmer A\'s item');
    assert(!farmerAOrder.items.some((i) => i.productId === prodB1.id), 'Farmer A CANNOT see Farmer B\'s item');

    // =========================================================================
    // Test 13: Consumer can see own orders
    // =========================================================================
    console.log('\nTest 13: Consumer can see own orders...');
    const consumerAOrdersRes = await makeRequest('GET', '/api/orders', null, consumerAToken);
    assert(consumerAOrdersRes.status === 200, 'Consumer A GET /api/orders returns 200');
    assert(consumerAOrdersRes.data.data.length >= 1, 'Consumer A has orders in list');

    const consumerASingle = await makeRequest('GET', `/api/orders/${orderNumber}`, null, consumerAToken);
    assert(consumerASingle.status === 200, 'Consumer A GET /api/orders/:orderId returns 200');
    assert(consumerASingle.data.data.items.length === 2, 'Consumer sees full basket with both items');

    // =========================================================================
    // Test 14: Consumer cannot see another consumer's orders
    // =========================================================================
    console.log('\nTest 14: Consumer cannot see another consumer\'s orders...');
    const consumerBOrdersRes = await makeRequest('GET', '/api/orders', null, consumerBToken);
    assert(consumerBOrdersRes.data.data.length === 0, 'Consumer B order list is empty');

    const consumerBAccessA = await makeRequest('GET', `/api/orders/${orderNumber}`, null, consumerBToken);
    assert(consumerBAccessA.status === 404, `Consumer B blocked from viewing Consumer A's order: 404 Not Found (got: ${consumerBAccessA.status})`);

    // =========================================================================
    // Test 15: Farmer status update works
    // =========================================================================
    console.log('\nTest 15: Farmer status update works...');
    const update1 = await makeRequest(
      'PATCH',
      `/api/farmer/orders/${orderNumber}/status`,
      { status: 'CONFIRMED' },
      farmerAToken
    );
    assert(update1.status === 200, 'Farmer A marked order as CONFIRMED');
    assert(update1.data.data.status === 'Confirmed', `Farmer status is Confirmed (got: ${update1.data.data.status})`);

    const update2 = await makeRequest(
      'PATCH',
      `/api/farmer/orders/${orderNumber}/status`,
      { status: 'HARVESTING' },
      farmerAToken
    );
    assert(update2.status === 200, 'Farmer A marked order as HARVESTING');

    const update3 = await makeRequest(
      'PATCH',
      `/api/farmer/orders/${orderNumber}/status`,
      { status: 'PACKED' },
      farmerAToken
    );
    assert(update3.status === 200, 'Farmer A marked order as PACKED');
    assert(update3.data.data.status === 'Ready', `Status mapped to Ready (got: ${update3.data.data.status})`);

    // =========================================================================
    // Test 16: Invalid status transition rejected
    // =========================================================================
    console.log('\nTest 16: Invalid status transition rejected...');
    // Attempt backwards transition from PACKED back to PLACED
    const invalidBackwards = await makeRequest(
      'PATCH',
      `/api/farmer/orders/${orderNumber}/status`,
      { status: 'PLACED' },
      farmerAToken
    );
    assert(invalidBackwards.status === 400, `Backwards transition rejected: 400 Bad Request (got: ${invalidBackwards.status})`);

    // Attempt nonsensical status
    const invalidStatus = await makeRequest(
      'PATCH',
      `/api/farmer/orders/${orderNumber}/status`,
      { status: 'FLYING_TO_SPACE' },
      farmerAToken
    );
    assert(invalidStatus.status === 400, `Nonsense status rejected: 400 Bad Request (got: ${invalidStatus.status})`);

    // =========================================================================
    // Test 17: Cancellation restores inventory
    // =========================================================================
    console.log('\nTest 17: Cancellation restores inventory...');
    // Create new order for 10 kg of Product A1
    const orderToCancelRes = await makeRequest(
      'POST',
      '/api/orders',
      {
        items: [{ productId: prodA1.id, quantity: 10 }],
        deliveryAddress: { name: 'Ananya', phone: '+91 98451 99012', addressLine: 'HSR', pincode: '560102' },
      },
      consumerAToken
    );
    const cancelOrderNumber = orderToCancelRes.data.data.orderNumber;

    // Check inventory: available was 43 -> now 33, reserved was 7 -> now 17
    const invBeforeCancel = await makeRequest('GET', '/api/farmer/inventory', null, farmerAToken);
    const itemBeforeCancel = invBeforeCancel.data.data.find((i) => i.productId === prodA1.id);
    assert(itemBeforeCancel.availableQuantity === 33, `Available dropped to 33 (got: ${itemBeforeCancel.availableQuantity})`);
    assert(itemBeforeCancel.reservedQuantity === 17, `Reserved increased to 17 (got: ${itemBeforeCancel.reservedQuantity})`);

    // Farmer A cancels this order
    const cancelRes = await makeRequest(
      'PATCH',
      `/api/farmer/orders/${cancelOrderNumber}/status`,
      { status: 'CANCELLED' },
      farmerAToken
    );
    assert(cancelRes.status === 200, 'Order successfully cancelled');
    assert(cancelRes.data.data.status === 'Cancelled', 'Status is Cancelled');

    // Check inventory restored
    const invAfterCancel = await makeRequest('GET', '/api/farmer/inventory', null, farmerAToken);
    const itemAfterCancel = invAfterCancel.data.data.find((i) => i.productId === prodA1.id);
    assert(itemAfterCancel.availableQuantity === 43, `Available restored back to 43 (got: ${itemAfterCancel.availableQuantity})`);
    assert(itemAfterCancel.reservedQuantity === 7, `Reserved restored back to 7 (got: ${itemAfterCancel.reservedQuantity})`);

    // =========================================================================
    // Test 18: Delivery/fulfilment updates reserved/sold quantities correctly
    // =========================================================================
    console.log('\nTest 18: Delivery/fulfilment updates reserved/sold quantities correctly...');
    // Initial order has 5 kg reserved for Prod A1.
    // Progress order from PACKED -> OUT_FOR_DELIVERY -> DELIVERED
    await makeRequest(
      'PATCH',
      `/api/farmer/orders/${orderNumber}/status`,
      { status: 'OUT_FOR_DELIVERY' },
      farmerAToken
    );
    const deliverRes = await makeRequest(
      'PATCH',
      `/api/farmer/orders/${orderNumber}/status`,
      { status: 'DELIVERED' },
      farmerAToken
    );
    assert(deliverRes.status === 200, 'Order progressed to DELIVERED');

    // Verify stock counts:
    // Reserved drops from 7 to 2 (5 kg fulfilled)
    // Sold increases from 0 to 5
    const invAfterDeliver = await makeRequest('GET', '/api/farmer/inventory', null, farmerAToken);
    const itemAfterDeliver = invAfterDeliver.data.data.find((i) => i.productId === prodA1.id);
    assert(itemAfterDeliver.reservedQuantity === 2, `Reserved quantity decremented to 2 (got: ${itemAfterDeliver.reservedQuantity})`);
    assert(itemAfterDeliver.soldQuantity === 5, `Sold quantity incremented to 5 (got: ${itemAfterDeliver.soldQuantity})`);

    // =========================================================================
    // Test 19: Pending farmer cannot manage orders
    // =========================================================================
    console.log('\nTest 19: Pending farmer cannot manage orders...');
    const pendingFarmerOrders = await makeRequest('GET', '/api/farmer/orders', null, farmerCToken);
    assert(pendingFarmerOrders.status === 403, `Pending farmer GET /api/farmer/orders blocked: 403 Forbidden (got: ${pendingFarmerOrders.status})`);

    const pendingFarmerPatch = await makeRequest(
      'PATCH',
      `/api/farmer/orders/${orderNumber}/status`,
      { status: 'CONFIRMED' },
      farmerCToken
    );
    assert(pendingFarmerPatch.status === 403, `Pending farmer PATCH status blocked: 403 Forbidden (got: ${pendingFarmerPatch.status})`);

    // =========================================================================
    // Test 20: Rejected farmer cannot manage orders
    // =========================================================================
    console.log('\nTest 20: Rejected farmer cannot manage orders...');
    const rejectedFarmerOrders = await makeRequest('GET', '/api/farmer/orders', null, farmerDToken);
    assert(rejectedFarmerOrders.status === 403, `Rejected farmer GET /api/farmer/orders blocked: 403 Forbidden (got: ${rejectedFarmerOrders.status})`);

    const rejectedFarmerPatch = await makeRequest(
      'PATCH',
      `/api/farmer/orders/${orderNumber}/status`,
      { status: 'CONFIRMED' },
      farmerDToken
    );
    assert(rejectedFarmerPatch.status === 403, `Rejected farmer PATCH status blocked: 403 Forbidden (got: ${rejectedFarmerPatch.status})`);

    // =========================================================================
    // Test 21: Order survives page refresh
    // =========================================================================
    console.log('\nTest 21: Order survives page refresh...');
    const refreshOrderRes = await makeRequest('GET', `/api/orders/${orderNumber}`, null, consumerAToken);
    assert(refreshOrderRes.status === 200, 'Order successfully re-fetched from PostgreSQL');
    assert(refreshOrderRes.data.data.id === orderNumber, 'Order number matches');
    assert(refreshOrderRes.data.data.status === 'delivered', 'Order status persists as delivered');
    assert(refreshOrderRes.data.data.items.length === 2, 'All 2 items persist');
    assert(refreshOrderRes.data.data.total === 594, 'Total price persists as 594');

    // =========================================================================
    // Test 22: Order survives logout/login
    // =========================================================================
    console.log('\nTest 22: Order survives logout/login...');
    // Re-login Consumer A with fresh session
    const reLoginRes = await makeRequest('POST', '/api/auth/consumer/login', {
      email: `consumer_ord_a_${timestamp}@krishitest.com`,
      password: 'consumer123',
    });
    assert(reLoginRes.status === 200, 'Consumer A re-authenticated successfully');
    const freshToken = reLoginRes.data.data.token;

    const freshOrdersRes = await makeRequest('GET', '/api/orders', null, freshToken);
    assert(freshOrdersRes.status === 200, 'Fresh session queries orders');
    const foundDeliveredOrder = freshOrdersRes.data.data.find((o) => o.id === orderNumber);
    assert(foundDeliveredOrder !== undefined, 'Delivered order recovered in full after fresh login');

    // =========================================================================
    // SUMMARY
    // =========================================================================
    console.log('\n======================================================');
    console.log(`ORDER INTEGRATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Unexpected test error:', err);
    process.exit(1);
  }
}

runOrderTests();
