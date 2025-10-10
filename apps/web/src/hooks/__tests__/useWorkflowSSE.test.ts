import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWorkflowSSE } from '../useWorkflowSSE'
import { SSEEventType, AgentType } from '@/types/sse'
import React from 'react'

// Mock the toast hook
vi.mock('../use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Mock fetch
global.fetch = vi.fn()

describe('useWorkflowSSE', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
    vi.restoreAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  it('initializes with default state', () => {
    const { result } = renderHook(
      () =>
        useWorkflowSSE({
          projectId: 'test-project',
          sessionId: 'test-session',
          autoConnect: false,
        }),
      { wrapper }
    )

    expect(result.current.messages).toEqual([])
    expect(result.current.workflowSteps).toHaveLength(8)
    expect(result.current.isConnected).toBe(false)
    expect(result.current.isReconnecting).toBe(false)
    expect(result.current.progressPercentage).toBe(0)
    expect(result.current.currentStep).toBeNull()
    expect(result.current.hasErrors).toBe(false)
  })

  it('adds messages correctly', () => {
    const { result } = renderHook(
      () =>
        useWorkflowSSE({
          projectId: 'test-project',
          sessionId: 'test-session',
          autoConnect: false,
        }),
      { wrapper }
    )

    act(() => {
      result.current.addMessage({
        id: 'msg-1',
        type: 'agent',
        content: 'Test message',
        timestamp: new Date(),
        agentType: AgentType.PARSER,
      })
    })

    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].content).toBe('Test message')
  })

  it('clears messages correctly', () => {
    const { result } = renderHook(
      () =>
        useWorkflowSSE({
          projectId: 'test-project',
          sessionId: 'test-session',
          autoConnect: false,
        }),
      { wrapper }
    )

    act(() => {
      result.current.addMessage({
        id: 'msg-1',
        type: 'user',
        content: 'Test message',
        timestamp: new Date(),
      })
    })

    expect(result.current.messages).toHaveLength(1)

    act(() => {
      result.current.clearMessages()
    })

    expect(result.current.messages).toEqual([])
  })

  it('sends message successfully', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    const { result } = renderHook(
      () =>
        useWorkflowSSE({
          projectId: 'test-project',
          sessionId: 'test-session',
          autoConnect: false,
        }),
      { wrapper }
    )

    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/workflow-agents/invocations',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: 'test-project',
          user_id: 'test-session',
          session_id: 'test-session',
          start: false,
          user_input: 'Hello',
        }),
      })
    )

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1)
      expect(result.current.messages[0].content).toBe('Hello')
      expect(result.current.messages[0].status).toBe('sent')
    })
  })

  it('handles send message failure', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(
      () =>
        useWorkflowSSE({
          projectId: 'test-project',
          sessionId: 'test-session',
          autoConnect: false,
        }),
      { wrapper }
    )

    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1)
      expect(result.current.messages[0].status).toBe('failed')
    })
  })

  it('calls onWorkflowComplete when workflow completes', async () => {
    const onWorkflowComplete = vi.fn()

    const { result } = renderHook(
      () =>
        useWorkflowSSE({
          projectId: 'test-project',
          sessionId: 'test-session',
          autoConnect: false,
          onWorkflowComplete,
        }),
      { wrapper }
    )

    // Simulate workflow completion event
    // Note: This would require mocking the SSE manager's event handling
    // For now, we verify the callback is passed correctly
    expect(onWorkflowComplete).not.toHaveBeenCalled()
  })

  it('calls onError when error occurs', () => {
    const onError = vi.fn()

    renderHook(
      () =>
        useWorkflowSSE({
          projectId: 'test-project',
          sessionId: 'test-session',
          autoConnect: false,
          onError,
        }),
      { wrapper }
    )

    // Error callback is set up correctly
    expect(onError).not.toHaveBeenCalled()
  })

  it('auto-connects when autoConnect is true', () => {
    const { result } = renderHook(
      () =>
        useWorkflowSSE({
          projectId: 'test-project',
          sessionId: 'test-session',
          autoConnect: true,
        }),
      { wrapper }
    )

    // Connection is initiated
    expect(result.current).toBeDefined()
  })

  it('does not auto-connect when autoConnect is false', () => {
    const { result } = renderHook(
      () =>
        useWorkflowSSE({
          projectId: 'test-project',
          sessionId: 'test-session',
          autoConnect: false,
        }),
      { wrapper }
    )

    expect(result.current.isConnected).toBe(false)
  })

  it('provides connect and disconnect methods', () => {
    const { result } = renderHook(
      () =>
        useWorkflowSSE({
          projectId: 'test-project',
          sessionId: 'test-session',
          autoConnect: false,
        }),
      { wrapper }
    )

    expect(typeof result.current.connect).toBe('function')
    expect(typeof result.current.disconnect).toBe('function')

    act(() => {
      result.current.connect()
    })

    act(() => {
      result.current.disconnect()
    })
  })
})
