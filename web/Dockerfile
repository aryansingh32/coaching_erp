# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first for Docker layer caching
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# Next.js bakes NEXT_PUBLIC_* at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
ARG NEXT_PUBLIC_METABASE_DASHBOARD_ID=1
ARG NEXT_PUBLIC_NOVU_APP_ID=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_METABASE_DASHBOARD_ID=$NEXT_PUBLIC_METABASE_DASHBOARD_ID
ENV NEXT_PUBLIC_NOVU_APP_ID=$NEXT_PUBLIC_NOVU_APP_ID

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
