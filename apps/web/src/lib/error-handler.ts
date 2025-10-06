import { toast } from '@/hooks/use-toast';

export interface AppError {
  message: string;
  code?: string | undefined;
  statusCode?: number | undefined;
  details?: unknown;
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
