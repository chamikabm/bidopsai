/**
 * GraphQL Input Type Definitions
 */

export const inputTypeDefs = `#graphql
  # ====================
  # Input Types
  # ====================
  
  input CreateProjectInput {
    name: String!
    description: String
    deadline: Date
    knowledgeBaseIds: [UUID!]
    memberUserIds: [UUID!]
  }
  
  input UpdateProjectInput {
    name: String
    description: String
    status: ProjectStatus
    value: Decimal
    deadline: Date
    progressPercentage: Int
  }
  
  input CreateProjectDocumentInput {
    projectId: UUID!
    fileName: String!
    filePath: String!
    fileType: String!
    fileSize: Int!
    rawFileLocation: String!
  }
  
  input UpdateProjectDocumentInput {
    processedFileLocation: String
    metadata: JSON
  }
  
  input PresignedUrlRequest {
    fileName: String!
    fileType: String!
    fileSize: Int!
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
  }
  
  input CreateUserInput {
    email: String!
    username: String!
    firstName: String!
    lastName: String!
    profileImageUrl: String
    cognitoUserId: String!
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
  
  input UserFilterInput {
    emailVerified: Boolean
    roleNames: [String!]
  }
  
  input ProjectFilterInput {
    status: ProjectStatus
    createdBy: UUID
    startDate: Date
    endDate: Date
  }
  
  input KnowledgeBaseFilterInput {
    scope: KnowledgeBaseScope
    projectId: UUID
  }
`;