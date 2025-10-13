import { GraphQLContext } from '../context';
import {
  requireAuth,
  requirePermission,
  requireRole,
} from '../context';
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ErrorCode,
} from '../utils/errors';
import { PrismaClient } from '@prisma/client';

interface CreateUserInput {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  roleIds?: string[];
}

interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  preferredLanguage?: string;
  themePreference?: string;
}

interface UserFilterInput {
  emailVerified?: boolean;
  roleNames?: string[];
}

export const userResolvers = {
  Query: {
    /**
     * Get current authenticated user
     */
    me: async (_: any, __: any, context: GraphQLContext) => {
      const { user, prisma } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated', ErrorCode.AUTH_TOKEN_MISSING);
      }

      // Fetch complete user with relations
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: true,
                },
              },
            },
          },
        },
      });

      if (!fullUser) {
        throw new NotFoundError('User', user.id);
      }

      return fullUser;
    },

    /**
     * Get single user by ID
     */
    user: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const { prisma } = context;
      requireAuth(context);

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: true,
                },
              },
            },
          },
          projects: {
            include: {
              project: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError('User', id);
      }

      return user;
    },

    /**
     * Get paginated users list with filters
     */
    users: async (
      _: any,
      {
        first = 10,
        after,
        filter,
      }: {
        first?: number;
        after?: string;
        filter?: UserFilterInput;
      },
      context: GraphQLContext
    ) => {
      const { prisma } = context;
      requireAuth(context);
      requirePermission(context, 'USER', 'READ');

      // Build where clause
      const where: any = {};

      if (filter?.emailVerified !== undefined) {
        where.emailVerified = filter.emailVerified;
      }

      if (filter?.roleNames && filter.roleNames.length > 0) {
        where.roles = {
          some: {
            role: {
              name: {
                in: filter.roleNames,
              },
            },
          },
        };
      }

      // Cursor-based pagination
      const cursor = after ? { id: after } : undefined;

      const users = await prisma.user.findMany({
        where,
        take: first + 1, // Fetch one extra to check hasNextPage
        cursor,
        skip: cursor ? 1 : 0,
        orderBy: { createdAt: 'desc' },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      const hasNextPage = users.length > first;
      const nodes = hasNextPage ? users.slice(0, -1) : users;

      const edges = nodes.map((user: any) => ({
        node: user,
        cursor: user.id,
      }));

      const totalCount = await prisma.user.count({ where });

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
        },
        totalCount,
      };
    },

    /**
     * Get all roles
     */
    roles: async (_: any, __: any, context: GraphQLContext) => {
      const { prisma } = context;
      requireAuth(context);
      requirePermission(context, 'ROLE', 'READ');

      return prisma.role.findMany({
        include: {
          permissions: true,
        },
        orderBy: { name: 'asc' },
      });
    },

    /**
     * Get single role by ID
     */
    role: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const { prisma } = context;
      requireAuth(context);
      requirePermission(context, 'ROLE', 'READ');

      const role = await prisma.role.findUnique({
        where: { id },
        include: {
          permissions: true,
        },
      });

      if (!role) {
        throw new NotFoundError('Role', id);
      }

      return role;
    },

    /**
     * Get permissions for a role
     */
    permissions: async (_: any, { roleId }: { roleId: string }, context: GraphQLContext) => {
      const { prisma } = context;
      requireAuth(context);
      requirePermission(context, 'PERMISSION', 'READ');

      return prisma.permission.findMany({
        where: { roleId },
        orderBy: { resource: 'asc' },
      });
    },
  },

  Mutation: {
    /**
     * Create a new user (also creates in Cognito)
     * NOTE: Cognito integration will be implemented in Phase 7
     */
    createUser: async (_: any, { input }: { input: CreateUserInput }, context: GraphQLContext) => {
      const { prisma, logger } = context;
      requireAuth(context);
      requirePermission(context, 'USER', 'CREATE');

      // Validate input
      if (!input.email || !input.username || !input.firstName || !input.lastName) {
        throw new ValidationError('Missing required fields', {
          email: !input.email ? 'Email is required' : '',
          username: !input.username ? 'Username is required' : '',
          firstName: !input.firstName ? 'First name is required' : '',
          lastName: !input.lastName ? 'Last name is required' : '',
        });
      }

      // Check for existing user
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: input.email }, { username: input.username }],
        },
      });

      if (existingUser) {
        throw new ConflictError('User already exists', {
          email: input.email,
          username: input.username,
        });
      }

      try {
        // TODO: Phase 7 - Create user in Cognito first
        // const cognitoUser = await createCognitoUser(input);

        // Create user in database with transaction
        const user = await prisma.$transaction(async (tx: PrismaClient) => {
          const newUser = await tx.user.create({
            data: {
              email: input.email,
              username: input.username,
              firstName: input.firstName,
              lastName: input.lastName,
              passwordHash: 'COGNITO_MANAGED', // Password managed by Cognito
              emailVerified: false,
              cognitoUserId: `cognito_${input.username}`, // TODO: Replace with actual Cognito ID
            },
          });

          // Assign roles if provided
          if (input.roleIds && input.roleIds.length > 0) {
            await tx.userRole.createMany({
              data: input.roleIds.map((roleId) => ({
                userId: newUser.id,
                roleId,
                assignedBy: context.user!.id,
              })),
            });
          }

          return newUser;
        });

        logger.info(`User created: ${user.id}`);

        // Fetch complete user with roles
        return prisma.user.findUnique({
          where: { id: user.id },
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        });
      } catch (error) {
        logger.error('Failed to create user', { error });
        // TODO: Phase 7 - Compensating transaction to delete Cognito user if database creation fails
        throw error;
      }
    },

    /**
     * Update an existing user
     */
    updateUser: async (
      _: any,
      { id, input }: { id: string; input: UpdateUserInput },
      context: GraphQLContext
    ) => {
      const { prisma, logger } = context;
      requireAuth(context);
      requirePermission(context, 'USER', 'UPDATE');

      const user = await prisma.user.findUnique({ where: { id } });

      if (!user) {
        throw new NotFoundError('User', id);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          profileImageUrl: input.profileImageUrl,
          preferredLanguage: input.preferredLanguage,
          themePreference: input.themePreference,
          updatedAt: new Date(),
        },
      });

      logger.info(`User updated: ${id}`);

      return updatedUser;
    },

    /**
     * Delete a user (soft delete consideration)
     */
    deleteUser: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const { prisma, logger } = context;
      requireAuth(context);
      requirePermission(context, 'USER', 'DELETE');

      const user = await prisma.user.findUnique({ where: { id } });

      if (!user) {
        throw new NotFoundError('User', id);
      }

      // TODO: Phase 7 - Delete from Cognito
      // await deleteCognitoUser(user.cognitoUserId);

      // Delete user (cascade delete will handle related records)
      await prisma.user.delete({
        where: { id },
      });

      logger.info(`User deleted: ${id}`);

      return true;
    },

    /**
     * Assign a role to a user
     */
    assignRole: async (
      _: any,
      { userId, roleId }: { userId: string; roleId: string },
      context: GraphQLContext
    ) => {
      const { prisma, logger } = context;
      requireAuth(context);
      requirePermission(context, 'ROLE', 'ASSIGN');

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      // Check if role exists
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role) {
        throw new NotFoundError('Role', roleId);
      }

      // Check if already assigned
      const existing = await prisma.userRole.findFirst({
        where: { userId, roleId },
      });

      if (existing) {
        throw new ConflictError('Role already assigned', {
          userId,
          roleId,
        });
      }

      // TODO: Phase 7 - Sync to Cognito user groups
      // await addUserToCognitoGroup(user.cognitoUserId, role.name);

      const userRole = await prisma.userRole.create({
        data: {
          userId,
          roleId,
          assignedBy: context.user!.id,
        },
        include: {
          user: true,
          role: true,
        },
      });

      logger.info(`Role assigned: ${roleId} to user ${userId}`);

      return userRole;
    },

    /**
     * Remove a role from a user
     */
    removeRole: async (
      _: any,
      { userId, roleId }: { userId: string; roleId: string },
      context: GraphQLContext
    ) => {
      const { prisma, logger } = context;
      requireAuth(context);
      requirePermission(context, 'ROLE', 'REMOVE');

      const userRole = await prisma.userRole.findFirst({
        where: { userId, roleId },
        include: {
          user: true,
          role: true,
        },
      });

      if (!userRole) {
        throw new NotFoundError('User role assignment');
      }

      // TODO: Phase 7 - Sync to Cognito user groups
      // await removeUserFromCognitoGroup(userRole.user.cognitoUserId, userRole.role.name);

      await prisma.userRole.delete({
        where: { id: userRole.id },
      });

      logger.info(`Role removed: ${roleId} from user ${userId}`);

      return true;
    },

    /**
     * Update current user's profile
     */
    updateMyProfile: async (_: any, { input }: { input: UpdateUserInput }, context: GraphQLContext) => {
      const { user, prisma, logger } = context;
      requireAuth(context);

      const updatedUser = await prisma.user.update({
        where: { id: user!.id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          profileImageUrl: input.profileImageUrl,
          preferredLanguage: input.preferredLanguage,
          themePreference: input.themePreference,
          updatedAt: new Date(),
        },
      });

      logger.info(`Profile updated for user: ${user!.id}`);

      return updatedUser;
    },
  },

  // Field resolvers for nested data
  User: {
    roles: async (parent: any, _: any, context: GraphQLContext) => {
      // If roles already loaded, return them
      if (parent.roles) {
        return parent.roles.map((ur: any) => ur.role);
      }

      // Otherwise fetch them
      const userRoles = await context.prisma.userRole.findMany({
        where: { userId: parent.id },
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      });

      return userRoles.map((ur: any) => ur.role);
    },

    projects: async (parent: any, _: any, context: GraphQLContext) => {
      // If projects already loaded, return them
      if (parent.projects) {
        return parent.projects;
      }

      // Otherwise fetch them
      return context.prisma.projectMember.findMany({
        where: { userId: parent.id },
        include: {
          project: true,
          addedBy: true,
        },
        orderBy: { joinedAt: 'desc' },
      });
    },
  },

  Role: {
    permissions: async (parent: any, _: any, context: GraphQLContext) => {
      // If permissions already loaded, return them
      if (parent.permissions) {
        return parent.permissions;
      }

      // Otherwise fetch them
      return context.prisma.permission.findMany({
        where: { roleId: parent.id },
        orderBy: { resource: 'asc' },
      });
    },
  },
};