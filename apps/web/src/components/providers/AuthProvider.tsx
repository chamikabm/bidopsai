'use client';

import { useEffect } from 'react';
import { configureAmplify } from '@/lib/auth/amplify-config';

/**
 * AuthProvider Component
 * 
 * Initializes Amplify configuration for the application
 * Should be placed at the root of the app
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    configureAmplify();
  }, []);

  return <>{children}</>;
}
