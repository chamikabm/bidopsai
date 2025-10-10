import {
  AgentType,
  ProgressResetData,
  AgentFailedData,
} from '@/types/sse'
import { WorkflowStateManager } from './WorkflowStateManager'

export type NavigationAction = {
  type: 'reset' | 'retry' | 'skip' | 'restart_workflow' | 'manual_intervention'
  targetStep?: AgentType
  reason: string
  timestamp: Date
}

export class WorkflowNavigationHandler {
  private stateManager: WorkflowStateManager
  private navigationHistory: NavigationAction[] = []
  private loopDetectionMap: Map<string, number> = new Map()
  private maxLoopIterations = 3
  private onManualInterventionRequired: ((reason: string) => void) | undefined

  constructor(
    stateManager: WorkflowStateManager,
    onManualInterventionRequired?: ((reason: string) => void) | undefined
  ) {
    this.stateManager = stateManager
    this.onManualInterventionRequired = onManualInterventionRequired
  }

  handleBackwardNavigation(data: ProgressResetData): void {
    const action: NavigationAction = {
      type: 'reset',
      targetStep: data.resetToStep,
      reason: data.reason,
      timestamp: new Date(),
    }

    this.navigationHistory.push(action)

    // Check for infinite loops
    if (this.detectInfiniteLoop(data)) {
      this.handleInfiniteLoop(data)
      return
    }

    // Reset workflow state
    this.stateManager.resetToStep(data)

    // Track loop iterations
    this.trackLoopIteration(data)
  }

  handleProgressReset(data: ProgressResetData): void {
    switch (data.reason) {
      case 'user_feedback_analysis':
        this.handleAnalysisRestart(data)
        break
      case 'compliance_failed':
        this.handleComplianceFailed(data)
        break
      case 'qa_failed':
        this.handleQAFailed(data)
        break
      case 'user_content_edits':
        this.handleContentRevision(data)
        break
      case 'parser_failed':
        this.handleParserFailed(data)
        break
      default:
        this.handleBackwardNavigation(data)
    }
  }

  handleErrorRecovery(data: AgentFailedData): {
    action: 'retry' | 'skip' | 'restart_workflow' | 'manual_intervention'
    message: string
  } {
    const action: NavigationAction = {
      type: data.suggestedAction,
      targetStep: data.agent,
      reason: data.error,
      timestamp: new Date(),
    }

    this.navigationHistory.push(action)

    switch (data.suggestedAction) {
      case 'retry':
        return this.handleRetry(data)
      case 'skip':
        return this.handleSkip(data)
      case 'restart_workflow':
        return this.handleRestartWorkflow(data)
      case 'manual_intervention':
        return this.handleManualIntervention(data)
      default:
        return {
          action: 'manual_intervention',
          message: 'Unknown error recovery action',
        }
    }
  }

  private handleAnalysisRestart(data: ProgressResetData): void {
    // User feedback requires re-analysis
    this.stateManager.resetToStep({
      ...data,
      resetToStep: AgentType.ANALYSIS,
      affectedSteps: [AgentType.ANALYSIS],
    })
  }

  private handleComplianceFailed(data: ProgressResetData): void {
    // Compliance standards not met, reset to Content
    this.stateManager.resetToStep({
      ...data,
      resetToStep: AgentType.CONTENT,
      affectedSteps: [AgentType.CONTENT, AgentType.COMPLIANCE, AgentType.QA],
    })
  }

  private handleQAFailed(data: ProgressResetData): void {
    // QA standards not met, reset to Content
    this.stateManager.resetToStep({
      ...data,
      resetToStep: AgentType.CONTENT,
      affectedSteps: [AgentType.CONTENT, AgentType.COMPLIANCE, AgentType.QA],
    })
  }

  private handleContentRevision(data: ProgressResetData): void {
    // User made content edits, may need re-review
    this.stateManager.resetToStep({
      ...data,
      resetToStep: AgentType.CONTENT,
      affectedSteps: [AgentType.CONTENT, AgentType.COMPLIANCE, AgentType.QA],
    })
  }

  private handleParserFailed(data: ProgressResetData): void {
    // Parser failed, restart from beginning
    this.stateManager.resetToStep({
      ...data,
      resetToStep: AgentType.PARSER,
      affectedSteps: [
        AgentType.PARSER,
        AgentType.ANALYSIS,
        AgentType.CONTENT,
        AgentType.COMPLIANCE,
        AgentType.QA,
        AgentType.COMMS,
        AgentType.SUBMISSION,
      ],
    })
  }

  private detectInfiniteLoop(data: ProgressResetData): boolean {
    const loopKey = this.generateLoopKey(data)
    const iterations = this.loopDetectionMap.get(loopKey) || 0

    return iterations >= this.maxLoopIterations
  }

  private trackLoopIteration(data: ProgressResetData): void {
    const loopKey = this.generateLoopKey(data)
    const iterations = this.loopDetectionMap.get(loopKey) || 0
    this.loopDetectionMap.set(loopKey, iterations + 1)
  }

  private generateLoopKey(data: ProgressResetData): string {
    return `${data.resetToStep}-${data.reason}`
  }

  private handleInfiniteLoop(data: ProgressResetData): void {
    const message = `Infinite loop detected: ${data.reason}. Manual intervention required.`

    if (this.onManualInterventionRequired) {
      this.onManualInterventionRequired(message)
    }

    // Clear loop tracking for this specific loop
    const loopKey = this.generateLoopKey(data)
    this.loopDetectionMap.delete(loopKey)
  }

  private handleRetry(data: AgentFailedData): {
    action: 'retry'
    message: string
  } {
    // Reset the failed agent to allow retry
    this.stateManager.updateStepStatus(data.agent, 'pending')

    return {
      action: 'retry',
      message: `Retrying ${data.agent} agent...`,
    }
  }

  private handleSkip(_data: AgentFailedData): {
    action: 'skip'
    message: string
  } {
    // Mark as completed to skip
    this.stateManager.updateStepStatus(_data.agent, 'completed')

    return {
      action: 'skip',
      message: `Skipping ${_data.agent} agent and continuing workflow...`,
    }
  }

  private handleRestartWorkflow(_data: AgentFailedData): {
    action: 'restart_workflow'
    message: string
  } {
    // Reset entire workflow
    this.stateManager.reset()
    this.navigationHistory = []
    this.loopDetectionMap.clear()

    return {
      action: 'restart_workflow',
      message: 'Restarting workflow from the beginning...',
    }
  }

  private handleManualIntervention(data: AgentFailedData): {
    action: 'manual_intervention'
    message: string
  } {
    const message = `Manual intervention required for ${data.agent} agent: ${data.error}`

    if (this.onManualInterventionRequired) {
      this.onManualInterventionRequired(message)
    }

    return {
      action: 'manual_intervention',
      message,
    }
  }

  getNavigationHistory(): NavigationAction[] {
    return [...this.navigationHistory]
  }

  getLoopIterations(resetToStep: AgentType, reason: string): number {
    const loopKey = `${resetToStep}-${reason}`
    return this.loopDetectionMap.get(loopKey) || 0
  }

  clearLoopTracking(): void {
    this.loopDetectionMap.clear()
  }

  clearNavigationHistory(): void {
    this.navigationHistory = []
  }

  reset(): void {
    this.navigationHistory = []
    this.loopDetectionMap.clear()
  }
}
