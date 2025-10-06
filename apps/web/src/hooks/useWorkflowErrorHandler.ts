'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AgentFailedData, AgentType } from '@/types/sse';
import { WorkflowErrorHandler, WorkflowErrorAction, WorkflowErrorContext } from '@/lib/sse/WorkflowErrorHandler';
import { useToast } from '@/hooks/use-toast';

interface UseWorkflowErrorHandlerOptions {
  context: WorkflowErrorContext;
  onRetry?: (agent: AgentType) => void;
  onSkip?: (agent: AgentType) => void;
  onRestart?: () => void;
  onManualIntervention?: (agent: AgentType, error: string) => void;
}

interface WorkflowError {
  agent: AgentType;
  error: string;
  errorCode: string;
  action: WorkflowErrorAction;
  timestamp: Date;
}

export function useWorkflowErrorHandler(options: UseWorkflowErrorHandlerOptions) {
  const { context, onRetry, onSkip, onRestart, onManualIntervention } = options;
  const { toast } = useToast();
  
  const [currentError, setCurrentError] = useState<WorkflowError | null>(null);
  const [errorHistory, setErrorHistory] = useState<WorkflowError[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const errorHandlerRef = useRef<WorkflowErrorHandler | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize error handler
  useEffect(() => {
    errorHandlerRef.current = new WorkflowErrorHandler(context);

    return () => {
      if (errorHandlerRef.current) {
        errorHandlerRef.current.offError('main');
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [context]);

  /**
   * Show error toast
   */
  const showErrorToast = useCallback((error: WorkflowError) => {
    const title = `${error.agent} Error`;
    const description = error.action.message;

    toast({
      variant: 'destructive',
      title,
      description,
    });
  }, [toast]);

  /**
   * Execute error action
   */
  const executeErrorAction = useCallback((agent: AgentType, action: WorkflowErrorAction) => {
    switch (action.type) {
      case 'retry':
        if (action.delay) {
          setIsRetrying(true);
          retryTimeoutRef.current = setTimeout(() => {
            setIsRetrying(false);
            onRetry?.(agent);
          }, action.delay);
        } else {
          onRetry?.(agent);
        }
        break;

      case 'skip':
        onSkip?.(agent);
        break;

      case 'restart':
        onRestart?.();
        break;

      case 'manual':
        onManualIntervention?.(agent, currentError?.error || 'Unknown error');
        break;
    }
  }, [currentError, onRetry, onSkip, onRestart, onManualIntervention]);

  /**
   * Handle agent failure
   */
  const handleAgentFailure = useCallback((data: AgentFailedData) => {
    if (!errorHandlerRef.current) return;

    let action: WorkflowErrorAction;

    // Use specialized handlers for specific agents
    switch (data.agent) {
      case AgentType.PARSER:
        action = errorHandlerRef.current.handleParserError(data);
        break;
      case AgentType.CONTENT:
        action = errorHandlerRef.current.handleContentError(data);
        break;
      case AgentType.COMPLIANCE:
      case AgentType.QA:
        action = errorHandlerRef.current.handleReviewError(data);
        break;
      case AgentType.SUBMISSION:
        action = errorHandlerRef.current.handleSubmissionError(data);
        break;
      default:
        action = errorHandlerRef.current.handleAgentFailure(data);
    }

    const error: WorkflowError = {
      agent: data.agent,
      error: data.error,
      errorCode: data.errorCode,
      action,
      timestamp: new Date(),
    };

    setCurrentError(error);
    setErrorHistory((prev) => [...prev, error]);

    // Show toast notification
    showErrorToast(error);

    // Execute action if it doesn't require user input
    if (!action.requiresUserInput) {
      executeErrorAction(data.agent, action);
    }
  }, [executeErrorAction, showErrorToast]);

  /**
   * Handle connection error
   */
  const handleConnectionError = useCallback((error: Error) => {
    if (!errorHandlerRef.current) return;

    const action = errorHandlerRef.current.handleConnectionError(error);

    toast({
      variant: 'destructive',
      title: 'Connection Error',
      description: action.message,
    });

    if (action.type === 'retry' && action.delay) {
      setIsRetrying(true);
      retryTimeoutRef.current = setTimeout(() => {
        setIsRetrying(false);
        // Trigger reconnection logic
        window.location.reload();
      }, action.delay);
    }
  }, [toast]);

  /**
   * Handle workflow timeout
   */
  const handleWorkflowTimeout = useCallback((agent: AgentType, timeoutMs: number) => {
    if (!errorHandlerRef.current) return;

    const action = errorHandlerRef.current.handleWorkflowTimeout(agent, timeoutMs);

    toast({
      variant: 'destructive',
      title: 'Workflow Timeout',
      description: action.message,
    });

    setCurrentError({
      agent,
      error: `Timeout after ${timeoutMs}ms`,
      errorCode: 'TIMEOUT',
      action,
      timestamp: new Date(),
    });
  }, [toast]);

  /**
   * Manually retry current error
   */
  const retryCurrentError = useCallback(() => {
    if (!currentError) return;
    
    const retryAction: WorkflowErrorAction = {
      type: 'retry',
      message: 'Retrying...',
      requiresUserInput: false,
    };
    
    executeErrorAction(currentError.agent, retryAction);
    setCurrentError(null);
  }, [currentError, executeErrorAction]);

  /**
   * Skip current error
   */
  const skipCurrentError = useCallback(() => {
    if (!currentError) return;
    
    const skipAction: WorkflowErrorAction = {
      type: 'skip',
      message: 'Skipping...',
      requiresUserInput: false,
    };
    
    executeErrorAction(currentError.agent, skipAction);
    setCurrentError(null);
  }, [currentError, executeErrorAction]);

  /**
   * Clear current error
   */
  const clearCurrentError = useCallback(() => {
    setCurrentError(null);
  }, []);

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    setCurrentError(null);
    setErrorHistory([]);
    errorHandlerRef.current?.clearErrors();
  }, []);

  return {
    currentError,
    errorHistory,
    isRetrying,
    hasErrors: currentError !== null || errorHistory.length > 0,
    handleAgentFailure,
    handleConnectionError,
    handleWorkflowTimeout,
    retryCurrentError,
    skipCurrentError,
    clearCurrentError,
    clearAllErrors,
  };
}
