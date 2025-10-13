/**
 * Notification Service
 * 
 * Business logic for user notification management.
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { NotFoundError } from '../utils/errors';

export interface CreateNotificationDTO {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
}

export class NotificationService {
  constructor(
    private prisma: PrismaClient,
    private logger: Logger
  ) {}

  /**
   * Create a new notification
   */
  async create(data: CreateNotificationDTO) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
        read: false,
      },
    });

    this.logger.info(`Notification created: ${notification.id}`, {
      notificationId: notification.id,
      userId: data.userId,
      type: data.type,
    });

    return notification;
  }

  /**
   * List user notifications with pagination
   */
  async listByUser(
    userId: string,
    first: number = 50,
    after?: string,
    unreadOnly: boolean = false
  ) {
    const where: any = { userId };

    if (unreadOnly) {
      where.read = false;
    }

    const cursor = after ? { id: after } : undefined;

    const notifications = await this.prisma.notification.findMany({
      where,
      take: first + 1,
      cursor,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
    });

    const hasNextPage = notifications.length > first;
    const nodes = hasNextPage ? notifications.slice(0, -1) : notifications;

    return {
      nodes,
      hasNextPage,
    };
  }

  /**
   * Get unread notification count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundError('Notification', id);
    }

    // Verify ownership
    if (notification.userId !== userId) {
      throw new NotFoundError('Notification', id);
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    this.logger.info(`Notification marked as read: ${id}`);

    return updated;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    this.logger.info(`All notifications marked as read for user: ${userId}`, {
      count: result.count,
    });

    return result.count;
  }

  /**
   * Delete notification
   */
  async delete(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundError('Notification', id);
    }

    // Verify ownership
    if (notification.userId !== userId) {
      throw new NotFoundError('Notification', id);
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    this.logger.info(`Notification deleted: ${id}`);

    return true;
  }

  /**
   * Delete old read notifications (cleanup)
   */
  async deleteOldReadNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.notification.deleteMany({
      where: {
        read: true,
        readAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.info(`Old notifications deleted`, { count: result.count, daysOld });

    return result.count;
  }

  /**
   * Create bulk notifications (e.g., for project team)
   */
  async createBulk(userIds: string[], data: Omit<CreateNotificationDTO, 'userId'>) {
    const notifications = await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
        read: false,
      })),
    });

    this.logger.info(`Bulk notifications created`, {
      count: notifications.count,
      type: data.type,
    });

    return notifications.count;
  }
}