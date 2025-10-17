#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BidOpsAICognitoStack } from '../lib/cognito-stack';
import { S3SourceBucketStack } from '../lib/s3-source-bucket-stack';
import { ECRStack } from '../lib/ecr-stack';
import { ConfigStack } from '../lib/config-stack';
import { IAMStack } from '../lib/iam-stack';
import { AgentCoreRuntimeStack } from '../lib/agentcore-runtime-stack';
import { BedrockDataAutomationStack } from '../lib/bedrock-data-automation-stack';
import { ObservabilityStack } from '../lib/observability-stack';

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext('environment') || 'dev';

// Get image versions from environment variables or context
const workflowVersion = process.env.APP_VERSION_WORKFLOW ||
  app.node.tryGetContext('workflowVersion') || '1.0.0';
const aiAssistantVersion = process.env.APP_VERSION_AI_ASSISTANT ||
  app.node.tryGetContext('aiAssistantVersion') || '1.0.0';

// Stack configuration
const stackEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

const commonTags = {
  Environment: environment,
  Project: 'BidOpsAI',
  ManagedBy: 'CDK',
};

// Deploy Cognito Stack
const cognitoStack = new BidOpsAICognitoStack(app, `BidOpsAI-Cognito-${environment}`, {
  env: stackEnv,
  description: `BidOps.AI Cognito User Pool Stack for ${environment}`,
  tags: commonTags,
});

// Deploy S3 Source Bucket Stack
const s3Stack = new S3SourceBucketStack(app, `BidOpsAI-S3SourceBucket-${environment}`, {
  env: stackEnv,
  description: `BidOps.AI S3 Source Bucket Stack for ${environment}`,
  tags: commonTags,
});

// Deploy ECR Stack for Docker images
const ecrStack = new ECRStack(app, `BidOpsAI-ECR-${environment}`, {
  env: stackEnv,
  description: `BidOps.AI ECR Repositories Stack for ${environment}`,
  tags: commonTags,
});

// Deploy Configuration Stack (SSM & Secrets Manager)
const configStack = new ConfigStack(app, `BidOpsAI-Config-${environment}`, {
  env: stackEnv,
  description: `BidOps.AI Configuration Stack (SSM & Secrets) for ${environment}`,
  tags: commonTags,
});

// Deploy IAM Stack
const iamStack = new IAMStack(app, `BidOpsAI-IAM-${environment}`, {
  env: stackEnv,
  description: `BidOps.AI IAM Roles and Policies Stack for ${environment}`,
  tags: commonTags,
});

// Grant config access to IAM roles
configStack.grantParameterReadAccess(iamStack.workflowAgentRole);
configStack.grantParameterReadAccess(iamStack.aiAssistantAgentRole);
configStack.grantSecretsReadAccess(iamStack.workflowAgentRole);
configStack.grantSecretsReadAccess(iamStack.aiAssistantAgentRole);

// Deploy Bedrock Data Automation Stack
const dataAutomationStack = new BedrockDataAutomationStack(app, `BidOpsAI-DataAutomation-${environment}`, {
  env: stackEnv,
  description: `BidOps.AI Bedrock Data Automation Stack for ${environment}`,
  tags: commonTags,
  environment,
  sourceBucket: s3Stack.projectDocumentsBucket,
});

// Grant data automation access to workflow agent
dataAutomationStack.grantProcessedDocsReadAccess(iamStack.workflowAgentRole);
dataAutomationStack.grantDataAutomationAccess(iamStack.workflowAgentRole);

// Add dependencies
iamStack.addDependency(configStack);
iamStack.addDependency(s3Stack);
iamStack.addDependency(ecrStack);
dataAutomationStack.addDependency(s3Stack);

// Deploy AgentCore Runtime Stack
// Note: Image URIs should be updated after images are pushed to ECR
const accountId = stackEnv.account || process.env.CDK_DEFAULT_ACCOUNT;
const region = stackEnv.region || 'us-east-1';

const agentCoreStack = new AgentCoreRuntimeStack(app, `BidOpsAI-AgentCore-${environment}`, {
  env: stackEnv,
  description: `BidOps.AI AgentCore Runtime Stack for ${environment}`,
  tags: commonTags,
  environment,
  workflowAgentRole: iamStack.workflowAgentRole,
  aiAssistantAgentRole: iamStack.aiAssistantAgentRole,
  workflowAgentImageUri: `${accountId}.dkr.ecr.${region}.amazonaws.com/bidopsai-workflow-agent-${environment}:v${workflowVersion}`,
  aiAssistantAgentImageUri: `${accountId}.dkr.ecr.${region}.amazonaws.com/bidopsai-ai-assistant-agent-${environment}:v${aiAssistantVersion}`,
  enableDetailedMonitoring: environment === 'prod' || environment === 'staging',
});

// AgentCore depends on IAM and ECR
agentCoreStack.addDependency(iamStack);
agentCoreStack.addDependency(ecrStack);

// Deploy Observability Stack (CloudWatch, X-Ray, LangFuse integration)
const observabilityStack = new ObservabilityStack(app, `BidOpsAI-Observability-${environment}`, {
  env: stackEnv,
  description: `BidOps.AI Observability Stack (CloudWatch, X-Ray) for ${environment}`,
  tags: commonTags,
  environment,
  workflowAgentRole: iamStack.workflowAgentRole,
  aiAssistantAgentRole: iamStack.aiAssistantAgentRole,
});

// Observability depends on IAM
observabilityStack.addDependency(iamStack);

app.synth();