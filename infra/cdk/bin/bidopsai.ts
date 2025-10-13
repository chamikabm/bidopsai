#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BidOpsAICognitoStack } from '../lib/cognito-stack';
import { S3SourceBucketStack } from '../lib/s3-source-bucket-stack';

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext('environment') || 'dev';

// Stack configuration
const stackEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Deploy Cognito Stack
new BidOpsAICognitoStack(app, `BidOpsAI-Cognito-${environment}`, {
  env: stackEnv,
  description: `BidOps.AI Cognito User Pool Stack for ${environment}`,
  tags: {
    Environment: environment,
    Project: 'BidOpsAI',
    ManagedBy: 'CDK',
  },
});

// Deploy S3 Source Bucket Stack
new S3SourceBucketStack(app, `BidOpsAI-S3SourceBucket-${environment}`, {
  env: stackEnv,
  description: `BidOps.AI S3 Source Bucket Stack for ${environment}`,
  tags: {
    Environment: environment,
    Project: 'BidOpsAI',
    ManagedBy: 'CDK',
  },
});

app.synth();