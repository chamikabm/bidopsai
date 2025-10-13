# Quickstart Guide: Core GraphQL API Local Development

**Feature**: Core GraphQL API  
**Date**: 2025-01-12  
**Purpose**: Step-by-step guide to set up and run the GraphQL API locally

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js 24 LTS** - [Download](https://nodejs.org/)
- **pnpm** - Package manager (comes with Node.js 24+ via corepack)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** - Version control
- **VS Code** (recommended) - Code editor with extensions:
  - Prisma
  - GraphQL
  - ESLint
  - Prettier

Verify installations:
```bash
node --version  # Should show v24.x.x
pnpm --version  # Should show 9.x.x or higher
docker --version
git --version
```

---

## Initial Setup

### 1. Clone Repository

```bash
# If not already cloned
git clone <repository-url>
cd bidopsai

# Switch to feature branch
git checkout 002-create-a-graphql
```

### 2. Install Dependencies

```bash
# Navigate to core-api directory
cd services/core-api

# Enable pnpm (if not already enabled)
corepack enable pnpm

# Install dependencies
pnpm install
```

### 3. Environment Configuration

Create environment files:

```bash
# Copy example environment file
cp .env.example .env.development

# Edit with your values
nano .env.development
```

**Required Environment Variables**:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bidopsai?schema=public"

# AWS Cognito (get from AWS Console or CDK output)
COGNITO_USER_POOL_ID="us-east-1_XXXXXXXXX"
COGNITO_CLIENT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxx"
AWS_REGION="us-east-1"

# AWS S3
AWS_S3_BUCKET="bidopsai-documents-dev"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"

# Server
NODE_ENV="development"
PORT="4000"
LOG_LEVEL="debug"

# Optional: Redis for production subscriptions
# REDIS_URL="redis://localhost:6379"
```

---

## Database Setup

### 1. Start PostgreSQL via Docker

```bash
# From repository root
cd infra/docker

# Start only the database
docker-compose -f docker-compose.dev.yml up -d db

# Verify database is running
docker-compose -f docker-compose.dev.yml ps
```

Expected output:
```
NAME                    IMAGE            STATUS
bidopsai-db-1          postgres:16      Up About a minute
```

### 2. Initialize Database Schema

```bash
# Navigate back to core-api
cd ../../services/core-api

# Generate Prisma Client
pnpm prisma generate

# Run initial migration
pnpm prisma migrate dev --name init

# Seed development data
pnpm prisma db seed
```

**What the seed script creates**:
- 5 test users with roles (Admin, Manager, Member)
- 3 sample projects with documents
- 2 knowledge bases (1 global, 1 project-specific)
- Sample workflow executions and agent tasks
- Test notifications and audit logs

### 3. Verify Database Connection

```bash
# Open Prisma Studio to browse data
pnpm prisma studio
```

This opens a browser at `http://localhost:5555` where you can view and edit database records.

---

## Running the Development Server

### Option 1: Local Node.js (Recommended for Development)

```bash
# From services/core-api directory
pnpm run dev
```

The API server will start with hot-reloading enabled:
- **GraphQL Playground**: http://localhost:4000/graphql
- **Health Endpoint**: http://localhost:4000/health
- **WebSocket Subscriptions**: ws://localhost:4000/graphql

**Hot Reload Behavior**:
- Automatically restarts on `.ts` and `.graphql` file changes
- Preserves GraphQL Playground state
- Reload time: < 2 seconds

### Option 2: Docker Compose (Full Stack)

```bash
# From infra/docker directory
cd infra/docker

# Start all services (database + API)
docker-compose -f docker-compose.dev.yml up

# Or run in detached mode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f core-api
```

**Docker Services**:
- `db`: PostgreSQL database (port 5432)
- `core-api`: GraphQL API server (port 4000)

### Option 3: Debug Mode

For debugging with breakpoints in VS Code:

```bash
pnpm run dev:debug
```

Then attach VS Code debugger (F5) using the provided launch configuration.

---

## Testing the API

### 1. Get Authentication Token

For local development, you need a valid Cognito JWT token. Use one of these methods:

**Method A: Use Test Script**
```bash
pnpm run get-test-token
```

**Method B: Sign in via Frontend**
```bash
# Start the frontend application
cd apps/web
pnpm run dev

# Sign in at http://localhost:3000
# Copy token from browser DevTools > Application > Local Storage
```

**Method C: Use AWS CLI**
```bash
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id $COGNITO_CLIENT_ID \
  --auth-parameters USERNAME=test@example.com,PASSWORD=TestPassword123!
```

### 2. Query Using GraphQL Playground

1. Open http://localhost:4000/graphql
2. Add authentication header:
   ```json
   {
     "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
   }
   ```

3. Try a simple query:
   ```graphql
   query Me {
     me {
       id
       email
       firstName
       lastName
       roles {
         name
       }
     }
   }
   ```

4. Create a project:
   ```graphql
   mutation CreateProject {
     createProject(input: {
       name: "Test RFP Project"
       description: "Testing project creation"
       deadline: "2025-12-31"
     }) {
       id
       name
       status
       progressPercentage
       createdBy {
         firstName
         lastName
       }
     }
   }
   ```

5. Subscribe to project updates:
   ```graphql
   subscription OnProjectUpdate($projectId: UUID!) {
     projectUpdated(projectId: $projectId) {
       id
       name
       status
       progressPercentage
       updatedAt
     }
   }
   ```

### 3. Test Health Endpoint

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-12T03:00:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

### 4. Run Automated Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test users.test.ts
```

---

## Common Development Tasks

### Database Management

**Reset database (destroys all data)**:
```bash
pnpm prisma migrate reset
```

**Create new migration**:
```bash
# After modifying schema.prisma
pnpm prisma migrate dev --name add_new_field
```

**View current schema**:
```bash
pnpm prisma studio
```

**Generate updated Prisma Client**:
```bash
pnpm prisma generate
```

### Code Quality

**Lint code**:
```bash
pnpm run lint

# Auto-fix issues
pnpm run lint:fix
```

**Format code**:
```bash
pnpm run format
```

**Type check**:
```bash
pnpm run type-check
```

### Debugging

**View server logs**:
```bash
# In development, logs are printed to console
# Check logs/combined.log for persistent logs
tail -f logs/combined.log
```

**Database query logging**:
```bash
# Add to .env.development
DATABASE_URL="postgresql://...?schema=public&connection_limit=5&logging=true"
```

**GraphQL query logging**:
Set `LOG_LEVEL=debug` in `.env.development` to see all GraphQL operations.

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or change port in .env.development
PORT=4001
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart database
docker-compose -f infra/docker/docker-compose.dev.yml restart db

# Check database logs
docker-compose -f infra/docker/docker-compose.dev.yml logs db
```

### Prisma Client Out of Sync

```bash
# Regenerate Prisma Client
pnpm prisma generate

# If schema changed, create migration
pnpm prisma migrate dev
```

### Authentication Errors

- Verify Cognito configuration in `.env.development`
- Check token hasn't expired (tokens expire after 1 hour)
- Ensure `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID` match AWS Console
- Test token validation: `pnpm run verify-token <TOKEN>`

### Hot Reload Not Working

```bash
# Kill existing nodemon processes
pkill -f nodemon

# Clear node_modules cache
rm -rf node_modules/.cache

# Restart development server
pnpm run dev
```

---

## Project Structure Reference

```
services/core-api/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # Apollo Server setup
│   ├── context.ts            # GraphQL context factory
│   ├── schema/               # GraphQL schema
│   ├── middleware/           # Auth, logging, errors
│   ├── services/             # Business logic
│   ├── utils/                # Helpers
│   └── types/                # TypeScript types
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # Migration history
│   └── seed.ts               # Seed data
├── tests/                    # Test files
├── logs/                     # Log files
├── .env.development          # Environment config
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
└── jest.config.js            # Test configuration
```

---

## Next Steps

1. **Explore GraphQL Schema**: Open GraphQL Playground and explore the schema documentation
2. **Review Test Data**: Use Prisma Studio to see seeded data
3. **Run Tests**: Execute `pnpm test` to verify everything works
4. **Implement Features**: Start building resolvers and business logic
5. **Frontend Integration**: Connect frontend to your local API

---

## Useful Commands Reference

| Command | Purpose |
|---------|---------|
| `pnpm run dev` | Start development server with hot reload |
| `pnpm run dev:debug` | Start with debugger attached |
| `pnpm run build` | Build for production |
| `pnpm run start` | Run production build |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm run lint` | Lint code |
| `pnpm run format` | Format code with Prettier |
| `pnpm prisma studio` | Open database browser |
| `pnpm prisma generate` | Generate Prisma Client |
| `pnpm prisma migrate dev` | Create/apply migrations |
| `pnpm prisma db seed` | Seed development data |

---

## Getting Help

- **Documentation**: `/specs/002-create-a-graphql/`
- **API Schema**: http://localhost:4000/graphql (when running)
- **Database Schema**: `prisma/schema.prisma`
- **Logs**: `logs/combined.log` and `logs/error.log`
- **Issues**: Create GitHub issue with error logs

---

## Production Deployment Preview

To build for production:

```bash
# Build Docker image
docker build -t bidopsai-core-api -f Dockerfile .

# Test production image locally
docker run -p 4000:4000 \
  -e DATABASE_URL="postgresql://..." \
  -e COGNITO_USER_POOL_ID="..." \
  -e COGNITO_CLIENT_ID="..." \
  bidopsai-core-api
```

See deployment documentation for ECS deployment steps.