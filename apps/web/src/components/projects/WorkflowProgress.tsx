'use client';

import { CheckCircle2, Circle, Clock, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowStatus, AgentTaskStatus } from '@/types/workflow.types';

interface WorkflowStep {
  id: string;
  name: string;
  status: AgentTaskStatus;
  description: string;
}

interface WorkflowProgressProps {
  steps: WorkflowStep[];
  currentStep?: string;
  workflowStatus: WorkflowStatus;
}

/**
 * Workflow Progress Component
 * 
 * Displays the 8-step workflow progress for bid automation:
 * 1. Document Upload
 * 2. Document Parsing
 * 3. Analysis
 * 4. Content Generation
 * 5. Compliance Check
 * 6. Quality Assurance
 * 7. Communications
 * 8. Bidding/Submission
 */
export function WorkflowProgress({
  steps,
  currentStep,
  workflowStatus,
}: WorkflowProgressProps) {
  const getStepIcon = (status: AgentTaskStatus, isCurrentStep: boolean) => {
    const iconClass = 'h-5 w-5';

    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className={cn(iconClass, 'text-green-500')} />;
      case 'IN_PROGRESS':
        return <Loader2 className={cn(iconClass, 'text-blue-500 animate-spin')} />;
      case 'WAITING':
        return <Clock className={cn(iconClass, 'text-yellow-500')} />;
      case 'FAILED':
        return <XCircle className={cn(iconClass, 'text-red-500')} />;
      case 'OPEN':
      default:
        return (
          <Circle
            className={cn(
              iconClass,
              isCurrentStep ? 'text-muted-foreground' : 'text-muted-foreground/40'
            )}
          />
        );
    }
  };

  const getStepColor = (status: AgentTaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'border-green-500 bg-green-500/10';
      case 'IN_PROGRESS':
        return 'border-blue-500 bg-blue-500/10';
      case 'WAITING':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'FAILED':
        return 'border-red-500 bg-red-500/10';
      case 'OPEN':
      default:
        return 'border-muted bg-muted/20';
    }
  };

  return (
    <div className="w-full">
      {/* Progress Bar Container */}
      <div className="relative">
        {/* Background Line */}
        <div className="absolute top-8 left-0 right-0 h-0.5 bg-muted" />

        {/* Progress Line */}
        <div
          className="absolute top-8 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{
            width: `${(steps.filter((s) => s.status === 'COMPLETED').length / steps.length) * 100}%`,
          }}
        />

        {/* Steps */}
        <div className="relative grid grid-cols-8 gap-2">
          {steps.map((step) => {
            const isCurrentStep = step.id === currentStep;
            const isActive = step.status !== 'OPEN';

            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Step Icon/Badge */}
                <div
                  className={cn(
                    'relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all duration-300',
                    getStepColor(step.status),
                    isCurrentStep && 'ring-2 ring-primary ring-offset-2'
                  )}
                >
                  {getStepIcon(step.status, isCurrentStep)}
                </div>

                {/* Step Label */}
                <div className="mt-3 text-center">
                  <p
                    className={cn(
                      'text-xs font-medium transition-colors',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.name}
                  </p>
                  {step.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Status Badge */}
                {step.status !== 'OPEN' && (
                  <div className="mt-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                        step.status === 'COMPLETED' && 'bg-green-500/10 text-green-700 dark:text-green-400',
                        step.status === 'IN_PROGRESS' && 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
                        step.status === 'WAITING' && 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
                        step.status === 'FAILED' && 'bg-red-500/10 text-red-700 dark:text-red-400'
                      )}
                    >
                      {step.status.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall Workflow Status */}
      <div className="mt-8 flex items-center justify-between rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          {workflowStatus === 'COMPLETED' && (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">Workflow Completed</span>
            </>
          )}
          {workflowStatus === 'IN_PROGRESS' && (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <span className="font-medium">Workflow In Progress</span>
            </>
          )}
          {workflowStatus === 'WAITING' && (
            <>
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">Awaiting User Input</span>
            </>
          )}
          {workflowStatus === 'FAILED' && (
            <>
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="font-medium">Workflow Failed</span>
            </>
          )}
          {workflowStatus === 'OPEN' && (
            <>
              <Circle className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Workflow Ready</span>
            </>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          {steps.filter((s) => s.status === 'COMPLETED').length} of {steps.length} steps completed
        </div>
      </div>
    </div>
  );
}