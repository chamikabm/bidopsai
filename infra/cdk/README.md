# BidOps.AI CDK Infrastructure

AWS CDK infrastructure for BidOps.AI platform. Currently includes Cognito User Pool configuration with future support for additional AWS resources.

## Prerequisites

- Node.js 24+
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed globally: `npm install -g aws-cdk`

## Project Structure

```
infra/cdk/
├── bin/
│   └── bidopsai.ts          # CDK app entry point
├── lib/
│   └── cognito-stack.ts     # Cognito User Pool stack
├── cdk.json                  # CDK configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies
└── README.md                # This file
```

## Installation

```bash
cd infra/cdk
npm install
```

## Available Commands

```bash
# Synthesize CloudFormation template
npm run synth

# Deploy Cognito stack (development)
npm run deploy:cognito

# Deploy Cognito stack (specific environment)
npm run deploy:cognito -- --context environment=staging
npm run deploy:cognito -- --context environment=prod

# View differences before deployment
npm run diff

# Destroy stack (development only)
npm run destroy -- BidOpsAI-Cognito-dev
```

## Deployment Guide

### First-Time Setup

1. **Bootstrap CDK** (one-time per account/region):
   ```bash
   cdk bootstrap aws://ACCOUNT-ID/REGION
   ```

2. **Configure Google OAuth** (Manual Step):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     - Dev: `http://localhost:3000/api/auth/callback/cognito`
     - Staging: `https://staging.bidopsai.com/api/auth/callback/cognito`
     - Prod: `https://app.bidopsai.com/api/auth/callback/cognito`
   - Save Client ID and Client Secret

### Deploy to Development

```bash
# Synthesize and review changes
npm run synth

# Deploy
npm run deploy:cognito
```

### Deploy to Staging/Production

```bash
# Specify environment context
cdk deploy --context environment=staging

# Or use npm script
npm run deploy:cognito -- --context environment=staging
```

## Stack Outputs

After deployment, the stack exports the following outputs:

| Output Name | Description | Example Value |
|-------------|-------------|---------------|
| `UserPoolId` | Cognito User Pool ID | `us-east-1_AbCdEfGhI` |
| `UserPoolArn` | Cognito User Pool ARN | `arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_AbCdEfGhI` |
| `UserPoolClientId` | User Pool Client ID | `1a2b3c4d5e6f7g8h9i0j` |
| `UserPoolDomain` | Cognito hosted UI domain | `bidopsai-dev.auth.us-east-1.amazoncognito.com` |
| `CognitoRegion` | AWS Region | `us-east-1` |

## Configuration

### Environment Contexts

The stack supports multiple environments via CDK context:

- **dev** (default): Local development
- **staging**: Staging environment
- **prod**: Production environment

Set environment using `--context`:

```bash
cdk deploy --context environment=prod
```

### Environment-Specific Settings

#### Development
- Callback URLs: `http://localhost:3000/*`
- Deletion protection: Disabled
- Removal policy: DESTROY
- Domain prefix: `bidopsai-dev`

#### Staging
- Callback URLs: `https://staging.bidopsai.com/*`
- Deletion protection: Disabled
- Removal policy: DESTROY
- Domain prefix: `bidopsai-staging`

#### Production
- Callback URLs: `https://app.bidopsai.com/*`
- Deletion protection: Enabled
- Removal policy: RETAIN
- Domain prefix: `bidopsai-prod`

## User Groups (RBAC)

The Cognito User Pool includes 5 pre-configured groups:

| Group | Precedence | Description |
|-------|------------|-------------|
| `ADMIN` | 1 | Full access to all features |
| `DRAFTER` | 2 | Can work on drafts up to QA process |
| `BIDDER` | 3 | Full workflow access + local KB management |
| `KB_ADMIN` | 4 | Full CRUD access to all knowledge bases |
| `KB_VIEW` | 5 | Read-only access to knowledge bases |

## Password Policy

- Minimum length: 12 characters
- Requires: uppercase, lowercase, digits, symbols
- Temporary password validity: 3 days

## MFA Configuration

- Mode: Optional
- Methods: SMS and TOTP (authenticator app)

## Post-Deployment Steps

### 1. Configure Google OAuth Provider

After stack deployment, configure Google as an identity provider:

```bash
# Get User Pool ID from stack outputs
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name BidOpsAI-Cognito-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text)

# Create Google identity provider
aws cognito-idp create-identity-provider \
  --user-pool-id $USER_POOL_ID \
  --provider-name Google \
  --provider-type Google \
  --provider-details \
    client_id="YOUR_GOOGLE_CLIENT_ID",\
    client_secret="YOUR_GOOGLE_CLIENT_SECRET",\
    authorize_scopes="openid email profile" \
  --attribute-mapping \
    email=email,\
    given_name=given_name,\
    family_name=family_name,\
    picture=picture,\
    username=sub
```

### 2. Update Frontend Environment Variables

Copy the stack outputs to your frontend `.env.local`:

```bash
# In apps/web/.env.local
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<UserPoolId>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<UserPoolClientId>
NEXT_PUBLIC_COGNITO_DOMAIN=<UserPoolDomain>

# For server-side auth
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=<UserPoolId>
COGNITO_CLIENT_ID=<UserPoolClientId>
```

### 3. Create Initial Admin User

```bash
# Create admin user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username admin@bidopsai.com \
  --user-attributes \
    Name=email,Value=admin@bidopsai.com \
    Name=email_verified,Value=true \
    Name=given_name,Value=Admin \
    Name=family_name,Value=User \
  --message-action SUPPRESS

# Add to ADMIN group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username admin@bidopsai.com \
  --group-name ADMIN

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username admin@bidopsai.com \
  --password "YourSecurePassword123!" \
  --permanent
```

## Security Best Practices

1. **Secrets Management**: Never commit AWS credentials or Google OAuth secrets
2. **MFA**: Enable MFA for admin users
3. **Password Rotation**: Enforce regular password changes in production
4. **Advanced Security**: Stack uses AWS Advanced Security Mode (enforced)
5. **Deletion Protection**: Enabled in production to prevent accidental deletion

## Troubleshooting

### CDK Bootstrap Issues

If you see "CDK bootstrap required" error:

```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

### Import Errors

If you see TypeScript import errors:

```bash
cd infra/cdk
npm install
npm run build
```

### Stack Already Exists

If redeploying an existing stack:

```bash
# View changes first
npm run diff

# Deploy with confirmation
cdk deploy --require-approval never
```

### Google OAuth Not Working

1. Verify Google OAuth client configuration
2. Check callback URLs match exactly
3. Ensure identity provider is created in Cognito
4. Verify scopes include `openid email profile`

## Clean Up

### Development Environment

```bash
cdk destroy BidOpsAI-Cognito-dev
```

### Production Environment

⚠️ **Warning**: Production stacks have deletion protection enabled. To destroy:

1. First, disable deletion protection:
   ```bash
   # Manually via AWS Console or update stack with deletionProtection: false
   ```

2. Then destroy:
   ```bash
   cdk destroy BidOpsAI-Cognito-prod
   ```

## Future Stacks

This CDK app will be extended to include:

- **GraphQL API Stack**: AppSync or API Gateway configuration
- **AgentCore Stack**: Bedrock AgentCore deployment
- **ECS Stack**: Container orchestration for backend services
- **Storage Stack**: S3 buckets with lifecycle policies
- **Database Stack**: RDS PostgreSQL configuration
- **Monitoring Stack**: CloudWatch dashboards and alarms

## Support

For issues or questions:
- Check AWS CDK documentation: https://docs.aws.amazon.com/cdk/
- Review Cognito documentation: https://docs.aws.amazon.com/cognito/
- Open an issue in the project repository

## License

Copyright © 2025 BidOps.AI. All rights reserved.