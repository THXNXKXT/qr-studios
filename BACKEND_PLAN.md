# 🚀 Backend Development Plan - QR Studios

**โปรเจค:** QR Studios E-Commerce Platform  
**วันที่:** 30 ธันวาคม 2025  
**สถานะ Frontend:** ✅ พร้อม 100%

---

## 📋 สารบัญ

1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [Project Structure](#project-structure)
4. [Database Design](#database-design)
5. [API Endpoints](#api-endpoints)
6. [Features & Modules](#features--modules)
7. [Implementation Phases](#implementation-phases)
8. [Setup & Installation](#setup--installation)
9. [Development Workflow](#development-workflow)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Plan](#deployment-plan)

---

## 🛠️ Technology Stack

### **Core Technologies**

#### 1. Runtime & Framework
```
✅ Runtime: Bun (v1.0+)
   - เร็วกว่า Node.js 3-4 เท่า
   - Built-in TypeScript support
   - Package manager ในตัว
   - Compatible กับ Node.js ecosystem

✅ Framework: Hono (v4.0+)
   - Ultra-fast web framework
   - TypeScript-first
   - Middleware support
   - Edge runtime compatible
   - Lightweight (< 15KB)
```

**ทำไมเลือก Bun + Hono?**
- 🚀 Performance สูงสุด
- 📦 TypeScript native
- 🔧 Developer experience ดี
- 💰 Cost-effective (ใช้ resource น้อย)
- 🌐 Modern & Future-proof

#### 2. Database & ORM
```
✅ Database: PostgreSQL 16
   - ACID compliance
   - JSON support
   - Full-text search
   - Scalable
   - Open source

✅ ORM: Prisma (v5.0+)
   - Type-safe database access
   - Auto-generated types
   - Migration system
   - Query optimization
   - Developer-friendly
```

#### 3. Authentication
```
✅ NextAuth.js (v4.24+)
   - Discord OAuth integration
   - Session management
   - JWT tokens
   - CSRF protection
   - Already configured in frontend
```

#### 4. Payment Processing
```
✅ Stripe (Latest SDK)
   - Payment intents
   - Checkout sessions
   - Webhooks
   - Subscription support
   - Thai Baht support
```

#### 5. File Storage
```
✅ Cloudflare R2
   - S3-compatible API
   - Zero egress fees
   - Fast CDN
   - Cost-effective
   - Easy integration

Alternative: AWS S3
```

#### 6. Caching & Queue
```
✅ Redis (v7.0+)
   - Session storage
   - Cache layer
   - Rate limiting
   - Queue management
   - Pub/Sub
```

#### 7. Email Service
```
✅ Resend (Recommended)
   - Modern API
   - React email templates
   - Good deliverability
   - Developer-friendly

Alternative: SendGrid, AWS SES
```

#### 8. Monitoring & Logging
```
✅ Sentry
   - Error tracking
   - Performance monitoring
   - Real-time alerts

✅ Pino (Logger)
   - Fast JSON logger
   - Low overhead
   - Structured logging
```

---

## 🏗️ Architecture Overview

### **System Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Next.js Frontend (Port 3000)                               │
│  - React 19 + TypeScript                                    │
│  - Server Components                                         │
│  - Client Components                                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ HTTP/HTTPS
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  Hono API Server (Port 4000)                                │
│  - Request validation                                        │
│  - Authentication middleware                                 │
│  - Rate limiting                                             │
│  - CORS handling                                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┬─────────────┬──────────────┐
        ▼                   ▼             ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌─────────┐  ┌──────────┐
│   Business   │  │   Service    │  │  Cache  │  │  Queue   │
│     Logic    │  │    Layer     │  │  Layer  │  │  Layer   │
├──────────────┤  ├──────────────┤  ├─────────┤  ├──────────┤
│ - Auth       │  │ - Stripe     │  │  Redis  │  │  Redis   │
│ - Products   │  │ - Email      │  │         │  │  Bull    │
│ - Orders     │  │ - Storage    │  │         │  │          │
│ - Licenses   │  │ - Discord    │  │         │  │          │
└──────┬───────┘  └──────┬───────┘  └────┬────┘  └────┬─────┘
       │                 │               │            │
       └─────────────────┴───────────────┴────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │        DATA PERSISTENCE LAYER       │
        ├────────────────────────────────────┤
        │  PostgreSQL Database (Port 5432)   │
        │  - Users, Products, Orders         │
        │  - Licenses, Transactions          │
        │  - Reviews, Notifications          │
        └────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │       EXTERNAL SERVICES LAYER       │
        ├────────────────────────────────────┤
        │  - Stripe API (Payment)            │
        │  - Discord API (OAuth)             │
        │  - Cloudflare R2 (Storage)         │
        │  - Resend (Email)                  │
        │  - Sentry (Monitoring)             │
        └────────────────────────────────────┘
```

### **Request Flow**

```
1. Client Request
   ↓
2. API Gateway (Hono)
   ↓
3. Authentication Middleware
   ↓
4. Rate Limiting
   ↓
5. Request Validation
   ↓
6. Business Logic
   ↓
7. Database Query (Prisma)
   ↓
8. Cache Check/Update (Redis)
   ↓
9. Response Formation
   ↓
10. Client Response
```

---

## 📁 Project Structure

```
qr-studios-backend/
├── src/
│   ├── index.ts                 # Entry point
│   ├── app.ts                   # Hono app setup
│   │
│   ├── config/                  # Configuration
│   │   ├── database.ts          # Prisma client
│   │   ├── redis.ts             # Redis client
│   │   ├── stripe.ts            # Stripe config
│   │   ├── storage.ts           # R2/S3 config
│   │   └── env.ts               # Environment variables
│   │
│   ├── routes/                  # API Routes
│   │   ├── auth.routes.ts       # Authentication
│   │   ├── users.routes.ts      # User management
│   │   ├── products.routes.ts   # Products CRUD
│   │   ├── orders.routes.ts     # Orders
│   │   ├── licenses.routes.ts   # Licenses
│   │   ├── checkout.routes.ts   # Checkout & payment
│   │   ├── topup.routes.ts      # Balance topup
│   │   ├── promo.routes.ts      # Promo codes
│   │   ├── wishlist.routes.ts   # Wishlist
│   │   ├── commission.routes.ts # Commissions
│   │   ├── notifications.routes.ts
│   │   ├── announcements.routes.ts
│   │   ├── reviews.routes.ts    # Reviews
│   │   ├── admin.routes.ts      # Admin endpoints
│   │   └── webhooks.routes.ts   # Stripe webhooks
│   │
│   ├── controllers/             # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   ├── products.controller.ts
│   │   ├── orders.controller.ts
│   │   ├── licenses.controller.ts
│   │   ├── checkout.controller.ts
│   │   ├── topup.controller.ts
│   │   ├── promo.controller.ts
│   │   ├── wishlist.controller.ts
│   │   ├── commission.controller.ts
│   │   ├── notifications.controller.ts
│   │   ├── announcements.controller.ts
│   │   ├── reviews.controller.ts
│   │   ├── admin.controller.ts
│   │   └── webhooks.controller.ts
│   │
│   ├── services/                # Business logic
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   ├── products.service.ts
│   │   ├── orders.service.ts
│   │   ├── licenses.service.ts
│   │   ├── payment.service.ts
│   │   ├── topup.service.ts
│   │   ├── promo.service.ts
│   │   ├── email.service.ts
│   │   ├── storage.service.ts
│   │   ├── notification.service.ts
│   │   └── analytics.service.ts
│   │
│   ├── middleware/              # Middleware
│   │   ├── auth.middleware.ts   # Authentication
│   │   ├── admin.middleware.ts  # Admin check
│   │   ├── ratelimit.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── logger.middleware.ts
│   │
│   ├── validators/              # Request validation
│   │   ├── auth.validator.ts
│   │   ├── product.validator.ts
│   │   ├── order.validator.ts
│   │   ├── license.validator.ts
│   │   └── ...
│   │
│   ├── utils/                   # Utilities
│   │   ├── logger.ts            # Pino logger
│   │   ├── errors.ts            # Error classes
│   │   ├── response.ts          # Response formatter
│   │   ├── encryption.ts        # Encryption utils
│   │   ├── license-generator.ts # License key gen
│   │   └── helpers.ts           # Helper functions
│   │
│   ├── types/                   # TypeScript types
│   │   ├── index.ts
│   │   ├── api.ts
│   │   ├── database.ts
│   │   └── services.ts
│   │
│   └── jobs/                    # Background jobs
│       ├── flash-sale.job.ts    # Check flash sale expiry
│       ├── license.job.ts       # Check license expiry
│       ├── email.job.ts         # Email queue
│       └── cleanup.job.ts       # Database cleanup
│
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── migrations/              # Migration files
│   └── seed.ts                  # Seed data
│
├── tests/
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # E2E tests
│
├── .env.example                 # Environment template
├── .env                         # Environment variables
├── package.json
├── tsconfig.json
├── bunfig.toml                  # Bun config
└── README.md
```

---

## 🗄️ Database Design

### **Database Schema (11 Tables)**

#### 1. **users** - ผู้ใช้งาน
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id    VARCHAR(255) UNIQUE NOT NULL,
  username      VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE,
  avatar        TEXT,
  balance       DECIMAL(10,2) DEFAULT 0,
  role          ENUM('user', 'admin', 'moderator') DEFAULT 'user',
  is_banned     BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

Indexes:
- discord_id (unique)
- email (unique)
- role
```

#### 2. **products** - สินค้า
```sql
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(255) UNIQUE NOT NULL,
  description     TEXT,
  price           DECIMAL(10,2) NOT NULL,
  original_price  DECIMAL(10,2),
  category        ENUM('script', 'ui', 'bundle') NOT NULL,
  images          JSON,
  features        JSON,
  tags            JSON,
  stock           INT DEFAULT -1,
  is_new          BOOLEAN DEFAULT false,
  is_featured     BOOLEAN DEFAULT false,
  is_flash_sale   BOOLEAN DEFAULT false,
  flash_sale_price DECIMAL(10,2),
  flash_sale_ends TIMESTAMP,
  download_key    VARCHAR(255),
  version         VARCHAR(50),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

Indexes:
- slug (unique)
- category
- is_featured
- is_flash_sale
```

#### 3. **licenses** - License Keys
```sql
CREATE TABLE licenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  product_id    UUID REFERENCES products(id),
  order_id      UUID REFERENCES orders(id),
  license_key   VARCHAR(255) UNIQUE NOT NULL,
  ip_address    VARCHAR(45),
  status        ENUM('active', 'expired', 'revoked') DEFAULT 'active',
  expires_at    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
);

Indexes:
- license_key (unique)
- user_id
- product_id
- status
```

#### 4. **orders** - คำสั่งซื้อ
```sql
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  total           DECIMAL(10,2) NOT NULL,
  discount        DECIMAL(10,2) DEFAULT 0,
  promo_code      VARCHAR(50),
  status          ENUM('pending', 'processing', 'completed', 'cancelled', 'refunded'),
  payment_method  ENUM('stripe', 'balance', 'promptpay') NOT NULL,
  payment_intent  VARCHAR(255),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

Indexes:
- user_id
- status
- created_at
```

#### 5. **order_items** - รายการสินค้าในคำสั่งซื้อ
```sql
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID REFERENCES orders(id),
  product_id  UUID REFERENCES products(id),
  quantity    INT NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

Indexes:
- order_id
- product_id
```

#### 6. **promo_codes** - โค้ดส่วนลด
```sql
CREATE TABLE promo_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(50) UNIQUE NOT NULL,
  discount      DECIMAL(10,2) NOT NULL,
  type          ENUM('percentage', 'fixed') NOT NULL,
  min_purchase  DECIMAL(10,2),
  max_discount  DECIMAL(10,2),
  usage_limit   INT,
  used_count    INT DEFAULT 0,
  expires_at    TIMESTAMP,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW()
);

Indexes:
- code (unique)
- is_active
```

#### 7. **transactions** - ธุรกรรมการเงิน
```sql
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  type            ENUM('topup', 'purchase', 'refund', 'bonus') NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  bonus           DECIMAL(10,2) DEFAULT 0,
  payment_method  VARCHAR(50),
  payment_ref     VARCHAR(255),
  status          ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  created_at      TIMESTAMP DEFAULT NOW()
);

Indexes:
- user_id
- type
- status
- created_at
```

#### 8. **commissions** - รับทำ UI
```sql
CREATE TABLE commissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  budget        DECIMAL(10,2),
  status        ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled'),
  attachments   JSON,
  admin_notes   TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

Indexes:
- user_id
- status
```

#### 9. **reviews** - รีวิวสินค้า
```sql
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  product_id  UUID REFERENCES products(id),
  rating      INT CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  is_verified BOOLEAN DEFAULT false,
  helpful     INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);

Indexes:
- product_id
- user_id
- rating
```

#### 10. **notifications** - การแจ้งเตือน
```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  title       VARCHAR(255) NOT NULL,
  message     TEXT,
  type        ENUM('update', 'promotion', 'system', 'order') NOT NULL,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMP DEFAULT NOW()
);

Indexes:
- user_id
- is_read
- created_at
```

#### 11. **wishlists** - รายการโปรด
```sql
CREATE TABLE wishlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  product_id  UUID REFERENCES products(id),
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

Indexes:
- user_id
- product_id
```

#### 12. **announcements** - ประกาศ
```sql
CREATE TABLE announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  content     TEXT,
  media       JSON,
  is_active   BOOLEAN DEFAULT true,
  starts_at   TIMESTAMP,
  ends_at     TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW()
);

Indexes:
- is_active
- starts_at
- ends_at
```

---

## 🔌 API Endpoints (50+ Endpoints)

### **Authentication (3 endpoints)**
```
GET    /api/auth/session           # Get current session
POST   /api/auth/signout           # Sign out
GET    /api/auth/callback/discord  # Discord OAuth callback
```

### **Users (7 endpoints)**
```
GET    /api/users/me               # Get profile
PATCH  /api/users/me               # Update profile
GET    /api/users/me/balance       # Get balance
GET    /api/users/me/orders        # Get orders
GET    /api/users/me/licenses      # Get licenses
GET    /api/users/me/notifications # Get notifications
PATCH  /api/users/me/notifications/:id/read
POST   /api/users/me/notifications/read-all
```

### **Products (7 endpoints)**
```
GET    /api/products               # List products (filters, search, sort)
GET    /api/products/:id           # Get product details
GET    /api/products/featured      # Get featured products
GET    /api/products/flash-sale    # Get flash sale products
GET    /api/products/:id/reviews   # Get product reviews
POST   /api/products/:id/reviews   # Add review
GET    /api/products/search        # Search products
```

### **Orders (4 endpoints)**
```
GET    /api/orders                 # Get user orders
GET    /api/orders/:id             # Get order details
POST   /api/orders                 # Create order
PATCH  /api/orders/:id/cancel      # Cancel order
```

### **Licenses (5 endpoints)**
```
GET    /api/licenses               # Get user licenses
GET    /api/licenses/:id           # Get license details
PATCH  /api/licenses/:id/ip        # Update IP whitelist
GET    /api/licenses/:id/download  # Get download URL
POST   /api/licenses/verify        # Verify license (for FiveM)
```

### **Checkout (3 endpoints)**
```
POST   /api/checkout/stripe        # Create Stripe session
POST   /api/checkout/balance       # Pay with balance
GET    /api/checkout/verify/:orderId # Verify payment
```

### **Topup (4 endpoints)**
```
GET    /api/topup/packages         # Get topup packages
POST   /api/topup/stripe           # Create Stripe topup
POST   /api/topup/promptpay        # Generate PromptPay QR
GET    /api/topup/history          # Get topup history
```

### **Promo Codes (2 endpoints)**
```
POST   /api/promo/validate         # Validate promo code
POST   /api/promo/apply            # Apply promo code
```

### **Wishlist (3 endpoints)**
```
GET    /api/wishlist               # Get wishlist
POST   /api/wishlist/:productId    # Add to wishlist
DELETE /api/wishlist/:productId    # Remove from wishlist
```

### **Commissions (5 endpoints)**
```
GET    /api/commissions            # Get user commissions
POST   /api/commissions            # Create commission
GET    /api/commissions/:id        # Get commission details
PATCH  /api/commissions/:id        # Update commission
DELETE /api/commissions/:id        # Cancel commission
```

### **Announcements (1 endpoint)**
```
GET    /api/announcements/active   # Get active announcements
```

### **Webhooks (2 endpoints)**
```
POST   /api/webhooks/stripe        # Stripe webhook handler
POST   /api/webhooks/discord       # Discord webhook (optional)
```

### **Admin - Dashboard (1 endpoint)**
```
GET    /api/admin/dashboard        # Get dashboard stats
```

### **Admin - Users (4 endpoints)**
```
GET    /api/admin/users            # List all users
GET    /api/admin/users/:id        # Get user details
PATCH  /api/admin/users/:id        # Update user
DELETE /api/admin/users/:id        # Ban/Delete user
```

### **Admin - Products (5 endpoints)**
```
GET    /api/admin/products         # List all products
POST   /api/admin/products         # Create product
GET    /api/admin/products/:id     # Get product
PATCH  /api/admin/products/:id     # Update product
DELETE /api/admin/products/:id     # Delete product
```

### **Admin - Orders (3 endpoints)**
```
GET    /api/admin/orders           # List all orders
GET    /api/admin/orders/:id       # Get order details
PATCH  /api/admin/orders/:id       # Update order status
```

### **Admin - Licenses (3 endpoints)**
```
GET    /api/admin/licenses         # List all licenses
GET    /api/admin/licenses/:id     # Get license details
PATCH  /api/admin/licenses/:id     # Update license
```

### **Admin - Promo Codes (5 endpoints)**
```
GET    /api/admin/promo-codes      # List promo codes
POST   /api/admin/promo-codes      # Create promo code
GET    /api/admin/promo-codes/:id  # Get promo code
PATCH  /api/admin/promo-codes/:id  # Update promo code
DELETE /api/admin/promo-codes/:id  # Delete promo code
```

### **Admin - Commissions (3 endpoints)**
```
GET    /api/admin/commissions      # List all commissions
GET    /api/admin/commissions/:id  # Get commission
PATCH  /api/admin/commissions/:id  # Update commission status
```

### **Admin - Announcements (5 endpoints)**
```
GET    /api/admin/announcements    # List announcements
POST   /api/admin/announcements    # Create announcement
GET    /api/admin/announcements/:id # Get announcement
PATCH  /api/admin/announcements/:id # Update announcement
DELETE /api/admin/announcements/:id # Delete announcement
```

**Total: 60+ API Endpoints**

---

## 🎯 Features & Modules

### **Module 1: Authentication & Authorization**
```typescript
Features:
✅ Discord OAuth 2.0 integration
✅ JWT token generation & validation
✅ Session management
✅ Role-based access control (User, Admin, Moderator)
✅ Protected routes middleware
✅ Refresh token rotation
✅ CSRF protection

Files:
- src/services/auth.service.ts
- src/middleware/auth.middleware.ts
- src/middleware/admin.middleware.ts
- src/controllers/auth.controller.ts
```

### **Module 2: User Management**
```typescript
Features:
✅ User profile CRUD
✅ Balance management
✅ Order history
✅ License management
✅ Notification preferences
✅ Account settings

Files:
- src/services/users.service.ts
- src/controllers/users.controller.ts
- src/routes/users.routes.ts
```

### **Module 3: Product Management**
```typescript
Features:
✅ Product CRUD operations
✅ Category filtering
✅ Search functionality
✅ Sorting (price, date, popularity)
✅ Pagination
✅ Flash sale system
✅ Featured products
✅ Stock management

Files:
- src/services/products.service.ts
- src/controllers/products.controller.ts
- src/routes/products.routes.ts
- src/jobs/flash-sale.job.ts
```

### **Module 4: Shopping Cart & Checkout**
```typescript
Features:
✅ Order creation
✅ Order validation
✅ Promo code application
✅ Multiple payment methods
✅ Order status tracking
✅ Order cancellation

Files:
- src/services/orders.service.ts
- src/controllers/orders.controller.ts
- src/controllers/checkout.controller.ts
- src/routes/checkout.routes.ts
```

### **Module 5: Payment Processing**
```typescript
Features:
✅ Stripe integration
  - Checkout sessions
  - Payment intents
  - Webhook handling
✅ Balance payment
✅ Topup system with bonus
✅ Transaction logging
✅ Refund handling

Files:
- src/services/payment.service.ts
- src/services/topup.service.ts
- src/controllers/webhooks.controller.ts
- src/config/stripe.ts
```

### **Module 6: License Management**
```typescript
Features:
✅ License key generation (XXXX-XXXX-XXXX-XXXX)
✅ License verification API (for FiveM scripts)
✅ IP whitelist management
✅ License expiry tracking
✅ Download URL generation (signed URLs)
✅ License revocation

Files:
- src/services/licenses.service.ts
- src/controllers/licenses.controller.ts
- src/utils/license-generator.ts
- src/jobs/license.job.ts
```

### **Module 7: Promo Code System**
```typescript
Features:
✅ Promo code validation
✅ Percentage & fixed discounts
✅ Minimum purchase requirements
✅ Maximum discount limits
✅ Usage limits
✅ Expiry dates
✅ Auto-increment used count

Files:
- src/services/promo.service.ts
- src/controllers/promo.controller.ts
```

### **Module 8: File Storage**
```typescript
Features:
✅ Product image upload
✅ Product file upload
✅ Secure download URLs (signed, time-limited)
✅ File validation
✅ CDN integration

Files:
- src/services/storage.service.ts
- src/config/storage.ts
```

### **Module 9: Email System**
```typescript
Features:
✅ Order confirmation emails
✅ License delivery emails
✅ Payment receipt emails
✅ Commission status updates
✅ Promotional emails
✅ Email templates (React Email)

Files:
- src/services/email.service.ts
- src/jobs/email.job.ts
- src/templates/ (email templates)
```

### **Module 10: Notification System**
```typescript
Features:
✅ In-app notifications
✅ Real-time updates
✅ Notification types (order, update, promotion, system)
✅ Mark as read
✅ Bulk mark as read
✅ Notification preferences

Files:
- src/services/notification.service.ts
- src/controllers/notifications.controller.ts
```

### **Module 11: Review & Rating**
```typescript
Features:
✅ Product reviews
✅ Star ratings (1-5)
✅ Verified purchase badge
✅ Helpful votes
✅ Review moderation

Files:
- src/services/reviews.service.ts
- src/controllers/reviews.controller.ts
```

### **Module 12: Commission System**
```typescript
Features:
✅ Commission request submission
✅ File attachments
✅ Status tracking
✅ Admin notes
✅ Budget management

Files:
- src/services/commission.service.ts
- src/controllers/commission.controller.ts
```

### **Module 13: Wishlist**
```typescript
Features:
✅ Add/remove products
✅ Sync with database
✅ Wishlist notifications

Files:
- src/services/wishlist.service.ts
- src/controllers/wishlist.controller.ts
```

### **Module 14: Admin Panel**
```typescript
Features:
✅ Dashboard statistics
✅ Revenue analytics
✅ User management
✅ Product management
✅ Order management
✅ License management
✅ Promo code management
✅ Commission management
✅ Announcement management

Files:
- src/services/admin.service.ts
- src/services/analytics.service.ts
- src/controllers/admin.controller.ts
```

### **Module 15: Analytics & Reporting**
```typescript
Features:
✅ Sales analytics
✅ Revenue charts
✅ User growth
✅ Product performance
✅ Top products
✅ Recent orders

Files:
- src/services/analytics.service.ts
```

### **Module 16: Security & Rate Limiting**
```typescript
Features:
✅ Rate limiting (per IP, per user)
✅ Request validation
✅ SQL injection prevention (Prisma)
✅ XSS protection
✅ CORS configuration
✅ Helmet.js security headers

Files:
- src/middleware/ratelimit.middleware.ts
- src/middleware/validation.middleware.ts
```

### **Module 17: Background Jobs**
```typescript
Features:
✅ Flash sale expiry checker
✅ License expiry checker
✅ Email queue processing
✅ Database cleanup
✅ Cache warming

Files:
- src/jobs/flash-sale.job.ts
- src/jobs/license.job.ts
- src/jobs/email.job.ts
- src/jobs/cleanup.job.ts
```

---

## 📅 Implementation Phases

### **Phase 1: Foundation (Week 1) - 5-7 วัน**

#### Day 1-2: Project Setup
```bash
✅ Initialize Bun project
✅ Setup Hono framework
✅ Configure TypeScript
✅ Setup Prisma
✅ Create database schema
✅ Run migrations
✅ Setup environment variables
✅ Configure logging (Pino)
```

#### Day 3-4: Authentication
```bash
✅ Discord OAuth integration
✅ JWT token generation
✅ Session management
✅ Auth middleware
✅ Protected routes
✅ Role-based access control
```

#### Day 5-7: Core APIs
```bash
✅ User management APIs
✅ Product CRUD APIs
✅ Basic search & filter
✅ Pagination
✅ Error handling
✅ Request validation
```

**Deliverables:**
- ✅ Working API server
- ✅ Database connected
- ✅ Authentication working
- ✅ Basic CRUD operations

---

### **Phase 2: E-Commerce Core (Week 2) - 5-7 วัน**

#### Day 1-2: Order System
```bash
✅ Order creation
✅ Order items management
✅ Order status workflow
✅ Order validation
✅ Order history
```

#### Day 3-4: Payment Integration
```bash
✅ Stripe setup
✅ Checkout session creation
✅ Payment intent handling
✅ Webhook handlers
✅ Balance payment
```

#### Day 5-7: Promo & Topup
```bash
✅ Promo code validation
✅ Discount calculation
✅ Topup packages
✅ Bonus calculation
✅ Transaction logging
```

**Deliverables:**
- ✅ Complete checkout flow
- ✅ Payment processing
- ✅ Promo codes working
- ✅ Topup system

---

### **Phase 3: License System (Week 3) - 5-7 วัน**

#### Day 1-2: License Generation
```bash
✅ License key algorithm
✅ License creation on order complete
✅ License storage
✅ License retrieval
```

#### Day 3-4: License Features
```bash
✅ IP whitelist management
✅ License verification API
✅ License expiry tracking
✅ License revocation
```

#### Day 5-7: File Storage
```bash
✅ Cloudflare R2 setup
✅ File upload
✅ Signed URL generation
✅ Download endpoint
✅ File validation
```

**Deliverables:**
- ✅ License system working
- ✅ FiveM verification API
- ✅ File storage & downloads

---

### **Phase 4: Features & Polish (Week 4) - 5-7 วัน**

#### Day 1-2: Reviews & Wishlist
```bash
✅ Review system
✅ Rating calculation
✅ Wishlist sync
✅ Notification system
```

#### Day 3-4: Commission & Email
```bash
✅ Commission management
✅ Email service setup
✅ Email templates
✅ Email queue
```

#### Day 5-7: Announcements & Extras
```bash
✅ Announcement system
✅ Flash sale automation
✅ Search optimization
✅ Cache implementation
```

**Deliverables:**
- ✅ All features complete
- ✅ Email working
- ✅ Notifications working

---

### **Phase 5: Admin & Production (Week 5) - 5-7 วัน**

#### Day 1-2: Admin APIs
```bash
✅ Dashboard statistics
✅ Analytics endpoints
✅ User management
✅ Product management
```

#### Day 3-4: Admin Features
```bash
✅ Order management
✅ License management
✅ Promo code management
✅ Commission management
```

#### Day 5-7: Production Ready
```bash
✅ Rate limiting
✅ Error monitoring (Sentry)
✅ Performance optimization
✅ Security hardening
✅ Documentation
✅ Testing
✅ Deployment
```

**Deliverables:**
- ✅ Complete admin panel
- ✅ Production-ready
- ✅ Deployed & live

---

## 🚀 Setup & Installation

### **Prerequisites**
```bash
✅ Bun >= 1.0.0
✅ PostgreSQL >= 16
✅ Redis >= 7.0 (optional but recommended)
✅ Git
```

### **Step 1: Clone & Install**
```bash
# Clone repository
git clone <backend-repo-url>
cd qr-studios-backend

# Install dependencies
bun install
```

### **Step 2: Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

**Required Environment Variables:**
```env
# Server
NODE_ENV=development
PORT=4000
API_URL=http://localhost:4000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/qrstudio

# NextAuth (from frontend)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Discord OAuth
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Cloudflare R2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=qrstudio
R2_PUBLIC_URL=https://cdn.qrstudio.com

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Email (Resend)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@qrstudio.com

# Sentry (optional)
SENTRY_DSN=https://xxx@sentry.io/xxx

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=30d
```

### **Step 3: Database Setup**
```bash
# Generate Prisma client
bunx prisma generate

# Run migrations
bunx prisma migrate dev

# Seed database (optional)
bunx prisma db seed
```

### **Step 4: Run Development Server**
```bash
# Development mode (with hot reload)
bun run dev

# Production mode
bun run build
bun run start
```

### **Step 5: Verify Installation**
```bash
# Check health endpoint
curl http://localhost:4000/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-12-30T16:00:00.000Z",
  "database": "connected",
  "redis": "connected"
}
```

---

## 🔄 Development Workflow

### **Daily Development Flow**
```bash
1. Pull latest changes
   git pull origin main

2. Create feature branch
   git checkout -b feature/your-feature

3. Make changes
   - Write code
   - Write tests
   - Update documentation

4. Run tests
   bun test

5. Commit changes
   git add .
   git commit -m "feat: your feature"

6. Push to remote
   git push origin feature/your-feature

7. Create Pull Request
   - Review code
   - Run CI/CD
   - Merge to main
```

### **Code Standards**
```typescript
✅ TypeScript strict mode
✅ ESLint + Prettier
✅ Conventional commits
✅ Code reviews required
✅ Test coverage > 80%
```

### **Git Workflow**
```
main (production)
  ↓
develop (staging)
  ↓
feature/* (development)
```

---

## 🧪 Testing Strategy

### **Unit Tests**
```typescript
// Example: License generation test
import { generateLicenseKey } from '@/utils/license-generator';

describe('License Generator', () => {
  it('should generate valid license key', () => {
    const key = generateLicenseKey();
    expect(key).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });
});
```

### **Integration Tests**
```typescript
// Example: Order creation test
import { app } from '@/app';

describe('POST /api/orders', () => {
  it('should create order successfully', async () => {
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ productId: '123', quantity: 1 }],
      }),
    });
    
    expect(res.status).toBe(201);
  });
});
```

### **E2E Tests**
```typescript
// Example: Complete checkout flow
describe('Checkout Flow', () => {
  it('should complete full checkout', async () => {
    // 1. Add to cart
    // 2. Apply promo code
    // 3. Create order
    // 4. Process payment
    // 5. Generate license
    // 6. Send email
  });
});
```

### **Test Coverage Goals**
```
✅ Unit tests: > 80%
✅ Integration tests: > 70%
✅ E2E tests: Critical paths
```

---

## 🚢 Deployment Plan

### **Deployment Options**

#### Option 1: Railway (Recommended)
```yaml
Pros:
✅ Easy deployment
✅ PostgreSQL included
✅ Redis included
✅ Auto scaling
✅ Free tier available
✅ Git integration

Steps:
1. Connect GitHub repo
2. Add environment variables
3. Deploy automatically
```

#### Option 2: Vercel + Neon
```yaml
Pros:
✅ Serverless
✅ Edge functions
✅ Free PostgreSQL (Neon)
✅ Auto scaling

Steps:
1. Deploy to Vercel
2. Connect Neon database
3. Setup Redis (Upstash)
```

#### Option 3: VPS (DigitalOcean/Linode)
```yaml
Pros:
✅ Full control
✅ Cost-effective
✅ Dedicated resources

Steps:
1. Setup Ubuntu server
2. Install Bun, PostgreSQL, Redis
3. Setup Nginx reverse proxy
4. Configure SSL (Let's Encrypt)
5. Setup PM2 for process management
```

### **CI/CD Pipeline**
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
      - run: bun run build
      - name: Deploy to Railway
        run: railway up
```

### **Production Checklist**
```
✅ Environment variables set
✅ Database migrations run
✅ SSL certificate configured
✅ CORS configured
✅ Rate limiting enabled
✅ Error monitoring (Sentry)
✅ Logging configured
✅ Backup strategy
✅ Health checks
✅ Load testing
```

---

## 📊 Performance Targets

### **Response Times**
```
✅ API endpoints: < 100ms (p95)
✅ Database queries: < 50ms (p95)
✅ File uploads: < 2s (10MB)
✅ License verification: < 50ms
```

### **Throughput**
```
✅ Requests per second: > 1000
✅ Concurrent users: > 500
✅ Database connections: 20-50
```

### **Availability**
```
✅ Uptime: > 99.9%
✅ Error rate: < 0.1%
```

---

## 🔒 Security Measures

### **Authentication & Authorization**
```
✅ JWT tokens with expiry
✅ Refresh token rotation
✅ Role-based access control
✅ CSRF protection
✅ Rate limiting per user/IP
```

### **Data Protection**
```
✅ Password hashing (bcrypt)
✅ Sensitive data encryption
✅ SQL injection prevention (Prisma)
✅ XSS protection
✅ Input validation
✅ Output sanitization
```

### **API Security**
```
✅ HTTPS only
✅ CORS configuration
✅ Security headers (Helmet)
✅ Request size limits
✅ File upload validation
```

---

## 📚 Documentation

### **API Documentation**
```
✅ OpenAPI/Swagger spec
✅ Endpoint descriptions
✅ Request/response examples
✅ Authentication guide
✅ Error codes
```

### **Developer Guide**
```
✅ Setup instructions
✅ Architecture overview
✅ Code standards
✅ Testing guide
✅ Deployment guide
```

---

## 🎯 Success Metrics

### **Development Metrics**
```
✅ Code coverage: > 80%
✅ Build time: < 2 minutes
✅ Test execution: < 1 minute
✅ Deploy time: < 5 minutes
```

### **Business Metrics**
```
✅ API response time: < 100ms
✅ Error rate: < 0.1%
✅ Uptime: > 99.9%
✅ User satisfaction: > 4.5/5
```

---

## 📝 Next Steps

### **Immediate Actions**
1. ✅ Review this plan
2. ⬜ Setup development environment
3. ⬜ Initialize project
4. ⬜ Setup database
5. ⬜ Start Phase 1 development

### **Resources Needed**
```
✅ PostgreSQL database (Railway/Neon)
✅ Redis instance (Upstash/Railway)
✅ Stripe account (test mode)
✅ Discord OAuth app
✅ Cloudflare R2 bucket
✅ Resend account (email)
✅ Sentry account (monitoring)
```

---

**สถานะ:** ✅ **READY TO START BACKEND DEVELOPMENT**

**Timeline:** 5 สัปดาห์ (35 วัน)  
**Team Size:** 1-2 developers  
**Complexity:** Medium-High

---

*Plan created: 30 ธันวาคม 2025*
