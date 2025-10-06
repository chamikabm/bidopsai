import { AgentType, AgentFailedData } from '@/types/sse'

export type ErrorRecoveryStrategy = {
  maxRetries: number
  retryDelay: number
  exponentialBackoff: boolean
  fallbackAction: 'skip' | 'manual_intervention' | 'restart_workflow'
}

export type ErrorState = {
  agent: AgentType
  error: string
  errorCode: string
  retryCount: number
  lastAttempt: Date
  canRetry: boolean
}

export class ErrorRecoveryManager {
  private errorStates: Map<AgentType, ErrorState> = new Map()
  private defaultStrategy: ErrorRecoveryStrategy = {
    maxRetries: 3,
    retryDelay: 2000,
    exponentialBackoff: true,
    fallbackAction: 'manual_intervention',
  }
  private agentStrategies: Map<AgentType, ErrorRecoveryStrategy> = new Map()

  constructor() {
    this.initializeAgentStrategies()
  }

  private initializeAgentStrategies(): void {
    // Parser errors are critical - fewer retries
    this.agentStrategies.set(AgentType.PARSER, {
      maxRetries: 2,
      retryDelay: 3000,
      exponentialBackoff: true,
      fallbackAction: 'restart_workflow',
    })

    // Analysis can be retried more times
    this.agentStrategies.set(AgentType.ANALYSIS, {
      maxRetries: 3,
      retryDelay: 2000,
      exponentialBackoff: true,
      fallbackAction: 'manual_intervention',
    })

    // Content generation can be retried
    this.agentStrategies.set(AgentType.CONTENT, {
      maxRetries: 3,
      retryDelay: 2000,
      exponentialBackoff: true,
      fallbackAction: 'manual_intervention',
    })

    // Compliance and QA can be skipped if necessary
    this.agentStrategies.set(AgentType.COMPLIANCE, {
      maxRetries: 2,
      retryDelay: 2000,
      exponentialBackoff: true,
      fallbackAction: 'skip',
    })

    this.agentStrategies.set(AgentType.QA, {
      maxRetries: 2,
      retryDelay: 2000,
      exponentialBackoff: true,
      fallbackAction: 'skip',
    })

    // Comms can be skipped
    this.agentStrategies.set(AgentType.COMMS, {
      maxRetries: 2,
      retryDelay: 1000,
      exponentialBackoff: false,
      fallbackAction: 'skip',
    })

    // Submission should be retried carefully
    this.agentStrategies.set(AgentType.SUBMISSION, {
      maxRetries: 3,
      retryDelay: 3000,
      exponentialBackoff: true,
      fallbackAction: 'manual_intervention',
    })
  }

  handleError(data: AgentFailedData): {
    shouldRetry: boolean
    retryDelay?: number
    suggestedAction: 'retry' | 'skip' | 'restart_workflow' | 'manual_intervention'
    message: string
  } {
    const errorState = this.getOrCreateErrorState(data)
    const strategy = this.getStrategy(data.agent)

    // Check if we can retry
    if (errorState.retryCount < strategy.maxRetries && data.canRetry) {
      const retryDelay = this.calculateRetryDelay(
        errorState.retryCount,
        strategy
      )

      errorState.retryCount++
      errorState.lastAttempt = new Date()

      return {
        shouldRetry: true,
        retryDelay,
        suggestedAction: 'retry',
        message: `Retrying ${data.agent} agent (attempt ${errorState.retryCount}/${strategy.maxRetries})...`,
      }
    }

    // Max retries reached or cannot retry
    return {
      shouldRetry: false,
      suggestedAction: strategy.fallbackAction,
      message: this.getFallbackMessage(data.agent, strategy.fallbackAction),
    }
  }

  private getOrCreateErrorState(data: AgentFailedData): ErrorState {
    let errorState = this.errorStates.get(data.agent)

    if (!errorState) {
      errorState = {
        agent: data.agent,
        error: data.error,
        errorCode: data.errorCode,
        retryCount: 0,
        lastAttempt: new Date(),
        canRetry: data.canRetry,
      }
      this.errorStates.set(data.agent, errorState)
    } else {
      // Update error state
      errorState.error = data.error
      errorState.errorCode = data.errorCode
      errorState.canRetry = data.canRetry
    }

    return errorState
  }

  private getStrategy(agent: AgentType): ErrorRecoveryStrategy {
    return this.agentStrategies.get(agent) || this.defaultStrategy
  }

  private calculateRetryDelay(
    retryCount: number,
    strategy: ErrorRecoveryStrategy
  ): number {
    if (strategy.exponentialBackoff) {
      return strategy.retryDelay * Math.pow(2, retryCount)
    }
    return strategy.retryDelay
  }

  private getFallbackMessage(
    agent: AgentType,
    action: ErrorRecoveryStrategy['fallbackAction']
  ): string {
    switch (action) {
      case 'skip':
        return `Skipping ${agent} agent after max retries. Continuing workflow...`
      case 'restart_workflow':
        return `Restarting workflow after ${agent} agent failure...`
      case 'manual_intervention':
        return `Manual intervention required for ${agent} agent after max retries.`
      default:
        return `Unknown fallback action for ${agent} agent.`
    }
  }

  clearErrorState(agent: AgentType): void {
    this.errorStates.delete(agent)
  }

  clearAllErrorStates(): void {
    this.errorStates.clear()
  }

  getErrorState(agent: AgentType): ErrorState | undefined {
    return this.errorStates.get(agent)
  }

  getAllErrorStates(): ErrorState[] {
    return Array.from(this.errorStates.values())
  }

  hasErrors(): boolean {
    return this.errorStates.size > 0
  }

  setAgentStrategy(agent: AgentType, strategy: ErrorRecoveryStrategy): void {
    this.agentStrategies.set(agent, strategy)
  }
}
