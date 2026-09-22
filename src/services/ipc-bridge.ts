/**
 * IPC Bridge - the renderer's safe interface to Electron main process.
 * No Node.js APIs are exposed directly; all operations go through IPC.
 */

// Check if we're running in Electron
const isElectron = typeof window !== 'undefined' && 'electron' in window;

export interface IPCResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export const ipcBridge = {
  isAvailable(): boolean {
    return isElectron && (window as any).electronAPI !== undefined;
  },

  async invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
    if (!isElectron || !(window as any).electronAPI?.invoke) {
      throw new Error(
        'Electron API not available. Running in browser mode — filesystem and terminal tools require the Electron desktop app.'
      );
    }
    return (window as any).electronAPI.invoke(channel, ...args);
  },

  async listDirectory(path: string): Promise<IPCResult<string[]>> {
    return this.invoke('fs:listDirectory', path);
  },

  async readFile(path: string): Promise<IPCResult<string>> {
    return this.invoke('fs:readFile', path);
  },

  async writeFile(path: string, content: string): Promise<IPCResult<void>> {
    return this.invoke('fs:writeFile', path, content);
  },

  async createFile(path: string, content: string): Promise<IPCResult<void>> {
    return this.invoke('fs:createFile', path, content);
  },

  async createDirectory(path: string): Promise<IPCResult<void>> {
    return this.invoke('fs:createDirectory', path);
  },

  async renameFile(oldPath: string, newPath: string): Promise<IPCResult<void>> {
    return this.invoke('fs:renameFile', oldPath, newPath);
  },

  async copyFile(source: string, dest: string): Promise<IPCResult<void>> {
    return this.invoke('fs:copyFile', source, dest);
  },

  async moveFile(source: string, dest: string): Promise<IPCResult<void>> {
    return this.invoke('fs:moveFile', source, dest);
  },

  async deleteFile(path: string): Promise<IPCResult<void>> {
    return this.invoke('fs:deleteFile', path);
  },

  async searchFiles(
    directory: string,
    pattern: string
  ): Promise<IPCResult<string[]>> {
    return this.invoke('fs:searchFiles', directory, pattern);
  },

  async searchCode(
    directory: string,
    query: string
  ): Promise<
    IPCResult<{ file: string; line: number; text: string }[]>
  > {
    return this.invoke('fs:searchCode', directory, query);
  },

  async runTerminal(
    command: string,
    cwd?: string
  ): Promise<
    IPCResult<{ stdout: string; stderr: string; exitCode: number; duration: number }>
  > {
    return this.invoke('terminal:run', command, cwd);
  },

  async openApplication(name: string): Promise<IPCResult<void>> {
    return this.invoke('app:open', name);
  },

  async takeScreenshot(): Promise<IPCResult<string>> {
    return this.invoke('screenshot:take');
  },

  async openUrl(url: string): Promise<IPCResult<void>> {
    return this.invoke('browser:openUrl', url);
  },

  async gitStatus(cwd: string): Promise<IPCResult<string>> {
    return this.invoke('git:status', cwd);
  },

  async gitDiff(cwd: string): Promise<IPCResult<string>> {
    return this.invoke('git:diff', cwd);
  },

  async gitLog(cwd: string): Promise<IPCResult<string>> {
    return this.invoke('git:log', cwd);
  },

  async gitBranch(cwd: string): Promise<IPCResult<string>> {
    return this.invoke('git:branch', cwd);
  },

  async gitCheckout(cwd: string, branch: string): Promise<IPCResult<string>> {
    return this.invoke('git:checkout', cwd, branch);
  },

  async gitAdd(cwd: string, files?: string[]): Promise<IPCResult<string>> {
    return this.invoke('git:add', cwd, files);
  },

  async gitCommit(cwd: string, message: string): Promise<IPCResult<string>> {
    return this.invoke('git:commit', cwd, message);
  },

  async gitPush(cwd: string): Promise<IPCResult<string>> {
    return this.invoke('git:push', cwd);
  },

  async detectProject(path: string): Promise<IPCResult<unknown>> {
    return this.invoke('project:detect', path);
  },

  async selectFolder(): Promise<IPCResult<string>> {
    return this.invoke('dialog:selectFolder');
  },

  async checkOllama(url: string): Promise<IPCResult<boolean>> {
    return this.invoke('ollama:check', url);
  },

  async getOllamaModels(url: string): Promise<IPCResult<string[]>> {
    return this.invoke('ollama:models', url);
  },

  onSystemStats(callback: (stats: { cpu: number; ram: number }) => void) {
    if (!isElectron || !(window as any).electronAPI?.onSystemStats) return;
    (window as any).electronAPI.onSystemStats(callback);
  },
};
