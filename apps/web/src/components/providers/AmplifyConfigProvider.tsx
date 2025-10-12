/**
 * Amplify Configuration Provider
 * 
 * Initializes AWS Amplify with Cognito configuration on app startup.
 * This component should wrap the root of the application.
 * 
 * @module components/providers/AmplifyConfigProvider
 */

'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { configureAmplify, validateAmplifyConfig } from '@/lib/auth/amplify.config';

const AmplifyConfigContext = createContext(false);

export function useAmplifyConfigured(): boolean {
  return useContext(AmplifyConfigContext);
}

interface AmplifyConfigProviderProps {
  children: React.ReactNode;
}

export function AmplifyConfigProvider({ children }: AmplifyConfigProviderProps) {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    
    // Validate configuration
    const isValid = validateAmplifyConfig();
    
    if (!isValid) {
      console.error('❌ Amplify configuration is invalid. Authentication will not work.');
      console.error('Please check your environment variables:');
      console.error('- NEXT_PUBLIC_COGNITO_USER_POOL_ID');
      console.error('- NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID');
      setIsConfigured(false);
      return;
    }

    // Initialize Amplify
    configureAmplify();
    setIsConfigured(true);
  }, []);

  const contextValue = useMemo(() => isConfigured, [isConfigured]);

  return (
    <AmplifyConfigContext.Provider value={contextValue}>
      {children}
    </AmplifyConfigContext.Provider>
  );
}