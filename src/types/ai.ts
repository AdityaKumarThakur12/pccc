// Core AI types shared across providers

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: object;
  };
}

export interface AIResponse {
  content: string;
  tool_calls?: ToolCall[];
  done: boolean;
}

export interface AIProvider {
  chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<AIResponse>;
  getModels(): Promise<string[]>;
  isAvailable(): Promise<boolean>;
}
