import { QueryClient } from '@tanstack/react-query'
import { SSEEvent, SSEEventType } from '@/types/sse'
import { ReconnectionManager } from './ReconnectionManager'

export type SSEEventHandler = (event: SSEEvent) => void

export class AgentSSEManager {
  private eventSource: EventSource | null = null
  private reconnectionManager: ReconnectionManager
  private queryClient: QueryClient
  private eventHandlers: Map<SSEEventType, SSEEventHandler[]> = new Map()
  private globalHandlers: SSEEventHandler[] = []
  private projectId: string | null = null
  private sessionId: string | null = null
  private isConnected = false
  private onConnectionError: ((error: string) => void) | undefined

  constructor(
    queryClient: QueryClient,
    onConnectionError?: ((error: string) => void) | undefined
  ) {
    this.queryClient = queryClient
    this.onConnectionError = onConnectionError
    this.reconnectionManager = new ReconnectionManager(
      {
        maxAttempts: 5,
        baseDelay: 1000,
        maxDelay: 30000,
        exponentialBackoff: true,
        jitter: true,
      },
      this.handleReconnect.bind(this),
      this.handleMaxReconnectAttemptsReached.bind(this)
    )
  }

  connect(projectId: string, sessionId: string): void {
    if (this.eventSource) {
      this.disconnect()
    }

    this.projectId = projectId
    this.sessionId = sessionId

    const url = `/api/workflow-agents/stream?projectId=${projectId}&sessionId=${sessionId}`
    this.eventSource = new EventSource(url)

    this.eventSource.onopen = this.handleOpen.bind(this)
    this.eventSource.onmessage = this.handleMessage.bind(this)
    this.eventSource.onerror = this.handleError.bind(this)
  }

  disconnect(): void {
    this.reconnectionManager.cancelReconnect()

    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }

    this.isConnected = false
    this.reconnectionManager.reset()
  }

  on(eventType: SSEEventType, handler: SSEEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, [])
    }
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      handlers.push(handler)
    }
  }

  off(eventType: SSEEventType, handler: SSEEventHandler): void {
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  onAny(handler: SSEEventHandler): void {
    this.globalHandlers.push(handler)
  }

  offAny(handler: SSEEventHandler): void {
    const index = this.globalHandlers.indexOf(handler)
    if (index > -1) {
      this.globalHandlers.splice(index, 1)
    }
  }

  getConnectionState(): {
    isConnected: boolean
    reconnectionState: ReturnType<ReconnectionManager['getState']>
  } {
    return {
      isConnected: this.isConnected,
      reconnectionState: this.reconnectionManager.getState(),
    }
  }

  private handleOpen(): void {
    this.isConnected = true
    this.reconnectionManager.reset()
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const sseEvent: SSEEvent = JSON.parse(event.data)
      this.processSSEEvent(sseEvent)
    } catch (error) {
      console.error('Failed to parse SSE event:', error)
    }
  }

  private handleError(error: Event): void {
    console.error('SSE connection error:', error)
    this.isConnected = false

    if (this.reconnectionManager.canReconnect()) {
      this.reconnectionManager.scheduleReconnect()
    } else {
      this.disconnect()
      if (this.onConnectionError) {
        this.onConnectionError('Max reconnection attempts reached')
      }
    }
  }

  private handleReconnect(): void {
    if (this.projectId && this.sessionId) {
      this.connect(this.projectId, this.sessionId)
    }
  }

  private handleMaxReconnectAttemptsReached(): void {
    if (this.onConnectionError) {
      this.onConnectionError(
        'Failed to reconnect after maximum attempts. Please refresh the page.'
      )
    }
  }

  private processSSEEvent(event: SSEEvent): void {
    // Call global handlers
    this.globalHandlers.forEach((handler) => {
      try {
        handler(event)
      } catch (error) {
        console.error('Error in global SSE handler:', error)
      }
    })

    // Call specific event type handlers
    const handlers = this.eventHandlers.get(event.type)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event)
        } catch (error) {
          console.error(`Error in SSE handler for ${event.type}:`, error)
        }
      })
    }

    // Update query cache based on event type
    this.updateQueryCache(event)
  }

  private updateQueryCache(event: SSEEvent): void {
    // Invalidate relevant queries based on event type
    switch (event.type) {
      case SSEEventType.WORKFLOW_CREATED:
      case SSEEventType.WORKFLOW_COMPLETED:
      case SSEEventType.WORKFLOW_COMPLETED_WITHOUT_COMMS:
      case SSEEventType.WORKFLOW_COMPLETED_WITHOUT_SUBMISSION:
        this.queryClient.invalidateQueries({ queryKey: ['projects'] })
        break

      case SSEEventType.ARTIFACTS_READY:
        this.queryClient.invalidateQueries({ queryKey: ['artifacts'] })
        break

      case SSEEventType.PARSER_COMPLETED:
      case SSEEventType.ANALYSIS_COMPLETED:
      case SSEEventType.CONTENT_COMPLETED:
      case SSEEventType.COMPLIANCE_COMPLETED:
      case SSEEventType.QA_COMPLETED:
      case SSEEventType.COMMS_COMPLETED:
      case SSEEventType.SUBMISSION_COMPLETED:
        if (this.projectId) {
          this.queryClient.invalidateQueries({
            queryKey: ['projects', this.projectId],
          })
        }
        break
    }
  }
}
