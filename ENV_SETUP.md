# Environment Setup Guide

## Required Environment Variables

สร้างไฟล์ `.env.local` ในโฟลเดอร์ root ของโปรเจค และเพิ่มค่าต่อไปนี้:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Discord OAuth (Required for authentication)
# Get these from: https://discord.com/developers/applications
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here

# NextAuth Configuration (Required)
NEXTAUTH_URL=http://localhost:3000
# Generate a random secret with: openssl rand -base64 32
NEXTAUTH_SECRET=your_nextauth_secret_key_here

# Stripe (Optional - for payment features)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Database (Optional - for future backend)
DATABASE_URL=your_database_url
```

## How to Get Discord OAuth Credentials

1. ไปที่ [Discord Developer Portal](https://discord.com/developers/applications)
2. คลิก "New Application" และตั้งชื่อแอพพลิเคชัน
3. ไปที่แท็บ "OAuth2"
4. คัดลอก **Client ID** และ **Client Secret**
5. เพิ่ม Redirect URL: `http://localhost:3000/api/auth/callback/discord`

## How to Generate NEXTAUTH_SECRET

### Windows (PowerShell):
```powershell
# ใช้ Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### หรือใช้เว็บไซต์:
ไปที่ https://generate-secret.vercel.app/32

## Quick Start

1. คัดลอกไฟล์ตัวอย่าง:
```bash
cp env.example .env.local
```

2. แก้ไขค่าใน `.env.local` ตามข้อมูลจริง

3. รัน development server:
```bash
npm run dev
# หรือ
bun dev
```

## Important Notes

- ⚠️ **NEXTAUTH_SECRET** จำเป็นต้องมีสำหรับ production build
- 🔒 ไฟล์ `.env.local` จะไม่ถูก commit ไปใน git (อยู่ใน .gitignore)
- 📝 ถ้าไม่ต้องการใช้ Discord OAuth ตอนนี้ ให้ใส่ค่าปลอมก่อน (แต่ต้องมี NEXTAUTH_SECRET)

## Product Images

ไฟล์รูปภาพสินค้าควรอยู่ที่: `public/images/products/`

รายการรูปที่ต้องการ:
- admin-panel.png
- hud.png
- inventory.png
- phone.png
- loading.png
- bundle.png
- vehicle-shop.png
- job-center.png

หากไม่มีรูป component จะแสดง placeholder แทน
