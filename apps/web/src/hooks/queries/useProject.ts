'use client';

import graphqlClient from '@/lib/graphql/client';
import { GET_PROJECT } from '@/lib/graphql/queries/projects';
import type { Project } from '@/types/project.types';
import { useQuery } from '@tanstack/react-query';

interface ProjectResponse {
  project: Project;
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) throw new Error('Project ID is required');
      const data = await graphqlClient.request<ProjectResponse>(GET_PROJECT, { id });
      return data.project;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });
}