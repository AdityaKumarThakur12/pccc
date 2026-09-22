import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerFilesystemHandlers } from './services/filesystem';
import { registerTerminalHandlers } from './services/terminal';
import { registerApplicationHandlers } from './services/application';
import { registerGitHandlers, registerProjectHandlers } from './services/git';
import { registerScreenshotHandlers } from './services/screenshot';
import { registerOllamaHandlers } from './services/ollama';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Track system stats interval
let statsInterval: NodeJS.Timeout | null = null;

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0b0f',
    title: 'My AI PC Agent',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    // Windows-specific: frameless look with custom title bar
    autoHideMenuBar: true,
  });

  // Development: load from Vite dev server
  // Production: load built files
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  return mainWindow;
}

// System stats monitoring (Windows-specific: uses WMIC or PowerShell)
function startSystemStats(window: BrowserWindow): void {
  statsInterval = setInterval(async () => {
    try {
      // Windows: use wmic for CPU and RAM stats
      if (process.platform === 'win32') {
        // CPU usage
        const cpuCmd = `wmic cpu get loadpercentage /value`;
        const ramCmd = `wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /value`;

        try {
          const { exec } = await import('node:child_process');
          const { promisify } = await import('node:util');
          const execAsync = promisify(exec);

          const { stdout: cpuOut } = await execAsync(cpuCmd, { timeout: 5000 });
          const cpuMatch = cpuOut.match(/LoadPercentage=(\d+)/);
          const cpu = cpuMatch ? parseInt(cpuMatch[1]) : 0;

          const { stdout: ramOut } = await execAsync(ramCmd, { timeout: 5000 });
          const freeMatch = ramOut.match(/FreePhysicalMemory=(\d+)/);
          const totalMatch = ramOut.match(/TotalVisibleMemorySize=(\d+)/);
          const free = freeMatch ? parseInt(freeMatch[1]) : 0;
          const total = totalMatch ? parseInt(totalMatch[1]) : 1;
          const ram = Math.round(((total - free) / total) * 100);

          window.webContents.send('system:stats', { cpu, ram });
        } catch {
          // Stats collection failed, skip this interval
        }
      }
    } catch {
      // Silently ignore stats errors
    }
  }, 5000);
}

app.whenReady().then(() => {
  // Register all IPC handlers
  registerFilesystemHandlers();
  registerTerminalHandlers();
  registerApplicationHandlers();
  registerGitHandlers();
  registerProjectHandlers();
  registerScreenshotHandlers();
  registerOllamaHandlers();

  const mainWindow = createWindow();
  startSystemStats(mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const win = createWindow();
      startSystemStats(win);
    }
  });
});

app.on('window-all-closed', () => {
  if (statsInterval) clearInterval(statsInterval);
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (statsInterval) clearInterval(statsInterval);
});
