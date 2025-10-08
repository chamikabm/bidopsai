# SSE Event Contracts: AgentCore Workflow Streaming

**Feature**: BidOps.AI Frontend Application  
**Date**: 2025-10-07  
**Status**: Complete

## Overview

This document defines the Server-Sent Events (SSE) contracts for real-time communication between the AWS AgentCore backend and the frontend. All events are streamed from the `/invocations` endpoint as the Supervisor Agent orchestrates the multi-agent workflow.

**Event Format**: All SSE events follow the standard format:
```
event: <event_type>
data: <JSON_payload>
```

---

## Connection & Stream Management

### Stream Initialization

**Endpoint**: `POST /invocations`  
**Content-Type**: `application/json`  
**Response Type**: `text/event-stream`

**Request Payload**:
```typescript
interface InvocationRequest {
  project_id: string;
  user_id: string;
  session_id: string;
  start: boolean; // true for new workflow, false for continuing
  user_input?: {
    chat?: string;
    content_edits?: ContentEdit[];
  };
}

interface ContentEdit {
  artifact_id: string;
  content: TipTapContent | QAContent | ExcelContent;
}
```

**Connection Headers**:
```
Accept: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
Authorization: Bearer <cognito_jwt_token>
```

---

## Event Types

### 1. Workflow Lifecycle Events

#### `workflow_created`

Sent when Supervisor Agent creates WorkflowExecution and AgentTasks.

```typescript
interface WorkflowCreatedEvent {
  event: 'workflow_created';
  data: {
    workflow_execution_id: string;
    project_id: string;
    status: 'OPEN';
    agent_tasks: Array<{
      id: string;
      agent: AgentType;
      sequence_order: number;
      status: 'OPEN';
    }>;
    timestamp: string; // ISO 8601
  };
}
```

**Frontend Action**: Initialize progress bar with 8 workflow steps.

---

#### `workflow_completed`

Sent when all workflow steps are completed successfully.

```typescript
interface WorkflowCompletedEvent {
  event: 'workflow_completed';
  data: {
    workflow_execution_id: string;
    project_id: string;
    status: 'COMPLETED';
    completed_by: string; // user_id
    completed_at: string; // ISO 8601
    results: {
      artifacts_count: number;
      submission_status?: 'sent' | 'not_sent';
    };
    timestamp: string; // ISO 8601
  };
}
```

**Frontend Action**: Mark progress bar as 100%, show success message.

---

#### `workflow_completed_without_comms`

Sent when workflow completes but user declined communications step.

```typescript
interface WorkflowCompletedWithoutCommsEvent {
  event: 'workflow_completed_without_comms';
  data: {
    workflow_execution_id: string;
    project_id: string;
    status: 'COMPLETED';
    completed_by: string;
    completed_at: string;
    timestamp: string;
  };
}
```

**Frontend Action**: Mark progress bar as 100%, show completion message without comms.

---

#### `workflow_completed_without_submission`

Sent when workflow completes but user declined submission step.

```typescript
interface WorkflowCompletedWithoutSubmissionEvent {
  event: 'workflow_completed_without_submission';
  data: {
    workflow_execution_id: string;
    project_id: string;
    status: 'COMPLETED';
    completed_by: string;
    completed_at: string;
    timestamp: string;
  };
}
```

**Frontend Action**: Mark progress bar as 100%, show completion message without submission.

---

### 2. Agent Task Events

#### `parser_started`

Sent when Parser Agent begins document parsing.

```typescript
interface ParserStartedEvent {
  event: 'parser_started';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'IN_PROGRESS';
    message: string; // e.g., "Parsing uploaded documents..."
    timestamp: string;
  };
}
```

**Frontend Action**: Animate parsing step on progress bar, show processing indicator.

---

#### `parser_completed`

Sent when Parser Agent completes successfully.

```typescript
interface ParserCompletedEvent {
  event: 'parser_completed';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'COMPLETED';
    message: string;
    documents_processed: number;
    execution_time: number; // seconds
    timestamp: string;
  };
}
```

**Frontend Action**: Mark parsing step complete, move to next step.

---

#### `parser_failed`

Sent when Parser Agent encounters an error.

```typescript
interface ParserFailedEvent {
  event: 'parser_failed';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'FAILED';
    error_message: string;
    error_details?: string;
    timestamp: string;
  };
}
```

**Frontend Action**: Display error message, mark step as failed, stop workflow.

---

#### `analysis_started`

Sent when Analysis Agent begins document analysis.

```typescript
interface AnalysisStartedEvent {
  event: 'analysis_started';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'IN_PROGRESS';
    message: string;
    timestamp: string;
  };
}
```

**Frontend Action**: Animate analysis step, show processing indicator.

---

#### `analysis_completed`

Sent when Analysis Agent completes with markdown output.

```typescript
interface AnalysisCompletedEvent {
  event: 'analysis_completed';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'COMPLETED';
    message: string;
    analysis_output: string; // Markdown format
    execution_time: number;
    timestamp: string;
  };
}
```

**Frontend Action**: Mark analysis step complete, display markdown in chat interface.

---

#### `analysis_failed`

Sent when Analysis Agent fails.

```typescript
interface AnalysisFailedEvent {
  event: 'analysis_failed';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'FAILED';
    error_message: string;
    error_details?: string;
    timestamp: string;
  };
}
```

**Frontend Action**: Display error, mark step as failed.

---

#### `analysis_restarted`

Sent when Supervisor restarts Analysis Agent after user feedback.

```typescript
interface AnalysisRestartedEvent {
  event: 'analysis_restarted';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'IN_PROGRESS';
    message: string;
    reason: string; // e.g., "User requested re-analysis with additional context"
    timestamp: string;
  };
}
```

**Frontend Action**: Reset progress bar to analysis step, show re-processing indicator.

---

#### `content_started`

Sent when Content Agent begins artifact generation.

```typescript
interface ContentStartedEvent {
  event: 'content_started';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'IN_PROGRESS';
    message: string;
    expected_artifacts: number;
    timestamp: string;
  };
}
```

**Frontend Action**: Animate content generation step.

---

#### `content_completed`

Sent when Content Agent completes artifact creation (without artifact data).

```typescript
interface ContentCompletedEvent {
  event: 'content_completed';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'COMPLETED';
    message: string;
    artifacts_created: number;
    execution_time: number;
    timestamp: string;
  };
}
```

**Frontend Action**: Mark content generation complete, proceed to compliance.

---

#### `content_failed`

Sent when Content Agent fails.

```typescript
interface ContentFailedEvent {
  event: 'content_failed';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'FAILED';
    error_message: string;
    error_details?: string;
    timestamp: string;
  };
}
```

**Frontend Action**: Display error, mark step as failed.

---

#### `compliance_started`

Sent when Compliance Agent begins compliance check.

```typescript
interface ComplianceStartedEvent {
  event: 'compliance_started';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'IN_PROGRESS';
    message: string;
    artifacts_to_check: number;
    timestamp: string;
  };
}
```

**Frontend Action**: Animate compliance check step.

---

#### `compliance_completed`

Sent when Compliance Agent completes check.

```typescript
interface ComplianceCompletedEvent {
  event: 'compliance_completed';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'COMPLETED';
    message: string;
    compliant: boolean;
    issues_found: number;
    execution_time: number;
    timestamp: string;
  };
}
```

**Frontend Action**: Mark compliance step complete, proceed based on `compliant` flag.

---

#### `compliance_failed`

Sent when Compliance Agent encounters an error.

```typescript
interface ComplianceFailedEvent {
  event: 'compliance_failed';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'FAILED';
    error_message: string;
    error_details?: string;
    timestamp: string;
  };
}
```

**Frontend Action**: Display error, mark step as failed.

---

#### `qa_started`

Sent when QA Agent begins quality assurance check.

```typescript
interface QAStartedEvent {
  event: 'qa_started';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'IN_PROGRESS';
    message: string;
    artifacts_to_verify: number;
    timestamp: string;
  };
}
```

**Frontend Action**: Animate QA step.

---

#### `qa_completed`

Sent when QA Agent completes verification.

```typescript
interface QACompletedEvent {
  event: 'qa_completed';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'COMPLETED';
    message: string;
    passed: boolean;
    issues_found: number;
    execution_time: number;
    timestamp: string;
  };
}
```

**Frontend Action**: Mark QA step complete, proceed based on `passed` flag.

---

#### `qa_failed`

Sent when QA Agent encounters an error.

```typescript
interface QAFailedEvent {
  event: 'qa_failed';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'FAILED';
    error_message: string;
    error_details?: string;
    timestamp: string;
  };
}
```

**Frontend Action**: Display error, mark step as failed.

---

#### `comms_started`

Sent when Comms Agent begins sending notifications.

```typescript
interface CommsStartedEvent {
  event: 'comms_started';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'IN_PROGRESS';
    message: string;
    recipients_count: number;
    timestamp: string;
  };
}
```

**Frontend Action**: Animate communications step.

---

#### `comms_completed`

Sent when Comms Agent completes notifications.

```typescript
interface CommsCompletedEvent {
  event: 'comms_completed';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'COMPLETED';
    message: string;
    notifications_sent: number;
    slack_channel_created: boolean;
    execution_time: number;
    timestamp: string;
  };
}
```

**Frontend Action**: Mark communications step complete, trigger notification check.

---

#### `comms_failed`

Sent when Comms Agent fails to send notifications.

```typescript
interface CommsFailedEvent {
  event: 'comms_failed';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'FAILED';
    error_message: string;
    error_details?: string;
    timestamp: string;
  };
}
```

**Frontend Action**: Display error, mark step as failed.

---

#### `submission_started`

Sent when Submission Agent begins email preparation.

```typescript
interface SubmissionStartedEvent {
  event: 'submission_started';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'IN_PROGRESS';
    message: string;
    timestamp: string;
  };
}
```

**Frontend Action**: Animate bidding/submission step.

---

#### `submission_completed`

Sent when Submission Agent completes email submission.

```typescript
interface SubmissionCompletedEvent {
  event: 'submission_completed';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'COMPLETED';
    message: string;
    email_sent: boolean;
    recipient: string;
    attachments_count: number;
    execution_time: number;
    timestamp: string;
  };
}
```

**Frontend Action**: Mark submission step complete, trigger workflow completion.

---

#### `submission_failed`

Sent when Submission Agent fails to send email.

```typescript
interface SubmissionFailedEvent {
  event: 'submission_failed';
  data: {
    agent_task_id: string;
    workflow_execution_id: string;
    status: 'FAILED';
    error_message: string;
    error_details?: string;
    timestamp: string;
  };
}
```

**Frontend Action**: Display error, mark step as failed.

---

### 3. Workflow Control Events

#### `awaiting_feedback`

Sent when Supervisor waits for user feedback (after analysis).

```typescript
interface AwaitingFeedbackEvent {
  event: 'awaiting_feedback';
  data: {
    workflow_execution_id: string;
    message: string;
    prompt: string; // e.g., "Please review the analysis and provide feedback"
    timestamp: string;
  };
}
```

**Frontend Action**: Enable chat input, show prompt message, disable send button streaming indicator.

---

#### `awaiting_review`

Sent when Supervisor waits for user to review artifacts (after QA).

```typescript
interface AwaitingReviewEvent {
  event: 'awaiting_review';
  data: {
    workflow_execution_id: string;
    message: string;
    prompt: string;
    timestamp: string;
  };
}
```

**Frontend Action**: Enable chat input, show prompt, wait for user action.

---

#### `review_prompt`

Sent when Supervisor asks user for re-review decision after artifact edits.

```typescript
interface ReviewPromptEvent {
  event: 'review_prompt';
  data: {
    workflow_execution_id: string;
    message: string;
    question: string; // e.g., "Would you like to re-review with Compliance and QA?"
    options: string[]; // e.g., ["Yes, re-review", "No, proceed"]
    timestamp: string;
  };
}
```

**Frontend Action**: Display question with Yes/No buttons for user decision.

---

#### `comms_permission`

Sent when Supervisor requests permission to send notifications.

```typescript
interface CommsPermissionEvent {
  event: 'comms_permission';
  data: {
    workflow_execution_id: string;
    message: string;
    question: string;
    recipients: string[]; // email addresses
    timestamp: string;
  };
}
```

**Frontend Action**: Display permission prompt with Approve/Decline buttons.

---

#### `submission_permission`

Sent when Supervisor requests permission to submit bid.

```typescript
interface SubmissionPermissionEvent {
  event: 'submission_permission';
  data: {
    workflow_execution_id: string;
    message: string;
    question: string;
    timestamp: string;
  };
}
```

**Frontend Action**: Display permission prompt with Approve/Decline buttons.

---

#### `returning_to_content`

Sent when Supervisor restarts workflow from Content Agent step.

```typescript
interface ReturningToContentEvent {
  event: 'returning_to_content';
  data: {
    workflow_execution_id: string;
    message: string;
    reason: string;
    reset_steps: string[]; // e.g., ["CONTENT", "COMPLIANCE", "QA"]
    timestamp: string;
  };
}
```

**Frontend Action**: Reset progress bar to content step, show re-processing message.

---

### 4. Artifact Events

#### `artifacts_ready`

Sent when Supervisor provides finalized artifacts for user review (after QA passes).

```typescript
interface ArtifactsReadyEvent {
  event: 'artifacts_ready';
  data: {
    workflow_execution_id: string;
    project_id: string;
    message: string;
    artifacts: Array<{
      id: string;
      name: string;
      type: 'WORDDOC' | 'PDF' | 'PPT' | 'EXCEL';
      category: 'DOCUMENT' | 'Q_AND_A' | 'EXCEL';
    }>;
    timestamp: string;
  };
}
```

**Frontend Action**: Fetch artifacts via GraphQL, render clickable tiles in chat interface.

---

#### `artifacts_exported`

Sent when Supervisor exports artifacts to S3 after user approval.

```typescript
interface ArtifactsExportedEvent {
  event: 'artifacts_exported';
  data: {
    workflow_execution_id: string;
    message: string;
    artifacts_exported: number;
    timestamp: string;
  };
}
```

**Frontend Action**: Show confirmation message, proceed to comms permission.

---

#### `email_draft`

Sent when Submission Agent provides email draft for user review.

```typescript
interface EmailDraftEvent {
  event: 'email_draft';
  data: {
    workflow_execution_id: string;
    message: string;
    email: {
      title: string;
      to: string;
      from: string;
      body: string; // Rich text/HTML
      attachments: Array<{
        name: string;
        url: string;
      }>;
    };
    timestamp: string;
  };
}
```

**Frontend Action**: Display email preview modal, enable Approve/Edit buttons.

---

### 5. Error & Heartbeat Events

#### `error`

Sent when a critical error occurs in the workflow.

```typescript
interface ErrorEvent {
  event: 'error';
  data: {
    workflow_execution_id: string;
    error_type: string;
    error_message: string;
    error_details?: string;
    recoverable: boolean;
    timestamp: string;
  };
}
```

**Frontend Action**: Display error message, allow retry if recoverable.

---

#### `heartbeat`

Sent every 30 seconds to keep connection alive during long operations.

```typescript
interface HeartbeatEvent {
  event: 'heartbeat';
  data: {
    workflow_execution_id: string;
    status: string;
    timestamp: string;
  };
}
```

**Frontend Action**: Update connection status, reset timeout timer.

---

## Frontend Integration Pattern

### Event Listener Setup

```typescript
// hooks/streams/useWorkflowStream.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useWorkflowStream(workflowExecutionId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/workflow-agents/invocations?workflow_id=${workflowExecutionId}`
    );

    // Workflow lifecycle
    eventSource.addEventListener('workflow_created', (e) => {
      const data = JSON.parse(e.data);
      queryClient.setQueryData(['workflowExecution', workflowExecutionId], data);
    });

    eventSource.addEventListener('workflow_completed', (e) => {
      const data = JSON.parse(e.data);
      queryClient.setQueryData(['workflowExecution', workflowExecutionId], (old) => ({
        ...old,
        status: 'COMPLETED',
        completedAt: data.completed_at,
      }));
    });

    // Agent task events
    eventSource.addEventListener('parser_started', (e) => {
      const data = JSON.parse(e.data);
      // Update UI state
    });

    // ... other event listeners

    // Error handling
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [workflowExecutionId, queryClient]);
}
```

---

## Summary

This SSE contract provides:

1. **23 distinct event types** covering all workflow stages
2. **Type-safe TypeScript interfaces** for all events
3. **Clear frontend actions** for each event type
4. **Comprehensive error handling** with specific failure events
5. **User interaction points** with permission and feedback events
6. **Real-time progress tracking** with granular agent task updates

**Next Phase**: Generate quickstart.md guide for local development setup.