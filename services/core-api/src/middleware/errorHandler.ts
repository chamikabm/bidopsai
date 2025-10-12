/**
 * Error Handling Middleware
 * 
 * Centralized error handling for Express routes.
 * Formats errors consistently and logs them appropriately.
 */

import { Request, Response, NextFunction } from 'express';
import { GraphQLError } from 'graphql';
import { AppError, isOperationalError, ErrorCode } from '@/utils/errors';
import { logError, createLogger } from '@/utils/logger';

const logger = createLogger('ErrorHandler');

/**
 * Error response format
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    meta?: Record<string, any>;
    stack?: string;
  };
  timestamp: string;
  path: string;
  traceId?: string;
}

/**
 * Format error for HTTP response
 */
function formatErrorResponse(
  error: AppError | Error,
  req: Request,
  includeStack: boolean = false
): ErrorResponse {
  const isAppError = error instanceof AppError;
  
  return {
    error: {
      code: isAppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR,
      message: error.message,
      statusCode: isAppError ? error.statusCode : 500,
      meta: isAppError ? error.meta : undefined,
      stack: includeStack ? error.stack : undefined,
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    traceId: (req as any).traceId,
  };
}

/**
 * Global error handler middleware
 * 
 * Should be the last middleware in the chain.
 * Catches all errors and sends formatted response.
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Prevent duplicate error handling
  if (res.headersSent) {
    return next(error);
  }

  // Check if this is an operational error
  const operational = isOperationalError(error);
  
  // Log error appropriately
  if (operational && error instanceof AppError) {
    // Expected errors - log at appropriate level
    if (error.statusCode >= 500) {
      logError(error, 'ErrorHandler');
    } else {
      logger.warn(error.message, {
        code: error.code,
        statusCode: error.statusCode,
        path: req.path,
      });
    }
  } else {
    // Unexpected errors - always log with full context
    logError(error, 'ErrorHandler', {
      path: req.path,
      method: req.method,
      query: req.query,
      body: req.body,
      user: (req as any).user?.id,
    });
  }

  // Determine status code
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  // Include stack trace in development
  const includeStack = process.env.NODE_ENV !== 'production';

  // Format and send error response
  const errorResponse = formatErrorResponse(error, req, includeStack);
  
  res.status(statusCode).json(errorResponse);
}

/**
 * Not found handler middleware
 * 
 * Catches 404 errors for undefined routes.
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const error = new AppError(
    `Route not found: ${req.method} ${req.path}`,
    ErrorCode.RESOURCE_NOT_FOUND,
    404
  );
  
  next(error);
}

/**
 * Async handler wrapper
 * 
 * Wraps async route handlers to catch promise rejections.
 * 
 * @param fn - Async route handler
 * @returns Wrapped handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * GraphQL error formatter
 * 
 * Formats GraphQL errors for Apollo Server.
 */
export function formatGraphQLError(error: GraphQLError) {
  const originalError = error.originalError;

  // If it's an AppError, use its formatting
  if (originalError instanceof AppError) {
    return {
      message: originalError.message,
      extensions: {
        code: originalError.code,
        statusCode: originalError.statusCode,
        ...originalError.meta,
      },
      path: error.path,
      locations: error.locations,
    };
  }

  // Log unexpected errors
  if (originalError) {
    logError(originalError, 'GraphQL', {
      path: error.path,
      message: error.message,
    });
  }

  // Default error format
  return {
    message: error.message,
    extensions: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      statusCode: 500,
    },
    path: error.path,
    locations: error.locations,
  };
}

/**
 * Unhandled rejection handler
 * 
 * Logs unhandled promise rejections.
 */
export function handleUnhandledRejection(reason: any, promise: Promise<any>) {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });

  // In production, we might want to shut down gracefully
  if (process.env.NODE_ENV === 'production') {
    logger.error('Shutting down due to unhandled rejection');
    process.exit(1);
  }
}

/**
 * Uncaught exception handler
 * 
 * Logs uncaught exceptions.
 */
export function handleUncaughtException(error: Error) {
  logError(error, 'UncaughtException');

  // In production, shut down immediately
  if (process.env.NODE_ENV === 'production') {
    logger.error('Shutting down due to uncaught exception');
    process.exit(1);
  }
}