import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql/client';
import {
  GET_KNOWLEDGE_BASES,
  GET_KNOWLEDGE_BASE,
  GET_KNOWLEDGE_BASE_DOCUMENTS,
} from '@/lib/graphql/queries/knowledge-bases';
import {
  CREATE_KNOWLEDGE_BASE,
  UPDATE_KNOWLEDGE_BASE,
  DELETE_KNOWLEDGE_BASE,
  ADD_KNOWLEDGE_BASE_DOCUMENT,
  REMOVE_KNOWLEDGE_BASE_DOCUMENT,
  SET_KNOWLEDGE_BASE_PERMISSION,
} from '@/lib/graphql/mutations/knowledge-bases';
import { showErrorToast } from '@/lib/error-handler';

// Query Keys
export const knowledgeBaseKeys = {
  all: ['knowledgeBases'] as const,
  lists: () => [...knowledgeBaseKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...knowledgeBaseKeys.lists(), filters] as const,
  details: () => [...knowledgeBaseKeys.all, 'detail'] as const,
  detail: (id: string) => [...knowledgeBaseKeys.details(), id] as const,
  documents: (id: string) => [...knowledgeBaseKeys.detail(id), 'documents'] as const,
};

// Hooks
export function useKnowledgeBases(filters?: { type?: string; projectId?: string }) {
  return useQuery({
    queryKey: knowledgeBaseKeys.list(filters || {}),
    queryFn: () => graphqlClient.query(GET_KNOWLEDGE_BASES, filters),
  });
}

export function useKnowledgeBase(id: string) {
  return useQuery({
    queryKey: knowledgeBaseKeys.detail(id),
    queryFn: () => graphqlClient.query(GET_KNOWLEDGE_BASE, { id }),
    enabled: !!id,
  });
}

export function useKnowledgeBaseDocuments(knowledgeBaseId: string, search?: string) {
  return useQuery({
    queryKey: knowledgeBaseKeys.documents(knowledgeBaseId),
    queryFn: () => graphqlClient.query(GET_KNOWLEDGE_BASE_DOCUMENTS, { knowledgeBaseId, search }),
    enabled: !!knowledgeBaseId,
  });
}

// Mutations
export function useCreateKnowledgeBase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: unknown) => graphqlClient.mutation(CREATE_KNOWLEDGE_BASE, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.lists() });
    },
    onError: (error) => {
      showErrorToast(error, 'Create Knowledge Base');
    },
  });
}

export function useUpdateKnowledgeBase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: unknown }) =>
      graphqlClient.mutation(UPDATE_KNOWLEDGE_BASE, { id, input }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.lists() });
    },
    onError: (error) => {
      showErrorToast(error, 'Update Knowledge Base');
    },
  });
}

export function useDeleteKnowledgeBase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => graphqlClient.mutation(DELETE_KNOWLEDGE_BASE, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.lists() });
    },
    onError: (error) => {
      showErrorToast(error, 'Delete Knowledge Base');
    },
  });
}

export function useAddKnowledgeBaseDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ knowledgeBaseId, input }: { knowledgeBaseId: string; input: unknown }) =>
      graphqlClient.mutation(ADD_KNOWLEDGE_BASE_DOCUMENT, { knowledgeBaseId, input }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.documents(variables.knowledgeBaseId) });
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.detail(variables.knowledgeBaseId) });
    },
    onError: (error) => {
      showErrorToast(error, 'Add Knowledge Base Document');
    },
  });
}

export function useRemoveKnowledgeBaseDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ knowledgeBaseId, documentId }: { knowledgeBaseId: string; documentId: string }) =>
      graphqlClient.mutation(REMOVE_KNOWLEDGE_BASE_DOCUMENT, { knowledgeBaseId, documentId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.documents(variables.knowledgeBaseId) });
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.detail(variables.knowledgeBaseId) });
    },
    onError: (error) => {
      showErrorToast(error, 'Remove Knowledge Base Document');
    },
  });
}

export function useSetKnowledgeBasePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      knowledgeBaseId,
      userId,
      canRead,
      canWrite,
    }: {
      knowledgeBaseId: string;
      userId: string;
      canRead: boolean;
      canWrite: boolean;
    }) => graphqlClient.mutation(SET_KNOWLEDGE_BASE_PERMISSION, { knowledgeBaseId, userId, canRead, canWrite }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.detail(variables.knowledgeBaseId) });
    },
    onError: (error) => {
      showErrorToast(error, 'Set Knowledge Base Permission');
    },
  });
}
