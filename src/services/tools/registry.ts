import type { AgentTool, ToolDefinition, ToolResult } from '@/types';

/**
 * Centralized tool registry. Tools register themselves here,
 * and the agent loop uses this to look up and execute tools.
 */
export class ToolRegistry {
  private tools = new Map<string, AgentTool>();

  register(tool: AgentTool) {
    this.tools.set(tool.name, tool);
  }

  unregister(name: string) {
    this.tools.delete(name);
  }

  get(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  getAll(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Returns tool definitions in the format the AI provider expects.
   */
  getToolDefinitions(): ToolDefinition[] {
    return this.getAll().map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  async execute(name: string, args: unknown): Promise<ToolResult> {
    const tool = this.get(name);
    if (!tool) {
      return {
        success: false,
        output: '',
        error: `Unknown tool: ${name}`,
      };
    }
    try {
      return await tool.execute(args);
    } catch (err) {
      return {
        success: false,
        output: '',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  requiresConfirmation(name: string): boolean {
    const tool = this.get(name);
    return tool?.requiresConfirmation ?? false;
  }
}

export const toolRegistry = new ToolRegistry();
