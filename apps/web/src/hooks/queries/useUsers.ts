import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql/client';
import { GET_USERS, GET_USER, GET_CURRENT_USER } from '@/lib/graphql/queries/users';
import {
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER,
  ASSIGN_USER_ROLE,
  REMOVE_USER_ROLE,
} from '@/lib/graphql/mutations/users';
import { showErrorToast } from '@/lib/error-handler';

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  current: () => [...userKeys.all, 'current'] as const,
};

// Hooks
export function useUsers(filters?: { limit?: number; offset?: number; search?: string }) {
  return useQuery({
    queryKey: userKeys.list(filters || {}),
    queryFn: () => graphqlClient.query(GET_USERS, filters),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => graphqlClient.query(GET_USER, { id }),
    enabled: !!id,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: () => graphqlClient.query(GET_CURRENT_USER),
  });
}

// Mutations
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: unknown) => graphqlClient.mutation(CREATE_USER, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error) => {
      showErrorToast(error, 'Create User');
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: unknown }) =>
      graphqlClient.mutation(UPDATE_USER, { id, input }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error) => {
      showErrorToast(error, 'Update User');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => graphqlClient.mutation(DELETE_USER, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error) => {
      showErrorToast(error, 'Delete User');
    },
  });
}

export function useAssignUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      graphqlClient.mutation(ASSIGN_USER_ROLE, { userId, roleId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) });
    },
    onError: (error) => {
      showErrorToast(error, 'Assign User Role');
    },
  });
}

export function useRemoveUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      graphqlClient.mutation(REMOVE_USER_ROLE, { userId, roleId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) });
    },
    onError: (error) => {
      showErrorToast(error, 'Remove User Role');
    },
  });
}
