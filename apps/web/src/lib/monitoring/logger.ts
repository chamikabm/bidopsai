/**
 * Structured Logging Utility
 * Provides consistent logging across the application
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  route?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 500;
  private logLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

  /**
   * Set minimum log level
   */
  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  /**
   * Debug log
   */
  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  /**
   * Info log
   */
  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  /**
   * Warning log
   */
  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  /**
   * Error log
   */
  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context);
  }

  /**
   * Log with specific level
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      route: this.getCurrentRoute(),
    };

    this.logs.push(entry);

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    this.outputToConsole(entry);

    // Send to monitoring in production
    if (process.env.NODE_ENV === 'production' && level !== 'debug') {
      this.sendToMonitoring(entry);
    }
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Output to console with appropriate method
   */
  private outputToConsole(entry: LogEntry) {
    const prefix = `[${new Date(entry.timestamp).toISOString()}] [${entry.level.toUpperCase()}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.context);
        break;
      case 'info':
        console.info(message, entry.context);
        break;
      case 'warn':
        console.warn(message, entry.context);
        break;
      case 'error':
        console.error(message, entry.context);
        break;
    }
  }

  /**
   * Get current route
   */
  private getCurrentRoute(): string {
    if (typeof window === 'undefined') return 'server';
    return window.location.pathname;
  }

  /**
   * Send to monitoring service
   */
  private sendToMonitoring(entry: LogEntry) {
    try {
      navigator.sendBeacon?.(
        '/api/monitoring/logs',
        JSON.stringify(entry)
      );
    } catch (e) {
      // Silently fail
    }
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get log statistics
   */
  getStatistics() {
    const total = this.logs.length;
    const byLevel = this.logs.reduce(
      (acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      },
      {} as Record<LogLevel, number>
    );

    return {
      total,
      byLevel,
    };
  }
}

// Singleton instance
export const logger = new Logger();

/**
 * Create a scoped logger with context
 */
export function createScopedLogger(scope: string, defaultContext?: Record<string, any>) {
  return {
    debug: (message: string, context?: Record<string, any>) =>
      logger.debug(`[${scope}] ${message}`, { ...defaultContext, ...context }),
    info: (message: string, context?: Record<string, any>) =>
      logger.info(`[${scope}] ${message}`, { ...defaultContext, ...context }),
    warn: (message: string, context?: Record<string, any>) =>
      logger.warn(`[${scope}] ${message}`, { ...defaultContext, ...context }),
    error: (message: string, context?: Record<string, any>) =>
      logger.error(`[${scope}] ${message}`, { ...defaultContext, ...context }),
  };
}
