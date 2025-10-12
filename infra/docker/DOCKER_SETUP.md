# Docker Development Setup

This guide explains how to run the BidOps.AI stack using Docker Compose.

## Prerequisites

- Docker or Podman installed
- Docker Compose or podman-compose installed

## Quick Start

1. **Ensure environment files exist:**
   - `services/core-api/.env.development` - Backend API configuration
   - `apps/web/.env` - Frontend configuration

2. **Start all services:**
   
   From the project root:
   ```bash
   podman-compose -f infra/docker/docker-compose.dev.yml up
   ```
   
   Or using Docker Compose:
   ```bash
   docker-compose -f infra/docker/docker-compose.dev.yml up
   ```

3. **Access the services:**
   - Frontend: http://localhost:3000
   - GraphQL API: http://localhost:4000/graphql
   - PostgreSQL: localhost:5432

## Environment Configuration

The docker-compose setup uses the existing environment files from each service:

- **Core API**: Loads from `services/core-api/.env.development`
  - Contains AWS credentials, Cognito config, S3 bucket, etc.
  - `DATABASE_URL` is overridden to point to the Docker PostgreSQL container

- **Web Frontend**: Loads from `apps/web/.env`
  - Contains Cognito configuration
  - `NEXT_PUBLIC_API_URL` is overridden to use Docker network

## Services

### PostgreSQL (postgres)
- **Port:** 5432
- **Database:** bidopsai
- **User:** bidopsai
- **Password:** bidopsai_dev_password
- **Data Volume:** postgres-data (persisted)

### Core API (core-api)
- **Port:** 4000
- **Type:** GraphQL API with Apollo Server
- **Features:** Hot reload enabled with nodemon + tsx
- **Health Check:** http://localhost:4000/health

### Web Frontend (web)
- **Port:** 3000
- **Type:** Next.js 15 application with Turbopack
- **Features:** Hot reload enabled
- **Health Check:** http://localhost:3000

## Development Workflow

### Running Commands

To run commands inside containers:

```bash
# Run Prisma migrations
docker exec -it bidopsai-core-api-dev npm run prisma:migrate:dev

# Seed the database
docker exec -it bidopsai-core-api-dev npm run prisma:seed

# View logs
docker-compose -f docker-compose.dev.yml logs -f [service-name]
```

### Rebuilding Images

After changing dependencies or Dockerfiles:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Stopping Services

```bash
# Stop all services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (clean slate)
docker-compose -f docker-compose.dev.yml down -v
```

## Troubleshooting

### Port Already in Use

If ports 3000, 4000, or 5432 are already in use, either:
1. Stop the conflicting service
2. Modify the port mappings in `docker-compose.dev.yml`

### Database Connection Issues

Ensure the PostgreSQL container is healthy:
```bash
docker-compose -f docker-compose.dev.yml ps
```

Check the health status should show "healthy" for postgres.

### Missing Environment Variables

If the core-api crashes with "Missing environment variables", verify:
1. `services/core-api/.env.development` exists and is properly configured
2. All required variables are set (check against `.env.example`)
3. Restart the services after updating environment files

### Hot Reload Not Working

The setup uses volume mounts for hot reload. If changes aren't reflected:
1. Ensure `WATCHPACK_POLLING=true` is set for web
2. Check that volumes are properly mounted
3. For Podman users, ensure proper SELinux permissions

## Network

All services run on the `bidopsai-network` bridge network, allowing them to communicate using service names (e.g., `postgres`, `core-api`).

## Data Persistence

PostgreSQL data is persisted in the `postgres-data` volume. To reset the database:

```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up
```

## Production Deployment

This setup is for **development only**. For production:
- Use separate production Dockerfiles
- Set `NODE_ENV=production`
- Use secure passwords and secrets
- Configure proper logging and monitoring
- Use managed database services (RDS)
- Enable HTTPS/TLS