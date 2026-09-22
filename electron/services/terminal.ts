import { ipcMain } from 'electron';
import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execCb);

// Maximum execution time for terminal commands (ms)
const COMMAND_TIMEOUT = 120000;

export function registerTerminalHandlers(): void {
  ipcMain.handle('terminal:run', async (_event, command: string, cwd?: string) => {
    try {
      const startTime = Date.now();
      // Windows-specific: use cmd.exe to run commands
      const shellCommand = process.platform === 'win32' ? command : command;
      const options: { cwd?: string; timeout: number; maxBuffer: number } = {
        timeout: COMMAND_TIMEOUT,
        maxBuffer: 1024 * 1024 * 10, // 10MB
      };
      if (cwd) options.cwd = cwd;

      try {
        const { stdout, stderr } = await exec(shellCommand, options);
        const duration = Date.now() - startTime;
        return {
          success: true,
          data: {
            stdout: stdout || '',
            stderr: stderr || '',
            exitCode: 0,
            duration,
          },
        };
      } catch (err: any) {
        // exec throws on non-zero exit codes, but we still want the output
        const duration = Date.now() - startTime;
        if (err.stdout !== undefined || err.stderr !== undefined) {
          return {
            success: true,
            data: {
              stdout: err.stdout || '',
              stderr: err.stderr || '',
              exitCode: err.code ?? 1,
              duration,
            },
          };
        }
        throw err;
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });
}
