import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

/**
 * BidOps.AI S3 Source Bucket Stack
 *
 * Creates and configures source buckets for:
 * - Project documents (raw and processed files)
 * - Generated artifacts (Word, PDF, Excel, PPT documents)
 * - Access logs for compliance and auditing
 *
 * Features:
 * - Lifecycle policies for cost optimization
 * - CORS configuration for direct browser uploads
 * - Encryption at rest with S3-managed keys
 * - Versioning for data protection
 * - HTTPS-only access enforcement
 */
export class S3SourceBucketStack extends cdk.Stack {
  public readonly projectDocumentsBucket: s3.Bucket;
  public readonly artifactsBucket: s3.Bucket;
  private readonly accessLogsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get environment from stack name or default to 'dev'
    const environment = this.node.tryGetContext('environment') || 'dev';

    // Create access logs bucket first (shared by all buckets)
    this.accessLogsBucket = this.createAccessLogsBucket(environment);

    // Create S3 bucket for project documents (uploads)
    this.projectDocumentsBucket = new s3.Bucket(this, 'ProjectDocumentsBucket', {
      bucketName: `bidopsai-project-documents-${environment}-${this.account}`,
      
      // Versioning for data protection
      versioned: true,
      
      // Encryption at rest
      encryption: s3.BucketEncryption.S3_MANAGED,
      
      // Block public access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      
      // CORS configuration for direct browser uploads
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: this.getAllowedOrigins(environment),
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag', 'x-amz-server-side-encryption', 'x-amz-request-id', 'x-amz-id-2'],
          maxAge: 3600,
        },
      ],
      
      // Lifecycle rules for cost optimization
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
        {
          id: 'DeleteIncompleteUploads',
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      
      // Auto delete objects on stack deletion (dev/staging only)
      autoDeleteObjects: environment !== 'prod',
      
      // Removal policy
      removalPolicy: environment === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      
      // Server access logging
      serverAccessLogsBucket: this.accessLogsBucket,
      serverAccessLogsPrefix: 'project-documents/',
    });

    // Create S3 bucket for generated artifacts
    this.artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      bucketName: `bidopsai-artifacts-${environment}-${this.account}`,
      
      // Versioning for data protection
      versioned: true,
      
      // Encryption at rest
      encryption: s3.BucketEncryption.S3_MANAGED,
      
      // Block public access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      
      // CORS configuration
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: this.getAllowedOrigins(environment),
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag', 'x-amz-server-side-encryption', 'x-amz-request-id', 'x-amz-id-2'],
          maxAge: 3600,
        },
      ],
      
      // Lifecycle rules
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(180),
            },
          ],
        },
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(180),
        },
      ],
      
      // Auto delete objects on stack deletion (dev/staging only)
      autoDeleteObjects: environment !== 'prod',
      
      // Removal policy
      removalPolicy: environment === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      
      // Server access logging
      serverAccessLogsBucket: this.accessLogsBucket,
      serverAccessLogsPrefix: 'artifacts/',
    });

    // Create bucket policies
    this.createBucketPolicies();

    // Stack outputs
    this.createOutputs(environment);

    // Add tags
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('Project', 'BidOpsAI');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }

  /**
   * Create access logs bucket for audit trails
   */
  private createAccessLogsBucket(environment: string): s3.Bucket {
    return new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `bidopsai-access-logs-${environment}-${this.account}`,
      
      // Block public access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      
      // Encryption
      encryption: s3.BucketEncryption.S3_MANAGED,
      
      // Lifecycle rules for logs
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          enabled: true,
          expiration: cdk.Duration.days(environment === 'prod' ? 365 : 90),
        },
      ],
      
      // Auto delete objects on stack deletion (dev/staging only)
      autoDeleteObjects: environment !== 'prod',
      
      // Removal policy
      removalPolicy: environment === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });
  }

  /**
   * Create bucket policies for secure access
   */
  private createBucketPolicies(): void {
    // Enforce HTTPS only
    this.projectDocumentsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'EnforceSSLOnly',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          this.projectDocumentsBucket.bucketArn,
          `${this.projectDocumentsBucket.bucketArn}/*`,
        ],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    this.artifactsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'EnforceSSLOnly',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          this.artifactsBucket.bucketArn,
          `${this.artifactsBucket.bucketArn}/*`,
        ],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );
  }

  /**
   * Get allowed origins based on environment
   */
  private getAllowedOrigins(environment: string): string[] {
    const origins: string[] = [];

    switch (environment) {
      case 'prod':
        origins.push('https://app.bidopsai.com');
        origins.push('https://bidopsai.com');
        break;
      case 'staging':
        origins.push('https://staging.bidopsai.com');
        break;
      case 'dev':
      default:
        origins.push('http://localhost:3000');
        origins.push('http://localhost:4000');
        break;
    }

    return origins;
  }

  /**
   * Create CloudFormation outputs
   */
  private createOutputs(environment: string): void {
    new cdk.CfnOutput(this, 'ProjectDocumentsBucketName', {
      value: this.projectDocumentsBucket.bucketName,
      description: 'S3 bucket name for project documents',
      exportName: `BidOpsAI-ProjectDocumentsBucket-${environment}`,
    });

    new cdk.CfnOutput(this, 'ProjectDocumentsBucketArn', {
      value: this.projectDocumentsBucket.bucketArn,
      description: 'S3 bucket ARN for project documents',
      exportName: `BidOpsAI-ProjectDocumentsBucketArn-${environment}`,
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: this.artifactsBucket.bucketName,
      description: 'S3 bucket name for artifacts',
      exportName: `BidOpsAI-ArtifactsBucket-${environment}`,
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketArn', {
      value: this.artifactsBucket.bucketArn,
      description: 'S3 bucket ARN for artifacts',
      exportName: `BidOpsAI-ArtifactsBucketArn-${environment}`,
    });

    new cdk.CfnOutput(this, 'S3Region', {
      value: this.region,
      description: 'AWS Region for S3 buckets',
      exportName: `BidOpsAI-S3Region-${environment}`,
    });
  }
}