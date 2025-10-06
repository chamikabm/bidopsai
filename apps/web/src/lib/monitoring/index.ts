/**
 * Monitoring utilities export
 */

export { errorTracker, setupGlobalErrorHandlers, withErrorTracking, withErrorTrackingSync } from './error-tracker';
export type { ErrorContext, TrackedError } from './error-tracker';

export { logger, createScopedLogger } from './logger';
export type { LogLevel, LogEntry } from './logger';

export { analytics, usePageTracking } from './analytics';
export type { AnalyticsEvent, PageView, UserAction } from './analytics';
