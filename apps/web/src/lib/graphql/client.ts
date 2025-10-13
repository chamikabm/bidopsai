/**
 * GraphQL Client Configuration
 * 
 * Provides a configured GraphQL client using graphql-request with:
 * - Authentication header injection from Cognito session
 * - Error handling and logging
 * - Type-safe request methods
 * 
 * @module lib/graphql/client
 */

import { GraphQLClient } from 'graphql-request';
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * GraphQL endpoint URL - derived from API base URL
 * Single source of truth: NEXT_PUBLIC_API_URL
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const GRAPHQL_ENDPOINT = `${API_URL}/graphql`;

if (!API_URL) {
  console.warn('NEXT_PUBLIC_API_URL is not defined');
}

/**
 * Base GraphQL client instance
 */
const baseClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get authentication headers from Cognito session
 *
 * @returns Headers object with Authorization bearer token
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const session = await fetchAuthSession();
    // Use accessToken for API authorization (not idToken)
    const token = session.tokens?.accessToken?.toString();
    
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
  } catch (error) {
    console.error('Failed to get auth session:', error);
  }
  
  return {};
}

/**
 * Create an authenticated GraphQL client
 * 
 * @returns GraphQL client with auth headers
 */
export async function getAuthenticatedClient(): Promise<GraphQLClient> {
  const authHeaders = await getAuthHeaders();
  
  return new GraphQLClient(GRAPHQL_ENDPOINT, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
  });
}

/**
 * Execute a GraphQL query with authentication
 * 
 * @param query - GraphQL query string
 * @param variables - Query variables
 * @returns Query result data
 */
export async function graphqlRequest<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  try {
    const client = await getAuthenticatedClient();
    return await client.request<T>(query, variables);
  } catch (error) {
    console.error('GraphQL request error:', error);
    throw error;
  }
}

/**
 * Execute a GraphQL mutation with authentication
 * 
 * @param mutation - GraphQL mutation string
 * @param variables - Mutation variables
 * @returns Mutation result data
 */
export async function graphqlMutation<T = unknown>(
  mutation: string,
  variables?: Record<string, unknown>
): Promise<T> {
  try {
    const client = await getAuthenticatedClient();
    return await client.request<T>(mutation, variables);
  } catch (error) {
    console.error('GraphQL mutation error:', error);
    throw error;
  }
}

/**
 * Check if an error is a GraphQL error
 */
export function isGraphQLError(error: unknown): error is { response: { errors: Array<{ message: string }> } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response: unknown }).response === 'object' &&
    (error as { response: unknown }).response !== null &&
    'errors' in (error as { response: Record<string, unknown> }).response
  );
}

/**
 * Extract error message from GraphQL error
 */
export function getGraphQLErrorMessage(error: unknown): string {
  if (isGraphQLError(error)) {
    return error.response.errors[0]?.message || 'GraphQL request failed';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  const message = getGraphQLErrorMessage(error);
  return (
    message.includes('Unauthorized') ||
    message.includes('Authentication') ||
    message.includes('Token') ||
    message.includes('Session')
  );
}

export default baseClient;