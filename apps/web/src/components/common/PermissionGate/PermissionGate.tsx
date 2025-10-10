'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { UserPermissions, UserRole } from '@/types/auth';
import { useAuth } from '@/hooks/useAuth';

interface PermissionGateProps {
  children: React.ReactNode;
  requiredPermissions?: (keyof UserPermissions)[];
  requiredRoles?: UserRole[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

/**
 * PermissionGate Component
 * 
 * Conditionally renders children based on user permissions or roles.
 * Use this for component-level access control within pages.
 * 
 * @example
 * <PermissionGate requiredPermissions={['canManageUsers']}>
 *   <Button>Delete User</Button>
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireAll = false,
  fallback = null,
}: PermissionGateProps) {
  const { user } = useAuth();
  const { hasAnyPermission, hasAllPermissions } = usePermissions();

  // If no user, don't render
  if (!user) {
    return <>{fallback}</>;
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const userRoles = user.permissions ? Object.keys(user.permissions) : [];
    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(role)
    );

    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  // User has access
  return <>{children}</>;
}
