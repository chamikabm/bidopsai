/**
 * AgentThinking Component
 * Visual indicator when agent is processing
 */

'use client';

import { Brain, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AgentThinkingProps {
  agentType?: string;
  message?: string;
}

export function AgentThinking({ agentType, message }: AgentThinkingProps) {
  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Brain className="h-6 w-6 text-blue-500" />
          <Loader2 className="h-3 w-3 text-blue-500 animate-spin absolute -top-1 -right-1" />
        </div>
        <div>
          <p className="font-medium text-sm">
            {agentType ? `${agentType} Agent` : 'Agent'} is thinking...
          </p>
          {message && (
            <p className="text-xs text-muted-foreground mt-1">{message}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
