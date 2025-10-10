import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql/client';
import {
  GET_ARTIFACTS,
  GET_ARTIFACT,
  GET_ARTIFACT_VERSIONS,
} from '@/lib/graphql/queries/artifacts';
import {
  CREATE_ARTIFACT,
  UPDATE_ARTIFACT,
  DELETE_ARTIFACT,
  CREATE_ARTIFACT_VERSION,
  APPROVE_ARTIFACT,
} from '@/lib/graphql/mutations/artifacts';
import { showErrorToast } from '@/lib/error-handler';

// Query Keys
export const artifactKeys = {
  all: ['artifacts'] as const,
  lists: () => [...artifactKeys.all, 'list'] as const,
  list: (projectId: string) => [...artifactKeys.lists(), projectId] as const,
  details: () => [...artifactKeys.all, 'detail'] as const,
  detail: (id: string) => [...artifactKeys.details(), id] as const,
  versions: (id: string) => [...artifactKeys.detail(id), 'versions'] as const,
};

// Hooks
export function useArtifacts(projectId: string) {
  return useQuery({
    queryKey: artifactKeys.list(projectId),
    queryFn: () => graphqlClient.query(GET_ARTIFACTS, { projectId }),
    enabled: !!projectId,
  });
}

export function useArtifact(id: string) {
  return useQuery({
    queryKey: artifactKeys.detail(id),
    queryFn: () => graphqlClient.query(GET_ARTIFACT, { id }),
    enabled: !!id,
  });
}

export function useArtifactVersions(artifactId: string) {
  return useQuery({
    queryKey: artifactKeys.versions(artifactId),
    queryFn: () => graphqlClient.query(GET_ARTIFACT_VERSIONS, { artifactId }),
    enabled: !!artifactId,
  });
}

// Mutations
export function useCreateArtifact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: unknown) => graphqlClient.mutation(CREATE_ARTIFACT, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.lists() });
    },
    onError: (error) => {
      showErrorToast(error, 'Create Artifact');
    },
  });
}

export function useUpdateArtifact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: unknown }) =>
      graphqlClient.mutation(UPDATE_ARTIFACT, { id, input }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: artifactKeys.lists() });
    },
    onError: (error) => {
      showErrorToast(error, 'Update Artifact');
    },
  });
}

export function useDeleteArtifact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => graphqlClient.mutation(DELETE_ARTIFACT, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.lists() });
    },
    onError: (error) => {
      showErrorToast(error, 'Delete Artifact');
    },
  });
}

export function useCreateArtifactVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ artifactId, input }: { artifactId: string; input: unknown }) =>
      graphqlClient.mutation(CREATE_ARTIFACT_VERSION, { artifactId, input }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.detail(variables.artifactId) });
      queryClient.invalidateQueries({ queryKey: artifactKeys.versions(variables.artifactId) });
    },
    onError: (error) => {
      showErrorToast(error, 'Create Artifact Version');
    },
  });
}

export function useApproveArtifact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => graphqlClient.mutation(APPROVE_ARTIFACT, { id }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: artifactKeys.lists() });
    },
    onError: (error) => {
      showErrorToast(error, 'Approve Artifact');
    },
  });
}
