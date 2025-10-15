# Production Dockerfile for BidOps.AI Core API
# Multi-stage build for optimal image size and security

FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY services/core-api/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && \
    npm cache clean --force

# Build the application
FROM base AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY services/core-api/ ./

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

# Production image - minimal and secure
FROM base AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 apiuser

# Install wget for healthcheck
RUN apk add --no-cache wget

# Set production environment
ENV NODE_ENV=production
ENV PORT=4000

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=apiuser:nodejs /app/dist ./dist
COPY --from=builder --chown=apiuser:nodejs /app/package*.json ./

# Copy Prisma schema and generated client (needed for runtime)
COPY --from=builder --chown=apiuser:nodejs /app/prisma ./prisma
COPY --from=builder --chown=apiuser:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=apiuser:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Switch to non-root user
USER apiuser

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:4000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]