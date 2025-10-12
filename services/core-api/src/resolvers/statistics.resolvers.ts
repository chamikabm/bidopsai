import { GraphQLContext } from '../context';
import { requireAuth, requirePermission } from '../context';
import { ValidationError } from '../utils/errors';

/**
 * Helper function to calculate date ranges for dashboard stats
 */
function getCurrentPeriod() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return {
    periodStart: startOfMonth,
    periodEnd: endOfMonth,
  };
}

/**
 * Helper function to calculate bid statistics from projects
 */
async function calculateBidStatistics(
  prisma: any,
  periodStart: Date,
  periodEnd: Date
): Promise<any> {
  // Count submitted bids (all projects in period)
  const submittedBids = await prisma.project.count({
    where: {
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
  });

  // Count won bids (completed projects with status = 'Completed')
  const wonBids = await prisma.project.count({
    where: {
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
      status: 'Completed',
      completedAt: { not: null },
    },
  });

  // Calculate total value (sum of all project values)
  const totalValueResult = await prisma.project.aggregate({
    where: {
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
    _sum: {
      value: true,
    },
  });

  // Calculate won value (sum of completed project values)
  const wonValueResult = await prisma.project.aggregate({
    where: {
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
      status: 'Completed',
      completedAt: { not: null },
    },
    _sum: {
      value: true,
    },
  });

  // Count active RFPs (projects with status 'InProgress' or 'Planning')
  const activeRfps = await prisma.project.count({
    where: {
      status: {
        in: ['InProgress', 'Planning'],
      },
    },
  });

  const totalValue = totalValueResult._sum.value || 0;
  const wonValue = wonValueResult._sum.value || 0;
  const successRate = submittedBids > 0 ? (wonBids / submittedBids) * 100 : 0;

  // Get breakdown by status
  const projectsByStatus = await prisma.project.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
    _count: {
      id: true,
    },
  });

  const statusBreakdown: Record<string, number> = {};
  projectsByStatus.forEach((item: any) => {
    statusBreakdown[item.status] = item._count.id;
  });

  // Get average project duration for completed projects
  const completedProjects = await prisma.project.findMany({
    where: {
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
      status: 'Completed',
      completedAt: { not: null },
    },
    select: {
      createdAt: true,
      completedAt: true,
    },
  });

  let avgDurationDays = 0;
  if (completedProjects.length > 0) {
    const totalDuration = completedProjects.reduce((sum: number, project: any) => {
      const duration =
        (new Date(project.completedAt).getTime() - new Date(project.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);
      return sum + duration;
    }, 0);
    avgDurationDays = totalDuration / completedProjects.length;
  }

  return {
    periodStart,
    periodEnd,
    submittedBids,
    wonBids,
    totalValue,
    wonValue,
    successRate,
    activeRfps,
    detailedMetrics: {
      statusBreakdown,
      averageProjectDurationDays: Math.round(avgDurationDays * 10) / 10,
      totalProjects: submittedBids,
      completedProjects: wonBids,
      inProgressProjects: statusBreakdown['InProgress'] || 0,
      planningProjects: statusBreakdown['Planning'] || 0,
      failedProjects: statusBreakdown['Failed'] || 0,
    },
  };
}

export const statisticsResolvers = {
  Query: {
    /**
     * Get dashboard statistics for current period
     */
    dashboardStats: async (_: any, __: any, context: GraphQLContext) => {
      const { prisma, logger } = context;
      requireAuth(context);
      requirePermission(context, 'DASHBOARD', 'READ');

      const { periodStart, periodEnd } = getCurrentPeriod();

      logger.info('Calculating dashboard stats', { periodStart, periodEnd });

      const stats = await calculateBidStatistics(prisma, periodStart, periodEnd);

      // Check if we have a cached record for this period
      const existingStats = await prisma.bidStatistics.findFirst({
        where: {
          periodStart: {
            gte: periodStart,
          },
          periodEnd: {
            lte: periodEnd,
          },
        },
        orderBy: {
          calculatedAt: 'desc',
        },
      });

      // If we have cached stats from today, return them
      // Otherwise, create a new record
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (existingStats && new Date(existingStats.calculatedAt) >= today) {
        return existingStats;
      }

      // Create new statistics record
      const newStats = await prisma.bidStatistics.create({
        data: {
          periodStart: stats.periodStart,
          periodEnd: stats.periodEnd,
          submittedBids: stats.submittedBids,
          wonBids: stats.wonBids,
          totalValue: stats.totalValue,
          wonValue: stats.wonValue,
          successRate: stats.successRate,
          activeRfps: stats.activeRfps,
          detailedMetrics: stats.detailedMetrics,
          calculatedAt: new Date(),
        },
      });

      logger.info('Dashboard stats calculated', { statsId: newStats.id });

      return newStats;
    },

    /**
     * Get bid statistics for a specific period
     */
    bidStatistics: async (
      _: any,
      { periodStart, periodEnd }: { periodStart: string; periodEnd: string },
      context: GraphQLContext
    ) => {
      const { prisma, logger } = context;
      requireAuth(context);
      requirePermission(context, 'STATISTICS', 'READ');

      const startDate = new Date(periodStart);
      const endDate = new Date(periodEnd);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new ValidationError('Invalid date format', {
          periodStart: 'Invalid date format',
          periodEnd: 'Invalid date format',
        });
      }

      if (startDate > endDate) {
        throw new ValidationError('Invalid date range', {
          periodStart: 'Start date must be before end date',
        });
      }

      logger.info('Calculating bid statistics', { periodStart, periodEnd });

      const stats = await calculateBidStatistics(prisma, startDate, endDate);

      // Check if we have a cached record for this exact period
      const existingStats = await prisma.bidStatistics.findFirst({
        where: {
          periodStart: startDate,
          periodEnd: endDate,
        },
        orderBy: {
          calculatedAt: 'desc',
        },
      });

      // If we have stats calculated within the last hour, return them
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      if (existingStats && new Date(existingStats.calculatedAt) >= oneHourAgo) {
        return existingStats;
      }

      // Create or update statistics record
      const newStats = await prisma.bidStatistics.upsert({
        where: {
          id: existingStats?.id || 'new-record',
        },
        create: {
          periodStart: stats.periodStart,
          periodEnd: stats.periodEnd,
          submittedBids: stats.submittedBids,
          wonBids: stats.wonBids,
          totalValue: stats.totalValue,
          wonValue: stats.wonValue,
          successRate: stats.successRate,
          activeRfps: stats.activeRfps,
          detailedMetrics: stats.detailedMetrics,
          calculatedAt: new Date(),
        },
        update: {
          submittedBids: stats.submittedBids,
          wonBids: stats.wonBids,
          totalValue: stats.totalValue,
          wonValue: stats.wonValue,
          successRate: stats.successRate,
          activeRfps: stats.activeRfps,
          detailedMetrics: stats.detailedMetrics,
          calculatedAt: new Date(),
        },
      });

      logger.info('Bid statistics calculated', { statsId: newStats.id });

      return newStats;
    },
  },
};