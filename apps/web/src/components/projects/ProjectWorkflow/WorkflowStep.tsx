/**
 * WorkflowStep Component
 * Single step in the workflow progress bar
 */

'use client';

import { CheckCircle2, Circle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { AgentType, StepStatus } from './WorkflowProgress';
import { cn } from '@/lib/utils';

interface WorkflowStepProps {
  agent: AgentType;
  label: string;
  status: StepStatus;
  isActive: boolean;
  isLast: boolean;
}

export function WorkflowStep({ agent, label, status, isActive, isLast }: WorkflowStepProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'waiting':
        return <Clock className="h-6 w-6 text-orange-500" />;
      default:
        return <Circle className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'in_progress':
        return 'text-blue-500';
      case 'failed':
        return 'text-red-500';
      case 'waiting':
        return 'text-orange-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex flex-col items-center gap-1 min-w-0">
        <div
          className={cn(
            'transition-all duration-300',
            isActive && 'scale-110'
          )}
        >
          {getStatusIcon()}
        </div>
        <div className="text-center min-w-0">
          <p
            className={cn(
              'text-xs font-medium truncate',
              getStatusColor(),
              isActive && 'font-bold'
            )}
          >
            {label}
          </p>
        </div>
      </div>
      {!isLast && (
        <div
          className={cn(
            'h-0.5 flex-1 transition-colors duration-300',
            status === 'completed' ? 'bg-green-500' : 'bg-muted'
          )}
        />
      )}
    </div>
  );
}
