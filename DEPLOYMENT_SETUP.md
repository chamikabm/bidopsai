# Deployment Setup Guide for bidops.ai

## Quick Start

This guide will help you set up the CI/CD pipeline and deployment infrastructure for the bidops.ai web application.

## Prerequisites

- GitHub repository with admin access
- AWS account with ECS access
- Docker installed locally
- AWS CLI configured

## Step 1: Configure GitHub Secrets

Navigate to your GitHub repository settings and add the following secrets:

### Required Secrets

1. **AWS_ACCESS_KEY_ID**
   - AWS access key for ECS deployment
   - Required for: Production and Staging deployments

2. **AWS_SECRET_ACCESS_KEY**
   - AWS secret key for ECS deployment
   - Required for: Production and Staging deployments

### Optional Secrets

3. **SNYK_TOKEN**
   - Snyk API token for vulnerability scanning
   - Get it from: https://snyk.io/
   - Required for: Enhanced security scanning

## Step 2: Set Up AWS Infrastructure

### Create ECS Clusters

**Staging:**
```bash
aws ecs create-cluster --cluster-name bidops-staging --region us-east-1
```

**Production:**
```bash
aws ecs create-cluster --cluster-name bidops-production --region us-east-1
```

### Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name bidops-web \
  --region us-east-1 \
  --image-scanning-configuration scanOnPush=true
```

### Create ECS Task Definitions

You'll need to create task definitions for both staging and production. Example:

```json
{
  "family": "bidops-web-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "bidops-web",
      "image": "ghcr.io/your-org/bidops-web:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/bidops-web",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Create ECS Services

**Staging:**
```bash
aws ecs create-service \
  --cluster bidops-staging \
  --service-name bidops-web-service-staging \
  --task-definition bidops-web-task-staging \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

**Production:**
```bash
aws ecs create-service \
  --cluster bidops-production \
  --service-name bidops-web-service \
  --task-definition bidops-web-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

## Step 3: Configure GitHub Environments

### Create Staging Environment

1. Go to Settings → Environments → New environment
2. Name: `staging`
3. Environment URL: `https://staging.bidops.ai`
4. No protection rules needed (auto-deploy)

### Create Production Environment

1. Go to Settings → Environments → New environment
2. Name: `production`
3. Environment URL: `https://app.bidops.ai`
4. Add protection rules:
   - ✅ Required reviewers (add team members)
   - ✅ Wait timer: 5 minutes (optional)
   - ✅ Deployment branches: Only main branch

## Step 4: Test Local Docker Build

Before pushing to CI/CD, test the Docker build locally:

```bash
# Build production image
docker build -f infra/docker/apps/web/Dockerfile -t bidops-web:test .

# Run container
docker run -p 3000:3000 bidops-web:test

# Test health endpoint
curl http://localhost:3000/api/health
```

## Step 5: Test Development Docker Setup

```bash
# Start development environment
cd infra/docker
docker-compose -f docker-compose.dev.yml up

# Application will be available at http://localhost:3000
# Changes to source files will trigger hot reload
```

## Step 6: Configure Environment Variables

### Production Environment

Copy and configure production environment variables:

```bash
cp apps/web/.env.production.example apps/web/.env.production
# Edit .env.production with actual values
```

### Staging Environment

Copy and configure staging environment variables:

```bash
cp apps/web/.env.staging.example apps/web/.env.staging
# Edit .env.staging with actual values
```

**Important:** Never commit `.env.production` or `.env.staging` files to git!

## Step 7: Test CI Pipeline

Create a feature branch and push to test the CI pipeline:

```bash
git checkout -b test/ci-pipeline
git push origin test/ci-pipeline
```

This will trigger:
- Lint and type checking
- Unit tests
- E2E tests
- Build verification
- Docker image build
- Security scanning

## Step 8: Deploy to Staging

Merge your changes to the `develop` branch:

```bash
git checkout develop
git merge test/ci-pipeline
git push origin develop
```

This will automatically:
1. Build Docker image
2. Push to GitHub Container Registry
3. Deploy to staging ECS cluster
4. Run smoke tests

Monitor the deployment in the Actions tab.

## Step 9: Deploy to Production

When ready for production:

```bash
git checkout main
git merge develop
git push origin main
```

Or create a release tag:

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

This will:
1. Build optimized Docker image
2. Run security scans
3. Deploy to production ECS cluster
4. Run smoke tests
5. Automatically rollback if health checks fail

**Note:** Production deployments require manual approval from configured reviewers.

## Step 10: Monitor Deployments

### GitHub Actions

- View workflow runs in the Actions tab
- Check job logs for detailed information
- Download artifacts for analysis

### AWS CloudWatch

```bash
# View ECS service logs
aws logs tail /ecs/bidops-web --follow

# Check service status
aws ecs describe-services \
  --cluster bidops-production \
  --services bidops-web-service
```

### Health Checks

```bash
# Staging
curl https://staging.bidops.ai/api/health

# Production
curl https://app.bidops.ai/api/health
```

## Troubleshooting

### Build Fails

**Check Docker build locally:**
```bash
docker build -f infra/docker/apps/web/Dockerfile -t bidops-web:debug .
```

**Check workflow logs:**
- Go to Actions tab
- Click on failed workflow
- Review job logs

### Deployment Fails

**Check ECS service events:**
```bash
aws ecs describe-services \
  --cluster bidops-production \
  --services bidops-web-service \
  --query 'services[0].events'
```

**Check task logs:**
```bash
aws logs tail /ecs/bidops-web --follow
```

### Rollback Deployment

**Manual rollback using script:**
```bash
./scripts/deploy.sh production
# When health check fails, choose 'yes' to rollback
```

**Manual rollback using AWS CLI:**
```bash
# List task definitions
aws ecs list-task-definitions --family-prefix bidops-web-task

# Update service to previous version
aws ecs update-service \
  --cluster bidops-production \
  --service bidops-web-service \
  --task-definition bidops-web-task:PREVIOUS_VERSION
```

## Security Best Practices

1. **Rotate AWS credentials regularly**
2. **Enable MFA for AWS account**
3. **Review security scan results weekly**
4. **Keep dependencies updated**
5. **Monitor CloudWatch alarms**
6. **Review access logs regularly**
7. **Use least privilege IAM policies**

## Maintenance

### Weekly Tasks
- Review security scan results
- Check for dependency updates
- Monitor error rates and performance

### Monthly Tasks
- Review and update IAM policies
- Audit access logs
- Update documentation
- Review and optimize costs

### Quarterly Tasks
- Security audit
- Disaster recovery testing
- Performance optimization review
- Infrastructure cost analysis

## Additional Resources

- [Docker Documentation](infra/docker/README.md)
- [GitHub Actions Documentation](.github/workflows/README.md)
- [Deployment Script](scripts/deploy.sh)
- [Task Completion Report](apps/web/TASK_15_COMPLETE.md)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review workflow logs in GitHub Actions
3. Check AWS CloudWatch logs
4. Consult the documentation files

## Next Steps

After completing this setup:
1. ✅ Configure monitoring and alerting
2. ✅ Set up log aggregation
3. ✅ Configure backup strategies
4. ✅ Implement disaster recovery plan
5. ✅ Set up performance monitoring
6. ✅ Configure cost alerts

---

**Last Updated:** 2025-01-10
**Version:** 1.0.0
