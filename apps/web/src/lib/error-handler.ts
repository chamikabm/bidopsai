import { toast } from '@/hooks/use-toast';

export interface AppError {
  message: string;
  code?: string | undefined;
  statusCode?: number | undefined;
  details?: unknown;
  timestamp?: string;
  context?: string;
}

export interface ErrorLogEntry {
  error: AppError;
  userAgent: string;
  url: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

export class ApplicationError extends Error {
  code?: string | undefined;
  statusCode?: number | undefined;
  details?: unknown;

  constructor(message: string, code?: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Global error handler for the application
 */
export function handleError(error: unknown, context?: string): AppError {
  console.error(`Error in ${context || 'application'}:`, error);

  let appError: AppError;

  if (error instanceof ApplicationError) {
    appError = {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  } else if (error instanceof Error) {
    appError = {
      message: error.message,
      code: 'UNKNOWN_ERROR',
    };
  } else if (typeof error === 'string') {
    appError = {
      message: error,
      code: 'UNKNOWN_ERROR',
    };
  } else {
    appError = {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      details: error,
    };
  }

  return appError;
}

/**
 * Display error toast notification
 */
export function showErrorToast(error: unknown, context?: string) {
  const appError = handleError(error, context);
  
  toast({
    variant: 'destructive',
    title: 'Error',
    description: appError.message,
  });
}

/**
 * Handle API errors from fetch responses
 */
export async function handleAPIError(response: Response): Promise<never> {
  let errorMessage = 'An error occurred while processing your request';
  let errorCode = 'API_ERROR';
  let details: unknown;

  try {
    const data = await response.json();
    errorMessage = data.message || data.error || errorMessage;
    errorCode = data.code || errorCode;
    details = data.details;
  } catch {
    // If response is not JSON, use status text
    errorMessage = response.statusText || errorMessage;
  }

  throw new ApplicationError(
    errorMessage,
    errorCode,
    response.status,
    details
  );
}

/**
 * Handle GraphQL errors
 */
export function handleGraphQLError(errors: unknown[]): never {
  const firstError = errors[0] as { message?: string; extensions?: { code?: string } } | undefined;
  const message = firstError?.message || 'GraphQL request failed';
  const code = firstError?.extensions?.code || 'GRAPHQL_ERROR';

  throw new ApplicationError(message, code, undefined, errors);
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('NetworkError')
    );
  }
  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof ApplicationError) {
    return error.statusCode === 401 || error.code === 'UNAUTHORIZED';
  }
  return false;
}

/**
 * Check if error is a permission error
 */
export function isPermissionError(error: unknown): boolean {
  if (error instanceof ApplicationError) {
    return error.statusCode === 403 || error.code === 'FORBIDDEN';
  }
  return false;
}

/**
 * Log error to monitoring service
 * TODO: Integrate with actual monitoring service (Sentry, DataDog, CloudWatch, etc.)
 */
export function logErrorToMonitoring(
  error: unknown,
  context?: string,
  additionalData?: Record<string, unknown>
): void {
  const appError = handleError(error, context);
  
  const errorLog: ErrorLogEntry = {
    error: {
      ...appError,
      timestamp: new Date().toISOString(),
      context,
    },
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    timestamp: new Date().toISOString(),
    ...additionalData,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged to monitoring:', errorLog);
  }

  // TODO: Send to monitoring service
  // Example integrations:
  // - Sentry.captureException(error, { contexts: { custom: errorLog } })
  // - DataDog.logger.error(appError.message, errorLog)
  // - AWS CloudWatch Logs
}

/**
 * Create a user-friendly error message based on error type
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  if (isAuthError(error)) {
    return 'Your session has expired. Please sign in again.';
  }

  if (isPermissionError(error)) {
    return 'You do not have permission to perform this action.';
  }

  if (error instanceof ApplicationError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Enhanced error handler with monitoring integration
 */
export function handleErrorWithLogging(
  error: unknown,
  context?: string,
  additionalData?: Record<string, unknown>
): AppError {
  const appError = handleError(error, context);
  
  // Log to monitoring service
  logErrorToMonitoring(error, context, additionalData);
  
  return appError;
}

/**
 * Display enhanced error toast with user-friendly message
 */
export function showEnhancedErrorToast(
  error: unknown,
  context?: string,
  customMessage?: string
) {
  const friendlyMessage = customMessage || getUserFriendlyErrorMessage(error);
  
  toast({
    variant: 'destructive',
    title: 'Error',
    description: friendlyMessage,
  });

  // Log to monitoring
  logErrorToMonitoring(error, context);
}
