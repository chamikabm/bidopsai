import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

export interface AgentCoreRuntimeStackProps extends cdk.StackProps {
  /**
   * Environment name (dev, staging, prod)
   */
  environment: string;

  /**
   * IAM execution role for the workflow agent
   */
  workflowAgentRole: iam.IRole;

  /**
   * IAM execution role for the AI assistant agent
   */
  aiAssistantAgentRole: iam.IRole;

  /**
   * ECR image URI for workflow agent (including tag)
   */
  workflowAgentImageUri: string;

  /**
   * ECR image URI for AI assistant agent (including tag)
   */
  aiAssistantAgentImageUri: string;

  /**
   * Enable detailed monitoring and tracing
   */
  enableDetailedMonitoring?: boolean;
}

/**
 * Stack for deploying AWS Bedrock AgentCore Runtimes
 * 
 * This stack creates two AgentCore runtime deployments:
 * 1. Workflow Agent Runtime - Handles bid processing workflows
 * 2. AI Assistant Agent Runtime - Handles conversational AI assistance
 * 
 * Since AgentCore CDK constructs are not yet available, this uses
 * Custom Resources with AWS SDK calls to manage the runtimes.
 */
export class AgentCoreRuntimeStack extends cdk.Stack {
  public readonly workflowRuntimeId: string;
  public readonly aiAssistantRuntimeId: string;
  public readonly workflowRuntimeEndpoint: string;
  public readonly aiAssistantRuntimeEndpoint: string;

  constructor(scope: Construct, id: string, props: AgentCoreRuntimeStackProps) {
    super(scope, id, props);

    const enableMonitoring = props.enableDetailedMonitoring ?? true;

    // Create CloudWatch Log Groups for runtime logs
    const workflowLogGroup = new logs.LogGroup(this, 'WorkflowAgentLogGroup', {
      logGroupName: `/aws/bedrock/agentcore/${props.environment}/workflow-agent`,
      retention: props.environment === 'prod' 
        ? logs.RetentionDays.SIX_MONTHS 
        : logs.RetentionDays.ONE_MONTH,
      removalPolicy: props.environment === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    const aiAssistantLogGroup = new logs.LogGroup(this, 'AIAssistantAgentLogGroup', {
      logGroupName: `/aws/bedrock/agentcore/${props.environment}/ai-assistant-agent`,
      retention: props.environment === 'prod'
        ? logs.RetentionDays.SIX_MONTHS
        : logs.RetentionDays.ONE_MONTH,
      removalPolicy: props.environment === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // Create IAM role for Custom Resource Lambda
    const customResourceRole = new iam.Role(this, 'CustomResourceRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant permissions to manage AgentCore runtimes
    customResourceRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AgentCoreRuntimeManagement',
      actions: [
        'bedrock:CreateAgentRuntime',
        'bedrock:UpdateAgentRuntime',
        'bedrock:DeleteAgentRuntime',
        'bedrock:DescribeAgentRuntime',
        'bedrock:ListAgentRuntimes',
      ],
      resources: ['*'], // AgentCore resources don't support resource-level permissions yet
    }));

    // Grant permissions to pass execution roles to AgentCore
    customResourceRole.addToPolicy(new iam.PolicyStatement({
      sid: 'PassRoleToAgentCore',
      actions: ['iam:PassRole'],
      resources: [
        props.workflowAgentRole.roleArn,
        props.aiAssistantAgentRole.roleArn,
      ],
      conditions: {
        StringEquals: {
          'iam:PassedToService': 'bedrock.amazonaws.com',
        },
      },
    }));

    // Create Workflow Agent Runtime using Custom Resource
    const workflowRuntime = new cr.AwsCustomResource(this, 'WorkflowAgentRuntime', {
      onCreate: {
        service: 'Bedrock',
        action: 'createAgentRuntime',
        parameters: {
          runtimeName: `bidopsai-workflow-agent-${props.environment}`,
          description: `BidOps AI Workflow Agent Runtime for ${props.environment} environment`,
          runtimeConfig: {
            containerConfig: {
              image: props.workflowAgentImageUri,
            },
          },
          executionRoleArn: props.workflowAgentRole.roleArn,
          loggingConfig: {
            cloudWatchLogGroupArn: workflowLogGroup.logGroupArn,
            logLevel: enableMonitoring ? 'INFO' : 'WARN',
          },
          tracingConfig: enableMonitoring ? {
            enabled: true,
          } : undefined,
          tags: {
            Environment: props.environment,
            Application: 'BidOpsAI',
            AgentType: 'WorkflowSupervisor',
            ManagedBy: 'CDK',
          },
        },
        physicalResourceId: cr.PhysicalResourceId.fromResponse('runtimeId'),
      },
      onUpdate: {
        service: 'Bedrock',
        action: 'updateAgentRuntime',
        parameters: {
          runtimeIdentifier: new cr.PhysicalResourceIdReference(),
          runtimeConfig: {
            containerConfig: {
              image: props.workflowAgentImageUri,
            },
          },
          loggingConfig: {
            cloudWatchLogGroupArn: workflowLogGroup.logGroupArn,
            logLevel: enableMonitoring ? 'INFO' : 'WARN',
          },
          tracingConfig: enableMonitoring ? {
            enabled: true,
          } : undefined,
        },
        physicalResourceId: cr.PhysicalResourceId.fromResponse('runtimeId'),
      },
      onDelete: {
        service: 'Bedrock',
        action: 'deleteAgentRuntime',
        parameters: {
          runtimeIdentifier: new cr.PhysicalResourceIdReference(),
        },
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
      role: customResourceRole,
      timeout: cdk.Duration.minutes(15),
    });

    // Create AI Assistant Agent Runtime using Custom Resource
    const aiAssistantRuntime = new cr.AwsCustomResource(this, 'AIAssistantAgentRuntime', {
      onCreate: {
        service: 'Bedrock',
        action: 'createAgentRuntime',
        parameters: {
          runtimeName: `bidopsai-ai-assistant-agent-${props.environment}`,
          description: `BidOps AI Assistant Agent Runtime for ${props.environment} environment`,
          runtimeConfig: {
            containerConfig: {
              image: props.aiAssistantAgentImageUri,
            },
          },
          executionRoleArn: props.aiAssistantAgentRole.roleArn,
          loggingConfig: {
            cloudWatchLogGroupArn: aiAssistantLogGroup.logGroupArn,
            logLevel: enableMonitoring ? 'INFO' : 'WARN',
          },
          tracingConfig: enableMonitoring ? {
            enabled: true,
          } : undefined,
          tags: {
            Environment: props.environment,
            Application: 'BidOpsAI',
            AgentType: 'AIAssistantSupervisor',
            ManagedBy: 'CDK',
          },
        },
        physicalResourceId: cr.PhysicalResourceId.fromResponse('runtimeId'),
      },
      onUpdate: {
        service: 'Bedrock',
        action: 'updateAgentRuntime',
        parameters: {
          runtimeIdentifier: new cr.PhysicalResourceIdReference(),
          runtimeConfig: {
            containerConfig: {
              image: props.aiAssistantAgentImageUri,
            },
          },
          loggingConfig: {
            cloudWatchLogGroupArn: aiAssistantLogGroup.logGroupArn,
            logLevel: enableMonitoring ? 'INFO' : 'WARN',
          },
          tracingConfig: enableMonitoring ? {
            enabled: true,
          } : undefined,
        },
        physicalResourceId: cr.PhysicalResourceId.fromResponse('runtimeId'),
      },
      onDelete: {
        service: 'Bedrock',
        action: 'deleteAgentRuntime',
        parameters: {
          runtimeIdentifier: new cr.PhysicalResourceIdReference(),
        },
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
      role: customResourceRole,
      timeout: cdk.Duration.minutes(15),
    });

    // Extract runtime IDs and endpoints from Custom Resource responses
    this.workflowRuntimeId = workflowRuntime.getResponseField('runtimeId');
    this.aiAssistantRuntimeId = aiAssistantRuntime.getResponseField('runtimeId');
    this.workflowRuntimeEndpoint = workflowRuntime.getResponseField('runtimeEndpoint');
    this.aiAssistantRuntimeEndpoint = aiAssistantRuntime.getResponseField('runtimeEndpoint');

    // Output runtime information
    new cdk.CfnOutput(this, 'WorkflowAgentRuntimeId', {
      value: this.workflowRuntimeId,
      description: 'Workflow Agent Runtime ID',
      exportName: `BidOpsAI-WorkflowRuntimeId-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'WorkflowAgentRuntimeEndpoint', {
      value: this.workflowRuntimeEndpoint,
      description: 'Workflow Agent Runtime Endpoint',
      exportName: `BidOpsAI-WorkflowRuntimeEndpoint-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'AIAssistantAgentRuntimeId', {
      value: this.aiAssistantRuntimeId,
      description: 'AI Assistant Agent Runtime ID',
      exportName: `BidOpsAI-AIAssistantRuntimeId-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'AIAssistantAgentRuntimeEndpoint', {
      value: this.aiAssistantRuntimeEndpoint,
      description: 'AI Assistant Agent Runtime Endpoint',
      exportName: `BidOpsAI-AIAssistantRuntimeEndpoint-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'WorkflowAgentLogGroup', {
      value: workflowLogGroup.logGroupName,
      description: 'Workflow Agent CloudWatch Log Group',
    });

    new cdk.CfnOutput(this, 'AIAssistantAgentLogGroup', {
      value: aiAssistantLogGroup.logGroupName,
      description: 'AI Assistant Agent CloudWatch Log Group',
    });

    // Add tags to the stack
    cdk.Tags.of(this).add('Environment', props.environment);
    cdk.Tags.of(this).add('Application', 'BidOpsAI');
    cdk.Tags.of(this).add('Component', 'AgentCore');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}