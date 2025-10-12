/**
 * GraphQL Mutations for Artifacts
 * 
 * @module lib/graphql/mutations/artifacts
 */

import { gql } from 'graphql-request';
import { ARTIFACT_FULL_DETAILS, ARTIFACT_VERSION_FIELDS } from '../queries/artifacts';

/**
 * Mutation to create an artifact
 */
export const CREATE_ARTIFACT = gql`
  ${ARTIFACT_FULL_DETAILS}
  mutation CreateArtifact($input: CreateArtifactInput!) {
    createArtifact(input: $input) {
      ...ArtifactFullDetails
    }
  }
`;

/**
 * Mutation to update an artifact version (creates new version)
 */
export const UPDATE_ARTIFACT_VERSION = gql`
  ${ARTIFACT_VERSION_FIELDS}
  mutation UpdateArtifactVersion($input: UpdateArtifactVersionInput!) {
    updateArtifactVersion(input: $input) {
      ...ArtifactVersionFields
    }
  }
`;

/**
 * Mutation to approve an artifact
 */
export const APPROVE_ARTIFACT = gql`
  ${ARTIFACT_FULL_DETAILS}
  mutation ApproveArtifact($id: UUID!) {
    approveArtifact(id: $id) {
      ...ArtifactFullDetails
    }
  }
`;

/**
 * Mutation to reject an artifact
 */
export const REJECT_ARTIFACT = gql`
  ${ARTIFACT_FULL_DETAILS}
  mutation RejectArtifact($id: UUID!) {
    rejectArtifact(id: $id) {
      ...ArtifactFullDetails
    }
  }
`;

/**
 * Mutation to update agent configuration
 */
export const UPDATE_AGENT_CONFIGURATION = gql`
  mutation UpdateAgentConfiguration($input: UpdateAgentConfigurationInput!) {
    updateAgentConfiguration(input: $input) {
      id
      agentType
      modelName
      temperature
      maxTokens
      systemPrompt
      additionalParameters
      enabled
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
 * Mutation to update integration
 */
export const UPDATE_INTEGRATION = gql`
  mutation UpdateIntegration($input: UpdateIntegrationInput!) {
    updateIntegration(input: $input) {
      id
      type
      name
      configuration
      enabled
      updatedAt
    }
  }
`;

/**
 * Mutation to test an integration
 */
export const TEST_INTEGRATION = gql`
  mutation TestIntegration($type: IntegrationType!) {
    testIntegration(type: $type)
  }
`;