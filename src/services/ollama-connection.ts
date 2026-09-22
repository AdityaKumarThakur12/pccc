/**
 * Shared Ollama connection helper.
 * Connects directly to the user's local Ollama server.
 *
 * IMPORTANT: For this to work in the browser, Ollama must be started with
 * OLLAMA_ORIGINS=* to allow cross-origin requests:
 *
 *   Windows (PowerShell):
 *     $env:OLLAMA_ORIGINS="*"; ollama serve
 *
 *   Windows (CMD):
 *     set OLLAMA_ORIGINS=* && ollama serve
 *
 * In Electron mode, requests go through IPC (no CORS issue).
 */
import { ipcBridge } from './ipc-bridge';

const isElectron = typeof window !== 'undefined' && 'electron' in window;

/**
 * Returns the base URL for Ollama API calls.
 * Always uses the raw user-configured URL.
 */
export function getOllamaBaseUrl(rawUrl: string): string {
  return rawUrl.replace(/\/$/, '');
}

/**
 * Check if Ollama is reachable and fetch available models.
 * Returns { connected, models }.
 */
export async function checkOllamaConnection(
  rawUrl: string
): Promise<{ connected: boolean; models: string[] }> {
  // Try IPC first (Electron mode)
  if (isElectron) {
    try {
      const available = await ipcBridge.checkOllama(rawUrl);
      if (available.success && available.data) {
        const modelsResult = await ipcBridge.getOllamaModels(rawUrl);
        return {
          connected: true,
          models: modelsResult.success ? modelsResult.data ?? [] : [],
        };
      }
      return { connected: false, models: [] };
    } catch {
      // Fall through to direct fetch
    }
  }

  // Direct fetch to the user's Ollama server
  const baseUrl = getOllamaBaseUrl(rawUrl);
  try {
    const resp = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(8000),
    });
    if (resp.ok) {
      const data = await resp.json();
      const models = (data.models ?? []).map((m: { name: string }) => m.name);
      return { connected: true, models };
    }
    return { connected: false, models: [] };
  } catch {
    return { connected: false, models: [] };
  }
}

/**
 * Fetch available models from Ollama.
 */
export async function fetchOllamaModels(
  rawUrl: string
): Promise<string[]> {
  if (isElectron) {
    try {
      const result = await ipcBridge.getOllamaModels(rawUrl);
      return result.success ? result.data ?? [] : [];
    } catch {
      return [];
    }
  }

  const baseUrl = getOllamaBaseUrl(rawUrl);
  try {
    const resp = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.models ?? []).map((m: { name: string }) => m.name);
  } catch {
    return [];
  }
}
