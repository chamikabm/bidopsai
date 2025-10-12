/**
 * AWS Cognito Authentication Helper Functions
 *
 * This module provides wrapper functions for AWS Amplify Cognito operations
 * with proper error handling and type safety.
 */

import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  signOut as amplifySignOut,
  confirmSignUp as amplifyConfirmSignUp,
  resendSignUpCode as amplifyResendSignUpCode,
  resetPassword as amplifyResetPassword,
  confirmResetPassword as amplifyConfirmResetPassword,
  updatePassword as amplifyUpdatePassword,
  getCurrentUser as amplifyGetCurrentUser,
  fetchAuthSession as amplifyFetchAuthSession,
  type SignInInput,
  type SignInOutput,
  type SignUpInput,
  type SignUpOutput,
  type ConfirmSignUpInput,
  type ResendSignUpCodeInput,
  type ResetPasswordInput,
  type ConfirmResetPasswordInput,
  type UpdatePasswordInput,
  type AuthUser,
  type AuthSession,
} from 'aws-amplify/auth';

// Re-export types for external use
export type {
  SignInInput,
  SignInOutput,
  SignUpInput,
  SignUpOutput,
  ConfirmSignUpInput,
  ResendSignUpCodeInput,
  ResetPasswordInput,
  ConfirmResetPasswordInput,
  UpdatePasswordInput,
  AuthUser,
  AuthSession,
};

/**
 * Sign in error types
 */
export class CognitoError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'CognitoError';
  }
}

/**
 * Sign in with username and password
 * 
 * @param username - User's username or email
 * @param password - User's password
 * @returns Sign in result with next step information
 * @throws {CognitoError} If sign in fails
 */
export async function signIn(
  username: string,
  password: string
): Promise<SignInOutput> {
  try {
    const input: SignInInput = {
      username,
      password,
    };
    
    return await amplifySignIn(input);
  } catch (error) {
    throw handleCognitoError(error, 'Failed to sign in');
  }
}

/**
 * Sign up a new user
 * 
 * @param username - Desired username
 * @param password - Desired password
 * @param email - User's email address
 * @param attributes - Additional user attributes
 * @returns Sign up result with user confirmation details
 * @throws {CognitoError} If sign up fails
 */
export async function signUp(
  username: string,
  password: string,
  email: string,
  attributes?: Record<string, string>
): Promise<SignUpOutput> {
  try {
    const input: SignUpInput = {
      username,
      password,
      options: {
        userAttributes: {
          email,
          ...attributes,
        },
      },
    };
    
    return await amplifySignUp(input);
  } catch (error) {
    throw handleCognitoError(error, 'Failed to sign up');
  }
}

/**
 * Sign out the current user
 * 
 * @param global - If true, sign out from all devices
 * @throws {CognitoError} If sign out fails
 */
export async function signOut(global = false): Promise<void> {
  try {
    await amplifySignOut({ global });
  } catch (error) {
    throw handleCognitoError(error, 'Failed to sign out');
  }
}

/**
 * Confirm user sign up with verification code
 * 
 * @param username - Username to confirm
 * @param confirmationCode - Verification code sent to user's email
 * @throws {CognitoError} If confirmation fails
 */
export async function confirmSignUp(
  username: string,
  confirmationCode: string
): Promise<void> {
  try {
    const input: ConfirmSignUpInput = {
      username,
      confirmationCode,
    };
    
    await amplifyConfirmSignUp(input);
  } catch (error) {
    throw handleCognitoError(error, 'Failed to confirm sign up');
  }
}

/**
 * Resend sign up confirmation code
 * 
 * @param username - Username to resend code for
 * @throws {CognitoError} If resend fails
 */
export async function resendSignUpCode(username: string): Promise<void> {
  try {
    const input: ResendSignUpCodeInput = {
      username,
    };
    
    await amplifyResendSignUpCode(input);
  } catch (error) {
    throw handleCognitoError(error, 'Failed to resend confirmation code');
  }
}

/**
 * Initiate password reset process
 * 
 * @param username - Username to reset password for
 * @throws {CognitoError} If reset initiation fails
 */
export async function resetPassword(username: string): Promise<void> {
  try {
    const input: ResetPasswordInput = {
      username,
    };
    
    await amplifyResetPassword(input);
  } catch (error) {
    throw handleCognitoError(error, 'Failed to initiate password reset');
  }
}

/**
 * Confirm password reset with verification code
 * 
 * @param username - Username to reset password for
 * @param confirmationCode - Verification code sent to user's email
 * @param newPassword - New password
 * @throws {CognitoError} If password reset confirmation fails
 */
export async function confirmResetPassword(
  username: string,
  confirmationCode: string,
  newPassword: string
): Promise<void> {
  try {
    const input: ConfirmResetPasswordInput = {
      username,
      confirmationCode,
      newPassword,
    };
    
    await amplifyConfirmResetPassword(input);
  } catch (error) {
    throw handleCognitoError(error, 'Failed to confirm password reset');
  }
}

/**
 * Change password for authenticated user
 * 
 * @param oldPassword - Current password
 * @param newPassword - New password
 * @throws {CognitoError} If password change fails
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<void> {
  try {
    const input: UpdatePasswordInput = {
      oldPassword,
      newPassword,
    };
    
    await amplifyUpdatePassword(input);
  } catch (error) {
    throw handleCognitoError(error, 'Failed to change password');
  }
}

/**
 * Get current authenticated user
 *
 * @returns Current user or throws if not authenticated
 * @throws {CognitoError} If user is not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser> {
  try {
    return await amplifyGetCurrentUser();
  } catch (error) {
    throw handleCognitoError(error, 'Not authenticated');
  }
}

/**
 * Fetch current auth session
 *
 * @returns Current auth session with tokens
 * @throws {CognitoError} If session cannot be retrieved
 */
export async function fetchAuthSession(): Promise<AuthSession> {
  try {
    return await amplifyFetchAuthSession();
  } catch (error) {
    throw handleCognitoError(error, 'Failed to fetch auth session');
  }
}

/**
 * Update password (alias for changePassword for consistency)
 */
export const updatePassword = changePassword;

/**
 * Sign in with Google OAuth
 * 
 * This will redirect to Google's OAuth consent screen
 */
export async function signInWithGoogle(): Promise<void> {
  try {
    const { signInWithRedirect } = await import('aws-amplify/auth');
    await signInWithRedirect({ provider: 'Google' });
  } catch (error) {
    throw handleCognitoError(error, 'Failed to initiate Google sign in');
  }
}

/**
 * Handle OAuth redirect after successful authentication
 * This should be called on the OAuth callback page
 */
export async function handleOAuthCallback(): Promise<void> {
  try {
    // Amplify automatically handles the OAuth callback
    // We just need to wait for the session to be established
    const { getCurrentUser } = await import('aws-amplify/auth');
    await getCurrentUser();
  } catch (error) {
    throw handleCognitoError(error, 'Failed to handle OAuth callback');
  }
}

/**
 * Convert Amplify errors to CognitoError
 * 
 * @param error - Original error from Amplify
 * @param defaultMessage - Default error message
 * @returns CognitoError instance
 */
function handleCognitoError(error: unknown, defaultMessage: string): CognitoError {
  if (error instanceof Error) {
    // Extract error code if available (Amplify errors often have a name property)
    const code = (error as { name?: string }).name;
    
    // Map common Cognito errors to user-friendly messages
    const userMessage = mapCognitoErrorMessage(code || error.message, defaultMessage);
    
    return new CognitoError(userMessage, code, error);
  }
  
  return new CognitoError(defaultMessage, undefined, error);
}

/**
 * Map Cognito error codes to user-friendly messages
 * 
 * @param errorCode - Cognito error code or message
 * @param defaultMessage - Fallback message
 * @returns User-friendly error message
 */
function mapCognitoErrorMessage(errorCode: string, defaultMessage: string): string {
  const errorMessages: Record<string, string> = {
    UserNotFoundException: 'User not found. Please check your username.',
    NotAuthorizedException: 'Incorrect username or password.',
    UserNotConfirmedException: 'Please verify your email before signing in.',
    PasswordResetRequiredException: 'Password reset is required.',
    InvalidPasswordException: 'Password does not meet requirements.',
    InvalidParameterException: 'Invalid input parameters.',
    UsernameExistsException: 'An account with this username already exists.',
    CodeMismatchException: 'Invalid verification code.',
    ExpiredCodeException: 'Verification code has expired.',
    LimitExceededException: 'Too many attempts. Please try again later.',
    TooManyRequestsException: 'Too many requests. Please try again later.',
    TooManyFailedAttemptsException: 'Too many failed attempts. Please try again later.',
  };
  
  return errorMessages[errorCode] || defaultMessage;
}

/**
 * Validate password strength
 * 
 * @param password - Password to validate
 * @returns Validation result with error messages
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 * 
 * @param email - Email to validate
 * @returns True if email is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username
 * 
 * @param username - Username to validate
 * @returns Validation result with error message
 */
export function validateUsername(username: string): {
  isValid: boolean;
  error?: string;
} {
  if (username.length < 3) {
    return {
      isValid: false,
      error: 'Username must be at least 3 characters long',
    };
  }
  
  if (username.length > 128) {
    return {
      isValid: false,
      error: 'Username must be less than 128 characters',
    };
  }
  
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, and ._- characters',
    };
  }
  
  return { isValid: true };
}