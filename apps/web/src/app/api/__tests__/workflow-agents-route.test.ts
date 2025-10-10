import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as workflowAgentsPost } from '../workflow-agents/invocations/route'

// Mock Amplify server utils
vi.mock('@/lib/auth/amplify-server-utils', () => ({
  runWithAmplifyServerContext: vi.fn(),
}))

// Mock fetch
global.fetch = vi.fn()

describe('Workflow Agents API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/workflow-agents/invocations', () => {
    it('returns 401 when user is not authenticated', async () => {
      const { runWithAmplifyServerContext } = await import('@/lib/auth/amplify-server-utils')
      ;(runWithAmplifyServerContext as any).mockResolvedValueOnce({
        authenticated: false,
        userId: null,
      })

      const request = new NextRequest('http://localhost:3000/api/workflow-agents/invocations', {
        method: 'POST',
        body: JSON.stringify({
          project_id: 'test-project',
          user_id: 'test-user',
          session_id: 'test-session',
          start: true,
        }),
      })

      const response = await workflowAgentsPost(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 400 when required fields are missing', async () => {
      const { runWithAmplifyServerContext } = await import('@/lib/auth/amplify-server-utils')
      ;(runWithAmplifyServerContext as any).mockResolvedValueOnce({
        authenticated: true,
        userId: 'test-user',
      })

      const request = new NextRequest('http://localhost:3000/api/workflow-agents/invocations', {
        method: 'POST',
        body: JSON.stringify({
          project_id: 'test-project',
          // Missing user_id and session_id
        }),
      })

      const response = await workflowAgentsPost(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('forwards request to AgentCore successfully', async () => {
      const { runWithAmplifyServerContext } = await import('@/lib/auth/amplify-server-utils')
      ;(runWithAmplifyServerContext as any).mockResolvedValueOnce({
        authenticated: true,
        userId: 'test-user',
      })

      const mockAgentCoreResponse = {
        workflow_id: 'workflow-123',
        status: 'started',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentCoreResponse,
      })

      const requestBody = {
        project_id: 'test-project',
        user_id: 'test-user',
        session_id: 'test-session',
        start: true,
      }

      const request = new NextRequest('http://localhost:3000/api/workflow-agents/invocations', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await workflowAgentsPost(request)
      const data = await response.json()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/invocations'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestBody),
        })
      )

      expect(response.status).toBe(200)
      expect(data).toEqual(mockAgentCoreResponse)
    })

    it('handles AgentCore errors', async () => {
      const { runWithAmplifyServerContext } = await import('@/lib/auth/amplify-server-utils')
      ;(runWithAmplifyServerContext as any).mockResolvedValueOnce({
        authenticated: true,
        userId: 'test-user',
      })

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'AgentCore internal error',
      })

      const request = new NextRequest('http://localhost:3000/api/workflow-agents/invocations', {
        method: 'POST',
        body: JSON.stringify({
          project_id: 'test-project',
          user_id: 'test-user',
          session_id: 'test-session',
          start: true,
        }),
      })

      const response = await workflowAgentsPost(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('AgentCore request failed')
      expect(data.details).toBe('AgentCore internal error')
    })

    it('handles network errors', async () => {
      const { runWithAmplifyServerContext } = await import('@/lib/auth/amplify-server-utils')
      ;(runWithAmplifyServerContext as any).mockResolvedValueOnce({
        authenticated: true,
        userId: 'test-user',
      })

      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const request = new NextRequest('http://localhost:3000/api/workflow-agents/invocations', {
        method: 'POST',
        body: JSON.stringify({
          project_id: 'test-project',
          user_id: 'test-user',
          session_id: 'test-session',
          start: true,
        }),
      })

      const response = await workflowAgentsPost(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('includes user_input when provided', async () => {
      const { runWithAmplifyServerContext } = await import('@/lib/auth/amplify-server-utils')
      ;(runWithAmplifyServerContext as any).mockResolvedValueOnce({
        authenticated: true,
        userId: 'test-user',
      })

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const requestBody = {
        project_id: 'test-project',
        user_id: 'test-user',
        session_id: 'test-session',
        start: false,
        user_input: 'This looks good, proceed',
      }

      const request = new NextRequest('http://localhost:3000/api/workflow-agents/invocations', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      await workflowAgentsPost(request)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(requestBody),
        })
      )
    })
  })
})
