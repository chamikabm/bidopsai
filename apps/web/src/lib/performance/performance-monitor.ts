/**
 * Performance Monitoring Utility
 * Tracks Web Vitals and custom performance metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id: string;
  navigationType?: string;
}

export interface CustomMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private customMetrics: CustomMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Observe Long Tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordCustomMetric('long-task', entry.duration, {
              startTime: entry.startTime,
              name: entry.name,
            });
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        // Long tasks not supported
      }

      // Observe Layout Shifts
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              this.recordCustomMetric('layout-shift', (entry as any).value, {
                startTime: entry.startTime,
              });
            }
          }
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutShiftObserver);
      } catch (e) {
        // Layout shift not supported
      }

      // Observe Resource Timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const resourceEntry = entry as PerformanceResourceTiming;
            if (resourceEntry.duration > 1000) {
              // Log slow resources (>1s)
              this.recordCustomMetric('slow-resource', resourceEntry.duration, {
                name: resourceEntry.name,
                type: resourceEntry.initiatorType,
                size: resourceEntry.transferSize,
              });
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (e) {
        // Resource timing not supported
      }
    }
  }

  /**
   * Record a Web Vital metric
   */
  recordWebVital(metric: PerformanceMetric) {
    this.metrics.set(metric.name, metric);
    
    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics('web-vital', metric);
    }
  }

  /**
   * Record a custom performance metric
   */
  recordCustomMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: CustomMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.customMetrics.push(metric);

    // Keep only last 100 metrics
    if (this.customMetrics.length > 100) {
      this.customMetrics.shift();
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics('custom-metric', metric);
    }
  }

  /**
   * Measure execution time of a function
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordCustomMetric(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordCustomMetric(name, duration, {
        ...metadata,
        error: true,
      });
      throw error;
    }
  }

  /**
   * Measure execution time of a synchronous function
   */
  measure<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const startTime = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      this.recordCustomMetric(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordCustomMetric(name, duration, {
        ...metadata,
        error: true,
      });
      throw error;
    }
  }

  /**
   * Mark a performance point
   */
  mark(name: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(name);
    }
  }

  /**
   * Measure between two marks
   */
  measureBetween(name: string, startMark: string, endMark: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        if (measure) {
          this.recordCustomMetric(name, measure.duration);
        }
      } catch (e) {
        // Marks not found
      }
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get custom metrics
   */
  getCustomMetrics(): CustomMetric[] {
    return [...this.customMetrics];
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const webVitals = this.getMetrics();
    const custom = this.getCustomMetrics();

    return {
      webVitals: webVitals.reduce((acc, metric) => {
        acc[metric.name] = {
          value: metric.value,
          rating: metric.rating,
        };
        return acc;
      }, {} as Record<string, { value: number; rating: string }>),
      customMetrics: {
        count: custom.length,
        averages: this.calculateAverages(custom),
      },
    };
  }

  private calculateAverages(metrics: CustomMetric[]) {
    const grouped = metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(grouped).reduce((acc, [name, values]) => {
      acc[name] = {
        avg: values.reduce((sum, v) => sum + v, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
      return acc;
    }, {} as Record<string, { avg: number; min: number; max: number; count: number }>);
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(type: string, data: any) {
    // This would integrate with your analytics service
    // For now, we'll just log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${type}:`, data);
    }

    // In production, send to analytics endpoint
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Example: Send to custom analytics endpoint
      try {
        navigator.sendBeacon?.(
          '/api/analytics/performance',
          JSON.stringify({ type, data, timestamp: Date.now() })
        );
      } catch (e) {
        // Silently fail
      }
    }
  }

  /**
   * Clean up observers
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook for measuring component render time
 */
export function measureComponentRender(componentName: string) {
  const startMark = `${componentName}-render-start`;
  const endMark = `${componentName}-render-end`;
  
  performanceMonitor.mark(startMark);
  
  return () => {
    performanceMonitor.mark(endMark);
    performanceMonitor.measureBetween(
      `${componentName}-render`,
      startMark,
      endMark
    );
  };
}
