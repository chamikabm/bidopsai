# GitHub Actions CI/CD Workflows

This directory contains automated CI/CD workflows for the bidops.ai web application.

## Workflows Overview

### 1. CI Pipeline (`ci.yml`)

**Trigger:** Push to `main`, `develop`, or `feature/**` branches, and pull requests

**Purpose:** Continuous Integration - validates code quality, runs tests, and builds the application

**Jobs:**
- **Lint and Type Check**: Runs ESLint and TypeScript type checking
- **Unit Tests**: Executes Vitest unit tests with coverage reporting
- **E2E Tests**: Runs Playwright end-to-end tests
- **Build Application**: Builds the Next.js application
- **Build Docker Image**: Creates and pushes Docker image to GitHub Container Registry
- **Security Scan**: Runs npm audit and Snyk security scanning
- **Notify Success**: Sends success notification

**Artifacts:**
- Build artifacts (`.next/` directory)
- Playwright test reports
- Code coverage reports

**Duration:** ~10-15 minutes

### 2. CD - Production Deployment (`cd-production.yml`)

**Trigger:** 
- Push to `main` branch
- Git tags matching `v*.*.*`
- Manual workflow dispatch

**Purpose:** Continuous Deployment to production environment

**Jobs:**
1. **Build and Push**: Builds optimized Docker image and pushes to registry
2. **Security Scan**: Scans Docker image for vulnerabilities using Trivy
3. **Deploy to ECS**: Deploys to AWS ECS production cluster
4. **Smoke Tests**: Runs health checks and basic functionality tests
5. **Rollback on Failure**: Automatically rolls back if deployment fails
6. **Notify**: Sends deployment status notification

**Environment:** `production`
- URL: https://app.bidops.ai
- Requires approval for deployment

**AWS Resources:**
- ECS Cluster: `bidops-production`
- ECS Service: `bidops-web-service`
- Task Definition: `bidops-web-task`

**Duration:** ~15-20 minutes

### 3. CD - Staging Deployment (`cd-staging.yml`)

**Trigger:**
- Push to `develop` branch
- Manual workflow dispatch

**Purpose:** Continuous Deployment to staging environment for testing

**Jobs:**
1. **Build and Push**: Builds Docker image with staging tags
2. **Deploy to Staging**: Deploys to AWS ECS staging cluster
3. **Smoke Tests**: Runs health checks

**Environment:** `staging`
- URL: https://staging.bidops.ai

**AWS Resources:**
- ECS Cluster: `bidops-staging`
- ECS Service: `bidops-web-service-staging`
- Task Definition: `bidops-web-task-staging`

**Duration:** ~10-15 minutes

### 4. Security Scan (`security-scan.yml`)

**Trigger:**
- Daily at 2 AM UTC (scheduled)
- Push to `main` or `develop`
- Manual workflow dispatch

**Purpose:** Regular security scanning and vulnerability detection

**Jobs:**
1. **Dependency Audit**: Runs npm audit on dependencies
2. **Snyk Security Scan**: Scans for known vulnerabilities
3. **CodeQL Analysis**: Static code analysis for security issues
4. **Docker Image Scan**: Scans Docker images with Trivy
5. **License Compliance**: Checks dependency licenses
6. **Security Report**: Generates comprehensive security summary

**Artifacts:**
- npm audit report
- Snyk SARIF report
- CodeQL results
- Trivy scan results
- Security summary

**Duration:** ~15-20 minutes

## Required Secrets

Configure these secrets in your GitHub repository settings:

### AWS Credentials
- `AWS_ACCESS_KEY_ID`: AWS access key for ECS deployment
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for ECS deployment

### Security Scanning
- `SNYK_TOKEN`: Snyk API token for vulnerability scanning (optional)

### Container Registry
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## Environment Configuration

### Production Environment
- **Name:** `production`
- **URL:** https://app.bidops.ai
- **Protection Rules:** Requires manual approval
- **Reviewers:** Configure in repository settings

### Staging Environment
- **Name:** `staging`
- **URL:** https://staging.bidops.ai
- **Protection Rules:** Auto-deploy on develop branch

## Workflow Features

### Caching
- **npm dependencies**: Cached using `actions/setup-node@v4`
- **Docker layers**: Cached using GitHub Actions cache
- **Build artifacts**: Cached between jobs

### Security
- ✅ Non-root Docker containers
- ✅ Vulnerability scanning (Trivy, Snyk)
- ✅ Static code analysis (CodeQL)
- ✅ Dependency auditing
- ✅ License compliance checking
- ✅ SBOM generation

### Deployment Safety
- ✅ Health checks before marking deployment complete
- ✅ Automatic rollback on failure
- ✅ Service stability verification
- ✅ Smoke tests after deployment
- ✅ Manual approval for production

### Monitoring
- ✅ Build artifacts uploaded
- ✅ Test reports available
- ✅ Coverage reports to Codecov
- ✅ Security scan results in GitHub Security tab

## Usage Examples

### Deploying to Production

**Option 1: Push to main branch**
```bash
git checkout main
git merge develop
git push origin main
```

**Option 2: Create a release tag**
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

**Option 3: Manual deployment**
1. Go to Actions tab in GitHub
2. Select "CD - Production Deployment"
3. Click "Run workflow"
4. Select environment and confirm

### Deploying to Staging

**Automatic deployment:**
```bash
git checkout develop
git push origin develop
```

**Manual deployment:**
1. Go to Actions tab
2. Select "CD - Staging Deployment"
3. Click "Run workflow"

### Running Security Scan

**Manual scan:**
1. Go to Actions tab
2. Select "Security Scan"
3. Click "Run workflow"

**Scheduled:** Runs automatically daily at 2 AM UTC

## Troubleshooting

### Build Failures

**Problem:** npm install fails
```bash
# Clear cache and retry
# In workflow, add: cache: ''
```

**Problem:** Docker build fails
```bash
# Check Dockerfile syntax
# Verify build context
# Check .dockerignore file
```

### Deployment Failures

**Problem:** ECS deployment times out
```bash
# Check ECS service logs
aws ecs describe-services --cluster bidops-production --services bidops-web-service

# Check task logs
aws logs tail /ecs/bidops-web --follow
```

**Problem:** Health check fails
```bash
# Verify health endpoint
curl https://app.bidops.ai/api/health

# Check container logs
aws ecs describe-tasks --cluster bidops-production --tasks <task-id>
```

### Rollback Procedure

**Automatic rollback:**
- Triggered automatically if smoke tests fail
- Reverts to previous task definition

**Manual rollback:**
```bash
# List task definitions
aws ecs list-task-definitions --family-prefix bidops-web-task

# Update service to previous version
aws ecs update-service \
  --cluster bidops-production \
  --service bidops-web-service \
  --task-definition bidops-web-task:PREVIOUS_VERSION
```

## Best Practices

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch for staging
- `feature/*`: Feature development branches

### Commit Messages
Use conventional commits for better changelog generation:
```
feat: add new feature
fix: fix bug
docs: update documentation
chore: update dependencies
ci: update workflow
```

### Pull Requests
- All PRs must pass CI checks
- Require code review before merging
- Squash commits when merging

### Deployment Strategy
1. Develop and test in feature branches
2. Merge to `develop` for staging deployment
3. Test in staging environment
4. Merge to `main` for production deployment
5. Monitor production deployment

## Monitoring and Alerts

### GitHub Actions
- View workflow runs in Actions tab
- Check job logs for detailed information
- Download artifacts for analysis

### AWS CloudWatch
- Monitor ECS service metrics
- View container logs
- Set up alarms for failures

### Security Alerts
- Check Security tab for vulnerabilities
- Review Dependabot alerts
- Monitor CodeQL findings

## Performance Optimization

### Build Time Optimization
- ✅ Parallel job execution
- ✅ Dependency caching
- ✅ Docker layer caching
- ✅ Incremental builds

### Deployment Time Optimization
- ✅ Pre-built Docker images
- ✅ Fast health checks
- ✅ Optimized task definitions
- ✅ Minimal service downtime

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
