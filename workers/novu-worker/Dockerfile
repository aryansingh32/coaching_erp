# ─── Stage 1: Build ───────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline
COPY . .
RUN npm run build
RUN npm prune --production

# ─── Stage 2: Production ─────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 worker && \
    adduser --system --uid 1001 worker
COPY --from=builder --chown=worker:worker /app/dist ./dist
COPY --from=builder --chown=worker:worker /app/node_modules ./node_modules
COPY --from=builder --chown=worker:worker /app/package.json ./
USER worker
CMD ["node", "dist/main.js"]
