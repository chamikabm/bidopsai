/**
 * Project GraphQL Queries
 */

export const GET_PROJECTS = `
  query GetProjects($limit: Int, $offset: Int, $status: String) {
    projects(limit: $limit, offset: $offset, status: $status) {
      id
      name
      description
      status
      deadline
      progressPercentage
      createdAt
      updatedAt
      createdBy {
        id
        firstName
        lastName
        email
      }
      members {
        id
        user {
          id
          firstName
          lastName
          email
        }
        role
      }
    }
  }
`;

export const GET_PROJECT = `
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      name
      description
      status
      deadline
      progressPercentage
      createdAt
      updatedAt
      completedAt
      createdBy {
        id
        firstName
        lastName
        email
      }
      members {
        id
        user {
          id
          firstName
          lastName
          email
        }
        role
      }
      documents {
        id
        fileName
        fileType
        rawFileLocation
        processedFileLocation
        uploadedAt
      }
      knowledgeBases {
        id
        name
        description
        type
      }
      workflowExecutions {
        id
        status
        startedAt
        completedAt
      }
    }
  }
`;

export const GET_PROJECT_DOCUMENTS = `
  query GetProjectDocuments($projectId: ID!) {
    projectDocuments(projectId: $projectId) {
      id
      fileName
      fileType
      rawFileLocation
      processedFileLocation
      uploadedAt
    }
  }
`;

export const GET_PROJECT_WORKFLOW = `
  query GetProjectWorkflow($projectId: ID!) {
    workflowExecutions(projectId: $projectId) {
      id
      status
      startedAt
      completedAt
      lastUpdatedAt
      errorMessage
      agentTasks {
        id
        agent
        status
        sequenceOrder
        startedAt
        completedAt
        errorMessage
      }
    }
  }
`;
