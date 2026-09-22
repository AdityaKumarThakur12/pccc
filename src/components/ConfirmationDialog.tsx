import { AlertTriangle, X, Check } from 'lucide-react';
import { useChatStore } from '@/stores';

export function ConfirmationDialog() {
  const { pendingConfirmation, resolveConfirmation } = useChatStore();

  if (!pendingConfirmation) return null;

  const { toolName, toolArgs, description } = pendingConfirmation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md mx-4 glass-panel rounded-2xl shadow-2xl">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
          <div className="w-10 h-10 rounded-full bg-[var(--warning)]/15 flex items-center justify-center">
            <AlertTriangle size={20} className="text-[var(--warning)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Confirmation Required
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              The AI wants to execute a potentially dangerous action.
            </p>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="mb-3">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Tool
            </span>
            <div className="text-sm font-medium text-[var(--text-primary)] mt-0.5">
              {toolName}
            </div>
          </div>
          <div className="mb-3">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Description
            </span>
            <div className="text-sm text-[var(--text-secondary)] mt-0.5">
              {description}
            </div>
          </div>
          <div>
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Arguments
            </span>
            <pre className="mt-1 p-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-xs font-mono text-[var(--text-secondary)] overflow-x-auto max-h-32">
              {JSON.stringify(toolArgs, null, 2)}
            </pre>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border)]">
          <button
            onClick={() => resolveConfirmation(false)}
            className="btn-ghost flex items-center gap-1.5"
          >
            <X size={16} />
            Cancel
          </button>
          <button
            onClick={() => resolveConfirmation(true)}
            className="btn-primary flex items-center gap-1.5"
          >
            <Check size={16} />
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
