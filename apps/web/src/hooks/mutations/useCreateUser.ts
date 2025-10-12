import { useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlMutation } from '@/lib/graphql/client';
import { CREATE_USER } from '@/lib/graphql/mutations/users';
import type { User } from '@/types/user.types';

interface CreateUserInput {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  roleIds: string[];
}

interface CreateUserVariables {
  input: CreateUserInput;
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation<User, Error, CreateUserVariables>({
    mutationFn: async (variables) => {
      const data = await graphqlMutation<{ createUser: User }>(
        CREATE_USER,
        variables as unknown as Record<string, unknown>
      );
      return data.createUser;
    },
    onSuccess: () => {
      // Invalidate users list query
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}