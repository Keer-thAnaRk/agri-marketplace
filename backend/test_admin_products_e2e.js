const { prisma } = require('./dist/db/prisma');

async function runAdminProductE2ETests() {
  console.log('=== STARTING ADMIN PRODUCT MANAGEMENT E2E INTEGRATION TESTS ===\n');

  const baseUrl = 'http://localhost:5000';

  let adminToken = '';
  let farmerAToken = '';
  let farmerAId = '';
  let farmerAUserId = '';
  let farmerBToken = '';
  let farmerBId = '';
  let farmerBUserId = '';
  let consumerToken = '';
  let consumerUserId = '';
  let testProductId = '';
  let testOrderId = '';

  const timestamp = Date.now();
  const farmerAEmail = `adm.prod.farmerA.${timestamp}@krishitest.com`;
  const farmerBEmail = `adm.prod.farmerB.${timestamp}@krishitest.com`;
  const consumerEmail = `adm.prod.consumer.${timestamp}@krishitest.com`;

  try {
    // 1. Admin Authentication
    console.log('1. Authenticating as Admin via POST /api/auth/admin/login...');
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@krishimarket.in',
        password: 'admin123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    if (!adminLoginRes.ok || !adminLoginData.data?.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
    }
    adminToken = adminLoginData.data.token;
    console.log(`   ✓ Admin authenticated successfully. User: ${adminLoginData.data.user.email}`);

    // 2. Set up Farmer A and Farmer B and Consumer
    console.log('\n2. Setting up Farmer A, Farmer B, and Consumer in PostgreSQL...');
    const regFarmerARes = await fetch(`${baseUrl}/api/auth/farmer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Devan Gowda',
        email: farmerAEmail,
        phone: '+91 98450 77112',
        password: 'Password123!',
        farmName: 'Devan Organic Orchard',
        farmLocation: 'Survey 18, Devanahalli',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '562110',
        hub: 'Devanahalli Hub',
        farmingMethod: 'Natural (ZBNF)',
        yearsFarming: 5,
        mainCrops: ['Devanahalli Pomelo', 'Sweet Lime'],
        govtIdFileName: 'Aadhaar_Devan.pdf',
        govtIdFileUrl: 'https://storage.krishimarket.in/docs/devan_id.pdf',
      }),
    });
    const regFarmerAData = await regFarmerARes.json();
    farmerAId = regFarmerAData.data.farmer.id;
    farmerAUserId = regFarmerAData.data.user.id;
    farmerAToken = regFarmerAData.data.token;

    // Approve Farmer A
    await fetch(`${baseUrl}/api/admin/farmers/${farmerAId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`   ✓ Farmer A created and approved. ID: ${farmerAId}`);

    // Register Farmer B
    const regFarmerBRes = await fetch(`${baseUrl}/api/auth/farmer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Basavaraj Patil',
        email: farmerBEmail,
        phone: '+91 98450 88223',
        password: 'Password123!',
        farmName: 'Sahyadri Bio Spices',
        farmLocation: 'Plot 5, Doddaballapura',
        city: 'Bengaluru Rural',
        state: 'Karnataka',
        pincode: '561203',
        hub: 'Doddaballapura Hub',
        farmingMethod: 'Organic Farming',
        yearsFarming: 10,
        mainCrops: ['Turmeric', 'Ginger'],
      }),
    });
    const regFarmerBData = await regFarmerBRes.json();
    farmerBId = regFarmerBData.data.farmer.id;
    farmerBUserId = regFarmerBData.data.user.id;
    farmerBToken = regFarmerBData.data.token;

    // Approve Farmer B
    await fetch(`${baseUrl}/api/admin/farmers/${farmerBId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`   ✓ Farmer B created and approved. ID: ${farmerBId}`);

    // Register Consumer
    const regConsumerRes = await fetch(`${baseUrl}/api/auth/consumer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Regular Consumer',
        email: consumerEmail,
        password: 'Password123!',
      }),
    });
    const regConsumerData = await regConsumerRes.json();
    consumerToken = regConsumerData.data?.token;
    consumerUserId = regConsumerData.data?.user?.id;
    console.log(`   ✓ Consumer created. ID: ${consumerUserId}`);

    // 3. Farmer A creates a product
    console.log('\n3. Farmer A creating product in PostgreSQL...');
    const createProductRes = await fetch(`${baseUrl}/api/farmer/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerAToken}`,
      },
      body: JSON.stringify({
        name: 'GI Tagged Devanahalli Pomelo',
        category: 'Fruits',
        description: 'Juicy, fragrant GI-tagged Bangalore pomelo cultivated using ZBNF practices.',
        price: 180,
        unit: '1 piece (approx 1.2 kg)',
        unitShort: 'piece',
        availableQuantity: 45,
        lowStockThreshold: 10,
        shelfLifeDays: 14,
        expectedFreshnessDuration: '14 days cool room temperature',
        isOrganic: true,
        farmingMethod: 'Natural (ZBNF)',
        nutritionHighlights: ['Rich in Vitamin C', 'Potassium', 'Bioflavonoids'],
      }),
    });
    const createProductData = await createProductRes.json();
    if (!createProductRes.ok) throw new Error(`Product creation failed: ${JSON.stringify(createProductData)}`);
    testProductId = createProductData.data.id;
    console.log(`   ✓ Product created by Farmer A. ID: ${testProductId}`);

    // 4. Admin retrieves all products
    console.log('\n4. Testing: Admin can retrieve all products across farmers (GET /api/admin/products)...');
    const adminProductsRes = await fetch(`${baseUrl}/api/admin/products`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminProductsData = await adminProductsRes.json();
    if (!adminProductsRes.ok) throw new Error(`Admin products list failed: ${JSON.stringify(adminProductsData)}`);
    console.log(`   ✓ Admin retrieved ${adminProductsData.count} total products from database.`);
    const foundProduct = adminProductsData.data.find((p) => p.id === testProductId);
    if (!foundProduct) throw new Error(`Created product ${testProductId} not found in admin products list!`);
    console.log(`   ✓ Newly created product found in admin products list.`);

    // 5. Verify Farmer Relationship on product
    console.log('\n5. Testing: Admin sees correct database Farmer relationship...');
    if (foundProduct.farmerId !== farmerAId) {
      throw new Error(`Expected farmerId ${farmerAId}, got ${foundProduct.farmerId}`);
    }
    if (foundProduct.farmerName !== 'Devan Gowda') {
      throw new Error(`Expected farmerName "Devan Gowda", got "${foundProduct.farmerName}"`);
    }
    if (foundProduct.farmName !== 'Devan Organic Orchard') {
      throw new Error(`Expected farmName "Devan Organic Orchard", got "${foundProduct.farmName}"`);
    }
    console.log(`   ✓ Farmer relationship verified: "${foundProduct.farmerName}" at "${foundProduct.farmName}"`);
    console.log(`   ✓ Farmer verification status: ${foundProduct.farmerVerificationStatus}`);

    // 6. Verify Inventory Information loaded from InventoryItem
    console.log('\n6. Testing: Stock information correctly loaded from InventoryItem...');
    if (foundProduct.stock !== 45) {
      throw new Error(`Expected stock 45, got ${foundProduct.stock}`);
    }
    if (foundProduct.inventoryExists !== true) {
      throw new Error('Expected inventoryExists = true');
    }
    if (foundProduct.inventoryStatus !== 'IN_STOCK') {
      throw new Error(`Expected inventoryStatus = IN_STOCK, got ${foundProduct.inventoryStatus}`);
    }
    console.log(`   ✓ Stock verified: ${foundProduct.stock} units, status = ${foundProduct.inventoryStatus}`);
    console.log(`   ✓ InventoryItem link verified: inventoryExists = ${foundProduct.inventoryExists}`);

    // 7. Testing Admin Search
    console.log('\n7. Testing: Admin search functionality...');
    // Search by product name
    const searchNameRes = await fetch(`${baseUrl}/api/admin/products?search=Pomelo`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchNameData = await searchNameRes.json();
    const hasPomelo = searchNameData.data.some((p) => p.id === testProductId);
    if (!hasPomelo) throw new Error('Search by product name "Pomelo" failed to find product');
    console.log(`   ✓ Search by product name "Pomelo" succeeded (found ${searchNameData.count} matches).`);

    // Search by farm name
    const searchFarmRes = await fetch(`${baseUrl}/api/admin/products?search=Devan+Organic`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchFarmData = await searchFarmRes.json();
    const hasFarm = searchFarmData.data.some((p) => p.id === testProductId);
    if (!hasFarm) throw new Error('Search by farm name failed');
    console.log(`   ✓ Search by farm name "Devan Organic" succeeded (found ${searchFarmData.count} matches).`);

    // Search by grower name
    const searchGrowerRes = await fetch(`${baseUrl}/api/admin/products?search=Devan+Gowda`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchGrowerData = await searchGrowerRes.json();
    const hasGrower = searchGrowerData.data.some((p) => p.id === testProductId);
    if (!hasGrower) throw new Error('Search by grower name failed');
    console.log(`   ✓ Search by grower name "Devan Gowda" succeeded.`);

    // 8. Testing Admin Filters
    console.log('\n8. Testing: Admin filters (category, status, farmingMethod, organic)...');
    // Category filter: Fruits
    const catRes = await fetch(`${baseUrl}/api/admin/products?category=Fruits`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const catData = await catRes.json();
    if (!catData.data.some((p) => p.id === testProductId)) throw new Error('Category filter Fruits failed');
    console.log(`   ✓ Category filter "Fruits" returned matching records.`);

    // Status filter: ACTIVE
    const statusRes = await fetch(`${baseUrl}/api/admin/products?status=ACTIVE`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statusData = await statusRes.json();
    if (!statusData.data.some((p) => p.id === testProductId)) throw new Error('Status filter ACTIVE failed');
    console.log(`   ✓ Status filter "ACTIVE" returned matching records.`);

    // Organic filter: ORGANIC
    const organicRes = await fetch(`${baseUrl}/api/admin/products?organic=ORGANIC`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const organicData = await organicRes.json();
    if (!organicData.data.some((p) => p.id === testProductId)) throw new Error('Organic filter failed');
    console.log(`   ✓ Organic filter returned matching records.`);

    // 9. Admin Product Details (GET /api/admin/products/:productId)
    console.log(`\n9. Testing: Admin GET /api/admin/products/${testProductId}...`);
    const detailRes = await fetch(`${baseUrl}/api/admin/products/${testProductId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const detailData = await detailRes.json();
    if (!detailRes.ok) throw new Error(`Admin product detail failed: ${JSON.stringify(detailData)}`);
    const detail = detailData.data;
    if (detail.name !== 'GI Tagged Devanahalli Pomelo') throw new Error('Product name mismatch');
    if (detail.price !== 180) throw new Error('Price mismatch');
    if (detail.shelfLifeDays !== 14) throw new Error('Shelf life mismatch');
    if (detail.farmerId !== farmerAId) throw new Error('FarmerId mismatch');
    if (!detail.farmerName || !detail.farmName) throw new Error('Farmer details incomplete');
    if (detail.stock !== 45) throw new Error('Stock mismatch');
    console.log(`   ✓ Product details verified: "${detail.name}" - ₹${detail.price}/${detail.unit}`);
    console.log(`   ✓ Description: "${detail.description}"`);
    console.log(`   ✓ Nutrition Highlights: ${detail.nutritionHighlights.join(', ')}`);
    console.log(`   ✓ Farmer Origin: ${detail.farmerName} (${detail.farmName}, ${detail.location})`);

    // 10. Admin updates product status (PATCH /api/admin/products/:productId/status)
    console.log(`\n10. Testing: Admin updates product status to OUT_OF_STOCK...`);
    const updateRes = await fetch(`${baseUrl}/api/admin/products/${testProductId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'OUT_OF_STOCK' }),
    });
    const updateData = await updateRes.json();
    if (!updateRes.ok) throw new Error(`Status update failed: ${JSON.stringify(updateData)}`);
    if (updateData.data.status !== 'OUT_OF_STOCK') throw new Error('Product status did not update to OUT_OF_STOCK');
    console.log(`   ✓ Product status updated to: ${updateData.data.status}`);

    // Verify in database
    const dbProduct = await prisma.product.findUnique({
      where: { id: testProductId },
      include: { inventory: true },
    });
    if (dbProduct.status !== 'OUT_OF_STOCK' || dbProduct.inStock !== false) {
      throw new Error('Database Product model status not updated to OUT_OF_STOCK');
    }
    if (dbProduct.inventory?.status !== 'OUT_OF_STOCK') {
      throw new Error('Database InventoryItem status was not synchronized to OUT_OF_STOCK');
    }
    console.log(`   ✓ Database verified: Product.status = OUT_OF_STOCK, InventoryItem.status = OUT_OF_STOCK`);

    // Toggle back to ACTIVE
    await fetch(`${baseUrl}/api/admin/products/${testProductId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    console.log(`   ✓ Product status successfully toggled back to ACTIVE.`);

    // 11. Testing Invalid status value is rejected (400 Bad Request)
    console.log('\n11. Testing: Invalid status value is rejected with 400 Bad Request...');
    const invalidStatusRes = await fetch(`${baseUrl}/api/admin/products/${testProductId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'INVALID_STATUS_TEST' }),
    });
    const invalidStatusData = await invalidStatusRes.json();
    if (invalidStatusRes.status !== 400) {
      throw new Error(`Expected HTTP 400 for invalid status, got ${invalidStatusRes.status}: ${JSON.stringify(invalidStatusData)}`);
    }
    console.log(`   ✓ Invalid status correctly rejected: "${invalidStatusData.error}"`);

    // 12. Testing Product Ownership Security: attempting to change farmerId via status API
    console.log('\n12. Testing: Product ownership cannot be changed via status API...');
    const tamperOwnershipRes = await fetch(`${baseUrl}/api/admin/products/${testProductId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'ACTIVE', farmerId: farmerBId }),
    });
    const tamperOwnershipData = await tamperOwnershipRes.json();
    if (!tamperOwnershipRes.ok) throw new Error(`Request failed: ${JSON.stringify(tamperOwnershipData)}`);
    const dbProductAfterTamper = await prisma.product.findUnique({ where: { id: testProductId } });
    if (dbProductAfterTamper.farmerId !== farmerAId) {
      throw new Error(`Security breach: Product farmerId was altered to ${dbProductAfterTamper.farmerId}`);
    }
    console.log(`   ✓ Product ownership preserved: farmerId is still "${dbProductAfterTamper.farmerId}" (Farmer A).`);

    // 13. Testing Invalid product ID returns 404
    console.log('\n13. Testing: Invalid product ID returns 404 Not Found...');
    const invalidRes = await fetch(`${baseUrl}/api/admin/products/non-existent-product-id`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (invalidRes.status !== 404) {
      throw new Error(`Expected 404 for invalid product ID, got ${invalidRes.status}`);
    }
    console.log(`   ✓ Invalid product ID correctly returned 404 Not Found.`);

    // 14. Testing Non-admin & unauthenticated access is rejected
    console.log('\n14. Testing: Security access control (Unauthenticated, Consumer, Farmer)...');
    // Unauthenticated
    const unauthRes = await fetch(`${baseUrl}/api/admin/products`);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated request, got ${unauthRes.status}`);
    }
    console.log(`   ✓ Unauthenticated request blocked with 401 Unauthorized.`);

    // Consumer blocked
    const consumerAccessRes = await fetch(`${baseUrl}/api/admin/products`, {
      headers: { Authorization: `Bearer ${consumerToken}` },
    });
    if (consumerAccessRes.status !== 403) {
      throw new Error(`Expected 403 for consumer on /api/admin/products, got ${consumerAccessRes.status}`);
    }
    console.log(`   ✓ Consumer blocked with 403 Forbidden on GET /api/admin/products.`);

    // Farmer blocked
    const farmerAccessRes = await fetch(`${baseUrl}/api/admin/products`, {
      headers: { Authorization: `Bearer ${farmerAToken}` },
    });
    if (farmerAccessRes.status !== 403) {
      throw new Error(`Expected 403 for farmer on /api/admin/products, got ${farmerAccessRes.status}`);
    }
    console.log(`   ✓ Farmer blocked with 403 Forbidden on GET /api/admin/products.`);

    // Consumer cannot update status
    const consumerUpdateRes = await fetch(`${baseUrl}/api/admin/products/${testProductId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${consumerToken}`,
      },
      body: JSON.stringify({ status: 'OUT_OF_STOCK' }),
    });
    if (consumerUpdateRes.status !== 403) {
      throw new Error(`Expected 403 for consumer on PATCH status, got ${consumerUpdateRes.status}`);
    }
    console.log(`   ✓ Consumer blocked with 403 Forbidden on PATCH /api/admin/products/:id/status.`);

    // 15. Testing Historical OrderItem relationships remain intact
    console.log('\n15. Testing: Historical OrderItem relationships remain intact on status change...');
    // Create an order containing an OrderItem with this product
    const orderNumber = `ORD-TEST-${timestamp}`;
    const testOrder = await prisma.order.create({
      data: {
        orderNumber,
        consumerId: consumerUserId,
        deliverySlotName: 'Morning Express',
        deliverySlotRange: '8:00 AM – 11:00 AM',
        subtotal: 180,
        deliveryFee: 40,
        total: 220,
        status: 'PLACED',
        paymentStatus: 'PAID',
        items: {
          create: {
            productId: testProductId,
            farmerId: farmerAId,
            productName: 'GI Tagged Devanahalli Pomelo',
            productImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea',
            farmerName: 'Devan Gowda',
            farmName: 'Devan Organic Orchard',
            unitPrice: 180,
            quantity: 1,
            unit: '1 piece',
            totalPrice: 180,
          },
        },
      },
      include: { items: true },
    });
    testOrderId = testOrder.id;
    console.log(`   ✓ Created historical order: ${testOrder.orderNumber} with OrderItem ID: ${testOrder.items[0].id}`);

    // Update product status to EXPIRED
    await fetch(`${baseUrl}/api/admin/products/${testProductId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'EXPIRED' }),
    });

    // Verify historical OrderItem is intact
    const fetchedOrder = await prisma.order.findUnique({
      where: { id: testOrderId },
      include: { items: true },
    });
    if (!fetchedOrder || fetchedOrder.items.length === 0) {
      throw new Error('Historical order or OrderItems were corrupted!');
    }
    const orderItem = fetchedOrder.items[0];
    if (orderItem.productId !== testProductId) {
      throw new Error(`OrderItem productId mismatch: expected ${testProductId}, got ${orderItem.productId}`);
    }
    if (Number(orderItem.unitPrice) !== 180) {
      throw new Error(`OrderItem historical unitPrice corrupted: expected 180, got ${orderItem.unitPrice}`);
    }
    if (orderItem.farmerName !== 'Devan Gowda') {
      throw new Error(`OrderItem farmerName mismatch: ${orderItem.farmerName}`);
    }
    console.log(`   ✓ Historical OrderItem verified intact: Product ${orderItem.productName}, Price ₹${orderItem.unitPrice}, Farmer ${orderItem.farmerName}`);

    // Restore product status to ACTIVE
    await fetch(`${baseUrl}/api/admin/products/${testProductId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });

    console.log('\n================================================================');
    console.log('✓ ALL 15 ADMIN PRODUCT MANAGEMENT E2E TESTS PASSED!');
    console.log('================================================================\n');
  } finally {
    // Cleanup
    console.log('[CLEANUP] Cleaning up test records from database...');
    try {
      if (testOrderId) {
        await prisma.orderItem.deleteMany({ where: { orderId: testOrderId } });
        await prisma.order.deleteMany({ where: { id: testOrderId } });
      }
      if (testProductId) {
        await prisma.inventoryItem.deleteMany({ where: { productId: testProductId } });
        await prisma.product.deleteMany({ where: { id: testProductId } });
      }
      if (farmerAId) {
        await prisma.farmerDocument.deleteMany({ where: { farmerId: farmerAId } });
        await prisma.notification.deleteMany({ where: { userId: farmerAUserId } });
        await prisma.farmer.deleteMany({ where: { id: farmerAId } });
        await prisma.user.deleteMany({ where: { id: farmerAUserId } });
      }
      if (farmerBId) {
        await prisma.farmerDocument.deleteMany({ where: { farmerId: farmerBId } });
        await prisma.notification.deleteMany({ where: { userId: farmerBUserId } });
        await prisma.farmer.deleteMany({ where: { id: farmerBId } });
        await prisma.user.deleteMany({ where: { id: farmerBUserId } });
      }
      if (consumerUserId) {
        await prisma.notification.deleteMany({ where: { userId: consumerUserId } });
        await prisma.user.deleteMany({ where: { id: consumerUserId } });
      }
      console.log('✓ Cleanup completed.');
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
    await prisma.$disconnect();
  }
}

runAdminProductE2ETests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
