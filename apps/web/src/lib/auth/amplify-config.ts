import { Amplify, type ResourcesConfig } from 'aws-amplify';

/**
 * Amplify configuration for bidops.ai
 * 
 * This configuration connects the frontend to AWS Cognito
 * and other AWS services through Amplify Gen 2
 */
export const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
      identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID || '',
      loginWith: {
        oauth: {
          domain: process.env.NEXT_PUBLIC_OAUTH_DOMAIN || '',
          scopes: ['email', 'profile', 'openid'],
          redirectSignIn: [
            process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
          ],
          redirectSignOut: [
            process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signout`,
          ],
          responseType: 'code' as const,
        },
        email: true,
      },
      signUpVerificationMethod: 'code' as const,
      userAttributes: {
        email: {
          required: true,
        },
        given_name: {
          required: true,
        },
        family_name: {
          required: true,
        },
      },
      allowGuestAccess: false,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
};

/**
 * Configure Amplify with the settings above
 * This should be called once at app initialization
 */
export function configureAmplify() {
  Amplify.configure(amplifyConfig, { ssr: true });
}
