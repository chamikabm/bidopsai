/**
 * User Service
 * 
 * Business logic for user management operations.
 * Separates business logic from GraphQL resolvers.
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';

export interface CreateUserDTO {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password?: string;
  cognitoUserId?: string;
  roleIds?: string[];
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  preferredLanguage?: string;
  themePreference?: string;
}

export interface UserFilterDTO {
  email?: string;
  username?: string;
  roleId?: string;
  emailVerified?: boolean;
}

export class UserService {
  constructor(
    private prisma: PrismaClient,
    private logger: Logger
  ) {}

  /**
   * Find user by ID
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
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
      },
    });

    if (!user) {
      throw new NotFoundError('User', id);
    }

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
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
  }

  /**
   * Find user by Cognito user ID
   */
  async findByCognitoId(cognitoUserId: string) {
    return this.prisma.user.findUnique({
      where: { cognitoUserId },
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
  }

  /**
   * List users with pagination and filters
   */
  async list(
    first: number = 50,
    after?: string,
    filter?: UserFilterDTO
  ) {
    const where: any = {};

    if (filter?.email) {
      where.email = { contains: filter.email, mode: 'insensitive' };
    }

    if (filter?.username) {
      where.username = { contains: filter.username, mode: 'insensitive' };
    }

    if (filter?.emailVerified !== undefined) {
      where.emailVerified = filter.emailVerified;
    }

    if (filter?.roleId) {
      where.roles = {
        some: {
          roleId: filter.roleId,
        },
      };
    }

    const cursor = after ? { id: after } : undefined;

    const users = await this.prisma.user.findMany({
      where,
      take: first + 1,
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

    return {
      nodes,
      hasNextPage,
    };
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserDTO, createdById?: string) {
    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new ConflictError('Email already in use', { email: data.email });
    }

    // Check if username already exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      throw new ConflictError('Username already in use', { username: data.username });
    }

    // Create user with roles in a transaction
    const user = await this.prisma.$transaction(async (tx: PrismaClient) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          passwordHash: data.password || '', // TODO: Hash password in Phase 7
          cognitoUserId: data.cognitoUserId,
          emailVerified: false,
        },
      });

      // Assign roles if provided
      if (data.roleIds && data.roleIds.length > 0) {
        await tx.userRole.createMany({
          data: data.roleIds.map((roleId) => ({
            userId: newUser.id,
            roleId,
            assignedById: createdById,
          })),
        });
      }

      return tx.user.findUnique({
        where: { id: newUser.id },
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
    });

    this.logger.info(`User created: ${user!.id}`, { userId: user!.id, email: data.email });

    return user!;
  }

  /**
   * Update user
   */
  async update(id: string, data: UpdateUserDTO) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundError('User', id);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        profileImageUrl: data.profileImageUrl,
        preferredLanguage: data.preferredLanguage,
        themePreference: data.themePreference,
        updatedAt: new Date(),
      },
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

    this.logger.info(`User updated: ${id}`);

    return updated;
  }

  /**
   * Delete user
   */
  async delete(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundError('User', id);
    }

    // Delete user and all related records in a transaction
    await this.prisma.$transaction(async (tx: PrismaClient) => {
      // Delete user roles
      await tx.userRole.deleteMany({ where: { userId: id } });

      // Delete project memberships
      await tx.projectMember.deleteMany({ where: { userId: id } });

      // Delete notifications
      await tx.notification.deleteMany({ where: { userId: id } });

      // Delete knowledge base permissions
      await tx.knowledgeBasePermission.deleteMany({ where: { userId: id } });

      // Finally delete the user
      await tx.user.delete({ where: { id } });
    });

    this.logger.info(`User deleted: ${id}`);

    return true;
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleId: string, assignedById?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundError('Role', roleId);
    }

    // Check if already assigned
    const existing = await this.prisma.userRole.findFirst({
      where: { userId, roleId },
    });

    if (existing) {
      throw new ConflictError('Role already assigned to user');
    }

    const userRole = await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedById,
      },
      include: {
        user: true,
        role: true,
      },
    });

    this.logger.info(`Role assigned: ${roleId} to user ${userId}`);

    return userRole;
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string, roleId: string) {
    const userRole = await this.prisma.userRole.findFirst({
      where: { userId, roleId },
    });

    if (!userRole) {
      throw new NotFoundError('User role assignment');
    }

    await this.prisma.userRole.delete({
      where: { id: userRole.id },
    });

    this.logger.info(`Role removed: ${roleId} from user ${userId}`);

    return true;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }

  /**
   * Verify user email
   */
  async verifyEmail(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { emailVerified: true },
    });

    this.logger.info(`Email verified for user: ${id}`);
  }
}