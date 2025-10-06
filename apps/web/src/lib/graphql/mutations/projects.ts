/**
 * Project GraphQL Mutations
 */

export const CREATE_PROJECT = `
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      description
      status
      deadline
      createdAt
    }
  }
`;

export const UPDATE_PROJECT = `
  mutation UpdateProject($id: ID!, $input: UpdateProjectInput!) {
    updateProject(id: $id, input: $input) {
      id
      name
      description
      status
      deadline
      progressPercentage
      updatedAt
    }
  }
`;

export const DELETE_PROJECT = `
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id) {
      success
      message
    }
  }
`;

export const GENERATE_PRESIGNED_URLS = `
  mutation GeneratePresignedUrls($projectId: ID!, $files: [FileInput!]!) {
    generatePresignedUrls(projectId: $projectId, files: $files) {
      fileName
      fileType
      presignedUrl
      s3Key
    }
  }
`;

export const UPDATE_PROJECT_DOCUMENTS = `
  mutation UpdateProjectDocuments($projectId: ID!, $documents: [DocumentInput!]!) {
    updateProjectDocuments(projectId: $projectId, documents: $documents) {
      id
      fileName
      fileType
      rawFileLocation
      uploadedAt
    }
  }
`;

export const ADD_PROJECT_MEMBER = `
  mutation AddProjectMember($projectId: ID!, $userId: ID!, $role: String) {
    addProjectMember(projectId: $projectId, userId: $userId, role: $role) {
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
`;

export const REMOVE_PROJECT_MEMBER = `
  mutation RemoveProjectMember($projectId: ID!, $userId: ID!) {
    removeProjectMember(projectId: $projectId, userId: $userId) {
      success
      message
    }
  }
`;
