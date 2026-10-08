/**
 * CONSUMER MODULE — STEP 5: ORDERS, ORDER HISTORY & TRACKING E2E TEST SUITE
 * 
 * Tests:
 * 1. Consumer Authentication & Isolation Setup
 * 2. Real Order Creation & Initial State
 * 3. GET /api/orders (History, Pagination, Filtering, Search, IDOR Isolation)
 * 4. GET /api/orders/:id (Sanitized Details, Timelines, IDOR Protection)
 * 5. POST /api/orders/:id/cancel (Atomic Inventory Restoration, Log Audit, Notification)
 * 6. Cancellation Edge Cases (Already cancelled, Ineligible lifecycle states: HARVESTING, DELIVERED)
 * 7. Cross-Tenant IDOR Attack Defense
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

async function runStep5Tests() {
  console.log('========================================================================');
  console.log('   STEP 5: ORDERS, ORDER HISTORY & ORDER TRACKING E2E SUITE');
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
    // SETUP: Register 2 Consumers & 1 Approved Farmer
    // ----------------------------------------------------
    console.log('--- 1. Setup Accounts & Marketplace Inventory ---');

    const consumer1Email = `c1_step5_${timestamp}@krishi.local`;
    const c1Reg = await request('POST', '/api/auth/consumer/register', {
      name: 'Priya Consumer',
      email: consumer1Email,
      phone: '+91 98888 11111',
      password: 'Password@123',
    });
    assert(c1Reg.status === 201 && c1Reg.body.data.token, 'Consumer 1 registered successfully');
    const tokenC1 = c1Reg.body.data.token;
    const consumer1Id = c1Reg.body.data.user.id;

    const consumer2Email = `c2_step5_${timestamp}@krishi.local`;
    const c2Reg = await request('POST', '/api/auth/consumer/register', {
      name: 'Rohan Consumer',
      email: consumer2Email,
      phone: '+91 98888 22222',
      password: 'Password@123',
    });
    assert(c2Reg.status === 201 && c2Reg.body.data.token, 'Consumer 2 registered successfully');
    const tokenC2 = c2Reg.body.data.token;

    // Login Admin to approve farmer
    const adminLogin = await request('POST', '/api/auth/admin/login', {
      email: 'admin@krishimarket.in',
      password: 'admin123',
    });
    assert(adminLogin.status === 200 && adminLogin.body.data.token, 'Admin logged in');
    const adminToken = adminLogin.body.data.token;

    // Register a new farmer
    const farmerEmail = `farmer_step5_${timestamp}@krishi.local`;
    const farmerReg = await request('POST', '/api/auth/farmer/register', {
      fullName: 'Gowda Farmer',
      email: farmerEmail,
      phone: `+91 9666${String(timestamp).slice(-6)}`,
      password: 'FarmerPassword@123',
      farmName: 'Gowda Natural Farms',
      farmLocation: 'Kolar Organic Cluster',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '562114',
      hub: 'East Hub',
    });
    assert(farmerReg.status === 201 && farmerReg.body.data.token, 'Farmer registered');
    let farmerToken = farmerReg.body.data.token;
    const farmerId = farmerReg.body.data.farmer ? farmerReg.body.data.farmer.id : farmerReg.body.data.user?.farmerId;

    // Approve the farmer via Admin endpoint
    const approveRes = await request('POST', `/api/admin/farmers/${farmerId}/approve`, {}, adminToken);
    assert(approveRes.status === 200, 'Admin approved farmer application');

    // Re-login farmer to refresh session token
    const farmerLogin = await request('POST', '/api/auth/farmer/login', {
      email: farmerEmail,
      password: 'FarmerPassword@123',
    });
    assert(farmerLogin.status === 200 && farmerLogin.body.data.token, 'Approved farmer logged in');
    farmerToken = farmerLogin.body.data.token;

    // Create a product for this farmer so we can manage status transitions
    const newProdRes = await request('POST', '/api/farmer/products', {
      name: `Step5 Farm Fresh Spinach ${timestamp}`,
      category: 'LEAFY_GREENS',
      description: 'Organic fresh spinach',
      price: 45,
      unit: 'bunch',
      availableQuantity: 100,
      stock: 100,
      threshold: 10,
      farmingMethod: 'ORGANIC',
      isOrganic: true,
      shelfLifeDays: 3,
      harvestDate: new Date().toISOString(),
    }, farmerToken);
    assert(newProdRes.status === 201 && newProdRes.body.data.id, 'Farmer created test produce');
    const product1 = newProdRes.body.data;

    // Fetch public product catalog
    const prodRes = await request('GET', '/api/products?limit=10');
    assert(prodRes.status === 200 && prodRes.body.data.length > 0, 'Public products catalog retrieved');
    const product2 = prodRes.body.data.find((p) => p.id !== product1.id) || product1;

    const initialStockP1 = Number(product1.availableQuantity);
    console.log(`Product 1 ("${product1.name}") initial available stock: ${initialStockP1}`);

    // Create delivery address for Consumer 1
    const addrRes = await request('POST', '/api/consumer/addresses', {
      name: 'Priya Consumer',
      phone: '+91 98888 11111',
      addressLine: 'Flat 402, Green Meadows',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560102',
      hub: 'East Hub',
      isDefault: true,
    }, tokenC1);
    assert(addrRes.status === 201 && addrRes.body.data.id, 'Delivery address created for Consumer 1');
    const addressId1 = addrRes.body.data.id;

    // ----------------------------------------------------
    // TEST SECTION 2: Order Creation for History & Tracking
    // ----------------------------------------------------
    console.log('\n--- 2. Create Orders for Testing ---');

    // Create Order 1 for Consumer 1 (Qty: 2)
    const order1Res = await request('POST', '/api/orders', {
      addressId: addressId1,
      items: [{ productId: product1.id, quantity: 2 }],
      deliverySlot: { slotName: 'Morning Harvest', slotRange: '8:00 AM – 11:00 AM' },
      paymentMethod: 'UPI',
    }, tokenC1);
    assert(order1Res.status === 201 && order1Res.body.data.orderNumber, 'Order 1 created for Consumer 1');
    const order1 = order1Res.body.data;
    const order1Number = order1.orderNumber;
    const order1RawId = order1.rawId;

    // Create Order 2 for Consumer 1 (Qty: 3)
    const order2Res = await request('POST', '/api/orders', {
      addressId: addressId1,
      items: [{ productId: product1.id, quantity: 3 }],
      deliverySlot: { slotName: 'Evening Harvest', slotRange: '4:00 PM – 7:00 PM' },
      paymentMethod: 'Cash on Delivery',
    }, tokenC1);
    assert(order2Res.status === 201 && order2Res.body.data.orderNumber, 'Order 2 created for Consumer 1');
    const order2 = order2Res.body.data;

    // Create Order 3 for Consumer 2 (Qty: 1)
    const order3Res = await request('POST', '/api/orders', {
      deliveryAddress: {
        name: 'Rohan Consumer',
        phone: '+91 98888 22222',
        addressLine: 'Villa 12, Palm Residency',
        city: 'Bengaluru',
        pincode: '560034',
        hub: 'East Hub',
      },
      items: [{ productId: product1.id, quantity: 1 }],
      deliverySlot: { slotName: 'Morning Harvest', slotRange: '8:00 AM – 11:00 AM' },
      paymentMethod: 'UPI',
    }, tokenC2);
    assert(order3Res.status === 201 && order3Res.body.data.orderNumber, 'Order 3 created for Consumer 2');
    const order3 = order3Res.body.data;

    // ----------------------------------------------------
    // TEST SECTION 3: GET /api/orders (History, Filter, Search, Pagination)
    // ----------------------------------------------------
    console.log('\n--- 3. GET /api/orders History & Query Capabilities ---');

    // Test: Consumer 1 views order history
    const c1History = await request('GET', '/api/orders', null, tokenC1);
    assert(c1History.status === 200, 'Consumer 1 fetched order history');
    assert(c1History.body.data.length >= 2, 'Consumer 1 sees at least 2 orders');
    assert(
      c1History.body.data.every((o) => o.customerId === consumer1Id || o.rawId === order1RawId || o.rawId === order2.rawId),
      'IDOR Protection: Consumer 1 only sees their own orders'
    );
    assert(
      !c1History.body.data.some((o) => o.orderNumber === order3.orderNumber),
      'IDOR Protection: Consumer 1 does NOT see Consumer 2 orders'
    );

    // Test: Consumer 2 views order history
    const c2History = await request('GET', '/api/orders', null, tokenC2);
    assert(c2History.status === 200, 'Consumer 2 fetched order history');
    assert(
      c2History.body.data.length === 1 && c2History.body.data[0].orderNumber === order3.orderNumber,
      'Consumer 2 sees exactly their 1 order'
    );

    // Test: Pagination (page=1, limit=1)
    const paginatedRes = await request('GET', '/api/orders?page=1&limit=1', null, tokenC1);
    assert(paginatedRes.status === 200, 'Paginated orders request succeeded');
    assert(paginatedRes.body.data.length === 1, 'Limit parameter respected (1 item returned)');
    assert(paginatedRes.body.pagination && paginatedRes.body.pagination.page === 1, 'Pagination metadata page is 1');
    assert(paginatedRes.body.pagination.totalPages >= 2, 'Pagination totalPages >= 2');
    assert(paginatedRes.body.pagination.hasMore === true, 'Pagination hasMore is true');

    // Test: Search by orderNumber
    const searchRes = await request('GET', `/api/orders?search=${encodeURIComponent(order1Number)}`, null, tokenC1);
    assert(searchRes.status === 200, 'Search by orderNumber succeeded');
    assert(
      searchRes.body.data.length === 1 && searchRes.body.data[0].orderNumber === order1Number,
      'Search returned precisely matching order'
    );

    // Test: Search with non-existent order number
    const emptySearchRes = await request('GET', '/api/orders?search=KM-99999999-0000', null, tokenC1);
    assert(emptySearchRes.status === 200 && emptySearchRes.body.data.length === 0, 'Non-existent search returns 0 results');

    // Test: Status Filter "active"
    const activeFilterRes = await request('GET', '/api/orders?status=active', null, tokenC1);
    assert(activeFilterRes.status === 200, 'Status filter "active" succeeded');
    assert(
      activeFilterRes.body.data.every((o) => ['placed', 'confirmed', 'harvesting', 'packed', 'out_for_delivery'].includes(o.status)),
      'All returned orders in "active" filter are non-terminal active orders'
    );

    // Test: Status Filter "completed"
    const completedFilterRes = await request('GET', '/api/orders?status=completed', null, tokenC1);
    assert(completedFilterRes.status === 200 && completedFilterRes.body.data.length === 0, 'No completed orders yet');

    // ----------------------------------------------------
    // TEST SECTION 4: GET /api/orders/:orderId Details & Security
    // ----------------------------------------------------
    console.log('\n--- 4. GET /api/orders/:orderId Details & Tenant Security ---');

    // Fetch by orderNumber
    const singleByNumber = await request('GET', `/api/orders/${order1Number}`, null, tokenC1);
    assert(singleByNumber.status === 200, 'Fetched order by orderNumber');
    assert(singleByNumber.body.data.orderNumber === order1Number, 'Returned order number matches');
    assert(Array.isArray(singleByNumber.body.data.items) && singleByNumber.body.data.items.length === 1, 'Items array populated');
    assert(singleByNumber.body.data.items[0].productName, 'Product name populated in snapshot');
    assert(singleByNumber.body.data.deliveryAddress.addressLine, 'Delivery address line populated');
    assert(Array.isArray(singleByNumber.body.data.timeline) && singleByNumber.body.data.timeline.length >= 1, 'Timeline steps present');
    assert(singleByNumber.body.data.timeline[0].status === 'placed', 'Initial timeline step is placed');

    // Fetch by UUID rawId
    const singleByRawId = await request('GET', `/api/orders/${order1RawId}`, null, tokenC1);
    assert(singleByRawId.status === 200 && singleByRawId.body.data.rawId === order1RawId, 'Fetched order by UUID rawId');

    // Security: Unauthenticated request rejected
    const unauthSingle = await request('GET', `/api/orders/${order1Number}`);
    assert(unauthSingle.status === 401, 'Unauthenticated order detail request rejected with 401');

    // Security IDOR: Consumer 2 attempts to fetch Consumer 1 order
    const idorSingle = await request('GET', `/api/orders/${order1Number}`, null, tokenC2);
    assert(idorSingle.status === 404 || idorSingle.status === 403, 'Cross-tenant IDOR read attempt blocked with 404/403');

    // Non-existent order
    const notFoundSingle = await request('GET', '/api/orders/KM-00000000-9999', null, tokenC1);
    assert(notFoundSingle.status === 404, 'Non-existent order returns 404');

    // ----------------------------------------------------
    // TEST SECTION 5: POST /api/orders/:orderId/cancel & Stock Restoration
    // ----------------------------------------------------
    console.log('\n--- 5. POST /api/orders/:id/cancel & Atomic Stock Restoration ---');

    // Check stock before cancellation of Order 1 (which reserved 2 units of product1)
    const freshProdBefore = await request('GET', `/api/products/${product1.id}`);
    const availBeforeCancel = Number(freshProdBefore.body.data.availableQuantity);
    console.log(`Stock before cancelling Order 1 (reserved 2 units): ${availBeforeCancel}`);

    // Consumer 1 cancels Order 1
    const cancelRes = await request('POST', `/api/orders/${order1Number}/cancel`, {
      reason: 'Need to change delivery location',
    }, tokenC1);
    assert(cancelRes.status === 200, 'Order 1 cancelled successfully');
    assert(cancelRes.body.data.status === 'cancelled', 'Order status updated to "cancelled"');

    // Verify stock restored
    const freshProdAfter = await request('GET', `/api/products/${product1.id}`);
    const availAfterCancel = Number(freshProdAfter.body.data.availableQuantity);
    console.log(`Stock after cancelling Order 1: ${availAfterCancel}`);
    assert(
      availAfterCancel === availBeforeCancel + 2,
      'Product available quantity was atomically incremented by exactly 2 units'
    );

    // Verify timeline includes CANCELLED step
    const checkCancelledOrder = await request('GET', `/api/orders/${order1Number}`, null, tokenC1);
    assert(checkCancelledOrder.status === 200, 'Fetched cancelled order details');
    const timeline = checkCancelledOrder.body.data.timeline;
    const cancelStep = timeline.find((s) => s.status === 'cancelled');
    assert(cancelStep && cancelStep.isCurrent === true, 'Timeline contains CANCELLED step marked current');
    assert(cancelStep.description.includes('Need to change delivery location'), 'Cancellation reason recorded in timeline description');

    // ----------------------------------------------------
    // TEST SECTION 6: Cancellation Invariant & Edge Cases
    // ----------------------------------------------------
    console.log('\n--- 6. Cancellation Invariants & Lifecycle Edge Cases ---');

    // 1. Attempting to cancel already cancelled order (Idempotent rejection)
    const cancelAgain = await request('POST', `/api/orders/${order1Number}/cancel`, {
      reason: 'Cancelling again',
    }, tokenC1);
    assert(cancelAgain.status === 400, 'Attempting to cancel an already cancelled order rejected with 400');
    assert(
      cancelAgain.body.error && cancelAgain.body.error.includes('already cancelled'),
      'Clear error message for already cancelled order'
    );

    // 2. IDOR: Consumer 2 attempts to cancel Consumer 1's order
    const idorCancel = await request('POST', `/api/orders/${order2.orderNumber}/cancel`, {
      reason: 'Malicious cancellation',
    }, tokenC2);
    assert(idorCancel.status === 403 || idorCancel.status === 404, 'Cross-tenant order cancellation blocked with 403/404');

    // 3. Progress Order 2 to HARVESTING via farmer status update, then test cancellation rejection
    // Farmer updates Order 2 -> CONFIRMED -> HARVESTING
    await request('PATCH', `/api/farmer/orders/${order2.orderNumber}/status`, { status: 'CONFIRMED' }, farmerToken);
    const farmHarvestUpdate = await request(
      'PATCH',
      `/api/farmer/orders/${order2.orderNumber}/status`,
      { status: 'HARVESTING' },
      farmerToken
    );
    assert(farmHarvestUpdate.status === 200, 'Farmer advanced Order 2 to HARVESTING');

    // Consumer 1 now attempts to cancel Order 2 (which is in HARVESTING stage)
    const cancelHarvestingOrder = await request('POST', `/api/orders/${order2.orderNumber}/cancel`, {
      reason: 'Too late cancellation',
    }, tokenC1);
    assert(
      cancelHarvestingOrder.status === 400,
      'Cancellation of order in HARVESTING stage rejected with 400'
    );
    assert(
      cancelHarvestingOrder.body.error && cancelHarvestingOrder.body.error.includes('cannot be cancelled'),
      'Informative rejection message returned for in-progress harvest'
    );

    // 4. Progress Order 2 to DELIVERED, then test cancellation rejection
    await request('PATCH', `/api/farmer/orders/${order2.orderNumber}/status`, { status: 'PACKED' }, farmerToken);
    await request('PATCH', `/api/farmer/orders/${order2.orderNumber}/status`, { status: 'OUT_FOR_DELIVERY' }, farmerToken);
    const deliveredRes = await request(
      'PATCH',
      `/api/farmer/orders/${order2.orderNumber}/status`,
      { status: 'DELIVERED' },
      farmerToken
    );
    assert(deliveredRes.status === 200, 'Order 2 reached DELIVERED terminal status');

    const cancelDeliveredOrder = await request('POST', `/api/orders/${order2.orderNumber}/cancel`, {
      reason: 'Cancel delivered',
    }, tokenC1);
    assert(
      cancelDeliveredOrder.status === 400,
      'Cancellation of DELIVERED order rejected with 400'
    );

    // ----------------------------------------------------
    // TEST SECTION 7: Status Filter Synchronization
    // ----------------------------------------------------
    console.log('\n--- 7. Status Filter Verification After Updates ---');

    // Check "cancelled" filter
    const cancelledFilter = await request('GET', '/api/orders?status=cancelled', null, tokenC1);
    assert(cancelledFilter.status === 200, 'Fetched cancelled orders list');
    assert(
      cancelledFilter.body.data.some((o) => o.orderNumber === order1Number),
      'Cancelled filter includes Order 1'
    );

    // Check "completed" filter
    const completedFilter = await request('GET', '/api/orders?status=completed', null, tokenC1);
    assert(completedFilter.status === 200, 'Fetched completed orders list');
    assert(
      completedFilter.body.data.some((o) => o.orderNumber === order2.orderNumber),
      'Completed filter includes Order 2 (DELIVERED)'
    );

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

runStep5Tests();
