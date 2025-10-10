/**
 * Knowledge Base GraphQL Queries
 */

export const GET_KNOWLEDGE_BASES = `
  query GetKnowledgeBases($type: String, $projectId: ID) {
    knowledgeBases(type: $type, projectId: $projectId) {
      id
      name
      description
      type
      bedrockKnowledgeBaseId
      createdAt
      updatedAt
      project {
        id
        name
      }
      documents {
        id
        fileName
        fileType
      }
    }
  }
`;

export const GET_KNOWLEDGE_BASE = `
  query GetKnowledgeBase($id: ID!) {
    knowledgeBase(id: $id) {
      id
      name
      description
      type
      bedrockKnowledgeBaseId
      createdAt
      updatedAt
      project {
        id
        name
      }
      documents {
        id
        fileName
        fileType
        s3Location
        uploadedAt
      }
      permissions {
        id
        user {
          id
          firstName
          lastName
          email
        }
        canRead
        canWrite
      }
    }
  }
`;

export const GET_KNOWLEDGE_BASE_DOCUMENTS = `
  query GetKnowledgeBaseDocuments($knowledgeBaseId: ID!, $search: String) {
    knowledgeBaseDocuments(knowledgeBaseId: $knowledgeBaseId, search: $search) {
      id
      fileName
      fileType
      s3Location
      uploadedAt
    }
  }
`;
