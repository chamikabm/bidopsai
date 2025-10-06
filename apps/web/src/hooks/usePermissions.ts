'use client';

import { useAuth } from './useAuth';
import { UserPermissions } from '@/types/auth';

/**
 * usePermissions Hook
 * 
 * Provides role-based permission checking for components
 * Used to conditionally render UI elements based on user permissions
 */
export function usePermissions() {
  const { user } = useAuth();

  const permissions: UserPermissions = user?.permissions || {
    canAccessFullWorkflow: false,
    canManageUsers: false,
    canManageGlobalKB: false,
    canManageLocalKB: false,
    canViewKB: false,
    canAccessComms: false,
    canAccessSubmission: false,
    canManageSettings: false,
  };

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    return permissions[permission];
  };

  const hasAnyPermission = (
    requiredPermissions: (keyof UserPermissions)[]
  ): boolean => {
    return requiredPermissions.some((permission) => permissions[permission]);
  };

  const hasAllPermissions = (
    requiredPermissions: (keyof UserPermissions)[]
  ): boolean => {
    return requiredPermissions.every((permission) => permissions[permission]);
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
