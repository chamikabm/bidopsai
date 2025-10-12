/**
 * GraphQL Queries for Artifacts
 * 
 * @module lib/graphql/queries/artifacts
 */

import { gql } from 'graphql-request';

/**
 * Fragment for artifact basic fields
 */
export const ARTIFACT_BASIC_FIELDS = gql`
  fragment ArtifactBasicFields on Artifact {
    id
    projectId
    name
    type
    category
    status
    createdAt
    approvedAt
  }
`;

/**
 * Fragment for artifact with creator
 */
export const ARTIFACT_WITH_CREATOR = gql`
  ${ARTIFACT_BASIC_FIELDS}
  fragment ArtifactWithCreator on Artifact {
    ...ArtifactBasicFields
    createdBy {
      id
      firstName
      lastName
      email
      profileImageUrl
    }
    approvedBy {
      id
      firstName
      lastName
      email
    }
  }
`;

/**
 * Fragment for artifact version
 */
export const ARTIFACT_VERSION_FIELDS = gql`
  fragment ArtifactVersionFields on ArtifactVersion {
    id
    artifactId
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
`;

/**
 * Fragment for artifact full details
 */
export const ARTIFACT_FULL_DETAILS = gql`
  ${ARTIFACT_WITH_CREATOR}
  ${ARTIFACT_VERSION_FIELDS}
  fragment ArtifactFullDetails on Artifact {
    ...ArtifactWithCreator
    versions {
      ...ArtifactVersionFields
    }
    latestVersion {
      ...ArtifactVersionFields
    }
  }
`;

/**
 * Query to get a single artifact by ID
 */
export const GET_ARTIFACT = gql`
  ${ARTIFACT_FULL_DETAILS}
  query GetArtifact($id: UUID!) {
    artifact(id: $id) {
      ...ArtifactFullDetails
    }
  }
`;

/**
 * Query to get artifacts by project
 */
export const GET_ARTIFACTS_BY_PROJECT = gql`
  ${ARTIFACT_FULL_DETAILS}
  query GetArtifactsByProject($projectId: UUID!) {
    artifactsByProject(projectId: $projectId) {
      ...ArtifactFullDetails
    }
  }
`;

/**
 * Query to get a specific artifact version
 */
export const GET_ARTIFACT_VERSION = gql`
  ${ARTIFACT_VERSION_FIELDS}
  query GetArtifactVersion($id: UUID!) {
    artifactVersion(id: $id) {
      ...ArtifactVersionFields
    }
  }
`;

/**
 * Query to get workflow execution details
 */
export const GET_WORKFLOW_EXECUTION = gql`
  query GetWorkflowExecution($id: UUID!) {
    workflowExecution(id: $id) {
      id
      projectId
      status
      startedAt
      completedAt
      lastUpdatedAt
      workflowConfig
      errorLog
      errorMessage
      results
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
        inputData
        outputData
        taskConfig
        errorLog
        errorMessage
        startedAt
        completedAt
        executionTimeSeconds
        initiatedBy {
          id
          firstName
          lastName
        }
        handledBy {
          id
          firstName
          lastName
        }
        completedBy {
          id
          firstName
          lastName
        }
      }
    }
  }
`;

/**
 * Query to get agent task details
 */
export const GET_AGENT_TASK = gql`
  query GetAgentTask($id: UUID!) {
    agentTask(id: $id) {
      id
      workflowExecutionId
      agent
      status
      sequenceOrder
      inputData
      outputData
      taskConfig
      errorLog
      errorMessage
      startedAt
      completedAt
      executionTimeSeconds
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
    }
  }
`;

/**
 * Query to get agent configurations
 */
export const GET_AGENT_CONFIGURATIONS = gql`
  query GetAgentConfigurations {
    agentConfigurations {
      id
      agentType
      modelName
      temperature
      maxTokens
      systemPrompt
      additionalParameters
      enabled
      createdAt
      updatedAt
      updatedBy {
        id
        firstName
        lastName
      }
    }
  }
`;

/**
 * Query to get a specific agent configuration
 */
export const GET_AGENT_CONFIGURATION = gql`
  query GetAgentConfiguration($agentType: AgentType!) {
    agentConfiguration(agentType: $agentType) {
      id
      agentType
      modelName
      temperature
      maxTokens
      systemPrompt
      additionalParameters
      enabled
      createdAt
      updatedAt
      updatedBy {
        id
        firstName
        lastName
      }
    }
  }
`;

/**
 * Query to get integrations
 */
export const GET_INTEGRATIONS = gql`
  query GetIntegrations {
    integrations {
      id
      type
      name
      configuration
      enabled
      createdAt
      updatedAt
      createdBy {
        id
        firstName
        lastName
      }
    }
  }
`;

/**
 * Query to get a specific integration
 */
export const GET_INTEGRATION = gql`
  query GetIntegration($type: IntegrationType!) {
    integration(type: $type) {
      id
      type
      name
      configuration
      enabled
      createdAt
      updatedAt
      createdBy {
        id
        firstName
        lastName
      }
      logs {
        id
        action
        status
        requestData
        responseData
        errorMessage
        createdAt
      }
    }
  }
`;

/**
 * Query to get audit logs
 */
export const GET_AUDIT_LOGS = gql`
  query GetAuditLogs(
    $first: Int
    $after: String
    $userId: UUID
    $resourceType: String
  ) {
    auditLogs(
      first: $first
      after: $after
      userId: $userId
      resourceType: $resourceType
    ) {
      id
      userId
      action
      resourceType
      resourceId
      previousState
      newState
      ipAddress
      userAgent
      createdAt
    }
  }
`;