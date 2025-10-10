import { NextRequest, NextResponse } from 'next/server';
import { handleAPIError } from '@/lib/error-handler';

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_API_ENDPOINT || 'http://localhost:4000/graphql';

/**
 * GraphQL BFF Route
 * 
 * Proxies GraphQL requests to the backend API with authentication.
 * This ensures API keys and credentials are never exposed to the browser.
 * 
 * Authentication is handled client-side with AWS Amplify.
 * The client includes the Authorization header with the ID token.
 */
export async function POST(request: NextRequest) {
  try {
    // Get the GraphQL query/mutation from the request body
    const body = await request.json();

    // Get the authorization header from the client request
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to access this resource' },
        { status: 401 }
      );
    }

    // Forward the request to the GraphQL backend with the auth header
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await handleAPIError(response);
    }

    const data = await response.json();

    // Check for GraphQL errors
    if (data.errors) {
      return NextResponse.json(
        { errors: data.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GraphQL proxy error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Internal Server Error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
