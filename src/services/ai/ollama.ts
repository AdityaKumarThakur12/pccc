import type { AIProvider, AIResponse, ChatMessage, ToolDefinition } from '@/types';
import { getOllamaBaseUrl } from '@/services/ollama-connection';

/**
 * OllamaProvider - communicates with a local Ollama server.
 * No API key required. All processing is local.
 * Uses the Vite proxy in browser mode to avoid CORS.
 */
export class OllamaProvider implements AIProvider {
  constructor(private baseUrl: string = 'http://localhost:11434') {}

  private get apiUrl(): string {
    return `${getOllamaBaseUrl(this.baseUrl)}/api`;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.apiUrl}/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const resp = await fetch(`${this.apiUrl}/tags`);
      if (!resp.ok) return [];
      const data = await resp.json();
      return (data.models ?? []).map((m: { name: string }) => m.name);
    } catch {
      return [];
    }
  }

  async chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[]
  ): Promise<AIResponse> {
    const ollamaMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const body: Record<string, unknown> = {
      model: '',
      messages: ollamaMessages,
      stream: false,
      options: { temperature: 0.2 },
    };

    if (tools && tools.length > 0) {
      body.tools = tools.map((t) => ({
        type: 'function',
        function: {
          name: t.function.name,
          description: t.function.description,
          parameters: t.function.parameters,
        },
      }));
    }

    const resp = await fetch(`${this.apiUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(120000),
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => 'Unknown error');
      throw new Error(`Ollama chat failed (${resp.status}): ${errText}`);
    }

    const data = await resp.json();

    return {
      content: data.message?.content ?? '',
      tool_calls: data.message?.tool_calls,
      done: true,
    };
  }
}

/**
 * Chat with a specific model and streaming support.
 * Returns an async generator for streaming responses.
 */
export async function* streamChat(
  baseUrl: string,
  model: string,
  messages: ChatMessage[],
  temperature: number = 0.2
): AsyncGenerator<string> {
  const url = `${getOllamaBaseUrl(baseUrl)}/api/chat`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(120000),
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
      options: { temperature },
    }),
  });

  if (!resp.ok || !resp.body) {
    throw new Error(`Ollama stream failed (${resp.status})`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        if (json.message?.content) {
          yield json.message.content;
        }
      } catch {
        // skip malformed lines
      }
    }
  }
}
