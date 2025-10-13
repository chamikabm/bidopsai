# BidOps.AI - AI-Powered Bid Automation Platform

A cutting-edge, future-forward web application that combines financial trading platform aesthetics with AI-powered agentic systems. Built with Next.js 15, React 19, TypeScript, and AWS services.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-24+-green)
![License](https://img.shields.io/badge/license-Proprietary-red)

## 🚀 Overview

BidOps.AI is an enterprise-grade bid automation platform that leverages AI agents (powered by AWS Bedrock AgentCore) to streamline the entire RFP/bid preparation workflow. From document parsing to proposal generation, compliance checking, and submission - all orchestrated through an intuitive, futuristic interface.

### Key Features

- 🤖 **Multi-Agent Workflow**: 8 specialized AI agents working in orchestration
- 🎨 **Futuristic UI**: 4 themes (Light, Dark, Deloitte, Futuristic) with smooth animations
- 🔐 **Enterprise Auth**: AWS Cognito with Google OAuth, MFA, and RBAC
- 📝 **Rich Text Editing**: TipTap-powered document editor with real-time collaboration
- 📊 **Real-time Updates**: Server-Sent Events for live agent streaming
- 🌐 **Responsive Design**: Mobile-first approach with adaptive layouts
- 🔒 **Role-Based Access**: 5 user roles with granular permissions
- 📦 **Knowledge Management**: Global and local knowledge bases with Bedrock integration

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

## ⚡ Quick Start

### Prerequisites

- **Podman** or **Docker** (for local development)
- **Node.js** 24+ (LTS)
- **AWS CLI** configured with credentials (for deployment)
- **AWS CDK** 2.219+ (for infrastructure deployment)

### Local Development (Docker/Podman)

```bash
# 1. Start the full stack (PostgreSQL + GraphQL API + Frontend)
cd infra/docker
podman-compose -f docker-compose.dev.yml up -d

# 2. Wait for services to start (~30 seconds)
podman logs -f bidopsai-core-api-dev

# 3. Run database migrations (first time only)
podman exec bidopsai-core-api-dev npm run prisma:migrate

# 4. Seed database with initial data (first time only)
podman exec bidopsai-core-api-dev npm run prisma:seed

# 5. Access the application
# Frontend: http://localhost:3000
# GraphQL API: http://localhost:4000
# GraphQL Playground: http://localhost:4000/graphql
```

**Default Admin Credentials:**
- Email: `admin@bidopsai.com`
- Password: Check seed script output or Cognito console

### Native Development (without Docker)

```bash
# 1. Install dependencies
make install

# 2. Setup environment
make setup-env

# 3. Update apps/web/.env.local with your values

# 4. Deploy AWS infrastructure
make cdk-deploy-dev

# 5. Start development server
make dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  Next.js 15 App Router │ React 19 │ TailwindCSS 4 │ Framer Motion │
│                    Real-time SSE Chat Interface                 │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
┌───────────────────▼─────┐    ┌─────────────▼──────────────┐
│   Next.js API Routes     │    │      AWS Services          │
│  (BFF Pattern)           │    │                            │
│  • Auth Proxy            │    │  • Cognito (Auth)          │
│  • GraphQL Proxy         │    │  • S3 (Storage)            │
│  • AgentCore Proxy       │    │  • Bedrock AgentCore       │
└──────────┬───────────────┘    └────────────┬───────────────┘
           │                                  │
┌──────────▼──────────────────────────────────▼───────────────┐
│                    Backend Services                          │
│                                                              │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │  GraphQL API │  │   AgentCore     │  │   PostgreSQL  │ │
│  │   (CRUD)     │  │   (AI Agents)   │  │   Database    │ │
│  └──────────────┘  └─────────────────┘  └───────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Agent Workflow

```
User → Frontend → AgentCore → Supervisor Agent
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
              Parser Agent    Analysis Agent   Content Agent
                    │                │                │
                    └────────────────┼────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
            Compliance Agent     QA Agent      Comms Agent
                    │                │                │
                    └────────────────┼────────────────┘
                                     │
                              Submission Agent
                                     │
                                  Complete
```

## 💻 Technology Stack

### Frontend
- **Framework**: Next.js 15.5+ (App Router, Server Components)
- **UI Library**: React 19.2+
- **Language**: TypeScript 5.9+
- **Styling**: TailwindCSS 4.1+ with CSS variables
- **Animation**: Framer Motion 12.23+
- **State Management**: 
  - TanStack Query v5.90+ (server state)
  - Zustand v5.0+ (client state)
- **Forms**: React Hook Form v7.64+ + Zod v4.1+
- **Editor**: TipTap v3.6+
- **UI Components**: Radix UI (unstyled, accessible)

### Backend Integration
- **Authentication**: AWS Amplify v6.15+ (Cognito Gen 2)
- **API**: GraphQL (via Next.js API routes)
- **Real-time**: Server-Sent Events (SSE)
- **Storage**: AWS S3 (presigned URLs)
- **AI Agents**: AWS Bedrock AgentCore

### Infrastructure
- **IaC**: AWS CDK v2.219+
- **Containerization**: Docker with multi-stage builds
- **CI/CD**: GitHub Actions
- **Orchestration**: AWS ECS
- **Monitoring**: CloudWatch (planned)

## 📁 Project Structure

```
bidopsai/
├── apps/
│   └── web/                      # Next.js frontend application
│       ├── src/
│       │   ├── app/              # Next.js App Router pages
│       │   │   ├── (auth)/       # Auth pages (signin/signup)
│       │   │   ├── (main)/       # Main app pages
│       │   │   │   ├── dashboard/
│       │   │   │   ├── projects/
│       │   │   │   ├── knowledge-bases/
│       │   │   │   ├── users/
│       │   │   │   └── settings/
│       │   │   └── api/          # API routes (BFF pattern)
│       │   ├── components/       # React components
│       │   │   ├── ui/           # shadcn/ui components
│       │   │   ├── layout/       # Layout components
│       │   │   ├── auth/         # Auth components
│       │   │   ├── dashboard/    # Dashboard components
│       │   │   ├── projects/     # Project components
│       │   │   ├── editor/       # Rich text editor
│       │   │   └── common/       # Shared components
│       │   ├── hooks/            # Custom React hooks
│       │   ├── lib/              # Libraries and utilities
│       │   ├── store/            # Zustand stores
│       │   ├── types/            # TypeScript types
│       │   ├── utils/            # Utility functions
│       │   └── styles/           # Global styles and themes
│       ├── public/               # Static assets
│       └── package.json
├── infra/
│   ├── cdk/                      # AWS CDK infrastructure
│   │   ├── bin/                  # CDK app entry
│   │   ├── lib/                  # CDK stacks
│   │   └── README.md
│   ├── docker/                   # Docker configurations
│   │   ├── apps/web/
│   │   │   ├── Dockerfile        # Production
│   │   │   ├── Dockerfile.dev    # Development
│   │   │   └── .dockerignore
│   │   └── docker-compose.dev.yml
│   └── cloud-formation/          # CloudFormation templates
├── services/
│   ├── core-api/                 # GraphQL backend (separate repo)
│   └── agents-core/              # AI agents (separate repo)
├── docs/                         # Documentation
│   ├── architecture/             # Architecture docs
│   ├── database/                 # Database schema
│   └── scratches/                # Design notes
├── .github/
│   └── workflows/                # GitHub Actions CI/CD
├── Makefile                      # Build and deployment commands
└── README.md                     # This file
```

## 🛠️ Development

### Available Commands

```bash
# Installation
make install              # Install all dependencies
make install-web         # Install frontend only
make install-cdk         # Install CDK only

# Development
make dev                 # Start dev server (localhost:3000)
make dev-docker         # Start Docker dev with hot reload
make build              # Build for production
make lint               # Run ESLint
make lint-fix           # Fix ESLint errors
make format             # Format with Prettier
make type-check         # TypeScript validation

# Testing
make test               # Run all tests
make test-watch         # Run tests in watch mode
make test-coverage      # Run tests with coverage

# Docker
make docker-build       # Build production image
make docker-dev         # Run development container
make docker-push        # Push to ECR
make docker-stop        # Stop containers
make docker-clean       # Remove all Docker resources

# AWS CDK
make cdk-bootstrap      # Bootstrap CDK
make cdk-synth          # Generate CloudFormation
make cdk-deploy-dev     # Deploy to development
make cdk-deploy-staging # Deploy to staging
make cdk-deploy-prod    # Deploy to production
make cdk-destroy        # Destroy stack
make cdk-outputs        # View stack outputs

# Utilities
make status             # Show project status
make version            # Show tool versions
make clean              # Clean build artifacts
make help               # Show all commands
```

### Environment Variables

Create `apps/web/.env.local`:

```env
# AWS Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
AWS_REGION=us-east-1

# Cognito (from CDK outputs)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_COGNITO_DOMAIN=bidopsai-dev.auth.us-east-1.amazoncognito.com
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX

# Backend APIs
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://api.bidopsai.com/graphql
NEXT_PUBLIC_AGENTCORE_ENDPOINT=https://agents.bidopsai.com
GRAPHQL_ENDPOINT=https://api.bidopsai.com/graphql
AGENTCORE_ENDPOINT=https://agents.bidopsai.com

# S3 Configuration
NEXT_PUBLIC_S3_BUCKET=bidopsai-uploads-dev
NEXT_PUBLIC_S3_REGION=us-east-1

# Feature Flags
NEXT_PUBLIC_ENABLE_MFA=true
NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-min-32-chars
```

### User Roles

The application supports 5 user roles with different permissions:

| Role | Description | Permissions |
|------|-------------|-------------|
| **ADMIN** | Full system access | All features, user management, system settings |
| **DRAFTER** | Draft preparation | Projects, workflow up to QA, local KBs |
| **BIDDER** | Full workflow access | Complete workflow, local KB management |
| **KB_ADMIN** | Knowledge base admin | Full CRUD on all knowledge bases |
| **KB_VIEW** | KB read-only | View-only access to knowledge bases |

### Themes

4 pre-configured themes:

1. **Light**: Clean, professional light theme
2. **Dark**: Modern dark theme with high contrast
3. **Deloitte**: Deloitte brand colors and styling
4. **Futuristic**: Cyberpunk-inspired with neon accents

Switch themes in Settings > System > Theme

## 🚀 Deployment

### Deploy to Development

```bash
# Deploy CDK stack
make cdk-deploy-dev

# Build and push Docker image
make docker-build
make docker-push

# Trigger GitHub Actions deployment
git push origin main
```

### Deploy to Production

```bash
# Deploy CDK stack (with confirmation)
make cdk-deploy-prod

# Build and push Docker image
DOCKER_TAG=v1.0.0 make docker-push

# Manual deployment via GitHub Actions
gh workflow run deploy-web.yml -f environment=production -f image_tag=v1.0.0
```

### Post-Deployment Checklist

- [ ] Verify Cognito User Pool created
- [ ] Configure Google OAuth provider
- [ ] Create initial admin user
- [ ] Update frontend environment variables
- [ ] Test authentication flow
- [ ] Verify S3 bucket access
- [ ] Test GraphQL API connectivity
- [ ] Verify AgentCore endpoint
- [ ] Check CloudWatch logs
- [ ] Enable monitoring alarms

## 🧪 Testing

### Unit Tests

```bash
make test
```

### Integration Tests

```bash
make test-integration
```

### E2E Tests

```bash
make test-e2e
```

### Coverage Report

```bash
make test-coverage
```

## 📚 Documentation

- [Architecture Overview](docs/architecture/README.md)
- [CDK Deployment Guide](infra/cdk/README.md)
- [Docker Setup](infra/docker/README.md)
- [Database Schema](docs/database/bidopsai.mmd)
- [GraphQL Schema](docs/architecture/core-api/gql-schema.md)
- [Agent Flow Diagram](docs/architecture/agent-core/agent-flow-diagram.md)
- [Frontend Structure](docs/architecture/web-frontend/fe-folder-structure.md)

## 🤝 Contributing

This is a proprietary project. For authorized contributors:

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Follow project ESLint config
- **Prettier**: Auto-format on save
- **Commits**: Use conventional commits

## 🔒 Security

- AWS Cognito with MFA support
- Advanced Security Mode enabled
- HTTPS/TLS for all connections
- RBAC with granular permissions
- Input validation with Zod
- SQL injection protection
- XSS protection
- CSRF tokens
- Rate limiting (planned)

## 📄 License

Copyright © 2025 BidOps.AI. All rights reserved.

This is proprietary software. Unauthorized copying, modification, or distribution is strictly prohibited.

## 👥 Team

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Node.js, GraphQL, PostgreSQL
- **AI/ML**: AWS Bedrock, AgentCore, Knowledge Bases
- **Infrastructure**: AWS CDK, Docker, ECS
- **CI/CD**: GitHub Actions

## 📧 Support

For issues or questions:
- **Email**: support@bidopsai.com
- **Slack**: #bidopsai-support
- **Documentation**: [docs.bidopsai.com](https://docs.bidopsai.com)

---

Built with ❤️ by the BidOps.AI Team