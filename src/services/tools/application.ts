import type { AgentTool, ToolResult } from '@/types';
import { ipcBridge } from '../ipc-bridge';

function parseArgs<T>(args: unknown): T {
  if (typeof args === 'string') {
    try {
      return JSON.parse(args);
    } catch {
      return {} as T;
    }
  }
  return (args ?? {}) as T;
}

export const openApplicationTool: AgentTool = {
  name: 'open_application',
  description:
    'Open an application on the user\'s PC. Examples: "VS Code" (code), "Chrome" (chrome), "Notepad" (notepad), "Windows Terminal" (wt).',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description:
          'The application name or executable. Examples: code, chrome, notepad, wt, explorer, calc',
      },
    },
    required: ['name'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { name } = parseArgs<{ name: string }>(args);
    if (!name) return { success: false, output: '', error: 'name is required' };
    const result = await ipcBridge.openApplication(name);
    if (!result.success) {
      return { success: false, output: '', error: result.error };
    }
    return { success: true, output: `Application opened: ${name}` };
  },
};

export const takeScreenshotTool: AgentTool = {
  name: 'take_screenshot',
  description:
    'Take a screenshot of the user\'s screen. Returns a base64-encoded image. The AI can inspect it if a vision-capable model is selected.',
  parameters: {
    type: 'object',
    properties: {},
  },
  async execute(): Promise<ToolResult> {
    const result = await ipcBridge.takeScreenshot();
    if (!result.success) {
      return { success: false, output: '', error: result.error };
    }
    return {
      success: true,
      output: 'Screenshot captured successfully.',
      data: { image: result.data },
    };
  },
};

export const openUrlTool: AgentTool = {
  name: 'open_url',
  description: 'Open a URL in the user\'s default browser.',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'The URL to open.' },
    },
    required: ['url'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { url } = parseArgs<{ url: string }>(args);
    if (!url) return { success: false, output: '', error: 'url is required' };
    const result = await ipcBridge.openUrl(url);
    if (!result.success) {
      return { success: false, output: '', error: result.error };
    }
    return { success: true, output: `Opened URL: ${url}` };
  },
};

export const applicationTools: AgentTool[] = [
  openApplicationTool,
  takeScreenshotTool,
  openUrlTool,
];
