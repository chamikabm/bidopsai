# Task 4: State Management and API Integration - Complete ✅

## Overview
Successfully implemented comprehensive state management and API integration for the bidops.ai web application, including TanStack Query configuration, Zustand stores, error handling, GraphQL BFF routes, and custom data fetching hooks.

## Sub-task 4.1: Configure TanStack Query and Zustand stores ✅

### TanStack Query Configuration
- **File**: `src/lib/query-client.ts`
- Created optimized QueryClient with proper caching strategies:
  - Stale time: 5 minutes
  - Cache time: 10 minutes
  - Retry logic with exponential backoff (3 retries)
  - Automatic refetch on window focus and reconnect
  - Singleton pattern for client-side usage

### Zustand Stores

#### UI Store
- **File**: `src/store/ui-store.ts`
- Features:
  - Theme management (light, dark, deloitte, futuristic)
  - Language management (en-US, en-AU)
  - Sidebar state (collapsed/expanded)
  - Mobile menu state
  - Modal management (open/close/toggle)
  - Loading states tracking
  - Persisted to localStorage (theme, language, sidebar state)

#### Artifact Draft Store
- **File**: `src/store/artifact-draft-store.ts`
- Features:
  - Draft storage with artifact ID as key
  - Content versioning with timestamps
  - Change tracking (hasChanges flag)
  - Batch operations (set/clear multiple drafts)
  - Draft count tracking
  - Persisted to localStorage

### Error Handling

#### Error Boundary Component
- **File**: `src/components/common/ErrorBoundary/ErrorBoundary.tsx`
- Features:
  - Catches React component errors
  - Custom fallback UI with error details
  - Stack trace display in development mode
  - Recovery actions (Try Again, Reload Page, Go Home)
  - Custom error handler callback support

#### Global Error Handler
- **File**: `src/lib/error-handler.ts`
- Features:
  - ApplicationError class for structured errors
  - Error handling utilities:
    - `handleError()` - Process any error type
    - `showErrorToast()` - Display error notifications
    - `handleAPIError()` - Handle fetch response errors
    - `handleGraphQLError()` - Handle GraphQL errors
    - `retryWithBackoff()` - Retry with exponential backoff
  - Error type checking:
    - `isNetworkError()`
    - `isAuthError()`
    - `isPermissionError()`

### Updated Providers
- **File**: `src/components/providers/Providers.tsx`
- Integrated:
  - ErrorBoundary wrapper
  - Optimized QueryClient configuration
  - ReactQueryDevtools (development only)
  - Existing ThemeProvider and AuthProvider

## Sub-task 4.2: Build GraphQL integration and BFF routes ✅

### GraphQL BFF Route
- **File**: `src/app/api/graphql/route.ts`
- Features:
  - POST endpoint for GraphQL requests
  - Token-based authorization (Bearer token from client)
  - Request proxying to backend GraphQL API
  - Error handling and response formatting
  - CORS support (OPTIONS handler)
  - Security: API keys never exposed to browser
  - Client-side authentication with AWS Amplify

### GraphQL Client
- **File**: `src/lib/graphql/client.ts`
- Features:
  - Wrapper around graphql-request
  - Routes through BFF (/api/graphql)
  - Automatic authentication token injection
  - Fetches ID token from AWS Amplify session
  - Automatic error handling
  - Type-safe request methods (query, mutation)
  - Singleton pattern

### GraphQL Queries

#### Projects
- **File**: `src/lib/graphql/queries/projects.ts`
- Queries:
  - `GET_PROJECTS` - List projects with filters
  - `GET_PROJECT` - Single project details
  - `GET_PROJECT_DOCUMENTS` - Project documents
  - `GET_PROJECT_WORKFLOW` - Workflow execution status

#### Users
- **File**: `src/lib/graphql/queries/users.ts`
- Queries:
  - `GET_USERS` - List users with search
  - `GET_USER` - Single user details
  - `GET_CURRENT_USER` - Current authenticated user

#### Knowledge Bases
- **File**: `src/lib/graphql/queries/knowledge-bases.ts`
- Queries:
  - `GET_KNOWLEDGE_BASES` - List KBs with filters
  - `GET_KNOWLEDGE_BASE` - Single KB details
  - `GET_KNOWLEDGE_BASE_DOCUMENTS` - KB documents with search

#### Artifacts
- **File**: `src/lib/graphql/queries/artifacts.ts`
- Queries:
  - `GET_ARTIFACTS` - List artifacts by project
  - `GET_ARTIFACT` - Single artifact details
  - `GET_ARTIFACT_VERSIONS` - Artifact version history

### GraphQL Mutations

#### Projects
- **File**: `src/lib/graphql/mutations/projects.ts`
- Mutations:
  - `CREATE_PROJECT`
  - `UPDATE_PROJECT`
  - `DELETE_PROJECT`
  - `GENERATE_PRESIGNED_URLS`
  - `UPDATE_PROJECT_DOCUMENTS`
  - `ADD_PROJECT_MEMBER`
  - `REMOVE_PROJECT_MEMBER`

#### Users
- **File**: `src/lib/graphql/mutations/users.ts`
- Mutations:
  - `CREATE_USER`
  - `UPDATE_USER`
  - `DELETE_USER`
  - `ASSIGN_USER_ROLE`
  - `REMOVE_USER_ROLE`

#### Knowledge Bases
- **File**: `src/lib/graphql/mutations/knowledge-bases.ts`
- Mutations:
  - `CREATE_KNOWLEDGE_BASE`
  - `UPDATE_KNOWLEDGE_BASE`
  - `DELETE_KNOWLEDGE_BASE`
  - `ADD_KNOWLEDGE_BASE_DOCUMENT`
  - `REMOVE_KNOWLEDGE_BASE_DOCUMENT`
  - `SET_KNOWLEDGE_BASE_PERMISSION`

#### Artifacts
- **File**: `src/lib/graphql/mutations/artifacts.ts`
- Mutations:
  - `CREATE_ARTIFACT`
  - `UPDATE_ARTIFACT`
  - `DELETE_ARTIFACT`
  - `CREATE_ARTIFACT_VERSION`
  - `APPROVE_ARTIFACT`

### Custom React Query Hooks

#### Project Hooks
- **File**: `src/hooks/queries/useProjects.ts`
- Query Hooks:
  - `useProjects()` - List projects
  - `useProject()` - Single project
  - `useProjectDocuments()` - Project documents
  - `useProjectWorkflow()` - Workflow status
- Mutation Hooks:
  - `useCreateProject()`
  - `useUpdateProject()`
  - `useDeleteProject()`
  - `useGeneratePresignedUrls()`
  - `useUpdateProjectDocuments()`
  - `useAddProjectMember()`
  - `useRemoveProjectMember()`
- Features:
  - Automatic cache invalidation
  - Error toast notifications
  - Optimistic updates support
  - Query key management

#### User Hooks
- **File**: `src/hooks/queries/useUsers.ts`
- Query Hooks:
  - `useUsers()` - List users
  - `useUser()` - Single user
  - `useCurrentUser()` - Current user
- Mutation Hooks:
  - `useCreateUser()`
  - `useUpdateUser()`
  - `useDeleteUser()`
  - `useAssignUserRole()`
  - `useRemoveUserRole()`

#### Knowledge Base Hooks
- **File**: `src/hooks/queries/useKnowledgeBases.ts`
- Query Hooks:
  - `useKnowledgeBases()` - List KBs
  - `useKnowledgeBase()` - Single KB
  - `useKnowledgeBaseDocuments()` - KB documents
- Mutation Hooks:
  - `useCreateKnowledgeBase()`
  - `useUpdateKnowledgeBase()`
  - `useDeleteKnowledgeBase()`
  - `useAddKnowledgeBaseDocument()`
  - `useRemoveKnowledgeBaseDocument()`
  - `useSetKnowledgeBasePermission()`

#### Artifact Hooks
- **File**: `src/hooks/queries/useArtifacts.ts`
- Query Hooks:
  - `useArtifacts()` - List artifacts
  - `useArtifact()` - Single artifact
  - `useArtifactVersions()` - Version history
- Mutation Hooks:
  - `useCreateArtifact()`
  - `useUpdateArtifact()`
  - `useDeleteArtifact()`
  - `useCreateArtifactVersion()`
  - `useApproveArtifact()`

### Central Export
- **File**: `src/hooks/queries/index.ts`
- Exports all query hooks for convenient imports

## Requirements Satisfied

### Requirement 16: Real-time Updates and State Management ✅
- TanStack Query for server state with optimized caching
- Zustand for client state (UI preferences, artifact drafts)
- Automatic cache invalidation on mutations
- Error boundaries for comprehensive error handling

### Requirement 19: Backend-for-Frontend Pattern ✅
- GraphQL BFF route at `/api/graphql`
- Server-side authentication verification
- API keys and credentials never exposed to browser
- Secure token-based authorization

### Requirement 21: Error Handling ✅
- Global error boundary component
- Comprehensive error handler utilities
- Error toast notifications
- Retry mechanisms with exponential backoff
- Error type checking (network, auth, permission)

## Architecture Benefits

1. **Security**: All sensitive operations handled server-side through BFF
2. **Performance**: Optimized caching strategies reduce unnecessary requests
3. **Developer Experience**: Type-safe hooks with automatic error handling
4. **Maintainability**: Centralized query/mutation definitions
5. **User Experience**: Automatic cache updates and error notifications
6. **Scalability**: Query key management enables fine-grained cache control

## Next Steps

The state management and API integration foundation is now complete. Future tasks can:
- Use the custom hooks for data fetching in components
- Leverage Zustand stores for UI state management
- Rely on automatic error handling and cache invalidation
- Build features on top of the secure BFF architecture

## Testing Recommendations

1. Test GraphQL BFF route with authenticated requests
2. Verify error boundary catches component errors
3. Test Zustand store persistence across page reloads
4. Validate query cache invalidation on mutations
5. Test retry logic with network failures
6. Verify error toast notifications display correctly

## Environment Variables Required

Add to `.env.local`:
```
GRAPHQL_API_ENDPOINT=http://localhost:4000/graphql
```

Update for production deployment.
