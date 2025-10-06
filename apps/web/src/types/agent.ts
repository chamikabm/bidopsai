/**
 * Agent Configuration Types
 */

export enum AgentType {
  SUPERVISOR = 'SUPERVISOR',
  PARSER = 'PARSER',
  ANALYSIS = 'ANALYSIS',
  CONTENT = 'CONTENT',
  KNOWLEDGE = 'KNOWLEDGE',
  COMPLIANCE = 'COMPLIANCE',
  QA = 'QA',
  COMMS = 'COMMS',
  SUBMISSION = 'SUBMISSION',
}

export interface AgentConfiguration {
  id: string;
  agentType: AgentType;
  modelName: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  additionalParameters?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentConfigInput {
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  additionalParameters?: Record<string, any>;
}

export const AGENT_METADATA: Record<
  AgentType,
  {
    label: string;
    description: string;
    icon: string;
  }
> = {
  [AgentType.SUPERVISOR]: {
    label: 'Supervisor',
    description: 'Orchestrates the entire workflow and coordinates all agents',
    icon: '🎯',
  },
  [AgentType.PARSER]: {
    label: 'Parser',
    description: 'Processes and extracts data from uploaded documents',
    icon: '📄',
  },
  [AgentType.ANALYSIS]: {
    label: 'Analysis',
    description: 'Analyzes requirements and generates comprehensive analysis',
    icon: '🔍',
  },
  [AgentType.CONTENT]: {
    label: 'Content',
    description: 'Generates bid content and artifacts',
    icon: '✍️',
  },
  [AgentType.KNOWLEDGE]: {
    label: 'Knowledge',
    description: 'Queries knowledge bases for relevant information',
    icon: '📚',
  },
  [AgentType.COMPLIANCE]: {
    label: 'Compliance',
    description: 'Verifies content against compliance standards',
    icon: '✅',
  },
  [AgentType.QA]: {
    label: 'Quality Assurance',
    description: 'Reviews artifacts for quality and completeness',
    icon: '🎓',
  },
  [AgentType.COMMS]: {
    label: 'Communications',
    description: 'Handles stakeholder notifications and communications',
    icon: '📢',
  },
  [AgentType.SUBMISSION]: {
    label: 'Submission',
    description: 'Manages final bid submission and delivery',
    icon: '🚀',
  },
};

export const AI_MODELS = [
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];
