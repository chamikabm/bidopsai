# Production Optimization Guide - BidOps.AI Core API

Performance optimization strategies and best practices for production deployment.

## 🚀 Performance Optimization

### 1. DataLoader Implementation

DataLoader prevents N+1 query problems by batching and caching database requests.

#### Installation

```bash
npm install dataloader
```

#### Implementation

```typescript
// src/dataloaders/user.dataloader.ts
import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';

export function createUserLoader(prisma: PrismaClient) {
  return new DataLoader(async (userIds: readonly string[]) => {
    const users = await prisma.user.findMany({
      where: { id: { in: [...userIds] } },
    });

    const userMap = new Map(users.map((user) => [user.id, user]));
    
    return userIds.map((id) => userMap.get(id) || null);
  });
}

// src/dataloaders/project.dataloader.ts
export function createProjectLoader(prisma: PrismaClient) {
  return new DataLoader(async (projectIds: readonly string[]) => {
    const projects = await prisma.project.findMany({
      where: { id: { in: [...projectIds] } },
      include: {
        createdBy: true,
        members: true,
      },
    });

    const projectMap = new Map(projects.map((p) => [p.id, p]));
    
    return projectIds.map((id) => projectMap.get(id) || null);
  });
}

// src/dataloaders/index.ts
export interface DataLoaders {
  userLoader: DataLoader<string, User | null>;
  projectLoader: DataLoader<string, Project | null>;
  artifactLoader: DataLoader<string, Artifact | null>;
  knowledgeBaseLoader: DataLoader<string, KnowledgeBase | null>;
}

export function createDataLoaders(prisma: PrismaClient): DataLoaders {
  return {
    userLoader: createUserLoader(prisma),
    projectLoader: createProjectLoader(prisma),
    artifactLoader: createArtifactLoader(prisma),
    knowledgeBaseLoader: createKnowledgeBaseLoader(prisma),
  };
}
```

#### Context Integration

```typescript
// src/apollo/context.ts
import { createDataLoaders } from '../dataloaders';

export async function createContext({ req }: { req: Request }): Promise<GraphQLContext> {
  const user = await authenticateUser(req);
  
  return {
    user,
    services: createServices(),
    dataloaders: createDataLoaders(prisma), // Add DataLoaders
  };
}
```

#### Usage in Resolvers

```typescript
// Before: N+1 problem
const projects = await prisma.project.findMany();
for (const project of projects) {
  const user = await prisma.user.findUnique({ where: { id: project.createdById } });
}

// After: Batched with DataLoader
const projects = await prisma.project.findMany();
for (const project of projects) {
  const user = await context.dataloaders.userLoader.load(project.createdById);
}
```

### 2. Query Complexity Analysis

Prevent expensive queries from overwhelming the server.

#### Installation

```bash
npm install graphql-query-complexity
```

#### Implementation

```typescript
// src/apollo/plugins/complexity.plugin.ts
import {
  createComplexityPlugin,
  simpleEstimator,
  fieldExtensionsEstimator,
} from 'graphql-query-complexity';

export const complexityPlugin = createComplexityPlugin({
  maximumComplexity: 1000,
  variables: {},
  estimators: [
    fieldExtensionsEstimator(),
    simpleEstimator({ defaultComplexity: 1 }),
  ],
  onComplete: (complexity: number) => {
    logger.info(`Query complexity: ${complexity}`);
  },
});
```

#### Schema Annotations

```typescript
// src/schema/types/project.types.ts
extend type Query {
  projects(first: Int, after: String): ProjectConnection @complexity(value: 10, multipliers: ["first"])
  project(id: UUID!): Project @complexity(value: 5)
}
```

### 3. Rate Limiting

Protect API from abuse with rate limiting.

#### Installation

```bash
npm install express-rate-limit
```

#### Implementation

```typescript
// src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const graphqlRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

// Per-user rate limiting
export const userRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  keyGenerator: (req) => req.user?.id || req.ip,
});
```

#### Apply to Routes

```typescript
// src/index.ts
app.use('/graphql', graphqlRateLimiter);
```

### 4. Caching Strategies

#### Response Caching

```typescript
// src/apollo/plugins/cache.plugin.ts
import responseCachePlugin from '@apollo/server-plugin-response-cache';

export const cachePlugin = responseCachePlugin({
  sessionId: (requestContext) => {
    return requestContext.request.http?.headers.get('session-id') || null;
  },
  shouldReadFromCache: (requestContext) => {
    return requestContext.request.http?.headers.get('cache-control') !== 'no-cache';
  },
  shouldWriteToCache: (requestContext) => {
    return requestContext.request.http?.method === 'GET';
  },
});
```

#### Redis Caching

```typescript
// src/lib/cache.ts
import Redis from 'ioredis';

export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(env.REDIS_URL);
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Usage in resolvers
async getProject(id: string) {
  const cacheKey = `project:${id}`;
  
  // Try cache first
  let project = await cache.get(cacheKey);
  
  if (!project) {
    project = await prisma.project.findUnique({ where: { id } });
    await cache.set(cacheKey, project, 300); // 5 min TTL
  }
  
  return project;
}
```

### 5. Database Query Optimization

#### Indexes

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by_id);
CREATE INDEX idx_projects_deadline ON projects(deadline);
CREATE INDEX idx_workflow_executions_project ON workflow_executions(project_id);
CREATE INDEX idx_agent_tasks_workflow ON agent_tasks(workflow_execution_id);
CREATE INDEX idx_artifacts_project ON artifacts(project_id);

-- Composite indexes for common queries
CREATE INDEX idx_projects_status_created ON projects(status, created_at DESC);
CREATE INDEX idx_agent_tasks_workflow_status ON agent_tasks(workflow_execution_id, status);
```

#### Query Optimization

```typescript
// Bad: N+1 queries
const projects = await prisma.project.findMany();
for (const project of projects) {
  const members = await prisma.projectMember.findMany({
    where: { projectId: project.id },
  });
}

// Good: Single query with include
const projects = await prisma.project.findMany({
  include: {
    members: {
      include: {
        user: true,
      },
    },
  },
});

// Better: Select only needed fields
const projects = await prisma.project.findMany({
  select: {
    id: true,
    name: true,
    status: true,
    members: {
      select: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    },
  },
});
```

### 6. Connection Pooling

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Connection pool configuration
  // Prisma automatically manages connection pooling
  // Default pool size: num_physical_cpus * 2 + 1
});

// For serverless environments, use Prisma Data Proxy or connection pooler
```

### 7. Pagination Best Practices

```typescript
// Cursor-based pagination (preferred)
async getProjects(first: number, after?: string) {
  return prisma.project.findMany({
    take: first + 1, // Fetch one extra to check for next page
    skip: after ? 1 : 0,
    cursor: after ? { id: after } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

// Offset pagination (avoid for large datasets)
async getProjectsOffset(page: number, limit: number) {
  const skip = (page - 1) * limit;
  
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.count(),
  ]);
  
  return { projects, total };
}
```

## 📊 Monitoring & Metrics

### Performance Metrics

```typescript
// src/apollo/plugins/metrics.plugin.ts
export const metricsPlugin = {
  async requestDidStart(requestContext) {
    const start = Date.now();
    
    return {
      async willSendResponse(requestContext) {
        const duration = Date.now() - start;
        
        logger.info('GraphQL Request', {
          operationName: requestContext.operationName,
          duration,
          complexity: requestContext.metrics?.complexity,
          cacheHit: requestContext.metrics?.cacheHit,
        });
        
        // Send to monitoring service
        metrics.recordDuration('graphql.request', duration, {
          operation: requestContext.operationName,
        });
      },
    };
  },
};
```

### Health Checks

```typescript
// src/routes/health.ts
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      s3: await checkS3(),
    },
  };
  
  const isHealthy = Object.values(health.checks).every((check) => check.status === 'ok');
  
  res.status(isHealthy ? 200 : 503).json(health);
});
```

## 🔒 Security Hardening

### Input Validation

```typescript
// Use Zod for runtime validation
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  deadline: z.date().min(new Date()).optional(),
});

// In resolver
const validated = createProjectSchema.parse(input);
```

### SQL Injection Prevention

Prisma automatically prevents SQL injection, but for raw queries:

```typescript
// Bad: String interpolation
prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`; // Vulnerable

// Good: Parameterized queries
prisma.$queryRaw`SELECT * FROM users WHERE email = ${Prisma.sql`${email}`}`; // Safe
```

## 🚀 Deployment Checklist

- [ ] Enable production logging
- [ ] Configure environment variables
- [ ] Set up database connection pooling
- [ ] Enable Redis for caching and PubSub
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerting
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up backup strategy
- [ ] Configure auto-scaling
- [ ] Review security headers
- [ ] Enable query complexity limits
- [ ] Set up error tracking (Sentry)
- [ ] Configure log aggregation
- [ ] Test disaster recovery procedures

## 📈 Performance Benchmarks

Target metrics for production:

- **Query Response Time**: < 100ms (p95)
- **Mutation Response Time**: < 200ms (p95)
- **Subscription Latency**: < 50ms
- **Database Query Time**: < 50ms (p95)
- **API Throughput**: 1000+ req/s
- **Error Rate**: < 0.1%
- **Uptime**: 99.9%+

## 🛠️ Tools

- **Monitoring**: Datadog, New Relic, or CloudWatch
- **APM**: Apollo Studio, GraphQL Inspector
- **Error Tracking**: Sentry
- **Logging**: Winston + CloudWatch or ELK Stack
- **Profiling**: Node.js built-in profiler, Clinic.js

## 📚 Resources

- [Apollo Performance Guide](https://www.apollographql.com/docs/apollo-server/performance/apq/)
- [Prisma Performance Guide](https://www.prisma.io/docs/guides/performance-and-optimization)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)