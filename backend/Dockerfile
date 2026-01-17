FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Copy production dependencies
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy source code and build
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Final production image
FROM base AS release
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 honojs && \
  adduser --system --uid 1001 hono

COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app .

# Set correct permissions
RUN chown -R hono:honojs /app

# Switch to non-root user
USER hono

# Expose port
EXPOSE 4001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run -e "fetch('http://127.0.0.1:4001/health').then(r => r.ok ? process.exit(0) : process.exit(1))"

# Run migrations and start server
CMD ["sh", "-c", "bun run src/index.ts"]
