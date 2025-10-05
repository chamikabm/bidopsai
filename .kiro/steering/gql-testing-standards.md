---
inclusion: fileMatch
fileMatchPattern: "services/core-api/**/*.{test,spec}.{ts,js}"
---

# GraphQL API Testing Standards

## Test-Driven Development (TDD) for GraphQL

### TDD Workflow for GraphQL APIs
**MANDATORY**: Follow TDD for all GraphQL resolvers and services

1. **Red**: Write failing GraphQL operation test
2. **Green**: Implement minimal resolver to make test pass
3. **Refactor**: Improve resolver while keeping tests green

### Testing Requirements
- **100% test coverage** for all resolvers and business logic
- **All new resolvers** must have tests written BEFORE implementation
- **All bug fixes** must include regression tests
- **Integration tests** for complete GraphQL operations

## Testing Architecture

### Test Setup and Configuration
```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { join } from 'path'

// Test database setup
const generateDatabaseURL = (schema: string) => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  return `${process.env.DATABASE_URL.split('?')[0]}?schema=${schema}`
}

export async function setupTestDatabase() {
  const schema = `test_${Math.random().toString(36).substring(7)}`
  const databaseUrl = generateDatabaseURL(schema)
  
  process.env.DATABASE_URL = databaseUrl
  
  // Run migrations
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl }
  })
  
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } }
  })
  
  return { prisma, schema }
}

export async function teardownTestDatabase(prisma: PrismaClient, schema: string) {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
  await prisma.$disconnect()
}
```

### GraphQL Test Client
```typescript
// tests/graphql-client.ts
import { ApolloServer } from '@apollo/server'
import { buildSubgraphSchema } from '@apollo/subgraph'
import { PrismaClient } from '@prisma/client'
import { typeDefs } from '../src/schema'
import { resolvers } from '../src/resolvers'
import { createDataLoaders } from '../src/dataloaders'

interface TestContext {
  prisma: PrismaClient
  user?: AuthenticatedUser
}

export class GraphQLTestClient {
  private server: ApolloServer
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    this.server = new ApolloServer({
      schema: buildSubgraphSchema({ typeDefs, resolvers }),
      introspection: true
    })
  }

  async query<T = any>(
    query: string,
    variables?: Record<string, any>,
    user?: AuthenticatedUser
  ): Promise<{ data?: T; errors?: any[] }> {
    const response = await this.server.executeOperation(
      { query, variables },
      {
        contextValue: {
          prisma: this.prisma,
          user,
          dataSources: createDataLoaders(this.prisma),
          req: {} as any,
          res: {} as any
        }
      }
    )

    return {
      data: response.body.kind === 'single' ? response.body.singleResult.data : undefined,
      errors: response.body.kind === 'single' ? response.body.singleResult.errors : undefined
    }
  }

  async mutate<T = any>(
    mutation: string,
    variables?: Record<string, any>,
    user?: AuthenticatedUser
  ): Promise<{ data?: T; errors?: any[] }> {
    return this.query<T>(mutation, variables, user)
  }
}
```

## TDD Resolver Development Pattern

### 1. Query Resolver TDD Example
```typescript
// tests/resolvers/project.resolver.test.ts
describe('Project Resolver', () => {
  let testClient: GraphQLTestClient
  let prisma: PrismaClient
  let testUser: User

  beforeEach(async () => {
    const setup = await setupTestDatabase()
    prisma = setup.prisma
    testClient = new GraphQLTestClient(prisma)
    
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        cognitoUserId: 'test-cognito-id'
      }
    })
  })

  afterEach(async () => {
    await teardownTestDatabase(prisma, schema)
  })

  describe('projects query', () => {
    // RED: Write failing test first
    it('should return projects accessible to the user', async () => {
      // Arrange: Create test data
      const project1 = await prisma.project.create({
        data: {
          name: 'Project 1',
          status: 'DRAFT',
          createdById: testUser.id,
          progressPercentage: 0
        }
      })

      const project2 = await prisma.project.create({
        data: {
          name: 'Project 2',
          status: 'IN_PROGRESS',
          createdById: testUser.id,
          progressPercentage: 50
        }
      })

      // Act: Execute GraphQL query
      const query = `
        query GetProjects($filter: ProjectFilterInput) {
          projects(filter: $filter) {
            edges {
              node {
                id
                name
                status
                progressPercentage
                createdBy {
                  id
                  email
                }
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
            totalCount
          }
        }
      `

      const response = await testClient.query(query, {}, {
        id: testUser.id,
        email: testUser.email,
        roles: [],
        cognitoUserId: testUser.cognitoUserId
      })

      // Assert: Verify response
      expect(response.errors).toBeUndefined()
      expect(response.data?.projects.edges).toHaveLength(2)
      expect(response.data?.projects.totalCount).toBe(2)
      
      const projects = response.data?.projects.edges.map((edge: any) => edge.node)
      expect(projects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: project1.id,
            name: 'Project 1',
            status: 'DRAFT',
            progressPercentage: 0
          }),
          expect.objectContaining({
            id: project2.id,
            name: 'Project 2',
            status: 'IN_PROGRESS',
            progressPercentage: 50
          })
        ])
      )
    })

    // GREEN: Implement minimal resolver
    it('should filter projects by status', async () => {
      // Create projects with different statuses
      await prisma.project.createMany({
        data: [
          { name: 'Draft Project', status: 'DRAFT', createdById: testUser.id, progressPercentage: 0 },
          { name: 'Active Project', status: 'IN_PROGRESS', createdById: testUser.id, progressPercentage: 25 },
          { name: 'Completed Project', status: 'COMPLETED', createdById: testUser.id, progressPercentage: 100 }
        ]
      })

      const query = `
        query GetProjectsByStatus($filter: ProjectFilterInput) {
          projects(filter: $filter) {
            edges {
              node {
                name
                status
              }
            }
          }
        }
      `

      const response = await testClient.query(query, {
        filter: { status: 'IN_PROGRESS' }
      }, {
        id: testUser.id,
        email: testUser.email,
        roles: [],
        cognitoUserId: testUser.cognitoUserId
      })

      expect(response.errors).toBeUndefined()
      expect(response.data?.projects.edges).toHaveLength(1)
      expect(response.data?.projects.edges[0].node.name).toBe('Active Project')
    })

    // REFACTOR: Test edge cases and error scenarios
    it('should return empty list when user has no projects', async () => {
      const query = `
        query GetProjects {
          projects {
            edges {
              node {
                id
              }
            }
            totalCount
          }
        }
      `

      const response = await testClient.query(query, {}, {
        id: testUser.id,
        email: testUser.email,
        roles: [],
        cognitoUserId: testUser.cognitoUserId
      })

      expect(response.errors).toBeUndefined()
      expect(response.data?.projects.edges).toHaveLength(0)
      expect(response.data?.projects.totalCount).toBe(0)
    })

    it('should require authentication', async () => {
      const query = `
        query GetProjects {
          projects {
            edges {
              node {
                id
              }
            }
          }
        }
      `

      const response = await testClient.query(query)

      expect(response.errors).toBeDefined()
      expect(response.errors?.[0].extensions?.code).toBe('AUTHENTICATION_REQUIRED')
    })
  })
})
```

### 2. Mutation Resolver TDD Example
```typescript
describe('createProject mutation', () => {
  // RED: Write failing test first
  it('should create a new project with valid input', async () => {
    const mutation = `
      mutation CreateProject($input: CreateProjectInput!) {
        createProject(input: $input) {
          id
          name
          description
          status
          createdBy {
            id
            email
          }
          members {
            user {
              id
            }
          }
        }
      }
    `

    const input = {
      name: 'New Test Project',
      description: 'Test project description',
      knowledgeBaseIds: [],
      userIds: [testUser.id]
    }

    const response = await testClient.mutate(mutation, { input }, {
      id: testUser.id,
      email: testUser.email,
      roles: [{ name: 'ADMIN', permissions: ['project:create'] }],
      cognitoUserId: testUser.cognitoUserId
    })

    expect(response.errors).toBeUndefined()
    expect(response.data?.createProject).toMatchObject({
      name: 'New Test Project',
      description: 'Test project description',
      status: 'DRAFT',
      createdBy: {
        id: testUser.id,
        email: testUser.email
      }
    })

    // Verify database state
    const createdProject = await prisma.project.findFirst({
      where: { name: 'New Test Project' }
    })
    expect(createdProject).toBeTruthy()
  })

  // GREEN: Test validation
  it('should validate required fields', async () => {
    const mutation = `
      mutation CreateProject($input: CreateProjectInput!) {
        createProject(input: $input) {
          id
        }
      }
    `

    const input = {
      name: '', // Invalid: empty name
      knowledgeBaseIds: [] // Invalid: no knowledge bases
    }

    const response = await testClient.mutate(mutation, { input }, {
      id: testUser.id,
      email: testUser.email,
      roles: [{ name: 'ADMIN', permissions: ['project:create'] }],
      cognitoUserId: testUser.cognitoUserId
    })

    expect(response.errors).toBeDefined()
    expect(response.errors?.[0].extensions?.code).toBe('VALIDATION_ERROR')
    expect(response.errors?.[0].extensions?.details?.fieldErrors).toMatchObject({
      name: expect.arrayContaining(['Project name is required']),
      knowledgeBaseIds: expect.arrayContaining(['Select at least one knowledge base'])
    })
  })

  // REFACTOR: Test authorization
  it('should require proper permissions', async () => {
    const mutation = `
      mutation CreateProject($input: CreateProjectInput!) {
        createProject(input: $input) {
          id
        }
      }
    `

    const input = {
      name: 'Test Project',
      knowledgeBaseIds: ['kb-1']
    }

    const response = await testClient.mutate(mutation, { input }, {
      id: testUser.id,
      email: testUser.email,
      roles: [{ name: 'VIEWER', permissions: [] }], // No create permission
      cognitoUserId: testUser.cognitoUserId
    })

    expect(response.errors).toBeDefined()
    expect(response.errors?.[0].extensions?.code).toBe('FORBIDDEN')
  })
})
```

## Integration Testing

### End-to-End GraphQL Operations
```typescript
// tests/integration/project-workflow.test.ts
describe('Project Workflow Integration', () => {
  let testClient: GraphQLTestClient
  let prisma: PrismaClient
  let adminUser: User
  let regularUser: User

  beforeEach(async () => {
    const setup = await setupTestDatabase()
    prisma = setup.prisma
    testClient = new GraphQLTestClient(prisma)
    
    // Create test users with different roles
    adminUser = await createTestUser(prisma, 'admin@example.com', ['ADMIN'])
    regularUser = await createTestUser(prisma, 'user@example.com', ['BIDDER'])
  })

  it('should complete full project creation and management workflow', async () => {
    // Step 1: Create knowledge base
    const createKBMutation = `
      mutation CreateKnowledgeBase($input: CreateKnowledgeBaseInput!) {
        createKnowledgeBase(input: $input) {
          id
          name
          scope
        }
      }
    `

    const kbResponse = await testClient.mutate(createKBMutation, {
      input: {
        name: 'Test Knowledge Base',
        description: 'Test KB for integration test',
        scope: 'GLOBAL'
      }
    }, adminUser)

    expect(kbResponse.errors).toBeUndefined()
    const knowledgeBaseId = kbResponse.data?.createKnowledgeBase.id

    // Step 2: Create project
    const createProjectMutation = `
      mutation CreateProject($input: CreateProjectInput!) {
        createProject(input: $input) {
          id
          name
          members {
            user {
              email
            }
          }
          knowledgeBases {
            id
            name
          }
        }
      }
    `

    const projectResponse = await testClient.mutate(createProjectMutation, {
      input: {
        name: 'Integration Test Project',
        description: 'Full workflow test',
        knowledgeBaseIds: [knowledgeBaseId],
        userIds: [regularUser.id]
      }
    }, adminUser)

    expect(projectResponse.errors).toBeUndefined()
    const project = projectResponse.data?.createProject
    expect(project.members).toHaveLength(1)
    expect(project.knowledgeBases).toHaveLength(1)

    // Step 3: Regular user should be able to access the project
    const projectQuery = `
      query GetProject($id: ID!) {
        project(id: $id) {
          id
          name
          members {
            user {
              email
            }
          }
        }
      }
    `

    const accessResponse = await testClient.query(projectQuery, {
      id: project.id
    }, regularUser)

    expect(accessResponse.errors).toBeUndefined()
    expect(accessResponse.data?.project.name).toBe('Integration Test Project')

    // Step 4: Update project status
    const updateProjectMutation = `
      mutation UpdateProject($id: ID!, $input: UpdateProjectInput!) {
        updateProject(id: $id, input: $input) {
          id
          status
          progressPercentage
        }
      }
    `

    const updateResponse = await testClient.mutate(updateProjectMutation, {
      id: project.id,
      input: {
        status: 'IN_PROGRESS',
        progressPercentage: 25
      }
    }, adminUser)

    expect(updateResponse.errors).toBeUndefined()
    expect(updateResponse.data?.updateProject.status).toBe('IN_PROGRESS')
    expect(updateResponse.data?.updateProject.progressPercentage).toBe(25)
  })
})
```

## Subscription Testing

### Real-time Updates Testing
```typescript
// tests/subscriptions/project-updates.test.ts
describe('Project Subscriptions', () => {
  let testClient: GraphQLTestClient
  let prisma: PrismaClient
  let testUser: User

  beforeEach(async () => {
    const setup = await setupTestDatabase()
    prisma = setup.prisma
    testClient = new GraphQLTestClient(prisma)
    testUser = await createTestUser(prisma, 'test@example.com', ['BIDDER'])
  })

  it('should receive project updates via subscription', async () => {
    // Create a project
    const project = await prisma.project.create({
      data: {
        name: 'Subscription Test Project',
        status: 'DRAFT',
        createdById: testUser.id,
        progressPercentage: 0
      }
    })

    // Set up subscription
    const subscription = `
      subscription ProjectUpdated($projectId: ID!) {
        projectUpdated(projectId: $projectId) {
          id
          status
          progressPercentage
        }
      }
    `

    const subscriptionIterator = await testClient.subscribe(subscription, {
      projectId: project.id
    }, testUser)

    // Trigger an update
    const updateMutation = `
      mutation UpdateProject($id: ID!, $input: UpdateProjectInput!) {
        updateProject(id: $id, input: $input) {
          id
          status
        }
      }
    `

    await testClient.mutate(updateMutation, {
      id: project.id,
      input: { status: 'IN_PROGRESS', progressPercentage: 50 }
    }, testUser)

    // Verify subscription received the update
    const result = await subscriptionIterator.next()
    expect(result.value?.data?.projectUpdated).toMatchObject({
      id: project.id,
      status: 'IN_PROGRESS',
      progressPercentage: 50
    })
  })
})
```

## Performance Testing

### Query Performance and N+1 Prevention
```typescript
// tests/performance/dataloader.test.ts
describe('DataLoader Performance', () => {
  let testClient: GraphQLTestClient
  let prisma: PrismaClient
  let queryCounter: jest.SpyInstance

  beforeEach(async () => {
    const setup = await setupTestDatabase()
    prisma = setup.prisma
    testClient = new GraphQLTestClient(prisma)
    
    // Mock Prisma to count queries
    queryCounter = jest.spyOn(prisma, '$queryRaw')
  })

  it('should prevent N+1 queries when loading project members', async () => {
    // Create test data: 5 projects with 3 members each
    const users = await Promise.all([
      createTestUser(prisma, 'user1@example.com', ['BIDDER']),
      createTestUser(prisma, 'user2@example.com', ['BIDDER']),
      createTestUser(prisma, 'user3@example.com', ['BIDDER'])
    ])

    const projects = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        prisma.project.create({
          data: {
            name: `Project ${i + 1}`,
            status: 'DRAFT',
            createdById: users[0].id,
            progressPercentage: 0,
            members: {
              create: users.map(user => ({
                userId: user.id,
                addedById: users[0].id
              }))
            }
          }
        })
      )
    )

    queryCounter.mockClear()

    // Query all projects with their members
    const query = `
      query GetProjectsWithMembers {
        projects {
          edges {
            node {
              id
              name
              members {
                user {
                  id
                  email
                }
              }
            }
          }
        }
      }
    `

    const response = await testClient.query(query, {}, users[0])

    expect(response.errors).toBeUndefined()
    expect(response.data?.projects.edges).toHaveLength(5)
    
    // Each project should have 3 members
    response.data?.projects.edges.forEach((edge: any) => {
      expect(edge.node.members).toHaveLength(3)
    })

    // Should not exceed reasonable number of queries (with DataLoader batching)
    // Without DataLoader: 1 (projects) + 5 (members per project) + 15 (users) = 21 queries
    // With DataLoader: 1 (projects) + 1 (batched members) + 1 (batched users) = 3 queries
    expect(queryCounter).toHaveBeenCalledTimes(3)
  })
})
```

## Test Data Management

### Test Factories and Fixtures
```typescript
// tests/factories/user.factory.ts
export async function createTestUser(
  prisma: PrismaClient,
  email: string,
  roleNames: string[] = ['BIDDER']
): Promise<AuthenticatedUser> {
  const user = await prisma.user.create({
    data: {
      email,
      username: email.split('@')[0],
      firstName: 'Test',
      lastName: 'User',
      cognitoUserId: `test-${crypto.randomUUID()}`,
      roles: {
        create: roleNames.map(roleName => ({
          role: {
            connectOrCreate: {
              where: { name: roleName },
              create: {
                name: roleName,
                description: `${roleName} role`,
                permissions: {
                  create: getPermissionsForRole(roleName).map(permission => ({
                    resource: permission.split(':')[0],
                    action: permission.split(':')[1]
                  }))
                }
              }
            }
          }
        }))
      }
    },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      }
    }
  })

  return {
    id: user.id,
    email: user.email,
    cognitoUserId: user.cognitoUserId,
    roles: user.roles.map(ur => ({
      name: ur.role.name,
      permissions: ur.role.permissions.map(p => `${p.resource}:${p.action}`)
    }))
  }
}

// tests/factories/project.factory.ts
export async function createTestProject(
  prisma: PrismaClient,
  createdById: string,
  overrides: Partial<Project> = {}
): Promise<Project> {
  return prisma.project.create({
    data: {
      name: 'Test Project',
      status: 'DRAFT',
      progressPercentage: 0,
      createdById,
      ...overrides
    }
  })
}
```

## Test Coverage and Quality

### Coverage Requirements
```json
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    // Stricter requirements for resolvers
    './src/resolvers/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,js}',
    '!src/**/__tests__/**'
  ]
}
```

### Testing Commands
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run integration tests only
npm run test:integration

# Run performance tests
npm run test:performance

# Run specific test file
npm run test -- project.resolver.test.ts
```

### Pre-commit Testing
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm run test:changed",
      "pre-push": "npm run test:coverage"
    }
  },
  "scripts": {
    "test:changed": "jest --bail --findRelatedTests",
    "test:coverage": "jest --coverage --watchAll=false"
  }
}
```

## Mandatory Testing Checklist

Before any GraphQL resolver PR is merged:

- [ ] All new resolvers have comprehensive unit tests
- [ ] All new mutations have validation and authorization tests
- [ ] Integration tests cover complete GraphQL operations
- [ ] Performance tests verify DataLoader prevents N+1 queries
- [ ] Subscription tests verify real-time functionality
- [ ] Error scenarios are tested with proper error codes
- [ ] All tests pass in CI/CD pipeline
- [ ] Coverage thresholds are met (90%+ overall, 100% for resolvers)
- [ ] No test files are skipped without justification