'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  section: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Section-specific error boundary for smaller UI sections
 * Provides a more compact error UI suitable for component-level errors
 */
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.section}:`, error, errorInfo);

    // Log to monitoring service
    this.logErrorToService(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // TODO: Integrate with monitoring service (e.g., Sentry, DataDog)
    const errorData = {
      section: this.props.section,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    };

    console.log('Error logged:', errorData);
    // In production: send to monitoring service
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default compact error UI
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error in {this.props.section}</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p className="text-sm">
              {this.state.error?.message || 'An unexpected error occurred in this section.'}
            </p>
            {this.props.showDetails && process.env.NODE_ENV === 'development' && (
              <details className="text-xs">
                <summary className="cursor-pointer">Technical details</summary>
                <pre className="mt-2 overflow-auto rounded bg-muted p-2">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
            <Button
              onClick={this.handleReset}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
