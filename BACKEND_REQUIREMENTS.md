# QR Studio - Backend Requirements

## 📋 สารบัญ
1. [ภาพรวมระบบ](#ภาพรวมระบบ)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Authentication](#authentication)
5. [Payment System](#payment-system)
6. [License System](#license-system)
7. [E-Commerce Features](#e-commerce-features)
8. [Admin Panel](#admin-panel)
9. [Notifications](#notifications)
10. [File Storage](#file-storage)

---

## 🏗️ ภาพรวมระบบ

### Tech Stack แนะนำ
- **Runtime:** Node.js / Bun
- **Framework:** Express.js / Fastify / Hono
- **Database:** PostgreSQL / MySQL
- **ORM:** Prisma / Drizzle
- **Cache:** Redis
- **File Storage:** AWS S3 / Cloudflare R2
- **Payment:** Stripe
- **Authentication:** NextAuth.js (Discord OAuth)

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id    VARCHAR(255) UNIQUE NOT NULL,
  username      VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE,
  avatar        TEXT,
  balance       DECIMAL(10,2) DEFAULT 0,
  role          ENUM('user', 'admin', 'moderator') DEFAULT 'user',
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);
```

### Products Table
```sql
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(255) UNIQUE NOT NULL,
  description     TEXT,
  price           DECIMAL(10,2) NOT NULL,
  original_price  DECIMAL(10,2),
  category        ENUM('script', 'ui', 'bundle') NOT NULL,
  images          JSON, -- Array of image URLs
  features        JSON, -- Array of feature strings
  tags            JSON, -- Array of tags
  stock           INT DEFAULT -1, -- -1 = unlimited
  is_new          BOOLEAN DEFAULT false,
  is_featured     BOOLEAN DEFAULT false,
  is_flash_sale   BOOLEAN DEFAULT false,
  flash_sale_price DECIMAL(10,2),
  flash_sale_ends TIMESTAMP,
  download_url    TEXT, -- Encrypted download link
  version         VARCHAR(50),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

### Licenses Table
```sql
CREATE TABLE licenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  product_id    UUID REFERENCES products(id),
  order_id      UUID REFERENCES orders(id),
  license_key   VARCHAR(255) UNIQUE NOT NULL,
  ip_address    VARCHAR(45), -- Whitelisted IP
  status        ENUM('active', 'expired', 'revoked') DEFAULT 'active',
  expires_at    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  total           DECIMAL(10,2) NOT NULL,
  discount        DECIMAL(10,2) DEFAULT 0,
  promo_code      VARCHAR(50),
  status          ENUM('pending', 'processing', 'completed', 'cancelled', 'refunded') DEFAULT 'pending',
  payment_method  ENUM('stripe', 'balance', 'promptpay') NOT NULL,
  payment_intent  VARCHAR(255), -- Stripe payment intent ID
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

### Order Items Table
```sql
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID REFERENCES orders(id),
  product_id  UUID REFERENCES products(id),
  quantity    INT NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### Promo Codes Table
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
```

### Transactions Table (เติมเงิน)
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
```

### Commissions Table (รับทำ UI)
```sql
CREATE TABLE commissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  budget        DECIMAL(10,2),
  status        ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  attachments   JSON, -- Array of file URLs
  admin_notes   TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);
```

### Reviews Table
```sql
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  product_id  UUID REFERENCES products(id),
  rating      INT CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  is_verified BOOLEAN DEFAULT false, -- Verified purchase
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### Notifications Table
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
```

### Wishlists Table
```sql
CREATE TABLE wishlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  product_id  UUID REFERENCES products(id),
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
```

### Announcements Table
```sql
CREATE TABLE announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  content     TEXT,
  media       JSON, -- Array of {type: 'image'|'video', url: string}
  is_active   BOOLEAN DEFAULT true,
  starts_at   TIMESTAMP,
  ends_at     TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/[...nextauth]` | NextAuth.js handler |
| GET | `/api/auth/session` | Get current session |
| POST | `/api/auth/signout` | Sign out user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PATCH | `/api/users/me` | Update user profile |
| GET | `/api/users/me/balance` | Get user balance |
| GET | `/api/users/me/orders` | Get user orders |
| GET | `/api/users/me/licenses` | Get user licenses |
| GET | `/api/users/me/notifications` | Get user notifications |
| PATCH | `/api/users/me/notifications/:id/read` | Mark notification as read |
| POST | `/api/users/me/notifications/read-all` | Mark all as read |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products (with filters) |
| GET | `/api/products/:id` | Get product details |
| GET | `/api/products/featured` | Get featured products |
| GET | `/api/products/flash-sale` | Get flash sale products |
| GET | `/api/products/:id/reviews` | Get product reviews |
| POST | `/api/products/:id/reviews` | Add product review |

### Cart & Checkout
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/checkout` | Create checkout session |
| POST | `/api/checkout/stripe` | Create Stripe payment intent |
| POST | `/api/checkout/balance` | Pay with balance |
| GET | `/api/checkout/verify/:orderId` | Verify payment status |

### Promo Codes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/promo/validate` | Validate promo code |
| POST | `/api/promo/apply` | Apply promo code to cart |

### Licenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/licenses` | Get user's licenses |
| GET | `/api/licenses/:id` | Get license details |
| PATCH | `/api/licenses/:id/ip` | Update whitelisted IP |
| GET | `/api/licenses/:id/download` | Get download URL |
| POST | `/api/licenses/verify` | Verify license (for scripts) |

### Top-up (เติมเงิน)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/topup/packages` | Get topup packages |
| POST | `/api/topup/stripe` | Create Stripe topup session |
| POST | `/api/topup/promptpay` | Generate PromptPay QR |
| GET | `/api/topup/history` | Get topup history |

### Commissions (รับทำ UI)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/commissions` | Get user's commissions |
| POST | `/api/commissions` | Create new commission |
| GET | `/api/commissions/:id` | Get commission details |
| PATCH | `/api/commissions/:id` | Update commission |
| DELETE | `/api/commissions/:id` | Cancel commission |

### Wishlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wishlist` | Get user's wishlist |
| POST | `/api/wishlist/:productId` | Add to wishlist |
| DELETE | `/api/wishlist/:productId` | Remove from wishlist |

### Announcements
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/announcements/active` | Get active announcements |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/stripe` | Stripe webhook handler |
| POST | `/api/webhooks/discord` | Discord webhook (optional) |

---

## 🔐 Authentication

### Discord OAuth Flow
```
1. User clicks "Login with Discord"
2. Redirect to Discord OAuth
3. Discord redirects back with code
4. Exchange code for access token
5. Fetch user info from Discord
6. Create/update user in database
7. Create JWT session
```

### Required Discord Scopes
- `identify` - Get user info
- `email` - Get user email
- `guilds` - Check server membership (optional)

### Session Management
- Use JWT tokens with 30-day expiry
- Store refresh tokens in database
- Implement token rotation

### Protected Routes
```typescript
// Middleware example
export async function authMiddleware(req, res, next) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = session.user;
  next();
}
```

---

## 💳 Payment System

### Stripe Integration

#### 1. Create Checkout Session
```typescript
// POST /api/checkout/stripe
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: items.map(item => ({
    price_data: {
      currency: 'thb',
      product_data: {
        name: item.name,
        images: item.images,
      },
      unit_amount: item.price * 100, // satang
    },
    quantity: item.quantity,
  })),
  mode: 'payment',
  success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/cart`,
  metadata: {
    userId: user.id,
    orderId: order.id,
  },
});
```

#### 2. Webhook Handler
```typescript
// POST /api/webhooks/stripe
switch (event.type) {
  case 'checkout.session.completed':
    // Mark order as completed
    // Generate licenses
    // Send confirmation email
    break;
  case 'payment_intent.payment_failed':
    // Mark order as failed
    // Notify user
    break;
}
```

### Balance Payment
```typescript
// POST /api/checkout/balance
async function payWithBalance(userId, orderId, amount) {
  const user = await db.users.findUnique({ where: { id: userId } });
  
  if (user.balance < amount) {
    throw new Error("Insufficient balance");
  }
  
  await db.$transaction([
    db.users.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    }),
    db.orders.update({
      where: { id: orderId },
      data: { status: 'completed' },
    }),
    db.transactions.create({
      data: {
        userId,
        type: 'purchase',
        amount: -amount,
        status: 'completed',
      },
    }),
  ]);
  
  // Generate licenses
  await generateLicenses(orderId);
}
```

### Top-up System
```typescript
// Bonus calculation
function calculateBonus(amount: number): number {
  if (amount >= 5000) return Math.floor(amount * 0.12);
  if (amount >= 2000) return Math.floor(amount * 0.10);
  if (amount >= 1000) return Math.floor(amount * 0.08);
  if (amount >= 500) return Math.floor(amount * 0.06);
  if (amount >= 300) return Math.floor(amount * 0.05);
  return 0;
}
```

---

## 🔑 License System

### License Key Generation
```typescript
import { nanoid } from 'nanoid';
import crypto from 'crypto';

function generateLicenseKey(): string {
  // Format: XXXX-XXXX-XXXX-XXXX
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(nanoid(4).toUpperCase());
  }
  return segments.join('-');
}
```

### License Verification API (สำหรับ Script)
```typescript
// POST /api/licenses/verify
// Called from FiveM script
async function verifyLicense(req, res) {
  const { licenseKey, resourceName, serverIp } = req.body;
  
  const license = await db.licenses.findUnique({
    where: { license_key: licenseKey },
    include: { product: true },
  });
  
  if (!license) {
    return res.status(404).json({ valid: false, error: "Invalid license" });
  }
  
  if (license.status !== 'active') {
    return res.status(403).json({ valid: false, error: "License not active" });
  }
  
  if (license.ip_address && license.ip_address !== serverIp) {
    return res.status(403).json({ valid: false, error: "IP not whitelisted" });
  }
  
  // Log verification
  await db.licenseVerifications.create({
    data: {
      licenseId: license.id,
      serverIp,
      resourceName,
    },
  });
  
  return res.json({
    valid: true,
    product: license.product.name,
    expiresAt: license.expires_at,
  });
}
```

### IP Whitelist
```typescript
// PATCH /api/licenses/:id/ip
async function updateLicenseIp(req, res) {
  const { id } = req.params;
  const { ipAddress } = req.body;
  
  // Validate IP format
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ipAddress)) {
    return res.status(400).json({ error: "Invalid IP format" });
  }
  
  await db.licenses.update({
    where: { id, userId: req.user.id },
    data: { ip_address: ipAddress },
  });
  
  return res.json({ success: true });
}
```

---

## 🛒 E-Commerce Features

### Product Filtering
```typescript
// GET /api/products?category=script&sort=price_asc&search=hud
async function getProducts(req, res) {
  const { category, sort, search, page = 1, limit = 12 } = req.query;
  
  const where = {
    ...(category && { category }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ],
    }),
  };
  
  const orderBy = {
    price_asc: { price: 'asc' },
    price_desc: { price: 'desc' },
    newest: { created_at: 'desc' },
    popular: { review_count: 'desc' },
  }[sort] || { created_at: 'desc' };
  
  const products = await db.products.findMany({
    where,
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
  });
  
  return res.json(products);
}
```

### Flash Sale
```typescript
// Cron job to check flash sale expiry
async function checkFlashSaleExpiry() {
  await db.products.updateMany({
    where: {
      is_flash_sale: true,
      flash_sale_ends: { lt: new Date() },
    },
    data: {
      is_flash_sale: false,
      flash_sale_price: null,
      flash_sale_ends: null,
    },
  });
}
```

### Promo Code Validation
```typescript
async function validatePromoCode(code: string, cartTotal: number) {
  const promo = await db.promoCodes.findUnique({
    where: { code: code.toUpperCase() },
  });
  
  if (!promo || !promo.is_active) {
    return { valid: false, error: "Invalid promo code" };
  }
  
  if (promo.expires_at && promo.expires_at < new Date()) {
    return { valid: false, error: "Promo code expired" };
  }
  
  if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
    return { valid: false, error: "Promo code usage limit reached" };
  }
  
  if (promo.min_purchase && cartTotal < promo.min_purchase) {
    return { valid: false, error: `Minimum purchase: ฿${promo.min_purchase}` };
  }
  
  let discount = 0;
  if (promo.type === 'percentage') {
    discount = (cartTotal * promo.discount) / 100;
    if (promo.max_discount) {
      discount = Math.min(discount, promo.max_discount);
    }
  } else {
    discount = promo.discount;
  }
  
  return { valid: true, discount, promo };
}
```

---

## 👨‍💼 Admin Panel

### Admin Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Get dashboard stats |
| GET | `/api/admin/users` | List all users |
| PATCH | `/api/admin/users/:id` | Update user |
| GET | `/api/admin/orders` | List all orders |
| PATCH | `/api/admin/orders/:id` | Update order status |
| GET | `/api/admin/products` | List all products |
| POST | `/api/admin/products` | Create product |
| PATCH | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Delete product |
| GET | `/api/admin/licenses` | List all licenses |
| PATCH | `/api/admin/licenses/:id` | Update license |
| GET | `/api/admin/promo-codes` | List promo codes |
| POST | `/api/admin/promo-codes` | Create promo code |
| PATCH | `/api/admin/promo-codes/:id` | Update promo code |
| DELETE | `/api/admin/promo-codes/:id` | Delete promo code |
| GET | `/api/admin/commissions` | List commissions |
| PATCH | `/api/admin/commissions/:id` | Update commission |
| GET | `/api/admin/announcements` | List announcements |
| POST | `/api/admin/announcements` | Create announcement |
| PATCH | `/api/admin/announcements/:id` | Update announcement |
| DELETE | `/api/admin/announcements/:id` | Delete announcement |

### Dashboard Stats
```typescript
async function getDashboardStats() {
  const [
    totalUsers,
    totalOrders,
    totalRevenue,
    todayOrders,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    db.users.count(),
    db.orders.count({ where: { status: 'completed' } }),
    db.orders.aggregate({
      where: { status: 'completed' },
      _sum: { total: true },
    }),
    db.orders.count({
      where: {
        status: 'completed',
        created_at: { gte: startOfDay(new Date()) },
      },
    }),
    db.orders.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: { user: true },
    }),
    db.orderItems.groupBy({
      by: ['product_id'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);
  
  return {
    totalUsers,
    totalOrders,
    totalRevenue: totalRevenue._sum.total || 0,
    todayOrders,
    recentOrders,
    topProducts,
  };
}
```

---

## 🔔 Notifications

### Send Notification
```typescript
async function sendNotification(userId: string, data: {
  title: string;
  message: string;
  type: 'update' | 'promotion' | 'system' | 'order';
}) {
  await db.notifications.create({
    data: {
      user_id: userId,
      ...data,
    },
  });
  
  // Optional: Send push notification / email
  // await sendPushNotification(userId, data);
  // await sendEmail(userId, data);
}
```

### Notification Events
- Order completed
- License generated
- License expiring soon
- New product release
- Flash sale started
- Commission status update
- Balance topped up

---

## 📁 File Storage

### Upload Configuration
```typescript
// Using AWS S3 / Cloudflare R2
const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

async function uploadFile(file: Buffer, key: string) {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file,
    ContentType: 'application/octet-stream',
  }));
  
  return `${process.env.S3_URL}/${key}`;
}
```

### Secure Download URLs
```typescript
async function getDownloadUrl(licenseId: string) {
  const license = await db.licenses.findUnique({
    where: { id: licenseId },
    include: { product: true },
  });
  
  // Generate signed URL (expires in 1 hour)
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: license.product.download_key,
  });
  
  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  
  return signedUrl;
}
```

---

## 🔧 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/qrstudio

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Discord OAuth
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# S3 / R2
S3_REGION=auto
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx
S3_BUCKET=qrstudio
S3_URL=https://cdn.qrstudio.com

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=xxx
SMTP_PASS=xxx
```

---

## ✅ Checklist

### Phase 1: Core
- [ ] Database setup (Prisma schema)
- [ ] Discord OAuth authentication
- [ ] User management
- [ ] Product CRUD
- [ ] Basic cart & checkout

### Phase 2: Payment
- [ ] Stripe integration
- [ ] Balance system
- [ ] Top-up functionality
- [ ] Promo codes

### Phase 3: Licenses
- [ ] License generation
- [ ] License verification API
- [ ] IP whitelist
- [ ] Download system

### Phase 4: Features
- [ ] Wishlist sync
- [ ] Reviews & ratings
- [ ] Notifications
- [ ] Flash sale system

### Phase 5: Admin
- [ ] Admin dashboard
- [ ] User management
- [ ] Order management
- [ ] Product management
- [ ] Analytics

### Phase 6: Polish
- [ ] Email notifications
- [ ] Rate limiting
- [ ] Caching (Redis)
- [ ] Error monitoring
- [ ] Logging

---

## 📝 Notes

### Security Considerations
1. Always validate user input
2. Use parameterized queries (Prisma handles this)
3. Implement rate limiting on sensitive endpoints
4. Validate webhook signatures
5. Use HTTPS everywhere
6. Sanitize file uploads
7. Implement CORS properly

### Performance Tips
1. Use database indexes on frequently queried columns
2. Implement pagination for list endpoints
3. Cache frequently accessed data (Redis)
4. Use connection pooling
5. Optimize images before storage

### FiveM Script Integration
Scripts จะต้องเรียก API เพื่อ verify license:
```lua
-- ตัวอย่าง Lua code สำหรับ FiveM
local function verifyLicense()
    local licenseKey = GetConvar("qr_license_key", "")
    local serverIp = GetConvar("sv_lan_ip", "")
    
    PerformHttpRequest("https://api.qrstudio.com/api/licenses/verify", function(code, data)
        local response = json.decode(data)
        if code == 200 and response.valid then
            print("^2License verified successfully^0")
        else
            print("^1License verification failed: " .. (response.error or "Unknown error") .. "^0")
            -- Stop resource or limit functionality
        end
    end, "POST", json.encode({
        licenseKey = licenseKey,
        serverIp = serverIp,
        resourceName = GetCurrentResourceName()
    }), {
        ["Content-Type"] = "application/json"
    })
end
```

---

## 🎨 Frontend Ready Components

### Pages พร้อมใช้งาน
| Page | Path | Status |
|------|------|--------|
| หน้าแรก | `/` | ✅ พร้อม |
| สินค้าทั้งหมด | `/products` | ✅ พร้อม |
| รายละเอียดสินค้า | `/products/[id]` | ✅ พร้อม |
| ตะกร้าสินค้า | `/cart` | ✅ พร้อม |
| ชำระเงิน | `/checkout` | ✅ พร้อม |
| เข้าสู่ระบบ | `/auth/login` | ✅ พร้อม |
| Auth Error | `/auth/error` | ✅ พร้อม |
| Dashboard | `/dashboard` | ✅ พร้อม |
| คำสั่งซื้อ | `/dashboard/orders` | ✅ พร้อม |
| License | `/dashboard/licenses` | ✅ พร้อม |
| เติมเงิน | `/dashboard/topup` | ✅ พร้อม |
| รายการโปรด | `/dashboard/wishlist` | ✅ พร้อม |
| ตั้งค่า | `/dashboard/settings` | ✅ พร้อม |
| รับทำ UI | `/commission` | ✅ พร้อม |
| รับทำเว็บ | `/web-design` | ✅ พร้อม |
| ติดต่อเรา | `/contact` | ✅ พร้อม |

### API Hooks พร้อมใช้งาน
```typescript
// src/hooks/useApi.ts
useApi()           // Generic API hook
useProducts()      // Products API
useOrders()        // Orders API
useLicenses()      // Licenses API
useCheckout()      // Checkout API
useTopup()         // Topup API
useWishlistApi()   // Wishlist API
useReviews()       // Reviews API
usePromoApi()      // Promo codes API
useUser()          // User profile API
useNotificationsApi() // Notifications API
```

### API Functions พร้อมใช้งาน
```typescript
// src/lib/api.ts
authApi           // Auth endpoints
userApi           // User endpoints
productsApi       // Products endpoints
ordersApi         // Orders endpoints
licensesApi       // Licenses endpoints
checkoutApi       // Checkout endpoints
topupApi          // Topup endpoints
promoApi          // Promo endpoints
wishlistApi       // Wishlist endpoints
commissionApi     // Commission endpoints
notificationsApi  // Notifications endpoints
announcementsApi  // Announcements endpoints
```

### Zustand Stores
```typescript
// Client-side state management
useCartStore       // Cart state (localStorage)
useWishlistStore   // Wishlist state (localStorage)
useRecentlyViewedStore // Recently viewed (localStorage)
usePromoStore      // Promo codes (localStorage)
useNotificationStore // Notifications
```

### UI Components พร้อมใช้งาน
- `WishlistButton` - ปุ่มเพิ่ม/ลบรายการโปรด
- `StockCounter` - แสดงจำนวนสินค้า
- `FlashSaleTimer` - นับถอยหลัง Flash Sale
- `PromoCodeInput` - ช่องกรอกโค้ดส่วนลด
- `ReviewStars` - แสดงคะแนนดาว
- `ReviewSummary` - สรุปรีวิว
- `ReviewSection` - Section รีวิวสินค้า
- `RecentlyViewed` - สินค้าที่เพิ่งดู
- `OrderDetailModal` - Modal รายละเอียดคำสั่งซื้อ
- `LoadingState` - Loading indicator
- `ErrorState` - Error display
- `EmptyState` - Empty state display
- `Skeleton` - Loading placeholders
- `Confetti` - Celebration effect

### Types พร้อมใช้งาน
```typescript
// src/types/index.ts - Frontend types
// src/types/api.ts - API response types
```

### Admin Panel พร้อมใช้งาน
| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/admin` | ภาพรวมระบบ, สถิติ, คำสั่งซื้อล่าสุด |
| Analytics | `/admin/analytics` | กราฟวิเคราะห์รายได้, ยอดขาย, ลูกค้า |
| Products | `/admin/products` | จัดการสินค้า CRUD (เพิ่ม/แก้ไข/ลบ) |
| Orders | `/admin/orders` | จัดการคำสั่งซื้อ + ดูรายละเอียด + อัพเดทสถานะ |
| Users | `/admin/users` | จัดการผู้ใช้, บทบาท, แบน/ปลดแบน |
| Licenses | `/admin/licenses` | จัดการ License Keys |
| Promo Codes | `/admin/promo-codes` | จัดการโค้ดส่วนลด CRUD |
| Announcements | `/admin/announcements` | จัดการประกาศ CRUD + ซ่อน/แสดง |
| Settings | `/admin/settings` | ตั้งค่าระบบ |

### Admin Components พร้อมใช้งาน
| Component | Path | Description |
|-----------|------|-------------|
| ProductFormModal | `src/components/admin/product-form-modal.tsx` | ฟอร์มเพิ่ม/แก้ไขสินค้า |
| UserFormModal | `src/components/admin/user-form-modal.tsx` | ฟอร์มแก้ไขผู้ใช้ |
| PromoFormModal | `src/components/admin/promo-form-modal.tsx` | ฟอร์มเพิ่ม/แก้ไขโค้ดส่วนลด |
| AnnouncementFormModal | `src/components/admin/announcement-form-modal.tsx` | ฟอร์มเพิ่ม/แก้ไขประกาศ |
| OrderDetailModal | `src/components/admin/order-detail-modal.tsx` | ดูรายละเอียดคำสั่งซื้อ |
| ConfirmModal | `src/components/admin/confirm-modal.tsx` | Modal ยืนยันการลบ/แบน |
