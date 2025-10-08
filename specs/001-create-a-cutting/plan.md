# Implementation Plan: BidOps.AI Frontend Application

**Branch**: `001-create-a-cutting` | **Date**: 2025-10-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-create-a-cutting/spec.md`

**Note**: This document is the output of the `/speckit.plan` command.

## Summary

Build a cutting-edge, future-forward frontend web application for AI-powered bid automation. The application combines financial trading platform aesthetics, AI-powered agentic workflows, and sci-fi interfaces with Vercel's polish, Linear's precision, cyberpunk aesthetics, and Bloomberg Terminal sophistication. The platform enables users to create bid projects, upload documents, interact with AI agents through a real-time workflow, review and edit AI-generated artifacts, and manage team collaboration—all through a fully responsive interface (320px to 1920px+). The technical approach leverages Next.js 15 App Router with Server Components, AWS Cognito for authentication, S3 for file storage, AgentCore for AI agent orchestration via SSE, and a comprehensive state management strategy using TanStack Query for server state and Zustand for client state.

## Technical Context

**Language/Version**: TypeScript 5.9+, Node.js 24+  
**Primary Dependencies**: 
- Framework: Next.js 15.5+ (App Router with Server Components), React 19.2+
- Styling: Tailwind CSS 4.1+ with CSS variables for theming
- Animations: Framer Motion 12.23+
- State Management: TanStack Query v5.90+ (server state), Zustand v5.0+ (client state)
- Forms: React Hook Form v7.64+ with Zod v4.1+ validation
- Editor: TipTap v3.6+ for rich text editing
- UI Components: Radix UI (unstyled accessible components), shadcn/ui patterns
- Authentication: AWS Amplify v6.15+ Gen 2 with AWS Cognito
- GraphQL Client: graphql-request for GraphQL API communication

**Storage**: 
- Remote: AWS S3 (direct browser uploads via presigned URLs), PostgreSQL (via GraphQL API)
- Client: IndexedDB (for TanStack Query cache), localStorage (for Zustand persistence)

**Testing**: Jest + React Testing Library (unit), Playwright/Cypress (E2E), contract testing for GraphQL operations

**Target Platform**: 
- Primary: Modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
- Responsive: Desktop (1920px+), Tablet (768px-1024px), Mobile (320px-767px)
- Deployment: AWS ECS containers via Docker

**Project Type**: Web application (monorepo with single frontend app at `apps/web/`)

**Performance Goals**: 
- Authentication: <30 seconds for sign-in/sign-up
- Page loads: <2 seconds for dashboard, <1 second for navigation
- SSE latency: <500ms from event receipt to UI update
- Animations: 60fps smooth animations on progress indicators and transitions
- File uploads: Support files up to 500MB with chunked uploads
- Concurrent users: 1,000 users without performance degradation

**Constraints**: 
- Must use AWS Cognito exclusively for authentication (no custom auth)
- Direct browser-to-S3 uploads only (no file proxying through backend)
- Real-time updates must use SSE from AgentCore (not WebSocket or polling)
- All application state must persist to enable workflow resumption after page refresh
- Must support role-based access control (Admin, Drafter, Bidder, KB-Admin, KB-View)
- Must meet WCAG 2.1 Level AA accessibility standards
- Response design must work from 320px to 1920px+ screen widths
- Must use GraphQL for all CRUD operations (no REST)
- Docker images must be <500MB optimized for ECS deployment

**Scale/Scope**: 
- Users: Support 1,000 concurrent users, 10,000+ total users
- Data: Handle 500MB file uploads, multiple document types (Word, Excel, PDF, Audio, Video)
- Workflows: 8-step agent workflow with 9 specialized AI agents
- Artifacts: Multiple versioned artifacts per project with TipTap JSON content
- Pages: ~30 pages/routes covering auth, dashboard, projects, knowledge bases, users, settings
- Components: ~150+ components (UI primitives, layouts, domain-specific)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: This project does not have a custom constitution file. Applying general software engineering best practices:

### General Best Practices Gates

✅ **Simplicity First**: 
- Use established patterns (Next.js App Router, standard component architecture)
- Leverage existing libraries (shadcn/ui, Radix UI) rather than building custom solutions
- Clear separation of concerns (pages, components, hooks, lib, types, styles)

✅ **Test Coverage**:
- Unit tests for business logic, hooks, and utilities
- Integration tests for API interactions and state management
- E2E tests for critical user flows (auth, project creation, workflow execution)
- Contract tests for GraphQL schema compliance

✅ **Type Safety**:
- Strict TypeScript configuration
- Zod schemas for runtime validation
- GraphQL codegen for type-safe API calls
- Shared types between frontend and backend contracts

✅ **Observability**:
- Structured logging for errors and key events
- Error boundaries for graceful failure handling
- Performance monitoring for Core Web Vitals
- CloudWatch integration when deployed to ECS

✅ **Security**:
- AWS Cognito for authentication and authorization
- Role-based access control (RBAC) enforced at UI and API levels
- Secure S3 presigned URLs with expiration
- Input validation with Zod schemas
- XSS protection through React's default escaping

✅ **Maintainability**:
- Clear folder structure following Next.js conventions
- Consistent component patterns (UI primitives, compositions, page components)
- Shared utilities and hooks for common operations
- Documentation via README files and inline comments

**Gate Status**: ✅ **PASSED** - All general best practices are addressed in the specification

## Project Structure

### Documentation (this feature)

```
specs/001-create-a-cutting/
├── spec.md              # Feature specification (✅ COMPLETE - 490 lines)
├── checklists/
│   └── requirements.md  # Validation checklist (✅ COMPLETE - 121 lines)
├── plan.md              # This file (✅ COMPLETE - 553 lines)
├── research.md          # Phase 0 output (✅ COMPLETE - 1,204 lines)
├── data-model.md        # Phase 1 output (✅ COMPLETE - 1,007 lines)
├── quickstart.md        # Phase 1 output (✅ COMPLETE - 700 lines)
├── contracts/           # Phase 1 output (✅ COMPLETE)
│   ├── queries.graphql          # 668 lines - 33 query operations
│   ├── mutations.graphql        # 394 lines - 32 mutation operations
│   ├── subscriptions.graphql    # 136 lines - 6 subscriptions
│   └── sse-events.md            # 857 lines - 23 SSE event types
└── tasks.md             # Phase 2 output - created by /speckit.tasks (NOT by /speckit.plan)
```

### Source Code (repository root)

```
bidopsai/
├── apps/
│   └── web/                          # Next.js 15 frontend application
│       ├── src/
│       │   ├── app/                  # Next.js App Router
│       │   │   ├── (auth)/          # Auth route group with full-screen layout
│       │   │   │   ├── layout.tsx   # Auth layout with animated background
│       │   │   │   ├── signin/
│       │   │   │   │   └── page.tsx # Sign in page
│       │   │   │   └── signup/
│       │   │   │       └── page.tsx # Sign up page
│       │   │   ├── (main)/          # Main app route group with sidebar
│       │   │   │   ├── layout.tsx   # Main layout with sidebar + top nav
│       │   │   │   ├── dashboard/
│       │   │   │   │   └── page.tsx # Dashboard page
│       │   │   │   ├── projects/
│       │   │   │   │   ├── page.tsx           # All projects list
│       │   │   │   │   ├── new/
│       │   │   │   │   │   └── page.tsx       # New project form
│       │   │   │   │   └── [projectId]/
│       │   │   │   │       └── page.tsx       # Project detail/workflow
│       │   │   │   ├── knowledge-bases/
│       │   │   │   │   ├── page.tsx                    # All KBs list
│       │   │   │   │   ├── new/
│       │   │   │   │   │   └── page.tsx                # New KB form
│       │   │   │   │   └── [knowledgeBaseId]/
│       │   │   │   │       └── page.tsx                # KB detail
│       │   │   │   ├── users/
│       │   │   │   │   ├── page.tsx      # All users list
│       │   │   │   │   ├── new/
│       │   │   │   │   │   └── page.tsx  # Add user form
│       │   │   │   │   └── [userId]/
│       │   │   │   │       └── page.tsx  # User detail
│       │   │   │   └── settings/
│       │   │   │       ├── page.tsx                 # Settings redirect
│       │   │   │       ├── agents/
│       │   │   │       │   └── page.tsx             # Agent config
│       │   │   │       ├── integrations/
│       │   │   │       │   └── page.tsx             # Integrations
│       │   │   │       └── system/
│       │   │   │           └── page.tsx             # System settings
│       │   │   ├── api/                   # API routes (BFF pattern)
│       │   │   │   ├── auth/
│       │   │   │   │   └── [...nextauth]/
│       │   │   │   │       └── route.ts   # NextAuth.js config
│       │   │   │   ├── graphql/
│       │   │   │   │   └── route.ts       # GraphQL proxy
│       │   │   │   └── workflow-agents/
│       │   │   │       └── invocations/
│       │   │   │           └── route.ts   # AgentCore SSE proxy
│       │   │   ├── layout.tsx             # Root layout
│       │   │   ├── page.tsx               # Root redirect
│       │   │   ├── globals.css            # Global styles
│       │   │   └── not-found.tsx          # 404 page
│       │   ├── components/
│       │   │   ├── ui/                    # shadcn/ui primitives
│       │   │   │   ├── button.tsx
│       │   │   │   ├── card.tsx
│       │   │   │   ├── dialog.tsx
│       │   │   │   ├── input.tsx
│       │   │   │   └── ... (40+ UI components)
│       │   │   ├── layout/                # Layout components
│       │   │   │   ├── TopNavigation/
│       │   │   │   ├── Sidebar/
│       │   │   │   └── MainLayout/
│       │   │   ├── auth/                  # Auth components
│       │   │   │   ├── SignInForm/
│       │   │   │   ├── SignUpForm/
│       │   │   │   ├── AuthBackground/
│       │   │   │   └── SocialAuth/
│       │   │   ├── dashboard/             # Dashboard components
│       │   │   ├── projects/              # Project components
│       │   │   │   ├── ProjectList/
│       │   │   │   ├── ProjectForm/
│       │   │   │   ├── ProjectWorkflow/
│       │   │   │   ├── AgentChat/
│       │   │   │   ├── ArtifactViewer/
│       │   │   │   └── ProjectDetails/
│       │   │   ├── editor/                # Rich text editor
│       │   │   │   ├── RichTextEditor.tsx
│       │   │   │   ├── MenuBar/
│       │   │   │   ├── BubbleMenu/
│       │   │   │   ├── FloatingMenu/
│       │   │   │   ├── extensions/
│       │   │   │   └── nodes/
│       │   │   ├── knowledge-bases/       # KB components
│       │   │   ├── users/                 # User management components
│       │   │   ├── settings/              # Settings components
│       │   │   ├── common/                # Shared components
│       │   │   │   ├── FileUpload/
│       │   │   │   ├── Pagination/
│       │   │   │   ├── SearchBar/
│       │   │   │   ├── ErrorBoundary/
│       │   │   │   ├── LoadingSpinner/
│       │   │   │   └── ProgressBar/
│       │   │   └── providers/
│       │   │       └── Providers.tsx      # Combined providers wrapper
│       │   ├── hooks/
│       │   │   ├── queries/               # TanStack Query hooks
│       │   │   │   ├── useProjects.ts
│       │   │   │   ├── useProject.ts
│       │   │   │   ├── useKnowledgeBases.ts
│       │   │   │   ├── useUsers.ts
│       │   │   │   ├── useArtifacts.ts
│       │   │   │   ├── useWorkflowExecution.ts
│       │   │   │   └── useAgentTasks.ts
│       │   │   ├── mutations/             # TanStack Query mutations
│       │   │   │   ├── useCreateProject.ts
│       │   │   │   ├── useUpdateProject.ts
│       │   │   │   ├── useCreateKnowledgeBase.ts
│       │   │   │   ├── useCreateUser.ts
│       │   │   │   ├── useUpdateArtifact.ts
│       │   │   │   ├── useGetPresignedUrl.ts
│       │   │   │   └── useTriggerAgentExecution.ts
│       │   │   ├── streams/               # SSE hooks
│       │   │   │   ├── useWorkflowStream.ts
│       │   │   │   └── useNotificationStream.ts
│       │   │   ├── useAuth.ts             # Cognito auth hook
│       │   │   ├── usePermissions.ts      # RBAC hook
│       │   │   ├── useFileUpload.ts       # S3 upload hook
│       │   │   └── useEditor.ts           # TipTap editor hook
│       │   ├── lib/
│       │   │   ├── query-client.ts        # TanStack Query setup
│       │   │   ├── auth/
│       │   │   │   ├── cognito.ts         # Cognito SDK setup
│       │   │   │   ├── nextauth.config.ts # NextAuth config
│       │   │   │   └── session.ts         # Session utilities
│       │   │   ├── graphql/
│       │   │   │   ├── client.ts          # GraphQL client
│       │   │   │   ├── queries/
│       │   │   │   │   ├── projects.ts
│       │   │   │   │   ├── knowledgeBases.ts
│       │   │   │   │   ├── users.ts
│       │   │   │   │   ├── artifacts.ts
│       │   │   │   │   └── workflow.ts
│       │   │   │   └── mutations/
│       │   │   │       ├── projects.ts
│       │   │   │       ├── knowledgeBases.ts
│       │   │   │       ├── users.ts
│       │   │   │       ├── artifacts.ts
│       │   │   │       └── agentExecution.ts
│       │   │   ├── api/
│       │   │   │   ├── workflow-agents.ts # AgentCore client
│       │   │   │   ├── s3.ts              # S3 utilities
│       │   │   │   └── sse-client.ts      # SSE helper
│       │   │   ├── editor/
│       │   │   │   ├── tiptap/            # TipTap implementation
│       │   │   │   │   ├── extensions.ts
│       │   │   │   │   ├── config.ts
│       │   │   │   │   ├── helpers.ts
│       │   │   │   │   └── utils.ts
│       │   │   │   └── adapter.ts         # Editor abstraction
│       │   │   └── utils.ts               # shadcn/ui utils (cn)
│       │   ├── store/                     # Zustand stores
│       │   │   ├── useUIStore.ts          # Theme, language, sidebar
│       │   │   └── useArtifactDraftStore.ts # Unsaved edits
│       │   ├── types/
│       │   │   ├── auth.types.ts
│       │   │   ├── user.types.ts
│       │   │   ├── project.types.ts
│       │   │   ├── knowledgeBase.types.ts
│       │   │   ├── workflow.types.ts
│       │   │   ├── agent.types.ts
│       │   │   ├── artifact.types.ts
│       │   │   ├── notification.types.ts
│       │   │   ├── editor.types.ts
│       │   │   └── common.types.ts
│       │   ├── utils/
│       │   │   ├── formatting.ts
│       │   │   ├── validation.ts
│       │   │   ├── date.ts
│       │   │   ├── file.ts
│       │   │   ├── constants.ts
│       │   │   ├── permissions.ts
│       │   │   ├── helpers.ts
│       │   │   ├── artifact-converter.ts
│       │   │   └── editor-json-converter.ts
│       │   ├── styles/
│       │   │   ├── globals.css
│       │   │   ├── variables.css
│       │   │   ├── animations.css
│       │   │   ├── editor.css
│       │   │   └── themes/
│       │   │       ├── light.css
│       │   │       ├── dark.css
│       │   │       ├── deloitte.css
│       │   │       └── futuristic.css
│       │   └── middleware.ts              # Next.js middleware (auth)
│       ├── public/
│       │   ├── images/
│       │   │   ├── logo.svg
│       │   │   └── icons/
│       │   ├── fonts/
│       │   └── animations/
│       ├── .env.local                     # Local env vars
│       ├── .env.example                   # Example env file
│       ├── .eslintrc.json
│       ├── .prettierrc
│       ├── tsconfig.json
│       ├── next.config.js
│       ├── package.json
│       ├── tailwind.config.ts
│       ├── postcss.config.js
│       ├── components.json                # shadcn/ui config
│       └── README.md
├── infra/
│   ├── cdk/                               # CDK stacks
│   │   ├── bin/
│   │   │   └── app.ts                     # CDK app entry
│   │   ├── lib/
│   │   │   └── cognito-stack.ts           # Cognito User Pool stack
│   │   ├── cdk.json
│   │   ├── package.json
│   │   └── README.md
│   └── docker/
│       └── apps/
│           └── web/
│               ├── Dockerfile.dev          # Dev with hot-reload
│               └── Dockerfile              # Production optimized
├── .github/
│   └── workflows/
│       └── deploy-frontend.yml            # CI/CD to ECR/ECS
├── Makefile                               # Build automation
├── docs/                                  # Existing docs
│   ├── scratches/
│   │   ├── 01-initial.md
│   │   └── design.md
│   ├── database/
│   │   └── bidopsai.mmd
│   └── architecture/
│       ├── agent-core/
│       │   └── agent-flow-diagram.md
│       ├── core-api/
│       │   └── gql-schema.md
│       └── web-frontend/
│           └── fe-folder-structure.md
└── specs/                                 # Feature specs
    └── 001-create-a-cutting/
        └── [this planning output]
```

**Structure Decision**: This is a monorepo with the frontend application located at `apps/web/`. The structure follows Next.js 15 App Router conventions with:
- Route groups for layout isolation: `(auth)` for full-screen auth pages, `(main)` for sidebar layout
- Colocated API routes using the BFF (Backend-for-Frontend) pattern
- Component organization by domain (auth, dashboard, projects, etc.) with shared UI primitives
- Separation of concerns: hooks for data fetching, lib for utilities, store for client state, types for TypeScript definitions
- Infrastructure as code with CDK for Cognito provisioning
- Docker files for both development (hot-reload) and production (optimized)
- GitHub Actions for automated CI/CD to AWS ECS

## Complexity Tracking

*No violations - Constitution check passed with general best practices*

This project follows standard web application patterns and does not introduce unnecessary complexity. All architectural decisions are justified by functional requirements in the specification.

## Phase 0: Outline & Research

**Status**: ✅ Complete

Research completed and documented in `research.md` (1,204 lines) covering:

1. **Library Version Compatibility**
   - Verify Next.js 15.5+, React 19.2+, TypeScript 5.9+ compatibility
   - Confirm TanStack Query v5.90+ works with React 19
   - Validate Framer Motion 12.23+ compatibility with React 19
   - Check TipTap v3.6+ compatibility matrix
   - Verify AWS Amplify v6.15+ Gen 2 with Next.js 15

2. **AWS Cognito Integration Patterns**
   - NextAuth.js + AWS Cognito configuration
   - Google OAuth provider setup in Cognito
   - Session management with Cognito JWT tokens
   - Role-based access control implementation

3. **SSE Implementation Best Practices**
   - Server-Sent Events handling in Next.js API routes
   - TanStack Query cache updates from SSE events
   - Reconnection strategies and error handling
   - SSE vs WebSocket tradeoffs for this use case

4. **S3 Presigned URL Patterns**
   - Direct browser-to-S3 uploads with presigned URLs
   - Chunked uploads for large files (500MB+)
   - Progress tracking and error recovery
   - CORS configuration requirements

5. **TipTap Editor Configuration**
   - TipTap JSON format for artifact content
   - Custom extensions for document editing
   - Collaboration features (future consideration)
   - Export to Word/PDF conversion strategies

6. **Responsive Design & Animation Performance**
   - Framer Motion performance optimization techniques
   - 60fps animation strategies for progress indicators
   - Responsive breakpoints (320px to 1920px+)
   - Mobile-first development approach

7. **GraphQL Client Setup**
   - graphql-request vs Apollo Client comparison
   - Code generation for type-safe operations
   - Subscription handling for real-time updates
   - Error handling and retry strategies

8. **Docker & ECS Deployment**
   - Next.js Docker optimization (standalone output)
   - Multi-stage Docker builds for size reduction
   - ECS task definition requirements
   - Health check endpoint implementation

9. **CDK Stack Configuration**
   - Cognito User Pool with identity providers
   - Google OAuth client configuration
   - CDK outputs for application configuration
   - Stack deployment best practices

10. **Testing Strategy**
    - Jest + React Testing Library setup
    - E2E testing tool selection (Playwright vs Cypress)
    - Contract testing for GraphQL operations
    - Testing SSE streams and async workflows

**Next Step**: Generate `research.md` with findings for each topic.

## Phase 1: Design & Contracts

**Status**: ✅ Complete

Generated artifacts:

1. ✅ **data-model.md** (1,007 lines) - Complete frontend data model
   - 13 core entities with TypeScript interfaces
   - Zod validation schemas for runtime validation
   - TanStack Query cache structure with query keys
   - 3 Zustand stores (UI, ArtifactDraft, Upload)
   - State management patterns and cache invalidation strategies

2. ✅ **contracts/** - Complete API contract definitions
   - `queries.graphql` (668 lines) - 33 query operations
   - `mutations.graphql` (394 lines) - 32 mutation operations
   - `subscriptions.graphql` (136 lines) - 6 real-time subscriptions
   - `sse-events.md` (857 lines) - 23 SSE event types with TypeScript interfaces

3. ✅ **quickstart.md** (700 lines) - Developer setup guide
   - Prerequisites and required software
   - 7-step setup process (clone → install → AWS → CDK → env → dev → test)
   - Docker development environment setup
   - Mock data configuration for AWS-free development
   - Common issues and troubleshooting
   - Available commands reference

4. ✅ **Agent context update** - Updated `.roo/rules/specify-rules.md` with TypeScript 5.9+, Node.js 24+

## Phase 2: Task Breakdown

**Status**: NOT STARTED

This phase is handled by the `/speckit.tasks` command (separate from `/speckit.plan`).
