'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';

interface AgentThinkingProps {
  agentName?: string;
}

export function AgentThinking({ agentName = 'AI Agent' }: AgentThinkingProps) {
  return (
    <div className="flex gap-3 p-4 rounded-lg bg-muted/50 border border-border">
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-primary/20">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      {/* Thinking Indicator */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{agentName}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span
              className="h-2 w-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: '0ms', animationDuration: '1s' }}
            />
            <span
              className="h-2 w-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: '200ms', animationDuration: '1s' }}
            />
            <span
              className="h-2 w-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: '400ms', animationDuration: '1s' }}
            />
          </div>
          <span className="text-sm text-muted-foreground">Thinking...</span>
        </div>
      </div>
    </div>
  );
}