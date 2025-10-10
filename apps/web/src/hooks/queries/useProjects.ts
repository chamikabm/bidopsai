import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql/client';
import {
  GET_PROJECTS,
  GET_PROJECT,
  GET_PROJECT_DOCUMENTS,
  GET_PROJECT_WORKFLOW,
} from '@/lib/graphql/queries/projects';
import {
  CREATE_PROJECT,
  UPDATE_PROJECT,
  DELETE_PROJECT,
  GENERATE_PRESIGNED_URLS,
  UPDATE_PROJECT_DOCUMENTS,
  ADD_PROJECT_MEMBER,
  REMOVE_PROJECT_MEMBER,
} from '@/lib/graphql/mutations/projects';
import { showErrorToast } from '@/lib/error-handler';

// Query Keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  documents: (id: string) => [...projectKeys.detail(id), 'documents'] as const,
  workflow: (id: string) => [...projectKeys.detail(id), 'workflow'] as const,
};

// Hooks
export function useProjects(filters?: { limit?: number; offset?: number; status?: string }) {
  return useQuery({
    queryKey: projectKeys.list(filters || {}),
    queryFn: () => graphqlClient.query(GET_PROJECTS, filters),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => graphqlClient.query(GET_PROJECT, { id }),
    enabled: !!id,
  });
}

export function useProjectDocuments(projectId: string) {
  return useQuery({
    queryKey: projectKeys.documents(projectId),
    queryFn: () => graphqlClient.query(GET_PROJECT_DOCUMENTS, { projectId }),
    enabled: !!projectId,
  });
}

export function useProjectWorkflow(projectId: string) {
  return useQuery({
    queryKey: projectKeys.workflow(projectId),
    queryFn: () => graphqlClient.query(GET_PROJECT_WORKFLOW, { projectId }),
    enabled: !!projectId,
  });
}

// Mutations
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: unknown) => graphqlClient.mutation(CREATE_PROJECT, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
    onError: (error) => {
      showErrorToast(error, 'Create Project');
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: unknown }) =>
      graphqlClient.mutation(UPDATE_PROJECT, { id, input }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
    onError: (error) => {
      showErrorToast(error, 'Update Project');
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => graphqlClient.mutation(DELETE_PROJECT, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
    onError: (error) => {
      showErrorToast(error, 'Delete Project');
    },
  });
}

export function useGeneratePresignedUrls() {
  return useMutation({
    mutationFn: ({ projectId, files }: { projectId: string; files: unknown[] }) =>
      graphqlClient.mutation(GENERATE_PRESIGNED_URLS, { projectId, files }),
    onError: (error) => {
      showErrorToast(error, 'Generate Presigned URLs');
    },
  });
}

export function useUpdateProjectDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, documents }: { projectId: string; documents: unknown[] }) =>
      graphqlClient.mutation(UPDATE_PROJECT_DOCUMENTS, { projectId, documents }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.documents(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
    },
    onError: (error) => {
      showErrorToast(error, 'Update Project Documents');
    },
  });
}

export function useAddProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, userId, role }: { projectId: string; userId: string; role?: string }) =>
      graphqlClient.mutation(ADD_PROJECT_MEMBER, { projectId, userId, role }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
    },
    onError: (error) => {
      showErrorToast(error, 'Add Project Member');
    },
  });
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, userId }: { projectId: string; userId: string }) =>
      graphqlClient.mutation(REMOVE_PROJECT_MEMBER, { projectId, userId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
    },
    onError: (error) => {
      showErrorToast(error, 'Remove Project Member');
    },
  });
}
