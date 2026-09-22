import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import {
  Search,
  FolderPlus,
  Terminal,
  Camera,
  FileSearch,
  MessageSquarePlus,
  Settings,
  RefreshCw,
  Cpu,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  label: string;
  icon: typeof Search;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenProject: () => void;
  onTakeScreenshot: () => void;
  onRunCommand: () => void;
  onSearchFiles: () => void;
  onCheckOllama: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onNewChat,
  onOpenSettings,
  onOpenProject,
  onTakeScreenshot,
  onRunCommand,
  onSearchFiles,
  onCheckOllama,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    { id: 'new-chat', label: 'New Chat', icon: MessageSquarePlus, shortcut: 'Ctrl+N', action: () => { onNewChat(); onClose(); } },
    { id: 'open-project', label: 'Open Project', icon: FolderPlus, action: () => { onOpenProject(); onClose(); } },
    { id: 'take-screenshot', label: 'Take Screenshot', icon: Camera, action: () => { onTakeScreenshot(); onClose(); } },
    { id: 'run-command', label: 'Run Command', icon: Terminal, action: () => { onRunCommand(); onClose(); } },
    { id: 'search-files', label: 'Search Files', icon: FileSearch, action: () => { onSearchFiles(); onClose(); } },
    { id: 'check-ollama', label: 'Check Ollama Connection', icon: RefreshCw, action: () => { onCheckOllama(); onClose(); } },
    { id: 'change-model', label: 'Change AI Model', icon: Cpu, action: () => { onOpenSettings(); onClose(); } },
    { id: 'settings', label: 'Settings', icon: Settings, action: () => { onOpenSettings(); onClose(); } },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filtered[selectedIndex]?.action();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 glass-panel rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
          />
          <kbd className="text-xs text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border)]">Esc</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">No commands found</p>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  i === selectedIndex
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <cmd.icon size={16} />
                <span className="flex-1 text-left">{cmd.label}</span>
                {cmd.shortcut && (
                  <kbd className="text-xs text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border)]">
                    {cmd.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
