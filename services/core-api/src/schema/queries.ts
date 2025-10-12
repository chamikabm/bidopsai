/**
 * GraphQL Query Type Definitions
 */

export const queryTypeDefs = `#graphql
  # ====================
  # Query Root
  # ====================
  
  type Query {
    # User queries
    me: User!
    user(id: UUID!): User
    users(
      first: Int
      after: String
      filter: UserFilterInput
    ): UserConnection!
  
    # Project queries
    project(id: UUID!): Project
    projects(
      first: Int
      after: String
      filter: ProjectFilterInput
    ): ProjectConnection!
    myProjects(
      first: Int
      after: String
    ): ProjectConnection!
  
    # Knowledge base queries
    knowledgeBase(id: UUID!): KnowledgeBase
    knowledgeBases(
      first: Int
      after: String
      filter: KnowledgeBaseFilterInput
    ): KnowledgeBaseConnection!
    globalKnowledgeBases: [KnowledgeBase!]!
  
    # Artifact queries
    artifact(id: UUID!): Artifact
    artifactsByProject(projectId: UUID!): [Artifact!]!
    artifactVersion(id: UUID!): ArtifactVersion
  
    # Workflow queries
    workflowExecution(id: UUID!): WorkflowExecution
    workflowExecutionsByProject(projectId: UUID!): [WorkflowExecution!]!
    agentTask(id: UUID!): AgentTask
  
    # Configuration queries
    agentConfigurations: [AgentConfiguration!]!
    agentConfiguration(agentType: AgentType!): AgentConfiguration
  
    # Integration queries
    integrations: [Integration!]!
    integration(type: IntegrationType!): Integration
  
    # Notification queries
    myNotifications(
      first: Int
      after: String
      unreadOnly: Boolean
    ): [Notification!]!
    unreadNotificationCount: Int!
  
    # Statistics queries
    dashboardStats: BidStatistics
    bidStatistics(
      periodStart: DateTime!
      periodEnd: DateTime!
    ): BidStatistics
  
    # Audit queries
    auditLogs(
      first: Int
      after: String
      userId: UUID
      resourceType: String
    ): [AuditLog!]!
  
    # Role queries
    roles: [Role!]!
    role(id: UUID!): Role
    permissions(roleId: UUID!): [Permission!]!
  }
`;