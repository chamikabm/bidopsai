# Implementation Plan: Core GraphQL API for BidOps.AI Platform

**Branch**: `002-create-a-graphql` | **Date**: 2025-01-12 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-create-a-graphql/spec.md`

## Summary

Build a production-ready GraphQL API server to support the BidOps.AI frontend application, enabling project management, workflow orchestration, artifact tracking, and real-time updates. The API will use Apollo Server with TypeScript on Node.js 24 LTS, Prisma ORM for PostgreSQL database operations, AWS Cognito for authentication, and support both local Docker development and AWS ECS deployment.

## Technical Context

**Language/Version**: Node.js 24 LTS, TypeScript 5.9+  
**Primary Dependencies**: Apollo Server 4.x, Prisma ORM 6.x, GraphQL 16.x, AWS SDK v3  
**Storage**: PostgreSQL 14+ (Docker locally, RDS in production)  
**Testing**: Jest 29.x, Supertest for API testing  
**Target Platform**: Linux server (Docker containers on ECS)  
**Project Type**: Backend API service (services/core-api)  
**Performance Goals**: <200ms p95 for queries, <500ms p95 for mutations, 100+ concurrent WebSocket connections  
**Constraints**: <50ms authentication overhead, transactional consistency for multi-table operations, graceful degradation on external service failures  
**Scale/Scope**: Support 1000+ concurrent users, handle 50+ projects with complex workflows, maintain 99.9% uptime

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS - No constitutional constraints file exists for this project, proceeding with industry best practices:
- Follows REST/GraphQL API patterns for clear contracts
- Test-driven development approach with comprehensive test coverage
- Structured logging and observability built-in
- Version control with semantic versioning
- Security-first design with authentication/authorization layers

## Project Structure

### Documentation (this feature)

```
specs/002-create-a-graphql/
├── plan.md              # This file
├── research.md          # Phase 0: Technology decisions and best practices
├── data-model.md        # Phase 1: Database schema and relationships
├── quickstart.md        # Phase 1: Local development setup guide
├── contracts/           # Phase 1: GraphQL schema definitions
│   ├── schema.graphql   # Complete GraphQL schema
│   ├── types.graphql    # Type definitions
│   ├── inputs.graphql   # Input types
│   └── scalars.graphql  # Custom scalars (UUID, DateTime, JSON)
└── checklists/
    └── requirements.md  # Quality validation checklist
```

### Source Code (repository root)

```
services/core-api/
├── src/
│   ├── index.ts                    # Application entry point
│   ├── server.ts                   # Apollo Server setup
│   ├── context.ts                  # GraphQL context factory
│   ├── schema/
│   │   ├── index.ts                # Schema stitching
│   │   ├── typeDefs/               # GraphQL type definitions
│   │   │   ├── user.graphql
│   │   │   ├── project.graphql
│   │   │   ├── workflow.graphql
│   │   │   ├── artifact.graphql
│   │   │   ├── knowledgeBase.graphql
│   │   │   ├── notification.graphql
│   │   │   └── scalars.graphql
│   │   └── resolvers/              # GraphQL resolvers
│   │       ├── index.ts
│   │       ├── user.ts
│   │       ├── project.ts
│   │       ├── workflow.ts
│   │       ├── artifact.ts
│   │       ├── knowledgeBase.ts
│   │       ├── notification.ts
│   │       └── scalars.ts
│   ├── middleware/
│   │   ├── auth.ts                 # Cognito JWT validation
│   │   ├── errorHandler.ts        # Error formatting
│   │   └── logger.ts               # Request/response logging
│   ├── services/
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── s3.ts                   # S3 presigned URL generation
│   │   ├── auth.ts                 # Authentication utilities
│   │   └── pubsub.ts               # Subscription pub/sub system
│   ├── utils/
│   │   ├── errors.ts               # Custom error classes
│   │   ├── validators.ts           # Input validation
│   │   └── formatters.ts           # Data formatting utilities
│   └── types/
│       ├── context.ts              # GraphQL context types
│       ├── models.ts               # Domain model types
│       └── generated/              # Prisma generated types
│           └── index.ts
├── prisma/
│   ├── schema.prisma               # Database schema
│   ├── migrations/                 # Migration history
│   └── seed.ts                     # Development seed data
├── tests/
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── projects.test.ts
│   │   ├── workflows.test.ts
│   │   └── artifacts.test.ts
│   ├── unit/
│   │   ├── resolvers/
│   │   ├── services/
│   │   └── utils/
│   └── helpers/
│       ├── setup.ts                # Test environment setup
│       └── factories.ts            # Test data factories
├── .env.example                    # Environment variable template
├── .env.development                # Local development config
├── Dockerfile                      # Production image
├── Dockerfile.dev                  # Development image with hot reload
├── docker-compose.yml              # Local stack (API + PostgreSQL)
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.js
├── .prettierrc
└── README.md

infra/docker/
└── docker-compose.dev.yml          # Updated with PostgreSQL + core-api services
```

**Structure Decision**: Using a monolithic API service structure within `services/core-api` that follows clean architecture principles. The GraphQL layer (schema/resolvers) is separated from business logic (services) and data access (Prisma). This structure:
- Supports hot-reloading in development for rapid iteration
- Enables easy unit testing of individual components
- Provides clear separation of concerns (API layer → Service layer → Data layer)
- Allows for future microservice extraction if needed

## Complexity Tracking

*No constitution violations - table intentionally left empty.*

## Phase 0: Research & Decisions

See [research.md](./research.md) for detailed analysis of:
- Apollo Server 4.x configuration patterns for subscriptions
- Prisma ORM best practices for complex relations
- AWS Cognito JWT validation strategies
- GraphQL subscription implementation with PubSub
- Docker multi-stage builds for Node.js applications
- Database indexing strategies for query performance
- Error handling and logging patterns for production GraphQL APIs

## Phase 1: Design Artifacts

### Data Model

See [data-model.md](./data-model.md) for complete entity relationship diagrams and field specifications matching the database ER diagram from `docs/database/bidopsai.mmd`.

**Key Entities**:
- User, Role, Permission, UserRole
- Project, ProjectDocument, ProjectMember
- WorkflowExecution, AgentTask
- Artifact, ArtifactVersion
- KnowledgeBase, KnowledgeBaseDocument, KnowledgeBasePermission
- Notification, AuditLog, BidStatistics, Integration

### API Contracts

See [contracts/](./contracts/) directory for:
- Complete GraphQL schema with all queries, mutations, and subscriptions
- Input/output type definitions
- Custom scalar types (UUID, DateTime, JSON)
- Pagination patterns (cursor-based)

### Development Setup

See [quickstart.md](./quickstart.md) for:
- Prerequisites installation (Node.js, Docker, pnpm)
- Environment variable configuration
- Database initialization and seeding
- Running development server with hot-reload
- Running tests and linting
- Docker commands for local stack management

## Phase 2: Implementation Tasks

*Generated by `/speckit.tasks` command - not included in this plan output.*

Tasks will be broken down into:
1. Project setup and configuration
2. Database schema and migrations
3. Authentication middleware
4. Core resolvers (Users, Projects)
5. Workflow and artifact resolvers
6. Subscription setup
7. Testing and documentation
8. Docker configuration and deployment setup
