/**
 * Server-Sent Events (SSE) Client
 * 
 * Handles real-time streaming from AWS AgentCore
 * Manages connection lifecycle, reconnection, and event processing
 */

import { SSE_CONFIG } from '@/utils/constants';
import { SSEEventType } from '@/types/sse.types';
import type { SSEEvent } from '@/types/sse.types';

// ============================================
// Types
// ============================================

export interface SSEClientOptions {
  url: string;
  onEvent: (event: SSEEvent) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
  headers?: Record<string, string>;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  reconnectBackoffMultiplier?: number;
}

export interface SSEClientState {
  isConnected: boolean;
  reconnectAttempts: number;
  lastEventId?: string;
}

// ============================================
// SSE Client Class
// ============================================

export class SSEClient {
  private eventSource: EventSource | null = null;
  private options: Required<SSEClientOptions>;
  private state: SSEClientState = {
    isConnected: false,
    reconnectAttempts: 0,
  };
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private isClosed = false;

  constructor(options: SSEClientOptions) {
    this.options = {
      onError: () => {},
      onOpen: () => {},
      onClose: () => {},
      headers: {},
      maxReconnectAttempts: SSE_CONFIG.MAX_RECONNECT_ATTEMPTS,
      reconnectDelay: SSE_CONFIG.RECONNECT_DELAY,
      reconnectBackoffMultiplier: SSE_CONFIG.RECONNECT_BACKOFF_MULTIPLIER,
      ...options,
    };
  }

  /**
   * Connect to SSE endpoint
   */
  connect(): void {
    if (this.isClosed) {
      console.warn('SSE client is closed. Create a new instance to reconnect.');
      return;
    }

    if (this.eventSource) {
      console.warn('SSE connection already exists');
      return;
    }

    try {
      // Build URL with last event ID for resumption
      const url = new URL(this.options.url);
      if (this.state.lastEventId) {
        url.searchParams.set('lastEventId', this.state.lastEventId);
      }

      // EventSource doesn't support custom headers in browser
      // Headers must be sent via query params or cookie for browser SSE
      this.eventSource = new EventSource(url.toString());

      // Connection opened
      this.eventSource.onopen = () => {
        this.state.isConnected = true;
        this.state.reconnectAttempts = 0;
        this.options.onOpen();
        console.log('SSE connection established');
      };

      // Handle incoming messages
      this.eventSource.onmessage = (event) => {
        this.handleMessage(event);
      };

      // Handle errors
      this.eventSource.onerror = (error) => {
        this.handleError(error);
      };

      // Listen for custom event types
      this.setupCustomEventListeners();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to connect to SSE');
      this.options.onError(err);
      this.attemptReconnect();
    }
  }

  /**
   * Set up listeners for custom SSE event types
   */
  private setupCustomEventListeners(): void {
    if (!this.eventSource) return;

    // Define all possible SSE event types from the application
    const eventTypes: SSEEventType[] = [
      SSEEventType.WORKFLOW_CREATED,
      SSEEventType.WORKFLOW_UPDATED,
      SSEEventType.WORKFLOW_COMPLETED,
      SSEEventType.PARSER_STARTED,
      SSEEventType.PARSER_COMPLETED,
      SSEEventType.PARSER_FAILED,
      SSEEventType.ANALYSIS_STARTED,
      SSEEventType.ANALYSIS_COMPLETED,
      SSEEventType.ANALYSIS_FAILED,
      SSEEventType.AWAITING_FEEDBACK,
      SSEEventType.ANALYSIS_RESTARTED,
      SSEEventType.CONTENT_STARTED,
      SSEEventType.CONTENT_COMPLETED,
      SSEEventType.CONTENT_FAILED,
      SSEEventType.COMPLIANCE_STARTED,
      SSEEventType.COMPLIANCE_COMPLETED,
      SSEEventType.COMPLIANCE_FAILED,
      SSEEventType.RETURNING_TO_CONTENT,
      SSEEventType.QA_STARTED,
      SSEEventType.QA_COMPLETED,
      SSEEventType.QA_FAILED,
      SSEEventType.ARTIFACTS_READY,
      SSEEventType.AWAITING_REVIEW,
      SSEEventType.REVIEW_PROMPT,
      SSEEventType.ARTIFACTS_EXPORTED,
      SSEEventType.COMMS_PERMISSION,
      SSEEventType.WORKFLOW_COMPLETED_WITHOUT_COMMS,
      SSEEventType.COMMS_STARTED,
      SSEEventType.COMMS_COMPLETED,
      SSEEventType.COMMS_FAILED,
      SSEEventType.SUBMISSION_PERMISSION,
      SSEEventType.WORKFLOW_COMPLETED_WITHOUT_SUBMISSION,
      SSEEventType.SUBMISSION_STARTED,
      SSEEventType.EMAIL_DRAFT,
      SSEEventType.SUBMISSION_COMPLETED,
      SSEEventType.SUBMISSION_FAILED,
      SSEEventType.AGENT_TASK_UPDATED,
      SSEEventType.ERROR,
    ];

    eventTypes.forEach((eventType) => {
      this.eventSource?.addEventListener(eventType, (event) => {
        this.handleMessage(event as MessageEvent, eventType);
      });
    });
  }

  /**
   * Handle incoming SSE message
   */
  private handleMessage(event: MessageEvent, eventType?: SSEEventType): void {
    try {
      // Store last event ID for reconnection
      if (event.lastEventId) {
        this.state.lastEventId = event.lastEventId;
      }

      // Parse event data
      const data = JSON.parse(event.data);

      // Create SSE event object
      const sseEvent: SSEEvent = {
        type: eventType || data.type || 'message',
        data,
        timestamp: new Date().toISOString(),
        id: event.lastEventId,
      };

      // Call event handler
      this.options.onEvent(sseEvent);
    } catch (error) {
      console.error('Failed to parse SSE message:', error);
      const err = error instanceof Error ? error : new Error('Failed to parse SSE message');
      this.options.onError(err);
    }
  }

  /**
   * Handle SSE error
   */
  private handleError(error: Event): void {
    console.error('SSE connection error:', error);
    
    this.state.isConnected = false;
    
    const err = new Error('SSE connection error');
    this.options.onError(err);

    // Attempt reconnection if not manually closed
    if (!this.isClosed) {
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect after connection loss
   */
  private attemptReconnect(): void {
    // Check if we've exceeded max reconnection attempts
    if (
      this.state.reconnectAttempts >= this.options.maxReconnectAttempts
    ) {
      console.error('Max reconnection attempts exceeded');
      this.options.onError(new Error('Max reconnection attempts exceeded'));
      this.close();
      return;
    }

    // Close existing connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Calculate backoff delay
    const delay =
      this.options.reconnectDelay *
      Math.pow(
        this.options.reconnectBackoffMultiplier,
        this.state.reconnectAttempts
      );

    console.log(
      `Attempting reconnection in ${delay}ms (attempt ${this.state.reconnectAttempts + 1}/${this.options.maxReconnectAttempts})`
    );

    // Schedule reconnection
    this.reconnectTimeoutId = setTimeout(() => {
      this.state.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Close SSE connection
   */
  close(): void {
    this.isClosed = true;
    this.state.isConnected = false;

    // Clear reconnection timeout
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    // Close EventSource
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.options.onClose();
    console.log('SSE connection closed');
  }

  /**
   * Get current connection state
   */
  getState(): Readonly<SSEClientState> {
    return { ...this.state };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state.isConnected;
  }

  /**
   * Manually trigger reconnection
   */
  reconnect(): void {
    if (this.isClosed) {
      console.warn('Cannot reconnect closed SSE client');
      return;
    }

    this.close();
    this.isClosed = false;
    this.state.reconnectAttempts = 0;
    this.connect();
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Create and connect SSE client
 */
export function createSSEClient(options: SSEClientOptions): SSEClient {
  const client = new SSEClient(options);
  client.connect();
  return client;
}

/**
 * Create SSE client for workflow execution
 */
export function createWorkflowSSEClient(
  workflowExecutionId: string,
  onEvent: (event: SSEEvent) => void,
  onError?: (error: Error) => void
): SSEClient {
  const url = `${process.env.NEXT_PUBLIC_AGENT_CORE_URL}/invocations/${workflowExecutionId}/stream`;
  
  return createSSEClient({
    url,
    onEvent,
    onError,
    onOpen: () => {
      console.log(`Workflow SSE connected: ${workflowExecutionId}`);
    },
    onClose: () => {
      console.log(`Workflow SSE disconnected: ${workflowExecutionId}`);
    },
  });
}

/**
 * Create SSE client for notifications
 */
export function createNotificationSSEClient(
  userId: string,
  onEvent: (event: SSEEvent) => void,
  onError?: (error: Error) => void
): SSEClient {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/stream?userId=${userId}`;
  
  return createSSEClient({
    url,
    onEvent,
    onError,
    onOpen: () => {
      console.log(`Notification SSE connected: ${userId}`);
    },
    onClose: () => {
      console.log(`Notification SSE disconnected: ${userId}`);
    },
  });
}