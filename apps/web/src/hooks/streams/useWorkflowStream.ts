'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type { SSEEvent } from '@/types/sse.types';
import { SSEEventType } from '@/types/sse.types';

interface UseWorkflowStreamOptions {
  projectId: string;
  workflowExecutionId?: string;
  enabled?: boolean;
  onEvent?: (event: SSEEvent) => void;
  onError?: (error: Error) => void;
}

interface WorkflowStreamState {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  lastEvent: SSEEvent | null;
}

export function useWorkflowStream({
  projectId,
  workflowExecutionId,
  enabled = true,
  onEvent,
  onError,
}: UseWorkflowStreamOptions) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const [state, setState] = useState<WorkflowStreamState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastEvent: null,
  });

  useEffect(() => {
    if (!enabled || !workflowExecutionId) {
      return;
    }

    const connect = () => {
      // Clean up existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setState((prev) => ({ ...prev, isConnecting: true, error: null }));

      try {
        // Construct SSE URL
        const url = new URL('/api/workflow-agents/invocations/stream', window.location.origin);
        url.searchParams.set('projectId', projectId);
        url.searchParams.set('workflowExecutionId', workflowExecutionId);

        const eventSource = new EventSource(url.toString());
        eventSourceRef.current = eventSource;

        // Handle connection open
        eventSource.onopen = () => {
          setState((prev) => ({
            ...prev,
            isConnected: true,
            isConnecting: false,
            error: null,
          }));
          reconnectAttemptsRef.current = 0;
        };

        // Handle all SSE events
        eventSource.onmessage = (event) => {
          try {
            const sseEvent: SSEEvent = JSON.parse(event.data);

            setState((prev) => ({ ...prev, lastEvent: sseEvent }));

            // Call custom event handler
            onEvent?.(sseEvent);

            // Update TanStack Query cache based on event type
            handleCacheUpdate(sseEvent);
          } catch (error) {
            console.error('Failed to parse SSE event:', error);
          }
        };

        // Handle errors
        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);

          eventSource.close();
          setState((prev) => ({
            ...prev,
            isConnected: false,
            isConnecting: false,
            error: new Error('Connection lost'),
          }));

          // Attempt reconnection with exponential backoff
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            reconnectAttemptsRef.current += 1;

            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            const err = new Error('Max reconnection attempts reached');
            setState((prev) => ({ ...prev, error: err }));
            onError?.(err);
          }
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to connect to SSE');
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: err,
        }));
        onError?.(err);
      }
    };

    // Handle cache updates based on SSE event types
    const handleCacheUpdate = (event: SSEEvent) => {
      switch (event.type) {
        case SSEEventType.WORKFLOW_CREATED:
        case SSEEventType.WORKFLOW_UPDATED:
        case SSEEventType.WORKFLOW_COMPLETED:
        case SSEEventType.WORKFLOW_COMPLETED_WITHOUT_COMMS:
        case SSEEventType.WORKFLOW_COMPLETED_WITHOUT_SUBMISSION:
          // Invalidate workflow execution queries
          queryClient.invalidateQueries({
            queryKey: ['workflowExecution', workflowExecutionId],
          });
          queryClient.invalidateQueries({
            queryKey: ['project', projectId],
          });
          break;

        case SSEEventType.AGENT_TASK_UPDATED:
          // Invalidate agent tasks queries
          queryClient.invalidateQueries({
            queryKey: ['agentTasks', workflowExecutionId],
          });
          break;

        case SSEEventType.ARTIFACTS_READY:
        case SSEEventType.ARTIFACTS_EXPORTED:
          // Invalidate artifacts queries
          queryClient.invalidateQueries({
            queryKey: ['artifacts', projectId],
          });
          break;

        case SSEEventType.PARSER_STARTED:
        case SSEEventType.PARSER_COMPLETED:
        case SSEEventType.PARSER_FAILED:
        case SSEEventType.ANALYSIS_STARTED:
        case SSEEventType.ANALYSIS_COMPLETED:
        case SSEEventType.ANALYSIS_FAILED:
        case SSEEventType.ANALYSIS_RESTARTED:
        case SSEEventType.CONTENT_STARTED:
        case SSEEventType.CONTENT_COMPLETED:
        case SSEEventType.CONTENT_FAILED:
        case SSEEventType.RETURNING_TO_CONTENT:
        case SSEEventType.COMPLIANCE_STARTED:
        case SSEEventType.COMPLIANCE_COMPLETED:
        case SSEEventType.COMPLIANCE_FAILED:
        case SSEEventType.QA_STARTED:
        case SSEEventType.QA_COMPLETED:
        case SSEEventType.QA_FAILED:
        case SSEEventType.COMMS_STARTED:
        case SSEEventType.COMMS_COMPLETED:
        case SSEEventType.COMMS_FAILED:
        case SSEEventType.SUBMISSION_STARTED:
        case SSEEventType.SUBMISSION_COMPLETED:
        case SSEEventType.SUBMISSION_FAILED:
          // Invalidate workflow execution and project progress
          queryClient.invalidateQueries({
            queryKey: ['workflowExecution', workflowExecutionId],
          });
          queryClient.invalidateQueries({
            queryKey: ['project', projectId],
          });
          break;

        default:
          // For unknown events, just log them
          console.debug('Unhandled SSE event:', event.type);
      }
    };

    // Initial connection
    connect();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [enabled, projectId, workflowExecutionId, onEvent, onError, queryClient]);

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setState({
      isConnected: false,
      isConnecting: false,
      error: null,
      lastEvent: null,
    });
  };

  return {
    ...state,
    disconnect,
  };
}