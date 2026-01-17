# ADR-002: Use Hono Web Framework

**Status**: Accepted  
**Date**: 2026-01-17

## Context

We needed a web framework for building REST APIs. Options considered:
- Express.js (most popular, middleware ecosystem)
- Fastify (performance-focused)
- Hono (ultra-lightweight, multi-runtime)
- Elysia (Bun-native)

## Decision

**Use Hono** for the following reasons:

1. **Multi-runtime**: Works on Bun, Node.js, Deno, Cloudflare Workers
2. **Performance**: One of the fastest web frameworks
3. **Middleware**: Rich built-in middleware (CORS, CSRF, secure headers)
4. **Type Safety**: Excellent TypeScript inference
5. **Small Bundle**: ~12KB gzipped

## Consequences

### Positive
- Portable between runtimes (can migrate to Workers if needed)
- Built-in validator middleware with Zod integration
- Clean, Express-like API that's easy to learn

### Negative
- Smaller ecosystem than Express
- Some Express middleware doesn't work directly

### Mitigation
- Most common patterns have Hono equivalents
- Can write custom middleware for specific needs
