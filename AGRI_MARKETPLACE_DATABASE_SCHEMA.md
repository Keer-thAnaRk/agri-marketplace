# Krishi Market - Database Schema Documentation

---

## Table of Contents

1. [Database Overview](#database-overview)
2. [Enums](#enums)
3. [Models](#models)
4. [Relationships](#relationships)
5. [Indexes](#indexes)
6. [Constraints](#constraints)

---

## Database Overview

**Database Type**: PostgreSQL
**ORM**: Prisma 6.19.3
**Total Models**: 25
**Total Enums**: 16

**Model Categories**:
- User Management (3 models)
- Farmer Management (2 models)
- Product Management (3 models)
- Harvest Management (2 models)
- Surplus Management (1 model)
- Order Management (3 models)
- Delivery Management (2 models)
- Sales Management (1 model)
- Consumer Management (1 model)
- Review Management (1 model)
- Dispute Management (1 model)
- Cart Management (1 model)
- Notification Management (1 model)

---

## Enums

### UserRole
```prisma
enum UserRole {
  ADMIN
  FARMER
  CONSUMER
}
```
**Purpose**: Defines user roles for access control

### VerificationStatus
```prisma
enum VerificationStatus {
  PENDING
  APPROVED
  REJECTED
}
```
**Purpose**: Farmer verification status

### FarmingMethod
```prisma
enum FarmingMethod {
  ORGANIC
  NATURAL_ZBNF
  HYDROPONIC
  REGENERATIVE
  PESTICIDE_FREE
  TRADITIONAL
  CONVENTIONAL
  MIXED
}
```
**Purpose**: Farming practices classification

### ProductStatus
```prisma
enum ProductStatus {
  ACTIVE
  DRAFT
  OUT_OF_STOCK
  EXPIRED
}
```
**Purpose**: Product listing status

### ProductCategory
```prisma
enum ProductCategory {
  VEGETABLES
  FRUITS
  DAIRY
  GRAINS
  PULSES
  EGGS
  HERBS
  SPICES
  ORGANIC_SPECIALTY
  OTHER
}
```
**Purpose**: Product categorization

### HarvestStatus
```prisma
enum HarvestStatus {
  AVAILABLE
  LOW_STOCK
  SOLD_OUT
  SURPLUS
  EXPIRED
  DEPLETED
}
```
**Purpose**: Harvest batch availability status

### TraceabilityStep
```prisma
enum TraceabilityStep {
  FARM_ORIGIN
  HARVEST
  PACK
  DISPATCH
  DELIVERY
}
```
**Purpose**: Traceability timeline steps

### SurplusOfferStatus
```prisma
enum SurplusOfferStatus {
  ACTIVE
  CLAIMED
  EXPIRED
  CANCELLED
}
```
**Purpose**: Surplus offer status

### InventoryStatus
```prisma
enum InventoryStatus {
  IN_STOCK
  LOW_STOCK
  OUT_OF_STOCK
  EXPIRED
}
```
**Purpose**: Inventory availability status

### InventoryLogType
```prisma
enum InventoryLogType {
  ADD
  REMOVE
  ADJUSTMENT
  ORDER_RESERVED
  ORDER_FULFILLED
  HARVEST_INCOMING
  SPOILAGE_DISCARD
}
```
**Purpose**: Inventory change types

### OrderStatus
```prisma
enum OrderStatus {
  PLACED
  CONFIRMED
  HARVESTING
  PACKED
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
}
```
**Purpose**: Order workflow status

### PaymentMethod
```prisma
enum PaymentMethod {
  UPI
  CARD
  CASH_ON_DELIVERY
}
```
**Purpose**: Payment method options

### PaymentStatus
```prisma
enum PaymentStatus {
  PENDING
  PAID
  REFUNDED
}
```
**Purpose**: Payment transaction status

### DeliveryBatchStatus
```prisma
enum DeliveryBatchStatus {
  PENDING
  PREPARING
  READY
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
}
```
**Purpose**: Delivery batch workflow status

### SaleStatus
```prisma
enum SaleStatus {
  COMPLETED
  PENDING_PAYOUT
  PAID_OUT
  REFUNDED
}
```
**Purpose**: Sale payout status

### NotificationType
```prisma
enum NotificationType {
  ORDER
  INVENTORY
  REVIEW
  SYSTEM
  VERIFICATION
  DELIVERY
  DISPUTE
}
```
**Purpose**: Notification categorization

### DocumentType
```prisma
enum DocumentType {
  GOVERNMENT_ID
  LAND_OWNERSHIP_RTC
  FARM_PHOTO
  ORGANIC_CERTIFICATE
  WATER_TEST_REPORT
  OTHER
}
```
**Purpose**: Verification document types

### DisputeStatus
```prisma
enum DisputeStatus {
  OPEN
  UNDER_REVIEW
  RESOLVED
  REJECTED
}
```
**Purpose**: Dispute resolution status

---

## Models

### 1. User

**Purpose**: Central user account model for all platform users (consumers, farmers, admins)

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| email | String | @unique | User email address |
| passwordHash | String | - | Bcrypt-hashed password |
| name | String | - | User full name |
| phone | String? | Optional | Phone number |
| avatar | String? | Optional | Profile image URL |
| role | UserRole | @default(CONSUMER) | User role (CONSUMER, FARMER, ADMIN) |
| isActive | Boolean | @default(true) | Account active status |
| createdAt | DateTime | @default(now()) | Account creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |
| settings | Json? | Optional | User preferences (JSON) |

**Relationships**:
- cartItems (1:N) → CartItem
- addresses (1:N) → ConsumerAddress
- disputes (1:N) → Dispute
- approvedFarmers (1:N) → Farmer (as approver)
- farmer (1:1) → Farmer (as profile)
- notifications (1:N) → Notification
- orders (1:N) → Order
- reviews (1:N) → Review

**Indexes**:
- [email]
- [role]

---

### 2. Farmer

**Purpose**: Extended profile for farmers with farm details and verification status

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| userId | String | @unique | Foreign key to User |
| farmName | String | - | Farm name |
| farmLocation | String | - | Farm location description |
| location | String | - | Geographic location |
| city | String | @default("Bengaluru") | City |
| state | String | @default("Karnataka") | State |
| pincode | String | - | Postal code |
| hub | String | - | Delivery hub |
| distanceKm | Decimal? | @default(2.5), @db.Decimal(5, 2) | Distance from hub (km) |
| farmingMethod | FarmingMethod | @default(ORGANIC) | Farming practice |
| yearsFarming | Int | @default(1) | Years of farming experience |
| acreage | Decimal | @default(5.0), @db.Decimal(6, 2) | Farm size in acres |
| mainCrops | String[] | - | List of main crops |
| farmDescription | String? | Optional | Farm description |
| story | String? | Optional | Farmer story |
| soilPractices | String[] | - | Soil management practices |
| waterSource | String? | Optional | Water source |
| certifications | String[] | - | Certifications held |
| coverImage | String? | Optional | Cover image URL |
| gallery | String[] | - | Image gallery URLs |
| rating | Decimal | @default(5.0), @db.Decimal(3, 2) | Average rating |
| reviewCount | Int | @default(0) | Total review count |
| totalProductsCount | Int | @default(0) | Total products listed |
| farmSinceYear | Int? | Optional | Year farming started |
| isVerified | Boolean | @default(false) | Verification status flag |
| verificationStatus | VerificationStatus | @default(PENDING) | Verification status |
| rejectionReason | String? | Optional | Rejection reason |
| registeredAt | DateTime | @default(now()) | Registration timestamp |
| approvedAt | DateTime? | Optional | Approval timestamp |
| approvedById | String? | Optional | Approver admin ID |
| verifiedDate | DateTime? | Optional | Verification date |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships**:
- approvedBy (N:1) → User (approver)
- user (N:1) → User (profile)
- verificationDocuments (1:N) → FarmerDocument
- harvestBatches (1:N) → HarvestBatch
- inventoryItems (1:N) → InventoryItem
- orderItems (1:N) → OrderItem
- products (1:N) → Product
- reviews (1:N) → Review
- sales (1:N) → Sale
- surplusOffers (1:N) → SurplusOffer

**Indexes**:
- [verificationStatus]
- [hub]
- [city]
- [approvedById]

---

### 3. FarmerDocument

**Purpose**: Verification documents uploaded by farmers

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| farmerId | String | - | Foreign key to Farmer |
| type | DocumentType | - | Document type |
| title | String | - | Document title |
| fileUrl | String | - | Document file URL |
| fileName | String | - | Original filename |
| fileSize | Int? | Optional | File size in bytes |
| mimeType | String? | Optional | MIME type |
| isVerified | Boolean | @default(false) | Verification status |
| notes | String? | Optional | Admin notes |
| createdAt | DateTime | @default(now()) | Upload timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships**:
- farmer (N:1) → Farmer

**Indexes**:
- [farmerId]
- [type]

---

### 4. Product

**Purpose**: Product listings created by farmers

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| farmerId | String | - | Foreign key to Farmer |
| name | String | - | Product name |
| category | ProductCategory | @default(VEGETABLES) | Product category |
| description | String | - | Product description |
| price | Decimal | @db.Decimal(10, 2) | Price per unit |
| unit | String | - | Unit name (kg, bunch, etc.) |
| unitShort | String | - | Short unit symbol |
| images | String[] | - | Product image URLs |
| shelfLifeDays | Int | @default(6) | Expected shelf life in days |
| expectedFreshnessDuration | String? | Optional | Freshness duration text |
| harvestDate | DateTime? | Optional | Harvest date |
| farmDistanceKm | Decimal? | @default(2.5), @db.Decimal(5, 2) | Distance from farm (km) |
| isOrganic | Boolean | @default(true) | Organic certification flag |
| farmingMethod | FarmingMethod | @default(ORGANIC) | Farming method |
| status | ProductStatus | @default(ACTIVE) | Listing status |
| inStock | Boolean | @default(true) | Stock availability |
| availableQuantity | Decimal | @default(0), @db.Decimal(10, 2) | Available quantity |
| reservedQuantity | Decimal | @default(0), @db.Decimal(10, 2) | Reserved for orders |
| soldQuantity | Decimal | @default(0), @db.Decimal(10, 2) | Total sold quantity |
| lowStockThreshold | Decimal | @default(10), @db.Decimal(10, 2) | Low stock threshold |
| rating | Decimal | @default(5.0), @db.Decimal(3, 2) | Average rating |
| reviewsCount | Int | @default(0) | Total review count |
| nutritionHighlights | String[] | - | Nutrition highlights |
| createdAt | DateTime | @default(now()) | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships**:
- farmer (N:1) → Farmer
- cartItems (1:N) → CartItem
- harvestBatches (1:N) → HarvestBatch
- inventory (1:1) → InventoryItem
- orderItems (1:N) → OrderItem
- reviews (1:N) → Review
- surplusOffers (1:N) → SurplusOffer

**Indexes**:
- [farmerId]
- [category]
- [status]
- [inStock]

---

### 5. InventoryItem

**Purpose**: Inventory records for farmer products

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| productId | String | @unique | Foreign key to Product |
| farmerId | String | - | Foreign key to Farmer |
| currentStock | Decimal | @default(0), @db.Decimal(10, 2) | Current stock level |
| availableQuantity | Decimal | @default(0), @db.Decimal(10, 2) | Available for sale |
| reservedQuantity | Decimal | @default(0), @db.Decimal(10, 2) | Reserved for orders |
| soldQuantity | Decimal | @default(0), @db.Decimal(10, 2) | Total sold |
| threshold | Decimal | @default(15), @db.Decimal(10, 2) | Low stock threshold |
| status | InventoryStatus | @default(IN_STOCK) | Inventory status |
| lastUpdated | DateTime | @default(now()), @updatedAt | Last update timestamp |
| createdAt | DateTime | @default(now()) | Creation timestamp |

**Relationships**:
- farmer (N:1) → Farmer
- product (N:1) → Product
- logs (1:N) → InventoryLog

**Indexes**:
- [farmerId]
- [status]

---

### 6. InventoryLog

**Purpose**: Audit log for inventory changes

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| inventoryItemId | String | - | Foreign key to InventoryItem |
| type | InventoryLogType | - | Change type |
| amount | Decimal | @db.Decimal(10, 2) | Amount changed |
| newQuantity | Decimal | @db.Decimal(10, 2) | New quantity after change |
| reason | String | - | Reason for change |
| createdAt | DateTime | @default(now()) | Change timestamp |

**Relationships**:
- inventoryItem (N:1) → InventoryItem

**Indexes**:
- [inventoryItemId]
- [createdAt]

---

### 7. HarvestBatch

**Purpose**: Harvest batch records with QR codes for traceability

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| batchNumber | String | @unique | Unique batch number |
| farmerId | String | - | Foreign key to Farmer |
| productId | String | - | Foreign key to Product |
| harvestDate | DateTime | - | Harvest date |
| quantity | Decimal | @db.Decimal(10, 2) | Harvest quantity |
| availableQuantity | Decimal | @db.Decimal(10, 2) | Available quantity |
| unit | String | - | Unit of measurement |
| farmingMethod | FarmingMethod | @default(ORGANIC) | Farming method |
| location | String? | Optional | Harvest location |
| expectedShelfLifeDays | Int | @default(6) | Expected shelf life |
| expectedFreshness | Int | @default(95) | Expected freshness % |
| status | HarvestStatus | @default(AVAILABLE) | Batch status |
| qrCodeUrl | String? | Optional | QR code URL |
| notes | String? | Optional | Notes |
| createdAt | DateTime | @default(now()) | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships**:
- farmer (N:1) → Farmer
- product (N:1) → Product
- surplusOffers (1:N) → SurplusOffer
- traceabilityEvents (1:N) → TraceabilityEvent

**Indexes**:
- [farmerId]
- [productId]
- [batchNumber]
- [harvestDate]

---

### 8. TraceabilityEvent

**Purpose**: Traceability timeline events for harvest batches

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| batchId | String | - | Foreign key to HarvestBatch |
| step | TraceabilityStep | - | Timeline step |
| title | String | - | Event title |
| location | String | - | Event location |
| timestamp | DateTime | - | Event timestamp |
| details | String | - | Event details |
| completed | Boolean | @default(true) | Completion status |
| verifiedBy | String? | Optional | Verifier ID |
| actor | String? | Optional | Actor name |
| orderIndex | Int | @default(0) | Display order |
| createdAt | DateTime | @default(now()) | Creation timestamp |

**Relationships**:
- batch (N:1) → HarvestBatch

**Indexes**:
- [batchId]
- [orderIndex]

---

### 9. SurplusOffer

**Purpose**: Time-limited surplus discount offers

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| offerCode | String | @unique | Unique offer code |
| farmerId | String | - | Foreign key to Farmer |
| productId | String | - | Foreign key to Product |
| batchId | String? | Optional | Foreign key to HarvestBatch |
| availableQuantity | Decimal | @db.Decimal(10, 2) | Available quantity |
| unit | String | - | Unit of measurement |
| originalPrice | Decimal | @db.Decimal(10, 2) | Original price |
| discountPercent | Int | - | Discount percentage |
| offerPrice | Decimal | @db.Decimal(10, 2) | Discounted price |
| expiryDate | DateTime | - | Expiry date |
| reason | String | - | Reason for surplus |
| status | SurplusOfferStatus | @default(ACTIVE) | Offer status |
| createdAt | DateTime | @default(now()) | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships**:
- farmer (N:1) → Farmer
- product (N:1) → Product
- batch (N:1) → HarvestBatch
- cartItems (1:N) → CartItem
- orderItems (1:N) → OrderItem

**Indexes**:
- [farmerId]
- [productId]
- [status]
- [expiryDate]

---

### 10. ConsumerAddress

**Purpose**: Delivery addresses for consumers

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| userId | String | - | Foreign key to User |
| name | String | - | Recipient name |
| phone | String | - | Recipient phone |
| addressLine | String | - | Address line |
| city | String | @default("Bengaluru") | City |
| state | String | @default("Karnataka") | State |
| pincode | String | - | Postal code |
| hub | String | - | Delivery hub |
| isDefault | Boolean | @default(false) | Default address flag |
| createdAt | DateTime | @default(now()) | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships**:
- user (N:1) → User
- orders (1:N) → Order

**Indexes**:
- [userId]
- [hub]

---

### 11. Order

**Purpose**: Consumer orders

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| orderNumber | String | @unique | Human-readable order number |
| consumerId | String | - | Foreign key to User (consumer) |
| addressId | String? | Optional | Foreign key to ConsumerAddress |
| deliverySlotName | String | - | Delivery slot name |
| deliverySlotRange | String | - | Delivery time range |
| status | OrderStatus | @default(PLACED) | Order status |
| subtotal | Decimal | @db.Decimal(10, 2) | Subtotal |
| deliveryFee | Decimal | @default(0), @db.Decimal(10, 2) | Delivery fee |
| platformFee | Decimal | @default(0), @db.Decimal(10, 2) | Platform fee |
| farmerEarnings | Decimal | @default(0), @db.Decimal(10, 2) | Total farmer earnings |
| total | Decimal | @db.Decimal(10, 2) | Total amount |
| paymentMethod | PaymentMethod | @default(UPI) | Payment method |
| paymentStatus | PaymentStatus | @default(PENDING) | Payment status |
| deliveryBatchId | String? | Optional | Foreign key to DeliveryBatch |
| estimatedDelivery | DateTime? | Optional | Estimated delivery time |
| deliveredAt | DateTime? | Optional | Actual delivery time |
| createdAt | DateTime | @default(now()) | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships**:
- consumer (N:1) → User
- address (N:1) → ConsumerAddress
- deliveryBatch (N:1) → DeliveryBatch
- disputes (1:N) → Dispute
- items (1:N) → OrderItem
- timeline (1:N) → OrderTimelineStep
- sales (1:N) → Sale

**Indexes**:
- [consumerId]
- [status]
- [deliveryBatchId]
- [createdAt]

---

### 12. OrderItem

**Purpose**: Individual items within an order

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| orderId | String | - | Foreign key to Order |
| productId | String? | Optional | Foreign key to Product |
| farmerId | String | - | Foreign key to Farmer |
| productName | String | - | Product name (snapshot) |
| productImage | String | - | Product image (snapshot) |
| farmerName | String | - | Farmer name (snapshot) |
| farmName | String | - | Farm name (snapshot) |
| unitPrice | Decimal | @db.Decimal(10, 2) | Unit price (snapshot) |
| quantity | Decimal | @db.Decimal(10, 2) | Quantity |
| unit | String | - | Unit |
| totalPrice | Decimal | @db.Decimal(10, 2) | Total price |
| createdAt | DateTime | @default(now()) | Creation timestamp |
| surplusOfferId | String? | Optional | Foreign key to SurplusOffer |

**Relationships**:
- farmer (N:1) → Farmer
- order (N:1) → Order
- product (N:1) → Product
- surplusOffer (N:1) → SurplusOffer
- sales (1:N) → Sale

**Indexes**:
- [orderId]
- [farmerId]
- [productId]
- [surplusOfferId]

---

### 13. OrderTimelineStep

**Purpose**: Order status timeline

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| orderId | String | - | Foreign key to Order |
| status | OrderStatus | - | Order status |
| label | String | - | Status label |
| description | String | - | Status description |
| isCompleted | Boolean | @default(false) | Completion flag |
| isCurrent | Boolean | @default(false) | Current status flag |
| timestamp | DateTime | @default(now()) | Status timestamp |

**Relationships**:
- order (N:1) → Order

**Indexes**:
- [orderId]

---

### 14. DeliveryBatch

**Purpose**: Delivery batches for order grouping

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| batchCode | String | @unique | Unique batch code |
| hubArea | String | - | Delivery hub area |
| deliverySlot | String | - | Delivery time slot |
| status | DeliveryBatchStatus | @default(PENDING) | Batch status |
| riderName | String? | Optional | Delivery rider name |
| riderPhone | String? | Optional | Rider phone |
| riderVehicle | String? | Optional | Rider vehicle |
| estimatedDistanceKm | Decimal? | @db.Decimal(6, 2) | Estimated distance |
| estimatedDeliveryTime | String? | Optional | Estimated delivery time |
| totalQuantity | Decimal? | @db.Decimal(10, 2) | Total quantity |
| productsSummary | String? | Optional | Products summary |
| createdAt | DateTime | @default(now()) | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships**:
- timelineSteps (1:N) → DeliveryBatchTimelineStep
- orders (1:N) → Order

**Indexes**:
- [hubArea]
- [status]

---

### 15. DeliveryBatchTimelineStep

**Purpose**: Delivery batch status timeline

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| batchId | String | - | Foreign key to DeliveryBatch |
| status | DeliveryBatchStatus | - | Batch status |
| label | String | - | Status label |
| timestamp | DateTime | @default(now()) | Status timestamp |
| isCompleted | Boolean | @default(false) | Completion flag |
| isCurrent | Boolean | @default(false) | Current status flag |

**Relationships**:
- batch (N:1) → DeliveryBatch

**Indexes**:
- [batchId]

---

### 16. Sale

**Purpose**: Sales records for farmer payouts

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| saleCode | String | @unique | Unique sale code |
| orderId | String | - | Foreign key to Order |
| farmerId | String | - | Foreign key to Farmer |
| orderItemId | String? | Optional | Foreign key to OrderItem |
| productName | String | - | Product name (snapshot) |
| category | String | - | Product category |
| quantity | Decimal | @db.Decimal(10, 2) | Quantity sold |
| unit | String | - | Unit |
| revenue | Decimal | @db.Decimal(10, 2) | Revenue amount |
| status | SaleStatus | @default(PENDING_PAYOUT) | Payout status |
| payoutDate | DateTime? | Optional | Payout date |
| transactionReference | String? | Optional | Transaction reference |
| createdAt | DateTime | @default(now()) | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships**:
- farmer (N:1) → Farmer
- order (N:1) → Order
- orderItem (N:1) → OrderItem

**Indexes**:
- [farmerId]
- [orderId]
- [status]
- [createdAt]

---

### 17. Notification

**Purpose**: User notifications

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| userId | String | - | Foreign key to User |
| title | String | - | Notification title |
| message | String | - | Notification message |
| type | NotificationType | @default(ORDER) | Notification type |
| isRead | Boolean | @default(false) | Read status |
| link | String? | Optional | Link URL |
| createdAt | DateTime | @default(now()) | Creation timestamp |

**Relationships**:
- user (N:1) → User

**Indexes**:
- [userId]
- [isRead]
- [createdAt]

---

### 18. Review

**Purpose**: Product and farmer reviews

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| userId | String | - | Foreign key to User (consumer) |
| farmerId | String | - | Foreign key to Farmer |
| productId | String? | Optional | Foreign key to Product |
| rating | Int | @default(5) | Rating (1-5) |
| comment | String | - | Review comment |
| verifiedPurchase | Boolean | @default(true) | Verified purchase flag |
| createdAt | DateTime | @default(now()) | Creation timestamp |

**Relationships**:
- farmer (N:1) → Farmer
- product (N:1) → Product
- user (N:1) → User

**Indexes**:
- [farmerId]
- [productId]
- [userId]

---

### 19. Dispute

**Purpose**: Order disputes

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| orderId | String | - | Foreign key to Order |
| userId | String | - | Foreign key to User (consumer) |
| productName | String | - | Product name |
| reason | String | - | Dispute reason |
| amount | Decimal | @db.Decimal(10, 2) | Disputed amount |
| status | DisputeStatus | @default(OPEN) | Dispute status |
| description | String | - | Dispute description |
| resolution | String? | Optional | Resolution text |
| createdAt | DateTime | @default(now()) | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Relationships**:
- order (N:1) → Order
- user (N:1) → User

**Indexes**:
- [orderId]
- [userId]
- [status]

---

### 20. CartItem

**Purpose**: Shopping cart items

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| userId | String | - | Foreign key to User (consumer) |
| productId | String | - | Foreign key to Product |
| quantity | Decimal | @default(1), @db.Decimal(10, 2) | Quantity |
| createdAt | DateTime | @default(now()) | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |
| lineKey | String | - | Unique line key |
| surplusOfferId | String? | Optional | Foreign key to SurplusOffer |

**Relationships**:
- product (N:1) → Product
- surplusOffer (N:1) → SurplusOffer
- user (N:1) → User

**Indexes**:
- [userId, lineKey] (unique)
- [userId]
- [productId]
- [surplusOfferId]

---

## Relationships

### User Relationships
- User → Farmer (1:1) - Each farmer has one user account
- User → CartItem (1:N) - User can have multiple cart items
- User → ConsumerAddress (1:N) - User can have multiple addresses
- User → Notification (1:N) - User can have multiple notifications
- User → Order (1:N) - User can have multiple orders
- User → Review (1:N) - User can write multiple reviews
- User → Dispute (1:N) - User can create multiple disputes
- User → Farmer (as approver) (1:N) - Admin can approve multiple farmers

### Farmer Relationships
- Farmer → User (N:1) - Farmer belongs to one user
- Farmer → User (as approver) (N:1) - Farmer approved by one admin
- Farmer → FarmerDocument (1:N) - Farmer can have multiple documents
- Farmer → Product (1:N) - Farmer can list multiple products
- Farmer → HarvestBatch (1:N) - Farmer can have multiple harvest batches
- Farmer → InventoryItem (1:N) - Farmer can have multiple inventory items
- Farmer → OrderItem (1:N) - Farmer can fulfill multiple order items
- Farmer → Review (1:N) - Farmer can receive multiple reviews
- Farmer → Sale (1:N) - Farmer can have multiple sales
- Farmer → SurplusOffer (1:N) - Farmer can create multiple surplus offers

### Product Relationships
- Product → Farmer (N:1) - Product belongs to one farmer
- Product → CartItem (1:N) - Product can be in multiple carts
- Product → HarvestBatch (1:N) - Product can have multiple harvest batches
- Product → InventoryItem (1:1) - Product has one inventory record
- Product → OrderItem (1:N) - Product can be in multiple orders
- Product → Review (1:N) - Product can have multiple reviews
- Product → SurplusOffer (1:N) - Product can have multiple surplus offers

### Order Relationships
- Order → User (N:1) - Order belongs to one consumer
- Order → ConsumerAddress (N:1) - Order has one delivery address
- Order → DeliveryBatch (N:1) - Order belongs to one delivery batch
- Order → OrderItem (1:N) - Order can have multiple items
- Order → OrderTimelineStep (1:N) - Order has multiple timeline steps
- Order → Sale (1:N) - Order can generate multiple sales
- Order → Dispute (1:N) - Order can have multiple disputes

### HarvestBatch Relationships
- HarvestBatch → Farmer (N:1) - Batch belongs to one farmer
- HarvestBatch → Product (N:1) - Batch belongs to one product
- HarvestBatch → TraceabilityEvent (1:N) - Batch has multiple traceability events
- HarvestBatch → SurplusOffer (1:N) - Batch can have multiple surplus offers

---

## Indexes

### User Indexes
- [email] - Unique constraint for email lookup
- [role] - For filtering by role

### Farmer Indexes
- [verificationStatus] - For filtering by verification status
- [hub] - For grouping by delivery hub
- [city] - For filtering by city
- [approvedById] - For linking to approver

### Product Indexes
- [farmerId] - For fetching farmer's products
- [category] - For filtering by category
- [status] - For filtering by status
- [inStock] - For filtering by availability

### Order Indexes
- [consumerId] - For fetching consumer's orders
- [status] - For filtering by status
- [deliveryBatchId] - For fetching batch orders
- [createdAt] - For sorting by date

### Notification Indexes
- [userId] - For fetching user's notifications
- [isRead] - For filtering by read status
- [createdAt] - For sorting by date

---

## Constraints

### Unique Constraints
- User.email
- Farmer.userId
- HarvestBatch.batchNumber
- InventoryItem.productId
- CartItem.[userId, lineKey] (compound unique)
- Order.orderNumber
- DeliveryBatch.batchCode
- SurplusOffer.offerCode
- Sale.saleCode

### Cascade Deletes
- User deletion cascades to: Farmer, CartItem, ConsumerAddress, Notification, Order, Review, Dispute
- Farmer deletion cascades to: FarmerDocument, Product, HarvestBatch, InventoryItem, OrderItem, Review, Sale, SurplusOffer
- Product deletion cascades to: CartItem, HarvestBatch, InventoryItem, OrderItem, Review, SurplusOffer
- Order deletion cascades to: OrderItem, OrderTimelineStep, Sale, Dispute
- HarvestBatch deletion cascades to: TraceabilityEvent, SurplusOffer
- InventoryItem deletion cascades to: InventoryLog
- ConsumerAddress deletion does NOT cascade (orders retain address snapshot)

---

**End of Database Schema Documentation**
