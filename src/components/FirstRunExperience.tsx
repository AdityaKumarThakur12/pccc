import { useState, useEffect } from 'react';
import { Bot, Check, X, Loader2, ArrowRight, Cpu, FolderOpen, Sparkles } from 'lucide-react';
import { useSettingsStore, useAIStore } from '@/stores';
import { ipcBridge } from '@/services/ipc-bridge';
import { checkOllamaConnection } from '@/services/ollama-connection';

type Step = 0 | 1 | 2 | 3;

export function FirstRunExperience({ onComplete }: { onComplete: () => void }) {
  const { settings, updateAI, updateWorkspace } = useSettingsStore();
  const { connectionStatus, setConnectionStatus, setAvailableModels } = useAIStore();
  const [step, setStep] = useState<Step>(0);
  const [checking, setChecking] = useState(false);

  const handleCheckOllama = async () => {
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
    handleCheckOllama();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = [
    { num: 1, label: 'Install Ollama', desc: 'Download from ollama.com and install' },
    { num: 2, label: 'Choose an AI model', desc: 'Pull a model like llama3.1' },
    { num: 3, label: 'Choose your workspace', desc: 'Select allowed directories' },
    { num: 4, label: 'Start using your AI agent', desc: 'Begin chatting with your PC' },
  ];

  const handleBrowse = async () => {
    try {
      const result = await ipcBridge.selectFolder();
      if (result.success && result.data) {
        updateWorkspace({
          allowedDirectories: [...settings.workspace.allowedDirectories, result.data],
        });
      }
    } catch {
      // Browser mode
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)] animate-fade-in">
      <div className="w-full max-w-lg mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
            <Bot size={32} className="text-[var(--accent)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Welcome to My AI PC Agent
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Your private AI assistant running directly on your PC.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center flex-1 last:flex-none">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all ${
                    step >= i
                      ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                      : 'bg-transparent border-[var(--border-light)] text-[var(--text-muted)]'
                  }`}
                >
                  {step > i ? <Check size={14} /> : s.num}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-all ${
                    step > i ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                  Step 1: Install Ollama
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Ollama is a free local AI runtime. Download it from{' '}
                  <span className="text-[var(--accent)]">ollama.com</span> and install it on your PC.
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]">
                {connectionStatus === 'connected' ? (
                  <>
                    <Check size={16} className="text-[var(--success)]" />
                    <span className="text-sm text-[var(--success)]">Ollama is running!</span>
                  </>
                ) : connectionStatus === 'checking' ? (
                  <>
                    <Loader2 size={16} className="text-[var(--warning)] animate-spin-slow" />
                    <span className="text-sm text-[var(--warning)]">Checking Ollama...</span>
                  </>
                ) : (
                  <>
                    <X size={16} className="text-[var(--error)]" />
                    <span className="text-sm text-[var(--error)]">Ollama is not running.</span>
                  </>
                )}
                <button
                  onClick={handleCheckOllama}
                  disabled={checking}
                  className="ml-auto btn-ghost text-xs"
                >
                  Retry
                </button>
              </div>

              {connectionStatus === 'disconnected' && (
                <div className="p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30 space-y-2">
                  <p className="text-xs text-[var(--error)] font-medium">
                    Ollama found but browser cannot connect (CORS).
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Ollama blocks browser requests by default. Restart it with cross-origin access:
                  </p>
                  <div className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)] mb-1">In Windows Command Prompt (CMD):</p>
                    <code className="block text-xs font-mono text-[var(--accent)]">
                      set OLLAMA_ORIGINS=* && ollama serve
                    </code>
                  </div>
                  <div className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Or in PowerShell:</p>
                    <code className="block text-xs font-mono text-[var(--accent)]">
                      $env:OLLAMA_ORIGINS="*"; ollama serve
                    </code>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Then click Retry. (You only need to do this once per Ollama session.)
                  </p>
                </div>
              )}

              <button
                onClick={() => setStep(1)}
                disabled={connectionStatus !== 'connected'}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                  Step 2: Choose an AI Model
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Select which local model to use. llama3.1 is recommended for general tasks.
                </p>
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                  Model
                </label>
                <select
                  value={settings.ai.model}
                  onChange={(e) => updateAI({ model: e.target.value })}
                  className="input-field"
                >
                  <option value="llama3.1">llama3.1 (recommended)</option>
                  <option value="llama3.2">llama3.2</option>
                  <option value="mistral">mistral</option>
                  <option value="qwen2.5">qwen2.5</option>
                  <option value="phi3">phi3</option>
                  <option value="codellama">codellama</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)]">
                  To pull a model, open a terminal and run:
                </p>
                <code className="block mt-1 text-xs font-mono text-[var(--accent)]">
                  ollama pull {settings.ai.model}
                </code>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(0)} className="btn-ghost flex-1">
                  Back
                </button>
                <button onClick={() => setStep(2)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  Continue
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                  Step 3: Choose Your Workspace
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Select directories the AI is allowed to access. This keeps your system safe.
                </p>
              </div>

              <div className="space-y-2">
                {settings.workspace.allowedDirectories.map((dir) => (
                  <div key={dir} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]">
                    <FolderOpen size={14} className="text-[var(--accent)]" />
                    <span className="text-xs font-mono text-[var(--text-secondary)] truncate flex-1">{dir}</span>
                  </div>
                ))}
                <button onClick={handleBrowse} className="btn-ghost w-full flex items-center justify-center gap-2">
                  <FolderOpen size={14} />
                  Add Directory
                </button>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="btn-ghost flex-1">
                  Back
                </button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  Continue
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--success)]/15 flex items-center justify-center mx-auto">
                <Sparkles size={28} className="text-[var(--success)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                  You're All Set!
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Your AI PC Agent is ready. Start chatting to control your PC with natural language.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Cpu size={12} />
                  {settings.ai.model}
                </span>
                <span className="flex items-center gap-1">
                  <Check size={12} className="text-[var(--success)]" />
                  {settings.workspace.allowedDirectories.length} directories
                </span>
              </div>

              <button onClick={onComplete} className="btn-primary w-full flex items-center justify-center gap-2">
                Start Using AI Agent
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
