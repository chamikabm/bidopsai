# Docker Configuration for bidops.ai

This directory contains Docker configurations for the bidops.ai web application with optimized multi-stage builds for both development and production environments.

## Directory Structure

```
infra/docker/
├── apps/
│   └── web/
│       ├── Dockerfile          # Production build (multi-stage, optimized)
│       └── Dockerfile.dev      # Development build (with hot reload)
├── docker-compose.yml          # Production compose configuration
├── docker-compose.dev.yml      # Development compose configuration
└── README.md                   # This file
```

## Production Build

The production Dockerfile uses a multi-stage build process to create an optimized, minimal image:

### Build Stages

1. **base**: Base Node.js 22 Alpine image with system dependencies
2. **deps**: Production dependencies only
3. **build-deps**: All dependencies including dev dependencies for building
4. **builder**: Builds the Next.js application with standalone output
5. **runner**: Final minimal runtime image with non-root user

### Features

- ✅ Multi-stage build for minimal image size
- ✅ Standalone output mode (includes only necessary dependencies)
- ✅ Non-root user for security
- ✅ Health check endpoint
- ✅ Optimized layer caching
- ✅ Clean npm cache to reduce size

### Building Production Image

```bash
# From project root
docker build -f infra/docker/apps/web/Dockerfile -t bidops-web:latest .

# Or using docker-compose
cd infra/docker
docker-compose build
```

### Running Production Container

```bash
# Using docker run
docker run -p 3000:3000 --name bidops-web bidops-web:latest

# Using docker-compose
cd infra/docker
docker-compose up -d
```

### Environment Variables

Production containers support the following environment variables:

- `NODE_ENV`: Set to `production` (default)
- `PORT`: Port to listen on (default: 3000)
- `HOSTNAME`: Hostname to bind to (default: 0.0.0.0)
- `NEXT_TELEMETRY_DISABLED`: Disable Next.js telemetry (default: 1)

## Development Build

The development Dockerfile is optimized for fast iteration with hot reload support.

### Features

- ✅ Hot reload with volume mounts
- ✅ Turbopack for fast refresh
- ✅ File watching with polling (works in Docker)
- ✅ Git included for version control operations
- ✅ Interactive terminal support

### Building Development Image

```bash
# From project root
docker build -f infra/docker/apps/web/Dockerfile.dev -t bidops-web:dev .

# Or using docker-compose
cd infra/docker
docker-compose -f docker-compose.dev.yml build
```

### Running Development Container

```bash
# Using docker-compose (recommended)
cd infra/docker
docker-compose -f docker-compose.dev.yml up

# The application will be available at http://localhost:3000
# Changes to source files will trigger hot reload
```

### Volume Mounts

The development setup mounts the following directories for hot reload:

- `apps/web/src` - Application source code
- `apps/web/public` - Static assets
- Configuration files (next.config.ts, tailwind.config.ts, etc.)

## Docker Compose

### Production Compose

```bash
cd infra/docker
docker-compose up -d
```

Features:
- Health checks
- Automatic restart
- Network isolation
- Port mapping (3000:3000)

### Development Compose

```bash
cd infra/docker
docker-compose -f docker-compose.dev.yml up
```

Features:
- Volume mounts for hot reload
- Interactive terminal
- Development environment variables
- File watching enabled

## Health Check

Both production and development images include a health check endpoint at `/api/health`.

The health check returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-10T12:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

## Image Size Optimization

The production image is optimized for size through:

1. **Multi-stage builds**: Only runtime dependencies in final image
2. **Alpine Linux**: Minimal base image (~5MB)
3. **Standalone output**: Next.js includes only necessary files
4. **Clean npm cache**: Removes cache after installation
5. **No dev dependencies**: Only production dependencies included

Expected image sizes:
- Production: ~150-200MB (depending on dependencies)
- Development: ~400-500MB (includes all dev dependencies)

## Security Features

### Production Image

- ✅ Non-root user (nextjs:nodejs with UID/GID 1001)
- ✅ Minimal attack surface (Alpine Linux)
- ✅ No unnecessary tools or packages
- ✅ Read-only file system compatible
- ✅ Security headers configured in Next.js

### Best Practices

1. Always run containers as non-root user
2. Use specific image tags (not `latest` in production)
3. Scan images for vulnerabilities regularly
4. Keep base images updated
5. Use secrets management for sensitive data

## Troubleshooting

### Build Issues

**Problem**: Build fails with "Cannot find module"
```bash
# Clear Docker cache and rebuild
docker build --no-cache -f infra/docker/apps/web/Dockerfile -t bidops-web:latest .
```

**Problem**: Out of disk space
```bash
# Clean up Docker resources
docker system prune -a
```

### Runtime Issues

**Problem**: Hot reload not working in development
```bash
# Ensure WATCHPACK_POLLING is set to true
# Check volume mounts in docker-compose.dev.yml
```

**Problem**: Container exits immediately
```bash
# Check logs
docker logs bidops-web

# Run interactively to debug
docker run -it bidops-web:latest sh
```

### Performance Issues

**Problem**: Slow build times
```bash
# Use BuildKit for faster builds
DOCKER_BUILDKIT=1 docker build -f infra/docker/apps/web/Dockerfile -t bidops-web:latest .
```

**Problem**: Large image size
```bash
# Analyze image layers
docker history bidops-web:latest

# Use dive tool for detailed analysis
dive bidops-web:latest
```

## CI/CD Integration

These Docker configurations are designed to work with GitHub Actions CI/CD pipeline. See `.github/workflows/` for automated build and deployment workflows.

### Build Arguments

The Dockerfiles support build arguments for customization:

```bash
# Example with build args
docker build \
  --build-arg NODE_VERSION=22 \
  -f infra/docker/apps/web/Dockerfile \
  -t bidops-web:latest .
```

## Additional Resources

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
