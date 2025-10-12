# BidOps.AI Core GraphQL API

Production-ready GraphQL API server for the BidOps.AI platform, built with Apollo Server 4.x, Prisma ORM, and TypeScript.

## 🚀 Features

- **GraphQL API**: Full-featured GraphQL API with queries, mutations, and subscriptions
- **Authentication**: AWS Cognito integration with JWT validation
- **Real-time Updates**: WebSocket subscriptions for live data
- **File Management**: S3 integration with presigned URLs
- **Database**: PostgreSQL with Prisma ORM
- **Type Safety**: Full TypeScript implementation
- **Scalable**: Docker-ready with hot-reload for development

## 📋 Prerequisites

- Node.js 24 LTS
- PostgreSQL 14+
- AWS Account (for Cognito & S3)
- Docker & Docker Compose (optional, for local development)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd services/core-api
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.development
```

Update `.env.development` with your credentials:

```env
# Application
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL=postgresql://bidopsai:bidopsai_dev@localhost:5432/bidopsai_dev?schema=public

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
AWS_COGNITO_CLIENT_ID=your-client-id
S3_BUCKET_NAME=bidopsai-documents-dev
JWT_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX

# Redis (Optional - for production subscriptions)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. Database Setup

Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:4000/graphql`

## 🐳 Docker Development

Use Docker Compose for a complete local environment:

```bash
# From project root
cd infra/docker
docker-compose -f docker-compose.dev.yml up core-api
```

## 📡 API Overview

### GraphQL Endpoint

- **HTTP/HTTPS**: `http://localhost:4000/graphql`
- **WebSocket**: `ws://localhost:4000/graphql`

### Authentication

All requests require a valid JWT token from AWS Cognito:

```
Authorization: Bearer <your-jwt-token>
```

### Example Queries

#### Get Current User
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

#### List Projects
```graphql
query GetProjects($first: Int, $after: String) {
  projects(first: $first, after: $after) {
    edges {
      node {
        id
        name
        status
        progressPercentage
        members {
          user {
            firstName
            lastName
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

#### Create Project
```graphql
mutation CreateProject($input: CreateProjectInput!) {
  createProject(input: $input) {
    id
    name
    status
    createdAt
  }
}
```

### Example Subscriptions

#### Subscribe to Project Updates
```graphql
subscription OnProjectUpdated($projectId: UUID!) {
  projectUpdated(projectId: $projectId) {
    id
    name
    status
    progressPercentage
  }
}
```

#### Subscribe to Workflow Updates
```graphql
subscription OnWorkflowUpdated($workflowExecutionId: UUID!) {
  workflowExecutionUpdated(workflowExecutionId: $workflowExecutionId) {
    id
    status
    completedAt
  }
}
```

## 🏗️ Architecture

```
services/core-api/
├── prisma/              # Database schema & migrations
├── src/
│   ├── apollo/          # Apollo Server configuration
│   ├── config/          # Environment & app configuration
│   ├── context/         # GraphQL context builder
│   ├── lib/             # Shared libraries (Prisma client)
│   ├── middleware/      # Express middleware (auth, errors)
│   ├── resolvers/       # GraphQL resolvers
│   ├── routes/          # REST endpoints (health check)
│   ├── schema/          # GraphQL type definitions
│   ├── services/        # Business logic services
│   └── utils/           # Utility functions (logger, errors)
└── tests/               # Integration & unit tests
```

## 🔐 Security

- **JWT Validation**: AWS Cognito JWT tokens verified on every request
- **Role-Based Access**: Granular permissions via roles and permissions
- **Input Validation**: Zod schema validation for all inputs
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **Rate Limiting**: Configurable rate limits per endpoint
- **CORS**: Restricted to allowed origins

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📊 Database

### Migrations

```bash
# Create a new migration
npm run prisma:migrate

# Deploy migrations to production
npm run prisma:deploy

# Open Prisma Studio
npm run prisma:studio
```

### Seeding

```bash
npm run prisma:seed
```

## 🚢 Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker Production

```bash
docker build -f infra/docker/services/core-api/Dockerfile -t bidopsai-core-api:latest .
docker run -p 4000:4000 --env-file .env.production bidopsai-core-api:latest
```

### Environment Variables (Production)

Ensure these are set in your production environment:

- `NODE_ENV=production`
- `DATABASE_URL` (PostgreSQL connection string)
- `AWS_*` credentials and configuration
- `REDIS_URL` (recommended for subscriptions)
- `CORS_ORIGIN` (your frontend URL)

## 📈 Performance

- **Query Complexity**: Automatic complexity analysis
- **DataLoader**: Batch loading to prevent N+1 queries
- **Connection Pooling**: Optimized Prisma connection pool
- **Caching**: Redis caching for frequently accessed data
- **CDN**: Static assets served via CloudFront

## 🔍 Monitoring

### Health Check

```bash
curl http://localhost:4000/health
```

### Logs

Structured JSON logging with Winston:

```bash
# View logs
docker logs core-api -f

# Filter by level
docker logs core-api 2>&1 | grep "level\":\"error\""
```

### Metrics

Integration with CloudWatch for production monitoring:

- Request duration
- Error rates
- Database query performance
- WebSocket connection count

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

```bash
# Lint code
npm run lint
npm run lint:fix

# Format code
npm run format
```

## 📝 License

UNLICENSED - Proprietary

## 🆘 Support

For issues and questions:
- GitHub Issues: [bidopsai/issues](https://github.com/bidopsai/bidopsai/issues)
- Email: support@bidops.ai

## 🔗 Related Documentation

- [Feature Specifications](../../specs/001-create-a-cutting/)
- [Database Schema](../../docs/database/bidopsai.mmd)
- [Architecture Diagrams](../../docs/architecture/)
- [Frontend Application](../../apps/web/)