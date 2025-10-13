# Deployment Guide - BidOps.AI Core API

Production deployment guide for AWS ECS deployment.

## 🚀 Deployment Options

### 1. AWS ECS with Fargate

Recommended for production - fully managed, scalable container orchestration.

#### Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Docker installed locally
- PostgreSQL RDS instance
- Redis ElastiCache cluster
- S3 bucket for artifacts
- AWS Cognito User Pool

#### ECS Deployment Steps

**1. Build and Push Docker Image**

```bash
# Build production image
docker build -f infra/docker/services/core-api/Dockerfile \
  -t bidopsai/core-api:latest \
  --platform linux/amd64 .

# Tag for ECR
docker tag bidopsai/core-api:latest \
  <account-id>.dkr.ecr.<region>.amazonaws.com/bidopsai/core-api:latest

# Login to ECR
aws ecr get-login-password --region <region> | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.<region>.amazonaws.com

# Push to ECR
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/bidopsai/core-api:latest
```

**2. Create ECS Task Definition**

```json
{
  "family": "bidopsai-core-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<account-id>:role/bidopsai-api-task-role",
  "containerDefinitions": [
    {
      "name": "core-api",
      "image": "<account-id>.dkr.ecr.<region>.amazonaws.com/bidopsai/core-api:latest",
      "portMappings": [
        {
          "containerPort": 4000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "4000" }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:<region>:<account-id>:secret:bidopsai/database-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:<region>:<account-id>:secret:bidopsai/jwt-secret"
        },
        {
          "name": "AWS_ACCESS_KEY_ID",
          "valueFrom": "arn:aws:secretsmanager:<region>:<account-id>:secret:bidopsai/aws-access-key"
        },
        {
          "name": "AWS_SECRET_ACCESS_KEY",
          "valueFrom": "arn:aws:secretsmanager:<region>:<account-id>:secret:bidopsai/aws-secret-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/bidopsai-core-api",
          "awslogs-region": "<region>",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:4000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

**3. Create ECS Service**

```bash
aws ecs create-service \
  --cluster bidopsai-cluster \
  --service-name core-api \
  --task-definition bidopsai-core-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:<region>:<account-id>:targetgroup/bidopsai-api-tg,containerName=core-api,containerPort=4000"
```

**4. Configure Auto Scaling**

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/bidopsai-cluster/core-api \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/bidopsai-cluster/core-api \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

**scaling-policy.json:**
```json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleInCooldown": 300,
  "ScaleOutCooldown": 60
}
```

### 2. AWS CDK Deployment

Use Infrastructure as Code for repeatable deployments.

**CDK Stack Example:**

```typescript
// infra/cdk/lib/core-api-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';

export class CoreApiStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'BidOpsVPC', {
      maxAzs: 3,
      natGateways: 2,
    });

    // RDS PostgreSQL
    const database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      vpc,
      multiAz: true,
      allocatedStorage: 100,
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
    });

    // Redis ElastiCache
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'RedisSubnetGroup',
      {
        description: 'Subnet group for Redis',
        subnetIds: vpc.privateSubnets.map((subnet) => subnet.subnetId),
      }
    );

    const redis = new elasticache.CfnCacheCluster(this, 'Redis', {
      cacheNodeType: 'cache.t3.micro',
      engine: 'redis',
      numCacheNodes: 1,
      cacheSubnetGroupName: redisSubnetGroup.ref,
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      containerInsights: true,
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'TaskDefinition',
      {
        memoryLimitMiB: 2048,
        cpu: 1024,
      }
    );

    const container = taskDefinition.addContainer('CoreAPI', {
      image: ecs.ContainerImage.fromRegistry(
        '<account-id>.dkr.ecr.<region>.amazonaws.com/bidopsai/core-api:latest'
      ),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'core-api' }),
      environment: {
        NODE_ENV: 'production',
        DATABASE_URL: database.secret!.secretValueFromJson('connectionString')
          .unsafeUnwrap(),
        REDIS_URL: `redis://${redis.attrRedisEndpointAddress}:${redis.attrRedisEndpointPort}`,
      },
      portMappings: [{ containerPort: 4000 }],
    });

    // Load Balancer
    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true,
    });

    const listener = lb.addListener('Listener', { port: 443 });

    // ECS Service
    const service = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition,
      desiredCount: 2,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
    });

    listener.addTargets('ECS', {
      port: 4000,
      targets: [service],
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
      },
    });
  }
}
```

**Deploy with CDK:**

```bash
cd infra/cdk
npm install
cdk bootstrap
cdk deploy CoreApiStack
```

## 🔐 Secrets Management

### AWS Secrets Manager

Store sensitive configuration in AWS Secrets Manager:

```bash
# Database URL
aws secretsmanager create-secret \
  --name bidopsai/database-url \
  --secret-string "postgresql://user:pass@host:5432/dbname"

# JWT Secret
aws secretsmanager create-secret \
  --name bidopsai/jwt-secret \
  --secret-string "your-super-secret-jwt-key"

# AWS Credentials
aws secretsmanager create-secret \
  --name bidopsai/aws-credentials \
  --secret-string '{"accessKeyId":"xxx","secretAccessKey":"yyy"}'
```

## 🗄️ Database Migration

Run migrations before deploying new code:

```bash
# From ECS task or bastion host
docker run --rm \
  -e DATABASE_URL="postgresql://..." \
  <account-id>.dkr.ecr.<region>.amazonaws.com/bidopsai/core-api:latest \
  npm run prisma:deploy
```

## 📊 Monitoring Setup

### CloudWatch Dashboards

```bash
aws cloudwatch put-dashboard \
  --dashboard-name BidOpsAPI \
  --dashboard-body file://cloudwatch-dashboard.json
```

**cloudwatch-dashboard.json:**
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", { "stat": "Average" }],
          [".", "MemoryUtilization", { "stat": "Average" }]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "ECS Metrics"
      }
    }
  ]
}
```

### CloudWatch Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name bidopsai-api-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name bidopsai-api-high-errors \
  --alarm-description "Alert on high error rate" \
  --metric-name 5XXError \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 60 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '24'
      - run: npm ci
      - run: npm test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: bidopsai/core-api
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -f infra/docker/services/core-api/Dockerfile \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:latest .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster bidopsai-cluster \
            --service core-api \
            --force-new-deployment
```

## 🔍 Health Checks

### Load Balancer Health Check

```json
{
  "path": "/health",
  "interval": 30,
  "timeout": 5,
  "healthyThreshold": 2,
  "unhealthyThreshold": 3,
  "matcher": "200"
}
```

### Container Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

## 🔐 Security Best Practices

1. **Use VPC with Private Subnets**
   - Deploy API in private subnets
   - Use NAT Gateway for outbound traffic
   - Load balancer in public subnets only

2. **Enable Encryption**
   - RDS encryption at rest
   - ELB SSL/TLS termination
   - Secrets Manager for sensitive data

3. **IAM Roles**
   - Least privilege access
   - Separate task execution and task roles
   - Regular access audits

4. **Network Security**
   - Security groups with minimal open ports
   - NACL rules for additional protection
   - VPC Flow Logs enabled

## 📋 Pre-Deployment Checklist

- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Secrets stored in Secrets Manager
- [ ] Docker image built and pushed to ECR
- [ ] Load balancer and target group configured
- [ ] SSL certificate attached to load balancer
- [ ] Security groups configured
- [ ] IAM roles and policies created
- [ ] CloudWatch logging enabled
- [ ] CloudWatch alarms configured
- [ ] Auto-scaling policies set
- [ ] Health checks configured
- [ ] Backup strategy in place
- [ ] Disaster recovery plan documented

## 🚨 Rollback Procedure

If deployment fails:

```bash
# Get previous task definition
aws ecs describe-task-definition \
  --task-definition bidopsai-core-api \
  --query 'taskDefinition.revision' \
  --output text

# Update service to previous version
aws ecs update-service \
  --cluster bidopsai-cluster \
  --service core-api \
  --task-definition bidopsai-core-api:<previous-revision>
```

## 📚 Resources

- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [Fargate Task Definitions](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html)
- [ECS Auto Scaling](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-auto-scaling.html)