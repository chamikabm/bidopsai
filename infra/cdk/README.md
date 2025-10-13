# BidOps.AI CDK Infrastructure

AWS CDK infrastructure for BidOps.AI platform. Includes:
- **Cognito User Pool**: Authentication and authorization with RBAC
- **S3 Buckets**: Document storage and artifact management

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
│   ├── cognito-stack.ts     # Cognito User Pool stack
│   └── s3-stack.ts          # S3 buckets stack
├── cdk.json                 # CDK configuration
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
# Synthesize CloudFormation templates
npm run synth

# Deploy all stacks (development)
cdk deploy --all --context environment=dev

# Deploy specific stacks
npm run deploy:cognito     # Cognito only
npm run deploy:s3          # S3 only

# Deploy to specific environments
cdk deploy --all --context environment=staging
cdk deploy --all --context environment=prod

# View differences before deployment
npm run diff

# Destroy stacks (development only)
cdk destroy BidOpsAI-Cognito-dev
cdk destroy BidOpsAI-S3SourceBucket-dev
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

# Deploy all stacks
cdk deploy --all --context environment=dev

# Or deploy individually
npm run deploy:cognito
npm run deploy:s3
```

### Deploy to Staging/Production

```bash
# Specify environment context
cdk deploy --context environment=staging

# Or use npm script
npm run deploy:cognito -- --context environment=staging
```

## Stack Outputs

After deployment, the stacks export the following outputs:

### Cognito Stack Outputs

| Output Name | Description | Example Value |
|-------------|-------------|---------------|
| `UserPoolId` | Cognito User Pool ID | `us-east-1_AbCdEfGhI` |
| `UserPoolArn` | Cognito User Pool ARN | `arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_AbCdEfGhI` |
| `UserPoolClientId` | User Pool Client ID | `1a2b3c4d5e6f7g8h9i0j` |
| `UserPoolDomain` | Cognito hosted UI domain | `bidopsai-dev.auth.us-east-1.amazoncognito.com` |
| `CognitoRegion` | AWS Region | `us-east-1` |

### S3 Stack Outputs

| Output Name | Description | Example Value |
|-------------|-------------|---------------|
| `ProjectDocumentsBucketName` | Project documents bucket | `bidopsai-project-documents-dev-123456789012` |
| `ProjectDocumentsBucketArn` | Project documents bucket ARN | `arn:aws:s3:::bidopsai-project-documents-dev-123456789012` |
| `ArtifactsBucketName` | Artifacts bucket | `bidopsai-artifacts-dev-123456789012` |
| `ArtifactsBucketArn` | Artifacts bucket ARN | `arn:aws:s3:::bidopsai-artifacts-dev-123456789012` |
| `AccessLogsBucketName` | Access logs bucket | `bidopsai-access-logs-dev-123456789012` |

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

### 2. Update Environment Variables

#### Frontend (.env.local)

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

#### Backend (.env.development)

```bash
# In services/core-api/.env.development
AWS_REGION=us-east-1
AWS_S3_PROJECT_DOCUMENTS_BUCKET=<ProjectDocumentsBucketName>
AWS_S3_ARTIFACTS_BUCKET=<ArtifactsBucketName>
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

## S3 Stack Details

### Buckets

1. **Project Documents Bucket**
   - Purpose: Store raw and processed project documents
   - Path structure: `yyyy/mm/dd/hh/<project_name>_<timestamp>/`
   - Features: Versioning, lifecycle policies, encryption at rest
   - CORS: Enabled for direct browser uploads

2. **Artifacts Bucket**
   - Purpose: Store generated artifacts (Word, PDF, Excel, PPT)
   - Features: Versioning, lifecycle policies, encryption at rest
   - Access: Backend API writes, frontend reads via presigned URLs

3. **Access Logs Bucket**
   - Purpose: Store access logs for compliance and auditing
   - Retention: 90 days (dev), 365 days (staging/prod)
   - No public access

### Lifecycle Policies

#### Development
- Raw documents → Intelligent-Tiering after 30 days
- Processed documents → Glacier after 90 days
- Old versions deleted after 30 days

#### Production
- Raw documents → Intelligent-Tiering after 90 days
- Processed documents → Glacier after 180 days
- Old versions deleted after 90 days

### Security Features

- Block all public access by default
- Server-side encryption with S3-managed keys (SSE-S3)
- Versioning enabled for data protection
- HTTPS-only access via bucket policies
- CORS configured for trusted origins only
- Access logging enabled for audit trails

### Integration with GraphQL API

The S3 stack integrates with the core-api GraphQL service:

1. **Document Upload Flow**:
   - Frontend calls `generatePresignedUrls` mutation
   - API generates signed URLs for direct S3 upload
   - Frontend uploads files directly to S3
   - Frontend calls `createProjectDocument` mutation with S3 locations

2. **Artifact Export Flow**:
   - Supervisor Agent exports artifacts to S3
   - API updates ArtifactVersion records with S3 locations
   - Frontend fetches artifacts via presigned URLs

## Future Stacks

This CDK app will be extended to include:

- **RDS Stack**: PostgreSQL database with automated backups
- **ECS Stack**: Container orchestration for core-api service
- **AgentCore Stack**: Bedrock AgentCore deployment
- **Monitoring Stack**: CloudWatch dashboards and alarms
- **VPC Stack**: Network infrastructure for secure communication

## Support

For issues or questions:
- Check AWS CDK documentation: https://docs.aws.amazon.com/cdk/
- Review Cognito documentation: https://docs.aws.amazon.com/cognito/
- Open an issue in the project repository

## License

Copyright © 2025 BidOps.AI. All rights reserved.