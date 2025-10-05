---
inclusion: always
fileMatchPattern: "services/core-api/**/*"
---

# GraphQL API Development Standards

## Schema Design Best Practices

### Schema-First Development

- **Always define schema first** before implementing resolvers
- Use **GraphQL SDL** (Schema Definition Language) for type definitions
- Implement **schema stitching** for modular schema organization
- Follow **GraphQL naming conventions** consistently

### Type System Standards

```graphql
# ✅ Good: Descriptive type names with clear relationships
type User {
  id: ID!
  email: String!
  profile: UserProfile
  projects: [Project!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type UserProfile {
  firstName: String!
  lastName: String!
  avatar: String
  bio: String
}

# ✅ Good: Input types for mutations
input CreateUserInput {
  email: String!
  firstName: String!
  lastName: String!
  roleIds: [ID!]!
}

# ✅ Good: Enums for controlled values
enum ProjectStatus {
  DRAFT
  IN_PROGRESS
  UNDER_REVIEW
  COMPLETED
  CANCELLED
}
```

### Field Design Principles

```graphql
# ✅ Good: Non-nullable fields for required data
type Project {
  id: ID! # Always non-null
  name: String! # Required business data
  description: String # Optional fields are nullable
  status: ProjectStatus! # Enums are typically non-null
  members: [ProjectMember!]! # Non-null array of non-null items
}

# ✅ Good: Pagination with connections
type ProjectConnection {
  edges: [ProjectEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type ProjectEdge {
  node: Project!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

## Resolver Implementation Standards

### Resolver Architecture

```typescript
// ✅ Good: Typed resolver with proper context
interface GraphQLContext {
  user?: AuthenticatedUser;
  prisma: PrismaClient;
  dataSources: DataSources;
  req: Request;
  res: Response;
}

type Resolvers = {
  Query: {
    projects: (
      parent: unknown,
      args: ProjectsQueryArgs,
      context: GraphQLContext,
      info: GraphQLResolveInfo
    ) => Promise<ProjectConnection>;
  };
  Mutation: {
    createProject: (
      parent: unknown,
      args: { input: CreateProjectInput },
      context: GraphQLContext,
      info: GraphQLResolveInfo
    ) => Promise<Project>;
  };
};
```

### Authentication & Authorization

```typescript
// ✅ Good: Centralized auth checking
abstract class BaseResolver {
  protected requireAuth(context: GraphQLContext): AuthenticatedUser {
    if (!context.user) {
      throw new ForbiddenError("Authentication required");
    }
    return context.user;
  }

  protected requirePermission(
    context: GraphQLContext,
    permission: Permission
  ): void {
    const user = this.requireAuth(context);
    if (!hasPermission(user, permission)) {
      throw new ForbiddenError(`Missing permission: ${permission}`);
    }
  }

  protected requireResourceAccess(
    context: GraphQLContext,
    resourceId: string,
    resourceType: string
  ): void {
    const user = this.requireAuth(context);
    if (!canAccessResource(user, resourceId, resourceType)) {
      throw new ForbiddenError("Access denied to resource");
    }
  }
}

// ✅ Good: Resolver with proper authorization
class ProjectResolver extends BaseResolver {
  async projects(
    parent: unknown,
    args: ProjectsQueryArgs,
    context: GraphQLContext
  ): Promise<ProjectConnection> {
    const user = this.requireAuth(context);

    // Filter projects based on user permissions
    const where = buildProjectFilter(user, args.filter);

    return context.prisma.project.findManyWithPagination({
      where,
      ...args.pagination,
    });
  }

  async createProject(
    parent: unknown,
    args: { input: CreateProjectInput },
    context: GraphQLContext
  ): Promise<Project> {
    this.requirePermission(context, Permission.PROJECT_CREATE);

    return context.prisma.project.create({
      data: {
        ...args.input,
        createdById: context.user!.id,
      },
    });
  }
}
```

### DataLoader Implementation

```typescript
// ✅ Good: Efficient data loading with DataLoader
interface DataLoaders {
  userLoader: DataLoader<string, User>;
  projectLoader: DataLoader<string, Project>;
  projectMembersLoader: DataLoader<string, ProjectMember[]>;
}

function createDataLoaders(prisma: PrismaClient): DataLoaders {
  return {
    userLoader: new DataLoader(async (userIds: readonly string[]) => {
      const users = await prisma.user.findMany({
        where: { id: { in: [...userIds] } },
      });
      return userIds.map((id) => users.find((user) => user.id === id) || null);
    }),

    projectMembersLoader: new DataLoader(
      async (projectIds: readonly string[]) => {
        const members = await prisma.projectMember.findMany({
          where: { projectId: { in: [...projectIds] } },
          include: { user: true },
        });

        return projectIds.map((projectId) =>
          members.filter((member) => member.projectId === projectId)
        );
      }
    ),
  };
}

// ✅ Good: Using DataLoader in field resolvers
const resolvers: Resolvers = {
  Project: {
    members: async (project, args, context) => {
      return context.dataSources.projectMembersLoader.load(project.id);
    },

    createdBy: async (project, args, context) => {
      return context.dataSources.userLoader.load(project.createdById);
    },
  },
};
```

## Error Handling Standards

### Custom Error Classes

```typescript
// ✅ Good: Structured error handling
export enum ErrorCode {
  AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  BUSINESS_LOGIC_ERROR = "BUSINESS_LOGIC_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fieldErrors: Record<string, string[]>) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, { fieldErrors });
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(ErrorCode.NOT_FOUND, `${resource} with id ${id} not found`, 404);
  }
}
```

### Error Formatting

```typescript
// ✅ Good: Consistent error formatting
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (err) => {
    // Log error for monitoring
    logger.error("GraphQL Error", {
      message: err.message,
      code: err.extensions?.code,
      path: err.path,
      stack: err.stack,
    });

    // Return sanitized error to client
    if (err.originalError instanceof AppError) {
      return {
        message: err.message,
        code: err.originalError.code,
        details: err.originalError.details,
        path: err.path,
      };
    }

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === "production") {
      return {
        message: "Internal server error",
        code: "INTERNAL_ERROR",
        path: err.path,
      };
    }

    return err;
  },
});
```

## Input Validation Standards

### Zod Schema Integration

```typescript
// ✅ Good: Schema validation with Zod
import { z } from "zod";

const CreateProjectInputSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional(),
  deadline: z.date().optional(),
  knowledgeBaseIds: z.array(z.string().uuid()).min(1),
  userIds: z.array(z.string().uuid()).optional(),
});

// ✅ Good: Validation middleware
function validateInput<T>(schema: z.ZodSchema<T>) {
  return (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) => {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const [, { input }] = args;

      try {
        const validatedInput = schema.parse(input);
        args[1] = { input: validatedInput };
        return method.apply(this, args);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ValidationError(
            "Input validation failed",
            error.flatten().fieldErrors
          );
        }
        throw error;
      }
    };
  };
}

// ✅ Good: Using validation decorator
class ProjectResolver extends BaseResolver {
  @validateInput(CreateProjectInputSchema)
  async createProject(
    parent: unknown,
    args: { input: CreateProjectInput },
    context: GraphQLContext
  ): Promise<Project> {
    // Input is already validated
    return this.projectService.create(args.input, context.user!.id);
  }
}
```

## Performance Optimization

### Query Complexity Analysis

```typescript
// ✅ Good: Query complexity limiting
import { createComplexityLimitRule } from "graphql-query-complexity";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    createComplexityLimitRule(1000, {
      maximumComplexity: 1000,
      variables: {},
      createError: (max, actual) => {
        return new Error(`Query complexity ${actual} exceeds maximum ${max}`);
      },
      onComplete: (complexity) => {
        logger.info("Query complexity", { complexity });
      },
    }),
  ],
});
```

### Caching Strategies

```typescript
// ✅ Good: Field-level caching
const resolvers: Resolvers = {
  Query: {
    // Cache expensive aggregations
    dashboardStats: async (parent, args, context) => {
      const cacheKey = `dashboard-stats:${context.user!.id}:${args.period}`;

      let stats = await context.cache.get(cacheKey);
      if (!stats) {
        stats = await calculateDashboardStats(context.user!.id, args.period);
        await context.cache.set(cacheKey, stats, 300); // 5 minutes
      }

      return stats;
    },
  },
};
```

## Subscription Standards

### Real-time Updates

```typescript
// ✅ Good: Authenticated subscriptions
const resolvers: Resolvers = {
  Subscription: {
    projectUpdated: {
      subscribe: withFilter(
        (parent, args, context) => {
          // Authenticate subscription
          if (!context.user) {
            throw new ForbiddenError("Authentication required");
          }

          return context.pubsub.asyncIterator(["PROJECT_UPDATED"]);
        },
        (payload, variables, context) => {
          // Filter updates based on user permissions
          return canAccessProject(context.user!, payload.projectUpdated.id);
        }
      ),
    },

    workflowExecutionUpdated: {
      subscribe: withFilter(
        (parent, args, context) => {
          if (!context.user) {
            throw new ForbiddenError("Authentication required");
          }

          return context.pubsub.asyncIterator(["WORKFLOW_UPDATED"]);
        },
        (payload, variables) => {
          return (
            payload.workflowExecutionUpdated.id ===
            variables.workflowExecutionId
          );
        }
      ),
    },
  },
};
```

## Documentation Standards

### Schema Documentation

```graphql
# ✅ Good: Comprehensive schema documentation
"""
Represents a project in the bid automation system.
Projects contain documents, artifacts, and workflow executions.
"""
type Project {
  "Unique identifier for the project"
  id: ID!

  "Human-readable project name"
  name: String!

  "Optional project description"
  description: String

  "Current status of the project workflow"
  status: ProjectStatus!

  "Project completion percentage (0-100)"
  progressPercentage: Int!

  "User who created this project"
  createdBy: User!

  "All documents uploaded to this project"
  documents: [ProjectDocument!]!

  "Users assigned to work on this project"
  members: [ProjectMember!]!
}

"""
Input for creating a new project
"""
input CreateProjectInput {
  "Project name (1-100 characters)"
  name: String!

  "Optional project description (max 500 characters)"
  description: String

  "Optional project deadline"
  deadline: DateTime

  "Knowledge bases to associate with this project (at least 1 required)"
  knowledgeBaseIds: [ID!]!

  "Optional users to add as project members"
  userIds: [ID!]
}
```

### Resolver Documentation

```typescript
// ✅ Good: Documented resolver methods
class ProjectResolver extends BaseResolver {
  /**
   * Retrieves projects accessible to the current user
   * Applies role-based filtering and pagination
   *
   * @param args - Query arguments including filters and pagination
   * @param context - GraphQL context with user and database access
   * @returns Paginated list of projects
   */
  async projects(
    parent: unknown,
    args: ProjectsQueryArgs,
    context: GraphQLContext
  ): Promise<ProjectConnection> {
    const user = this.requireAuth(context);

    // Apply user-based filtering
    const where = this.buildProjectFilter(user, args.filter);

    return this.projectService.findManyWithPagination(where, args.pagination);
  }
}
```

## Development Workflow

### Schema Evolution

- Use **schema versioning** for breaking changes
- Implement **field deprecation** before removal
- Maintain **backward compatibility** for at least 2 versions
- Document **migration guides** for schema changes

### Code Organization

```
services/core-api/src/
├── schema/
│   ├── types/              # GraphQL type definitions
│   │   ├── user.graphql
│   │   ├── project.graphql
│   │   └── index.ts
│   ├── resolvers/          # Resolver implementations
│   │   ├── user.resolver.ts
│   │   ├── project.resolver.ts
│   │   └── index.ts
│   └── directives/         # Custom directives
├── services/               # Business logic services
├── middleware/             # Authentication, validation
├── utils/                  # Helper functions
└── server.ts              # Apollo Server setup
```

### Environment Configuration

```typescript
// ✅ Good: Environment-specific configuration
interface ServerConfig {
  port: number;
  cors: {
    origin: string[];
    credentials: boolean;
  };
  introspection: boolean;
  playground: boolean;
  debug: boolean;
}

const config: ServerConfig = {
  port: parseInt(process.env.PORT || "4000"),
  cors: {
    origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
  },
  introspection: process.env.NODE_ENV !== "production",
  playground: process.env.NODE_ENV !== "production",
  debug: process.env.NODE_ENV !== "production",
};
```
