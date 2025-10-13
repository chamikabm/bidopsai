/**
 * Project Service
 * 
 * Business logic for project management operations.
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';

export interface CreateProjectDTO {
  name: string;
  description?: string;
  deadline?: Date;
  value?: number;
  metadata?: any;
  createdById: string;
  memberIds?: string[];
  knowledgeBaseIds?: string[];
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  status?: string;
  value?: number;
  deadline?: Date;
  progressPercentage?: number;
  metadata?: any;
}

export interface ProjectFilterDTO {
  status?: string;
  createdById?: string;
  memberId?: string;
  deadlineBefore?: Date;
  deadlineAfter?: Date;
}

export class ProjectService {
  constructor(
    private prisma: PrismaClient,
    private logger: Logger
  ) {}

  /**
   * Find project by ID
   */
  async findById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        createdBy: true,
        completedBy: true,
        documents: {
          include: {
            uploadedBy: true,
          },
          orderBy: { uploadedAt: 'desc' },
        },
        members: {
          include: {
            user: true,
            addedBy: true,
          },
        },
        knowledgeBases: true,
        artifacts: {
          include: {
            createdBy: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        workflowExecutions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project', id);
    }

    return project;
  }

  /**
   * List projects with pagination and filters
   */
  async list(
    first: number = 50,
    after?: string,
    filter?: ProjectFilterDTO
  ) {
    const where: any = {};

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.createdById) {
      where.createdById = filter.createdById;
    }

    if (filter?.memberId) {
      where.members = {
        some: {
          userId: filter.memberId,
        },
      };
    }

    if (filter?.deadlineBefore) {
      where.deadline = { ...where.deadline, lte: filter.deadlineBefore };
    }

    if (filter?.deadlineAfter) {
      where.deadline = { ...where.deadline, gte: filter.deadlineAfter };
    }

    const cursor = after ? { id: after } : undefined;

    const projects = await this.prisma.project.findMany({
      where,
      take: first + 1,
      cursor,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    const hasNextPage = projects.length > first;
    const nodes = hasNextPage ? projects.slice(0, -1) : projects;

    return {
      nodes,
      hasNextPage,
    };
  }

  /**
   * List user's projects
   */
  async listByUser(userId: string, first: number = 50, after?: string) {
    const cursor = after ? { id: after } : undefined;

    const projects = await this.prisma.project.findMany({
      where: {
        OR: [
          { createdById: userId },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      take: first + 1,
      cursor,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
    });

    const hasNextPage = projects.length > first;
    const nodes = hasNextPage ? projects.slice(0, -1) : projects;

    return {
      nodes,
      hasNextPage,
    };
  }

  /**
   * Create a new project
   */
  async create(data: CreateProjectDTO) {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Project name is required', {
        name: 'Name is required',
      });
    }

    // Create project with members in a transaction
    const project = await this.prisma.$transaction(async (tx: PrismaClient) => {
      const newProject = await tx.project.create({
        data: {
          name: data.name,
          description: data.description,
          deadline: data.deadline,
          value: data.value,
          metadata: data.metadata || {},
          status: 'Planning',
          progressPercentage: 0,
          createdById: data.createdById,
        },
      });

      // Add creator as project member
      await tx.projectMember.create({
        data: {
          projectId: newProject.id,
          userId: data.createdById,
          addedById: data.createdById,
        },
      });

      // Add additional members
      if (data.memberIds && data.memberIds.length > 0) {
        await tx.projectMember.createMany({
          data: data.memberIds.map((userId) => ({
            projectId: newProject.id,
            userId,
            addedById: data.createdById,
          })),
          skipDuplicates: true,
        });
      }

      // Link knowledge bases
      if (data.knowledgeBaseIds && data.knowledgeBaseIds.length > 0) {
        // Update knowledge bases to link them to project
        await tx.knowledgeBase.updateMany({
          where: {
            id: { in: data.knowledgeBaseIds },
            scope: 'PROJECT',
          },
          data: {
            projectId: newProject.id,
          },
        });
      }

      return tx.project.findUnique({
        where: { id: newProject.id },
        include: {
          createdBy: true,
          members: {
            include: {
              user: true,
              addedBy: true,
            },
          },
          knowledgeBases: true,
        },
      });
    });

    this.logger.info(`Project created: ${project!.id}`, {
      projectId: project!.id,
      name: data.name,
    });

    return project!;
  }

  /**
   * Update project
   */
  async update(id: string, data: UpdateProjectDTO) {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project) {
      throw new NotFoundError('Project', id);
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        value: data.value,
        deadline: data.deadline,
        progressPercentage: data.progressPercentage,
        metadata: data.metadata,
        updatedAt: new Date(),
      },
      include: {
        createdBy: true,
        completedBy: true,
      },
    });

    this.logger.info(`Project updated: ${id}`);

    return updated;
  }

  /**
   * Delete project
   */
  async delete(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project) {
      throw new NotFoundError('Project', id);
    }

    // Delete project and all related records in a transaction
    await this.prisma.$transaction(async (tx: PrismaClient) => {
      // Delete workflow executions and agent tasks
      const workflows = await tx.workflowExecution.findMany({
        where: { projectId: id },
      });

      for (const workflow of workflows) {
        await tx.agentTask.deleteMany({ where: { workflowExecutionId: workflow.id } });
      }

      await tx.workflowExecution.deleteMany({ where: { projectId: id } });

      // Delete artifacts and versions
      const artifacts = await tx.artifact.findMany({ where: { projectId: id } });

      for (const artifact of artifacts) {
        await tx.artifactVersion.deleteMany({ where: { artifactId: artifact.id } });
      }

      await tx.artifact.deleteMany({ where: { projectId: id } });

      // Delete project documents
      await tx.projectDocument.deleteMany({ where: { projectId: id } });

      // Delete project members
      await tx.projectMember.deleteMany({ where: { projectId: id } });

      // Unlink knowledge bases (don't delete them)
      await tx.knowledgeBase.updateMany({
        where: { projectId: id },
        data: { projectId: null },
      });

      // Finally delete the project
      await tx.project.delete({ where: { id } });
    });

    this.logger.info(`Project deleted: ${id}`);

    return true;
  }

  /**
   * Add member to project
   */
  async addMember(projectId: string, userId: string, addedById: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Check if already a member
    const existing = await this.prisma.projectMember.findFirst({
      where: { projectId, userId },
    });

    if (existing) {
      throw new ConflictError('User is already a project member');
    }

    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId,
        addedById,
      },
      include: {
        user: true,
        addedBy: true,
        project: true,
      },
    });

    this.logger.info(`Member added to project: ${userId} -> ${projectId}`);

    return member;
  }

  /**
   * Remove member from project
   */
  async removeMember(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findFirst({
      where: { projectId, userId },
    });

    if (!member) {
      throw new NotFoundError('Project member');
    }

    await this.prisma.projectMember.delete({
      where: { id: member.id },
    });

    this.logger.info(`Member removed from project: ${userId} <- ${projectId}`);

    return true;
  }

  /**
   * Update project progress
   */
  async updateProgress(id: string, progressPercentage: number) {
    if (progressPercentage < 0 || progressPercentage > 100) {
      throw new ValidationError('Progress must be between 0 and 100', {
        progressPercentage: 'Must be between 0 and 100',
      });
    }

    await this.prisma.project.update({
      where: { id },
      data: {
        progressPercentage,
        updatedAt: new Date(),
      },
    });

    this.logger.info(`Project progress updated: ${id} -> ${progressPercentage}%`);
  }

  /**
   * Mark project as completed
   */
  async complete(id: string, completedById: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project) {
      throw new NotFoundError('Project', id);
    }

    await this.prisma.project.update({
      where: { id },
      data: {
        status: 'Completed',
        progressPercentage: 100,
        completedById,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    this.logger.info(`Project completed: ${id}`);
  }
}