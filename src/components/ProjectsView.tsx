import { FolderGit2, FolderPlus, Trash2, Folder, GitBranch, FileCode } from 'lucide-react';
import { useProjectStore } from '@/stores';
import { ipcBridge } from '@/services/ipc-bridge';
import type { Project } from '@/types';

export function ProjectsView() {
  const { projects, activeProject, addProject, setActiveProject, removeProject } = useProjectStore();

  const handleSelectFolder = async () => {
    try {
      const result = await ipcBridge.selectFolder();
      if (!result.success || !result.data) return;

      const path = result.data;
      const name = path.split(/[\\/]/).pop() || path;

      // Try to detect project type
      let type = 'Unknown';
      let packageManager: string | undefined;
      let backend: string | undefined;
      let gitRepository = false;
      let gitBranch: string | undefined;

      try {
        const detectResult = await ipcBridge.detectProject(path);
        if (detectResult.success && detectResult.data) {
          const data = detectResult.data as Project;
          type = data.type;
          packageManager = data.packageManager;
          backend = data.backend;
          gitRepository = data.gitRepository ?? false;
          gitBranch = data.gitBranch;
        }
      } catch {
        // Detection failed, use defaults
      }

      addProject({
        name,
        path,
        type,
        packageManager,
        backend,
        gitRepository,
        gitBranch,
        lastOpened: Date.now(),
      });
    } catch (err) {
      // IPC not available in browser mode
      console.error('Failed to select folder:', err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FolderGit2 size={20} className="text-[var(--accent)]" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Projects</h2>
        </div>
        <button
          onClick={handleSelectFolder}
          className="btn-primary flex items-center gap-1.5"
        >
          <FolderPlus size={14} />
          Add Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderGit2 size={32} className="text-[var(--text-muted)] mb-3" />
          <p className="text-sm text-[var(--text-muted)] mb-2">
            No projects added yet.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Click "Add Project" to select a folder. The AI will prioritize your active project.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project: Project) => (
            <div
              key={project.id}
              className={`glass-panel rounded-xl p-4 cursor-pointer transition-all ${
                activeProject?.id === project.id
                  ? 'border-[var(--accent)]'
                  : 'hover:border-[var(--border-light)]'
              }`}
              onClick={() => setActiveProject(project)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center">
                    <Folder size={20} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {project.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{project.path}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeProject(project.id);
                  }}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs">
                <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                  <FileCode size={12} />
                  {project.type}
                </span>
                {project.packageManager && (
                  <span className="text-[var(--text-secondary)]">{project.packageManager}</span>
                )}
                {project.backend && (
                  <span className="text-[var(--text-secondary)]">{project.backend}</span>
                )}
                {project.gitRepository && (
                  <span className="flex items-center gap-1 text-[var(--success)]">
                    <GitBranch size={12} />
                    {project.gitBranch || 'main'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
