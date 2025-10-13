/**
 * Apollo Server Configuration
 * 
 * Sets up Apollo Server 4.x with:
 * - GraphQL schema
 * - Context builder
 * - Error formatting
 * - Plugins (logging, complexity)
 * - WebSocket subscriptions support
 */

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PrismaClient } from '@prisma/client';
import { Server } from 'http';
import { Express, Request } from 'express';
import { GraphQLSchema } from 'graphql';
import { buildContext, GraphQLContext } from '@/context';
import { formatGraphQLError } from '@/middleware/errorHandler';
import { createLogger, logGraphQLOperation } from '@/utils/logger';
import { env } from '@/config/env';
import { typeDefs } from '@/schema';
import { resolvers } from '@/resolvers';

const logger = createLogger('ApolloServer');

/**
 * Create executable GraphQL schema
 */
function createSchema(): GraphQLSchema {
  return makeExecutableSchema({
    typeDefs,
    resolvers,
  });
}

/**
 * GraphQL request logging plugin
 */
function requestLoggingPlugin() {
  return {
    async requestDidStart(requestContext: any) {
      const startTime = Date.now();
      const { operationName, operation } = requestContext.request;

      return {
        async willSendResponse(responseContext: any) {
          const duration = Date.now() - startTime;
          const userId = responseContext.contextValue?.user?.id;

          logGraphQLOperation(
            operationName,
            operation?.operation || 'unknown',
            userId,
            duration
          );
        },
        async didEncounterErrors(errorContext: any) {
          logger.error('GraphQL errors', {
            operationName,
            errors: errorContext.errors.map((e: any) => ({
              message: e.message,
              path: e.path,
              code: e.extensions?.code,
            })),
          });
        },
      };
    },
  };
}

/**
 * Create Apollo Server instance
 * 
 * @param httpServer - HTTP server instance
 * @param prisma - Prisma client instance
 * @returns Apollo Server instance
 */
export async function createApolloServer(
  httpServer: Server,
  prisma: PrismaClient
): Promise<ApolloServer<GraphQLContext>> {
  // Create executable schema
  const schema = createSchema();

  // Create WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  // Set up WebSocket server with graphql-ws
  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        // Build context for subscriptions
        // Note: ctx contains connection params and request info
        return buildContext(ctx.extra.request as Request, prisma);
      },
      onConnect: async (ctx) => {
        logger.info('WebSocket client connected', {
          connectionParams: ctx.connectionParams,
        });
      },
      onDisconnect: (ctx) => {
        logger.info('WebSocket client disconnected');
      },
    },
    wsServer
  );

  // Create Apollo Server
  const server = new ApolloServer<GraphQLContext>({
    schema,
    plugins: [
      // Drain HTTP server on shutdown
      ApolloServerPluginDrainHttpServer({ httpServer }),
      
      // Drain WebSocket server on shutdown
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },

      // Request logging
      requestLoggingPlugin(),

      // GraphQL Playground in development
      ...(env.NODE_ENV === 'development'
        ? [ApolloServerPluginLandingPageLocalDefault()]
        : []),
    ],
    formatError: formatGraphQLError,
    introspection: env.NODE_ENV !== 'production',
    includeStacktraceInErrorResponses: env.NODE_ENV !== 'production',
  });

  // Start Apollo Server
  await server.start();
  logger.info('Apollo Server started successfully');

  return server;
}

/**
 * Apply Apollo Server middleware to Express app
 * 
 * @param app - Express app
 * @param server - Apollo Server instance
 * @param prisma - Prisma client
 */
export function applyApolloMiddleware(
  app: Express,
  server: ApolloServer<GraphQLContext>,
  prisma: PrismaClient
): void {
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => buildContext(req as Request, prisma),
    })
  );

  logger.info('Apollo Server middleware applied to /graphql');
}

/**
 * GraphQL subscription configuration
 */
export const subscriptionConfig = {
  path: '/graphql',
  keepAlive: 10000, // Keep connection alive with ping every 10s
};