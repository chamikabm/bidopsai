/**
 * StreamingIndicator Component
 * Animated dots while agent is streaming
 */

'use client';

export function StreamingIndicator() {
  return (
    <div className="flex items-center gap-1 p-4">
      <div className="flex gap-1">
        <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
      </div>
      <span className="text-sm text-muted-foreground ml-2">Agent is typing...</span>
    </div>
  );
}
