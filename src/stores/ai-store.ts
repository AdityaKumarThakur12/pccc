import { create } from 'zustand';

export type ConnectionStatus = 'connected' | 'disconnected' | 'checking' | 'error';

interface AIState {
  connectionStatus: ConnectionStatus;
  availableModels: string[];
  systemStats: { cpu: number; ram: number };
  setConnectionStatus: (status: ConnectionStatus) => void;
  setAvailableModels: (models: string[]) => void;
  setSystemStats: (stats: { cpu: number; ram: number }) => void;
}

export const useAIStore = create<AIState>((set) => ({
  connectionStatus: 'checking',
  availableModels: [],
  systemStats: { cpu: 0, ram: 0 },
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setAvailableModels: (models) => set({ availableModels: models }),
  setSystemStats: (stats) => set({ systemStats: stats }),
}));
