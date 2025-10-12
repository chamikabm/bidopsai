/**
 * GraphQL Context Builder
 * 
 * Constructs the context object passed to all resolvers.
 * Contains authenticated user info, database client, and utilities.
 */

import { PrismaClient } from '@prisma/client';
import { Request } from 'express';
import { createLogger, Logger } from '@/utils/logger';
import { AuthenticationError } from '@/utils/errors';
import { createServices, Services } from '@/services/service.factory';

/**
 * Authenticated user information extracted from JWT
 */
export interface AuthUser {
  id: string;
  email: string;
  cognitoUserId: string;
  roles: string[];
  permissions: string[];
}

/**
 * GraphQL Context passed to all resolvers
 */
export interface GraphQLContext {
  // Authenticated user (null if not authenticated)
  user: AuthUser | null;
  
  // Database client
  prisma: PrismaClient;
  
  // Logger instance
  logger: Logger;
  
  // Request object for headers, IP, etc.
  req: Request;
  
  // Trace ID for request tracking
  traceId: string;
  
  // Service layer instances
  services: Services;
}

/**
 * Generate unique trace ID for request tracking
 */
function generateTraceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract user from request (set by auth middleware)
 */
function getUserFromRequest(req: Request): AuthUser | null {
  // Auth middleware attaches user to req.user
  return (req as any).user || null;
}

/**
 * Context builder function for Apollo Server
 * 
 * @param req - Express request object
 * @param prisma - Prisma client instance
 * @returns GraphQL context object
 */
export async function buildContext(
  req: Request,
  prisma: PrismaClient
): Promise<GraphQLContext> {
  const traceId = generateTraceId();
  const logger = createLogger('GraphQL');
  const user = getUserFromRequest(req);

  // Log request initiation
  logger.debug('Building GraphQL context', {
    traceId,
    userId: user?.id,
    path: req.path,
    method: req.method,
  });

  // Create service instances
  const services = createServices(prisma, logger);

  return {
    user,
    prisma,
    logger,
    req,
    traceId,
    services,
  };
}

/**
 * Require authenticated user in resolver
 * Throws AuthenticationError if user is not authenticated
 * 
 * @param context - GraphQL context
 * @returns Authenticated user
 */
export function requireAuth(context: GraphQLContext): AuthUser {
  if (!context.user) {
    throw new AuthenticationError('Authentication required');
  }
  return context.user;
}

/**
 * Check if user has specific permission
 * 
 * @param context - GraphQL context
 * @param resource - Resource name (e.g., 'PROJECT')
 * @param action - Action name (e.g., 'CREATE')
 * @returns true if user has permission
 */
export function hasPermission(
  context: GraphQLContext,
  resource: string,
  action: string
): boolean {
  if (!context.user) {
    return false;
  }

  const requiredPermission = `${resource}:${action}`;
  return context.user.permissions.includes(requiredPermission);
}

/**
 * Require specific permission in resolver
 * Throws AuthorizationError if user doesn't have permission
 * 
 * @param context - GraphQL context
 * @param resource - Resource name
 * @param action - Action name
 */
export function requirePermission(
  context: GraphQLContext,
  resource: string,
  action: string
): void {
  const user = requireAuth(context);
  
  if (!hasPermission(context, resource, action)) {
    throw new AuthenticationError(
      `Missing required permission: ${resource}:${action}`
    );
  }

  context.logger.debug('Permission check passed', {
    userId: user.id,
    resource,
    action,
  });
}

/**
 * Check if user has specific role
 * 
 * @param context - GraphQL context
 * @param role - Role name (e.g., 'ADMIN')
 * @returns true if user has role
 */
export function hasRole(context: GraphQLContext, role: string): boolean {
  if (!context.user) {
    return false;
  }
  return context.user.roles.includes(role);
}

/**
 * Require specific role in resolver
 * Throws AuthorizationError if user doesn't have role
 * 
 * @param context - GraphQL context
 * @param role - Role name
 */
export function requireRole(context: GraphQLContext, role: string): void {
  const user = requireAuth(context);
  
  if (!hasRole(context, role)) {
    throw new AuthenticationError(`Missing required role: ${role}`);
  }

  context.logger.debug('Role check passed', {
    userId: user.id,
    role,
  });
}

/**
 * Check if user owns resource
 * 
 * @param context - GraphQL context
 * @param resourceOwnerId - Owner ID of the resource
 * @returns true if user owns resource
 */
export function isOwner(
  context: GraphQLContext,
  resourceOwnerId: string
): boolean {
  if (!context.user) {
    return false;
  }
  return context.user.id === resourceOwnerId;
}

/**
 * Require resource ownership
 * Allows access if user is owner OR has admin role
 * 
 * @param context - GraphQL context
 * @param resourceOwnerId - Owner ID of the resource
 */
export function requireOwnership(
  context: GraphQLContext,
  resourceOwnerId: string
): void {
  const user = requireAuth(context);
  
  // Admin can access any resource
  if (hasRole(context, 'ADMIN')) {
    return;
  }

  // Otherwise, must be owner
  if (!isOwner(context, resourceOwnerId)) {
    throw new AuthenticationError('Access denied: You do not own this resource');
  }

  context.logger.debug('Ownership check passed', {
    userId: user.id,
    resourceOwnerId,
  });
}