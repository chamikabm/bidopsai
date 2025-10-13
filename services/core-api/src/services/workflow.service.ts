/**
 * Workflow Service
 * 
 * Business logic for workflow execution and agent task management.
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { NotFoundError, ValidationError } from '../utils/errors';

export interface CreateWorkflowExecutionDTO {
  projectId: string;
  initiatedById: string;
  workflowConfig?: any;
}

export interface UpdateWorkflowExecutionDTO {
  status?: string;
  handledById?: string;
  completedById?: string;
  errorMessage?: string;
  errorLog?: any;
  results?: any;
}

export interface CreateAgentTaskDTO {
  workflowExecutionId: string;
  agent: string;
  sequenceOrder: number;
  initiatedById: string;
  taskConfig?: any;
  inputData?: any;
}

export interface UpdateAgentTaskDTO {
  status?: string;
  handledById?: string;
  completedById?: string;
  outputData?: any;
  errorMessage?: string;
  errorLog?: any;
  executionTimeSeconds?: number;
}

export class WorkflowService {
  constructor(
    private prisma: PrismaClient,
    private logger: Logger
  ) {}

  /**
   * Find workflow execution by ID
   */
  async findWorkflowById(id: string) {
    const workflow = await this.prisma.workflowExecution.findUnique({
      where: { id },
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
        project: true,
      },
    });

    if (!workflow) {
      throw new NotFoundError('Workflow execution', id);
    }

    return workflow;
  }

  /**
   * List workflow executions for a project
   */
  async listByProject(projectId: string) {
    return this.prisma.workflowExecution.findMany({
      where: { projectId },
      include: {
        initiatedBy: true,
        agentTasks: {
          orderBy: { sequenceOrder: 'asc' },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * Find agent task by ID
   */
  async findAgentTaskById(id: string) {
    const task = await this.prisma.agentTask.findUnique({
      where: { id },
      include: {
        initiatedBy: true,
        handledBy: true,
        completedBy: true,
        workflowExecution: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Agent task', id);
    }

    return task;
  }

  /**
   * Create a new workflow execution with agent tasks
   */
  async createWorkflow(data: CreateWorkflowExecutionDTO, agentTaskConfigs: CreateAgentTaskDTO[]) {
    // Validate project exists
    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new NotFoundError('Project', data.projectId);
    }

    // Create workflow and agent tasks in a transaction
    const workflow = await this.prisma.$transaction(async (tx: PrismaClient) => {
      const newWorkflow = await tx.workflowExecution.create({
        data: {
          projectId: data.projectId,
          status: 'OPEN',
          initiatedById: data.initiatedById,
          handledById: data.initiatedById,
          startedAt: new Date(),
          lastUpdatedAt: new Date(),
          workflowConfig: data.workflowConfig || {},
        },
      });

      // Create agent tasks
      if (agentTaskConfigs.length > 0) {
        await tx.agentTask.createMany({
          data: agentTaskConfigs.map((task) => ({
            workflowExecutionId: newWorkflow.id,
            agent: task.agent,
            status: 'OPEN',
            sequenceOrder: task.sequenceOrder,
            initiatedById: task.initiatedById,
            taskConfig: task.taskConfig || {},
            inputData: task.inputData || {},
          })),
        });
      }

      return tx.workflowExecution.findUnique({
        where: { id: newWorkflow.id },
        include: {
          initiatedBy: true,
          handledBy: true,
          agentTasks: {
            orderBy: { sequenceOrder: 'asc' },
          },
        },
      });
    });

    this.logger.info(`Workflow created: ${workflow!.id}`, {
      workflowId: workflow!.id,
      projectId: data.projectId,
      taskCount: agentTaskConfigs.length,
    });

    return workflow!;
  }

  /**
   * Update workflow execution
   */
  async updateWorkflow(id: string, data: UpdateWorkflowExecutionDTO) {
    const workflow = await this.prisma.workflowExecution.findUnique({
      where: { id },
    });

    if (!workflow) {
      throw new NotFoundError('Workflow execution', id);
    }

    const updateData: any = {
      lastUpdatedAt: new Date(),
    };

    if (data.status) {
      updateData.status = data.status;

      // Set completion time if completing
      if (data.status === 'COMPLETED' && !workflow.completedAt) {
        updateData.completedAt = new Date();
      }
    }

    if (data.handledById) {
      updateData.handledById = data.handledById;
    }

    if (data.completedById) {
      updateData.completedById = data.completedById;
    }

    if (data.errorMessage) {
      updateData.errorMessage = data.errorMessage;
    }

    if (data.errorLog) {
      updateData.errorLog = data.errorLog;
    }

    if (data.results) {
      updateData.results = data.results;
    }

    const updated = await this.prisma.workflowExecution.update({
      where: { id },
      data: updateData,
      include: {
        initiatedBy: true,
        handledBy: true,
        completedBy: true,
      },
    });

    this.logger.info(`Workflow updated: ${id}`, { status: data.status });

    return updated;
  }

  /**
   * Create agent task
   */
  async createAgentTask(data: CreateAgentTaskDTO) {
    // Validate workflow exists
    const workflow = await this.prisma.workflowExecution.findUnique({
      where: { id: data.workflowExecutionId },
    });

    if (!workflow) {
      throw new NotFoundError('Workflow execution', data.workflowExecutionId);
    }

    const task = await this.prisma.agentTask.create({
      data: {
        workflowExecutionId: data.workflowExecutionId,
        agent: data.agent,
        status: 'OPEN',
        sequenceOrder: data.sequenceOrder,
        initiatedById: data.initiatedById,
        taskConfig: data.taskConfig || {},
        inputData: data.inputData || {},
      },
      include: {
        initiatedBy: true,
      },
    });

    this.logger.info(`Agent task created: ${task.id}`, {
      taskId: task.id,
      agent: data.agent,
      workflowId: data.workflowExecutionId,
    });

    return task;
  }

  /**
   * Update agent task
   */
  async updateAgentTask(id: string, data: UpdateAgentTaskDTO) {
    const task = await this.prisma.agentTask.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundError('Agent task', id);
    }

    const updateData: any = {};

    if (data.status) {
      updateData.status = data.status;

      // Set timestamps based on status
      if (data.status === 'IN_PROGRESS' && !task.startedAt) {
        updateData.startedAt = new Date();
      }

      if (data.status === 'COMPLETED' && !task.completedAt) {
        updateData.completedAt = new Date();

        // Calculate execution time if both timestamps exist
        if (task.startedAt || updateData.startedAt) {
          const startTime = task.startedAt || updateData.startedAt;
          const endTime = updateData.completedAt;
          const executionSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
          updateData.executionTimeSeconds = executionSeconds;
        }
      }
    }

    if (data.handledById) {
      updateData.handledById = data.handledById;
    }

    if (data.completedById) {
      updateData.completedById = data.completedById;
    }

    if (data.outputData) {
      updateData.outputData = data.outputData;
    }

    if (data.errorMessage) {
      updateData.errorMessage = data.errorMessage;
    }

    if (data.errorLog) {
      updateData.errorLog = data.errorLog;
    }

    if (data.executionTimeSeconds !== undefined) {
      updateData.executionTimeSeconds = data.executionTimeSeconds;
    }

    const updated = await this.prisma.agentTask.update({
      where: { id },
      data: updateData,
      include: {
        initiatedBy: true,
        handledBy: true,
        completedBy: true,
      },
    });

    this.logger.info(`Agent task updated: ${id}`, {
      agent: task.agent,
      status: data.status,
    });

    return updated;
  }

  /**
   * Get next incomplete agent task in workflow
   */
  async getNextTask(workflowExecutionId: string) {
    return this.prisma.agentTask.findFirst({
      where: {
        workflowExecutionId,
        status: {
          in: ['OPEN', 'WAITING'],
        },
      },
      orderBy: { sequenceOrder: 'asc' },
      include: {
        initiatedBy: true,
      },
    });
  }

  /**
   * Reset agent task to OPEN status
   */
  async resetAgentTask(id: string) {
    const task = await this.prisma.agentTask.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundError('Agent task', id);
    }

    await this.prisma.agentTask.update({
      where: { id },
      data: {
        status: 'OPEN',
        startedAt: null,
        completedAt: null,
        executionTimeSeconds: null,
        outputData: {},
        errorMessage: null,
        errorLog: null,
        handledById: null,
        completedById: null,
      },
    });

    this.logger.info(`Agent task reset: ${id}`, { agent: task.agent });
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(projectId: string) {
    const workflows = await this.prisma.workflowExecution.findMany({
      where: { projectId },
      include: {
        agentTasks: true,
      },
    });

    const totalWorkflows = workflows.length;
    const completedWorkflows = workflows.filter((w: any) => w.status === 'COMPLETED').length;
    const failedWorkflows = workflows.filter((w: any) => w.status === 'FAILED').length;
    const inProgressWorkflows = workflows.filter((w: any) => w.status === 'IN_PROGRESS').length;

    let totalTasks = 0;
    let completedTasks = 0;
    let failedTasks = 0;

    workflows.forEach((workflow: any) => {
      totalTasks += workflow.agentTasks.length;
      completedTasks += workflow.agentTasks.filter((t: any) => t.status === 'COMPLETED').length;
      failedTasks += workflow.agentTasks.filter((t: any) => t.status === 'FAILED').length;
    });

    return {
      totalWorkflows,
      completedWorkflows,
      failedWorkflows,
      inProgressWorkflows,
      totalTasks,
      completedTasks,
      failedTasks,
      successRate: totalWorkflows > 0 ? (completedWorkflows / totalWorkflows) * 100 : 0,
    };
  }
}