'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { AgentThinking } from './AgentThinking';
import { ChatInput } from './ChatInput';
import { ChatMessage, ChatMessageProps } from './ChatMessage';
import { StreamingIndicator } from './StreamingIndicator';

interface AgentChatInterfaceProps {
  messages: ChatMessageProps[];
  onSendMessage: (message: string) => void;
  isStreaming?: boolean;
  isThinking?: boolean;
  currentAgentName?: string;
  className?: string;
  disabled?: boolean;
}

export function AgentChatInterface({
  messages,
  onSendMessage,
  isStreaming = false,
  isThinking = false,
  currentAgentName,
  className,
  disabled = false,
}: AgentChatInterfaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, isThinking]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4">
        <div ref={scrollAreaRef} className="space-y-4 py-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center py-12">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  No messages yet. Start the workflow to begin interacting with AI agents.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} {...message} />
              ))}

              {/* Show thinking indicator */}
              {isThinking && <AgentThinking agentName={currentAgentName} />}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4">
          {isStreaming && (
            <div className="mb-3">
              <StreamingIndicator />
            </div>
          )}
          <ChatInput
            onSend={onSendMessage}
            disabled={disabled}
            isStreaming={isStreaming}
            placeholder={
              disabled
                ? 'Workflow not started'
                : isStreaming
                  ? 'Waiting for agent response...'
                  : 'Type your message or feedback...'
            }
          />
        </div>
      </div>
    </div>
  );
}