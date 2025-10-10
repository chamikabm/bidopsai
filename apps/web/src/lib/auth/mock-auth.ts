/**
 * Mock Authentication for Testing
 * 
 * REMOVE THIS FILE BEFORE PRODUCTION DEPLOYMENT
 * 
 * This provides a bypass for Cognito authentication during UI testing.
 * Enable by setting NEXT_PUBLIC_MOCK_AUTH=true in .env.local
 */

export const MOCK_AUTH_ENABLED = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

export interface MockAuthResult {
  isSignedIn: boolean;
  nextStep?: {
    signInStep: string;
  };
}

/**
 * Mock sign in - bypasses Cognito
 * Always succeeds with any username/password
 */
export async function mockSignIn(username: string, password: string): Promise<MockAuthResult> {
  console.log('🔧 MOCK AUTH: Bypassing Cognito authentication');
  console.log(`Username: ${username}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Store mock session in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('mockAuthSession', JSON.stringify({
      username,
      timestamp: Date.now(),
      isAuthenticated: true,
    }));
  }
  
  return {
    isSignedIn: true,
  };
}

/**
 * Check if user has mock session
 */
export function hasMockSession(): boolean {
  if (typeof window === 'undefined') return false;
  
  const session = localStorage.getItem('mockAuthSession');
  if (!session) return false;
  
  try {
    const parsed = JSON.parse(session);
    return parsed.isAuthenticated === true;
  } catch {
    return false;
  }
}

/**
 * Clear mock session
 */
export function clearMockSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mockAuthSession');
  }
}