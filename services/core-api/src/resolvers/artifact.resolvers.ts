import { GraphQLContext } from '../context';
import { requireAuth, requirePermission } from '../context';
import { NotFoundError, ValidationError } from '../utils/errors';
import { PrismaClient } from '@prisma/client';

interface CreateArtifactInput {
  projectId: string;
  name: string;
  type: string;
  category: string;
  content: any;
}

interface UpdateArtifactVersionInput {
  artifactId: string;
  content: any;
  location?: string;
}

export const artifactResolvers = {
  Query: {
    /**
     * Get single artifact by ID with all versions
     */
    artifact: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const { prisma } = context;
      requireAuth(context);

      const artifact = await prisma.artifact.findUnique({
        where: { id },
        include: {
          createdBy: true,
          approvedBy: true,
          versions: {
            include: {
              createdBy: true,
            },
            orderBy: { versionNumber: 'desc' },
          },
        },
      });

      if (!artifact) {
        throw new NotFoundError('Artifact', id);
      }

      return artifact;
    },

    /**
     * Get all artifacts for a project
     */
    artifactsByProject: async (
      _: any,
      { projectId }: { projectId: string },
      context: GraphQLContext
    ) => {
      const { prisma } = context;
      requireAuth(context);

      return prisma.artifact.findMany({
        where: { projectId },
        include: {
          createdBy: true,
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1, // Only latest version
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    /**
     * Get specific artifact version
     */
    artifactVersion: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const { prisma } = context;
      requireAuth(context);

      const version = await prisma.artifactVersion.findUnique({
        where: { id },
        include: {
          artifact: true,
          createdBy: true,
        },
      });

      if (!version) {
        throw new NotFoundError('Artifact version', id);
      }

      return version;
    },
  },

  Mutation: {
    /**
     * Create new artifact with initial version
     */
    createArtifact: async (
      _: any,
      { input }: { input: CreateArtifactInput },
      context: GraphQLContext
    ) => {
      const { prisma, user, logger } = context;
      requireAuth(context);
      requirePermission(context, 'ARTIFACT', 'CREATE');

      if (!input.name || !input.type || !input.category || !input.content) {
        throw new ValidationError('Missing required fields', {
          name: !input.name ? 'Name is required' : '',
          type: !input.type ? 'Type is required' : '',
          category: !input.category ? 'Category is required' : '',
          content: !input.content ? 'Content is required' : '',
        });
      }

      const artifact = await prisma.$transaction(async (tx: PrismaClient) => {
        // Create artifact
        const newArtifact = await tx.artifact.create({
          data: {
            projectId: input.projectId,
            name: input.name,
            type: input.type,
            category: input.category,
            status: 'DRAFT',
            createdById: user!.id,
          },
        });

        // Create initial version (v1)
        await tx.artifactVersion.create({
          data: {
            artifactId: newArtifact.id,
            versionNumber: 1,
            content: input.content,
            createdById: user!.id,
          },
        });

        return newArtifact;
      });

      logger.info(`Artifact created: ${artifact.id}`);

      // Return with versions
      return prisma.artifact.findUnique({
        where: { id: artifact.id },
        include: {
          createdBy: true,
          versions: {
            include: {
              createdBy: true,
            },
          },
        },
      });
    },

    /**
     * Create new version of artifact
     */
    updateArtifactVersion: async (
      _: any,
      { input }: { input: UpdateArtifactVersionInput },
      context: GraphQLContext
    ) => {
      const { prisma, user, logger } = context;
      requireAuth(context);

      const artifact = await prisma.artifact.findUnique({
        where: { id: input.artifactId },
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
          },
        },
      });

      if (!artifact) {
        throw new NotFoundError('Artifact', input.artifactId);
      }

      const latestVersion = artifact.versions[0];
      const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

      const newVersion = await prisma.artifactVersion.create({
        data: {
          artifactId: input.artifactId,
          versionNumber: newVersionNumber,
          content: input.content,
          location: input.location,
          createdById: user!.id,
        },
        include: {
          createdBy: true,
        },
      });

      logger.info(`Artifact version created: ${newVersion.id} (v${newVersionNumber})`);

      return newVersion;
    },

    /**
     * Approve an artifact
     */
    approveArtifact: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const { prisma, user, logger } = context;
      requireAuth(context);
      requirePermission(context, 'ARTIFACT', 'APPROVE');

      const artifact = await prisma.artifact.findUnique({
        where: { id },
      });

      if (!artifact) {
        throw new NotFoundError('Artifact', id);
      }

      const approved = await prisma.artifact.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: user!.id,
          approvedAt: new Date(),
        },
        include: {
          approvedBy: true,
        },
      });

      logger.info(`Artifact approved: ${id}`);

      return approved;
    },

    /**
     * Reject an artifact
     */
    rejectArtifact: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const { prisma, logger } = context;
      requireAuth(context);
      requirePermission(context, 'ARTIFACT', 'APPROVE');

      const artifact = await prisma.artifact.findUnique({
        where: { id },
      });

      if (!artifact) {
        throw new NotFoundError('Artifact', id);
      }

      const rejected = await prisma.artifact.update({
        where: { id },
        data: {
          status: 'REJECTED',
        },
      });

      logger.info(`Artifact rejected: ${id}`);

      return rejected;
    },
  },

  Subscription: {
    /**
     * Subscribe to new artifacts for a project
     */
    artifactCreated: {
      subscribe: async (_: any, { projectId }: { projectId: string }, context: GraphQLContext) => {
        requireAuth(context);
        // TODO: Phase 8 - Implement with PubSub
        throw new Error('Subscriptions not yet implemented');
      },
    },

    /**
     * Subscribe to artifact updates
     */
    artifactUpdated: {
      subscribe: async (_: any, { artifactId }: { artifactId: string }, context: GraphQLContext) => {
        requireAuth(context);
        // TODO: Phase 8 - Implement with PubSub
        throw new Error('Subscriptions not yet implemented');
      },
    },
  },

  // Field resolvers
  Artifact: {
    createdBy: async (parent: any, _: any, context: GraphQLContext) => {
      if (parent.createdBy) return parent.createdBy;
      return context.prisma.user.findUnique({ where: { id: parent.createdById } });
    },

    approvedBy: async (parent: any, _: any, context: GraphQLContext) => {
      if (parent.approvedBy) return parent.approvedBy;
      if (!parent.approvedById) return null;
      return context.prisma.user.findUnique({ where: { id: parent.approvedById } });
    },

    versions: async (parent: any, _: any, context: GraphQLContext) => {
      if (parent.versions) return parent.versions;
      return context.prisma.artifactVersion.findMany({
        where: { artifactId: parent.id },
        orderBy: { versionNumber: 'desc' },
      });
    },

    latestVersion: async (parent: any, _: any, context: GraphQLContext) => {
      return context.prisma.artifactVersion.findFirst({
        where: { artifactId: parent.id },
        orderBy: { versionNumber: 'desc' },
      });
    },
  },

  ArtifactVersion: {
    createdBy: async (parent: any, _: any, context: GraphQLContext) => {
      if (parent.createdBy) return parent.createdBy;
      return context.prisma.user.findUnique({ where: { id: parent.createdById } });
    },
  },
};