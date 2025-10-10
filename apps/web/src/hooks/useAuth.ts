'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCurrentUser,
  fetchAuthSession,
  signOut as amplifySignOut,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { CognitoUser, UserRole, getPermissionsForRole } from '@/types/auth';

/**
 * useAuth Hook
 * 
 * Provides authentication state and methods for the application
 * Handles user session, sign out, and role-based permissions
 */
export function useAuth() {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [currentUser, session] = await Promise.all([
        getCurrentUser(),
        fetchAuthSession(),
      ]);

      if (!session.tokens) {
        setUser(null);
        return;
      }

      const idToken = session.tokens.idToken;
      const payload = idToken?.payload;

      const role = (payload?.['custom:role'] as UserRole) || UserRole.BIDDER;
      const permissions = getPermissionsForRole(role);

      const cognitoUser: CognitoUser = {
        userId: currentUser.userId,
        username: currentUser.username,
        email: payload?.email as string,
        givenName: payload?.given_name as string,
        familyName: payload?.family_name as string,
        role,
        permissions,
        emailVerified: payload?.email_verified as boolean,
        mfaEnabled: false, // TODO: Get from user attributes
      };

      setUser(cognitoUser);
    } catch (err: any) {
      console.error('Failed to fetch user:', err);
      setError(err.message);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    // Listen for auth events
    const hubListener = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          fetchUser();
          break;
        case 'signedOut':
          setUser(null);
          router.push('/auth');
          break;
        case 'tokenRefresh':
          fetchUser();
          break;
        case 'tokenRefresh_failure':
          setUser(null);
          router.push('/auth');
          break;
      }
    });

    return () => hubListener();
  }, [router]);

  const signOut = async () => {
    try {
      await amplifySignOut();
      setUser(null);
      router.push('/auth');
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    signOut,
    refreshUser,
  };
}
