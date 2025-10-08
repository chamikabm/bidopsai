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
    canAccessProjects: true,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: false,
    canAccessKnowledgeBases: true,
    canCreateKnowledgeBases: false,
    canEditGlobalKnowledgeBases: false,
    canEditLocalKnowledgeBases: false,
    canDeleteKnowledgeBases: false,
    canAccessUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canAccessSettings: false,
    canConfigureAgents: false,
    canManageIntegrations: false,
    canAccessCommsAgent: false, // Can't go beyond QA
    canAccessSubmissionAgent: false,
  },
  [UserRole.BIDDER]: {
    canAccessProjects: true,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: false,
    canAccessKnowledgeBases: true,
    canCreateKnowledgeBases: true,
    canEditGlobalKnowledgeBases: false,
    canEditLocalKnowledgeBases: true,
    canDeleteKnowledgeBases: true,
    canAccessUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canAccessSettings: false,
    canConfigureAgents: false,
    canManageIntegrations: false,
    canAccessCommsAgent: true, // Has access to full agentic flow
    canAccessSubmissionAgent: true,
  },
  [UserRole.KB_ADMIN]: {
    canAccessProjects: true,
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canAccessKnowledgeBases: true,
    canCreateKnowledgeBases: true,
    canEditGlobalKnowledgeBases: true,
    canEditLocalKnowledgeBases: true,
    canDeleteKnowledgeBases: true,
    canAccessUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canAccessSettings: false,
    canConfigureAgents: false,
    canManageIntegrations: false,
    canAccessCommsAgent: false,
    canAccessSubmissionAgent: false,
  },
  [UserRole.KB_VIEW]: {
    canAccessProjects: true,
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canAccessKnowledgeBases: true,
    canCreateKnowledgeBases: false,
    canEditGlobalKnowledgeBases: false,
    canEditLocalKnowledgeBases: false,
    canDeleteKnowledgeBases: false,
    canAccessUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canAccessSettings: false,
    canConfigureAgents: false,
    canManageIntegrations: false,
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