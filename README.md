# QR STUDIO

เว็บแอพพลิเคชันขาย Script เกม และ UI สำหรับ FiveM พร้อมบริการรับทำ UI ตามสั่ง

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Runtime:** Bun
- **Styling:** TailwindCSS v4
- **UI Components:** Custom Glassmorphism Design
- **State Management:** Zustand
- **Animation:** Framer Motion
- **Authentication:** NextAuth.js (Discord OAuth)
- **Payment:** Stripe
- **Icons:** Lucide React
- **Font:** Kanit (Thai/Latin)

## Features

1. **ขาย Script เกม / UI** - ระบบ E-commerce สำหรับขาย Digital Products
2. **รับทำ UI** - ระบบ Commission สำหรับรับทำ UI ตามสั่ง
3. **Discord OAuth** - ล็อคอินผ่าน Discord
4. **Dashboard** - แสดงจำนวนผู้เข้าชม / สินค้า / License / สมาชิก
5. **Notifications** - ระบบแจ้งเตือนการอัพเดท
6. **Product Showcase** - หน้าโชว์สินค้าพร้อมระบบกรองและค้นหา
7. **Mobile Responsive** - รองรับการแสดงผลบนมือถือ
8. **Top-up System** - ระบบเติมเงิน (เตรียมไว้สำหรับ Backend)
9. **Payment System** - ระบบชำระเงินผ่าน Stripe
10. **Shopping Cart** - ระบบตะกร้าสินค้า
11. **SEO Optimized** - ปรับแต่ง Meta tags และ Open Graph
12. **Security** - ใช้ Stripe สำหรับการชำระเงินที่ปลอดภัย

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- Discord Application (สำหรับ OAuth)
- Stripe Account (สำหรับ Payment)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/qr-studios.git
cd qr-studios

# Install dependencies
bun install

# Copy environment variables
cp env.example .env.local

# Run development server
bun run dev
```

### Environment Variables

สร้างไฟล์ `.env.local` และกำหนดค่าต่อไปนี้:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key_here

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Database (for future backend)
DATABASE_URL=your_database_url
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Authentication pages
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout flow
│   ├── commission/        # Commission/Custom UI page
│   ├── products/          # Products listing & detail
│   └── layout.tsx         # Root layout
├── components/
│   ├── home/              # Homepage sections
│   ├── layout/            # Navbar, Footer
│   ├── product/           # Product components
│   ├── providers/         # Context providers
│   └── ui/                # Reusable UI components
├── data/                  # Mock data
├── lib/                   # Utilities & configurations
├── store/                 # Zustand stores
└── types/                 # TypeScript types
```

## Design System

- **Theme:** Glassmorphism (Purple/Black)
- **Primary Color:** Purple (#9333ea)
- **Background:** Black (#050505)
- **Font:** Kanit (Thai/Latin support)

## Scripts

```bash
bun run dev      # Start development server
bun run build    # Build for production
bun run start    # Start production server
bun run lint     # Run ESLint
```

## Future Backend Integration

โปรเจคนี้เตรียมไว้สำหรับการเชื่อมต่อกับ Backend ในอนาคต:

- **Database:** Prisma + PostgreSQL/MySQL
- **API:** Next.js API Routes หรือ Separate Backend
- **File Storage:** AWS S3 / Cloudflare R2
- **Email:** Resend / SendGrid

## License

MIT License
