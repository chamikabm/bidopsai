# Project Structure

## Repository Organization

The BidOps.ai repository follows a monorepo structure with clear separation of concerns across different application layers.

```
bidops-ai/
├── .github/                    # GitHub workflows and templates
├── .kiro/                      # Kiro IDE configuration and steering
├── agents-core/                # AI agent implementations
├── apps/
│   └── web/                    # Next.js frontend application
├── docs/
│   ├── architecture/           # Architecture documentation
│   ├── database/               # Database schemas and ERDs
│   └── scratches/              # Development notes and planning
├── infra/
│   ├── cdk/                    # AWS CDK infrastructure code
│   ├── cloud-formation/        # CloudFormation templates
│   └── docker/                 # Docker configurations
├── scripts/                    # Build and deployment scripts
└── services/
    └── core-api/               # GraphQL API service
```

## Frontend Structure (apps/web/)

### Recommended Next.js App Router Structure
```
apps/web/
├── src/
│   ├── app/                    # App Router pages and layouts
│   │   ├── (auth)/             # Authentication route group
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── projects/           # Project management pages
│   │   ├── knowledge-bases/    # Knowledge base pages
│   │   ├── users/              # User management pages
│   │   ├── settings/           # Settings pages
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home/login page
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Base UI components
│   │   ├── forms/              # Form components
│   │   ├── layout/             # Layout components
│   │   └── features/           # Feature-specific components
│   ├── lib/                    # Utility functions and configurations
│   │   ├── auth/               # Authentication utilities
│   │   ├── api/                # API client and GraphQL queries
│   │   ├── stores/             # Zustand stores
│   │   └── utils/              # General utilities
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript type definitions
│   └── styles/                 # Global styles and Tailwind config
├── public/                     # Static assets
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Backend Structure (services/core-api/)

### GraphQL API Organization
```
services/core-api/
├── src/
│   ├── schema/                 # GraphQL schema definitions
│   │   ├── types/              # GraphQL type definitions
│   │   ├── queries/            # Query resolvers
│   │   ├── mutations/          # Mutation resolvers
│   │   └── subscriptions/      # Subscription resolvers
│   ├── models/                 # Database models and Prisma client
│   ├── services/               # Business logic services
│   ├── middleware/             # Authentication and validation
│   ├── utils/                  # Utility functions
│   └── server.ts               # Server entry point
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Database migrations
│   └── seed.ts                 # Database seeding
├── package.json
└── tsconfig.json
```

## Agent Core Structure (agents-core/)

### AI Agent Organization
```
agents-core/
├── src/
│   ├── agents/                 # Individual agent implementations
│   │   ├── supervisor/         # Orchestration agent
│   │   ├── parser/             # Document parsing agent
│   │   ├── analysis/           # Analysis agent
│   │   ├── content/            # Content generation agent
│   │   ├── compliance/         # Compliance checking agent
│   │   ├── qa/                 # Quality assurance agent
│   │   ├── comms/              # Communications agent
│   │   └── submission/         # Submission agent
│   ├── tools/                  # MCP tools and utilities
│   ├── workflows/              # Workflow definitions
│   ├── models/                 # Shared data models
│   └── main.py                 # FastAPI entry point
├── requirements.txt
└── Dockerfile
```

## Infrastructure Structure (infra/)

### CDK Organization
```
infra/cdk/
├── lib/
│   ├── stacks/                 # CDK stack definitions
│   │   ├── auth-stack.ts       # Cognito and authentication
│   │   ├── database-stack.ts   # RDS and database resources
│   │   ├── storage-stack.ts    # S3 buckets and storage
│   │   ├── api-stack.ts        # API Gateway and Lambda
│   │   └── frontend-stack.ts   # CloudFront and web hosting
│   ├── constructs/             # Reusable CDK constructs
│   └── config/                 # Environment configurations
├── bin/
│   └── app.ts                  # CDK app entry point
├── package.json
└── cdk.json
```

## Naming Conventions

### Files and Directories
- Use **kebab-case** for directories and file names
- Use **PascalCase** for React components
- Use **camelCase** for TypeScript files and functions
- Use **SCREAMING_SNAKE_CASE** for environment variables

### Database
- Use **snake_case** for table and column names
- Use **uuid** for all primary keys
- Include **created_at** and **updated_at** timestamps
- Use descriptive foreign key names (e.g., `created_by`, `project_id`)

### GraphQL
- Use **PascalCase** for types and interfaces
- Use **camelCase** for fields and arguments
- Use **SCREAMING_SNAKE_CASE** for enums
- Prefix mutations with action verbs (create, update, delete)

## Code Organization Principles

### Component Structure
- Keep components small and focused on single responsibility
- Use composition over inheritance
- Separate presentation from business logic
- Co-locate related files (component, styles, tests)

### State Management
- Use TanStack Query for server state
- Use Zustand for client state that needs persistence
- Use React Hook Form for form state
- Keep component state local when possible

### Import Organization
```typescript
// 1. External libraries
import React from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. Internal utilities and types
import { cn } from '@/lib/utils'
import type { Project } from '@/types'

// 3. Components (from most general to most specific)
import { Button } from '@/components/ui/button'
import { ProjectCard } from '@/components/features/projects'
```

### Error Handling
- Use error boundaries for React component errors
- Implement proper error states in UI components
- Use TanStack Query error handling for API errors
- Log errors appropriately for debugging