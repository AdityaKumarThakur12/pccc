import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Cpu, Shield, FolderOpen, RefreshCw, Check, X, Plus, Trash2 } from 'lucide-react';
import { useSettingsStore, useAIStore } from '@/stores';
import { ipcBridge } from '@/services/ipc-bridge';
import { checkOllamaConnection } from '@/services/ollama-connection';

type SettingsTab = 'ai' | 'security' | 'workspace';

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-10 h-5 rounded-full transition-colors ${on ? 'bg-[var(--accent)]' : 'bg-[var(--border-light)]'}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

function AISettings() {
  const { settings, updateAI } = useSettingsStore();
  const { availableModels, setAvailableModels, connectionStatus, setConnectionStatus } = useAIStore();
  const [checking, setChecking] = useState(false);

  const handleCheckConnection = async () => {
    setChecking(true);
    setConnectionStatus('checking');
    const result = await checkOllamaConnection(settings.ai.ollamaUrl);
    if (result.connected) {
      setConnectionStatus('connected');
      setAvailableModels(result.models);
    } else {
      setConnectionStatus('disconnected');
    }
    setChecking(false);
  };

  useEffect(() => {
    handleCheckConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
          Provider
        </label>
        <select
          value={settings.ai.provider}
          onChange={(e) => updateAI({ provider: e.target.value })}
          className="input-field"
        >
          <option value="ollama">Ollama (Local)</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
          Ollama URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={settings.ai.ollamaUrl}
            onChange={(e) => updateAI({ ollamaUrl: e.target.value })}
            className="input-field flex-1"
            placeholder="http://localhost:11434"
          />
          <button
            onClick={handleCheckConnection}
            disabled={checking}
            className="btn-ghost flex items-center gap-1.5 whitespace-nowrap"
          >
            <RefreshCw size={14} className={checking ? 'animate-spin-slow' : ''} />
            {checking ? 'Checking...' : 'Check'}
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
          Model
        </label>
        <select
          value={settings.ai.model}
          onChange={(e) => updateAI({ model: e.target.value })}
          className="input-field"
          disabled={availableModels.length === 0}
        >
          {availableModels.length === 0 ? (
            <option value={settings.ai.model}>{settings.ai.model} (not found)</option>
          ) : (
            availableModels.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))
          )}
        </select>
        {availableModels.length === 0 && (
          <p className="text-xs text-[var(--text-muted)] mt-1">
            No models found. Make sure Ollama is running and you have pulled a model.
          </p>
        )}
      </div>

      <div>
        <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
          Temperature: {settings.ai.temperature}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.ai.temperature}
          onChange={(e) => updateAI({ temperature: parseFloat(e.target.value) })}
          className="w-full accent-[var(--accent)]"
        />
        <div className="flex justify-between text-xs text-[var(--text-muted)] mt-0.5">
          <span>Precise (0)</span>
          <span>Creative (1)</span>
        </div>
      </div>

      <div>
        <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
          System Prompt
        </label>
        <textarea
          value={settings.ai.systemPrompt}
          onChange={(e) => updateAI({ systemPrompt: e.target.value })}
          rows={6}
          className="input-field font-mono text-xs resize-y"
        />
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]">
        {connectionStatus === 'connected' ? (
          <>
            <Check size={16} className="text-[var(--success)]" />
            <span className="text-sm text-[var(--success)]">Ollama Connected</span>
          </>
        ) : connectionStatus === 'checking' ? (
          <>
            <RefreshCw size={16} className="text-[var(--warning)] animate-spin-slow" />
            <span className="text-sm text-[var(--warning)]">Checking connection...</span>
          </>
        ) : (
          <>
            <X size={16} className="text-[var(--error)]" />
            <span className="text-sm text-[var(--error)]">Ollama Offline</span>
          </>
        )}
      </div>

      {connectionStatus === 'disconnected' && (
        <div className="p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30 space-y-2">
          <p className="text-xs text-[var(--error)] font-medium">
            Cannot connect to Ollama from the browser.
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Ollama blocks cross-origin browser requests by default. Restart it with:
          </p>
          <div className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Windows CMD:</p>
            <code className="block text-xs font-mono text-[var(--accent)]">
              set OLLAMA_ORIGINS=* && ollama serve
            </code>
          </div>
          <div className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">PowerShell:</p>
            <code className="block text-xs font-mono text-[var(--accent)]">
              $env:OLLAMA_ORIGINS="*"; ollama serve
            </code>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Then click Check again. (Only needed for browser mode — the Electron desktop app connects automatically.)
          </p>
        </div>
      )}
    </div>
  );
}

function SecuritySettings() {
  const { settings, updateSecurity } = useSettingsStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]">
        <div>
          <div className="text-sm text-[var(--text-primary)]">Require confirmation for dangerous commands</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">rm, format, shutdown, git push, etc.</div>
        </div>
        <Toggle
          on={settings.security.requireConfirmationDangerousCommands}
          onChange={(v) => updateSecurity({ requireConfirmationDangerousCommands: v })}
        />
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]">
        <div>
          <div className="text-sm text-[var(--text-primary)]">Require confirmation before deleting files</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">Ask before any file deletion</div>
        </div>
        <Toggle
          on={settings.security.requireConfirmationDeleteFiles}
          onChange={(v) => updateSecurity({ requireConfirmationDeleteFiles: v })}
        />
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]">
        <div>
          <div className="text-sm text-[var(--text-primary)]">Require confirmation before modifying files</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">Ask before any file write</div>
        </div>
        <Toggle
          on={settings.security.requireConfirmationModifyFiles}
          onChange={(v) => updateSecurity({ requireConfirmationModifyFiles: v })}
        />
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]">
        <div>
          <div className="text-sm text-[var(--text-primary)]">Require confirmation before git push</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">Ask before pushing to remote</div>
        </div>
        <Toggle
          on={settings.security.requireConfirmationGitPush}
          onChange={(v) => updateSecurity({ requireConfirmationGitPush: v })}
        />
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]">
        <div>
          <div className="text-sm text-[var(--text-primary)]">Advanced access</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">Allow access to system directories (C:\Windows, Program Files)</div>
        </div>
        <Toggle
          on={settings.security.advancedAccess}
          onChange={(v) => updateSecurity({ advancedAccess: v })}
        />
      </div>

      <div className="p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30">
        <div className="text-xs text-[var(--error)] font-medium mb-1">Blocked Directories</div>
        <div className="space-y-1">
          {settings.workspace.blockedDirectories.map((dir) => (
            <div key={dir} className="text-xs font-mono text-[var(--text-secondary)]">{dir}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkspaceSettings() {
  const { settings, updateWorkspace } = useSettingsStore();
  const [newDir, setNewDir] = useState('');

  const handleAdd = () => {
    if (!newDir.trim()) return;
    updateWorkspace({
      allowedDirectories: [...settings.workspace.allowedDirectories, newDir.trim()],
    });
    setNewDir('');
  };

  const handleRemove = (dir: string) => {
    updateWorkspace({
      allowedDirectories: settings.workspace.allowedDirectories.filter((d) => d !== dir),
    });
  };

  const handleBrowse = async () => {
    try {
      const result = await ipcBridge.selectFolder();
      if (result.success && result.data) {
        updateWorkspace({
          allowedDirectories: [...settings.workspace.allowedDirectories, result.data],
        });
      }
    } catch {
      // Browser mode - manual entry only
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
          Allowed Directories
        </label>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          The AI can only access files within these directories. Add your project folders here.
        </p>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newDir}
            onChange={(e) => setNewDir(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="input-field flex-1"
            placeholder="C:\Users\...\Projects"
          />
          <button onClick={handleAdd} className="btn-ghost flex items-center gap-1">
            <Plus size={14} />
            Add
          </button>
          <button onClick={handleBrowse} className="btn-ghost flex items-center gap-1">
            <FolderOpen size={14} />
            Browse
          </button>
        </div>
        <div className="space-y-2">
          {settings.workspace.allowedDirectories.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic">No directories added yet.</p>
          ) : (
            settings.workspace.allowedDirectories.map((dir) => (
              <div key={dir} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]">
                <span className="text-xs font-mono text-[var(--text-secondary)] truncate">{dir}</span>
                <button
                  onClick={() => handleRemove(dir)}
                  className="text-[var(--text-muted)] hover:text-[var(--error)]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function SettingsView() {
  const [tab, setTab] = useState<SettingsTab>('ai');

  const tabs: { id: SettingsTab; label: string; icon: typeof Cpu }[] = [
    { id: 'ai', label: 'AI', icon: Cpu },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'workspace', label: 'Workspace', icon: FolderOpen },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center gap-2 mb-4">
        <SettingsIcon size={20} className="text-[var(--accent)]" />
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Settings</h2>
      </div>

      <div className="flex gap-1 mb-4 p-1 bg-[var(--bg-tertiary)] rounded-lg w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
              tab === t.id
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl">
        {tab === 'ai' && <AISettings />}
        {tab === 'security' && <SecuritySettings />}
        {tab === 'workspace' && <WorkspaceSettings />}
      </div>
    </div>
  );
}
