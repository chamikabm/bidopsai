/**
 * Error Handling Utilities
 * 
 * Centralized error types and handling for the GraphQL API.
 * All errors include machine-readable error codes for client consumption.
 */

import { GraphQLError } from 'graphql';
import { logError } from './logger';

/**
 * Standardized error codes for API consumers
 */
export enum ErrorCode {
  // Authentication & Authorization
  AUTH_TOKEN_MISSING = 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',

  // Validation
  VALIDATION_INPUT_INVALID = 'VALIDATION_INPUT_INVALID',
  VALIDATION_FIELD_REQUIRED = 'VALIDATION_FIELD_REQUIRED',
  VALIDATION_FIELD_FORMAT = 'VALIDATION_FIELD_FORMAT',

  // Resources
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  DATABASE_CONSTRAINT_VIOLATION = 'DATABASE_CONSTRAINT_VIOLATION',

  // Business Logic
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  WORKFLOW_STATE_INVALID = 'WORKFLOW_STATE_INVALID',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',

  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  S3_UPLOAD_FAILED = 'S3_UPLOAD_FAILED',
  COGNITO_ERROR = 'COGNITO_ERROR',
  BEDROCK_ERROR = 'BEDROCK_ERROR',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500,
    public meta?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toGraphQLError(): GraphQLError {
    return new GraphQLError(this.message, {
      extensions: {
        code: this.code,
        statusCode: this.statusCode,
        ...this.meta,
      },
    });
  }
}

/**
 * Authentication errors (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', code: ErrorCode = ErrorCode.AUTH_TOKEN_INVALID) {
    super(message, code, 401);
  }
}

/**
 * Authorization errors (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', code: ErrorCode = ErrorCode.AUTH_FORBIDDEN) {
    super(message, code, 403);
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string>) {
    super(message, ErrorCode.VALIDATION_INPUT_INVALID, 400, { fields });
  }
}

/**
 * Not found errors (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, ErrorCode.RESOURCE_NOT_FOUND, 404, { resource, identifier });
  }
}

/**
 * Conflict errors (409)
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorCode.RESOURCE_CONFLICT, 409, details);
  }
}

/**
 * Database errors (500)
 */
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, ErrorCode.DATABASE_ERROR, 500, {
      originalMessage: originalError?.message,
    });
  }
}

/**
 * External service errors (502)
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, originalError?: Error) {
    super(
      `${service} error: ${message}`,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      502,
      {
        service,
        originalMessage: originalError?.message,
      }
    );
  }
}

/**
 * Business logic errors (400)
 */
export class BusinessRuleError extends AppError {
  constructor(message: string, rule?: string) {
    super(message, ErrorCode.BUSINESS_RULE_VIOLATION, 400, { rule });
  }
}

/**
 * Not Implemented Error (501)
 * Used for resolver stubs during development
 */
export class NotImplementedError extends AppError {
  constructor(feature: string) {
    super(`${feature} is not yet implemented`, ErrorCode.INTERNAL_SERVER_ERROR, 501);
  }
}

/**
 * Rate limiting errors (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, { retryAfter });
  }
}

/**
 * Handle Prisma errors and convert to AppError
 */
export function handlePrismaError(error: any): AppError {
  // Prisma Client errors start with 'P'
  if (error.code?.startsWith('P')) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const target = error.meta?.target || 'field';
        return new ConflictError(
          `A record with this ${target} already exists`,
          { constraint: target }
        );
      
      case 'P2025':
        // Record not found
        return new NotFoundError('Record');
      
      case 'P2003':
        // Foreign key constraint violation
        return new ConflictError('Referenced record does not exist');
      
      case 'P2014':
        // Relation violation
        return new ConflictError('Cannot delete record with related records');
      
      default:
        return new DatabaseError('Database operation failed', error);
    }
  }

  // Generic database error
  return new DatabaseError('Database operation failed', error);
}

/**
 * Handle AWS SDK errors
 */
export function handleAWSError(error: any, service: string): AppError {
  const message = error.message || 'AWS service error';
  
  switch (error.name) {
    case 'NotFound':
    case 'ResourceNotFoundException':
      return new NotFoundError(service, error.$metadata?.requestId);
    
    case 'AccessDenied':
    case 'UnauthorizedException':
      return new AuthorizationError(`Access denied to ${service}`);
    
    case 'ThrottlingException':
    case 'TooManyRequestsException':
      return new RateLimitError(`${service} rate limit exceeded`);
    
    default:
      return new ExternalServiceError(service, message, error);
  }
}

/**
 * Convert any error to AppError
 */
export function normalizeError(error: unknown, context?: string): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Prisma error
  if (error && typeof error === 'object' && 'code' in error) {
    return handlePrismaError(error);
  }

  // Standard Error
  if (error instanceof Error) {
    if (context) {
      logError(error, context);
    }
    return new AppError(
      error.message || 'An unexpected error occurred',
      ErrorCode.INTERNAL_SERVER_ERROR,
      500
    );
  }

  // Unknown error type
  return new AppError(
    'An unexpected error occurred',
    ErrorCode.INTERNAL_SERVER_ERROR,
    500
  );
}

/**
 * Format validation errors from Zod
 */
export function formatZodError(error: any): ValidationError {
  const fields: Record<string, string> = {};
  
  if (error.errors && Array.isArray(error.errors)) {
    error.errors.forEach((err: any) => {
      const path = err.path.join('.');
      fields[path] = err.message;
    });
  }

  return new ValidationError('Validation failed', fields);
}

/**
 * Check if error is operational (expected) vs programming error
 */
export function isOperationalError(error: Error): boolean {
  return error instanceof AppError;
}