# Feature Specification: Core GraphQL API for BidOps.AI Platform

**Feature Branch**: `002-create-a-graphql`  
**Created**: 2025-01-12  
**Status**: Draft  
**Input**: User description: "Create a GraphQL API inside the services/core-api folder that supports the Frontend application. The GQL API will use PostgreSQL RDS in remote environments and a local Docker PostgreSQL instance for local development. Must use Prisma ORM for database operations and migrations. The API should follow industry best practices, include Cognito token validation middleware, health endpoints for ECS deployment, support hot-reloading in development, and use Node.js 24 LTS with TypeScript and Apollo GraphQL latest version."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Core API Foundation (Priority: P1)

Frontend developers need a secure, reliable GraphQL API that handles all data operations for the BidOps.AI platform, including user authentication, project management, and real-time updates through subscriptions.

**Why this priority**: This is the foundational layer that all other features depend on. Without a working API, the frontend cannot function. It provides the critical data layer for user management, project CRUD operations, and authentication.

**Independent Test**: Can be fully tested by starting the API server, authenticating with a Cognito token, and executing basic queries (me, projects, users) and mutations (createProject, updateUser). Delivers immediate value by enabling frontend-backend communication.

**Acceptance Scenarios**:

1. **Given** the API server is running, **When** a valid Cognito JWT token is provided in the Authorization header, **Then** the user can access protected GraphQL operations
2. **Given** the API is deployed, **When** the health endpoint is accessed, **Then** it returns a 200 status with database connectivity information
3. **Given** a user is authenticated, **When** they query their profile using the `me` query, **Then** they receive their complete user data including roles and permissions
4. **Given** a user creates a project, **When** the createProject mutation is executed, **Then** a new project record is created in the database and returned with a generated UUID

---

### User Story 2 - Project Lifecycle Management (Priority: P1)

Users need to create, update, and manage projects with associated documents, members, and knowledge bases through the API, supporting the complete bid workflow from creation to submission.

**Why this priority**: Project management is the core business functionality. Users cannot perform bid operations without the ability to create and manage projects, upload documents, and collaborate with team members.

**Independent Test**: Can be tested by authenticating, creating a project with the createProject mutation, adding members with addProjectMember, generating presigned URLs for document uploads, and querying project details. Delivers value by enabling the primary user workflow.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they create a project with name, description, and deadline, **Then** the project is stored with status "Open" and progress 0%
2. **Given** a project exists, **When** the user requests presigned URLs for document upload, **Then** S3 presigned URLs are generated following the yyyy/mm/dd/hh/project-name_timestamp format
3. **Given** project documents are uploaded to S3, **When** ProjectDocument records are created, **Then** they store raw_file_location and are associated with the project
4. **Given** a project exists, **When** a user is added as a member, **Then** a ProjectMember record is created linking the user to the project

---

### User Story 3 - Workflow Execution Support (Priority: P1)

The API must store and retrieve workflow execution data, agent tasks, and their statuses to support the agent orchestration system, enabling tracking of the multi-stage bid preparation process.

**Why this priority**: The agentic workflow is central to the platform's value proposition. Without API support for workflow tracking, the agent system cannot persist state or provide progress updates to users.

**Independent Test**: Can be tested by querying WorkflowExecution and AgentTask data, verifying that status transitions (Open → InProgress → Completed/Failed) are properly stored, and checking that agent output data is retrievable. Delivers value by enabling workflow state management.

**Acceptance Scenarios**:

1. **Given** a workflow execution is created, **When** agent tasks are initialized, **Then** all tasks are created with status "Open" and sequence_order defining execution order
2. **Given** an agent task is in progress, **When** the agent updates the task status, **Then** initiated_by, handled_by, and execution times are tracked
3. **Given** an agent completes a task, **When** output_data is written, **Then** it is stored as JSON and retrievable by subsequent agents
4. **Given** a workflow fails, **When** error information is provided, **Then** error_log and error_message are stored for debugging

---

### User Story 4 - Artifact Management (Priority: P2)

Users need to create, version, and retrieve artifacts (documents, Q&A, spreadsheets) generated during the bid process, with support for multiple versions and approval workflows.

**Why this priority**: Artifacts are the primary output of the workflow. Users need to review, edit, and approve generated documents. Version tracking ensures changes are auditable.

**Independent Test**: Can be tested by creating an artifact with initial version, updating to create new versions, querying artifact history, and approving/rejecting artifacts. Delivers value by enabling document management and version control.

**Acceptance Scenarios**:

1. **Given** content is generated by an agent, **When** an artifact is created, **Then** it includes type (worddoc/pdf/ppt/excel), category (document/q_and_a/excel), and an initial version
2. **Given** an artifact exists, **When** content is updated, **Then** a new ArtifactVersion record is created with incremented version_number
3. **Given** an artifact has multiple versions, **When** the latest version is requested, **Then** the most recent ArtifactVersion is returned
4. **Given** an artifact is reviewed, **When** it is approved, **Then** status changes to "approved" and approved_by/approved_at are recorded

---

### User Story 5 - Knowledge Base Operations (Priority: P2)

Users need to create and manage knowledge bases (global and project-specific) containing documents that agents use for context retrieval during bid preparation.

**Why this priority**: Knowledge bases provide historical context and reference material. While important for quality, the system can function initially with minimal KB data.

**Independent Test**: Can be tested by creating a knowledge base, uploading documents, querying KB contents, and filtering by scope (global/project). Delivers value by enabling knowledge management for agents.

**Acceptance Scenarios**:

1. **Given** a user creates a knowledge base, **When** the scope is specified (global/project), **Then** it is created with appropriate access controls
2. **Given** a knowledge base exists, **When** documents are uploaded, **Then** s3_bucket, s3_key, and metadata are stored
3. **Given** multiple knowledge bases exist, **When** filtered by scope, **Then** only global or project-specific KBs are returned
4. **Given** a project is created, **When** knowledge bases are selected, **Then** they are associated with the project for agent access

---

### User Story 6 - Real-time Updates via Subscriptions (Priority: P2)

Users need real-time notifications when projects, workflows, artifacts, or notifications change, enabling live UI updates without polling.

**Why this priority**: Real-time updates improve UX significantly but aren't required for basic functionality. Users can refresh to see changes initially.

**Independent Test**: Can be tested by establishing a WebSocket connection, subscribing to projectUpdated, and verifying that mutation events trigger subscription notifications. Delivers value by enabling reactive UI updates.

**Acceptance Scenarios**:

1. **Given** a user subscribes to projectUpdated, **When** the project is modified, **Then** they receive real-time updates with changed fields
2. **Given** a user subscribes to workflowExecutionUpdated, **When** workflow status changes, **Then** they receive notifications with current status
3. **Given** a user subscribes to notificationReceived, **When** new notifications are created, **Then** they appear in real-time without page refresh
4. **Given** multiple users watch the same project, **When** one user makes changes, **Then** all subscribers receive updates simultaneously

---

### User Story 7 - Notification Management (Priority: P3)

Users receive and manage in-app notifications about project updates, workflow completions, and team activities, with read/unread tracking.

**Why this priority**: Notifications enhance user experience but aren't critical for core workflows. Email notifications via agents provide an alternative initially.

**Independent Test**: Can be tested by creating notifications, querying unread count, marking notifications as read, and filtering by read status. Delivers value by centralizing user communications.

**Acceptance Scenarios**:

1. **Given** a workflow completes, **When** a notification is created, **Then** it appears in the user's notification list with unread status
2. **Given** unread notifications exist, **When** the unread count is queried, **Then** it returns the correct number
3. **Given** a user opens a notification, **When** it is marked as read, **Then** read status changes and read_at timestamp is recorded
4. **Given** many notifications exist, **When** filtered by unreadOnly=true, **Then** only unread notifications are returned

---

### User Story 8 - Audit Logging and Statistics (Priority: P3)

System administrators need to track user actions and generate bid statistics for reporting and compliance purposes.

**Why this priority**: Audit logs and statistics are important for compliance and business intelligence but don't block primary user workflows.

**Independent Test**: Can be tested by performing actions, querying audit logs filtered by user/resource, and retrieving bid statistics for date ranges. Delivers value by enabling compliance and analytics.

**Acceptance Scenarios**:

1. **Given** a user performs an action, **When** a significant state change occurs, **Then** an audit log entry captures the action, resource, and state change
2. **Given** audit logs exist, **When** filtered by userId or resourceType, **Then** only matching logs are returned
3. **Given** bid data exists, **When** statistics are requested for a period, **Then** submitted/won bids, values, and success rates are calculated
4. **Given** dashboard statistics are requested, **When** the query executes, **Then** current period metrics with detailed breakdowns are returned

---

### Edge Cases

- **What happens when an expired Cognito token is used?** The authentication middleware should reject the request with a 401 Unauthorized error and clear error message
- **What happens when database connection is lost during a mutation?** The operation should fail gracefully, return an error to the client, and not leave partial data
- **What happens when presigned URL generation fails?** The mutation should return an error indicating S3 service unavailability without creating ProjectDocument records
- **What happens when a user tries to access another user's private project?** Authorization checks should deny access with a 403 Forbidden error
- **What happens when concurrent updates modify the same record?** Use optimistic locking or last-write-wins with updated_at timestamps to handle conflicts
- **What happens when GraphQL subscription connection drops?** The client should automatically reconnect and re-subscribe to continue receiving updates
- **What happens when invalid UUID format is provided?** Input validation should return a clear error message before database query execution
- **What happens when required foreign key references don't exist?** Database constraints should prevent orphaned records and return meaningful error messages

## Requirements *(mandatory)*

### Functional Requirements

**API Core & Infrastructure:**

- **FR-001**: System MUST provide a GraphQL API server running on Node.js 24 LTS with TypeScript
- **FR-002**: System MUST use Apollo Server (latest version) for GraphQL implementation
- **FR-003**: System MUST validate and parse GraphQL queries, mutations, and subscriptions according to the GraphQL specification
- **FR-004**: System MUST provide a health check endpoint at `/health` returning database connectivity status and API version
- **FR-005**: System MUST support both HTTP for queries/mutations and WebSocket for subscriptions

**Authentication & Authorization:**

- **FR-006**: System MUST validate AWS Cognito JWT tokens on all protected operations
- **FR-007**: System MUST extract user identity from valid Cognito tokens and attach to GraphQL context
- **FR-008**: System MUST reject requests with expired, invalid, or missing tokens with appropriate error codes
- **FR-009**: System MUST support role-based access control using user roles from the database
- **FR-010**: System MUST enforce permission checks on mutations that modify data

**Database Operations:**

- **FR-011**: System MUST use Prisma ORM for all database operations
- **FR-012**: System MUST connect to PostgreSQL database (local Docker for development, RDS for production)
- **FR-013**: System MUST support database migrations via Prisma Migrate
- **FR-014**: System MUST provide database seeding scripts for development and testing
- **FR-015**: System MUST use transactions for operations that modify multiple related records

**User Management:**

- **FR-016**: System MUST provide a `me` query returning the authenticated user's profile
- **FR-017**: System MUST provide queries to retrieve user lists with pagination (cursor-based)
- **FR-018**: System MUST support user profile updates via mutation
- **FR-019**: System MUST support role assignment and removal for users
- **FR-020**: System MUST track user activity (last_login, created_at, updated_at)

**Project Management:**

- **FR-021**: System MUST support project creation with name, description, deadline, and initial members
- **FR-022**: System MUST generate and return presigned S3 URLs for direct document upload
- **FR-023**: System MUST store ProjectDocument records with raw_file_location and processed_file_location
- **FR-024**: System MUST support adding and removing project members
- **FR-025**: System MUST track project progress_percentage and status (Open, InProgress, Completed, Failed)
- **FR-026**: System MUST support project updates including status changes and completion tracking
- **FR-027**: System MUST provide queries to list projects with filtering by status, creator, and date range

**Workflow Execution:**

- **FR-028**: System MUST store WorkflowExecution records with status, timestamps, and configuration
- **FR-029**: System MUST create AgentTask records in sequence_order for each workflow
- **FR-030**: System MUST track task status transitions (Open → InProgress → Waiting → Completed/Failed)
- **FR-031**: System MUST store input_data and output_data as JSON for each agent task
- **FR-032**: System MUST track who initiated, handled, and completed each task and workflow
- **FR-033**: System MUST store error_log and error_message when tasks or workflows fail
- **FR-034**: System MUST provide queries to retrieve workflow execution history for projects

**Artifact Management:**

- **FR-035**: System MUST create Artifact records with type (worddoc/pdf/ppt/excel) and category (document/q_and_a/excel)
- **FR-036**: System MUST support versioning via ArtifactVersion records with incremented version_number
- **FR-037**: System MUST store artifact content as JSON supporting TipTap format for documents
- **FR-038**: System MUST provide queries to retrieve artifacts by project with latest version
- **FR-039**: System MUST support artifact approval and rejection with approval tracking
- **FR-040**: System MUST store artifact file locations in S3 for export

**Knowledge Base:**

- **FR-041**: System MUST support creation of knowledge bases with scope (global/project)
- **FR-042**: System MUST store KnowledgeBaseDocument records with S3 locations and metadata
- **FR-043**: System MUST track document_count for each knowledge base
- **FR-044**: System MUST support knowledge base permissions for access control
- **FR-045**: System MUST provide queries to list global and project-specific knowledge bases

**Notifications:**

- **FR-046**: System MUST create notification records with type, title, message, and metadata
- **FR-047**: System MUST track read/unread status and read_at timestamp
- **FR-048**: System MUST provide query to count unread notifications
- **FR-049**: System MUST support marking individual or all notifications as read
- **FR-050**: System MUST support filtering notifications by read status

**Subscriptions (Real-time):**

- **FR-051**: System MUST support GraphQL subscriptions over WebSocket connections
- **FR-052**: System MUST publish project updates when project data changes
- **FR-053**: System MUST publish workflow execution updates when status changes
- **FR-054**: System MUST publish agent task updates when task status changes
- **FR-055**: System MUST publish notifications when new notifications are created
- **FR-056**: System MUST publish artifact updates when artifacts are created or modified

**Configuration & Integration:**

- **FR-057**: System MUST support agent configuration CRUD operations
- **FR-058**: System MUST support integration configuration for external services
- **FR-059**: System MUST log integration actions and responses

**Audit & Statistics:**

- **FR-060**: System MUST create audit log entries for significant state changes
- **FR-061**: System MUST provide queries to retrieve audit logs with filtering
- **FR-062**: System MUST calculate and return bid statistics for specified periods
- **FR-063**: System MUST provide dashboard statistics with current metrics

**Development & Deployment:**

- **FR-064**: System MUST support hot-reloading in development mode for rapid iteration
- **FR-065**: System MUST provide production-ready Docker image for ECS deployment
- **FR-066**: System MUST use environment variables for configuration (database URLs, AWS credentials, JWT secrets)
- **FR-067**: System MUST implement proper error handling with meaningful error messages
- **FR-068**: System MUST log errors and important events for debugging and monitoring
- **FR-069**: System MUST support graceful shutdown handling database connection cleanup

### Key Entities

- **User**: Represents platform users with authentication, profile, roles, and permissions
- **Project**: Central entity for bid projects with status, members, documents, and workflows
- **ProjectDocument**: Documents uploaded for projects with S3 locations (raw and processed)
- **ProjectMember**: Links users to projects with membership tracking
- **WorkflowExecution**: Tracks agent workflow execution with status and results
- **AgentTask**: Individual tasks in a workflow executed by specific agents
- **Artifact**: Generated documents/content with type and category
- **ArtifactVersion**: Version history for artifacts with content and metadata
- **KnowledgeBase**: Collections of reference documents with scope (global/project)
- **KnowledgeBaseDocument**: Documents within knowledge bases with S3 storage
- **Notification**: User notifications with read tracking
- **Role**: User roles defining permission sets
- **Permission**: Granular permissions for resource actions
- **AgentConfiguration**: Configuration for agent models and parameters
- **Integration**: External service integrations with configuration
- **AuditLog**: System activity tracking for compliance
- **BidStatistics**: Aggregated metrics for bid performance

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Performance:**

- **SC-001**: API responds to query operations in under 200ms for 95% of requests
- **SC-002**: API responds to mutation operations in under 500ms for 95% of requests
- **SC-003**: System supports 100 concurrent WebSocket connections for subscriptions
- **SC-004**: Database queries execute efficiently using proper indexing (under 100ms for most queries)

**Reliability:**

- **SC-005**: API maintains 99.9% uptime in production environment
- **SC-006**: Authentication middleware successfully validates tokens in under 50ms
- **SC-007**: Failed operations rollback completely without leaving partial data
- **SC-008**: API gracefully handles database connection failures and retries

**Functionality:**

- **SC-009**: All GraphQL queries, mutations, and subscriptions defined in frontend contracts are implemented
- **SC-010**: Users can successfully create projects, upload documents, and manage workflows through the API
- **SC-011**: Real-time subscriptions deliver updates to connected clients within 1 second of changes
- **SC-012**: Presigned URL generation succeeds 99% of the time when S3 is available

**Development Experience:**

- **SC-013**: Developers can start local development environment with single command (docker-compose up)
- **SC-014**: Code changes in development trigger automatic reload within 2 seconds
- **SC-015**: Database schema changes can be applied via migration commands
- **SC-016**: Seed data populates development database with realistic test data

**Security:**

- **SC-017**: Unauthorized requests are rejected before reaching database layer
- **SC-018**: Token expiration is validated on every protected operation
- **SC-019**: User data access is restricted based on project membership and roles
- **SC-020**: Sensitive data (passwords, tokens) are never logged or exposed in errors

**Monitoring & Operations:**

- **SC-021**: Health endpoint accurately reflects database connectivity and API status
- **SC-022**: Error logs contain sufficient context for debugging issues
- **SC-023**: API deploys to ECS successfully using provided Docker configuration
- **SC-024**: Database migrations can be run safely in production without data loss

### Assumptions

- AWS Cognito is already configured and issuing valid JWT tokens for authenticated users
- S3 bucket exists and has appropriate permissions for presigned URL generation
- PostgreSQL database (version 14+) is available in both development and production
- Frontend application correctly implements the GraphQL client with appropriate headers
- Network connectivity between API and external services (S3, RDS, Cognito) is reliable
- Node.js 24 LTS runtime is available in deployment environments
- Docker and docker-compose are available for local development
- Environment variables are properly configured in deployment environments
- The agent-core service (separate FastAPI application) will integrate via SSE and database access
- Frontend uses cursor-based pagination for list queries as defined in contracts
