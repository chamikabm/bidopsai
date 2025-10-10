/**
 * Permission checking utilities for role-based access control
 */

import { UserRole, UserPermissions, getPermissionsForRole } from '@/types/auth';

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  userRoles: string[],
  permission: keyof UserPermissions
): boolean {
  // Aggregate permissions from all roles
  const aggregatedPermissions = userRoles.reduce((acc, roleName) => {
    const rolePermissions = getPermissionsForRole(roleName as UserRole);
    Object.entries(rolePermissions).forEach(([key, value]) => {
      if (value) {
        acc[key as keyof UserPermissions] = true;
      }
    });
    return acc;
  }, {} as UserPermissions);

  return aggregatedPermissions[permission] || false;
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  userRoles: string[],
  permissions: (keyof UserPermissions)[]
): boolean {
  return permissions.some((permission) => hasPermission(userRoles, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  userRoles: string[],
  permissions: (keyof UserPermissions)[]
): boolean {
  return permissions.every((permission) => hasPermission(userRoles, permission));
}

/**
 * Check if a user has a specific role
 */
export function hasRole(userRoles: string[], role: UserRole): boolean {
  return userRoles.includes(role);
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(userRoles: string[], roles: UserRole[]): boolean {
  return roles.some((role) => userRoles.includes(role));
}

/**
 * Check if a user has all of the specified roles
 */
export function hasAllRoles(userRoles: string[], roles: UserRole[]): boolean {
  return roles.every((role) => userRoles.includes(role));
}

/**
 * Get all permissions for a user based on their roles
 */
export function getUserPermissions(userRoles: string[]): UserPermissions {
  return userRoles.reduce((acc, roleName) => {
    const rolePermissions = getPermissionsForRole(roleName as UserRole);
    Object.entries(rolePermissions).forEach(([key, value]) => {
      if (value) {
        acc[key as keyof UserPermissions] = true;
      }
    });
    return acc;
  }, {} as UserPermissions);
}

/**
 * Check if a user can access a specific route
 */
export function canAccessRoute(
  userRoles: string[],
  route: string
): boolean {
  const routePermissions: Record<string, (keyof UserPermissions)[]> = {
    '/dashboard': [],
    '/projects': ['canAccessFullWorkflow'],
    '/projects/new': ['canAccessFullWorkflow'],
    '/knowledge-bases': ['canViewKB'],
    '/knowledge-bases/new': ['canManageGlobalKB', 'canManageLocalKB'],
    '/users': ['canManageUsers'],
    '/settings': ['canManageSettings'],
    '/settings/agents': ['canManageSettings'],
    '/settings/integrations': ['canManageSettings'],
    '/settings/system': ['canManageSettings'],
  };

  const requiredPermissions = routePermissions[route];
  
  // If no specific permissions required, allow access
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  // Check if user has any of the required permissions
  return hasAnyPermission(userRoles, requiredPermissions);
}

/**
 * Filter menu items based on user permissions
 */
export interface MenuItem {
  label: string;
  href: string;
  icon?: React.ComponentType;
  requiredPermissions?: (keyof UserPermissions)[];
  requiredRoles?: UserRole[];
  children?: MenuItem[];
}

export function filterMenuItems(
  menuItems: MenuItem[],
  userRoles: string[]
): MenuItem[] {
  return menuItems.filter((item) => {
    // Check role requirements
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      if (!hasAnyRole(userRoles, item.requiredRoles)) {
        return false;
      }
    }

    // Check permission requirements
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      if (!hasAnyPermission(userRoles, item.requiredPermissions)) {
        return false;
      }
    }

    // Filter children recursively
    if (item.children) {
      item.children = filterMenuItems(item.children, userRoles);
    }

    return true;
  });
}
