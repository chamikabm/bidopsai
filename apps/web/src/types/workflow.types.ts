// Workflow status enum
export enum WorkflowStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  WAITING = "WAITING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

// Agent task status enum
export enum AgentTaskStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  WAITING = "WAITING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

// Agent type enum
export enum AgentType {
  SUPERVISOR = "SUPERVISOR",
  PARSER = "PARSER",
  ANALYSIS = "ANALYSIS",
  CONTENT = "CONTENT",
  KNOWLEDGE = "KNOWLEDGE",
  COMPLIANCE = "COMPLIANCE",
  QA = "QA",
  COMMS = "COMMS",
  SUBMISSION = "SUBMISSION",
}

// Workflow execution entity
export interface WorkflowExecution {
  id: string;
  projectId: string;
  status: WorkflowStatus;
  initiatedBy: string;
  handledBy?: string;
  completedBy?: string;
  startedAt: string;
  completedAt?: string;
  lastUpdatedAt: string;
  workflowConfig?: Record<string, unknown>;
  errorLog?: Record<string, unknown>;
  errorMessage?: string;
  results?: Record<string, unknown>;
  agentTasks: AgentTask[];
}

// Agent task entity
export interface AgentTask {
  id: string;
  workflowExecutionId: string;
  initiatedBy: string;
  handledBy?: string;
  completedBy?: string;
  agent: AgentType;
  status: AgentTaskStatus;
  sequenceOrder: number;
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  taskConfig?: Record<string, unknown>;
  errorLog?: Record<string, unknown>;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  executionTimeSeconds?: number;
}

// Agent configuration entity
export interface AgentConfiguration {
  id: string;
  agentType: AgentType;
  modelName: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: Record<string, unknown>;
  additionalParameters?: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

// Workflow step for UI display
export interface WorkflowStep {
  id: string;
  name: string;
  status: AgentTaskStatus;
  description: string;
}