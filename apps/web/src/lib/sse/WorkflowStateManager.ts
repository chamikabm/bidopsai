import { AgentType, ProgressResetData } from '@/types/sse'

export type WorkflowStep = {
  agent: AgentType
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'waiting'
  order: number
}

export class WorkflowStateManager {
  private steps: Map<AgentType, WorkflowStep> = new Map()
  private currentStep: AgentType | null = null
  private stepOrder: AgentType[] = [
    AgentType.PARSER,
    AgentType.ANALYSIS,
    AgentType.CONTENT,
    AgentType.COMPLIANCE,
    AgentType.QA,
    AgentType.COMMS,
    AgentType.SUBMISSION,
  ]

  constructor() {
    this.initializeSteps()
  }

  private initializeSteps(): void {
    this.stepOrder.forEach((agent, index) => {
      this.steps.set(agent, {
        agent,
        status: 'pending',
        order: index,
      })
    })
  }

  updateStepStatus(
    agent: AgentType,
    status: WorkflowStep['status']
  ): void {
    const step = this.steps.get(agent)
    if (step) {
      step.status = status
      this.currentStep = agent
    }
  }

  resetToStep(data: ProgressResetData): void {
    const targetStep = this.steps.get(data.resetToStep)
    if (!targetStep) return

    // Reset all affected steps
    data.affectedSteps.forEach((agent) => {
      const step = this.steps.get(agent)
      if (step) {
        step.status = 'pending'
      }
    })

    // Set current step
    this.currentStep = data.resetToStep
    this.updateStepStatus(data.resetToStep, 'in_progress')
  }

  getCurrentStep(): AgentType | null {
    return this.currentStep
  }

  getStepStatus(agent: AgentType): WorkflowStep['status'] {
    return this.steps.get(agent)?.status || 'pending'
  }

  getAllSteps(): WorkflowStep[] {
    return Array.from(this.steps.values()).sort((a, b) => a.order - b.order)
  }

  getProgressPercentage(): number {
    const completedSteps = Array.from(this.steps.values()).filter(
      (step) => step.status === 'completed'
    ).length
    return Math.round((completedSteps / this.stepOrder.length) * 100)
  }

  isWorkflowComplete(): boolean {
    return Array.from(this.steps.values()).every(
      (step) => step.status === 'completed'
    )
  }

  hasFailedSteps(): boolean {
    return Array.from(this.steps.values()).some(
      (step) => step.status === 'failed'
    )
  }

  reset(): void {
    this.initializeSteps()
    this.currentStep = null
  }
}
