# Tasks: BidOps.AI Frontend Application

**Feature**: BidOps.AI Frontend Application  
**Branch**: `001-create-a-cutting`  
**Input**: Design documents from `/specs/001-create-a-cutting/`  
**Prerequisites**: ✅ spec.md, ✅ plan.md, ✅ research.md, ✅ data-model.md, ✅ contracts/

**Total Estimated Tasks**: ~215 tasks  
**Estimated Timeline**: 8-10 weeks with 2 developers  
**MVP Subset**: Phase 1-3 (US1-US3) = ~90 tasks (4-5 weeks)

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story reference (e.g., US1, US2, US3)
- All paths relative to `apps/web/` directory

---

## Phase 1: Setup & Initialization (Shared Infrastructure)

**Purpose**: Project scaffolding and base configuration  
**Duration**: 1-2 days  
**Blocking**: All user stories depend on this phase

- [ ] T001 [P] [Setup] Initialize Next.js 15.1.3 project with TypeScript 5.7.2 in `apps/web/`
- [ ] T002 [P] [Setup] Install core dependencies (React 19, Next.js 15, TypeScript) in `apps/web/package.json`
- [ ] T003 [P] [Setup] Configure TypeScript with strict mode in `apps/web/tsconfig.json`
- [ ] T004 [P] [Setup] Configure ESLint with Next.js rules in `apps/web/.eslintrc.json`
- [ ] T005 [P] [Setup] Configure Prettier in `apps/web/.prettierrc`
- [ ] T006 [P] [Setup] Setup Tailwind CSS 4.1+ with PostCSS in `apps/web/tailwind.config.ts`
- [ ] T007 [P] [Setup] Create `.env.example` with all required environment variables
- [ ] T008 [P] [Setup] Configure path aliases (@/ for src/) in `tsconfig.json` and `next.config.js`
- [ ] T009 [P] [Setup] Initialize shadcn/ui configuration in `apps/web/components.json`
- [ ] T010 [P] [Setup] Create base folder structure (src/app, src/components, src/lib, src/hooks, src/types, src/utils, src/styles, src/store)

**Checkpoint**: ✅ Project initialized, dependencies installed, tooling configured

---

## Phase 2: Foundational Infrastructure (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation  
**Duration**: 3-5 days  
**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Authentication Foundation

- [ ] T011 [P] [Foundation] Install AWS Amplify v6.11.4 Gen 2 in `package.json`
- [ ] T012 [P] [Foundation] Create Amplify configuration in `src/lib/auth/amplify.config.ts`
- [ ] T013 [P] [Foundation] Create auth utility functions in `src/lib/auth/cognito.ts`
- [ ] T014 [P] [Foundation] Create session management utilities in `src/lib/auth/session.ts`
- [ ] T015 [Foundation] Create useAuth hook in `src/hooks/useAuth.ts` (depends on T013, T014)

### GraphQL Foundation

- [ ] T016 [P] [Foundation] Install graphql-request and GraphQL codegen dependencies
- [ ] T017 [P] [Foundation] Setup GraphQL client in `src/lib/graphql/client.ts`
- [ ] T018 [P] [Foundation] Configure GraphQL codegen in `codegen.yml`
- [ ] T019 [P] [Foundation] Create base query key structure in `src/hooks/queries/queryKeys.ts`

### State Management Foundation

- [ ] T020 [P] [Foundation] Install TanStack Query v5.62.7 and Zustand v5.0+
- [ ] T021 [P] [Foundation] Setup TanStack Query client in `src/lib/query-client.ts`
- [ ] T022 [P] [Foundation] Create UIStore in `src/store/useUIStore.ts`
- [ ] T023 [P] [Foundation] Create ArtifactDraftStore in `src/store/useArtifactDraftStore.ts`
- [ ] T024 [P] [Foundation] Create UploadStore in `src/store/useUploadStore.ts`

### Type Definitions Foundation

- [ ] T025 [P] [Foundation] Create base types in `src/types/common.types.ts`
- [ ] T026 [P] [Foundation] Create auth types in `src/types/auth.types.ts`
- [ ] T027 [P] [Foundation] Create user types in `src/types/user.types.ts`
- [ ] T028 [P] [Foundation] Create project types in `src/types/project.types.ts`
- [ ] T029 [P] [Foundation] Create workflow types in `src/types/workflow.types.ts`
- [ ] T030 [P] [Foundation] Create agent types in `src/types/agent.types.ts`
- [ ] T031 [P] [Foundation] Create artifact types in `src/types/artifact.types.ts`
- [ ] T032 [P] [Foundation] Create knowledgeBase types in `src/types/knowledgeBase.types.ts`
- [ ] T033 [P] [Foundation] Create notification types in `src/types/notification.types.ts`
- [ ] T034 [P] [Foundation] Create editor types in `src/types/editor.types.ts`

### UI Foundation

- [ ] T035 [P] [Foundation] Install shadcn/ui base components (button, card, dialog, input, label)
- [ ] T036 [P] [Foundation] Create CSS variables for theming in `src/styles/variables.css`
- [ ] T037 [P] [Foundation] Create theme CSS files (light.css, dark.css, deloitte.css, futuristic.css) in `src/styles/themes/`
- [ ] T038 [P] [Foundation] Create animations CSS in `src/styles/animations.css`
- [ ] T039 [P] [Foundation] Create global styles in `src/styles/globals.css`
- [ ] T040 [Foundation] Create Providers component in `src/components/providers/Providers.tsx` (depends on T021, T022)

### Utilities Foundation

- [ ] T041 [P] [Foundation] Create formatting utilities in `src/utils/formatting.ts`
- [ ] T042 [P] [Foundation] Create validation utilities with Zod in `src/utils/validation.ts`
- [ ] T043 [P] [Foundation] Create date utilities in `src/utils/date.ts`
- [ ] T044 [P] [Foundation] Create file utilities in `src/utils/file.ts`
- [ ] T045 [P] [Foundation] Create constants in `src/utils/constants.ts`
- [ ] T046 [P] [Foundation] Create permissions utilities in `src/utils/permissions.ts`

### Middleware Foundation

- [ ] T047 [Foundation] Create Next.js middleware for auth checks in `src/middleware.ts` (depends on T015)

**Checkpoint**: ✅ Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Secure Access and Authentication (Priority: P1) 🎯 MVP

**Goal**: Enable users to securely authenticate via AWS Cognito with username/password and Google OAuth  
**Independent Test**: Attempt to sign in with valid credentials, sign up as new user, and authenticate via Google OAuth

### Implementation for User Story 1

- [ ] T048 [P] [US1] Create auth route group layout in `src/app/(auth)/layout.tsx`
- [ ] T049 [P] [US1] Create AuthBackground component in `src/components/auth/AuthBackground/AuthBackground.tsx`
- [ ] T050 [US1] Create sign-in page in `src/app/(auth)/signin/page.tsx` (depends on T048)
- [ ] T051 [US1] Create sign-up page in `src/app/(auth)/signup/page.tsx` (depends on T048)
- [ ] T052 [P] [US1] Create SignInForm component in `src/components/auth/SignInForm/SignInForm.tsx`
- [ ] T053 [P] [US1] Create SignUpForm component in `src/components/auth/SignUpForm/SignUpForm.tsx`
- [ ] T054 [P] [US1] Create GoogleSignIn component in `src/components/auth/SocialAuth/GoogleSignIn.tsx`
- [ ] T055 [P] [US1] Install React Hook Form v7.64+ and Zod v4.1+ for form validation
- [ ] T056 [US1] Implement sign-in form logic with validation (depends on T052, T055)
- [ ] T057 [US1] Implement sign-up form logic with validation (depends on T053, T055)
- [ ] T058 [US1] Integrate Cognito username/password authentication (depends on T052, T013)
- [ ] T059 [US1] Integrate Google OAuth authentication (depends on T054, T013)
- [ ] T060 [US1] Implement protected route middleware (depends on T047, T015)
- [ ] T061 [US1] Create logout functionality in useAuth hook (depends on T015)
- [ ] T062 [US1] Add session expiration handling (depends on T014)
- [ ] T063 [P] [US1] Create futuristic CSS animations for auth background (depends on T048)
- [ ] T064 [US1] Add loading states and error handling to auth forms (depends on T056, T057)
- [ ] T065 [US1] Implement redirect logic after successful authentication (depends on T060)

**Checkpoint**: ✅ US1 Complete - Users can sign in, sign up, and authenticate via Google OAuth

---

## Phase 4: User Story 2 - Dashboard Overview and Navigation (Priority: P2)

**Goal**: Provide dashboard with statistics and quick access to assigned projects  
**Independent Test**: Log in and view dashboard with statistics tiles and project list

### Implementation for User Story 2

- [ ] T066 [P] [US2] Create main route group layout in `src/app/(main)/layout.tsx`
- [ ] T067 [P] [US2] Create TopNavigation component in `src/components/layout/TopNavigation/TopNavigation.tsx`
- [ ] T068 [P] [US2] Create Logo component in `src/components/layout/TopNavigation/Logo.tsx`
- [ ] T069 [P] [US2] Create AIAssistantIcon with breathing animation in `src/components/layout/TopNavigation/AIAssistantIcon.tsx`
- [ ] T070 [P] [US2] Create NotificationsIcon component in `src/components/layout/TopNavigation/NotificationsIcon.tsx`
- [ ] T071 [P] [US2] Create LanguageSelector component in `src/components/layout/TopNavigation/LanguageSelector.tsx`
- [ ] T072 [P] [US2] Create Sidebar component in `src/components/layout/Sidebar/Sidebar.tsx`
- [ ] T073 [P] [US2] Create SidebarMenu component in `src/components/layout/Sidebar/SidebarMenu.tsx`
- [ ] T074 [P] [US2] Create SidebarMenuItem component in `src/components/layout/Sidebar/SidebarMenuItem.tsx`
- [ ] T075 [P] [US2] Create SidebarUserSection component in `src/components/layout/Sidebar/SidebarUserSection.tsx`
- [ ] T076 [P] [US2] Create MobileSidebar component in `src/components/layout/Sidebar/MobileSidebar.tsx`
- [ ] T077 [US2] Create MainLayout wrapper in `src/components/layout/MainLayout/MainLayout.tsx` (depends on T067, T072)
- [ ] T078 [US2] Create dashboard page in `src/app/(main)/dashboard/page.tsx` (depends on T077)
- [ ] T079 [P] [US2] Create StatsCards container in `src/components/dashboard/StatsCards/StatsCards.tsx`
- [ ] T080 [P] [US2] Create StatCard component in `src/components/dashboard/StatsCards/StatCard.tsx`
- [ ] T081 [P] [US2] Create ActiveProjectsList in `src/components/dashboard/ActiveProjects/ActiveProjectsList.tsx`
- [ ] T082 [P] [US2] Create ProjectCard component in `src/components/dashboard/ActiveProjects/ProjectCard.tsx`
- [ ] T083 [P] [US2] Create EmptyProjectsState component in `src/components/dashboard/ActiveProjects/EmptyProjectsState.tsx`
- [ ] T084 [P] [US2] Create GraphQL query for dashboard stats in `src/lib/graphql/queries/dashboard.ts`
- [ ] T085 [P] [US2] Create GraphQL query for my projects in `src/lib/graphql/queries/projects.ts`
- [ ] T086 [US2] Create useDashboardStats hook in `src/hooks/queries/useDashboardStats.ts` (depends on T084)
- [ ] T087 [US2] Create useMyProjects hook in `src/hooks/queries/useProjects.ts` (depends on T085)
- [ ] T088 [US2] Integrate stats data into dashboard (depends on T078, T086)
- [ ] T089 [US2] Integrate projects list into dashboard (depends on T078, T087)
- [ ] T090 [US2] Implement role-based menu filtering in sidebar (depends on T073, T046)
- [ ] T091 [US2] Add responsive mobile navigation (depends on T076)
- [ ] T092 [US2] Implement sidebar collapse functionality (depends on T072, T022)

**Checkpoint**: ✅ US2 Complete - Dashboard displays statistics and active projects with responsive navigation

---

## Phase 5: User Story 3 - Project Creation and Document Upload (Priority: P1) 🎯 MVP

**Goal**: Enable users to create projects and upload documents to S3  
**Independent Test**: Create new project with various document types and verify S3 upload

### Implementation for User Story 3

- [ ] T093 [US3] Create projects index page in `src/app/(main)/projects/page.tsx` (depends on T077)
- [ ] T094 [US3] Create new project page in `src/app/(main)/projects/new/page.tsx` (depends on T077)
- [ ] T095 [P] [US3] Create ProjectForm container in `src/components/projects/ProjectForm/ProjectForm.tsx`
- [ ] T096 [P] [US3] Create ProjectBasicInfo component in `src/components/projects/ProjectForm/ProjectBasicInfo.tsx`
- [ ] T097 [P] [US3] Create DocumentUpload component in `src/components/projects/ProjectForm/DocumentUpload.tsx`
- [ ] T098 [P] [US3] Create KnowledgeBaseSelector component in `src/components/projects/ProjectForm/KnowledgeBaseSelector.tsx`
- [ ] T099 [P] [US3] Create ProjectMemberSelector component in `src/components/projects/ProjectForm/ProjectMemberSelector.tsx`
- [ ] T100 [P] [US3] Create FileDropzone component in `src/components/common/FileUpload/FileDropzone.tsx`
- [ ] T101 [P] [US3] Create FilePreview component in `src/components/common/FileUpload/FilePreview.tsx`
- [ ] T102 [P] [US3] Create GraphQL createProject mutation in `src/lib/graphql/mutations/projects.ts`
- [ ] T103 [P] [US3] Create GraphQL generatePresignedUrls mutation in `src/lib/graphql/mutations/projects.ts`
- [ ] T104 [P] [US3] Create S3 upload utilities in `src/lib/api/s3.ts`
- [ ] T105 [US3] Create useCreateProject hook in `src/hooks/mutations/useCreateProject.ts` (depends on T102)
- [ ] T106 [US3] Create useGetPresignedUrl hook in `src/hooks/mutations/useGetPresignedUrl.ts` (depends on T103)
- [ ] T107 [US3] Create useFileUpload hook in `src/hooks/useFileUpload.ts` (depends on T104, T024)
- [ ] T108 [US3] Implement project form validation with Zod (depends on T095, T028)
- [ ] T109 [US3] Integrate createProject mutation (depends on T095, T105)
- [ ] T110 [US3] Implement file validation (type, size) (depends on T097, T044)
- [ ] T111 [US3] Implement presigned URL generation (depends on T097, T106)
- [ ] T112 [US3] Implement direct S3 upload with progress tracking (depends on T097, T107)
- [ ] T113 [US3] Add chunked upload support for large files (>100MB) (depends on T107)
- [ ] T114 [US3] Implement upload queue and concurrent uploads (depends on T107, T024)
- [ ] T115 [US3] Add upload error handling and retry logic (depends on T112)
- [ ] T116 [US3] Create project document records after successful upload (depends on T112)
- [ ] T117 [US3] Transition UI to workflow interface after project creation (depends on T094)

**Checkpoint**: ✅ US3 Complete - Users can create projects and upload documents to S3

---

## Phase 6: User Story 4 - Real-time Agent Workflow Visualization (Priority: P1) 🎯 MVP

**Goal**: Display real-time AI agent workflow progress with SSE updates  
**Independent Test**: Trigger agent workflow and observe real-time SSE updates in UI

### Implementation for User Story 4

- [ ] T118 [US4] Create project detail page in `src/app/(main)/projects/[projectId]/page.tsx` (depends on T077)
- [ ] T119 [P] [US4] Create WorkflowProgress component in `src/components/projects/ProjectWorkflow/WorkflowProgress.tsx`
- [ ] T120 [P] [US4] Create WorkflowStep component in `src/components/projects/ProjectWorkflow/WorkflowStep.tsx`
- [ ] T121 [P] [US4] Create WorkflowStepIndicator with animations in `src/components/projects/ProjectWorkflow/WorkflowStepIndicator.tsx`
- [ ] T122 [P] [US4] Create AgentChatInterface component in `src/components/projects/AgentChat/AgentChatInterface.tsx`
- [ ] T123 [P] [US4] Create ChatMessage component in `src/components/projects/AgentChat/ChatMessage.tsx`
- [ ] T124 [P] [US4] Create ChatInput component in `src/components/projects/AgentChat/ChatInput.tsx`
- [ ] T125 [P] [US4] Create StreamingIndicator component in `src/components/projects/AgentChat/StreamingIndicator.tsx`
- [ ] T126 [P] [US4] Create AgentThinking component in `src/components/projects/AgentChat/AgentThinking.tsx`
- [ ] T127 [P] [US4] Create API route for AgentCore proxy in `src/app/api/workflow-agents/invocations/route.ts`
- [ ] T128 [P] [US4] Create SSE client utilities in `src/lib/api/sse-client.ts`
- [ ] T129 [P] [US4] Create AgentCore API client in `src/lib/api/workflow-agents.ts`
- [ ] T130 [P] [US4] Create GraphQL query for workflow execution in `src/lib/graphql/queries/workflow.ts`
- [ ] T131 [P] [US4] Create GraphQL query for agent tasks in `src/lib/graphql/queries/workflow.ts`
- [ ] T132 [US4] Create useWorkflowExecution hook in `src/hooks/queries/useWorkflowExecution.ts` (depends on T130)
- [ ] T133 [US4] Create useAgentTasks hook in `src/hooks/queries/useAgentTasks.ts` (depends on T131)
- [ ] T134 [US4] Create useTriggerAgentExecution mutation hook in `src/hooks/mutations/useTriggerAgentExecution.ts` (depends on T129)
- [ ] T135 [US4] Create useWorkflowStream hook in `src/hooks/streams/useWorkflowStream.ts` (depends on T128)
- [ ] T136 [US4] Implement SSE event handlers for all 23 event types (depends on T135)
- [ ] T137 [US4] Integrate workflow progress bar with SSE updates (depends on T119, T136)
- [ ] T138 [US4] Integrate chat interface with SSE messages (depends on T122, T136)
- [ ] T139 [US4] Implement TanStack Query cache updates from SSE events (depends on T136)
- [ ] T140 [US4] Add SSE reconnection logic with exponential backoff (depends on T135)
- [ ] T141 [US4] Implement workflow status indicators (Open, InProgress, Waiting, Completed, Failed) (depends on T121)
- [ ] T142 [US4] Add chat input disable/enable based on workflow state (depends on T124, T136)
- [ ] T143 [US4] Implement error display in chat interface (depends on T122, T136)
- [ ] T144 [US4] Add workflow failure handling and retry options (depends on T118, T136)

**Checkpoint**: ✅ US4 Complete - Real-time agent workflow visualization with SSE streaming

---

## Phase 7: User Story 5 - Artifact Review and Editing (Priority: P1) 🎯 MVP

**Goal**: Enable users to review and edit AI-generated artifacts  
**Independent Test**: Click on artifacts, edit content, and save changes

### Implementation for User Story 5

- [ ] T145 [P] [US5] Install TipTap v2.10.4 and extensions
- [ ] T146 [P] [US5] Create ArtifactTile component in `src/components/projects/ArtifactViewer/ArtifactTile.tsx`
- [ ] T147 [P] [US5] Create ArtifactModal component in `src/components/projects/ArtifactViewer/ArtifactModal.tsx`
- [ ] T148 [P] [US5] Create ArtifactRenderer component in `src/components/projects/ArtifactViewer/ArtifactRenderer.tsx`
- [ ] T149 [P] [US5] Create RichTextEditor component in `src/components/editor/RichTextEditor.tsx`
- [ ] T150 [P] [US5] Create MenuBar component in `src/components/editor/MenuBar/MenuBar.tsx`
- [ ] T151 [P] [US5] Create BlockFormatMenu in `src/components/editor/MenuBar/BlockFormatMenu.tsx`
- [ ] T152 [P] [US5] Create TextStyleMenu in `src/components/editor/MenuBar/TextStyleMenu.tsx`
- [ ] T153 [P] [US5] Create ListMenu in `src/components/editor/MenuBar/ListMenu.tsx`
- [ ] T154 [P] [US5] Create AlignmentMenu in `src/components/editor/MenuBar/AlignmentMenu.tsx`
- [ ] T155 [P] [US5] Create InsertMenu in `src/components/editor/MenuBar/InsertMenu.tsx`
- [ ] T156 [P] [US5] Create CustomBubbleMenu in `src/components/editor/BubbleMenu/CustomBubbleMenu.tsx`
- [ ] T157 [P] [US5] Create CustomFloatingMenu in `src/components/editor/FloatingMenu/CustomFloatingMenu.tsx`
- [ ] T158 [P] [US5] Configure TipTap extensions in `src/lib/editor/tiptap/extensions.ts`
- [ ] T159 [P] [US5] Create TipTap config in `src/lib/editor/tiptap/config.ts`
- [ ] T160 [P] [US5] Create TipTap helpers in `src/lib/editor/tiptap/helpers.ts`
- [ ] T161 [P] [US5] Create editor adapter in `src/lib/editor/adapter.ts`
- [ ] T162 [P] [US5] Create useEditor hook in `src/hooks/useEditor.ts`
- [ ] T163 [P] [US5] Create DocumentEditor component in `src/components/projects/ArtifactViewer/editors/DocumentEditor/DocumentEditor.tsx`
- [ ] T164 [P] [US5] Create QAEditor component in `src/components/projects/ArtifactViewer/editors/QAEditor/QAEditor.tsx`
- [ ] T165 [P] [US5] Create QAItem component in `src/components/projects/ArtifactViewer/editors/QAEditor/QAItem.tsx`
- [ ] T166 [P] [US5] Create GraphQL query for artifacts in `src/lib/graphql/queries/artifacts.ts`
- [ ] T167 [P] [US5] Create GraphQL mutation for updating artifacts in `src/lib/graphql/mutations/artifacts.ts`
- [ ] T168 [US5] Create useArtifacts hook in `src/hooks/queries/useArtifacts.ts` (depends on T166)
- [ ] T169 [US5] Create useUpdateArtifact mutation hook in `src/hooks/mutations/useUpdateArtifact.ts` (depends on T167)
- [ ] T170 [US5] Integrate artifact tiles with SSE artifacts_ready event (depends on T146, T136)
- [ ] T171 [US5] Implement modal open/close logic (depends on T147)
- [ ] T172 [US5] Integrate document editor with TipTap (depends on T163, T162)
- [ ] T173 [US5] Integrate Q&A editor with custom component (depends on T164)
- [ ] T174 [US5] Implement draft saving to Zustand store (depends on T023, T171)
- [ ] T175 [US5] Implement send edited artifacts with chat message (depends on T122, T134, T174)
- [ ] T176 [US5] Add artifact version tracking (depends on T168, T169)

**Checkpoint**: ✅ US5 Complete - Users can review and edit AI-generated artifacts

---

## Phase 8: User Story 6 - Knowledge Base Management (Priority: P2)

**Goal**: Enable users to create and manage knowledge bases  
**Independent Test**: Create knowledge base, upload documents, and search documents

### Implementation for User Story 6

- [ ] T177 [US6] Create knowledge bases index page in `src/app/(main)/knowledge-bases/page.tsx` (depends on T077)
- [ ] T178 [US6] Create new KB page in `src/app/(main)/knowledge-bases/new/page.tsx` (depends on T077)
- [ ] T179 [US6] Create KB detail page in `src/app/(main)/knowledge-bases/[knowledgeBaseId]/page.tsx` (depends on T077)
- [ ] T180 [P] [US6] Create KnowledgeBaseList component in `src/components/knowledge-bases/KnowledgeBaseList/KnowledgeBaseList.tsx`
- [ ] T181 [P] [US6] Create KnowledgeBaseTile component in `src/components/knowledge-bases/KnowledgeBaseList/KnowledgeBaseTile.tsx`
- [ ] T182 [P] [US6] Create EmptyKnowledgeBaseState component in `src/components/knowledge-bases/KnowledgeBaseList/EmptyKnowledgeBaseState.tsx`
- [ ] T183 [P] [US6] Create KnowledgeBaseForm component in `src/components/knowledge-bases/KnowledgeBaseForm/KnowledgeBaseForm.tsx`
- [ ] T184 [P] [US6] Create KBBasicInfo component in `src/components/knowledge-bases/KnowledgeBaseForm/KBBasicInfo.tsx`
- [ ] T185 [P] [US6] Create KBTypeSelector component in `src/components/knowledge-bases/KnowledgeBaseForm/KBTypeSelector.tsx`
- [ ] T186 [P] [US6] Create KBProjectSelector component in `src/components/knowledge-bases/KnowledgeBaseForm/KBProjectSelector.tsx`
- [ ] T187 [P] [US6] Create KBDocumentUpload component in `src/components/knowledge-bases/KnowledgeBaseForm/KBDocumentUpload.tsx`
- [ ] T188 [P] [US6] Create KBDetails component in `src/components/knowledge-bases/KnowledgeBaseDetails/KBDetails.tsx`
- [ ] T189 [P] [US6] Create KBDocumentList component in `src/components/knowledge-bases/KnowledgeBaseDetails/KBDocumentList.tsx`
- [ ] T190 [P] [US6] Create KBDocumentSearch component in `src/components/knowledge-bases/KnowledgeBaseDetails/KBDocumentSearch.tsx`
- [ ] T191 [P] [US6] Create GraphQL KB queries in `src/lib/graphql/queries/knowledgeBases.ts`
- [ ] T192 [P] [US6] Create GraphQL KB mutations in `src/lib/graphql/mutations/knowledgeBases.ts`
- [ ] T193 [US6] Create useKnowledgeBases hook in `src/hooks/queries/useKnowledgeBases.ts` (depends on T191)
- [ ] T194 [US6] Create useCreateKnowledgeBase mutation hook in `src/hooks/mutations/useCreateKnowledgeBase.ts` (depends on T192)
- [ ] T195 [US6] Integrate KB list with GraphQL data (depends on T177, T193)
- [ ] T196 [US6] Implement KB form validation (depends on T183)
- [ ] T197 [US6] Integrate KB creation with S3 upload (depends on T183, T194, T107)
- [ ] T198 [US6] Implement KB document search functionality (depends on T190, T193)
- [ ] T199 [US6] Add role-based KB access filtering (depends on T180, T046)

**Checkpoint**: ✅ US6 Complete - Users can create and manage knowledge bases

---

## Phase 9: User Story 7 - User Management and Role Assignment (Priority: P2)

**Goal**: Enable admins to create users and assign roles  
**Independent Test**: Admin user creates new users and assigns roles

### Implementation for User Story 7

- [ ] T200 [US7] Create users index page in `src/app/(main)/users/page.tsx` (depends on T077)
- [ ] T201 [US7] Create new user page in `src/app/(main)/users/new/page.tsx` (depends on T077)
- [ ] T202 [US7] Create user detail page in `src/app/(main)/users/[userId]/page.tsx` (depends on T077)
- [ ] T203 [P] [US7] Create UserList component in `src/components/users/UserList/UserList.tsx`
- [ ] T204 [P] [US7] Create UserListItem component in `src/components/users/UserList/UserListItem.tsx`
- [ ] T205 [P] [US7] Create UserSearch component in `src/components/users/UserList/UserSearch.tsx`
- [ ] T206 [P] [US7] Create UserQuickActions component in `src/components/users/UserList/UserQuickActions.tsx`
- [ ] T207 [P] [US7] Create UserForm component in `src/components/users/UserForm/UserForm.tsx`
- [ ] T208 [P] [US7] Create UserBasicInfo component in `src/components/users/UserForm/UserBasicInfo.tsx`
- [ ] T209 [P] [US7] Create UserRoleSelector component in `src/components/users/UserForm/UserRoleSelector.tsx`
- [ ] T210 [P] [US7] Create ProfileImageUpload component in `src/components/users/UserForm/ProfileImageUpload.tsx`
- [ ] T211 [P] [US7] Create UserProfile component in `src/components/users/UserDetails/UserProfile.tsx`
- [ ] T212 [P] [US7] Create UserRolesPermissions component in `src/components/users/UserDetails/UserRolesPermissions.tsx`
- [ ] T213 [P] [US7] Create UserProjects component in `src/components/users/UserDetails/UserProjects.tsx`
- [ ] T214 [P] [US7] Create GraphQL user queries in `src/lib/graphql/queries/users.ts`
- [ ] T215 [P] [US7] Create GraphQL user mutations in `src/lib/graphql/mutations/users.ts`
- [ ] T216 [US7] Create useUsers hook in `src/hooks/queries/useUsers.ts` (depends on T214)
- [ ] T217 [US7] Create useCreateUser mutation hook in `src/hooks/mutations/useCreateUser.ts` (depends on T215)
- [ ] T218 [US7] Create usePermissions hook in `src/hooks/usePermissions.ts` (depends on T046)
- [ ] T219 [US7] Integrate user list with GraphQL (depends on T200, T216)
- [ ] T220 [US7] Implement user creation with Cognito (depends on T207, T217, T013)
- [ ] T221 [US7] Implement role assignment logic (depends on T209, T217)
- [ ] T222 [US7] Add profile image upload to S3 (depends on T210, T107)
- [ ] T223 [US7] Implement user search and filtering (depends on T205, T216)
- [ ] T224 [US7] Add project assignment functionality (depends on T213)
- [ ] T225 [US7] Implement role-based UI restrictions (depends on T200, T218)

**Checkpoint**: ✅ US7 Complete - Admins can create users and assign roles

---

## Phase 10: User Story 8 - System Settings and Configuration (Priority: P3)

**Goal**: Enable users to configure application settings  
**Independent Test**: Access settings pages and modify configurations

### Implementation for User Story 8

- [ ] T226 [US8] Create settings index page in `src/app/(main)/settings/page.tsx` (depends on T077)
- [ ] T227 [US8] Create agents settings page in `src/app/(main)/settings/agents/page.tsx` (depends on T077)
- [ ] T228 [US8] Create integrations settings page in `src/app/(main)/settings/integrations/page.tsx` (depends on T077)
- [ ] T229 [US8] Create system settings page in `src/app/(main)/settings/system/page.tsx` (depends on T077)
- [ ] T230 [P] [US8] Create AgentList component in `src/components/settings/AgentConfiguration/AgentList.tsx`
- [ ] T231 [P] [US8] Create AgentConfigForm component in `src/components/settings/AgentConfiguration/AgentConfigForm.tsx`
- [ ] T232 [P] [US8] Create AgentModelSettings component in `src/components/settings/AgentConfiguration/AgentModelSettings.tsx`
- [ ] T233 [P] [US8] Create IntegrationsList component in `src/components/settings/Integrations/IntegrationsList.tsx`
- [ ] T234 [P] [US8] Create SlackIntegration component in `src/components/settings/Integrations/SlackIntegration.tsx`
- [ ] T235 [P] [US8] Create TwoFactorSettings component in `src/components/settings/SystemSettings/TwoFactorSettings.tsx`
- [ ] T236 [P] [US8] Create TimezoneSettings component in `src/components/settings/SystemSettings/TimezoneSettings.tsx`
- [ ] T237 [P] [US8] Create ThemeSettings component in `src/components/settings/SystemSettings/ThemeSettings.tsx`
- [ ] T238 [P] [US8] Create LanguageSettings component in `src/components/settings/SystemSettings/LanguageSettings.tsx`
- [ ] T239 [P] [US8] Create DataRetentionSettings component in `src/components/settings/SystemSettings/DataRetentionSettings.tsx`
- [ ] T240 [P] [US8] Create GraphQL settings queries in `src/lib/graphql/queries/settings.ts`
- [ ] T241 [P] [US8] Create GraphQL settings mutations in `src/lib/graphql/mutations/settings.ts`
- [ ] T242 [US8] Create useAgentConfigurations hook in `src/hooks/queries/useAgentConfigurations.ts` (depends on T240)
- [ ] T243 [US8] Create useIntegrations hook in `src/hooks/queries/useIntegrations.ts` (depends on T240)
- [ ] T244 [US8] Create useUpdateAgentConfig mutation hook in `src/hooks/mutations/useUpdateAgentConfig.ts` (depends on T241)
- [ ] T245 [US8] Create useUpdateIntegration mutation hook in `src/hooks/mutations/useUpdateIntegration.ts` (depends on T241)
- [ ] T246 [US8] Integrate agent config with GraphQL (depends on T227, T242, T244)
- [ ] T247 [US8] Integrate integrations with GraphQL (depends on T228, T243, T245)
- [ ] T248 [US8] Implement theme switching with CSS variables (depends on T237, T037, T022)
- [ ] T249 [US8] Implement language switching (depends on T238, T022)
- [ ] T250 [US8] Add Slack integration configuration (depends on T234, T245)
- [ ] T251 [US8] Implement data retention settings (depends on T239)

**Checkpoint**: ✅ US8 Complete - Users can configure application settings

---

## Phase 11: User Story 9 - Infrastructure and Deployment Pipeline (Priority: P1) 🎯 MVP

**Goal**: Automate infrastructure provisioning and deployment  
**Independent Test**: Deploy CDK stack, build Docker images, and deploy to ECS

### Implementation for User Story 9

- [ ] T252 [P] [US9] Create Dockerfile.dev in `infra/docker/apps/web/Dockerfile.dev`
- [ ] T253 [P] [US9] Create production Dockerfile in `infra/docker/apps/web/Dockerfile`
- [ ] T254 [P] [US9] Configure Next.js for standalone output in `apps/web/next.config.js`
- [ ] T255 [P] [US9] Create Docker Compose for local dev in `infra/docker/docker-compose.yml`
- [ ] T256 [P] [US9] Create CDK app entry in `infra/cdk/bin/app.ts`
- [ ] T257 [P] [US9] Create CognitoStack in `infra/cdk/lib/cognito-stack.ts`
- [ ] T258 [P] [US9] Configure Cognito User Pool with username/password (depends on T257)
- [ ] T259 [P] [US9] Configure Google OAuth provider in Cognito (depends on T257)
- [ ] T260 [P] [US9] Create CDK outputs for frontend config (depends on T257)
- [ ] T261 [P] [US9] Create GitHub Actions workflow in `.github/workflows/deploy-frontend.yml`
- [ ] T262 [US9] Configure build step in GitHub Actions (depends on T261)
- [ ] T263 [US9] Configure ECR push step in GitHub Actions (depends on T261)
- [ ] T264 [US9] Configure ECS deployment step in GitHub Actions (depends on T261)
- [ ] T265 [P] [US9] Create Makefile in project root with targets
- [ ] T266 [US9] Add make target for building dev Docker image (depends on T265, T252)
- [ ] T267 [US9] Add make target for building prod Docker image (depends on T265, T253)
- [ ] T268 [US9] Add make target for running dev environment (depends on T265, T255)
- [ ] T269 [US9] Add make target for CDK deployment (depends on T265, T257)
- [ ] T270 [US9] Add make target for ECS deployment (depends on T265)
- [ ] T271 [US9] Add make target for tests (depends on T265)
- [ ] T272 [P] [US9] Create health check endpoint in `src/app/api/health/route.ts`
- [ ] T273 [P] [US9] Create deployment documentation in `infra/cdk/README.md`
- [ ] T274 [US9] Document manual Google OAuth setup steps (depends on T273)
- [ ] T275 [US9] Document environment variable configuration (depends on T273)

**Checkpoint**: ✅ US9 Complete - Infrastructure automation and CI/CD pipeline ready

---

## Phase 12: User Story 10 - Project Collaboration and Notifications (Priority: P3)

**Goal**: Enable project collaboration with notifications  
**Independent Test**: Trigger events and verify notifications appear

### Implementation for User Story 10

- [ ] T276 [P] [US10] Create useNotificationStream hook in `src/hooks/streams/useNotificationStream.ts`
- [ ] T277 [P] [US10] Create GraphQL notification queries in `src/lib/graphql/queries/notifications.ts`
- [ ] T278 [P] [US10] Create GraphQL notification mutations in `src/lib/graphql/mutations/notifications.ts`
- [ ] T279 [P] [US10] Create GraphQL notification subscription in `src/lib/graphql/subscriptions/notifications.ts`
- [ ] T280 [US10] Create useNotifications hook in `src/hooks/queries/useNotifications.ts` (depends on T277)
- [ ] T281 [US10] Create useMarkNotificationRead mutation hook in `src/hooks/mutations/useMarkNotificationRead.ts` (depends on T278)
- [ ] T282 [US10] Integrate notification icon with unread count (depends on T070, T280)
- [ ] T283 [US10] Create notification panel component (depends on T070, T280)
- [ ] T284 [US10] Implement mark as read functionality (depends on T283, T281)
- [ ] T285 [US10] Add notification subscription to Providers (depends on T040, T276, T279)
- [ ] T286 [US10] Integrate workflow completion notifications (depends on T136, T280)

**Checkpoint**: ✅ US10 Complete - Project collaboration and notifications working

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories  
**Duration**: 1-2 weeks

- [ ] T287 [P] [Polish] Create ErrorBoundary component in `src/components/common/ErrorBoundary/ErrorBoundary.tsx`
- [ ] T288 [P] [Polish] Create LoadingSpinner component in `src/components/common/LoadingSpinner/LoadingSpinner.tsx`
- [ ] T289 [P] [Polish] Create ProgressBar component in `src/components/common/ProgressBar/ProgressBar.tsx`
- [ ] T290 [P] [Polish] Create SearchBar component in `src/components/common/SearchBar/SearchBar.tsx`
- [ ] T291 [P] [Polish] Create Pagination component in `src/components/common/Pagination/Pagination.tsx`
- [ ] T292 [P] [Polish] Add loading states to all async operations
- [ ] T293 [P] [Polish] Add error boundaries to all major sections
- [ ] T294 [P] [Polish] Implement proper error messages for all failures
- [ ] T295 [P] [Polish] Add skeleton loaders for all data fetching
- [ ] T296 [P] [Polish] Optimize bundle size and code splitting
- [ ] T297 [P] [Polish] Add performance monitoring with Web Vitals
- [ ] T298 [P] [Polish] Implement accessibility improvements (WCAG 2.1 Level AA)
- [ ] T299 [P] [Polish] Add keyboard navigation support
- [ ] T300 [P] [Polish] Test and fix responsive design across breakpoints
- [ ] T301 [P] [Polish] Optimize animations for 60fps performance
- [ ] T302 [P] [Polish] Add proper SEO meta tags
- [ ] T303 [P] [Polish] Create comprehensive README in `apps/web/README.md`
- [ ] T304 [P] [Polish] Document all environment variables in `.env.example`
- [ ] T305 [P] [Polish] Create API documentation for GraphQL operations
- [ ] T306 [P] [Polish] Create component documentation with examples
- [ ] T307 [P] [Polish] Verify quickstart.md is up-to-date and working
- [ ] T308 [P] [Polish] Add proper logging throughout application
- [ ] T309 [P] [Polish] Implement proper error tracking
- [ ] T310 [P] [Polish] Security audit and vulnerability fixes
- [ ] T311 [P] [Polish] Performance testing and optimization
- [ ] T312 [P] [Polish] Cross-browser compatibility testing
- [ ] T313 [P] [Polish] Mobile device testing (iOS and Android)
- [ ] T314 [P] [Polish] Load testing with 1000 concurrent users
- [ ] T315 [P] [Polish] Final QA pass on all user stories

**Checkpoint**: ✅ Application polished and production-ready

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: No dependencies - start immediately
2. **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
3. **User Stories (Phase 3-12)**: All depend on Foundational completion
   - US1, US3, US4, US5, US9 are P1 (MVP) - implement first
   - US2, US6, US7 are P2 - implement next
   - US8, US10 are P3 - implement last
4. **Polish (Phase 13)**: Depends on all desired user stories

### User Story Dependencies

- **US1 (Auth)**: Independent after Foundational
- **US2 (Dashboard)**: Depends on US1 (auth required)
- **US3 (Project Creation)**: Depends on US1 (auth required)
- **US4 (Workflow Viz)**: Depends on US3 (projects required)
- **US5 (Artifacts)**: Depends on US4 (workflow required)
- **US6 (Knowledge Bases)**: Independent after Foundational
- **US7 (User Management)**: Depends on US1 (auth + admin role)
- **US8 (Settings)**: Depends on US1 (auth required)
- **US9 (Infrastructure)**: Independent (can run in parallel)
- **US10 (Notifications)**: Depends on US1, US3 (auth + projects)

### MVP Critical Path

For fastest path to working MVP:

1. Phase 1: Setup (T001-T010)
2. Phase 2: Foundational (T011-T047)
3. Phase 3: US1 Auth (T048-T065)
4. Phase 5: US3 Project Creation (T093-T117)
5. Phase 6: US4 Workflow Viz (T118-T144)
6. Phase 7: US5 Artifacts (T145-T176)
7. Phase 11: US9 Infrastructure (T252-T275)
8. Phase 4: US2 Dashboard (T066-T092) - can be done last for MVP

**MVP Timeline**: ~5-6 weeks with 2 developers working in parallel

### Parallel Opportunities

**After Foundational (Phase 2) completes**:

- Developer A: US1 → US3 → US4 → US5 (core workflow)
- Developer B: US9 → US2 → US6 (infrastructure + supporting features)

**After MVP completes**:

- Developer A: US7 (User Management)
- Developer B: US8 (Settings)
- Both: US10 (Notifications) + Phase 13 (Polish)

---

## Implementation Strategy

### MVP First (Core Workflow)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete US1: Authentication
4. Complete US3: Project Creation
5. Complete US4: Workflow Visualization
6. Complete US5: Artifact Editing
7. Complete US9: Infrastructure
8. Complete US2: Dashboard
9. **STOP and VALIDATE**: Test complete workflow end-to-end
10. Deploy MVP to staging

### Incremental Delivery

After MVP:

1. Add US6: Knowledge Bases → Test → Deploy
2. Add US7: User Management → Test → Deploy
3. Add US8: Settings → Test → Deploy
4. Add US10: Notifications → Test → Deploy
5. Complete Phase 13: Polish → Final QA → Production Deploy

---

## Testing Notes

Tests are NOT included in this breakdown but should be added as needed:

- Unit tests: Jest + React Testing Library
- Integration tests: Mock GraphQL + SSE
- E2E tests: Playwright for critical flows
- Contract tests: Validate GraphQL schema alignment

Recommended test coverage:

- Unit: 70%+ for utilities, hooks, components
- Integration: All GraphQL operations and SSE events
- E2E: Auth flow, project creation, workflow execution, artifact editing

---

## Notes

- Each task should take 2-4 hours
- [P] tasks can run in parallel
- Tasks without [P] have dependencies (see task descriptions)
- MVP = User Stories 1, 2, 3, 4, 5, 9 (90 tasks)
- All paths relative to `apps/web/` directory
- GraphQL operations must match contracts in `specs/001-create-a-cutting/contracts/`
- SSE events must match types in `specs/001-create-a-cutting/contracts/sse-events.md`
- Components should use shadcn/ui primitives where applicable
- All animations should target 60fps using GPU-accelerated properties
- Role-based access control must be enforced at both UI and middleware level