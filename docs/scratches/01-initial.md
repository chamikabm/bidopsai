Web Application: bidops.ai

# Intro
Visual Philosophy:

Create a cutting-edge, future-forward design system that feels like a blend of financial trading platforms, AI-powered agentic system, and sci-fi interfaces. Think: Vercel's polish + Linear's precision + cyberpunk aesthetics + Bloomberg Terminal sophistication. Solution must ensure responsive first design allowing users to be able to use this device across any of the devices they prefer.

# Main frameworks
IMPORTANT: When choosing library versions you must ensure there are no known limitations in the libraries, and also all the libraries are compatible with versions. Also support of the animations/responsiveness/themeing are imporant from the user experince perspective, hence make sure you are using the correct versions which are compatible with each other despite the versions mentioned in the following sections, as much as try to use the most stable/less buggy latest version. For the latest library versions you could access context7 api. 

## Core Framework & Libraries
- Node 24+
- React 19+ (v 19.2) with TypeScript 5.9+
- Next.js 15+ (v15.5+) (App Router with Server Components)
- TailwindCSS 4+ (v4.1+) (with CSS variables for theming)
- Framer Motion 12+ (v12.23+) (for advanced animations)
- TanStack Query v5 (v5.90 +) (server state)
- Zustand v5 (v5.0+) (client state)
- React Hook Form v7 (v7.64+) + Zod v4 (v4.1 +) (forms & validation)
- TipTap v3 (v3.6+) (rich text editor)
- Radix UI (unstyled accessible components)
- AWS Amplify v6 - Gen 2 (v6.15+) (Cognito integration)

## Other Libaries and Framwkrks
- Select Additional UI libraries / framworks  accordingly for data/time prickets, notifictions, icons, drop zones, testing etc to match with the styling we are going to have for the application, but find the latest version of all.

Frontend:

SignIn/SignUp Screen (/):
- The login screen should support both signin and signup flows
- This will support custom congnito login screen, also will support password/username and google signins with congnito
- Full screen of the signin/signup page should have futuristic looking animated css animations, on topof that we should have a centered sigin/signup forms

Once Logged In, Users will entered to the main application:

Main App:
- Main app is basically a typical admin console, also we should have support for different types of user roles, depeding on the role, you may see, not see some menus.
- For this page structure should be like this:
	> There should be a top navigation bar, and left hand corner there's should a small logo, and right hand corner we have a few icons (AI Asistanct Icon, Notifications Icon, Language Change Icon)
	> The AI Asistanct Icon should have glowing/breathing animation, also should change the glowing/breathing animation colors when we switch the themme
	> There should be a left hand menu which is collapsable, and bottom of that menu, will have access to profile and setting of the application, also provide support for logout.
		- This left menu should support mobile view as well (Use the typical mobile top navigation with burgur icon for that)

Main App Menu:
- Main app left menu should have the following in the given order;
- Left menu should have two sections:
> Top Section:
	1. Dashboard
	2. Projects
		a). All Projects
		b). New Project
	3. Knowledge Bases
		a). All Knowledge Bases
		b). New Knowledge Base
	4. User Management

> Bottom Section:
	1. User Icon with Name and Role
	2. Settings - This 
		a). Agent Configuration
		b). Integrations
		c). System Settings
			- Two Factor Settings
			- TimeZone
			- Theme
			- Language
			- Data Retention

Main App Pages:
1. Dashboard: User logs into the Application, and navigates to the landing page (main route - /dashboard), and user will see the following
	- Two sections (Top and bottom) on the page:
		> First Section: Top shows a few tiles for different stats (Submitted Bids, Won Bids, Total Value, Active Projects)
		> Secon Section: Show all the active, user created or assgined projects
			- If there are no such project, it will shows a way to go to create project page (possibly a button or something ? )
			- Also, Depending on the user roles, permission he may see/ not see projects
2. Projects: Users may navigate the Projects Page (/projects)
	- There are a few sub-menus/pages unders the /projects path
		a). All Project (/projects/all)
			- This will show all the projects as a list with search, also with filters and pagination capabilities, by default it should show the latest projects created/assigned/accesed
			- Depending on the user roles, permission he may see/ not see projects
		b). New Project (/projects/new)
			- This page will show a screen to setup a new project, when creating project user can do the following:
				> Add a Project Name
				> Add a Description (Optinal)
				> Add a Deadline (Optinal)
				> Way to Upload Project Documents (Word, Excel, PDF, Audio, Video)
				> Multi-Select - Search and Select Multiple Knowledge Bases (Local or Global)
				> Add Users to Project (Optinal)
				> Button at the bottom ("Start")
			- Once the user click on the Start button in above screen, The UI will change as follows, while hiding the above form, will start the Documnet Upload Process.
				> Top Section: Progress Bar for the Workflow (Document Upload, Document Parsing, Analysis, Content Generation, Compliance Check, Quality Assurance, Comms, Bidding)
					- Each step on the Workflow should have individual progress/processing animation seperately
					- Once all the steps are completed, it should indicate the workflow is completed
				> Below the Top Section:
					- It should show all the agent interactions (Agents deployed into AWS AgentCore will stream the updates with SSE), loading etc, like we see in a typical AI Chat assistance. (Chat Interface with Agent output and User Input, And input section and send button)
					- While the streaming is happening, the chat send button should be disabled.
			- While the processing is happening and once the agents are completed with Content Generation, we should see a few artifacts, these artifacts data will stream as agent outputs (SSE chunks) along with a indicative type and title, it could be in one of these indicative types - worddoc- document, worddoc - q and a, excel. Then depending on the type we should show edit screens to the users to provide feedback to the provided documents. When user click on those artifacts, we should open a new tab/window for them to be able to edit depending on the type. For this we should use a popup window/component
					1. worddoc document type - open it through a text editor
					2. worddoc q and a type - open it thorugh a component with Q and A (editable) format
					3. Excel - No need to support as of now.

			c). When selecting a existin project (/project/<project-id>)
				- Users should be navigate to a new page, the route will have the project id in the URL, which is a unique id get assinged to each project.
				- It should display the current progress as it was left, if it is not finished.
				- The console should show the agent/user chat history as it was happened, with correct time/date values.
				- Should be able to add users
3. Knowledge Bases (/knowledge-bases)
 - There are two sub-menus/pages unders the /knowledge-bases path
 	a). All Knowledge Bases (/knowledge-bases/all)
		- This will show all the knowledge bases, this may have two section on the page.
			> Top Section:
			 - Should list down all the global knowledge bases as tiles (Each tile show the name, description, type (global or local - if local should show the project name attached, created date, number of documnets, and a button to view))
			> Bottom Section:
			 - Should list down all the local knowledge bases as tiles
			- In any of the sections does not have any knowledge bases list down, it should show a create icon
		- Depending on the user roles, permission he may see/ not see knowledge bases.
	b). New Knowledge Base (/knowledge-bases/new)
	 	- Should show a form to create a knowledge base, users can provide the following
	 		> Add a Knoledge Base Name
			> Add a Description
			> Select a Local or Global
			> If Local, Select a Project
			> Way to Upload Documents (Word, Excel, PDF, Audio, Video)
			> Button ("Create")
	c). When selecting a existing Knowledge base (/knowledge-bases/<knowledgebase-id>)
			- Users should be navigate to a new page, the route will have the knowledgebase id in the URL, which is a unique id get assinged to each knowledgebase.
			- Should see the 
			- Upon Navigating should be able to see all documents, search any documnets which the users have uploaded.
4. User Management (/users)
	- There are two sub-menus/pages unders the /users path
	a). All Users (/users/all)
		- This should list down all the users in the system, should be able to search users by name, project, etc
		- Also should have quick actions to view/edit/delete users
	b). Add User (/users/new)
		- Users with the correct role/permissions should be able to add new users to the platform
		- We should collect user's basic details to support with creating a user in congnito userpool
		- Also should be able to upload a profile image
	c) When selecting a single users from the search (/users/<user-id>)
		- It should display user basic details, inclding roles, permissions, and profile image, and assigned projects
		- Should be able to add/remove projects from the user
5.  Settings (/settings)
	- There are a few sub-menus/pages unders the /settings path
		a). Agent Configuration (/settings/agents)
			- Configure each agent model, temparatures etc values, we have following list of agents
				> Orchestration Agent (Workflow)
				> Orchestration Agent (AI Assistant) - Good to Have
				> Parsing Agent - Parses Documents
				> Analysis Agent - Analyses the Documents, and Figure out what to do, what out out to provide
				> Content Agent - Agents as a Tool (Orchestration Agent - Content) - Creates the Proposal, Create the Q & A, Create the Diagrams and System designs, Create Slides using the knowledge provided by the Knowledge Agent
					> Knowledge Agent - Retrives Internal Data (Past Bids, Q & A Answeres)
				> Compliance Agent - Verify the compliance Requirements
				> QA Agent - Verify the artifacts meets the standards and the Outputs requrested
				> Comms Agent - Send out emails/slack notifications when the tasks are done
				> Submission Agent - Once the user approved, it can submit the documents to given portals
		b). Integrations (/settings/integrations)
			- Should be able to manage integrations
				> Slack configuration
					- Should should the required settings to save the slack configurations
		c). System Settings (/settings/system)
			- Should be able to manage the following settings
				> Two Factor Settings
					- Should be able to enable/disable settings, if enabled should show the options to configure the two factor auths
				> TimeZone
					- Should be able to select multiple timezoens for the app
				> Theme
					- For the themes, usesr should be select multiple themes, Default should have a few theme - light, dark, deloitte, futuristic
				> Language
					- Users should be able to switch to multiple languages - EN (US), EN (AU), etc
				> Data Retention
					- Should be able to select a few options from a drop down - Default to 30 days

------

# Project Structure:
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
│   │   │   └── workflow-agents/
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
│   │   │   ├── workflow-agents.ts                          # AgentCore API client (POST to /invocations)
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

# Tools and Technologies:



# State Management:

TanStack Query = Server data, caching, SSE integration
Zustand = Client UI state, localStorage persistence
React Hook Form = Form-specific state only
useState = Component-local state


## Example:
| Data Type | Tool | Example |
|-----------|------|---------|
| Projects from GraphQL | TanStack Query | `useProjects()` |
| User details from GraphQL | TanStack Query | `useUser(userId)` |
| Agent SSE streams | TanStack Query + useEffect | `useWorkflowStream({ data }})` |
| Theme preference | Zustand | `useUIStore().theme` |
| Language setting | Zustand | `useUIStore().language` |
| Unsaved artifact edits | Zustand | `useArtifactDraftStore()` |
| Form inputs | React Hook Form | `useForm()` |
| Modal open/closed | useState | `const [open, setOpen] = useState(false)` |


------

User Roles / Groups :
- Following user roles/groups should be supported by the application and should be setup at the congnito pool

- Admin - Full power has access to everything
- Drafter - Can contine the process till the QA process, Can't go beyound the Comms agent and Submission
- Bidder - Has acecss to full agentic flow, can do CRUD for local KBs
- KB-Admin - Has full access to Knowledge Bases - Can do CRUD for local KBs and global KBs
- KB-View - Only has read only access to Knowledge Bases (local KBs and global KBs)

------

Application Flow When Doing a Bid:

A. User create a project for a new bid, if there's nothing already, when creating a project use will navigate to /projects/new page, and use will input the following:
	> Add a Project Name
	> Add a Description (Optinal)
	> Add a Deadline (Optinal)
	> Way to Upload Project Documents (Word, Excel, PDF, Audio, Video)
	> Multi-Select - Search and Select Multiple Knowledge Bases (Local or Global)
	> Add Users to Project (Optinal)
	> Button at the bottom ("Start")

B. Once user click on the "Start" button following, UI shoul be change to the processing UI. In the Processing UI this will happen.
	1. With the data provided FE will send a requesst to backend GQL api to create a project with relevant details.
	2. Once above is done, FE will send an another request to backend GQL api to create a pre-signed s3 URL to upload project documents (Word, Excel, PDF, Audio, Video), and once the URL is received frontend should upload the files to S3 directly, and FE we should see the processing are updating on the top progress bar along with processing section animation, it should update the DB records about the project file locations (ProjectDocument). 
		- S3 Presigned URL will follow the (yyyy/mm/dd/hh/<url_friendly_project_name>_<timestamp>) format
	2. Once the project record is created in the DB, and files are uploaded sucessfully, FE will trigger the Agent execution, using the AgentCore runtime endpoint.
	3. In the AgentCore we have a Supervisor Agent, with a pool of sub agents specialsied in different domains. The first request will go to the supervisor form the FE, from there onwards the Supervisor Agent will handle the orchestration flow. 
	4. This Agentic Flow is wrapped by the fast API, hence all the payload will go into /invocations endpoint (this is a hard requirement by the agentcore API), and then the request will pass to graph. And in the main API will validate the initial requiest for the correct payload. The payload should contain the following
		- project_id
		- user_id
		- session_id
		- start - Hint for the supervisor agent to understad this is a new project request, this will set to "true" by the FE, for the first time when the user click on "Start" buttong, for all the proceeding chat inputs, this will be set to "false"
		- user_input - User input for a question or feedback or content edit payload (all are optional)
			- chat
			- content_edits

	5. Once the request is received, supevisor should invoke a tool/mcp call to postgress to make a DB record for the agentic flow with the status "Open". Supervisor will crete a WorkflowExecution record along with Agent Task in the order they should execute this workflow. The workflow should have the following in the order. Each tasks will have the following status ("Open", "InProgress", "Waiting" ,"Completed", "Failed") - Waiting is a state when the agent is waiting for an input from the user, and WorkflowExecution will also have the same status, that status only be updated by the supervisor, depending on the outcome of the acitvity by the agents and feedback by the users.
		a). Parser Agent Task - Parser Agent Should process the documents uploaded in the given location
		b). Analysis Agent Task - Analyses the Documents, and Figure out what to do, what out out to provide
		c). Content Agent Task (Agents as a Tool) - Uses Knowledge Agent to Retrives Internal Data (Past Bids, Q & A Answeres) from the Bedrock Knowledge Bases, and create Drafts (Makrdown file) to for user to review with the content type.
		d). Compliance Agent Task - Verify the compliance Requirements. 
		e). QA Agent Task - Verify the artifacts meets the standards and the Outputs requrested
		f). Comms Agent Task - Send out emails/slack notifications when the tasks are done
		e). Submission Agent Task - Once the user approved, it can submit the documents to given portals.
		- Along with the above supervisor should maintain the following propertise as and when the things are happenig:
			%% User Id, who initiate the workflow - This should be updated by start of each workflow execution (should rely on the start flag in the initialy payload)
			uuid initiated_by FK ""  
	        %% User Id, who is being handle the workflow
			uuid handled_by FK "" - For the initiatl request this will  be same, but for the proceeding invocations, depending on the user id, this should get updated always.
	        %% User Id, who completed the workflow
			uuid completed_by FK "" - Once the workflow steps are completed - this should be updated with user id of the last user who completed the workflow

	6. Once the supervisor accepted the request it will pass the request detiails to the Parser Agent, paser agent will have access to postgress tool/mcp to access retrived the required details.
		- Agent first mark the Parser AgentTask as InProgress, update the input_data and contine with the parsing task, for the parsing task the agent should accesss the Project and should get all the documents from the ProjectDocument records from the database.
		- Once the agent retrived all the ProjectDocument documents from the database, it should retrive the locations (i.e raw_file_location) and pass that to bedrock Data Automation tool to process the documents and save it onto a predefined location (S3), for that the agent will use use correct tools/mcp accordingly.
		- Once the agent done with that task he will provide a feedback to the supervisor agent and update the Parser Agent Task details accordingly.
		- Along with the above the agent should maintain the following propertise as and when the things are happenig:
			%% User Id, who initiate the agent task - This should be updated by start of each task execution
			uuid initiated_by FK ""  
	        %% User Id, who is being handle the agent task
			uuid handled_by FK "" - For the initiatl request this will be same, but for the proceeding invocations, depending on the user id, this should get updated always.
	        %% User Id, who completed the agent task
			uuid completed_by FK "" - Once the agent task is completed - this should be updated with user id of the last user who completed the agent task
		- If there a failure it should update the AgentTask accordingly with error_message, error_log
		- If the task is successfull, the agent should write the processed file location into the output_data and also should update the each ProjectDocument's processed_file_location accordingly and mark the AgentTask as completed, so that the supervisor and pickup and pass that to the Analysis Agent

	7. Once the Parser Agent passed back to the Supervisor agent, he will analys the outcome and update the WorkflowExecution entries with last_updated_at, also if there's an error it should update error_message and error_log entries. If the parsing successful, the supervisor agent should ask Analysis Agent to work on the Analysis Agent Task. And should update the Project's progress_percentage value (Depending on how many agent tasks we have completed) and other related data.
	8. Once the supervisor handsoff that to the Analysis Agent;
		- Agent first mark the Analysis AgentTask as InProgress, update the input_data and contine with the Analysis task, for the Analysis task the agent should accesss the output for the previous Parse Agent tasks's output (output_data) from the database.
		- Once agent retrives the document data (from the S3 file location) which was available in the Parser ProjectDocument processed_file_location, then it should be used as the context to analyse and produced the following data in markdown format to be ready to present that to the user. And this markdown should contain following details:

			a. Who is the Client (Name, Location, Domain, Contact Details)
			b. Key Stakeholder and Their Roles
			c. Understand the Ask (What the client is asking for this RFP/Bid)
			d. Figure out the Opportunity (What are the key opportunies for our company)
			e. Figure out the Process (What's the current RFP/Bid processs)
			f. Understand what documents to provide
				- Questioner Answered (pdf/doc) - RFP Q and A document
				- Due Diligence Questions / Company Credentains (Corporate profile, legal entity info, financial stability reports, insurances, certifications (ISO, SOC2, GDPR compliance, etc.).) Answered (pdf/doc)
				- System Designed Prepared (pdf/doc)
				- Presentation ? (pdf/ppt)
				- Pricing / Commercial Proposal – Detailed cost breakdown (licensing, implementation, support, optional services).
				- Conver Letter (pdf/doc)
				- Compliance Matrix – Mapping of client requirements vs. your compliance (Yes/Partial/No).
				- Executive Summary (pdf/doc)
				- What else (Demo, POC) ?
				- References & Case Studies – Similar projects which we have delivered successfully.
			g. Deadline dates
			h. How to submit the documents - Portal (login details), Email
		- Once the agent is extracted the above detials successfully it should write to the output_data
		- Along with the above the agent should maintain the following propertise as and when the things are happenig:
			%% User Id, who initiate the agent task - This should be updated by start of each task execution
			uuid initiated_by FK ""  
	        %% User Id, who is being handle the agent task
			uuid handled_by FK "" - For the initiatl request this will be same, but for the proceeding invocations, depending on the user id, this should get updated always.
	        %% User Id, who completed the agent task
			uuid completed_by FK "" - Once the agent task is completed - this should be updated with user id of the last user who completed the agent task
		- If there a failure it should update the AgentTask accordingly with error_message, error_log
		- Once the task is done, the agent should write the outcome into the output_data and mark the AgentTask as completed, then it should handoff back to the supervisor agent.
	9. Once the Analysis Agent passed back to the Supervisor agent, he will analys the outcome and update the WorkflowExecution entries with last_updated_at, also if there's an error it should update error_message and error_log entries. If the analysis successful, the supervisor agent should send the update to the user with the out come of the analysi to the user in Markdown format, so that the user can review and provide feedback if there's anything to be updated/changed.
	10. Then once the supervisor pass the output to the user, user view review and will identify if there any gaps, or things needs to be updated and send a feedback back to the supervisor, supervisor should understand the intent of the feedback should continue the follow accordingly. If the feedback saying issue with parsing, it should kick of the workflow from the start, the supervisor should rest the Parsing Agent Task and Analysis Agent Task and rerun the process to fill the gaps, if the feedback is just an issue with analysis, the supervisor should reest the  Analysis Agent Task  and should rerun the task from the bening, this will go on a loop, until the user is satisfied by the analysis outcome.
	11. Once the user is satisfied, the supervisor then should pass that to the Content Agent to prepare the content for the documents we need to submit for thisd RFP/Bid (Outcome of Point 8 - f).
		- Agent first mark the Content AgentTask as InProgress, update the input_data and contine with the Content task, for the Content task the agent should accesss the output for the previous Analysis Agent tasks's output (output_data) from the database.
		- Once agent retrives the output data which was available in the Analysis AgentTask output, then it figure out how many and what documents need to be provided for this RFP and Bid.
		- Then the Content Agent will use the Knowledge Agent who has access to Bedrock Knowledge bases to retrivev the related data for each type of documents we need to provide.
		- When providing the output this agent will create the following strcture for the documents/artifacts, will save the structure in the database under the Artifact tables and will update ArtifactVersion table accordingly with the content for each type of artifact we want to create.
			a. All the generate documents should have the following format to send to the frontend
				{
					type: <worddoc | pdf | ppt | excel>, 
					category: <  document | q_and_a | excel >,
					title: <Title of the documents>, 
					meta_data: <created_at, last_modified_at, created_by, updated_by>
					content: <content should be changed depending on the category to support with frontend renderig>
					tags: < system_design | cover_letter | exec_summary | case_studies | rfp_q_and_a | due_deligence_q_and_a , etc >,
				}

				NOTE: For the type worddoc | pdf  and cateogory document should have the frontend tiptap library native formatting for the content to support with easy parsing and rendering on the frontend

				----

				Following are some of the examples:

				Example 1: Word Document (Exec Summary) 

				{
				  "type": "worddoc",
				  "category": "document",
				  "title": "AI Adoption Executive Summary",
				  "meta_data": {
				    "created_at": "2025-10-02T07:00:00Z",
				    "last_modified_at": "2025-10-02T09:30:00Z",
				    "created_by": "Chamika Bandara",
				    "updated_by": "Chamika Bandara"
				  },
				  "tags": ["exec_summary", "ai_strategy"],
				  "content": {
				    "type": "doc",
				    "content": [
				      {
				        "type": "heading",
				        "attrs": { "level": 1 },
				        "content": [
				          { "type": "text", "text": "AI Adoption Executive Summary" }
				        ]
				      },
				      {
				        "type": "heading",
				        "attrs": { "level": 2 },
				        "content": [{ "type": "text", "text": "Introduction" }]
				      },
				      {
				        "type": "paragraph",
				        "content": [
				          {
				            "type": "text",
				            "text": "This executive summary outlines our AI adoption strategy, focusing on efficiency, cost savings, and compliance."
				          }
				        ]
				      },
				      {
				        "type": "heading",
				        "attrs": { "level": 2 },
				        "content": [{ "type": "text", "text": "Key Benefits" }]
				      },
				      {
				        "type": "paragraph",
				        "content": [
				          {
				            "type": "text",
				            "text": "The adoption of AI provides several measurable benefits:"
				          }
				        ]
				      },
				      {
				        "type": "bulletList",
				        "content": [
				          {
				            "type": "listItem",
				            "content": [
				              {
				                "type": "paragraph",
				                "content": [
				                  { "type": "text", "text": "Reduce incident resolution times by up to 75%" }
				                ]
				              }
				            ]
				          },
				          {
				            "type": "listItem",
				            "content": [
				              {
				                "type": "paragraph",
				                "content": [
				                  { "type": "text", "text": "Improve fraud detection accuracy" }
				                ]
				              }
				            ]
				          },
				          {
				            "type": "listItem",
				            "content": [
				              {
				                "type": "paragraph",
				                "content": [
				                  { "type": "text", "text": "Enable real-time decision making" }
				                ]
				              }
				            ]
				          }
				        ]
				      },
				      {
				        "type": "heading",
				        "attrs": { "level": 2 },
				        "content": [{ "type": "text", "text": "Implementation Phases" }]
				      },
				      {
				        "type": "paragraph",
				        "content": [
				          { "type": "text", "text": "We propose a phased rollout of AI capabilities:" }
				        ]
				      },
				      {
				        "type": "orderedList",
				        "attrs": { "order": 1 },
				        "content": [
				          {
				            "type": "listItem",
				            "content": [
				              {
				                "type": "paragraph",
				                "content": [
				                  { "type": "text", "text": "Phase 1: Proof of Concept with fraud detection" }
				                ]
				              }
				            ]
				          },
				          {
				            "type": "listItem",
				            "content": [
				              {
				                "type": "paragraph",
				                "content": [
				                  { "type": "text", "text": "Phase 2: Expansion to compliance monitoring" }
				                ]
				              }
				            ]
				          },
				          {
				            "type": "listItem",
				            "content": [
				              {
				                "type": "paragraph",
				                "content": [
				                  { "type": "text", "text": "Phase 3: Full integration into operations" }
				                ]
				              }
				            ]
				          }
				        ]
				      }
				    ]
				  }
				}


				Example 2: Q&A Document (RFP Q&A)

				{
				  "type": "pdf",
				  "category": "q_and_a",
				  "title": "RFP Q&A Responses - Security Policy",
				  "meta_data": {
				    "created_at": "2025-10-01T14:00:00Z",
				    "last_modified_at": "2025-10-01T16:00:00Z",
				    "created_by": "Security Agent",
				    "updated_by": "Legal Review Team"
				  },
				  "tags": ["rfp_q_and_a", "security"],
				  "content": {
				    "q_and_a": [
				      {
				        "question": "What is your approach to Zero Trust security?",
				        "proposed_answer": "Our Zero Trust framework requires all users and devices to authenticate continuously using MFA and device posture checks.",
				        "past_answers": [
				          {
				            "answer": "Zero Trust is implemented via perimeter security and VPN authentication.",
				            "reference_link": "https://company-docs.com/security/zerotrust-2023.pdf"
				          },
				          {
				            "answer": "We enforce Zero Trust at the application layer using role-based access controls.",
				            "reference_link": "https://company-docs.com/security/zerotrust-2022.pdf"
				          }
				        ]
				      },
				      {
				        "question": "How often do you conduct access reviews?",
				        "proposed_answer": "Access reviews for privileged accounts are conducted quarterly, while all user accounts are reviewed annually.",
				        "past_answers": [
				          {
				            "answer": "Access reviews were previously done bi-annually for all users.",
				            "reference_link": "https://company-docs.com/security/access-review-2021.docx"
				          }
				        ]
				      }
				    ]
				  }
				}

		- Along with the above the agent should maintain the following propertise as and when the things are happenig:
			%% User Id, who initiate the agent task - This should be updated by start of each task execution
			uuid initiated_by FK ""  
	        %% User Id, who is being handle the agent task
			uuid handled_by FK "" - For the initiatl request this will be same, but for the proceeding invocations, depending on the user id, this should get updated always.
	        %% User Id, who completed the agent task
			uuid completed_by FK "" - Once the agent task is completed - this should be updated with user id of the last user who completed the agent task
		- If there a failure it should update the AgentTask accordingly with error_message, error_log
		- If the task is successfull, the agent should write the details of the artifacts created into the output_data, and mark the AgentTask as completed, so that the supervisor and pickup and pass that to the Next Agent
	12. Once the Content Agent completed the analysis it will handoff back to the supervisor agent with the outcome, he will analys the outcome and update the WorkflowExecution entries with last_updated_at, also if there's an error it should update error_message and error_log entries. If the content createion successful, the supervisor agent should send the update to the frontend, saying the content creation is done (Without the actual content, because it needs to be reviwed by other agents in the workflo), then it should pass to the Complience Agent to do the complience check on the content created. 
	13.  Once the supervisor handsoff that to the Compliance Agent;
		- Agent first mark the Compliance AgentTask as InProgress, update the input_data and contine with the Complience task, for the Complience task the agent should accesss the output for the previous Content Agent tasks's output (output_data) and Project info from the database and figure out how to access the artifacts created by the Content Agent.(Should access Artifact table and ArtifactVersion tables for this, and from the ArtifactVersion tables shold retrive the latest version), Should be using a MCP/Tool call with the RDS postgress DB
		- Once the Complience Agent has access to the artifacts and it's content, For each artifact he will review against a set of Compliance checks, Deloitte Standards etc and provide a feedback on each document as follows.

		Sample Feedback for a single artiflact, output shoudl be an array of this.
		{
			  "name": "AI Adoption Executive Summary",
			  "type": "worddoc",
			  "content": { /* TipTap JSON for the document */ },
			  "feedback": [
			    {
			      "section": "Introduction",
			      "issues": [
			        {
			          "description": "Missing reference to latest AI compliance framework 2025.",
			          "references": [
			            {
			              "title": "AI Ethics Guidelines 2025",
			              "link": "https://company-docs.com/ai-ethics-2025.pdf"
			            }
			          ],
			          "suggestions": [
			            "Add a paragraph referencing AI Ethics Guidelines 2025."
			          ]
			        },
			        {
			          "description": "No mention of data privacy guidelines.",
			          "references": [
			            {
			              "title": "GDPR Compliance Summary",
			              "link": "https://company-docs.com/gdpr-summary.pdf"
			            }
			          ],
			          "suggestions": [
			            "Include a note about GDPR compliance for EU operations."
			          ]
			        }
			      ]
			    },
			    {
			      "section": "Key Benefits",
			      "issues": [
			        {
			          "description": "Claims about efficiency lack supporting metrics.",
			          "references": [
			            {
			              "title": "Operational Metrics Report Q3 2025",
			              "link": "https://company-docs.com/metrics-q3-2025.pdf"
			            }
			          ],
			          "suggestions": [
			            "Include recent benchmark data to support efficiency claims."
			          ]
			        }
			      ]
			    }
			  ]
			}

		- The agent should genera the feedback for all the artifacts successfully.
		- Along with the above the agent should maintain the following propertise as and when the things are happenig:
			%% User Id, who initiate the agent task - This should be updated by start of each task execution
			uuid initiated_by FK ""  
	        %% User Id, who is being handle the agent task
			uuid handled_by FK "" - For the initiatl request this will be same, but for the proceeding invocations, depending on the user id, this should get updated always.
	        %% User Id, who completed the agent task
			uuid completed_by FK "" - Once the agent task is completed - this should be updated with user id of the last user who completed the agent task
		- If there is a failure it should update the AgentTask accordingly with error_message, error_log
		- Once the task is done, the agent should write the outcome into the output_data and mark the AgentTask as completed, then it should handoff back to the supervisor agent with the outcome of whether the content is complient or not.

	14. Once the Complient Agent handsoff back to the supervisor with the complience outcome, he may decide to go to next step or to re-run the previous step depending on the complient status.
		- If it is not complient, supervisor may pass that back to the Content Agent to fix the issues,then the Content agent will go through the same process and update the content with the feedback, which can be found in the Complience Agent's task output in the DB and come back again, until the Compliance agent is happy. Once the Complient agent is happy the supervisor agent will move to the next step with the QA Agent.
		- Also, he will analys the outcome and update the WorkflowExecution entries with last_updated_at, also if there's an error it should update error_message and error_log entries. 
	15. Once the supervisor handsoff to the QA Agent
		- Agent first mark the QA Agent AgentTask as InProgress, update the input_data and contine with the QA task, for the QA task the agent should accesss the output for the previous Content Agent tasks's output (output_data) and Project info from the database and figure out how to access the artifacts created by the Content Agent.(Should access Artifact table and ArtifactVersion tables for this, and from the ArtifactVersion tables shold retrive the latest version), Also the agent needs to access to the Analysis agent task's output - All DB operations Should be done using a MCP/Tool call with the RDS postgress DB. 
		- Once the QA Agent has access to the artifacts and it's content and the output from the Analysis agent to figure out what documents and informations needs to provide, This agent will scan through all the documents and anayse to find out any gaps, if there are not more gaps, agent will handsoff back to the supervisor, if not the agent will provide a feedback on each document on what's missing also, if some documents are not provided, then again he will pass a seperate note to the supervisor agent on the missing artifacts.

		For the output the agent should follow the following schema:

		{
		  "project_id": "string", // ID/reference of the project
		  "artifacts_reviewed": [
		    {
		      "name": "string", // artifact name/title
		      "type": "worddoc | pdf | excel | q_and_a | ppt",
		      "submitted_content": {}, // original content JSON (TipTap, tables, Q&A)
		      "feedback": [
		        {
		          "section_or_question_or_table": "string", // section heading, Q&A question, or table name
		          "description": "string", // issue or observation
		          "status": "met | partially_met | not_met", // evaluation of this item
		          "references": [ // optional references to justify feedback
		            {
		              "title": "string",
		              "link": "string"
		            }
		          ],
		          "suggestions": ["string"] // optional guidance to fix/complete
		        }
		      ]
		    }
		  ],
		  "missing_artifacts": [
		    {
		      "expected_name": "string",
		      "expected_type": "worddoc | pdf | excel | q_and_a | ppt",
		      "description": "string" // why this artifact is considered missing
		    }
		  ],
		  "summary": {
		    "total_artifacts_expected": 5,
		    "total_artifacts_submitted": 3,
		    "total_issues_found": 12,
		    "overall_status": "partial | complete | failed"
		  }
		}


		Example: 
		{
		  "project_id": "<uuid from DB>",
		  "artifacts_reviewed": [
		    {
		      "name": "AI Adoption Executive Summary",
		      "type": "worddoc",
		      "submitted_content": { /* TipTap JSON content */ },
		      "feedback": [
		        {
		          "section_or_question_or_table": "Introduction",
		          "description": "Missing reference to client-specific AI compliance requirements.",
		          "status": "not_met",
		          "references": [
		            {
		              "title": "Client AI Compliance Request",
		              "link": "https://client-docs.com/ai-compliance.pdf"
		            }
		          ],
		          "suggestions": ["Add a paragraph referencing client-specific compliance guidelines."]
		        },
		        {
		          "section_or_question_or_table": "Key Benefits",
		          "description": "Benefits are stated but no measurable metrics linked to client's KPIs.",
		          "status": "partially_met",
		          "suggestions": ["Include metrics from Q3 2025 that align with client's KPIs."]
		        }
		      ]
		    },
		    {
		      "name": "RFP Q&A Responses - Security Policy",
		      "type": "q_and_a",
		      "submitted_content": { /* Q&A JSON */ },
		      "feedback": [
		        {
		          "section_or_question_or_table": "Zero Trust Approach",
		          "description": "Proposed answer does not cover client-requested device posture checks.",
		          "status": "not_met",
		          "references": [
		            {
		              "title": "Client Zero Trust Requirements",
		              "link": "https://client-docs.com/zero-trust-ask.pdf"
		            }
		          ],
		          "suggestions": ["Update answer to include device posture verification as requested."]
		        }
		      ]
		    }
		  ],
		  "missing_artifacts": [
		    {
		      "expected_name": "System Design Component Matrix",
		      "expected_type": "excel",
		      "description": "Not submitted by the delivery team; required by client request."
		    },
		    {
		      "expected_name": "Fraud Detection Case Study",
		      "expected_type": "ppt",
		      "description": "Not submitted; expected for client review of previous implementations."
		    }
		  ],
		  "summary": {
		    "total_artifacts_expected": 5,
		    "total_artifacts_submitted": 3,
		    "total_issues_found": 4,
		    "overall_status": "partial"
		  }
		}

		- Along with the above the agent should maintain the following propertise as and when the things are happenig:
			%% User Id, who initiate the agent task - This should be updated by start of each task execution
			uuid initiated_by FK ""  
	        %% User Id, who is being handle the agent task
			uuid handled_by FK "" - For the initiatl request this will be same, but for the proceeding invocations, depending on the user id, this should get updated always.
	        %% User Id, who completed the agent task
			uuid completed_by FK "" - Once the agent task is completed - this should be updated with user id of the last user who completed the agent task
		- If there a failure it should update the AgentTask accordingly with error_message, error_log
		- Once the task is done, the agent should write the outcome into the output_data and mark the AgentTask as completed, then it should handoff back to the supervisor agent with the outcome of whether the content is QA pass or not.
	16. Once the QA Agent handsoff back to the supervisor with the QA outcome, he may decide to go to next step or to re-run the previous step depending on the QA status.
		- If it is not passing QA, supervisor may pass that back to the Content Agent to fix the issues, and should reset the Content Agent Task, Complience Agent Task, and then it should restart from the begining while incorporating the feedback from the QA agent, which can be found unders the QA Agent Task's output and compliecn Agent feedback, which can be found under the Complience Agent Task;s outpout in DB. This process will go through a cycle untile the content is complient and QA Passed.
		- Once both the Complient agent and QA agents are happy the supervisor agent will move to the next step with the QA Agent.
		- Also , he will analys the outcome and update the WorkflowExecution entries with last_updated_at, also if there's an error it should update error_message and error_log entries.
	17. Once the artifacts are complient and QA passed, then the supervisor will send all the finalised artifacts which retrived from the database.  To figure out how to access the artifacts created by the Content Agent, agent should use(Should access Artifact table and ArtifactVersion tables, and from the ArtifactVersion tables shold retrive the latest version), Should be using a MCP/Tool call with the RDS postgress DB.
	18. Once the artifacts are received on the frontend, it should renders as clickable tile components for each artiefact on the chat interface of the user, And for each type of artifacts usesr should be able to edit and provide feedback when they click on each artiefact type. For that
		- Each artiefact and be rendered on a popup window
		- When clicking on the wordoc/pdf type and categoty is document artiefact it should show a popup window with a rich text editor (use tiptap) and upon changins and saving the edits will be stored in the app state.
		- When clicking on the wordoc/pdf type and categoty is q_and_a it should open through a popup window with a custom page/compoenent, which properly render each question/answer other things are properly listed down as seperate section, while allowing to edit each answer seperately.
		- When click on the excel type it should open on a editable table custom component within a popup window. 
		- Once user done with the edit and click save button (We should wait for all the documents to be edited) and user input something to the chat input box and send, that update again should go to the agentcore endpoint, and then to the supervisor agent.
	19. Then the agent will analys the input and if there are additional edits, supervisor will ask from use if they want to review this again with complience and QA, if yes supervisor should reest, relevant db state and again and send the process through the same cycle starting from the Content Agent step, if user responded no/ saying he is happy with what we got, the supervisor will ask permission to send notifations to project stakeholders. 
		- Before sending notifiations if the user is happy with the content or the edits, the supervisor will export those artifacts as files to S3,  and then it will update update content and location details of each artifact's latest version - ArtifactVersion (The supervisor will access Project, Artifact and ArtifactVersion tables for this) - for those the suprvisor will use DB and S3 MCP or Tool calls.
		- Then, If user granted send notifcation permision then the supervisro will pass that to the Comms Agent.
	20. Once the supervisor handsoff to the Comms Agent
		- Comms agent will access the each artifact and retrive the location of each file on the DB table ArtifactVersion for each artifact (The agent will access Project, Artifact and ArtifactVersion tables for this and fetch the location)
		- And then the comms agent will fetch the Project Members from ProjectMember table for the project, and will find their emails from the User table, and will create a slack channel and send out an notififcation about the project status, and the artifacts.  
		- Will create a notification record on the Notification table with a relevent messages, so that the From the frotned users will receive notifications from the subscriptions. 
		- Along with the above the agent should maintain the following propertise as and when the things are happenig:
			%% User Id, who initiate the agent task - This should be updated by start of each task execution
			uuid initiated_by FK ""  
	        %% User Id, who is being handle the agent task
			uuid handled_by FK "" - For the initiatl request this will be same, but for the proceeding invocations, depending on the user id, this should get updated always.
	        %% User Id, who completed the agent task
			uuid completed_by FK "" - Once the agent task is completed - this should be updated with user id of the last user who completed the agent task
		- If there a failure it should update the AgentTask accordingly with error_message, error_log
		- Once the task is done, the agent should write the outcome into the output_data and mark the AgentTask as completed, then it should handoff back to the supervisor agent with the outcome of whether the notifications has been sent or not.
	21. Once the Comms Agent done with it's task it will handoff back to the supervisor agent with the outcome, he will analys the outcome and update the WorkflowExecution entries with last_updated_at, also if there's an error it should update error_message and error_log entries. If the comms task is successful, the supervisor agent should send the update to the frontend, saying the comms is done.
		- Then again supervisor will ask from the users whether they are happy to email the proposal to the user.
	22. Once the user reply back to the supervisor agent saying yes, then supervisor will handsoff that to the Submission Agent, if the user reply with no, then the supervisro agent will mark the Submission Agent Task as completed, also the WorkflowExecution will be updated accordingly and send a message a user to saying the workflow has been completed.
		- If the user wants to Submit the Bid, then the Submission Agent will access the Analysis Agent Task output from the DB, will access the output, and then the Submitssion agent should figure out the contact/email details to submit to the client, And then before sending the email, the agent will crete a email draft and send the draft to supervisor agent, and then the supervisor agent will pass that back to the user to review, if the user is happy then the supervisor agent will again handsoff back to the Submission agent, and that agent will send out an email with the correct documents which asked by the client, and artifacts will be fetched by the Submitssion agent by retrive the location of each file on the DB table ArtifactVersion for each artifact (The agent will access Project, Artifact and ArtifactVersion tables for this and fetch the location), once the location is fetched, then the agent will add those as attachement to the gmail and sendout an email to the  client with correct title, body and the attachments.
		- When the supervisor is sending the email draft to the user to review will follow the following structure:
			{

				title: <email-title>,
				to: <>,
				from: <>,
				body: <richtext>
				attachemnts: [ {name: <name/title of the document>, url: <location of the document>}] 
			}
		- Along with the above the agent should maintain the following propertise as and when the things are happenig:
			%% User Id, who initiate the agent task - This should be updated by start of each task execution
			uuid initiated_by FK ""  
	        %% User Id, who is being handle the agent task
			uuid handled_by FK "" - For the initiatl request this will be same, but for the proceeding invocations, depending on the user id, this should get updated always.
	        %% User Id, who completed the agent task
			uuid completed_by FK "" - Once the agent task is completed - this should be updated with user id of the last user who completed the agent task
		- If there a failure it should update the AgentTask accordingly with error_message, error_log
		- Once the task is done, the agent should write the outcome into the output_data and mark the AgentTask as completed, then it should handoff back to the supervisor agent with the outcome of whether the email has been sent or not.
	23. Once the Submittion Agent done with it's task it will handoff back to the supervisor agent with the outcome, he will analys the outcome and update the WorkflowExecution entries with last_updated_at, also if there's an error it should update error_message and error_log entries. If the submission task is successful, the supervisor agent should send the update to the frontend, saying the email has been sent to the client.
		- Then the supervisro agent will mark the WorkflowExecution as completed and will be updated other fields accordingly and send a message a user to saying the workflow has been completed.
		- Also the supervisor agent will update the Project database table record with correct status "Completed" and "completed_by", "completed_at", "created_at", and "progress_percentage" as 100


- For evey handsoffs, supervisor upgates, client should receive evenstram updates, so that the in the frontend we can show the correct status updates, loading screens on the chat interface and the project interface.
