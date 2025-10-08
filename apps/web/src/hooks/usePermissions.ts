/**
 * Permissions Hook
 *
 * Provides role-based access control (RBAC) functionality.
 * Checks user roles and permissions for UI filtering and access control.
 */

import { useCurrentUser } from './useAuth';
import { UserRole } from '@/types/user.types';
import { hasPermission, hasRole, getPrimaryRole, ROLE_PERMISSIONS } from '@/utils/permissions';
import type { AuthUser } from 'aws-amplify/auth';

/**
 * Extract user roles from Cognito user attributes
 */
function getUserRoles(user: AuthUser | null | undefined): UserRole[] {
  if (!user) return [];
  
  // Get groups from Cognito user attributes
  // Cognito stores groups in the user's token
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groups = (user as any).signInUserSession?.accessToken?.payload?.['cognito:groups'] || [];
  
  return groups.map((group: string) => group as UserRole);
}

/**
 * Use permissions hook
 *
 * @returns Permission checking functions and user roles
 */
export function usePermissions() {
  const { data: user } = useCurrentUser();
  const roles = getUserRoles(user ?? null);
  const primaryRole = roles.length > 0 ? getPrimaryRole(roles) : null;
  
  return {
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