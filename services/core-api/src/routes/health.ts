/**
 * Health Check Endpoint
 * 
 * Provides health status for container orchestration (ECS, K8s).
 * Checks database connectivity and returns detailed status.
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();
const logger = createLogger('HealthCheck');

/**
 * Health check response
 */
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: CheckResult;
    memory: CheckResult;
  };
}

interface CheckResult {
  status: 'pass' | 'fail';
  message?: string;
  responseTime?: number;
}

/**
 * Check database connectivity
 */
async function checkDatabase(prisma: PrismaClient): Promise<CheckResult> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;

    return {
      status: 'pass',
      message: 'Database connection successful',
      responseTime,
    };
  } catch (error: any) {
    logger.error('Database health check failed', { error: error.message });
    return {
      status: 'fail',
      message: error.message || 'Database connection failed',
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): CheckResult {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const usagePercent = (heapUsedMB / heapTotalMB) * 100;

  // Warn if using more than 90% of heap
  if (usagePercent > 90) {
    return {
      status: 'fail',
      message: `High memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`,
    };
  }

  return {
    status: 'pass',
    message: `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`,
  };
}

/**
 * GET /health
 * 
 * Returns health status of the service
 */
export function healthCheckRoute(prisma: PrismaClient) {
  router.get(
    '/health',
    asyncHandler(async (req: Request, res: Response) => {
      const startTime = Date.now();

      // Run health checks
      const [dbCheck, memCheck] = await Promise.all([
        checkDatabase(prisma),
        Promise.resolve(checkMemory()),
      ]);

      // Determine overall status
      const allPassed = dbCheck.status === 'pass' && memCheck.status === 'pass';
      const anyFailed = dbCheck.status === 'fail' || memCheck.status === 'fail';

      const status: 'healthy' | 'degraded' | 'unhealthy' = anyFailed
        ? 'unhealthy'
        : allPassed
        ? 'healthy'
        : 'degraded';

      const response: HealthCheckResponse = {
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        checks: {
          database: dbCheck,
          memory: memCheck,
        },
      };

      const responseTime = Date.now() - startTime;

      // Log health check
      logger.debug('Health check completed', {
        status,
        responseTime: `${responseTime}ms`,
        database: dbCheck.status,
        memory: memCheck.status,
      });

      // Return 503 if unhealthy
      const statusCode = status === 'unhealthy' ? 503 : 200;

      res.status(statusCode).json(response);
    })
  );

  return router;
}

/**
 * GET /health/ready
 * 
 * Kubernetes readiness probe
 * Returns 200 if service is ready to accept traffic
 */
export function readinessCheckRoute(prisma: PrismaClient) {
  router.get(
    '/health/ready',
    asyncHandler(async (req: Request, res: Response) => {
      try {
        // Check database connectivity
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        logger.error('Readiness check failed', { error: error.message });
        res.status(503).json({
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          error: error.message,
        });
      }
    })
  );

  return router;
}

/**
 * GET /health/live
 * 
 * Kubernetes liveness probe
 * Returns 200 if service is alive (basic check)
 */
export function livenessCheckRoute() {
  router.get('/health/live', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  return router;
}

export default router;