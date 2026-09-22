import type { AIProvider, AIResponse, ChatMessage, ToolDefinition } from '@/types';
import { OllamaProvider } from './ollama';
import { getOllamaBaseUrl } from '@/services/ollama-connection';

const isElectron = typeof window !== 'undefined' && 'electron' in window;

/**
 * Manages AI providers. Currently only Ollama is supported,
 * but the abstraction allows adding more providers later.
 */
export class AIProviderManager {
  private provider: AIProvider;
  private model: string;
  private temperature: number;
  private ollamaUrl: string;

  constructor(opts: {
    provider?: string;
    ollamaUrl?: string;
    model?: string;
    temperature?: number;
  }) {
    this.ollamaUrl = opts.ollamaUrl ?? 'http://localhost:11434';
    this.model = opts.model ?? 'llama3.1';
    this.temperature = opts.temperature ?? 0.2;
    this.provider = new OllamaProvider(this.ollamaUrl);
  }

  setModel(model: string) {
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }

  setTemperature(temp: number) {
    this.temperature = temp;
  }

  setOllamaUrl(url: string) {
    this.ollamaUrl = url;
    this.provider = new OllamaProvider(url);
  }

  getProvider(): AIProvider {
    return this.provider;
  }

  async isAvailable(): Promise<boolean> {
    return this.provider.isAvailable();
  }

  async getModels(): Promise<string[]> {
    return this.provider.getModels();
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
      model: this.model,
      messages: ollamaMessages,
      stream: false,
      options: { temperature: this.temperature },
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

    // In browser mode, use the Vite proxy to avoid CORS.
    // In Electron mode, use the raw Ollama URL.
    const baseUrl = getOllamaBaseUrl(this.ollamaUrl);

    const resp = await fetch(`${baseUrl}/api/chat`, {
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
