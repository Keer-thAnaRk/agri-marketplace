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

async function runDeliveryTests() {
  console.log('=== STARTING DELIVERY BATCHING INTEGRATION TESTS ===\n');
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
    // 1. Setup: Admin login
    console.log('1. Setting up Admin, Farmers, and Consumer...');
    const adminLogin = await makeRequest('POST', '/api/auth/admin/login', {
      email: 'admin@krishimarket.in',
      password: 'admin123',
    });
    assert(adminLogin.status === 200, 'Admin login succeeds (200)');
    const adminToken = adminLogin.data.data.token;

    // Register Farmer A (Approved)
    const farmerAEmail = `ravi.delivery.${timestamp}@krishitest.com`;
    const farmerARes = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Ravi Kumar',
      email: farmerAEmail,
      password: 'FarmerPassword123!',
      phone: `984${String(timestamp).slice(-7)}`,
      farmName: 'Green Valley Organics',
      farmLocation: 'Sarjapur Hobli, Anekal Taluk',
      location: 'Sarjapur Road, Bengaluru',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '562125',
      hub: 'Sarjapur Road',
      farmingMethod: 'ORGANIC',
      yearsFarming: 8,
      acreage: 4.5,
      mainCrops: ['Tomatoes', 'Spinach', 'Carrots'],
    });
    assert(farmerARes.status === 201, 'Farmer A registered (201)');
    const farmerAId = farmerARes.data.data.farmer.id;

    // Approve Farmer A
    const approveA = await makeRequest(
      'POST',
      `/api/admin/farmers/${farmerAId}/approve`,
      { notes: 'Delivery batch testing' },
      adminToken
    );
    assert(approveA.status === 200, 'Farmer A approved by admin (200)');

    const farmerALogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: farmerAEmail,
      password: 'FarmerPassword123!',
    });
    assert(farmerALogin.status === 200, 'Farmer A logged in (200)');
    const farmerAToken = farmerALogin.data.data.token;

    // Register Farmer B (Pending)
    const farmerBEmail = `suresh.delivery.${timestamp}@krishitest.com`;
    const farmerBRes = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Suresh Gowda',
      email: farmerBEmail,
      password: 'FarmerPassword123!',
      phone: `974${String(timestamp).slice(-7)}`,
      farmName: 'Cauvery Bio Farm',
      farmLocation: 'Mandya District',
      location: 'Koramangala, Bengaluru',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '571401',
      hub: 'Koramangala',
      farmingMethod: 'NATURAL',
      yearsFarming: 5,
      acreage: 3.0,
      mainCrops: ['Potatoes', 'Onions'],
    });
    assert(farmerBRes.status === 201, 'Farmer B registered as Pending (201)');
    const farmerBId = farmerBRes.data.data.farmer.id;

    const farmerBLogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: farmerBEmail,
      password: 'FarmerPassword123!',
    });
    assert(farmerBLogin.status === 200, 'Farmer B logged in (200)');
    const farmerBToken = farmerBLogin.data.data.token;

    // Register Farmer C and Reject
    const farmerCEmail = `ramesh.delivery.${timestamp}@krishitest.com`;
    const farmerCRes = await makeRequest('POST', '/api/auth/farmer/register', {
      fullName: 'Ramesh Patel',
      email: farmerCEmail,
      password: 'FarmerPassword123!',
      phone: `964${String(timestamp).slice(-7)}`,
      farmName: 'Patel Agro',
      farmLocation: 'Hoskote Taluk',
      location: 'Whitefield, Bengaluru',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '562114',
      hub: 'Whitefield',
      farmingMethod: 'CONVENTIONAL',
      yearsFarming: 2,
      acreage: 2.0,
      mainCrops: ['Cabbage'],
    });
    assert(farmerCRes.status === 201, 'Farmer C registered (201)');
    const farmerCId = farmerCRes.data.data.farmer.id;
    const rejectC = await makeRequest(
      'POST',
      `/api/admin/farmers/${farmerCId}/reject`,
      { reason: 'Incomplete documentation' },
      adminToken
    );
    assert(rejectC.status === 200, 'Farmer C rejected by admin (200)');

    const farmerCLogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: farmerCEmail,
      password: 'FarmerPassword123!',
    });
    assert(farmerCLogin.status === 200, 'Farmer C logged in (200)');
    const farmerCToken = farmerCLogin.data.data.token;

    // Register Consumer
    const consumerRes = await makeRequest('POST', '/api/auth/consumer/register', {
      name: 'Ananya Sharma',
      email: `ananya.deliv.${timestamp}@krishitest.com`,
      password: 'ConsumerPassword123!',
      phone: `954${String(timestamp).slice(-7)}`,
    });
    assert(consumerRes.status === 201, 'Consumer registered (201)');
    const consumerToken = consumerRes.data.data.token;

    // Create Products for Farmer A & Farmer B
    const prodARes = await makeRequest(
      'POST',
      '/api/farmer/products',
      {
        name: 'Organic Tomatoes',
        category: 'VEGETABLES',
        description: 'Vine ripened organic tomatoes',
        price: 45,
        unit: '1 kg',
        unitShort: 'kg',
        shelfLifeDays: 6,
        images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea'],
        availableQuantity: 100,
      },
      farmerAToken
    );
    assert(prodARes.status === 201, 'Product created for Farmer A (201)');
    const productAId = prodARes.data.data.id;

    const prodBRes = await makeRequest(
      'POST',
      '/api/farmer/products',
      {
        name: 'Fresh Farm Potatoes',
        category: 'VEGETABLES',
        description: 'Earthy golden potatoes',
        price: 35,
        unit: '1 kg',
        unitShort: 'kg',
        shelfLifeDays: 14,
        images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655'],
        initialStock: 100,
      },
      // Note: Farmer B is pending so cannot create product yet, we'll test product later once approved
      adminToken
    );

    // --- TEST 1: Approved farmer can create batch ---
    console.log('\n--- TEST 1: Approved farmer can create batch ---');
    const createBatch1 = await makeRequest(
      'POST',
      '/api/farmer/deliveries/batches',
      {
        hubArea: 'HSR Layout',
        deliverySlot: '8:00 AM – 11:00 AM',
        riderName: 'Manjunath G.',
        riderVehicle: 'Ather Cargo EV',
        estimatedDistanceKm: 6.8,
        estimatedDeliveryTime: '35 mins',
      },
      farmerAToken
    );
    assert(createBatch1.status === 201, 'Approved farmer created delivery batch (201)');
    assert(createBatch1.data.data.batchCode.startsWith('DB-'), 'Generated unique batchCode with DB- prefix');
    assert(createBatch1.data.data.hubArea === 'HSR Layout', 'Hub area is HSR Layout');
    const batch1Id = createBatch1.data.data.id;
    const batch1Code = createBatch1.data.data.batchCode;

    // --- TEST 2: Pending farmer receives 403 ---
    console.log('\n--- TEST 2: Pending farmer receives 403 ---');
    const pendingCreate = await makeRequest(
      'POST',
      '/api/farmer/deliveries/batches',
      {
        hubArea: 'Koramangala',
        deliverySlot: '8:00 AM – 11:00 AM',
      },
      farmerBToken
    );
    assert(pendingCreate.status === 403, 'Pending farmer blocked from creating delivery batch (403)');

    // --- TEST 3: Rejected farmer receives 403 ---
    console.log('\n--- TEST 3: Rejected farmer receives 403 ---');
    const rejectedCreate = await makeRequest(
      'POST',
      '/api/farmer/deliveries/batches',
      {
        hubArea: 'Whitefield',
        deliverySlot: '8:00 AM – 11:00 AM',
      },
      farmerCToken
    );
    assert(rejectedCreate.status === 403, 'Rejected farmer blocked from creating delivery batch (403)');

    // Create real consumer orders for testing batch assignments
    console.log('\nCreating test orders for delivery batching...');
    // Order 1: Farmer A, HSR Layout, Morning
    const order1Res = await makeRequest(
      'POST',
      '/api/orders',
      {
        items: [{ productId: productAId, quantity: 5 }],
        deliveryAddress: {
          name: 'Ananya Sharma',
          phone: '9876543210',
          addressLine: 'Flat 402, Green Glen',
          hub: 'HSR Layout, Sector 2',
          city: 'Bengaluru',
          pincode: '560102',
        },
        deliverySlot: {
          name: 'Morning Fresh Harvest',
          timeRange: '8:00 AM – 11:00 AM',
        },
      },
      consumerToken
    );
    assert(order1Res.status === 201, 'Order 1 placed (Farmer A, HSR Layout, Morning)');
    const order1Id = order1Res.data.data.id;
    const order1Number = order1Res.data.data.orderNumber;

    // Order 2: Farmer A, HSR Layout, Morning
    const order2Res = await makeRequest(
      'POST',
      '/api/orders',
      {
        items: [{ productId: productAId, quantity: 3 }],
        deliveryAddress: {
          name: 'Kavitha Murthy',
          phone: '9876543211',
          addressLine: '12th Main, 5th Cross',
          hub: 'HSR Layout, Sector 1',
          city: 'Bengaluru',
          pincode: '560102',
        },
        deliverySlot: {
          name: 'Morning Fresh Harvest',
          timeRange: '8:00 AM – 11:00 AM',
        },
      },
      consumerToken
    );
    assert(order2Res.status === 201, 'Order 2 placed (Farmer A, HSR Layout, Morning)');
    const order2Id = order2Res.data.data.id;
    const order2Number = order2Res.data.data.orderNumber;

    // Order 3: Farmer A, Koramangala (Hub mismatch for HSR batch), Morning
    const order3Res = await makeRequest(
      'POST',
      '/api/orders',
      {
        items: [{ productId: productAId, quantity: 4 }],
        deliveryAddress: {
          name: 'Pooja Hegde',
          phone: '9876543212',
          addressLine: '80ft Road, 4th Block',
          hub: 'Koramangala, 4th Block',
          city: 'Bengaluru',
          pincode: '560034',
        },
        deliverySlot: {
          name: 'Morning Fresh Harvest',
          timeRange: '8:00 AM – 11:00 AM',
        },
      },
      consumerToken
    );
    assert(order3Res.status === 201, 'Order 3 placed (Farmer A, Koramangala, Morning)');
    const order3Id = order3Res.data.data.id;
    const order3Number = order3Res.data.data.orderNumber;

    // Order 4: Farmer A, HSR Layout, Evening (Slot mismatch for Morning batch)
    const order4Res = await makeRequest(
      'POST',
      '/api/orders',
      {
        items: [{ productId: productAId, quantity: 2 }],
        deliveryAddress: {
          name: 'Vikram Joshi',
          phone: '9876543213',
          addressLine: '19th Main, Sector 4',
          hub: 'HSR Layout, Sector 4',
          city: 'Bengaluru',
          pincode: '560102',
        },
        deliverySlot: {
          name: 'Sunset Batch',
          timeRange: '5:30 PM – 8:30 PM',
        },
      },
      consumerToken
    );
    assert(order4Res.status === 201, 'Order 4 placed (Farmer A, HSR Layout, Evening)');
    const order4Id = order4Res.data.data.id;
    const order4Number = order4Res.data.data.orderNumber;

    // --- TEST 4: Farmer can assign eligible order ---
    console.log('\n--- TEST 4: Farmer can assign eligible order ---');
    const assignRes = await makeRequest(
      'POST',
      `/api/farmer/deliveries/batches/${batch1Id}/orders`,
      { orderIds: [order1Id] },
      farmerAToken
    );
    assert(assignRes.status === 200, 'Eligible order assigned to delivery batch (200)');
    assert(assignRes.data.data.orderIds.includes(order1Number), 'Assigned batch includes Order 1');
    assert(assignRes.data.data.customerNames.includes('Ananya Sharma'), 'Customer name mapped correctly');

    // --- TEST 5: Ineligible order rejected (Cancelled / Delivered) ---
    console.log('\n--- TEST 5: Ineligible order rejected ---');
    // Create an order and cancel it
    const cancelOrderRes = await makeRequest(
      'POST',
      '/api/orders',
      {
        items: [{ productId: productAId, quantity: 1 }],
        deliveryAddress: {
          name: 'Cancelled Order Customer',
          phone: '9876543299',
          addressLine: 'HSR Layout',
          hub: 'HSR Layout',
          city: 'Bengaluru',
          pincode: '560102',
        },
        deliverySlot: {
          name: 'Morning',
          timeRange: '8:00 AM – 11:00 AM',
        },
      },
      consumerToken
    );
    const cancelOrderId = cancelOrderRes.data.data.id;
    await makeRequest(
      'PATCH',
      `/api/farmer/orders/${cancelOrderId}/status`,
      { status: 'CANCELLED' },
      farmerAToken
    );

    const assignCancelled = await makeRequest(
      'POST',
      `/api/farmer/deliveries/batches/${batch1Id}/orders`,
      { orderIds: [cancelOrderId] },
      farmerAToken
    );
    assert(assignCancelled.status === 400, 'Cancelled order rejected from batch assignment (400)');

    // --- TEST 6: Order already assigned to another batch rejected ---
    console.log('\n--- TEST 6: Order already assigned to another batch rejected ---');
    const createBatch2 = await makeRequest(
      'POST',
      '/api/farmer/deliveries/batches',
      {
        hubArea: 'HSR Layout',
        deliverySlot: '8:00 AM – 11:00 AM',
      },
      farmerAToken
    );
    const batch2Id = createBatch2.data.data.id;

    // Attempt to assign Order 1 (already in batch1) to batch2
    const assignDuplicate = await makeRequest(
      'POST',
      `/api/farmer/deliveries/batches/${batch2Id}/orders`,
      { orderIds: [order1Id] },
      farmerAToken
    );
    assert(assignDuplicate.status === 400, 'Order already in active batch rejected (400)');

    // --- TEST 7: Hub mismatch rejected ---
    console.log('\n--- TEST 7: Hub mismatch rejected ---');
    // Order 3 is Koramangala, batch1 is HSR Layout
    const assignHubMismatch = await makeRequest(
      'POST',
      `/api/farmer/deliveries/batches/${batch1Id}/orders`,
      { orderIds: [order3Id] },
      farmerAToken
    );
    assert(assignHubMismatch.status === 400, 'Hub mismatch rejected (400)');

    // --- TEST 8: Delivery slot mismatch rejected ---
    console.log('\n--- TEST 8: Delivery slot mismatch rejected ---');
    // Order 4 is Evening slot, batch1 is Morning slot
    const assignSlotMismatch = await makeRequest(
      'POST',
      `/api/farmer/deliveries/batches/${batch1Id}/orders`,
      { orderIds: [order4Id] },
      farmerAToken
    );
    assert(assignSlotMismatch.status === 400, 'Delivery slot mismatch rejected (400)');

    // Approve Farmer B for multi-tenant isolation tests
    await makeRequest(
      'POST',
      `/api/admin/farmers/${farmerBId}/approve`,
      { notes: 'Approved for multi-tenant testing' },
      adminToken
    );

    // Farmer B creates their own delivery batch
    const createBatchB = await makeRequest(
      'POST',
      '/api/farmer/deliveries/batches',
      {
        hubArea: 'Koramangala',
        deliverySlot: '12:00 PM – 3:30 PM',
      },
      farmerBToken
    );
    assert(createBatchB.status === 201, 'Farmer B created their own batch (201)');
    const batchBId = createBatchB.data.data.id;

    // --- TEST 9: Farmer cannot access another farmer's batch ---
    console.log("\n--- TEST 9: Farmer cannot access another farmer's batch ---");
    const farmerATriesToViewB = await makeRequest(
      'GET',
      `/api/farmer/deliveries/batches/${batchBId}`,
      null,
      farmerAToken
    );
    assert(farmerATriesToViewB.status === 403, 'Farmer A cannot view Farmer B batch (403 Forbidden)');

    // --- TEST 10: Farmer cannot modify another farmer's batch ---
    console.log("\n--- TEST 10: Farmer cannot modify another farmer's batch ---");
    const farmerATriesToModifyB = await makeRequest(
      'PATCH',
      `/api/farmer/deliveries/batches/${batchBId}/status`,
      { status: 'READY' },
      farmerAToken
    );
    assert(farmerATriesToModifyB.status === 403, 'Farmer A cannot modify Farmer B batch status (403 Forbidden)');

    // --- TEST 11: Batch status transitions work ---
    console.log('\n--- TEST 11: Batch status transitions work ---');
    // Advance batch1 from PREPARING to READY
    const advanceToReady = await makeRequest(
      'PATCH',
      `/api/farmer/deliveries/batches/${batch1Id}/status`,
      { status: 'READY' },
      farmerAToken
    );
    assert(advanceToReady.status === 200, 'Batch status updated to READY (200)');
    assert(advanceToReady.data.data.status === 'Ready', 'Frontend status is "Ready"');

    // --- TEST 12: Invalid status transition rejected ---
    console.log('\n--- TEST 12: Invalid status transition rejected ---');
    // Backwards transition: READY -> PREPARING
    const backwardsTransition = await makeRequest(
      'PATCH',
      `/api/farmer/deliveries/batches/${batch1Id}/status`,
      { status: 'PREPARING' },
      farmerAToken
    );
    assert(backwardsTransition.status === 400, 'Backwards status transition rejected (400)');

    // --- TEST 13: Timeline entries created ---
    console.log('\n--- TEST 13: Timeline entries created ---');
    const fetchBatch1 = await makeRequest(
      'GET',
      `/api/farmer/deliveries/batches/${batch1Id}`,
      null,
      farmerAToken
    );
    assert(fetchBatch1.status === 200, 'Batch fetched successfully (200)');
    const timeline = fetchBatch1.data.data.timeline;
    assert(Array.isArray(timeline) && timeline.length >= 2, 'Batch has timeline steps');
    const hasReadyStep = timeline.some((s) => s.status === 'Ready' && s.completed);
    assert(hasReadyStep, 'Timeline contains completed "Ready" step');

    // --- TEST 14: OUT_FOR_DELIVERY synchronizes orders ---
    console.log('\n--- TEST 14: OUT_FOR_DELIVERY synchronizes orders ---');
    const advanceToOutForDelivery = await makeRequest(
      'PATCH',
      `/api/farmer/deliveries/batches/${batch1Id}/status`,
      { status: 'OUT_FOR_DELIVERY' },
      farmerAToken
    );
    assert(advanceToOutForDelivery.status === 200, 'Batch status advanced to OUT_FOR_DELIVERY (200)');

    // Check Order 1 status was updated to OUT_FOR_DELIVERY
    const order1Check = await makeRequest('GET', `/api/orders/${order1Id}`, null, consumerToken);
    assert(order1Check.status === 200, 'Order 1 fetched by consumer');
    const isOutForDelivery =
      order1Check.data.data.status?.toUpperCase() === 'OUT_FOR_DELIVERY' ||
      order1Check.data.data.orderStatus === 'OUT_FOR_DELIVERY';
    assert(isOutForDelivery, 'Order 1 automatically synchronized to OUT_FOR_DELIVERY');

    // --- TEST 15: DELIVERED synchronizes orders ---
    console.log('\n--- TEST 15: DELIVERED synchronizes orders ---');
    const advanceToDelivered = await makeRequest(
      'PATCH',
      `/api/farmer/deliveries/batches/${batch1Id}/status`,
      { status: 'DELIVERED' },
      farmerAToken
    );
    assert(advanceToDelivered.status === 200, 'Batch status advanced to DELIVERED (200)');

    // Check Order 1 status was updated to DELIVERED
    const order1DeliveredCheck = await makeRequest('GET', `/api/orders/${order1Id}`, null, consumerToken);
    const isDelivered =
      order1DeliveredCheck.data.data.status?.toUpperCase() === 'DELIVERED' ||
      order1DeliveredCheck.data.data.orderStatus === 'DELIVERED';
    assert(isDelivered, 'Order 1 automatically synchronized to DELIVERED');

    // --- TEST 16: deliveredAt populated ---
    console.log('\n--- TEST 16: deliveredAt populated ---');
    assert(order1DeliveredCheck.data.data.deliveredAt != null, 'Order 1 deliveredAt timestamp is populated');

    // Terminal state check on DELIVERED batch
    const tryChangeDeliveredBatch = await makeRequest(
      'PATCH',
      `/api/farmer/deliveries/batches/${batch1Id}/status`,
      { status: 'CANCELLED' },
      farmerAToken
    );
    assert(tryChangeDeliveredBatch.status === 400, 'Delivered batch cannot be transitioned or cancelled (400)');

    // --- TEST 17: Cancelled batch handled safely ---
    console.log('\n--- TEST 17: Cancelled batch handled safely ---');
    // Assign Order 2 to batch2, then cancel batch2
    await makeRequest(
      'POST',
      `/api/farmer/deliveries/batches/${batch2Id}/orders`,
      { orderIds: [order2Id] },
      farmerAToken
    );
    const cancelBatchRes = await makeRequest(
      'PATCH',
      `/api/farmer/deliveries/batches/${batch2Id}/status`,
      { status: 'CANCELLED' },
      farmerAToken
    );
    assert(cancelBatchRes.status === 200, 'Delivery batch successfully cancelled (200)');

    // Verify Order 2 deliveryBatchId is unassigned
    const order2Check = await makeRequest('GET', `/api/orders/${order2Id}`, null, consumerToken);
    assert(order2Check.data.data.deliveryBatchId == null, 'Order 2 unassigned from cancelled delivery batch');

    // --- TESTS 18, 19, 20: Auto-batching support ---
    console.log('\n--- TESTS 18, 19, 20: Auto-batching support ---');
    // Eligible unassigned orders available:
    // Order 2: HSR Layout, Morning (unassigned after batch 2 cancelled)
    // Order 3: Koramangala, Morning
    // Order 4: HSR Layout, Evening
    // Let's create Order 5: HSR Layout, Morning (compatible with Order 2)
    const order5Res = await makeRequest(
      'POST',
      '/api/orders',
      {
        items: [{ productId: productAId, quantity: 6 }],
        deliveryAddress: {
          name: 'Sunita Rao',
          phone: '9876543215',
          addressLine: '27th Main, Sector 1',
          hub: 'HSR Layout, Sector 1',
          city: 'Bengaluru',
          pincode: '560102',
        },
        deliverySlot: {
          name: 'Morning Fresh Harvest',
          timeRange: '8:00 AM – 11:00 AM',
        },
      },
      consumerToken
    );
    assert(order5Res.status === 201, 'Order 5 created (HSR Layout, Morning)');
    const order5Number = order5Res.data.data.orderNumber;

    // Trigger auto-batching
    const autoBatchRes = await makeRequest(
      'POST',
      '/api/farmer/deliveries/batches/auto-create',
      {},
      farmerAToken
    );
    assert(autoBatchRes.status === 201, 'Auto-batching executed successfully (201)');
    const createdBatches = autoBatchRes.data.batches;
    assert(createdBatches.length >= 3, `Created multiple distinct batches (count: ${createdBatches.length})`);

    // TEST 18: Auto-batching groups compatible orders
    const hsrMorningBatch = createdBatches.find(
      (b) => b.area === 'HSR Layout' && b.deliverySlot.includes('8:00 AM')
    );
    assert(hsrMorningBatch != null, 'TEST 18: Found HSR Layout Morning batch');
    assert(
      hsrMorningBatch.orderIds.includes(order2Number) && hsrMorningBatch.orderIds.includes(order5Number),
      'TEST 18: Compatible orders (Order 2 & Order 5) grouped into same batch'
    );

    // TEST 19: Auto-batching does not mix hubs
    const koraBatch = createdBatches.find((b) => b.area === 'Koramangala');
    assert(koraBatch != null, 'TEST 19: Distinct batch created for Koramangala hub');
    assert(
      !hsrMorningBatch.orderIds.includes(order3Number),
      'TEST 19: Koramangala order NOT mixed into HSR Layout batch'
    );

    // TEST 20: Auto-batching does not mix incompatible delivery slots
    const eveningBatch = createdBatches.find(
      (b) => b.area === 'HSR Layout' && b.deliverySlot.includes('12:00 PM') || b.deliverySlot.includes('5:30') || b.deliverySlot.includes('Evening')
    );
    assert(
      !hsrMorningBatch.orderIds.includes(order4Number),
      'TEST 20: Evening delivery slot order NOT mixed into Morning delivery slot batch'
    );

    // Test GET /api/farmer/deliveries/batches returns all farmer's batches
    const listBatches = await makeRequest('GET', '/api/farmer/deliveries/batches', null, farmerAToken);
    assert(listBatches.status === 200, 'GET /api/farmer/deliveries/batches succeeds (200)');
    assert(listBatches.data.count >= 4, `Farmer A sees their own batches (count: ${listBatches.data.count})`);
    assert(
      !listBatches.data.data.some((b) => b.id === batchBId),
      'Farmer A does not see Farmer B batch in list'
    );

    console.log('\n======================================================');
    console.log(`DELIVERY BATCHING TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Delivery test suite execution error:', err);
    process.exit(1);
  }
}

runDeliveryTests();
