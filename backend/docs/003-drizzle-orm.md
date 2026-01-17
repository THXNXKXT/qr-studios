# ADR-003: Use Drizzle ORM

**Status**: Accepted  
**Date**: 2026-01-17

## Context

We needed an ORM for PostgreSQL database access. Options considered:
- Prisma (most popular TypeScript ORM)
- TypeORM (mature, decorator-based)
- Drizzle (SQL-like, lightweight)
- Kysely (type-safe query builder)

## Decision

**Use Drizzle ORM** for the following reasons:

1. **SQL-like Syntax**: Query syntax mirrors actual SQL
2. **Type Safety**: Full end-to-end type inference
3. **Performance**: Thinnest ORM layer, near-raw SQL speed
4. **Bundle Size**: Much smaller than Prisma
5. **Edge Compatibility**: Works on serverless/edge runtimes

## Consequences

### Positive
- No runtime code generation (unlike Prisma)
- Flexible schema definition with TypeScript
- Easy to debug (query output is readable SQL)
- Drizzle Studio for database browsing

### Negative
- Slightly more verbose than Prisma for simple queries
- Smaller ecosystem of plugins

### Mitigation
- Create utility functions for common patterns
- Use raw SQL for complex queries when needed
