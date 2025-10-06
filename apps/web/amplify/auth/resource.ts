import { defineAuth, secret } from '@aws-amplify/backend';

/**
 * Define and configure a Cognito User Pool for bidops.ai
 * 
 * This configuration sets up:
 * - Email-based authentication with verification
 * - Google OAuth provider
 * - Custom user attributes for roles
 * - Password policies and MFA options
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Verify your bidops.ai account',
      verificationEmailBody: (createCode) =>
        `Welcome to bidops.ai! Your verification code is: ${createCode()}`,
    },
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['email', 'profile', 'openid'],
      },
      callbackUrls: [
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      ],
      logoutUrls: [
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signout`,
      ],
    },
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
    givenName: {
      required: true,
      mutable: true,
    },
    familyName: {
      required: true,
      mutable: true,
    },
    // Custom attributes for role-based access control
    'custom:role': {
      dataType: 'String',
      mutable: true,
    },
    'custom:permissions': {
      dataType: 'String',
      mutable: true,
    },
  },
  multifactor: {
    mode: 'OPTIONAL',
    sms: true,
    totp: true,
  },
  accountRecovery: 'EMAIL_ONLY',
});
