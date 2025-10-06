/**
 * WorkflowProgress Component
 * 8-step progress bar for agent workflow
 */

'use client';

import { WorkflowStep } from './WorkflowStep';

export type AgentType =
  | 'PARSER'
  | 'ANALYSIS'
  | 'CONTENT'
  | 'COMPLIANCE'
  | 'QA'
  | 'COMMS'
  | 'SUBMISSION';

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'waiting';

export interface WorkflowStepData {
  agent: AgentType;
  label: string;
  status: StepStatus;
}

interface WorkflowProgressProps {
  steps: WorkflowStepData[];
  currentStep?: AgentType;
}

const stepLabels: Record<AgentType, string> = {
  PARSER: 'Document Parsing',
  ANALYSIS: 'Analysis',
  CONTENT: 'Content Generation',
  COMPLIANCE: 'Compliance Check',
  QA: 'Quality Assurance',
  COMMS: 'Communications',
  SUBMISSION: 'Submission',
};

export function WorkflowProgress({ steps, currentStep }: WorkflowProgressProps) {
  return (
    <div className="w-full bg-card border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {steps.map((step, index) => (
            <WorkflowStep
              key={step.agent}
              agent={step.agent}
              label={step.label}
              status={step.status}
              isActive={currentStep === step.agent}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
