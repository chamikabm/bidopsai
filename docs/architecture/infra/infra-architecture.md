graph TB
    subgraph "User Layer"
        User[User Requests]
    end

    subgraph "Global Services"
        R53[Route 53 DNS]
        ACM[ACM Certificate]
    end

    User -->|HTTPS| R53
    R53 --> ALB
    
    subgraph "AWS Region: us-east-1"
        subgraph "VPC: 10.0.0.0/16"
            
            subgraph "Public Subnets"
                subgraph "AZ-1: us-east-1a<br/>10.0.1.0/24"
                    IGW1[Internet Gateway]
                    NAT1[NAT Gateway]
                    ALB1A[ALB Node AZ-1]
                end
                
                subgraph "AZ-2: us-east-1b<br/>10.0.2.0/24"
                    ALB1B[ALB Node AZ-2]
                end
                
                ALB{{"Public ALB<br/>SSL/TLS + WAF + Shield"}}
                ALB -.-> ALB1A
                ALB -.-> ALB1B
            end
            
            subgraph "Private App Subnets"
                subgraph "AZ-1: us-east-1a<br/>10.0.11.0/24"
                    BFF1A[BFF Task 1<br/>Next.js]
                    BFF1B[BFF Task 2<br/>Next.js]
                    Backend1A[Backend Task 1<br/>GraphQL]
                    Backend1B[Backend Task 2<br/>GraphQL]
                    BackendALB1A[Backend ALB<br/>Node AZ-1]
                end
                
                subgraph "AZ-2: us-east-1b<br/>10.0.12.0/24"
                    BFF2A[BFF Task 3<br/>Next.js]
                    BFF2B[BFF Task 4<br/>Next.js]
                    Backend2A[Backend Task 3<br/>GraphQL]
                    Backend2B[Backend Task 4<br/>GraphQL]
                    BackendALB1B[Backend ALB<br/>Node AZ-2]
                end
                
                BackendALB{{"Internal ALB<br/>Backend"}}
                BackendALB -.-> BackendALB1A
                BackendALB -.-> BackendALB1B
            end
            
            subgraph "Private AgentCore Subnets"
                subgraph "AZ-1: us-east-1a<br/>10.0.21.0/24"
                    AgentSubnet1[Subnet AZ-1]
                end
                
                subgraph "AZ-2: us-east-1b<br/>10.0.22.0/24"
                    AgentSubnet2[Subnet AZ-2]
                end
                
                AgentCore["AgentCore Runtime<br/>Managed Endpoint<br/>(Streaming)"]
            end
            
            subgraph "Private Data Subnets"
                subgraph "AZ-1: us-east-1a<br/>10.0.31.0/24"
                    RDSProxy1[RDS Proxy<br/>Endpoint AZ-1]
                    RDSPrimary[(RDS Primary<br/>PostgreSQL)]
                    OS1[OpenSearch<br/>Node 1]
                    OS2[OpenSearch<br/>Node 2]
                end
                
                subgraph "AZ-2: us-east-1b<br/>10.0.32.0/24"
                    RDSProxy2[RDS Proxy<br/>Endpoint AZ-2]
                    RDSStandby[(RDS Standby<br/>PostgreSQL)]
                    OS3[OpenSearch<br/>Node 3]
                end
                
                RDSPrimary -.->|Synchronous<br/>Replication| RDSStandby
            end
            
            subgraph "VPC Endpoints"
                VPCE_S3[S3 Gateway<br/>Endpoint]
                VPCE_Bedrock[Bedrock<br/>Interface Endpoint]
                VPCE_Secrets[Secrets Manager<br/>Interface Endpoint]
                VPCE_SSM[SSM Parameter Store<br/>Interface Endpoint]
                VPCE_ECR_API[ECR API<br/>Interface Endpoint]
                VPCE_ECR_DKR[ECR Docker<br/>Interface Endpoint]
                VPCE_CW_Logs[CloudWatch Logs<br/>Interface Endpoint]
            end
        end
    end
    
    subgraph "AWS Managed Services - Regional"
        Bedrock[Bedrock Service<br/>Models + KB + BDA + Guardrails]
        Cognito[Cognito<br/>User Pool]
        
        subgraph "S3 Buckets"
            S3_KB[S3 Knowledge Base<br/>Source Data]
            S3_Logs[S3 Logs<br/>ALB + CloudWatch]
            S3_BDA[S3 BDA<br/>Input/Output]
        end
        
        subgraph "Container Registry"
            ECR[ECR Repositories<br/>Image Scanning Enabled]
        end
        
        subgraph "Configuration & Secrets"
            Secrets[Secrets Manager<br/>RDS Credentials<br/>API Keys]
            SSM[SSM Parameter Store<br/>App Configuration<br/>Endpoints]
        end
        
        subgraph "Observability"
            CloudWatch[CloudWatch<br/>Logs + Metrics + Alarms]
            CloudTrail[CloudTrail<br/>API Audit Logs]
        end
    end
    
    %% Connections
    ALB1A --> BFF1A
    ALB1A --> BFF1B
    ALB1B --> BFF2A
    ALB1B --> BFF2B
    
    BFF1A --> BackendALB
    BFF1B --> BackendALB
    BFF2A --> BackendALB
    BFF2B --> BackendALB
    
    BFF1A <-->|Streaming| AgentCore
    BFF1B <-->|Streaming| AgentCore
    BFF2A <-->|Streaming| AgentCore
    BFF2B <-->|Streaming| AgentCore
    
    BackendALB1A --> Backend1A
    BackendALB1A --> Backend1B
    BackendALB1B --> Backend2A
    BackendALB1B --> Backend2B
    
    Backend1A --> RDSProxy1
    Backend1B --> RDSProxy1
    Backend2A --> RDSProxy2
    Backend2B --> RDSProxy2
    
    AgentCore --> RDSProxy1
    AgentCore --> RDSProxy2
    
    RDSProxy1 --> RDSPrimary
    RDSProxy2 --> RDSPrimary
    RDSProxy1 --> RDSStandby
    RDSProxy2 --> RDSStandby
    
    Backend1A --> Bedrock
    Backend1B --> Bedrock
    Backend2A --> Bedrock
    Backend2B --> Bedrock
    
    AgentCore --> Bedrock
    
    %% Styling
    classDef az1 fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef az2 fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef alb fill:#fff9c4,stroke:#f57f17,stroke-width:3px
    classDef data fill:#c8e6c9,stroke:#388e3c,stroke-width:2px
    classDef managed fill:#b2ebf2,stroke:#00acc1,stroke-width:3px,stroke-dasharray: 5 5
    classDef vpce fill:#ffe0b2,stroke:#f57c00,stroke-width:2px
    classDef storage fill:#f0f4c3,stroke:#9e9d24,stroke-width:2px
    classDef security fill:#ffccbc,stroke:#d84315,stroke-width:2px
    
    class BFF1A,BFF1B,Backend1A,Backend1B,RDSProxy1,RDSPrimary,OS1,OS2,ALB1A,BackendALB1A,NAT1,IGW1,AgentSubnet1 az1
    class BFF2A,BFF2B,Backend2A,Backend2B,RDSProxy2,RDSStandby,OS3,ALB1B,BackendALB1B,AgentSubnet2 az2
    class ALB,BackendALB alb
    class RDSPrimary,RDSStandby,OS1,OS2,OS3 data
    class AgentCore,Bedrock managed
    class VPCE_S3,VPCE_Bedrock,VPCE_Secrets,VPCE_SSM,VPCE_ECR_API,VPCE_ECR_DKR,VPCE_CW_Logs vpce
    class S3_KB,S3_Logs,S3_BDA,ECR storage
    class Cognito,Secrets,SSM,CloudWatch,CloudTrail security