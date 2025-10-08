# Agent Development Guide

## Constitution
**CRITICAL**: Follow the project constitution at `.specify/memory/constitution.md` (v1.0.0)
- 8 core principles govern ALL development (TDD, Server Components, Type Safety, etc.)
- Quality gates define acceptance criteria for all PRs
- Non-negotiable: Test-Driven Development (tests before code)

## Project Rules
**IMPORTANT**: Always consult `.kiro/steering/` for detailed standards:
- `fe-standards.md` - Frontend code standards (React, Next.js, TypeScript)
- `fe-testing-standards.md` - TDD workflow and testing requirements
- `gql-api-standards.md` - GraphQL API standards
- `agent-core-standards.md` - Agent development standards
- Other domain-specific rules in `.kiro/steering/`

## Commands (from apps/web/)
- **Build**: `npm run build` (Next.js with turbopack)
- **Lint**: `npm run lint`
- **Test**: `npm run test` (Vitest watch mode)
- **Test Single**: `npm run test -- path/to/file.test.tsx`
- **Test Coverage**: `npm run test:coverage`
- **E2E Tests**: `npm run test:e2e` (Playwright)
- **Dev**: `npm run dev` (Next.js dev server with turbopack)

## Code Standards
- **NO COMMENTS**: Never add code comments unless explicitly requested
- **TDD Required**: Write tests BEFORE implementation (Red → Green → Refactor)
- **TypeScript**: Strict mode enabled; use discriminated unions, branded types; no `any`
- **Imports**: Use `@/` alias for src imports (e.g., `import { cn } from '@/lib/utils'`)
- **Components**: Function components only; Server Components by default, `'use client'` when needed
- **State**: TanStack Query for server state, Zustand for client state
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS with `cn()` utility for conditional classes
- **Error Handling**: Use Error Boundaries for components, try/catch for async
- **Naming**: PascalCase for components, camelCase for functions/variables, UPPER_CASE for constants

## Formatting
- Semi: true, Single quotes, 2 spaces, 80 char width (Prettier + Tailwind plugin)
- ESLint: No unused vars (prefix `_` to ignore), no console (except warn/error), prefer const
