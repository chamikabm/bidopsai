/**
 * GraphQL Queries for Projects
 * 
 * @module lib/graphql/queries/projects
 */

import { gql } from 'graphql-request';

/**
 * Fragment for project basic fields
 */
export const PROJECT_BASIC_FIELDS = gql`
  fragment ProjectBasicFields on Project {
    id
    name
    description
    status
    value
    deadline
    progressPercentage
    createdAt
    updatedAt
    completedAt
    metadata
  }
`;

/**
 * Fragment for project with creator
 */
export const PROJECT_WITH_CREATOR = gql`
  ${PROJECT_BASIC_FIELDS}
  fragment ProjectWithCreator on Project {
    ...ProjectBasicFields
    createdBy {
      id
      firstName
      lastName
      email
      profileImageUrl
    }
    completedBy {
      id
      firstName
      lastName
      email
    }
  }
`;

/**
 * Fragment for project full details
 */
export const PROJECT_FULL_DETAILS = gql`
  ${PROJECT_WITH_CREATOR}
  fragment ProjectFullDetails on Project {
    ...ProjectWithCreator
    documents {
      id
      fileName
      filePath
      fileType
      fileSize
      rawFileLocation
      processedFileLocation
      uploadedAt
      uploadedBy {
        id
        firstName
        lastName
      }
    }
    members {
      id
      joinedAt
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
      addedBy {
        id
        firstName
        lastName
      }
    }
    knowledgeBases {
      id
      name
      scope
      documentCount
    }
  }
`;

/**
 * Query to get a single project by ID
 */
export const GET_PROJECT = gql`
  ${PROJECT_FULL_DETAILS}
  query GetProject($id: UUID!) {
    project(id: $id) {
      ...ProjectFullDetails
      artifacts {
        id
        name
        type
        category
        status
        createdAt
        createdBy {
          id
          firstName
          lastName
        }
        latestVersion {
          id
          versionNumber
          createdAt
        }
      }
      workflowExecutions {
        id
        status
        startedAt
        completedAt
        lastUpdatedAt
        initiatedBy {
          id
          firstName
          lastName
        }
      }
    }
  }
`;

/**
 * Query to get all projects with pagination and filters
 */
export const GET_PROJECTS = gql`
  ${PROJECT_WITH_CREATOR}
  query GetProjects(
    $first: Int
    $after: String
    $filter: ProjectFilterInput
  ) {
    projects(first: $first, after: $after, filter: $filter) {
      edges {
        node {
          ...ProjectWithCreator
          members {
            id
            user {
              id
              firstName
              lastName
              profileImageUrl
            }
          }
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
 * Query to get user's projects
 */
export const GET_MY_PROJECTS = gql`
  ${PROJECT_WITH_CREATOR}
  query GetMyProjects($first: Int, $after: String) {
    myProjects(first: $first, after: $after) {
      edges {
        node {
          ...ProjectWithCreator
          members {
            id
            user {
              id
              firstName
              lastName
              profileImageUrl
            }
          }
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
 * Query to get project documents
 */
export const GET_PROJECT_DOCUMENTS = gql`
  query GetProjectDocuments($projectId: UUID!) {
    project(id: $projectId) {
      id
      documents {
        id
        fileName
        filePath
        fileType
        fileSize
        rawFileLocation
        processedFileLocation
        uploadedAt
        metadata
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
 * Query to get project artifacts
 */
export const GET_PROJECT_ARTIFACTS = gql`
  query GetProjectArtifacts($projectId: UUID!) {
    artifactsByProject(projectId: $projectId) {
      id
      name
      type
      category
      status
      createdAt
      approvedAt
      createdBy {
        id
        firstName
        lastName
      }
      approvedBy {
        id
        firstName
        lastName
      }
      versions {
        id
        versionNumber
        createdAt
        createdBy {
          id
          firstName
          lastName
        }
      }
      latestVersion {
        id
        versionNumber
        content
        location
        createdAt
      }
    }
  }
`;

/**
 * Query to get project workflow executions
 */
export const GET_PROJECT_WORKFLOW_EXECUTIONS = gql`
  query GetProjectWorkflowExecutions($projectId: UUID!) {
    workflowExecutionsByProject(projectId: $projectId) {
      id
      status
      startedAt
      completedAt
      lastUpdatedAt
      errorMessage
      initiatedBy {
        id
        firstName
        lastName
        email
      }
      handledBy {
        id
        firstName
        lastName
        email
      }
      completedBy {
        id
        firstName
        lastName
        email
      }
      agentTasks {
        id
        agent
        status
        sequenceOrder
        startedAt
        completedAt
        executionTimeSeconds
        errorMessage
      }
    }
  }
`;

/**
 * Query to get project members
 */
export const GET_PROJECT_MEMBERS = gql`
  query GetProjectMembers($projectId: UUID!) {
    project(id: $projectId) {
      id
      members {
        id
        joinedAt
        user {
          id
          firstName
          lastName
          email
          profileImageUrl
          roles {
            id
            name
            description
          }
        }
        addedBy {
          id
          firstName
          lastName
        }
      }
    }
  }
`;

/**
 * Query to get dashboard statistics
 */
export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      id
      submittedBids
      wonBids
      totalValue
      wonValue
      successRate
      activeRfps
      detailedMetrics
      calculatedAt
    }
  }
`;