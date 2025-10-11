/**
 * Amplify Configuration Provider
 * 
 * Initializes AWS Amplify with Cognito configuration on app startup.
 * This component should wrap the root of the application.
 * 
 * @module components/providers/AmplifyConfigProvider
 */

'use client';

import { useEffect } from 'react';
import { configureAmplify, validateAmplifyConfig } from '@/lib/auth/amplify.config';

interface AmplifyConfigProviderProps {
  children: React.ReactNode;
}

export function AmplifyConfigProvider({ children }: AmplifyConfigProviderProps) {
  useEffect(() => {
    console.log('🚀 AmplifyConfigProvider: Initializing...');
    console.log('Environment variables:', {
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      clientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID,
      domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
    });
    
    // Validate configuration
    const isValid = validateAmplifyConfig();
    console.log('✅ Configuration valid:', isValid);
    
    if (!isValid) {
      console.error('❌ Amplify configuration is invalid. Authentication will not work.');
      console.error('Please check your environment variables:');
      console.error('- NEXT_PUBLIC_COGNITO_USER_POOL_ID');
      console.error('- NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID');
      return;
    }

    // Initialize Amplify
    configureAmplify();
    console.log('✅ Amplify configured successfully');
  }, []);

  return <>{children}</>;
}