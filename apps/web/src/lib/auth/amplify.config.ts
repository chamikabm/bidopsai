/**
 * AWS Amplify Gen 2 Configuration
 * 
 * Configures Amplify for AWS Cognito authentication with support for:
 * - Username/password authentication
 * - Google OAuth
 * - Multi-factor authentication (MFA)
 * - Custom attributes
 * 
 * @module lib/auth/amplify.config
 */

import { Amplify } from 'aws-amplify';

/**
 * AWS Cognito configuration from environment variables
 */
const cognitoConfig = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
  userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID || '',
  identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID || '',
  oauth: {
    domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '',
    scopes: ['email', 'openid', 'profile'],
    redirectSignIn: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_SIGN_IN || 'http://localhost:3000/dashboard',
    redirectSignOut: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_SIGN_OUT || 'http://localhost:3000/',
    responseType: 'code' as const,
  },
  mfa: {
    status: 'optional' as 'on' | 'off' | 'optional',
    totpEnabled: true,
    smsEnabled: false,
  },
};

/**
 * Amplify configuration object
 */
export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: cognitoConfig.userPoolId,
      userPoolClientId: cognitoConfig.userPoolClientId,
      identityPoolId: cognitoConfig.identityPoolId,
      loginWith: {
        oauth: {
          domain: cognitoConfig.oauth.domain,
          scopes: cognitoConfig.oauth.scopes,
          redirectSignIn: [cognitoConfig.oauth.redirectSignIn],
          redirectSignOut: [cognitoConfig.oauth.redirectSignOut],
          responseType: cognitoConfig.oauth.responseType,
          providers: ['Google' as const],
        },
        email: true,
        username: true,
      },
      mfa: {
        status: cognitoConfig.mfa.status as 'on' | 'off' | 'optional',
        totpEnabled: cognitoConfig.mfa.totpEnabled,
        smsEnabled: cognitoConfig.mfa.smsEnabled,
      },
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
 * Initialize Amplify with configuration
 * Call this once at app startup
 */
export function configureAmplify(): void {
  if (!cognitoConfig.userPoolId || !cognitoConfig.userPoolClientId) {
    console.warn(
      'AWS Cognito configuration is incomplete. Authentication features will not work.'
    );
    return;
  }

  try {
    Amplify.configure(amplifyConfig);
    console.log('Amplify configured successfully');
  } catch (error) {
    console.error('Failed to configure Amplify:', error);
  }
}

/**
 * Validate Amplify configuration
 * 
 * @returns True if configuration is valid
 */
export function validateAmplifyConfig(): boolean {
  const required = [
    cognitoConfig.userPoolId,
    cognitoConfig.userPoolClientId,
  ];

  const isValid = required.every((value) => value && value.length > 0);

  if (!isValid) {
    console.error('Missing required Amplify configuration:');
    if (!cognitoConfig.userPoolId) console.error('- NEXT_PUBLIC_COGNITO_USER_POOL_ID');
    if (!cognitoConfig.userPoolClientId) console.error('- NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID');
  }

  return isValid;
}

/**
 * Get current Amplify configuration
 * 
 * @returns Current configuration object
 */
export function getAmplifyConfig() {
  return amplifyConfig;
}

/**
 * Check if OAuth is configured
 * 
 * @returns True if OAuth domain is configured
 */
export function isOAuthConfigured(): boolean {
  return Boolean(cognitoConfig.oauth.domain);
}

/**
 * Check if MFA is enabled
 * 
 * @returns True if MFA is configured
 */
export function isMFAEnabled(): boolean {
  return cognitoConfig.mfa.status === 'on' || cognitoConfig.mfa.status === 'optional';
}

export default amplifyConfig;