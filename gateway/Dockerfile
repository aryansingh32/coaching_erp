# ─── Stage 1: Build ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for Docker layer caching
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# Copy source and build
COPY . .
RUN npm run build

# Prune devDependencies for production image
RUN npm prune --production

# ─── Stage 2: Production ─────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Security: run as non-root user
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

# Copy built artifacts and production dependencies
COPY --from=builder --chown=nestjs:nestjs /app/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/package.json ./

USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -q --spider http://localhost:3000/api/v1/health || exit 1

EXPOSE 3000

CMD ["node", "dist/main"]
