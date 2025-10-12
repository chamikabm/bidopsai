/**
 * Logger Utility
 * 
 * Winston-based logging with structured JSON output for production
 * and human-readable output for development.
 * 
 * Log Levels: error, warn, info, http, debug
 */

import winston from 'winston';
import { env } from '@/config/env';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

/**
 * Custom format for development - human-readable with colors
 */
const developmentFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += `\n${JSON.stringify(metadata, null, 2)}`;
  }
  
  return msg;
});

/**
 * Production format - structured JSON for log aggregation
 */
const productionFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json()
);

/**
 * Development format - colorized human-readable output
 */
const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  developmentFormat
);

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: env.NODE_ENV === 'production' ? productionFormat : devFormat,
  defaultMeta: {
    service: 'core-api',
    environment: env.NODE_ENV,
  },
  transports: [
    // Console output
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  exitOnError: false,
});

/**
 * Stream for Morgan HTTP logging middleware
 */
export const httpLogStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

/**
 * Type-safe logger interface
 */
export interface Logger {
  error: (message: string, meta?: Record<string, any>) => void;
  warn: (message: string, meta?: Record<string, any>) => void;
  info: (message: string, meta?: Record<string, any>) => void;
  http: (message: string, meta?: Record<string, any>) => void;
  debug: (message: string, meta?: Record<string, any>) => void;
}

/**
 * Create context-specific logger
 * 
 * @param context - Context identifier (e.g., 'UserResolver', 'AuthMiddleware')
 * @returns Logger instance with context
 */
export function createLogger(context: string): Logger {
  return {
    error: (message: string, meta?: Record<string, any>) => {
      logger.error(message, { context, ...meta });
    },
    warn: (message: string, meta?: Record<string, any>) => {
      logger.warn(message, { context, ...meta });
    },
    info: (message: string, meta?: Record<string, any>) => {
      logger.info(message, { context, ...meta });
    },
    http: (message: string, meta?: Record<string, any>) => {
      logger.http(message, { context, ...meta });
    },
    debug: (message: string, meta?: Record<string, any>) => {
      logger.debug(message, { context, ...meta });
    },
  };
}

/**
 * Log GraphQL operations
 */
export function logGraphQLOperation(
  operationName: string | null,
  operationType: string,
  userId?: string,
  duration?: number
): void {
  logger.info('GraphQL Operation', {
    operationName,
    operationType,
    userId,
    duration: duration ? `${duration}ms` : undefined,
  });
}

/**
 * Log errors with full context
 */
export function logError(
  error: Error,
  context: string,
  meta?: Record<string, any>
): void {
  logger.error(error.message, {
    context,
    stack: error.stack,
    name: error.name,
    ...meta,
  });
}

/**
 * Log authentication events
 */
export function logAuth(
  event: 'login' | 'logout' | 'token_refresh' | 'auth_failure',
  userId?: string,
  meta?: Record<string, any>
): void {
  logger.info(`Auth: ${event}`, {
    event,
    userId,
    ...meta,
  });
}

/**
 * Log database operations
 */
export function logDatabase(
  operation: string,
  table: string,
  duration?: number,
  meta?: Record<string, any>
): void {
  logger.debug('Database Operation', {
    operation,
    table,
    duration: duration ? `${duration}ms` : undefined,
    ...meta,
  });
}

export default logger;