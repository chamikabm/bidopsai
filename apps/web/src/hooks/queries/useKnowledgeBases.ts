/**
 * useKnowledgeBases Hook
 * 
 * Query hook for fetching knowledge bases
 */

import { useQuery } from '@tanstack/react-query';
import graphqlClient from '@/lib/graphql/client';
import { GET_KNOWLEDGE_BASES, GET_GLOBAL_KNOWLEDGE_BASES } from '@/lib/graphql/queries/knowledgeBases';
import { KnowledgeBase } from '@/types/knowledgeBase.types';

interface KnowledgeBasesResponse {
  knowledgeBases: {
    edges: Array<{
      node: KnowledgeBase;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    totalCount: number;
  };
}

interface GlobalKnowledgeBasesResponse {
  globalKnowledgeBases: KnowledgeBase[];
}

export function useKnowledgeBases(scope?: 'GLOBAL' | 'LOCAL') {
  return useQuery({
    queryKey: ['knowledgeBases', scope],
    queryFn: async () => {
      const response = await graphqlClient.request<KnowledgeBasesResponse>(
        GET_KNOWLEDGE_BASES,
        { filter: scope ? { scope } : undefined }
      );
      return response.knowledgeBases.edges.map(edge => edge.node);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useGlobalKnowledgeBases() {
  return useQuery({
    queryKey: ['globalKnowledgeBases'],
    queryFn: async () => {
      const response = await graphqlClient.request<GlobalKnowledgeBasesResponse>(
        GET_GLOBAL_KNOWLEDGE_BASES
      );
      return response.globalKnowledgeBases;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}