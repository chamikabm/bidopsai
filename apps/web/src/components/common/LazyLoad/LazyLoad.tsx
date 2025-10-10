/**
 * Lazy Load Wrapper Component
 * Provides loading states for dynamically imported components
 */

'use client';

import { Suspense, type ComponentType, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
  minHeight?: string;
}

/**
 * Wrapper for lazy-loaded components with loading state
 */
export function LazyLoad({ children, fallback, minHeight = '200px' }: LazyLoadProps) {
  const defaultFallback = (
    <div style={{ minHeight }} className="w-full space-y-4 p-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}

/**
 * Create a lazy-loaded component with custom fallback
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: P) {
    return (
      <LazyLoad fallback={fallback}>
        <LazyComponent {...props} />
      </LazyLoad>
    );
  };
}

// Re-export lazy from React for convenience
export { lazy } from 'react';
