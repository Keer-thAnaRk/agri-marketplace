# 🌾 Agri Marketplace

A full-stack **Farmer-to-Consumer Agricultural Marketplace** that connects farmers directly with consumers while providing tools for product management, orders, freshness tracking, surplus management, delivery batching, and product traceability.

## ✨ Key Features

* 👨‍🌾 **Farmer Management** — Registration, verification, products, harvests, inventory and sales
* 🛒 **Consumer Marketplace** — Browse products, explore farmers, cart and checkout
* 📦 **Order Management** — Order creation, tracking and order details
* 🌱 **Freshness Tracking** — Monitor product freshness based on harvest information
* ♻️ **Surplus Management** — Manage surplus agricultural produce
* 🚚 **Delivery Batching** — Organize deliveries into efficient batches
* 🔍 **QR Traceability** — Track agricultural produce using batch-based traceability
* 👨‍💼 **Admin Dashboard** — Manage farmers, products, orders, deliveries, users and disputes
* 📊 **Analytics & Sales** — Monitor marketplace activity, sales and payouts
* 🔔 **Notifications** — Farmer, consumer and administrative notifications
* ⭐ **Reviews & Ratings** — Product/farmer feedback functionality

## 👥 User Modules

### Consumer

* Browse and explore agricultural products
* View farmer and product details
* Add products to cart
* Checkout and manage orders
* Track orders
* View product traceability information

### Farmer

* Register and complete verification
* Manage products and harvests
* Maintain inventory
* Manage surplus produce
* View orders and deliveries
* Track sales and payouts
* Manage profile and settings

### Admin

* Dashboard and analytics
* Farmer verification
* User management
* Product management
* Order and delivery management
* Dispute management
* Reviews, notifications and payouts

## 🛠️ Tech Stack

| Technology            | Usage                      |
| --------------------- | -------------------------- |
| Next.js               | Full-stack web application |
| React                 | User interface             |
| TypeScript            | Type-safe development      |
| Tailwind CSS          | Styling and responsive UI  |
| Prisma                | Database ORM               |
| PostgreSQL / Supabase | Database                   |
| Node.js               | Backend runtime            |
| Git & GitHub          | Version control            |

## 📁 Project Structure

```text
src/
├── app/
│   ├── admin/          # Admin dashboard and management
│   ├── farmer/         # Farmer portal
│   ├── products/       # Product pages
│   ├── orders/         # Order management
│   ├── cart/           # Shopping cart
│   ├── checkout/       # Checkout
│   ├── surplus/        # Surplus marketplace
│   └── trace/          # Product traceability
│
├── components/
│   ├── admin/
│   ├── consumer/
│   ├── farmer/
│   ├── marketplace/
│   └── ui/
│
├── context/            # Application state management
├── data/               # Application data
├── lib/                # API and shared utilities
├── types/              # TypeScript types
└── utils/              # Helper functions
```

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Keer-thAnaRk/agri-marketplace.git
cd agri-marketplace
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file and add the required database and application configuration.

> Never commit `.env` or `.env.local` files to GitHub.

### 4. Run the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 📸 Screenshots

Screenshots of the marketplace, farmer dashboard and admin dashboard can be added here.

```text
docs/screenshots/
├── home.png
├── marketplace.png
├── farmer-dashboard.png
└── admin-dashboard.png
```

## 🔮 Future Enhancements

* Online payment gateway integration
* Real-time notifications
* SMS/email notifications
* Cloud image and document storage
* Advanced demand prediction
* Mobile application
* Real-time delivery tracking

## 🎓 Academic Project

Developed as part of the **MCA academic project** to demonstrate the design and development of a full-stack agricultural marketplace connecting farmers and consumers.

## 👩‍💻 Author

**Keerthana R K**

MCA — Mount Carmel College Autonomous, Bengaluru

GitHub: https://github.com/Keer-thAnaRk
