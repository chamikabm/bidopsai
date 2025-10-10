import { NextRequest } from 'next/server'
import { runWithAmplifyServerContext } from '@/lib/auth/amplify-server-utils'
import { fetchAuthSession } from 'aws-amplify/auth/server'

const AGENT_CORE_URL = process.env.AGENT_CORE_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated } = await runWithAmplifyServerContext({
      nextServerContext: { request },
      operation: async (contextSpec) => {
        try {
          const session = await fetchAuthSession(contextSpec)
          return {
            authenticated: !!session.tokens,
          }
        } catch (error) {
          return { authenticated: false }
        }
      },
    })

    if (!authenticated) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const sessionId = searchParams.get('sessionId')

    if (!projectId || !sessionId) {
      return new Response('Missing required parameters', { status: 400 })
    }

    // Create SSE connection to AgentCore
    const agentCoreUrl = `${AGENT_CORE_URL}/stream?projectId=${projectId}&sessionId=${sessionId}`
    const agentCoreResponse = await fetch(agentCoreUrl, {
      headers: {
        Accept: 'text/event-stream',
      },
    })

    if (!agentCoreResponse.ok) {
      return new Response('Failed to connect to AgentCore', { status: 502 })
    }

    // Create a readable stream to forward SSE events
    const stream = new ReadableStream({
      async start(controller) {
        const reader = agentCoreResponse.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              controller.close()
              break
            }

            // Forward the chunk to the client
            const chunk = decoder.decode(value, { stream: true })
            controller.enqueue(new TextEncoder().encode(chunk))
          }
        } catch (error) {
          console.error('Error streaming from AgentCore:', error)
          controller.error(error)
        }
      },
    })

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in workflow-agents stream:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
