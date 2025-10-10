/**
 * User Analytics and Usage Tracking
 * Track user interactions and application usage
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  route?: string;
}

export interface PageView {
  path: string;
  title: string;
  referrer?: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

export interface UserAction {
  action: string;
  category: string;
  label?: string;
  value?: number;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  route?: string;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private pageViews: PageView[] = [];
  private userActions: UserAction[] = [];
  private maxEvents = 200;
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Clear user ID
   */
  clearUserId() {
    this.userId = undefined;
  }

  /**
   * Track a custom event
   */
  trackEvent(name: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      route: this.getCurrentRoute(),
    };

    this.events.push(event);
    this.trimEvents();

    // Send to analytics service
    this.sendToAnalytics('event', event);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Event:', event);
    }
  }

  /**
   * Track a page view
   */
  trackPageView(path?: string, title?: string) {
    const pageView: PageView = {
      path: path || this.getCurrentRoute(),
      title: title || this.getCurrentTitle(),
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    this.pageViews.push(pageView);
    this.trimPageViews();

    // Send to analytics service
    this.sendToAnalytics('pageview', pageView);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Page View:', pageView);
    }
  }

  /**
   * Track a user action
   */
  trackAction(
    action: string,
    category: string,
    label?: string,
    value?: number
  ) {
    const userAction: UserAction = {
      action,
      category,
      label,
      value,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      route: this.getCurrentRoute(),
    };

    this.userActions.push(userAction);
    this.trimUserActions();

    // Send to analytics service
    this.sendToAnalytics('action', userAction);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Action:', userAction);
    }
  }

  /**
   * Track button click
   */
  trackButtonClick(buttonName: string, context?: Record<string, any>) {
    this.trackAction('click', 'button', buttonName);
    this.trackEvent('button_click', { buttonName, ...context });
  }

  /**
   * Track form submission
   */
  trackFormSubmit(formName: string, success: boolean, context?: Record<string, any>) {
    this.trackAction('submit', 'form', formName, success ? 1 : 0);
    this.trackEvent('form_submit', { formName, success, ...context });
  }

  /**
   * Track navigation
   */
  trackNavigation(from: string, to: string) {
    this.trackEvent('navigation', { from, to });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(featureName: string, context?: Record<string, any>) {
    this.trackEvent('feature_usage', { featureName, ...context });
  }

  /**
   * Track workflow step
   */
  trackWorkflowStep(workflowName: string, step: string, status: 'started' | 'completed' | 'failed') {
    this.trackEvent('workflow_step', { workflowName, step, status });
  }

  /**
   * Track agent interaction
   */
  trackAgentInteraction(agentType: string, action: string, context?: Record<string, any>) {
    this.trackEvent('agent_interaction', { agentType, action, ...context });
  }

  /**
   * Track artifact action
   */
  trackArtifactAction(action: 'create' | 'edit' | 'view' | 'download', artifactType: string) {
    this.trackEvent('artifact_action', { action, artifactType });
  }

  /**
   * Track search
   */
  trackSearch(query: string, resultsCount: number, context?: Record<string, any>) {
    this.trackEvent('search', { query, resultsCount, ...context });
  }

  /**
   * Track error occurrence
   */
  trackError(errorMessage: string, errorType: string, context?: Record<string, any>) {
    this.trackEvent('error', { errorMessage, errorType, ...context });
  }

  /**
   * Get all events
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Get all page views
   */
  getPageViews(): PageView[] {
    return [...this.pageViews];
  }

  /**
   * Get all user actions
   */
  getUserActions(): UserAction[] {
    return [...this.userActions];
  }

  /**
   * Get analytics summary
   */
  getSummary() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      totalEvents: this.events.length,
      totalPageViews: this.pageViews.length,
      totalActions: this.userActions.length,
      eventsByName: this.groupBy(this.events, 'name'),
      actionsByCategory: this.groupBy(this.userActions, 'category'),
    };
  }

  private initializeTracking() {
    if (typeof window === 'undefined') return;

    // Track initial page view
    this.trackPageView();

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden');
      } else {
        this.trackEvent('page_visible');
      }
    });

    // Track session duration on unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('session_end', {
        duration: Date.now() - parseInt(this.sessionId.split('_')[1]),
      });
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentRoute(): string {
    if (typeof window === 'undefined') return 'server';
    return window.location.pathname;
  }

  private getCurrentTitle(): string {
    if (typeof document === 'undefined') return '';
    return document.title;
  }

  private sendToAnalytics(type: string, data: any) {
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      try {
        navigator.sendBeacon?.(
          '/api/analytics/track',
          JSON.stringify({ type, data, timestamp: Date.now() })
        );
      } catch (e) {
        // Silently fail
      }
    }
  }

  private trimEvents() {
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  private trimPageViews() {
    if (this.pageViews.length > this.maxEvents) {
      this.pageViews = this.pageViews.slice(-this.maxEvents);
    }
  }

  private trimUserActions() {
    if (this.userActions.length > this.maxEvents) {
      this.userActions = this.userActions.slice(-this.maxEvents);
    }
  }

  private groupBy<T extends Record<string, any>>(
    items: T[],
    key: keyof T
  ): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// Singleton instance
export const analytics = new Analytics();

/**
 * Hook for tracking page views in Next.js
 */
export function usePageTracking() {
  if (typeof window === 'undefined') return;

  // Track page view on mount
  analytics.trackPageView();
}
