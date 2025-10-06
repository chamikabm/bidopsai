import { AgentType, AgentFailedData } from '@/types/sse';
import { ErrorRecoveryManager } from './ErrorRecoveryManager';
import { logErrorToMonitoring, ApplicationError } from '@/lib/error-handler';

export interface WorkflowErrorContext {
  projectId: string;
  workflowExecutionId?: string;
  sessionId?: string;
  userId?: string;
}

export interface WorkflowErrorAction {
  type: 'retry' | 'skip' | 'restart' | 'manual' | 'cancel';
  message: string;
  delay?: number;
  requiresUserInput?: boolean;
}

export class WorkflowErrorHandler {
  private errorRecoveryManager: ErrorRecoveryManager;
  private context: WorkflowErrorContext;
  private errorCallbacks: Map<string, (action: WorkflowErrorAction) => void> = new Map();

  constructor(context: WorkflowErrorContext) {
    this.errorRecoveryManager = new ErrorRecoveryManager();
    this.context = context;
  }

  /**
   * Handle agent task failure
   */
  handleAgentFailure(data: AgentFailedData): WorkflowErrorAction {
    // Log error to monitoring service
    this.logAgentError(data);

    // Get recovery strategy
    const recovery = this.errorRecoveryManager.handleError(data);

    // Create action based on recovery strategy
    const action: WorkflowErrorAction = {
      type: this.mapSuggestedActionToType(recovery.suggestedAction),
      message: recovery.message,
      ...(recovery.retryDelay !== undefined && { delay: recovery.retryDelay }),
      requiresUserInput: recovery.suggestedAction === 'manual_intervention',
    };

    // Notify callbacks
    this.notifyErrorCallbacks(action);

    return action;
  }

  /**
   * Handle SSE connection errors
   */
  handleConnectionError(error: Error): WorkflowErrorAction {
    // Log connection error
    logErrorToMonitoring(error, 'SSE Connection', {
      projectId: this.context.projectId,
      sessionId: this.context.sessionId,
    });

    // Determine if we should retry connection
    const errorMessage = error.message.toLowerCase();
    const isNetworkError = errorMessage.includes('network') || 
                          errorMessage.includes('fetch') ||
                          errorMessage.includes('timeout');

    if (isNetworkError) {
      return {
        type: 'retry',
        message: 'Connection lost. Attempting to reconnect...',
        delay: 2000 as number,
        requiresUserInput: false,
      };
    }

    return {
      type: 'manual',
      message: 'Unable to establish connection. Please check your connection and try again.',
      requiresUserInput: true,
    };
  }

  /**
   * Handle workflow timeout
   */
  handleWorkflowTimeout(agent: AgentType, timeoutMs: number): WorkflowErrorAction {
    const error = new ApplicationError(
      `${agent} agent timed out after ${timeoutMs}ms`,
      'WORKFLOW_TIMEOUT',
      408
    );

    logErrorToMonitoring(error, 'Workflow Timeout', {
      projectId: this.context.projectId,
      agent,
      timeoutMs,
    });

    return {
      type: 'manual',
      message: `The ${agent} agent is taking longer than expected. You can wait or restart the workflow.`,
      requiresUserInput: true,
    };
  }

  /**
   * Handle parser-specific errors
   */
  handleParserError(data: AgentFailedData): WorkflowErrorAction {
    // Parser errors are critical - log with high priority
    logErrorToMonitoring(
      new ApplicationError(data.error, data.errorCode),
      'Parser Error',
      {
        projectId: this.context.projectId,
        severity: 'critical',
      }
    );

    const recovery = this.errorRecoveryManager.handleError(data);

    if (recovery.shouldRetry) {
      return {
        type: 'retry',
        message: 'Document parsing failed. Retrying with different settings...',
        ...(recovery.retryDelay !== undefined && { delay: recovery.retryDelay }),
        requiresUserInput: false,
      };
    }

    return {
      type: 'restart',
      message: 'Unable to parse documents. Please check the uploaded files and restart the workflow.',
      requiresUserInput: true,
    };
  }

  /**
   * Handle content generation errors
   */
  handleContentError(data: AgentFailedData): WorkflowErrorAction {
    logErrorToMonitoring(
      new ApplicationError(data.error, data.errorCode),
      'Content Generation Error',
      {
        projectId: this.context.projectId,
        agent: data.agent,
      }
    );

    const recovery = this.errorRecoveryManager.handleError(data);

    if (recovery.shouldRetry) {
      return {
        type: 'retry',
        message: 'Content generation failed. Retrying...',
        ...(recovery.retryDelay !== undefined && { delay: recovery.retryDelay }),
        requiresUserInput: false,
      };
    }

    return {
      type: 'manual',
      message: 'Unable to generate content. Please review the analysis and try again.',
      requiresUserInput: true,
    };
  }

  /**
   * Handle compliance/QA errors
   */
  handleReviewError(data: AgentFailedData): WorkflowErrorAction {
    logErrorToMonitoring(
      new ApplicationError(data.error, data.errorCode),
      'Review Error',
      {
        projectId: this.context.projectId,
        agent: data.agent,
      }
    );

    const recovery = this.errorRecoveryManager.handleError(data);

    if (recovery.shouldRetry) {
      return {
        type: 'retry',
        message: `${data.agent} review failed. Retrying...`,
        ...(recovery.retryDelay !== undefined && { delay: recovery.retryDelay }),
        requiresUserInput: false,
      };
    }

    // Allow skipping review steps if max retries reached
    return {
      type: 'skip',
      message: `${data.agent} review could not be completed. You can skip this step or try again manually.`,
      requiresUserInput: true,
    };
  }

  /**
   * Handle submission errors
   */
  handleSubmissionError(data: AgentFailedData): WorkflowErrorAction {
    // Submission errors are critical - don't auto-retry
    logErrorToMonitoring(
      new ApplicationError(data.error, data.errorCode),
      'Submission Error',
      {
        projectId: this.context.projectId,
        severity: 'critical',
      }
    );

    return {
      type: 'manual',
      message: 'Submission failed. Please review the error and try again manually.',
      requiresUserInput: true,
    };
  }

  /**
   * Register callback for error actions
   */
  onError(id: string, callback: (action: WorkflowErrorAction) => void): void {
    this.errorCallbacks.set(id, callback);
  }

  /**
   * Unregister error callback
   */
  offError(id: string): void {
    this.errorCallbacks.delete(id);
  }

  /**
   * Clear all error states
   */
  clearErrors(): void {
    this.errorRecoveryManager.clearAllErrorStates();
  }

  /**
   * Get current error states
   */
  getErrorStates() {
    return this.errorRecoveryManager.getAllErrorStates();
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return this.errorRecoveryManager.hasErrors();
  }

  /**
   * Private helper methods
   */

  private logAgentError(data: AgentFailedData): void {
    const error = new ApplicationError(
      data.error,
      data.errorCode,
      undefined,
      {
        agent: data.agent,
        canRetry: data.canRetry,
        suggestedAction: data.suggestedAction,
        affectedSteps: data.affectedSteps,
      }
    );

    logErrorToMonitoring(error, 'Agent Task Failure', {
      projectId: this.context.projectId,
      workflowExecutionId: this.context.workflowExecutionId,
      agent: data.agent,
    });
  }

  private mapSuggestedActionToType(
    action: 'retry' | 'skip' | 'restart_workflow' | 'manual_intervention'
  ): WorkflowErrorAction['type'] {
    switch (action) {
      case 'retry':
        return 'retry';
      case 'skip':
        return 'skip';
      case 'restart_workflow':
        return 'restart';
      case 'manual_intervention':
        return 'manual';
      default:
        return 'manual';
    }
  }

  private notifyErrorCallbacks(action: WorkflowErrorAction): void {
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(action);
      } catch (error) {
        console.error('Error in error callback:', error);
      }
    });
  }
}
