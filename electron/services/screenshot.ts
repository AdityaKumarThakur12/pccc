import { ipcMain } from 'electron';
import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execCb);

export function registerScreenshotHandlers(): void {
  ipcMain.handle('screenshot:take', async () => {
    try {
      // Windows-specific: use PowerShell to capture screenshot
      if (process.platform === 'win32') {
        const script = `
          Add-Type -AssemblyName System.Windows.Forms
          Add-Type -AssemblyName System.Drawing
          $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
          $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
          $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
          $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
          $ms = New-Object System.IO.MemoryStream
          $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
          $bytes = $ms.ToArray()
          $base64 = [Convert]::ToBase64String($bytes)
          Write-Output $base64
          $graphics.Dispose()
          $bitmap.Dispose()
          $ms.Dispose()
        `;

        const { stdout } = await exec(`powershell -Command "${script.replace(/"/g, '\\"')}"`, {
          timeout: 30000,
          maxBuffer: 1024 * 1024 * 50,
        });

        const base64 = stdout.trim();
        if (base64) {
          return { success: true, data: `data:image/png;base64,${base64}` };
        }
        return { success: false, error: 'Screenshot capture returned empty data' };
      } else {
        // Linux/Mac fallback for development
        return { success: false, error: 'Screenshot not supported on this platform in development mode' };
      }
    } catch (err) {
      return { success: false, error: `Screenshot failed: ${err instanceof Error ? err.message : String(err)}` };
    }
  });
}
