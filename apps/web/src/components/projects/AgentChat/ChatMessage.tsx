/**
 * ChatMessage Component
 * Single message in the chat interface
 */

'use client';

import { Bot, User, Info } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChatMessage as ChatMessageType } from './types';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
}

const agentColors: Record<string, string> = {
  PARSER: 'bg-blue-500',
  ANALYSIS: 'bg-purple-500',
  CONTENT: 'bg-green-500',
  COMPLIANCE: 'bg-yellow-500',
  QA: 'bg-orange-500',
  COMMS: 'bg-pink-500',
  SUBMISSION: 'bg-indigo-500',
  SUPERVISOR: 'bg-red-500',
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isAgent = message.type === 'agent';
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  const getAgentIcon = () => {
    if (isUser) {
      return <User className="h-4 w-4" />;
    }
    if (isSystem) {
      return <Info className="h-4 w-4" />;
    }
    return <Bot className="h-4 w-4" />;
  };

  const getAgentColor = () => {
    if (message.agentType) {
      return agentColors[message.agentType] || 'bg-gray-500';
    }
    return 'bg-gray-500';
  };

  return (
    <div
      className={cn(
        'flex gap-2 md:gap-3 p-3 md:p-4 rounded-lg',
        isUser ? 'bg-primary/5 ml-8 md:ml-12' : 'bg-muted/50',
        isSystem && 'bg-blue-50 dark:bg-blue-950/20'
      )}
    >
      <Avatar className={cn('h-8 w-8 md:h-10 md:w-10 shrink-0', isAgent && getAgentColor())}>
        <AvatarFallback className={cn(isAgent && 'text-white')}>
          {getAgentIcon()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {message.agentType && (
            <Badge variant="secondary" className="text-xs">
              {message.agentType}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          {message.status === 'sending' && (
            <Badge variant="outline" className="text-xs">
              Sending...
            </Badge>
          )}
          {message.status === 'failed' && (
            <Badge variant="destructive" className="text-xs">
              Failed
            </Badge>
          )}
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none text-sm md:text-base">
          {typeof message.content === 'string' ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="overflow-x-auto">{JSON.stringify(message.content, null, 2)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
