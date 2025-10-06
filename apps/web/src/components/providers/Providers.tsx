'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { AuthProvider } from './AuthProvider';
import { ThemeProvider } from './ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { createQueryClient } from '@/lib/query-client';

/**
 * Providers Component
 * 
 * Wraps the application with all necessary providers:
 * - ErrorBoundary: Global error handling
 * - ThemeProvider: Theme management
 * - AuthProvider: Amplify configuration
 * - QueryClientProvider: TanStack Query for server state with optimized caching
 * - Toaster: Toast notifications
 * - ReactQueryDevtools: Development tools for debugging queries
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            <Toaster />
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
