/**
 * Permissions Hook
 *
 * Provides role-based access control (RBAC) functionality.
 * Checks user roles and permissions for UI filtering and access control.
 */

import { useCurrentUser, useAuthSession } from './useAuth';
import { UserRole } from '@/types/user.types';
import { hasPermission, hasRole, getPrimaryRole, ROLE_PERMISSIONS } from '@/utils/permissions';

/**
 * Extract user roles from Cognito auth session
 */
function getUserRolesFromSession(session: any): UserRole[] {
  if (!session?.tokens?.idToken?.payload) return [];
  
  // Get groups from ID token payload
  // Cognito stores groups in cognito:groups claim
  const groups = session.tokens.idToken.payload['cognito:groups'] || [];
  
  console.log('📋 User groups from token:', groups);
  
  return groups.map((group: string) => group as UserRole);
}

/**
 * Use permissions hook
 *
 * @returns Permission checking functions and user roles
 */
export function usePermissions() {
  const { data: user } = useCurrentUser();
  const { data: session } = useAuthSession();
  const roles = getUserRolesFromSession(session);
  const primaryRole = roles.length > 0 ? getPrimaryRole(roles) : null;
  
  console.log('🔐 usePermissions:', { user: user?.username, roles, primaryRole });
  
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