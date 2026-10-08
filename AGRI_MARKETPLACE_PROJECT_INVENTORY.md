# Krishi Market - Project Inventory

---

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Frontend Source Files](#frontend-source-files)
3. [Backend Source Files](#backend-source-files)
4. [Frontend Pages](#frontend-pages)
5. [Frontend Components](#frontend-components)
6. [Backend API Routes](#backend-api-routes)
7. [Backend Controllers](#backend-controllers)
8. [Backend Services](#backend-services)
9. [Database Files](#database-files)
10. [Configuration Files](#configuration-files)
11. [Documentation Files](#documentation-files)
12. [Data Files](#data-files)

---

## Directory Structure

```
calm-archimedes/
├── src/                          # Frontend source
│   ├── app/                      # Next.js app router pages
│   ├── components/               # React components
│   ├── context/                  # React context providers
│   ├── lib/                      # Utility functions
│   ├── data/                     # Mock data files
│   └── types/                    # TypeScript type definitions
├── backend/                      # Backend source
│   ├── src/
│   │   ├── controllers/          # Request handlers
│   │   ├── services/             # Business logic
│   │   ├── routes/               # API route definitions
│   │   ├── middleware/           # Express middleware
│   │   ├── db/                   # Database client
│   │   └── types/                # TypeScript type definitions
│   ├── prisma/                   # Prisma schema and migrations
│   ├── dist/                     # Compiled JavaScript
│   └── node_modules/             # Backend dependencies
├── public/                       # Static assets
├── node_modules/                 # Frontend dependencies
├── .next/                        # Next.js build output
├── AGENTS.md                     # Project agent instructions
├── CLAUDE.md                     # Claude AI instructions
├── package.json                  # Frontend dependencies
├── tsconfig.json                 # TypeScript configuration
├── next.config.ts                # Next.js configuration
└── tailwind.config.ts            # Tailwind CSS configuration
```

---

## Frontend Source Files

### Context Providers
- `src/context/AuthContext.tsx` - Authentication state management
- `src/context/MarketplaceContext.tsx` - Consumer marketplace state
- `src/context/FarmerContext.tsx` - Farmer portal state

### Utility Functions
- `src/lib/api.ts` - API client with authentication helpers
- `src/lib/utils.ts` - Utility functions (cn, etc.)

### Type Definitions
- `src/types/index.ts` - Global TypeScript types
- `src/types/api.ts` - API response types
- `src/types/farmer.ts` - Farmer-specific types
- `src/types/marketplace.ts` - Marketplace types

---

## Backend Source Files

### Main Entry Point
- `backend/src/index.ts` - Express server entry point

### Database Client
- `backend/src/db/prisma.ts` - Prisma client singleton

### Middleware
- `backend/src/middleware/auth.ts` - JWT authentication and RBAC
- `backend/src/middleware/errorHandler.ts` - Global error handler

### Type Definitions
- `backend/src/types/index.ts` - Global TypeScript types
- `backend/src/types/auth.ts` - Authentication types
- `backend/src/types/express.ts` - Express request/response types

---

## Frontend Pages

### Public/Consumer Pages
- `src/app/page.tsx` - Landing page
- `src/app/explore/page.tsx` - Product marketplace
- `src/app/products/[id]/page.tsx` - Product detail
- `src/app/farmers/page.tsx` - Farmers directory
- `src/app/farmers/[id]/page.tsx` - Farmer profile
- `src/app/cart/page.tsx` - Shopping cart
- `src/app/checkout/page.tsx` - Checkout flow
- `src/app/orders/page.tsx` - Order history
- `src/app/orders/[id]/page.tsx` - Order detail
- `src/app/surplus/page.tsx` - Surplus offers
- `src/app/trace/[batchId]/page.tsx` - QR traceability
- `src/app/dashboard/page.tsx` - Consumer dashboard
- `src/app/login/page.tsx` - Consumer/farmer login
- `src/app/signup/page.tsx` - Consumer registration

### Farmer Portal Pages
- `src/app/farmer/page.tsx` - Farmer home
- `src/app/farmer/login/page.tsx` - Farmer login
- `src/app/farmer/signup/page.tsx` - Farmer registration
- `src/app/farmer/register/page.tsx` - Alternative registration
- `src/app/farmer/forgot-password/page.tsx` - Password recovery
- `src/app/farmer/reset-password/page.tsx` - Password reset
- `src/app/farmer/verification-pending/page.tsx` - Pending status
- `src/app/farmer/verification-rejected/page.tsx` - Rejected status
- `src/app/farmer/dashboard/page.tsx` - Farmer dashboard
- `src/app/farmer/products/page.tsx` - Product management
- `src/app/farmer/products/new/page.tsx` - Create product
- `src/app/farmer/products/[id]/edit/page.tsx` - Edit product
- `src/app/farmer/orders/page.tsx` - Order management
- `src/app/farmer/orders/[id]/page.tsx` - Order detail
- `src/app/farmer/harvests/page.tsx` - Harvest records
- `src/app/farmer/harvests/new/page.tsx` - Create harvest
- `src/app/farmer/harvests/[id]/page.tsx` - Harvest detail
- `src/app/farmer/inventory/page.tsx` - Inventory management
- `src/app/farmer/deliveries/page.tsx` - Delivery batches
- `src/app/farmer/deliveries/[id]/page.tsx` - Delivery batch detail
- `src/app/farmer/sales/page.tsx` - Sales analytics
- `src/app/farmer/surplus/page.tsx` - Surplus offers
- `src/app/farmer/profile/page.tsx` - Farmer profile
- `src/app/farmer/settings/page.tsx` - Account settings
- `src/app/farmer/notifications/page.tsx` - Notification center

### Admin Portal Pages
- `src/app/admin/page.tsx` - Admin home
- `src/app/admin/login/page.tsx` - Admin login
- `src/app/admin/layout.tsx` - Admin route guard
- `src/app/admin/dashboard/page.tsx` - Admin dashboard
- `src/app/admin/analytics/page.tsx` - Platform analytics
- `src/app/admin/farmers/page.tsx` - Farmer management
- `src/app/admin/farmers/[farmerId]/page.tsx` - Farmer detail
- `src/app/admin/products/page.tsx` - Product oversight
- `src/app/admin/products/[productId]/page.tsx` - Product detail
- `src/app/admin/orders/page.tsx` - Order oversight
- `src/app/admin/orders/[orderId]/page.tsx` - Order detail
- `src/app/admin/deliveries/page.tsx` - Delivery monitoring
- `src/app/admin/deliveries/[batchId]/page.tsx` - Delivery batch detail
- `src/app/admin/disputes/page.tsx` - Dispute resolution
- `src/app/admin/disputes/[disputeId]/page.tsx` - Dispute detail
- `src/app/admin/payouts/page.tsx` - Payout management
- `src/app/admin/sales/page.tsx` - Sales oversight
- `src/app/admin/reviews/page.tsx` - Review moderation
- `src/app/admin/notifications/page.tsx` - Admin notifications
- `src/app/admin/users/page.tsx` - User management
- `src/app/admin/profile/page.tsx` - Admin profile
- `src/app/admin/settings/page.tsx` - Platform settings

**Total Frontend Pages**: 65+

---

## Frontend Components

### Admin Components (11)
- `src/components/admin/AdminAuthGuard.tsx` - Admin route protection
- `src/components/admin/AdminNavbar.tsx` - Admin navigation bar
- `src/components/admin/AdminSidebar.tsx` - Admin sidebar menu
- `src/components/admin/AdminStatCard.tsx` - KPI metric card
- `src/components/admin/AdminEmptyState.tsx` - Empty state placeholder
- `src/components/admin/AdminTablePagination.tsx` - Table pagination
- `src/components/admin/AdminApproveModal.tsx` - Farmer approval modal
- `src/components/admin/AdminRejectModal.tsx` - Farmer rejection modal
- `src/components/admin/AdminResubmitModal.tsx` - Farmer resubmission modal
- `src/components/admin/AdminDisputeModal.tsx` - Dispute resolution modal
- `src/components/admin/AdminPayoutModal.tsx` - Payout processing modal

### Common Components (7)
- `src/components/common/Navbar.tsx` - Main navigation bar
- `src/components/common/Footer.tsx` - Site footer
- `src/components/common/FarmerAvatar.tsx` - Farmer profile image
- `src/components/common/LocationModal.tsx` - Location selection modal
- `src/components/common/GlobalSearchModal.tsx` - Global search modal
- `src/components/common/NotificationDropdown.tsx` - Notification dropdown
- `src/components/ui/RoleSwitcher.tsx` - Demo role switcher

### Consumer Components (1)
- `src/components/consumer/ConsumerProfileAddresses.tsx` - Address management

### Farmer Components (23)
- `src/components/farmer/FarmerAuthGuard.tsx` - Farmer route protection
- `src/components/farmer/FarmerNavbar.tsx` - Farmer navigation bar
- `src/components/farmer/FarmerSidebar.tsx` - Farmer sidebar menu
- `src/components/farmer/FarmerNotificationDropdown.tsx` - Notification dropdown
- `src/components/farmer/StatCard.tsx` - Dashboard stat card
- `src/components/farmer/SalesChart.tsx` - Revenue trend chart
- `src/components/farmer/ProfileCard.tsx` - Farmer profile card
- `src/components/farmer/ProductCard.tsx` - Product card
- `src/components/farmer/ProductForm.tsx` - Product form
- `src/components/farmer/OrderTable.tsx` - Orders table
- `src/components/farmer/OrderStatusBadge.tsx` - Order status badge
- `src/components/farmer/OrderTimeline.tsx` - Order timeline
- `src/components/farmer/InventoryTable.tsx` - Inventory table
- `src/components/farmer/HarvestCard.tsx` - Harvest card
- `src/components/farmer/HarvestTimeline.tsx` - Harvest timeline
- `src/components/farmer/StockBadge.tsx` - Stock badge
- `src/components/farmer/StockUpdateModal.tsx` - Stock update modal
- `src/components/farmer/QRCodeDisplay.tsx` - QR code display
- `src/components/farmer/ConfirmationModal.tsx` - Confirmation modal
- `src/components/farmer/EmptyState.tsx` - Empty state
- `src/components/farmer/LoadingSkeleton.tsx` - Loading skeleton
- `src/components/farmer/VerificationPending.tsx` - Pending status page
- `src/components/farmer/VerificationRejected.tsx` - Rejected status page
- `src/components/farmer/Toast.tsx` - Toast notification

### Marketplace Components (5)
- `src/components/marketplace/ProductCard.tsx` - Product card
- `src/components/marketplace/FarmerCard.tsx` - Farmer card
- `src/components/marketplace/CategoryCard.tsx` - Category card
- `src/components/marketplace/TraceabilityTimeline.tsx` - Traceability timeline
- `src/components/marketplace/PriceBreakdown.tsx` - Price breakdown

### UI Components (8)
- `src/components/ui/EmptyState.tsx` - Generic empty state
- `src/components/ui/FreshnessBadge.tsx` - Freshness badge
- `src/components/ui/OrganicBadge.tsx` - Organic badge
- `src/components/ui/RatingStars.tsx` - Rating stars
- `src/components/ui/VerifiedBadge.tsx` - Verification badge
- `src/components/ui/LoadingSkeleton.tsx` - Loading skeleton
- `src/components/ui/ToastContainer.tsx` - Toast container
- `src/components/ui/RoleSwitcher.tsx` - Role switcher

**Total Frontend Components**: 54+

---

## Backend API Routes

### Route Files (17)
- `backend/src/routes/auth.routes.ts` - Authentication routes
- `backend/src/routes/farmer.routes.ts` - Farmer routes (with sub-routers)
- `backend/src/routes/admin.routes.ts` - Admin routes
- `backend/src/routes/consumer.routes.ts` - Consumer routes
- `backend/src/routes/order.routes.ts` - Order routes
- `backend/src/routes/marketplace.routes.ts` - Public marketplace routes
- `backend/src/routes/product.routes.ts` - Product management routes
- `backend/src/routes/inventory.routes.ts` - Inventory management routes
- `backend/src/routes/harvest.routes.ts` - Harvest management routes
- `backend/src/routes/surplus.routes.ts` - Surplus offer routes
- `backend/src/routes/public-surplus.routes.ts` - Public surplus routes
- `backend/src/routes/trace.routes.ts` - Traceability routes
- `backend/src/routes/farmer-order.routes.ts` - Farmer order routes
- `backend/src/routes/farmer-delivery.routes.ts` - Farmer delivery routes
- `backend/src/routes/farmer-sale.routes.ts` - Farmer sales routes
- `backend/src/routes/farmer-notification.routes.ts` - Farmer notification routes
- `backend/src/routes/farmer-settings.routes.ts` - Farmer settings routes

**Total API Endpoints**: ~120+ (including aliases and sub-routes)

---

## Backend Controllers

### Controller Files (15)
- `backend/src/controllers/auth.controller.ts` - Authentication controller
- `backend/src/controllers/farmer.controller.ts` - Farmer controller
- `backend/src/controllers/admin.controller.ts` - Admin controller
- `backend/src/controllers/consumer.controller.ts` - Consumer controller
- `backend/src/controllers/order.controller.ts` - Order controller
- `backend/src/controllers/marketplace.controller.ts` - Marketplace controller
- `backend/src/controllers/product.controller.ts` - Product controller
- `backend/src/controllers/inventory.controller.ts` - Inventory controller
- `backend/src/controllers/harvest.controller.ts` - Harvest controller
- `backend/src/controllers/surplus.controller.ts` - Surplus controller
- `backend/src/controllers/cart.controller.ts` - Cart controller
- `backend/src/controllers/delivery.controller.ts` - Delivery controller
- `backend/src/controllers/sale.controller.ts` - Sale controller
- `backend/src/controllers/notification.controller.ts` - Notification controller
- `backend/src/controllers/farmer-settings.controller.ts` - Farmer settings controller

---

## Backend Services

### Service Files (15)
- `backend/src/services/auth.service.ts` - Authentication service
- `backend/src/services/farmer.service.ts` - Farmer service
- `backend/src/services/admin.service.ts` - Admin service
- `backend/src/services/consumer.service.ts` - Consumer service
- `backend/src/services/order.service.ts` - Order service
- `backend/src/services/marketplace.service.ts` - Marketplace service
- `backend/src/services/product.service.ts` - Product service
- `backend/src/services/inventory.service.ts` - Inventory service
- `backend/src/services/harvest.service.ts` - Harvest service
- `backend/src/services/surplus.service.ts` - Surplus service
- `backend/src/services/cart.service.ts` - Cart service
- `backend/src/services/delivery.service.ts` - Delivery service
- `backend/src/services/sale.service.ts` - Sale service
- `backend/src/services/notification.service.ts` - Notification service
- `backend/src/services/farmer-settings.service.ts` - Farmer settings service

---

## Database Files

### Prisma Files
- `backend/prisma/schema.prisma` - Prisma schema definition
- `backend/prisma/migrations/` - Database migrations directory

### Schema Summary
- **Total Models**: 25
- **Total Enums**: 16
- **Relationships**: User (1:1 Farmer), Farmer (1:N Products), Order (1:N OrderItems), etc.

---

## Configuration Files

### Frontend Configuration
- `package.json` - Frontend dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `.env.local` - Frontend environment variables (not committed)

### Backend Configuration
- `backend/package.json` - Backend dependencies and scripts
- `backend/tsconfig.json` - TypeScript configuration
- `backend/.env` - Backend environment variables (not committed)

### Project Configuration
- `AGENTS.md` - Project agent instructions
- `CLAUDE.md` - Claude AI instructions
- `.gitignore` - Git ignore rules

---

## Documentation Files

### MCA Documentation (Generated)
- `AGRI_MARKETPLACE_MCA_PROJECT_REPORT.md` - Main MCA project report
- `AGRI_MARKETPLACE_ABSTRACT.md` - Project abstract
- `AGRI_MARKETPLACE_MODULES.md` - System modules documentation
- `AGRI_MARKETPLACE_DATABASE_SCHEMA.md` - Database schema documentation
- `AGRI_MARKETPLACE_API_DOCUMENTATION.md` - API documentation
- `AGRI_MARKETPLACE_TEST_RESULTS.md` - Test results documentation
- `AGRI_MARKETPLACE_PROJECT_INVENTORY.md` - Project inventory (this file)
- `AGRI_MARKETPLACE_SETUP_DEPLOYMENT.md` - Setup and deployment guide
- `AGRI_MARKETPLACE_LIMITATIONS_FUTURE_SCOPE.md` - Limitations and future scope

---

## Data Files

### Mock Data Files
- `src/data/mockData.ts` - Main mock data (farmers, products, categories, orders, etc.)
- `src/data/farmers.ts` - Farmer-specific data
- `src/data/products.ts` - Product data
- `src/data/orders.ts` - Order data
- `src/data/harvests.ts` - Harvest data
- `src/data/inventory.ts` - Inventory data
- `src/data/sales.ts` - Sales data
- `src/data/deliveries.ts` - Delivery data
- `src/data/surplus.ts` - Surplus data
- `src/data/notifications.ts` - Notification data
- `src/data/admin.ts` - Admin data

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Frontend Pages | 65+ |
| Frontend Components | 54+ |
| Backend Route Files | 17 |
| Backend Controllers | 15 |
| Backend Services | 15 |
| API Endpoints | ~120+ |
| Database Models | 25 |
| Database Enums | 16 |
| Mock Data Files | 11 |
| Configuration Files | 8 |
| Documentation Files | 9 |

---

**End of Project Inventory**
