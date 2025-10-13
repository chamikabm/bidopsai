# Research: Core GraphQL API for BidOps.AI Platform

**Feature**: Core GraphQL API  
**Date**: 2025-01-12  
**Purpose**: Document technology decisions, best practices, and architectural patterns for implementing a production-ready GraphQL API

---

## 1. Apollo Server 4.x Configuration

### Decision: Apollo Server 4.x with Express Integration

**Rationale**:
- Apollo Server 4.x is the latest stable version with improved performance and TypeScript support
- Express integration provides flexibility for additional HTTP endpoints (health checks)
- Built-in support for subscriptions via WebSocket transport
- Excellent TypeScript type inference for resolvers and context
- Active community and comprehensive documentation

**Implementation Pattern**:
```typescript
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

// Supports both HTTP (queries/mutations) and WebSocket (subscriptions)
const schema = makeExecutableSchema({ typeDefs, resolvers });
const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
const serverCleanup = useServer({ schema, context: async (ctx) => ({ ... }) }, wsServer);

const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});
```

**Alternatives Considered**:
- **Yoga GraphQL**: More performant but less ecosystem maturity
- **Mercurius (Fastify)**: Better performance but requires Fastify learning curve
- **Apollo Server 3.x**: Deprecated, migration path to v4 required

---

## 2. Prisma ORM Best Practices

### Decision: Prisma 6.x with PostgreSQL

**Rationale**:
- Type-safe database client auto-generated from schema
- Excellent TypeScript integration with IntelliSense
- Built-in migration system for schema evolution
- Support for complex relations and nested writes
- Connection pooling and query optimization
- Active development and strong community

**Schema Design Pattern**:
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String   @id @default(uuid()) @db.Uuid
  email           String   @unique
  cognitoUserId   String   @unique @map("cognito_user_id")
  createdAt       DateTime @default(now()) @map("created_at")
  
  roles           UserRole[]
  projects        ProjectMember[]
  notifications   Notification[]
  
  @@map("users")
  @@index([email])
}
```

**Best Practices**:
1. **Singleton Pattern**: Use single PrismaClient instance with proper connection pooling
2. **Transactions**: Use `prisma.$transaction()` for multi-table operations
3. **Indexing**: Add indexes on frequently queried fields (foreign keys, email, status)
4. **Naming**: Use snake_case in DB, camelCase in TypeScript via `@map`
5. **Relations**: Use explicit relation names for self-referential or multiple relations

**Alternatives Considered**:
- **TypeORM**: More complex, decorator-based approach
- **Sequelize**: Older ORM with less TypeScript support
- **Drizzle ORM**: Newer but less mature ecosystem

---

## 3. AWS Cognito JWT Validation

### Decision: `aws-jwt-verify` Library

**Rationale**:
- Official AWS library for JWT verification
- Automatic public key rotation handling
- Built-in token expiration validation
- Type-safe with TypeScript
- Minimal dependencies and small bundle size

**Implementation Pattern**:
```typescript
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID!,
});

// In GraphQL context factory
const token = req.headers.authorization?.replace('Bearer ', '');
const payload = await verifier.verify(token);
const userId = payload.sub; // Extract user ID from token
```

**Security Considerations**:
- Cache verification keys to reduce latency (<10ms overhead)
- Validate token expiration on every request
- Extract user identity and attach to GraphQL context
- Never log tokens or sensitive claims
- Handle token expiration gracefully with clear error messages

**Alternatives Considered**:
- **jsonwebtoken + jwks-rsa**: Manual implementation, more complex
- **passport-jwt**: Heavier dependency, overkill for API-only
- **Manual JWKS fetch**: Reinventing the wheel, error-prone

---

## 4. GraphQL Subscriptions with PubSub

### Decision: GraphQL-WS with In-Memory PubSub (Development) / Redis PubSub (Production)

**Rationale**:
- `graphql-ws` is the modern WebSocket transport for GraphQL subscriptions
- In-memory PubSub for development simplicity
- Redis PubSub for production horizontal scaling
- Supports filtering and authentication on subscription connection

**Implementation Pattern**:
```typescript
import { createPubSub } from '@graphql-yoga/subscription';
import { createClient } from 'redis';

// Development: In-memory
const pubsub = createPubSub();

// Production: Redis-backed
const publishClient = createClient({ url: process.env.REDIS_URL });
const subscribeClient = publishClient.duplicate();
await Promise.all([publishClient.connect(), subscribeClient.connect()]);

// Resolver example
const resolvers = {
  Subscription: {
    projectUpdated: {
      subscribe: withFilter(
        () => pubsub.subscribe('PROJECT_UPDATED'),
        (payload, variables, context) => {
          return payload.projectUpdated.id === variables.projectId &&
                 context.userId; // Ensure authenticated
        }
      ),
    },
  },
  Mutation: {
    updateProject: async (_, { id, input }, { prisma, pubsub }) => {
      const updated = await prisma.project.update({ where: { id }, data: input });
      await pubsub.publish('PROJECT_UPDATED', { projectUpdated: updated });
      return updated;
    },
  },
};
```

**Subscription Events**:
- `PROJECT_UPDATED`: Project data changes
- `WORKFLOW_EXECUTION_UPDATED`: Workflow status changes
- `AGENT_TASK_UPDATED`: Agent task progress
- `NOTIFICATION_RECEIVED`: New notifications
- `ARTIFACT_CREATED`: New artifacts available

**Alternatives Considered**:
- **Apollo Server PubSub**: Deprecated in favor of graphql-ws
- **Pusher/Ably**: External service costs, vendor lock-in
- **Server-Sent Events**: One-way only, less standard for GraphQL

---

## 5. Docker Multi-Stage Builds

### Decision: Multi-stage Dockerfile with Alpine Base

**Rationale**:
- Smaller final image size (<200MB vs >1GB)
- Faster deployment and startup times
- Security: Minimal attack surface with Alpine
- Separate build and runtime dependencies
- Optimized layer caching for faster rebuilds

**Production Dockerfile Pattern**:
```dockerfile
# Stage 1: Dependencies
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod

# Stage 2: Build
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 apollo
COPY --from=builder --chown=apollo:nodejs /app/dist ./dist
COPY --from=builder --chown=apollo:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=apollo:nodejs /app/prisma ./prisma
USER apollo
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health',(r)=>{process.exit(r.statusCode===200?0:1)})"
CMD ["node", "dist/index.js"]
```

**Development Dockerfile Pattern**:
```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN corepack enable pnpm && pnpm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]
```

**Alternatives Considered**:
- **Single-stage build**: Larger images, slower deployment
- **Debian-based images**: 3-4x larger, unnecessary packages
- **Distroless images**: More complex, overkill for Node.js

---

## 6. Database Indexing Strategies

### Decision: Composite Indexes on Query Patterns

**Rationale**:
- Most queries filter by project_id + status
- User lookups by email and cognitoUserId are frequent
- Foreign key indexes improve join performance
- Full-text search on project names/descriptions

**Indexing Strategy**:
```prisma
model Project {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  status      String
  createdBy   String   @map("created_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")
  
  @@index([status, createdAt]) // List filtering
  @@index([createdBy]) // User's projects
  @@map("projects")
}

model WorkflowExecution {
  id        String @id @default(uuid()) @db.Uuid
  projectId String @map("project_id") @db.Uuid
  status    String
  
  @@index([projectId, status]) // Project workflows
  @@map("workflow_executions")
}

model AgentTask {
  id                  String @id @default(uuid()) @db.Uuid
  workflowExecutionId String @map("workflow_execution_id") @db.Uuid
  status              String
  sequenceOrder       Int    @map("sequence_order")
  
  @@index([workflowExecutionId, sequenceOrder]) // Ordered tasks
  @@map("agent_tasks")
}
```

**Query Performance Targets**:
- Simple lookups (by ID): <10ms
- Filtered lists (by status): <50ms
- Complex joins (project with members): <100ms
- Aggregations (statistics): <200ms

**Alternatives Considered**:
- **No indexes**: Unacceptable performance at scale
- **Index everything**: Slower writes, wasted space
- **Materialized views**: Adds complexity, PostgreSQL specific

---

## 7. Error Handling and Logging

### Decision: Winston + Custom GraphQL Error Classes

**Rationale**:
- Structured JSON logging for production observability
- Custom error classes for domain-specific errors
- GraphQL error extensions for client context
- Correlation IDs for request tracing
- Separate error logging from access logging

**Error Handling Pattern**:
```typescript
// Custom error classes
class AuthenticationError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: { code: 'UNAUTHENTICATED', status: 401 },
    });
  }
}

class AuthorizationError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: { code: 'FORBIDDEN', status: 403 },
    });
  }
}

// Logging configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'core-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Error formatter
const formatError = (formattedError, error) => {
  logger.error('GraphQL Error', {
    message: error.message,
    code: error.extensions?.code,
    path: error.path,
    stack: error.originalError?.stack,
  });
  
  // Don't expose internal errors to clients
  if (error.extensions?.code === 'INTERNAL_SERVER_ERROR') {
    return { ...formattedError, message: 'An unexpected error occurred' };
  }
  return formattedError;
};
```

**Logging Strategy**:
- **INFO**: Request start/completion, authentication success
- **WARN**: Rate limiting, deprecated API usage
- **ERROR**: Failed operations, validation errors, external service failures
- **DEBUG**: Query execution details, context data (development only)

**Alternatives Considered**:
- **Pino**: Faster but less features for structured logging
- **Morgan**: HTTP-only, insufficient for GraphQL operations
- **Console.log**: Unstructured, not production-ready

---

## 8. Environment Configuration

### Decision: dotenv with Validation using Zod

**Rationale**:
- Type-safe environment variable validation
- Fail-fast on missing/invalid configuration
- Clear error messages for misconfiguration
- Supports different environments (dev, staging, prod)
- No runtime surprises from undefined variables

**Configuration Pattern**:
```typescript
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
  COGNITO_USER_POOL_ID: z.string().min(1),
  COGNITO_CLIENT_ID: z.string().min(1),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().min(1),
  REDIS_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const env = envSchema.parse(process.env);
```

**Environment Files**:
- `.env.example`: Template with all required variables
- `.env.development`: Local development defaults
- `.env.test`: Test environment configuration
- Production: Environment variables from ECS task definition

**Alternatives Considered**:
- **config package**: Less type safety, more complex
- **Raw process.env**: No validation, error-prone
- **AWS Parameter Store**: Adds external dependency

---

## 9. Testing Strategy

### Decision: Jest + Supertest + Test Containers

**Rationale**:
- Jest is the standard for TypeScript/Node.js testing
- Supertest enables HTTP API testing
- Test Containers provides isolated PostgreSQL for integration tests
- Supports unit, integration, and e2e testing levels
- Fast feedback with watch mode

**Testing Layers**:

**1. Unit Tests** (services, utilities):
```typescript
describe('S3Service', () => {
  it('generates presigned URLs with correct expiration', async () => {
    const url = await s3Service.generatePresignedUrl('bucket', 'key', 3600);
    expect(url).toContain('X-Amz-Expires=3600');
  });
});
```

**2. Integration Tests** (resolvers with real database):
```typescript
import { startTestServer } from '../helpers/setup';

describe('Project Mutations', () => {
  let server, prisma;
  
  beforeAll(async () => {
    ({ server, prisma } = await startTestServer());
  });
  
  it('creates project with valid input', async () => {
    const result = await server.executeOperation({
      query: CREATE_PROJECT,
      variables: { input: { name: 'Test Project' } },
    });
    expect(result.data.createProject.id).toBeDefined();
  });
});
```

**3. E2E Tests** (full API with authentication):
```typescript
describe('Authenticated Workflows', () => {
  it('completes project creation workflow', async () => {
    const token = await getTestToken();
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: CREATE_PROJECT });
    expect(response.status).toBe(200);
  });
});
```

**Coverage Targets**:
- Unit tests: 80%+ coverage
- Integration tests: All critical paths
- E2E tests: Primary user workflows

**Alternatives Considered**:
- **Mocha + Chai**: Less TypeScript support, more boilerplate
- **AVA**: Faster but less ecosystem maturity
- **Vitest**: Newer, less stable for Node.js backends

---

## 10. Hot Reload in Development

### Decision: tsx with Nodemon

**Rationale**:
- `tsx` is faster than ts-node for TypeScript execution
- Nodemon watches file changes and restarts server
- Preserves GraphQL Playground state during reload
- Sub-2-second reload times for quick iteration
- Works seamlessly with Docker volumes

**Development Script**:
```json
{
  "scripts": {
    "dev": "nodemon --watch src --ext ts,graphql --exec tsx src/index.ts",
    "dev:debug": "nodemon --watch src --ext ts,graphql --exec tsx --inspect src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

**Docker Compose Configuration**:
```yaml
services:
  core-api:
    build:
      context: ./services/core-api
      dockerfile: Dockerfile.dev
    volumes:
      - ./services/core-api/src:/app/src:ro
      - ./services/core-api/prisma:/app/prisma:ro
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/bidopsai
      - NODE_ENV=development
    ports:
      - "4000:4000"
```

**Alternatives Considered**:
- **ts-node-dev**: Slower compilation than tsx
- **swc**: Faster but less stable, compatibility issues
- **Manual restart**: Poor developer experience

---

## Summary of Key Decisions

| Area | Technology | Rationale |
|------|------------|-----------|
| **GraphQL Server** | Apollo Server 4.x | Industry standard, excellent TypeScript support, subscriptions |
| **ORM** | Prisma 6.x | Type-safe, modern, excellent migrations |
| **Authentication** | aws-jwt-verify | Official AWS library, automatic key rotation |
| **Subscriptions** | graphql-ws + Redis | Modern standard, horizontally scalable |
| **Containerization** | Multi-stage Alpine | Small images, fast deployment |
| **Logging** | Winston | Structured logging, production-ready |
| **Testing** | Jest + Supertest | Comprehensive, fast, TypeScript support |
| **Hot Reload** | tsx + Nodemon | Fast iteration, sub-2s reload |

All decisions prioritize:
- **Developer Experience**: Fast feedback loops, clear error messages
- **Production Readiness**: Scalability, observability, security
- **Type Safety**: TypeScript end-to-end, validated inputs
- **Maintainability**: Industry standards, active communities