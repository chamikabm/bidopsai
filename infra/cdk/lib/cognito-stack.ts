import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

/**
 * BidOps.AI Cognito User Pool Stack
 * 
 * Creates and configures:
 * - Cognito User Pool with username/email/phone sign-in
 * - User Pool Client for web application
 * - Google OAuth integration
 * - User Groups for RBAC (ADMIN, DRAFTER, BIDDER, KB_ADMIN, KB_VIEW)
 * - Password policies and MFA configuration
 */
export class BidOpsAICognitoStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly userPoolDomain: cognito.UserPoolDomain;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get environment from stack name or default to 'dev'
    const environment = this.node.tryGetContext('environment') || 'dev';
    const domainPrefix = `bidopsai-${environment}`;

    // Create Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'BidOpsAIUserPool', {
      userPoolName: `bidopsai-users-${environment}`,
      
      // Sign-in configuration
      signInAliases: {
        username: true,
        email: true,
        phone: false,
      },
      signInCaseSensitive: false,

      // Self sign-up configuration
      selfSignUpEnabled: true,
      
      // Auto-verification
      autoVerify: {
        email: true,
      },

      // Standard attributes
      standardAttributes: {
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
        profilePicture: {
          required: false,
          mutable: true,
        },
        preferredUsername: {
          required: false,
          mutable: true,
        },
      },

      // Custom attributes
      customAttributes: {
        'preferred_language': new cognito.StringAttribute({ minLen: 2, maxLen: 10, mutable: true }),
        'theme_preference': new cognito.StringAttribute({ minLen: 2, maxLen: 20, mutable: true }),
      },

      // Password policy
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(3),
      },

      // MFA configuration
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },

      // Account recovery
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,

      // Email configuration
      email: cognito.UserPoolEmail.withCognito('noreply@bidopsai.com'),

      // User invitation
      userInvitation: {
        emailSubject: 'Welcome to BidOps.AI',
        emailBody: `Hello {username},<br/><br/>
          You have been invited to join BidOps.AI.<br/>
          Your temporary password is: {####}<br/><br/>
          Please sign in and change your password.<br/><br/>
          Best regards,<br/>
          BidOps.AI Team`,
      },

      // User verification
      userVerification: {
        emailSubject: 'Verify your email for BidOps.AI',
        emailBody: `Thank you for signing up to BidOps.AI!<br/><br/>
          Your verification code is: {####}<br/><br/>
          Please enter this code to complete your registration.`,
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },

      // Deletion protection
      deletionProtection: environment === 'prod',

      // Removal policy
      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,

      // Advanced security
      advancedSecurityMode: cognito.AdvancedSecurityMode.ENFORCED,
    });

    // Create User Pool Domain
    this.userPoolDomain = this.userPool.addDomain('BidOpsAIDomain', {
      cognitoDomain: {
        domainPrefix: domainPrefix,
      },
    });

    // Create User Pool Client
    this.userPoolClient = this.userPool.addClient('BidOpsAIWebClient', {
      userPoolClientName: `bidopsai-web-${environment}`,
      
      // OAuth configuration
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
          cognito.OAuthScope.PHONE,
        ],
        callbackUrls: this.getCallbackUrls(environment),
        logoutUrls: this.getLogoutUrls(environment),
      },

      // Supported identity providers
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        cognito.UserPoolClientIdentityProvider.GOOGLE,
      ],

      // Auth flows
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: false,
        adminUserPassword: false,
      },

      // Prevent user existence errors
      preventUserExistenceErrors: true,

      // Token validity
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),

      // Generate secret
      generateSecret: false,

      // Read/write attributes
      readAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          email: true,
          emailVerified: true,
          givenName: true,
          familyName: true,
          profilePicture: true,
          preferredUsername: true,
        })
        .withCustomAttributes('preferred_language', 'theme_preference'),
      
      writeAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          email: true,
          givenName: true,
          familyName: true,
          profilePicture: true,
          preferredUsername: true,
        })
        .withCustomAttributes('preferred_language', 'theme_preference'),
    });

    // Create User Groups for RBAC
    this.createUserGroups();

    // Stack outputs
    this.createOutputs(environment, domainPrefix);

    // Add tags
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('Project', 'BidOpsAI');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }

  /**
   * Create user groups for role-based access control
   */
  private createUserGroups(): void {
    // ADMIN Group - Full access to everything
    new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'ADMIN',
      description: 'Full access to all features and settings',
      precedence: 1,
    });

    // DRAFTER Group - Can continue process till QA
    new cognito.CfnUserPoolGroup(this, 'DrafterGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'DRAFTER',
      description: 'Can work on drafts up to QA process',
      precedence: 2,
    });

    // BIDDER Group - Full agentic flow + local KBs
    new cognito.CfnUserPoolGroup(this, 'BidderGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'BIDDER',
      description: 'Full workflow access and local knowledge base management',
      precedence: 3,
    });

    // KB_ADMIN Group - Full KB access
    new cognito.CfnUserPoolGroup(this, 'KBAdminGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'KB_ADMIN',
      description: 'Full CRUD access to all knowledge bases',
      precedence: 4,
    });

    // KB_VIEW Group - Read-only KB access
    new cognito.CfnUserPoolGroup(this, 'KBViewGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'KB_VIEW',
      description: 'Read-only access to knowledge bases',
      precedence: 5,
    });
  }

  /**
   * Get callback URLs based on environment
   */
  private getCallbackUrls(environment: string): string[] {
    const urls: string[] = [];

    switch (environment) {
      case 'prod':
        urls.push('https://app.bidopsai.com/callback');
        urls.push('https://bidopsai.com/callback');
        break;
      case 'staging':
        urls.push('https://staging.bidopsai.com/callback');
        break;
      case 'dev':
      default:
        urls.push('http://localhost:3000/callback');
        urls.push('http://localhost:3000/api/auth/callback/cognito');
        break;
    }

    return urls;
  }

  /**
   * Get logout URLs based on environment
   */
  private getLogoutUrls(environment: string): string[] {
    const urls: string[] = [];

    switch (environment) {
      case 'prod':
        urls.push('https://app.bidopsai.com');
        urls.push('https://app.bidopsai.com/signin');
        break;
      case 'staging':
        urls.push('https://staging.bidopsai.com');
        urls.push('https://staging.bidopsai.com/signin');
        break;
      case 'dev':
      default:
        urls.push('http://localhost:3000');
        urls.push('http://localhost:3000/signin');
        break;
    }

    return urls;
  }

  /**
   * Create CloudFormation outputs
   */
  private createOutputs(environment: string, domainPrefix: string): void {
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `BidOpsAI-UserPoolId-${environment}`,
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
      exportName: `BidOpsAI-UserPoolArn-${environment}`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `BidOpsAI-UserPoolClientId-${environment}`,
    });

    new cdk.CfnOutput(this, 'UserPoolDomain', {
      value: `${domainPrefix}.auth.${this.region}.amazoncognito.com`,
      description: 'Cognito User Pool Domain',
      exportName: `BidOpsAI-UserPoolDomain-${environment}`,
    });

    new cdk.CfnOutput(this, 'CognitoRegion', {
      value: this.region,
      description: 'AWS Region for Cognito',
      exportName: `BidOpsAI-CognitoRegion-${environment}`,
    });
  }
}