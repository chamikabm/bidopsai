/**
 * Agent Configuration GraphQL Mutations
 */

export const UPDATE_AGENT_CONFIGURATION = `
  mutation UpdateAgentConfiguration($agentType: AgentType!, $input: AgentConfigInput!) {
    updateAgentConfiguration(agentType: $agentType, input: $input) {
      id
      agentType
      modelName
      temperature
      maxTokens
      systemPrompt
      additionalParameters
      updatedAt
    }
  }
`;

export const GET_AGENT_CONFIGURATIONS = `
  query GetAgentConfigurations {
    agentConfigurations {
      id
      agentType
      modelName
      temperature
      maxTokens
      systemPrompt
      additionalParameters
      createdAt
      updatedAt
    }
  }
`;

export const GET_AGENT_CONFIGURATION = `
  query GetAgentConfiguration($agentType: AgentType!) {
    agentConfiguration(agentType: $agentType) {
      id
      agentType
      modelName
      temperature
      maxTokens
      systemPrompt
      additionalParameters
      createdAt
      updatedAt
    }
  }
`;
