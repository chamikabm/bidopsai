# ============================================
# SCALARS
# ============================================
scalar DateTime
scalar JSON
scalar UUID
scalar Decimal

# ============================================
# ENUMS
# ============================================
enum ProjectStatus {
  DRAFT
  IN_PROGRESS
  UNDER_REVIEW
  COMPLETED
  SUBMITTED
  WON
  LOST
  CANCELLED
}

enum WorkflowStatus {
  OPEN
  IN_PROGRESS
  WAITING
  COMPLETED
  FAILED
}

enum AgentTaskStatus {
  OPEN
  IN_PROGRESS
  WAITING
  COMPLETED
  FAILED
}

enum AgentType {
  SUPERVISOR
  PARSER
  ANALYSIS
  CONTENT
  KNOWLEDGE
  COMPLIANCE
  QA
  COMMS
  SUBMISSION
}

enum ArtifactType {
  WORDDOC
  PDF
  PPT
  EXCEL
}

enum ArtifactCategory {
  DOCUMENT
  Q_AND_A
  EXCEL
}

enum ArtifactStatus {
  DRAFT
  IN_REVIEW
  APPROVED
  REJECTED
}

enum KnowledgeBaseScope {
  GLOBAL
  LOCAL
}

enum NotificationType {
  PROJECT_UPDATE
  WORKFLOW_COMPLETE
  ARTIFACT_READY
  SUBMISSION_COMPLETE
  MENTION
  ASSIGNMENT
}

enum UserRoleType {
  ADMIN
  DRAFTER
  BIDDER
  KB_ADMIN
  KB_VIEW
}

enum IntegrationType {
  SLACK
  EMAIL
  PORTAL
}

enum SubmissionStatus {
  PENDING
  SUBMITTED
  ACCEPTED
  REJECTED
}

# ============================================
# INPUT TYPES
# ============================================

input CreateProjectInput {
  name: String!
  description: String
  deadline: DateTime
  knowledgeBaseIds: [UUID!]
  userIds: [UUID!]
}

input UpdateProjectInput {
  name: String
  description: String
  deadline: DateTime
  status: ProjectStatus
  progressPercentage: Int
}

input CreateProjectDocumentInput {
  projectId: UUID!
  fileName: String!
  filePath: String!
  fileType: String!
  fileSize: Int!
  rawFileLocation: String!
  metadata: JSON
}

input UpdateProjectDocumentInput {
  processedFileLocation: String
  metadata: JSON
}

input CreateKnowledgeBaseInput {
  name: String!
  description: String
  scope: KnowledgeBaseScope!
  projectId: UUID
}

input UploadKnowledgeBaseDocumentInput {
  knowledgeBaseId: UUID!
  fileName: String!
  filePath: String!
  fileType: String!
  fileSize: Int!
  s3Bucket: String!
  s3Key: String!
  metadata: JSON
}

input CreateUserInput {
  email: String!
  username: String!
  firstName: String!
  lastName: String!
  profileImageUrl: String
  roleIds: [UUID!]!
}

input UpdateUserInput {
  firstName: String
  lastName: String
  profileImageUrl: String
  preferredLanguage: String
  themePreference: String
}

input CreateArtifactInput {
  projectId: UUID!
  name: String!
  type: ArtifactType!
  category: ArtifactCategory!
  content: JSON!
}

input UpdateArtifactVersionInput {
  artifactId: UUID!
  content: JSON!
}

input AgentInvocationInput {
  projectId: UUID!
  userId: UUID!
  sessionId: String!
  start: Boolean!
  userInput: UserInputPayload
}

input UserInputPayload {
  chat: String
  contentEdits: [ContentEditInput!]
}

input ContentEditInput {
  artifactId: UUID!
  content: JSON!
}

input UpdateAgentConfigurationInput {
  agentType: AgentType!
  modelName: String
  temperature: Float
  maxTokens: Int
  systemPrompt: JSON
  additionalParameters: JSON
  enabled: Boolean
}

input UpdateIntegrationInput {
  type: IntegrationType!
  name: String
  configuration: JSON
  enabled: Boolean
}

input PresignedUrlRequest {
  projectId: UUID!
  fileName: String!
  fileType: String!
}

input ProjectFilterInput {
  status: ProjectStatus
  createdBy: UUID
  dateFrom: DateTime
  dateTo: DateTime
  search: String
}

input KnowledgeBaseFilterInput {
  scope: KnowledgeBaseScope
  projectId: UUID
  search: String
}

input UserFilterInput {
  roleId: UUID
  search: String
}

# ============================================
# TYPES
# ============================================

type User {
  id: UUID!
  email: String!
  username: String!
  firstName: String!
  lastName: String!
  profileImageUrl: String
  preferredLanguage: String
  themePreference: String
  emailVerified: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  lastLogin: DateTime
  cognitoUserId: String!
  roles: [Role!]!
  projects: [Project!]!
  notifications: [Notification!]!
}

type Role {
  id: UUID!
  name: String!
  description: String
  permissions: [Permission!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Permission {
  id: UUID!
  roleId: UUID!
  resource: String!
  action: String!
  createdAt: DateTime!
}

type Project {
  id: UUID!
  name: String!
  description: String
  status: ProjectStatus!
  value: Decimal
  deadline: DateTime
  progressPercentage: Int!
  createdBy: User!
  completedBy: User
  createdAt: DateTime!
  updatedAt: DateTime!
  completedAt: DateTime
  metadata: JSON
  documents: [ProjectDocument!]!
  members: [ProjectMember!]!
  knowledgeBases: [KnowledgeBase!]!
  artifacts: [Artifact!]!
  workflowExecutions: [WorkflowExecution!]!
  submissionRecords: [SubmissionRecord!]!
}

type ProjectDocument {
  id: UUID!
  projectId: UUID!
  fileName: String!
  filePath: String!
  fileType: String!
  fileSize: Int!
  rawFileLocation: String!
  processedFileLocation: String
  uploadedBy: User!
  uploadedAt: DateTime!
  metadata: JSON
}

type ProjectMember {
  id: UUID!
  project: Project!
  user: User!
  addedBy: User!
  joinedAt: DateTime!
}

type KnowledgeBase {
  id: UUID!
  name: String!
  description: String
  scope: KnowledgeBaseScope!
  project: Project
  documentCount: Int!
  createdBy: User!
  createdAt: DateTime!
  updatedAt: DateTime!
  vectorStoreId: String
  documents: [KnowledgeBaseDocument!]!
  permissions: [KnowledgeBasePermission!]!
}

type KnowledgeBaseDocument {
  id: UUID!
  knowledgeBaseId: UUID!
  fileName: String!
  filePath: String!
  fileType: String!
  fileSize: Int!
  s3Bucket: String!
  s3Key: String!
  uploadedBy: User!
  uploadedAt: DateTime!
  metadata: JSON
  vectorIds: String
}

type KnowledgeBasePermission {
  id: UUID!
  knowledgeBase: KnowledgeBase!
  user: User
  role: Role
  permissionType: String!
  grantedAt: DateTime!
}

type Artifact {
  id: UUID!
  projectId: UUID!
  name: String!
  type: ArtifactType!
  category: ArtifactCategory!
  status: ArtifactStatus!
  createdBy: User!
  approvedBy: User
  createdAt: DateTime!
  approvedAt: DateTime
  versions: [ArtifactVersion!]!
  latestVersion: ArtifactVersion
}

type ArtifactVersion {
  id: UUID!
  artifactId: UUID!
  versionNumber: Int!
  content: JSON!
  location: String
  createdBy: User!
  createdAt: DateTime!
}

type WorkflowExecution {
  id: UUID!
  projectId: UUID!
  status: WorkflowStatus!
  initiatedBy: User!
  handledBy: User
  completedBy: User
  startedAt: DateTime!
  completedAt: DateTime
  lastUpdatedAt: DateTime!
  workflowConfig: JSON
  errorLog: JSON
  errorMessage: String
  results: JSON
  agentTasks: [AgentTask!]!
}

type AgentTask {
  id: UUID!
  workflowExecutionId: UUID!
  initiatedBy: User!
  handledBy: User
  completedBy: User
  agent: AgentType!
  status: AgentTaskStatus!
  sequenceOrder: Int!
  inputData: JSON
  outputData: JSON
  taskConfig: JSON
  errorLog: JSON
  errorMessage: String
  startedAt: DateTime
  completedAt: DateTime
  executionTimeSeconds: Float
}

type AgentConfiguration {
  id: UUID!
  agentType: AgentType!
  modelName: String!
  temperature: Float!
  maxTokens: Int!
  systemPrompt: JSON!
  additionalParameters: JSON
  enabled: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  updatedBy: User
}

type Integration {
  id: UUID!
  type: IntegrationType!
  name: String!
  configuration: JSON!
  enabled: Boolean!
  createdBy: User!
  createdAt: DateTime!
  updatedAt: DateTime!
  logs: [IntegrationLog!]!
}

type IntegrationLog {
  id: UUID!
  integrationId: UUID!
  action: String!
  status: String!
  requestData: JSON
  responseData: JSON
  errorMessage: String
  createdAt: DateTime!
}

type Notification {
  id: UUID!
  userId: UUID!
  type: NotificationType!
  title: String!
  message: String!
  read: Boolean!
  metadata: JSON
  createdAt: DateTime!
  readAt: DateTime
}

type BidStatistics {
  id: UUID!
  periodStart: DateTime!
  periodEnd: DateTime!
  submittedBids: Int!
  wonBids: Int!
  totalValue: Decimal!
  wonValue: Decimal!
  successRate: Float!
  activeRfps: Int!
  detailedMetrics: JSON
  calculatedAt: DateTime!
}

type SubmissionRecord {
  id: UUID!
  project: Project!
  artifact: Artifact!
  portalName: String!
  submissionId: String!
  status: SubmissionStatus!
  submittedBy: User!
  submittedAt: DateTime!
  submissionMetadata: JSON
}

type AuditLog {
  id: UUID!
  userId: UUID!
  action: String!
  resourceType: String!
  resourceId: UUID
  previousState: JSON
  newState: JSON
  ipAddress: String
  userAgent: String
  createdAt: DateTime!
}

type PresignedUrl {
  url: String!
  fileName: String!
  expiresAt: DateTime!
}

# Paginated Response Types
type ProjectConnection {
  edges: [ProjectEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type ProjectEdge {
  node: Project!
  cursor: String!
}

type KnowledgeBaseConnection {
  edges: [KnowledgeBaseEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type KnowledgeBaseEdge {
  node: KnowledgeBase!
  cursor: String!
}

type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

# ============================================
# QUERIES
# ============================================

type Query {
  # User Queries
  me: User!
  user(id: UUID!): User
  users(
    first: Int
    after: String
    filter: UserFilterInput
  ): UserConnection!
  
  # Project Queries
  project(id: UUID!): Project
  projects(
    first: Int
    after: String
    filter: ProjectFilterInput
  ): ProjectConnection!
  myProjects(first: Int, after: String): ProjectConnection!
  
  # Knowledge Base Queries
  knowledgeBase(id: UUID!): KnowledgeBase
  knowledgeBases(
    first: Int
    after: String
    filter: KnowledgeBaseFilterInput
  ): KnowledgeBaseConnection!
  globalKnowledgeBases: [KnowledgeBase!]!
  
  # Artifact Queries
  artifact(id: UUID!): Artifact
  artifactsByProject(projectId: UUID!): [Artifact!]!
  artifactVersion(id: UUID!): ArtifactVersion
  
  # Workflow Queries
  workflowExecution(id: UUID!): WorkflowExecution
  workflowExecutionsByProject(projectId: UUID!): [WorkflowExecution!]!
  agentTask(id: UUID!): AgentTask
  
  # Configuration Queries
  agentConfigurations: [AgentConfiguration!]!
  agentConfiguration(agentType: AgentType!): AgentConfiguration
  
  # Integration Queries
  integrations: [Integration!]!
  integration(type: IntegrationType!): Integration
  
  # Notification Queries
  myNotifications(
    first: Int
    after: String
    unreadOnly: Boolean
  ): [Notification!]!
  unreadNotificationCount: Int!
  
  # Statistics Queries
  dashboardStats: BidStatistics!
  bidStatistics(
    periodStart: DateTime!
    periodEnd: DateTime!
  ): BidStatistics
  
  # Audit Queries
  auditLogs(
    first: Int
    after: String
    userId: UUID
    resourceType: String
  ): [AuditLog!]!
  
  # Role & Permission Queries
  roles: [Role!]!
  role(id: UUID!): Role
  permissions(roleId: UUID!): [Permission!]!
}

# ============================================
# MUTATIONS
# ============================================

type Mutation {
  # Project Mutations
  createProject(input: CreateProjectInput!): Project!
  updateProject(id: UUID!, input: UpdateProjectInput!): Project!
  deleteProject(id: UUID!): Boolean!
  addProjectMember(projectId: UUID!, userId: UUID!): ProjectMember!
  removeProjectMember(projectId: UUID!, userId: UUID!): Boolean!
  
  # Project Document Mutations
  createProjectDocument(input: CreateProjectDocumentInput!): ProjectDocument!
  updateProjectDocument(
    id: UUID!
    input: UpdateProjectDocumentInput!
  ): ProjectDocument!
  deleteProjectDocument(id: UUID!): Boolean!
  generatePresignedUrls(
    projectId: UUID!
    files: [PresignedUrlRequest!]!
  ): [PresignedUrl!]!
  
  # Knowledge Base Mutations
  createKnowledgeBase(input: CreateKnowledgeBaseInput!): KnowledgeBase!
  updateKnowledgeBase(
    id: UUID!
    name: String
    description: String
  ): KnowledgeBase!
  deleteKnowledgeBase(id: UUID!): Boolean!
  uploadKnowledgeBaseDocument(
    input: UploadKnowledgeBaseDocumentInput!
  ): KnowledgeBaseDocument!
  deleteKnowledgeBaseDocument(id: UUID!): Boolean!
  
  # User Mutations
  createUser(input: CreateUserInput!): User!
  updateUser(id: UUID!, input: UpdateUserInput!): User!
  deleteUser(id: UUID!): Boolean!
  assignRole(userId: UUID!, roleId: UUID!): UserRole!
  removeRole(userId: UUID!, roleId: UUID!): Boolean!
  updateMyProfile(input: UpdateUserInput!): User!
  
  # Artifact Mutations
  createArtifact(input: CreateArtifactInput!): Artifact!
  updateArtifactVersion(input: UpdateArtifactVersionInput!): ArtifactVersion!
  approveArtifact(id: UUID!): Artifact!
  rejectArtifact(id: UUID!): Artifact!
  
  # Agent Configuration Mutations
  updateAgentConfiguration(
    input: UpdateAgentConfigurationInput!
  ): AgentConfiguration!
  
  # Integration Mutations
  updateIntegration(input: UpdateIntegrationInput!): Integration!
  testIntegration(type: IntegrationType!): Boolean!
  
  # Notification Mutations
  markNotificationAsRead(id: UUID!): Notification!
  markAllNotificationsAsRead: Boolean!
  deleteNotification(id: UUID!): Boolean!
  
  # System Mutations
  updateSystemSettings(settings: JSON!): JSON!
}

# ============================================
# SUBSCRIPTIONS
# ============================================

type Subscription {
  # Project Subscriptions
  projectUpdated(projectId: UUID!): Project!
  
  # Workflow Subscriptions
  workflowExecutionUpdated(workflowExecutionId: UUID!): WorkflowExecution!
  agentTaskUpdated(workflowExecutionId: UUID!): AgentTask!
  
  # Notification Subscriptions
  notificationReceived(userId: UUID!): Notification!
  
  # Artifact Subscriptions
  artifactCreated(projectId: UUID!): Artifact!
  artifactUpdated(artifactId: UUID!): Artifact!
}

# ============================================
# SCHEMA
# ============================================

schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}