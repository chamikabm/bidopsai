#!/bin/bash

# Deployment script for bidops.ai web application
# Usage: ./scripts/deploy.sh [environment]
# Environments: staging, production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$PROJECT_ROOT/infra/docker"

# Default values
ENVIRONMENT="${1:-staging}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Environment-specific configuration
case $ENVIRONMENT in
  staging)
    ECS_CLUSTER="bidops-staging"
    ECS_SERVICE="bidops-web-service-staging"
    ECS_TASK_DEFINITION="bidops-web-task-staging"
    APP_URL="https://staging.bidops.ai"
    ;;
  production)
    ECS_CLUSTER="bidops-production"
    ECS_SERVICE="bidops-web-service"
    ECS_TASK_DEFINITION="bidops-web-task"
    APP_URL="https://app.bidops.ai"
    ;;
  *)
    echo -e "${RED}Error: Invalid environment '$ENVIRONMENT'${NC}"
    echo "Usage: $0 [staging|production]"
    exit 1
    ;;
esac

echo -e "${GREEN}=== bidops.ai Deployment Script ===${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "AWS Region: ${YELLOW}$AWS_REGION${NC}"
echo -e "ECS Cluster: ${YELLOW}$ECS_CLUSTER${NC}"
echo ""

# Function to check prerequisites
check_prerequisites() {
  echo -e "${GREEN}Checking prerequisites...${NC}"
  
  # Check if AWS CLI is installed
  if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
  fi
  
  # Check if Docker is installed
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
  fi
  
  # Check AWS credentials
  if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials are not configured${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✓ Prerequisites check passed${NC}"
  echo ""
}

# Function to build Docker image
build_image() {
  echo -e "${GREEN}Building Docker image...${NC}"
  
  cd "$PROJECT_ROOT"
  
  IMAGE_TAG="bidops-web:$ENVIRONMENT-$(date +%Y%m%d-%H%M%S)"
  
  docker build \
    -f "$DOCKER_DIR/apps/web/Dockerfile" \
    -t "$IMAGE_TAG" \
    .
  
  echo -e "${GREEN}✓ Docker image built: $IMAGE_TAG${NC}"
  echo ""
  
  echo "$IMAGE_TAG"
}

# Function to push image to ECR
push_to_ecr() {
  local IMAGE_TAG=$1
  
  echo -e "${GREEN}Pushing image to ECR...${NC}"
  
  # Get ECR repository URI
  ECR_REPO=$(aws ecr describe-repositories \
    --repository-names bidops-web \
    --region "$AWS_REGION" \
    --query 'repositories[0].repositoryUri' \
    --output text 2>/dev/null || echo "")
  
  if [ -z "$ECR_REPO" ]; then
    echo -e "${RED}Error: ECR repository 'bidops-web' not found${NC}"
    exit 1
  fi
  
  # Login to ECR
  aws ecr get-login-password --region "$AWS_REGION" | \
    docker login --username AWS --password-stdin "$ECR_REPO"
  
  # Tag and push image
  ECR_IMAGE="$ECR_REPO:$ENVIRONMENT-latest"
  docker tag "$IMAGE_TAG" "$ECR_IMAGE"
  docker push "$ECR_IMAGE"
  
  echo -e "${GREEN}✓ Image pushed to ECR: $ECR_IMAGE${NC}"
  echo ""
  
  echo "$ECR_IMAGE"
}

# Function to update ECS service
update_ecs_service() {
  local ECR_IMAGE=$1
  
  echo -e "${GREEN}Updating ECS service...${NC}"
  
  # Get current task definition
  TASK_DEF_ARN=$(aws ecs describe-task-definition \
    --task-definition "$ECS_TASK_DEFINITION" \
    --region "$AWS_REGION" \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)
  
  if [ -z "$TASK_DEF_ARN" ]; then
    echo -e "${RED}Error: Task definition '$ECS_TASK_DEFINITION' not found${NC}"
    exit 1
  fi
  
  # Download task definition
  aws ecs describe-task-definition \
    --task-definition "$ECS_TASK_DEFINITION" \
    --region "$AWS_REGION" \
    --query 'taskDefinition' > /tmp/task-definition.json
  
  # Update image in task definition
  jq --arg IMAGE "$ECR_IMAGE" \
    '.containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)' \
    /tmp/task-definition.json > /tmp/new-task-definition.json
  
  # Register new task definition
  NEW_TASK_DEF_ARN=$(aws ecs register-task-definition \
    --cli-input-json file:///tmp/new-task-definition.json \
    --region "$AWS_REGION" \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)
  
  echo -e "${GREEN}✓ New task definition registered: $NEW_TASK_DEF_ARN${NC}"
  
  # Update service
  aws ecs update-service \
    --cluster "$ECS_CLUSTER" \
    --service "$ECS_SERVICE" \
    --task-definition "$NEW_TASK_DEF_ARN" \
    --region "$AWS_REGION" \
    --force-new-deployment > /dev/null
  
  echo -e "${GREEN}✓ ECS service updated${NC}"
  echo ""
}

# Function to wait for deployment
wait_for_deployment() {
  echo -e "${GREEN}Waiting for deployment to complete...${NC}"
  
  aws ecs wait services-stable \
    --cluster "$ECS_CLUSTER" \
    --services "$ECS_SERVICE" \
    --region "$AWS_REGION"
  
  echo -e "${GREEN}✓ Deployment completed${NC}"
  echo ""
}

# Function to run health check
health_check() {
  echo -e "${GREEN}Running health check...${NC}"
  
  HEALTH_URL="$APP_URL/api/health"
  
  for i in {1..5}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
      echo -e "${GREEN}✓ Health check passed (HTTP $HTTP_CODE)${NC}"
      echo ""
      return 0
    fi
    
    echo -e "${YELLOW}Health check attempt $i/5 failed (HTTP $HTTP_CODE), retrying...${NC}"
    sleep 10
  done
  
  echo -e "${RED}✗ Health check failed after 5 attempts${NC}"
  return 1
}

# Function to rollback deployment
rollback() {
  echo -e "${YELLOW}Rolling back deployment...${NC}"
  
  # Get previous task definition
  PREVIOUS_TASK_DEF=$(aws ecs describe-services \
    --cluster "$ECS_CLUSTER" \
    --services "$ECS_SERVICE" \
    --region "$AWS_REGION" \
    --query 'services[0].deployments[1].taskDefinition' \
    --output text)
  
  if [ -n "$PREVIOUS_TASK_DEF" ] && [ "$PREVIOUS_TASK_DEF" != "None" ]; then
    aws ecs update-service \
      --cluster "$ECS_CLUSTER" \
      --service "$ECS_SERVICE" \
      --task-definition "$PREVIOUS_TASK_DEF" \
      --region "$AWS_REGION" \
      --force-new-deployment > /dev/null
    
    echo -e "${GREEN}✓ Rollback initiated to: $PREVIOUS_TASK_DEF${NC}"
  else
    echo -e "${RED}✗ No previous task definition found for rollback${NC}"
  fi
}

# Main deployment flow
main() {
  check_prerequisites
  
  # Confirmation for production
  if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}WARNING: You are about to deploy to PRODUCTION${NC}"
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
      echo -e "${RED}Deployment cancelled${NC}"
      exit 0
    fi
    echo ""
  fi
  
  # Build and push image
  IMAGE_TAG=$(build_image)
  ECR_IMAGE=$(push_to_ecr "$IMAGE_TAG")
  
  # Update ECS service
  update_ecs_service "$ECR_IMAGE"
  
  # Wait for deployment
  wait_for_deployment
  
  # Health check
  if health_check; then
    echo -e "${GREEN}=== Deployment Successful ===${NC}"
    echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
    echo -e "URL: ${YELLOW}$APP_URL${NC}"
    echo -e "Image: ${YELLOW}$ECR_IMAGE${NC}"
  else
    echo -e "${RED}=== Deployment Failed ===${NC}"
    echo -e "Health check failed. Consider rolling back."
    read -p "Do you want to rollback? (yes/no): " ROLLBACK_CONFIRM
    if [ "$ROLLBACK_CONFIRM" = "yes" ]; then
      rollback
    fi
    exit 1
  fi
}

# Run main function
main
