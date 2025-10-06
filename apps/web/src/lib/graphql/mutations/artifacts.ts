/**
 * Artifact GraphQL Mutations
 */

export const CREATE_ARTIFACT = `
  mutation CreateArtifact($input: CreateArtifactInput!) {
    createArtifact(input: $input) {
      id
      name
      type
      category
      status
      createdAt
    }
  }
`;

export const UPDATE_ARTIFACT = `
  mutation UpdateArtifact($id: ID!, $input: UpdateArtifactInput!) {
    updateArtifact(id: $id, input: $input) {
      id
      name
      status
      updatedAt
    }
  }
`;

export const DELETE_ARTIFACT = `
  mutation DeleteArtifact($id: ID!) {
    deleteArtifact(id: $id) {
      success
      message
    }
  }
`;

export const CREATE_ARTIFACT_VERSION = `
  mutation CreateArtifactVersion($artifactId: ID!, $input: CreateArtifactVersionInput!) {
    createArtifactVersion(artifactId: $artifactId, input: $input) {
      id
      versionNumber
      content
      location
      createdAt
    }
  }
`;

export const APPROVE_ARTIFACT = `
  mutation ApproveArtifact($id: ID!) {
    approveArtifact(id: $id) {
      id
      status
      approvedAt
      approvedBy {
        id
        firstName
        lastName
      }
    }
  }
`;
