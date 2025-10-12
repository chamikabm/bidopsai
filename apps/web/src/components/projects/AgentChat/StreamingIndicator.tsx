'use client';

import { cn } from '@/lib/utils';

interface StreamingIndicatorProps {
  className?: string;
}

export function StreamingIndicator({ className }: StreamingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex gap-1">
        <span
          className="h-2 w-2 rounded-full bg-primary animate-pulse"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="h-2 w-2 rounded-full bg-primary animate-pulse"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="h-2 w-2 rounded-full bg-primary animate-pulse"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <span className="text-xs text-muted-foreground">Agent is responding...</span>
    </div>
  );
}