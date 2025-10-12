import { gql } from 'graphql-request';

export const GET_WORKFLOW_EXECUTION = gql`
  query GetWorkflowExecution($id: UUID!) {
    workflowExecution(id: $id) {
      id
      projectId
      status
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
      startedAt
      completedAt
      lastUpdatedAt
      workflowConfig
      errorLog
      errorMessage
      results
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

export const GET_WORKFLOW_EXECUTIONS_BY_PROJECT = gql`
  query GetWorkflowExecutionsByProject($projectId: UUID!) {
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
      }
    }
  }
`;

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