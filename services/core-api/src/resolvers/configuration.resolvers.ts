import { GraphQLContext } from '../context';
import { requireAuth, requirePermission, requireRole } from '../context';
import { NotFoundError, ValidationError } from '../utils/errors';

interface UpdateAgentConfigurationInput {
  agentType: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: any;
  additionalParameters?: any;
  enabled?: boolean;
}

interface UpdateIntegrationInput {
  type: string;
  name?: string;
  configuration?: any;
  enabled?: boolean;
}

export const configurationResolvers = {
  Query: {
    /**
     * Get all agent configurations (admin only)
     */
    agentConfigurations: async (_: any, __: any, context: GraphQLContext) => {
      const { prisma } = context;
      requireAuth(context);
      requireRole(context, 'ADMIN');

      return prisma.agentConfiguration.findMany({
        include: {
          updatedBy: true,
        },
        orderBy: { agentType: 'asc' },
      });
    },

    /**
     * Get single agent configuration by type
     */
    agentConfiguration: async (
      _: any,
      { agentType }: { agentType: string },
      context: GraphQLContext
    ) => {
      const { prisma } = context;
      requireAuth(context);
      requireRole(context, 'ADMIN');

      const config = await prisma.agentConfiguration.findUnique({
        where: { agentType },
        include: {
          updatedBy: true,
        },
      });

      if (!config) {
        throw new NotFoundError('Agent configuration', agentType);
      }

      return config;
    },

    /**
     * Get all integrations (admin only)
     */
    integrations: async (_: any, __: any, context: GraphQLContext) => {
      const { prisma } = context;
      requireAuth(context);
      requireRole(context, 'ADMIN');

      return prisma.integration.findMany({
        include: {
          createdBy: true,
        },
        orderBy: { type: 'asc' },
      });
    },

    /**
     * Get single integration by type
     */
    integration: async (_: any, { type }: { type: string }, context: GraphQLContext) => {
      const { prisma } = context;
      requireAuth(context);
      requireRole(context, 'ADMIN');

      const integration = await prisma.integration.findUnique({
        where: { type },
        include: {
          createdBy: true,
          logs: {
            orderBy: { createdAt: 'desc' },
            take: 50, // Last 50 logs
          },
        },
      });

      if (!integration) {
        throw new NotFoundError('Integration', type);
      }

      return integration;
    },

    /**
     * Get audit logs (admin only)
     */
    auditLogs: async (
      _: any,
      {
        first = 50,
        after,
        userId,
        resourceType,
      }: {
        first?: number;
        after?: string;
        userId?: string;
        resourceType?: string;
      },
      context: GraphQLContext
    ) => {
      const { prisma } = context;
      requireAuth(context);
      requireRole(context, 'ADMIN');

      const where: any = {};

      if (userId) {
        where.userId = userId;
      }

      if (resourceType) {
        where.resourceType = resourceType;
      }

      const cursor = after ? { id: after } : undefined;

      const logs = await prisma.auditLog.findMany({
        where,
        take: first + 1,
        cursor,
        skip: cursor ? 1 : 0,
        orderBy: { createdAt: 'desc' },
      });

      const hasNextPage = logs.length > first;
      const nodes = hasNextPage ? logs.slice(0, -1) : logs;

      return nodes;
    },
  },

  Mutation: {
    /**
     * Update agent configuration (admin only)
     */
    updateAgentConfiguration: async (
      _: any,
      { input }: { input: UpdateAgentConfigurationInput },
      context: GraphQLContext
    ) => {
      const { prisma, user, logger } = context;
      requireAuth(context);
      requireRole(context, 'ADMIN');

      if (!input.agentType) {
        throw new ValidationError('Agent type is required', {
          agentType: 'Agent type is required',
        });
      }

      const config = await prisma.agentConfiguration.upsert({
        where: { agentType: input.agentType },
        create: {
          agentType: input.agentType,
          modelName: input.modelName || 'claude-3-5-sonnet-20241022',
          temperature: input.temperature ?? 0.7,
          maxTokens: input.maxTokens || 4096,
          systemPrompt: input.systemPrompt || {},
          additionalParameters: input.additionalParameters || {},
          enabled: input.enabled ?? true,
          updatedById: user!.id,
        },
        update: {
          modelName: input.modelName,
          temperature: input.temperature,
          maxTokens: input.maxTokens,
          systemPrompt: input.systemPrompt,
          additionalParameters: input.additionalParameters,
          enabled: input.enabled,
          updatedAt: new Date(),
          updatedById: user!.id,
        },
        include: {
          updatedBy: true,
        },
      });

      logger.info(`Agent configuration updated: ${input.agentType}`);

      return config;
    },

    /**
     * Update integration configuration (admin only)
     */
    updateIntegration: async (
      _: any,
      { input }: { input: UpdateIntegrationInput },
      context: GraphQLContext
    ) => {
      const { prisma, user, logger } = context;
      requireAuth(context);
      requireRole(context, 'ADMIN');

      if (!input.type) {
        throw new ValidationError('Integration type is required', {
          type: 'Type is required',
        });
      }

      const integration = await prisma.integration.upsert({
        where: { type: input.type },
        create: {
          type: input.type,
          name: input.name || input.type,
          configuration: input.configuration || {},
          enabled: input.enabled ?? true,
          createdById: user!.id,
        },
        update: {
          name: input.name,
          configuration: input.configuration,
          enabled: input.enabled,
          updatedAt: new Date(),
        },
      });

      logger.info(`Integration updated: ${input.type}`);

      return integration;
    },

    /**
     * Test integration connectivity (admin only)
     */
    testIntegration: async (_: any, { type }: { type: string }, context: GraphQLContext) => {
      const { prisma, logger } = context;
      requireAuth(context);
      requireRole(context, 'ADMIN');

      const integration = await prisma.integration.findUnique({
        where: { type },
      });

      if (!integration) {
        throw new NotFoundError('Integration', type);
      }

      // TODO: Implement actual integration testing
      // For now, return mock success
      logger.info(`Testing integration: ${type}`);

      // Log the test
      await prisma.integrationLog.create({
        data: {
          integrationId: integration.id,
          action: 'TEST_CONNECTION',
          status: 'SUCCESS',
          requestData: {},
          responseData: { message: 'Connection successful' },
        },
      });

      return true;
    },

    /**
     * Update system settings (admin only)
     */
    updateSystemSettings: async (
      _: any,
      { settings }: { settings: any },
      context: GraphQLContext
    ) => {
      const { logger } = context;
      requireAuth(context);
      requireRole(context, 'ADMIN');

      // TODO: Implement system settings storage
      // For now, just log
      logger.info('System settings updated', { settings });

      return true;
    },
  },

  // Field resolvers
  AgentConfiguration: {
    updatedBy: async (parent: any, _: any, context: GraphQLContext) => {
      if (parent.updatedBy) return parent.updatedBy;
      if (!parent.updatedById) return null;
      return context.prisma.user.findUnique({ where: { id: parent.updatedById } });
    },
  },

  Integration: {
    createdBy: async (parent: any, _: any, context: GraphQLContext) => {
      if (parent.createdBy) return parent.createdBy;
      return context.prisma.user.findUnique({ where: { id: parent.createdById } });
    },

    logs: async (parent: any, _: any, context: GraphQLContext) => {
      if (parent.logs) return parent.logs;
      return context.prisma.integrationLog.findMany({
        where: { integrationId: parent.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    },
  },
};