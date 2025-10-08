'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/utils/date';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export interface ChatMessageProps {
  id: string;
  type: 'agent' | 'user';
  content: string;
  timestamp: Date;
  agentName?: string;
  userName?: string;
  userAvatar?: string;
  status?: 'sending' | 'sent' | 'error';
}

export function ChatMessage({
  type,
  content,
  timestamp,
  agentName,
  userName,
  userAvatar,
  status = 'sent',
}: ChatMessageProps) {
  const isAgent = type === 'agent';

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg transition-colors',
        isAgent
          ? 'bg-muted/50 border border-border'
          : 'bg-primary/5 border border-primary/20'
      )}
    >
      {/* Avatar */}
      <Avatar className={cn('h-8 w-8 flex-shrink-0', isAgent && 'ring-2 ring-primary/20')}>
        {isAgent ? (
          <>
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="bg-muted">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">
            {isAgent ? agentName || 'AI Agent' : userName || 'You'}
          </span>
          {isAgent && (
            <Badge variant="outline" className="text-xs">
              AI
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(timestamp)}
          </span>
          {status === 'sending' && (
            <Badge variant="secondary" className="text-xs">
              Sending...
            </Badge>
          )}
          {status === 'error' && (
            <Badge variant="destructive" className="text-xs">
              Failed
            </Badge>
          )}
        </div>

        {/* Message Body */}
        <div
          className={cn(
            'text-sm leading-relaxed prose prose-sm max-w-none',
            'prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2',
            'prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
            'dark:prose-invert'
          )}
        >
          {isAgent ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
}