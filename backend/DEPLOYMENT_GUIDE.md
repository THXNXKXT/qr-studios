# 🚀 Deployment Guide - QR Studios Backend

**Complete setup guide for development and production**

---

## 📋 Prerequisites

- **Bun** v1.0+ ([Install](https://bun.sh))
- **PostgreSQL** 16+ (or use Docker)
- **Redis** 7+ (optional, for caching)
- **Docker** (optional, for containerized deployment)

---

## 🏃 Quick Start (Development)

### **1. Clone & Install**
```bash
cd backend
bun install
```

### **2. Setup Database**

**Option A: Docker (Recommended)**
```bash
# Start PostgreSQL + Redis
docker-compose up -d postgres redis

# Wait for services to be healthy
docker-compose ps
```

**Option B: Local PostgreSQL**
```bash
# Create database
createdb qrstudios

# Or using psql
psql -U postgres
CREATE DATABASE qrstudios;
```

### **3. Configure Environment**
```bash
# Copy example env
cp env.example .env

# Edit .env with your credentials
nano .env
```

**Required variables:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qrstudios
JWT_SECRET=your-super-secret-key-min-32-chars
STRIPE_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_...
```

### **4. Run Migrations**
```bash
# Generate Prisma Client
bun run db:generate

# Run migrations
bun run db:migrate

# Seed database with sample data
bun run db:seed
```

### **5. Start Development Server**
```bash
bun run dev

# Server running on http://localhost:4001
```

---

## 🐳 Docker Deployment (Production)

### **1. Prepare Environment**
```bash
# Copy Docker env example
cp env.docker.example .env.docker

# Edit with production values
nano .env.docker
```

**Important:** Change these in production:
- `JWT_SECRET` - Use strong 32+ character secret
- `STRIPE_SECRET_KEY` - Use live key (sk_live_...)
- `STRIPE_WEBHOOK_SECRET` - Get from Stripe dashboard
- `RESEND_API_KEY` - Use production key

### **2. Build & Deploy**
```bash
# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Check health
curl http://localhost:4001/health
```

### **3. Run Migrations**
```bash
# Migrations run automatically on container start
# Or run manually:
docker-compose exec backend bunx prisma migrate deploy
```

### **4. Seed Database (Optional)**
```bash
docker-compose exec backend bun run db:seed
```

---

## 🔧 Configuration

### **Environment Variables**

#### **Server**
```env
NODE_ENV=production              # development | production
PORT=4001                        # Server port
API_URL=https://api.qrstudios.com
FRONTEND_URL=https://qrstudios.com
```

#### **Database**
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
```

#### **Authentication**
```env
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=30d
```

#### **Discord OAuth**
```env
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
```

#### **Stripe**
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### **Redis (Optional)**
```env
REDIS_URL=redis://localhost:6379
```

#### **Email (Resend)**
```env
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@qrstudios.com
```

#### **Monitoring (Optional)**
```env
SENTRY_DSN=https://...@sentry.io/...
```

---

## 📊 Database Management

### **Migrations**
```bash
# Create new migration
bun run db:migrate

# Deploy migrations (production)
bunx prisma migrate deploy

# Reset database (development only)
bunx prisma migrate reset
```

### **Prisma Studio**
```bash
# Open database GUI
bun run db:studio

# Access at http://localhost:5555
```

### **Seed Data**
```bash
# Seed with sample data
bun run db:seed

# Creates:
# - 1 admin user (Discord ID: 123456789012345678)
# - 3 test users
# - 6 products
# - 3 orders (2 completed, 1 pending)
# - 3 licenses
# - 3 promo codes
# - Sample reviews, wishlists, commissions
```

---

## 🔒 Security Checklist

### **Before Production**

- [ ] Change `JWT_SECRET` to strong random string (32+ chars)
- [ ] Use Stripe live keys (sk_live_...)
- [ ] Configure Stripe webhooks
- [ ] Set up HTTPS/SSL certificate
- [ ] Enable CORS for production domain only
- [ ] Set `NODE_ENV=production`
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable rate limiting globally
- [ ] Configure Sentry for error monitoring
- [ ] Review and update `.env` file
- [ ] Never commit `.env` to git

### **Recommended**

- [ ] Add input validation (Zod)
- [ ] Implement refresh tokens
- [ ] Add audit logging
- [ ] Set up Redis caching
- [ ] Configure CDN for static assets
- [ ] Add database read replicas
- [ ] Implement IP whitelisting for admin
- [ ] Set up automated backups
- [ ] Configure monitoring alerts

---

## 🧪 Testing

### **Health Check**
```bash
curl http://localhost:4001/health

# Response:
{
  "status": "ok",
  "timestamp": "2025-12-31T00:00:00.000Z",
  "environment": "development"
}
```

### **API Info**
```bash
curl http://localhost:4001/api

# Response: List of all endpoints
```

### **Test Authentication**
```bash
# Create session (requires Discord OAuth on frontend)
curl -X POST http://localhost:4001/api/auth/session \
  -H "Content-Type: application/json" \
  -d '{
    "discordId": "123456789",
    "username": "TestUser",
    "email": "test@example.com"
  }'

# Response: { user, token }
```

### **Test Protected Endpoint**
```bash
curl http://localhost:4001/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📈 Monitoring

### **Docker Logs**
```bash
# Follow backend logs
docker-compose logs -f backend

# Follow all services
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100 backend
```

### **Health Checks**
```bash
# Check service health
docker-compose ps

# All services should show "healthy"
```

### **Database Queries**
```bash
# Enable query logging in .env
DATABASE_URL=postgresql://...?connection_limit=10&pool_timeout=20

# View slow queries in logs
docker-compose logs backend | grep "Slow query"
```

---

## 🔄 Updates & Maintenance

### **Update Dependencies**
```bash
bun update

# Check for outdated packages
bun outdated
```

### **Database Backup**
```bash
# Backup database
docker-compose exec postgres pg_dump -U qrstudios qrstudios > backup.sql

# Restore database
docker-compose exec -T postgres psql -U qrstudios qrstudios < backup.sql
```

### **Restart Services**
```bash
# Restart backend only
docker-compose restart backend

# Restart all services
docker-compose restart

# Rebuild and restart
docker-compose up -d --build
```

---

## 🐛 Troubleshooting

### **Database Connection Error**
```
Error: P1001: Can't reach database server
```

**Solution:**
1. Check if PostgreSQL is running: `docker-compose ps`
2. Verify `DATABASE_URL` in `.env`
3. Check network connectivity
4. Ensure database exists: `docker-compose exec postgres psql -U qrstudios -l`

### **Prisma Client Error**
```
Error: @prisma/client did not initialize yet
```

**Solution:**
```bash
bun run db:generate
```

### **Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::4001
```

**Solution:**
```bash
# Find process using port
netstat -ano | findstr :4001

# Kill process (Windows)
taskkill /PID <PID> /F

# Or change PORT in .env
PORT=4002
```

### **Migration Failed**
```
Error: Migration failed to apply
```

**Solution:**
```bash
# Reset database (development only!)
bunx prisma migrate reset

# Or manually fix:
bunx prisma migrate resolve --rolled-back "migration_name"
```

---

## 📚 API Documentation

### **Base URL**
```
Development: http://localhost:4001
Production: https://api.qrstudios.com
```

### **Endpoints Summary**

**Total: 62 Endpoints**

- **Auth** (2): Session management
- **Users** (6): Profile, balance, orders, licenses
- **Products** (5): List, details, search, reviews
- **Orders** (4): Create, view, cancel
- **Checkout** (3): Stripe, balance, verify
- **Promo** (2): Validate, apply
- **Topup** (3): Packages, create, history
- **Licenses** (8): View, verify, IP management, download
- **Wishlist** (6): Add, remove, check, count
- **Commission** (4): Create, view, delete
- **Admin** (18): Dashboard, users, orders, promo codes, announcements
- **Webhooks** (1): Stripe events

**Full API documentation:** See `BACKEND_PLAN.md`

---

## 🎯 Performance Tips

### **Database Optimization**
```bash
# Add indexes (already in schema)
bunx prisma migrate dev --name add_indexes

# Analyze query performance
bunx prisma studio
```

### **Caching (Redis)**
```typescript
// Add Redis caching for frequently accessed data
// See PERFORMANCE_AUDIT.md for recommendations
```

### **Rate Limiting**
```typescript
// Already implemented for license verification
// Add global rate limiting for all endpoints
```

---

## 🔗 Useful Commands

```bash
# Development
bun run dev                    # Start dev server
bun run db:studio             # Open Prisma Studio
bun run db:seed               # Seed database

# Docker
bun run docker:up             # Start all services
bun run docker:down           # Stop all services
bun run docker:logs           # View logs

# Database
bun run db:generate           # Generate Prisma Client
bun run db:migrate            # Run migrations
bun run db:push               # Push schema changes

# Production
bun run start                 # Start production server
docker-compose up -d          # Deploy with Docker
```

---

## 📞 Support

- **Documentation:** `BACKEND_PLAN.md`, `SECURITY_AUDIT.md`, `PERFORMANCE_AUDIT.md`
- **FiveM Integration:** `FIVEM_INTEGRATION.md`
- **Phase Reports:** `PHASE2_COMPLETE.md`, `PHASE4_COMPLETE.md`

---

## ✅ Deployment Checklist

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificate configured
- [ ] CORS configured for production domain
- [ ] Stripe webhooks configured
- [ ] Email service configured (Resend)
- [ ] Monitoring set up (Sentry)

### **Deployment**
- [ ] Build Docker image
- [ ] Deploy to server
- [ ] Run migrations
- [ ] Verify health endpoint
- [ ] Test critical endpoints
- [ ] Monitor logs for errors

### **Post-Deployment**
- [ ] Verify all services running
- [ ] Test payment flow
- [ ] Test license verification
- [ ] Test email notifications
- [ ] Monitor performance
- [ ] Set up automated backups

---

*Deployment guide last updated: 31 December 2025*
