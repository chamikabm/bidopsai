/**
 * Service Factory
 * 
 * Factory for creating service instances with shared dependencies.
 * Used in GraphQL context to provide services to resolvers.
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { UserService } from './user.service';
import { ProjectService } from './project.service';
import { WorkflowService } from './workflow.service';
import { NotificationService } from './notification.service';
import { S3Service } from './s3.service';
import { CognitoService } from './cognito.service';
import { PubSubService } from './pubsub.service';

export interface Services {
  user: UserService;
  project: ProjectService;
  workflow: WorkflowService;
  notification: NotificationService;
  s3: S3Service;
  cognito: CognitoService;
  pubsub: PubSubService;
}

/**
 * Create all service instances with shared dependencies
 */
export function createServices(prisma: PrismaClient, logger: Logger): Services {
  return {
    user: new UserService(prisma, logger),
    project: new ProjectService(prisma, logger),
    workflow: new WorkflowService(prisma, logger),
    notification: new NotificationService(prisma, logger),
    s3: new S3Service(logger),
    cognito: new CognitoService(logger),
    pubsub: new PubSubService(logger),
  };
}