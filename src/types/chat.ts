// Chat and conversation types

export type MessageSender = 'user' | 'assistant' | 'tool' | 'system';
export type MessageStatus = 'complete' | 'loading' | 'error' | 'streaming';

export interface ToolExecutionRecord {
  toolName: string;
  category: string;
  args: unknown;
  result?: string;
  success?: boolean;
  duration?: number;
  requiresConfirmation?: boolean;
  confirmed?: boolean;
  timestamp: number;
}

export interface ChatMessageItem {
  id: string;
  sender: MessageSender;
  content: string;
  status: MessageStatus;
  timestamp: number;
  toolCalls?: ToolExecutionRecord[];
  error?: string;
  metadata?: {
    isMarkdown?: boolean;
    isStreaming?: boolean;
  toolName?: string;
  toolCategory?: string;
    toolResult?: string;
    toolSuccess?: boolean;
    requiresConfirmation?: boolean;
    confirmed?: boolean;
  };
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessageItem[];
  pinned?: boolean;
}

export interface ActivityEntry {
  id: string;
  timestamp: number;
  toolName: string;
  category: string;
  description: string;
  args?: unknown;
  result?: string;
  success: boolean;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'paused';
export type TaskStepStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface TaskStep {
  id: string;
  label: string;
  status: TaskStepStatus;
}

export interface Task {
  id: string;
  title: string;
  steps: TaskStep[];
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  conversationId?: string;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  type: string;
  packageManager?: string;
  backend?: string;
  gitRepository?: boolean;
  gitBranch?: string;
  lastOpened?: number;
}
