/**
 * GraphQL Subscription Type Definitions
 */

export const subscriptionTypeDefs = `#graphql
  # ====================
  # Subscription Root
  # ====================
  
  type Subscription {
    # Project subscriptions
    projectUpdated(projectId: UUID!): Project!
  
    # Workflow subscriptions
    workflowExecutionUpdated(workflowExecutionId: UUID!): WorkflowExecution!
    agentTaskUpdated(workflowExecutionId: UUID!): AgentTask!
  
    # Notification subscriptions
    notificationReceived(userId: UUID!): Notification!
  
    # Artifact subscriptions
    artifactCreated(projectId: UUID!): Artifact!
    artifactUpdated(artifactId: UUID!): Artifact!
  }
`;