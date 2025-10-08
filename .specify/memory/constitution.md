<!--
SYNC IMPACT REPORT
Version: 0.0.0 → 1.0.0
Modified Principles: Initial creation with 8 core principles
Added Sections: Core Principles, Web Development Standards, Quality Gates, Governance
Removed Sections: None (initial version)
Templates Status:
  ✅ .specify/templates/plan-template.md - aligned with TDD and constitution gates
  ✅ .specify/templates/spec-template.md - aligned with functional requirements
  ✅ .specify/templates/tasks-template.md - aligned with TDD task ordering
Follow-up TODOs: None
-->

# BidOps.ai Web Frontend Constitution

## Core Principles

### I. Test-Driven Development (NON-NEGOTIABLE)

**TDD is mandatory for all frontend development.**

- Tests MUST be written BEFORE implementation (Red → Green → Refactor cycle)
- All new features MUST have failing tests before code is written
- Bug fixes MUST include regression tests
- Minimum 80% test coverage for components; 100% for utilities and business logic
- Pre-commit hooks MUST enforce test execution and coverage thresholds

**Rationale**: TDD ensures code correctness, prevents regressions, and creates a safety net for refactoring. It's the foundation of quality in a complex React/Next.js application with multiple agents and real-time workflows.

### II. Server Components First

**Default to React Server Components; use Client Components only when necessary.**

- Components MUST be Server Components by default
- Client Components (`'use client'`) MUST be used only for:
  - Event handlers and interactivity (onClick, onChange, etc.)
  - Browser-only APIs (localStorage, window, etc.)
  - React hooks that require client-side execution (useState, useEffect, etc.)
  - Third-party libraries that require client-side rendering
- Data fetching MUST happen in Server Components when possible
- Server Actions MUST be used for form submissions and mutations

**Rationale**: Server Components reduce JavaScript bundle size, improve initial page load performance, and enable direct database/API access without exposing credentials to the client.

### III. Type Safety & Strict TypeScript

**All code MUST use strict TypeScript with zero compromises.**

- TypeScript strict mode MUST be enabled (all strict flags on)
- `any` type is PROHIBITED except when interfacing with untyped third-party libraries (must be wrapped and typed)
- Discriminated unions MUST be used for state modeling
- Branded types MUST be used for IDs and domain-specific primitives
- Component props MUST be explicitly typed interfaces
- Generic constraints MUST be used where appropriate

**Rationale**: Type safety prevents runtime errors, improves developer experience with IntelliSense, and serves as living documentation for complex data flows in the agent-based workflow system.

### IV. State Management Separation

**Server state and client state MUST use different tools.**

- Server state (API data, database queries) MUST use TanStack Query
- Client state (UI state, form state, theme) MUST use Zustand
- React Context MUST be used only for dependency injection and theming
- Form state MUST use React Hook Form with Zod validation
- Component-local state MUST use React hooks (useState, useReducer)
- Global state MUST be justified and documented

**Rationale**: Specialized tools for different state types reduce complexity, prevent cache invalidation bugs, and make data flow explicit. TanStack Query's caching and optimistic updates are essential for real-time agent workflows.

### V. Performance by Default

**Every component and page MUST meet performance budgets.**

- First Contentful Paint (FCP) MUST be < 1.5 seconds
- Time to Interactive (TTI) MUST be < 3 seconds
- Code splitting MUST be used for routes and heavy components (lazy + Suspense)
- Images MUST use Next.js Image component with optimization
- Fonts MUST use next/font for optimization
- Memoization (useMemo, useCallback, React.memo) MUST be used for expensive operations
- Web Vitals MUST be monitored and tracked

**Rationale**: Performance directly impacts user experience, especially in a real-time collaborative environment with SSE streams and multi-agent interactions.

### VI. Accessibility & Semantic HTML

**All UI MUST be keyboard-accessible and screen-reader friendly.**

- Semantic HTML MUST be used (nav, article, section, etc.)
- ARIA labels MUST be provided for interactive elements
- Keyboard navigation MUST work for all user flows
- Color contrast MUST meet WCAG AA standards (minimum 4.5:1)
- Focus indicators MUST be visible and styled
- Forms MUST have associated labels and error messages
- Screen reader testing MUST be performed for critical paths

**Rationale**: Accessibility is a legal requirement and ensures the platform is usable by all bid managers and proposal writers, regardless of abilities.

### VII. Component Composition & Reusability

**Favor composition over inheritance; build small, focused components.**

- Components MUST do one thing well (Single Responsibility Principle)
- UI primitives MUST be extracted to `components/ui/` (shadcn/ui pattern)
- Feature-specific components MUST live in `components/[feature]/`
- Compound components MUST be used for complex UI patterns (Accordion, Dialog, etc.)
- Render props and children props MUST be preferred over props drilling
- Custom hooks MUST extract reusable logic
- Higher-order components are DISCOURAGED; use hooks instead

**Rationale**: Composition enables rapid feature development, reduces duplication, and makes testing easier. Small components are easier to understand, test, and maintain.

### VIII. Error Handling & Observability

**All errors MUST be caught, logged, and presented gracefully.**

- Error Boundaries MUST wrap route segments and critical components
- Async errors MUST be caught with try/catch or React Query error handling
- User-facing error messages MUST be helpful and actionable
- Error tracking MUST be integrated (e.g., Sentry, CloudWatch)
- Loading states MUST be shown with Suspense or skeleton screens
- Network errors MUST trigger retry mechanisms or offline indicators
- Console errors and warnings MUST be zero in production builds

**Rationale**: Graceful error handling is critical for user trust in an AI-powered bid automation platform where workflows can fail due to agent errors, network issues, or data problems.

## Web Development Standards

### React 19+ Standards

- Use function components with hooks exclusively (no class components)
- Leverage automatic batching for state updates
- Use `useActionState` for form submissions and async operations
- Implement optimistic updates with `useOptimistic` for mutations
- Use `use()` hook for promise unwrapping when stable
- Use Suspense boundaries for data fetching and code splitting
- Use Error Boundaries for graceful error handling

### Next.js 15+ Standards

- Use App Router exclusively (no Pages Router)
- Route organization: use route groups `(auth)`, `(dashboard)` for structure
- Server Actions for all form submissions and mutations
- Parallel routes for complex layouts (when needed)
- Intercepting routes for modals (when needed)
- Streaming with Suspense for progressive loading
- Dynamic imports for code splitting (lazy loading)

### Styling Standards

- Tailwind CSS is the PRIMARY styling solution
- Use `cn()` utility from `@/lib/utils` for conditional classes
- CSS Modules for component-specific complex styles (rare)
- NO styled-components or emotion (performance reasons)
- Design tokens MUST be defined in Tailwind config
- Responsive design MUST use Tailwind breakpoints (sm, md, lg, xl)
- Dark mode MUST be supported via Tailwind's dark: variant

### Testing Standards (Detailed)

**Unit Tests (Vitest + React Testing Library)**:
- Test components in isolation with mocked dependencies
- Test utility functions with 100% coverage
- Test custom hooks with `@testing-library/react-hooks`
- Co-locate test files with components (`Button.tsx` → `Button.test.tsx`)

**Integration Tests**:
- Test component integration with React Query and context providers
- Mock API responses with MSW (Mock Service Worker)
- Test complete user flows (form submission → API call → UI update)
- Place in `src/__tests__/integration/`

**E2E Tests (Playwright)**:
- Test critical user journeys (authentication, project creation, agent workflows)
- Test across browsers (Chromium, Firefox, WebKit)
- Use data-testid attributes for stable selectors
- Place in `e2e/` directory at app root

### Code Quality Tools

- ESLint with Next.js config (eslint-config-next)
- Prettier with Tailwind plugin for formatting
- Husky for pre-commit hooks
- TypeScript compiler for type checking
- Vitest for test execution and coverage

## Quality Gates

### Pre-Commit Gates (Automated)

- [ ] ESLint MUST pass with zero errors
- [ ] Prettier MUST format all staged files
- [ ] TypeScript MUST compile with zero errors
- [ ] Related tests MUST pass (vitest related)

### Pre-PR Gates (Manual)

- [ ] All tests MUST pass (unit, integration, E2E)
- [ ] Coverage thresholds MUST be met (80% components, 100% utils)
- [ ] No console errors or warnings
- [ ] Accessibility checklist completed for new UI
- [ ] Performance budgets met for new pages/components

### Pre-Merge Gates (CI/CD)

- [ ] All CI tests MUST pass
- [ ] Build MUST succeed without errors
- [ ] Bundle size MUST not exceed limits
- [ ] No new security vulnerabilities (npm audit)
- [ ] Code review approved by at least one team member

## Governance

### Amendment Process

- Constitution changes MUST be proposed via issue or discussion
- Breaking changes require MAJOR version bump
- New principles/sections require MINOR version bump
- Clarifications require PATCH version bump
- All changes MUST update templates and dependent docs

### Compliance Review

- Monthly review of adherence to principles
- PRs that violate principles MUST be blocked
- Exceptions MUST be documented in PR with justification
- Constitution MUST be referenced in onboarding docs
- Agent context (AGENTS.md) MUST reference this constitution

### Versioning & History

- Follow semantic versioning (MAJOR.MINOR.PATCH)
- Track changes in Git history
- Document breaking changes in constitution comments
- Maintain changelog in Sync Impact Report

**Version**: 1.0.0 | **Ratified**: 2025-01-07 | **Last Amended**: 2025-01-07
