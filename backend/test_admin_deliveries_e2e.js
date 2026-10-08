const { prisma } = require('./dist/db/prisma');

async function runAdminDeliveriesE2ETests() {
  console.log('=== STARTING ADMIN DELIVERY MANAGEMENT E2E INTEGRATION TESTS ===\n');

  const baseUrl = 'http://localhost:5000';
  const timestamp = Date.now();

  let adminToken = '';
  let farmerToken = '';
  let consumerToken = '';

  let farmerId = '';
  let farmerUserId = '';
  let consumerUserId = '';

  let batch1Id = '';
  let batch2Id = '';
  let order1Id = '';
  let order2Id = '';

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
    // 1. SETUP: Admin, Farmer, Consumer, Products, Orders
    // ----------------------------------------------------
    console.log('1. Authenticating Admin and creating test users in PostgreSQL...');

    // Admin login
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@krishimarket.in',
        password: 'admin123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data?.token;
    assert(adminLoginRes.status === 200 && adminToken, 'Admin logged in successfully');

    // Register Farmer
    const farmerEmail = `adm.deliv.farmer.${timestamp}@krishitest.com`;
    const farmerRegRes = await fetch(`${baseUrl}/api/auth/farmer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Shivanna Gowda',
        email: farmerEmail,
        phone: '+91 98450 33099',
        password: 'password123',
        farmName: 'Shivanna Organic Agro',
        farmLocation: 'Survey 104, Sarjapur Belt',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560035',
        hub: 'Sarjapur Hub',
      }),
    });
    const farmerRegData = await farmerRegRes.json();
    farmerId = farmerRegData.data?.farmer?.id;
    farmerUserId = farmerRegData.data?.user?.id;

    // Approve Farmer
    await fetch(`${baseUrl}/api/admin/farmers/${farmerId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });

    // Login Farmer
    const farmerLoginRes = await fetch(`${baseUrl}/api/auth/farmer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: farmerEmail,
        password: 'password123',
      }),
    });
    const farmerLoginData = await farmerLoginRes.json();
    farmerToken = farmerLoginData.data?.token;
    assert(farmerLoginRes.status === 200 && farmerToken, 'Farmer registered, approved, and logged in');

    // Register Consumer
    const consumerEmail = `adm.deliv.consumer.${timestamp}@krishitest.com`;
    const consumerRegRes = await fetch(`${baseUrl}/api/auth/consumer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kavita Menon',
        email: consumerEmail,
        phone: '+91 98451 44088',
        password: 'consumer123',
      }),
    });
    const consumerRegData = await consumerRegRes.json();
    consumerToken = consumerRegData.data?.token;
    consumerUserId = consumerRegData.data?.user?.id;
    assert(consumerRegRes.status === 201 && consumerToken, 'Consumer registered in PostgreSQL');

    // Farmer creates product
    const prodRes = await fetch(`${baseUrl}/api/farmer/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({
        name: 'Hydroponic Spinach',
        category: 'VEGETABLES',
        description: 'Crisp pesticide-free tender spinach',
        price: 45,
        unit: '250 g bunch',
        unitShort: 'bunch',
        availableQuantity: 50,
      }),
    });
    const prodData = await prodRes.json();
    const productId = prodData.data?.id;
    assert(prodRes.status === 201 && productId, 'Farmer created test product');

    // Consumer places Order 1
    const order1Res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${consumerToken}`,
      },
      body: JSON.stringify({
        items: [{ productId, quantity: 2 }],
        deliveryAddress: {
          name: 'Kavita Menon',
          phone: '+91 98451 44088',
          addressLine: 'Villa 12, Sobha Hibiscus, HSR Sector 2',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560102',
          hub: 'HSR Layout',
        },
        deliverySlot: {
          name: 'Morning Delivery',
          timeRange: '07:00 AM - 10:30 AM',
        },
        paymentMethod: 'UPI',
      }),
    });
    const order1Data = await order1Res.json();
    order1Id = order1Data.data?.id;
    assert(order1Res.status === 201 && order1Id, `Order 1 placed (${order1Data.data?.orderNumber})`);

    // Consumer places Order 2
    const order2Res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${consumerToken}`,
      },
      body: JSON.stringify({
        items: [{ productId, quantity: 3 }],
        deliveryAddress: {
          name: 'Kavita Menon',
          phone: '+91 98451 44088',
          addressLine: 'Flat 304, Palm Meadows, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
          hub: 'Indiranagar',
        },
        deliverySlot: {
          name: 'Evening Slot',
          timeRange: '05:30 PM - 08:30 PM',
        },
        paymentMethod: 'CARD',
      }),
    });
    const order2Data = await order2Res.json();
    order2Id = order2Data.data?.id;
    assert(order2Res.status === 201 && order2Id, `Order 2 placed (${order2Data.data?.orderNumber})`);

    // ----------------------------------------------------
    // Create Real DeliveryBatches in PostgreSQL via Prisma
    // ----------------------------------------------------
    console.log('\nCreating Test DeliveryBatches in PostgreSQL...');

    const batch1 = await prisma.deliveryBatch.create({
      data: {
        batchCode: `BAT-HSR-${timestamp}`,
        hubArea: 'HSR Layout',
        deliverySlot: 'Morning (07:00 AM - 10:30 AM)',
        status: 'PENDING',
        riderName: 'Vikram Singh',
        riderPhone: '+91 98450 12345',
        riderVehicle: 'Ather 450X (KA-01-EV-1234)',
        estimatedDistanceKm: 6.8,
        estimatedDeliveryTime: '25 mins',
        productsSummary: 'Hydroponic Spinach (2 bunches)',
        timelineSteps: {
          create: {
            status: 'PENDING',
            label: 'Batch Formed & Hub Queued',
            isCompleted: true,
            isCurrent: true,
            timestamp: new Date(),
          },
        },
      },
    });
    batch1Id = batch1.id;

    // Associate Order 1 with Batch 1
    await prisma.order.update({
      where: { id: order1Id },
      data: { deliveryBatchId: batch1.id },
    });
    assert(Boolean(batch1Id), `Delivery Batch 1 created in PostgreSQL (${batch1.batchCode}) linked to Order 1`);

    const batch2 = await prisma.deliveryBatch.create({
      data: {
        batchCode: `BAT-IND-${timestamp}`,
        hubArea: 'Indiranagar',
        deliverySlot: 'Evening (05:30 PM - 08:30 PM)',
        status: 'PREPARING',
        riderName: 'Deepak Kumar',
        riderPhone: '+91 98450 67890',
        riderVehicle: 'Hero Vida (KA-03-EV-5678)',
        estimatedDistanceKm: 12.4,
        estimatedDeliveryTime: '35 mins',
        productsSummary: 'Hydroponic Spinach (3 bunches)',
        timelineSteps: {
          create: {
            status: 'PREPARING',
            label: 'Produce Packing & Consolidation',
            isCompleted: true,
            isCurrent: true,
            timestamp: new Date(),
          },
        },
      },
    });
    batch2Id = batch2.id;

    // Associate Order 2 with Batch 2
    await prisma.order.update({
      where: { id: order2Id },
      data: { deliveryBatchId: batch2.id },
    });
    assert(Boolean(batch2Id), `Delivery Batch 2 created in PostgreSQL (${batch2.batchCode}) linked to Order 2`);

    // ----------------------------------------------------
    // TEST 1: Admin can list delivery batches
    // ----------------------------------------------------
    console.log('\n[TEST 1] Admin can list delivery batches (GET /api/admin/deliveries)...');
    const listRes = await fetch(`${baseUrl}/api/admin/deliveries`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200, 'GET /api/admin/deliveries returned 200 OK');
    assert(listData.success === true, 'Response contains success: true');
    assert(Array.isArray(listData.data), 'Response data is an array');

    const foundBatch1 = listData.data.find((b) => b.id === batch1.id || b.batchCode === batch1.batchCode);
    assert(Boolean(foundBatch1), 'Batch 1 present in the admin list');
    assert(foundBatch1.hubArea === 'HSR Layout' || foundBatch1.hub === 'HSR Layout', 'Batch 1 hubArea matches');
    assert(foundBatch1.riderName === 'Vikram Singh', 'Rider name matches');
    assert(foundBatch1.riderVehicle.includes('Ather'), 'Rider vehicle matches');
    assert(foundBatch1.estimatedDistanceKm === 6.8, 'Estimated distance matches');
    assert(foundBatch1.estimatedDuration === '25 mins' || foundBatch1.estimatedDeliveryTime === '25 mins', 'Delivery time matches');

    // ----------------------------------------------------
    // TEST 2: Admin can view batch details
    // ----------------------------------------------------
    console.log('\n[TEST 2] Admin can view batch details (GET /api/admin/deliveries/:batchId)...');
    const detailRes = await fetch(`${baseUrl}/api/admin/deliveries/${batch1.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const detailData = await detailRes.json();
    assert(detailRes.status === 200, 'GET /api/admin/deliveries/:batchId returned 200 OK');
    assert(detailData.success === true, 'Response contains success: true');
    assert(detailData.data?.batchCode === batch1.batchCode, 'Batch code matches');
    assert(Array.isArray(detailData.data?.orders), 'Batch orders array is present');
    assert(detailData.data?.orders?.length >= 1, 'Batch contains linked orders');
    assert(detailData.data?.orders[0]?.customerName === 'Kavita Menon', 'Customer information present in linked order');
    assert(Array.isArray(detailData.data?.timeline), 'Timeline array is present');
    assert(detailData.data?.timeline?.length >= 1, 'Timeline contains initial step');

    // Non-existent batch ID
    const notFoundRes = await fetch(`${baseUrl}/api/admin/deliveries/non-existent-batch-999`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(notFoundRes.status === 404, 'Non-existent batch ID returns 404 Not Found');

    // ----------------------------------------------------
    // TEST 3 & 4 & 5: Security & Role-Based Access Control
    // ----------------------------------------------------
    console.log('\n[TEST 3, 4, 5] RBAC Security on Delivery APIs...');

    // 5. Unauthenticated rejected
    const unauthRes = await fetch(`${baseUrl}/api/admin/deliveries`);
    assert(unauthRes.status === 401, 'Unauthenticated request to GET /api/admin/deliveries is rejected (401)');

    // 3. Farmer rejected
    const farmerListRes = await fetch(`${baseUrl}/api/admin/deliveries`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert(farmerListRes.status === 403, 'Farmer request to GET /api/admin/deliveries is rejected (403 Forbidden)');

    const farmerDetailRes = await fetch(`${baseUrl}/api/admin/deliveries/${batch1.id}`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert(farmerDetailRes.status === 403, 'Farmer request to GET /api/admin/deliveries/:id is rejected (403 Forbidden)');

    const farmerPatchRes = await fetch(`${baseUrl}/api/admin/deliveries/${batch1.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({ status: 'READY' }),
    });
    assert(farmerPatchRes.status === 403, 'Farmer request to PATCH /api/admin/deliveries/:id/status is rejected (403 Forbidden)');

    // 4. Consumer rejected
    const consumerListRes = await fetch(`${baseUrl}/api/admin/deliveries`, {
      headers: { Authorization: `Bearer ${consumerToken}` },
    });
    assert(consumerListRes.status === 403, 'Consumer request to GET /api/admin/deliveries is rejected (403 Forbidden)');

    const consumerPatchRes = await fetch(`${baseUrl}/api/admin/deliveries/${batch1.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${consumerToken}`,
      },
      body: JSON.stringify({ status: 'READY' }),
    });
    assert(consumerPatchRes.status === 403, 'Consumer request to PATCH /api/admin/deliveries/:id/status is rejected (403 Forbidden)');

    // ----------------------------------------------------
    // TEST 6: Hub filter works
    // ----------------------------------------------------
    console.log('\n[TEST 6] Testing Hub filter (?hub=HSR Layout)...');
    const hubFilterRes = await fetch(`${baseUrl}/api/admin/deliveries?hub=HSR Layout`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const hubFilterData = await hubFilterRes.json();
    assert(hubFilterRes.status === 200, 'Hub filter query returned 200 OK');
    const allHsr = hubFilterData.data.every((b) => (b.hubArea || b.hub || '').toLowerCase().includes('hsr'));
    assert(allHsr && hubFilterData.data.length > 0, 'Hub filter returns exclusively HSR Layout batches');

    // ----------------------------------------------------
    // TEST 7: Slot filter works
    // ----------------------------------------------------
    console.log('\n[TEST 7] Testing Slot filter (?slot=Evening)...');
    const slotFilterRes = await fetch(`${baseUrl}/api/admin/deliveries?slot=Evening`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const slotFilterData = await slotFilterRes.json();
    assert(slotFilterRes.status === 200, 'Slot filter query returned 200 OK');
    const allEvening = slotFilterData.data.every((b) => (b.deliverySlot || '').toLowerCase().includes('evening'));
    assert(allEvening && slotFilterData.data.length > 0, 'Slot filter returns exclusively Evening batches');

    // ----------------------------------------------------
    // TEST 8: Status filter works
    // ----------------------------------------------------
    console.log('\n[TEST 8] Testing Status filter (?status=PENDING)...');
    const statusFilterRes = await fetch(`${baseUrl}/api/admin/deliveries?status=PENDING`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statusFilterData = await statusFilterRes.json();
    assert(statusFilterRes.status === 200, 'Status filter query returned 200 OK');
    const allPending = statusFilterData.data.every((b) => b.status === 'PENDING' || b.rawStatus === 'PENDING');
    assert(allPending && statusFilterData.data.length > 0, 'Status filter returns exclusively PENDING batches');

    // ----------------------------------------------------
    // TEST 9 & 13 & 14: Valid status transitions & Timeline & Order Sync
    // ----------------------------------------------------
    console.log('\n[TEST 9, 13, 14] Testing Status Lifecycle Transitions, Timeline, and Order Sync...');

    // PENDING -> PREPARING
    const prepRes = await fetch(`${baseUrl}/api/admin/deliveries/${batch1.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'PREPARING' }),
    });
    const prepData = await prepRes.json();
    assert(prepRes.status === 200 && (prepData.data?.status === 'PREPARING' || prepData.data?.rawStatus === 'PREPARING'), 'Transition PENDING -> PREPARING succeeded');

    // PREPARING -> READY
    const readyRes = await fetch(`${baseUrl}/api/admin/deliveries/${batch1.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'READY' }),
    });
    const readyData = await readyRes.json();
    assert(readyRes.status === 200 && (readyData.data?.status === 'READY' || readyData.data?.rawStatus === 'READY'), 'Transition PREPARING -> READY succeeded');

    // READY -> OUT_FOR_DELIVERY (Syncs order status)
    const outRes = await fetch(`${baseUrl}/api/admin/deliveries/${batch1.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'OUT_FOR_DELIVERY' }),
    });
    const outData = await outRes.json();
    assert(outRes.status === 200 && (outData.data?.status === 'OUT_FOR_DELIVERY' || outData.data?.rawStatus === 'OUT_FOR_DELIVERY'), 'Transition READY -> OUT_FOR_DELIVERY succeeded');

    // Verify linked order status updated to OUT_FOR_DELIVERY
    const syncedOrderOut = await prisma.order.findUnique({ where: { id: order1Id } });
    assert(syncedOrderOut.status === 'OUT_FOR_DELIVERY', 'Linked Order 1 automatically updated to OUT_FOR_DELIVERY in PostgreSQL');

    // OUT_FOR_DELIVERY -> DELIVERED
    const delivRes = await fetch(`${baseUrl}/api/admin/deliveries/${batch1.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'DELIVERED' }),
    });
    const delivData = await delivRes.json();
    assert(delivRes.status === 200 && (delivData.data?.status === 'DELIVERED' || delivData.data?.rawStatus === 'DELIVERED'), 'Transition OUT_FOR_DELIVERY -> DELIVERED succeeded');

    // Verify linked order status updated to DELIVERED and stamped
    const syncedOrderDeliv = await prisma.order.findUnique({ where: { id: order1Id } });
    assert(syncedOrderDeliv.status === 'DELIVERED', 'Linked Order 1 automatically updated to DELIVERED in PostgreSQL');
    assert(Boolean(syncedOrderDeliv.deliveredAt), 'Linked Order 1 has deliveredAt timestamp recorded');

    // ----------------------------------------------------
    // TEST 10: Invalid status rejected (400)
    // ----------------------------------------------------
    console.log('\n[TEST 10] Testing Invalid Status String...');
    const invalidStatusRes = await fetch(`${baseUrl}/api/admin/deliveries/${batch1.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'FLYING_CAR' }),
    });
    assert(invalidStatusRes.status === 400, 'Invalid status string rejected with 400 Bad Request');

    // ----------------------------------------------------
    // TEST 11: Invalid status transition rejected (400)
    // ----------------------------------------------------
    console.log('\n[TEST 11] Testing Invalid Status Transitions...');

    // Attempting backward transition on DELIVERED batch: DELIVERED -> PENDING
    const rewindRes = await fetch(`${baseUrl}/api/admin/deliveries/${batch1.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'PENDING' }),
    });
    assert(rewindRes.status === 400, 'Backward transition DELIVERED -> PENDING rejected with 400 Bad Request');

    // ----------------------------------------------------
    // TEST 12: Status persists in PostgreSQL
    // ----------------------------------------------------
    console.log('\n[TEST 12] Verifying Status Persistence in PostgreSQL...');
    const dbBatch1 = await prisma.deliveryBatch.findUnique({ where: { id: batch1.id } });
    assert(dbBatch1.status === 'DELIVERED', 'Direct database query confirms status is DELIVERED in PostgreSQL');

    // ----------------------------------------------------
    // TEST 13: Timeline remains consistent
    // ----------------------------------------------------
    console.log('\n[TEST 13] Verifying DeliveryBatchTimelineStep Consistency...');
    const dbTimeline = await prisma.deliveryBatchTimelineStep.findMany({
      where: { batchId: batch1.id },
      orderBy: { timestamp: 'asc' },
    });
    assert(dbTimeline.length >= 4, `Database records ${dbTimeline.length} progressive timeline steps`);
    const lastStep = dbTimeline[dbTimeline.length - 1];
    assert(lastStep.status === 'DELIVERED' && lastStep.isCurrent === true, 'Latest timeline step is DELIVERED and marked isCurrent = true');

    // ----------------------------------------------------
    // TEST 14: Batch Cancellation & Order Dissociation
    // ----------------------------------------------------
    console.log('\n[TEST 14] Testing Batch Cancellation on Batch 2...');
    const cancelRes = await fetch(`${baseUrl}/api/admin/deliveries/${batch2.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    const cancelData = await cancelRes.json();
    assert(cancelRes.status === 200 && (cancelData.data?.status === 'CANCELLED' || cancelData.data?.rawStatus === 'CANCELLED'), 'Pre-dispatch Batch 2 successfully CANCELLED');

    const dbBatch2 = await prisma.deliveryBatch.findUnique({ where: { id: batch2.id } });
    assert(dbBatch2.status === 'CANCELLED', 'Batch 2 persisted as CANCELLED in PostgreSQL');

    // Cannot transition cancelled batch
    const cancelToDelivered = await fetch(`${baseUrl}/api/admin/deliveries/${batch2.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'DELIVERED' }),
    });
    assert(cancelToDelivered.status === 400, 'Transition from CANCELLED to DELIVERED rejected with 400 Bad Request');

    // ----------------------------------------------------
    // TEST 15: Unauthorized IDOR protection
    // ----------------------------------------------------
    console.log('\n[TEST 15] Testing IDOR and Cross-Role Modification...');
    const idorRes = await fetch(`${baseUrl}/api/admin/deliveries/${batch2.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${consumerToken}`,
      },
      body: JSON.stringify({ status: 'PENDING' }),
    });
    assert(idorRes.status === 403, 'Consumer cannot perform status modification on arbitrary batch ID (403)');

    // ----------------------------------------------------
    // TEST 16: Sensitive credential leakage protection
    // ----------------------------------------------------
    console.log('\n[TEST 16] Auditing Zero Sensitive Data Leakage...');
    const listRaw = JSON.stringify(listData);
    const detailRaw = JSON.stringify(detailData);
    const delivRaw = JSON.stringify(delivData);

    assert(!listRaw.includes('password') && !listRaw.includes('passwordHash'), 'Zero password/passwordHash leak in GET /api/admin/deliveries');
    assert(!detailRaw.includes('password') && !detailRaw.includes('passwordHash'), 'Zero password/passwordHash leak in GET /api/admin/deliveries/:id');
    assert(!delivRaw.includes('password') && !delivRaw.includes('passwordHash'), 'Zero password/passwordHash leak in PATCH /api/admin/deliveries/:id/status');

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    console.log('\n[CLEANUP] Cleaning up test records...');
    await prisma.deliveryBatchTimelineStep.deleteMany({
      where: { batchId: { in: [batch1.id, batch2.id] } },
    });
    await prisma.orderTimelineStep.deleteMany({
      where: { orderId: { in: [order1Id, order2Id] } },
    });
    await prisma.orderItem.deleteMany({
      where: { orderId: { in: [order1Id, order2Id] } },
    });
    await prisma.sale.deleteMany({
      where: { orderId: { in: [order1Id, order2Id] } },
    });
    await prisma.order.deleteMany({
      where: { id: { in: [order1Id, order2Id] } },
    });
    await prisma.deliveryBatch.deleteMany({
      where: { id: { in: [batch1.id, batch2.id] } },
    });
    await prisma.inventoryLog.deleteMany({
      where: { inventoryItem: { productId } },
    });
    await prisma.inventoryItem.deleteMany({
      where: { productId },
    });
    await prisma.product.deleteMany({
      where: { id: productId },
    });
    await prisma.farmer.deleteMany({
      where: { id: farmerId },
    });
    await prisma.consumerAddress.deleteMany({
      where: { userId: consumerUserId },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [farmerUserId, consumerUserId] } },
    });
    console.log('   ✓ Cleanup complete.');

    console.log('\n==================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAdminDeliveriesE2ETests();
