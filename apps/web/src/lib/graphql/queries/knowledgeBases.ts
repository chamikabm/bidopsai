/**
 * GraphQL Queries for Knowledge Bases
 * 
 * @module lib/graphql/queries/knowledgeBases
 */

import { gql } from 'graphql-request';

/**
 * Fragment for knowledge base basic fields
 */
export const KNOWLEDGE_BASE_BASIC_FIELDS = gql`
  fragment KnowledgeBaseBasicFields on KnowledgeBase {
    id
    name
    description
    scope
    documentCount
    vectorStoreId
    createdAt
    updatedAt
  }
`;

/**
 * Fragment for knowledge base with creator
 */
export const KNOWLEDGE_BASE_WITH_CREATOR = gql`
  ${KNOWLEDGE_BASE_BASIC_FIELDS}
  fragment KnowledgeBaseWithCreator on KnowledgeBase {
    ...KnowledgeBaseBasicFields
    createdBy {
      id
      firstName
      lastName
      email
      profileImageUrl
    }
    project {
      id
      name
      status
    }
  }
`;

/**
 * Fragment for knowledge base full details
 */
export const KNOWLEDGE_BASE_FULL_DETAILS = gql`
  ${KNOWLEDGE_BASE_WITH_CREATOR}
  fragment KnowledgeBaseFullDetails on KnowledgeBase {
    ...KnowledgeBaseWithCreator
    documents {
      id
      fileName
      filePath
      fileType
      fileSize
      s3Bucket
      s3Key
      uploadedAt
      metadata
      vectorIds
      uploadedBy {
        id
        firstName
        lastName
        email
      }
    }
    permissions {
      id
      permissionType
      grantedAt
      user {
        id
        firstName
        lastName
        email
      }
      role {
        id
        name
      }
    }
  }
`;

/**
 * Query to get a single knowledge base by ID
 */
export const GET_KNOWLEDGE_BASE = gql`
  ${KNOWLEDGE_BASE_FULL_DETAILS}
  query GetKnowledgeBase($id: UUID!) {
    knowledgeBase(id: $id) {
      ...KnowledgeBaseFullDetails
    }
  }
`;

/**
 * Query to get all knowledge bases with pagination and filters
 */
export const GET_KNOWLEDGE_BASES = gql`
  ${KNOWLEDGE_BASE_WITH_CREATOR}
  query GetKnowledgeBases(
    $first: Int
    $after: String
    $filter: KnowledgeBaseFilterInput
  ) {
    knowledgeBases(first: $first, after: $after, filter: $filter) {
      edges {
        node {
          ...KnowledgeBaseWithCreator
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

/**
 * Query to get global knowledge bases
 */
export const GET_GLOBAL_KNOWLEDGE_BASES = gql`
  ${KNOWLEDGE_BASE_WITH_CREATOR}
  query GetGlobalKnowledgeBases {
    globalKnowledgeBases {
      ...KnowledgeBaseWithCreator
    }
  }
`;

/**
 * Query to get knowledge base documents
 */
export const GET_KNOWLEDGE_BASE_DOCUMENTS = gql`
  query GetKnowledgeBaseDocuments($knowledgeBaseId: UUID!) {
    knowledgeBase(id: $knowledgeBaseId) {
      id
      name
      documents {
        id
        fileName
        filePath
        fileType
        fileSize
        s3Bucket
        s3Key
        uploadedAt
        metadata
        vectorIds
        uploadedBy {
          id
          firstName
          lastName
          email
        }
      }
    }
  }
`;

/**
 * Query to get knowledge base permissions
 */
export const GET_KNOWLEDGE_BASE_PERMISSIONS = gql`
  query GetKnowledgeBasePermissions($knowledgeBaseId: UUID!) {
    knowledgeBase(id: $knowledgeBaseId) {
      id
      name
      permissions {
        id
        permissionType
        grantedAt
        user {
          id
          firstName
          lastName
          email
          profileImageUrl
          roles {
            id
            name
          }
        }
        role {
          id
          name
          description
        }
      }
    }
  }
`;