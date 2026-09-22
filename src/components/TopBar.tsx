import { useState } from 'react';
import { Cpu, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useAIStore, useSettingsStore } from '@/stores';
import type { ConnectionStatus } from '@/stores';

export function TopBar() {
  const { connectionStatus } = useAIStore();
  const { settings } = useSettingsStore();
  const [showTooltip, setShowTooltip] = useState(false);

  const statusConfig: Record<
    ConnectionStatus,
    { icon: typeof Wifi; text: string; color: string; dotClass: string }
  > = {
    connected: {
      icon: Wifi,
      text: 'Local AI Connected',
      color: 'text-[var(--success)]',
      dotClass: 'connected',
    },
    disconnected: {
      icon: WifiOff,
      text: 'Ollama Offline',
      color: 'text-[var(--error)]',
      dotClass: 'disconnected',
    },
    checking: {
      icon: Loader2,
      text: 'Checking Ollama...',
      color: 'text-[var(--warning)]',
      dotClass: 'checking',
    },
    error: {
      icon: WifiOff,
      text: 'Connection Error',
      color: 'text-[var(--error)]',
      dotClass: 'disconnected',
    },
  };

  const config = statusConfig[connectionStatus];
  const StatusIcon = config.icon;

  return (
    <header className="h-12 flex items-center justify-between px-4 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
      <div className="flex items-center gap-2">
        <Cpu size={18} className="text-[var(--accent)]" />
        <span className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">
          AI PC AGENT
        </span>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)]">
          <StatusIcon
            size={14}
            className={`${config.color} ${connectionStatus === 'checking' ? 'animate-spin-slow' : ''}`}
          />
          <span className={`text-xs font-medium ${config.color}`}>
            {config.text}
          </span>
          <span className={`status-dot ${config.dotClass}`} />
        </div>

        {showTooltip && (
          <div className="absolute right-0 top-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] whitespace-nowrap z-50 animate-fade-in">
            Ollama URL: {settings.ai.ollamaUrl}
            <br />
            Model: {settings.ai.model}
          </div>
        )}
      </div>
    </header>
  );
}
