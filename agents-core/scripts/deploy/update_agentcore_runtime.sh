#!/bin/bash
# =============================================================================
# BidOpsAI Agent-Core - Update AgentCore Runtime with New Docker Images
# =============================================================================
# This script updates AWS Bedrock AgentCore Runtime deployments with the latest
# Docker images from ECR using the bedrock_agentcore_starter_toolkit CLI.
#
# Usage:
#   ./update_agentcore_runtime.sh [--workflow] [--ai-assistant] [--all]
#
# Examples:
#   ./update_agentcore_runtime.sh --all                    # Update both runtimes
#   ./update_agentcore_runtime.sh --workflow              # Update workflow only
#   ./update_agentcore_runtime.sh --ai-assistant          # Update AI assistant only

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

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

# AgentCore Runtime Names (should match CDK stack outputs)
RUNTIME_NAME_WORKFLOW="BidOpsAI-Workflow-Supervisor"
RUNTIME_NAME_AI_ASSISTANT="BidOpsAI-AI-Assistant-Supervisor"

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

# Check if bedrock_agentcore_starter_toolkit is installed
check_starter_toolkit() {
    if ! command -v bedrock-agentcore &> /dev/null; then
        log_error "bedrock_agentcore_starter_toolkit is not installed."
        log_info "Install it with: pip install bedrock-agentcore-starter-toolkit"
        exit 1
    fi
    log_success "bedrock_agentcore_starter_toolkit is installed"
}

# Get current runtime status
get_runtime_status() {
    local runtime_name=$1
    
    log_info "Checking runtime status: ${runtime_name}"
    
    local status=$(aws bedrock-agent-runtime describe-agent \
        --agent-name "${runtime_name}" \
        --region "${AWS_REGION}" \
        --query 'agentStatus' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    echo "${status}"
}

# Wait for runtime to be ready
wait_for_runtime_ready() {
    local runtime_name=$1
    local max_wait=300  # 5 minutes
    local wait_interval=10
    local elapsed=0
    
    log_info "Waiting for runtime to be ready: ${runtime_name}"
    
    while [ ${elapsed} -lt ${max_wait} ]; do
        local status=$(get_runtime_status "${runtime_name}")
        
        if [ "${status}" == "AVAILABLE" ]; then
            log_success "Runtime is ready: ${runtime_name}"
            return 0
        elif [ "${status}" == "FAILED" ]; then
            log_error "Runtime deployment failed: ${runtime_name}"
            return 1
        fi
        
        log_info "Runtime status: ${status}. Waiting ${wait_interval}s..."
        sleep ${wait_interval}
        elapsed=$((elapsed + wait_interval))
    done
    
    log_error "Timeout waiting for runtime to be ready: ${runtime_name}"
    return 1
}

# Update AgentCore Runtime
update_runtime() {
    local supervisor_type=$1  # "workflow" or "ai-assistant"
    local runtime_name=$2
    local ecr_repo=$3
    local version=$4
    
    log_info "========================================"
    log_info "Updating ${supervisor_type} runtime"
    log_info "========================================"
    
    # Full ECR image URI
    local ecr_uri="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ecr_repo}:${version}"
    
    log_info "Runtime Name: ${runtime_name}"
    log_info "Image URI: ${ecr_uri}"
    
    # Check if runtime exists
    local current_status=$(get_runtime_status "${runtime_name}")
    
    if [ "${current_status}" == "NOT_FOUND" ]; then
        log_error "Runtime not found: ${runtime_name}"
        log_info "Please create the runtime first using CDK deployment"
        return 1
    fi
    
    # Update the runtime using bedrock_agentcore_starter_toolkit
    log_info "Updating runtime with new image..."
    
    bedrock-agentcore update-runtime \
        --runtime-name "${runtime_name}" \
        --image-uri "${ecr_uri}" \
        --region "${AWS_REGION}" \
        --wait
    
    if [ $? -eq 0 ]; then
        log_success "Successfully initiated runtime update: ${runtime_name}"
        
        # Wait for the update to complete
        if wait_for_runtime_ready "${runtime_name}"; then
            log_success "Runtime update completed: ${runtime_name}"
            
            # Display runtime details
            log_info "Runtime Details:"
            aws bedrock-agent-runtime describe-agent \
                --agent-name "${runtime_name}" \
                --region "${AWS_REGION}" \
                --query '{Name:agentName,Status:agentStatus,Version:agentVersion,UpdatedAt:lastUpdatedDateTime}' \
                --output table
            
            return 0
        else
            log_error "Failed to complete runtime update: ${runtime_name}"
            return 1
        fi
    else
        log_error "Failed to initiate runtime update: ${runtime_name}"
        return 1
    fi
}

# Validate image exists in ECR
validate_ecr_image() {
    local ecr_repo=$1
    local version=$2
    
    log_info "Validating image exists in ECR: ${ecr_repo}:${version}"
    
    local image_exists=$(aws ecr describe-images \
        --repository-name "${ecr_repo}" \
        --image-ids imageTag="${version}" \
        --region "${AWS_REGION}" \
        --query 'imageDetails[0].imageTags[0]' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "${image_exists}" == "NOT_FOUND" ]; then
        log_error "Image not found in ECR: ${ecr_repo}:${version}"
        log_info "Please build and push the image first using build_and_push_to_ecr.sh"
        return 1
    fi
    
    log_success "Image exists in ECR: ${ecr_repo}:${version}"
    return 0
}

# Display usage information
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Update BidOpsAI AgentCore Runtime deployments with latest Docker images

OPTIONS:
    --workflow          Update workflow supervisor runtime only
    --ai-assistant      Update AI assistant supervisor runtime only
    --all               Update both runtimes (default)
    -h, --help          Show this help message

EXAMPLES:
    $0 --all                    # Update both runtimes
    $0 --workflow              # Update workflow runtime only
    $0 --ai-assistant          # Update AI assistant runtime only

PREREQUISITES:
    1. Docker images must be built and pushed to ECR first
       Run: ./build_and_push_to_ecr.sh --all
    
    2. AgentCore Runtimes must be deployed via CDK
       Run: cd infra/cdk && cdk deploy BidOpsAIAgentCoreStack
    
    3. bedrock_agentcore_starter_toolkit must be installed
       Run: pip install bedrock-agentcore-starter-toolkit

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
    local update_workflow=false
    local update_ai_assistant=false
    
    # Parse command line arguments
    if [ $# -eq 0 ]; then
        update_workflow=true
        update_ai_assistant=true
    else
        while [ $# -gt 0 ]; do
            case "$1" in
                --workflow)
                    update_workflow=true
                    shift
                    ;;
                --ai-assistant)
                    update_ai_assistant=true
                    shift
                    ;;
                --all)
                    update_workflow=true
                    update_ai_assistant=true
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
    
    log_info "Starting AgentCore Runtime update process..."
    log_info "AWS Region: ${AWS_REGION}"
    log_info "AWS Account ID: ${AWS_ACCOUNT_ID}"
    
    # Pre-flight checks
    check_aws_cli
    check_starter_toolkit
    
    local all_success=true
    
    # Update workflow supervisor runtime
    if [ "${update_workflow}" = true ]; then
        if validate_ecr_image "${ECR_REPO_WORKFLOW}" "${VERSION_WORKFLOW}"; then
            if ! update_runtime "workflow" "${RUNTIME_NAME_WORKFLOW}" "${ECR_REPO_WORKFLOW}" "${VERSION_WORKFLOW}"; then
                all_success=false
            fi
        else
            all_success=false
        fi
    fi
    
    # Update AI assistant supervisor runtime
    if [ "${update_ai_assistant}" = true ]; then
        if validate_ecr_image "${ECR_REPO_AI_ASSISTANT}" "${VERSION_AI_ASSISTANT}"; then
            if ! update_runtime "ai-assistant" "${RUNTIME_NAME_AI_ASSISTANT}" "${ECR_REPO_AI_ASSISTANT}" "${VERSION_AI_ASSISTANT}"; then
                all_success=false
            fi
        else
            all_success=false
        fi
    fi
    
    if [ "${all_success}" = true ]; then
        log_success "========================================"
        log_success "All runtime updates completed successfully!"
        log_success "========================================"
        
        if [ "${update_workflow}" = true ]; then
            log_info "Workflow Supervisor Runtime:"
            log_info "  Name: ${RUNTIME_NAME_WORKFLOW}"
            log_info "  Version: ${VERSION_WORKFLOW}"
        fi
        
        if [ "${update_ai_assistant}" = true ]; then
            log_info "AI Assistant Supervisor Runtime:"
            log_info "  Name: ${RUNTIME_NAME_AI_ASSISTANT}"
            log_info "  Version: ${VERSION_AI_ASSISTANT}"
        fi
    else
        log_error "========================================"
        log_error "Some runtime updates failed!"
        log_error "========================================"
        exit 1
    fi
}

# Run main function
main "$@"