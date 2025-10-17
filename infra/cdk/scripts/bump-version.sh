#!/bin/bash

###############################################################################
# Bump Version Script
#
# This script helps manage semantic versioning for the agent deployments.
# It updates the version numbers in .env files and creates git tags.
#
# Usage:
#   ./bump-version.sh [agent_type] [bump_type]
#
# Arguments:
#   agent_type: workflow, ai-assistant, or both (default: both)
#   bump_type: major, minor, or patch (default: patch)
#
# Examples:
#   ./bump-version.sh workflow patch    # Bump workflow patch version
#   ./bump-version.sh ai-assistant minor # Bump AI assistant minor version
#   ./bump-version.sh both major        # Bump both major versions
#
# The script will:
#   1. Read current version from .env
#   2. Increment version based on bump_type
#   3. Update .env file
#   4. Create git tag (optional)
#   5. Display next steps
###############################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
AGENT_TYPE="${1:-both}"
BUMP_TYPE="${2:-patch}"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"

# Validate arguments
if [[ ! "${AGENT_TYPE}" =~ ^(workflow|ai-assistant|both)$ ]]; then
    echo -e "${RED}ERROR: Invalid agent_type '${AGENT_TYPE}'${NC}"
    echo "Valid options: workflow, ai-assistant, both"
    exit 1
fi

if [[ ! "${BUMP_TYPE}" =~ ^(major|minor|patch)$ ]]; then
    echo -e "${RED}ERROR: Invalid bump_type '${BUMP_TYPE}'${NC}"
    echo "Valid options: major, minor, patch"
    exit 1
fi

# Check if .env file exists
if [ ! -f "${ENV_FILE}" ]; then
    echo -e "${RED}ERROR: .env file not found at ${ENV_FILE}${NC}"
    echo "Please create a .env file with APP_VERSION_WORKFLOW and APP_VERSION_AI_ASSISTANT"
    exit 1
fi

###############################################################################
# Function to parse version string
###############################################################################
parse_version() {
    local VERSION=$1
    local MAJOR=$(echo $VERSION | cut -d. -f1)
    local MINOR=$(echo $VERSION | cut -d. -f2)
    local PATCH=$(echo $VERSION | cut -d. -f3)
    
    echo "${MAJOR} ${MINOR} ${PATCH}"
}

###############################################################################
# Function to bump version
###############################################################################
bump_version() {
    local CURRENT_VERSION=$1
    local BUMP_TYPE=$2
    
    read MAJOR MINOR PATCH <<< $(parse_version ${CURRENT_VERSION})
    
    case ${BUMP_TYPE} in
        major)
            MAJOR=$((MAJOR + 1))
            MINOR=0
            PATCH=0
            ;;
        minor)
            MINOR=$((MINOR + 1))
            PATCH=0
            ;;
        patch)
            PATCH=$((PATCH + 1))
            ;;
    esac
    
    echo "${MAJOR}.${MINOR}.${PATCH}"
}

###############################################################################
# Function to update .env file
###############################################################################
update_env_file() {
    local VAR_NAME=$1
    local NEW_VERSION=$2
    
    # Create backup
    cp "${ENV_FILE}" "${ENV_FILE}.backup"
    
    # Update version in .env file
    if grep -q "^${VAR_NAME}=" "${ENV_FILE}"; then
        # Variable exists, update it
        sed -i.tmp "s/^${VAR_NAME}=.*/${VAR_NAME}=${NEW_VERSION}/" "${ENV_FILE}"
        rm "${ENV_FILE}.tmp"
    else
        # Variable doesn't exist, add it
        echo "${VAR_NAME}=${NEW_VERSION}" >> "${ENV_FILE}"
    fi
    
    echo -e "${GREEN}Updated ${VAR_NAME} to ${NEW_VERSION} in .env${NC}"
}

###############################################################################
# Function to create git tag
###############################################################################
create_git_tag() {
    local TAG_NAME=$1
    local TAG_MESSAGE=$2
    
    echo ""
    echo -e "${YELLOW}Do you want to create a git tag '${TAG_NAME}'? (y/n)${NC}"
    read -r RESPONSE
    
    if [[ "${RESPONSE}" =~ ^[Yy]$ ]]; then
        if git rev-parse "${TAG_NAME}" >/dev/null 2>&1; then
            echo -e "${YELLOW}WARNING: Tag '${TAG_NAME}' already exists${NC}"
            echo -e "${YELLOW}Do you want to force update it? (y/n)${NC}"
            read -r FORCE_RESPONSE
            
            if [[ "${FORCE_RESPONSE}" =~ ^[Yy]$ ]]; then
                git tag -fa "${TAG_NAME}" -m "${TAG_MESSAGE}"
                echo -e "${GREEN}Git tag '${TAG_NAME}' updated${NC}"
            else
                echo -e "${YELLOW}Skipped tag creation${NC}"
            fi
        else
            git tag -a "${TAG_NAME}" -m "${TAG_MESSAGE}"
            echo -e "${GREEN}Git tag '${TAG_NAME}' created${NC}"
        fi
        
        echo ""
        echo -e "${YELLOW}Do you want to push the tag to remote? (y/n)${NC}"
        read -r PUSH_RESPONSE
        
        if [[ "${PUSH_RESPONSE}" =~ ^[Yy]$ ]]; then
            git push origin "${TAG_NAME}" --force
            echo -e "${GREEN}Git tag pushed to remote${NC}"
        fi
    else
        echo -e "${YELLOW}Skipped git tag creation${NC}"
    fi
}

###############################################################################
# Main execution
###############################################################################

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Version Bump Tool${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Load current versions from .env
source "${ENV_FILE}"

WORKFLOW_UPDATED=false
AI_ASSISTANT_UPDATED=false

# Bump Workflow Agent version
if [ "${AGENT_TYPE}" == "workflow" ] || [ "${AGENT_TYPE}" == "both" ]; then
    if [ -z "${APP_VERSION_WORKFLOW}" ]; then
        echo -e "${RED}ERROR: APP_VERSION_WORKFLOW not found in .env${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Current Workflow Agent version: ${APP_VERSION_WORKFLOW}${NC}"
    NEW_WORKFLOW_VERSION=$(bump_version ${APP_VERSION_WORKFLOW} ${BUMP_TYPE})
    echo -e "${GREEN}New Workflow Agent version: ${NEW_WORKFLOW_VERSION}${NC}"
    echo ""
    
    update_env_file "APP_VERSION_WORKFLOW" "${NEW_WORKFLOW_VERSION}"
    WORKFLOW_UPDATED=true
fi

# Bump AI Assistant Agent version
if [ "${AGENT_TYPE}" == "ai-assistant" ] || [ "${AGENT_TYPE}" == "both" ]; then
    if [ -z "${APP_VERSION_AI_ASSISTANT}" ]; then
        echo -e "${RED}ERROR: APP_VERSION_AI_ASSISTANT not found in .env${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Current AI Assistant Agent version: ${APP_VERSION_AI_ASSISTANT}${NC}"
    NEW_AI_ASSISTANT_VERSION=$(bump_version ${APP_VERSION_AI_ASSISTANT} ${BUMP_TYPE})
    echo -e "${GREEN}New AI Assistant Agent version: ${NEW_AI_ASSISTANT_VERSION}${NC}"
    echo ""
    
    update_env_file "APP_VERSION_AI_ASSISTANT" "${NEW_AI_ASSISTANT_VERSION}"
    AI_ASSISTANT_UPDATED=true
fi

###############################################################################
# Create git tags
###############################################################################

if [ "${WORKFLOW_UPDATED}" = true ]; then
    create_git_tag \
        "workflow-v${NEW_WORKFLOW_VERSION}" \
        "Workflow Agent v${NEW_WORKFLOW_VERSION}"
fi

if [ "${AI_ASSISTANT_UPDATED}" = true ]; then
    create_git_tag \
        "ai-assistant-v${NEW_AI_ASSISTANT_VERSION}" \
        "AI Assistant Agent v${NEW_AI_ASSISTANT_VERSION}"
fi

###############################################################################
# Summary and next steps
###############################################################################

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ "${WORKFLOW_UPDATED}" = true ]; then
    echo -e "${GREEN}Workflow Agent: ${APP_VERSION_WORKFLOW} → ${NEW_WORKFLOW_VERSION}${NC}"
fi

if [ "${AI_ASSISTANT_UPDATED}" = true ]; then
    echo -e "${GREEN}AI Assistant Agent: ${APP_VERSION_AI_ASSISTANT} → ${NEW_AI_ASSISTANT_VERSION}${NC}"
fi

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the changes in .env"
echo "2. Commit the .env file changes:"
echo "   git add .env"
echo "   git commit -m \"Bump version(s)\""
echo "3. Build and push Docker images:"
echo "   ./infra/cdk/scripts/deploy-to-ecr.sh [environment]"
echo "4. Update AgentCore runtimes:"
echo "   ./infra/cdk/scripts/update-agentcore-runtime.sh [environment] [agent_type]"
echo ""

echo -e "${GREEN}Version bump complete!${NC}"
echo ""
echo -e "${YELLOW}A backup of your previous .env file was saved to .env.backup${NC}"