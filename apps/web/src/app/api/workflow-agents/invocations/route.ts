import { NextRequest, NextResponse } from 'next/server';
// Note: Authentication will be properly implemented with AWS Amplify Gen 2 in Phase 4
// For now, we'll use a simplified version that checks for authorization header

// AgentCore endpoint configuration
const AGENT_CORE_URL = process.env.AGENT_CORE_URL || 'http://localhost:8000';
const INVOCATIONS_ENDPOINT = `${AGENT_CORE_URL}/invocations`;

interface InvocationPayload {
  project_id: string;
  user_id: string;
  session_id: string;
  start: boolean;
  user_input?: {
    chat?: string;
    content_edits?: Array<{
      artifact_id: string;
      content: Record<string, unknown>;
    }>;
  };
}

/**
 * POST /api/workflow-agents/invocations
 * 
 * Proxy endpoint to trigger agent workflow execution via AWS AgentCore.
 * This endpoint:
 * 1. Validates user authentication
 * 2. Forwards the request to AgentCore /invocations endpoint
 * 3. Returns the response (could be SSE stream or JSON)
 * 
 * Payload structure:
 * {
 *   project_id: string,
 *   user_id: string,
 *   session_id: string,
 *   start: boolean,  // true for initial request, false for follow-up
 *   user_input?: {
 *     chat?: string,
 *     content_edits?: [{ artifact_id, content }]
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate authentication (simplified - will be replaced with Amplify)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No authorization header' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json() as InvocationPayload;

    // 3. Validate required fields
    if (!body.project_id || !body.user_id || !body.session_id || typeof body.start !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: project_id, user_id, session_id, start' },
        { status: 400 }
      );
    }

    // 4. Forward request to AgentCore
    const response = await fetch(INVOCATIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    // 6. Handle AgentCore response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('AgentCore error:', errorText);
      return NextResponse.json(
        { error: 'AgentCore invocation failed', details: errorText },
        { status: response.status }
      );
    }

    // 7. Check if response is SSE stream
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/event-stream')) {
      // Stream the SSE response back to client
      return new NextResponse(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // 8. Return JSON response
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in agent invocation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workflow-agents/invocations/stream?project_id=xxx&session_id=xxx
 * 
 * SSE stream endpoint for real-time agent workflow updates.
 * Clients can connect to this endpoint to receive Server-Sent Events
 * for a specific project's workflow execution.
 * 
 * Query parameters:
 * - project_id: UUID of the project
 * - session_id: Session ID for the workflow execution
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Validate authentication (simplified - will be replaced with Amplify)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No authorization header' },
        { status: 401 }
      );
    }

    // 2. Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    const sessionId = searchParams.get('session_id');

    if (!projectId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required query parameters: project_id, session_id' },
        { status: 400 }
      );
    }

    // 3. Connect to AgentCore SSE stream
    const streamUrl = `${AGENT_CORE_URL}/invocations/stream?project_id=${projectId}&session_id=${sessionId}`;
    const response = await fetch(streamUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'text/event-stream',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AgentCore stream error:', errorText);
      return NextResponse.json(
        { error: 'Failed to connect to AgentCore stream', details: errorText },
        { status: response.status }
      );
    }

    // 4. Stream the SSE response back to client
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in SSE stream:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}