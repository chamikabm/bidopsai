# Performance Optimization & Monitoring Guide

## Quick Start

### Development
```bash
# Start dev server with monitoring dashboard
npm run dev

# Open http://localhost:3000
# Click "📊 Monitoring" button in bottom-right corner
```

### Production Build
```bash
# Regular build
npm run build

# Build with bundle analysis
npm run build:analyze
```

## Features Overview

### 1. Performance Optimizations

#### Code Splitting
- Automatic vendor chunk splitting
- UI components chunk (shadcn/ui)
- Editor chunk (TipTap)
- Radix UI chunk
- Common code chunk

#### Lazy Loading
```typescript
import { LazyLoad } from '@/components/common/LazyLoad';
import { DocumentEditor } from '@/components/lazy-components';

function MyComponent() {
  return (
    <LazyLoad minHeight="400px">
      <DocumentEditor content={content} />
    </LazyLoad>
  );
}
```

#### Caching Strategy
```typescript
import { queryKeys, CACHE_TIMES, STALE_TIMES } from '@/lib/cache';

// Use predefined cache keys
const { data } = useQuery({
  queryKey: queryKeys.projects.detail(projectId),
  queryFn: fetchProject,
  staleTime: STALE_TIMES.PROJECT_DETAILS,
  gcTime: CACHE_TIMES.PROJECT_DETAILS,
});
```

### 2. Error Tracking

```typescript
import { errorTracker, withErrorTracking } from '@/lib/monitoring';

// Track an error manually
try {
  // Your code
} catch (error) {
  errorTracker.trackError(error, {
    component: 'ProjectForm',
    action: 'submit',
    userId: user.id,
  });
}

// Wrap async function
const fetchData = withErrorTracking(
  async () => {
    const response = await fetch('/api/data');
    return response.json();
  },
  { component: 'DataFetcher', action: 'fetch' }
);
```

### 3. Logging

```typescript
import { logger, createScopedLogger } from '@/lib/monitoring';

// Direct logging
logger.info('User logged in', { userId: user.id });
logger.error('Failed to save', { error: error.message });
logger.warn('Deprecated API used', { endpoint: '/old-api' });
logger.debug('Debug info', { data: debugData });

// Scoped logger
const log = createScopedLogger('ProjectService', { projectId });
log.info('Project created');
log.error('Failed to update project');
```

### 4. Analytics

```typescript
import { analytics } from '@/lib/monitoring';

// Track events
analytics.trackButtonClick('create-project', { source: 'dashboard' });
analytics.trackFormSubmit('project-form', true, { fields: 5 });
analytics.trackFeatureUsage('agent-chat', { agentType: 'analysis' });

// Track workflows
analytics.trackWorkflowStep('bid-preparation', 'analysis', 'started');
analytics.trackWorkflowStep('bid-preparation', 'analysis', 'completed');

// Track agent interactions
analytics.trackAgentInteraction('analysis', 'query', { 
  query: 'Analyze requirements',
  responseTime: 1234 
});

// Track artifacts
analytics.trackArtifactAction('create', 'document');
analytics.trackArtifactAction('edit', 'qa-response');

// Track search
analytics.trackSearch('project requirements', 15, { 
  filters: ['active', 'recent'] 
});
```

### 5. Performance Monitoring

```typescript
import { performanceMonitor, measureComponentRender } from '@/lib/performance';

// Measure async operation
const data = await performanceMonitor.measureAsync(
  'fetch-projects',
  async () => {
    return await fetchProjects();
  },
  { userId: user.id }
);

// Measure sync operation
const result = performanceMonitor.measure(
  'calculate-total',
  () => {
    return items.reduce((sum, item) => sum + item.value, 0);
  }
);

// Measure component render
function MyComponent() {
  const endMeasure = measureComponentRender('MyComponent');
  
  useEffect(() => {
    return endMeasure;
  }, []);
  
  return <div>Content</div>;
}

// Use performance marks
performanceMonitor.mark('data-fetch-start');
await fetchData();
performanceMonitor.mark('data-fetch-end');
performanceMonitor.measureBetween('data-fetch', 'data-fetch-start', 'data-fetch-end');
```

## Monitoring Dashboard (Development Only)

The monitoring dashboard is automatically available in development mode:

1. Start the dev server: `npm run dev`
2. Open your application
3. Click the "📊 Monitoring" button in the bottom-right corner

### Dashboard Tabs

#### Errors Tab
- View recent errors with severity badges
- See error messages, timestamps, and context
- Clear errors with one click
- Color-coded by severity (critical, high, medium, low)

#### Logs Tab
- Real-time log stream
- Color-coded by level (error, warn, info, debug)
- Shows timestamps and messages
- Clear logs with one click

#### Analytics Tab
- Session ID and user ID
- Total events, page views, and actions
- Event statistics by name
- Action statistics by category

#### Performance Tab
- Web Vitals metrics (CLS, FID, LCP, FCP, TTFB, INP)
- Rating badges (good, needs-improvement, poor)
- Custom metrics count
- Performance averages

## Production Integration

### API Endpoints

The following endpoints are ready for production integration:

#### Error Monitoring
```
POST /api/monitoring/errors
```
Receives error reports from the client. Integrate with:
- AWS CloudWatch Logs
- Sentry
- DataDog
- New Relic

#### Logging
```
POST /api/monitoring/logs
```
Receives log entries from the client. Integrate with:
- AWS CloudWatch Logs
- Splunk
- Elasticsearch

#### Analytics
```
POST /api/analytics/track
```
Receives analytics events from the client. Integrate with:
- Google Analytics
- Mixpanel
- Amplitude
- Segment

#### Performance
```
POST /api/analytics/performance
```
Receives performance metrics from the client. Integrate with:
- AWS CloudWatch
- DataDog
- New Relic

### Integration Example (CloudWatch)

```typescript
// apps/web/src/app/api/monitoring/errors/route.ts
import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

const client = new CloudWatchLogsClient({ region: 'us-east-1' });

export async function POST(request: NextRequest) {
  const error = await request.json();
  
  await client.send(new PutLogEventsCommand({
    logGroupName: '/bidops/errors',
    logStreamName: 'web-app',
    logEvents: [{
      timestamp: Date.now(),
      message: JSON.stringify(error),
    }],
  }));
  
  return NextResponse.json({ success: true });
}
```

## Bundle Analysis

Analyze your bundle size and composition:

```bash
npm run build:analyze
```

This will:
1. Build the application
2. Generate a bundle analysis report
3. Open the report in your browser

Use this to:
- Identify large dependencies
- Find optimization opportunities
- Track bundle size over time
- Verify code splitting is working

## Performance Best Practices

### 1. Use Lazy Loading for Heavy Components
```typescript
// ❌ Don't import heavy components directly
import { DocumentEditor } from '@/components/projects/ArtifactViewer/editors/DocumentEditor';

// ✅ Use lazy-loaded version
import { DocumentEditor } from '@/components/lazy-components';
```

### 2. Use Appropriate Cache Times
```typescript
// ❌ Don't use same cache time for everything
const { data } = useQuery({
  queryKey: ['data'],
  staleTime: 5 * 60 * 1000, // 5 minutes for everything
});

// ✅ Use appropriate cache times
import { STALE_TIMES, CACHE_TIMES } from '@/lib/cache';

const { data } = useQuery({
  queryKey: queryKeys.projects.workflow(projectId),
  staleTime: STALE_TIMES.PROJECT_WORKFLOW, // 15 seconds for real-time data
  gcTime: CACHE_TIMES.PROJECT_WORKFLOW, // 30 seconds
});
```

### 3. Track Important Events
```typescript
// ✅ Track user actions
analytics.trackButtonClick('submit-bid');
analytics.trackWorkflowStep('bid-prep', 'review', 'completed');
analytics.trackFeatureUsage('ai-agent-chat');
```

### 4. Monitor Performance
```typescript
// ✅ Measure critical operations
const data = await performanceMonitor.measureAsync(
  'critical-data-fetch',
  async () => await fetchCriticalData()
);
```

### 5. Handle Errors Gracefully
```typescript
// ✅ Track and handle errors
try {
  await submitForm(data);
} catch (error) {
  errorTracker.trackError(error, {
    component: 'FormSubmit',
    action: 'submit',
    severity: 'high',
  });
  toast.error('Failed to submit form');
}
```

## Web Vitals Thresholds

### Core Web Vitals
- **LCP (Largest Contentful Paint)**
  - Good: ≤ 2.5s
  - Needs Improvement: ≤ 4.0s
  - Poor: > 4.0s

- **FID (First Input Delay)**
  - Good: ≤ 100ms
  - Needs Improvement: ≤ 300ms
  - Poor: > 300ms

- **CLS (Cumulative Layout Shift)**
  - Good: ≤ 0.1
  - Needs Improvement: ≤ 0.25
  - Poor: > 0.25

### Other Metrics
- **FCP (First Contentful Paint)**
  - Good: ≤ 1.8s
  - Needs Improvement: ≤ 3.0s
  - Poor: > 3.0s

- **TTFB (Time to First Byte)**
  - Good: ≤ 800ms
  - Needs Improvement: ≤ 1.8s
  - Poor: > 1.8s

- **INP (Interaction to Next Paint)**
  - Good: ≤ 200ms
  - Needs Improvement: ≤ 500ms
  - Poor: > 500ms

## Troubleshooting

### Module Not Found: 'web-vitals'
```bash
npm install web-vitals
```

### Bundle Size Too Large
1. Run bundle analysis: `npm run build:analyze`
2. Identify large dependencies
3. Use lazy loading for heavy components
4. Consider alternative lighter libraries

### Slow Performance
1. Check Web Vitals in monitoring dashboard
2. Look for long tasks (>50ms)
3. Check for layout shifts
4. Identify slow resources
5. Optimize based on findings

### High Error Rate
1. Open monitoring dashboard
2. Check Errors tab
3. Identify common error patterns
4. Fix root causes
5. Monitor error rate decrease

## Additional Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [React Query Caching](https://tanstack.com/query/latest/docs/react/guides/caching)
- [Bundle Analysis](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
