/**
 * CognitoService - AWS Cognito User Management
 * 
 * Handles user authentication, registration, and synchronization between Cognito and PostgreSQL.
 * Uses AWS SDK v3 for modern, modular AWS service integration.
 */

import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  ListUsersCommand,
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  GetUserCommand,
  AttributeType,
} from '@aws-sdk/client-cognito-identity-provider';
import { Logger } from '../utils/logger';
import { env } from '../config/env';

interface CognitoUserAttributes {
  email: string;
  firstName: string;
  lastName: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  profileImageUrl?: string;
}

interface CreateCognitoUserInput {
  email: string;
  firstName: string;
  lastName: string;
  temporaryPassword?: string;
  sendWelcomeEmail?: boolean;
}

interface UpdateCognitoUserInput {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
}

interface DecodedToken {
  sub: string; // Cognito User ID
  email: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  exp: number;
  iat: number;
}

export class CognitoService {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;

  constructor(private readonly logger: Logger) {
    this.client = new CognitoIdentityProviderClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.userPoolId = env.AWS_COGNITO_USER_POOL_ID;
    this.clientId = env.AWS_COGNITO_CLIENT_ID;

    this.logger.info('CognitoService initialized', {
      region: env.AWS_REGION,
      userPoolId: this.userPoolId,
    });
  }

  /**
   * Create a new user in Cognito
   */
  async createUser(input: CreateCognitoUserInput): Promise<string> {
    try {
      const { email, firstName, lastName, temporaryPassword, sendWelcomeEmail = true } = input;

      const userAttributes: AttributeType[] = [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
      ];

      const command = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        UserAttributes: userAttributes,
        TemporaryPassword: temporaryPassword,
        MessageAction: sendWelcomeEmail ? 'RESEND' : 'SUPPRESS',
        DesiredDeliveryMediums: ['EMAIL'],
      });

      const response = await this.client.send(command);
      const cognitoUserId = response.User?.Username;

      if (!cognitoUserId) {
        throw new Error('Failed to create Cognito user: No user ID returned');
      }

      this.logger.info('Cognito user created', { cognitoUserId, email });

      // Set permanent password if provided
      if (temporaryPassword) {
        await this.setUserPassword(cognitoUserId, temporaryPassword, true);
      }

      return cognitoUserId;
    } catch (error) {
      this.logger.error('Failed to create Cognito user', { error, email: input.email });
      throw new Error(`Failed to create Cognito user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set user password (permanent or temporary)
   */
  async setUserPassword(username: string, password: string, permanent: boolean = true): Promise<void> {
    try {
      const command = new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        Password: password,
        Permanent: permanent,
      });

      await this.client.send(command);
      this.logger.info('User password set', { username, permanent });
    } catch (error) {
      this.logger.error('Failed to set user password', { error, username });
      throw new Error(`Failed to set user password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user attributes in Cognito
   */
  async updateUserAttributes(username: string, input: UpdateCognitoUserInput): Promise<void> {
    try {
      const userAttributes: AttributeType[] = [];

      if (input.firstName) {
        userAttributes.push({ Name: 'given_name', Value: input.firstName });
      }
      if (input.lastName) {
        userAttributes.push({ Name: 'family_name', Value: input.lastName });
      }
      if (input.phoneNumber) {
        userAttributes.push({ Name: 'phone_number', Value: input.phoneNumber });
      }
      if (input.profileImageUrl) {
        userAttributes.push({ Name: 'picture', Value: input.profileImageUrl });
      }

      if (userAttributes.length === 0) {
        return; // Nothing to update
      }

      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        UserAttributes: userAttributes,
      });

      await this.client.send(command);
      this.logger.info('User attributes updated in Cognito', { username, attributes: userAttributes.length });
    } catch (error) {
      this.logger.error('Failed to update user attributes in Cognito', { error, username });
      throw new Error(`Failed to update Cognito user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user details from Cognito
   */
  async getUser(username: string): Promise<CognitoUserAttributes | null> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      const response = await this.client.send(command);

      if (!response.UserAttributes) {
        return null;
      }

      const attributes = this.parseUserAttributes(response.UserAttributes);
      return attributes;
    } catch (error) {
      this.logger.error('Failed to get user from Cognito', { error, username });
      return null;
    }
  }

  /**
   * Delete user from Cognito
   */
  async deleteUser(username: string): Promise<void> {
    try {
      const command = new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      await this.client.send(command);
      this.logger.info('User deleted from Cognito', { username });
    } catch (error) {
      this.logger.error('Failed to delete user from Cognito', { error, username });
      throw new Error(`Failed to delete Cognito user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disable user account in Cognito
   */
  async disableUser(username: string): Promise<void> {
    try {
      const command = new AdminDisableUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      await this.client.send(command);
      this.logger.info('User disabled in Cognito', { username });
    } catch (error) {
      this.logger.error('Failed to disable user in Cognito', { error, username });
      throw new Error(`Failed to disable Cognito user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enable user account in Cognito
   */
  async enableUser(username: string): Promise<void> {
    try {
      const command = new AdminEnableUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      await this.client.send(command);
      this.logger.info('User enabled in Cognito', { username });
    } catch (error) {
      this.logger.error('Failed to enable user in Cognito', { error, username });
      throw new Error(`Failed to enable Cognito user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Authenticate user with username and password
   */
  async authenticate(email: string, password: string): Promise<AuthResult> {
    try {
      const command = new AdminInitiateAuthCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await this.client.send(command);

      if (!response.AuthenticationResult) {
        throw new Error('Authentication failed: No authentication result');
      }

      const { AccessToken, RefreshToken, IdToken, ExpiresIn } = response.AuthenticationResult;

      if (!AccessToken || !RefreshToken || !IdToken) {
        throw new Error('Authentication failed: Missing tokens');
      }

      this.logger.info('User authenticated successfully', { email });

      return {
        accessToken: AccessToken,
        refreshToken: RefreshToken,
        idToken: IdToken,
        expiresIn: ExpiresIn || 3600,
      };
    } catch (error) {
      this.logger.error('Authentication failed', { error, email });
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const command = new AdminInitiateAuthCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });

      const response = await this.client.send(command);

      if (!response.AuthenticationResult) {
        throw new Error('Token refresh failed: No authentication result');
      }

      const { AccessToken, IdToken, ExpiresIn } = response.AuthenticationResult;

      if (!AccessToken || !IdToken) {
        throw new Error('Token refresh failed: Missing tokens');
      }

      this.logger.info('Token refreshed successfully');

      return {
        accessToken: AccessToken,
        refreshToken: refreshToken, // Refresh token doesn't change
        idToken: IdToken,
        expiresIn: ExpiresIn || 3600,
      };
    } catch (error) {
      this.logger.error('Token refresh failed', { error });
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify and decode JWT token
   */
  async verifyToken(token: string): Promise<DecodedToken> {
    try {
      // In production, use AWS JWT verification libraries
      // For now, basic JWT decoding (NOT SECURE FOR PRODUCTION)
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error('Token expired');
      }

      return payload as DecodedToken;
    } catch (error) {
      this.logger.error('Token verification failed', { error });
      throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all users in Cognito (for admin purposes)
   */
  async listUsers(limit: number = 60): Promise<CognitoUserAttributes[]> {
    try {
      const command = new ListUsersCommand({
        UserPoolId: this.userPoolId,
        Limit: limit,
      });

      const response = await this.client.send(command);

      if (!response.Users) {
        return [];
      }

      return response.Users.map(user => {
        if (!user.Attributes) {
          return {
            email: '',
            firstName: '',
            lastName: '',
          };
        }
        return this.parseUserAttributes(user.Attributes);
      });
    } catch (error) {
      this.logger.error('Failed to list Cognito users', { error });
      throw new Error(`Failed to list Cognito users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse Cognito user attributes into a structured object
   */
  private parseUserAttributes(attributes: AttributeType[]): CognitoUserAttributes {
    const attrs: Record<string, string> = {};
    attributes.forEach(attr => {
      if (attr.Name && attr.Value) {
        attrs[attr.Name] = attr.Value;
      }
    });

    return {
      email: attrs['email'] || '',
      firstName: attrs['given_name'] || '',
      lastName: attrs['family_name'] || '',
      emailVerified: attrs['email_verified'] === 'true',
      phoneNumber: attrs['phone_number'],
      profileImageUrl: attrs['picture'],
    };
  }

  /**
   * Check if user exists in Cognito
   */
  async userExists(email: string): Promise<boolean> {
    try {
      const user = await this.getUser(email);
      return user !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sync user from Cognito to PostgreSQL (called after Cognito events)
   */
  async getUserForSync(cognitoUserId: string): Promise<CognitoUserAttributes | null> {
    return this.getUser(cognitoUserId);
  }
}