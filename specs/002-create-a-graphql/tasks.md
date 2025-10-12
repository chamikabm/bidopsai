# Implementation Tasks: Core GraphQL API for BidOps.AI Platform

**Feature**: Core GraphQL API | **Branch**: `002-create-a-graphql` | **Date**: 2025-01-12

## Task Organization

Tasks are organized by **User Story Priority** (P1 → P2 → P3) to deliver value incrementally. Each phase builds on previous phases, enabling early testing and validation.

**Legend**:
- `[P]` = Can be parallelized with other [P] tasks in same phase
- `→` = Blocking dependency (must complete before next task)
- `US1-8` = User Story reference from spec.md

**Total Tasks**: 68  
**Estimated Timeline**: 8-10 days (with parallelization)

---

## Phase 1: Project Setup & Foundation (Day 1)

### T001: Initialize project structure [P]
**Story**: Setup | **Effort**: 1h | **Dependencies**: None

Create the base directory structure for `services/core-api`:
- Create `src/` directory with subdirectories: `schema/`, `middleware/`, `services/`, `utils/`, `types/`
- Create `prisma/` directory for schema and migrations
- Create `tests/` directory with `integration/`, `unit/`, `helpers/` subdirectories
- Create root-level config files placeholders

**Output**: Complete folder structure as defined in plan.md

---

### T002: Initialize package.json and install dependencies [P]
**Story**: Setup | **Effort**: 1h | **Dependencies**: T001

Set up Node.js project with all required dependencies:
```bash
cd services/core-api
pnpm init
pnpm add apollo-server-express@4.x express@4.x graphql@16.x
pnpm add @prisma/client@6.x prisma@6.x
pnpm add aws-jwt-verify@4.x @aws-sdk/client-s3@3.x
pnpm add winston@3.x dotenv@16.x zod@3.x
pnpm add graphql-subscriptions@2.x graphql-ws@5.x ws@8.x
pnpm add -D typescript@5.9.x @types/node@24.x @types/express@4.x
pnpm add -D jest@29.x ts-jest@29.x supertest@6.x @types/supertest
pnpm add -D tsx@4.x nodemon@3.x
pnpm add -D eslint@8.x @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D prettier@3.x
```

**Output**: package.json with all dependencies, lock file

---

### T003: Configure TypeScript and build tools [P]
**Story**: Setup | **Effort**: 30m | **Dependencies**: T002

Create configuration files:
- `tsconfig.json` with strict mode, ESNext target, paths for @/ imports
- `jest.config.js` for test runner with ts-jest preset
- `.eslintrc.js` with TypeScript rules and Prettier integration
- `.prettierrc` with consistent formatting rules
- `nodemon.json` for hot-reload in development

**Output**: Complete configuration for TS, testing, linting, formatting

---

### T004: Create environment configuration [P]
**Story**: Setup | **Effort**: 30m | **Dependencies**: T001

Set up environment management:
- Create `.env.example` with all required variables:
  - `NODE_ENV`, `PORT`, `DATABASE_URL`
  - `AWS_REGION`, `AWS_COGNITO_USER_POOL_ID`, `AWS_COGNITO_CLIENT_ID`
  - `S3_BUCKET_NAME`, `JWT_ISSUER`
  - `LOG_LEVEL`, `REDIS_URL` (optional for production)
- Create `.env.development` with local defaults
- Create `src/config/env.ts` using Zod for validation

**Output**: Environment configuration with type-safe validation

---

### T005: Set up Prisma schema → T006
**Story**: Setup | **Effort**: 2h | **Dependencies**: T001, T002

Create `prisma/schema.prisma` based on data-model.md:
- Configure PostgreSQL datasource
- Define all 20+ models with relationships
- Add indexes as specified in data-model.md
- Configure Prisma client generator

**Output**: Complete Prisma schema matching data-model.md

---

### T006: Create initial database migration → T007
**Story**: Setup | **Effort**: 30m | **Dependencies**: T005

Run Prisma migrations:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

**Output**: Initial migration in `prisma/migrations/`, generated Prisma client

---

### T007: Create database seed script [P]
**Story**: Setup | **Effort**: 1.5h | **Dependencies**: T006

Create `prisma/seed.ts` with:
- Admin user with all roles
- Test users (5+) with various roles
- Sample projects (3+) in different statuses
- Sample knowledge bases (global and project-specific)
- Sample roles and permissions
- Sample agent configurations

Add seed script to package.json:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

**Output**: Comprehensive seed script for development testing

---

### T008: Create Docker Compose configuration [P]
**Story**: Setup | **Effort**: 1h | **Dependencies**: T004

Update `infra/docker/docker-compose.dev.yml`:
- Add PostgreSQL 14 service with volume for persistence
- Add core-api service with hot-reload (Dockerfile.dev)
- Configure networking between services
- Set up environment variable passing
- Add health checks for both services

**Output**: docker-compose.dev.yml with PostgreSQL + core-api services

---

### T009: Create Dockerfiles → Phase 2
**Story**: Setup | **Effort**: 1h | **Dependencies**: T002, T003

Create two Dockerfiles in `infra/docker/services/core-api/`:

**Dockerfile.dev**:
- Use node:24-alpine base
- Install dependencies
- Use tsx + nodemon for hot-reload
- Mount source code as volume
- Expose port 4000

**Dockerfile** (production):
- Multi-stage build (deps → build → runtime)
- Optimize for size (Alpine, production deps only)
- Run as non-root user
- Health check endpoint
- Expose port 4000

**Output**: Both Dockerfiles ready for local dev and production

---

## Phase 2: Core Infrastructure (Day 1-2)

### T010: Implement Prisma service singleton [P]
**Story**: US1 - Core API Foundation | **Effort**: 30m | **Dependencies**: T006

Create `src/services/prisma.ts`:
- Singleton PrismaClient instance
- Connection pooling configuration
- Logging configuration for dev/prod
- Graceful disconnect on shutdown
- Error handling for connection failures

**Output**: Reusable Prisma client service

---

### T011: Implement custom error classes [P]
**Story**: US1 - Core API Foundation | **Effort**: 45m | **Dependencies**: T003

Create `src/utils/errors.ts`:
- `AuthenticationError` (401) with codes: `AUTH_TOKEN_EXPIRED`, `AUTH_TOKEN_INVALID`, `AUTH_TOKEN_MISSING`
- `AuthorizationError` (403) with codes: `AUTH_INSUFFICIENT_PERMISSIONS`, `AUTH_RESOURCE_FORBIDDEN`
- `ValidationError` (400) with codes: `VALIDATION_INPUT_INVALID`, `VALIDATION_REQUIRED_FIELD_MISSING`
- `NotFoundError` (404) with codes: `RESOURCE_NOT_FOUND`, `RESOURCE_DELETED`
- `InternalServerError` (500) with codes: `INTERNAL_SERVER_ERROR`, `DATABASE_ERROR`, `EXTERNAL_SERVICE_ERROR`
- Base `GraphQLError` extension with machine-readable error codes for frontend consumption
- Include error code, message, and optional details in error response

**Output**: Type-safe error handling utilities with standardized error codes

---

### T012: Implement Winston logger service [P]
**Story**: US1 - Core API Foundation | **Effort**: 1h | **Dependencies**: T004

Create `src/services/logger.ts`:
- Winston logger with JSON formatting
- Log levels: error, warn, info, debug
- Console transport for development
- File transport for production (errors.log, combined.log)
- Request/response logging middleware
- Sensitive data redaction (passwords, tokens)

**Output**: Structured logging service

---

### T013: Implement Cognito JWT validation middleware → T014
**Story**: US1 - Core API Foundation | **Effort**: 2h | **Dependencies**: T004, T011

Create `src/middleware/auth.ts`:
- Use `aws-jwt-verify` library for token validation
- Verify token signature against Cognito public keys
- Check token expiration (<50ms performance requirement)
- Extract user identity from token claims
- Handle token refresh scenarios
- Cache public keys for performance

**Output**: Authentication middleware with JWT validation

---

### T014: Create GraphQL context factory → T015
**Story**: US1 - Core API Foundation | **Effort**: 1h | **Dependencies**: T010, T013

Create `src/context.ts`:
- Extract user from authenticated request
- Attach Prisma client to context
- Attach logger to context
- Include request metadata (IP, user-agent)
- Type definitions in `src/types/context.ts`

```typescript
export interface GraphQLContext {
  prisma: PrismaClient;
  user: User | null;
  logger: Logger;
  req: Request;
}
```

**Output**: Type-safe GraphQL context setup

---

### T015: Implement custom scalar resolvers [P]
**Story**: US1 - Core API Foundation | **Effort**: 1h | **Dependencies**: T003

Create `src/schema/resolvers/scalars.ts`:
- UUID scalar with validation
- DateTime scalar (ISO 8601)
- Date scalar (YYYY-MM-DD)
- JSON scalar
- Decimal scalar for currency values

**Output**: Custom scalar implementations matching contracts/scalars.graphql

---

### T016: Set up Apollo Server with Express → T017
**Story**: US1 - Core API Foundation | **Effort**: 2h | **Dependencies**: T014, T015

Create `src/server.ts`:
- Initialize Express app
- Configure Apollo Server 4.x with Express integration
- Load GraphQL type definitions (stub initially)
- Load resolvers (stub initially)
- Configure context factory
- Add authentication plugin
- Configure CORS for frontend origin
- Configure playground for development
- Add error formatting with custom errors

**Output**: Working Apollo Server setup (no resolvers yet)

---

### T017: Create health check endpoint → T018
**Story**: US1 - Core API Foundation | **Effort**: 30m | **Dependencies**: T016

Add to Express app in `src/server.ts`:
```typescript
app.get('/health', async (req, res) => {
  // Check database connectivity
  // Return API version, status, uptime
});
```

**Output**: `/health` endpoint for ECS health checks

---

### T018: Create application entry point [P]
**Story**: US1 - Core API Foundation | **Effort**: 30m | **Dependencies**: T016, T017

Create `src/index.ts`:
- Import server setup
- Start Express server on configured port
- Handle graceful shutdown (SIGTERM, SIGINT)
- Log startup information
- Handle uncaught exceptions

Add scripts to package.json:
```json
"scripts": {
  "dev": "nodemon --exec tsx src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "test": "jest",
  "lint": "eslint src --ext .ts",
  "format": "prettier --write src"
}
```

**Output**: Complete application entry point with scripts

---

## Phase 3: User Story 1 - Core API Foundation (Day 2-3)

### T019: Create User type definitions [P]
**Story**: US1 | **Effort**: 30m | **Dependencies**: T015

Create `src/schema/typeDefs/user.graphql`:
- User type matching schema.graphql
- Role and Permission types
- UserConnection for pagination
- UserEdge and PageInfo types

**Output**: User-related GraphQL type definitions

---

### T020: Implement User query resolvers → T021
**Story**: US1 | **Effort**: 2h | **Dependencies**: T019

Create `src/schema/resolvers/user.ts`:
- `me` query: Return authenticated user with roles
- `user(id)` query: Fetch single user by ID
- `users` query: Paginated list with cursor-based pagination
- Implement filters (emailVerified, roleNames)
- Field resolvers for nested relations (roles, projects)

**Output**: User query resolvers with pagination

---

### T021: Implement User mutation resolvers [P]
**Story**: US1 | **Effort**: 2h | **Dependencies**: T020

Add to `src/schema/resolvers/user.ts`:
- `createUser` mutation with **transactional Cognito-Database sync**:
  1. Create user in Cognito first (fail fast if Cognito fails)
  2. Create user in database with cognitoUserId
  3. Implement compensating transaction to delete Cognito user if database creation fails
  4. Sync role assignments to Cognito user groups
- `updateUser` mutation
- `deleteUser` mutation (soft delete consideration, sync to Cognito)
- `updateMyProfile` mutation
- `assignRole` mutation (sync to Cognito groups)
- `removeRole` mutation (sync to Cognito groups)
- Input validation using Zod
- Authorization checks
- **Important**: Maintain consistency between Cognito and PostgreSQL for all user operations

**Output**: User mutation resolvers with transactional Cognito synchronization

---

### T022: Create Project type definitions [P]
**Story**: US1 | **Effort**: 30m | **Dependencies**: T015

Create `src/schema/typeDefs/project.graphql`:
- Project type with all fields
- ProjectDocument, ProjectMember types
- ProjectConnection for pagination
- Input types: CreateProjectInput, UpdateProjectInput

**Output**: Project-related GraphQL type definitions

---

### T023: Implement S3 presigned URL service → T024
**Story**: US2 - Project Lifecycle | **Effort**: 1.5h | **Dependencies**: T004

Create `src/services/s3.ts`:
- Use AWS SDK v3 S3 client
- Generate presigned URLs for PUT operations
- Follow path format: `yyyy/mm/dd/hh/project-name_timestamp/filename`
- Set appropriate expiration (15 minutes)
- Handle errors gracefully
- Support multiple file upload requests

**Output**: S3 presigned URL generation service

---

### T024: Implement Project query resolvers → T025
**Story**: US1, US2 | **Effort**: 2.5h | **Dependencies**: T022

Create `src/schema/resolvers/project.ts`:
- `project(id)` query: Single project with all relations
- `projects` query: Paginated list with filters (status, createdBy, date range)
- `myProjects` query: Current user's projects
- Field resolvers for nested data (members, documents, knowledgeBases, artifacts, workflowExecutions)
- Authorization: Check project membership for private projects

**Output**: Project query resolvers with complex relations

---

### T025: Implement Project mutation resolvers [P]
**Story**: US2 | **Effort**: 3h | **Dependencies**: T023, T024

Add to `src/schema/resolvers/project.ts`:
- `createProject` mutation: Create with initial members, KB associations
- `updateProject` mutation: Update fields, track changes
- `deleteProject` mutation: Cascade delete or archive
- `addProjectMember` mutation
- `removeProjectMember` mutation
- `generatePresignedUrls` mutation: Call S3 service
- `createProjectDocument` mutation: Store metadata after upload
- `updateProjectDocument` mutation: Add processed file location
- `deleteProjectDocument` mutation
- Use transactions for multi-table operations
- Audit log creation for significant changes

**Output**: Complete Project CRUD with document management

---

### T026: Write integration tests for User APIs [P]
**Story**: US1 | **Effort**: 2h | **Dependencies**: T020, T021

Create `tests/integration/user.test.ts`:
- Test `me` query with valid/invalid tokens
- Test user CRUD operations
- Test role assignment/removal
- Test pagination and filtering
- Use test database with Test Containers
- Mock Cognito JWT tokens

**Output**: Comprehensive user API tests

---

### T027: Write integration tests for Project APIs [P]
**Story**: US2 | **Effort**: 2.5h | **Dependencies**: T025

Create `tests/integration/project.test.ts`:
- Test project creation with members and KBs
- Test project updates and status changes
- Test document upload flow (presigned URLs → metadata creation)
- Test member management
- Test authorization (non-members can't access private projects)
- Test pagination and filters

**Output**: Comprehensive project API tests

---

## Phase 4: User Story 3 - Workflow Execution Support (Day 3-4)

### T028: Create Workflow type definitions [P]
**Story**: US3 | **Effort**: 45m | **Dependencies**: T015

Create `src/schema/typeDefs/workflow.graphql`:
- WorkflowExecution type
- AgentTask type
- WorkflowStatus and AgentType enums
- Query types for workflow data retrieval

**Output**: Workflow-related GraphQL type definitions

---

### T029: Implement Workflow query resolvers → T030
**Story**: US3 | **Effort**: 2h | **Dependencies**: T028

Create `src/schema/resolvers/workflow.ts`:
- `workflowExecution(id)` query: Single execution with agent tasks
- `workflowExecutionsByProject` query: All executions for a project
- `agentTask(id)` query: Single task details
- Field resolvers for users (initiatedBy, handledBy, completedBy)
- Parse JSON fields (inputData, outputData, errorLog)

**Output**: Workflow query resolvers

---

### T030: Implement workflow state mutation helpers [P]
**Story**: US3 | **Effort**: 2h | **Dependencies**: T029

Add to `src/schema/resolvers/workflow.ts`:
- Helper function: `createWorkflowExecution(projectId, userId)`
- Helper function: `createAgentTasks(workflowId, sequenceOrder[])`
- Helper function: `updateAgentTaskStatus(taskId, status, data)`
- Helper function: `updateWorkflowStatus(workflowId, status, results)`
- Use transactions for atomicity
- Track initiated_by, handled_by, completed_by

**Note**: These are internal helpers for agent-core integration, not exposed as GraphQL mutations

**Output**: Workflow state management utilities

---

### T031: Write integration tests for Workflow APIs [P]
**Story**: US3 | **Effort**: 2h | **Dependencies**: T030

Create `tests/integration/workflow.test.ts`:
- Test workflow creation and task initialization
- Test task status transitions (Open → InProgress → Completed)
- Test error handling and error_log storage
- Test output_data persistence and retrieval
- Test query filtering by status

**Output**: Workflow API tests

---

## Phase 5: User Story 4 - Artifact Management (Day 4-5)

### T032: Create Artifact type definitions [P]
**Story**: US4 | **Effort**: 30m | **Dependencies**: T015

Create `src/schema/typeDefs/artifact.graphql`:
- Artifact and ArtifactVersion types
- ArtifactType, ArtifactCategory, ArtifactStatus enums
- Input types for artifact creation and updates

**Output**: Artifact-related GraphQL type definitions

---

### T033: Implement Artifact query resolvers → T034
**Story**: US4 | **Effort**: 2h | **Dependencies**: T032

Create `src/schema/resolvers/artifact.ts`:
- `artifact(id)` query: Single artifact with all versions
- `artifactsByProject(projectId)` query: All artifacts for project
- `artifactVersion(id)` query: Specific version details
- Field resolver for `latestVersion`: Return highest version_number
- Parse content JSON based on category (TipTap, Q&A, Excel)

**Output**: Artifact query resolvers

---

### T034: Implement Artifact mutation resolvers [P]
**Story**: US4 | **Effort**: 2.5h | **Dependencies**: T033

Add to `src/schema/resolvers/artifact.ts`:
- `createArtifact` mutation: Create with initial version (v1)
- `updateArtifactVersion` mutation: Create new version, increment version_number
- `approveArtifact` mutation: Update status, set approved_by/approved_at
- `rejectArtifact` mutation: Update status
- Validate content structure based on category
- Store location for exported files (S3 path)

**Output**: Artifact CRUD with versioning

---

### T035: Write integration tests for Artifact APIs [P]
**Story**: US4 | **Effort**: 2h | **Dependencies**: T034

Create `tests/integration/artifact.test.ts`:
- Test artifact creation with initial version
- Test version creation and increment
- Test approval/rejection workflow
- Test content validation for different categories
- Test latest version retrieval
- Test location storage for exports

**Output**: Artifact API tests

---

## Phase 6: User Story 5 - Knowledge Base Operations (Day 5)

### T036: Create KnowledgeBase type definitions [P]
**Story**: US5 | **Effort**: 30m | **Dependencies**: T015

Create `src/schema/typeDefs/knowledgeBase.graphql`:
- KnowledgeBase, KnowledgeBaseDocument types
- KnowledgeBasePermission type
- KnowledgeBaseConnection for pagination
- Input types for KB creation and document uploads

**Output**: KnowledgeBase-related GraphQL type definitions

---

### T037: Implement KnowledgeBase query resolvers → T038
**Story**: US5 | **Effort**: 2h | **Dependencies**: T036

Create `src/schema/resolvers/knowledgeBase.ts`:
- `knowledgeBase(id)` query: Single KB with documents
- `knowledgeBases` query: Paginated list with scope filter
- `globalKnowledgeBases` query: All global KBs
- Authorization: Check permissions for access
- Field resolvers for documents, permissions

**Output**: KnowledgeBase query resolvers

---

### T038: Implement KnowledgeBase mutation resolvers [P]
**Story**: US5 | **Effort**: 2h | **Dependencies**: T037

Add to `src/schema/resolvers/knowledgeBase.ts`:
- `createKnowledgeBase` mutation: Create with scope (global/project)
- `updateKnowledgeBase` mutation: Update name, description
- `deleteKnowledgeBase` mutation: Cascade delete documents
- `uploadKnowledgeBaseDocument` mutation: Store document metadata
- `deleteKnowledgeBaseDocument` mutation
- Update document_count on document operations
- Handle vectorStoreId for Bedrock integration

**Output**: KnowledgeBase CRUD operations

---

### T039: Write integration tests for KnowledgeBase APIs [P]
**Story**: US5 | **Effort**: 1.5h | **Dependencies**: T038

Create `tests/integration/knowledgeBase.test.ts`:
- Test KB creation (global and project-specific)
- Test document upload and metadata storage
- Test scope filtering
- Test permissions enforcement
- Test document_count updates
- Test association with projects

**Output**: KnowledgeBase API tests

---

## Phase 7: User Story 6 - Real-time Subscriptions (Day 6)

### T040: Implement PubSub service → T041
**Story**: US6 | **Effort**: 1.5h | **Dependencies**: T004

Create `src/services/pubsub.ts`:
- Use `graphql-subscriptions` PubSub for development
- Use Redis-based RedisPubSub for production (optional)
- Define subscription topics:
  - `PROJECT_UPDATED`
  - `WORKFLOW_EXECUTION_UPDATED`
  - `AGENT_TASK_UPDATED`
  - `NOTIFICATION_RECEIVED`
  - `ARTIFACT_CREATED`
  - `ARTIFACT_UPDATED`
- Export singleton instance

**Output**: PubSub service for GraphQL subscriptions

---

### T041: Configure WebSocket support in Apollo Server → T042
**Story**: US6 | **Effort**: 2h | **Dependencies**: T040

Update `src/server.ts`:
- Add `graphql-ws` WebSocket server
- Configure subscription protocol
- Add authentication for WebSocket connections
- Handle connection lifecycle (connect, disconnect)
- Configure context for subscriptions
- Add subscription cleanup on disconnect

**Output**: WebSocket support for subscriptions

---

### T042: Implement subscription resolvers → T043
**Story**: US6 | **Effort**: 2.5h | **Dependencies**: T041

Create subscription resolvers in respective files:

In `src/schema/resolvers/project.ts`:
- `projectUpdated(projectId)`: Subscribe to project changes

In `src/schema/resolvers/workflow.ts`:
- `workflowExecutionUpdated(workflowExecutionId)`
- `agentTaskUpdated(workflowExecutionId)`

In `src/schema/resolvers/notification.ts`:
- `notificationReceived(userId)`

In `src/schema/resolvers/artifact.ts`:
- `artifactCreated(projectId)`
- `artifactUpdated(artifactId)`

**Output**: Complete subscription resolvers

---

### T043: Add PubSub publish calls to mutations [P]
**Story**: US6 | **Effort**: 1.5h | **Dependencies**: T042

Update mutation resolvers to publish events:
- After project updates: `pubsub.publish('PROJECT_UPDATED', { projectId, project })`
- After workflow updates: `pubsub.publish('WORKFLOW_EXECUTION_UPDATED', { ... })`
- After artifact creation: `pubsub.publish('ARTIFACT_CREATED', { ... })`
- After notification creation: `pubsub.publish('NOTIFICATION_RECEIVED', { ... })`

**Output**: Mutations triggering subscription events

---

### T044: Write integration tests for subscriptions [P]
**Story**: US6 | **Effort**: 2h | **Dependencies**: T043

Create `tests/integration/subscriptions.test.ts`:
- Test WebSocket connection with authentication
- Test projectUpdated subscription receives updates
- Test workflowExecutionUpdated subscription
- Test notificationReceived subscription
- Test multiple subscribers receive same event
- Test subscription cleanup on disconnect

**Output**: Subscription tests with WebSocket client

---

## Phase 8: User Story 7 - Notification Management (Day 6)

### T045: Create Notification type definitions [P]
**Story**: US7 | **Effort**: 20m | **Dependencies**: T015

Create `src/schema/typeDefs/notification.graphql`:
- Notification type
- NotificationType enum
- Query and mutation types for notifications

**Output**: Notification-related GraphQL type definitions

---

### T046: Implement Notification query resolvers → T047
**Story**: US7 | **Effort**: 1h | **Dependencies**: T045

Create `src/schema/resolvers/notification.ts`:
- `myNotifications` query: User's notifications with pagination
- `unreadNotificationCount` query: Count unread notifications
- Support `unreadOnly` filter parameter
- Order by createdAt DESC

**Output**: Notification query resolvers

---

### T047: Implement Notification mutation resolvers [P]
**Story**: US7 | **Effort**: 1h | **Dependencies**: T046

Add to `src/schema/resolvers/notification.ts`:
- `markNotificationAsRead` mutation: Update single notification
- `markAllNotificationsAsRead` mutation: Bulk update for user
- `deleteNotification` mutation
- Update read_at timestamp on read
- Trigger subscription for new notifications

**Output**: Notification mutation resolvers

---

### T048: Write integration tests for Notification APIs [P]
**Story**: US7 | **Effort**: 1h | **Dependencies**: T047

Create `tests/integration/notification.test.ts`:
- Test notification creation
- Test unread count query
- Test marking as read (single and bulk)
- Test filtering by read status
- Test notification deletion
- Test subscription delivery

**Output**: Notification API tests

---

## Phase 9: User Story 8 - Audit & Statistics (Day 7)

### T049: Create AuditLog and Statistics type definitions [P]
**Story**: US8 | **Effort**: 30m | **Dependencies**: T015

Create `src/schema/typeDefs/audit.graphql`:
- AuditLog type
- BidStatistics type
- Query types for audit logs and statistics

**Output**: Audit-related GraphQL type definitions

---

### T050: Implement audit logging middleware → T051
**Story**: US8 | **Effort**: 1.5h | **Dependencies**: T049

Create `src/middleware/auditLogger.ts`:
- Intercept significant mutations
- Capture before/after state for updates
- Extract user, IP address, user-agent from context
- Store in AuditLog table
- Configure which mutations to audit

**Output**: Automatic audit logging for mutations

---

### T051: Implement AuditLog query resolvers [P]
**Story**: US8 | **Effort**: 1h | **Dependencies**: T050

Create `src/schema/resolvers/audit.ts`:
- `auditLogs` query: Paginated list with filters
- Support filtering by userId, resourceType
- Order by createdAt DESC
- Admin-only access control

**Output**: AuditLog query resolvers

---

### T052: Implement Statistics query resolvers [P]
**Story**: US8 | **Effort**: 2h | **Dependencies**: T049

Add to `src/schema/resolvers/audit.ts`:
- `dashboardStats` query: Current period statistics
- `bidStatistics` query: Statistics for date range
- Calculate metrics from Project and WorkflowExecution data
- Compute success rates, win rates
- Cache results for performance

**Output**: Statistics query resolvers with calculations

---

### T053: Write integration tests for Audit and Statistics APIs [P]
**Story**: US8 | **Effort**: 1.5h | **Dependencies**: T051, T052

Create `tests/integration/audit.test.ts`:
- Test audit log creation on mutations
- Test audit log queries with filters
- Test statistics calculations
- Test dashboard stats query
- Test authorization (admin-only access)

**Output**: Audit and statistics API tests

---

## Phase 10: Additional P2 Features (Day 7)

### T054: Create Configuration type definitions [P]
**Story**: Configuration | **Effort**: 20m | **Dependencies**: T015

Create `src/schema/typeDefs/configuration.graphql`:
- AgentConfiguration type
- Integration, IntegrationLog types
- Mutation types for configuration updates

**Output**: Configuration-related GraphQL type definitions

---

### T055: Implement Configuration query resolvers → T056
**Story**: Configuration | **Effort**: 1h | **Dependencies**: T054

Create `src/schema/resolvers/configuration.ts`:
- `agentConfigurations` query: All agent configs
- `agentConfiguration(agentType)` query: Single config
- `integrations` query: All integrations
- `integration(type)` query: Single integration with logs
- Admin-only access control

**Output**: Configuration query resolvers

---

### T056: Implement Configuration mutation resolvers [P]
**Story**: Configuration | **Effort**: 1.5h | **Dependencies**: T055

Add to `src/schema/resolvers/configuration.ts`:
- `updateAgentConfiguration` mutation
- `updateIntegration` mutation
- `testIntegration` mutation: Validate connectivity
- `updateSystemSettings` mutation
- Validate configuration JSON structure
- Log integration actions

**Output**: Configuration mutation resolvers

---

### T057: Create Role and Permission query resolvers [P]
**Story**: Authorization | **Effort**: 1h | **Dependencies**: T019

Add to `src/schema/resolvers/user.ts`:
- `roles` query: All roles with permissions
- `role(id)` query: Single role details
- `permissions(roleId)` query: Permissions for role
- Admin-only access control

**Output**: Role and Permission query resolvers

---

## Phase 11: Testing & Quality Assurance (Day 7-8)

### T058: Write unit tests for services [P]
**Story**: Testing | **Effort**: 3h | **Dependencies**: T010, T012, T023, T040

Create unit tests in `tests/unit/services/`:
- `prisma.test.ts`: Connection handling, singleton pattern
- `logger.test.ts`: Log formatting, redaction
- `s3.test.ts`: URL generation, error handling
- `pubsub.test.ts`: Publish/subscribe functionality
- Mock external dependencies

**Output**: Service layer unit tests

---

### T059: Write unit tests for utilities [P]
**Story**: Testing | **Effort**: 2h | **Dependencies**: T011

Create unit tests in `tests/unit/utils/`:
- `errors.test.ts`: Error class instantiation
- `validators.test.ts`: Input validation logic
- `formatters.test.ts`: Data transformation

**Output**: Utility function unit tests

---

### T060: Write unit tests for resolvers [P]
**Story**: Testing | **Effort**: 3h | **Dependencies**: All resolver tasks

Create unit tests in `tests/unit/resolvers/`:
- Test resolver functions in isolation
- Mock Prisma client responses
- Mock PubSub publishing
- Test error handling paths
- Test authorization logic

**Output**: Resolver unit tests

---

### T061: Create test helpers and factories [P]
**Story**: Testing | **Effort**: 2h | **Dependencies**: T006

Create `tests/helpers/`:
- `setup.ts`: Test database setup with Test Containers
- `factories.ts`: Test data factories (users, projects, artifacts)
- `auth.ts`: Mock JWT token generation
- `cleanup.ts`: Test database cleanup utilities

**Output**: Reusable test utilities

---

### T062: Set up E2E test suite [P]
**Story**: Testing | **Effort**: 2h | **Dependencies**: T061

Create `tests/e2e/`:
- Complete workflow tests (project creation → workflow → artifacts)
- Test real-time subscription flows
- Test error scenarios and recovery
- Test performance under load (basic)

**Output**: End-to-end test scenarios

---

### T063: Achieve 80%+ test coverage [P]
**Story**: Testing | **Effort**: 2h | **Dependencies**: T058-T062

Review coverage report and add missing tests:
```bash
pnpm test:coverage
```
- Target 80%+ line coverage
- Focus on critical paths (auth, mutations, subscriptions)
- Document coverage gaps with rationale

**Output**: Comprehensive test coverage report

---

## Phase 12: Documentation & DevEx (Day 8)

### T064: Create comprehensive README [P]
**Story**: Documentation | **Effort**: 1.5h | **Dependencies**: All phases

Create `services/core-api/README.md`:
- Project overview and architecture
- Prerequisites and installation
- Environment configuration guide
- Development workflow (running, testing, linting)
- Docker commands for local development
- Deployment instructions
- Troubleshooting guide
- API documentation links

**Output**: Complete README for developers

---

### T065: Document GraphQL API with examples [P]
**Story**: Documentation | **Effort**: 2h | **Dependencies**: All phases

Create `docs/api/`:
- `authentication.md`: How to obtain and use JWT tokens
- `queries.md`: All queries with example requests/responses
- `mutations.md`: All mutations with examples
- `subscriptions.md`: Subscription usage and examples
- `errors.md`: Error codes and handling
- `pagination.md`: Cursor-based pagination guide

**Output**: Complete API documentation

---

### T066: Create deployment guide [P]
**Story**: Documentation | **Effort**: 1h | **Dependencies**: T009

Create `docs/deployment/`:
- `ecs-deployment.md`: Deploying to AWS ECS
- `environment-variables.md`: Required env vars for each environment
- `database-migrations.md`: Running migrations in production
- `monitoring.md`: Setting up logs and metrics
- `scaling.md`: Horizontal scaling considerations

**Output**: Production deployment documentation

---

### T067: Set up API monitoring and observability [P]
**Story**: Operations | **Effort**: 2h | **Dependencies**: T012, T017

Enhance logging and monitoring:
- Add request/response time tracking
- Add database query performance logging
- Add error rate metrics
- Create dashboard queries for CloudWatch
- Document metric collection

**Output**: Observability setup for production

---

## Phase 13: Final Polish & Deployment Prep (Day 8)

### T068: Performance optimization and final review
**Story**: Polish | **Effort**: 2h | **Dependencies**: All phases

Final optimization pass:
- Review and optimize database queries (N+1 problems)
- Add DataLoader for batch loading if needed
- Verify all indexes are in place
- Test performance against success criteria (<200ms queries, <500ms mutations)
- Review security (no sensitive data in logs, proper authorization)
- Test graceful shutdown and error recovery
- Verify Docker builds work correctly
- Test with production-like data volume

**Validation Checklist**:
- [ ] All 69 functional requirements implemented
- [ ] All 24 success criteria met
- [ ] 80%+ test coverage achieved
- [ ] Health endpoint returns correct status
- [ ] Authentication middleware <50ms overhead
- [ ] GraphQL playground works in development
- [ ] Docker Compose stack starts successfully
- [ ] Migrations run cleanly on fresh database
- [ ] Seed script populates test data
- [ ] README instructions work end-to-end

**Output**: Production-ready API passing all acceptance criteria

---

## Task Dependencies Summary

```
Phase 1 (Setup): T001-T009 → Enable all subsequent work
Phase 2 (Infrastructure): T010-T018 → Foundation for all APIs
Phase 3 (US1): T019-T027 → Core user and project management
Phase 4 (US3): T028-T031 → Workflow tracking (depends on Phase 3)
Phase 5 (US4): T032-T035 → Artifacts (depends on Phase 3)
Phase 6 (US5): T036-T039 → Knowledge bases (depends on Phase 3)
Phase 7 (US6): T040-T044 → Subscriptions (depends on Phases 3-6)
Phase 8 (US7): T045-T048 → Notifications (depends on Phase 7)
Phase 9 (US8): T049-T053 → Audit and stats (depends on all features)
Phase 10 (P2): T054-T057 → Additional features (parallel with Phase 9)
Phase 11 (Testing): T058-T063 → Comprehensive testing (ongoing)
Phase 12 (Docs): T064-T067 → Documentation (parallel with development)
Phase 13 (Polish): T068 → Final validation
```

## Parallelization Strategy

Tasks marked `[P]` can be parallelized within their phase:
- **Phase 1**: T001, T002, T003, T004, T007, T008, T009 (7 parallel)
- **Phase 2**: T010, T011, T012, T015, T018 (5 parallel)
- **Phase 3**: T019, T022 (2 parallel for setup), T026, T027 (2 parallel for testing)
- **Phases 4-10**: Most tasks within each phase can be parallelized
- **Phase 11**: All testing tasks can run in parallel (T058-T063)
- **Phase 12**: All documentation tasks can run in parallel (T064-T067)

**Estimated Timeline with 2-3 developers**:
- Days 1-2: Phases 1-2 (Foundation)
- Days 3-4: Phases 3-4 (Core features)
- Days 5-6: Phases 5-7 (Extended features)
- Days 7-8: Phases 8-13 (Polish, testing, docs)

---

## Success Metrics

Upon completion of all tasks:
- ✅ All 8 user stories implemented with acceptance scenarios passing
- ✅ All 69 functional requirements satisfied
- ✅ All 24 success criteria met
- ✅ 80%+ test coverage with passing test suite
- ✅ Complete API documentation with examples
- ✅ Docker development environment working
- ✅ Production deployment ready
- ✅ Health checks and monitoring in place