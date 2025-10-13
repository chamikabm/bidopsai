/**
 * Prisma Client Singleton
 * 
 * Creates and exports a single Prisma Client instance to avoid
 * connection pool exhaustion during development hot-reload.
 * 
 * Best practices:
 * - Single instance across application
 * - Graceful shutdown handling
 * - Connection pooling configuration
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Prisma');

/**
 * Prisma Client options
 */
const prismaOptions = {
  log: [
    { emit: 'event', level: 'query' as const },
    { emit: 'event', level: 'error' as const },
    { emit: 'event', level: 'warn' as const },
  ],
};

/**
 * Global prisma instance for development hot-reload
 * Prevents multiple instances during module reload
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Create Prisma Client instance
 */
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient(prismaOptions);

  // Log queries in development
  if (process.env.NODE_ENV !== 'production') {
    client.$on('query' as never, (e: any) => {
      logger.debug('Query executed', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
      });
    });
  }

  // Log errors
  client.$on('error' as never, (e: any) => {
    logger.error('Prisma error', {
      message: e.message,
      target: e.target,
    });
  });

  // Log warnings
  client.$on('warn' as never, (e: any) => {
    logger.warn('Prisma warning', {
      message: e.message,
    });
  });

  logger.info('Prisma Client initialized');

  return client;
}

/**
 * Singleton Prisma Client
 * Reuses global instance in development to avoid connection issues
 */
export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Connect to database
 * Should be called during application startup
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error: any) {
    logger.error('Failed to connect to database', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Disconnect from database
 * Should be called during graceful shutdown
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error: any) {
    logger.error('Error disconnecting from database', {
      error: error.message,
    });
  }
}

/**
 * Check database health
 * Returns true if database is accessible
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get database connection pool status
 */
export function getDatabaseStats() {
  return {
    connected: prisma ? true : false,
    // Additional stats can be added as needed
  };
}

export default prisma;