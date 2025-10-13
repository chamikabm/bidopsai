# S3 Stack Deployment Guide

This guide provides step-by-step instructions for deploying the S3 infrastructure stack for BidOps.AI.

## Prerequisites

Before deploying the S3 stack, ensure you have:

1. ✅ AWS CLI configured with appropriate credentials
2. ✅ AWS CDK CLI installed (`npm install -g aws-cdk`)
3. ✅ CDK dependencies installed (`cd infra/cdk && npm install`)
4. ✅ AWS account bootstrapped for CDK (see [Bootstrap Section](#bootstrap-cdk))

## Quick Start (Development)

```bash
# From project root
cd infra/cdk

# Install dependencies
npm install

# Build TypeScript
npm run build

# Synthesize CloudFormation templates
npm run synth

# Deploy S3 stack to development
npm run deploy:s3

# Or use make command from root
make cdk-deploy-s3-dev
```

## Bootstrap CDK

If this is your first time using CDK in this AWS account/region:

```bash
# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Bootstrap CDK
cdk bootstrap aws://$AWS_ACCOUNT_ID/us-east-1

# Or use make command
make cdk-bootstrap
```

## Deployment Steps

### 1. Review Synthesized Templates

Before deploying, review the CloudFormation templates that will be created:

```bash
npm run synth
```

This generates templates in `cdk.out/` directory. Review:
- `BidOpsAI-S3SourceBucket-dev.template.json` - CloudFormation template
- Stack outputs and resources

### 2. View Changes (Diff)

To see what will change in your AWS account:

```bash
npm run diff
```

### 3. Deploy to Development

Deploy the S3 stack to your development environment:

```bash
# Using npm
npm run deploy:s3

# Or using CDK directly
cdk deploy BidOpsAI-S3SourceBucket-dev --context environment=dev

# Or using make from project root
make cdk-deploy-s3-dev
```

### 4. Verify Deployment

Check that the stack deployed successfully:

```bash
# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name BidOpsAI-S3SourceBucket-dev \
  --query 'Stacks[0].Outputs' \
  --output table

# Or use make command
make cdk-outputs-s3 CDK_ENV=dev
```

### 5. Update Backend Environment Variables

Copy the bucket names from stack outputs to your backend `.env.development`:

```bash
# In services/core-api/.env.development
AWS_REGION=us-east-1
AWS_S3_PROJECT_DOCUMENTS_BUCKET=bidopsai-project-documents-dev-123456789012
AWS_S3_ARTIFACTS_BUCKET=bidopsai-artifacts-dev-123456789012
```

### 6. Restart Core API

If running in Docker:

```bash
# From project root
podman restart bidopsai-core-api-dev

# Or restart entire stack
podman-compose -f infra/docker/docker-compose.dev.yml restart
```

## Deploy to Other Environments

### Staging

```bash
cdk deploy BidOpsAI-S3SourceBucket-staging --context environment=staging

# Or use make
make cdk-deploy-s3-staging
```

### Production

```bash
# Production has extra safety checks
cdk deploy BidOpsAI-S3SourceBucket-prod --context environment=prod

# Or use make (includes 5-second confirmation delay)
make cdk-deploy-s3-prod
```

## Stack Outputs

After deployment, you'll get these outputs:

| Output | Description | Environment Variable |
|--------|-------------|---------------------|
| `ProjectDocumentsBucketName` | Bucket for project documents | `AWS_S3_PROJECT_DOCUMENTS_BUCKET` |
| `ProjectDocumentsBucketArn` | ARN of project documents bucket | - |
| `ArtifactsBucketName` | Bucket for generated artifacts | `AWS_S3_ARTIFACTS_BUCKET` |
| `ArtifactsBucketArn` | ARN of artifacts bucket | - |
| `AccessLogsBucketName` | Bucket for access logs | - |

## Save Outputs to File

```bash
# Save all outputs to JSON file
cdk deploy BidOpsAI-S3SourceBucket-dev --outputs-file s3-outputs.json

# Extract specific values
cat s3-outputs.json | jq -r '.["BidOpsAI-S3SourceBucket-dev"].ProjectDocumentsBucketName'
```

## Testing S3 Integration

### 1. Test Presigned URL Generation

```graphql
mutation {
  generatePresignedUrls(
    projectId: "your-project-id"
    files: [
      { fileName: "test.pdf", contentType: "application/pdf" }
    ]
  ) {
    url
    fileName
    expiresAt
  }
}
```

### 2. Upload Test File

```bash
# Get presigned URL from above mutation
PRESIGNED_URL="<url-from-mutation>"

# Upload file
curl -X PUT \
  -H "Content-Type: application/pdf" \
  --upload-file test.pdf \
  "$PRESIGNED_URL"
```

### 3. Verify Upload

```bash
# List objects in bucket
aws s3 ls s3://bidopsai-project-documents-dev-123456789012/ --recursive
```

## Bucket Structure

### Project Documents Bucket

```
bidopsai-project-documents-dev-{account-id}/
├── 2025/
│   └── 01/
│       └── 12/
│           └── 15/
│               └── my-project_1736696400/
│                   ├── raw/
│                   │   ├── rfp-document.pdf
│                   │   └── requirements.docx
│                   └── processed/
│                       ├── rfp-document-processed.json
│                       └── requirements-processed.json
```

### Artifacts Bucket

```
bidopsai-artifacts-dev-{account-id}/
├── projects/
│   └── {project-id}/
│       └── artifacts/
│           ├── executive-summary-v1.docx
│           ├── technical-proposal-v2.pdf
│           └── pricing-spreadsheet-v1.xlsx
```

## Lifecycle Policies

### Development Environment

- **Raw documents**: 
  - Move to Intelligent-Tiering after 30 days
  - Noncurrent versions deleted after 30 days

- **Processed documents**:
  - Move to Glacier after 90 days
  - Noncurrent versions deleted after 30 days

### Production Environment

- **Raw documents**:
  - Move to Intelligent-Tiering after 90 days
  - Noncurrent versions deleted after 90 days

- **Processed documents**:
  - Move to Glacier after 180 days
  - Noncurrent versions deleted after 90 days

## Security Features

### Enabled by Default

- ✅ Block all public access
- ✅ Server-side encryption (SSE-S3)
- ✅ Versioning enabled
- ✅ HTTPS-only access
- ✅ Access logging
- ✅ CORS for trusted origins

### CORS Configuration

Development environment allows:
- Origin: `http://localhost:3000`
- Methods: `GET`, `PUT`, `POST`, `DELETE`, `HEAD`
- Headers: `*`
- Max age: 3000 seconds

## Troubleshooting

### Error: Stack Already Exists

```bash
# View current stack state
aws cloudformation describe-stacks --stack-name BidOpsAI-S3SourceBucket-dev

# Update existing stack
cdk deploy BidOpsAI-S3SourceBucket-dev --context environment=dev
```

### Error: Bucket Name Already Exists

S3 bucket names are globally unique. If deployment fails with bucket name conflict:

1. Check if bucket exists in your account:
   ```bash
   aws s3 ls | grep bidopsai
   ```

2. If it exists but isn't managed by CDK, either:
   - Delete the existing bucket (if safe)
   - Import it into CDK stack

### Error: Access Denied

Ensure your AWS credentials have these permissions:
- `s3:CreateBucket`
- `s3:PutBucketPolicy`
- `s3:PutBucketCORS`
- `s3:PutBucketVersioning`
- `s3:PutEncryptionConfiguration`
- `s3:PutLifecycleConfiguration`
- `cloudformation:*` (for stack management)

### Cannot Upload via Presigned URL

1. Check CORS configuration matches your origin
2. Verify presigned URL hasn't expired (15 minutes default)
3. Ensure correct Content-Type header
4. Check bucket policy allows PutObject

## Clean Up

### Development Environment

```bash
# Destroy stack
cdk destroy BidOpsAI-S3SourceBucket-dev

# Or use make
make cdk-destroy CDK_ENV=dev

# Note: Buckets with content won't be deleted automatically
# You must empty buckets first
aws s3 rm s3://bidopsai-project-documents-dev-123456789012/ --recursive
aws s3 rm s3://bidopsai-artifacts-dev-123456789012/ --recursive
```

### Production Environment

⚠️ **Production stacks have deletion protection enabled.**

To destroy production stack:

1. Manually disable deletion protection in AWS Console
2. Empty all buckets
3. Run destroy command

## Monitoring

### View Access Logs

```bash
# Download access logs
aws s3 sync \
  s3://bidopsai-access-logs-dev-123456789012/ \
  ./access-logs/

# View recent access
tail -f access-logs/*.log
```

### CloudWatch Metrics

Monitor S3 metrics in CloudWatch:
- Bucket size
- Number of objects
- Request metrics
- Data transfer

## Cost Optimization

### Development Tips

1. Enable lifecycle policies (already configured)
2. Delete old test data regularly
3. Use Intelligent-Tiering for infrequent access
4. Monitor storage class distribution

### Estimated Costs (Development)

Based on typical usage:
- Storage (Standard): ~$0.023 per GB/month
- Requests (PUT): ~$0.005 per 1,000 requests
- Data transfer: First 100 GB free/month

Example monthly cost for 100 GB storage with 10,000 requests:
- Storage: $2.30
- Requests: $0.05
- **Total: ~$2.35/month**

## Next Steps

1. ✅ Deploy S3 stack
2. ✅ Update backend environment variables
3. ✅ Restart core-api service
4. ✅ Test presigned URL generation
5. ✅ Test file upload from frontend
6. ✅ Verify files appear in S3
7. ✅ Test Parser Agent access to documents

## Support

For issues or questions:
- Review [CDK README](./README.md)
- Check [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- Review [CloudFormation Stack Events](https://console.aws.amazon.com/cloudformation/)

## License

Copyright © 2025 BidOps.AI. All rights reserved.