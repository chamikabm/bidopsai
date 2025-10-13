import { GraphQLContext } from '../context';
import { requireAuth } from '../context';
import { NotFoundError } from '../utils/errors';

export const workflowResolvers = {
  Query: {
    /**
     * Get single workflow execution by ID
     */
    workflowExecution: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const { prisma } = context;
      requireAuth(context);

      const workflow = await prisma.workflowExecution.findUnique({
        where: { id },
        include: {
          project: true,
          initiatedBy: true,
          handledBy: true,
          completedBy: true,
          agentTasks: {
            include: {
              initiatedBy: true,
              handledBy: true,
              completedBy: true,
            },
            orderBy: { sequenceOrder: 'asc' },
          },
        },
      });

      if (!workflow) {
        throw new NotFoundError('Workflow execution', id);
      }

      return workflow;
    },

    /**
     * Get all workflow executions for a project
     */
    workflowExecutionsByProject: async (
      _: any,
      { projectId }: { projectId: string },
      context: GraphQLContext
    ) => {
      const { prisma } = context;
      requireAuth(context);

      return prisma.workflowExecution.findMany({
        where: { projectId },
        include: {
          initiatedBy: true,
          handledBy: true,
          completedBy: true,
          agentTasks: {
            include: {
              initiatedBy: true,
              handledBy: true,
              completedBy: true,
            },
            orderBy: { sequenceOrder: 'asc' },
          },
        },
        orderBy: { startedAt: 'desc' },
      });
    },

    /**
     * Get single agent task by ID
     */
    agentTask: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const { prisma } = context;
      requireAuth(context);

      const task = await prisma.agentTask.findUnique({
        where: { id },
        include: {
          workflowExecution: true,
          initiatedBy: true,
          handledBy: true,
          completedBy: true,
        },
      });

      if (!task) {
        throw new NotFoundError('Agent task', id);
      }

      return task;
    },
  },

  Subscription: {
    /**
     * Subscribe to workflow execution updates
     */
    workflowExecutionUpdated: {
      subscribe: async (
        _: any,
        { workflowExecutionId }: { workflowExecutionId: string },
        context: GraphQLContext
      ) => {
        requireAuth(context);
        // TODO: Phase 8 - Implement with PubSub
        throw new Error('Subscriptions not yet implemented');
      },
    },

    /**
     * Subscribe to agent task updates
     */
    agentTaskUpdated: {
      subscribe: async (
        _: any,
        { workflowExecutionId }: { workflowExecutionId: string },
        context: GraphQLContext
      ) => {
        requireAuth(context);
        // TODO: Phase 8 - Implement with PubSub
        throw new Error('Subscriptions not yet implemented');
      },
    },
  },

  // Field resolvers
  WorkflowExecution: {
    initiatedBy: async (parent: any, _: any, context: GraphQLContext) => {
      if (parent.initiatedBy) return parent.initiatedBy;
      if (!parent.initiatedById) return null;
      return context.prisma.user.findUnique({ where: { id: parent.initiatedById } });
    },

    handledBy: async (parent: any, _: any, context: GraphQLContext) => {
      if (parent.handledBy) return parent.handledBy;
      if (!parent.handledById) return null;
      return context.prisma.user.findUnique({ where: { id: parent.handledById } });
    },

    completedBy: async (parent: any, _: any, context: GraphQLContext) => {
      if (parent.completedBy) return parent.completedBy;
      if (!parent.completedById) return null;
      return context.prisma.user.findUnique({ where: { id: parent.completedById } });
    },

    agentTasks: async (parent: any, _: any, context: GraphQLContext) => {
      if (parent.agentTasks) return parent.agentTasks;
      return context.prisma.agentTask.findMany({
        where: { workflowExecutionId: parent.id },
        orderBy: { sequenceOrder: 'asc' },
      });
    },
  },

  AgentTask: {
    initiatedBy: async (parent: any, _: any, context: GraphQLContext) => {
      if (parent.initiatedBy) return parent.initiatedBy;
      if (!parent.initiatedById) return null;
      return context.prisma.user.findUnique({ where: { id: parent.initiatedById } });
    },

    handledBy: async (parent: any, _: any, context: GraphQLContext) => {
      if (parent.handledBy) return parent.handledBy;
      if (!parent.handledById) return null;
      return context.prisma.user.findUnique({ where: { id: parent.handledById } });
    },

    completedBy: async (parent: any, _: any, context: GraphQLContext) => {
      if (parent.completedBy) return parent.completedBy;
      if (!parent.completedById) return null;
      return context.prisma.user.findUnique({ where: { id: parent.completedById } });
    },
  },
};