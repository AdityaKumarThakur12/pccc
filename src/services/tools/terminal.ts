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

const DANGEROUS_COMMANDS = [
  'rm ', 'rmdir', 'del ', 'format', 'shutdown', 'restart',
  'git push', 'git reset --hard', 'git clean', 'npm uninstall',
  'rd ', 'erase', 'mkfs',
];

export function isDangerousCommand(command: string): boolean {
  const lower = command.toLowerCase().trim();
  return DANGEROUS_COMMANDS.some((c) => lower.startsWith(c) || lower.includes(` ${c}`));
}

export const runTerminalTool: AgentTool = {
  name: 'run_terminal',
  description:
    'Run a terminal command and return stdout, stderr, exit code, and duration. Use for npm, git, node, and other CLI commands.',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The terminal command to execute.',
      },
      cwd: {
        type: 'string',
        description: 'Working directory for the command. Optional.',
      },
    },
    required: ['command'],
  },
  requiresConfirmation: false, // Set dynamically based on command
  async execute(args: unknown): Promise<ToolResult> {
    const { command, cwd } = parseArgs<{ command: string; cwd?: string }>(args);
    if (!command) return { success: false, output: '', error: 'command is required' };

    // Dynamically require confirmation for dangerous commands
    if (isDangerousCommand(command)) {
      runTerminalTool.requiresConfirmation = true;
    } else {
      runTerminalTool.requiresConfirmation = false;
    }

    const result = await ipcBridge.runTerminal(command, cwd);
    if (!result.success) {
      return { success: false, output: '', error: result.error };
    }

    const data = result.data!;
    const output = [
      `$ ${command}`,
      data.stdout || '(no stdout)',
      data.stderr ? `\n[stderr]\n${data.stderr}` : '',
      `\nExit code: ${data.exitCode}`,
      `Duration: ${data.duration}ms`,
    ].join('\n');

    return {
      success: data.exitCode === 0,
      output,
      data,
    };
  },
};

export const terminalTools: AgentTool[] = [runTerminalTool];
