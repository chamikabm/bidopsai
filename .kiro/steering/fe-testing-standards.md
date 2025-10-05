---
inclusion: fileMatch
fileMatchPattern: "**/*.{test,spec}.{ts,tsx,js,jsx}"
---

# Frontend Testing Standards

## Test-Driven Development (TDD) Standards

### TDD Workflow - Red, Green, Refactor
**MANDATORY**: Follow TDD for all new features and components

1. **Red**: Write a failing test first
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code while keeping tests green

### Testing Requirements
- **100% test coverage** for utility functions and business logic
- **Minimum 80% test coverage** for components
- **All new features** must have tests written BEFORE implementation
- **All bug fixes** must include regression tests

### TDD Component Development Pattern
```typescript
// 1. RED: Write failing test first
describe('ProjectCard', () => {
  it('should display project name and status', () => {
    const project = { id: '1', name: 'Test Project', status: 'active' }
    render(<ProjectCard project={project} />)
    
    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
  })
})

// 2. GREEN: Implement minimal component
export function ProjectCard({ project }: { project: Project }) {
  return (
    <div>
      <h3>{project.name}</h3>
      <span>{project.status}</span>
    </div>
  )
}

// 3. REFACTOR: Improve styling and structure while tests pass
export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold">{project.name}</h3>
      <span className={cn(
        'px-2 py-1 rounded text-sm',
        project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
      )}>
        {project.status}
      </span>
    </div>
  )
}
```

### TDD Hook Development Pattern
```typescript
// 1. RED: Write failing test for custom hook
describe('useProjectData', () => {
  it('should fetch project data and return loading state', async () => {
    const { result } = renderHook(() => useProjectData('project-1'))
    
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toEqual(mockProject)
    })
  })
})

// 2. GREEN: Implement minimal hook
export function useProjectData(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
  })
}

// 3. REFACTOR: Add error handling, caching, etc.
export function useProjectData(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
```

### Testing Layers - Test Everything

#### 1. Unit Tests (Vitest + React Testing Library)
```typescript
// ✅ Test utility functions
describe('formatCurrency', () => {
  it('should format USD currency correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56')
  })
  
  it('should handle zero values', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00')
  })
})

// ✅ Test component behavior
describe('SearchInput', () => {
  it('should call onSearch when Enter is pressed', () => {
    const onSearch = vi.fn()
    render(<SearchInput onSearch={onSearch} />)
    
    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'test query' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    
    expect(onSearch).toHaveBeenCalledWith('test query')
  })
})
```

#### 2. Integration Tests
```typescript
// ✅ Test component integration with hooks and context
describe('ProjectsList Integration', () => {
  it('should display projects from API and handle loading states', async () => {
    // Mock API response
    server.use(
      http.get('/api/projects', () => {
        return HttpResponse.json([
          { id: '1', name: 'Project 1', status: 'active' },
          { id: '2', name: 'Project 2', status: 'completed' }
        ])
      })
    )

    render(
      <QueryClient client={queryClient}>
        <ProjectsList />
      </QueryClient>
    )

    // Test loading state
    expect(screen.getByText('Loading projects...')).toBeInTheDocument()

    // Test loaded state
    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument()
      expect(screen.getByText('Project 2')).toBeInTheDocument()
    })
  })
})
```

#### 3. End-to-End Tests (Playwright)
```typescript
// ✅ Test complete user workflows
test('user can create a new project', async ({ page }) => {
  await page.goto('/projects/new')
  
  // Fill form
  await page.fill('[data-testid="project-name"]', 'New Test Project')
  await page.fill('[data-testid="project-description"]', 'Test description')
  
  // Upload file
  await page.setInputFiles('[data-testid="file-upload"]', 'test-document.pdf')
  
  // Submit form
  await page.click('[data-testid="submit-button"]')
  
  // Verify navigation and success
  await expect(page).toHaveURL(/\/projects\/\w+/)
  await expect(page.getByText('Project created successfully')).toBeVisible()
})
```

### Test Organization Structure
```
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx          # Co-located unit tests
│   └── features/
│       ├── projects/
│       │   ├── ProjectCard.tsx
│       │   ├── ProjectCard.test.tsx
│       │   ├── ProjectsList.tsx
│       │   └── ProjectsList.test.tsx
├── hooks/
│   ├── useProjectData.ts
│   └── useProjectData.test.ts
├── lib/
│   ├── utils.ts
│   └── utils.test.ts
└── __tests__/
    ├── integration/                 # Integration tests
    ├── e2e/                        # Playwright E2E tests
    └── setup.ts                    # Test setup and mocks
```

### Testing Best Practices

#### Mock Strategy
```typescript
// ✅ Mock external dependencies
vi.mock('@/lib/api', () => ({
  fetchProjects: vi.fn(),
  createProject: vi.fn(),
}))

// ✅ Mock React Query for isolated component tests
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
```

#### Test Data Management
```typescript
// ✅ Use factories for test data
export const createMockProject = (overrides?: Partial<Project>): Project => ({
  id: crypto.randomUUID(),
  name: 'Test Project',
  status: 'active',
  createdAt: new Date().toISOString(),
  ...overrides,
})

// ✅ Use MSW for API mocking
export const handlers = [
  http.get('/api/projects', () => {
    return HttpResponse.json([
      createMockProject({ name: 'Project 1' }),
      createMockProject({ name: 'Project 2' }),
    ])
  }),
]
```

### Coverage Requirements
```json
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Stricter requirements for critical paths
        'src/lib/': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
  },
})
```

### Pre-commit Testing Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test:ci"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "npm run test:related"
    ]
  },
  "scripts": {
    "test": "vitest",
    "test:ci": "vitest run --coverage",
    "test:related": "vitest related --run",
    "test:e2e": "playwright test"
  }
}
```

### Testing Commands
```bash
# Run tests in watch mode during development
npm run test

# Run all tests with coverage
npm run test:ci

# Run tests for changed files only
npm run test:related

# Run E2E tests
npm run test:e2e

# Run specific test file
npm run test -- ProjectCard.test.tsx

# Update snapshots
npm run test -- --update-snapshots
```

### Mandatory Testing Checklist
Before any PR is merged, ensure:

- [ ] All new components have unit tests
- [ ] All new hooks have unit tests  
- [ ] All utility functions have 100% test coverage
- [ ] Integration tests cover component interactions
- [ ] E2E tests cover critical user journeys
- [ ] All tests pass in CI/CD pipeline
- [ ] Coverage thresholds are met
- [ ] No test files are skipped or disabled without justification