import { ipcMain } from 'electron';

export function registerOllamaHandlers(): void {
  ipcMain.handle('ollama:check', async (_event, url: string) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(`${url.replace(/\/$/, '')}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return { success: true, data: resp.ok };
    } catch {
      return { success: true, data: false };
    }
  });

  ipcMain.handle('ollama:models', async (_event, url: string) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(`${url.replace(/\/$/, '')}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!resp.ok) return { success: false, error: `HTTP ${resp.status}` };
      const data = await resp.json() as { models?: { name: string }[] };
      const models = (data.models ?? []).map((m) => m.name);
      return { success: true, data: models };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });
}
