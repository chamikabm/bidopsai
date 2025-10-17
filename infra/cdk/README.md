# BidOps AI - AWS CDK Infrastructure

This directory contains the AWS CDK infrastructure code for deploying the BidOps AI agentic system.

## Overview

The infrastructure is organized into multiple stacks for modularity and independent deployment:

### Core Stacks

1. **Cognito Stack** - User authentication and authorization
2. **S3 Source Bucket Stack** - Document storage (project documents and artifacts)
3. **ECR Stack** - Docker image repositories for agent deployments
4. **Config Stack** - SSM Parameter Store and Secrets Manager configuration
5. **IAM Stack** - IAM roles and policies for agents and services
6. **AgentCore Runtime Stack** - AWS Bedrock AgentCore runtime deployments
7. **Bedrock Data Automation Stack** - Document parsing and processing
8. **Observability Stack** - CloudWatch, X-Ray, and monitoring

## Prerequisites

### Required Tools

- Node.js 18+ and npm
- AWS CLI configured with appropriate credentials
- AWS CDK CLI: `npm install -g aws-cdk`
- Docker (for building and pushing images)
- Python 3.12+ and UV (for agent code)

### AWS Account Setup

1. **AWS Account**: Ensure you have an AWS account with appropriate permissions
2. **AWS CLI Configuration**: Configure AWS CLI with credentials
   ```bash
   aws configure
   ```
3. **CDK Bootstrap**: Bootstrap CDK in your AWS account/region
   ```bash
   cd infra/cdk
   cdk bootstrap aws://ACCOUNT-ID/REGION
   ```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# AWS Configuration
AWS_ACCOUNT_ID=123456789012
AWS_REGION=us-east-1
CDK_DEFAULT_ACCOUNT=123456789012
CDK_DEFAULT_REGION=us-east-1

# Agent Versions (semantic versioning)
APP_VERSION_WORKFLOW=1.0.0
APP_VERSION_AI_ASSISTANT=1.0.0

# Database Configuration (for local development)
DATABASE_URL=postgresql://user:password@localhost:5432/bidopsai
```

## Installation

```bash
cd infra/cdk
npm install
```

## Deployment

### Deploy All Stacks

Deploy all stacks to the dev environment:

```bash
npm run deploy:dev
```

Deploy to staging:

```bash
npm run deploy:staging
```

Deploy to production:

```bash
npm run deploy:prod
```

### Deploy Specific Stacks

Deploy only specific stacks:

```bash
# Deploy config and IAM stacks
cdk deploy BidOpsAI-Config-dev BidOpsAI-IAM-dev -c environment=dev

# Deploy AgentCore runtime
cdk deploy BidOpsAI-AgentCore-dev -c environment=dev
```

### Stack Dependencies

Stacks must be deployed in the following order:

1. Cognito, S3, ECR (can be deployed in parallel)
2. Config
3. IAM (depends on Config, S3, ECR)
4. Data Automation (depends on S3)
5. AgentCore Runtime (depends on IAM, ECR)
6. Observability (depends on IAM)

## Agent Deployment Workflow

### 1. Build and Push Docker Images

Before deploying AgentCore runtimes, build and push Docker images:

```bash
# Build and push both agents
./scripts/deploy-to-ecr.sh dev

# Or build specific agents
./scripts/deploy-to-ecr.sh dev workflow
./scripts/deploy-to-ecr.sh dev ai-assistant
```

### 2. Deploy AgentCore Runtimes

After pushing images, deploy or update the AgentCore runtimes:

```bash
cdk deploy BidOpsAI-AgentCore-dev -c environment=dev
```

### 3. Update Running Runtimes

To update already deployed runtimes with new images:

```bash
# Update both agents
./scripts/update-agentcore-runtime.sh dev

# Update specific agent
./scripts/update-agentcore-runtime.sh dev workflow
./scripts/update-agentcore-runtime.sh dev ai-assistant
```

## Version Management

### Bump Version

Use the version bump script to increment versions:

```bash
# Bump patch version for both agents
./scripts/bump-version.sh both patch

# Bump minor version for workflow agent only
./scripts/bump-version.sh workflow minor

# Bump major version for AI assistant
./scripts/bump-version.sh ai-assistant major
```

This script will:
1. Update version numbers in `.env`
2. Optionally create git tags
3. Display next steps for deployment

### Manual Version Update

You can also manually update versions in `.env`:

```bash
APP_VERSION_WORKFLOW=1.2.3
APP_VERSION_AI_ASSISTANT=1.1.0
```

## Stack Details

### ECR Stack

Creates two ECR repositories for Docker images:

- `bidopsai-workflow-agent-{env}`
- `bidopsai-ai-assistant-agent-{env}`

**Features:**
- Image scanning on push
- Lifecycle policies (keep last 10 tagged, 5 untagged)
- Tag immutability for prod/staging

### Config Stack

Manages configuration via SSM Parameter Store and Secrets Manager:

**SSM Parameters:**
- Agent configurations (temperature, max_tokens, model names)
- Memory configurations (TTLs for different memory types)
- Feature flags

**Secrets:**
- Database credentials
- AWS credentials (for agents)
- Slack webhook URLs
- LangFuse API keys

### IAM Stack

Creates three IAM roles:

1. **AgentCore Execution Role** - Base permissions for AgentCore
2. **Workflow Agent Role** - Full read/write access for workflow operations
3. **AI Assistant Agent Role** - Read-only access for conversational AI

**Permissions include:**
- Bedrock model invocation
- Knowledge Base access
- Data Automation
- S3 read/write
- RDS database access
- CloudWatch Logs and X-Ray
- SSM Parameter Store and Secrets Manager

### AgentCore Runtime Stack

Deploys two AgentCore runtimes using custom resources:

1. **Workflow Agent Runtime** - Handles bid processing workflows
2. **AI Assistant Agent Runtime** - Handles conversational AI

**Features:**
- Container-based deployment with ECR images
- CloudWatch Logs integration
- X-Ray tracing (prod/staging)
- Automatic health checks

### Bedrock Data Automation Stack

Configures Bedrock Data Automation for document processing:

**Features:**
- Document parsing project
- S3 integration for input/output
- Character-based text splitting (8000 tokens, 10% overlap)
- Separate processed documents bucket

### Observability Stack

Comprehensive monitoring and observability:

**CloudWatch Logs:**
- `/bidopsai/{env}/agents/workflow`
- `/bidopsai/{env}/agents/ai-assistant`
- `/bidopsai/{env}/system`

**CloudWatch Metrics:**
- Agent task executions and duration
- Error rates
- Workflow execution status
- LLM invocations, token usage, and latency

**CloudWatch Dashboard:**
- Real-time metrics visualization
- Log insights queries
- Error tracking

**Alarms (prod/staging):**
- High error rate
- Long task duration
- High LLM latency

**X-Ray Tracing:**
- Distributed request tracing
- Performance bottleneck identification

## Environment-Specific Configuration

### Development (dev)

- Short log retention (1 month)
- No tag immutability
- Auto-delete resources on stack deletion
- Detailed monitoring disabled
- No alarms

### Staging

- Medium log retention (3 months)
- Tag immutability for images
- Resources retained on deletion
- Detailed monitoring enabled
- Alarms configured

### Production (prod)

- Long log retention (6 months)
- Tag immutability for images
- All resources retained on deletion
- Detailed monitoring enabled
- Alarms configured with lower thresholds
- Additional backup policies

## Monitoring and Troubleshooting

### View CloudWatch Dashboard

```bash
# Get dashboard URL from stack outputs
aws cloudformation describe-stacks \
  --stack-name BidOpsAI-Observability-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`DashboardUrl`].OutputValue' \
  --output text
```

### View Logs

```bash
# Workflow agent logs
aws logs tail /bidopsai/dev/agents/workflow --follow

# AI Assistant logs
aws logs tail /bidopsai/dev/agents/ai-assistant --follow

# System logs
aws logs tail /bidopsai/dev/system --follow
```

### Check AgentCore Runtime Status

```bash
aws bedrock describe-agent-runtime \
  --runtime-identifier bidopsai-workflow-agent-dev \
  --region us-east-1
```

### View X-Ray Traces

```bash
# Get X-Ray service map
aws xray get-service-graph \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s)
```

## Cleanup

### Destroy Stacks

To remove all resources:

```bash
# Destroy all stacks (dev only)
cdk destroy --all -c environment=dev

# Destroy specific stacks
cdk destroy BidOpsAI-AgentCore-dev -c environment=dev
```

**Warning:** Production resources have `RemovalPolicy.RETAIN` and will not be deleted automatically.

### Manual Cleanup

For production resources, you may need to manually:

1. Empty S3 buckets
2. Delete ECR images
3. Remove CloudWatch log groups (if desired)
4. Delete Secrets Manager secrets

## Cost Optimization

### Cost-Saving Tips

1. **Use dev environment for testing** - Lower retention, auto-delete
2. **Monitor LLM token usage** - Track via CloudWatch metrics
3. **Set up budget alerts** - AWS Budgets for cost monitoring
4. **Clean up old images** - ECR lifecycle policies handle this automatically
5. **Use spot instances** - For non-critical workloads (not applicable to AgentCore)

### Estimated Monthly Costs (dev environment)

- ECR: $0.10/GB stored
- S3: $0.023/GB stored
- CloudWatch Logs: $0.50/GB ingested
- Bedrock models: Pay per token usage
- AgentCore Runtime: Based on compute hours

## Troubleshooting

### Common Issues

**Issue: CDK deploy fails with "IAM role not found"**
- Solution: Ensure IAM stack is deployed first
- Run: `cdk deploy BidOpsAI-IAM-dev -c environment=dev`

**Issue: AgentCore runtime fails to start**
- Check Docker images are pushed to ECR
- Verify IAM role permissions
- Check CloudWatch logs for errors

**Issue: "Cannot find module" errors during build**
- Run `npm install` in `infra/cdk` directory
- Ensure all dependencies are installed

**Issue: X-Ray traces not appearing**
- Verify X-Ray permissions in IAM role
- Check X-Ray daemon is running (built into AgentCore)
- Enable tracing in AgentCore configuration

## Scripts Reference

### deploy-to-ecr.sh

Build and push Docker images to ECR.

```bash
./scripts/deploy-to-ecr.sh <environment> [agent_type]

# Examples
./scripts/deploy-to-ecr.sh dev
./scripts/deploy-to-ecr.sh prod workflow
```

### update-agentcore-runtime.sh

Update running AgentCore runtimes with new images.

```bash
./scripts/update-agentcore-runtime.sh <environment> [agent_type]

# Examples
./scripts/update-agentcore-runtime.sh dev
./scripts/update-agentcore-runtime.sh staging workflow
```

### bump-version.sh

Increment semantic versions and create git tags.

```bash
./scripts/bump-version.sh <agent_type> <bump_type>

# Examples
./scripts/bump-version.sh both patch
./scripts/bump-version.sh workflow minor
./scripts/bump-version.sh ai-assistant major
```

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Bedrock AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/)
- [Strands Agents Documentation](https://github.com/awslabs/multi-agent-orchestrator)
- [AWS X-Ray Developer Guide](https://docs.aws.amazon.com/xray/)

## Support

For issues or questions:
1. Check CloudWatch logs for error messages
2. Review X-Ray traces for performance issues
3. Check AWS Health Dashboard for service issues
4. Consult the troubleshooting section above