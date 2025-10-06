'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  projectId?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * Specialized error boundary for workflow/agent interactions
 * Provides workflow-specific error recovery options
 */
export class WorkflowErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WorkflowErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Log to monitoring service
    this.logWorkflowError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  logWorkflowError(error: Error, errorInfo: ErrorInfo) {
    // TODO: Integrate with monitoring service
    const errorData = {
      context: 'workflow',
      projectId: this.props.projectId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
    };

    console.log('Workflow error logged:', errorData);
    // In production: send to monitoring service
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
    });

    // Call custom retry handler if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleReportIssue = () => {
    // TODO: Open issue reporting modal or redirect to support
    const errorDetails = {
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      projectId: this.props.projectId,
    };
    console.log('Report issue:', errorDetails);
    alert('Issue reporting will be implemented. Error details logged to console.');
  };

  render() {
    if (this.state.hasError) {
      const isNetworkError = this.state.error?.message.includes('fetch') || 
                            this.state.error?.message.includes('network');
      const isSSEError = this.state.error?.message.includes('SSE') || 
                        this.state.error?.message.includes('EventSource');

      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Workflow Error</CardTitle>
              </div>
              <CardDescription>
                An error occurred during the workflow execution. You can try again or return to the dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error message */}
              <Alert variant="destructive">
                <AlertDescription>
                  <p className="font-medium">{this.state.error?.message || 'Unknown error'}</p>
                </AlertDescription>
              </Alert>

              {/* Specific error guidance */}
              {isNetworkError && (
                <Alert>
                  <AlertDescription>
                    <p className="text-sm">
                      <strong>Network Error:</strong> Please check your internet connection and try again.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {isSSEError && (
                <Alert>
                  <AlertDescription>
                    <p className="text-sm">
                      <strong>Connection Error:</strong> The real-time connection was interrupted. 
                      Retrying will attempt to reconnect to the workflow.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {this.state.retryCount > 0 && (
                <Alert>
                  <AlertDescription>
                    <p className="text-sm">
                      Retry attempts: {this.state.retryCount}
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Development details */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="rounded-md bg-muted p-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    Developer Information
                  </summary>
                  <pre className="mt-2 overflow-auto text-xs">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button onClick={this.handleReset} variant="default" className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Workflow
              </Button>
              <Button onClick={this.handleReload} variant="outline" className="flex-1">
                Reload Page
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <Button onClick={this.handleReportIssue} variant="ghost" size="sm">
                <Bug className="mr-2 h-4 w-4" />
                Report Issue
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
