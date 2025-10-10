/**
 * Authentication types for bidops.ai
 * 
 * Defines user roles, permissions, and authentication state
 */

export enum UserRole {
  ADMIN = 'Admin',
  DRAFTER = 'Drafter',
  BIDDER = 'Bidder',
  KB_ADMIN = 'KB-Admin',
  KB_VIEW = 'KB-View',
}

export interface UserPermissions {
  canAccessFullWorkflow: boolean;
  canManageUsers: boolean;
  canManageGlobalKB: boolean;
  canManageLocalKB: boolean;
  canViewKB: boolean;
  canAccessComms: boolean;
  canAccessSubmission: boolean;
  canManageSettings: boolean;
}

export interface CognitoUser {
  userId: string;
  username: string;
  email: string;
  givenName: string;
  familyName: string;
  role: UserRole;
  permissions: UserPermissions;
  emailVerified: boolean;
  mfaEnabled: boolean;
}

export interface AuthState {
  user: CognitoUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SignUpFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  givenName: string;
  familyName: string;
}

export interface SignInFormData {
  username: string;
  password: string;
}

export interface ForgotPasswordFormData {
  username: string;
}

export interface ResetPasswordFormData {
  username: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyEmailFormData {
  username: string;
  code: string;
}

/**
 * Get user permissions based on role
 */
export function getPermissionsForRole(role: UserRole): UserPermissions {
  switch (role) {
    case UserRole.ADMIN:
      return {
        canAccessFullWorkflow: true,
        canManageUsers: true,
        canManageGlobalKB: true,
        canManageLocalKB: true,
        canViewKB: true,
        canAccessComms: true,
        canAccessSubmission: true,
        canManageSettings: true,
      };
    case UserRole.BIDDER:
      return {
        canAccessFullWorkflow: true,
        canManageUsers: false,
        canManageGlobalKB: false,
        canManageLocalKB: true,
        canViewKB: true,
        canAccessComms: true,
        canAccessSubmission: true,
        canManageSettings: false,
      };
    case UserRole.DRAFTER:
      return {
        canAccessFullWorkflow: false, // Only through QA
        canManageUsers: false,
        canManageGlobalKB: false,
        canManageLocalKB: false,
        canViewKB: true,
        canAccessComms: false,
        canAccessSubmission: false,
        canManageSettings: false,
      };
    case UserRole.KB_ADMIN:
      return {
        canAccessFullWorkflow: false,
        canManageUsers: false,
        canManageGlobalKB: true,
        canManageLocalKB: true,
        canViewKB: true,
        canAccessComms: false,
        canAccessSubmission: false,
        canManageSettings: false,
      };
    case UserRole.KB_VIEW:
      return {
        canAccessFullWorkflow: false,
        canManageUsers: false,
        canManageGlobalKB: false,
        canManageLocalKB: false,
        canViewKB: true,
        canAccessComms: false,
        canAccessSubmission: false,
        canManageSettings: false,
      };
    default:
      return {
        canAccessFullWorkflow: false,
        canManageUsers: false,
        canManageGlobalKB: false,
        canManageLocalKB: false,
        canViewKB: false,
        canAccessComms: false,
        canAccessSubmission: false,
        canManageSettings: false,
      };
  }
}
