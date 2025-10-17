#!/bin/bash
# =============================================================================
# BidOpsAI Agent-Core - Build and Push Docker Images to ECR
# =============================================================================
# This script builds Docker images for both supervisor agents and pushes them
# to Amazon ECR with semantic versioning tags.
#
# Usage:
#   ./build_and_push_to_ecr.sh [--workflow] [--ai-assistant] [--all]
#
# Examples:
#   ./build_and_push_to_ecr.sh --all                    # Build and push both
#   ./build_and_push_to_ecr.sh --workflow              # Build and push workflow only
#   ./build_and_push_to_ecr.sh --ai-assistant          # Build and push AI assistant only

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DOCKER_DIR="${PROJECT_ROOT}/../../infra/docker/agents-core"

# Load environment variables
if [ -f "${PROJECT_ROOT}/.env.development" ]; then
    source "${PROJECT_ROOT}/.env.development"
else
    echo "Error: .env.development file not found"
    exit 1
fi

# AWS Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"

# ECR Repository names
ECR_REPO_WORKFLOW="bidopsai/agent-core/workflow-supervisor"
ECR_REPO_AI_ASSISTANT="bidopsai/agent-core/ai-assistant-supervisor"

# Version tags from environment
VERSION_WORKFLOW="${APP_VERSION_WORKFLOW:-0.1.0}"
VERSION_AI_ASSISTANT="${APP_VERSION_AI_ASSISTANT:-0.1.0}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# -----------------------------------------------------------------------------
# Functions
# -----------------------------------------------------------------------------
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    log_success "AWS CLI is installed"
}

# Check if Docker is running
check_docker() {
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    log_success "Docker is running"
}

# Authenticate Docker with ECR
ecr_login() {
    log_info "Authenticating Docker with ECR..."
    aws ecr get-login-password --region "${AWS_REGION}" | \
        docker login --username AWS --password-stdin \
        "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    log_success "Successfully authenticated with ECR"
}

# Create ECR repository if it doesn't exist
create_ecr_repo_if_not_exists() {
    local repo_name=$1
    
    log_info "Checking if ECR repository exists: ${repo_name}"
    
    if ! aws ecr describe-repositories \
        --repository-names "${repo_name}" \
        --region "${AWS_REGION}" &> /dev/null; then
        
        log_warning "Repository ${repo_name} does not exist. Creating..."
        aws ecr create-repository \
            --repository-name "${repo_name}" \
            --region "${AWS_REGION}" \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256 \
            --tags Key=Project,Value=BidOpsAI Key=Component,Value=AgentCore
        log_success "Created ECR repository: ${repo_name}"
    else
        log_success "ECR repository exists: ${repo_name}"
    fi
}

# Build and push Docker image
build_and_push() {
    local supervisor_type=$1  # "workflow" or "ai_assistant"
    local ecr_repo=$2
    local version=$3
    local dockerfile_path="${DOCKER_DIR}/${supervisor_type}/Dockerfile"
    
    log_info "========================================"
    log_info "Building ${supervisor_type} supervisor"
    log_info "========================================"
    
    # Full ECR image URI
    local ecr_uri="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ecr_repo}"
    
    # Build the image
    log_info "Building Docker image from ${dockerfile_path}..."
    docker build \
        --file "${dockerfile_path}" \
        --tag "${ecr_uri}:${version}" \
        --tag "${ecr_uri}:latest" \
        --build-arg VERSION="${version}" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        "${PROJECT_ROOT}/../../"
    
    log_success "Successfully built image: ${ecr_uri}:${version}"
    
    # Push version tag
    log_info "Pushing image with version tag: ${version}..."
    docker push "${ecr_uri}:${version}"
    log_success "Successfully pushed: ${ecr_uri}:${version}"
    
    # Push latest tag
    log_info "Pushing image with latest tag..."
    docker push "${ecr_uri}:latest"
    log_success "Successfully pushed: ${ecr_uri}:latest"
    
    # Display image details
    log_info "Image pushed successfully:"
    log_info "  - ${ecr_uri}:${version}"
    log_info "  - ${ecr_uri}:latest"
}

# Display usage information
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Build and push BidOpsAI Agent-Core Docker images to Amazon ECR

OPTIONS:
    --workflow          Build and push workflow supervisor only
    --ai-assistant      Build and push AI assistant supervisor only
    --all               Build and push both supervisors (default)
    -h, --help          Show this help message

EXAMPLES:
    $0 --all                    # Build and push both supervisors
    $0 --workflow              # Build and push workflow supervisor only
    $0 --ai-assistant          # Build and push AI assistant supervisor only

ENVIRONMENT VARIABLES:
    APP_VERSION_WORKFLOW        Version tag for workflow supervisor (default: 0.1.0)
    APP_VERSION_AI_ASSISTANT    Version tag for AI assistant supervisor (default: 0.1.0)
    AWS_REGION                  AWS region (default: us-east-1)
    AWS_ACCOUNT_ID              AWS account ID (required)

EOF
}

# -----------------------------------------------------------------------------
# Main Script
# -----------------------------------------------------------------------------
main() {
    local build_workflow=false
    local build_ai_assistant=false
    
    # Parse command line arguments
    if [ $# -eq 0 ]; then
        build_workflow=true
        build_ai_assistant=true
    else
        while [ $# -gt 0 ]; do
            case "$1" in
                --workflow)
                    build_workflow=true
                    shift
                    ;;
                --ai-assistant)
                    build_ai_assistant=true
                    shift
                    ;;
                --all)
                    build_workflow=true
                    build_ai_assistant=true
                    shift
                    ;;
                -h|--help)
                    show_usage
                    exit 0
                    ;;
                *)
                    log_error "Unknown option: $1"
                    show_usage
                    exit 1
                    ;;
            esac
        done
    fi
    
    # Validate AWS_ACCOUNT_ID
    if [ -z "${AWS_ACCOUNT_ID}" ]; then
        log_error "AWS_ACCOUNT_ID is not set in .env.development"
        exit 1
    fi
    
    log_info "Starting Docker build and push process..."
    log_info "AWS Region: ${AWS_REGION}"
    log_info "AWS Account ID: ${AWS_ACCOUNT_ID}"
    
    # Pre-flight checks
    check_aws_cli
    check_docker
    ecr_login
    
    # Build and push workflow supervisor
    if [ "${build_workflow}" = true ]; then
        create_ecr_repo_if_not_exists "${ECR_REPO_WORKFLOW}"
        build_and_push "workflow" "${ECR_REPO_WORKFLOW}" "${VERSION_WORKFLOW}"
    fi
    
    # Build and push AI assistant supervisor
    if [ "${build_ai_assistant}" = true ]; then
        create_ecr_repo_if_not_exists "${ECR_REPO_AI_ASSISTANT}"
        build_and_push "ai_assistant" "${ECR_REPO_AI_ASSISTANT}" "${VERSION_AI_ASSISTANT}"
    fi
    
    log_success "========================================"
    log_success "All builds completed successfully!"
    log_success "========================================"
    
    if [ "${build_workflow}" = true ]; then
        log_info "Workflow Supervisor:"
        log_info "  Version: ${VERSION_WORKFLOW}"
        log_info "  URI: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_WORKFLOW}:${VERSION_WORKFLOW}"
    fi
    
    if [ "${build_ai_assistant}" = true ]; then
        log_info "AI Assistant Supervisor:"
        log_info "  Version: ${VERSION_AI_ASSISTANT}"
        log_info "  URI: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_AI_ASSISTANT}:${VERSION_AI_ASSISTANT}"
    fi
}

# Run main function
main "$@"