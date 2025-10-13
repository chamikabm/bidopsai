# Testing Guide - BidOps.AI Core API

Comprehensive testing strategy for the GraphQL API.

## 🧪 Testing Stack

- **Jest**: Test runner and assertion library
- **Testcontainers**: Docker containers for PostgreSQL
- **Supertest**: HTTP assertions
- **GraphQL Testing**: Apollo Server testing utilities

## 📁 Test Structure

```
tests/
├── integration/          # End-to-end API tests
│   ├── auth.test.ts
│   ├── projects.test.ts
│   ├── workflows.test.ts
│   └── subscriptions.test.ts
├── unit/                 # Unit tests
│   ├── services/
│   ├── resolvers/
│   └── utils/
├── fixtures/             # Test data
└── helpers/              # Test utilities
```

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.test.ts

# Run integration tests only
npm test -- --testPathPattern=integration
```

## 📝 Test Examples

### Integration Test Example

```typescript
// tests/integration/projects.test.ts
import { createTestServer } from '../helpers/test-server';
import { createTestUser } from '../helpers/test-data';

describe('Project Mutations', () => {
  let server: TestApolloServer;
  let testUser: TestUser;

  beforeAll(async () => {
    server = await createTestServer();
    testUser = await createTestUser(server.prisma);
  });

  afterAll(async () => {
    await server.cleanup();
  });

  it('should create a new project', async () => {
    const CREATE_PROJECT = gql`
      mutation CreateProject($input: CreateProjectInput!) {
        createProject(input: $input) {
          id
          name
          status
        }
      }
    `;

    const response = await server.executeOperation(
      {
        query: CREATE_PROJECT,
        variables: {
          input: {
            name: 'Test Project',
            description: 'Test Description',
          },
        },
      },
      {
        user: testUser,
      }
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.createProject).toMatchObject({
      name: 'Test Project',
      status: 'OPEN',
    });
  });
});
```

### Unit Test Example

```typescript
// tests/unit/services/user.service.test.ts
import { UserService } from '../../../src/services/user.service';
import { createMockPrisma, createMockLogger } from '../../helpers/mocks';

describe('UserService', () => {
  let userService: UserService;
  let mockPrisma: MockPrisma;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockLogger = createMockLogger();
    userService = new UserService(mockPrisma, mockLogger);
  });

  it('should find user by email', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await userService.findByEmail('test@example.com');

    expect(result).toEqual(mockUser);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
  });
});
```

### Subscription Test Example

```typescript
// tests/integration/subscriptions.test.ts
import { createTestServer } from '../helpers/test-server';
import { createTestProject } from '../helpers/test-data';

describe('GraphQL Subscriptions', () => {
  it('should receive project updates', async () => {
    const server = await createTestServer();
    const testProject = await createTestProject(server.prisma);

    const SUBSCRIBE_PROJECT = gql`
      subscription OnProjectUpdated($projectId: UUID!) {
        projectUpdated(projectId: $projectId) {
          id
          name
          status
        }
      }
    `;

    const subscription = server.subscribe({
      query: SUBSCRIBE_PROJECT,
      variables: { projectId: testProject.id },
    });

    // Trigger update
    await server.executeOperation({
      query: UPDATE_PROJECT,
      variables: {
        id: testProject.id,
        input: { status: 'IN_PROGRESS' },
      },
    });

    // Wait for subscription event
    const { value } = await subscription.next();
    
    expect(value.data?.projectUpdated).toMatchObject({
      id: testProject.id,
      status: 'IN_PROGRESS',
    });

    await server.cleanup();
  });
});
```

## 🏗️ Test Helpers

### Test Server Setup

```typescript
// tests/helpers/test-server.ts
import { ApolloServer } from '@apollo/server';
import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

export async function createTestServer() {
  // Start PostgreSQL container
  const container = await new PostgreSqlContainer()
    .withDatabase('test_db')
    .withUsername('test_user')
    .withPassword('test_pass')
    .start();

  const databaseUrl = container.getConnectionUri();

  // Create Prisma client
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  // Run migrations
  await execSync('npx prisma migrate deploy');

  // Create Apollo Server
  const server = createApolloServer(httpServer, prisma);

  return {
    server,
    prisma,
    cleanup: async () => {
      await prisma.$disconnect();
      await container.stop();
    },
  };
}
```

### Mock Data Factory

```typescript
// tests/helpers/test-data.ts
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export async function createTestUser(prisma: PrismaClient) {
  return prisma.user.create({
    data: {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      cognitoUserId: faker.string.uuid(),
    },
  });
}

export async function createTestProject(
  prisma: PrismaClient,
  userId: string
) {
  return prisma.project.create({
    data: {
      name: faker.company.name(),
      description: faker.lorem.paragraph(),
      status: 'OPEN',
      createdById: userId,
    },
  });
}
```

## 🎯 Test Coverage Goals

- **Overall**: 80%+ coverage
- **Services**: 90%+ coverage
- **Resolvers**: 80%+ coverage
- **Utils**: 95%+ coverage

## 📊 Coverage Report

```bash
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

## ✅ Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data after tests
3. **Mocking**: Mock external services (AWS, email)
4. **Assertions**: Use specific assertions, not just truthy checks
5. **Async**: Always await async operations
6. **Descriptive**: Use clear test descriptions
7. **AAA Pattern**: Arrange, Act, Assert

## 🐛 Debugging Tests

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# VS Code launch configuration
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

## 🔄 Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Release tags

GitHub Actions workflow:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '24'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [Testcontainers](https://testcontainers.com/)
- [Apollo Server Testing](https://www.apollographql.com/docs/apollo-server/testing/testing/)