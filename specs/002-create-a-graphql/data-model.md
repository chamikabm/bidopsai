# Data Model: Core GraphQL API for BidOps.AI Platform

**Feature**: Core GraphQL API  
**Date**: 2025-01-12  
**Source**: Based on `docs/database/bidopsai.mmd` ER diagram

---

## Overview

This document defines the database schema for the BidOps.AI platform using Prisma ORM. The schema supports user management, project lifecycle, agentic workflows, artifact versioning, knowledge bases, notifications, and audit logging.

## Core Principles

1. **UUID Primary Keys**: All entities use UUID for globally unique identifiers
2. **Timestamp Tracking**: created_at, updated_at for audit trail
3. **Soft Deletes**: Consider implementing where recovery is needed
4. **JSON Fields**: Use JSON for flexible metadata and configuration
5. **Foreign Key Constraints**: Enforce referential integrity at database level

---

## Entity Relationship Diagram

```
User ──< UserRole >── Role ──< Permission
 │
 ├──< ProjectMember >── Project ──< ProjectDocument
 │                       │
 │                       ├──< KnowledgeBase ──< KnowledgeBaseDocument
 │                       │                   └──< KnowledgeBasePermission
 │                       │
 │                       ├──< WorkflowExecution ──< AgentTask
 │                       │
 │                       ├──< Artifact ──< ArtifactVersion
 │                       │
 │                       └──< SubmissionRecord
 │
 ├──< Notification
 ├──< AuditLog
 └──< Integration >──< IntegrationLog

BidStatistics (standalone aggregation table)
AgentConfiguration (system configuration)
```

---

## Entity Definitions

### 1. User Management

#### User
Core user entity with authentication and profile information.

```prisma
model User {
  id                String    @id @default(uuid()) @db.Uuid
  email             String    @unique
  username          String    @unique
  passwordHash      String?   @map("password_hash")
  firstName         String    @map("first_name")
  lastName          String    @map("last_name")
  profileImageUrl   String?   @map("profile_image_url")
  preferredLanguage String?   @map("preferred_language") @default("en")
  themePreference   String?   @map("theme_preference") @default("light")
  emailVerified     Boolean   @default(false) @map("email_verified")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  lastLogin         DateTime? @map("last_login")
  cognitoUserId     String    @unique @map("cognito_user_id")

  // Relations
  roles             UserRole[]
  projectMemberships ProjectMember[]
  createdProjects   Project[]        @relation("ProjectCreator")
  completedProjects Project[]        @relation("ProjectCompleter")
  notifications     Notification[]
  auditLogs         AuditLog[]
  uploadedDocuments ProjectDocument[]
  createdKnowledgeBases KnowledgeBase[]
  createdArtifacts  Artifact[]       @relation("ArtifactCreator")
  approvedArtifacts Artifact[]       @relation("ArtifactApprover")
  submissions       SubmissionRecord[]
  createdIntegrations Integration[]
  
  @@map("users")
  @@index([email])
  @@index([cognitoUserId])
}
```

**Key Fields**:
- `cognitoUserId`: Links to AWS Cognito for authentication
- `emailVerified`: Tracks email verification status
- `lastLogin`: For activity monitoring

#### Role
Defines user roles with associated permissions.

```prisma
model Role {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  userRoles   UserRole[]
  permissions Permission[]
  kbPermissions KnowledgeBasePermission[]

  @@map("roles")
}
```

#### UserRole
Junction table linking users to roles.

```prisma
model UserRole {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  roleId     String   @map("role_id") @db.Uuid
  assignedAt DateTime @default(now()) @map("assigned_at")
  assignedBy String?  @map("assigned_by") @db.Uuid

  // Relations
  user       User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role       Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@map("user_roles")
  @@index([userId])
  @@index([roleId])
}
```

#### Permission
Granular permissions for resource actions.

```prisma
model Permission {
  id        String   @id @default(uuid()) @db.Uuid
  roleId    String   @map("role_id") @db.Uuid
  resource  String
  action    String
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([roleId, resource, action])
  @@map("permissions")
  @@index([roleId])
}
```

---

### 2. Project Management

#### Project
Central entity for bid projects.

```prisma
model Project {
  id                 String    @id @default(uuid()) @db.Uuid
  name               String
  description        String?   @db.Text
  status             String    @default("OPEN") // OPEN, IN_PROGRESS, COMPLETED, FAILED
  value              Decimal?  @db.Decimal(15, 2)
  deadline           DateTime? @db.Date
  progressPercentage Int       @default(0) @map("progress_percentage")
  createdBy          String    @map("created_by") @db.Uuid
  completedBy        String?   @map("completed_by") @db.Uuid
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")
  completedAt        DateTime? @map("completed_at")
  metadata           Json?

  // Relations
  creator            User                @relation("ProjectCreator", fields: [createdBy], references: [id])
  completer          User?               @relation("ProjectCompleter", fields: [completedBy], references: [id])
  members            ProjectMember[]
  documents          ProjectDocument[]
  knowledgeBases     KnowledgeBase[]
  artifacts          Artifact[]
  workflowExecutions WorkflowExecution[]
  submissions        SubmissionRecord[]

  @@map("projects")
  @@index([status, createdAt])
  @@index([createdBy])
  @@index([deadline])
}
```

**Status Values**: OPEN, IN_PROGRESS, COMPLETED, FAILED  
**Progress**: 0-100 percentage tracked by workflow execution

#### ProjectDocument
Documents uploaded for projects with raw and processed file locations.

```prisma
model ProjectDocument {
  id                      String   @id @default(uuid()) @db.Uuid
  projectId               String   @map("project_id") @db.Uuid
  fileName                String   @map("file_name")
  filePath                String   @map("file_path")
  fileType                String   @map("file_type")
  fileSize                BigInt   @map("file_size")
  rawFileLocation         String   @map("raw_file_location")
  processedFileLocation   String?  @map("processed_file_location")
  uploadedBy              String   @map("uploaded_by") @db.Uuid
  uploadedAt              DateTime @default(now()) @map("uploaded_at")
  metadata                Json?

  // Relations
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  uploader User   @relation(fields: [uploadedBy], references: [id])

  @@map("project_documents")
  @@index([projectId])
}
```

**File Locations**:
- `rawFileLocation`: S3 path to original uploaded file
- `processedFileLocation`: S3 path after Bedrock Data Automation processing

#### ProjectMember
Links users to projects with membership tracking.

```prisma
model ProjectMember {
  id        String   @id @default(uuid()) @db.Uuid
  projectId String   @map("project_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  addedById String   @map("added_by_id") @db.Uuid
  joinedAt  DateTime @default(now()) @map("joined_at")

  // Relations
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@map("project_members")
  @@index([projectId])
  @@index([userId])
}
```

---

### 3. Workflow Execution

#### WorkflowExecution
Tracks execution of multi-agent workflows.

```prisma
model WorkflowExecution {
  id             String    @id @default(uuid()) @db.Uuid
  projectId      String    @map("project_id") @db.Uuid
  status         String    @default("OPEN") // OPEN, IN_PROGRESS, WAITING, COMPLETED, FAILED
  initiatedBy    String    @map("initiated_by") @db.Uuid
  handledBy      String?   @map("handled_by") @db.Uuid
  completedBy    String?   @map("completed_by") @db.Uuid
  startedAt      DateTime  @default(now()) @map("started_at")
  completedAt    DateTime? @map("completed_at")
  lastUpdatedAt  DateTime  @updatedAt @map("last_updated_at")
  workflowConfig Json?     @map("workflow_config")
  errorLog       Json?     @map("error_log")
  errorMessage   String?   @map("error_message") @db.Text
  results        Json?

  // Relations
  project    Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  agentTasks AgentTask[]

  @@map("workflow_executions")
  @@index([projectId, status])
  @@index([status, lastUpdatedAt])
}
```

**Status Flow**: OPEN → IN_PROGRESS → WAITING (user feedback) → COMPLETED/FAILED

#### AgentTask
Individual tasks within a workflow executed by specific agents.

```prisma
model AgentTask {
  id                   String    @id @default(uuid()) @db.Uuid
  workflowExecutionId  String    @map("workflow_execution_id") @db.Uuid
  initiatedBy          String    @map("initiated_by") @db.Uuid
  handledBy            String?   @map("handled_by") @db.Uuid
  completedBy          String?   @map("completed_by") @db.Uuid
  agent                String    // PARSER, ANALYSIS, CONTENT, COMPLIANCE, QA, COMMS, SUBMISSION
  status               String    @default("OPEN") // OPEN, IN_PROGRESS, WAITING, COMPLETED, FAILED
  sequenceOrder        Int       @map("sequence_order")
  inputData            Json?     @map("input_data")
  outputData           Json?     @map("output_data")
  taskConfig           Json?     @map("task_config")
  errorLog             Json?     @map("error_log")
  errorMessage         String?   @map("error_message") @db.Text
  startedAt            DateTime? @map("started_at")
  completedAt          DateTime? @map("completed_at")
  executionTimeSeconds Float?    @map("execution_time_seconds")

  // Relations
  workflowExecution WorkflowExecution @relation(fields: [workflowExecutionId], references: [id], onDelete: Cascade)

  @@map("agent_tasks")
  @@index([workflowExecutionId, sequenceOrder])
  @@index([status])
}
```

**Agent Types**: PARSER, ANALYSIS, CONTENT, KNOWLEDGE, COMPLIANCE, QA, COMMS, SUBMISSION  
**Sequence Order**: Defines execution order (1-8)

---

### 4. Artifacts

#### Artifact
Generated documents and content with versioning support.

```prisma
model Artifact {
  id         String    @id @default(uuid()) @db.Uuid
  projectId  String    @map("project_id") @db.Uuid
  name       String
  type       String    // WORDDOC, PDF, PPT, EXCEL
  category   String    // DOCUMENT, Q_AND_A, EXCEL
  status     String    @default("DRAFT") // DRAFT, APPROVED, REJECTED
  createdBy  String    @map("created_by") @db.Uuid
  approvedBy String?   @map("approved_by") @db.Uuid
  createdAt  DateTime  @default(now()) @map("created_at")
  approvedAt DateTime? @map("approved_at")

  // Relations
  project   Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  creator   User              @relation("ArtifactCreator", fields: [createdBy], references: [id])
  approver  User?             @relation("ArtifactApprover", fields: [approvedBy], references: [id])
  versions  ArtifactVersion[]
  submissions SubmissionRecord[]

  @@map("artifacts")
  @@index([projectId, status])
  @@index([createdAt])
}
```

**Type**: WORDDOC (TipTap JSON), PDF, PPT, EXCEL  
**Category**: DOCUMENT (rich text), Q_AND_A (structured Q&A), EXCEL (tabular)

#### ArtifactVersion
Version history for artifacts with content and location tracking.

```prisma
model ArtifactVersion {
  id            String   @id @default(uuid()) @db.Uuid
  artifactId    String   @map("artifact_id") @db.Uuid
  versionNumber Int      @map("version_number")
  content       Json     // TipTap JSON, Q&A structure, or Excel data
  location      String?  // S3 path for exported files
  createdBy     String   @map("created_by") @db.Uuid
  createdAt     DateTime @default(now()) @map("created_at")

  // Relations
  artifact Artifact @relation(fields: [artifactId], references: [id], onDelete: Cascade)

  @@unique([artifactId, versionNumber])
  @@map("artifact_versions")
  @@index([artifactId])
  @@index([createdAt])
}
```

**Versioning**: Auto-incremented version_number per artifact  
**Content**: JSON format specific to artifact category

---

### 5. Knowledge Bases

#### KnowledgeBase
Collections of reference documents for agent context retrieval.

```prisma
model KnowledgeBase {
  id            String   @id @default(uuid()) @db.Uuid
  name          String
  description   String?  @db.Text
  scope         String   // GLOBAL, PROJECT
  projectId     String?  @map("project_id") @db.Uuid
  documentCount Int      @default(0) @map("document_count")
  createdBy     String   @map("created_by") @db.Uuid
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  vectorStoreId String?  @map("vector_store_id") // Bedrock Knowledge Base ID

  // Relations
  project     Project?                    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  creator     User                        @relation(fields: [createdBy], references: [id])
  documents   KnowledgeBaseDocument[]
  permissions KnowledgeBasePermission[]

  @@map("knowledge_bases")
  @@index([scope])
  @@index([projectId])
}
```

**Scope**: GLOBAL (all projects) or PROJECT (specific project)

#### KnowledgeBaseDocument
Documents within knowledge bases with S3 storage.

```prisma
model KnowledgeBaseDocument {
  id              String   @id @default(uuid()) @db.Uuid
  knowledgeBaseId String   @map("knowledge_base_id") @db.Uuid
  fileName        String   @map("file_name")
  filePath        String   @map("file_path")
  fileType        String   @map("file_type")
  fileSize        BigInt   @map("file_size")
  s3Bucket        String   @map("s3_bucket")
  s3Key           String   @map("s3_key")
  uploadedBy      String   @map("uploaded_by") @db.Uuid
  uploadedAt      DateTime @default(now()) @map("uploaded_at")
  metadata        Json?
  vectorIds       String?  @map("vector_ids") // Bedrock vector IDs

  // Relations
  knowledgeBase KnowledgeBase @relation(fields: [knowledgeBaseId], references: [id], onDelete: Cascade)

  @@map("knowledge_base_documents")
  @@index([knowledgeBaseId])
}
```

#### KnowledgeBasePermission
Access control for knowledge bases.

```prisma
model KnowledgeBasePermission {
  id              String   @id @default(uuid()) @db.Uuid
  knowledgeBaseId String   @map("knowledge_base_id") @db.Uuid
  userId          String?  @map("user_id") @db.Uuid
  roleId          String?  @map("role_id") @db.Uuid
  permissionType  String   @map("permission_type") // READ, WRITE, ADMIN
  grantedAt       DateTime @default(now()) @map("granted_at")

  // Relations
  knowledgeBase KnowledgeBase @relation(fields: [knowledgeBaseId], references: [id], onDelete: Cascade)
  role          Role?         @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@map("knowledge_base_permissions")
  @@index([knowledgeBaseId])
}
```

---

### 6. Notifications & Audit

#### Notification
User notifications with read tracking.

```prisma
model Notification {
  id       String    @id @default(uuid()) @db.Uuid
  userId   String    @map("user_id") @db.Uuid
  type     String    // PROJECT_UPDATE, WORKFLOW_COMPLETE, ARTIFACT_READY, SUBMISSION_SENT
  title    String
  message  String    @db.Text
  read     Boolean   @default(false)
  metadata Json?
  createdAt DateTime @default(now()) @map("created_at")
  readAt   DateTime? @map("read_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
  @@index([userId, read])
  @@index([createdAt])
}
```

#### AuditLog
System activity tracking for compliance.

```prisma
model AuditLog {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @map("user_id") @db.Uuid
  action        String
  resourceType  String   @map("resource_type")
  resourceId    String   @map("resource_id") @db.Uuid
  previousState Json?    @map("previous_state")
  newState      Json?    @map("new_state")
  ipAddress     String?  @map("ip_address")
  userAgent     String?  @map("user_agent")
  createdAt     DateTime @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id])

  @@map("audit_logs")
  @@index([userId])
  @@index([resourceType, resourceId])
  @@index([createdAt])
}
```

---

### 7. System Configuration

#### AgentConfiguration
Configuration for agent models and parameters.

```prisma
model AgentConfiguration {
  id                   String   @id @default(uuid()) @db.Uuid
  agentType            String   @unique @map("agent_type")
  modelName            String   @map("model_name")
  temperature          Float    @default(0.7)
  maxTokens            Int      @map("max_tokens")
  systemPrompt         Json     @map("system_prompt")
  additionalParameters Json?    @map("additional_parameters")
  enabled              Boolean  @default(true)
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")
  updatedBy            String?  @map("updated_by") @db.Uuid

  @@map("agent_configurations")
}
```

#### Integration
External service integrations with configuration.

```prisma
model Integration {
  id            String   @id @default(uuid()) @db.Uuid
  type          String   @unique // SLACK, EMAIL, S3, BEDROCK
  name          String
  configuration Json
  enabled       Boolean  @default(true)
  createdBy     String   @map("created_by") @db.Uuid
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  creator User             @relation(fields: [createdBy], references: [id])
  logs    IntegrationLog[]

  @@map("integrations")
}
```

#### IntegrationLog
Logs for integration actions and responses.

```prisma
model IntegrationLog {
  id            String   @id @default(uuid()) @db.Uuid
  integrationId String   @map("integration_id") @db.Uuid
  action        String
  status        String   // SUCCESS, FAILURE
  requestData   Json?    @map("request_data")
  responseData  Json?    @map("response_data")
  errorMessage  String?  @map("error_message") @db.Text
  createdAt     DateTime @default(now()) @map("created_at")

  // Relations
  integration Integration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  @@map("integration_logs")
  @@index([integrationId])
  @@index([createdAt])
}
```

---

### 8. Statistics & Submissions

#### BidStatistics
Aggregated metrics for bid performance.

```prisma
model BidStatistics {
  id              String   @id @default(uuid()) @db.Uuid
  periodStart     DateTime @map("period_start") @db.Date
  periodEnd       DateTime @map("period_end") @db.Date
  submittedBids   Int      @map("submitted_bids")
  wonBids         Int      @map("won_bids")
  totalValue      Decimal  @map("total_value") @db.Decimal(15, 2)
  wonValue        Decimal  @map("won_value") @db.Decimal(15, 2)
  successRate     Float    @map("success_rate")
  activeRfps      Int      @map("active_rfps")
  detailedMetrics Json?    @map("detailed_metrics")
  calculatedAt    DateTime @default(now()) @map("calculated_at")

  @@unique([periodStart, periodEnd])
  @@map("bid_statistics")
  @@index([periodStart, periodEnd])
}
```

#### SubmissionRecord
Tracks bid submissions to portals.

```prisma
model SubmissionRecord {
  id                 String   @id @default(uuid()) @db.Uuid
  projectId          String   @map("project_id") @db.Uuid
  artifactId         String   @map("artifact_id") @db.Uuid
  portalName         String   @map("portal_name")
  submissionId       String?  @map("submission_id")
  status             String   // PENDING, SUBMITTED, ACCEPTED, REJECTED
  submittedBy        String   @map("submitted_by") @db.Uuid
  submittedAt        DateTime @default(now()) @map("submitted_at")
  submissionMetadata Json?    @map("submission_metadata")

  // Relations
  project  Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  artifact Artifact @relation(fields: [artifactId], references: [id])
  user     User     @relation(fields: [submittedBy], references: [id])

  @@map("submission_records")
  @@index([projectId])
  @@index([status])
}
```

---

## Indexing Strategy

### Query Performance Indexes

**High-Frequency Queries**:
1. User lookups: `@@index([email])`, `@@index([cognitoUserId])`
2. Project filtering: `@@index([status, createdAt])`, `@@index([createdBy])`
3. Workflow tracking: `@@index([projectId, status])`, `@@index([status, lastUpdatedAt])`
4. Agent tasks: `@@index([workflowExecutionId, sequenceOrder])`
5. Notifications: `@@index([userId, read])`, `@@index([createdAt])`

**Join Optimizations**:
- All foreign keys automatically indexed by Prisma
- Composite indexes on frequently joined columns
- Partial indexes on status fields for active records

---

## Data Validation Rules

### At Database Level (Prisma)
- Required fields marked with no `?`
- Unique constraints on email, username, cognitoUserId
- Foreign key constraints with CASCADE on delete
- Default values for timestamps and status fields

### At Application Level (GraphQL)
- Input validation using custom scalars (UUID, Email, URL)
- Business logic validation in resolvers
- Authorization checks before data access
- Transaction boundaries for multi-table operations

---

## Migration Strategy

### Initial Setup
```bash
# Generate Prisma client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init

# Seed development data
npx prisma db seed
```

### Schema Changes
```bash
# Create migration for schema changes
npx prisma migrate dev --name add_new_field

# Apply to production
npx prisma migrate deploy
```

### Rollback Plan
- Keep migration history in version control
- Test migrations in staging before production
- Backup database before applying migrations
- Document breaking changes with migration notes

---

## Summary

The data model provides:
- **20+ entities** covering all platform functionality
- **Type-safe** database access via Prisma
- **Optimized queries** with strategic indexing
- **Referential integrity** via foreign key constraints
- **Audit trail** with timestamp tracking
- **Flexible storage** using JSON for metadata and configuration

All entities are designed to support the GraphQL API requirements defined in the specification and align with the existing database ER diagram.