#!/bin/bash

###############################################################################
# Deploy Docker Images to ECR
#
# This script builds and pushes Docker images for both supervisor agents
# to their respective ECR repositories.
#
# Usage:
#   ./deploy-to-ecr.sh [environment] [agent_type]
#
# Arguments:
#   environment: dev, staging, or prod (default: dev)
#   agent_type: workflow, ai-assistant, or all (default: all)
#
# Environment Variables (must be set in .env or exported):
#   APP_VERSION_WORKFLOW: Semantic version for workflow agent (e.g., 1.0.0)
#   APP_VERSION_AI_ASSISTANT: Semantic version for AI assistant (e.g., 1.0.0)
#   AWS_ACCOUNT_ID: AWS account ID
#   AWS_REGION: AWS region (default: us-east-1)
###############################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="${1:-dev}"
AGENT_TYPE="${2:-all}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
CDK_DIR="${SCRIPT_DIR}/.."

# Load environment variables from .env if it exists
if [ -f "${PROJECT_ROOT}/.env" ]; then
    echo -e "${GREEN}Loading environment variables from .env${NC}"
    export $(grep -v '^#' "${PROJECT_ROOT}/.env" | xargs)
fi

# Validate required environment variables
if [ -z "${AWS_ACCOUNT_ID}" ]; then
    echo -e "${RED}ERROR: AWS_ACCOUNT_ID not set${NC}"
    echo "Please set AWS_ACCOUNT_ID environment variable or add it to .env file"
    exit 1
fi

if [ -z "${APP_VERSION_WORKFLOW}" ] && [ "${AGENT_TYPE}" != "ai-assistant" ]; then
    echo -e "${RED}ERROR: APP_VERSION_WORKFLOW not set${NC}"
    echo "Please set APP_VERSION_WORKFLOW environment variable or add it to .env file"
    exit 1
fi

if [ -z "${APP_VERSION_AI_ASSISTANT}" ] && [ "${AGENT_TYPE}" != "workflow" ]; then
    echo -e "${RED}ERROR: APP_VERSION_AI_ASSISTANT not set${NC}"
    echo "Please set APP_VERSION_AI_ASSISTANT environment variable or add it to .env file"
    exit 1
fi

# ECR repository names
WORKFLOW_REPO="bidopsai-workflow-agent-${ENVIRONMENT}"
AI_ASSISTANT_REPO="bidopsai-ai-assistant-agent-${ENVIRONMENT}"

# ECR login
echo -e "${GREEN}Logging in to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | \
    docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

###############################################################################
# Function to build and push Docker image
###############################################################################
build_and_push() {
    local AGENT_NAME=$1
    local REPO_NAME=$2
    local VERSION=$3
    local DOCKERFILE_PATH=$4
    local BUILD_CONTEXT=$5
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Building ${AGENT_NAME}${NC}"
    echo -e "${GREEN}========================================${NC}"
    
    # ECR repository URI
    local REPO_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}"
    
    # Tags
    local VERSION_TAG="${REPO_URI}:v${VERSION}"
    local LATEST_TAG="${REPO_URI}:latest"
    local ENV_TAG="${REPO_URI}:${ENVIRONMENT}"
    
    echo "Repository: ${REPO_NAME}"
    echo "Version: ${VERSION}"
    echo "Tags: v${VERSION}, latest, ${ENVIRONMENT}"
    echo ""
    
    # Build the Docker image
    echo -e "${YELLOW}Building Docker image...${NC}"
    docker build \
        --platform linux/amd64 \
        -t ${VERSION_TAG} \
        -t ${LATEST_TAG} \
        -t ${ENV_TAG} \
        -f ${DOCKERFILE_PATH} \
        ${BUILD_CONTEXT}
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: Docker build failed for ${AGENT_NAME}${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Build successful!${NC}"
    echo ""
    
    # Push all tags
    echo -e "${YELLOW}Pushing images to ECR...${NC}"
    docker push ${VERSION_TAG}
    docker push ${LATEST_TAG}
    docker push ${ENV_TAG}
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: Docker push failed for ${AGENT_NAME}${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Push successful!${NC}"
    echo -e "${GREEN}Image URIs:${NC}"
    echo "  ${VERSION_TAG}"
    echo "  ${LATEST_TAG}"
    echo "  ${ENV_TAG}"
    echo ""
}

###############################################################################
# Build and push images based on AGENT_TYPE
###############################################################################

if [ "${AGENT_TYPE}" == "workflow" ] || [ "${AGENT_TYPE}" == "all" ]; then
    build_and_push \
        "Workflow Supervisor Agent" \
        "${WORKFLOW_REPO}" \
        "${APP_VERSION_WORKFLOW}" \
        "${PROJECT_ROOT}/infra/docker/agents-core/workflow/Dockerfile" \
        "${PROJECT_ROOT}"
fi

if [ "${AGENT_TYPE}" == "ai-assistant" ] || [ "${AGENT_TYPE}" == "all" ]; then
    build_and_push \
        "AI Assistant Supervisor Agent" \
        "${AI_ASSISTANT_REPO}" \
        "${APP_VERSION_AI_ASSISTANT}" \
        "${PROJECT_ROOT}/infra/docker/agents-core/ai_assistant/Dockerfile" \
        "${PROJECT_ROOT}"
fi

###############################################################################
# Summary
###############################################################################
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo "Environment: ${ENVIRONMENT}"
echo "Region: ${AWS_REGION}"
echo "Account: ${AWS_ACCOUNT_ID}"

if [ "${AGENT_TYPE}" == "workflow" ] || [ "${AGENT_TYPE}" == "all" ]; then
    echo ""
    echo "Workflow Agent:"
    echo "  Version: ${APP_VERSION_WORKFLOW}"
    echo "  Repository: ${WORKFLOW_REPO}"
fi

if [ "${AGENT_TYPE}" == "ai-assistant" ] || [ "${AGENT_TYPE}" == "all" ]; then
    echo ""
    echo "AI Assistant Agent:"
    echo "  Version: ${APP_VERSION_AI_ASSISTANT}"
    echo "  Repository: ${AI_ASSISTANT_REPO}"
fi

echo ""
echo -e "${GREEN}All images deployed successfully!${NC}"