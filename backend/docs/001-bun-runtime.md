# ADR-001: Use Bun as Runtime

**Status**: Accepted  
**Date**: 2026-01-17

## Context

We needed to choose a JavaScript/TypeScript runtime for the backend API. Options considered:
- Node.js (traditional, mature ecosystem)
- Deno (modern, secure by default)
- Bun (fastest, built-in tooling)

## Decision

**Use Bun** as the runtime for the following reasons:

1. **Performance**: Bun is 3-4x faster than Node.js for HTTP handling
2. **Built-in Tooling**: Native bundler, test runner, package manager
3. **TypeScript Support**: First-class TypeScript without transpilation
4. **Drop-in Compatibility**: Most npm packages work without changes

## Consequences

### Positive
- Faster cold starts (important for serverless/containers)
- Simpler toolchain (no separate test runner, bundler)
- Faster development iteration

### Negative
- Smaller community than Node.js
- Some npm packages may have compatibility issues
- Less production battle-testing

### Mitigation
- Pin Bun version in Dockerfile for stability
- Test critical dependencies before upgrading
- Monitor Bun release notes for breaking changes
