import { useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlMutation } from '@/lib/graphql/client';
import { DELETE_USER } from '@/lib/graphql/mutations/users';

interface DeleteUserVariables {
  id: string;
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, DeleteUserVariables>({
    mutationFn: async (variables) => {
      const data = await graphqlMutation<{ deleteUser: boolean }>(
        DELETE_USER,
        variables as unknown as Record<string, unknown>
      );
      return data.deleteUser;
    },
    onSuccess: (_, variables) => {
      // Invalidate users list query
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Remove specific user from cache
      queryClient.removeQueries({ queryKey: ['user', variables.id] });
    },
  });
}