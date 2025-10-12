/**
 * GraphQL Enum Type Definitions
 */

export const enumTypeDefs = `#graphql
  # ====================
  # Enums
  # ====================
  
  enum ProjectStatus {
    OPEN
    IN_PROGRESS
    COMPLETED
    FAILED
  }
  
  enum WorkflowStatus {
    OPEN
    IN_PROGRESS
    WAITING
    COMPLETED
    FAILED
  }
  
  enum AgentType {
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
    APPROVED
    REJECTED
  }
  
  enum KnowledgeBaseScope {
    GLOBAL
    PROJECT
  }
  
  enum NotificationType {
    PROJECT_UPDATE
    WORKFLOW_COMPLETE
    ARTIFACT_READY
    SUBMISSION_SENT
  }
  
  enum IntegrationType {
    SLACK
    EMAIL
    S3
    BEDROCK
  }
`;