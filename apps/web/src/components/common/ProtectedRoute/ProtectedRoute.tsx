'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/types/user.types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: Array<keyof ReturnType<typeof usePermissions>>;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Protected Route Component
 * 
 * Wraps content that requires specific roles or permissions.
 * Automatically handles redirects and error states.
 * 
 * @example
 * <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
 *   <AdminOnlyContent />
 * </ProtectedRoute>
 * 
 * @example
 * <ProtectedRoute requiredPermissions={['canCreateProjects']}>
 *   <CreateProjectButton />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requiredRoles,
  requiredPermissions,
  fallback,
  redirectTo = '/dashboard',
}: ProtectedRouteProps) {
  const router = useRouter();
  const permissions = usePermissions();
  const { roles, hasRole, isLoading } = permissions;

  // Check if user is authenticated (has roles)
  const isAuthenticated = roles.length > 0;

  // Check role-based access
  const hasRequiredRole = requiredRoles
    ? hasRole(requiredRoles)
    : true;

  // Check permission-based access
  const hasRequiredPermissions = requiredPermissions
    ? requiredPermissions.every(permission => {
        const permissionValue = permissions[permission];
        return typeof permissionValue === 'boolean' ? permissionValue : false;
      })
    : true;

  const hasAccess = hasRequiredRole && hasRequiredPermissions;

  useEffect(() => {
    // Only perform redirects after loading is complete
    if (!isLoading) {
      if (!isAuthenticated) {
        // Redirect to signin if not authenticated
        router.push(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else if (!hasAccess && redirectTo) {
        // Redirect to fallback route if no access
        router.push(redirectTo);
      }
    }
  }, [isLoading, isAuthenticated, hasAccess, redirectTo, router]);

  // Still loading authentication state
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // User doesn't have required access
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription className="mt-2">
            You don&apos;t have permission to access this resource.
            {requiredRoles && (
              <div className="mt-2 text-sm">
                Required roles: {requiredRoles.join(', ')}
              </div>
            )}
          </AlertDescription>
          <div className="mt-4">
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Go to Dashboard
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component version of ProtectedRoute
 */
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}