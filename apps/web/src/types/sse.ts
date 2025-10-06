// SSE Event Types and Interfaces

export enum SSEEventType {
  WORKFLOW_CREATED = 'workflow_created',
  PARSER_STARTED = 'parser_started',
  PARSER_COMPLETED = 'parser_completed',
  PARSER_FAILED = 'parser_failed',
  PARSER_RESTART = 'parser_restart',
  ANALYSIS_STARTED = 'analysis_started',
  ANALYSIS_COMPLETED = 'analysis_completed',
  ANALYSIS_FAILED = 'analysis_failed',
  ANALYSIS_RESTARTED = 'analysis_restarted',
  CONTENT_STARTED = 'content_started',
  CONTENT_COMPLETED = 'content_completed',
  CONTENT_FAILED = 'content_failed',
  COMPLIANCE_STARTED = 'compliance_started',
  COMPLIANCE_COMPLETED = 'compliance_completed',
  COMPLIANCE_FAILED = 'compliance_failed',
  QA_STARTED = 'qa_started',
  QA_COMPLETED = 'qa_completed',
  QA_FAILED = 'qa_failed',
  ARTIFACTS_READY = 'artifacts_ready',
  AWAITING_FEEDBACK = 'awaiting_feedback',
  AWAITING_REVIEW = 'awaiting_review',
  RETURNING_TO_CONTENT = 'returning_to_content',
  CONTENT_REVISION_CYCLE = 'content_revision_cycle',
  COMMS_PERMISSION = 'comms_permission',
  COMMS_STARTED = 'comms_started',
  COMMS_COMPLETED = 'comms_completed',
  COMMS_FAILED = 'comms_failed',
  SUBMISSION_PERMISSION = 'submission_permission',
  SUBMISSION_STARTED = 'submission_started',
  SUBMISSION_COMPLETED = 'submission_completed',
  SUBMISSION_FAILED = 'submission_failed',
  EMAIL_DRAFT = 'email_draft',
  WORKFLOW_COMPLETED = 'workflow_completed',
  WORKFLOW_COMPLETED_WITHOUT_COMMS = 'workflow_completed_without_comms',
  WORKFLOW_COMPLETED_WITHOUT_SUBMISSION = 'workflow_completed_without_submission',
}

export enum AgentType {
  SUPERVISOR = 'SUPERVISOR',
  PARSER = 'PARSER',
  ANALYSIS = 'ANALYSIS',
  CONTENT = 'CONTENT',
  KNOWLEDGE = 'KNOWLEDGE',
  COMPLIANCE = 'COMPLIANCE',
  QA = 'QA',
  COMMS = 'COMMS',
  SUBMISSION = 'SUBMISSION',
}

export interface SSEEvent {
  type: SSEEventType
  data: unknown
  timestamp: string
}

export interface ProgressResetData {
  resetToStep: AgentType
  reason:
    | 'user_feedback_analysis'
    | 'compliance_failed'
    | 'qa_failed'
    | 'user_content_edits'
    | 'parser_failed'
  affectedSteps: AgentType[]
  message: string
  previousStep?: AgentType
  userInput?: string
}

export interface WorkflowNavigationData {
  currentStep: AgentType
  previousStep?: AgentType
  nextStep?: AgentType
  direction: 'forward' | 'backward' | 'restart'
  reason: string
  affectedTasks: string[]
}

export interface AgentFailedData {
  agent: AgentType
  error: string
  errorCode: string
  canRetry: boolean
  suggestedAction: 'retry' | 'skip' | 'restart_workflow' | 'manual_intervention'
  affectedSteps?: AgentType[]
}

export interface AwaitingFeedbackData {
  agent: AgentType
  content: string
  contentType: 'markdown' | 'json' | 'text'
  feedbackType: 'analysis_review' | 'artifact_review' | 'permission_request'
  options?: string[]
}

export interface AwaitingReviewData {
  artifacts: Array<Record<string, unknown>>
  message: string
  canProceed: boolean
  requiresAllArtifacts: boolean
}

export interface WorkflowCreatedData {
  workflowId: string
  projectId: string
  sessionId: string
}

export interface AgentStartedData {
  agent: AgentType
  taskId: string
  message: string
}

export interface AgentCompletedData {
  agent: AgentType
  taskId: string
  message: string
  outputData?: Record<string, unknown>
}

export interface AnalysisCompletedData extends AgentCompletedData {
  analysisMarkdown: string
}

export interface ArtifactsReadyData {
  artifacts: Array<Record<string, unknown>>
  message: string
}

export interface PermissionRequestData {
  agent: AgentType
  message: string
  requiresApproval: boolean
}

export interface EmailDraftData {
  title: string
  to: string
  from: string
  body: string
  attachments: string[]
}

export interface WorkflowCompletedData {
  workflowId: string
  projectId: string
  completedAt: string
  message: string
}
