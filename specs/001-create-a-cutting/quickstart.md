# Quickstart Guide: BidOps.AI Frontend

**Feature**: BidOps.AI Frontend Application  
**Date**: 2025-10-07  
**Status**: Complete

## Overview

This guide helps developers set up the BidOps.AI frontend application locally for development. The setup includes Next.js 15, AWS Cognito authentication, GraphQL integration, and AgentCore SSE streaming.

**Estimated Setup Time**: 30-45 minutes

---

## Prerequisites

### Required Software

| Tool | Minimum Version | Recommended | Purpose |
|------|----------------|-------------|---------|
| **Node.js** | 24.0.0 | 24.0.0+ | JavaScript runtime |
| **npm** | 10.0.0 | 10.0.0+ | Package manager |
| **Docker** | 24.0.0 | 25.0.0+ | Container runtime |
| **Docker Compose** | 2.20.0 | 2.20.0+ | Multi-container orchestration |
| **AWS CLI** | 2.0.0 | 2.15.0+ | AWS infrastructure management |
| **Make** | 4.0 | 4.4+ | Build automation |
| **Git** | 2.40.0 | 2.45.0+ | Version control |

### Required Accounts & Credentials

1. **AWS Account** with permissions to:
   - Create Cognito User Pools
   - Deploy CDK stacks
   - Access S3 buckets
   - Push to ECR repositories
   
2. **GitHub Account** for:
   - Repository access
   - GitHub Actions (CI/CD)

3. **Development Environment**:
   - macOS, Linux, or Windows with WSL2
   - 8GB+ RAM available
   - 20GB+ free disk space

---

## Quick Start (5 Minutes)

If you just want to see the app running locally without AWS services:

```bash
# 1. Clone repository
git clone https://github.com/your-org/bidopsai.git
cd bidopsai

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with mock values (see Mock Setup section)

# 4. Start development server
npm run dev

# 5. Open browser
open http://localhost:3000
```

**Note**: This runs with mock data. For full functionality with AWS services, follow the Complete Setup below.

---

## Complete Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/bidopsai.git
cd bidopsai

# Verify you're in the correct directory
pwd
# Expected: /path/to/bidopsai

# Check repository structure
ls -la
# Should see: apps/, infra/, services/, docs/, etc.
```

---

### Step 2: Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Verify installation
npm list --depth=0

# Expected packages include:
# - next@15.1.3
# - react@19.0.0
# - @tanstack/react-query@5.90.0
# - tailwindcss@4.1.0
# - and more...
```

**Troubleshooting**:
- If npm install fails, try: `rm -rf node_modules package-lock.json && npm install`
- For M1/M2 Macs, you may need: `arch -arm64 npm install`

---

### Step 3: Configure AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Enter your credentials when prompted:
# AWS Access Key ID: <your-access-key>
# AWS Secret Access Key: <your-secret-key>
# Default region: us-east-1 (or your preferred region)
# Default output format: json

# Verify configuration
aws sts get-caller-identity

# Expected output:
# {
#   "UserId": "AIDAI...",
#   "Account": "123456789012",
#   "Arn": "arn:aws:iam::123456789012:user/yourname"
# }
```

---

### Step 4: Deploy AWS Infrastructure (CDK)

This creates the Cognito User Pool required for authentication.

```bash
# Navigate to CDK directory
cd infra/cdk

# Install CDK dependencies
npm install

# Bootstrap CDK (first time only)
npx cdk bootstrap

# Deploy Cognito stack
npx cdk deploy BidOpsAICognitoStack

# Expected output:
# ✅  BidOpsAICognitoStack
# 
# Outputs:
# BidOpsAICognitoStack.UserPoolId = us-east-1_abcdef123
# BidOpsAICognitoStack.UserPoolClientId = 1234567890abcdefghijklmno
# BidOpsAICognitoStack.UserPoolDomain = bidopsai-dev-12345.auth.us-east-1.amazoncognito.com

# Copy these outputs - you'll need them for environment variables
```

**Important**: Save the CDK outputs. You'll use them in Step 5.

**Alternative (Manual Setup)**:
If CDK deployment fails, you can create the Cognito User Pool manually:
1. Go to AWS Console → Cognito
2. Create User Pool with username + password
3. Enable Google OAuth provider
4. Create App Client with OAuth flows
5. Note the User Pool ID, Client ID, and Domain

---

### Step 5: Configure Environment Variables

```bash
# Navigate back to project root
cd ../..

# Copy example environment file
cp apps/web/.env.example apps/web/.env.local

# Edit environment file
nano apps/web/.env.local
# or use your preferred editor: code apps/web/.env.local
```

**Environment Variables** (replace with your actual values):

```bash
# ============================================
# NEXT.JS CONFIGURATION
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ============================================
# AWS COGNITO CONFIGURATION
# ============================================
# From CDK outputs (Step 4)
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_abcdef123
NEXT_PUBLIC_COGNITO_CLIENT_ID=1234567890abcdefghijklmno
NEXT_PUBLIC_COGNITO_DOMAIN=bidopsai-dev-12345.auth.us-east-1.amazoncognito.com

# OAuth redirect URIs (must match Cognito App Client settings)
NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_IN=http://localhost:3000/api/auth/callback/cognito
NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_OUT=http://localhost:3000

# ============================================
# GRAPHQL API CONFIGURATION
# ============================================
# Core API endpoint (update when backend is deployed)
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4000/graphql
GRAPHQL_ENDPOINT_INTERNAL=http://core-api:4000/graphql

# ============================================
# AWS AGENTCORE CONFIGURATION
# ============================================
# AgentCore endpoint (update when agent-core is deployed)
NEXT_PUBLIC_AGENTCORE_ENDPOINT=http://localhost:8000/invocations
AGENTCORE_ENDPOINT_INTERNAL=http://agent-core:8000/invocations

# ============================================
# AWS S3 CONFIGURATION
# ============================================
NEXT_PUBLIC_S3_BUCKET=bidopsai-documents-dev
NEXT_PUBLIC_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>

# ============================================
# FEATURE FLAGS
# ============================================
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=false

# ============================================
# DEVELOPMENT
# ============================================
NEXT_TELEMETRY_DISABLED=1
```

**Security Note**: Never commit `.env.local` to version control. It's already in `.gitignore`.

---

### Step 6: Start Development Server

```bash
# Using npm script
npm run dev

# Or using Make
make dev

# Or navigate to web app directory
cd apps/web
npm run dev
```

**Expected Output**:
```
> bidopsai-web@1.0.0 dev
> next dev

  ▲ Next.js 15.1.3
  - Local:        http://localhost:3000
  - Network:      http://192.168.1.100:3000

 ✓ Ready in 3.2s
 ○ Compiling / ...
 ✓ Compiled / in 1.8s
```

**Verify Setup**:
1. Open browser to `http://localhost:3000`
2. You should see the sign-in page with futuristic animations
3. Try to sign in (if you have a Cognito user)

---

### Step 7: Create Test User

```bash
# Create a test user in Cognito
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_abcdef123 \
  --username testuser@example.com \
  --user-attributes Name=email,Value=testuser@example.com Name=email_verified,Value=true \
  --temporary-password TempPass123! \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_abcdef123 \
  --username testuser@example.com \
  --password DevPassword123! \
  --permanent

# Assign role (requires backend API running)
# This step is optional for frontend-only development
```

**Test Login**:
1. Go to `http://localhost:3000`
2. Username: `testuser@example.com`
3. Password: `DevPassword123!`
4. You should be redirected to the dashboard

---

## Docker Development Setup

For a fully containerized development environment:

```bash
# Build development Docker image
make docker-build-dev

# Start all services with Docker Compose
make docker-up

# View logs
make docker-logs

# Stop services
make docker-down
```

**Docker Compose Services**:
- `web`: Next.js frontend (http://localhost:3000)
- `web-storybook`: Component storybook (http://localhost:6006)

---

## Mock Data Setup (No AWS Required)

For frontend development without AWS services:

```bash
# Enable mock mode in .env.local
NEXT_PUBLIC_ENABLE_MOCK_DATA=true

# Mock GraphQL endpoint
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:3000/api/mock/graphql

# Mock AgentCore endpoint
NEXT_PUBLIC_AGENTCORE_ENDPOINT=http://localhost:3000/api/mock/agentcore
```

**Mock Data Features**:
- Pre-populated projects, users, artifacts
- Simulated SSE streaming events
- Fake S3 upload with local storage
- No AWS credentials required

**Start with Mock Data**:
```bash
npm run dev:mock
```

---

## Available Commands

### Development

```bash
# Start development server
npm run dev
make dev

# Start with mock data
npm run dev:mock

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Format code
npm run format

# Run all checks
make check
```

### Testing

```bash
# Run all tests
npm test
make test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Test with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Building

```bash
# Build for production
npm run build
make build

# Build and analyze bundle
npm run build:analyze

# Start production server
npm start
```

### Docker

```bash
# Build development image
make docker-build-dev

# Build production image
make docker-build-prod

# Start services
make docker-up

# View logs
make docker-logs

# Stop services
make docker-down

# Clean up
make docker-clean
```

### CDK

```bash
# Deploy all stacks
make cdk-deploy

# Deploy specific stack
make cdk-deploy-cognito

# Destroy stacks
make cdk-destroy

# View stack outputs
make cdk-outputs
```

---

## Project Structure

```
bidopsai/
├── apps/
│   └── web/                          # Next.js frontend application
│       ├── src/
│       │   ├── app/                  # Next.js App Router pages
│       │   │   ├── (auth)/           # Auth routes (signin, signup)
│       │   │   ├── (main)/           # Main app routes (dashboard, projects, etc.)
│       │   │   └── api/              # API routes (BFF layer)
│       │   ├── components/           # React components
│       │   │   ├── ui/               # shadcn/ui components
│       │   │   ├── layout/           # Layout components
│       │   │   ├── auth/             # Auth components
│       │   │   └── ...               # Feature components
│       │   ├── hooks/                # Custom hooks
│       │   │   ├── queries/          # TanStack Query hooks
│       │   │   ├── mutations/        # TanStack Mutation hooks
│       │   │   └── streams/          # SSE streaming hooks
│       │   ├── lib/                  # Libraries and utilities
│       │   │   ├── auth/             # Cognito auth setup
│       │   │   ├── graphql/          # GraphQL client
│       │   │   ├── api/              # API clients
│       │   │   └── editor/           # TipTap editor
│       │   ├── store/                # Zustand stores
│       │   ├── types/                # TypeScript types
│       │   ├── utils/                # Utility functions
│       │   └── styles/               # Global styles and themes
│       ├── public/                   # Static assets
│       ├── .env.example              # Environment variables template
│       ├── next.config.js            # Next.js configuration
│       ├── tailwind.config.ts        # Tailwind CSS configuration
│       └── package.json              # Dependencies
│
├── infra/
│   ├── cdk/                          # AWS CDK infrastructure
│   │   ├── lib/
│   │   │   ├── cognito-stack.ts      # Cognito User Pool
│   │   │   └── ...                   # Other stacks
│   │   └── bin/
│   │       └── app.ts                # CDK app entry point
│   └── docker/                       # Docker configurations
│       └── apps/
│           └── web/
│               ├── Dockerfile.dev    # Development Dockerfile
│               └── Dockerfile        # Production Dockerfile
│
├── docs/                             # Documentation
├── scripts/                          # Build and deployment scripts
├── Makefile                          # Build automation
└── package.json                      # Root package.json (workspace)
```

---

## Common Issues & Solutions

### Issue: Cannot connect to Cognito

**Symptoms**:
- "User pool not found" error
- "Invalid client ID" error

**Solutions**:
1. Verify CDK stack deployed successfully: `aws cloudformation describe-stacks --stack-name BidOpsAICognitoStack`
2. Check User Pool ID and Client ID in `.env.local`
3. Ensure AWS region matches: `NEXT_PUBLIC_COGNITO_REGION=us-east-1`
4. Verify redirect URIs in Cognito App Client settings match `.env.local`

---

### Issue: GraphQL endpoint not responding

**Symptoms**:
- "Failed to fetch" errors
- Queries timeout

**Solutions**:
1. Check if backend is running: `curl http://localhost:4000/graphql`
2. Enable mock mode: `NEXT_PUBLIC_ENABLE_MOCK_DATA=true`
3. Verify endpoint in `.env.local`: `NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4000/graphql`

---

### Issue: SSE connection fails

**Symptoms**:
- Workflow doesn't start
- No real-time updates

**Solutions**:
1. Check AgentCore endpoint: `NEXT_PUBLIC_AGENTCORE_ENDPOINT=http://localhost:8000/invocations`
2. Verify CORS settings on AgentCore
3. Check browser console for EventSource errors
4. Try mock mode for testing: `npm run dev:mock`

---

### Issue: Docker build fails

**Symptoms**:
- "No space left on device"
- "Cannot pull base image"

**Solutions**:
1. Clean Docker: `docker system prune -a`
2. Free up disk space
3. Check Docker daemon is running: `docker ps`
4. Try building without cache: `docker build --no-cache`

---

### Issue: Hot reload not working

**Symptoms**:
- Changes not reflected in browser
- Need to manually refresh

**Solutions**:
1. Check if using Docker - enable polling: `WATCHPACK_POLLING=true npm run dev`
2. Increase file watcher limit (Linux):
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```
3. Restart development server

---

## Next Steps

After completing the quickstart:

1. **Explore the Application**:
   - Sign in with test user
   - Navigate through all pages
   - Try creating a mock project

2. **Review Documentation**:
   - Read `data-model.md` for data structures
   - Check `contracts/` for API contracts
   - Review component documentation in Storybook

3. **Set Up Your IDE**:
   - Install recommended VS Code extensions
   - Configure TypeScript settings
   - Set up debugging configurations

4. **Start Development**:
   - Pick a task from the implementation plan
   - Create a feature branch
   - Write tests first (TDD approach)
   - Submit PR for review

5. **Backend Integration**:
   - Deploy backend services (core-api, agent-core)
   - Update environment variables with real endpoints
   - Test end-to-end workflows

---

## Additional Resources

- **Architecture Docs**: `/docs/architecture/`
- **Database Schema**: `/docs/database/bidopsai.mmd`
- **Agent Flow**: `/docs/architecture/agent-core/agent-flow-diagram.md`
- **API Reference**: `specs/001-create-a-cutting/contracts/`
- **Storybook**: http://localhost:6006 (when running)

---

## Support

For questions or issues:

1. Check existing GitHub issues
2. Review troubleshooting section above
3. Ask in team Slack channel
4. Create a new GitHub issue with:
   - Error message
   - Steps to reproduce
   - Environment details (`node -v`, `npm -v`, OS)

---

## Summary

You should now have:

✅ Local development environment running  
✅ AWS Cognito User Pool deployed  
✅ Environment variables configured  
✅ Test user created  
✅ Application accessible at http://localhost:3000  

**Next**: Start implementing features from `plan.md` → Phase 2 tasks!