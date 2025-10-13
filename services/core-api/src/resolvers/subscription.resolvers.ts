/**
 * Subscription Resolvers
 * 
 * Real-time GraphQL subscriptions using PubSub.
 * Provides live updates for projects, workflows, artifacts, and notifications.
 */

import { GraphQLContext } from '../context';
import { SubscriptionTopic } from '../services/pubsub.service';
import { withFilter } from 'graphql-subscriptions';

/**
 * Filter function helper for user-specific subscriptions
 */
const filterByUserId = (userId: string) => {
  return (payload: any, variables: any, context: GraphQLContext) => {
    // Allow if no userId filter specified
    if (!variables.userId) return true;
    
    // Check if payload contains userId and matches
    return payload.userId === variables.userId;
  };
};

/**
 * Filter function for project-specific subscriptions
 */
const filterByProjectId = (projectId: string) => {
  return (payload: any, variables: any) => {
    if (!variables.projectId) return true;
    return payload.projectId === variables.projectId;
  };
};

export const subscriptionResolvers = {
  Subscription: {
    /**
     * Subscribe to project updates
     */
    projectUpdated: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          return context.services.pubsub.asyncIterator(
            SubscriptionTopic.PROJECT_UPDATED
          );
        },
        (payload: any, variables: { projectId?: string }) => {
          if (!variables.projectId) return true;
          return payload.projectUpdated.projectId === variables.projectId;
        }
      ),
      resolve: (payload: any) => {
        return payload.projectUpdated;
      },
    },

    /**
     * Subscribe to workflow execution updates
     */
    workflowExecutionUpdated: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          return context.services.pubsub.asyncIterator(
            SubscriptionTopic.WORKFLOW_EXECUTION_UPDATED
          );
        },
        (payload: any, variables: { workflowExecutionId?: string; projectId?: string }) => {
          // Filter by workflowExecutionId if provided
          if (variables.workflowExecutionId) {
            return payload.workflowExecutionUpdated.workflowExecutionId === variables.workflowExecutionId;
          }
          
          // Filter by projectId if provided
          if (variables.projectId) {
            return payload.workflowExecutionUpdated.projectId === variables.projectId;
          }
          
          return true;
        }
      ),
      resolve: async (payload: any, _: any, context: GraphQLContext) => {
        const { workflowExecutionId } = payload.workflowExecutionUpdated;
        
        // Fetch full workflow execution data
        const workflowExecution = await context.prisma.workflowExecution.findUnique({
          where: { id: workflowExecutionId },
          include: {
            initiatedBy: true,
            handledBy: true,
            completedBy: true,
            project: true,
          },
        });

        return workflowExecution;
      },
    },

    /**
     * Subscribe to agent task updates
     */
    agentTaskUpdated: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          return context.services.pubsub.asyncIterator(
            SubscriptionTopic.AGENT_TASK_UPDATED
          );
        },
        (payload: any, variables: { workflowExecutionId?: string }) => {
          if (!variables.workflowExecutionId) return true;
          return payload.agentTaskUpdated.workflowExecutionId === variables.workflowExecutionId;
        }
      ),
      resolve: async (payload: any, _: any, context: GraphQLContext) => {
        const { agentTaskId } = payload.agentTaskUpdated;
        
        // Fetch full agent task data
        const agentTask = await context.prisma.agentTask.findUnique({
          where: { id: agentTaskId },
          include: {
            initiatedBy: true,
            handledBy: true,
            completedBy: true,
            workflowExecution: true,
          },
        });

        return agentTask;
      },
    },

    /**
     * Subscribe to new artifacts created
     */
    artifactCreated: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          return context.services.pubsub.asyncIterator(
            SubscriptionTopic.ARTIFACT_CREATED
          );
        },
        (payload: any, variables: { projectId?: string }) => {
          if (!variables.projectId) return true;
          return payload.artifactCreated.projectId === variables.projectId;
        }
      ),
      resolve: async (payload: any, _: any, context: GraphQLContext) => {
        const { artifactId } = payload.artifactCreated;
        
        // Fetch full artifact data with latest version
        const artifact = await context.prisma.artifact.findUnique({
          where: { id: artifactId },
          include: {
            createdBy: true,
            approvedBy: true,
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 1,
              include: {
                createdBy: true,
              },
            },
          },
        });

        return artifact;
      },
    },

    /**
     * Subscribe to artifact updates
     */
    artifactUpdated: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          return context.services.pubsub.asyncIterator(
            SubscriptionTopic.ARTIFACT_UPDATED
          );
        },
        (payload: any, variables: { artifactId?: string; projectId?: string }) => {
          if (variables.artifactId) {
            return payload.artifactUpdated.artifactId === variables.artifactId;
          }
          if (variables.projectId) {
            return payload.artifactUpdated.projectId === variables.projectId;
          }
          return true;
        }
      ),
      resolve: async (payload: any, _: any, context: GraphQLContext) => {
        const { artifactId } = payload.artifactUpdated;
        
        // Fetch updated artifact data
        const artifact = await context.prisma.artifact.findUnique({
          where: { id: artifactId },
          include: {
            createdBy: true,
            approvedBy: true,
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 1,
              include: {
                createdBy: true,
              },
            },
          },
        });

        return artifact;
      },
    },

    /**
     * Subscribe to user notifications
     */
    notificationReceived: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          return context.services.pubsub.asyncIterator(
            SubscriptionTopic.NOTIFICATION_RECEIVED
          );
        },
        (payload: any, variables: { userId: string }, context: GraphQLContext) => {
          // Ensure user can only subscribe to their own notifications
          const currentUserId = context.user?.id;
          if (!currentUserId) return false;
          
          // Check if notification is for the current user
          return payload.notificationReceived.userId === currentUserId;
        }
      ),
      resolve: async (payload: any, _: any, context: GraphQLContext) => {
        const { notificationId } = payload.notificationReceived;
        
        // Fetch full notification data
        const notification = await context.prisma.notification.findUnique({
          where: { id: notificationId },
        });

        return notification;
      },
    },
  },
};

/**
 * Helper functions to trigger subscriptions from mutations
 */

/**
 * Publish project update event
 */
export async function publishProjectUpdate(
  context: GraphQLContext,
  projectId: string,
  changes: Record<string, any>
): Promise<void> {
  await context.services.pubsub.publishProjectUpdated({
    projectId,
    userId: context.user?.id,
    changes,
  });
}

/**
 * Publish workflow execution update event
 */
export async function publishWorkflowExecutionUpdate(
  context: GraphQLContext,
  workflowExecutionId: string,
  projectId: string,
  status: string
): Promise<void> {
  await context.services.pubsub.publishWorkflowExecutionUpdated({
    workflowExecutionId,
    projectId,
    status,
    userId: context.user?.id,
  });
}

/**
 * Publish agent task update event
 */
export async function publishAgentTaskUpdate(
  context: GraphQLContext,
  agentTaskId: string,
  workflowExecutionId: string,
  agent: string,
  status: string
): Promise<void> {
  await context.services.pubsub.publishAgentTaskUpdated({
    agentTaskId,
    workflowExecutionId,
    agent,
    status,
    userId: context.user?.id,
  });
}

/**
 * Publish artifact created event
 */
export async function publishArtifactCreated(
  context: GraphQLContext,
  artifactId: string,
  projectId: string
): Promise<void> {
  await context.services.pubsub.publishArtifactCreated({
    artifactId,
    projectId,
    userId: context.user?.id,
  });
}

/**
 * Publish artifact updated event
 */
export async function publishArtifactUpdated(
  context: GraphQLContext,
  artifactId: string,
  projectId: string
): Promise<void> {
  await context.services.pubsub.publishArtifactUpdated({
    artifactId,
    projectId,
    userId: context.user?.id,
  });
}

/**
 * Publish notification received event
 */
export async function publishNotificationReceived(
  context: GraphQLContext,
  notificationId: string,
  userId: string,
  type: string
): Promise<void> {
  await context.services.pubsub.publishNotificationReceived({
    notificationId,
    userId,
    type,
  });
}