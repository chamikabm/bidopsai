/**
 * WorkflowStepIndicator Component
 * Animated status indicator for workflow steps
 */

'use client';

import { StepStatus } from './WorkflowProgress';
import { cn } from '@/lib/utils';

interface WorkflowStepIndicatorProps {
  status: StepStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function WorkflowStepIndicator({ status, size = 'md' }: WorkflowStepIndicatorProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const getStatusClasses = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500 animate-pulse';
      case 'failed':
        return 'bg-red-500';
      case 'waiting':
        return 'bg-orange-500 animate-pulse';
      default:
        return 'bg-muted-foreground';
    }
  };

  return (
    <div
      className={cn(
        'rounded-full',
        sizeClasses[size],
        getStatusClasses()
      )}
    />
  );
}
