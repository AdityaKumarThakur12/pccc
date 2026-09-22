// Application settings types

export interface AppSettings {
  ai: AISettings;
  security: SecuritySettings;
  workspace: WorkspaceSettings;
  general: GeneralSettings;
}

export interface AISettings {
  provider: string;
  ollamaUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface SecuritySettings {
  requireConfirmationDangerousCommands: boolean;
  requireConfirmationDeleteFiles: boolean;
  requireConfirmationModifyFiles: boolean;
  requireConfirmationGitPush: boolean;
  advancedAccess: boolean;
}

export interface WorkspaceSettings {
  allowedDirectories: string[];
  blockedDirectories: string[];
  currentProjectPath?: string;
}

export interface GeneralSettings {
  theme: 'dark' | 'light';
  streamingEnabled: boolean;
  voiceEnabled: boolean;
}

export const DEFAULT_SYSTEM_PROMPT = `You are My AI PC Agent, a private local AI assistant running on the user's Windows PC.
You help the user control and automate their computer through natural language commands.

You have access to tools for:
- Opening applications (VS Code, Chrome, Notepad, etc.)
- Filesystem operations (read, write, list, search files)
- Running terminal commands (npm, git, node, etc.)
- Taking screenshots
- Git operations (status, diff, log, commit, push)
- Project detection
- Code search

When the user asks you to do something, decide which tool(s) to use and call them.
After receiving tool results, analyze them and decide if more actions are needed.
Always explain what you are doing and why.
Be concise but thorough. When showing code or file contents, use markdown code blocks.
If a task requires multiple steps, work through them systematically.
If a command is dangerous (like git push, rm, format), note that confirmation is required.
Never attempt to access system directories like C:\\\\Windows or C:\\\\Program Files unless explicitly allowed.`;

export const DEFAULT_SETTINGS: AppSettings = {
  ai: {
    provider: 'ollama',
    ollamaUrl: 'http://localhost:11434',
    model: 'llama3.1',
    temperature: 0.2,
    maxTokens: 4096,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
  },
  security: {
    requireConfirmationDangerousCommands: true,
    requireConfirmationDeleteFiles: true,
    requireConfirmationModifyFiles: false,
    requireConfirmationGitPush: true,
    advancedAccess: false,
  },
  workspace: {
    allowedDirectories: [],
    blockedDirectories: [
      'C:\\Windows',
      'C:\\Program Files',
      'C:\\Program Files (x86)',
    ],
    currentProjectPath: undefined,
  },
  general: {
    theme: 'dark',
    streamingEnabled: true,
    voiceEnabled: false,
  },
};
