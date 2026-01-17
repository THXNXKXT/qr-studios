# =============================================================================
# Multi-stage Dockerfile for QR Studios Backend
# Optimized for smaller image size and better layer caching
# =============================================================================

# Stage 1: Base image with Bun runtime
FROM oven/bun:1-slim AS base
WORKDIR /app

# Stage 2: Install dependencies (cached layer)
FROM base AS deps
# Copy only package files for better caching
COPY package.json bun.lock ./
# Install all dependencies (dev + prod)
RUN bun install --frozen-lockfile

# Stage 3: Production dependencies only
FROM base AS prod-deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts

# Stage 4: Build/prepare application
FROM base AS build
COPY --from=deps /app/node_modules node_modules
COPY . .
# Generate any build artifacts if needed
# RUN bun run build

# Stage 5: Final production image
FROM base AS release
WORKDIR /app

# Create non-root user for security (best practice)
RUN addgroup --system --gid 1001 appgroup && \
  adduser --system --uid 1001 --ingroup appgroup appuser

# Copy production dependencies only (smaller image)
COPY --from=prod-deps /app/node_modules node_modules

# Copy application source
COPY --from=build /app/src src
COPY --from=build /app/package.json .
COPY --from=build /app/drizzle drizzle
COPY --from=build /app/drizzle.config.ts .

# Set ownership and permissions
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Environment defaults
ENV NODE_ENV=production
ENV PORT=4001

# Expose application port
EXPOSE 4001

# Health check with lightweight curl alternative
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD bun run -e "fetch('http://127.0.0.1:4001/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the application
CMD ["bun", "run", "src/index.ts"]

