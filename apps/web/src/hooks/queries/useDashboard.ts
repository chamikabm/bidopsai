/**
 * TanStack Query Hooks for Dashboard
 */

import { useQuery } from '@tanstack/react-query';
import graphqlClient from '@/lib/graphql/client';
import { GET_DASHBOARD_STATS, GET_MY_PROJECTS } from '@/lib/graphql/queries/projects';

/**
 * Dashboard Statistics Response
 */
interface DashboardStats {
  id: string;
  submittedBids: number;
  wonBids: number;
  totalValue: number;
  wonValue: number;
  successRate: number;
  activeRfps: number;
  detailedMetrics?: Record<string, unknown>;
  calculatedAt: string;
}

/**
 * Dashboard Stats Query Response
 */
interface DashboardStatsResponse {
  dashboardStats: DashboardStats;
}

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const data = await graphqlClient.request<DashboardStatsResponse>(
        GET_DASHBOARD_STATS
      );
      return data.dashboardStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Project Response Type
 */
interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  value?: number;
  deadline?: string;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
  };
  members: Array<{
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      profileImageUrl?: string;
    };
  }>;
}

/**
 * Projects Connection Response
 */
interface ProjectsResponse {
  myProjects: {
    edges: Array<{
      node: Project;
      cursor: string;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string;
      endCursor?: string;
    };
    totalCount: number;
  };
}

/**
 * Hook to fetch user's active projects
 */
export function useUserProjects(options?: {
  first?: number;
  after?: string;
}) {
  const { first = 10, after } = options || {};

  return useQuery({
    queryKey: ['dashboard', 'projects', { first, after }],
    queryFn: async () => {
      const data = await graphqlClient.request<ProjectsResponse>(
        GET_MY_PROJECTS,
        { first, after }
      );
      return data.myProjects;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}