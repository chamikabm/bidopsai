'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  description?: string;
  showHomeButton?: boolean;
  showReloadButton?: boolean;
}

/**
 * Reusable error fallback UI component
 * Can be used as a custom fallback for error boundaries
 */
export function ErrorFallback({
  error,
  resetError,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  showHomeButton = true,
  showReloadButton = true,
}: ErrorFallbackProps) {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="flex min-h-[300px] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {error && (
          <CardContent>
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-destructive">{error.message}</p>
            </div>
          </CardContent>
        )}
        <CardFooter className="flex gap-2">
          {resetError && (
            <Button onClick={resetError} variant="default" className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {showReloadButton && (
            <Button onClick={handleReload} variant="outline" className="flex-1">
              Reload
            </Button>
          )}
          {showHomeButton && (
            <Button onClick={handleGoHome} variant="outline" className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * Compact error fallback for smaller sections
 */
export function CompactErrorFallback({
  error,
  resetError,
  message = 'An error occurred',
}: {
  error?: Error;
  resetError?: () => void;
  message?: string;
}) {
  return (
    <div className="flex items-center justify-center rounded-md border border-destructive/50 bg-destructive/10 p-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
          {error && (
            <p className="text-xs text-muted-foreground">{error.message}</p>
          )}
        </div>
        {resetError && (
          <Button onClick={resetError} variant="outline" size="sm">
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Empty state error fallback
 */
export function EmptyStateErrorFallback({
  title = 'Unable to load content',
  description = 'There was an error loading this content. Please try again.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
