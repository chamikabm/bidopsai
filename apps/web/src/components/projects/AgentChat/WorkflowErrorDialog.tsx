'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, SkipForward, RotateCcw, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AgentType } from '@/types/sse';

interface WorkflowErrorDialogProps {
  open: boolean;
  agent: AgentType;
  error: string;
  errorCode: string;
  canRetry?: boolean;
  canSkip?: boolean;
  canRestart?: boolean;
  onRetry?: () => void;
  onSkip?: () => void;
  onRestart?: () => void;
  onClose?: () => void;
}

export function WorkflowErrorDialog({
  open,
  agent,
  error,
  errorCode,
  canRetry = true,
  canSkip = false,
  canRestart = false,
  onRetry,
  onSkip,
  onRestart,
  onClose,
}: WorkflowErrorDialogProps) {
  const getAgentDisplayName = (agent: AgentType): string => {
    return agent.charAt(0) + agent.slice(1).toLowerCase();
  };

  const getErrorGuidance = (agent: AgentType, _errorCode: string): string => {
    // Provide specific guidance based on agent and error code
    if (agent === AgentType.PARSER) {
      return 'The document parsing process encountered an issue. This might be due to unsupported file formats or corrupted files. Please check your uploaded documents.';
    }

    if (agent === AgentType.ANALYSIS) {
      return 'The analysis process failed. This might be due to insufficient information in the documents or connectivity issues.';
    }

    if (agent === AgentType.CONTENT) {
      return 'Content generation failed. This might be due to AI service limitations or insufficient context from the analysis.';
    }

    if (agent === AgentType.COMPLIANCE || agent === AgentType.QA) {
      return 'The review process encountered an issue. You can skip this step if needed, but it\'s recommended to retry first.';
    }

    if (agent === AgentType.SUBMISSION) {
      return 'The submission process failed. Please verify the recipient information and try again.';
    }

    return 'An unexpected error occurred during the workflow execution.';
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && onClose) {
      onClose();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>
              {getAgentDisplayName(agent)} Agent Error
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">{error}</p>
              {errorCode && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Error Code: {errorCode}
                </p>
              )}
            </div>
            <p className="text-sm">{getErrorGuidance(agent, errorCode)}</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          {onClose && (
            <AlertDialogCancel onClick={onClose} className="sm:flex-1">
              <X className="mr-2 h-4 w-4" />
              Close
            </AlertDialogCancel>
          )}
          {canSkip && onSkip && (
            <Button
              onClick={onSkip}
              variant="outline"
              className="sm:flex-1"
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Skip Step
            </Button>
          )}
          {canRestart && onRestart && (
            <Button
              onClick={onRestart}
              variant="outline"
              className="sm:flex-1"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restart Workflow
            </Button>
          )}
          {canRetry && onRetry && (
            <AlertDialogAction onClick={onRetry} className="sm:flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
