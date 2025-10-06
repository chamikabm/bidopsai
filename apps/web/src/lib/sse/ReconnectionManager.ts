export type ReconnectionConfig = {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  exponentialBackoff: boolean
  jitter: boolean
}

export type ReconnectionState = {
  isReconnecting: boolean
  attempts: number
  lastAttempt: Date | null
  nextAttemptDelay: number
}

export class ReconnectionManager {
  private config: ReconnectionConfig
  private state: ReconnectionState
  private reconnectTimeout: NodeJS.Timeout | null = null
  private onReconnect?: () => void
  private onMaxAttemptsReached?: () => void

  constructor(
    config?: Partial<ReconnectionConfig>,
    onReconnect?: () => void,
    onMaxAttemptsReached?: () => void
  ) {
    this.config = {
      maxAttempts: 5,
      baseDelay: 1000,
      maxDelay: 30000,
      exponentialBackoff: true,
      jitter: true,
      ...config,
    }

    this.state = {
      isReconnecting: false,
      attempts: 0,
      lastAttempt: null,
      nextAttemptDelay: this.config.baseDelay,
    }

    this.onReconnect = onReconnect
    this.onMaxAttemptsReached = onMaxAttemptsReached
  }

  scheduleReconnect(): boolean {
    if (this.state.attempts >= this.config.maxAttempts) {
      this.handleMaxAttemptsReached()
      return false
    }

    this.state.isReconnecting = true
    this.state.attempts++
    this.state.lastAttempt = new Date()

    const delay = this.calculateDelay()
    this.state.nextAttemptDelay = delay

    this.reconnectTimeout = setTimeout(() => {
      if (this.onReconnect) {
        this.onReconnect()
      }
    }, delay)

    return true
  }

  cancelReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.state.isReconnecting = false
  }

  reset(): void {
    this.cancelReconnect()
    this.state = {
      isReconnecting: false,
      attempts: 0,
      lastAttempt: null,
      nextAttemptDelay: this.config.baseDelay,
    }
  }

  getState(): ReconnectionState {
    return { ...this.state }
  }

  canReconnect(): boolean {
    return this.state.attempts < this.config.maxAttempts
  }

  private calculateDelay(): number {
    let delay = this.config.baseDelay

    if (this.config.exponentialBackoff) {
      delay = this.config.baseDelay * Math.pow(2, this.state.attempts - 1)
    }

    // Apply max delay cap
    delay = Math.min(delay, this.config.maxDelay)

    // Apply jitter to prevent thundering herd
    if (this.config.jitter) {
      const jitterAmount = delay * 0.3 // 30% jitter
      delay = delay + (Math.random() * jitterAmount - jitterAmount / 2)
    }

    return Math.round(delay)
  }

  private handleMaxAttemptsReached(): void {
    this.state.isReconnecting = false

    if (this.onMaxAttemptsReached) {
      this.onMaxAttemptsReached()
    }
  }

  updateConfig(config: Partial<ReconnectionConfig>): void {
    this.config = { ...this.config, ...config }
  }
}
