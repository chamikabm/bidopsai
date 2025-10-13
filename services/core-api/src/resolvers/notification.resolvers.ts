import { GraphQLContext } from '../context';
import { requireAuth } from '../context';
import { NotFoundError } from '../utils/errors';

export const notificationResolvers = {
  Query: {
    /**
     * Get current user's notifications
     */
    myNotifications: async (
      _: any,
      {
        first = 20,
        after,
        unreadOnly = false,
      }: {
        first?: number;
        after?: string;
        unreadOnly?: boolean;
      },
      context: GraphQLContext
    ) => {
      const { prisma, user } = context;
      requireAuth(context);

      const where: any = { userId: user!.id };

      if (unreadOnly) {
        where.read = false;
      }

      const cursor = after ? { id: after } : undefined;

      const notifications = await prisma.notification.findMany({
        where,
        take: first + 1,
        cursor,
        skip: cursor ? 1 : 0,
        orderBy: { createdAt: 'desc' },
      });

      const hasNextPage = notifications.length > first;
      const nodes = hasNextPage ? notifications.slice(0, -1) : notifications;

      return nodes;
    },

    /**
     * Get unread notification count
     */
    unreadNotificationCount: async (_: any, __: any, context: GraphQLContext) => {
      const { prisma, user } = context;
      requireAuth(context);

      return prisma.notification.count({
        where: {
          userId: user!.id,
          read: false,
        },
      });
    },
  },

  Mutation: {
    /**
     * Mark notification as read
     */
    markNotificationAsRead: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const { prisma, user, logger } = context;
      requireAuth(context);

      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        throw new NotFoundError('Notification', id);
      }

      // Verify ownership
      if (notification.userId !== user!.id) {
        throw new NotFoundError('Notification', id);
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      logger.info(`Notification marked as read: ${id}`);

      return updated;
    },

    /**
     * Mark all notifications as read for current user
     */
    markAllNotificationsAsRead: async (_: any, __: any, context: GraphQLContext) => {
      const { prisma, user, logger } = context;
      requireAuth(context);

      const result = await prisma.notification.updateMany({
        where: {
          userId: user!.id,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      logger.info(`Marked ${result.count} notifications as read for user ${user!.id}`);

      return result.count;
    },

    /**
     * Delete a notification
     */
    deleteNotification: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const { prisma, user, logger } = context;
      requireAuth(context);

      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        throw new NotFoundError('Notification', id);
      }

      // Verify ownership
      if (notification.userId !== user!.id) {
        throw new NotFoundError('Notification', id);
      }

      await prisma.notification.delete({
        where: { id },
      });

      logger.info(`Notification deleted: ${id}`);

      return true;
    },
  },

  Subscription: {
    /**
     * Subscribe to new notifications for user
     */
    notificationReceived: {
      subscribe: async (_: any, { userId }: { userId: string }, context: GraphQLContext) => {
        requireAuth(context);
        // TODO: Phase 8 - Implement with PubSub
        throw new Error('Subscriptions not yet implemented');
      },
    },
  },
};