import { useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlMutation } from '@/lib/graphql/client';
import { UPDATE_USER } from '@/lib/graphql/mutations/users';
import type { User } from '@/types/user.types';

interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  preferredLanguage?: string;
  themePreference?: string;
}

interface UpdateUserVariables {
  id: string;
  input: UpdateUserInput;
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<User, Error, UpdateUserVariables>({
    mutationFn: async (variables) => {
      const data = await graphqlMutation<{ updateUser: User }>(
        UPDATE_USER,
        variables as unknown as Record<string, unknown>
      );
      return data.updateUser;
    },
    onSuccess: (data, variables) => {
      // Invalidate users list query
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Invalidate specific user query
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
    },
  });
}