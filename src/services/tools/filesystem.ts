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

export const listDirectoryTool: AgentTool = {
  name: 'list_directory',
  description:
    'List the contents of a directory. Returns file and folder names. Use this to explore the filesystem.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The absolute path of the directory to list.',
      },
    },
    required: ['path'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { path } = parseArgs<{ path: string }>(args);
    if (!path) return { success: false, output: '', error: 'path is required' };
    const result = await ipcBridge.listDirectory(path);
    if (!result.success) {
      return { success: false, output: '', error: result.error };
    }
    return {
      success: true,
      output: `Contents of ${path}:\n${(result.data ?? []).join('\n')}`,
      data: { files: result.data },
    };
  },
};

export const readFileTool: AgentTool = {
  name: 'read_file',
  description:
    'Read the contents of a file. Returns the full text content of the file.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The absolute path of the file to read.',
      },
    },
    required: ['path'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { path } = parseArgs<{ path: string }>(args);
    if (!path) return { success: false, output: '', error: 'path is required' };
    const result = await ipcBridge.readFile(path);
    if (!result.success) {
      return { success: false, output: '', error: result.error };
    }
    return { success: true, output: result.data ?? '', data: { content: result.data } };
  },
};

export const writeFileTool: AgentTool = {
  name: 'write_file',
  description:
    'Write content to an existing file, overwriting its contents. Requires confirmation for file modification.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The absolute path of the file to write.',
      },
      content: {
        type: 'string',
        description: 'The content to write to the file.',
      },
    },
    required: ['path', 'content'],
  },
  requiresConfirmation: true,
  async execute(args: unknown): Promise<ToolResult> {
    const { path, content } = parseArgs<{ path: string; content: string }>(args);
    if (!path) return { success: false, output: '', error: 'path is required' };
    const result = await ipcBridge.writeFile(path, content ?? '');
    if (!result.success) {
      return { success: false, output: '', error: result.error };
    }
    return { success: true, output: `File written: ${path}` };
  },
};

export const createFileTool: AgentTool = {
  name: 'create_file',
  description: 'Create a new file with the given content.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The absolute path of the file to create.',
      },
      content: {
        type: 'string',
        description: 'The content of the new file.',
      },
    },
    required: ['path', 'content'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { path, content } = parseArgs<{ path: string; content: string }>(args);
    if (!path) return { success: false, output: '', error: 'path is required' };
    const result = await ipcBridge.createFile(path, content ?? '');
    if (!result.success) {
      return { success: false, output: '', error: result.error };
    }
    return { success: true, output: `File created: ${path}` };
  },
};

export const createDirectoryTool: AgentTool = {
  name: 'create_directory',
  description: 'Create a new directory at the specified path.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The absolute path of the directory to create.',
      },
    },
    required: ['path'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { path } = parseArgs<{ path: string }>(args);
    if (!path) return { success: false, output: '', error: 'path is required' };
    const result = await ipcBridge.createDirectory(path);
    if (!result.success) {
      return { success: false, output: '', error: result.error };
    }
    return { success: true, output: `Directory created: ${path}` };
  },
};

export const renameFileTool: AgentTool = {
  name: 'rename_file',
  description: 'Rename or move a file from old path to new path.',
  parameters: {
    type: 'object',
    properties: {
      oldPath: { type: 'string', description: 'Current path of the file.' },
      newPath: { type: 'string', description: 'New path for the file.' },
    },
    required: ['oldPath', 'newPath'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { oldPath, newPath } = parseArgs<{ oldPath: string; newPath: string }>(args);
    if (!oldPath || !newPath)
      return { success: false, output: '', error: 'oldPath and newPath are required' };
    const result = await ipcBridge.renameFile(oldPath, newPath);
    if (!result.success) {
      return { success: false, output: '', error: result.error };
    }
    return { success: true, output: `Renamed: ${oldPath} → ${newPath}` };
  },
};

export const copyFileTool: AgentTool = {
  name: 'copy_file',
  description: 'Copy a file from source to destination.',
  parameters: {
    type: 'object',
    properties: {
      source: { type: 'string', description: 'Source file path.' },
      destination: { type: 'string', description: 'Destination file path.' },
    },
    required: ['source', 'destination'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { source, destination } = parseArgs<{ source: string; destination: string }>(args);
    if (!source || !destination)
      return { success: false, output: '', error: 'source and destination are required' };
    const result = await ipcBridge.copyFile(source, destination);
    if (!result.success) {
      return { success: false, output: '', error: result.error };
    }
    return { success: true, output: `Copied: ${source} → ${destination}` };
  },
};

export const moveFileTool: AgentTool = {
  name: 'move_file',
  description: 'Move a file from source to destination.',
  parameters: {
    type: 'object',
    properties: {
      source: { type: 'string', description: 'Source file path.' },
      destination: { type: 'string', description: 'Destination file path.' },
    },
    required: ['source', 'destination'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { source, destination } = parseArgs<{ source: string; destination: string }>(args);
    if (!source || !destination)
      return { success: false, output: '', error: 'source and destination are required' };
    const result = await ipcBridge.moveFile(source, destination);
    if (!result.success) {
      return { success: false, output: '', error: result.error };
    }
    return { success: true, output: `Moved: ${source} → ${destination}` };
  },
};

export const deleteFileTool: AgentTool = {
  name: 'delete_file',
  description:
    'Delete a file. This is a dangerous operation that requires confirmation.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path of the file to delete.' },
    },
    required: ['path'],
  },
  requiresConfirmation: true,
  async execute(args: unknown): Promise<ToolResult> {
    const { path } = parseArgs<{ path: string }>(args);
    if (!path) return { success: false, output: '', error: 'path is required' };
    const result = await ipcBridge.deleteFile(path);
    if (!result.success) {
      return { success: false, output: '', error: result.error };
    }
    return { success: true, output: `Deleted: ${path}` };
  },
};

export const searchFilesTool: AgentTool = {
  name: 'search_files',
  description:
    'Search for files by name pattern in a directory. Returns matching file paths.',
  parameters: {
    type: 'object',
    properties: {
      directory: { type: 'string', description: 'Directory to search in.' },
      pattern: { type: 'string', description: 'File name pattern to match.' },
    },
    required: ['directory', 'pattern'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { directory, pattern } = parseArgs<{ directory: string; pattern: string }>(args);
    if (!directory || !pattern)
      return { success: false, output: '', error: 'directory and pattern are required' };
    const result = await ipcBridge.searchFiles(directory, pattern);
    if (!result.success) {
      return { success: false, output: '', error: result.error };
    }
    return {
      success: true,
      output: `Found ${(result.data ?? []).length} files:\n${(result.data ?? []).join('\n')}`,
      data: { files: result.data },
    };
  },
};

export const searchCodeTool: AgentTool = {
  name: 'search_code',
  description:
    'Search for text/code within files in a project. Returns file paths, line numbers, and matching lines. Respects .gitignore and skips node_modules, .git, dist, build, coverage.',
  parameters: {
    type: 'object',
    properties: {
      directory: { type: 'string', description: 'Project directory to search in.' },
      query: { type: 'string', description: 'Text or code to search for.' },
    },
    required: ['directory', 'query'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    const { directory, query } = parseArgs<{ directory: string; query: string }>(args);
    if (!directory || !query)
      return { success: false, output: '', error: 'directory and query are required' };
    const result = await ipcBridge.searchCode(directory, query);
    if (!result.success) {
      return { success: false, output: '', error: result.error };
    }
    const matches = result.data ?? [];
    const formatted = matches
      .map((m: { file: string; line: number; text: string }) => `${m.file}:${m.line}: ${m.text.trim()}`)
      .join('\n');
    return {
      success: true,
      output: `Found ${matches.length} matches:\n${formatted}`,
      data: { matches },
    };
  },
};

export const filesystemTools: AgentTool[] = [
  listDirectoryTool,
  readFileTool,
  writeFileTool,
  createFileTool,
  createDirectoryTool,
  renameFileTool,
  copyFileTool,
  moveFileTool,
  deleteFileTool,
  searchFilesTool,
  searchCodeTool,
];
