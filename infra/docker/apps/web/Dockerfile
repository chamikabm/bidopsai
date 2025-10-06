# Production Dockerfile for bidops.ai web application
# Multi-stage build for optimized production image

# Stage 1: Base image with Node.js
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Stage 2: Install dependencies
FROM base AS deps
# Copy package files
COPY apps/web/package*.json ./

# Install dependencies with clean install
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Stage 3: Install all dependencies for build
FROM base AS build-deps
COPY apps/web/package*.json ./
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# Stage 4: Build the application
FROM base AS builder
WORKDIR /app

# Copy dependencies from build-deps stage
COPY --from=build-deps /app/node_modules ./node_modules

# Copy application source
COPY apps/web/ .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js application
# The standalone output will be in .next/standalone
RUN npm run build && \
    rm -rf node_modules

# Stage 5: Production runtime image
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone output (includes minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the production server
CMD ["node", "server.js"]