'use client';

import graphqlClient from '@/lib/graphql/client';
import {
  GET_WORKFLOW_EXECUTION,
  GET_WORKFLOW_EXECUTIONS_BY_PROJECT,
} from '@/lib/graphql/queries/workflow';
import type { WorkflowExecution } from '@/types/workflow.types';
import { useQuery } from '@tanstack/react-query';

interface WorkflowExecutionResponse {
  workflowExecution: WorkflowExecution;
}

interface WorkflowExecutionsByProjectResponse {
  workflowExecutionsByProject: WorkflowExecution[];
}

export function useWorkflowExecution(id: string | undefined) {
  return useQuery({
    queryKey: ['workflowExecution', id],
    queryFn: async () => {
      if (!id) throw new Error('Workflow execution ID is required');
      const data = await graphqlClient.request<WorkflowExecutionResponse>(
        GET_WORKFLOW_EXECUTION,
        { id }
      );
      return data.workflowExecution;
    },
    enabled: !!id,
    staleTime: 1000 * 30, // 30 seconds (frequently updated via SSE)
    refetchOnWindowFocus: true,
  });
}

export function useWorkflowExecutionsByProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['workflowExecutions', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      const data = await graphqlClient.request<WorkflowExecutionsByProjectResponse>(
        GET_WORKFLOW_EXECUTIONS_BY_PROJECT,
        { projectId }
      );
      return data.workflowExecutionsByProject;
    },
    enabled: !!projectId,
    staleTime: 1000 * 60, // 1 minute
  });
}