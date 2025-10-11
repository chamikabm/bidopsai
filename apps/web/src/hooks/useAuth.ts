/**
 * Authentication Hook
 *
 * Provides a React-friendly interface to AWS Cognito authentication
 * with TanStack Query integration for optimistic UI updates and caching.
 *
 * Features:
 * - Sign in with username/password
 * - Sign in with Google OAuth
 * - Sign up new users
 * - Sign out
 * - Password reset flow
 * - Email confirmation
 * - MFA setup and verification
 * - Session management with automatic refresh
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchAuthSession,
  updatePassword,
} from '@/lib/auth/cognito';
import { toast } from 'sonner';
import { useAmplifyConfigured } from '@/components/providers/AmplifyConfigProvider';

/**
 * Query Keys for React Query cache management
 */
export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'currentUser'] as const,
  session: () => [...authKeys.all, 'session'] as const,
};

/**
 * Get current authenticated user
 * Returns null if not authenticated
 */
export function useCurrentUser() {
  const isAmplifyConfigured = useAmplifyConfigured();

  return useQuery({
    queryKey: authKeys.currentUser(),
    enabled: isAmplifyConfigured,
    queryFn: async () => {
      try {
        const user = await getCurrentUser();
        return user;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: Infinity, // Keep in cache forever
    retry: false,
    refetchOnMount: 'always', // Always refetch on mount to get fresh auth state
    refetchOnWindowFocus: false, // Don't refetch on every focus
  });
}

/**
 * Get current auth session
 * Returns null if not authenticated
 */
export function useAuthSession() {
  const isAmplifyConfigured = useAmplifyConfigured();

  return useQuery({
    queryKey: authKeys.session(),
    enabled: isAmplifyConfigured,
    queryFn: async () => {
      try {
        const session = await fetchAuthSession();
        return session;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: Infinity, // Keep in cache forever
    retry: false,
    refetchOnMount: 'always', // Always refetch on mount to get fresh auth state
    refetchOnWindowFocus: false, // Don't refetch on every focus
  });
}

/**
 * Sign in mutation
 * Supports username/password and handles MFA challenges
 */
export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      return await signIn(username, password);
    },
    onSuccess: (result) => {
      if (result.isSignedIn) {
        // Invalidate user and session queries to refetch
        queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
        queryClient.invalidateQueries({ queryKey: authKeys.session() });
        
        toast.success('Signed in successfully');
      } else if (result.nextStep) {
        // Handle additional steps (MFA, password reset, etc.)
        const stepMessages: Record<string, string> = {
          CONFIRM_SIGN_UP: 'Please confirm your email address',
          CONFIRM_SIGN_IN_WITH_SMS_CODE: 'Please enter the SMS code',
          CONFIRM_SIGN_IN_WITH_TOTP_CODE: 'Please enter your authenticator code',
          CONTINUE_SIGN_IN_WITH_MFA_SELECTION: 'Please select an MFA method',
          CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED: 'Please set a new password',
          RESET_PASSWORD: 'Password reset required',
          DONE: 'Sign in complete',
        };
        
        const message = stepMessages[result.nextStep.signInStep] || 'Additional step required';
        toast.info(message);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to sign in');
    },
  });
}

/**
 * Sign up mutation
 * Creates a new user account
 */
export function useSignUp() {
  return useMutation({
    mutationFn: async ({
      username,
      password,
      email,
      attributes
    }: {
      username: string;
      password: string;
      email: string;
      attributes?: Record<string, string>;
    }) => {
      return await signUp(username, password, email, attributes);
    },
    onSuccess: (result) => {
      if (result.isSignUpComplete) {
        toast.success('Account created successfully! Please sign in.');
      } else if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
        toast.info('Please check your email for a confirmation code');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create account');
    },
  });
}

/**
 * Confirm sign up mutation
 * Verifies email with confirmation code
 */
export function useConfirmSignUp() {
  return useMutation({
    mutationFn: async ({ username, confirmationCode }: { username: string; confirmationCode: string }) => {
      return await confirmSignUp(username, confirmationCode);
    },
    onSuccess: () => {
      toast.success('Email confirmed! You can now sign in.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to confirm email');
    },
  });
}

/**
 * Resend confirmation code mutation
 */
export function useResendSignUpCode() {
  return useMutation({
    mutationFn: async (username: string) => {
      return await resendSignUpCode(username);
    },
    onSuccess: () => {
      toast.success('Confirmation code sent! Check your email.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to resend code');
    },
  });
}

/**
 * Reset password mutation (step 1)
 * Sends reset code to user's email
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (username: string) => {
      return await resetPassword(username);
    },
    onSuccess: () => {
      toast.success('Password reset code sent to your email');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to initiate password reset');
    },
  });
}

/**
 * Confirm password reset mutation (step 2)
 * Completes password reset with code
 */
export function useConfirmResetPassword() {
  return useMutation({
    mutationFn: async ({
      username,
      confirmationCode,
      newPassword
    }: {
      username: string;
      confirmationCode: string;
      newPassword: string;
    }) => {
      return await confirmResetPassword(username, confirmationCode, newPassword);
    },
    onSuccess: () => {
      toast.success('Password reset successfully! Please sign in.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reset password');
    },
  });
}

/**
 * Update password mutation
 * Changes password for authenticated user
 */
export function useUpdatePassword() {
  return useMutation({
    mutationFn: async ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) => {
      return await updatePassword(oldPassword, newPassword);
    },
    onSuccess: () => {
      toast.success('Password updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update password');
    },
  });
}

/**
 * Sign out mutation
 * Clears all auth state and redirects to sign in
 */
export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await signOut();
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      toast.success('Signed out successfully');
      
      // Redirect to sign in page
      window.location.href = '/signin';
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to sign out');
    },
  });
}

/**
 * Combined auth hook for convenience
 * Provides all auth operations in one place
 */
export function useAuth() {
  const currentUser = useCurrentUser();
  const session = useAuthSession();
  const signInMutation = useSignIn();
  const signUpMutation = useSignUp();
  const signOutMutation = useSignOut();

  return {
    // Current state
    user: currentUser.data,
    session: session.data,
    isAuthenticated: !!currentUser.data && !!session.data,
    isLoading: currentUser.isLoading || session.isLoading,
    
    // Mutations
    signIn: signInMutation.mutate,
    signUp: signUpMutation.mutate,
    signOut: signOutMutation.mutate,
    
    // Mutation states
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    
    // Refetch functions
    refetchUser: currentUser.refetch,
    refetchSession: session.refetch,
  };
}