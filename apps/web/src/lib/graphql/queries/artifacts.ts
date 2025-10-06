/**
 * Artifact GraphQL Queries
 */

export const GET_ARTIFACTS = `
  query GetArtifacts($projectId: ID!) {
    artifacts(projectId: $projectId) {
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

export const GET_ARTIFACT = `
  query GetArtifact($id: ID!) {
    artifact(id: $id) {
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
        content
        location
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

export const GET_ARTIFACT_VERSIONS = `
  query GetArtifactVersions($artifactId: ID!) {
    artifactVersions(artifactId: $artifactId) {
      id
      versionNumber
      content
      location
      createdAt
      createdBy {
        id
        firstName
        lastName
      }
    }
  }
`;
