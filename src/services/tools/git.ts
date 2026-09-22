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

export const gitStatusTool: AgentTool = {
  name: 'git_status',
  description: 'Get the git status of a repository. Shows modified, staged, and untracked files.',
  parameters: {
    type: 'object',
    properties: {
      cwd: { type: 'string', description: 'Path to the git repository.' },
    },
    required: ['cwd'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { cwd } = parseArgs<{ cwd: string }>(args);
    if (!cwd) return { success: false, output: '', error: 'cwd is required' };
    const result = await ipcBridge.gitStatus(cwd);
    if (!result.success) return { success: false, output: '', error: result.error };
    return { success: true, output: result.data ?? '' };
  },
};

export const gitDiffTool: AgentTool = {
  name: 'git_diff',
  description: 'Get the git diff of a repository. Shows unstaged changes.',
  parameters: {
    type: 'object',
    properties: {
      cwd: { type: 'string', description: 'Path to the git repository.' },
    },
    required: ['cwd'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { cwd } = parseArgs<{ cwd: string }>(args);
    if (!cwd) return { success: false, output: '', error: 'cwd is required' };
    const result = await ipcBridge.gitDiff(cwd);
    if (!result.success) return { success: false, output: '', error: result.error };
    return { success: true, output: result.data ?? '' };
  },
};

export const gitLogTool: AgentTool = {
  name: 'git_log',
  description: 'Get the recent git commit log of a repository.',
  parameters: {
    type: 'object',
    properties: {
      cwd: { type: 'string', description: 'Path to the git repository.' },
    },
    required: ['cwd'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { cwd } = parseArgs<{ cwd: string }>(args);
    if (!cwd) return { success: false, output: '', error: 'cwd is required' };
    const result = await ipcBridge.gitLog(cwd);
    if (!result.success) return { success: false, output: '', error: result.error };
    return { success: true, output: result.data ?? '' };
  },
};

export const gitBranchTool: AgentTool = {
  name: 'git_branch',
  description: 'List all git branches in a repository.',
  parameters: {
    type: 'object',
    properties: {
      cwd: { type: 'string', description: 'Path to the git repository.' },
    },
    required: ['cwd'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { cwd } = parseArgs<{ cwd: string }>(args);
    if (!cwd) return { success: false, output: '', error: 'cwd is required' };
    const result = await ipcBridge.gitBranch(cwd);
    if (!result.success) return { success: false, output: '', error: result.error };
    return { success: true, output: result.data ?? '' };
  },
};

export const gitCheckoutTool: AgentTool = {
  name: 'git_checkout',
  description: 'Checkout a git branch in a repository.',
  parameters: {
    type: 'object',
    properties: {
      cwd: { type: 'string', description: 'Path to the git repository.' },
      branch: { type: 'string', description: 'Branch name to checkout.' },
    },
    required: ['cwd', 'branch'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { cwd, branch } = parseArgs<{ cwd: string; branch: string }>(args);
    if (!cwd || !branch) return { success: false, output: '', error: 'cwd and branch are required' };
    const result = await ipcBridge.gitCheckout(cwd, branch);
    if (!result.success) return { success: false, output: '', error: result.error };
    return { success: true, output: result.data ?? '' };
  },
};

export const gitAddTool: AgentTool = {
  name: 'git_add',
  description: 'Stage files in a git repository.',
  parameters: {
    type: 'object',
    properties: {
      cwd: { type: 'string', description: 'Path to the git repository.' },
      files: {
        type: 'array',
        items: { type: 'string' },
        description: 'Files to stage. If omitted, stages all changes (git add .).',
      },
    },
    required: ['cwd'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { cwd, files } = parseArgs<{ cwd: string; files?: string[] }>(args);
    if (!cwd) return { success: false, output: '', error: 'cwd is required' };
    const result = await ipcBridge.gitAdd(cwd, files);
    if (!result.success) return { success: false, output: '', error: result.error };
    return { success: true, output: result.data ?? '' };
  },
};

export const gitCommitTool: AgentTool = {
  name: 'git_commit',
  description: 'Create a git commit with a message.',
  parameters: {
    type: 'object',
    properties: {
      cwd: { type: 'string', description: 'Path to the git repository.' },
      message: { type: 'string', description: 'Commit message.' },
    },
    required: ['cwd', 'message'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { cwd, message } = parseArgs<{ cwd: string; message: string }>(args);
    if (!cwd || !message) return { success: false, output: '', error: 'cwd and message are required' };
    const result = await ipcBridge.gitCommit(cwd, message);
    if (!result.success) return { success: false, output: '', error: result.error };
    return { success: true, output: result.data ?? '' };
  },
};

export const gitPushTool: AgentTool = {
  name: 'git_push',
  description: 'Push commits to the remote repository. This is a dangerous operation that requires confirmation.',
  parameters: {
    type: 'object',
    properties: {
      cwd: { type: 'string', description: 'Path to the git repository.' },
    },
    required: ['cwd'],
  },
  requiresConfirmation: true,
  async execute(args: unknown): Promise<ToolResult> {
    const { cwd } = parseArgs<{ cwd: string }>(args);
    if (!cwd) return { success: false, output: '', error: 'cwd is required' };
    const result = await ipcBridge.gitPush(cwd);
    if (!result.success) return { success: false, output: '', error: result.error };
    return { success: true, output: result.data ?? '' };
  },
};

export const gitTools: AgentTool[] = [
  gitStatusTool,
  gitDiffTool,
  gitLogTool,
  gitBranchTool,
  gitCheckoutTool,
  gitAddTool,
  gitCommitTool,
  gitPushTool,
];
