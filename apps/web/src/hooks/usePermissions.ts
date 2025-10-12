/**
 * Permissions Hook
 *
 * Provides role-based access control (RBAC) functionality.
 * Checks user roles and permissions for UI filtering and access control.
 */

import { useCurrentUser, useAuthSession } from './useAuth';
import type { AuthSession } from '@/lib/auth/cognito';
import { UserRole } from '@/types/user.types';
import { hasPermission, hasRole, getPrimaryRole, ROLE_PERMISSIONS } from '@/utils/permissions';

/**
 * Extract user roles from Cognito auth session
 */
function getUserRolesFromSession(session: AuthSession | null | undefined): UserRole[] {
  const payload = session?.tokens?.idToken?.payload;
  if (!payload) return [];

  const rawGroups = payload['cognito:groups'];

  if (Array.isArray(rawGroups)) {
    return rawGroups.filter((group): group is UserRole => typeof group === 'string');
  }

  if (typeof rawGroups === 'string') {
    return [rawGroups as UserRole];
  }

  return [];
}

/**
 * Use permissions hook
 *
 * @returns Permission checking functions and user roles
 */
export function usePermissions() {
  const { isLoading: isLoadingUser } = useCurrentUser();
  const { data: session, isLoading: isLoadingSession } = useAuthSession();
  const roles = getUserRolesFromSession(session);
  const primaryRole = roles.length > 0 ? getPrimaryRole(roles) : null;
  
  // Loading state - true if either query is still loading
  const isLoading = isLoadingUser || isLoadingSession;
  
  return {
    // Loading state
    isLoading,
    
    // Current user roles
    roles,
    primaryRole,
    
    // Role checks
    isAdmin: roles.includes(UserRole.ADMIN),
    isDrafter: roles.includes(UserRole.DRAFTER),
    isBidder: roles.includes(UserRole.BIDDER),
    isKBAdmin: roles.includes(UserRole.KB_ADMIN),
    isKBView: roles.includes(UserRole.KB_VIEW),
    
    // Permission checks (using actual permission names from ROLE_PERMISSIONS)
    canAccessProjects: hasPermission(roles, 'canAccessProjects'),
    canCreateProjects: hasPermission(roles, 'canCreateProjects'),
    canEditProjects: hasPermission(roles, 'canEditProjects'),
    canDeleteProjects: hasPermission(roles, 'canDeleteProjects'),
    
    canAccessKnowledgeBases: hasPermission(roles, 'canAccessKnowledgeBases'),
    canCreateKnowledgeBases: hasPermission(roles, 'canCreateKnowledgeBases'),
    canEditGlobalKnowledgeBases: hasPermission(roles, 'canEditGlobalKnowledgeBases'),
    canEditLocalKnowledgeBases: hasPermission(roles, 'canEditLocalKnowledgeBases'),
    canDeleteKnowledgeBases: hasPermission(roles, 'canDeleteKnowledgeBases'),
    
    canAccessUsers: hasPermission(roles, 'canAccessUsers'),
    canCreateUsers: hasPermission(roles, 'canCreateUsers'),
    canEditUsers: hasPermission(roles, 'canEditUsers'),
    canDeleteUsers: hasPermission(roles, 'canDeleteUsers'),
    
    canAccessSettings: hasPermission(roles, 'canAccessSettings'),
    canConfigureAgents: hasPermission(roles, 'canConfigureAgents'),
    canManageIntegrations: hasPermission(roles, 'canManageIntegrations'),
    
    canAccessCommsAgent: hasPermission(roles, 'canAccessCommsAgent'),
    canAccessSubmissionAgent: hasPermission(roles, 'canAccessSubmissionAgent'),
    
    // Generic helpers
    hasPermission: (permission: keyof typeof ROLE_PERMISSIONS[UserRole]) =>
      hasPermission(roles, permission),
    
    hasRole: (requiredRoles: UserRole[]) =>
      hasRole(roles, requiredRoles),
  };
}