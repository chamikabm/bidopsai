#!/bin/bash

# BidOps.AI - Create Test Cognito Users
# This script creates test users for development

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# AWS Region (can be overridden via environment variable)
AWS_REGION="${AWS_REGION:-ap-southeast-2}"

# Test user credentials (use environment variables or defaults)
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@bidopsai.com}"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-AdminPass123!@#}"

VIEWER_EMAIL="${VIEWER_EMAIL:-viewer@bidopsai.com}"
VIEWER_USERNAME="${VIEWER_USERNAME:-viewer}"
VIEWER_PASSWORD="${VIEWER_PASSWORD:-ViewerPass123!@#}"

# Track success
USERS_CREATED=0
USERS_FAILED=0

# Get User Pool ID from stack outputs
echo -e "${BLUE}Fetching User Pool ID...${NC}"
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name BidOpsAI-Cognito-dev \
  --region "$AWS_REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text)

if [ -z "$USER_POOL_ID" ]; then
  echo -e "${RED}Error: Could not retrieve User Pool ID${NC}"
  exit 1
fi

echo -e "${GREEN}User Pool ID: $USER_POOL_ID${NC}"
echo -e "${GREEN}Region: $AWS_REGION${NC}"
echo ""

# Function to create user
create_user() {
  local username=$1
  local email=$2
  local given_name=$3
  local family_name=$4
  local group=$5
  local password=$6

  echo -e "${BLUE}Creating user: $email (username: $username)${NC}"

  # Create user with username (not email)
  echo -e "  Creating user account..."
  if OUTPUT=$(aws cognito-idp admin-create-user \
    --user-pool-id "$USER_POOL_ID" \
    --region "$AWS_REGION" \
    --username "$username" \
    --user-attributes \
      Name=email,Value="$email" \
      Name=email_verified,Value=true \
      Name=given_name,Value="$given_name" \
      Name=family_name,Value="$family_name" \
    --message-action SUPPRESS 2>&1); then
    echo -e "  ${GREEN}✓ User created${NC}"
  else
    if echo "$OUTPUT" | grep -q "UsernameExistsException"; then
      echo -e "  ${YELLOW}⚠ User already exists${NC}"
    else
      echo -e "  ${RED}✗ Failed to create user${NC}"
      echo -e "  ${RED}Error: $OUTPUT${NC}"
      return 1
    fi
  fi

  # Set permanent password
  echo -e "  Setting password..."
  if OUTPUT=$(aws cognito-idp admin-set-user-password \
    --user-pool-id "$USER_POOL_ID" \
    --region "$AWS_REGION" \
    --username "$username" \
    --password "$password" \
    --permanent 2>&1); then
    echo -e "  ${GREEN}✓ Password set${NC}"
  else
    echo -e "  ${RED}✗ Failed to set password${NC}"
    echo -e "  ${RED}Error: $OUTPUT${NC}"
    return 1
  fi

  # Add to group
  echo -e "  Adding to group $group..."
  if OUTPUT=$(aws cognito-idp admin-add-user-to-group \
    --user-pool-id "$USER_POOL_ID" \
    --region "$AWS_REGION" \
    --username "$username" \
    --group-name "$group" 2>&1); then
    echo -e "  ${GREEN}✓ Added to group${NC}"
  else
    if echo "$OUTPUT" | grep -q "ResourceNotFoundException"; then
      echo -e "  ${RED}✗ Group '$group' does not exist${NC}"
      return 1
    else
      echo -e "  ${YELLOW}⚠ May already be in group${NC}"
    fi
  fi

  echo -e "${GREEN}✓ Successfully configured: $email${NC}"
  echo ""
  return 0
}

# Create test users
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Creating Test Users${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Admin User
if create_user "$ADMIN_USERNAME" "$ADMIN_EMAIL" "Admin" "User" "ADMIN" "$ADMIN_PASSWORD"; then
  ((USERS_CREATED++))
else
  ((USERS_FAILED++))
fi

# KB View User
if create_user "$VIEWER_USERNAME" "$VIEWER_EMAIL" "Knowledge Base" "Viewer" "KB_VIEW" "$VIEWER_PASSWORD"; then
  ((USERS_CREATED++))
else
  ((USERS_FAILED++))
fi

# Summary
echo -e "${BLUE}═══════════════════════════════════════${NC}"
if [ $USERS_CREATED -eq 2 ] && [ $USERS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All Test Users Created Successfully!${NC}"
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo ""
  echo -e "${BLUE}Admin User:${NC}"
  echo -e "  Email:    ${YELLOW}$ADMIN_EMAIL${NC}"
  echo -e "  Username: ${YELLOW}$ADMIN_USERNAME${NC}"
  echo -e "  Password: ${YELLOW}$ADMIN_PASSWORD${NC}"
  echo -e "  Group:    ${YELLOW}ADMIN${NC}"
  echo ""
  echo -e "${BLUE}KB Viewer User:${NC}"
  echo -e "  Email:    ${YELLOW}$VIEWER_EMAIL${NC}"
  echo -e "  Username: ${YELLOW}$VIEWER_USERNAME${NC}"
  echo -e "  Password: ${YELLOW}$VIEWER_PASSWORD${NC}"
  echo -e "  Group:    ${YELLOW}KB_VIEW${NC}"
  echo ""
  echo -e "${GREEN}Sign in at: http://localhost:3000/signin${NC}"
  echo -e "${YELLOW}Note: Sign in with email ($ADMIN_EMAIL) and password${NC}"
  echo ""
  exit 0
elif [ $USERS_CREATED -gt 0 ]; then
  echo -e "${YELLOW}⚠ Partial Success${NC}"
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${GREEN}Created: $USERS_CREATED users${NC}"
  echo -e "${RED}Failed: $USERS_FAILED users${NC}"
  echo ""
  exit 1
else
  echo -e "${RED}✗ Failed to Create Users${NC}"
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${RED}All user creation attempts failed${NC}"
  echo ""
  echo -e "${YELLOW}Troubleshooting:${NC}"
  echo -e "  1. Verify User Pool exists: aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID --region $AWS_REGION"
  echo -e "  2. Check groups exist: aws cognito-idp list-groups --user-pool-id $USER_POOL_ID --region $AWS_REGION"
  echo -e "  3. Verify AWS credentials: aws sts get-caller-identity"
  echo ""
  exit 1
fi