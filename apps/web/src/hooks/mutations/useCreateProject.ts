/**
 * useCreateProject Hook
 *
 * Mutation hook for creating a new project
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlMutation } from '@/lib/graphql/client';
import { CREATE_PROJECT } from '@/lib/graphql/mutations/projects';
import { Project } from '@/types/project.types';
import { toast } from 'sonner';

interface CreateProjectInput {
  name: string;
  description?: string;
  deadline?: string;
  knowledgeBaseIds?: string[];
  memberUserIds?: string[];
}

interface CreateProjectResponse {
  createProject: Project;
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const response = await graphqlMutation<CreateProjectResponse>(
        CREATE_PROJECT,
        { input }
      );
      return response.createProject;
    },
    onSuccess: () => {
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['userProjects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      
      toast.success('Project created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create project: ${error.message}`);
    },
  });
}