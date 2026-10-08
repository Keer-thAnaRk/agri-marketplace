# Krishi Market - System Modules Documentation

---

## Table of Contents

1. [Authentication Module](#1-authentication-module)
2. [Farmer Module](#2-farmer-module)
3. [Consumer Module](#3-consumer-module)
4. [Admin Module](#4-admin-module)
5. [Marketplace Module](#5-marketplace-module)
6. [Order Module](#6-order-module)
7. [Cart Module](#7-cart-module)
8. [Inventory Module](#8-inventory-module)
9. [Harvest Module](#9-harvest-module)
10. [Surplus Module](#10-surplus-module)
11. [Delivery Module](#11-delivery-module)
12. [Sale Module](#12-sale-module)
13. [Notification Module](#13-notification-module)
14. [Review Module](#14-review-module)
15. [Dispute Module](#15-dispute-module)

---

## 1. Authentication Module

### Purpose
Handles user registration, login, and authentication across all user roles (Consumer, Farmer, Admin).

### Components
- **Frontend**:
  - `src/app/login/page.tsx` - Consumer/farmer login page
  - `src/app/signup/page.tsx` - Consumer registration page
  - `src/app/farmer/login/page.tsx` - Farmer-specific login
  - `src/app/farmer/signup/page.tsx` - Farmer registration with multi-step form
  - `src/app/admin/login/page.tsx` - Admin login page
  - `src/context/AuthContext.tsx` - Global authentication state management
  - `src/lib/api.ts` - API client with authentication helpers

- **Backend**:
  - `src/routes/auth.routes.ts` - Authentication API routes
  - `src/controllers/auth.controller.ts` - Authentication request handlers
  - `src/services/auth.service.ts` - Authentication business logic
  - `src/middleware/auth.ts` - JWT verification and role-based access control

### Features
1. **User Registration**
   - Consumer registration with email, password, name, phone
   - Farmer registration with farm details, verification documents
   - Admin auto-seeding for default account

2. **User Login**
   - JWT token generation
   - Password verification with bcrypt
   - Role-based token payload

3. **Authentication Middleware**
   - `requireAuth()` - Requires valid JWT token
   - `requireRole(...roles)` - Requires specific role
   - `requireApprovedFarmer()` - Requires approved farmer status
   - `requireFarmerOwnership()` - Prevents cross-tenant access

4. **Token Management**
   - Token storage in localStorage
   - Token verification on each API request
   - Token expiration handling

### API Endpoints
- `POST /api/auth/farmer/register` - Register farmer
- `POST /api/auth/farmer/login` - Farmer login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/consumer/register` - Register consumer
- `POST /api/auth/consumer/login` - Consumer login

### Database Models
- `User` - User accounts with role, password hash, email
- `Farmer` - Farmer profiles linked to User

### Status
**Fully Implemented**

---

## 2. Farmer Module

### Purpose
Enables farmers to register, list products, manage inventory, track orders, and create surplus offers.

### Components
- **Frontend**:
  - `src/app/farmer/dashboard/page.tsx` - Main dashboard with stats
  - `src/app/farmer/products/page.tsx` - Product management
  - `src/app/farmer/products/new/page.tsx` - Create product
  - `src/app/farmer/products/[id]/edit/page.tsx` - Edit product
  - `src/app/farmer/inventory/page.tsx` - Inventory management
  - `src/app/farmer/orders/page.tsx` - Order management
  - `src/app/farmer/harvests/page.tsx` - Harvest records
  - `src/app/farmer/harvests/new/page.tsx` - Record harvest
  - `src/app/farmer/surplus/page.tsx` - Surplus offers
  - `src/app/farmer/sales/page.tsx` - Sales analytics
  - `src/app/farmer/deliveries/page.tsx` - Delivery batches
  - `src/app/farmer/profile/page.tsx` - Profile settings
  - `src/app/farmer/verification-pending/page.tsx` - Pending status
  - `src/app/farmer/verification-rejected/page.tsx` - Rejected status
  - `src/context/FarmerContext.tsx` - Farmer state management
  - `src/components/farmer/` - Farmer-specific components

- **Backend**:
  - `src/routes/farmer.routes.ts` - Farmer API routes
  - `src/controllers/farmer.controller.ts` - Farmer request handlers
  - `src/services/farmer.service.ts` - Farmer business logic
  - `src/routes/product.routes.ts` - Product management routes
  - `src/routes/inventory.routes.ts` - Inventory management routes
  - `src/routes/harvest.routes.ts` - Harvest management routes
  - `src/routes/surplus.routes.ts` - Surplus offer routes
  - `src/routes/farmer-order.routes.ts` - Order management routes
  - `src/routes/farmer-delivery.routes.ts` - Delivery batch routes
  - `src/routes/farmer-sale.routes.ts` - Sales routes

### Features
1. **Farmer Registration**
   - Multi-step registration form
   - Personal details, farm details, verification documents
   - PENDING status until admin approval

2. **Product Management**
   - Create product listings with images, price, description
   - Update product details
   - Toggle product status (Active/Draft/Out of Stock)
   - Delete products

3. **Inventory Management**
   - View inventory by product
   - Update stock levels
   - Inventory logging for audit trail
   - Low stock alerts

4. **Order Management**
   - View incoming orders
   - Update order status (Confirm, Harvest, Pack, Dispatch)
   - Order timeline tracking

5. **Harvest Management**
   - Record harvest batches
   - Generate QR codes for traceability
   - Add traceability events
   - View harvest history

6. **Surplus Management**
   - Create surplus discount offers
   - Set discount percentage and expiry date
   - Cancel surplus offers

7. **Sales Analytics**
   - View sales summary
   - Revenue trends
   - Order statistics

8. **Delivery Management**
   - Create delivery batches
   - Assign orders to batches
   - Auto-create batches by location
   - Update delivery status

### API Endpoints
- `GET /api/farmer/dashboard` - Get dashboard data
- `GET /api/farmer/status` - Get verification status
- `GET /api/farmer/profile` - Get farmer profile
- `PATCH /api/farmer/profile` - Update farmer profile
- `GET /api/farmer/products` - Get farmer's products
- `POST /api/farmer/products` - Create product
- `PATCH /api/farmer/products/:id` - Update product
- `DELETE /api/farmer/products/:id` - Delete product
- `GET /api/farmer/inventory` - Get inventory
- `PATCH /api/farmer/inventory/:productId` - Update stock
- `GET /api/farmer/harvests` - Get harvest batches
- `POST /api/farmer/harvests` - Create harvest batch
- `GET /api/farmer/harvests/:batchId/traceability` - Get traceability events
- `POST /api/farmer/harvests/:batchId/traceability` - Add traceability event
- `GET /api/farmer/surplus` - Get surplus offers
- `POST /api/farmer/surplus` - Create surplus offer
- `PATCH /api/farmer/surplus/:id` - Update surplus offer
- `DELETE /api/farmer/surplus/:id` - Cancel surplus offer
- `GET /api/farmer/orders` - Get farmer's orders
- `PATCH /api/farmer/orders/:orderId/status` - Update order status
- `POST /api/farmer/deliveries/batches` - Create delivery batch
- `POST /api/farmer/deliveries/batches/auto-create` - Auto-create batches
- `GET /api/farmer/deliveries/batches` - Get delivery batches
- `PATCH /api/farmer/deliveries/batches/:batchId/status` - Update batch status
- `GET /api/farmer/sales` - Get sales
- `GET /api/farmer/sales/summary` - Get sales summary

### Database Models
- `User` - User account
- `Farmer` - Farmer profile
- `FarmerDocument` - Verification documents
- `Product` - Product listings
- `InventoryItem` - Inventory records
- `InventoryLog` - Inventory change logs
- `HarvestBatch` - Harvest batches
- `TraceabilityEvent` - Traceability events
- `SurplusOffer` - Surplus offers
- `Order` - Orders
- `OrderItem` - Order items
- `DeliveryBatch` - Delivery batches
- `Sale` - Sales records

### Status
**Fully Implemented**

---

## 3. Consumer Module

### Purpose
Enables consumers to browse products, place orders, track deliveries, and manage their account.

### Components
- **Frontend**:
  - `src/app/explore/page.tsx` - Product marketplace
  - `src/app/products/[id]/page.tsx` - Product detail page
  - `src/app/cart/page.tsx` - Shopping cart
  - `src/app/checkout/page.tsx` - Checkout flow
  - `src/app/orders/page.tsx` - Order history
  - `src/app/orders/[id]/page.tsx` - Order detail
  - `src/app/dashboard/page.tsx` - Consumer dashboard
  - `src/app/surplus/page.tsx` - Surplus offers
  - `src/app/trace/[batchId]/page.tsx` - QR traceability
  - `src/context/MarketplaceContext.tsx` - Consumer state management
  - `src/components/marketplace/` - Marketplace components
  - `src/components/consumer/` - Consumer components

- **Backend**:
  - `src/routes/consumer.routes.ts` - Consumer API routes
  - `src/controllers/consumer.controller.ts` - Consumer request handlers
  - `src/services/consumer.service.ts` - Consumer business logic
  - `src/routes/order.routes.ts` - Order routes
  - `src/routes/cart.routes.ts` - Cart routes

### Features
1. **Product Browsing**
   - Browse products by category
   - Filter by price, distance, farming method, organic, rating
   - Sort by recommended, freshest, nearest, price
   - Search products

2. **Product Details**
   - View product images and description
   - View farmer information
   - View traceability timeline
   - View reviews
   - Add to cart

3. **Cart Management**
   - Add items to cart
   - Update quantity
   - Remove items
   - View price breakdown
   - Clear cart

4. **Checkout**
   - Select delivery address
   - Select delivery slot
   - Select payment method
   - View order summary
   - Place order

5. **Order Tracking**
   - View order history
   - Track order status
   - View order timeline
   - Cancel orders

6. **Address Management**
   - Add delivery addresses
   - Update addresses
   - Delete addresses
   - Set default address

7. **Reviews**
   - Write product reviews
   - Write farmer reviews
   - View reviews

8. **Disputes**
   - Create disputes for problematic orders
   - View dispute status
   - View dispute resolution

9. **Traceability**
   - Scan QR codes
   - View product journey
   - View farm origin, harvest date, pack date, dispatch date, delivery date

### API Endpoints
- `GET /api/consumer/profile` - Get consumer profile
- `PATCH /api/consumer/profile` - Update profile
- `GET /api/consumer/addresses` - Get addresses
- `POST /api/consumer/addresses` - Create address
- `PATCH /api/consumer/addresses/:id` - Update address
- `DELETE /api/consumer/addresses/:id` - Delete address
- `PATCH /api/consumer/addresses/:id/default` - Set default address
- `GET /api/consumer/cart` - Get cart
- `POST /api/consumer/cart` - Add to cart
- `PATCH /api/consumer/cart/:productId` - Update quantity
- `DELETE /api/consumer/cart/:productId` - Remove from cart
- `DELETE /api/consumer/cart` - Clear cart
- `GET /api/consumer/orders` - Get orders
- `GET /api/consumer/orders/:orderId` - Get order by ID
- `POST /api/consumer/orders/:orderId/cancel` - Cancel order
- `GET /api/consumer/reviews` - Get reviews
- `GET /api/consumer/products/:productId/reviews` - Get product reviews
- `POST /api/consumer/products/:productId/reviews` - Create review
- `PATCH /api/consumer/reviews/:reviewId` - Update review
- `DELETE /api/consumer/reviews/:reviewId` - Delete review
- `GET /api/consumer/disputes` - Get disputes
- `GET /api/consumer/disputes/:disputeId` - Get dispute by ID
- `POST /api/consumer/orders/:orderId/disputes` - Create dispute

### Database Models
- `User` - User account
- `ConsumerAddress` - Delivery addresses
- `CartItem` - Shopping cart items
- `Order` - Orders
- `OrderItem` - Order items
- `OrderTimelineStep` - Order timeline
- `Review` - Reviews
- `Dispute` - Disputes

### Status
**Fully Implemented**

---

## 4. Admin Module

### Purpose
Enables administrators to oversee platform operations, verify farmers, manage orders, and resolve disputes.

### Components
- **Frontend**:
  - `src/app/admin/dashboard/page.tsx` - Admin dashboard
  - `src/app/admin/farmers/page.tsx` - Farmer management
  - `src/app/admin/farmers/[farmerId]/page.tsx` - Farmer detail
  - `src/app/admin/products/page.tsx` - Product oversight
  - `src/app/admin/orders/page.tsx` - Order oversight
  - `src/app/admin/deliveries/page.tsx` - Delivery monitoring
  - `src/app/admin/disputes/page.tsx` - Dispute resolution
  - `src/app/admin/payouts/page.tsx` - Payout management
  - `src/app/admin/analytics/page.tsx` - Platform analytics
  - `src/app/admin/reviews/page.tsx` - Review moderation
  - `src/app/admin/users/page.tsx` - User management
  - `src/app/admin/layout.tsx` - Admin route guard
  - `src/components/admin/` - Admin components

- **Backend**:
  - `src/routes/admin.routes.ts` - Admin API routes
  - `src/controllers/admin.controller.ts` - Admin request handlers
  - `src/services/admin.service.ts` - Admin business logic

### Features
1. **Farmer Verification**
   - View pending farmer applications
   - Review verification documents
   - Approve farmers
   - Reject farmers with reason
   - View all farmers (pending, approved, rejected)

2. **Platform Dashboard**
   - View platform KPIs (farmers, consumers, orders, revenue)
   - View charts (revenue trends, order trends, farmer registrations)
   - View recent activities
   - View pending verifications
   - View open disputes

3. **Product Oversight**
   - View all products
   - View product details
   - Update product status

4. **Order Oversight**
   - View all orders
   - View order details
   - Update order status

5. **Delivery Monitoring**
   - View delivery batches
   - View batch details
   - Update batch status

6. **Dispute Resolution**
   - View all disputes
   - View dispute details
   - Resolve disputes
   - Reject disputes

7. **Payout Management**
   - View sales records
   - View payout status
   - Mark sales as paid

8. **Review Moderation**
   - View all reviews
   - Moderate reviews

9. **User Management**
   - View all users
   - View user details
   - Activate/deactivate users

10. **Analytics**
    - View platform analytics
    - View trends and metrics

### API Endpoints
- `GET /api/admin/dashboard` - Get dashboard data
- `GET /api/admin/analytics` - Get analytics data
- `GET /api/admin/farmers` - Get all farmers
- `GET /api/admin/farmers/pending` - Get pending farmers
- `GET /api/admin/farmers/:farmerId` - Get farmer by ID
- `POST /api/admin/farmers/:farmerId/approve` - Approve farmer
- `POST /api/admin/farmers/:farmerId/reject` - Reject farmer
- `GET /api/admin/products` - Get all products
- `GET /api/admin/products/:productId` - Get product by ID
- `PATCH /api/admin/products/:productId/status` - Update product status
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/orders/:orderId` - Get order by ID
- `PATCH /api/admin/orders/:orderId/status` - Update order status
- `GET /api/admin/deliveries` - Get delivery batches
- `GET /api/admin/deliveries/:batchId` - Get batch by ID
- `PATCH /api/admin/deliveries/:batchId/status` - Update batch status
- `GET /api/admin/disputes` - Get all disputes
- `GET /api/admin/disputes/:disputeId` - Get dispute by ID
- `PATCH /api/admin/disputes/:disputeId/status` - Update dispute status
- `PATCH /api/admin/disputes/:disputeId/resolve` - Resolve dispute
- `PATCH /api/admin/disputes/:disputeId/reject` - Reject dispute
- `GET /api/admin/sales` - Get all sales
- `GET /api/admin/sales/:saleId` - Get sale by ID
- `PATCH /api/admin/sales/:saleId/payout` - Mark sale as paid
- `GET /api/admin/payouts` - Alias for sales
- `GET /api/admin/reviews` - Get all reviews
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:userId` - Get user by ID
- `PATCH /api/admin/users/:userId/status` - Update user status
- `GET /api/admin/notifications` - Get admin notifications
- `PATCH /api/admin/notifications/:notificationId/read` - Mark as read
- `DELETE /api/admin/notifications/:notificationId` - Delete notification

### Database Models
- `User` - User accounts
- `Farmer` - Farmer profiles
- `Product` - Products
- `Order` - Orders
- `DeliveryBatch` - Delivery batches
- `Dispute` - Disputes
- `Sale` - Sales records
- `Review` - Reviews
- `Notification` - Notifications

### Status
**Fully Implemented**

---

## 5. Marketplace Module

### Purpose
Provides public access to product catalog and farmer directory without authentication.

### Components
- **Frontend**:
  - `src/app/explore/page.tsx` - Product marketplace
  - `src/app/farmers/page.tsx` - Farmer directory
  - `src/app/farmers/[id]/page.tsx` - Farmer profile
  - `src/context/MarketplaceContext.tsx` - Marketplace state

- **Backend**:
  - `src/routes/marketplace.routes.ts` - Marketplace API routes
  - `src/controllers/marketplace.controller.ts` - Marketplace request handlers
  - `src/services/marketplace.service.ts` - Marketplace business logic

### Features
1. **Public Product Catalog**
   - Browse all products
   - Filter by category, price, distance, farming method, organic, rating
   - Sort by recommended, freshest, nearest, price
   - Search products
   - Only shows verified farmers' products

2. **Public Farmer Directory**
   - Browse all farmers
   - Filter by location, farming method, verification status
   - Search farmers
   - Only shows verified and approved farmers

3. **Product Details**
   - View product information
   - View farmer information
   - View traceability timeline
   - View reviews

4. **Farmer Profile**
   - View farmer details
   - View farm story
   - View farming practices
   - View certifications
   - View available products
   - View reviews

### API Endpoints
- `GET /api/products` - Get public products
- `GET /api/products/:id` - Get product by ID
- `GET /api/farmers` - Get public farmers
- `GET /api/farmers/:id` - Get farmer by ID

### Database Models
- `Product` - Products
- `Farmer` - Farmer profiles
- `User` - User accounts
- `Review` - Reviews

### Status
**Fully Implemented**

---

## 6. Order Module

### Purpose
Manages order creation, tracking, and status updates for both consumers and farmers.

### Components
- **Frontend**:
  - `src/app/orders/page.tsx` - Consumer order history
  - `src/app/orders/[id]/page.tsx` - Consumer order detail
  - `src/app/farmer/orders/page.tsx` - Farmer order management
  - `src/app/farmer/orders/[id]/page.tsx` - Farmer order detail
  - `src/components/marketplace/OrderTimeline.tsx` - Order timeline component

- **Backend**:
  - `src/routes/order.routes.ts` - Order API routes
  - `src/controllers/order.controller.ts` - Order request handlers
  - `src/services/order.service.ts` - Order business logic

### Features
1. **Order Creation**
   - Create order from cart
   - Reserve inventory atomically
   - Generate order number
   - Calculate pricing (subtotal, delivery fee, platform fee, total)
   - Create order timeline steps
   - Clear cart

2. **Order Status Workflow**
   - PLACED → CONFIRMED → HARVESTING → PACKED → OUT_FOR_DELIVERY → DELIVERED
   - CANCELLED (can be cancelled before CONFIRMED)

3. **Order Timeline**
   - Track each status change
   - Record timestamps
   - Show progress to consumers and farmers

4. **Order Cancellation**
   - Cancel order before confirmation
   - Restore inventory on cancellation

5. **Order Tracking**
   - Consumers view their order history
   - Farmers view incoming orders
   - Admins view all orders

### API Endpoints
- `POST /api/orders` - Create order
- `GET /api/orders` - Get consumer orders
- `GET /api/orders/:orderId` - Get order by ID
- `POST /api/orders/:orderId/cancel` - Cancel order
- `GET /api/farmer/orders` - Get farmer orders
- `GET /api/farmer/orders/:orderId` - Get farmer order by ID
- `PATCH /api/farmer/orders/:orderId/status` - Update order status

### Database Models
- `Order` - Orders
- `OrderItem` - Order items
- `OrderTimelineStep` - Order timeline
- `InventoryItem` - Inventory (for reservation)

### Status
**Fully Implemented**

---

## 7. Cart Module

### Purpose
Manages shopping cart functionality for consumers.

### Components
- **Frontend**:
  - `src/app/cart/page.tsx` - Cart page
  - `src/context/MarketplaceContext.tsx` - Cart state management

- **Backend**:
  - `src/routes/cart.routes.ts` - Cart API routes (part of consumer routes)
  - `src/controllers/cart.controller.ts` - Cart request handlers
  - `src/services/cart.service.ts` - Cart business logic

### Features
1. **Add to Cart**
   - Add product to cart
   - Set initial quantity
   - Generate line key for compound unique constraint

2. **Update Quantity**
   - Increase or decrease quantity
   - Recalculate subtotal

3. **Remove from Cart**
   - Remove item from cart
   - Recalculate subtotal

4. **Clear Cart**
   - Clear all items after order placement

5. **Cart Persistence**
   - Cart stored in database
   - Retrieved on login
   - Unique constraint per user and line key

### API Endpoints
- `GET /api/consumer/cart` - Get cart
- `POST /api/consumer/cart` - Add to cart
- `PATCH /api/consumer/cart/:productId` - Update quantity
- `DELETE /api/consumer/cart/:productId` - Remove from cart
- `DELETE /api/consumer/cart` - Clear cart

### Database Models
- `CartItem` - Cart items
- `User` - User accounts
- `Product` - Products
- `SurplusOffer` - Surplus offers

### Status
**Fully Implemented**

---

## 8. Inventory Module

### Purpose
Manages farmer inventory levels with logging and alerts.

### Components
- **Frontend**:
  - `src/app/farmer/inventory/page.tsx` - Inventory management page
  - `src/components/farmer/InventoryTable.tsx` - Inventory table component
  - `src/components/farmer/StockUpdateModal.tsx` - Stock update modal

- **Backend**:
  - `src/routes/inventory.routes.ts` - Inventory API routes
  - `src/controllers/inventory.controller.ts` - Inventory request handlers
  - `src/services/inventory.service.ts` - Inventory business logic

### Features
1. **Inventory Tracking**
   - Track current stock per product
   - Track available quantity (current - reserved)
   - Track reserved quantity (for orders)
   - Track sold quantity

2. **Stock Updates**
   - Add stock (harvest incoming)
   - Remove stock (spoilage/discard)
   - Adjust stock (correction)
   - Order reservation (when order placed)
   - Order fulfillment (when order delivered)

3. **Inventory Logging**
   - Log all inventory changes
   - Record change type, amount, new quantity, reason
   - Audit trail for inventory operations

4. **Low Stock Alerts**
   - Define threshold per product
   - Alert when stock falls below threshold
   - Status tracking (IN_STOCK, LOW_STOCK, OUT_OF_STOCK, EXPIRED)

### API Endpoints
- `GET /api/farmer/inventory` - Get farmer inventory
- `GET /api/farmer/inventory/:productId` - Get inventory by product
- `PATCH /api/farmer/inventory/:productId` - Update stock

### Database Models
- `InventoryItem` - Inventory records
- `InventoryLog` - Inventory change logs
- `Product` - Products
- `Farmer` - Farmers

### Status
**Fully Implemented**

---

## 9. Harvest Module

### Purpose
Manages harvest batch recording, QR code generation, and traceability event logging.

### Components
- **Frontend**:
  - `src/app/farmer/harvests/page.tsx` - Harvest records page
  - `src/app/farmer/harvests/new/page.tsx` - Create harvest page
  - `src/app/farmer/harvests/[id]/page.tsx` - Harvest detail page
  - `src/app/trace/[batchId]/page.tsx` - Public traceability page
  - `src/components/farmer/HarvestCard.tsx` - Harvest card component
  - `src/components/farmer/HarvestTimeline.tsx` - Harvest timeline component
  - `src/components/farmer/QRCodeDisplay.tsx` - QR code display component
  - `src/components/marketplace/TraceabilityTimeline.tsx` - Traceability timeline component

- **Backend**:
  - `src/routes/harvest.routes.ts` - Harvest API routes
  - `src/controllers/harvest.controller.ts` - Harvest request handlers
  - `src/services/harvest.service.ts` - Harvest business logic
  - `src/routes/trace.routes.ts` - Public traceability routes

### Features
1. **Harvest Recording**
   - Record harvest batch with unique batch number
   - Link to product and farmer
   - Record harvest date and quantity
   - Set expected shelf life
   - Generate QR code

2. **QR Code Generation**
   - Generate unique QR code for each batch
   - QR code contains URL to traceability endpoint
   - QR code displayed to consumers

3. **Traceability Events**
   - Record farm origin event
   - Record harvest event
   - Record pack event
   - Record dispatch event
   - Record delivery event
   - Each event has location, timestamp, and details

4. **Public Traceability**
   - Public endpoint accessible via QR code
   - No authentication required
   - Returns complete journey timeline

### API Endpoints
- `GET /api/farmer/harvests` - Get farmer harvests
- `GET /api/farmer/harvests/:id` - Get harvest by ID
- `POST /api/farmer/harvests` - Create harvest batch
- `GET /api/farmer/harvests/:batchId/traceability` - Get traceability events
- `POST /api/farmer/harvests/:batchId/traceability` - Add traceability event
- `GET /api/trace/:batchId` - Public traceability endpoint

### Database Models
- `HarvestBatch` - Harvest batches
- `TraceabilityEvent` - Traceability events
- `Product` - Products
- `Farmer` - Farmers

### Status
**Fully Implemented**

---

## 10. Surplus Module

### Purpose
Enables farmers to create time-limited surplus discount offers to reduce food waste.

### Components
- **Frontend**:
  - `src/app/farmer/surplus/page.tsx` - Farmer surplus management page
  - `src/app/surplus/page.tsx` - Public surplus marketplace page
  - `src/context/FarmerContext.tsx` - Surplus state in farmer context
  - `src/context/MarketplaceContext.tsx` - Surplus state in marketplace context

- **Backend**:
  - `src/routes/surplus.routes.ts` - Farmer surplus API routes
  - `src/routes/public-surplus.routes.ts` - Public surplus API routes
  - `src/controllers/surplus.controller.ts` - Surplus request handlers
  - `src/services/surplus.service.ts` - Surplus business logic

### Features
1. **Surplus Offer Creation**
   - Select product
   - Set available quantity
   - Set discount percentage (20-50%)
   - Set expiry date
   - Provide reason for surplus
   - Generate unique offer code

2. **Surplus Offer Management**
   - View active surplus offers
   - Update surplus offers
   - Cancel surplus offers

3. **Surplus Expiry**
   - Auto-expire offers after expiry date
   - Change status from ACTIVE to EXPIRED

4. **Public Surplus Marketplace**
   - Browse active surplus offers
   - View discounted prices
   - Add surplus items to cart
   - Standard checkout flow

### API Endpoints
- `GET /api/farmer/surplus` - Get farmer surplus offers
- `GET /api/farmer/surplus/:id` - Get surplus offer by ID
- `POST /api/farmer/surplus` - Create surplus offer
- `PATCH /api/farmer/surplus/:id` - Update surplus offer
- `DELETE /api/farmer/surplus/:id` - Cancel surplus offer
- `GET /api/surplus` - Get public surplus offers
- `GET /api/surplus/:id` - Get public surplus offer by ID

### Database Models
- `SurplusOffer` - Surplus offers
- `Product` - Products
- `HarvestBatch` - Harvest batches
- `Farmer` - Farmers
- `CartItem` - Cart items
- `OrderItem` - Order items

### Status
**Fully Implemented**

---

## 11. Delivery Module

### Purpose
Manages delivery batch creation, order assignment, and status tracking for hyperlocal delivery.

### Components
- **Frontend**:
  - `src/app/farmer/deliveries/page.tsx` - Farmer delivery management page
  - `src/app/farmer/deliveries/[id]/page.tsx` - Delivery batch detail page
  - `src/app/admin/deliveries/page.tsx` - Admin delivery monitoring page
  - `src/app/admin/deliveries/[batchId]/page.tsx` - Admin delivery batch detail page
  - `src/components/farmer/` - Delivery-related components

- **Backend**:
  - `src/routes/farmer-delivery.routes.ts` - Farmer delivery API routes
  - `src/controllers/delivery.controller.ts` - Delivery request handlers
  - `src/services/delivery.service.ts` - Delivery business logic

### Features
1. **Delivery Batch Creation**
   - Create batch with unique batch code
   - Set hub area (delivery location)
   - Set delivery slot (time window)
   - Set initial status as PENDING

2. **Order Assignment**
   - Assign orders to batch
   - Link orders to delivery batch
   - Update order delivery batch ID

3. **Auto-Create Batches**
   - Group orders by hub area
   - Group orders by delivery slot
   - Auto-create batches for each combination
   - Hyperlocal optimization

4. **Delivery Status Workflow**
   - PENDING → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
   - CANCELLED

5. **Delivery Timeline**
   - Track each status change
   - Record timestamps
   - Show progress to farmers and admins

### API Endpoints
- `POST /api/farmer/deliveries/batches` - Create delivery batch
- `POST /api/farmer/deliveries/batches/:batchId/orders` - Assign orders to batch
- `POST /api/farmer/deliveries/batches/auto-create` - Auto-create batches
- `GET /api/farmer/deliveries/batches` - Get delivery batches
- `GET /api/farmer/deliveries/batches/:batchId` - Get batch by ID
- `PATCH /api/farmer/deliveries/batches/:batchId/status` - Update batch status

### Database Models
- `DeliveryBatch` - Delivery batches
- `DeliveryBatchTimelineStep` - Delivery timeline
- `Order` - Orders
- `ConsumerAddress` - Consumer addresses

### Status
**Fully Implemented**

---

## 12. Sale Module

### Purpose
Manages sales records for farmer payouts and revenue tracking.

### Components
- **Frontend**:
  - `src/app/farmer/sales/page.tsx` - Farmer sales analytics page
  - `src/app/admin/payouts/page.tsx` - Admin payout management page
  - `src/app/admin/sales/page.tsx` - Admin sales oversight page
  - `src/context/FarmerContext.tsx` - Sales state in farmer context

- **Backend**:
  - `src/routes/farmer-sale.routes.ts` - Farmer sales API routes
  - `src/controllers/sale.controller.ts` - Sale request handlers
  - `src/services/sale.service.ts` - Sale business logic

### Features
1. **Sale Record Creation**
   - Create sale when order is delivered
   - Generate unique sale code
   - Record order ID, farmer ID, product name
   - Record quantity, unit, revenue
   - Set initial status as PENDING_PAYOUT

2. **Sales Summary**
   - Aggregate sales by farmer
   - Calculate total revenue
   - Calculate pending payouts
   - Calculate paid payouts
   - Show trends and charts

3. **Payout Management**
   - Admin views all sales
   - Admin marks sales as PAID_OUT
   - Record payout date
   - Record transaction reference

4. **Sale Status Workflow**
   - COMPLETED - Sale completed
   - PENDING_PAYOUT - Awaiting payout
   - PAID_OUT - Paid to farmer
   - REFUNDED - Refunded to consumer

### API Endpoints
- `GET /api/farmer/sales` - Get farmer sales
- `GET /api/farmer/sales/summary` - Get sales summary
- `GET /api/admin/sales` - Get all sales
- `GET /api/admin/sales/:saleId` - Get sale by ID
- `PATCH /api/admin/sales/:saleId/payout` - Mark sale as paid
- `GET /api/admin/payouts` - Alias for sales

### Database Models
- `Sale` - Sales records
- `Order` - Orders
- `OrderItem` - Order items
- `Farmer` - Farmers

### Status
**Fully Implemented**

---

## 13. Notification Module

### Purpose
Manages user notifications for platform events.

### Components
- **Frontend**:
  - `src/app/farmer/notifications/page.tsx` - Farmer notification center
  - `src/app/admin/notifications/page.tsx` - Admin notification center
  - `src/components/common/NotificationDropdown.tsx` - Notification dropdown
  - `src/context/AuthContext.tsx` - Notification state

- **Backend**:
  - `src/routes/farmer-notification.routes.ts` - Farmer notification API routes
  - `src/controllers/notification.controller.ts` - Notification request handlers
  - `src/services/notification.service.ts` - Notification business logic

### Features
1. **Notification Creation**
   - Create notifications for events
   - Set notification type (ORDER, INVENTORY, REVIEW, SYSTEM, VERIFICATION, DELIVERY, DISPUTE)
   - Set title and message
   - Set link to relevant page

2. **Notification Delivery**
   - Deliver notifications to users
   - Notify all admins for platform events
   - Notify farmers for order events
   - Notify consumers for order updates

3. **Read/Unread Status**
   - Track read/unread status
   - Mark as read
   - Mark all as read
   - Get unread count

4. **Notification Management**
   - View notifications
   - Delete notifications
   - Clear all notifications

### API Endpoints
- `GET /api/farmer/notifications` - Get farmer notifications
- `GET /api/farmer/notifications/:id` - Get notification by ID
- `POST /api/farmer/notifications/mark-all-read` - Mark all as read
- `PATCH /api/farmer/notifications/:id/read` - Mark as read
- `GET /api/admin/notifications` - Get admin notifications
- `GET /api/admin/notifications/unread-count` - Get unread count
- `PATCH /api/admin/notifications/:notificationId/read` - Mark as read
- `PATCH /api/admin/notifications/read-all` - Mark all as read
- `DELETE /api/admin/notifications/:notificationId` - Delete notification
- `DELETE /api/admin/notifications` - Clear all notifications

### Database Models
- `Notification` - Notifications
- `User` - User accounts

### Status
**Fully Implemented**

---

## 14. Review Module

### Purpose
Enables consumers to review products and farmers, building trust and providing feedback.

### Components
- **Frontend**:
  - Product detail pages include review section
  - Farmer profile pages include review section
  - `src/components/marketplace/RatingStars.tsx` - Rating display component

- **Backend**:
  - Review management is part of consumer routes
  - `src/controllers/consumer.controller.ts` - Review request handlers
  - `src/services/consumer.service.ts` - Review business logic

### Features
1. **Product Reviews**
   - Consumers review products
   - Rating (1-5 stars)
   - Comment text
   - Verified purchase flag

2. **Farmer Reviews**
   - Consumers review farmers
   - Rating (1-5 stars)
   - Comment text
   - Verified purchase flag

3. **Review Management**
   - Create reviews
   - Update reviews
   - Delete reviews
   - View reviews by product
   - View reviews by farmer
   - View consumer's reviews

4. **Rating Aggregation**
   - Calculate average rating
   - Count total reviews
   - Display on product and farmer profiles

### API Endpoints
- `GET /api/consumer/reviews` - Get consumer's reviews
- `GET /api/consumer/products/:productId/reviews` - Get product reviews
- `POST /api/consumer/products/:productId/reviews` - Create review
- `PATCH /api/consumer/reviews/:reviewId` - Update review
- `DELETE /api/consumer/reviews/:reviewId` - Delete review
- `GET /api/admin/reviews` - Get all reviews (admin)

### Database Models
- `Review` - Reviews
- `User` - User accounts
- `Farmer` - Farmers
- `Product` - Products

### Status
**Fully Implemented**

---

## 15. Dispute Module

### Purpose
Enables consumers to create disputes for problematic orders and enables admins to resolve them.

### Components
- **Frontend**:
  - Order detail pages include dispute creation
  - `src/app/admin/disputes/page.tsx` - Admin dispute resolution page
  - `src/app/admin/disputes/[disputeId]/page.tsx` - Admin dispute detail page

- **Backend**:
  - Dispute management is part of consumer and admin routes
  - `src/controllers/consumer.controller.ts` - Dispute request handlers
  - `src/controllers/admin.controller.ts` - Dispute resolution handlers
  - `src/services/consumer.service.ts` - Dispute business logic
  - `src/services/admin.service.ts` - Dispute resolution business logic

### Features
1. **Dispute Creation**
   - Consumers create disputes for orders
   - Select dispute reason
   - Specify amount
   - Provide description
   - Set initial status as OPEN

2. **Dispute Status Workflow**
   - OPEN → UNDER_REVIEW → RESOLVED / REJECTED

3. **Dispute Resolution**
   - Admin views disputes
   - Admin reviews dispute details
   - Admin resolves dispute with resolution text
   - Admin rejects dispute with reason

4. **Dispute Tracking**
   - Consumers view their disputes
   - Track dispute status
   - View resolution

### API Endpoints
- `GET /api/consumer/disputes` - Get consumer's disputes
- `GET /api/consumer/disputes/:disputeId` - Get dispute by ID
- `POST /api/consumer/orders/:orderId/disputes` - Create dispute
- `GET /api/admin/disputes` - Get all disputes
- `GET /api/admin/disputes/:disputeId` - Get dispute by ID
- `PATCH /api/admin/disputes/:disputeId/status` - Update dispute status
- `PATCH /api/admin/disputes/:disputeId/resolve` - Resolve dispute
- `PATCH /api/admin/disputes/:disputeId/reject` - Reject dispute

### Database Models
- `Dispute` - Disputes
- `Order` - Orders
- `User` - User accounts

### Status
**Fully Implemented**

---

## Module Summary

| Module | Status | Frontend Pages | Backend Endpoints | Database Models |
|--------|--------|----------------|-------------------|-----------------|
| Authentication | Fully Implemented | 5 | 5 | 2 |
| Farmer | Fully Implemented | 15 | 25+ | 13 |
| Consumer | Fully Implemented | 9 | 20+ | 7 |
| Admin | Fully Implemented | 12 | 40+ | 9 |
| Marketplace | Fully Implemented | 3 | 4 | 4 |
| Order | Fully Implemented | 4 | 7 | 4 |
| Cart | Fully Implemented | 1 | 5 | 4 |
| Inventory | Fully Implemented | 1 | 3 | 2 |
| Harvest | Fully Implemented | 4 | 6 | 2 |
| Surplus | Fully Implemented | 2 | 7 | 5 |
| Delivery | Fully Implemented | 4 | 6 | 2 |
| Sale | Fully Implemented | 2 | 5 | 4 |
| Notification | Fully Implemented | 2 | 10 | 1 |
| Review | Fully Implemented | Integrated | 5 | 4 |
| Dispute | Fully Implemented | Integrated | 7 | 3 |

**Total Modules**: 15
**Fully Implemented**: 15
**Partially Implemented**: 0
**Not Implemented**: 0

---

**End of Modules Documentation**
