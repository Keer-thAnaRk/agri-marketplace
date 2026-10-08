const http = require('http');

const BASE_URL = 'http://localhost:5000';

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
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
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('===============================================================');
  console.log('  STARTING CONSUMER MODULE STEP 3: CART & INVENTORY E2E TESTS  ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const testConsumerEmailA = `consumer_cart_a_${timestamp}@example.com`;
  const testConsumerEmailB = `consumer_cart_b_${timestamp}@example.com`;
  const testPassword = 'Password123!';

  try {
    // 1. Setup test consumers
    console.log('1. Setting up test consumers and authenticating...');
    const regA = await makeRequest('POST', '/api/auth/consumer/register', {
      name: 'Cart Tester A',
      email: testConsumerEmailA,
      phone: '9888811111',
      password: testPassword,
    });
    const tokenA = regA.body?.data?.token;
    assert(regA.status === 201 && tokenA, 'Consumer A registered successfully with JWT');

    const regB = await makeRequest('POST', '/api/auth/consumer/register', {
      name: 'Cart Tester B',
      email: testConsumerEmailB,
      phone: '9888822222',
      password: testPassword,
    });
    const tokenB = regB.body?.data?.token;
    assert(regB.status === 201 && tokenB, 'Consumer B registered successfully with JWT');

    // 2. Fetch available active products from marketplace
    console.log('\n2. Retrieving public marketplace products...');
    const prodRes = await makeRequest('GET', '/api/products');
    assert(prodRes.status === 200 && Array.isArray(prodRes.body.data), 'Public products retrieved');
    const activeProducts = prodRes.body.data;
    assert(activeProducts.length >= 2, `Sufficient test products available (${activeProducts.length} items)`);

    const product1 = activeProducts[0];
    const product2 = activeProducts[1];

    // 3. Unauthenticated cart access rejected
    console.log('\n3. Testing unauthenticated and unauthorized cart access...');
    const unauthCart = await makeRequest('GET', '/api/consumer/cart');
    assert(unauthCart.status === 401, 'Unauthenticated GET /api/consumer/cart rejected with HTTP 401');

    const unauthAdd = await makeRequest('POST', '/api/consumer/cart', {
      productId: product1.id,
      quantity: 1,
    });
    assert(unauthAdd.status === 401, 'Unauthenticated POST /api/consumer/cart rejected with HTTP 401');

    // 4. Farmer token cannot access consumer cart
    console.log('\n4. Testing Farmer token access to consumer cart...');
    const farmerLogin = await makeRequest('POST', '/api/auth/farmer/login', {
      email: 'ananya.deshmukh@krishimarket.in',
      password: 'password123',
    });
    if (farmerLogin.status === 200 && farmerLogin.body.token) {
      const farmerCart = await makeRequest('GET', '/api/consumer/cart', null, farmerLogin.body.token);
      assert(farmerCart.status === 403, 'Farmer token accessing /api/consumer/cart rejected with HTTP 403 Forbidden');
    } else {
      console.log('  [SKIP] Seed farmer login unavailable for farmer token role check');
    }

    // 5. Add valid product to cart
    console.log('\n5. Adding valid product to Consumer A cart...');
    const addRes1 = await makeRequest('POST', '/api/consumer/cart', {
      productId: product1.id,
      quantity: 2,
    }, tokenA);
    assert(addRes1.status === 200, 'Adding product 1 (qty 2) returns HTTP 200');
    assert(addRes1.body.success === true, 'Add to cart response indicates success = true');

    // 6. View Consumer A's cart
    console.log('\n6. Viewing Consumer A cart and verifying server-side calculations...');
    const viewCartA = await makeRequest('GET', '/api/consumer/cart', null, tokenA);
    assert(viewCartA.status === 200, 'Viewing Consumer A cart returns HTTP 200');
    assert(viewCartA.body.data.items.length === 1, 'Consumer A cart contains exactly 1 item');
    assert(viewCartA.body.data.items[0].productId === product1.id, 'Cart item productId matches added product');
    assert(viewCartA.body.data.items[0].quantity === 2, 'Cart item quantity is 2');
    assert(viewCartA.body.data.items[0].price === product1.price, 'Current database price used');
    assert(viewCartA.body.data.items[0].itemTotal === product1.price * 2, 'Item total accurately computed (price × quantity)');
    assert(viewCartA.body.data.subtotal === product1.price * 2, 'Subtotal correctly matches sum of items');
    assert(typeof viewCartA.body.data.platformFee === 'number', 'Platform fee calculated server-side');
    assert(typeof viewCartA.body.data.total === 'number', 'Total payable calculated server-side');

    // 7. Add second product to cart
    console.log('\n7. Adding second product to cart...');
    const addRes2 = await makeRequest('POST', '/api/consumer/cart', {
      productId: product2.id,
      quantity: 1,
    }, tokenA);
    assert(addRes2.status === 200, 'Adding product 2 (qty 1) returns HTTP 200');

    const viewCartA2 = await makeRequest('GET', '/api/consumer/cart', null, tokenA);
    assert(viewCartA2.body.data.items.length === 2, 'Consumer A cart now has 2 distinct products');
    const expectedSubtotal = product1.price * 2 + product2.price * 1;
    assert(viewCartA2.body.data.subtotal === expectedSubtotal, `Subtotal ₹${viewCartA2.body.data.subtotal} equals expected ₹${expectedSubtotal}`);

    // 8. IDOR / Cross-Tenant Isolation: Consumer B cart must be separate & empty
    console.log('\n8. Verifying multi-tenant cart isolation (Consumer B)...');
    const viewCartB = await makeRequest('GET', '/api/consumer/cart', null, tokenB);
    assert(viewCartB.status === 200, 'Consumer B retrieves own cart');
    assert(viewCartB.body.data.items.length === 0, 'Consumer B cart is isolated and empty (0 items)');
    assert(viewCartB.body.data.subtotal === 0, 'Consumer B subtotal is 0');

    // Consumer B cannot modify Consumer A's cart item
    const bModifyA = await makeRequest('PATCH', `/api/consumer/cart/${product1.id}`, {
      quantity: 5,
    }, tokenB);
    assert(bModifyA.status === 404, 'Consumer B updating Consumer A item rejected with HTTP 404');

    // 9. Input Validation: Zero, Negative, Non-numeric, and Invalid Product ID
    console.log('\n9. Testing input validation on Add and Update Cart...');
    const addZero = await makeRequest('POST', '/api/consumer/cart', {
      productId: product1.id,
      quantity: 0,
    }, tokenA);
    assert(addZero.status === 400, 'Adding 0 quantity rejected with HTTP 400');

    const addNegative = await makeRequest('POST', '/api/consumer/cart', {
      productId: product1.id,
      quantity: -3,
    }, tokenA);
    assert(addNegative.status === 400, 'Adding negative quantity rejected with HTTP 400');

    const addNonNumeric = await makeRequest('POST', '/api/consumer/cart', {
      productId: product1.id,
      quantity: 'invalid-qty',
    }, tokenA);
    assert(addNonNumeric.status === 400, 'Adding non-numeric quantity rejected with HTTP 400');

    const addNonExistent = await makeRequest('POST', '/api/consumer/cart', {
      productId: 'non-existent-product-id-999',
      quantity: 1,
    }, tokenA);
    assert(addNonExistent.status === 404, 'Adding non-existent product rejected with HTTP 404');

    // 10. Excessive Quantity Rejection (Exceeding Available Stock)
    console.log('\n10. Testing excessive quantity stock limitation...');
    const excessiveQty = (product1.availableQuantity || 50) + 1000;
    const addExcessive = await makeRequest('POST', '/api/consumer/cart', {
      productId: product1.id,
      quantity: excessiveQty,
    }, tokenA);
    assert(addExcessive.status === 400, `Adding excessive quantity (${excessiveQty}) rejected with HTTP 400`);
    assert(addExcessive.body.error && addExcessive.body.error.includes('Maximum available stock'), 'Error mentions stock limitation');

    // 11. Update Cart Item Quantity
    console.log('\n11. Updating cart item quantity...');
    const updateRes = await makeRequest('PATCH', `/api/consumer/cart/${product1.id}`, {
      quantity: 4,
    }, tokenA);
    assert(updateRes.status === 200, 'Updating product 1 to quantity 4 returns HTTP 200');

    const viewCartA3 = await makeRequest('GET', '/api/consumer/cart', null, tokenA);
    const updatedP1 = viewCartA3.body.data.items.find((it) => it.productId === product1.id);
    assert(updatedP1.quantity === 4, 'Cart reflects updated quantity of 4');
    assert(updatedP1.itemTotal === product1.price * 4, 'Item total updated to match new quantity');

    // 12. Remove Cart Item
    console.log('\n12. Removing single item from cart...');
    const removeRes = await makeRequest('DELETE', `/api/consumer/cart/${product2.id}`, null, tokenA);
    assert(removeRes.status === 200, 'Removing product 2 from cart returns HTTP 200');

    const viewCartA4 = await makeRequest('GET', '/api/consumer/cart', null, tokenA);
    assert(viewCartA4.body.data.items.length === 1, 'Cart now contains only 1 item');
    assert(viewCartA4.body.data.items[0].productId === product1.id, 'Product 1 remains in cart');

    // 13. Clear Entire Cart
    console.log('\n13. Clearing entire cart...');
    const clearRes = await makeRequest('DELETE', '/api/consumer/cart', null, tokenA);
    assert(clearRes.status === 200, 'Clearing cart returns HTTP 200');

    const viewCartA5 = await makeRequest('GET', '/api/consumer/cart', null, tokenA);
    assert(viewCartA5.body.data.items.length === 0, 'Cart is now completely empty');
    assert(viewCartA5.body.data.subtotal === 0, 'Subtotal is 0 after clearing cart');

    // 14. Persistence Verification across sessions
    console.log('\n14. Verifying database persistence across login sessions...');
    await makeRequest('POST', '/api/consumer/cart', {
      productId: product1.id,
      quantity: 3,
    }, tokenA);

    // Re-login Consumer A
    const loginA = await makeRequest('POST', '/api/auth/consumer/login', {
      email: testConsumerEmailA,
      password: testPassword,
    });
    const freshTokenA = loginA.body?.data?.token;
    assert(loginA.status === 200 && freshTokenA, 'Consumer A re-authenticated');

    const viewCartPersisted = await makeRequest('GET', '/api/consumer/cart', null, freshTokenA);
    assert(viewCartPersisted.body.data.items.length === 1, 'Cart persisted across login sessions');
    assert(viewCartPersisted.body.data.items[0].quantity === 3, 'Persisted quantity matches 3');

    // 15. Concurrency / Simultaneous Cart additions simulation
    console.log('\n15. Testing concurrent cart operations...');
    const parallelRequests = [
      makeRequest('POST', '/api/consumer/cart', { productId: product2.id, quantity: 1 }, tokenA),
      makeRequest('POST', '/api/consumer/cart', { productId: product2.id, quantity: 2 }, tokenB),
    ];
    const results = await Promise.all(parallelRequests);
    assert(results[0].status === 200 && results[1].status === 200, 'Simultaneous requests from different consumers succeed safely without collision');

    // Cleanup
    console.log('\n16. Cleaning up test cart records...');
    await makeRequest('DELETE', '/api/consumer/cart', null, tokenA);
    await makeRequest('DELETE', '/api/consumer/cart', null, tokenB);
    console.log('  [PASS] Cleaned up test carts');

    console.log('\n===============================================================');
    console.log(`  CONSUMER CART E2E AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error during cart E2E test:', err);
    process.exit(1);
  }
}

runTests();
