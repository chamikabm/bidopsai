/**
 * GraphQL Mutation Type Definitions
 */

export const mutationTypeDefs = `#graphql
  # ====================
  # Mutation Root
  # ====================
  
  type Mutation {
    # Project mutations
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: UUID!, input: UpdateProjectInput!): Project!
    deleteProject(id: UUID!): Boolean!
    addProjectMember(projectId: UUID!, userId: UUID!): ProjectMember!
    removeProjectMember(projectId: UUID!, userId: UUID!): Boolean!
  
    # Project document mutations
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
  
    # Knowledge base mutations
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
  
    # User mutations
    createUser(input: CreateUserInput!): User!
    updateUser(id: UUID!, input: UpdateUserInput!): User!
    deleteUser(id: UUID!): Boolean!
    assignRole(userId: UUID!, roleId: UUID!): Role!
    removeRole(userId: UUID!, roleId: UUID!): Boolean!
    updateMyProfile(input: UpdateUserInput!): User!
  
    # Artifact mutations
    createArtifact(input: CreateArtifactInput!): Artifact!
    updateArtifactVersion(input: UpdateArtifactVersionInput!): ArtifactVersion!
    approveArtifact(id: UUID!): Artifact!
    rejectArtifact(id: UUID!): Artifact!
  
    # Agent configuration mutations
    updateAgentConfiguration(
      input: UpdateAgentConfigurationInput!
    ): AgentConfiguration!
  
    # Integration mutations
    updateIntegration(input: UpdateIntegrationInput!): Integration!
    testIntegration(type: IntegrationType!): Boolean!
  
    # Notification mutations
    markNotificationAsRead(id: UUID!): Notification!
    markAllNotificationsAsRead: Boolean!
    deleteNotification(id: UUID!): Boolean!
  
    # System mutations
    updateSystemSettings(settings: JSON!): Boolean!
  }
`;