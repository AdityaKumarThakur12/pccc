import { useState } from 'react';
import {
  MessageSquarePlus,
  History,
  ListTodo,
  FolderGit2,
  Activity,
  Settings,
  Cpu,
} from 'lucide-react';
import { useChatStore, useAIStore, useSettingsStore, useProjectStore } from '@/stores';
import type { ConnectionStatus } from '@/stores';

export type SidebarView = 'chat' | 'history' | 'tasks' | 'projects' | 'activity' | 'settings';

interface SidebarProps {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { createConversation, conversations, activeConversationId, setActiveConversation } = useChatStore();
  const { connectionStatus } = useAIStore();
  const { settings } = useSettingsStore();
  const { activeProject } = useProjectStore();
  const [showHistory, setShowHistory] = useState(false);

  const handleNewChat = () => {
    createConversation();
    onViewChange('chat');
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    onViewChange('chat');
  };

  const statusColor: Record<ConnectionStatus, string> = {
    connected: 'connected',
    disconnected: 'disconnected',
    checking: 'checking',
    error: 'disconnected',
  };

  const statusText: Record<ConnectionStatus, string> = {
    connected: 'Connected',
    disconnected: 'Offline',
    checking: 'Checking...',
    error: 'Error',
  };

  const menuItems: { id: SidebarView; label: string; icon: typeof History }[] = [
    { id: 'chat', label: 'AI Agent', icon: MessageSquarePlus },
    { id: 'history', label: 'History', icon: History },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-60 flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border)] h-full">
      {/* New Chat button */}
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-all duration-150"
        >
          <MessageSquarePlus size={16} />
          New Chat
        </button>
      </div>

      {/* Menu items */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'history') {
                setShowHistory(!showHistory);
              }
              onViewChange(item.id);
            }}
            className={`sidebar-item w-full ${activeView === item.id ? 'active' : ''}`}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}

        {/* Chat history under History */}
        {activeView === 'history' && conversations.length > 0 && (
          <div className="mt-2 space-y-0.5 animate-fade-in">
            <div className="px-3 py-1 text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Recent Conversations
            </div>
            {conversations.slice(0, 20).map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`sidebar-item w-full text-xs truncate ${
                  activeConversationId === conv.id ? 'active' : ''
                }`}
              >
                <span className="truncate">{conv.title || 'Untitled'}</span>
              </button>
            ))}
          </div>
        )}

        {/* Active project display */}
        {activeProject && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] animate-fade-in">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Current Project
            </div>
            <div className="text-sm font-medium text-[var(--text-primary)] truncate">
              {activeProject.name}
            </div>
            <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
              {activeProject.type}
            </div>
          </div>
        )}
      </nav>

      {/* AI Engine status at bottom */}
      <div className="p-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-[var(--bg-tertiary)]">
          <Cpu size={16} className="text-[var(--text-secondary)]" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-[var(--text-primary)]">AI Engine</div>
            <div className="text-xs text-[var(--text-muted)] truncate">
              {settings.ai.provider === 'ollama' ? 'Ollama' : settings.ai.provider}
              {' / '}
              {settings.ai.model}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`status-dot ${statusColor[connectionStatus]}`} />
            <span className="text-xs text-[var(--text-secondary)]">
              {statusText[connectionStatus]}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
