// SSE Event Types (38 total event types)
export enum SSEEventType {
  // Workflow events
  WORKFLOW_CREATED = "workflow_created",
  WORKFLOW_UPDATED = "workflow_updated",
  WORKFLOW_COMPLETED = "workflow_completed",
  WORKFLOW_COMPLETED_WITHOUT_COMMS = "workflow_completed_without_comms",
  WORKFLOW_COMPLETED_WITHOUT_SUBMISSION = "workflow_completed_without_submission",
  
  // Parser agent events
  PARSER_STARTED = "parser_started",
  PARSER_COMPLETED = "parser_completed",
  PARSER_FAILED = "parser_failed",
  
  // Analysis agent events
  ANALYSIS_STARTED = "analysis_started",
  ANALYSIS_COMPLETED = "analysis_completed",
  ANALYSIS_FAILED = "analysis_failed",
  ANALYSIS_RESTARTED = "analysis_restarted",
  
  // Content agent events
  CONTENT_STARTED = "content_started",
  CONTENT_COMPLETED = "content_completed",
  CONTENT_FAILED = "content_failed",
  RETURNING_TO_CONTENT = "returning_to_content",
  
  // Compliance agent events
  COMPLIANCE_STARTED = "compliance_started",
  COMPLIANCE_COMPLETED = "compliance_completed",
  COMPLIANCE_FAILED = "compliance_failed",
  
  // QA agent events
  QA_STARTED = "qa_started",
  QA_COMPLETED = "qa_completed",
  QA_FAILED = "qa_failed",
  
  // Artifact events
  ARTIFACTS_READY = "artifacts_ready",
  ARTIFACTS_EXPORTED = "artifacts_exported",
  AWAITING_REVIEW = "awaiting_review",
  
  // Communication events
  COMMS_STARTED = "comms_started",
  COMMS_COMPLETED = "comms_completed",
  COMMS_FAILED = "comms_failed",
  COMMS_PERMISSION = "comms_permission",
  
  // Submission events
  SUBMISSION_STARTED = "submission_started",
  SUBMISSION_COMPLETED = "submission_completed",
  SUBMISSION_FAILED = "submission_failed",
  SUBMISSION_PERMISSION = "submission_permission",
  EMAIL_DRAFT = "email_draft",
  
  // User interaction events
  AWAITING_FEEDBACK = "awaiting_feedback",
  REVIEW_PROMPT = "review_prompt",
  
  // Agent task updates
  AGENT_TASK_UPDATED = "agent_task_updated",
  
  // Error events
  ERROR = "error",
}

// Base SSE event structure
export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
  timestamp: string;
  id?: string; // Last event ID for reconnection
}

// Workflow created event data
export interface WorkflowCreatedData {
  workflowExecutionId: string;
  projectId: string;
  userId: string;
  agentTasks: Array<{
    id: string;
    agent: string;
    sequenceOrder: number;
    status: string;
  }>;
}

// Agent task event data
export interface AgentTaskEventData {
  workflowExecutionId: string;
  agentTaskId: string;
  agent: string;
  status: string;
  message?: string;
}

// Analysis completed event data
export interface AnalysisCompletedData extends AgentTaskEventData {
  analysisMarkdown: string;
}

// Artifacts ready event data
export interface ArtifactsReadyData {
  workflowExecutionId: string;
  artifacts: Array<{
    id: string;
    name: string;
    type: string;
    category: string;
  }>;
}

// Email draft event data
export interface EmailDraftData {
  title: string;
  to: string;
  from: string;
  body: string;
  attachments: Array<{
    name: string;
    url: string;
  }>;
}

// Error event data
export interface ErrorEventData extends AgentTaskEventData {
  errorMessage: string;
  errorLog?: Record<string, unknown>;
}

// Awaiting feedback/review event data
export interface AwaitingInteractionData {
  workflowExecutionId: string;
  message: string;
  promptType: "feedback" | "review" | "permission";
}

// SSE connection status
export enum SSEConnectionStatus {
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  DISCONNECTED = "DISCONNECTED",
  ERROR = "ERROR",
}

// SSE connection state
export interface SSEConnectionState {
  status: SSEConnectionStatus;
  error?: string;
  reconnectAttempts: number;
}