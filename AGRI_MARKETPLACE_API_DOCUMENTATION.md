# Krishi Market - API Documentation

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Consumer APIs](#consumer-apis)
4. [Farmer APIs](#farmer-apis)
5. [Admin APIs](#admin-apis)
6. [Public APIs](#public-apis)
7. [Error Responses](#error-responses)

---

## API Overview

**Base URL**: `http://localhost:5000` (configurable via environment variable)

**Authentication**: JWT Bearer Token in Authorization header

**Response Format**: JSON

**Total Endpoints**: ~120+ (including aliases and sub-routes)

**Public Endpoints**: 7 (no authentication required)
**Protected Endpoints**: 110+ (authentication required)

---

## Authentication

### JWT Token Payload
```json
{
  "userId": "string",
  "email": "string",
  "role": "CONSUMER | FARMER | ADMIN",
  "farmerId": "string (optional)"
}
```

### Authorization Header
```
Authorization: Bearer <token>
```

---

## Authentication APIs

### Register Farmer
**Endpoint**: `POST /api/auth/farmer/register`
**Authentication**: None
**Request Body**:
```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "phone": "string",
  "farmName": "string",
  "farmLocation": "string",
  "location": "string",
  "city": "string",
  "state": "string",
  "pincode": "string",
  "hub": "string",
  "farmingMethod": "ORGANIC",
  "yearsFarming": 1,
  "acreage": 5.0,
  "mainCrops": ["string"],
  "farmDescription": "string",
  "soilPractices": ["string"],
  "waterSource": "string",
  "certifications": ["string"],
  "documents": [
    {
      "type": "GOVERNMENT_ID",
      "title": "string",
      "fileUrl": "string",
      "fileName": "string"
    }
  ]
}
```
**Response**:
```json
{
  "success": true,
  "message": "Farmer registered successfully",
  "data": {
    "user": { "id": "string", "email": "string", "role": "FARMER" },
    "farmer": { "id": "string", "verificationStatus": "PENDING" },
    "token": "string"
  }
}
```

### Farmer Login
**Endpoint**: `POST /api/auth/farmer/login`
**Authentication**: None
**Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "string",
    "user": { "id": "string", "email": "string", "role": "FARMER" },
    "farmer": { "id": "string", "verificationStatus": "APPROVED" }
  }
}
```

### Admin Login
**Endpoint**: `POST /api/auth/admin/login`
**Authentication**: None
**Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "token": "string",
    "user": { "id": "string", "email": "string", "role": "ADMIN" }
  }
}
```

### Consumer Register
**Endpoint**: `POST /api/auth/consumer/register`
**Authentication**: None
**Request Body**:
```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "phone": "string"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Consumer registered successfully",
  "data": {
    "user": { "id": "string", "email": "string", "role": "CONSUMER" },
    "token": "string"
  }
}
```

### Consumer Login
**Endpoint**: `POST /api/auth/consumer/login`
**Authentication**: None
**Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "string",
    "user": { "id": "string", "email": "string", "role": "CONSUMER" }
  }
}
```

---

## Consumer APIs

All consumer APIs require authentication with `CONSUMER` or `ADMIN` role.

### Get Profile
**Endpoint**: `GET /api/consumer/profile`
**Authentication**: Required (CONSUMER, ADMIN)
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "email": "string",
    "name": "string",
    "phone": "string",
    "role": "CONSUMER"
  }
}
```

### Update Profile
**Endpoint**: `PATCH /api/consumer/profile`
**Authentication**: Required (CONSUMER)
**Request Body**:
```json
{
  "name": "string",
  "phone": "string"
}
```

### Get Addresses
**Endpoint**: `GET /api/consumer/addresses`
**Authentication**: Required (CONSUMER, ADMIN)
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "phone": "string",
      "addressLine": "string",
      "city": "string",
      "state": "string",
      "pincode": "string",
      "hub": "string",
      "isDefault": true
    }
  ]
}
```

### Create Address
**Endpoint**: `POST /api/consumer/addresses`
**Authentication**: Required (CONSUMER, ADMIN)
**Request Body**:
```json
{
  "name": "string",
  "phone": "string",
  "addressLine": "string",
  "city": "string",
  "state": "string",
  "pincode": "string",
  "hub": "string",
  "isDefault": false
}
```

### Update Address
**Endpoint**: `PATCH /api/consumer/addresses/:id`
**Authentication**: Required (CONSUMER, ADMIN)

### Delete Address
**Endpoint**: `DELETE /api/consumer/addresses/:id`
**Authentication**: Required (CONSUMER, ADMIN)

### Set Default Address
**Endpoint**: `PATCH /api/consumer/addresses/:id/default`
**Authentication**: Required (CONSUMER, ADMIN)

### Get Cart
**Endpoint**: `GET /api/consumer/cart`
**Authentication**: Required (CONSUMER, ADMIN)
**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "string",
        "productId": "string",
        "quantity": 5,
        "product": {
          "name": "string",
          "price": 50.00,
          "unit": "kg"
        }
      }
    ],
    "cartCount": 2,
    "subtotal": 150.00
  }
}
```

### Add to Cart
**Endpoint**: `POST /api/consumer/cart`
**Authentication**: Required (CONSUMER, ADMIN)
**Request Body**:
```json
{
  "productId": "string",
  "quantity": 2,
  "surplusOfferId": "string (optional)"
}
```

### Update Cart Quantity
**Endpoint**: `PATCH /api/consumer/cart/:productId`
**Authentication**: Required (CONSUMER, ADMIN)
**Request Body**:
```json
{
  "quantity": 5
}
```

### Remove from Cart
**Endpoint**: `DELETE /api/consumer/cart/:productId`
**Authentication**: Required (CONSUMER, ADMIN)

### Clear Cart
**Endpoint**: `DELETE /api/consumer/cart`
**Authentication**: Required (CONSUMER, ADMIN)

### Get Orders
**Endpoint**: `GET /api/consumer/orders`
**Authentication**: Required (CONSUMER, ADMIN)
**Query Parameters**: `status`, `page`, `limit`
**Response**:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "string",
        "orderNumber": "KM-20261006-XXXX",
        "status": "DELIVERED",
        "total": 255.00,
        "createdAt": "2026-10-06T00:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

### Get Order by ID
**Endpoint**: `GET /api/consumer/orders/:orderId`
**Authentication**: Required (CONSUMER, ADMIN)

### Cancel Order
**Endpoint**: `POST /api/consumer/orders/:orderId/cancel`
**Authentication**: Required (CONSUMER, ADMIN)

### Get Reviews
**Endpoint**: `GET /api/consumer/reviews`
**Authentication**: Required (CONSUMER, ADMIN)

### Get Product Reviews
**Endpoint**: `GET /api/consumer/products/:productId/reviews`
**Authentication**: Required (CONSUMER, ADMIN)

### Create Review
**Endpoint**: `POST /api/consumer/products/:productId/reviews`
**Authentication**: Required (CONSUMER, ADMIN)
**Request Body**:
```json
{
  "rating": 5,
  "comment": "Great product!"
}
```

### Update Review
**Endpoint**: `PATCH /api/consumer/reviews/:reviewId`
**Authentication**: Required (CONSUMER, ADMIN)

### Delete Review
**Endpoint**: `DELETE /api/consumer/reviews/:reviewId`
**Authentication**: Required (CONSUMER, ADMIN)

### Get Disputes
**Endpoint**: `GET /api/consumer/disputes`
**Authentication**: Required (CONSUMER, ADMIN)

### Get Dispute by ID
**Endpoint**: `GET /api/consumer/disputes/:disputeId`
**Authentication**: Required (CONSUMER, ADMIN)

### Create Dispute
**Endpoint**: `POST /api/consumer/orders/:orderId/disputes`
**Authentication**: Required (CONSUMER, ADMIN)
**Request Body**:
```json
{
  "reason": "string",
  "amount": 100.00,
  "description": "string"
}
```

---

## Farmer APIs

All farmer APIs require authentication with `FARMER` role and `APPROVED` status (unless specified).

### Get Farmer Status
**Endpoint**: `GET /api/farmer/status`
**Authentication**: Required (FARMER, ADMIN)
**Response**:
```json
{
  "success": true,
  "data": {
    "verificationStatus": "APPROVED",
    "isVerified": true,
    "farmerId": "string"
  }
}
```

### Get Farmer Profile
**Endpoint**: `GET /api/farmer/profile`
**Authentication**: Required (FARMER, ADMIN)

### Update Farmer Profile
**Endpoint**: `PATCH /api/farmer/profile`
**Authentication**: Required (FARMER)

### Get Farmer Dashboard
**Endpoint**: `GET /api/farmer/dashboard`
**Authentication**: Required (FARMER, APPROVED)
**Response**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalProducts": 10,
      "activeOrders": 5,
      "totalRevenue": 5000.00,
      "pendingDeliveries": 2
    },
    "recentOrders": [],
    "inventory": [],
    "deliveryBatches": []
  }
}
```

### Get Farmer Products
**Endpoint**: `GET /api/farmer/products`
**Authentication**: Required (FARMER, APPROVED)
**Query Parameters**: `status`, `page`, `limit`

### Create Product
**Endpoint**: `POST /api/farmer/products`
**Authentication**: Required (FARMER, APPROVED)
**Request Body**:
```json
{
  "name": "string",
  "category": "VEGETABLES",
  "description": "string",
  "price": 50.00,
  "unit": "kg",
  "unitShort": "kg",
  "images": ["string"],
  "shelfLifeDays": 6,
  "isOrganic": true,
  "farmingMethod": "ORGANIC"
}
```

### Get Product by ID
**Endpoint**: `GET /api/farmer/products/:id`
**Authentication**: Required (FARMER, APPROVED)

### Update Product
**Endpoint**: `PATCH /api/farmer/products/:id`
**Authentication**: Required (FARMER, APPROVED)

### Delete Product
**Endpoint**: `DELETE /api/farmer/products/:id`
**Authentication**: Required (FARMER, APPROVED)

### Get Farmer Inventory
**Endpoint**: `GET /api/farmer/inventory`
**Authentication**: Required (FARMER, APPROVED)

### Get Inventory by Product
**Endpoint**: `GET /api/farmer/inventory/:productId`
**Authentication**: Required (FARMER, APPROVED)

### Update Stock
**Endpoint**: `PATCH /api/farmer/inventory/:productId`
**Authentication**: Required (FARMER, APPROVED)
**Request Body**:
```json
{
  "amount": 10,
  "type": "ADD",
  "reason": "Harvest incoming"
}
```

### Get Farmer Harvests
**Endpoint**: `GET /api/farmer/harvests`
**Authentication**: Required (FARMER, APPROVED)

### Create Harvest
**Endpoint**: `POST /api/farmer/harvests`
**Authentication**: Required (FARMER, APPROVED)
**Request Body**:
```json
{
  "productId": "string",
  "harvestDate": "2026-10-06T00:00:00Z",
  "quantity": 100.00,
  "unit": "kg",
  "farmingMethod": "ORGANIC",
  "location": "string",
  "expectedShelfLifeDays": 6
}
```

### Get Harvest by ID
**Endpoint**: `GET /api/farmer/harvests/:id`
**Authentication**: Required (FARMER, APPROVED)

### Get Traceability Events
**Endpoint**: `GET /api/farmer/harvests/:batchId/traceability`
**Authentication**: Required (FARMER, APPROVED)

### Add Traceability Event
**Endpoint**: `POST /api/farmer/harvests/:batchId/traceability`
**Authentication**: Required (FARMER, APPROVED)
**Request Body**:
```json
{
  "step": "HARVEST",
  "title": "string",
  "location": "string",
  "details": "string"
}
```

### Get Farmer Surplus Offers
**Endpoint**: `GET /api/farmer/surplus`
**Authentication**: Required (FARMER, APPROVED)

### Create Surplus Offer
**Endpoint**: `POST /api/farmer/surplus`
**Authentication**: Required (FARMER, APPROVED)
**Request Body**:
```json
{
  "productId": "string",
  "batchId": "string (optional)",
  "availableQuantity": 50.00,
  "unit": "kg",
  "discountPercent": 30,
  "expiryDate": "2026-10-10T00:00:00Z",
  "reason": "string"
}
```

### Get Surplus Offer by ID
**Endpoint**: `GET /api/farmer/surplus/:id`
**Authentication**: Required (FARMER, APPROVED)

### Update Surplus Offer
**Endpoint**: `PATCH /api/farmer/surplus/:id`
**Authentication**: Required (FARMER, APPROVED)

### Cancel Surplus Offer
**Endpoint**: `DELETE /api/farmer/surplus/:id`
**Authentication**: Required (FARMER, APPROVED)

### Get Farmer Orders
**Endpoint**: `GET /api/farmer/orders`
**Authentication**: Required (FARMER, APPROVED)
**Query Parameters**: `status`, `page`, `limit`

### Get Farmer Order by ID
**Endpoint**: `GET /api/farmer/orders/:orderId`
**Authentication**: Required (FARMER, APPROVED)

### Update Farmer Order Status
**Endpoint**: `PATCH /api/farmer/orders/:orderId/status`
**Authentication**: Required (FARMER, APPROVED)
**Request Body**:
```json
{
  "status": "CONFIRMED"
}
```

### Create Delivery Batch
**Endpoint**: `POST /api/farmer/deliveries/batches`
**Authentication**: Required (FARMER, APPROVED)
**Request Body**:
```json
{
  "hubArea": "string",
  "deliverySlot": "string"
}
```

### Auto-Create Batches
**Endpoint**: `POST /api/farmer/deliveries/batches/auto-create`
**Authentication**: Required (FARMER, APPROVED)

### Get Delivery Batches
**Endpoint**: `GET /api/farmer/deliveries/batches`
**Authentication**: Required (FARMER, APPROVED)

### Get Delivery Batch by ID
**Endpoint**: `GET /api/farmer/deliveries/batches/:batchId`
**Authentication**: Required (FARMER, APPROVED)

### Update Delivery Batch Status
**Endpoint**: `PATCH /api/farmer/deliveries/batches/:batchId/status`
**Authentication**: Required (FARMER, APPROVED)
**Request Body**:
```json
{
  "status": "OUT_FOR_DELIVERY"
}
```

### Get Farmer Sales
**Endpoint**: `GET /api/farmer/sales`
**Authentication**: Required (FARMER, APPROVED)

### Get Sales Summary
**Endpoint**: `GET /api/farmer/sales/summary`
**Authentication**: Required (FARMER, APPROVED)
**Response**:
```json
{
  "success": true,
  "data": {
    "totalRevenue": 10000.00,
    "pendingPayouts": 2000.00,
    "paidOut": 8000.00,
    "totalOrders": 50
  }
}
```

### Get Farmer Notifications
**Endpoint**: `GET /api/farmer/notifications`
**Authentication**: Required (FARMER)

### Mark All as Read
**Endpoint**: `POST /api/farmer/notifications/mark-all-read`
**Authentication**: Required (FARMER)

### Mark Notification as Read
**Endpoint**: `PATCH /api/farmer/notifications/:id/read`
**Authentication**: Required (FARMER)

---

## Admin APIs

All admin APIs require authentication with `ADMIN` role.

### Get Admin Dashboard
**Endpoint**: `GET /api/admin/dashboard`
**Authentication**: Required (ADMIN)
**Response**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalFarmers": 377,
      "pendingFarmers": 90,
      "approvedFarmers": 240,
      "rejectedFarmers": 47,
      "totalConsumers": 147,
      "totalProducts": 173,
      "totalOrders": 183,
      "totalRevenue": 50000.00
    },
    "charts": {
      "revenueTrend": [],
      "orderTrend": [],
      "farmerRegistrations": []
    },
    "recentActivities": [],
    "pendingVerifications": [],
    "openDisputes": []
  }
}
```

### Get All Farmers
**Endpoint**: `GET /api/admin/farmers`
**Authentication**: Required (ADMIN)
**Query Parameters**: `status`, `page`, `limit`

### Get Pending Farmers
**Endpoint**: `GET /api/admin/farmers/pending`
**Authentication**: Required (ADMIN)

### Get Farmer by ID
**Endpoint**: `GET /api/admin/farmers/:farmerId`
**Authentication**: Required (ADMIN)

### Approve Farmer
**Endpoint**: `POST /api/admin/farmers/:farmerId/approve`
**Authentication**: Required (ADMIN)

### Reject Farmer
**Endpoint**: `POST /api/admin/farmers/:farmerId/reject`
**Authentication**: Required (ADMIN)
**Request Body**:
```json
{
  "reason": "string"
}
```

### Get All Products
**Endpoint**: `GET /api/admin/products`
**Authentication**: Required (ADMIN)
**Query Parameters**: `status`, `category`, `page`, `limit`

### Get Product by ID
**Endpoint**: `GET /api/admin/products/:productId`
**Authentication**: Required (ADMIN)

### Update Product Status
**Endpoint**: `PATCH /api/admin/products/:productId/status`
**Authentication**: Required (ADMIN)

### Get All Orders
**Endpoint**: `GET /api/admin/orders`
**Authentication**: Required (ADMIN)
**Query Parameters**: `status`, `page`, `limit`

### Get Order by ID
**Endpoint**: `GET /api/admin/orders/:orderId`
**Authentication**: Required (ADMIN)

### Update Order Status
**Endpoint**: `PATCH /api/admin/orders/:orderId/status`
**Authentication**: Required (ADMIN)

### Get All Delivery Batches
**Endpoint**: `GET /api/admin/deliveries`
**Authentication**: Required (ADMIN)

### Get Delivery Batch by ID
**Endpoint**: `GET /api/admin/deliveries/:batchId`
**Authentication**: Required (ADMIN)

### Update Delivery Batch Status
**Endpoint**: `PATCH /api/admin/deliveries/:batchId/status`
**Authentication**: Required (ADMIN)

### Get All Disputes
**Endpoint**: `GET /api/admin/disputes`
**Authentication**: Required (ADMIN)
**Query Parameters**: `status`, `page`, `limit`

### Get Dispute by ID
**Endpoint**: `GET /api/admin/disputes/:disputeId`
**Authentication**: Required (ADMIN)

### Update Dispute Status
**Endpoint**: `PATCH /api/admin/disputes/:disputeId/status`
**Authentication**: Required (ADMIN)

### Resolve Dispute
**Endpoint**: `PATCH /api/admin/disputes/:disputeId/resolve`
**Authentication**: Required (ADMIN)
**Request Body**:
```json
{
  "resolution": "string"
}
```

### Reject Dispute
**Endpoint**: `PATCH /api/admin/disputes/:disputeId/reject`
**Authentication**: Required (ADMIN)

### Get All Sales
**Endpoint**: `GET /api/admin/sales`
**Authentication**: Required (ADMIN)
**Query Parameters**: `status`, `farmerId`, `page`, `limit`

### Get Sale by ID
**Endpoint**: `GET /api/admin/sales/:saleId`
**Authentication**: Required (ADMIN)

### Mark Sale as Paid
**Endpoint**: `PATCH /api/admin/sales/:saleId/payout`
**Authentication**: Required (ADMIN)

### Get All Reviews
**Endpoint**: `GET /api/admin/reviews`
**Authentication**: Required (ADMIN)
**Query Parameters**: `page`, `limit`

### Get All Users
**Endpoint**: `GET /api/admin/users`
**Authentication**: Required (ADMIN)
**Query Parameters**: `role`, `page`, `limit`

### Get User by ID
**Endpoint**: `GET /api/admin/users/:userId`
**Authentication**: Required (ADMIN)

### Update User Status
**Endpoint**: `PATCH /api/admin/users/:userId/status`
**Authentication**: Required (ADMIN)
**Request Body**:
```json
{
  "isActive": false
}
```

### Get Admin Notifications
**Endpoint**: `GET /api/admin/notifications`
**Authentication**: Required (ADMIN)

### Get Unread Count
**Endpoint**: `GET /api/admin/notifications/unread-count`
**Authentication**: Required (ADMIN)

### Mark Notification as Read
**Endpoint**: `PATCH /api/admin/notifications/:notificationId/read`
**Authentication**: Required (ADMIN)

### Mark All as Read
**Endpoint**: `PATCH /api/admin/notifications/read-all`
**Authentication**: Required (ADMIN)

### Delete Notification
**Endpoint**: `DELETE /api/admin/notifications/:notificationId`
**Authentication**: Required (ADMIN)

### Clear All Notifications
**Endpoint**: `DELETE /api/admin/notifications`
**Authentication**: Required (ADMIN)

---

## Public APIs

Public APIs do not require authentication.

### Get Public Products
**Endpoint**: `GET /api/products`
**Authentication**: None
**Query Parameters**: `category`, `minPrice`, `maxPrice`, `distance`, `farmingMethod`, `organic`, `minRating`, `page`, `limit`
**Response**:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "string",
        "name": "string",
        "price": 50.00,
        "unit": "kg",
        "farmer": {
          "id": "string",
          "farmName": "string",
          "location": "string"
        }
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### Get Public Product by ID
**Endpoint**: `GET /api/products/:id`
**Authentication**: None

### Get Public Farmers
**Endpoint**: `GET /api/farmers`
**Authentication**: None
**Query Parameters**: `location`, `farmingMethod`, `verified`, `page`, `limit`
**Response**:
```json
{
  "success": true,
  "data": {
    "farmers": [
      {
        "id": "string",
        "farmName": "string",
        "location": "string",
        "rating": 4.5,
        "isVerified": true
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

### Get Public Farmer by ID
**Endpoint**: `GET /api/farmers/:id`
**Authentication**: None

### Get Public Surplus Offers
**Endpoint**: `GET /api/surplus`
**Authentication**: None
**Query Parameters**: `page`, `limit`

### Get Public Surplus Offer by ID
**Endpoint**: `GET /api/surplus/:id`
**Authentication**: None

### Get Public Traceability
**Endpoint**: `GET /api/trace/:batchId`
**Authentication**: None
**Response**:
```json
{
  "success": true,
  "data": {
    "batch": {
      "batchNumber": "string",
      "harvestDate": "2026-10-06T00:00:00Z",
      "quantity": 100.00,
      "unit": "kg"
    },
    "farmer": {
      "farmName": "string",
      "location": "string"
    },
    "product": {
      "name": "string",
      "category": "VEGETABLES"
    },
    "traceability": [
      {
        "step": "FARM_ORIGIN",
        "title": "Farm Origin",
        "location": "string",
        "timestamp": "2026-10-06T00:00:00Z",
        "details": "string"
      }
    ]
  }
}
```

---

## Order APIs

### Create Order
**Endpoint**: `POST /api/orders`
**Authentication**: Required
**Request Body**:
```json
{
  "addressId": "string",
  "deliverySlotName": "string",
  "deliverySlotRange": "string",
  "paymentMethod": "UPI",
  "items": [
    {
      "productId": "string",
      "quantity": 2
    }
  ]
}
```
**Response**:
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": "string",
      "orderNumber": "KM-20261006-XXXX",
      "status": "PLACED",
      "total": 255.00
    }
  }
}
```

### Get Consumer Orders
**Endpoint**: `GET /api/orders`
**Authentication**: Required

### Get Order by ID
**Endpoint**: `GET /api/orders/:orderId`
**Authentication**: Required

### Cancel Order
**Endpoint**: `POST /api/orders/:orderId/cancel`
**Authentication**: Required

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

### HTTP Status Codes

- **200 OK** - Successful request
- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Authentication required or invalid token
- **403 Forbidden** - Access denied (role or ownership restrictions)
- **404 Not Found** - Resource not found
- **409 Conflict** - Duplicate record (e.g., email already exists)
- **500 Internal Server Error** - Server error

### Common Error Messages

- "Authentication required"
- "Invalid token"
- "Access denied. Requires one of roles: [CONSUMER, ADMIN]. Current role: FARMER"
- "Farmer must be approved to perform this action"
- "Product not found"
- "Insufficient stock"
- "Order not found"
- "Email already exists"

---

## API Endpoint Summary

**Table: API Endpoint Summary**

| Category | Endpoints | Authentication |
|----------|-----------|----------------|
| Authentication | 5 | None |
| Consumer | 20+ | CONSUMER, ADMIN |
| Farmer | 25+ | FARMER (APPROVED) |
| Admin | 40+ | ADMIN |
| Public | 7 | None |
| Order | 4 | Required |
| **Total** | **~120+** | - |

---

**End of API Documentation**
