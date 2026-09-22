import type { AgentTool } from '@/types';
import { toolRegistry } from './registry';
import { filesystemTools } from './filesystem';
import { terminalTools } from './terminal';
import { applicationTools } from './application';
import { gitTools } from './git';
import { projectTools } from './project';

let initialized = false;

export function initializeTools(): void {
  if (initialized) return;

  for (const tool of [
    ...filesystemTools,
    ...terminalTools,
    ...applicationTools,
    ...gitTools,
    ...projectTools,
  ]) {
    toolRegistry.register(tool);
  }

  initialized = true;
}

export { toolRegistry } from './registry';
export { isDangerousCommand } from './terminal';
