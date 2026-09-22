import type {
  ChatMessage,
  ToolResult,
} from '@/types';
import type { AIProviderManager } from '@/services/ai';
import { toolRegistry, isDangerousCommand } from '@/services/tools';
import type { ToolExecutionRecord } from '@/types';

export interface AgentStep {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'final' | 'error' | 'confirmation';
  content: string;
  toolName?: string;
  toolArgs?: unknown;
  toolResult?: string;
  toolSuccess?: boolean;
  requiresConfirmation?: boolean;
  timestamp: number;
}

export interface AgentLoopOptions {
  provider: AIProviderManager;
  messages: ChatMessage[];
  systemPrompt: string;
  maxIterations?: number;
  onStep?: (step: AgentStep) => void;
  onToolCall?: (record: ToolExecutionRecord) => void;
  onConfirmationRequest?: (
    toolName: string,
    toolArgs: unknown,
    description: string
  ) => Promise<boolean>;
  signal?: AbortSignal;
}

/**
 * The core agent loop.
 *
 * 1. User request → AI analyzes
 * 2. AI decides if a tool is needed → tool execution
 * 3. Tool result → returned to AI
 * 4. AI decides next action → repeat
 * 5. Final response
 */
export async function runAgentLoop(opts: AgentLoopOptions): Promise<{
  finalResponse: string;
  toolExecutions: ToolExecutionRecord[];
  steps: AgentStep[];
}> {
  const {
    provider,
    messages,
    systemPrompt,
    maxIterations = 10,
    onStep,
    onToolCall,
    onConfirmationRequest,
    signal,
  } = opts;

  const toolDefs = toolRegistry.getToolDefinitions();
  const toolExecutions: ToolExecutionRecord[] = [];
  const steps: AgentStep[] = [];
  const now = () => Date.now();

  // Build the conversation with system prompt
  const conversation: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  let iteration = 0;

  while (iteration < maxIterations) {
    if (signal?.aborted) {
      const step: AgentStep = {
        type: 'error',
        content: 'Task cancelled by user.',
        timestamp: now(),
      };
      steps.push(step);
      onStep?.(step);
      break;
    }

    iteration++;

    // Call the AI
    let aiResponse;
    try {
      aiResponse = await provider.chat(conversation, toolDefs);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const step: AgentStep = {
        type: 'error',
        content: `AI error: ${errorMsg}`,
        timestamp: now(),
      };
      steps.push(step);
      onStep?.(step);
      return { finalResponse: errorMsg, toolExecutions, steps };
    }

    // If the AI wants to call tools
    if (aiResponse.tool_calls && aiResponse.tool_calls.length > 0) {
      // Add the assistant message with tool calls to conversation
      conversation.push({
        role: 'assistant',
        content: aiResponse.content || '',
        tool_calls: aiResponse.tool_calls,
      });

      // Process each tool call
      for (const toolCall of aiResponse.tool_calls) {
        const toolName = toolCall.function.name;
        let toolArgs: unknown;
        try {
          toolArgs = JSON.parse(toolCall.function.arguments);
        } catch {
          toolArgs = {};
        }

        const tool = toolRegistry.get(toolName);
        const requiresConfirmation =
          tool?.requiresConfirmation ?? isDangerousCommand(
            typeof toolArgs === 'object' && toolArgs && 'command' in toolArgs
              ? String((toolArgs as { command: string }).command)
              : ''
          );

        // Confirmation step
        if (requiresConfirmation && onConfirmationRequest) {
          const step: AgentStep = {
            type: 'confirmation',
            content: `Confirmation required for: ${toolName}`,
            toolName,
            toolArgs,
            requiresConfirmation: true,
            timestamp: now(),
          };
          steps.push(step);
          onStep?.(step);

          const approved = await onConfirmationRequest(
            toolName,
            toolArgs,
            `The AI wants to execute: ${toolName}`
          );

          if (!approved) {
            const result: ToolResult = {
              success: false,
              output: '',
              error: 'User denied the tool execution.',
            };
            conversation.push({
              role: 'tool',
              content: JSON.stringify(result),
              tool_call_id: toolCall.id,
            });

            const record: ToolExecutionRecord = {
              toolName,
              category: toolRegistry.get(toolName) ? 'tool' : 'unknown',
              args: toolArgs,
              result: 'Denied by user',
              success: false,
              requiresConfirmation: true,
              confirmed: false,
              timestamp: now(),
            };
            toolExecutions.push(record);
            onToolCall?.(record);
            continue;
          }
        }

        // Tool call step
        const callStep: AgentStep = {
          type: 'tool_call',
          content: `Running: ${toolName}`,
          toolName,
          toolArgs,
          timestamp: now(),
        };
        steps.push(callStep);
        onStep?.(callStep);

        // Execute the tool
        const startTime = Date.now();
        const result = await toolRegistry.execute(toolName, toolArgs);
        const duration = Date.now() - startTime;

        // Tool result step
        const resultStep: AgentStep = {
          type: 'tool_result',
          content: result.success ? 'Tool completed' : `Tool failed: ${result.error ?? ''}`,
          toolName,
          toolResult: result.output,
          toolSuccess: result.success,
          timestamp: now(),
        };
        steps.push(resultStep);
        onStep?.(resultStep);

        // Record the tool execution
        const record: ToolExecutionRecord = {
          toolName,
          category: 'tool',
          args: toolArgs,
          result: result.output,
          success: result.success,
          duration,
          requiresConfirmation,
          confirmed: true,
          timestamp: now(),
        };
        toolExecutions.push(record);
        onToolCall?.(record);

        // Add tool result to conversation for the AI to analyze
        conversation.push({
          role: 'tool',
          content: JSON.stringify({
            success: result.success,
            output: result.output,
            error: result.error,
          }),
          tool_call_id: toolCall.id,
        });
      }

      // Continue the loop — AI will analyze tool results
      continue;
    }

    // No tool calls → this is the final response
    const finalStep: AgentStep = {
      type: 'final',
      content: aiResponse.content,
      timestamp: now(),
    };
    steps.push(finalStep);
    onStep?.(finalStep);

    return { finalResponse: aiResponse.content, toolExecutions, steps };
  }

  // Max iterations reached
  const step: AgentStep = {
    type: 'error',
    content: 'Maximum iterations reached. The task may not be complete.',
    timestamp: now(),
  };
  steps.push(step);
  onStep?.(step);

  return {
    finalResponse: 'I reached the maximum number of steps. The task may not be fully complete.',
    toolExecutions,
    steps,
  };
}
