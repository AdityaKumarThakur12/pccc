import { Cpu, MemoryStick, Wrench, GitBranch } from 'lucide-react';
import { useAIStore, useSettingsStore, useProjectStore } from '@/stores';

export function StatusBar() {
  const { systemStats } = useAIStore();
  const { settings } = useSettingsStore();
  const { activeProject } = useProjectStore();

  return (
    <footer className="h-7 flex items-center justify-between px-4 bg-[var(--bg-secondary)] border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <Cpu size={12} />
          CPU {Math.round(systemStats.cpu)}%
        </span>
        <span className="flex items-center gap-1">
          <MemoryStick size={12} />
          RAM {Math.round(systemStats.ram)}%
        </span>
        <span className="flex items-center gap-1">
          AI: Ollama / {settings.ai.model}
        </span>
        <span className="flex items-center gap-1">
          <Wrench size={12} />
          Tools: Ready
        </span>
      </div>
      <div className="flex items-center gap-4">
        {activeProject && (
          <span className="flex items-center gap-1">
            <GitBranch size={12} />
            {activeProject.gitBranch || 'main'}
          </span>
        )}
        <span>My AI PC Agent v1.0</span>
      </div>
    </footer>
  );
}
