# QR Studios Backend API

Backend API for QR Studios E-Commerce Platform built with Bun + Hono + Prisma + PostgreSQL.

## Tech Stack

- **Runtime:** Bun v1.2+
- **Framework:** Hono v4
- **Database:** PostgreSQL 16
- **ORM:** Prisma v7
- **Authentication:** JWT + NextAuth

## Setup

1. Install dependencies:
```bash
bun install
```

2. Setup environment variables:
```bash
cp env.example .env
# Edit .env with your configuration
```

3. Generate Prisma client:
```bash
bun run db:generate
```

4. Push database schema:
```bash
bun run db:push
```

## Development

```bash
bun run dev
```

Server will run on http://localhost:4000

## Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server
- `bun run build` - Build for production
- `bun run db:generate` - Generate Prisma client
- `bun run db:push` - Push schema to database
- `bun run db:migrate` - Run migrations
- `bun run db:studio` - Open Prisma Studio

## API Endpoints

- `GET /health` - Health check
- `GET /api` - API info

More endpoints will be added as development progresses.

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── routes/         # API routes
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   ├── middleware/     # Middleware
│   ├── utils/          # Utilities
│   ├── types/          # TypeScript types
│   ├── app.ts          # Hono app setup
│   └── index.ts        # Entry point
├── prisma/
│   └── schema.prisma   # Database schema
└── package.json
```
