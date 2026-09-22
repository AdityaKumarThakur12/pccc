import { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar, type SidebarView } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { StatusBar } from '@/components/StatusBar';
import { ChatView } from '@/components/ChatView';
import { SettingsView } from '@/components/SettingsView';
import { TasksView } from '@/components/TasksView';
import { ProjectsView } from '@/components/ProjectsView';
import { ActivityView } from '@/components/ActivityView';
import { CommandPalette } from '@/components/CommandPalette';
import { FirstRunExperience } from '@/components/FirstRunExperience';
import { useChatStore, useAIStore, useSettingsStore, useProjectStore } from '@/stores';
import { ipcBridge } from '@/services/ipc-bridge';
import { initializeTools } from '@/services/tools';
import { checkOllamaConnection } from '@/services/ollama-connection';

const FIRST_RUN_KEY = 'ai-pc-agent-first-run-complete';

function App() {
  const [activeView, setActiveView] = useState<SidebarView>('chat');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showFirstRun, setShowFirstRun] = useState(false);
  const chatInputFocusRef = useRef<(() => void) | null>(null);

  const { createConversation, conversations, activeConversationId, setProcessing } = useChatStore();
  const { setConnectionStatus, setAvailableModels, setSystemStats } = useAIStore();
  const { settings } = useSettingsStore();
  const { addProject, setActiveProject } = useProjectStore();

  // Initialize tools
  useEffect(() => {
    initializeTools();
  }, []);

  // Check first run
  useEffect(() => {
    const completed = localStorage.getItem(FIRST_RUN_KEY);
    if (!completed) {
      setShowFirstRun(true);
    }
  }, []);

  // Check Ollama connection on startup
  const checkOllama = useCallback(async () => {
    setConnectionStatus('checking');
    const result = await checkOllamaConnection(settings.ai.ollamaUrl);
    if (result.connected) {
      setConnectionStatus('connected');
      setAvailableModels(result.models);
    } else {
      setConnectionStatus('disconnected');
    }
  }, [settings.ai.ollamaUrl, setConnectionStatus, setAvailableModels]);

  useEffect(() => {
    checkOllama();
    // Re-check every 30 seconds
    const interval = setInterval(checkOllama, 30000);
    return () => clearInterval(interval);
  }, [checkOllama]);

  // Listen for system stats from Electron
  useEffect(() => {
    ipcBridge.onSystemStats((stats) => {
      setSystemStats(stats);
    });
  }, [setSystemStats]);

  // Ensure there's always an active conversation
  useEffect(() => {
    if (conversations.length === 0 && !activeConversationId) {
      createConversation();
    }
  }, [conversations.length, activeConversationId, createConversation]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K - Focus chat
      if (e.ctrlKey && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        setActiveView('chat');
        const textarea = document.querySelector('textarea');
        textarea?.focus();
      }
      // Ctrl+Shift+P - Command palette
      if (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Ctrl+N - New conversation
      if (e.ctrlKey && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        createConversation();
        setActiveView('chat');
      }
      // Esc - Cancel current task
      if (e.key === 'Escape') {
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
        } else if (useChatStore.getState().isProcessing) {
          setProcessing(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, createConversation, setProcessing]);

  const handleFirstRunComplete = () => {
    localStorage.setItem(FIRST_RUN_KEY, 'true');
    setShowFirstRun(false);
    checkOllama();
  };

  const handleOpenProject = async () => {
    try {
      const result = await ipcBridge.selectFolder();
      if (!result.success || !result.data) return;
      const path = result.data;
      const name = path.split(/[\\/]/).pop() || path;

      let type = 'Unknown';
      let packageManager: string | undefined;
      let backend: string | undefined;
      let gitRepository = false;
      let gitBranch: string | undefined;

      try {
        const detectResult = await ipcBridge.detectProject(path);
        if (detectResult.success && detectResult.data) {
          const data = detectResult.data as typeof addProject extends never ? never : { type: string; packageManager?: string; backend?: string; gitRepository?: boolean; gitBranch?: string };
          type = data.type;
          packageManager = data.packageManager;
          backend = data.backend;
          gitRepository = data.gitRepository ?? false;
          gitBranch = data.gitBranch;
        }
      } catch {
        // Detection failed
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
      setActiveView('projects');
    } catch {
      // Browser mode
    }
  };

  const handleTakeScreenshot = async () => {
    // Send as a chat command
    if (activeConversationId) {
      // The agent loop will handle this via the tool
      const { addMessage } = useChatStore.getState();
      addMessage(activeConversationId, {
        sender: 'user',
        content: 'Take a screenshot',
        status: 'complete',
      });
    }
  };

  const handleRunCommand = () => {
    setActiveView('chat');
    const textarea = document.querySelector('textarea');
    textarea?.focus();
  };

  const handleSearchFiles = () => {
    setActiveView('chat');
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.value = 'Search this project for ';
      textarea.focus();
    }
  };

  if (showFirstRun) {
    return <FirstRunExperience onComplete={handleFirstRunComplete} />;
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)]">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-primary)]">
          {activeView === 'chat' && <ChatView />}
          {activeView === 'history' && <ChatView />}
          {activeView === 'tasks' && <TasksView />}
          {activeView === 'projects' && <ProjectsView />}
          {activeView === 'activity' && <ActivityView />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>
      <StatusBar />
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNewChat={() => { createConversation(); setActiveView('chat'); }}
        onOpenSettings={() => setActiveView('settings')}
        onOpenProject={handleOpenProject}
        onTakeScreenshot={handleTakeScreenshot}
        onRunCommand={handleRunCommand}
        onSearchFiles={handleSearchFiles}
        onCheckOllama={checkOllama}
      />
    </div>
  );
}

export default App;
