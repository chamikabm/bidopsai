/**
 * TanStack Query Client Configuration
 * 
 * Configures React Query for server state management
 * Integrates with SSE streams for real-time updates
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { QUERY_STALE_TIME, QUERY_CACHE_TIME } from '@/utils/constants';

// ============================================
// Default Query Options
// ============================================

const queryConfig: DefaultOptions = {
  queries: {
    // Time before query is considered stale (5 minutes)
    staleTime: QUERY_STALE_TIME,
    
    // Time before inactive queries are garbage collected (10 minutes)
    gcTime: QUERY_CACHE_TIME,
    
    // Retry failed queries
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    
    // Exponential backoff for retries
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch on window focus for critical data
    refetchOnWindowFocus: true,
    
    // Don't refetch on mount if data is fresh
    refetchOnMount: false,
    
    // Refetch on network reconnect
    refetchOnReconnect: true,
    
    // Show error notifications
    throwOnError: false,
  },
  
  mutations: {
    // Retry mutations once
    retry: 1,
    
    // Show error notifications
    throwOnError: false,
  },
};

// ============================================
// Query Client Instance
// ============================================

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

// ============================================
// Query Keys Factory
// ============================================

/**
 * Centralized query key management
 * Prevents key collisions and makes invalidation easier
 */
export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'] as const,
    session: ['auth', 'session'] as const,
  },
  
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    documents: (projectId: string) => 
      [...queryKeys.projects.detail(projectId), 'documents'] as const,
    members: (projectId: string) => 
      [...queryKeys.projects.detail(projectId), 'members'] as const,
  },
  
  // Knowledge Bases
  knowledgeBases: {
    all: ['knowledge-bases'] as const,
    lists: () => [...queryKeys.knowledgeBases.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.knowledgeBases.lists(), filters] as const,
    details: () => [...queryKeys.knowledgeBases.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.knowledgeBases.details(), id] as const,
    documents: (kbId: string) => 
      [...queryKeys.knowledgeBases.detail(kbId), 'documents'] as const,
    global: ['knowledge-bases', 'global'] as const,
  },
  
  // Artifacts
  artifacts: {
    all: ['artifacts'] as const,
    lists: () => [...queryKeys.artifacts.all, 'list'] as const,
    list: (projectId: string) => 
      [...queryKeys.artifacts.lists(), projectId] as const,
    details: () => [...queryKeys.artifacts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.artifacts.details(), id] as const,
    versions: (artifactId: string) => 
      [...queryKeys.artifacts.detail(artifactId), 'versions'] as const,
    version: (versionId: string) => 
      [...queryKeys.artifacts.all, 'version', versionId] as const,
  },
  
  // Workflows
  workflows: {
    all: ['workflows'] as const,
    lists: () => [...queryKeys.workflows.all, 'list'] as const,
    list: (projectId: string) => 
      [...queryKeys.workflows.lists(), projectId] as const,
    details: () => [...queryKeys.workflows.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.workflows.details(), id] as const,
    tasks: (workflowId: string) => 
      [...queryKeys.workflows.detail(workflowId), 'tasks'] as const,
  },
  
  // Agent Tasks
  agentTasks: {
    all: ['agent-tasks'] as const,
    details: () => [...queryKeys.agentTasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.agentTasks.details(), id] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (unreadOnly?: boolean) => 
      [...queryKeys.notifications.lists(), { unreadOnly }] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
  
  // Statistics
  statistics: {
    all: ['statistics'] as const,
    dashboard: ['statistics', 'dashboard'] as const,
    bidStats: (periodStart: string, periodEnd: string) => 
      ['statistics', 'bid-stats', periodStart, periodEnd] as const,
  },
  
  // Agent Configuration
  agentConfig: {
    all: ['agent-config'] as const,
    list: ['agent-config', 'list'] as const,
    detail: (agentType: string) => 
      ['agent-config', 'detail', agentType] as const,
  },
  
  // Integrations
  integrations: {
    all: ['integrations'] as const,
    list: ['integrations', 'list'] as const,
    detail: (type: string) => ['integrations', 'detail', type] as const,
  },
  
  // Roles & Permissions
  roles: {
    all: ['roles'] as const,
    list: ['roles', 'list'] as const,
    detail: (id: string) => ['roles', 'detail', id] as const,
    permissions: (roleId: string) => ['roles', roleId, 'permissions'] as const,
  },
} as const;

// ============================================
// Cache Invalidation Helpers
// ============================================

/**
 * Invalidate all queries for a specific resource
 */
export function invalidateResource(
  resource: Exclude<keyof typeof queryKeys, 'auth'>
) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys[resource].all,
  });
}

/**
 * Invalidate specific query
 */
export function invalidateQuery(queryKey: readonly unknown[]) {
  return queryClient.invalidateQueries({ queryKey });
}

/**
 * Invalidate multiple queries
 */
export function invalidateQueries(queryKeys: readonly unknown[][]) {
  return Promise.all(
    queryKeys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
  );
}

/**
 * Invalidate all project-related queries
 */
export function invalidateProjectQueries(projectId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.projects.detail(projectId) 
    }),
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.projects.documents(projectId) 
    }),
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.projects.members(projectId) 
    }),
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.artifacts.list(projectId) 
    }),
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.workflows.list(projectId) 
    }),
  ]);
}

/**
 * Invalidate all workflow-related queries
 */
export function invalidateWorkflowQueries(workflowId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.workflows.detail(workflowId) 
    }),
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.workflows.tasks(workflowId) 
    }),
  ]);
}

// ============================================
// Optimistic Update Helpers
// ============================================

/**
 * Update query data optimistically
 */
export function setQueryData<T>(
  queryKey: readonly unknown[],
  updater: T | ((old: T | undefined) => T)
) {
  return queryClient.setQueryData(queryKey, updater);
}

/**
 * Get current query data
 */
export function getQueryData<T>(queryKey: readonly unknown[]): T | undefined {
  return queryClient.getQueryData(queryKey);
}

/**
 * Cancel ongoing queries
 */
export function cancelQueries(queryKey: readonly unknown[]) {
  return queryClient.cancelQueries({ queryKey });
}

// ============================================
// SSE Integration Helpers
// ============================================

/**
 * Update cache from SSE event
 * Used by SSE handlers to update TanStack Query cache in real-time
 */
export function updateCacheFromSSE<T>(
  queryKey: readonly unknown[],
  data: Partial<T>
) {
  const currentData = getQueryData<T>(queryKey);
  
  if (currentData) {
    setQueryData(queryKey, {
      ...currentData,
      ...data,
    });
  }
}

/**
 * Append to list cache from SSE event
 */
export function appendToListCache<T>(
  queryKey: readonly unknown[],
  newItem: T
) {
  const currentData = getQueryData<T[]>(queryKey);
  
  if (currentData) {
    setQueryData(queryKey, [...currentData, newItem]);
  }
}

/**
 * Update item in list cache from SSE event
 */
export function updateItemInListCache<T extends { id: string }>(
  queryKey: readonly unknown[],
  itemId: string,
  updates: Partial<T>
) {
  const currentData = getQueryData<T[]>(queryKey);
  
  if (currentData) {
    setQueryData(
      queryKey,
      currentData.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  }
}

/**
 * Remove item from list cache
 */
export function removeItemFromListCache<T extends { id: string }>(
  queryKey: readonly unknown[],
  itemId: string
) {
  const currentData = getQueryData<T[]>(queryKey);
  
  if (currentData) {
    setQueryData(
      queryKey,
      currentData.filter((item) => item.id !== itemId)
    );
  }
}

// ============================================
// Prefetch Helpers
// ============================================

/**
 * Prefetch query data
 */
export function prefetchQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>
) {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
  });
}

/**
 * Prefetch project details and related data
 */
export async function prefetchProjectData(
  projectId: string,
  fetchFn: {
    project: () => Promise<unknown>;
    documents: () => Promise<unknown>;
    members: () => Promise<unknown>;
    artifacts: () => Promise<unknown>;
  }
) {
  return Promise.all([
    prefetchQuery(queryKeys.projects.detail(projectId), fetchFn.project),
    prefetchQuery(queryKeys.projects.documents(projectId), fetchFn.documents),
    prefetchQuery(queryKeys.projects.members(projectId), fetchFn.members),
    prefetchQuery(queryKeys.artifacts.list(projectId), fetchFn.artifacts),
  ]);
}

// ============================================
// Error Handling
// ============================================

/**
 * Global error handler for queries
 */
export function handleQueryError(error: unknown): string {
  if (error instanceof Error) {
    // GraphQL errors
    if ('response' in error && typeof error.response === 'object') {
      const response = error.response as { errors?: Array<{ message: string }> };
      if (response?.errors?.[0]?.message) {
        return response.errors[0].message;
      }
    }
    
    // Network errors
    if (error.message.includes('fetch')) {
      return 'Network error. Please check your connection.';
    }
    
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Check if error is authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('unauthorized') ||
      message.includes('unauthenticated') ||
      message.includes('token') ||
      ('status' in error && (error as { status: number }).status === 401)
    );
  }
  return false;
}