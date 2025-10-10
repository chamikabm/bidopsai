/**
 * Agent Chat Types
 */

import { AgentType } from '../ProjectWorkflow/WorkflowProgress';

export interface ChatMessage {
  id: string;
  type: 'agent' | 'user' | 'system' | 'artifact' | 'email-draft';
  content: string | any;
  timestamp: Date;
  agentType?: AgentType | undefined;
  status?: 'sending' | 'sent' | 'failed' | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface SSEEvent {
  type: string;
  data: any;
  timestamp: string;
}
