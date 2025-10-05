# Technology Stack

## Architecture Overview

BidOps.ai follows a modern, cloud-native architecture with separate frontend, backend API, and AI agent services deployed on AWS.

## Frontend Stack

### Core Technologies

- **React 19+** with TypeScript for type-safe component development
- **Next.js 15+** for SSR, routing, and build optimization
- **TailwindCSS** for utility-first styling and responsive design
- **TipTap** rich text editor for document artifact editing

### State Management Strategy

- **TanStack Query**: Server data, caching, SSE integration
- **Zustand**: Client UI state, localStorage persistence
- **React Hook Form**: Form-specific state only
- **useState**: Component-local state

### UI Components

- **Headless UI** or **Radix UI** for accessible component primitives
- **Framer Motion** for animations and transitions
- **React Hook Form** with **Zod** for form validation

## Backend Stack

### API Layer

- **GraphQL** API using modern GraphQL server (Apollo Server or similar)
- **PostgreSQL** database with UUID primary keys
- **Prisma** or similar ORM for database operations
- **AWS Cognito** for authentication and user management

### AI Agent Infrastructure

- **AWS Bedrock AgentCore** for agent orchestration
- **AWS Bedrock Data Automation** for document parsing
- **AWS Bedrock Knowledge Bases** for vector search
- **FastAPI** wrapper for AgentCore integration
- **Server-Sent Events (SSE)** for real-time agent communication

## AWS Services

### Core Services

- **AWS Cognito**: User authentication, roles, and permissions
- **Amazon S3**: Document storage with presigned URLs
- **AWS Bedrock**: AI models and agent services
- **Amazon RDS (PostgreSQL)**: Primary database
- **AWS Lambda**: Serverless functions for background tasks

### Infrastructure

- **AWS CDK**: Infrastructure as Code
- **Amazon CloudFront**: CDN for static assets
- **AWS API Gateway**: API routing and rate limiting
- **Amazon EventBridge**: Event-driven architecture

## Development Tools

### Build System

- **npm/yarn**: Package management
- **Vite** or **Next.js**: Build tooling and dev server
- **TypeScript**: Static type checking
- **ESLint + Prettier**: Code formatting and linting

### Testing

- **Vitest**: Unit and integration testing
- **React Testing Library**: Component testing
- **Playwright**: End-to-end testing

## Common Commands

### Frontend Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

### Backend Development

```bash
# Database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed database
npm run db:seed

# Start API server
npm run start:api
```

### Infrastructure

```bash
# Deploy CDK stack
cdk deploy

# Synthesize CloudFormation
cdk synth

# Destroy infrastructure
cdk destroy
```

## Environment Configuration

### Required Environment Variables

- `NEXT_PUBLIC_API_URL`: GraphQL API endpoint
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`: Cognito user pool
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`: Cognito app client
- `AWS_REGION`: AWS region for services
- `DATABASE_URL`: PostgreSQL connection string
- `S3_BUCKET_NAME`: Document storage bucket

## Performance Considerations

- Use **React.memo** and **useMemo** for expensive computations
- Implement **lazy loading** for routes and components
- Use **TanStack Query** for efficient data fetching and caching
- Optimize bundle size with **dynamic imports**
- Implement **virtual scrolling** for large lists
