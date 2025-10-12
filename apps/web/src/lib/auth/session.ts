/**
 * Session Management Utilities
 * 
 * This module provides functions for managing user sessions,
 * checking authentication status, and refreshing tokens.
 */

import {
  getCurrentUser,
  fetchAuthSession,
  type FetchAuthSessionOptions,
} from 'aws-amplify/auth';
import type { CognitoUser } from '@/types/auth.types';

/**
 * Session information
 */
export interface Session {
  user: CognitoUser;
  tokens: {
    accessToken: string;
    idToken: string;
  };
  expiresAt: number;
}

/**
 * Get the current authenticated user
 * 
 * @returns Current user or null if not authenticated
 */
export async function getAuthenticatedUser(): Promise<CognitoUser | null> {
  try {
    const user = await getCurrentUser();
    
    return {
      userId: user.userId,
      username: user.username,
      signInDetails: user.signInDetails,
    };
  } catch {
    // User is not authenticated
    return null;
  }
}

/**
 * Get the current session with tokens
 * 
 * @param forceRefresh - Force refresh the session tokens
 * @returns Session information or null if not authenticated
 */
export async function getSession(forceRefresh = false): Promise<Session | null> {
  try {
    const user = await getCurrentUser();
    const options: FetchAuthSessionOptions = { forceRefresh };
    const session = await fetchAuthSession(options);
    
    if (!session.tokens) {
      return null;
    }
    
    const cognitoUser: CognitoUser = {
      userId: user.userId,
      username: user.username,
      signInDetails: user.signInDetails,
    };
    
    return {
      user: cognitoUser,
      tokens: {
        accessToken: session.tokens.accessToken.toString(),
        idToken: session.tokens.idToken?.toString() || '',
      },
      expiresAt: session.tokens.accessToken.payload.exp as number,
    };
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 * 
 * @returns True if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if session is expired
 * 
 * @returns True if session is expired
 */
export async function isSessionExpired(): Promise<boolean> {
  try {
    const session = await getSession();
    
    if (!session) {
      return true;
    }
    
    // Check if token expires in less than 5 minutes
    const now = Math.floor(Date.now() / 1000);
    const bufferTime = 5 * 60; // 5 minutes
    
    return session.expiresAt - now < bufferTime;
  } catch {
    return true;
  }
}

/**
 * Refresh the current session
 * 
 * @returns New session or null if refresh fails
 */
export async function refreshSession(): Promise<Session | null> {
  return getSession(true);
}

/**
 * Get access token for API requests
 * 
 * @param forceRefresh - Force refresh the token
 * @returns Access token or null if not authenticated
 */
export async function getAccessToken(forceRefresh = false): Promise<string | null> {
  try {
    const options: FetchAuthSessionOptions = { forceRefresh };
    const session = await fetchAuthSession(options);
    
    return session.tokens?.accessToken.toString() || null;
  } catch {
    return null;
  }
}

/**
 * Get ID token for API requests
 * 
 * @param forceRefresh - Force refresh the token
 * @returns ID token or null if not authenticated
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  try {
    const options: FetchAuthSessionOptions = { forceRefresh };
    const session = await fetchAuthSession(options);
    
    return session.tokens?.idToken?.toString() || null;
  } catch {
    return null;
  }
}

/**
 * Get user attributes from ID token
 * 
 * @returns User attributes or null if not authenticated
 */
export async function getUserAttributes(): Promise<Record<string, unknown> | null> {
  try {
    const session = await fetchAuthSession();
    
    if (!session.tokens?.idToken) {
      return null;
    }
    
    return session.tokens.idToken.payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Get user groups from access token
 * 
 * @returns Array of user groups or empty array
 */
export async function getUserGroups(): Promise<string[]> {
  try {
    const session = await fetchAuthSession();
    
    if (!session.tokens?.accessToken) {
      return [];
    }
    
    const payload = session.tokens.accessToken.payload;
    const groups = payload['cognito:groups'];
    
    if (Array.isArray(groups)) {
      return groups.filter((g): g is string => typeof g === 'string');
    }
    
    return [];
  } catch {
    return [];
  }
}

/**
 * Check if user belongs to a specific group
 * 
 * @param groupName - Name of the group to check
 * @returns True if user belongs to the group
 */
export async function isInGroup(groupName: string): Promise<boolean> {
  const groups = await getUserGroups();
  return groups.includes(groupName);
}

/**
 * Get user email from token
 * 
 * @returns User email or null
 */
export async function getUserEmail(): Promise<string | null> {
  try {
    const attributes = await getUserAttributes();
    return (attributes?.email as string) || null;
  } catch {
    return null;
  }
}

/**
 * Get user's preferred username
 * 
 * @returns Preferred username or null
 */
export async function getPreferredUsername(): Promise<string | null> {
  try {
    const attributes = await getUserAttributes();
    return (attributes?.preferred_username as string) || null;
  } catch {
    return null;
  }
}

/**
 * Check if user's email is verified
 * 
 * @returns True if email is verified
 */
export async function isEmailVerified(): Promise<boolean> {
  try {
    const attributes = await getUserAttributes();
    return attributes?.email_verified === true;
  } catch {
    return false;
  }
}

/**
 * Session event listener type
 */
export type SessionEventListener = (isAuthenticated: boolean) => void;

/**
 * Session event listeners
 */
const sessionListeners = new Set<SessionEventListener>();

/**
 * Add session event listener
 * 
 * @param listener - Callback function
 * @returns Unsubscribe function
 */
export function onSessionChange(listener: SessionEventListener): () => void {
  sessionListeners.add(listener);
  
  return () => {
    sessionListeners.delete(listener);
  };
}

/**
 * Notify all session listeners
 * 
 * @param isAuth - Current authentication status
 */
export function notifySessionChange(isAuth: boolean): void {
  sessionListeners.forEach(listener => {
    try {
      listener(isAuth);
    } catch (error) {
      console.error('Error in session listener:', error);
    }
  });
}

/**
 * Monitor session status
 * Checks session every minute and notifies listeners of changes
 * 
 * @returns Stop monitoring function
 */
export function startSessionMonitoring(): () => void {
  let lastAuthStatus = false;
  
  const checkSession = async () => {
    const currentAuthStatus = await isAuthenticated();
    
    if (currentAuthStatus !== lastAuthStatus) {
      lastAuthStatus = currentAuthStatus;
      notifySessionChange(currentAuthStatus);
    }
  };
  
  // Initial check
  checkSession();
  
  // Check every minute
  const intervalId = setInterval(checkSession, 60 * 1000);
  
  return () => {
    clearInterval(intervalId);
  };
}

/**
 * Get session expiration time in seconds
 * 
 * @returns Seconds until expiration or null if not authenticated
 */
export async function getSessionExpirationTime(): Promise<number | null> {
  try {
    const session = await getSession();
    
    if (!session) {
      return null;
    }
    
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, session.expiresAt - now);
  } catch {
    return null;
  }
}

/**
 * Format session expiration time as human-readable string
 * 
 * @returns Formatted expiration time or null
 */
export async function getFormattedExpirationTime(): Promise<string | null> {
  const seconds = await getSessionExpirationTime();
  
  if (seconds === null) {
    return null;
  }
  
  if (seconds === 0) {
    return 'Expired';
  }
  
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  
  if (minutes > 0) {
    return `${minutes}m`;
  }
  
  return `${seconds}s`;
}