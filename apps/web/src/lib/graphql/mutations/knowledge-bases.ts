/**
 * Knowledge Base GraphQL Mutations
 */

export const CREATE_KNOWLEDGE_BASE = `
  mutation CreateKnowledgeBase($input: CreateKnowledgeBaseInput!) {
    createKnowledgeBase(input: $input) {
      id
      name
      description
      type
      bedrockKnowledgeBaseId
      createdAt
    }
  }
`;

export const UPDATE_KNOWLEDGE_BASE = `
  mutation UpdateKnowledgeBase($id: ID!, $input: UpdateKnowledgeBaseInput!) {
    updateKnowledgeBase(id: $id, input: $input) {
      id
      name
      description
      updatedAt
    }
  }
`;

export const DELETE_KNOWLEDGE_BASE = `
  mutation DeleteKnowledgeBase($id: ID!) {
    deleteKnowledgeBase(id: $id) {
      success
      message
    }
  }
`;

export const ADD_KNOWLEDGE_BASE_DOCUMENT = `
  mutation AddKnowledgeBaseDocument($knowledgeBaseId: ID!, $input: DocumentInput!) {
    addKnowledgeBaseDocument(knowledgeBaseId: $knowledgeBaseId, input: $input) {
      id
      fileName
      fileType
      s3Location
      uploadedAt
    }
  }
`;

export const REMOVE_KNOWLEDGE_BASE_DOCUMENT = `
  mutation RemoveKnowledgeBaseDocument($knowledgeBaseId: ID!, $documentId: ID!) {
    removeKnowledgeBaseDocument(knowledgeBaseId: $knowledgeBaseId, documentId: $documentId) {
      success
      message
    }
  }
`;

export const SET_KNOWLEDGE_BASE_PERMISSION = `
  mutation SetKnowledgeBasePermission($knowledgeBaseId: ID!, $userId: ID!, $canRead: Boolean!, $canWrite: Boolean!) {
    setKnowledgeBasePermission(knowledgeBaseId: $knowledgeBaseId, userId: $userId, canRead: $canRead, canWrite: $canWrite) {
      id
      user {
        id
        email
      }
      canRead
      canWrite
    }
  }
`;
