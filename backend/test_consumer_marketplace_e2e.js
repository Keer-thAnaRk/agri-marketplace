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
  console.log('  STARTING CONSUMER MODULE STEP 2: MARKETPLACE E2E AUDIT TEST  ');
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

  try {
    // 1. Health check
    console.log('Test 1: Verifying backend service health...');
    const health = await makeRequest('GET', '/api/health');
    assert(health.status === 200, 'Health check returns 200 OK');
    assert(health.body.status === 'ok', 'Health status is "ok"');

    // 2. Public product catalog (GET /api/products)
    console.log('\nTest 2: Verifying public product catalog (GET /api/products)...');
    const prodRes = await makeRequest('GET', '/api/products');
    assert(prodRes.status === 200, 'Public products endpoint returns 200 OK');
    assert(prodRes.body.success === true, 'Response indicates success = true');
    assert(Array.isArray(prodRes.body.data), 'Returns an array of products');
    assert(prodRes.body.data.length > 0, `Products found in catalog (${prodRes.body.data.length} items)`);
    assert(prodRes.body.pagination && typeof prodRes.body.pagination.total === 'number', 'Pagination metadata is present');

    const sampleProduct = prodRes.body.data[0];
    assert(sampleProduct.id && sampleProduct.name, 'Product has valid id and name');
    assert(typeof sampleProduct.price === 'number', 'Product price is formatted as a number');
    assert(typeof sampleProduct.freshnessScore === 'number', 'Product freshness score is calculated as a number');
    assert(sampleProduct.freshnessStatus && sampleProduct.freshnessLabel, 'Product has freshness status and label');
    assert(sampleProduct.farmerName && sampleProduct.farmName, 'Product has cultivator and farm name attribution');

    // Check sensitive data absence
    assert(!sampleProduct.password && !sampleProduct.passwordHash, 'Zero password fields leaked in product data');
    assert(!sampleProduct.bankDetails && !sampleProduct.farmerDocuments, 'Zero bank/document fields leaked');

    // 3. Category filtering
    console.log('\nTest 3: Verifying category filter (GET /api/products?category=VEGETABLES)...');
    const vegRes = await makeRequest('GET', '/api/products?category=VEGETABLES');
    assert(vegRes.status === 200, 'Category filter returns 200 OK');
    assert(vegRes.body.success === true, 'Category filter success = true');
    const allVeg = vegRes.body.data.every((p) => p.category === 'VEGETABLES' || p.category === 'Vegetables');
    assert(allVeg, 'All returned items belong strictly to requested category');

    // 4. Farming method filtering
    console.log('\nTest 4: Verifying farming method filter (GET /api/products?farmingMethod=ORGANIC)...');
    const orgRes = await makeRequest('GET', '/api/products?farmingMethod=ORGANIC');
    assert(orgRes.status === 200, 'Farming method filter returns 200 OK');
    assert(orgRes.body.success === true, 'Farming method filter success = true');
    const allOrg = orgRes.body.data.every((p) => p.farmingMethod === 'ORGANIC' || p.farmingMethod === 'Organic');
    assert(allOrg, 'All returned items match requested farming method');

    // 5. Price range filtering
    console.log('\nTest 5: Verifying price range filter (GET /api/products?minPrice=20&maxPrice=120)...');
    const priceRes = await makeRequest('GET', '/api/products?minPrice=20&maxPrice=120');
    assert(priceRes.status === 200, 'Price range filter returns 200 OK');
    assert(priceRes.body.success === true, 'Price range filter success = true');
    const allInRange = priceRes.body.data.every((p) => p.price >= 20 && p.price <= 120);
    assert(allInRange, 'All returned items are within ₹20 - ₹120 range');

    // 6. Sorting
    console.log('\nTest 6: Verifying sorting options...');
    const ascRes = await makeRequest('GET', '/api/products?sortBy=price_low');
    assert(ascRes.status === 200, 'sortBy=price_low returns 200 OK');
    let isAsc = true;
    for (let i = 1; i < ascRes.body.data.length; i++) {
      if (ascRes.body.data[i].price < ascRes.body.data[i - 1].price) isAsc = false;
    }
    assert(isAsc, 'Products sorted in ascending price order');

    const descRes = await makeRequest('GET', '/api/products?sortBy=price_high');
    assert(descRes.status === 200, 'sortBy=price_high returns 200 OK');
    let isDesc = true;
    for (let i = 1; i < descRes.body.data.length; i++) {
      if (descRes.body.data[i].price > descRes.body.data[i - 1].price) isDesc = false;
    }
    assert(isDesc, 'Products sorted in descending price order');

    // 7. Search query
    console.log('\nTest 7: Verifying text search query...');
    const queryTerm = sampleProduct.name.slice(0, 4);
    const searchRes = await makeRequest('GET', `/api/products?search=${encodeURIComponent(queryTerm)}`);
    assert(searchRes.status === 200, 'Search query returns 200 OK');
    assert(searchRes.body.data.length > 0, `Search for "${queryTerm}" returned matching results`);

    // 8. Pagination
    console.log('\nTest 8: Verifying pagination metadata and limits...');
    const paginatedRes = await makeRequest('GET', '/api/products?page=1&limit=2');
    assert(paginatedRes.status === 200, 'Pagination request returns 200 OK');
    assert(paginatedRes.body.data.length <= 2, 'Limit 2 strictly respected');
    assert(paginatedRes.body.pagination.page === 1, 'Pagination page = 1');
    assert(paginatedRes.body.pagination.limit === 2, 'Pagination limit = 2');

    // 9. Single product details (GET /api/products/:id)
    console.log('\nTest 9: Verifying single product detail (GET /api/products/:id)...');
    const detailRes = await makeRequest('GET', `/api/products/${sampleProduct.id}`);
    assert(detailRes.status === 200, 'Single product details returns 200 OK');
    assert(detailRes.body.success === true, 'Single product detail success = true');
    assert(detailRes.body.data.id === sampleProduct.id, 'Returned product matches requested ID');
    assert(detailRes.body.data.farmer && detailRes.body.data.farmer.id, 'Farmer profile is nested with cultivator details');
    assert(typeof detailRes.body.data.daysRemaining === 'number' || typeof detailRes.body.data.freshnessScore === 'number', 'Freshness indicators computed');

    // 10. Single product 404 for non-existent ID
    console.log('\nTest 10: Verifying 404 for non-existent product ID...');
    const notFoundRes = await makeRequest('GET', '/api/products/non-existent-product-id-99999');
    assert(notFoundRes.status === 404, 'Non-existent product returns HTTP 404');
    assert(notFoundRes.body.success === false, 'Error response contains success = false');

    // 11. Public farmers directory (GET /api/farmers)
    console.log('\nTest 11: Verifying public farmers directory (GET /api/farmers)...');
    const farmersRes = await makeRequest('GET', '/api/farmers');
    assert(farmersRes.status === 200, 'Farmers directory returns 200 OK');
    assert(farmersRes.body.success === true, 'Farmers directory success = true');
    assert(Array.isArray(farmersRes.body.data), 'Returns an array of farmers');
    assert(farmersRes.body.data.length > 0, `Verified farmers found in directory (${farmersRes.body.data.length} farmers)`);

    const sampleFarmer = farmersRes.body.data[0];
    assert(sampleFarmer.id && sampleFarmer.name && sampleFarmer.farmName, 'Farmer has valid id, name, and farmName');
    assert(sampleFarmer.isVerified === true, 'Farmer is strictly verified');
    assert(!sampleFarmer.password && !sampleFarmer.passwordHash, 'Farmer profile excludes sensitive credentials');
    assert(!sampleFarmer.bankDetails && !sampleFarmer.aadhaarNumber, 'Farmer profile excludes bank / private KYC data');

    // 12. Single farmer profile (GET /api/farmers/:id)
    console.log('\nTest 12: Verifying single farmer profile (GET /api/farmers/:id)...');
    const farmerDetailRes = await makeRequest('GET', `/api/farmers/${sampleFarmer.id}`);
    assert(farmerDetailRes.status === 200, 'Single farmer profile returns 200 OK');
    assert(farmerDetailRes.body.success === true, 'Farmer detail success = true');
    assert(farmerDetailRes.body.data.id === sampleFarmer.id, 'Returned farmer matches requested ID');
    assert(Array.isArray(farmerDetailRes.body.data.products), 'Farmer profile includes active products list');

    // 13. Single farmer 404 for non-existent ID
    console.log('\nTest 13: Verifying 404 for non-existent farmer ID...');
    const farmerNotFoundRes = await makeRequest('GET', '/api/farmers/non-existent-farmer-id-99999');
    assert(farmerNotFoundRes.status === 404, 'Non-existent farmer returns HTTP 404');
    assert(farmerNotFoundRes.body.success === false, 'Farmer error response contains success = false');

    // 14. Farmer search and farming method filter
    console.log('\nTest 14: Verifying farmer filtering by method and search...');
    const farmerOrgRes = await makeRequest('GET', '/api/farmers?farmingMethod=ORGANIC');
    assert(farmerOrgRes.status === 200, 'Farmer method filter returns 200 OK');
    const allOrgFarmers = farmerOrgRes.body.data.every((f) => f.farmingMethod === 'ORGANIC' || f.farmingMethod === 'Organic');
    assert(allOrgFarmers, 'All filtered farmers practice organic cultivation');

    console.log('\n===============================================================');
    console.log(`  CONSUMER MARKETPLACE E2E AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error during marketplace E2E test:', err);
    process.exit(1);
  }
}

runTests();
