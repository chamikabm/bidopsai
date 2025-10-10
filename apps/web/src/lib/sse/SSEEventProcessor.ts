import {
  SSEEvent,
  SSEEventType,
  WorkflowCreatedData,
  AgentStartedData,
  AgentCompletedData,
  AgentFailedData,
  AnalysisCompletedData,
  AwaitingFeedbackData,
  ArtifactsReadyData,
  AwaitingReviewData,
  ProgressResetData,
  PermissionRequestData,
  EmailDraftData,
  WorkflowCompletedData,
  AgentType,
} from '@/types/sse'

export type ChatMessage = {
  id: string
  type: 'agent' | 'user' | 'system' | 'artifact' | 'email-draft'
  content: string | unknown
  timestamp: Date
  agentType?: AgentType
  status?: 'sending' | 'sent' | 'failed'
  metadata?: unknown
}

export class SSEEventProcessor {
  private addMessage: (message: ChatMessage) => void
  private updateProgress: (step: AgentType, status: string) => void
  private resetProgress: (data: ProgressResetData) => void

  constructor(
    addMessage: (message: ChatMessage) => void,
    updateProgress: (step: AgentType, status: string) => void,
    resetProgress: (data: ProgressResetData) => void
  ) {
    this.addMessage = addMessage
    this.updateProgress = updateProgress
    this.resetProgress = resetProgress
  }

  process(event: SSEEvent): void {
    switch (event.type) {
      case SSEEventType.WORKFLOW_CREATED:
        this.handleWorkflowCreated(event.data as WorkflowCreatedData)
        break
      case SSEEventType.PARSER_STARTED:
      case SSEEventType.ANALYSIS_STARTED:
      case SSEEventType.CONTENT_STARTED:
      case SSEEventType.COMPLIANCE_STARTED:
      case SSEEventType.QA_STARTED:
      case SSEEventType.COMMS_STARTED:
      case SSEEventType.SUBMISSION_STARTED:
        this.handleAgentStarted(event.data as AgentStartedData)
        break
      case SSEEventType.PARSER_COMPLETED:
      case SSEEventType.CONTENT_COMPLETED:
      case SSEEventType.COMPLIANCE_COMPLETED:
      case SSEEventType.QA_COMPLETED:
      case SSEEventType.COMMS_COMPLETED:
      case SSEEventType.SUBMISSION_COMPLETED:
        this.handleAgentCompleted(event.data as AgentCompletedData)
        break
      case SSEEventType.ANALYSIS_COMPLETED:
        this.handleAnalysisCompleted(event.data as AnalysisCompletedData)
        break
      case SSEEventType.PARSER_FAILED:
      case SSEEventType.ANALYSIS_FAILED:
      case SSEEventType.CONTENT_FAILED:
      case SSEEventType.COMPLIANCE_FAILED:
      case SSEEventType.QA_FAILED:
      case SSEEventType.COMMS_FAILED:
      case SSEEventType.SUBMISSION_FAILED:
        this.handleAgentFailed(event.data as AgentFailedData)
        break
      case SSEEventType.AWAITING_FEEDBACK:
        this.handleAwaitingFeedback(event.data as AwaitingFeedbackData)
        break
      case SSEEventType.ARTIFACTS_READY:
        this.handleArtifactsReady(event.data as ArtifactsReadyData)
        break
      case SSEEventType.AWAITING_REVIEW:
        this.handleAwaitingReview(event.data as AwaitingReviewData)
        break
      case SSEEventType.PARSER_RESTART:
      case SSEEventType.ANALYSIS_RESTARTED:
      case SSEEventType.RETURNING_TO_CONTENT:
      case SSEEventType.CONTENT_REVISION_CYCLE:
        this.handleProgressReset(event.data as ProgressResetData)
        break
      case SSEEventType.COMMS_PERMISSION:
      case SSEEventType.SUBMISSION_PERMISSION:
        this.handlePermissionRequest(event.data as PermissionRequestData)
        break
      case SSEEventType.EMAIL_DRAFT:
        this.handleEmailDraft(event.data as EmailDraftData)
        break
      case SSEEventType.WORKFLOW_COMPLETED:
      case SSEEventType.WORKFLOW_COMPLETED_WITHOUT_COMMS:
      case SSEEventType.WORKFLOW_COMPLETED_WITHOUT_SUBMISSION:
        this.handleWorkflowCompleted(event.data as WorkflowCompletedData)
        break
      default:
        console.warn(`No handler for SSE event type: ${event.type}`)
    }
  }

  private handleWorkflowCreated(data: WorkflowCreatedData): void {
    this.addMessage({
      id: this.generateId(),
      type: 'system',
      content: 'Workflow started. Initializing agents...',
      timestamp: new Date(),
      metadata: data,
    })
  }

  private handleAgentStarted(data: AgentStartedData): void {
    this.updateProgress(data.agent, 'in_progress')
    this.addMessage({
      id: this.generateId(),
      type: 'agent',
      content: data.message || `${data.agent} agent started processing...`,
      timestamp: new Date(),
      agentType: data.agent,
      metadata: data,
    })
  }

  private handleAgentCompleted(data: AgentCompletedData): void {
    this.updateProgress(data.agent, 'completed')
    this.addMessage({
      id: this.generateId(),
      type: 'agent',
      content: data.message || `${data.agent} agent completed successfully.`,
      timestamp: new Date(),
      agentType: data.agent,
      metadata: data,
    })
  }

  private handleAnalysisCompleted(data: AnalysisCompletedData): void {
    this.updateProgress(data.agent, 'completed')
    this.addMessage({
      id: this.generateId(),
      type: 'agent',
      content: data.analysisMarkdown,
      timestamp: new Date(),
      agentType: data.agent,
      metadata: { ...data, isMarkdown: true },
    })
  }

  private handleAgentFailed(data: AgentFailedData): void {
    this.updateProgress(data.agent, 'failed')
    this.addMessage({
      id: this.generateId(),
      type: 'system',
      content: `${data.agent} agent failed: ${data.error}`,
      timestamp: new Date(),
      metadata: data,
    })
  }

  private handleAwaitingFeedback(data: AwaitingFeedbackData): void {
    this.updateProgress(data.agent, 'waiting')
    this.addMessage({
      id: this.generateId(),
      type: 'agent',
      content: data.content,
      timestamp: new Date(),
      agentType: data.agent,
      metadata: { ...data, requiresFeedback: true },
    })
  }

  private handleArtifactsReady(data: ArtifactsReadyData): void {
    this.addMessage({
      id: this.generateId(),
      type: 'artifact',
      content: data.artifacts,
      timestamp: new Date(),
      metadata: { artifactCount: data.artifacts.length, message: data.message },
    })
  }

  private handleAwaitingReview(data: AwaitingReviewData): void {
    this.addMessage({
      id: this.generateId(),
      type: 'system',
      content: data.message,
      timestamp: new Date(),
      metadata: { ...data, requiresReview: true },
    })
  }

  private handleProgressReset(data: ProgressResetData): void {
    this.resetProgress(data)
    this.addMessage({
      id: this.generateId(),
      type: 'system',
      content: data.message,
      timestamp: new Date(),
      metadata: data,
    })
  }

  private handlePermissionRequest(data: PermissionRequestData): void {
    this.addMessage({
      id: this.generateId(),
      type: 'system',
      content: data.message,
      timestamp: new Date(),
      metadata: { ...data, requiresPermission: true },
    })
  }

  private handleEmailDraft(data: EmailDraftData): void {
    this.addMessage({
      id: this.generateId(),
      type: 'email-draft',
      content: data,
      timestamp: new Date(),
      metadata: { requiresApproval: true },
    })
  }

  private handleWorkflowCompleted(data: WorkflowCompletedData): void {
    this.addMessage({
      id: this.generateId(),
      type: 'system',
      content: data.message || 'Workflow completed successfully!',
      timestamp: new Date(),
      metadata: data,
    })
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
