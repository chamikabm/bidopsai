'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, SkipForward, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AgentType } from '@/types/sse';

interface AgentErrorMessageProps {
  agent: AgentType;
  error: string;
  errorCode?: string;
  timestamp: Date;
  canRetry?: boolean;
  canSkip?: boolean;
  isRetrying?: boolean;
  onRetry?: () => void;
  onSkip?: () => void;
  onViewDetails?: () => void;
}

export function AgentErrorMessage({
  agent,
  error,
  errorCode,
  timestamp,
  canRetry = true,
  canSkip = false,
  isRetrying = false,
  onRetry,
  onSkip,
  onViewDetails,
}: AgentErrorMessageProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAgentDisplayName = (agent: AgentType): string => {
    return agent.charAt(0) + agent.slice(1).toLowerCase();
  };

  return (
    <div className="my-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>{getAgentDisplayName(agent)} Agent Failed</span>
          <span className="text-xs font-normal text-muted-foreground">
            {formatTime(timestamp)}
          </span>
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p className="text-sm">{error}</p>
          
          {errorCode && (
            <p className="text-xs text-muted-foreground">
              Error Code: {errorCode}
            </p>
          )}

          {isRetrying && (
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Retrying...</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {canRetry && onRetry && !isRetrying && (
              <Button
                onClick={onRetry}
                size="sm"
                variant="outline"
                className="h-8"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Retry
              </Button>
            )}
            
            {canSkip && onSkip && !isRetrying && (
              <Button
                onClick={onSkip}
                size="sm"
                variant="outline"
                className="h-8"
              >
                <SkipForward className="mr-2 h-3 w-3" />
                Skip
              </Button>
            )}
            
            {onViewDetails && (
              <Button
                onClick={onViewDetails}
                size="sm"
                variant="ghost"
                className="h-8"
              >
                <Info className="mr-2 h-3 w-3" />
                Details
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
