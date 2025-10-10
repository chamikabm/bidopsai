'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { UserPermissions, UserRole } from '@/types/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: (keyof UserPermissions)[];
  requiredRoles?: UserRole[];
  requireAll?: boolean; // If true, user must have ALL permissions/roles. If false, ANY will suffice
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireAll = false,
  fallback,
  redirectTo,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { hasAnyPermission, hasAllPermissions } = usePermissions();

  useEffect(() => {
    if (!isLoading && !user && redirectTo) {
      router.push(redirectTo);
    }
  }, [isLoading, user, redirectTo, router]);

  // Still loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You must be logged in to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const userRoles = user.permissions ? Object.keys(user.permissions) : [];
    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(role)
    );

    if (!hasRequiredRole) {
      if (fallback) {
        return <>{fallback}</>;
      }
      return <AccessDenied />;
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      if (fallback) {
        return <>{fallback}</>;
      }
      return <AccessDenied />;
    }
  }

  // User has access
  return <>{children}</>;
}

function AccessDenied() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md space-y-4">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don&apos;t have permission to access this page. Please contact your
            administrator if you believe this is an error.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
}
