/**
 * useUsers Hook
 *
 * Query hook for fetching users
 */

import { useQuery } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql/client';
import { GET_USERS } from '@/lib/graphql/queries/users';
import { User } from '@/types/user.types';

interface UsersResponse {
  users: {
    edges: Array<{
      node: User;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    totalCount: number;
  };
}

export function useUsers(searchTerm?: string) {
  return useQuery({
    queryKey: ['users', searchTerm],
    queryFn: async () => {
      const response = await graphqlRequest<UsersResponse>(
        GET_USERS,
        { filter: searchTerm ? { search: searchTerm } : undefined }
      );
      return response.users.edges.map(edge => edge.node);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}