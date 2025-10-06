import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { STALE_TIMES, CACHE_TIMES } from './cache';

const queryConfig: DefaultOptions = {
  queries: {
    // Default stale time: 5 minutes
    staleTime: STALE_TIMES.PROJECT_LIST,
    // Default cache time: 10 minutes
    gcTime: CACHE_TIMES.PROJECT_LIST * 2,
    // Retry failed requests 3 times with exponential backoff
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Refetch on window focus for real-time data
    refetchOnWindowFocus: (query) => {
      // Only refetch workflow data on focus, not everything
      return query.queryKey.includes('workflow');
    },
    // Don't refetch on mount if data is fresh
    refetchOnMount: false,
    // Refetch on reconnect
    refetchOnReconnect: true,
    // Network mode
    networkMode: 'online',
  },
  mutations: {
    // Retry mutations once
    retry: 1,
    retryDelay: 1000,
    // Network mode
    networkMode: 'online',
  },
};

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: queryConfig,
  });
}

// Singleton instance for client-side
let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new query client
    return createQueryClient();
  } else {
    // Browser: create query client if it doesn't exist
    if (!browserQueryClient) {
      browserQueryClient = createQueryClient();
    }
    return browserQueryClient;
  }
}
