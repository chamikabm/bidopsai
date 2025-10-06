/**
 * AgentChatInterface Component
 * Main chat interface with SSE streaming support
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { StreamingIndicator } from './StreamingIndicator';
import { AgentThinking } from './AgentThinking';
import { ChatMessage as ChatMessageType, SSEEvent } from './types';
import { useToast } from '@/hooks/use-toast';

interface AgentChatInterfaceProps {
  projectId: string;
  sessionId: string;
  onWorkflowStart?: () => void;
}

export function AgentChatInterface({
  projectId,
  sessionId,
  onWorkflowStart,
}: AgentChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Connect to SSE stream
  useEffect(() => {
    const connectSSE = () => {
      const eventSource = new EventSource(
        `/api/workflow-agents/stream?projectId=${projectId}&sessionId=${sessionId}`
      );

      eventSource.onopen = () => {
        // SSE connection established
      };

      eventSource.onmessage = (event) => {
        try {
          const sseEvent: SSEEvent = JSON.parse(event.data);
          handleSSEEvent(sseEvent);
        } catch (error) {
          console.error('Failed to parse SSE event:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        eventSource.close();
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (eventSourceRef.current === eventSource) {
            connectSSE();
          }
        }, 5000);
      };

      eventSourceRef.current = eventSource;
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, sessionId]);

  const handleSSEEvent = (event: SSEEvent) => {
    // Handle different event types
    if (event.type.includes('_started')) {
      const agent = event.type.replace('_started', '').toUpperCase();
      setCurrentAgent(agent);
      setIsProcessing(true);
      addSystemMessage(`${agent} agent has started processing...`);
    } else if (event.type.includes('_completed')) {
      const agent = event.type.replace('_completed', '').toUpperCase();
      setIsProcessing(false);
      addSystemMessage(`${agent} agent has completed processing.`);
    } else if (event.type.includes('_failed')) {
      const agent = event.type.replace('_failed', '').toUpperCase();
      setIsProcessing(false);
      addSystemMessage(`${agent} agent encountered an error.`, 'error');
    } else if (event.type === 'awaiting_feedback') {
      setIsStreaming(false);
      setIsProcessing(false);
      addAgentMessage(event.data.content, event.data.agent);
    } else if (event.type === 'workflow_completed') {
      setIsProcessing(false);
      addSystemMessage('Workflow completed successfully!', 'success');
    }
  };

  const addSystemMessage = (content: string, variant?: 'success' | 'error') => {
    const message: ChatMessageType = {
      id: `system-${Date.now()}`,
      type: 'system',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);

    if (variant === 'error') {
      toast({
        title: 'Error',
        description: content,
        variant: 'destructive',
      });
    }
  };

  const addAgentMessage = (content: string, agentType?: string) => {
    const message: ChatMessageType = {
      id: `agent-${Date.now()}`,
      type: 'agent',
      content,
      timestamp: new Date(),
      agentType: agentType ? (agentType as ChatMessageType['agentType']) : undefined,
    };
    setMessages((prev) => [...prev, message]);
  };

  const handleSendMessage = async (content: string) => {
    // Add user message to chat
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date(),
      status: 'sending',
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Send message to backend
      const response = await fetch('/api/workflow-agents/invocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          sessionId,
          userInput: content,
          start: messages.length === 0, // Start workflow if first message
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Update message status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );

      setIsStreaming(true);

      if (messages.length === 0 && onWorkflowStart) {
        onWorkflowStart();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update message status to failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'failed' } : msg
        )
      );

      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 md:pb-6">
        <CardTitle className="text-lg md:text-xl">Agent Workflow</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 md:gap-4 min-h-0 p-3 md:p-6">
        <ScrollArea className="flex-1 pr-2 md:pr-4" ref={scrollRef}>
          <div className="space-y-3 md:space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 md:py-12 text-muted-foreground px-4">
                <p className="text-sm md:text-base">Start the workflow by sending a message below.</p>
              </div>
            )}
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isProcessing && currentAgent && (
              <AgentThinking agentType={currentAgent} />
            )}
            {isStreaming && <StreamingIndicator />}
          </div>
        </ScrollArea>

        <div className="border-t pt-3 md:pt-4">
          <ChatInput
            onSend={handleSendMessage}
            disabled={isStreaming || isProcessing}
            placeholder={
              isStreaming || isProcessing
                ? 'Waiting for agent response...'
                : 'Type your message...'
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
