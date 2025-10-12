import { UserRole } from "@/types/user.types";

// Permission mapping for each role
export const ROLE_PERMISSIONS: Record<
  UserRole,
  {
    canAccessProjects: boolean;
    canCreateProjects: boolean;
    canEditProjects: boolean;
    canDeleteProjects: boolean;
    canAccessKnowledgeBases: boolean;
    canCreateKnowledgeBases: boolean;
    canEditGlobalKnowledgeBases: boolean;
    canEditLocalKnowledgeBases: boolean;
    canDeleteKnowledgeBases: boolean;
    canAccessUsers: boolean;
    canCreateUsers: boolean;
    canEditUsers: boolean;
    canDeleteUsers: boolean;
    canAccessSettings: boolean;
    canConfigureAgents: boolean;
    canManageIntegrations: boolean;
    canAccessCommsAgent: boolean;
    canAccessSubmissionAgent: boolean;
  }
> = {
  [UserRole.ADMIN]: {
    canAccessProjects: true,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
    canAccessKnowledgeBases: true,
    canCreateKnowledgeBases: true,
    canEditGlobalKnowledgeBases: true,
    canEditLocalKnowledgeBases: true,
    canDeleteKnowledgeBases: true,
    canAccessUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canAccessSettings: true,
    canConfigureAgents: true,
    canManageIntegrations: true,
    canAccessCommsAgent: true,
    canAccessSubmissionAgent: true,
  },
  [UserRole.DRAFTER]: {
    // Full CRUD on Projects
    canAccessProjects: true,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
    // Read Local Knowledge Bases only
    canAccessKnowledgeBases: true,
    canCreateKnowledgeBases: false,
    canEditGlobalKnowledgeBases: false,
    canEditLocalKnowledgeBases: false,
    canDeleteKnowledgeBases: false,
    // Read Users only
    canAccessUsers: true,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    // Read Settings only
    canAccessSettings: true,
    canConfigureAgents: false,
    canManageIntegrations: false,
    // Up to QA workflow step only
    canAccessCommsAgent: false,
    canAccessSubmissionAgent: false,
  },
  [UserRole.BIDDER]: {
    // Full CRUD on Projects
    canAccessProjects: true,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
    // CRUD Local Knowledge Bases
    canAccessKnowledgeBases: true,
    canCreateKnowledgeBases: true,
    canEditGlobalKnowledgeBases: false,
    canEditLocalKnowledgeBases: true,
    canDeleteKnowledgeBases: true,
    // Read Users only
    canAccessUsers: true,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    // Read Settings only
    canAccessSettings: true,
    canConfigureAgents: false,
    canManageIntegrations: false,
    // All workflow steps
    canAccessCommsAgent: true,
    canAccessSubmissionAgent: true,
  },
  [UserRole.KB_ADMIN]: {
    // Read Projects only
    canAccessProjects: true,
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    // Full CRUD on Knowledge Bases
    canAccessKnowledgeBases: true,
    canCreateKnowledgeBases: true,
    canEditGlobalKnowledgeBases: true,
    canEditLocalKnowledgeBases: true,
    canDeleteKnowledgeBases: true,
    // No access to Users
    canAccessUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    // No access to Settings
    canAccessSettings: false,
    canConfigureAgents: false,
    canManageIntegrations: false,
    // No workflow access
    canAccessCommsAgent: false,
    canAccessSubmissionAgent: false,
  },
  [UserRole.KB_VIEW]: {
    // Read Projects only
    canAccessProjects: true,
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    // Read Knowledge Bases only
    canAccessKnowledgeBases: true,
    canCreateKnowledgeBases: false,
    canEditGlobalKnowledgeBases: false,
    canEditLocalKnowledgeBases: false,
    canDeleteKnowledgeBases: false,
    // No access to Users
    canAccessUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    // No access to Settings
    canAccessSettings: false,
    canConfigureAgents: false,
    canManageIntegrations: false,
    // No workflow access
    canAccessCommsAgent: false,
    canAccessSubmissionAgent: false,
  },
};

// Check if user has specific permission
export function hasPermission(
  roles: UserRole[],
  permission: keyof (typeof ROLE_PERMISSIONS)[UserRole]
): boolean {
  return roles.some((role) => ROLE_PERMISSIONS[role]?.[permission]);
}

// Check if user has any of the specified roles
export function hasRole(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
  return userRoles.some((role) => requiredRoles.includes(role));
}

// Get highest priority role (for display purposes)
export function getPrimaryRole(roles: UserRole[]): UserRole {
  const rolePriority: UserRole[] = [
    UserRole.ADMIN,
    UserRole.BIDDER,
    UserRole.DRAFTER,
    UserRole.KB_ADMIN,
    UserRole.KB_VIEW,
  ];

  for (const role of rolePriority) {
    if (roles.includes(role)) {
      return role;
    }
  }

  return UserRole.KB_VIEW; // Default to most restrictive
}