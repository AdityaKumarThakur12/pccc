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

export const detectProjectTool: AgentTool = {
  name: 'detect_project',
  description:
    'Detect the project type at a given path by examining config files (package.json, vite.config, next.config, etc.). Returns project name, type, package manager, and backend info.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The absolute path to the project directory.',
      },
    },
    required: ['path'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { path } = parseArgs<{ path: string }>(args);
    if (!path) return { success: false, output: '', error: 'path is required' };
    const result = await ipcBridge.detectProject(path);
    if (!result.success) {
      return { success: false, output: '', error: result.error };
    }
    const project = result.data as {
      name: string;
      type: string;
      packageManager?: string;
      backend?: string;
      gitRepository?: boolean;
      gitBranch?: string;
    };
    const summary = [
      `Project detected`,
      `Name: ${project.name}`,
      `Type: ${project.type}`,
      project.packageManager ? `Package manager: ${project.packageManager}` : '',
      project.backend ? `Backend: ${project.backend}` : '',
      `Location: ${path}`,
      project.gitRepository ? `Git: Repository` : '',
      project.gitBranch ? `Branch: ${project.gitBranch}` : '',
    ].filter(Boolean).join('\n');
    return { success: true, output: summary, data: project };
  },
};

export const projectTools: AgentTool[] = [detectProjectTool];
