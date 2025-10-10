/**
 * Error Tracking and Logging
 * Centralized error tracking for monitoring and debugging
 */

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  route?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface TrackedError {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  handled: boolean;
}

class ErrorTracker {
  private errors: TrackedError[] = [];
  private maxErrors = 100;
  private errorListeners: Array<(error: TrackedError) => void> = [];

  /**
   * Track an error
   */
  trackError(
    error: Error | string,
    context: ErrorContext = {},
    severity: TrackedError['severity'] = 'medium',
    handled = true
  ) {
    const trackedError: TrackedError = {
      id: this.generateErrorId(),
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      timestamp: Date.now(),
      context: {
        ...context,
        route: context.route || this.getCurrentRoute(),
      },
      severity,
      handled,
    };

    this.errors.push(trackedError);

    // Keep only last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Notify listeners
    this.errorListeners.forEach((listener) => listener(trackedError));

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error Tracker]', trackedError);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(trackedError);
    }

    return trackedError;
  }

  /**
   * Track a warning
   */
  trackWarning(message: string, context: ErrorContext = {}) {
    return this.trackError(message, context, 'low', true);
  }

  /**
   * Track a critical error
   */
  trackCritical(error: Error | string, context: ErrorContext = {}) {
    return this.trackError(error, context, 'critical', false);
  }

  /**
   * Add error listener
   */
  onError(listener: (error: TrackedError) => void) {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Get all tracked errors
   */
  getErrors(): TrackedError[] {
    return [...this.errors];
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: TrackedError['severity']): TrackedError[] {
    return this.errors.filter((error) => error.severity === severity);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count = 10): TrackedError[] {
    return this.errors.slice(-count);
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  getStatistics() {
    const total = this.errors.length;
    const bySeverity = this.errors.reduce(
      (acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byComponent = this.errors.reduce(
      (acc, error) => {
        const component = error.context.component || 'unknown';
        acc[component] = (acc[component] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total,
      bySeverity,
      byComponent,
      unhandled: this.errors.filter((e) => !e.handled).length,
    };
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentRoute(): string {
    if (typeof window === 'undefined') return 'server';
    return window.location.pathname;
  }

  private sendToMonitoring(error: TrackedError) {
    // Send to monitoring service (e.g., Sentry, DataDog, CloudWatch)
    try {
      // Example: Send to custom endpoint
      navigator.sendBeacon?.(
        '/api/monitoring/errors',
        JSON.stringify(error)
      );
    } catch (e) {
      // Silently fail
    }
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

/**
 * Global error handler setup
 */
export function setupGlobalErrorHandlers() {
  if (typeof window === 'undefined') return;

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.trackCritical(
      event.reason instanceof Error ? event.reason : String(event.reason),
      {
        action: 'unhandled-promise-rejection',
      }
    );
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    errorTracker.trackCritical(event.error || event.message, {
      action: 'global-error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Handle React errors (will be caught by Error Boundaries)
  // This is a fallback for errors not caught by boundaries
}

/**
 * Wrap async function with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: ErrorContext = {}
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorTracker.trackError(
        error instanceof Error ? error : String(error),
        context,
        'high',
        false
      );
      throw error;
    }
  }) as T;
}

/**
 * Wrap sync function with error tracking
 */
export function withErrorTrackingSync<T extends (...args: any[]) => any>(
  fn: T,
  context: ErrorContext = {}
): T {
  return ((...args: any[]) => {
    try {
      return fn(...args);
    } catch (error) {
      errorTracker.trackError(
        error instanceof Error ? error : String(error),
        context,
        'high',
        false
      );
      throw error;
    }
  }) as T;
}
