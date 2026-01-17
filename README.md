# QR STUDIOS 🚀

> High-performance Digital Commerce Platform for Game Scripts & UI.

**QR STUDIOS** is a modern e-commerce platform built for selling digital products like FiveM scripts and custom UIs. It features a high-performance storefront, secure payments, automated delivery, and a robust backend.

---

## ✨ Features

- **Storefront**: Premium Glassmorphism UI, search/filtering, and responsive design.
- **User System**: Secure Discord OAuth integration, user dashboard, and purchase history.
- **Commerce**:
  - 🛒 Shopping Cart with local persistence.
  - 💳 Secure payments via **Stripe**.
  - ⚡ Instant digital delivery.
  - 🔄 Repurchase flow (Buy again / License management).
  - 🎟️ Discount code system.
- **Localization**: 🇹🇭 Full Thai & English support (i18next).
- **Performance**: SEO optimized, fast page loads (Bun + Next.js), and mobile-first architecture.
- **Backend Service**: Dedicated Hono.js backend with Drizzle ORM and Redis caching.

---

## 🛠️ Tech Stack

### Frontend (User Interface)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: React 19
- **Runtime**: [Bun](https://bun.sh/)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
- **Animation**: Framer Motion
- **State Management**: Zustand
- **Internationalization**: i18next
- **Icons**: Lucide React

### Backend (API & Data)
- **Framework**: [Hono](https://hono.dev/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: PostgreSQL (Neon/Local)
- **Cache**: Redis
- **Payment**: Stripe API
- **Email**: Resend
- **Runtime**: Bun

### Infrastructure & DevOps
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Linting**: ESLint

---

## 📂 Project Structure

```
.
├── .github/               # GitHub Actions Workflows
├── backend/               # Backend Service (Hono + Drizzle)
│   ├── src/              # Backend source code
│   ├── scripts/          # Utility scripts
│   ├── drizzle/          # Database migrations
│   └── tests/            # Backend tests
├── src/                   # Frontend Source Code
│   ├── app/              # Next.js App Router
│   ├── components/       # React Components (UI, Layout, etc.)
│   ├── hooks/            # Custom Hooks
│   ├── lib/              # Utilities & Libraries
│   ├── locales/          # Translation files (JSON)
│   ├── store/            # Zustand Stores
│   ├── types/            # TypeScript Definitions
│   └── middleware.ts     # Next.js Middleware
├── public/                # Static Assets
├── tests/                 # Frontend Tests
├── Dockerfile.frontend    # Frontend Dockerfile
└── README.md             # Documentation
```

---

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (latest version)
- Docker & Docker Compose
- Node.js (v20+ recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/THXNXKXT/qr-studios.git
   cd qr-studios
   ```

2. **Install Frontend Dependencies**
   ```bash
   bun install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd backend
   bun install
   cd ..
   ```

4. **Environment Setup**
   - Copy `.env.example` to `.env.local` for Frontend.
   - Copy `backend/env.example` to `backend/.env` for Backend.
   - Fill in your API keys (Stripe, Discord, Database URL).

### Running the Project

**Development Mode:**
```bash
# Frontend
bun run dev

# Backend (in separate terminal)
cd backend && bun run dev
```

**Using Docker (Recommended for Backend):**
```bash
cd backend
docker-compose up -d
```

---

## 🧪 CI/CD Pipeline

This project uses **GitHub Actions** to ensure code quality:
- **Linting**: Automatically checks code style.
- **Testing**: Runs unit tests for both Frontend and Backend.
- **Build Verification**: Ensures the project builds successfully before merging.

---

## 📝 License & Credits

Created by **THXNXKXT**.
Copyright © 2026 QR STUDIO. All rights reserved.