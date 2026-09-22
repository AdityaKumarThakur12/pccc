import { ipcMain } from 'electron';
import { exec as execCb } from 'node:child_process';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execCb);

async function runGit(command: string, cwd: string): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const { stdout } = await exec(command, { cwd, timeout: 30000, maxBuffer: 1024 * 1024 * 5 });
    return { success: true, data: stdout };
  } catch (err: any) {
    // Git returns non-zero on some commands, still want output
    if (err.stdout) {
      return { success: true, data: err.stdout };
    }
    return { success: false, error: err.message ?? String(err) };
  }
}

export function registerGitHandlers(): void {
  ipcMain.handle('git:status', async (_event, cwd: string) => {
    return runGit('git status', cwd);
  });

  ipcMain.handle('git:diff', async (_event, cwd: string) => {
    return runGit('git diff', cwd);
  });

  ipcMain.handle('git:log', async (_event, cwd: string) => {
    return runGit('git log --oneline -20', cwd);
  });

  ipcMain.handle('git:branch', async (_event, cwd: string) => {
    return runGit('git branch -a', cwd);
  });

  ipcMain.handle('git:checkout', async (_event, cwd: string, branch: string) => {
    return runGit(`git checkout ${branch}`, cwd);
  });

  ipcMain.handle('git:add', async (_event, cwd: string, files?: string[]) => {
    const fileArg = files && files.length > 0 ? files.join(' ') : '.';
    return runGit(`git add ${fileArg}`, cwd);
  });

  ipcMain.handle('git:commit', async (_event, cwd: string, message: string) => {
    // Escape the message for shell
    const escapedMsg = message.replace(/"/g, '\\"');
    return runGit(`git commit -m "${escapedMsg}"`, cwd);
  });

  ipcMain.handle('git:push', async (_event, cwd: string) => {
    return runGit('git push', cwd);
  });
}

// Project detection service
interface DetectedProject {
  name: string;
  type: string;
  packageManager?: string;
  backend?: string;
  gitRepository?: boolean;
  gitBranch?: string;
}

export function registerProjectHandlers(): void {
  ipcMain.handle('project:detect', async (_event, projectPath: string) => {
    try {
      const project: DetectedProject = {
        name: path.basename(projectPath),
        type: 'Unknown',
      };

      // Check for git
      try {
        await fs.access(path.join(projectPath, '.git'));
        project.gitRepository = true;
        const branchResult = await runGit('git branch --show-current', projectPath);
        project.gitBranch = branchResult.data?.trim();
      } catch {
        // Not a git repo
      }

      // Check for package.json (Node.js ecosystem)
      let packageJson: any = null;
      try {
        const pkgContent = await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8');
        packageJson = JSON.parse(pkgContent);
        project.name = packageJson.name || project.name;
      } catch {
        // No package.json
      }

      // Check for Vite
      const hasViteConfig = await fileExists(projectPath, 'vite.config.ts') ||
        await fileExists(projectPath, 'vite.config.js') ||
        await fileExists(projectPath, 'vite.config.mts');

      // Check for Next.js
      const hasNextConfig = await fileExists(projectPath, 'next.config.js') ||
        await fileExists(projectPath, 'next.config.mjs') ||
        await fileExists(projectPath, 'next.config.ts');

      // Check for NestJS
      const hasNestConfig = await fileExists(projectPath, 'nest-cli.json');

      // Check for React Native
      let isReactNative = false;
      if (packageJson) {
        isReactNative = !!(packageJson.dependencies?.['react-native'] || packageJson.devDependencies?.['react-native']);
      }

      // Check for Java / Spring Boot
      const hasPomXml = await fileExists(projectPath, 'pom.xml');
      const hasGradle = await fileExists(projectPath, 'build.gradle') || await fileExists(projectPath, 'build.gradle.kts');

      // Check for Python
      const hasRequirements = await fileExists(projectPath, 'requirements.txt');
      const hasPyproject = await fileExists(projectPath, 'pyproject.toml');
      const hasSetupPy = await fileExists(projectPath, 'setup.py');

      // Determine project type
      if (hasNextConfig) {
        project.type = 'Next.js';
        project.packageManager = 'npm';
      } else if (hasViteConfig && packageJson) {
        const hasReact = packageJson.dependencies?.['react'] || packageJson.devDependencies?.['react'];
        project.type = hasReact ? 'React + Vite' : 'Vite';
        project.packageManager = detectPackageManager(packageJson);
      } else if (hasNestConfig) {
        project.type = 'NestJS';
        project.packageManager = detectPackageManager(packageJson);
        project.backend = 'Node.js';
      } else if (isReactNative) {
        project.type = 'React Native';
        project.packageManager = detectPackageManager(packageJson);
      } else if (packageJson) {
        const hasReact = packageJson.dependencies?.['react'] || packageJson.devDependencies?.['react'];
        const hasExpress = packageJson.dependencies?.['express'];
        const hasFastify = packageJson.dependencies?.['fastify'];
        if (hasReact && (hasExpress || hasFastify)) {
          project.type = 'React + Node';
        } else if (hasReact) {
          project.type = 'React';
        } else if (hasExpress || hasFastify) {
          project.type = 'Node.js';
          project.backend = 'Node.js';
        } else {
          project.type = 'Node.js';
        }
        project.packageManager = detectPackageManager(packageJson);
      } else if (hasPomXml) {
        project.type = 'Java / Spring Boot';
        project.packageManager = 'Maven';
        project.backend = 'Java';
      } else if (hasGradle) {
        project.type = 'Java / Gradle';
        project.packageManager = 'Gradle';
        project.backend = 'Java';
      } else if (hasRequirements || hasPyproject || hasSetupPy) {
        project.type = 'Python';
        project.packageManager = 'pip';
        project.backend = 'Python';
      }

      return { success: true, data: project };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });
}

function detectPackageManager(packageJson: any): string {
  // Check for lock files or package manager hints
  // This is a simplified check based on dependencies
  if (packageJson.packageManager) {
    if (packageJson.packageManager.startsWith('pnpm')) return 'pnpm';
    if (packageJson.packageManager.startsWith('yarn')) return 'yarn';
    if (packageJson.packageManager.startsWith('npm')) return 'npm';
  }
  return 'npm';
}

async function fileExists(dir: string, filename: string): Promise<boolean> {
  try {
    await fs.access(path.join(dir, filename));
    return true;
  } catch {
    return false;
  }
}
