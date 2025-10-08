'use client';

import { AgentChatInterface } from '@/components/projects/AgentChat/AgentChatInterface';
import type { ChatMessageProps } from '@/components/projects/AgentChat/ChatMessage';
import { WorkflowProgress } from '@/components/projects/WorkflowProgress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useProject } from '@/hooks/queries/useProject';
import { useWorkflowExecution } from '@/hooks/queries/useWorkflowExecution';
import { useWorkflowStream } from '@/hooks/streams/useWorkflowStream';
import { cn } from '@/lib/utils';
import type { SSEEvent } from '@/types/sse.types';
import { SSEEventType } from '@/types/sse.types';
import type { WorkflowStep } from '@/types/workflow.types';
import { formatDate } from '@/utils/date';
import { AlertCircle, ArrowLeft, Play, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  // State for chat messages
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentAgentName, setCurrentAgentName] = useState<string>();

  // Fetch project data
  const { data: project, isLoading: projectLoading, error: projectError } = useProject(projectId);

  // Get the latest workflow execution for this project
  const latestWorkflowId = project?.workflowExecutions?.[0]?.id;

  // Fetch workflow execution
  const {
    data: workflowExecution,
    isLoading: workflowLoading,
    error: workflowError,
  } = useWorkflowExecution(latestWorkflowId);

  // Handle SSE events
  const handleSSEEvent = useCallback((event: SSEEvent) => {
    console.log('SSE Event:', event);

    // Update streaming/thinking states based on event type
    switch (event.type) {
      case SSEEventType.PARSER_STARTED:
      case SSEEventType.ANALYSIS_STARTED:
      case SSEEventType.CONTENT_STARTED:
      case SSEEventType.COMPLIANCE_STARTED:
      case SSEEventType.QA_STARTED:
      case SSEEventType.COMMS_STARTED:
      case SSEEventType.SUBMISSION_STARTED:
        setIsThinking(true);
        setCurrentAgentName(getAgentDisplayName(event.type));
        break;

      case SSEEventType.PARSER_COMPLETED:
      case SSEEventType.ANALYSIS_COMPLETED:
      case SSEEventType.CONTENT_COMPLETED:
      case SSEEventType.COMPLIANCE_COMPLETED:
      case SSEEventType.QA_COMPLETED:
      case SSEEventType.COMMS_COMPLETED:
      case SSEEventType.SUBMISSION_COMPLETED:
        setIsThinking(false);
        break;

      case SSEEventType.PARSER_FAILED:
      case SSEEventType.ANALYSIS_FAILED:
      case SSEEventType.CONTENT_FAILED:
      case SSEEventType.COMPLIANCE_FAILED:
      case SSEEventType.QA_FAILED:
      case SSEEventType.COMMS_FAILED:
      case SSEEventType.SUBMISSION_FAILED:
        setIsThinking(false);
        setIsStreaming(false);
        toast.error('Agent task failed', {
          description: (event.data as any)?.errorMessage || 'An error occurred',
        });
        break;

      case SSEEventType.AWAITING_FEEDBACK:
      case SSEEventType.AWAITING_REVIEW:
      case SSEEventType.REVIEW_PROMPT:
        setIsStreaming(false);
        setIsThinking(false);
        break;
    }

    // Add agent message to chat
    const agentMessage = formatSSEEventAsMessage(event);
    if (agentMessage) {
      setMessages((prev) => [...prev, agentMessage]);
    }
  }, []);

  // Connect to SSE stream
  const { isConnected, error: sseError } = useWorkflowStream({
    projectId,
    workflowExecutionId: latestWorkflowId,
    enabled: !!latestWorkflowId,
    onEvent: handleSSEEvent,
    onError: (error) => {
      toast.error('Connection lost', {
        description: error.message,
      });
    },
  });

  // Handle sending messages
  const handleSendMessage = useCallback(
    async (message: string) => {
      // Add user message to chat
      const userMessage: ChatMessageProps = {
        id: `msg-${Date.now()}`,
        type: 'user',
        content: message,
        timestamp: new Date(),
        status: 'sending',
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      try {
        // TODO: Send message to AgentCore via API route
        // const response = await fetch('/api/workflow-agents/invocations', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     projectId,
        //     userId: 'current-user-id',
        //     sessionId: latestWorkflowId,
        //     start: false,
        //     userInput: { chat: message },
        //   }),
        // });

        // Update message status
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id ? { ...msg, status: 'sent' as const } : msg
          )
        );
      } catch (error) {
        console.error('Failed to send message:', error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id ? { ...msg, status: 'error' as const } : msg
          )
        );
        setIsStreaming(false);
        toast.error('Failed to send message');
      }
    },
    [projectId, latestWorkflowId]
  );

  // Map workflow execution to progress steps
  const workflowSteps = useMemo<WorkflowStep[]>(() => {
    if (!workflowExecution) return [];

    const agentTasks = workflowExecution.agentTasks || [];

    return [
      {
        id: 'upload',
        label: 'Upload',
        status: 'COMPLETED',
        agent: 'SUPERVISOR',
      },
      {
        id: 'parsing',
        label: 'Parsing',
        status: agentTasks.find((t) => t.agent === 'PARSER')?.status || 'OPEN',
        agent: 'PARSER',
      },
      {
        id: 'analysis',
        label: 'Analysis',
        status: agentTasks.find((t) => t.agent === 'ANALYSIS')?.status || 'OPEN',
        agent: 'ANALYSIS',
      },
      {
        id: 'content',
        label: 'Content',
        status: agentTasks.find((t) => t.agent === 'CONTENT')?.status || 'OPEN',
        agent: 'CONTENT',
      },
      {
        id: 'compliance',
        label: 'Compliance',
        status: agentTasks.find((t) => t.agent === 'COMPLIANCE')?.status || 'OPEN',
        agent: 'COMPLIANCE',
      },
      {
        id: 'qa',
        label: 'QA',
        status: agentTasks.find((t) => t.agent === 'QA')?.status || 'OPEN',
        agent: 'QA',
      },
      {
        id: 'comms',
        label: 'Comms',
        status: agentTasks.find((t) => t.agent === 'COMMS')?.status || 'OPEN',
        agent: 'COMMS',
      },
      {
        id: 'bidding',
        label: 'Bidding',
        status: agentTasks.find((t) => t.agent === 'SUBMISSION')?.status || 'OPEN',
        agent: 'SUBMISSION',
      },
    ];
  }, [workflowExecution]);

  // Loading state
  if (projectLoading || workflowLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Error state
  if (projectError || workflowError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load project details. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Project not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/projects/all">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge
              variant={
                project.status === 'COMPLETED'
                  ? 'default'
                  : project.status === 'IN_PROGRESS'
                    ? 'secondary'
                    : 'outline'
              }
            >
              {project.status}
            </Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Created: {formatDate(project.createdAt)}</span>
            {project.deadline && <span>Deadline: {formatDate(project.deadline)}</span>}
            <span>Progress: {project.progressPercentage}%</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Manage Team
          </Button>
          {!workflowExecution && (
            <Button size="sm">
              <Play className="h-4 w-4 mr-2" />
              Start Workflow
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Workflow Progress */}
      {workflowExecution && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Workflow Progress</span>
              {isConnected ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500">
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                  Connecting...
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WorkflowProgress
              steps={workflowSteps}
              currentStep={getCurrentStepId(workflowSteps)}
              workflowStatus={workflowExecution.status}
            />
          </CardContent>
        </Card>
      )}

      {/* Agent Chat Interface */}
      <Card className="flex flex-col h-[600px]">
        <CardHeader>
          <CardTitle>Agent Console</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <AgentChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            isThinking={isThinking}
            currentAgentName={currentAgentName}
            disabled={!workflowExecution}
          />
        </CardContent>
      </Card>

      {sseError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{sseError.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Helper functions
function getAgentDisplayName(eventType: SSEEventType): string {
  const agentMap: Record<string, string> = {
    [SSEEventType.PARSER_STARTED]: 'Parser Agent',
    [SSEEventType.ANALYSIS_STARTED]: 'Analysis Agent',
    [SSEEventType.CONTENT_STARTED]: 'Content Agent',
    [SSEEventType.COMPLIANCE_STARTED]: 'Compliance Agent',
    [SSEEventType.QA_STARTED]: 'QA Agent',
    [SSEEventType.COMMS_STARTED]: 'Communications Agent',
    [SSEEventType.SUBMISSION_STARTED]: 'Submission Agent',
  };
  return agentMap[eventType] || 'AI Agent';
}

function formatSSEEventAsMessage(event: SSEEvent): ChatMessageProps | null {
  // Only create messages for specific event types
  const messageTypes = [
    SSEEventType.ANALYSIS_COMPLETED,
    SSEEventType.AWAITING_FEEDBACK,
    SSEEventType.AWAITING_REVIEW,
    SSEEventType.REVIEW_PROMPT,
    SSEEventType.COMMS_PERMISSION,
    SSEEventType.SUBMISSION_PERMISSION,
    SSEEventType.EMAIL_DRAFT,
  ];

  if (!messageTypes.includes(event.type)) {
    return null;
  }

  let content = '';
  switch (event.type) {
    case SSEEventType.ANALYSIS_COMPLETED:
      content = (event.data as any)?.analysisMarkdown || 'Analysis completed';
      break;
    case SSEEventType.AWAITING_FEEDBACK:
    case SSEEventType.AWAITING_REVIEW:
    case SSEEventType.REVIEW_PROMPT:
      content = (event.data as any)?.message || 'Awaiting your input';
      break;
    default:
      content = JSON.stringify(event.data, null, 2);
  }

  return {
    id: event.id || `event-${Date.now()}`,
    type: 'agent',
    content,
    timestamp: new Date(event.timestamp),
    agentName: getAgentDisplayName(event.type),
  };
}

function getCurrentStepId(steps: WorkflowStep[]): string | undefined {
  const inProgressStep = steps.find((s) => s.status === 'IN_PROGRESS');
  const waitingStep = steps.find((s) => s.status === 'WAITING');
  return inProgressStep?.id || waitingStep?.id || steps[steps.length - 1]?.id;
}