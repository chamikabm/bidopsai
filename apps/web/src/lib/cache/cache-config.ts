/**
 * Cache Configuration
 * Defines caching strategies for different data types
 */

export const CACHE_TIMES = {
  // Static data that rarely changes
  STATIC: 1000 * 60 * 60 * 24, // 24 hours
  
  // User data
  USER_PROFILE: 1000 * 60 * 15, // 15 minutes
  USER_LIST: 1000 * 60 * 5, // 5 minutes
  
  // Project data
  PROJECT_LIST: 1000 * 60 * 5, // 5 minutes
  PROJECT_DETAILS: 1000 * 60 * 2, // 2 minutes
  PROJECT_WORKFLOW: 1000 * 30, // 30 seconds (real-time)
  
  // Knowledge base data
  KB_LIST: 1000 * 60 * 10, // 10 minutes
  KB_DETAILS: 1000 * 60 * 5, // 5 minutes
  KB_DOCUMENTS: 1000 * 60 * 5, // 5 minutes
  
  // Artifact data
  ARTIFACTS: 1000 * 60 * 2, // 2 minutes
  ARTIFACT_VERSIONS: 1000 * 60 * 5, // 5 minutes
  
  // Dashboard data
  DASHBOARD_STATS: 1000 * 60 * 5, // 5 minutes
  
  // Settings
  AGENT_CONFIG: 1000 * 60 * 30, // 30 minutes
  SYSTEM_SETTINGS: 1000 * 60 * 30, // 30 minutes
} as const;

export const STALE_TIMES = {
  // How long before data is considered stale and refetched in background
  STATIC: 1000 * 60 * 60 * 12, // 12 hours
  USER_PROFILE: 1000 * 60 * 10, // 10 minutes
  USER_LIST: 1000 * 60 * 3, // 3 minutes
  PROJECT_LIST: 1000 * 60 * 3, // 3 minutes
  PROJECT_DETAILS: 1000 * 60, // 1 minute
  PROJECT_WORKFLOW: 1000 * 15, // 15 seconds
  KB_LIST: 1000 * 60 * 5, // 5 minutes
  KB_DETAILS: 1000 * 60 * 3, // 3 minutes
  KB_DOCUMENTS: 1000 * 60 * 3, // 3 minutes
  ARTIFACTS: 1000 * 60, // 1 minute
  ARTIFACT_VERSIONS: 1000 * 60 * 3, // 3 minutes
  DASHBOARD_STATS: 1000 * 60 * 3, // 3 minutes
  AGENT_CONFIG: 1000 * 60 * 15, // 15 minutes
  SYSTEM_SETTINGS: 1000 * 60 * 15, // 15 minutes
} as const;

/**
 * Query key factories for consistent cache keys
 */
export const queryKeys = {
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.projects.lists(), { filters }] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    workflow: (id: string) => [...queryKeys.projects.detail(id), 'workflow'] as const,
  },
  
  // Knowledge Bases
  knowledgeBases: {
    all: ['knowledge-bases'] as const,
    lists: () => [...queryKeys.knowledgeBases.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.knowledgeBases.lists(), { filters }] as const,
    details: () => [...queryKeys.knowledgeBases.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.knowledgeBases.details(), id] as const,
    documents: (id: string) => [...queryKeys.knowledgeBases.detail(id), 'documents'] as const,
  },
  
  // Artifacts
  artifacts: {
    all: ['artifacts'] as const,
    lists: () => [...queryKeys.artifacts.all, 'list'] as const,
    list: (projectId: string) => [...queryKeys.artifacts.lists(), { projectId }] as const,
    details: () => [...queryKeys.artifacts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.artifacts.details(), id] as const,
    versions: (id: string) => [...queryKeys.artifacts.detail(id), 'versions'] as const,
  },
  
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    activeProjects: () => [...queryKeys.dashboard.all, 'active-projects'] as const,
  },
  
  // Settings
  settings: {
    all: ['settings'] as const,
    agents: () => [...queryKeys.settings.all, 'agents'] as const,
    system: () => [...queryKeys.settings.all, 'system'] as const,
  },
} as const;

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  // Invalidate all user-related queries
  invalidateUsers: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  },
  
  // Invalidate all project-related queries
  invalidateProjects: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
  },
  
  // Invalidate specific project
  invalidateProject: (queryClient: any, projectId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
  },
  
  // Invalidate all knowledge base queries
  invalidateKnowledgeBases: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeBases.all });
  },
  
  // Invalidate all artifact queries
  invalidateArtifacts: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.artifacts.all });
  },
  
  // Invalidate dashboard
  invalidateDashboard: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  },
};
