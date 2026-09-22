import { contextBridge, ipcRenderer } from 'electron';

// Preload script - safely exposes IPC to the renderer without exposing Node.js APIs
const electronAPI = {
  invoke: (channel: string, ...args: unknown[]) => {
    // Whitelist of allowed IPC channels
    const allowedChannels = [
      'fs:listDirectory',
      'fs:readFile',
      'fs:writeFile',
      'fs:createFile',
      'fs:createDirectory',
      'fs:renameFile',
      'fs:copyFile',
      'fs:moveFile',
      'fs:deleteFile',
      'fs:searchFiles',
      'fs:searchCode',
      'terminal:run',
      'app:open',
      'screenshot:take',
      'browser:openUrl',
      'git:status',
      'git:diff',
      'git:log',
      'git:branch',
      'git:checkout',
      'git:add',
      'git:commit',
      'git:push',
      'project:detect',
      'dialog:selectFolder',
      'ollama:check',
      'ollama:models',
    ];

    if (!allowedChannels.includes(channel)) {
      throw new Error(`IPC channel not allowed: ${channel}`);
    }
    return ipcRenderer.invoke(channel, ...args);
  },
  onSystemStats: (callback: (stats: { cpu: number; ram: number }) => void) => {
    ipcRenderer.on('system:stats', (_event, stats) => callback(stats));
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
