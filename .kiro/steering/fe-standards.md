---
inclusion: always
fileMatchPattern: "apps/web/**/*"
---
# Frontend Development Standards

## React 19+ Best Practices

### Component Architecture
- Use **function components** with hooks exclusively
- Leverage React 19's **automatic batching** for state updates
- Use **React.memo** with shallow comparison for performance optimization
- Implement **Suspense boundaries** for data fetching and code splitting
- Use **Error boundaries** for graceful error handling

### React 19 New Features
- **Actions**: Use `useActionState` for form submissions and async operations
- **useOptimistic**: Implement optimistic updates for better UX
- **use()**: Consume promises and context directly in components
- **React Compiler**: Enable automatic memoization (when stable)
- **Document metadata**: Use built-in `<title>` and `<meta>` support

### Hooks Best Practices
```typescript
// ✅ Good: Custom hooks for reusable logic
function useProjectData(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
  })
}

// ✅ Good: useCallback for event handlers
const handleSubmit = useCallback((data: FormData) => {
  submitProject(data)
}, [submitProject])

// ❌ Avoid: Unnecessary useEffect
// Use React Query or direct state updates instead
```

## Next.js 15+ Standards

### App Router Architecture
- Use **App Router** exclusively (not Pages Router)
- Implement **Server Components** by default, Client Components only when needed
- Use **Route Groups** `(auth)`, `(dashboard)` for organization
- Leverage **Parallel Routes** for complex layouts
- Implement **Intercepting Routes** for modals

### Server vs Client Components
```typescript
// ✅ Server Component (default)
export default async function ProjectsPage() {
  const projects = await fetchProjects() // Direct DB/API call
  return <ProjectsList projects={projects} />
}

// ✅ Client Component (when needed)
'use client'
export function InteractiveChart({ data }: { data: ChartData }) {
  const [filter, setFilter] = useState('')
  return <Chart data={data} filter={filter} />
}
```

### Data Fetching Patterns
- Use **Server Components** for initial data loading
- Use **TanStack Query** for client-side data management
- Implement **Streaming** with Suspense for progressive loading
- Use **Server Actions** for form submissions and mutations

### Performance Optimization
- Enable **Partial Prerendering** (when stable)
- Use **Dynamic imports** for code splitting
- Implement **Image optimization** with Next.js Image component
- Use **Font optimization** with next/font

## TypeScript Standards

### Strict Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Type Definitions
```typescript
// ✅ Good: Strict typing with branded types
type ProjectId = string & { readonly brand: unique symbol }
type UserId = string & { readonly brand: unique symbol }

// ✅ Good: Discriminated unions for state
type LoadingState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Project[] }
  | { status: 'error'; error: string }

// ✅ Good: Generic constraints
interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>
  create(data: Omit<T, 'id'>): Promise<T>
}
```

### Component Typing
```typescript
// ✅ Good: Proper component props typing
interface ProjectCardProps {
  project: Project
  onEdit?: (project: Project) => void
  className?: string
}

export function ProjectCard({ project, onEdit, className }: ProjectCardProps) {
  // Component implementation
}

// ✅ Good: Generic components
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  keyExtractor: (item: T) => string
}

export function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  )
}
```

## State Management Standards

### TanStack Query for Server State
```typescript
// ✅ Good: Query hooks with proper typing
export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => fetchProjects(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ✅ Good: Mutation with optimistic updates
export function useCreateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createProject,
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] })
      const previousProjects = queryClient.getQueryData(['projects'])
      
      queryClient.setQueryData(['projects'], (old: Project[]) => [
        ...old,
        { ...newProject, id: 'temp-id' }
      ])
      
      return { previousProjects }
    },
    onError: (err, newProject, context) => {
      queryClient.setQueryData(['projects'], context?.previousProjects)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
```

### Zustand for Client State
```typescript
// ✅ Good: Typed Zustand store
interface UIStore {
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  notifications: Notification[]
  setTheme: (theme: UIStore['theme']) => void
  toggleSidebar: () => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarCollapsed: false,
      notifications: [],
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      addNotification: (notification) => set({
        notifications: [...get().notifications, { ...notification, id: crypto.randomUUID() }]
      }),
    }),
    { name: 'ui-store' }
  )
)
```

## Form Handling Standards

### React Hook Form with Zod
```typescript
// ✅ Good: Schema-first form validation
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  deadline: z.date().optional(),
  knowledgeBases: z.array(z.string()).min(1, 'Select at least one knowledge base'),
})

type ProjectFormData = z.infer<typeof projectSchema>

export function ProjectForm({ onSubmit }: { onSubmit: (data: ProjectFormData) => void }) {
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      knowledgeBases: [],
    },
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('name')} />
      {form.formState.errors.name && (
        <span className="text-red-500">{form.formState.errors.name.message}</span>
      )}
      {/* Other form fields */}
    </form>
  )
}
```

## Styling Standards

### Tailwind CSS Best Practices
```typescript
// ✅ Good: Use cn utility for conditional classes
import { cn } from '@/lib/utils'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-md font-medium transition-colors',
        {
          'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
          'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
        },
        {
          'px-2 py-1 text-sm': size === 'sm',
          'px-4 py-2': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    />
  )
}
```

### CSS-in-JS Alternative
- Use **Tailwind CSS** as primary styling solution
- Use **CSS Modules** for complex component-specific styles
- Avoid styled-components or emotion for better performance

## Error Handling Standards

### Error Boundaries
```typescript
// ✅ Good: Typed error boundary
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<
  PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <h2 className="text-red-800">Something went wrong</h2>
          <p className="text-red-600">{this.state.error?.message}</p>
        </div>
      )
    }

    return this.props.children
  }
}
```

## Performance Standards

### Code Splitting
```typescript
// ✅ Good: Route-based code splitting
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const KnowledgeBasesPage = lazy(() => import('./pages/KnowledgeBasesPage'))

// ✅ Good: Component-based code splitting
const HeavyChart = lazy(() => import('./components/HeavyChart'))

function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart data={chartData} />
    </Suspense>
  )
}
```

### Memoization
```typescript
// ✅ Good: Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return processLargeDataset(data)
}, [data])

// ✅ Good: Memoize callback functions
const handleItemClick = useCallback((item: Item) => {
  onItemSelect(item)
  trackEvent('item_clicked', { itemId: item.id })
}, [onItemSelect])
```

## Accessibility Standards

### ARIA and Semantic HTML
```typescript
// ✅ Good: Proper ARIA labels and semantic HTML
export function SearchInput({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('')

  return (
    <div role="search">
      <label htmlFor="search-input" className="sr-only">
        Search projects
      </label>
      <input
        id="search-input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch(query)}
        aria-describedby="search-help"
        className="w-full px-3 py-2 border rounded-md"
      />
      <div id="search-help" className="sr-only">
        Press Enter to search, or use arrow keys to navigate results
      </div>
    </div>
  )
}
```

## Development Workflow

### Code Quality Standards
- Follow **TDD principles** - write tests before implementation (see fe-testing-standards.md)
- Use **ESLint** and **Prettier** for consistent code formatting
- Implement **pre-commit hooks** for automated quality checks
- Maintain **high test coverage** and follow testing best practices