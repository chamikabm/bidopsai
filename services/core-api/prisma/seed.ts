/**
 * Database Seed Script
 * 
 * Populates the database with initial data including:
 * - Roles and permissions
 * - Test users (synced with Cognito)
 * - Sample projects and knowledge bases
 * - Agent configurations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Test users that exist in Cognito (created via create-test-users.sh)
 * These must match the Cognito users created in infra/cdk/scripts/create-test-users.sh
 */
const COGNITO_TEST_USERS = [
  {
    email: 'admin@bidopsai.com',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    cognitoUserId: '592e1418-d091-70f0-8666-02fd202c2231', // Actual Cognito ID from AWS
    roles: ['ADMIN', 'PROJECT_MANAGER', 'ANALYST'],
  },
  {
    email: 'viewer@bidopsai.com',
    username: 'viewer',
    firstName: 'Viewer',
    lastName: 'User',
    cognitoUserId: 'cognito-viewer-user-id', // TODO: Update with actual Cognito ID after creating user
    roles: ['VIEWER'],
  },
  {
    email: 'manager@bidopsai.com',
    username: 'manager',
    firstName: 'Manager',
    lastName: 'User',
    cognitoUserId: 'cognito-manager-user-id', // TODO: Update with actual Cognito ID after creating user
    roles: ['PROJECT_MANAGER'],
  },
];

/**
 * System roles with permissions
 */
const ROLES_WITH_PERMISSIONS = [
  {
    name: 'ADMIN',
    description: 'Full system access with all permissions',
    permissions: [
      { resource: 'USER', action: 'CREATE' },
      { resource: 'USER', action: 'READ' },
      { resource: 'USER', action: 'UPDATE' },
      { resource: 'USER', action: 'DELETE' },
      { resource: 'PROJECT', action: 'CREATE' },
      { resource: 'PROJECT', action: 'READ' },
      { resource: 'PROJECT', action: 'UPDATE' },
      { resource: 'PROJECT', action: 'DELETE' },
      { resource: 'KNOWLEDGE_BASE', action: 'CREATE' },
      { resource: 'KNOWLEDGE_BASE', action: 'READ' },
      { resource: 'KNOWLEDGE_BASE', action: 'UPDATE' },
      { resource: 'KNOWLEDGE_BASE', action: 'DELETE' },
      { resource: 'ARTIFACT', action: 'CREATE' },
      { resource: 'ARTIFACT', action: 'READ' },
      { resource: 'ARTIFACT', action: 'UPDATE' },
      { resource: 'ARTIFACT', action: 'DELETE' },
      { resource: 'ARTIFACT', action: 'APPROVE' },
      { resource: 'WORKFLOW', action: 'START' },
      { resource: 'WORKFLOW', action: 'STOP' },
      { resource: 'AGENT_CONFIG', action: 'UPDATE' },
      { resource: 'INTEGRATION', action: 'CONFIGURE' },
      { resource: 'DASHBOARD', action: 'READ' },
    ],
  },
  {
    name: 'PROJECT_MANAGER',
    description: 'Manage projects and workflows',
    permissions: [
      { resource: 'PROJECT', action: 'CREATE' },
      { resource: 'PROJECT', action: 'READ' },
      { resource: 'PROJECT', action: 'UPDATE' },
      { resource: 'KNOWLEDGE_BASE', action: 'CREATE' },
      { resource: 'KNOWLEDGE_BASE', action: 'READ' },
      { resource: 'KNOWLEDGE_BASE', action: 'UPDATE' },
      { resource: 'ARTIFACT', action: 'CREATE' },
      { resource: 'ARTIFACT', action: 'READ' },
      { resource: 'ARTIFACT', action: 'UPDATE' },
      { resource: 'ARTIFACT', action: 'APPROVE' },
      { resource: 'WORKFLOW', action: 'START' },
      { resource: 'USER', action: 'READ' },
      { resource: 'DASHBOARD', action: 'READ' },
    ],
  },
  {
    name: 'ANALYST',
    description: 'Analyze data and create artifacts',
    permissions: [
      { resource: 'PROJECT', action: 'READ' },
      { resource: 'KNOWLEDGE_BASE', action: 'READ' },
      { resource: 'ARTIFACT', action: 'CREATE' },
      { resource: 'ARTIFACT', action: 'READ' },
      { resource: 'ARTIFACT', action: 'UPDATE' },
      { resource: 'DASHBOARD', action: 'READ' },
    ],
  },
  {
    name: 'VIEWER',
    description: 'Read-only access to projects and artifacts',
    permissions: [
      { resource: 'PROJECT', action: 'READ' },
      { resource: 'ARTIFACT', action: 'READ' },
      { resource: 'KNOWLEDGE_BASE', action: 'READ' },
      { resource: 'DASHBOARD', action: 'READ' },
    ],
  },
];

/**
 * Agent configurations for the agentic workflow
 */
const AGENT_CONFIGURATIONS = [
  {
    agentType: 'SUPERVISOR',
    modelName: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    temperature: 0.5,
    maxTokens: 4096,
    systemPrompt: {
      role: 'You are the Supervisor Agent for BidOps.AI, orchestrating the multi-agent workflow for RFP/Bid processing.',
      capabilities: [
        'Workflow orchestration and task delegation',
        'Error handling and recovery',
        'User feedback processing',
        'Decision-making based on agent outputs',
      ],
    },
    enabled: true,
  },
  {
    agentType: 'PARSER',
    modelName: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    temperature: 0.3,
    maxTokens: 8192,
    systemPrompt: {
      role: 'You are the Parser Agent, responsible for processing and extracting structured data from uploaded documents.',
      capabilities: ['Document parsing', 'Data extraction', 'Text normalization'],
    },
    enabled: true,
  },
  {
    agentType: 'ANALYSIS',
    modelName: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    temperature: 0.4,
    maxTokens: 8192,
    systemPrompt: {
      role: 'You are the Analysis Agent, responsible for analyzing RFP/Bid requirements and generating comprehensive analysis reports.',
      capabilities: [
        'Requirement analysis',
        'Opportunity identification',
        'Process mapping',
        'Markdown report generation',
      ],
    },
    enabled: true,
  },
  {
    agentType: 'CONTENT',
    modelName: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    temperature: 0.6,
    maxTokens: 16384,
    systemPrompt: {
      role: 'You are the Content Agent, responsible for creating bid artifacts and documents using historical knowledge.',
      capabilities: [
        'Artifact generation',
        'Knowledge base retrieval',
        'TipTap JSON formatting',
        'Q&A document creation',
      ],
    },
    enabled: true,
  },
  {
    agentType: 'COMPLIANCE',
    modelName: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    temperature: 0.2,
    maxTokens: 8192,
    systemPrompt: {
      role: 'You are the Compliance Agent, ensuring all artifacts meet regulatory standards and company policies.',
      capabilities: [
        'Compliance checking',
        'Standards verification',
        'Policy enforcement',
        'Feedback generation',
      ],
    },
    enabled: true,
  },
  {
    agentType: 'QA',
    modelName: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    temperature: 0.3,
    maxTokens: 8192,
    systemPrompt: {
      role: 'You are the QA Agent, verifying artifact quality and completeness against requirements.',
      capabilities: [
        'Quality assurance',
        'Completeness verification',
        'Gap analysis',
        'Issue identification',
      ],
    },
    enabled: true,
  },
  {
    agentType: 'COMMS',
    modelName: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    temperature: 0.4,
    maxTokens: 4096,
    systemPrompt: {
      role: 'You are the Communications Agent, managing notifications and team communications.',
      capabilities: [
        'Notification creation',
        'Slack integration',
        'Email composition',
        'Team coordination',
      ],
    },
    enabled: true,
  },
  {
    agentType: 'SUBMISSION',
    modelName: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    temperature: 0.3,
    maxTokens: 4096,
    systemPrompt: {
      role: 'You are the Submission Agent, handling bid submission and email delivery.',
      capabilities: [
        'Email composition',
        'Attachment management',
        'Submission tracking',
        'Portal integration',
      ],
    },
    enabled: true,
  },
  {
    agentType: 'KNOWLEDGE',
    modelName: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    temperature: 0.4,
    maxTokens: 8192,
    systemPrompt: {
      role: 'You are the Knowledge Agent, retrieving relevant information from Bedrock Knowledge Bases.',
      capabilities: [
        'Knowledge base querying',
        'Context retrieval',
        'Historical bid data access',
        'Semantic search',
      ],
    },
    enabled: true,
  },
];

/**
 * Sample global knowledge bases
 */
const GLOBAL_KNOWLEDGE_BASES = [
  {
    name: 'Company Profile & Credentials',
    description: 'Corporate profile, legal entity info, financial stability, certifications (ISO, SOC2, GDPR)',
    scope: 'GLOBAL',
    documentCount: 0,
    vectorStoreId: null,
  },
  {
    name: 'Past Bids & Proposals',
    description: 'Historical successful bids, proposal templates, and winning strategies',
    scope: 'GLOBAL',
    documentCount: 0,
    vectorStoreId: null,
  },
  {
    name: 'Technical References',
    description: 'System designs, architecture patterns, technical documentation',
    scope: 'GLOBAL',
    documentCount: 0,
    vectorStoreId: null,
  },
  {
    name: 'Case Studies & References',
    description: 'Successfully delivered projects, client testimonials, case studies',
    scope: 'GLOBAL',
    documentCount: 0,
    vectorStoreId: null,
  },
];

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // 1. Create Roles and Permissions
    console.log('📝 Creating roles and permissions...');
    for (const roleData of ROLES_WITH_PERMISSIONS) {
      const { permissions, ...roleInfo } = roleData;
      
      const role = await prisma.role.upsert({
        where: { name: roleInfo.name },
        update: roleInfo,
        create: roleInfo,
      });

      // Create permissions for this role
      for (const perm of permissions) {
        await prisma.permission.upsert({
          where: {
            roleId_resource_action: {
              roleId: role.id,
              resource: perm.resource,
              action: perm.action,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            resource: perm.resource,
            action: perm.action,
          },
        });
      }

      console.log(`  ✓ Created role: ${roleInfo.name} with ${permissions.length} permissions`);
    }

    // 2. Create Test Users (synced with Cognito)
    console.log('\n👥 Creating test users...');
    const createdUsers: Record<string, any> = {};

    for (const userData of COGNITO_TEST_USERS) {
      const { roles, ...userInfo } = userData;
      
      const user = await prisma.user.upsert({
        where: { email: userInfo.email },
        update: {
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          emailVerified: true,
        },
        create: {
          ...userInfo,
          emailVerified: true,
          lastLogin: new Date(),
        },
      });

      createdUsers[userInfo.email] = user;

      // Assign roles to user
      for (const roleName of roles) {
        const role = await prisma.role.findUnique({ where: { name: roleName } });
        if (role) {
          await prisma.userRole.upsert({
            where: {
              userId_roleId: {
                userId: user.id,
                roleId: role.id,
              },
            },
            update: {},
            create: {
              userId: user.id,
              roleId: role.id,
              assignedBy: user.id, // Self-assigned for seed
            },
          });
        }
      }

      console.log(`  ✓ Created user: ${userInfo.email} with roles: ${roles.join(', ')}`);
    }

    // 3. Create Agent Configurations
    console.log('\n🤖 Creating agent configurations...');
    for (const agentConfig of AGENT_CONFIGURATIONS) {
      await prisma.agentConfiguration.upsert({
        where: { agentType: agentConfig.agentType },
        update: agentConfig,
        create: agentConfig,
      });
      console.log(`  ✓ Created agent config: ${agentConfig.agentType}`);
    }

    // 4. Create Global Knowledge Bases
    console.log('\n📚 Creating global knowledge bases...');
    const adminUser = createdUsers['admin@bidopsai.com'];
    
    for (const kbData of GLOBAL_KNOWLEDGE_BASES) {
      // Check if knowledge base already exists
      const existingKB = await prisma.knowledgeBase.findFirst({
        where: {
          name: kbData.name,
          scope: kbData.scope,
        },
      });

      if (!existingKB) {
        await prisma.knowledgeBase.create({
          data: {
            ...kbData,
            createdBy: adminUser.id,
          },
        });
        console.log(`  ✓ Created knowledge base: ${kbData.name}`);
      } else {
        console.log(`  ✓ Knowledge base already exists: ${kbData.name}`);
      }
    }

    // 5. Create Sample Project (Optional - for testing)
    console.log('\n📋 Creating sample project...');
    const sampleProjectName = 'Sample RFP - Government Digital Transformation';
    
    // Check if sample project already exists
    let sampleProject = await prisma.project.findFirst({
      where: { name: sampleProjectName },
    });

    if (!sampleProject) {
      sampleProject = await prisma.project.create({
        data: {
          name: sampleProjectName,
          description: 'Sample project for testing the BidOps.AI workflow with a government digital transformation RFP',
          status: 'OPEN',
          value: 500000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          progressPercentage: 0,
          createdBy: adminUser.id,
          metadata: {
            client: 'Sample Government Agency',
            domain: 'Digital Transformation',
            priority: 'HIGH',
          },
        },
      });
      console.log(`  ✓ Created sample project: ${sampleProject.name}`);
    } else {
      console.log(`  ✓ Sample project already exists: ${sampleProject.name}`);
    }

    // 6. Add project members
    const managerUser = createdUsers['manager@bidopsai.com'];
    
    // Check if project member already exists
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId: sampleProject.id,
        userId: managerUser.id,
      },
    });

    if (!existingMember) {
      await prisma.projectMember.create({
        data: {
          projectId: sampleProject.id,
          userId: managerUser.id,
          addedById: adminUser.id,
        },
      });
      console.log(`  ✓ Added project member: ${managerUser.email}`);
    } else {
      console.log(`  ✓ Project member already exists: ${managerUser.email}`);
    }

    // 7. Create Integration records (placeholders)
    console.log('\n🔌 Creating integration records...');
    const integrations = [
      {
        type: 'SLACK',
        name: 'Slack Workspace',
        configuration: { webhookUrl: null, botToken: null, enabled: false },
        enabled: false,
        createdBy: adminUser.id,
      },
      {
        type: 'EMAIL',
        name: 'Email Service (SES)',
        configuration: { region: 'us-east-1', fromAddress: 'noreply@bidopsai.com' },
        enabled: true,
        createdBy: adminUser.id,
      },
      {
        type: 'S3',
        name: 'S3 Document Storage',
        configuration: { bucket: process.env.S3_BUCKET || 'bidopsai-documents', region: 'us-east-1' },
        enabled: true,
        createdBy: adminUser.id,
      },
    ];

    for (const integration of integrations) {
      await prisma.integration.upsert({
        where: { type: integration.type },
        update: integration,
        create: integration,
      });
      console.log(`  ✓ Created integration: ${integration.name}`);
    }

    console.log('\n✅ Database seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`  • ${ROLES_WITH_PERMISSIONS.length} roles with permissions`);
    console.log(`  • ${COGNITO_TEST_USERS.length} test users`);
    console.log(`  • ${AGENT_CONFIGURATIONS.length} agent configurations`);
    console.log(`  • ${GLOBAL_KNOWLEDGE_BASES.length} global knowledge bases`);
    console.log(`  • 1 sample project`);
    console.log(`  • ${integrations.length} integration records`);

  } catch (error) {
    console.error('\n❌ Error during seed:', error);
    throw error;
  }
}

async function main() {
  try {
    await seed();
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();