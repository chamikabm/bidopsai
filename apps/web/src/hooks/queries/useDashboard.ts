import { useQuery } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql/client';
import { GET_DASHBOARD_STATS, GET_USER_ACTIVE_PROJECTS } from '@/lib/graphql/queries/dashboard';

interface DashboardStats {
  submittedBids: number;
  wonBids: number;
  totalValue: number;
  activeProjects: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  deadline?: string;
  progressPercentage: number;
  createdAt: string;
  members?: Array<{
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    role: string;
  }>;
}

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats(userId: string) {
  return useQuery<DashboardStats>({
    queryKey: ['dashboardStats', userId],
    queryFn: async () => {
      const response = await graphqlClient.request<{ dashboardStats: DashboardStats }>(
        GET_DASHBOARD_STATS,
        { userId }
      );
      return response.dashboardStats;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes for real-time updates
  });
}

/**
 * Hook to fetch user's active projects
 */
export function useUserActiveProjects(userId: string, limit: number = 6) {
  return useQuery<Project[]>({
    queryKey: ['userActiveProjects', userId, limit],
    queryFn: async () => {
      const response = await graphqlClient.request<{ userActiveProjects: Project[] }>(
        GET_USER_ACTIVE_PROJECTS,
        { userId, limit }
      );
      return response.userActiveProjects;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes for real-time updates
  });
}
