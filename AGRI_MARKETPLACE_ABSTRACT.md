# Krishi Market - Farm-to-Consumer Agri Marketplace
## Abstract

---

### Project Overview

**Krishi Market** is a comprehensive farm-to-consumer agricultural marketplace platform designed to eliminate intermediaries in the agricultural supply chain. The platform connects farmers directly with consumers, ensuring fair prices for both parties while providing complete transparency through QR-based traceability.

### Problem Statement

The traditional agricultural supply chain involves multiple intermediaries (aggregators, wholesalers, retailers), each adding their own margin. This results in farmers receiving only 30-40% of the final consumer price, while consumers pay inflated prices. Additionally, the lack of transparency makes it impossible for consumers to verify the origin, freshness, or authenticity of agricultural products. Food waste is another critical issue, as surplus produce often goes to waste due to inefficient distribution channels.

### Solution

Krishi Market addresses these challenges through a digital platform that:

1. **Direct Connection**: Enables farmers to list products directly, eliminating intermediaries
2. **QR Traceability**: Each harvest batch gets a unique QR code tracking the complete journey from farm to doorstep
3. **Freshness Calculation**: Algorithm calculates freshness scores based on harvest date and shelf life
4. **Surplus Management**: Farmers can create time-limited surplus offers to reduce food waste
5. **Hyperlocal Delivery**: Orders are batched by location and delivery slot for efficient logistics
6. **Farmer Verification**: Admin verification process ensures only legitimate farmers can operate
7. **Consumer Reviews**: Review system builds trust and provides feedback to farmers

### Technology Stack

**Frontend**:
- Next.js 16.3.5 with React 19.2.8
- TypeScript 5
- Tailwind CSS 4
- Recharts for data visualization
- Lucide React for icons

**Backend**:
- Express.js 5.2.1 with TypeScript 7.0.2
- Prisma 6.19.3 ORM
- PostgreSQL database with PgBouncer connection pooling
- JWT authentication with bcrypt password hashing

### Key Features

**For Farmers**:
- Registration with verification documents
- Product listing and inventory management
- Order management and status updates
- Harvest batch recording with QR code generation
- Surplus offer creation
- Sales analytics and revenue tracking
- Delivery batch management

**For Consumers**:
- Product browsing with advanced filters (category, price, distance, farming method)
- Cart management and checkout
- Order tracking with timeline
- QR code scanning for traceability
- Review and rating system
- Dispute creation

**For Administrators**:
- Farmer verification (approve/reject)
- Platform metrics dashboard
- Product and order oversight
- Delivery batch monitoring
- Dispute resolution
- Payout management
- Review moderation

### Database Design

The system uses PostgreSQL with 25 database models organized into:
- User Management (User, Farmer, FarmerDocument)
- Product Management (Product, InventoryItem, InventoryLog)
- Harvest Management (HarvestBatch, TraceabilityEvent)
- Order Management (Order, OrderItem, OrderTimelineStep)
- Delivery Management (DeliveryBatch, DeliveryBatchTimelineStep)
- Sales Management (Sale)
- Consumer Management (ConsumerAddress)
- Review Management (Review)
- Dispute Management (Dispute)
- Cart Management (CartItem)
- Notification Management (Notification)

### Implementation Status

**Fully Implemented**:
- Farmer registration and verification workflow
- Product listing and inventory management
- Consumer browsing and purchasing
- Cart management with real database persistence
- Order creation with inventory reservation
- QR-based traceability
- Surplus offer creation and management
- Hyperlocal delivery batching
- Admin dashboard with platform metrics
- Role-based authentication and authorization
- Data isolation and ownership checks

**Partially Implemented**:
- Payment processing (simulated, not real gateway)
- Delivery optimization (basic batching, no route optimization)
- Freshness calculation (algorithm implemented, but no automated alerts)

**Not Implemented**:
- Real payment gateway integration
- Real-time GPS delivery tracking
- Advanced route optimization
- Multi-language support
- Mobile application
- IoT sensor integration
- Weather integration
- Automated testing suite

### Technical Outcomes

- **Frontend**: 65+ pages across 3 portals (consumer, farmer, admin)
- **Components**: 54+ components organized by domain
- **Backend**: ~120+ API endpoints with proper authentication
- **Database**: 25 models with proper relationships and constraints
- **Build Status**: Successful TypeScript compilation for both frontend and backend
- **Database Operations**: Successful CRUD operations with PostgreSQL

### Testing

Verified test areas:
- Farmer registration and approval
- Consumer cart and checkout
- Order creation and inventory reservation
- Admin dashboard and farmer listing
- API authentication and authorization
- Database operations with Prisma

Requires verification:
- Public marketplace endpoints (requires frontend browser testing)
- QR traceability (requires QR scanning)
- Surplus management (requires farmer portal)
- Delivery batching (requires farmer portal)
- Consumer order history (requires consumer portal)
- Farmer order management (requires farmer portal)
- Dispute creation (requires consumer portal)
- Review creation (requires consumer portal)

### Conclusion

Krishi Market successfully implements a comprehensive farm-to-consumer agricultural marketplace platform using modern web technologies. The system addresses key problems in the traditional agricultural supply chain by eliminating intermediaries, ensuring transparency through QR-based traceability, reducing food waste through surplus management, and optimizing logistics through hyperlocal delivery batching.

While the project has limitations (simulated payments, no automated tests, basic delivery optimization), it provides a solid foundation for a production agricultural marketplace. The identified future enhancements can be implemented iteratively to improve functionality, security, and scalability.

The project is suitable for academic submission and demonstrates the practical application of full-stack web development principles to solve real-world agricultural challenges.

---

**Keywords**: Agricultural Marketplace, Farm-to-Consumer, Traceability, Freshness Calculation, Surplus Management, Hyperlocal Delivery, Next.js, Express.js, PostgreSQL, Prisma
