import { NextRequest, NextResponse } from 'next/server'
import { runWithAmplifyServerContext } from '@/lib/auth/amplify-server-utils'
import { fetchAuthSession } from 'aws-amplify/auth/server'

const AGENT_CORE_URL = process.env.AGENT_CORE_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated } = await runWithAmplifyServerContext({
      nextServerContext: { request },
      operation: async (contextSpec) => {
        try {
          const session = await fetchAuthSession(contextSpec)
          return {
            authenticated: !!session.tokens,
            userId: session.tokens?.idToken?.payload.sub as string,
          }
        } catch (error) {
          return { authenticated: false, userId: null }
        }
      },
    })

    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.project_id || !body.user_id || !body.session_id) {
      return NextResponse.json(
        { error: 'Missing required fields: project_id, user_id, session_id' },
        { status: 400 }
      )
    }

    // Forward request to AgentCore
    const response = await fetch(`${AGENT_CORE_URL}/invocations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any required authentication headers for AgentCore
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: 'AgentCore request failed', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in workflow-agents invocations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
