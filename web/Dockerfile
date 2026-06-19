# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first for Docker layer caching
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# Copy source and build
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built assets and dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

USER nextjs

EXPOSE 3001
ENV PORT 3001

CMD ["npm", "run", "start"]
