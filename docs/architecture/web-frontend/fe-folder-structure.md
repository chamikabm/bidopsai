# Folder structure

```
bid-automation-platform/
├── src/
│   ├── app/
│   │   ├── (auth)/                                    # Route group: Authentication pages with full-screen layout
│   │   │   ├── layout.tsx                             # Auth layout: futuristic animated background, centered forms
│   │   │   ├── signin/
│   │   │   │   └── page.tsx                           # Sign in: Cognito username/password + Google OAuth
│   │   │   └── signup/
│   │   │       └── page.tsx                           # Sign up: Create new Cognito user
│   │   ├── (main)/                                    # Route group: Main app pages with sidebar + top nav
│   │   │   ├── layout.tsx                             # Main layout: sidebar, top navigation, content area
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                           # Landing page: stats cards + active projects list
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx                           # List all projects with search, filters, pagination
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx                       # Create new project: form + workflow processing UI
│   │   │   │   └── [projectId]/
│   │   │   │       └── page.tsx                       # Project details: workflow progress, agent chat, artifacts
│   │   │   ├── knowledge-bases/
│   │   │   │   ├── page.tsx                           # List all knowledge bases (global + local sections)
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx                       # Create new knowledge base form
│   │   │   │   └── [knowledgeBaseId]/
│   │   │   │       └── page.tsx                       # KB details: document list, search documents
│   │   │   ├── users/
│   │   │   │   ├── page.tsx                           # List all users with search and quick actions
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx                       # Add new user to Cognito user pool
│   │   │   │   └── [userId]/
│   │   │   │       └── page.tsx                       # User details: profile, roles, permissions, projects
│   │   │   └── settings/
│   │   │       ├── page.tsx                           # Settings home (redirects to agents)
│   │   │       ├── agents/
│   │   │       │   └── page.tsx                       # Configure agent models, temperatures, parameters
│   │   │       ├── integrations/
│   │   │       │   └── page.tsx                       # Manage integrations: Slack, email, etc.
│   │   │       └── system/
│   │   │           └── page.tsx                       # System settings: 2FA, timezone, theme, language, data retention
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts                       # NextAuth.js with Cognito provider (username/password + Google)
│   │   │   ├── graphql/
│   │   │   │   └── route.ts                           # GraphQL proxy to backend (all CRUD operations)
│   │   │   └── agent-core/
│   │   │       └── invocations/
│   │   │           └── route.ts                       # Proxy to AWS AgentCore /invocations endpoint (SSE streams)
│   │   ├── layout.tsx                                 # Root layout: providers, fonts, metadata
│   │   ├── page.tsx                                   # Root page: redirects to /dashboard or /signin
│   │   ├── globals.css                                # Global styles: Tailwind directives, CSS resets
│   │   └── not-found.tsx                              # 404 page
│   ├── components/
│   │   ├── ui/                                        # shadcn/ui components (installed via npx shadcn@latest add)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── table.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── sheet.tsx                              # Mobile drawer/sidebar
│   │   │   ├── scroll-area.tsx
│   │   │   └── command.tsx                            # Command palette (Cmd+K style search)
│   │   ├── layout/
│   │   │   ├── TopNavigation/
│   │   │   │   ├── TopNavigation.tsx                  # Top bar: logo, AI assistant, notifications, language selector
│   │   │   │   ├── AIAssistantIcon.tsx                # Glowing/breathing animated icon (changes with theme)
│   │   │   │   ├── NotificationsIcon.tsx              # Bell icon with unread count badge
│   │   │   │   ├── LanguageSelector.tsx               # Dropdown: EN (US), EN (AU), etc.
│   │   │   │   └── Logo.tsx                           # Company logo (top-left corner)
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.tsx                        # Left sidebar: collapsible, menu items + user section
│   │   │   │   ├── SidebarMenu.tsx                    # Menu: Dashboard, Projects, KBs, Users (filtered by role)
│   │   │   │   ├── SidebarMenuItem.tsx                # Single menu item with icon, label, sub-items
│   │   │   │   ├── SidebarUserSection.tsx             # Bottom: user avatar, name, role, settings, logout
│   │   │   │   └── MobileSidebar.tsx                  # Mobile: burger menu icon + drawer (using sheet)
│   │   │   └── MainLayout/
│   │   │       └── MainLayout.tsx                     # Main layout wrapper: combines top nav + sidebar + content
│   │   ├── auth/
│   │   │   ├── SignInForm/
│   │   │   │   └── SignInForm.tsx                     # Cognito username/password + Google sign-in
│   │   │   ├── SignUpForm/
│   │   │   │   └── SignUpForm.tsx                     # Cognito user registration form
│   │   │   ├── AuthBackground/
│   │   │   │   └── AuthBackground.tsx                 # Full-screen futuristic CSS animations
│   │   │   └── SocialAuth/
│   │   │       └── GoogleSignIn.tsx                   # Google OAuth button for Cognito
│   │   ├── dashboard/
│   │   │   ├── StatsCards/
│   │   │   │   ├── StatsCards.tsx                     # Container for stat cards
│   │   │   │   └── StatCard.tsx                       # Single stat: Submitted Bids, Won Bids, Total Value, Active Projects
│   │   │   └── ActiveProjects/
│   │   │       ├── ActiveProjectsList.tsx             # List of user's active/assigned projects
│   │   │       ├── ProjectCard.tsx                    # Project card with title, status, deadline
│   │   │       └── EmptyProjectsState.tsx             # Empty state: button to create first project
│   │   ├── projects/
│   │   │   ├── ProjectList/
│   │   │   │   ├── ProjectList.tsx                    # Main list component with table/grid view
│   │   │   │   ├── ProjectListItem.tsx                # Single row/card: name, status, deadline, members
│   │   │   │   ├── ProjectFilters.tsx                 # Filters: status, date range, assigned user
│   │   │   │   └── ProjectSearch.tsx                  # Search bar for projects
│   │   │   ├── ProjectForm/
│   │   │   │   ├── ProjectForm.tsx                    # New project form container
│   │   │   │   ├── ProjectBasicInfo.tsx               # Name, description, deadline inputs
│   │   │   │   ├── DocumentUpload.tsx                 # Upload: Word, Excel, PDF, Audio, Video (to S3 via presigned URL)
│   │   │   │   ├── KnowledgeBaseSelector.tsx          # Multi-select: search and select KBs (local/global)
│   │   │   │   └── ProjectMemberSelector.tsx          # Add users to project
│   │   │   ├── ProjectWorkflow/
│   │   │   │   ├── WorkflowProgress.tsx               # Top progress bar: 8 steps (Parse → Analysis → Content → Compliance → QA → Comms → Submission)
│   │   │   │   ├── WorkflowStep.tsx                   # Single step with status indicator
│   │   │   │   └── WorkflowStepIndicator.tsx          # Animated icon for each step (Open, InProgress, Waiting, Completed, Failed)
│   │   │   ├── AgentChat/
│   │   │   │   ├── AgentChatInterface.tsx             # Chat UI: messages + input (SSE streaming from AgentCore)
│   │   │   │   ├── ChatMessage.tsx                    # Single message: agent or user, with timestamp
│   │   │   │   ├── ChatInput.tsx                      # Text input + send button (disabled while streaming)
│   │   │   │   ├── StreamingIndicator.tsx             # Dots animation while agent is streaming
│   │   │   │   └── AgentThinking.tsx                  # Visual indicator when agent is processing
│   │   │   ├── ArtifactViewer/
│   │   │   │   ├── ArtifactTile.tsx                   # Clickable tile for each artifact (streamed from agents)
│   │   │   │   ├── ArtifactModal.tsx                  # Popup window for editing artifacts
│   │   │   │   ├── ArtifactRenderer.tsx               # Renders different artifact types appropriately
│   │   │   │   └── editors/
│   │   │   │       ├── DocumentEditor/
│   │   │   │       │   └── DocumentEditor.tsx         # Rich text editor for worddoc/pdf (TipTap JSON format)
│   │   │   │       ├── QAEditor/
│   │   │   │       │   ├── QAEditor.tsx               # Q&A format: question, proposed_answer, past_answers
│   │   │   │       │   └── QAItem.tsx                 # Single Q&A item with editable fields
│   │   │   │       └── ExcelEditor/
│   │   │   │           └── ExcelTableEditor.tsx       # Editable table/spreadsheet component (future)
│   │   │   ├── ProjectDetails/
│   │   │   │   ├── ProjectHeader.tsx                  # Project name, status, actions (edit, delete)
│   │   │   │   ├── ProjectInfo.tsx                    # Description, deadline, created date, progress
│   │   │   │   └── ProjectMembers.tsx                 # List of assigned users with avatars, add/remove
│   │   │   └── EmailDraftReview/
│   │   │       └── EmailDraftReview.tsx               # Review email draft from Submission Agent before sending
│   │   ├── editor/                                    # Generic rich text editor (implementation-agnostic)
│   │   │   ├── RichTextEditor.tsx                     # Main editor component (currently uses TipTap)
│   │   │   ├── MenuBar/
│   │   │   │   ├── MenuBar.tsx                        # Toolbar with formatting options
│   │   │   │   ├── BlockFormatMenu.tsx                # Headings, paragraphs, code blocks
│   │   │   │   ├── TextStyleMenu.tsx                  # Bold, italic, underline, strike, code
│   │   │   │   ├── ListMenu.tsx                       # Bullet list, ordered list, task list
│   │   │   │   ├── AlignmentMenu.tsx                  # Left, center, right, justify
│   │   │   │   └── InsertMenu.tsx                     # Insert: image, video, table, horizontal rule
│   │   │   ├── BubbleMenu/
│   │   │   │   └── CustomBubbleMenu.tsx               # Floating menu on text selection
│   │   │   ├── FloatingMenu/
│   │   │   │   └── CustomFloatingMenu.tsx             # Floating menu on empty lines (+ button)
│   │   │   ├── extensions/
│   │   │   │   ├── custom-heading.ts                  # Custom heading styles
│   │   │   │   ├── custom-paragraph.ts                # Custom paragraph formatting
│   │   │   │   ├── custom-list.ts                     # Custom list behavior
│   │   │   │   ├── custom-table.ts                    # Custom table functionality
│   │   │   │   ├── highlight.ts                       # Text highlighting
│   │   │   │   ├── mentions.ts                        # @mentions support
│   │   │   │   └── collaboration.ts                   # Real-time collaboration (future)
│   │   │   └── nodes/
│   │   │       ├── ImageNode.tsx                      # Custom image node with resize
│   │   │       ├── VideoNode.tsx                      # Custom video embed node
│   │   │       └── CalloutNode.tsx                    # Callout/admonition blocks
│   │   ├── knowledge-bases/
│   │   │   ├── KnowledgeBaseList/
│   │   │   │   ├── KnowledgeBaseList.tsx              # Two sections: Global KBs + Local KBs
│   │   │   │   ├── KnowledgeBaseTile.tsx              # Tile: name, description, type, document count, view button
│   │   │   │   └── EmptyKnowledgeBaseState.tsx        # Empty state with create KB button
│   │   │   ├── KnowledgeBaseForm/
│   │   │   │   ├── KnowledgeBaseForm.tsx              # Create KB form container
│   │   │   │   ├── KBBasicInfo.tsx                    # Name, description inputs
│   │   │   │   ├── KBTypeSelector.tsx                 # Radio: Global or Local
│   │   │   │   ├── KBProjectSelector.tsx              # Dropdown: select project (if Local selected)
│   │   │   │   └── KBDocumentUpload.tsx               # Upload documents to KB (S3 via presigned URL)
│   │   │   └── KnowledgeBaseDetails/
│   │   │       ├── KBDetails.tsx                      # KB name, description, type, created date
│   │   │       ├── KBDocumentList.tsx                 # List all documents in KB
│   │   │       └── KBDocumentSearch.tsx               # Search documents within KB
│   │   ├── users/
│   │   │   ├── UserList/
│   │   │   │   ├── UserList.tsx                       # Table of all users
│   │   │   │   ├── UserListItem.tsx                   # Row: avatar, name, email, role, status
│   │   │   │   ├── UserSearch.tsx                     # Search users by name, email, project
│   │   │   │   └── UserQuickActions.tsx               # Quick action buttons: view, edit, delete
│   │   │   ├── UserForm/
│   │   │   │   ├── UserForm.tsx                       # Add/edit user form (creates in Cognito user pool)
│   │   │   │   ├── UserBasicInfo.tsx                  # Name, email, password inputs
│   │   │   │   ├── UserRoleSelector.tsx               # Dropdown: Admin, Drafter, Bidder, KB-Admin, KB-View
│   │   │   │   └── ProfileImageUpload.tsx             # Upload user profile image (to S3)
│   │   │   └── UserDetails/
│   │   │       ├── UserProfile.tsx                    # Avatar, name, email, bio
│   │   │       ├── UserRolesPermissions.tsx           # Display roles and permissions
│   │   │       └── UserProjects.tsx                   # List of assigned projects with add/remove
│   │   ├── settings/
│   │   │   ├── AgentConfiguration/
│   │   │   │   ├── AgentList.tsx                      # List of all agents (Supervisor, Parser, Analysis, Content, Compliance, QA, Comms, Submission)
│   │   │   │   ├── AgentConfigForm.tsx                # Configure single agent: model, temperature, max tokens
│   │   │   │   └── AgentModelSettings.tsx             # Model-specific settings (Claude, GPT, etc.)
│   │   │   ├── Integrations/
│   │   │   │   ├── IntegrationsList.tsx               # List of available integrations
│   │   │   │   └── SlackIntegration.tsx               # Slack configuration: webhook URL, channel, token
│   │   │   └── SystemSettings/
│   │   │       ├── TwoFactorSettings.tsx              # Enable/disable 2FA via Cognito
│   │   │       ├── TimezoneSettings.tsx               # Select timezone for the app
│   │   │       ├── ThemeSettings.tsx                  # Theme selector: Light, Dark, Deloitte, Futuristic
│   │   │       ├── LanguageSettings.tsx               # Language selector: EN (US), EN (AU), etc.
│   │   │       └── DataRetentionSettings.tsx          # Dropdown: retention period (default 30 days)
│   │   ├── common/
│   │   │   ├── FileUpload/
│   │   │   │   ├── FileUpload.tsx                     # Main file upload component (handles S3 presigned URLs)
│   │   │   │   ├── FileDropzone.tsx                   # Drag & drop zone for files
│   │   │   │   └── FilePreview.tsx                    # Preview uploaded files before submission
│   │   │   ├── Pagination/
│   │   │   │   └── Pagination.tsx                     # Page navigation controls
│   │   │   ├── SearchBar/
│   │   │   │   └── SearchBar.tsx                      # Reusable search input with debounce
│   │   │   ├── ErrorBoundary/
│   │   │   │   └── ErrorBoundary.tsx                  # Catch React errors and show fallback UI
│   │   │   ├── LoadingSpinner/
│   │   │   │   └── LoadingSpinner.tsx                 # Loading indicator
│   │   │   └── ProgressBar/
│   │   │       └── ProgressBar.tsx                    # Progress bar component
│   │   └── providers/
│   │       └── Providers.tsx                          # Single provider wrapper (TanStack Query + Theme)
│   ├── hooks/
│   │   ├── queries/                                   # TanStack Query hooks for server data
│   │   │   ├── useProjects.ts                         # Query: fetch projects list via GraphQL
│   │   │   ├── useProject.ts                          # Query: fetch single project via GraphQL
│   │   │   ├── useKnowledgeBases.ts                   # Query: fetch KBs via GraphQL
│   │   │   ├── useUsers.ts                            # Query: fetch users via GraphQL
│   │   │   ├── useArtifacts.ts                        # Query: fetch artifacts via GraphQL
│   │   │   ├── useWorkflowExecution.ts                # Query: fetch workflow execution status
│   │   │   └── useAgentTasks.ts                       # Query: fetch agent task details
│   │   ├── mutations/                                 # TanStack Query mutations
│   │   │   ├── useCreateProject.ts                    # Mutation: create project via GraphQL
│   │   │   ├── useUpdateProject.ts                    # Mutation: update project via GraphQL
│   │   │   ├── useCreateKnowledgeBase.ts              # Mutation: create KB via GraphQL
│   │   │   ├── useCreateUser.ts                       # Mutation: create Cognito user via GraphQL
│   │   │   ├── useUpdateArtifact.ts                   # Mutation: update artifact via GraphQL
│   │   │   ├── useGetPresignedUrl.ts                  # Mutation: get S3 presigned URL via GraphQL
│   │   │   └── useTriggerAgentExecution.ts            # Mutation: trigger AgentCore workflow
│   │   ├── streams/                                   # SSE real-time hooks
│   │   │   ├── useWorkflowStream.ts                   # SSE: agent workflow updates (updates TanStack cache)
│   │   │   └── useNotificationStream.ts               # SSE: notification updates
│   │   ├── useAuth.ts                                 # Cognito auth: login, logout, session
│   │   ├── usePermissions.ts                          # Check user roles/permissions (Admin, Drafter, Bidder, etc.)
│   │   ├── useFileUpload.ts                           # S3 upload via presigned URL
│   │   └── useEditor.ts                               # Rich text editor operations (TipTap abstraction)
│   ├── lib/
│   │   ├── query-client.ts                            # TanStack Query client setup
│   │   ├── auth/
│   │   │   ├── cognito.ts                             # AWS Cognito SDK setup
│   │   │   ├── nextauth.config.ts                     # NextAuth.js config with Cognito provider
│   │   │   └── session.ts                             # Session management utilities
│   │   ├── graphql/
│   │   │   ├── client.ts                              # GraphQL client (graphql-request)
│   │   │   ├── queries/
│   │   │   │   ├── projects.ts                        # GraphQL queries for projects
│   │   │   │   ├── knowledgeBases.ts                  # GraphQL queries for KBs
│   │   │   │   ├── users.ts                           # GraphQL queries for users
│   │   │   │   ├── artifacts.ts                       # GraphQL queries for artifacts
│   │   │   │   └── workflow.ts                        # GraphQL queries for workflow execution
│   │   │   └── mutations/
│   │   │       ├── projects.ts                        # GraphQL mutations for projects
│   │   │       ├── knowledgeBases.ts                  # GraphQL mutations for KBs
│   │   │       ├── users.ts                           # GraphQL mutations for users
│   │   │       ├── artifacts.ts                       # GraphQL mutations for artifacts
│   │   │       └── agentExecution.ts                  # GraphQL mutation to trigger agent workflow
│   │   ├── api/
│   │   │   ├── agent-core.ts                          # AgentCore API client (POST to /invocations)
│   │   │   ├── s3.ts                                  # S3 upload utilities (presigned URLs)
│   │   │   └── sse-client.ts                          # SSE helper for AgentCore streams
│   │   ├── editor/
│   │   │   ├── tiptap/                                # TipTap-specific implementation
│   │   │   │   ├── extensions.ts                      # TipTap extensions configuration
│   │   │   │   ├── config.ts                          # TipTap editor config
│   │   │   │   ├── helpers.ts                         # TipTap helper functions
│   │   │   │   └── utils.ts                           # TipTap utilities
│   │   │   └── adapter.ts                             # Abstraction layer for editor
│   │   └── utils.ts                                   # shadcn/ui utility (cn function)
│   ├── store/                                         # Zustand stores for client-side state
│   │   ├── useUIStore.ts                              # Theme, language, sidebar collapsed
│   │   └── useArtifactDraftStore.ts                   # Unsaved artifact edits before sending to agents
│   ├── types/
│   │   ├── auth.types.ts                              # Auth, Cognito user types
│   │   ├── user.types.ts                              # User, role, permission types (Admin, Drafter, Bidder, KB-Admin, KB-View)
│   │   ├── project.types.ts                           # Project, ProjectDocument, ProjectMember types
│   │   ├── knowledgeBase.types.ts                     # KnowledgeBase types (Global/Local)
│   │   ├── workflow.types.ts                          # WorkflowExecution, AgentTask types (Open, InProgress, Waiting, Completed, Failed)
│   │   ├── agent.types.ts                             # Agent configuration types (8 agents)
│   │   ├── artifact.types.ts                          # Artifact, ArtifactVersion types (worddoc, pdf, excel, q_and_a)
│   │   ├── notification.types.ts                      # Notification types
│   │   ├── editor.types.ts                            # Editor types (TipTap JSON format)
│   │   └── common.types.ts                            # Shared types (API responses, pagination, etc.)
│   ├── utils/
│   │   ├── formatting.ts                              # Format dates, currency, file sizes, etc.
│   │   ├── validation.ts                              # Form validation helpers (Zod schemas)
│   │   ├── date.ts                                    # Date manipulation utilities
│   │   ├── file.ts                                    # File type validation, size checks, MIME types
│   │   ├── constants.ts                               # App constants (roles, agent names, workflow steps)
│   │   ├── permissions.ts                             # Permission checking logic (role-based access)
│   │   ├── helpers.ts                                 # General helper functions
│   │   ├── artifact-converter.ts                      # Convert artifacts between formats (TipTap JSON → Word, PDF)
│   │   └── editor-json-converter.ts                   # Convert editor JSON to/from other formats
│   ├── styles/
│   │   ├── globals.css                                # Global styles: Tailwind @apply, custom classes
│   │   ├── variables.css                              # CSS custom properties (colors, spacing, etc.)
│   │   ├── animations.css                             # CSS keyframe animations (glowing, breathing, etc.)
│   │   ├── editor.css                                 # Editor-specific styles (TipTap)
│   │   └── themes/
│   │       ├── light.css                              # Light theme variables
│   │       ├── dark.css                               # Dark theme variables
│   │       ├── deloitte.css                           # Deloitte brand theme
│   │       └── futuristic.css                         # Futuristic theme (cyberpunk style)
│   └── middleware.ts                                  # Next.js middleware: Cognito auth checks, role-based redirects
├── public/
│   ├── images/
│   │   ├── logo.svg                                   # Company logo
│   │   └── icons/                                     # Custom icon assets
│   ├── fonts/                                         # Custom web fonts
│   └── animations/                                    # Animation assets (Lottie, etc.)
├── .env.local                                         # Local environment variables (Cognito, GraphQL, AgentCore URLs)
├── .env.example                                       # Example env file (commit this)
├── .eslintrc.json                                     # ESLint configuration
├── .prettierrc                                        # Prettier configuration
├── .gitignore                                         # Git ignore rules
├── tsconfig.json                                      # TypeScript configuration
├── next.config.js                                     # Next.js configuration
├── package.json                                       # npm dependencies and scripts
├── tailwind.config.ts                                 # Tailwind CSS configuration
├── postcss.config.js                                  # PostCSS configuration
├── components.json                                    # shadcn/ui configuration
└── README.md                                          # Project documentation
```