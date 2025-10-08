# Research & Technology Decisions: BidOps.AI Frontend

**Feature**: BidOps.AI Frontend Application  
**Date**: 2025-10-07  
**Status**: Complete

## Overview

This document consolidates research findings for all technical decisions required to implement the BidOps.AI frontend application. Each section addresses unknowns identified in the Technical Context and provides rationale for technology choices.

---

## 1. Library Version Compatibility

### Decision: Use Latest Stable Versions with Verified Compatibility

**Versions Selected**:
- **Next.js**: 15.1.3 (latest stable with App Router maturity)
- **React**: 19.0.0 (stable release with Server Components)
- **TypeScript**: 5.7.2 (latest with improved type inference)
- **TanStack Query**: 5.62.7 (stable v5 with React 19 support)
- **Framer Motion**: 12.0.0 (stable v12 with React 19 compatibility)
- **TipTap**: 2.10.4 (v2 recommended over v3 for production stability)
- **AWS Amplify**: 6.11.4 (Gen 2 with Cognito integration)

**Rationale**:
- React 19 is production-ready with stable Server Components and improved hydration
- Next.js 15 provides mature App Router with Server Actions and streaming
- TanStack Query v5 has first-class React 19 support and improved TypeScript inference
- Framer Motion 12 maintains performance optimizations for 60fps animations
- TipTap v2 is more battle-tested than v3 for production use (v3 is still in active development)
- AWS Amplify Gen 2 offers simplified Cognito integration with better TypeScript support

**Alternatives Considered**:
- TipTap v3: Still in beta, lacks stable plugin ecosystem
- React 18: Considered but React 19's improvements justify the upgrade
- Next.js 14: Stable but lacks latest performance optimizations in v15

**Compatibility Verification**:
```json
{
  "next": "^15.1.3",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "@tanstack/react-query": "^5.62.7",
  "framer-motion": "^12.0.0",
  "@tiptap/react": "^2.10.4",
  "aws-amplify": "^6.11.4"
}
```

---

## 2. AWS Cognito Integration Patterns

### Decision: AWS Amplify Gen 2 + Custom Session Management

**Implementation Approach**:

**Authentication Flow**:
```typescript
// Using AWS Amplify Gen 2 for Cognito
import { Amplify } from 'aws-amplify';
import { signIn, signUp, signOut, getCurrentUser } from 'aws-amplify/auth';

// Configuration
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID,
      loginWith: {
        oauth: {
          domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
          scopes: ['email', 'profile', 'openid'],
          redirectSignIn: [process.env.NEXT_PUBLIC_APP_URL],
          redirectSignOut: [process.env.NEXT_PUBLIC_APP_URL],
          responseType: 'code',
          providers: ['Google']
        }
      }
    }
  }
});
```

**Session Management**:
- Use Next.js middleware to verify Cognito JWT tokens on each request
- Store tokens in secure HTTP-only cookies (not localStorage)
- Implement token refresh logic before expiration
- Use `getCurrentUser()` to check authentication status

**Role-Based Access Control**:
- Store user roles in Cognito custom attributes: `custom:roles`
- Fetch user attributes after authentication
- Create `usePermissions()` hook to check role-based access
- Implement middleware to restrict routes based on roles

**Rationale**:
- AWS Amplify Gen 2 provides better TypeScript support than v5/v6
- Direct integration eliminates need for NextAuth.js (simpler architecture)
- Custom session management gives more control over token handling
- Cognito custom attributes enable flexible RBAC without additional database queries

**Alternatives Considered**:
- **NextAuth.js with Cognito Provider**: Adds unnecessary abstraction layer
- **Direct AWS SDK**: More boilerplate, less DX than Amplify
- **Auth0**: External dependency, added cost, migration complexity

---

## 3. SSE Implementation Best Practices

### Decision: Native EventSource with TanStack Query Integration

**Implementation Pattern**:

```typescript
// SSE Client Utility
export function createSSEConnection(url: string, options: SSEOptions) {
  const eventSource = new EventSource(url);
  
  eventSource.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    // Update TanStack Query cache
    queryClient.setQueryData(['workflow', data.workflowId], (old) => ({
      ...old,
      ...data
    }));
  });
  
  eventSource.addEventListener('error', (error) => {
    console.error('SSE connection error:', error);
    // Implement exponential backoff reconnection
    setTimeout(() => reconnect(), getBackoffDelay());
  });
  
  return eventSource;
}

// React Hook
export function useWorkflowStream(workflowId: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const eventSource = createSSEConnection(
      `/api/workflow-agents/invocations?workflowId=${workflowId}`
    );
    
    return () => eventSource.close();
  }, [workflowId]);
  
  // Query data is automatically updated via cache
  return useQuery(['workflow', workflowId]);
}
```

**Next.js API Route (Proxy Pattern)**:
```typescript
// app/api/workflow-agents/invocations/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  const stream = new ReadableStream({
    async start(controller) {
      const response = await fetch(AGENT_CORE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      
      const reader = response.body.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(value);
      }
      
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

**Reconnection Strategy**:
- Exponential backoff: 1s, 2s, 4s, 8s, 16s (max)
- Display "Reconnecting..." indicator to users
- Preserve workflow state during disconnection
- Resume from last known state after reconnection

**Rationale**:
- Native EventSource is simpler and more performant than custom WebSocket
- TanStack Query cache integration provides automatic UI updates
- Next.js API route proxies SSE, hiding AgentCore endpoints from clients
- Exponential backoff prevents server overload during reconnection storms

**Alternatives Considered**:
- **WebSocket**: More complex, bidirectional not needed, harder to proxy
- **Long Polling**: Higher latency, more server load
- **GraphQL Subscriptions**: Requires WebSocket anyway, adds complexity

---

## 4. S3 Presigned URL Patterns

### Decision: Generate Presigned URLs via GraphQL, Direct Browser Upload

**Implementation Flow**:

```typescript
// 1. Request presigned URL from GraphQL API
const { data } = await useMutation({
  mutationFn: async (files: File[]) => {
    return graphqlClient.request(GENERATE_PRESIGNED_URLS, {
      projectId,
      files: files.map(f => ({
        fileName: f.name,
        fileType: f.type,
        fileSize: f.size
      }))
    });
  }
});

// 2. Upload directly to S3 with progress tracking
async function uploadToS3(file: File, presignedUrl: string) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        setProgress(percentComplete);
      }
    });
    
    xhr.addEventListener('load', () => resolve(xhr.response));
    xhr.addEventListener('error', () => reject(xhr.statusText));
    
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

// 3. Chunked upload for large files (>100MB)
async function uploadLargeFile(file: File, presignedUrls: string[]) {
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  const chunks = Math.ceil(file.size / chunkSize);
  
  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    await uploadToS3(chunk, presignedUrls[i]);
    setProgress(((i + 1) / chunks) * 100);
  }
}
```

**S3 CORS Configuration** (via CDK or Console):
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://app.bidops.ai", "http://localhost:3000"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

**File Validation**:
- Client-side: Check file type, size before requesting presigned URL
- Server-side: Validate MIME type and size in presigned URL generation
- Post-upload: Virus scanning (if required) via Lambda trigger

**Rationale**:
- Direct upload reduces backend load and improves upload speed
- Presigned URLs provide time-limited, secure access without exposing credentials
- Chunked uploads enable reliable transfer of 500MB files
- XMLHttpRequest provides better progress tracking than fetch API

**Alternatives Considered**:
- **Proxy through backend**: Slower, more server load, no advantage
- **AWS SDK in browser**: Requires exposing AWS credentials
- **Multipart upload**: More complex, presigned URLs sufficient for our use case

---

## 5. TipTap Editor Configuration

### Decision: TipTap v2 with JSON Output, Custom Extensions

**Core Configuration**:

```typescript
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      history: {
        depth: 100,
      },
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableCell,
    TableHeader,
    Placeholder.configure({
      placeholder: 'Start typing your content...',
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    Highlight.configure({
      multicolor: true,
    }),
  ],
  content: initialContent, // TipTap JSON format
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
    },
  },
});
```

**JSON Storage Format**:
```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "Document Title" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "This is " },
        { "type": "text", "marks": [{ "type": "bold" }], "text": "bold" },
        { "type": "text", "text": " text." }
      ]
    }
  ]
}
```

**Export to Word/PDF**:
- **Word**: Use `html-docx-js` library to convert HTML to .docx
- **PDF**: Use `jspdf` or server-side Puppeteer for better formatting
- Store exports in S3 alongside JSON content

**Custom Extensions**:
- Callout boxes for important notes
- Mention support for @user tagging
- Custom table of contents generation
- Version history tracking (future)

**Rationale**:
- TipTap v2 is production-ready with extensive plugin ecosystem
- JSON format enables structured storage and version control
- Prosemirror foundation provides excellent performance
- Extensible architecture supports custom requirements

**Alternatives Considered**:
- **Draft.js**: Deprecated by Facebook, limited maintenance
- **Slate**: More complex API, steeper learning curve
- **Quill**: Less flexible, harder to extend
- **TipTap v3**: Too early, plugins not stable

---

## 6. Responsive Design & Animation Performance

### Decision: Tailwind CSS + Framer Motion with Performance Budgets

**Responsive Breakpoints**:
```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      'xs': '320px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
  },
};
```

**Animation Performance Strategy**:

```typescript
// 1. Use GPU-accelerated properties only
const animation = {
  initial: { opacity: 0, y: 20 }, // ✅ opacity, transform
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.3,
    ease: 'easeOut',
  },
};

// 2. Avoid expensive properties
// ❌ Don't animate: width, height, top, left, padding, margin
// ✅ Do animate: opacity, transform (translate, scale, rotate)

// 3. Use will-change hint for known animations
<motion.div
  style={{ willChange: 'transform, opacity' }}
  animate={{ scale: isActive ? 1.1 : 1 }}
/>

// 4. Disable animations on low-end devices
const shouldAnimate = useReducedMotion();

// 5. Progress bar optimization
<motion.div
  className="h-2 bg-primary"
  style={{ 
    width: `${progress}%`,
    willChange: 'width', // Exception: width animation is acceptable here
  }}
  transition={{ duration: 0.3, ease: 'linear' }}
/>
```

**Performance Monitoring**:
```typescript
// Track Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

**Mobile-First Approach**:
```tsx
// Always start with mobile styles, then enhance
<div className="
  p-4 text-sm          // Mobile (320px+)
  md:p-6 md:text-base  // Tablet (768px+)
  lg:p-8 lg:text-lg    // Desktop (1024px+)
">
  Content
</div>
```

**Rationale**:
- Tailwind provides utility-first approach for rapid responsive development
- Framer Motion's declarative API simplifies complex animations
- GPU-accelerated transforms maintain 60fps performance
- Mobile-first ensures baseline usability on all devices

**Alternatives Considered**:
- **CSS Modules**: Less flexible, more verbose
- **Styled Components**: Runtime overhead, slower SSR
- **React Spring**: More complex API than Framer Motion
- **CSS Animations**: Less dynamic control, harder to sync with state

---

## 7. GraphQL Client Setup

### Decision: graphql-request + GraphQL Codegen

**Client Configuration**:

```typescript
// lib/graphql/client.ts
import { GraphQLClient } from 'graphql-request';

export const graphqlClient = new GraphQLClient(
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!,
  {
    headers: () => ({
      authorization: `Bearer ${getAuthToken()}`,
    }),
    // Request/response middleware
    requestMiddleware: (request) => {
      console.log('GraphQL Request:', request);
      return request;
    },
    responseMiddleware: (response) => {
      if (response instanceof Error) {
        console.error('GraphQL Error:', response);
      }
      return response;
    },
  }
);
```

**Code Generation Setup**:

```yaml
# codegen.yml
schema: 'https://api.bidops.ai/graphql'
documents: 'src/lib/graphql/**/*.ts'
generates:
  src/lib/graphql/generated.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-graphql-request
    config:
      skipTypename: false
      withHooks: false
      withComponent: false
      withHOC: false
      rawRequest: true
```

**TanStack Query Integration**:

```typescript
// hooks/queries/useProjects.ts
import { useQuery } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql/client';
import { GetProjectsDocument } from '@/lib/graphql/generated';

export function useProjects(filter?: ProjectFilter) {
  return useQuery({
    queryKey: ['projects', filter],
    queryFn: async () => {
      const { projects } = await graphqlClient.request(
        GetProjectsDocument,
        { filter }
      );
      return projects;
    },
    staleTime: 30000, // 30 seconds
    retry: 3,
  });
}
```

**Error Handling**:

```typescript
// Global error handler
graphqlClient.setHeader('authorization', `Bearer ${token}`);

try {
  const data = await graphqlClient.request(query, variables);
  return data;
} catch (error) {
  if (error.response?.errors) {
    // Handle GraphQL errors
    error.response.errors.forEach((err) => {
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        // Redirect to login
        router.push('/signin');
      }
    });
  }
  throw error;
}
```

**Rationale**:
- graphql-request is lightweight (5KB) vs Apollo Client (150KB+)
- Codegen provides full type safety without manual type definitions
- TanStack Query handles caching, refetching, and state management
- Simpler API reduces boilerplate compared to Apollo

**Alternatives Considered**:
- **Apollo Client**: Feature-rich but overkill for our needs, large bundle
- **URQL**: Good middle ground but less community support
- **Relay**: Too opinionated, steep learning curve
- **Direct fetch**: No type safety, manual cache management

---

## 8. Docker & ECS Deployment

### Decision: Multi-stage Docker Build with Next.js Standalone Output

**Development Dockerfile** (`Dockerfile.dev`):

```dockerfile
FROM node:24-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Expose port and enable hot reload
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=development

# Start dev server with hot reload
CMD ["npm", "run", "dev"]
```

**Production Dockerfile** (`Dockerfile`):

```dockerfile
# Stage 1: Dependencies
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Runner
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

**Next.js Configuration** for Standalone Output:

```javascript
// next.config.js
module.exports = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Other optimizations
};
```

**ECS Task Definition**:

```json
{
  "family": "bidops-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "web",
      "image": "<ECR_IMAGE>",
      "portMappings": [{
        "containerPort": 3000,
        "protocol": "tcp"
      }],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/bidops-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "3000" }
      ],
      "secrets": [
        {
          "name": "NEXT_PUBLIC_COGNITO_USER_POOL_ID",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:name"
        }
      ]
    }
  ]
}
```

**Health Check Endpoint**:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
```

**Rationale**:
- Multi-stage builds reduce final image size to <200MB
- Next.js standalone output bundles only necessary files
- Fargate simplifies infrastructure management vs EC2
- Health checks enable ECS to restart unhealthy containers
- CloudWatch logs provide centralized logging

**Alternatives Considered**:
- **Single-stage Docker**: Larger images (1GB+), slower deploys
- **EC2 with Docker Compose**: More operational overhead
- **Vercel**: Vendor lock-in, cost at scale, less control
- **Kubernetes**: Overkill for single frontend service

---

## 9. CDK Stack Configuration

### Decision: TypeScript CDK v2 with Cognito User Pool + OAuth

**CDK Stack Structure**:

```typescript
// infra/cdk/lib/cognito-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class CognitoStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly identityPool: cognito.CfnIdentityPool;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create User Pool
    this.userPool = new cognito.UserPool(this, 'BidOpsUserPool', {
      userPoolName: 'bidops-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        roles: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(7),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create User Pool Client
    this.userPoolClient = this.userPool.addClient('BidOpsWebClient', {
      userPoolClientName: 'web-app',
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          'http://localhost:3000',
          'https://app.bidops.ai',
        ],
        logoutUrls: [
          'http://localhost:3000',
          'https://app.bidops.ai',
        ],
      },
      preventUserExistenceErrors: true,
    });

    // Configure Google OAuth
    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(
      this,
      'Google',
      {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        userPool: this.userPool,
        scopes: ['email', 'profile', 'openid'],
        attributeMapping: {
          email: cognito.ProviderAttribute.GOOGLE_EMAIL,
          givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
          familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
          profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
        },
      }
    );

    this.userPoolClient.node.addDependency(googleProvider);

    // Create User Pool Domain
    this.userPool.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix: 'bidops-auth',
      },
    });

    // Create Identity Pool for AWS resource access
    this.identityPool = new cognito.CfnIdentityPool(
      this,
      'BidOpsIdentityPool',
      {
        identityPoolName: 'bidops-identity',
        allowUnauthenticatedIdentities: false,
        cognitoIdentityProviders: [
          {
            clientId: this.userPoolClient.userPoolClientId,
            providerName: this.userPool.userPoolProviderName,
          },
        ],
      }
    );

    // Outputs for frontend configuration
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'BidOpsUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'BidOpsUserPoolClientId',
    });

    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: this.identityPool.ref,
      description: 'Cognito Identity Pool ID',
      exportName: 'BidOpsIdentityPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolDomain', {
      value: `https://bidops-auth.auth.${this.region}.amazoncognito.com`,
      description: 'Cognito User Pool Domain',
      exportName: 'BidOpsUserPoolDomain',
    });
  }
}
```

**CDK App Entry**:

```typescript
// infra/cdk/bin/app.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CognitoStack } from '../lib/cognito-stack';

const app = new cdk.App();

new CognitoStack(app, 'BidOpsCognitoStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Environment: process.env.ENVIRONMENT || 'development',
    Project: 'BidOps',
    ManagedBy: 'CDK',
  },
});
```

**Deployment Commands**:

```bash
# Install dependencies
cd infra/cdk && npm install

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy stack
cdk deploy BidOpsCognitoStack

# Get outputs
aws cloudformation describe-stacks \
  --stack-name BidOpsCognitoStack \
  --query 'Stacks[0].Outputs'
```

**Manual Steps Required**:

1. **Google OAuth Setup**:
   - Create project in Google Cloud Console
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs: `https://bidops-auth.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`
   - Store Client ID and Secret in environment variables

2. **Post-Deployment**:
   - Copy CDK outputs to frontend `.env.local`:
     ```
     NEXT_PUBLIC_COGNITO_USER_POOL_ID=<UserPoolId>
     NEXT_PUBLIC_COGNITO_CLIENT_ID=<UserPoolClientId>
     NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=<IdentityPoolId>
     NEXT_PUBLIC_COGNITO_DOMAIN=<UserPoolDomain>
     ```

3. **Initial User Roles**:
   - Create admin user via Cognito console
   - Set `custom:roles` attribute to `["Admin"]`
   - Admin can then create other users via the app

**Rationale**:
- CDK provides type-safe infrastructure as code
- All Cognito configuration in version control
- Reproducible across environments (dev, staging, prod)
- Outputs automatically configure frontend
- Google OAuth integrated without manual console clicks

**Alternatives Considered**:
- **Terraform**: Less AWS-native, more verbose HCL
- **CloudFormation YAML**: Less type-safe, harder to maintain
- **Manual Console**: Not reproducible, error-prone
- **AWS Amplify CLI**: Less flexible, opinionated structure

---

## 10. Testing Strategy

### Decision: Multi-layer Testing with Jest, RTL, Playwright

**Testing Pyramid**:

```
        E2E Tests (Playwright)
       /                      \
  Integration Tests (Jest + MSW)
 /                                \
Unit Tests (Jest + React Testing Library)
```

**Unit Testing Setup**:

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

// jest.setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Component Testing Example**:

```typescript
// components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

**Integration Testing with MSW**:

```typescript
// mocks/handlers.ts
import { graphql } from 'msw';

export const handlers = [
  graphql.query('GetProjects', (req, res, ctx) => {
    return res(
      ctx.data({
        projects: {
          edges: [
            {
              node: {
                id: '1',
                name: 'Test Project',
                status: 'IN_PROGRESS',
              },
            },
          ],
        },
      })
    );
  }),
];

// hooks/queries/useProjects.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjects } from './useProjects';

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

test('fetches projects successfully', async () => {
  const { result } = renderHook(() => useProjects(), { wrapper });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  
  expect(result.current.data).toHaveLength(1);
  expect(result.current.data[0].name).toBe('Test Project');
});
```

**E2E Testing with Playwright**:

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can sign in with username and password', async ({ page }) => {
    await page.goto('/signin');
    
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/signin');
    
    await page.fill('[name="username"]', 'invalid');
    await page.fill('[name="password"]', 'wrong');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('[role="alert"]')).toContainText(
      'Invalid username or password'
    );
  });
});
```

**Contract Testing**:

```typescript
// lib/graphql/__tests__/schema-contract.test.ts
import { buildSchema } from 'graphql';
import { readFileSync } from 'fs';

test('GraphQL operations match backend schema', () => {
  const schemaSDL = readFileSync(
    '../../docs/architecture/core-api/gql-schema.md',
    'utf-8'
  );
  
  const schema = buildSchema(schemaSDL);
  
  // Validate all operations against schema
  const operations = [
    GetProjectsDocument,
    CreateProjectDocument,
    UpdateProjectDocument,
    // ... all operations
  ];
  
  operations.forEach((operation) => {
    expect(() => validate(schema, operation)).not.toThrow();
  });
});
```

**Testing SSE Streams**:

```typescript
// hooks/streams/useWorkflowStream.test.tsx
import { renderHook } from '@testing-library/react';
import { useWorkflowStream } from './useWorkflowStream';

test('updates state on SSE events', async () => {
  const mockEventSource = {
    addEventListener: jest.fn(),
    close: jest.fn(),
  };
  
  global.EventSource = jest.fn(() => mockEventSource);
  
  const { result } = renderHook(() => useWorkflowStream('workflow-1'));
  
  // Simulate SSE event
  const messageHandler = mockEventSource.addEventListener.mock.calls
    .find(([event]) => event === 'message')[1];
  
  messageHandler({
    data: JSON.stringify({
      type: 'agent_update',
      workflowId: 'workflow-1',
      status: 'IN_PROGRESS',
    }),
  });
  
  await waitFor(() => {
    expect(result.current.data?.status).toBe('IN_PROGRESS');
  });
});
```

**Coverage Goals**:
- Unit tests: 70%+ coverage
- Integration tests: All API hooks and state management
- E2E tests: Critical user flows (auth, project creation, workflow execution)
- Contract tests: All GraphQL operations

**Rationale**:
- Jest + RTL provide fast, reliable component testing
- MSW enables realistic API mocking without backend
- Playwright offers reliable cross-browser E2E testing
- Contract tests ensure frontend/backend alignment

**Alternatives Considered**:
- **Cypress**: Great tool but Playwright has better TypeScript support
- **Testing Library only**: Need E2E for full user flows
- **Enzyme**: Deprecated for React Testing Library
- **Vitest**: Newer but Jest has more ecosystem support

---

## Summary of Key Decisions

| Area | Decision | Primary Rationale |
|------|----------|------------------|
| **React Version** | React 19.0.0 | Stable Server Components, improved hydration |
| **Editor** | TipTap v2.10.4 | Production-ready, extensive plugins, JSON storage |
| **Auth** | AWS Amplify Gen 2 + Cognito | Simplified integration, TypeScript support |
| **SSE** | Native EventSource + TanStack Query | Lightweight, performant, automatic cache updates |
| **File Upload** | Presigned URLs + Direct S3 | Reduced backend load, better performance |
| **GraphQL Client** | graphql-request + Codegen | Lightweight, type-safe, simple API |
| **Docker** | Multi-stage with standalone output | Small images (<200MB), faster deploys |
| **IaC** | CDK v2 TypeScript | Type-safe, reproducible, AWS-native |
| **Testing** | Jest + RTL + Playwright | Comprehensive coverage, reliable, fast |
| **Styling** | Tailwind CSS 4 | Rapid development, small bundle, flexible |

---

## Next Steps

With all research complete, proceed to:

1. **Phase 1**: Generate `data-model.md` with frontend data structures
2. **Phase 1**: Create GraphQL operation contracts in `/contracts/`
3. **Phase 1**: Write `quickstart.md` for local development setup
4. **Phase 1**: Update agent context with technology stack

**Phase 0 Status**: ✅ **COMPLETE**