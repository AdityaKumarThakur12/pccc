import { useRef, useEffect, useCallback } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { useChatStore, useSettingsStore, useActivityStore, useAIStore } from '@/stores';
import { AIProviderManager } from '@/services/ai';
import { initializeTools, toolRegistry } from '@/services/tools';
import { runAgentLoop } from '@/services/agent';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ConfirmationDialog } from './ConfirmationDialog';
import type { ChatMessageItem, ToolExecutionRecord } from '@/types';

export function ChatView() {
  const {
    conversations,
    activeConversationId,
    createConversation,
    addMessage,
    updateMessage,
    setProcessing,
    setPendingConfirmation,
    isProcessing,
  } = useChatStore();
  const { settings } = useSettingsStore();
  const { addActivity } = useActivityStore();
  const { connectionStatus } = useAIStore();
  const abortRef = useRef<AbortController | null>(null);

  const conversation = conversations.find((c) => c.id === activeConversationId);

  // Initialize tools once
  useEffect(() => {
    initializeTools();
  }, []);

  // Auto-scroll to bottom
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  const handleSend = useCallback(
    async (text: string) => {
      let convId = activeConversationId;
      if (!convId) {
        convId = createConversation();
      }

      const conv = useChatStore.getState().conversations.find((c) => c.id === convId);
      if (!conv) return;

      // Add user message
      addMessage(convId, {
        sender: 'user',
        content: text,
        status: 'complete',
      });

      // Add AI loading message
      const aiMsgId = addMessage(convId, {
        sender: 'assistant',
        content: '',
        status: 'loading',
      });

      setProcessing(true);

      // Build conversation history for AI
      const aiMessages = conv.messages
        .filter((m) => m.sender === 'user' || m.sender === 'assistant')
        .map((m) => ({
          role: m.sender as 'user' | 'assistant',
          content: m.content,
        }));
      aiMessages.push({ role: 'user' as const, content: text });

      // Create provider manager
      const provider = new AIProviderManager({
        provider: settings.ai.provider,
        ollamaUrl: settings.ai.ollamaUrl,
        model: settings.ai.model,
        temperature: settings.ai.temperature,
      });

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const result = await runAgentLoop({
          provider,
          messages: aiMessages,
          systemPrompt: settings.ai.systemPrompt,
          maxIterations: 10,
          signal: abortController.signal,
          onStep: (step) => {
            if (step.type === 'tool_call' && step.toolName) {
              addMessage(convId!, {
                sender: 'tool',
                content: `Running ${step.toolName}...`,
                status: 'loading',
                metadata: {
                  toolName: step.toolName,
                },
              });
            } else if (step.type === 'tool_result' && step.toolName) {
              addMessage(convId!, {
                sender: 'tool',
                content: step.toolResult || '',
                status: step.toolSuccess ? 'complete' : 'error',
                metadata: {
                  toolName: step.toolName,
                  toolResult: step.toolResult,
                  toolSuccess: step.toolSuccess,
                },
              });
            } else if (step.type === 'confirmation') {
              // Handled by onConfirmationRequest
            }
          },
          onToolCall: (record: ToolExecutionRecord) => {
            addActivity({
              toolName: record.toolName,
              category: record.category,
              description: `${record.toolName} ${record.success ? 'completed' : 'failed'}`,
              args: record.args,
              result: record.result,
              success: record.success ?? false,
            });
          },
          onConfirmationRequest: async (toolName, toolArgs, description) => {
            return new Promise<boolean>((resolve) => {
              setPendingConfirmation({
                toolName,
                toolArgs,
                description,
                resolve,
              });
            });
          },
        });

        // Update AI message with final response
        updateMessage(convId, aiMsgId, {
          content: result.finalResponse,
          status: 'complete',
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        updateMessage(convId, aiMsgId, {
          content: '',
          status: 'error',
          error: errorMsg,
        });
      } finally {
        setProcessing(false);
        abortRef.current = null;
      }
    },
    [activeConversationId, settings, createConversation, addMessage, updateMessage, setProcessing, setPendingConfirmation, addActivity]
  );

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setProcessing(false);
  }, [setProcessing]);

  const handleRetry = useCallback(() => {
    if (!conversation || conversation.messages.length === 0) return;
    const lastUserMsg = [...conversation.messages].reverse().find((m) => m.sender === 'user');
    if (lastUserMsg) {
      handleSend(lastUserMsg.content);
    }
  }, [conversation, handleSend]);

  // Empty state
  if (!conversation || conversation.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
              <Bot size={32} className="text-[var(--accent)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Your AI PC Agent is Ready
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Ask me to open apps, run commands, search files, check git status, or help debug your projects.
            </p>
            <div className="grid grid-cols-2 gap-2 text-left">
              {[
                'Open VS Code',
                'Run npm install',
                'Check git status',
                'Find TypeScript errors',
                'Show files in this folder',
                'Create a new React component',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  disabled={connectionStatus === 'disconnected'}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50"
                >
                  <Sparkles size={12} className="text-[var(--accent)]" />
                  {suggestion}
                </button>
              ))}
            </div>
            {connectionStatus === 'disconnected' && (
              <p className="mt-4 text-xs text-[var(--error)]">
                Ollama is offline. Start Ollama and check connection in Settings.
              </p>
            )}
          </div>
        </div>
        <ChatInput onSend={handleSend} onCancel={handleCancel} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {conversation.messages.map((msg: ChatMessageItem) => (
          <ChatMessage key={msg.id} message={msg} onRetry={handleRetry} />
        ))}
      </div>
      <ChatInput onSend={handleSend} onCancel={handleCancel} />
      <ConfirmationDialog />
    </div>
  );
}
