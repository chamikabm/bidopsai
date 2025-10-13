# BidOps.AI Makefile
# Comprehensive build, test, and deployment commands

.PHONY: help install install-web install-cdk clean clean-all
.PHONY: dev dev-docker build test lint format
.PHONY: docker-build docker-dev docker-push docker-stop docker-clean
.PHONY: cdk-synth cdk-deploy cdk-deploy-dev cdk-deploy-staging cdk-deploy-prod cdk-destroy
.PHONY: deploy-web check-env

# Default target
.DEFAULT_GOAL := help

# Variables
DOCKER_REGISTRY ?= your-ecr-registry.amazonaws.com
DOCKER_IMAGE_NAME ?= bidopsai-web
DOCKER_TAG ?= latest
AWS_REGION ?= us-east-1
AWS_ACCOUNT_ID ?= $(shell aws sts get-caller-identity --query Account --output text)
CDK_ENV ?= dev

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ Help

help: ## Display this help message
	@echo "$(BLUE)BidOps.AI - Build & Deployment Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(GREEN)<target>$(NC)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Installation

install: install-web install-cdk ## Install all dependencies (web + cdk)
	@echo "$(GREEN)✓ All dependencies installed$(NC)"

install-web: ## Install frontend dependencies
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd apps/web && npm install
	@echo "$(GREEN)✓ Frontend dependencies installed$(NC)"

install-cdk: ## Install CDK dependencies
	@echo "$(BLUE)Installing CDK dependencies...$(NC)"
	cd infra/cdk && npm install
	@echo "$(GREEN)✓ CDK dependencies installed$(NC)"

##@ Development

dev: ## Run development server (Next.js)
	@echo "$(BLUE)Starting development server...$(NC)"
	cd apps/web && npm run dev

dev-docker: ## Run development server in Docker with hot reload
	@echo "$(BLUE)Starting Docker development environment...$(NC)"
	docker-compose -f infra/docker/docker-compose.dev.yml up

build: ## Build for production
	@echo "$(BLUE)Building for production...$(NC)"
	cd apps/web && npm run build
	@echo "$(GREEN)✓ Build completed$(NC)"

test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	cd apps/web && npm test
	@echo "$(GREEN)✓ Tests completed$(NC)"

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	cd apps/web && npm test -- --watch

test-coverage: ## Run tests with coverage report
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	cd apps/web && npm test -- --coverage

lint: ## Run ESLint
	@echo "$(BLUE)Running linter...$(NC)"
	cd apps/web && npm run lint
	@echo "$(GREEN)✓ Linting completed$(NC)"

lint-fix: ## Fix ESLint errors automatically
	@echo "$(BLUE)Fixing linting errors...$(NC)"
	cd apps/web && npm run lint -- --fix
	@echo "$(GREEN)✓ Linting errors fixed$(NC)"

format: ## Format code with Prettier
	@echo "$(BLUE)Formatting code...$(NC)"
	cd apps/web && npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"
	@echo "$(GREEN)✓ Code formatted$(NC)"

type-check: ## Run TypeScript type checking
	@echo "$(BLUE)Running type check...$(NC)"
	cd apps/web && npx tsc --noEmit
	@echo "$(GREEN)✓ Type check completed$(NC)"

##@ Docker

docker-build: ## Build production Docker image
	@echo "$(BLUE)Building Docker image...$(NC)"
	docker build -f infra/docker/apps/web/Dockerfile \
		-t $(DOCKER_IMAGE_NAME):$(DOCKER_TAG) \
		-t $(DOCKER_IMAGE_NAME):latest \
		--build-arg NODE_VERSION=24 \
		apps/web
	@echo "$(GREEN)✓ Docker image built: $(DOCKER_IMAGE_NAME):$(DOCKER_TAG)$(NC)"

docker-build-dev: ## Build development Docker image
	@echo "$(BLUE)Building development Docker image...$(NC)"
	docker build -f infra/docker/apps/web/Dockerfile.dev \
		-t $(DOCKER_IMAGE_NAME):dev \
		apps/web
	@echo "$(GREEN)✓ Development Docker image built$(NC)"

docker-run: ## Run Docker container (production)
	@echo "$(BLUE)Running Docker container...$(NC)"
	docker run -d \
		--name bidopsai-web \
		-p 3000:3000 \
		--env-file apps/web/.env.local \
		$(DOCKER_IMAGE_NAME):$(DOCKER_TAG)
	@echo "$(GREEN)✓ Container started at http://localhost:3000$(NC)"

docker-dev: docker-build-dev ## Run Docker container (development with hot reload)
	@echo "$(BLUE)Starting development container...$(NC)"
	docker-compose -f infra/docker/docker-compose.dev.yml up --build

docker-stop: ## Stop running Docker containers
	@echo "$(BLUE)Stopping Docker containers...$(NC)"
	docker-compose -f infra/docker/docker-compose.dev.yml down || true
	docker stop bidopsai-web 2>/dev/null || true
	docker rm bidopsai-web 2>/dev/null || true
	@echo "$(GREEN)✓ Containers stopped$(NC)"

docker-push: check-env docker-build ## Push Docker image to ECR
	@echo "$(BLUE)Logging into ECR...$(NC)"
	aws ecr get-login-password --region $(AWS_REGION) | \
		docker login --username AWS --password-stdin $(DOCKER_REGISTRY)
	
	@echo "$(BLUE)Tagging image for ECR...$(NC)"
	docker tag $(DOCKER_IMAGE_NAME):$(DOCKER_TAG) \
		$(DOCKER_REGISTRY)/$(DOCKER_IMAGE_NAME):$(DOCKER_TAG)
	docker tag $(DOCKER_IMAGE_NAME):$(DOCKER_TAG) \
		$(DOCKER_REGISTRY)/$(DOCKER_IMAGE_NAME):latest
	
	@echo "$(BLUE)Pushing image to ECR...$(NC)"
	docker push $(DOCKER_REGISTRY)/$(DOCKER_IMAGE_NAME):$(DOCKER_TAG)
	docker push $(DOCKER_REGISTRY)/$(DOCKER_IMAGE_NAME):latest
	@echo "$(GREEN)✓ Image pushed to ECR$(NC)"

docker-clean: ## Remove Docker images and containers
	@echo "$(BLUE)Cleaning Docker resources...$(NC)"
	docker-compose -f infra/docker/docker-compose.dev.yml down -v --rmi all || true
	docker rmi $(DOCKER_IMAGE_NAME):$(DOCKER_TAG) 2>/dev/null || true
	docker rmi $(DOCKER_IMAGE_NAME):latest 2>/dev/null || true
	docker rmi $(DOCKER_IMAGE_NAME):dev 2>/dev/null || true
	@echo "$(GREEN)✓ Docker resources cleaned$(NC)"

##@ AWS CDK

cdk-bootstrap: check-env ## Bootstrap CDK in AWS account
	@echo "$(BLUE)Bootstrapping CDK...$(NC)"
	cd infra/cdk && cdk bootstrap aws://$(AWS_ACCOUNT_ID)/$(AWS_REGION)
	@echo "$(GREEN)✓ CDK bootstrapped$(NC)"

cdk-synth: ## Synthesize CloudFormation templates
	@echo "$(BLUE)Synthesizing CDK stacks...$(NC)"
	cd infra/cdk && npm run synth
	@echo "$(GREEN)✓ Synthesis completed$(NC)"

cdk-diff: ## Show CDK stack differences
	@echo "$(BLUE)Showing stack differences...$(NC)"
	cd infra/cdk && npm run diff

cdk-deploy-cognito-dev: ## Deploy Cognito stack to development
	@echo "$(BLUE)Deploying Cognito to development...$(NC)"
	cd infra/cdk && cdk deploy BidOpsAI-Cognito-dev --context environment=dev --require-approval never
	@echo "$(GREEN)✓ Cognito deployed to development$(NC)"

cdk-deploy-s3-dev: ## Deploy S3 stack to development
	@echo "$(BLUE)Deploying S3 to development...$(NC)"
	cd infra/cdk && cdk deploy BidOpsAI-S3SourceBucket-dev --context environment=dev --require-approval never
	@echo "$(GREEN)✓ S3 deployed to development$(NC)"

cdk-deploy-dev: cdk-deploy-cognito-dev cdk-deploy-s3-dev ## Deploy all CDK stacks to development
	@echo "$(GREEN)✓ All stacks deployed to development$(NC)"

cdk-deploy-cognito-staging: ## Deploy Cognito stack to staging
	@echo "$(BLUE)Deploying Cognito to staging...$(NC)"
	cd infra/cdk && cdk deploy BidOpsAI-Cognito-staging --context environment=staging --require-approval never
	@echo "$(GREEN)✓ Cognito deployed to staging$(NC)"

cdk-deploy-s3-staging: ## Deploy S3 stack to staging
	@echo "$(BLUE)Deploying S3 to staging...$(NC)"
	cd infra/cdk && cdk deploy BidOpsAI-S3SourceBucket-staging --context environment=staging --require-approval never
	@echo "$(GREEN)✓ S3 deployed to staging$(NC)"

cdk-deploy-staging: cdk-deploy-cognito-staging cdk-deploy-s3-staging ## Deploy all CDK stacks to staging
	@echo "$(GREEN)✓ All stacks deployed to staging$(NC)"

cdk-deploy-cognito-prod: ## Deploy Cognito stack to production
	@echo "$(YELLOW)⚠ WARNING: Deploying Cognito to PRODUCTION$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to cancel, or wait 5 seconds to continue...$(NC)"
	@sleep 5
	@echo "$(BLUE)Deploying Cognito to production...$(NC)"
	cd infra/cdk && cdk deploy BidOpsAI-Cognito-prod --context environment=prod
	@echo "$(GREEN)✓ Cognito deployed to production$(NC)"

cdk-deploy-s3-prod: ## Deploy S3 stack to production
	@echo "$(YELLOW)⚠ WARNING: Deploying S3 to PRODUCTION$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to cancel, or wait 5 seconds to continue...$(NC)"
	@sleep 5
	@echo "$(BLUE)Deploying S3 to production...$(NC)"
	cd infra/cdk && cdk deploy BidOpsAI-S3SourceBucket-prod --context environment=prod
	@echo "$(GREEN)✓ S3 deployed to production$(NC)"

cdk-deploy-prod: cdk-deploy-cognito-prod cdk-deploy-s3-prod ## Deploy all CDK stacks to production
	@echo "$(GREEN)✓ All stacks deployed to production$(NC)"

cdk-destroy: ## Destroy CDK stack (specify environment with CDK_ENV=dev)
	@echo "$(RED)⚠ WARNING: This will destroy the $(CDK_ENV) stack$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to cancel, or wait 5 seconds to continue...$(NC)"
	@sleep 5
	@echo "$(BLUE)Destroying stack...$(NC)"
	cd infra/cdk && cdk destroy --context environment=$(CDK_ENV) --force
	@echo "$(GREEN)✓ Stack destroyed$(NC)"

cdk-outputs-cognito: ## Get Cognito stack outputs
	@echo "$(BLUE)Fetching Cognito stack outputs...$(NC)"
	aws cloudformation describe-stacks \
		--stack-name BidOpsAI-Cognito-$(CDK_ENV) \
		--query 'Stacks[0].Outputs' \
		--output table

cdk-outputs-s3: ## Get S3 stack outputs
	@echo "$(BLUE)Fetching S3 stack outputs...$(NC)"
	aws cloudformation describe-stacks \
		--stack-name BidOpsAI-S3SourceBucket-$(CDK_ENV) \
		--query 'Stacks[0].Outputs' \
		--output table

cdk-outputs: cdk-outputs-cognito cdk-outputs-s3 ## Get all CDK stack outputs
	@echo "$(GREEN)✓ All stack outputs displayed$(NC)"

##@ Deployment

deploy-web: ## Trigger GitHub Actions deployment workflow
	@echo "$(BLUE)Triggering deployment via GitHub Actions...$(NC)"
	@echo "$(YELLOW)Ensure you've pushed your changes to the main branch$(NC)"
	@echo "$(YELLOW)GitHub Actions will automatically deploy to ECS$(NC)"
	@echo ""
	@echo "To manually trigger:"
	@echo "  gh workflow run deploy-web.yml"
	@echo ""
	@echo "To view deployment status:"
	@echo "  gh run list --workflow=deploy-web.yml"

deploy-all: cdk-deploy-dev docker-push ## Deploy CDK + Docker image
	@echo "$(GREEN)✓ Full deployment completed$(NC)"

##@ Utilities

check-env: ## Check required environment variables
	@if [ -z "$(AWS_ACCOUNT_ID)" ]; then \
		echo "$(RED)✗ AWS_ACCOUNT_ID not set. Please configure AWS CLI$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ Environment check passed$(NC)"
	@echo "  AWS Account: $(AWS_ACCOUNT_ID)"
	@echo "  AWS Region: $(AWS_REGION)"

setup-env: ## Create .env.local from .env.example
	@echo "$(BLUE)Setting up environment files...$(NC)"
	@if [ ! -f apps/web/.env.local ]; then \
		cp apps/web/.env.example apps/web/.env.local; \
		echo "$(GREEN)✓ Created apps/web/.env.local$(NC)"; \
		echo "$(YELLOW)⚠ Please update with your actual values$(NC)"; \
	else \
		echo "$(YELLOW)⚠ apps/web/.env.local already exists$(NC)"; \
	fi

clean: ## Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	cd apps/web && rm -rf .next out dist node_modules/.cache
	cd infra/cdk && rm -rf cdk.out dist
	@echo "$(GREEN)✓ Build artifacts cleaned$(NC)"

clean-all: clean docker-clean ## Clean everything (artifacts + Docker)
	@echo "$(BLUE)Cleaning all dependencies...$(NC)"
	cd apps/web && rm -rf node_modules
	cd infra/cdk && rm -rf node_modules
	@echo "$(GREEN)✓ Everything cleaned$(NC)"

logs-docker: ## View Docker container logs
	@echo "$(BLUE)Docker container logs:$(NC)"
	docker logs -f bidopsai-web

logs-ecs: ## View ECS task logs (requires AWS CLI)
	@echo "$(BLUE)Fetching ECS logs...$(NC)"
	aws logs tail /ecs/bidopsai-web --follow --format short

status: ## Show project status
	@echo "$(BLUE)BidOps.AI Project Status$(NC)"
	@echo ""
	@echo "$(GREEN)Frontend:$(NC)"
	@if [ -d apps/web/node_modules ]; then echo "  ✓ Dependencies installed"; else echo "  ✗ Dependencies not installed"; fi
	@if [ -d apps/web/.next ]; then echo "  ✓ Build exists"; else echo "  ○ Not built"; fi
	@echo ""
	@echo "$(GREEN)CDK:$(NC)"
	@if [ -d infra/cdk/node_modules ]; then echo "  ✓ Dependencies installed"; else echo "  ✗ Dependencies not installed"; fi
	@if [ -d infra/cdk/cdk.out ]; then echo "  ✓ Synthesized"; else echo "  ○ Not synthesized"; fi
	@echo ""
	@echo "$(GREEN)Docker:$(NC)"
	@if docker images | grep -q $(DOCKER_IMAGE_NAME); then echo "  ✓ Image built"; else echo "  ○ Image not built"; fi
	@if docker ps | grep -q bidopsai-web; then echo "  ✓ Container running"; else echo "  ○ Container not running"; fi

##@ Quick Start

quick-start: install setup-env cdk-deploy-dev ## Quick setup for new developers
	@echo ""
	@echo "$(GREEN)✓ Quick start completed!$(NC)"
	@echo ""
	@echo "$(BLUE)Next steps:$(NC)"
	@echo "  1. Update apps/web/.env.local and services/core-api/.env.development with CDK outputs"
	@echo "  2. Run 'make dev-docker' to start full stack with Docker"
	@echo "  3. Visit http://localhost:3000 (frontend) and http://localhost:4000/graphql (API)"
	@echo ""
	@echo "$(BLUE)Get CDK outputs:$(NC)"
	@echo "  make cdk-outputs CDK_ENV=dev"

version: ## Show versions of tools
	@echo "$(BLUE)Tool Versions:$(NC)"
	@node --version | sed 's/^/  Node: /'
	@npm --version | sed 's/^/  NPM: /'
	@docker --version | sed 's/^/  /'
	@aws --version | sed 's/^/  /'
	@cdk --version 2>/dev/null | sed 's/^/  CDK: /' || echo "  CDK: Not installed"