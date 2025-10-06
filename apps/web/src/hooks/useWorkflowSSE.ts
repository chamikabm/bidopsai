import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  AgentSSEManager,
  SSEEventProcessor,
  WorkflowStateManager,
  WorkflowNavigationHandler,
  ErrorRecoveryManager,
  ChatMessage,
  WorkflowStep,
} from '@/lib/sse'
import { SSEEvent, SSEEventType, AgentType, ProgressResetData } from '@/types/sse'
import { useToast } from './use-toast'

export type UseWorkflowSSEOptions = {
  projectId: string
  sessionId: string
  autoConnect?: boolean
  onWorkflowComplete?: () => void
  onError?: (error: string) => void
}

export type UseWorkflowSSEReturn = {
  messages: ChatMessage[]
  workflowSteps: WorkflowStep[]
  isConnected: boolean
  isReconnecting: boolean
  progressPercentage: number
  connect: () => void
  disconnect: () => void
  sendMessage: (content: string) => Promise<void>
  addMessage: (message: ChatMessage) => void
  clearMessages: () => void
  currentStep: AgentType | null
  hasErrors: boolean
}

export function useWorkflowSSE(
  options: UseWorkflowSSEOptions
): UseWorkflowSSEReturn {
  const { projectId, sessionId, autoConnect = true, onWorkflowComplete, onError } = options
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [currentStep, setCurrentStep] = useState<AgentType | null>(null)
  const [hasErrors, setHasErrors] = useState(false)

  const sseManagerRef = useRef<AgentSSEManager | null>(null)
  const stateManagerRef = useRef<WorkflowStateManager | null>(null)
  const navigationHandlerRef = useRef<WorkflowNavigationHandler | null>(null)
  const errorRecoveryManagerRef = useRef<ErrorRecoveryManager | null>(null)
  const eventProcessorRef = useRef<SSEEventProcessor | null>(null)

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const updateProgress = useCallback((step: AgentType, status: string) => {
    if (stateManagerRef.current) {
      stateManagerRef.current.updateStepStatus(
        step,
        status as WorkflowStep['status']
      )
      setWorkflowSteps(stateManagerRef.current.getAllSteps())
      setCurrentStep(stateManagerRef.current.getCurrentStep())
    }
  }, [])

  const resetProgress = useCallback((data: ProgressResetData) => {
    if (navigationHandlerRef.current) {
      navigationHandlerRef.current.handleProgressReset(data)
      if (stateManagerRef.current) {
        setWorkflowSteps(stateManagerRef.current.getAllSteps())
        setCurrentStep(stateManagerRef.current.getCurrentStep())
      }
    }
  }, [])

  const handleManualIntervention = useCallback(
    (reason: string) => {
      toast({
        title: 'Manual Intervention Required',
        description: reason,
        variant: 'destructive',
      })
      if (onError) {
        onError(reason)
      }
    },
    [toast, onError]
  )

  const handleConnectionError = useCallback(
    (error: string) => {
      toast({
        title: 'Connection Error',
        description: error,
        variant: 'destructive',
      })
      if (onError) {
        onError(error)
      }
    },
    [toast, onError]
  )

  // Initialize managers
  useEffect(() => {
    stateManagerRef.current = new WorkflowStateManager()
    errorRecoveryManagerRef.current = new ErrorRecoveryManager()
    navigationHandlerRef.current = new WorkflowNavigationHandler(
      stateManagerRef.current,
      handleManualIntervention
    )
    eventProcessorRef.current = new SSEEventProcessor(
      addMessage,
      updateProgress,
      resetProgress
    )
    sseManagerRef.current = new AgentSSEManager(
      queryClient,
      handleConnectionError
    )

    setWorkflowSteps(stateManagerRef.current.getAllSteps())

    return () => {
      if (sseManagerRef.current) {
        sseManagerRef.current.disconnect()
      }
    }
  }, [queryClient, addMessage, updateProgress, resetProgress, handleManualIntervention, handleConnectionError])

  // Handle SSE events
  useEffect(() => {
    if (!sseManagerRef.current || !eventProcessorRef.current) return

    const handleSSEEvent = (event: SSEEvent) => {
      if (eventProcessorRef.current) {
        eventProcessorRef.current.process(event)
      }

      // Handle workflow completion
      if (
        event.type === SSEEventType.WORKFLOW_COMPLETED ||
        event.type === SSEEventType.WORKFLOW_COMPLETED_WITHOUT_COMMS ||
        event.type === SSEEventType.WORKFLOW_COMPLETED_WITHOUT_SUBMISSION
      ) {
        if (onWorkflowComplete) {
          onWorkflowComplete()
        }
      }

      // Handle errors
      if (event.type.includes('_FAILED')) {
        setHasErrors(true)
      }
    }

    sseManagerRef.current.onAny(handleSSEEvent)

    return () => {
      if (sseManagerRef.current) {
        sseManagerRef.current.offAny(handleSSEEvent)
      }
    }
  }, [onWorkflowComplete])

  // Monitor connection state
  useEffect(() => {
    const interval = setInterval(() => {
      if (sseManagerRef.current) {
        const state = sseManagerRef.current.getConnectionState()
        setIsConnected(state.isConnected)
        setIsReconnecting(state.reconnectionState.isReconnecting)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const connect = useCallback(() => {
    if (sseManagerRef.current) {
      sseManagerRef.current.connect(projectId, sessionId)
    }
  }, [projectId, sessionId])

  const disconnect = useCallback(() => {
    if (sseManagerRef.current) {
      sseManagerRef.current.disconnect()
    }
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      // Add user message to chat
      const userMessage: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'user',
        content,
        timestamp: new Date(),
        status: 'sending',
      }
      addMessage(userMessage)

      try {
        // Send to backend
        const response = await fetch('/api/workflow-agents/invocations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project_id: projectId,
            user_id: sessionId,
            session_id: sessionId,
            start: false,
            user_input: content,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        // Update message status
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id ? { ...msg, status: 'sent' as const } : msg
          )
        )
      } catch (error) {
        // Update message status to failed
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id ? { ...msg, status: 'failed' as const } : msg
          )
        )
        toast({
          title: 'Failed to send message',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        })
      }
    },
    [projectId, sessionId, addMessage, toast]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const progressPercentage = stateManagerRef.current?.getProgressPercentage() || 0

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect()
    }
  }, [autoConnect, connect])

  return {
    messages,
    workflowSteps,
    isConnected,
    isReconnecting,
    progressPercentage,
    connect,
    disconnect,
    sendMessage,
    addMessage,
    clearMessages,
    currentStep,
    hasErrors,
  }
}
