# Agent Development Guide

## Commands

### Frontend (apps/web)
- Dev: `cd apps/web && npm run dev`
- Build: `cd apps/web && npm run build`
- Lint: `cd apps/web && npm run lint`
- Format: `cd apps/web && npx prettier --write "src/**/*.{ts,tsx}"`
- Type check: `cd apps/web && npx tsc --noEmit`

### Backend (services/core-api)
- Dev: `cd services/core-api && npm run dev`
- Build: `cd services/core-api && npm run build`
- Test all: `cd services/core-api && NODE_OPTIONS=--experimental-vm-modules jest`
- Test single file: `cd services/core-api && NODE_OPTIONS=--experimental-vm-modules jest path/to/test.test.ts`
- Test watch: `cd services/core-api && npm run test:watch`
- Lint: `cd services/core-api && npm run lint`
- Format: `cd services/core-api && npm run format`

## Code Style

### Frontend
- **Imports**: Use `@/` path alias (e.g., `import { cn } from "@/lib/utils"`)
- **Formatting**: Double quotes, 2 spaces, 100 char width, semicolons, Tailwind plugin sorting
- **Types**: Strict TypeScript with interfaces for props, discriminated unions for state
- **Components**: Function components with React 19 hooks, Server Components by default, 'use client' when needed
- **Styling**: Tailwind CSS with `cn()` utility for conditional classes
- **State**: TanStack Query for server state, Zustand for client state
- **Forms**: React Hook Form + Zod validation
- **Naming**: PascalCase components, camelCase functions/variables
- **Error handling**: Error boundaries for components

### Backend
- **Imports**: ES modules with `.js` extensions in relative imports
- **Formatting**: Single quotes, 2 spaces, 100 char width, semicolons
- **Types**: Strict TypeScript with interfaces for inputs/args/context
- **Resolvers**: Schema-first GraphQL, typed resolvers with `GraphQLContext`
- **Auth**: Use `requireAuth()`, `requirePermission()`, `requireRole()` helpers
- **Validation**: Zod schemas for input validation
- **Errors**: Custom error classes (`ValidationError`, `NotFoundError`, `AuthenticationError`)
- **Database**: Prisma ORM with transactions for multi-step operations
- **Naming**: camelCase for everything except GraphQL types (PascalCase)

### General Rules
- NO comments unless explicitly requested
- Follow existing patterns in neighboring files
- Check imports/dependencies before using libraries
- Never expose secrets or keys in code/logs
