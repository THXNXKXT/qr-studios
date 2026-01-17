# ADR-004: Redis Caching Strategy

**Status**: Accepted  
**Date**: 2026-01-18

## Context

We needed a caching strategy for:
- Rate limiting storage
- Frequently accessed data (products, user sessions)
- Reducing database load

## Decision

**Use Redis with in-memory fallback**:

```
Production: Redis (via REDIS_URL)
Development: In-memory Map
```

### Caching Patterns

1. **Cache-Aside**: Application manages cache explicitly
2. **TTL-based Expiration**: All entries have expiration
3. **Pattern-based Invalidation**: `invalidatePattern("products:*")`

### Invalidation Rules

| Event | Invalidation |
|-------|-------------|
| Product update | `product:{id}`, `products:list:*` |
| User update | `user:{id}`, `user:{id}:*` |
| Order complete | `order:{id}`, `user:{userId}:orders` |

## Consequences

### Positive
- Graceful degradation (works without Redis)
- Consistent API for both backends
- Pattern-based bulk invalidation

### Negative
- Two code paths to maintain
- In-memory doesn't scale horizontally

### Mitigation
- Unified CacheService interface
- Always test with Redis in staging
- Memory cache has auto-cleanup
