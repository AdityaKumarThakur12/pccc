import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Conversation, ChatMessageItem, ToolExecutionRecord } from '@/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isProcessing: boolean;
  pendingConfirmation: {
    toolName: string;
    toolArgs: unknown;
    description: string;
    resolve: (approved: boolean) => void;
  } | null;

  createConversation: () => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Omit<ChatMessageItem, 'id' | 'timestamp'>) => string;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessageItem>) => void;
  setProcessing: (processing: boolean) => void;
  setPendingConfirmation: (confirmation: ChatState['pendingConfirmation']) => void;
  resolveConfirmation: (approved: boolean) => void;
  clearHistory: () => void;
  getActiveConversation: () => Conversation | null;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isProcessing: false,
      pendingConfirmation: null,

      createConversation: () => {
        const id = generateId();
        const conversation: Conversation = {
          id,
          title: 'New Chat',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
        };
        set((s) => ({
          conversations: [conversation, ...s.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      deleteConversation: (id) =>
        set((s) => {
          const conversations = s.conversations.filter((c) => c.id !== id);
          const activeConversationId =
            s.activeConversationId === id
              ? conversations[0]?.id ?? null
              : s.activeConversationId;
          return { conversations, activeConversationId };
        }),

      setActiveConversation: (id) => set({ activeConversationId: id }),

      addMessage: (conversationId, message) => {
        const id = generateId();
        const fullMessage: ChatMessageItem = {
          ...message,
          id,
          timestamp: Date.now(),
        };
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, fullMessage],
                  updatedAt: Date.now(),
                  title:
                    c.messages.length === 0 && message.sender === 'user'
                      ? message.content.slice(0, 40)
                      : c.title,
                }
              : c
          ),
        }));
        return id;
      },

      updateMessage: (conversationId, messageId, updates) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                }
              : c
          ),
        })),

      setProcessing: (processing) => set({ isProcessing: processing }),

      setPendingConfirmation: (confirmation) =>
        set({ pendingConfirmation: confirmation }),

      resolveConfirmation: (approved) => {
        const { pendingConfirmation } = get();
        if (pendingConfirmation) {
          pendingConfirmation.resolve(approved);
          set({ pendingConfirmation: null });
        }
      },

      clearHistory: () => set({ conversations: [], activeConversationId: null }),

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId) ?? null;
      },
    }),
    { name: 'ai-pc-agent-chat' }
  )
);
