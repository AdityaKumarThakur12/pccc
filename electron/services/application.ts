import { ipcMain } from 'electron';
import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execCb);

// Windows-specific: maps friendly app names to executable commands
const APP_MAP: Record<string, string> = {
  'vs code': 'code',
  'vscode': 'code',
  'code': 'code',
  'chrome': 'start chrome',
  'google chrome': 'start chrome',
  'firefox': 'start firefox',
  'edge': 'start msedge',
  'notepad': 'start notepad',
  'notepad++': 'start notepad++',
  'terminal': 'start wt',
  'windows terminal': 'start wt',
  'wt': 'start wt',
  'explorer': 'start explorer',
  'file explorer': 'start explorer',
  'calculator': 'start calc',
  'calc': 'start calc',
  'paint': 'start mspaint',
  'mspaint': 'start mspaint',
  'cmd': 'start cmd',
  'powershell': 'start powershell',
  'task manager': 'start taskmgr',
  'taskmgr': 'start taskmgr',
  'settings': 'start ms-settings:',
  'word': 'start winword',
  'excel': 'start excel',
  'powerpoint': 'start powerpnt',
  'outlook': 'start outlook',
  'spotify': 'start spotify',
  'discord': 'start discord',
  'slack': 'start slack',
  'github': 'start github',
  'github desktop': 'start github',
};

export function registerApplicationHandlers(): void {
  ipcMain.handle('app:open', async (_event, name: string) => {
    try {
      const lowerName = name.toLowerCase().trim();
      const command = APP_MAP[lowerName] ?? name;

      // Windows: use start command to open apps
      if (process.platform === 'win32') {
        await exec(command, { timeout: 10000 });
      } else {
        // Linux/Mac fallback for development
        await exec(`${command} &`, { timeout: 10000 });
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: `Failed to open application: ${err instanceof Error ? err.message : String(err)}` };
    }
  });

  ipcMain.handle('browser:openUrl', async (_event, url: string) => {
    try {
      // Windows-specific: open URL in default browser
      if (process.platform === 'win32') {
        await exec(`start ${url}`, { timeout: 10000 });
      } else {
        await exec(`xdg-open ${url} || open ${url}`, { timeout: 10000 });
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });
}
