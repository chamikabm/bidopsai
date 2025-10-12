// Authentication types based on AWS Cognito
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  emailVerified: boolean;
  cognitoUserId: string;
}

export interface CognitoUser {
  userId: string;
  username: string;
  signInDetails?: {
    loginId?: string;
    authFlowType?: string;
  };
}

export interface SignInCredentials {
  username: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface GoogleOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
}