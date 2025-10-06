import { GraphQLClient } from 'graphql-request';
import { handleGraphQLError } from '@/lib/error-handler';
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * GraphQL Client
 * 
 * Client for making GraphQL requests through the BFF route.
 * All requests go through /api/graphql which handles authentication.
 * Automatically includes the user's ID token in the Authorization header.
 */
class GraphQLClientWrapper {
  private client: GraphQLClient;

  constructor() {
    // Use the BFF route instead of direct backend access
    this.client = new GraphQLClient('/api/graphql', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get the current user's ID token for authentication
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  async request<T = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    try {
      // Get auth token and add to headers
      const token = await this.getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Update client headers for this request
      this.client.setHeaders(headers);

      const data = await this.client.request<T>(query, variables);
      return data;
    } catch (error: unknown) {
      // Handle GraphQL errors
      if (error && typeof error === 'object' && 'response' in error) {
        const response = error.response as { errors?: unknown[] };
        if (response.errors) {
          handleGraphQLError(response.errors);
        }
      }
      throw error;
    }
  }

  async mutation<T = unknown>(
    mutation: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>(mutation, variables);
  }

  async query<T = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>(query, variables);
  }
}

// Export singleton instance
export const graphqlClient = new GraphQLClientWrapper();
