# Data Model: BidOps.AI Frontend

**Feature**: BidOps.AI Frontend Application  
**Date**: 2025-10-07  
**Status**: Complete

## Overview

This document defines the frontend data model aligned with the backend PostgreSQL schema and GraphQL API. The frontend maintains these models for:
- Type safety with TypeScript
- TanStack Query cache structure
- Zustand store organization
- Form validation with Zod schemas

**Alignment**: This model directly maps to the database schema defined in `docs/database/bidopsai.mmd` and the GraphQL schema in `docs/architecture/core-api/gql-schema.md`.

---

## Core Entities

### User

Represents a platform user with authentication, profile, roles, and preferences.

```typescript
// types/user.types.ts
export interface User {
  id: string; // UUID
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  preferredLanguage: string; // 'en-US' | 'en-AU'
  themePreference: string; // 'light' | 'dark' | 'deloitte' | 'futuristic'
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  cognitoUserId: string;
  roles: Role[];
  projects: ProjectMember[];
  notifications: Notification[];
}

export type UserRoleType = 'Admin' | 'Drafter' | 'Bidder' | 'KB-Admin' | 'KB-View';

// Zod validation schema
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(50),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  profileImageUrl: z.string().url().optional(),
  preferredLanguage: z.enum(['en-US', 'en-AU']),
  themePreference: z.enum(['light', 'dark', 'deloitte', 'futuristic']),
  emailVerified: z.boolean(),
  cognitoUserId: z.string(),
});
```

**Key Relationships**:
- Many-to-Many with Role (via UserRole join table)
- Many-to-Many with Project (via ProjectMember join table)
- One-to-Many with Notification
- Tracks createdBy, updatedBy, completedBy across other entities

**State Management**:
- TanStack Query: `['user', userId]` for single user, `['users', filters]` for list
- Zustand: Current authenticated user in `useAuthStore`

---

### Role

Represents a user role with associated permissions for RBAC.

```typescript
// types/user.types.ts
export interface Role {
  id: string; // UUID
  name: UserRoleType;
  description: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string; // UUID
  roleId: string;
  resource: string; // 'projects' | 'knowledgeBases' | 'users' | 'settings'
  action: string; // 'create' | 'read' | 'update' | 'delete'
  createdAt: Date;
}

// Zod schemas
export const roleSchema = z.object({
  id: z.string().uuid(),
  name: z.enum(['Admin', 'Drafter', 'Bidder', 'KB-Admin', 'KB-View']),
  description: z.string(),
});

export const permissionSchema = z.object({
  id: z.string().uuid(),
  roleId: z.string().uuid(),
  resource: z.string(),
  action: z.enum(['create', 'read', 'update', 'delete']),
});
```

**Permission Matrix**:

| Role | Projects | Knowledge Bases | Users | Settings | Workflow Steps |
|------|----------|----------------|-------|----------|---------------|
| Admin | Full CRUD | Full CRUD | Full CRUD | Full Access | All Steps |
| Drafter | Full CRUD | Read Local | Read | Read | Up to QA |
| Bidder | Full CRUD | CRUD Local | Read | Read | All Steps |
| KB-Admin | Read | Full CRUD | None | None | None |
| KB-View | None | Read | None | None | None |

**State Management**:
- TanStack Query: `['roles']` for all roles, `['permissions', roleId]` for role permissions
- Computed in hooks: `usePermissions()` checks current user's role permissions

---

### Project

Represents a bid preparation project with documents, workflow, and artifacts.

```typescript
// types/project.types.ts
export interface Project {
  id: string; // UUID
  name: string;
  description?: string;
  status: ProjectStatus;
  value?: number; // Decimal
  deadline?: Date;
  progressPercentage: number; // 0-100
  createdBy: User;
  completedBy?: User;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>; // JSON
  documents: ProjectDocument[];
  members: ProjectMember[];
  knowledgeBases: KnowledgeBase[];
  artifacts: Artifact[];
  workflowExecutions: WorkflowExecution[];
  submissionRecords: SubmissionRecord[];
}

export type ProjectStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'COMPLETED'
  | 'SUBMITTED'
  | 'WON'
  | 'LOST'
  | 'CANCELLED';

export interface ProjectMember {
  id: string; // UUID
  project: Project;
  user: User;
  addedBy: User;
  joinedAt: Date;
}

// Zod schemas
export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  status: z.enum([
    'DRAFT',
    'IN_PROGRESS',
    'UNDER_REVIEW',
    'COMPLETED',
    'SUBMITTED',
    'WON',
    'LOST',
    'CANCELLED',
  ]),
  value: z.number().positive().optional(),
  deadline: z.date().optional(),
  progressPercentage: z.number().min(0).max(100),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200),
  description: z.string().max(1000).optional(),
  deadline: z.date().optional(),
  knowledgeBaseIds: z.array(z.string().uuid()).optional(),
  userIds: z.array(z.string().uuid()).optional(),
});
```

**Key Relationships**:
- One-to-Many with ProjectDocument
- Many-to-Many with User (via ProjectMember)
- Many-to-Many with KnowledgeBase
- One-to-Many with Artifact
- One-to-Many with WorkflowExecution
- One-to-Many with SubmissionRecord

**State Management**:
- TanStack Query: `['project', projectId]` for single, `['projects', filters]` for list
- Real-time updates: SSE events update cache via `queryClient.setQueryData()`

---

### ProjectDocument

Represents a document uploaded to a project.

```typescript
// types/project.types.ts
export interface ProjectDocument {
  id: string; // UUID
  projectId: string;
  fileName: string;
  filePath: string;
  fileType: string; // MIME type
  fileSize: number; // bytes
  rawFileLocation: string; // S3 URL
  processedFileLocation?: string; // S3 URL after parsing
  uploadedBy: User;
  uploadedAt: Date;
  metadata?: Record<string, any>; // JSON
}

// Zod schema
export const projectDocumentSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().regex(/^(application|image|video|audio)\/.+/),
  fileSize: z.number().positive().max(500 * 1024 * 1024), // 500MB max
});

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  video: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
} as const;
```

**State Management**:
- TanStack Query: `['projectDocuments', projectId]`
- Upload progress: Zustand `useUploadStore` for real-time progress tracking

---

### WorkflowExecution

Represents a single execution of the agent workflow for a project.

```typescript
// types/workflow.types.ts
export interface WorkflowExecution {
  id: string; // UUID
  projectId: string;
  status: WorkflowStatus;
  initiatedBy: User;
  handledBy?: User;
  completedBy?: User;
  startedAt: Date;
  completedAt?: Date;
  lastUpdatedAt: Date;
  workflowConfig?: Record<string, any>; // JSON
  errorLog?: Record<string, any>; // JSON
  errorMessage?: string;
  results?: Record<string, any>; // JSON
  agentTasks: AgentTask[];
}

export type WorkflowStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'COMPLETED' | 'FAILED';

// Zod schema
export const workflowExecutionSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'FAILED']),
});
```

**Workflow Steps** (8 total):
1. Document Upload
2. Document Parsing (Parser Agent)
3. Analysis (Analysis Agent)
4. Content Generation (Content Agent + Knowledge Agent)
5. Compliance Check (Compliance Agent)
6. Quality Assurance (QA Agent)
7. Communications (Comms Agent)
8. Bidding/Submission (Submission Agent)

**State Management**:
- TanStack Query: `['workflowExecution', workflowId]`
- SSE updates: Real-time status changes update cache
- Optimistic updates: UI updates before server confirmation

---

### AgentTask

Represents a single agent's task within a workflow execution.

```typescript
// types/agent.types.ts
export interface AgentTask {
  id: string; // UUID
  workflowExecutionId: string;
  initiatedBy: User;
  handledBy?: User;
  completedBy?: User;
  agent: AgentType;
  status: AgentTaskStatus;
  sequenceOrder: number; // 1-8 for workflow steps
  inputData?: Record<string, any>; // JSON
  outputData?: Record<string, any>; // JSON
  taskConfig?: Record<string, any>; // JSON
  errorLog?: Record<string, any>; // JSON
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  executionTimeSeconds?: number;
}

export type AgentType =
  | 'SUPERVISOR'
  | 'PARSER'
  | 'ANALYSIS'
  | 'CONTENT'
  | 'KNOWLEDGE'
  | 'COMPLIANCE'
  | 'QA'
  | 'COMMS'
  | 'SUBMISSION';

export type AgentTaskStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'COMPLETED' | 'FAILED';

// Zod schema
export const agentTaskSchema = z.object({
  id: z.string().uuid(),
  workflowExecutionId: z.string().uuid(),
  agent: z.enum([
    'SUPERVISOR',
    'PARSER',
    'ANALYSIS',
    'CONTENT',
    'KNOWLEDGE',
    'COMPLIANCE',
    'QA',
    'COMMS',
    'SUBMISSION',
  ]),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'FAILED']),
  sequenceOrder: z.number().min(1).max(8),
});
```

**Agent Task Sequence**:
1. Parser Agent (sequenceOrder: 1)
2. Analysis Agent (sequenceOrder: 2)
3. Content Agent (sequenceOrder: 3)
4. Compliance Agent (sequenceOrder: 4)
5. QA Agent (sequenceOrder: 5)
6. Comms Agent (sequenceOrder: 6)
7. Submission Agent (sequenceOrder: 7)

**State Management**:
- TanStack Query: `['agentTasks', workflowExecutionId]`
- SSE updates: Agent status changes streamed in real-time

---

### Artifact

Represents an AI-generated output with versioning.

```typescript
// types/artifact.types.ts
export interface Artifact {
  id: string; // UUID
  projectId: string;
  name: string;
  type: ArtifactType;
  category: ArtifactCategory;
  status: ArtifactStatus;
  createdBy: User;
  approvedBy?: User;
  createdAt: Date;
  approvedAt?: Date;
  versions: ArtifactVersion[];
  latestVersion?: ArtifactVersion;
}

export type ArtifactType = 'WORDDOC' | 'PDF' | 'PPT' | 'EXCEL';

export type ArtifactCategory = 'DOCUMENT' | 'Q_AND_A' | 'EXCEL';

export type ArtifactStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export interface ArtifactVersion {
  id: string; // UUID
  artifactId: string;
  versionNumber: number;
  content: TipTapContent | QAContent | ExcelContent; // JSON
  location?: string; // S3 URL for exported files
  createdBy: User;
  createdAt: Date;
}

// Content type definitions
export interface TipTapContent {
  type: 'doc';
  content: TipTapNode[];
}

export interface TipTapNode {
  type: string; // 'heading' | 'paragraph' | 'bulletList' | etc.
  attrs?: Record<string, any>;
  content?: TipTapNode[];
  marks?: TipTapMark[];
  text?: string;
}

export interface TipTapMark {
  type: string; // 'bold' | 'italic' | 'underline' | etc.
  attrs?: Record<string, any>;
}

export interface QAContent {
  q_and_a: QAItem[];
}

export interface QAItem {
  question: string;
  proposed_answer: string;
  past_answers: PastAnswer[];
}

export interface PastAnswer {
  answer: string;
  reference_link?: string;
}

export interface ExcelContent {
  sheets: ExcelSheet[];
}

export interface ExcelSheet {
  name: string;
  rows: ExcelRow[];
}

export interface ExcelRow {
  cells: (string | number | boolean)[];
}

// Zod schemas
export const artifactSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: z.enum(['WORDDOC', 'PDF', 'PPT', 'EXCEL']),
  category: z.enum(['DOCUMENT', 'Q_AND_A', 'EXCEL']),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED']),
});

export const qaItemSchema = z.object({
  question: z.string().min(1),
  proposed_answer: z.string().min(1),
  past_answers: z.array(
    z.object({
      answer: z.string(),
      reference_link: z.string().url().optional(),
    })
  ),
});
```

**State Management**:
- TanStack Query: `['artifacts', projectId]` for list, `['artifact', artifactId]` for single
- Zustand `useArtifactDraftStore`: Unsaved edits before sending to agents
- Optimistic updates: Show edits immediately, sync on save

---

### KnowledgeBase

Represents a collection of reference documents for AI agents.

```typescript
// types/knowledgeBase.types.ts
export interface KnowledgeBase {
  id: string; // UUID
  name: string;
  description?: string;
  scope: KnowledgeBaseScope;
  project?: Project; // Present if scope is LOCAL
  documentCount: number;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
  vectorStoreId?: string; // Bedrock KB vector store ID
  documents: KnowledgeBaseDocument[];
  permissions: KnowledgeBasePermission[];
}

export type KnowledgeBaseScope = 'GLOBAL' | 'LOCAL';

export interface KnowledgeBaseDocument {
  id: string; // UUID
  knowledgeBaseId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  s3Bucket: string;
  s3Key: string;
  uploadedBy: User;
  uploadedAt: Date;
  metadata?: Record<string, any>;
  vectorIds?: string; // Bedrock vector IDs
}

export interface KnowledgeBasePermission {
  id: string; // UUID
  knowledgeBase: KnowledgeBase;
  user?: User;
  role?: Role;
  permissionType: string; // 'read' | 'write' | 'admin'
  grantedAt: Date;
}

// Zod schemas
export const knowledgeBaseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  scope: z.enum(['GLOBAL', 'LOCAL']),
  documentCount: z.number().min(0),
});

export const createKnowledgeBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  scope: z.enum(['GLOBAL', 'LOCAL']),
  projectId: z.string().uuid().optional(),
});
```

**State Management**:
- TanStack Query: `['knowledgeBases', filters]` for list with scope filter
- Split queries: `['globalKnowledgeBases']` and `['localKnowledgeBases', projectId]`

---

### Notification

Represents a user notification.

```typescript
// types/notification.types.ts
export interface Notification {
  id: string; // UUID
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, any>; // JSON - links to source entity
  createdAt: Date;
  readAt?: Date;
}

export type NotificationType =
  | 'PROJECT_UPDATE'
  | 'WORKFLOW_COMPLETE'
  | 'ARTIFACT_READY'
  | 'SUBMISSION_COMPLETE'
  | 'MENTION'
  | 'ASSIGNMENT';

// Zod schema
export const notificationSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    'PROJECT_UPDATE',
    'WORKFLOW_COMPLETE',
    'ARTIFACT_READY',
    'SUBMISSION_COMPLETE',
    'MENTION',
    'ASSIGNMENT',
  ]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  read: z.boolean(),
});
```

**State Management**:
- TanStack Query: `['notifications', userId]` for all, `['unreadNotifications', userId]` for unread
- GraphQL subscriptions: `notificationReceived` for real-time updates
- Optimistic updates: Mark as read immediately

---

### AgentConfiguration

Represents configuration settings for each agent type.

```typescript
// types/agent.types.ts
export interface AgentConfiguration {
  id: string; // UUID
  agentType: AgentType;
  modelName: string; // e.g., 'claude-3-5-sonnet-20241022'
  temperature: number; // 0.0 - 1.0
  maxTokens: number;
  systemPrompt: Record<string, any>; // JSON
  additionalParameters?: Record<string, any>; // JSON
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: User;
}

// Zod schema
export const agentConfigurationSchema = z.object({
  agentType: z.enum([
    'SUPERVISOR',
    'PARSER',
    'ANALYSIS',
    'CONTENT',
    'KNOWLEDGE',
    'COMPLIANCE',
    'QA',
    'COMMS',
    'SUBMISSION',
  ]),
  modelName: z.string().min(1),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().positive().max(200000),
  enabled: z.boolean(),
});
```

**State Management**:
- TanStack Query: `['agentConfigurations']` for all, `['agentConfiguration', agentType]` for single
- Updates require Admin role

---

### Integration

Represents third-party integration configuration.

```typescript
// types/integration.types.ts
export interface Integration {
  id: string; // UUID
  type: IntegrationType;
  name: string;
  configuration: Record<string, any>; // JSON - encrypted sensitive data
  enabled: boolean;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
  logs: IntegrationLog[];
}

export type IntegrationType = 'SLACK' | 'EMAIL' | 'PORTAL';

export interface IntegrationLog {
  id: string; // UUID
  integrationId: string;
  action: string;
  status: string; // 'success' | 'failure'
  requestData?: Record<string, any>; // JSON
  responseData?: Record<string, any>; // JSON
  errorMessage?: string;
  createdAt: Date;
}

// Zod schema
export const integrationSchema = z.object({
  type: z.enum(['SLACK', 'EMAIL', 'PORTAL']),
  name: z.string().min(1).max(100),
  enabled: z.boolean(),
});

export const slackIntegrationConfigSchema = z.object({
  webhookUrl: z.string().url(),
  channel: z.string().min(1),
  token: z.string().min(1),
});
```

**State Management**:
- TanStack Query: `['integrations']` for all, `['integration', type]` for specific type
- Sensitive data encrypted in backend, only configuration structure in frontend

---

## Client State (Zustand Stores)

### UI Store

Manages client-side UI preferences and state.

```typescript
// store/useUIStore.ts
export interface UIStore {
  // Theme
  theme: 'light' | 'dark' | 'deloitte' | 'futuristic';
  setTheme: (theme: UIStore['theme']) => void;

  // Language
  language: 'en-US' | 'en-AU';
  setLanguage: (language: UIStore['language']) => void;

  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Mobile navigation
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

// Persisted to localStorage
const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      language: 'en-US',
      setLanguage: (language) => set({ language }),
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      globalLoading: false,
      setGlobalLoading: (loading) => set({ globalLoading: loading }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
```

### Artifact Draft Store

Manages unsaved artifact edits before sending to agents.

```typescript
// store/useArtifactDraftStore.ts
export interface ArtifactDraft {
  artifactId: string;
  content: TipTapContent | QAContent | ExcelContent;
  lastModified: Date;
}

export interface ArtifactDraftStore {
  drafts: Record<string, ArtifactDraft>; // key: artifactId
  saveDraft: (artifactId: string, content: any) => void;
  getDraft: (artifactId: string) => ArtifactDraft | undefined;
  clearDraft: (artifactId: string) => void;
  clearAllDrafts: () => void;
  hasDraft: (artifactId: string) => boolean;
}

const useArtifactDraftStore = create<ArtifactDraftStore>()(
  persist(
    (set, get) => ({
      drafts: {},
      saveDraft: (artifactId, content) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [artifactId]: {
              artifactId,
              content,
              lastModified: new Date(),
            },
          },
        })),
      getDraft: (artifactId) => get().drafts[artifactId],
      clearDraft: (artifactId) =>
        set((state) => {
          const { [artifactId]: _, ...rest } = state.drafts;
          return { drafts: rest };
        }),
      clearAllDrafts: () => set({ drafts: {} }),
      hasDraft: (artifactId) => artifactId in get().drafts,
    }),
    {
      name: 'artifact-drafts-storage',
    }
  )
);
```

### Upload Store

Manages file upload progress tracking.

```typescript
// store/useUploadStore.ts
export interface UploadProgress {
  fileId: string; // temporary ID for tracking
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface UploadStore {
  uploads: Record<string, UploadProgress>;
  addUpload: (fileId: string, fileName: string) => void;
  updateProgress: (fileId: string, progress: number) => void;
  setUploadStatus: (fileId: string, status: UploadProgress['status'], error?: string) => void;
  removeUpload: (fileId: string) => void;
  clearCompleted: () => void;
}

const useUploadStore = create<UploadStore>((set) => ({
  uploads: {},
  addUpload: (fileId, fileName) =>
    set((state) => ({
      uploads: {
        ...state.uploads,
        [fileId]: { fileId, fileName, progress: 0, status: 'pending' },
      },
    })),
  updateProgress: (fileId, progress) =>
    set((state) => ({
      uploads: {
        ...state.uploads,
        [fileId]: { ...state.uploads[fileId], progress, status: 'uploading' },
      },
    })),
  setUploadStatus: (fileId, status, error) =>
    set((state) => ({
      uploads: {
        ...state.uploads,
        [fileId]: { ...state.uploads[fileId], status, error },
      },
    })),
  removeUpload: (fileId) =>
    set((state) => {
      const { [fileId]: _, ...rest } = state.uploads;
      return { uploads: rest };
    }),
  clearCompleted: () =>
    set((state) => ({
      uploads: Object.fromEntries(
        Object.entries(state.uploads).filter(([_, upload]) => upload.status !== 'success')
      ),
    })),
}));
```

---

## TanStack Query Cache Structure

### Query Keys Organization

```typescript
// hooks/queries/queryKeys.ts
export const queryKeys = {
  // Users
  users: ['users'] as const,
  user: (id: string) => ['user', id] as const,
  currentUser: ['currentUser'] as const,

  // Roles
  roles: ['roles'] as const,
  role: (id: string) => ['role', id] as const,
  permissions: (roleId: string) => ['permissions', roleId] as const,

  // Projects
  projects: (filters?: ProjectFilter) => ['projects', filters] as const,
  project: (id: string) => ['project', id] as const,
  myProjects: ['myProjects'] as const,
  projectDocuments: (projectId: string) => ['projectDocuments', projectId] as const,
  projectMembers: (projectId: string) => ['projectMembers', projectId] as const,

  // Workflows
  workflowExecution: (id: string) => ['workflowExecution', id] as const,
  workflowExecutions: (projectId: string) => ['workflowExecutions', projectId] as const,
  agentTasks: (workflowExecutionId: string) => ['agentTasks', workflowExecutionId] as const,

  // Artifacts
  artifacts: (projectId: string) => ['artifacts', projectId] as const,
  artifact: (id: string) => ['artifact', id] as const,
  artifactVersions: (artifactId: string) => ['artifactVersions', artifactId] as const,

  // Knowledge Bases
  knowledgeBases: (filters?: KBFilter) => ['knowledgeBases', filters] as const,
  knowledgeBase: (id: string) => ['knowledgeBase', id] as const,
  globalKnowledgeBases: ['globalKnowledgeBases'] as const,
  localKnowledgeBases: (projectId: string) => ['localKnowledgeBases', projectId] as const,
  kbDocuments: (kbId: string) => ['kbDocuments', kbId] as const,

  // Notifications
  notifications: (userId: string) => ['notifications', userId] as const,
  unreadNotifications: (userId: string) => ['unreadNotifications', userId] as const,

  // Settings
  agentConfigurations: ['agentConfigurations'] as const,
  agentConfiguration: (agentType: AgentType) => ['agentConfiguration', agentType] as const,
  integrations: ['integrations'] as const,
  integration: (type: IntegrationType) => ['integration', type] as const,

  // Statistics
  dashboardStats: ['dashboardStats'] as const,
} as const;
```

### Cache Invalidation Strategy

```typescript
// SSE event triggers cache updates
queryClient.setQueryData(queryKeys.workflowExecution(workflowId), (old) => ({
  ...old,
  status: newStatus,
  lastUpdatedAt: new Date(),
}));

// Mutation triggers related query invalidation
await queryClient.invalidateQueries({ queryKey: queryKeys.projects() });

// Optimistic update for immediate feedback
queryClient.setQueryData(queryKeys.artifact(artifactId), (old) => ({
  ...old,
  ...updatedFields,
}));
```

---

## Summary

This data model provides:

1. **Type Safety**: Full TypeScript coverage for all entities
2. **Validation**: Zod schemas for runtime validation
3. **State Management**: Clear separation between server state (TanStack Query) and client state (Zustand)
4. **Real-time Updates**: SSE integration with cache updates
5. **Optimistic UI**: Immediate feedback with rollback on error
6. **Persistence**: localStorage for user preferences and drafts

**Next Phase**: Generate GraphQL contracts in `/contracts/` directory.