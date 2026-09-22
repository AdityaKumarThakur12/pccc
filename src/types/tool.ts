import { ToolDefinition } from './ai';

export interface ToolResult {
  success: boolean;
  output: string;
  data?: unknown;
  error?: string;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: object;
  execute(args: unknown): Promise<ToolResult>;
  requiresConfirmation?: boolean;
}

export interface ToolDefinitionMap {
  [key: string]: ToolDefinition;
}

export type ToolCategory =
  | 'filesystem'
  | 'terminal'
  | 'application'
  | 'screenshot'
  | 'browser'
  | 'git'
  | 'project'
  | 'search';

export interface ToolMetadata {
  name: string;
  category: ToolCategory;
  requiresConfirmation: boolean;
  description: string;
}
