/**
 * BidOps.AI Core API - Main Entry Point
 * 
 * GraphQL API server with:
 * - Apollo Server 4.x
 * - Express.js
 * - PostgreSQL via Prisma
 * - AWS Cognito authentication
 * - WebSocket subscriptions
 * - Health checks
 */

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { json } from 'express';
import { env } from './config/env';
import { prisma, connectDatabase, disconnectDatabase } from './lib/prisma';
import { createApolloServer, applyApolloMiddleware } from './apollo/server';
import { authMiddleware } from './middleware/auth';
import {
  errorHandler,
  notFoundHandler,
  handleUncaughtException,
  handleUnhandledRejection,
} from './middleware/errorHandler';
import { healthCheckRoute, readinessCheckRoute, livenessCheckRoute } from './routes/health';
import logger, { createLogger } from './utils/logger';

const appLogger = createLogger('App');

/**
 * Create Express application
 */
function createApp() {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  // Body parser
  app.use(json({ limit: '10mb' }));

  // Request logging middleware
  app.use((req, res, next) => {
    appLogger.http(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    next();
  });

  // Authentication middleware (applies to all routes)
  app.use(authMiddleware(prisma));

  // Health check routes (no auth required)
  app.use(healthCheckRoute(prisma));
  app.use(readinessCheckRoute(prisma));
  app.use(livenessCheckRoute());

  return app;
}

/**
 * Start the server
 */
async function startServer() {
  try {
    appLogger.info('Starting BidOps.AI Core API...', {
      nodeVersion: process.version,
      environment: env.NODE_ENV,
      port: env.PORT,
    });

    // Connect to database
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = createServer(app);

    // Create and configure Apollo Server
    const apolloServer = await createApolloServer(httpServer, prisma);
    applyApolloMiddleware(app, apolloServer, prisma);

    // 404 handler (must be after all routes)
    app.use(notFoundHandler);

    // Global error handler (must be last)
    app.use(errorHandler);

    // Start HTTP server
    await new Promise<void>((resolve) => {
      httpServer.listen(env.PORT, () => {
        appLogger.info(`🚀 Server ready at http://localhost:${env.PORT}/graphql`);
        appLogger.info(`🔌 Subscriptions ready at ws://localhost:${env.PORT}/graphql`);
        appLogger.info(`💚 Health check available at http://localhost:${env.PORT}/health`);
        resolve();
      });
    });

    // Graceful shutdown handlers
    setupGracefulShutdown(httpServer, apolloServer);

  } catch (error: any) {
    appLogger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown
 */
function setupGracefulShutdown(httpServer: any, apolloServer: any) {
  const signals = ['SIGTERM', 'SIGINT'];

  signals.forEach((signal) => {
    process.on(signal, async () => {
      appLogger.info(`${signal} received, starting graceful shutdown...`);

      try {
        // Stop accepting new connections
        httpServer.close(() => {
          appLogger.info('HTTP server closed');
        });

        // Stop Apollo Server
        await apolloServer.stop();
        appLogger.info('Apollo Server stopped');

        // Disconnect from database
        await disconnectDatabase();

        appLogger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error: any) {
        appLogger.error('Error during shutdown', { error: error.message });
        process.exit(1);
      }
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', handleUncaughtException);

  // Handle unhandled promise rejections
  process.on('unhandledRejection', handleUnhandledRejection);
}

/**
 * Start the application
 */
// Start server when run directly (ESM equivalent of require.main === module)
startServer();

export { createApp, startServer };