import { ipcMain, dialog } from 'electron';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { exec as execCb, execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execCb);

// Ignored directories for search operations
const IGNORED_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.nuxt'];

// System directories that are blocked by default
const BLOCKED_DIRS = ['C:\\Windows', 'C:\\Program Files', 'C:\\Program Files (x86)'];

function isPathBlocked(targetPath: string): boolean {
  const normalized = path.resolve(targetPath).toLowerCase();
  return BLOCKED_DIRS.some((blocked) => normalized.startsWith(blocked.toLowerCase()));
}

export function registerFilesystemHandlers(): void {
  ipcMain.handle('fs:listDirectory', async (_event, dirPath: string) => {
    try {
      if (isPathBlocked(dirPath)) {
        return { success: false, error: 'Access denied: system directory' };
      }
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const items = entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
      return { success: true, data: items };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    try {
      if (isPathBlocked(filePath)) {
        return { success: false, error: 'Access denied: system directory' };
      }
      const content = await fs.readFile(filePath, 'utf-8');
      return { success: true, data: content };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
    try {
      if (isPathBlocked(filePath)) {
        return { success: false, error: 'Access denied: system directory' };
      }
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('fs:createFile', async (_event, filePath: string, content: string) => {
    try {
      if (isPathBlocked(filePath)) {
        return { success: false, error: 'Access denied: system directory' };
      }
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('fs:createDirectory', async (_event, dirPath: string) => {
    try {
      if (isPathBlocked(dirPath)) {
        return { success: false, error: 'Access denied: system directory' };
      }
      await fs.mkdir(dirPath, { recursive: true });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('fs:renameFile', async (_event, oldPath: string, newPath: string) => {
    try {
      if (isPathBlocked(oldPath) || isPathBlocked(newPath)) {
        return { success: false, error: 'Access denied: system directory' };
      }
      await fs.rename(oldPath, newPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('fs:copyFile', async (_event, source: string, dest: string) => {
    try {
      if (isPathBlocked(source) || isPathBlocked(dest)) {
        return { success: false, error: 'Access denied: system directory' };
      }
      await fs.copyFile(source, dest);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('fs:moveFile', async (_event, source: string, dest: string) => {
    try {
      if (isPathBlocked(source) || isPathBlocked(dest)) {
        return { success: false, error: 'Access denied: system directory' };
      }
      await fs.rename(source, dest);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('fs:deleteFile', async (_event, targetPath: string) => {
    try {
      if (isPathBlocked(targetPath)) {
        return { success: false, error: 'Access denied: system directory' };
      }
      const stat = await fs.stat(targetPath);
      if (stat.isDirectory()) {
        await fs.rmdir(targetPath, { recursive: true });
      } else {
        await fs.unlink(targetPath);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('fs:searchFiles', async (_event, directory: string, pattern: string) => {
    try {
      if (isPathBlocked(directory)) {
        return { success: false, error: 'Access denied: system directory' };
      }
      const results: string[] = [];
      const lowerPattern = pattern.toLowerCase();

      async function searchDir(dir: string, depth: number): Promise<void> {
        if (depth > 10 || results.length > 200) return;
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (IGNORED_DIRS.includes(entry.name)) continue;
          const fullPath = path.join(dir, entry.name);
          if (entry.name.toLowerCase().includes(lowerPattern)) {
            results.push(fullPath);
          }
          if (entry.isDirectory()) {
            await searchDir(fullPath, depth + 1);
          }
        }
      }

      await searchDir(directory, 0);
      return { success: true, data: results };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('fs:searchCode', async (_event, directory: string, query: string) => {
    try {
      if (isPathBlocked(directory)) {
        return { success: false, error: 'Access denied: system directory' };
      }
      const results: { file: string; line: number; text: string }[] = [];
      const lowerQuery = query.toLowerCase();

      async function searchDir(dir: string, depth: number): Promise<void> {
        if (depth > 10 || results.length > 100) return;
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (IGNORED_DIRS.includes(entry.name)) continue;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await searchDir(fullPath, depth + 1);
          } else {
            // Only search text-like files
            const ext = path.extname(entry.name).toLowerCase();
            const searchableExts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.py', '.java', '.md', '.txt', '.css', '.html', '.vue', '.go', '.rs', '.c', '.cpp', '.h'];
            if (!searchableExts.includes(ext) && !entry.name.includes('.')) continue;
            try {
              const content = await fs.readFile(fullPath, 'utf-8');
              const lines = content.split('\n');
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].toLowerCase().includes(lowerQuery)) {
                  results.push({ file: fullPath, line: i + 1, text: lines[i] });
                  if (results.length >= 100) return;
                }
              }
            } catch {
              // Skip binary/unreadable files
            }
          }
        }
      }

      await searchDir(directory, 0);
      return { success: true, data: results };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('dialog:selectFolder', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
      });
      if (result.canceled || result.filePaths.length === 0) {
        return { success: false };
      }
      return { success: true, data: result.filePaths[0] };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });
}
