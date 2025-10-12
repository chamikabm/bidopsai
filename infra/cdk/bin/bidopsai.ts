#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BidOpsAICognitoStack } from '../lib/cognito-stack';

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext('environment') || 'dev';
const stackName = `BidOpsAI-Cognito-${environment}`;

new BidOpsAICognitoStack(app, stackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `BidOps.AI Cognito User Pool Stack for ${environment}`,
  tags: {
    Environment: environment,
    Project: 'BidOpsAI',
    ManagedBy: 'CDK',
  },
});

app.synth();