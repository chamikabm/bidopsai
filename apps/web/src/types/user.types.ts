// User roles based on requirements
export enum UserRole {
  ADMIN = "ADMIN",
  DRAFTER = "DRAFTER",
  BIDDER = "BIDDER",
  KB_ADMIN = "KB_ADMIN",
  KB_VIEW = "KB_VIEW",
}

// User entity
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  preferredLanguage?: string;
  themePreference?: string;
  emailVerified: boolean;
  cognitoUserId: string;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

// Role entity
export interface Role {
  id: string;
  name: UserRole;
  description?: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

// Permission entity
export interface Permission {
  id: string;
  roleId: string;
  resource: string;
  action: string;
  createdAt: string;
}

// User role assignment
export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy: string;
}